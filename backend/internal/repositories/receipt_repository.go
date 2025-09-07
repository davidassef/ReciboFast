// MIT License
// Autor atual: David Assef
// Descrição: Repositório de Recibos (rf_receipts) com suporte a signature_id e emissor
// Data: 06-09-2025

package repositories

import (
	"context"
	"errors"
	"fmt"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"recibofast/internal/models"
)

var (
	errReceiptNotFound = errors.New("receipt not found")
)

type ReceiptRepository interface {
	Create(ctx context.Context, r *models.Receipt) error
	GetByID(ctx context.Context, id, ownerID uuid.UUID) (*models.Receipt, error)
	List(ctx context.Context, ownerID uuid.UUID, page, limit int) ([]models.Receipt, int, error)
	Update(ctx context.Context, r *models.Receipt) error
	Delete(ctx context.Context, id, ownerID uuid.UUID) error
}

type receiptRepository struct {
	db *pgxpool.Pool
}

func NewReceiptRepository(db *pgxpool.Pool) ReceiptRepository {
	return &receiptRepository{db: db}
}

func (r *receiptRepository) Create(ctx context.Context, m *models.Receipt) error {
	query := `
		INSERT INTO rf_receipts (
			id, owner_id, income_id, pdf_url, hash, signature_id, issuer_name, issuer_document
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7, $8
		) RETURNING numero, emitido_em, created_at
	`
	if m.ID == uuid.Nil {
		m.ID = uuid.New()
	}
	row := r.db.QueryRow(ctx, query,
		m.ID, m.OwnerID, m.IncomeID, m.PDFURL, m.Hash, m.SignatureID, m.IssuerName, m.IssuerDocument,
	)
	return row.Scan(&m.Numero, &m.EmitidoEm, &m.CreatedAt)
}

func (r *receiptRepository) GetByID(ctx context.Context, id, ownerID uuid.UUID) (*models.Receipt, error) {
	query := `
		SELECT id, owner_id, income_id, numero, emitido_em, pdf_url, hash,
		       signature_id, issuer_name, issuer_document, created_at
		FROM rf_receipts
		WHERE id = $1 AND owner_id = $2
	`
	row := r.db.QueryRow(ctx, query, id, ownerID)
	var m models.Receipt
	if err := row.Scan(&m.ID, &m.OwnerID, &m.IncomeID, &m.Numero, &m.EmitidoEm, &m.PDFURL, &m.Hash,
		&m.SignatureID, &m.IssuerName, &m.IssuerDocument, &m.CreatedAt); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, errReceiptNotFound
		}
		return nil, err
	}
	return &m, nil
}

func (r *receiptRepository) List(ctx context.Context, ownerID uuid.UUID, page, limit int) ([]models.Receipt, int, error) {
	if page <= 0 {
		page = 1
	}
	if limit <= 0 || limit > 100 {
		limit = 10
	}
	offset := (page - 1) * limit
	countQuery := `SELECT count(1) FROM rf_receipts WHERE owner_id = $1`
	var total int
	if err := r.db.QueryRow(ctx, countQuery, ownerID).Scan(&total); err != nil {
		return nil, 0, err
	}
	query := `
		SELECT id, owner_id, income_id, numero, emitido_em, pdf_url, hash,
		       signature_id, issuer_name, issuer_document, created_at
		FROM rf_receipts
		WHERE owner_id = $1
		ORDER BY emitido_em DESC NULLS LAST, created_at DESC
		LIMIT $2 OFFSET $3
	`
	rows, err := r.db.Query(ctx, query, ownerID, limit, offset)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()
	var items []models.Receipt
	for rows.Next() {
		var m models.Receipt
		if err := rows.Scan(&m.ID, &m.OwnerID, &m.IncomeID, &m.Numero, &m.EmitidoEm, &m.PDFURL, &m.Hash,
			&m.SignatureID, &m.IssuerName, &m.IssuerDocument, &m.CreatedAt); err != nil {
			return nil, 0, err
		}
		items = append(items, m)
	}
	return items, total, nil
}

func (r *receiptRepository) Update(ctx context.Context, m *models.Receipt) error {
	query := `
		UPDATE rf_receipts
		SET income_id = $2, pdf_url = $3, hash = $4, signature_id = $5,
		    issuer_name = $6, issuer_document = $7
		WHERE id = $1 AND owner_id = $8
		RETURNING numero, emitido_em, created_at
	`
	row := r.db.QueryRow(ctx, query,
		m.ID, m.IncomeID, m.PDFURL, m.Hash, m.SignatureID, m.IssuerName, m.IssuerDocument, m.OwnerID,
	)
	return row.Scan(&m.Numero, &m.EmitidoEm, &m.CreatedAt)
}

func (r *receiptRepository) Delete(ctx context.Context, id, ownerID uuid.UUID) error {
	cmd, err := r.db.Exec(ctx, `DELETE FROM rf_receipts WHERE id=$1 AND owner_id=$2`, id, ownerID)
	if err != nil {
		return err
	}
	if cmd.RowsAffected() == 0 {
		return errReceiptNotFound
	}
	return nil
}

// Erros expostos para handlers
func IsReceiptNotFound(err error) bool { return errors.Is(err, errReceiptNotFound) }

func DebugRepo() { fmt.Print("") }
