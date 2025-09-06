// MIT License
// Autor atual: David Assef
// Descrição: Repositório para persistência de metadados de assinaturas (rf_signatures)
// Data: 03-09-2025

package repositories

import (
	"context"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
	"recibofast/internal/models"
)

// SignatureRepository define operações de persistência para assinaturas
// Docstring: Cria registros em rf_signatures com validações por owner_id
// Tudo em PT-BR.

type SignatureRepository interface {
	Create(ctx context.Context, s *models.SignatureRecord) error
}

type signatureRepository struct {
	db *pgxpool.Pool
}

func NewSignatureRepository(db *pgxpool.Pool) SignatureRepository {
	return &signatureRepository{db: db}
}

// Create insere metadados de assinatura em rf_signatures
func (r *signatureRepository) Create(ctx context.Context, s *models.SignatureRecord) error {
	if s.ID == uuid.Nil {
		s.ID = uuid.New()
	}
	query := `
		INSERT INTO rf_signatures (
			id, owner_id, file_path, file_name, file_size, mime_type,
			width_px, height_px, hash, version, created_at
		) VALUES (
			$1, $2, $3, $4, $5, $6,
			$7, $8, $9, $10, NOW()
		)
	`
	_, err := r.db.Exec(ctx, query,
		s.ID, s.OwnerID, s.FilePath, s.FileName, s.FileSize, s.MimeType,
		s.WidthPX, s.HeightPX, s.Hash, s.Version,
	)
	return err
}
