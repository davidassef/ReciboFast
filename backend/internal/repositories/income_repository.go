// MIT License
// Autor atual: David Assef
// Descrição: Repositório para operações de receitas e pagamentos no banco de dados
// Data: 29-08-2025

package repositories

import (
	"context"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
	"recibofast/internal/models"
)

// IncomeRepository interface para operações de receitas
type IncomeRepository interface {
	Create(income *models.Income) error
	GetByID(id, ownerID uuid.UUID) (*models.Income, error)
	Update(income *models.Income) error
	Delete(id, ownerID uuid.UUID) error
	List(ownerID uuid.UUID, filter *models.IncomeFilter) ([]models.Income, int, error)
	AddPayment(payment *models.Payment) error
	GetPayments(incomeID, ownerID uuid.UUID) ([]models.Payment, error)
	UpdateTotalPago(incomeID uuid.UUID) error
}

// incomeRepository implementa a interface IncomeRepository
type incomeRepository struct {
	db *pgxpool.Pool
}

// NewIncomeRepository cria uma nova instância do repositório de receitas
func NewIncomeRepository(db *pgxpool.Pool) IncomeRepository {
	return &incomeRepository{db: db}
}

// Create cria uma nova receita
func (r *incomeRepository) Create(income *models.Income) error {
	query := `
		INSERT INTO rf_incomes (
			id, owner_id, contract_id, categoria, competencia, valor,
			status, due_date, created_at, updated_at
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW()
		)
	`

	_, err := r.db.Exec(context.Background(), query,
		income.ID, income.OwnerID, income.ContractID, income.Categoria,
		income.Competencia, income.Valor, income.Status, income.DueDate,
	)

	return err
}

// GetByID busca uma receita por ID
func (r *incomeRepository) GetByID(id, userID uuid.UUID) (*models.Income, error) {
	query := `
		SELECT id, owner_id, contract_id, categoria, competencia, valor,
		       status, due_date, total_pago, deleted_at, created_at, updated_at
		FROM rf_incomes 
		WHERE id = $1 AND owner_id = $2 AND deleted_at IS NULL
	`

	income := &models.Income{}
	err := r.db.QueryRow(context.Background(), query, id, userID).Scan(
		&income.ID, &income.OwnerID, &income.ContractID, &income.Categoria,
		&income.Competencia, &income.Valor, &income.Status, &income.DueDate,
		&income.TotalPago, &income.DeletedAt, &income.CreatedAt, &income.UpdatedAt,
	)
	if err != nil {
		if err.Error() == "no rows in result set" {
			return nil, models.ErrIncomeNotFound
		}
		return nil, err
	}

	return income, nil
}

// Update atualiza uma receita existente
func (r *incomeRepository) Update(income *models.Income) error {
	query := `
		UPDATE rf_incomes 
		SET contract_id = $3, categoria = $4, competencia = $5, valor = $6, 
		    status = $7, due_date = $8, updated_at = NOW()
		WHERE id = $1 AND owner_id = $2 AND deleted_at IS NULL
	`

	result, err := r.db.Exec(context.Background(), query,
		income.ID, income.OwnerID, income.ContractID, income.Categoria,
		income.Competencia, income.Valor, income.Status, income.DueDate,
	)
	if err != nil {
		return err
	}

	if result.RowsAffected() == 0 {
		return models.ErrIncomeNotFound
	}

	return nil
}

// Delete marca uma receita como deletada (soft delete)
func (r *incomeRepository) Delete(id, userID uuid.UUID) error {
	query := `
		UPDATE rf_incomes 
		SET deleted_at = NOW(), updated_at = NOW()
		WHERE id = $1 AND owner_id = $2 AND deleted_at IS NULL
	`

	result, err := r.db.Exec(context.Background(), query, id, userID)
	if err != nil {
		return err
	}

	if result.RowsAffected() == 0 {
		return models.ErrIncomeNotFound
	}

	return nil
}

// List busca receitas com filtros, ordenação e paginação
func (r *incomeRepository) List(ownerID uuid.UUID, filter *models.IncomeFilter) ([]models.Income, int, error) {
	filter.SetDefaults()

	// Contar total de registros
	countQuery := `
		SELECT COUNT(*) 
		FROM rf_incomes 
		WHERE owner_id = $1 AND deleted_at IS NULL
	`

	var total int
	err := r.db.QueryRow(context.Background(), countQuery, ownerID).Scan(&total)
	if err != nil {
		return nil, 0, err
	}

	// Buscar dados com paginação
	query := `
		SELECT id, owner_id, contract_id, categoria, competencia, valor,
		       status, due_date, total_pago, deleted_at, created_at, updated_at
		FROM rf_incomes 
		WHERE owner_id = $1 AND deleted_at IS NULL
		ORDER BY created_at DESC
		LIMIT $2 OFFSET $3
	`

	offset := (filter.Page - 1) * filter.PerPage
	rows, err := r.db.Query(context.Background(), query, ownerID, filter.PerPage, offset)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var incomes []models.Income
	for rows.Next() {
		income := models.Income{}
		err := rows.Scan(
			&income.ID, &income.OwnerID, &income.ContractID, &income.Categoria,
			&income.Competencia, &income.Valor, &income.Status, &income.DueDate,
			&income.TotalPago, &income.DeletedAt, &income.CreatedAt, &income.UpdatedAt,
		)
		if err != nil {
			return nil, 0, err
		}
		incomes = append(incomes, income)
	}

	return incomes, total, nil
}

// AddPayment adiciona um pagamento a uma receita
func (r *incomeRepository) AddPayment(payment *models.Payment) error {
	query := `
		INSERT INTO rf_payments (
			id, income_id, valor, pago_em, metodo, obs, created_at
		) VALUES (
			$1, $2, $3, $4, $5, $6, NOW()
		)
	`

	_, err := r.db.Exec(context.Background(), query,
		payment.ID, payment.IncomeID, payment.Valor, payment.PagoEm,
		payment.Metodo, payment.Obs,
	)

	return err
}

// GetPayments busca todos os pagamentos de uma receita
func (r *incomeRepository) GetPayments(incomeID, ownerID uuid.UUID) ([]models.Payment, error) {
	query := `
		SELECT p.id, p.income_id, p.valor, p.pago_em, p.metodo, p.obs, p.created_at
		FROM rf_payments p
		INNER JOIN rf_incomes i ON p.income_id = i.id
		WHERE p.income_id = $1 AND i.owner_id = $2
		ORDER BY p.pago_em DESC
	`

	rows, err := r.db.Query(context.Background(), query, incomeID, ownerID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var payments []models.Payment
	for rows.Next() {
		payment := models.Payment{}
		err := rows.Scan(
			&payment.ID, &payment.IncomeID, &payment.Valor, &payment.PagoEm,
			&payment.Metodo, &payment.Obs, &payment.CreatedAt,
		)
		if err != nil {
			return nil, err
		}
		payments = append(payments, payment)
	}

	if err = rows.Err(); err != nil {
		return nil, err
	}

	return payments, nil
}

// UpdateTotalPago atualiza o total pago de uma receita
func (r *incomeRepository) UpdateTotalPago(incomeID uuid.UUID) error {
	query := `
		UPDATE rf_incomes 
		SET total_pago = (
			SELECT COALESCE(SUM(valor), 0) 
			FROM rf_payments 
			WHERE income_id = $1
		), updated_at = NOW()
		WHERE id = $1
	`

	_, err := r.db.Exec(context.Background(), query, incomeID)
	return err
}