// MIT License
// Autor atual: David Assef
// Descrição: Leitura de variáveis de ambiente do backend ReciboFast
// Data: 29-08-2025

package config

import "os"

// Config define as configurações do servidor.
// Docstring: Estrutura que armazena as configurações lidas de variáveis de ambiente.
// - APIPort: porta do servidor HTTP
// - Env: ambiente (dev, prod)
// - DBURL: string de conexão com Postgres (Supabase)
// - CORSOrigins: origens permitidas para CORS (se aplicável)
// - JWKSURL: URL do JWKS do Supabase para validar JWT
// - SupabaseURL: URL base do projeto Supabase
// - Storage buckets: nomes dos buckets de Storage
// - MasterKey: chave mestra (opcional) para envelope encryption
// Erros são tratados no nível de inicialização do app.
type Config struct {
	APIPort      string
	Env          string
	DBURL        string
	CORSOrigins  string
	JWKSURL      string
	SupabaseURL  string
	BucketSigns  string
	BucketReceipts string
	MasterKey    string
}

// FromEnv carrega configurações das variáveis de ambiente.
func FromEnv() *Config {
	cfg := &Config{
		APIPort:       getEnv("API_PORT", "8080"),
		Env:           getEnv("APP_ENV", "dev"),
		DBURL:         os.Getenv("DB_URL"),
		CORSOrigins:   os.Getenv("CORS_ORIGINS"),
		JWKSURL:       os.Getenv("JWKS_URL"),
		SupabaseURL:   os.Getenv("SUPABASE_URL"),
		BucketSigns:   getEnv("STORAGE_BUCKET_SIGNATURES", "signatures"),
		BucketReceipts:getEnv("STORAGE_BUCKET_RECEIPTS", "receipts"),
		MasterKey:     os.Getenv("MASTER_KEY"),
	}
	return cfg
}

func getEnv(key, def string) string {
	if v := os.Getenv(key); v != "" { return v }
	return def
}
