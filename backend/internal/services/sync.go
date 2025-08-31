// MIT License
// Autor atual: David Assef
// Descrição: Serviço de sincronização incremental
// Data: 29-08-2025

package services

import (
	"context"
	"crypto/sha1"
	"encoding/hex"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

type SyncService struct{ db *pgxpool.Pool }

func NewSyncService(db *pgxpool.Pool) *SyncService { return &SyncService{db: db} }

// FetchChanges retorna um payload mínimo por enquanto.
// Docstring: Deve retornar alterações por entidade com base em updated_at > since, incluindo soft-deletes.
func (s *SyncService) FetchChanges(ctx context.Context, userID string, since time.Time, limit int, cursor, fields string) (interface{}, string, string, error) {
	// TODO: Consultar tabelas rf_* aplicando owner_id = userID e updated_at > since
	// Por ora, retorna vazio com ETag derivado do since/user/limit
	etag := makeETag(userID + since.UTC().Format(time.RFC3339) + ":" + cursor)
	return map[string]interface{}{
		"incomes":  []interface{}{},
		"payments": []interface{}{},
		"receipts": []interface{}{},
	}, "", etag, nil
}

func makeETag(s string) string {
	h := sha1.Sum([]byte(s))
	return "W/\"" + hex.EncodeToString(h[:]) + "\""
}
