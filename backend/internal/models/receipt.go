// MIT License
// Autor atual: David Assef
// Descrição: Modelos de dados e DTOs de Recibos (rf_receipts)
// Data: 06-09-2025

package models

import (
	"time"
	"github.com/google/uuid"
)

// Receipt representa a entidade rf_receipts
// Docstring (PT-BR): modelo alinhado ao schema com suporte a signature_id e emissor alternativo.
type Receipt struct {
	ID             uuid.UUID  `json:"id" db:"id"`
	OwnerID        uuid.UUID  `json:"owner_id" db:"owner_id"`
	IncomeID       *uuid.UUID `json:"income_id" db:"income_id"`
	Numero         int64      `json:"numero" db:"numero"`
	EmitidoEm      *time.Time `json:"emitido_em" db:"emitido_em"`
	PDFURL         *string    `json:"pdf_url" db:"pdf_url"`
	Hash           *string    `json:"hash" db:"hash"`
	SignatureID    *uuid.UUID `json:"signature_id" db:"signature_id"`
	IssuerName     *string    `json:"issuer_name" db:"issuer_name"`
	IssuerDocument *string    `json:"issuer_document" db:"issuer_document"`
	CreatedAt      *time.Time `json:"created_at" db:"created_at"`
}

// ReceiptRequest representa o payload de criação/edição
// Docstring (PT-BR): campos opcionais, handler completará owner_id e datas.
type ReceiptRequest struct {
	IncomeID       *uuid.UUID `json:"income_id"`
	PDFURL         *string    `json:"pdf_url"`
	Hash           *string    `json:"hash"`
	SignatureID    *uuid.UUID `json:"signature_id"`
	IssuerName     *string    `json:"issuer_name"`
	IssuerDocument *string    `json:"issuer_document"`
}

// ReceiptListResponse resposta de listagem paginada
// Docstring (PT-BR): paginação simples.
type ReceiptListResponse struct {
	Items      []Receipt `json:"items"`
	Total      int       `json:"total"`
	Page       int       `json:"page"`
	Limit      int       `json:"limit"`
	TotalPages int       `json:"total_pages"`
}
