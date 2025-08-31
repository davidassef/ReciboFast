// MIT License
// Autor atual: David Assef
// Descrição: Handlers para CRUD de receitas e pagamentos
// Data: 29-08-2025

package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	ctxhelper "recibofast/internal/context"
	"recibofast/internal/logging"
	"recibofast/internal/models"
	"recibofast/internal/services"
)

// IncomeHandlers contém os handlers para receitas e pagamentos
type IncomeHandlers struct {
	incomeService services.IncomeService
	log           logging.Logger
}

// NewIncomeHandlers cria uma nova instância dos handlers
func NewIncomeHandlers(incomeService services.IncomeService, log logging.Logger) *IncomeHandlers {
	return &IncomeHandlers{
		incomeService: incomeService,
		log:           log,
	}
}

// CreateIncome cria uma nova receita
func (h *IncomeHandlers) CreateIncome(w http.ResponseWriter, r *http.Request) {
	userID, ok := h.getUserID(r)
	if !ok {
		h.jsonError(w, http.StatusUnauthorized, "usuário não autenticado")
		return
	}

	var req models.IncomeRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		h.jsonError(w, http.StatusBadRequest, "dados inválidos")
		return
	}

	income, err := h.incomeService.CreateIncome(userID, &req)
	if err != nil {
		h.log.Error("erro ao criar receita", logging.Field{Key: "error", Val: err.Error()})
		h.jsonError(w, http.StatusBadRequest, err.Error())
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(income)
}

