// MIT License
// Autor atual: David Assef
// Descrição: Definições e helpers para contexto de requisições
// Data: 29-12-2024

package context

import (
	"context"
)

// Definição da chave de contexto para user_id
type ctxKey string

const userIDKey ctxKey = "user_id"

// SetUserID adiciona o user_id ao contexto
func SetUserID(ctx context.Context, userID string) context.Context {
	return context.WithValue(ctx, userIDKey, userID)
}

// GetUserID obtém o user_id do contexto
func GetUserID(ctx context.Context) (string, bool) {
	v := ctx.Value(userIDKey)
	if v == nil {
		return "", false
	}
	if s, ok := v.(string); ok {
		return s, true
	}
	return "", false
}