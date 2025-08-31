// MIT License
// Autor atual: David Assef
// Descrição: Acesso ao banco de dados (pool) e helpers
// Data: 29-08-2025

package repositories

import (
	"context"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

// WithTimeout devolve um contexto com deadline curto para operações no DB.
func WithTimeout(ctx context.Context, d time.Duration) (context.Context, context.CancelFunc) {
	return context.WithTimeout(ctx, d)
}

// Tx helpers e repositórios específicos serão adicionados conforme implementação.

type DB struct{ Pool *pgxpool.Pool }
