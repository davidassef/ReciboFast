// MIT License
// Autor atual: David Assef
// Descrição: Ponto de entrada do servidor HTTP do backend ReciboFast
// Data: 05-09-2025

package main

import (
    "log"
    "net/http"
    "os"
    "encoding/json"
    
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

    log.Printf("Servidor backend rodando em %s", addr)
    if err := http.ListenAndServe(addr, mux); err != nil {
        log.Fatal(err)
    }
}
