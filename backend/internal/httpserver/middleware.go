// MIT License
// Autor atual: David Assef
// Descrição: Middlewares auxiliares (Auth JWT Supabase, contexto de usuário)
// Data: 29-12-2024

package httpserver

import (
	"context"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/lestrrat-go/jwx/v2/jwk"
	"github.com/lestrrat-go/jwx/v2/jwt"

	"recibofast/internal/config"
	ctxhelper "recibofast/internal/context"
	"recibofast/internal/logging"
)



// SupabaseAuth valida JWT tokens do Supabase usando JWKS.
// Docstring: Middleware que valida tokens JWT do Supabase, extrai o user_id do subject
// e adiciona ao contexto da requisição. Em ambiente dev, aceita header X-Debug-User como fallback.
func SupabaseAuth(deps AppDeps) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			deps.Logger.Debug("SupabaseAuth middleware executado", logging.Field{Key: "env", Val: deps.Cfg.Env}, logging.Field{Key: "path", Val: r.URL.Path})
			
			// Em ambiente dev, permite usar header X-Debug-User para facilitar testes
			if deps.Cfg.Env == "dev" {
				if debugUser := r.Header.Get("X-Debug-User"); debugUser != "" {
					deps.Logger.Debug("Usando X-Debug-User", logging.Field{Key: "user", Val: debugUser})
					ctx := ctxhelper.SetUserID(r.Context(), debugUser)
					next.ServeHTTP(w, r.WithContext(ctx))
					return
				}
				deps.Logger.Debug("X-Debug-User não encontrado no header")
			}

			// Extrai o token JWT do header Authorization
			authHeader := r.Header.Get("Authorization")
			if authHeader == "" {
				http.Error(w, "Token de autorização requerido", http.StatusUnauthorized)
				return
			}

			// Verifica se o header tem o formato "Bearer <token>"
			parts := strings.SplitN(authHeader, " ", 2)
			if len(parts) != 2 || parts[0] != "Bearer" {
				http.Error(w, "Formato de token inválido", http.StatusUnauthorized)
				return
			}

			tokenString := parts[1]

			// Valida o token JWT usando JWKS do Supabase
			userID, err := validateSupabaseJWT(tokenString, deps.Cfg.JWKSURL, deps.Logger)
			if err != nil {
				deps.Logger.Error("Falha na validação do JWT", logging.Field{Key: "error", Val: err.Error()})
				http.Error(w, "Token inválido", http.StatusUnauthorized)
				return
			}

			// Adiciona o user_id ao contexto
			ctx := ctxhelper.SetUserID(r.Context(), userID)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

// validateSupabaseJWT valida um token JWT usando JWKS do Supabase.
// Docstring: Função que baixa as chaves públicas do Supabase via JWKS,
// valida a assinatura do token e extrai o subject (user_id).
func validateSupabaseJWT(tokenString, jwksURL string, logger logging.Logger) (string, error) {
	// Cria um cache de chaves JWKS com TTL de 1 hora
	set, err := jwk.Fetch(context.Background(), jwksURL, jwk.WithHTTPClient(http.DefaultClient))
	if err != nil {
		return "", fmt.Errorf("falha ao buscar JWKS: %w", err)
	}

	// Parseia e valida o token
	token, err := jwt.Parse([]byte(tokenString), jwt.WithKeySet(set), jwt.WithValidate(true))
	if err != nil {
		return "", fmt.Errorf("falha ao validar token: %w", err)
	}

	// Verifica se o token não expirou
	if time.Now().After(token.Expiration()) {
		return "", fmt.Errorf("token expirado")
	}

	// Extrai o subject (user_id) do token
	userID := token.Subject()
	if userID == "" {
		return "", fmt.Errorf("subject não encontrado no token")
	}

	logger.Debug("Token JWT validado com sucesso", logging.Field{Key: "user_id", Val: userID})
	return userID, nil
}

// Helpers para obter dados do contexto
func UserIDFromContext(ctx context.Context) (string, bool) {
	return ctxhelper.GetUserID(ctx)
}

// Evita import circular nas dependências
func _avoid(_ *config.Config, _ logging.Logger) {}
