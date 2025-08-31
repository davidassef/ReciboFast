// MIT License
// Autor atual: David Assef
// Descrição: Ponto de entrada do servidor HTTP do backend ReciboFast
// Data: 29-12-2024

package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/joho/godotenv"

	"recibofast/internal/config"
	"recibofast/internal/httpserver"
	"recibofast/internal/logging"
)

func main() {
	// Carrega variáveis de ambiente do arquivo .env (se existir)
	if err := godotenv.Load(); err != nil {
		log.Printf("Aviso: arquivo .env não encontrado ou erro ao carregar: %v", err)
	}

	// Configuração
	cfg := config.FromEnv()

	// Logger
	logger := logging.NewLogger(cfg.Env)
	defer logger.Sync()

	// Banco de dados (opcional no boot: inicia se DB_URL estiver setado)
	var pool *pgxpool.Pool
	if cfg.DBURL != "" {
		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()
		p, err := pgxpool.New(ctx, cfg.DBURL)
		if err != nil {
			logger.Fatal("erro ao conectar no banco", logging.Field{Key: "error", Val: err.Error()})
		}
		pool = p
	}

	// Router HTTP
	r := httpserver.NewRouter(httpserver.AppDeps{
		Logger: logger,
		DB:     pool,
		Cfg:    cfg,
	})

	srv := &http.Server{
		Addr:              ":" + cfg.APIPort,
		Handler:           r,
		ReadTimeout:       10 * time.Second,
		ReadHeaderTimeout: 10 * time.Second,
		WriteTimeout:      15 * time.Second,
		IdleTimeout:       60 * time.Second,
	}

	logger.Info("iniciando servidor", logging.Field{Key: "addr", Val: srv.Addr})
	if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		log.Printf("erro no servidor: %v", err)
		os.Exit(1)
	}
}

// Campos auxiliares podem ser criados diretamente com logging.Field