// GetIncome busca uma receita por ID
func (h *IncomeHandlers) GetIncome(w http.ResponseWriter, r *http.Request) {
	userID, ok := h.getUserID(r)
	if !ok {
		h.jsonError(w, http.StatusUnauthorized, "usuário não autenticado")
		return
	}

	idStr := chi.URLParam(r, "id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		h.jsonError(w, http.StatusBadRequest, "ID inválido")
		return
	}

	income, err := h.incomeService.GetIncome(id, userID)
	if err != nil {
		if err == models.ErrIncomeNotFound {
			h.jsonError(w, http.StatusNotFound, "receita não encontrada")
			return
		}
		h.log.Error("erro ao buscar receita", logging.Field{Key: "error", Val: err.Error()})
		h.jsonError(w, http.StatusInternalServerError, "erro interno do servidor")
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(income)
}

// UpdateIncome atualiza uma receita existente
func (h *IncomeHandlers) UpdateIncome(w http.ResponseWriter, r *http.Request) {
	userID, ok := h.getUserID(r)
	if !ok {
		h.jsonError(w, http.StatusUnauthorized, "usuário não autenticado")
		return
	}

	idStr := chi.URLParam(r, "id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		h.jsonError(w, http.StatusBadRequest, "ID inválido")
		return
	}

	var req models.IncomeRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		h.jsonError(w, http.StatusBadRequest, "dados inválidos")
		return
	}

	income, err := h.incomeService.UpdateIncome(id, userID, &req)
	if err != nil {
		if err == models.ErrIncomeNotFound {
			h.jsonError(w, http.StatusNotFound, "receita não encontrada")
			return
		}
		h.log.Error("erro ao atualizar receita", logging.Field{Key: "error", Val: err.Error()})
		h.jsonError(w, http.StatusBadRequest, err.Error())
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(income)
}

// DeleteIncome remove uma receita (soft delete)
func (h *IncomeHandlers) DeleteIncome(w http.ResponseWriter, r *http.Request) {
	userID, ok := h.getUserID(r)
	if !ok {
		h.jsonError(w, http.StatusUnauthorized, "usuário não autenticado")
		return
	}

	idStr := chi.URLParam(r, "id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		h.jsonError(w, http.StatusBadRequest, "ID inválido")
		return
	}

	err = h.incomeService.DeleteIncome(id, userID)
	if err != nil {
		if err == models.ErrIncomeNotFound {
			h.jsonError(w, http.StatusNotFound, "receita não encontrada")
			return
		}
		h.log.Error("erro ao deletar receita", logging.Field{Key: "error", Val: err.Error()})
		h.jsonError(w, http.StatusInternalServerError, "erro interno do servidor")
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// ListIncomes lista receitas com filtros e paginação
func (h *IncomeHandlers) ListIncomes(w http.ResponseWriter, r *http.Request) {
	userID, ok := h.getUserID(r)
	if !ok {
		h.jsonError(w, http.StatusUnauthorized, "usuário não autenticado")
		return
	}

	// Parse query parameters
	filter := &models.IncomeFilter{
		Search:      strings.TrimSpace(r.URL.Query().Get("search")),
		Status:      strings.TrimSpace(r.URL.Query().Get("status")),
		Categoria:   strings.TrimSpace(r.URL.Query().Get("categoria")),
		Competencia: strings.TrimSpace(r.URL.Query().Get("competencia")),
		SortField:   strings.TrimSpace(r.URL.Query().Get("sort_field")),
		SortOrder:   strings.TrimSpace(r.URL.Query().Get("sort_order")),
	}

	// Parse page and per_page
	if pageStr := r.URL.Query().Get("page"); pageStr != "" {
		if page, err := strconv.Atoi(pageStr); err == nil && page > 0 {
			filter.Page = page
		}
	}

	if perPageStr := r.URL.Query().Get("per_page"); perPageStr != "" {
		if perPage, err := strconv.Atoi(perPageStr); err == nil && perPage > 0 {
			filter.PerPage = perPage
		}
	}

	// Parse contract_id
	if contractIDStr := r.URL.Query().Get("contract_id"); contractIDStr != "" {
		if contractID, err := uuid.Parse(contractIDStr); err == nil {
			filter.ContractID = &contractID
		}
	}

	// Parse date filters
	if dueDateFromStr := r.URL.Query().Get("due_date_from"); dueDateFromStr != "" {
		if dueDateFrom, err := time.Parse(time.RFC3339, dueDateFromStr); err == nil {
			filter.DueDateFrom = &dueDateFrom
		}
	}

	if dueDateToStr := r.URL.Query().Get("due_date_to"); dueDateToStr != "" {
		if dueDateTo, err := time.Parse(time.RFC3339, dueDateToStr); err == nil {
			filter.DueDateTo = &dueDateTo
		}
	}

	// Parse valor filters
	if valorMinStr := r.URL.Query().Get("valor_min"); valorMinStr != "" {
		if valorMin, err := strconv.ParseFloat(valorMinStr, 64); err == nil {
			filter.ValorMin = &valorMin
		}
	}

	if valorMaxStr := r.URL.Query().Get("valor_max"); valorMaxStr != "" {
		if valorMax, err := strconv.ParseFloat(valorMaxStr, 64); err == nil {
			filter.ValorMax = &valorMax
		}
	}

	response, err := h.incomeService.ListIncomes(userID, filter)
	if err != nil {
		h.log.Error("erro ao listar receitas", logging.Field{Key: "error", Val: err.Error()})
		h.jsonError(w, http.StatusInternalServerError, "erro interno do servidor")
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// AddPayment adiciona um pagamento a uma receita
func (h *IncomeHandlers) AddPayment(w http.ResponseWriter, r *http.Request) {
	userID, ok := h.getUserID(r)
	if !ok {
		h.jsonError(w, http.StatusUnauthorized, "usuário não autenticado")
		return
	}

	var req models.PaymentRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		h.jsonError(w, http.StatusBadRequest, "dados inválidos")
		return
	}

	response, err := h.incomeService.AddPayment(userID, &req)
	if err != nil {
		if err == models.ErrIncomeNotFound {
			h.jsonError(w, http.StatusNotFound, "receita não encontrada")
			return
		}
		if err == models.ErrInsufficientAmount {
			h.jsonError(w, http.StatusBadRequest, "valor do pagamento excede o saldo devedor")
			return
		}
		h.log.Error("erro ao adicionar pagamento", logging.Field{Key: "error", Val: err.Error()})
		h.jsonError(w, http.StatusBadRequest, err.Error())
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(response)
}

// GetIncomePayments busca todos os pagamentos de uma receita
func (h *IncomeHandlers) GetIncomePayments(w http.ResponseWriter, r *http.Request) {
	userID, ok := h.getUserID(r)
	if !ok {
		h.jsonError(w, http.StatusUnauthorized, "usuário não autenticado")
		return
	}

	idStr := chi.URLParam(r, "id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		h.jsonError(w, http.StatusBadRequest, "ID inválido")
		return
	}

	payments, err := h.incomeService.GetIncomePayments(id, userID)
	if err != nil {
		if err == models.ErrIncomeNotFound {
			h.jsonError(w, http.StatusNotFound, "receita não encontrada")
			return
		}
		h.log.Error("erro ao buscar pagamentos", logging.Field{Key: "error", Val: err.Error()})
		h.jsonError(w, http.StatusInternalServerError, "erro interno do servidor")
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"payments": payments,
	})
}

// Métodos auxiliares

// getUserID extrai o ID do usuário do contexto da requisição
func (h *IncomeHandlers) getUserID(r *http.Request) (uuid.UUID, bool) {
	// Extrai o user_id do contexto (definido pelo middleware SupabaseAuth)
	userIDStr, ok := ctxhelper.GetUserID(r.Context())
	if !ok || userIDStr == "" {
		return uuid.Nil, false
	}

	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		h.log.Error("erro ao parsear user_id do contexto", logging.Field{Key: "user_id_str", Val: userIDStr}, logging.Field{Key: "error", Val: err.Error()})
		return uuid.Nil, false
	}

	return userID, true
}

// jsonError envia uma resposta de erro em JSON
func (h *IncomeHandlers) jsonError(w http.ResponseWriter, statusCode int, message string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	json.NewEncoder(w).Encode(map[string]string{
		"error": message,
	})
}