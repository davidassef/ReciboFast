// MIT License
// Autor atual: David Assef
// Descrição: Serviço com lógica de negócio para receitas e pagamentos
// Data: 29-08-2025

package services

import (
	"fmt"
	"time"

	"github.com/google/uuid"
	"recibofast/internal/models"
	"recibofast/internal/repositories"
)

// IncomeService interface para serviços de receitas
type IncomeService interface {
	CreateIncome(ownerID uuid.UUID, req *models.IncomeRequest) (*models.Income, error)
	GetIncome(id, ownerID uuid.UUID) (*models.Income, error)
	UpdateIncome(id, ownerID uuid.UUID, req *models.IncomeRequest) (*models.Income, error)
	DeleteIncome(id, ownerID uuid.UUID) error
	ListIncomes(ownerID uuid.UUID, filter *models.IncomeFilter) (*models.IncomeResponse, error)
	AddPayment(ownerID uuid.UUID, req *models.PaymentRequest) (*models.PaymentResponse, error)
	GetIncomePayments(incomeID, ownerID uuid.UUID) ([]models.Payment, error)
	CalculateIncomeStatus(income *models.Income) string
}

// incomeService implementação do serviço
type incomeService struct {
	incomeRepo repositories.IncomeRepository
}

// NewIncomeService cria uma nova instância do serviço
func NewIncomeService(incomeRepo repositories.IncomeRepository) IncomeService {
	return &incomeService{
		incomeRepo: incomeRepo,
	}
}

// CreateIncome cria uma nova receita
func (s *incomeService) CreateIncome(ownerID uuid.UUID, req *models.IncomeRequest) (*models.Income, error) {
	// Validar dados de entrada
	if err := req.Validate(); err != nil {
		return nil, err
	}
	
	// Validar status se fornecido
	if req.Status != "" && !models.ValidStatus(req.Status) {
		return nil, models.ErrInvalidStatus
	}
	
	// Criar nova receita
	income := &models.Income{
		ID:          uuid.New(),
		OwnerID:     ownerID,
		ContractID:  req.ContractID,
		Categoria:   req.Categoria,
		Competencia: req.Competencia,
		Valor:       req.Valor,
		Status:      req.Status,
		TotalPago:   0,
	}
	
	// Definir status padrão se não fornecido
	if income.Status == "" {
		income.Status = models.StatusPendente
	}
	
	// Converter data de vencimento se fornecida
	if req.DueDate != nil && *req.DueDate != "" {
		dueDate, err := time.Parse(time.RFC3339, *req.DueDate)
		if err != nil {
			return nil, models.ErrInvalidDateFormat
		}
		income.DueDate = &dueDate
	}
	
	// Salvar no banco
	err := s.incomeRepo.Create(income)
	if err != nil {
		return nil, fmt.Errorf("erro ao criar receita: %w", err)
	}
	
	return income, nil
}

// GetIncome busca uma receita por ID
func (s *incomeService) GetIncome(id, ownerID uuid.UUID) (*models.Income, error) {
	income, err := s.incomeRepo.GetByID(id, ownerID)
	if err != nil {
		return nil, err
	}
	
	// Atualizar status baseado na data de vencimento
	updatedStatus := s.CalculateIncomeStatus(income)
	if updatedStatus != income.Status {
		income.Status = updatedStatus
		// Atualizar no banco se necessário
		s.incomeRepo.Update(income)
	}
	
	return income, nil
}

// UpdateIncome atualiza uma receita existente
func (s *incomeService) UpdateIncome(id, ownerID uuid.UUID, req *models.IncomeRequest) (*models.Income, error) {
	// Validar dados de entrada
	if err := req.Validate(); err != nil {
		return nil, err
	}
	
	// Validar status se fornecido
	if req.Status != "" && !models.ValidStatus(req.Status) {
		return nil, models.ErrInvalidStatus
	}
	
	// Buscar receita existente
	income, err := s.incomeRepo.GetByID(id, ownerID)
	if err != nil {
		return nil, err
	}
	
	// Atualizar campos
	income.ContractID = req.ContractID
	income.Categoria = req.Categoria
	income.Competencia = req.Competencia
	income.Valor = req.Valor
	
	if req.Status != "" {
		income.Status = req.Status
	}
	
	// Converter data de vencimento se fornecida
	if req.DueDate != nil {
		if *req.DueDate == "" {
			income.DueDate = nil
		} else {
			dueDate, err := time.Parse(time.RFC3339, *req.DueDate)
			if err != nil {
				return nil, models.ErrInvalidDateFormat
			}
			income.DueDate = &dueDate
		}
	}
	
	// Recalcular status baseado no valor e pagamentos
	if income.TotalPago >= income.Valor {
		income.Status = models.StatusPago
	} else if income.TotalPago > 0 {
		income.Status = models.StatusParcial
	}
	
	// Salvar alterações
	err = s.incomeRepo.Update(income)
	if err != nil {
		return nil, fmt.Errorf("erro ao atualizar receita: %w", err)
	}
	
	return income, nil
}

