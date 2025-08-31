// MIT License
// Autor atual: David Assef
// Descrição: Modelos para receitas (rf_incomes) e pagamentos (rf_payments)
// Data: 29-08-2025

package models

import (
	"time"

	"github.com/google/uuid"
)

// Income representa uma receita no sistema ReciboFast
type Income struct {
	ID         uuid.UUID  `json:"id" db:"id"`
	OwnerID    uuid.UUID  `json:"owner_id" db:"owner_id"`
	ContractID *uuid.UUID `json:"contract_id" db:"contract_id"`
	Categoria  *string    `json:"categoria" db:"categoria"`
	Competencia string    `json:"competencia" db:"competencia"`
	Valor      float64    `json:"valor" db:"valor"`
	Status     string     `json:"status" db:"status"`
	DueDate    *time.Time `json:"due_date" db:"due_date"`
	TotalPago  float64    `json:"total_pago" db:"total_pago"`
	DeletedAt  *time.Time `json:"deleted_at" db:"deleted_at"`
	CreatedAt  *time.Time `json:"created_at" db:"created_at"`
	UpdatedAt  *time.Time `json:"updated_at" db:"updated_at"`
}

// IncomeRequest representa os dados de entrada para criar/atualizar receita
type IncomeRequest struct {
	ContractID  *uuid.UUID `json:"contract_id"`
	Categoria   *string    `json:"categoria"`
	Competencia string     `json:"competencia" validate:"required"`
	Valor       float64    `json:"valor" validate:"required,gt=0"`
	Status      string     `json:"status"`
	DueDate     *string    `json:"due_date"` // RFC3339 format
}

// IncomeResponse representa a resposta paginada de receitas
type IncomeResponse struct {
	Incomes    []Income `json:"incomes"`
	Total      int      `json:"total"`
	Page       int      `json:"page"`
	PerPage    int      `json:"per_page"`
	TotalPages int      `json:"total_pages"`
}

// IncomeFilters representa os filtros para listagem de receitas
type IncomeFilters struct {
	Page  int `json:"page"`
	Limit int `json:"limit"`
}

// IncomeListResponse representa a resposta da listagem de receitas
type IncomeListResponse struct {
	Incomes []Income `json:"incomes"`
	Total   int      `json:"total"`
	Page    int      `json:"page"`
	Limit   int      `json:"limit"`
}

// Payment representa um pagamento no sistema
type Payment struct {
	ID       uuid.UUID `json:"id" db:"id"`
	IncomeID uuid.UUID `json:"income_id" db:"income_id"`
	Valor    float64   `json:"valor" db:"valor"`
	PagoEm   time.Time `json:"pago_em" db:"pago_em"`
	Metodo   *string   `json:"metodo" db:"metodo"`
	Obs      *string   `json:"obs" db:"obs"`
	CreatedAt *time.Time `json:"created_at" db:"created_at"`
}

// PaymentRequest representa os dados de entrada para registrar pagamento
type PaymentRequest struct {
	IncomeID uuid.UUID `json:"income_id" validate:"required"`
	Valor    float64   `json:"valor" validate:"required,gt=0"`
	PagoEm   *string   `json:"pago_em"` // RFC3339 format, opcional (default: now)
	Metodo   *string   `json:"metodo"`
	Obs      *string   `json:"obs"`
}

// PaymentResponse representa a resposta de um pagamento
type PaymentResponse struct {
	Payment Payment `json:"payment"`
	Income  Income  `json:"income"` // Receita atualizada após o pagamento
}

// IncomeFilter representa os filtros para busca de receitas
type IncomeFilter struct {
	Search      string     `json:"search"`
	Status      string     `json:"status"`
	Categoria   string     `json:"categoria"`
	Competencia string     `json:"competencia"`
	ContractID  *uuid.UUID `json:"contract_id"`
	DueDateFrom *time.Time `json:"due_date_from"`
	DueDateTo   *time.Time `json:"due_date_to"`
	ValorMin    *float64   `json:"valor_min"`
	ValorMax    *float64   `json:"valor_max"`
	SortField   string     `json:"sort_field"`
	SortOrder   string     `json:"sort_order"`
	Page        int        `json:"page"`
	PerPage     int        `json:"per_page"`
}

// Validate valida os dados de uma receita
func (req *IncomeRequest) Validate() error {
	if req.Competencia == "" {
		return ErrCompetenciaRequired
	}
	if req.Valor <= 0 {
		return ErrValorInvalid
	}
	if req.Status == "" {
		req.Status = "pendente"
	}
	return nil
}

// Validate valida os dados de um pagamento
func (req *PaymentRequest) Validate() error {
	if req.IncomeID == uuid.Nil {
		return ErrIncomeIDRequired
	}
	if req.Valor <= 0 {
		return ErrValorInvalid
	}
	return nil
}

// SetDefaults define valores padrão para o filtro
func (f *IncomeFilter) SetDefaults() {
	if f.Page <= 0 {
		f.Page = 1
	}
	if f.PerPage <= 0 {
		f.PerPage = 10
	}
	if f.SortField == "" {
		f.SortField = "created_at"
	}
	if f.SortOrder == "" || (f.SortOrder != "asc" && f.SortOrder != "desc") {
		f.SortOrder = "desc"
	}
}