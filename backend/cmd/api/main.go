// MIT License
// Autor atual: David Assef
// Descrição: Ponto de entrada do servidor HTTP do backend ReciboFast
// Data: 07-09-2025

package main

import (
    "bytes"
    "encoding/json"
    "io"
    "log"
    "net/http"
    "net/url"
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

    // Retorna a sitekey pública do hCaptcha para uso no frontend (não sensível)
    mux.HandleFunc("/api/v1/captcha/sitekey", func(w http.ResponseWriter, r *http.Request) {
        w.Header().Set("Content-Type", "application/json")
        if r.Method != http.MethodGet {
            w.WriteHeader(http.StatusMethodNotAllowed)
            _ = json.NewEncoder(w).Encode(map[string]any{"message": "Método não permitido"})
            return
        }
        sitekey := strings.TrimSpace(os.Getenv("HCAPTCHA_SITE_KEY"))
        if sitekey == "" {
            // Não é erro fatal; apenas informa vazio para o cliente decidir fallback
            _ = json.NewEncoder(w).Encode(map[string]any{"sitekey": ""})
            return
        }
        _ = json.NewEncoder(w).Encode(map[string]any{"sitekey": sitekey})
    })

    // Verificação server-side do hCaptcha
    mux.HandleFunc("/api/v1/captcha/verify", func(w http.ResponseWriter, r *http.Request) {
        w.Header().Set("Content-Type", "application/json")
        if r.Method != http.MethodPost {
            w.WriteHeader(http.StatusMethodNotAllowed)
            _ = json.NewEncoder(w).Encode(map[string]any{"message": "Método não permitido"})
            return
        }

        secret := os.Getenv("HCAPTCHA_SECRET")
        if strings.TrimSpace(secret) == "" {
            // Segurança: sem secret configurado, não valida (retorna erro explícito)
            w.WriteHeader(http.StatusInternalServerError)
            _ = json.NewEncoder(w).Encode(map[string]any{"message": "HCAPTCHA_SECRET não configurado no servidor"})
            return
        }

        var payload struct {
            Token   string `json:"token"`
            SiteKey string `json:"sitekey,omitempty"`
        }
        if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
            w.WriteHeader(http.StatusBadRequest)
            _ = json.NewEncoder(w).Encode(map[string]any{"message": "JSON inválido"})
            return
        }
        if strings.TrimSpace(payload.Token) == "" {
            w.WriteHeader(http.StatusBadRequest)
            _ = json.NewEncoder(w).Encode(map[string]any{"message": "token é obrigatório"})
            return
        }

        form := url.Values{}
        form.Set("secret", secret)
        form.Set("response", payload.Token)
        if payload.SiteKey != "" {
            form.Set("sitekey", payload.SiteKey)
        }
        if ip := r.Header.Get("X-Forwarded-For"); ip != "" {
            form.Set("remoteip", strings.Split(ip, ",")[0])
        }

        resp, err := http.Post(
            "https://hcaptcha.com/siteverify",
            "application/x-www-form-urlencoded",
            bytes.NewBufferString(form.Encode()),
        )
        if err != nil {
            log.Printf("erro ao verificar hcaptcha: %v", err)
            w.WriteHeader(http.StatusBadGateway)
            _ = json.NewEncoder(w).Encode(map[string]any{"message": "Falha ao contatar serviço hCaptcha"})
            return
        }
        defer resp.Body.Close()

        body, _ := io.ReadAll(resp.Body)
        // Resposta esperada do hCaptcha
        // { "success": true|false, "challenge_ts": "...", "hostname": "...", "error-codes": [ ... ] }
        var verify map[string]any
        if err := json.Unmarshal(body, &verify); err != nil {
            w.WriteHeader(http.StatusBadGateway)
            _ = json.NewEncoder(w).Encode(map[string]any{"message": "Resposta inválida do hCaptcha"})
            return
        }

        // Repassa a resposta ao cliente
        w.WriteHeader(http.StatusOK)
        _ = json.NewEncoder(w).Encode(verify)
    })

    // Healthcheck do captcha: informa se o servidor possui HCAPTCHA_SECRET configurado
    mux.HandleFunc("/api/v1/captcha/health", func(w http.ResponseWriter, r *http.Request) {
        w.Header().Set("Content-Type", "application/json")
        if r.Method != http.MethodGet {
            w.WriteHeader(http.StatusMethodNotAllowed)
            _ = json.NewEncoder(w).Encode(map[string]any{"message": "Método não permitido"})
            return
        }
        has := strings.TrimSpace(os.Getenv("HCAPTCHA_SECRET")) != ""
        _ = json.NewEncoder(w).Encode(map[string]any{"has_secret": has})
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