// DeleteIncome remove uma receita (soft delete)
func (s *incomeService) DeleteIncome(id, ownerID uuid.UUID) error {
	// Verificar se a receita existe
	_, err := s.incomeRepo.GetByID(id, ownerID)
	if err != nil {
		return err
	}
	
	// Deletar receita
	err = s.incomeRepo.Delete(id, ownerID)
	if err != nil {
		return fmt.Errorf("erro ao deletar receita: %w", err)
	}
	
	return nil
}

// ListIncomes lista receitas com filtros e paginação
func (s *incomeService) ListIncomes(ownerID uuid.UUID, filter *models.IncomeFilter) (*models.IncomeResponse, error) {
	incomes, total, err := s.incomeRepo.List(ownerID, filter)
	if err != nil {
		return nil, fmt.Errorf("erro ao listar receitas: %w", err)
	}
	
	// Calcular total de páginas
	totalPages := (total + filter.PerPage - 1) / filter.PerPage
	
	// Atualizar status das receitas baseado na data de vencimento
	for i := range incomes {
		updatedStatus := s.CalculateIncomeStatus(&incomes[i])
		if updatedStatus != incomes[i].Status {
			incomes[i].Status = updatedStatus
			// Atualizar no banco em background (opcional)
			go s.incomeRepo.Update(&incomes[i])
		}
	}
	
	return &models.IncomeResponse{
		Incomes:    incomes,
		Total:      total,
		Page:       filter.Page,
		PerPage:    filter.PerPage,
		TotalPages: totalPages,
	}, nil
}

// AddPayment adiciona um pagamento a uma receita
func (s *incomeService) AddPayment(ownerID uuid.UUID, req *models.PaymentRequest) (*models.PaymentResponse, error) {
	// Validar dados de entrada
	if err := req.Validate(); err != nil {
		return nil, err
	}
	
	// Verificar se a receita existe e pertence ao usuário
	income, err := s.incomeRepo.GetByID(req.IncomeID, ownerID)
	if err != nil {
		return nil, err
	}
	
	// Verificar se o valor do pagamento não excede o saldo devedor
	saldoDevedor := income.Valor - income.TotalPago
	if req.Valor > saldoDevedor {
		return nil, models.ErrInsufficientAmount
	}
	
	// Criar pagamento
	payment := &models.Payment{
		ID:       uuid.New(),
		IncomeID: req.IncomeID,
		Valor:    req.Valor,
		Metodo:   req.Metodo,
		Obs:      req.Obs,
	}
	
	// Definir data do pagamento
	if req.PagoEm != nil && *req.PagoEm != "" {
		pagoEm, err := time.Parse(time.RFC3339, *req.PagoEm)
		if err != nil {
			return nil, models.ErrInvalidDateFormat
		}
		payment.PagoEm = pagoEm
	} else {
		payment.PagoEm = time.Now()
	}
	
	// Adicionar pagamento
	err = s.incomeRepo.AddPayment(payment)
	if err != nil {
		return nil, fmt.Errorf("erro ao adicionar pagamento: %w", err)
	}

	// Atualizar total pago da receita
	err = s.incomeRepo.UpdateTotalPago(req.IncomeID)
	if err != nil {
		return nil, fmt.Errorf("erro ao atualizar total pago: %w", err)
	}

	// Buscar receita atualizada
	updatedIncome, err := s.incomeRepo.GetByID(req.IncomeID, ownerID)
	if err != nil {
		return nil, fmt.Errorf("erro ao buscar receita atualizada: %w", err)
	}

	return &models.PaymentResponse{
		Payment: *payment,
		Income:  *updatedIncome,
	}, nil
}

// GetIncomePayments busca todos os pagamentos de uma receita
func (s *incomeService) GetIncomePayments(incomeID, ownerID uuid.UUID) ([]models.Payment, error) {
	// Verificar se a receita existe e pertence ao usuário
	_, err := s.incomeRepo.GetByID(incomeID, ownerID)
	if err != nil {
		return nil, err
	}
	
	// Buscar pagamentos
	payments, err := s.incomeRepo.GetPayments(incomeID, ownerID)
	if err != nil {
		return nil, fmt.Errorf("erro ao buscar pagamentos: %w", err)
	}
	
	return payments, nil
}

// CalculateIncomeStatus calcula o status de uma receita baseado nos pagamentos e data de vencimento
func (s *incomeService) CalculateIncomeStatus(income *models.Income) string {
	// Se já está pago, manter como pago
	if income.TotalPago >= income.Valor {
		return models.StatusPago
	}
	
	// Se tem pagamento parcial
	if income.TotalPago > 0 {
		return models.StatusParcial
	}
	
	// Verificar se está vencido
	if income.DueDate != nil && time.Now().After(*income.DueDate) {
		return models.StatusVencido
	}
	
	// Status padrão
	return models.StatusPendente
}