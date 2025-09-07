// MIT License
// Autor atual: David Assef
// Descrição: Ponto de entrada do servidor HTTP do backend ReciboFast
// Data: 07-09-2025

package main

import (
    "encoding/json"
    "log"
    "net/http"
    "os"
    "strings"

    "github.com/joho/godotenv"
)

func main() {
    // Carrega variáveis do arquivo .env (ignora erro se não existir)
    _ = godotenv.Load()

    mux := http.NewServeMux()

    // Endpoint de saúde para verificações simples
    mux.HandleFunc("/healthz", func(w http.ResponseWriter, r *http.Request) {
        w.WriteHeader(http.StatusOK)
        _, _ = w.Write([]byte("ok"))
    })

    // Stubs mínimos da API v1 para ambiente de desenvolvimento
    // Lista de receitas vazia (paginada)
    mux.HandleFunc("/api/v1/incomes", func(w http.ResponseWriter, r *http.Request) {
        w.Header().Set("Content-Type", "application/json")
        resp := map[string]any{
            "items":       []any{},
            "total":       0,
            "page":        1,
            "limit":       10,
            "total_pages": 0,
        }
        _ = json.NewEncoder(w).Encode(resp)
    })

    // Estatísticas de receitas zeradas
    mux.HandleFunc("/api/v1/incomes/stats", func(w http.ResponseWriter, r *http.Request) {
        w.Header().Set("Content-Type", "application/json")
        stats := map[string]any{
            "total_receitas":    0,
            "total_valor":       0,
            "receitas_pendentes": 0,
            "receitas_pagas":     0,
            "receitas_vencidas":  0,
            "valor_pendente":     0,
            "valor_pago":         0,
            "valor_vencido":      0,
        }
        _ = json.NewEncoder(w).Encode(stats)
    })

    // Endpoint raiz informativo (fallback)
    mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
        _, _ = w.Write([]byte("Servidor backend rodando"))
    })

    port := os.Getenv("PORT")
    if port == "" {
        port = "8080"
    }
    addr := ":" + port

    // Configura CORS a partir da variável de ambiente ALLOWED_ORIGINS (separado por vírgula)
    allowed := parseAllowedOrigins(os.Getenv("ALLOWED_ORIGINS"))

    log.Printf("Servidor backend rodando em %s", addr)
    if err := http.ListenAndServe(addr, corsMiddleware(allowed)(mux)); err != nil {
        log.Fatal(err)
    }
}

// parseAllowedOrigins converte a string de origens permitidas em slice.
// Ex.: "https://app.vercel.app,https://dominio.com" -> [ ... ]
func parseAllowedOrigins(v string) []string {
    if strings.TrimSpace(v) == "" {
        return nil
    }
    parts := strings.Split(v, ",")
    var out []string
    for _, p := range parts {
        t := strings.TrimSpace(p)
        if t != "" {
            out = append(out, t)
        }
    }
    return out
}

// corsMiddleware aplica cabeçalhos CORS básicos e trata OPTIONS.
func corsMiddleware(allowed []string) func(http.Handler) http.Handler {
    return func(next http.Handler) http.Handler {
        return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
            origin := r.Header.Get("Origin")
            allowOrigin := "*"
            if len(allowed) > 0 {
                // Com whitelist: bloqueia por padrão e permite apenas se bater na regra
                allowOrigin = ""
                if origin != "" && matchOrigin(allowed, origin) {
                    allowOrigin = origin
                }
            }

            if allowOrigin != "" {
                w.Header().Set("Access-Control-Allow-Origin", allowOrigin)
                w.Header().Set("Vary", "Origin")
            }
            w.Header().Set("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS")
            w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With")

            if r.Method == http.MethodOptions {
                w.WriteHeader(http.StatusNoContent)
                return
            }
            next.ServeHTTP(w, r)
        })
    }
}

// matchOrigin verifica se a origem bate em alguma regra permitida.
// Regras suportadas:
//  - "*" : permite qualquer origem
//  - "https://dominio.com" : match exato
//  - "*.vercel.app" : match por sufixo
func matchOrigin(allowed []string, origin string) bool {
    for _, a := range allowed {
        a = strings.TrimSpace(a)
        if a == "" {
            continue
        }
        if a == "*" {
            return true
        }
        if strings.HasPrefix(a, "*.") {
            // Sufixo: remove o '*'
            suffix := strings.TrimPrefix(a, "*") // mantém o ponto
            if strings.HasSuffix(origin, suffix) {
                return true
            }
            continue
        }
        if origin == a {
            return true
        }
    }
    return false
}
