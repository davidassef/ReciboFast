// MIT License
// Autor atual: David Assef
// Descrição: Handlers de Recibos (rf_receipts) com suporte a signature_id e emissor alternativo
// Data: 06-09-2025

package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	ctxhelper "recibofast/internal/context"
	"recibofast/internal/logging"
	"recibofast/internal/models"
	"recibofast/internal/repositories"
)

type ReceiptHandlers struct {
	repo repositories.ReceiptRepository
	log  logging.Logger
}

func NewReceiptHandlers(repo repositories.ReceiptRepository, log logging.Logger) *ReceiptHandlers {
	return &ReceiptHandlers{repo: repo, log: log}
}

// POST /api/v1/receipts
func (h *ReceiptHandlers) CreateReceipt(w http.ResponseWriter, r *http.Request) {
	ownerID, ok := h.getUserID(r)
	if !ok {
		h.jsonError(w, http.StatusUnauthorized, "usuário não autenticado")
		return
	}
	var req models.ReceiptRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		h.jsonError(w, http.StatusBadRequest, "dados inválidos")
		return
	}
	m := &models.Receipt{
		OwnerID:        ownerID,
		IncomeID:       req.IncomeID,
		PDFURL:         req.PDFURL,
		Hash:           req.Hash,
		SignatureID:    req.SignatureID,
		IssuerName:     req.IssuerName,
		IssuerDocument: req.IssuerDocument,
	}
	if err := h.repo.Create(r.Context(), m); err != nil {
		h.log.Error("erro ao criar recibo", logging.Field{Key: "error", Val: err.Error()})
		h.jsonError(w, http.StatusBadRequest, "falha ao criar recibo")
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(m)
}

// GET /api/v1/receipts/{id}
func (h *ReceiptHandlers) GetReceipt(w http.ResponseWriter, r *http.Request) {
	ownerID, ok := h.getUserID(r)
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
	m, err := h.repo.GetByID(r.Context(), id, ownerID)
	if err != nil {
		if repositories.IsReceiptNotFound(err) {
			h.jsonError(w, http.StatusNotFound, "recibo não encontrado")
			return
		}
		h.log.Error("erro ao buscar recibo", logging.Field{Key: "error", Val: err.Error()})
		h.jsonError(w, http.StatusInternalServerError, "erro interno do servidor")
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(m)
}

// GET /api/v1/receipts
func (h *ReceiptHandlers) ListReceipts(w http.ResponseWriter, r *http.Request) {
	ownerID, ok := h.getUserID(r)
	if !ok {
		h.jsonError(w, http.StatusUnauthorized, "usuário não autenticado")
		return
	}
	page := 1
	limit := 10
	if p := r.URL.Query().Get("page"); p != "" {
		if v, err := strconv.Atoi(p); err == nil && v > 0 {
			page = v
		}
	}
	if l := r.URL.Query().Get("limit"); l != "" {
		if v, err := strconv.Atoi(l); err == nil && v > 0 {
			limit = v
		}
	}
	items, total, err := h.repo.List(r.Context(), ownerID, page, limit)
	if err != nil {
		h.log.Error("erro ao listar recibos", logging.Field{Key: "error", Val: err.Error()})
		h.jsonError(w, http.StatusInternalServerError, "erro interno do servidor")
		return
	}
	resp := models.ReceiptListResponse{
		Items:      items,
		Total:      total,
		Page:       page,
		Limit:      limit,
		TotalPages: (total + limit - 1) / limit,
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(resp)
}

// PUT /api/v1/receipts/{id}
func (h *ReceiptHandlers) UpdateReceipt(w http.ResponseWriter, r *http.Request) {
	ownerID, ok := h.getUserID(r)
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
	var req models.ReceiptRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		h.jsonError(w, http.StatusBadRequest, "dados inválidos")
		return
	}
	m := &models.Receipt{
		ID:             id,
		OwnerID:        ownerID,
		IncomeID:       req.IncomeID,
		PDFURL:         req.PDFURL,
		Hash:           req.Hash,
		SignatureID:    req.SignatureID,
		IssuerName:     req.IssuerName,
		IssuerDocument: req.IssuerDocument,
	}
	if err := h.repo.Update(r.Context(), m); err != nil {
		if repositories.IsReceiptNotFound(err) {
			h.jsonError(w, http.StatusNotFound, "recibo não encontrado")
			return
		}
		h.log.Error("erro ao atualizar recibo", logging.Field{Key: "error", Val: err.Error()})
		h.jsonError(w, http.StatusBadRequest, "falha ao atualizar recibo")
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(m)
}

// DELETE /api/v1/receipts/{id}
func (h *ReceiptHandlers) DeleteReceipt(w http.ResponseWriter, r *http.Request) {
	ownerID, ok := h.getUserID(r)
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
	if err := h.repo.Delete(r.Context(), id, ownerID); err != nil {
		if repositories.IsReceiptNotFound(err) {
			h.jsonError(w, http.StatusNotFound, "recibo não encontrado")
			return
		}
		h.log.Error("erro ao excluir recibo", logging.Field{Key: "error", Val: err.Error()})
		h.jsonError(w, http.StatusInternalServerError, "erro interno do servidor")
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

// Auxiliares
func (h *ReceiptHandlers) getUserID(r *http.Request) (uuid.UUID, bool) {
	userIDStr, ok := ctxhelper.GetUserID(r.Context())
	if !ok || userIDStr == "" {
		return uuid.Nil, false
	}
	uid, err := uuid.Parse(userIDStr)
	if err != nil {
		h.log.Error("erro ao parsear user_id do contexto", logging.Field{Key: "user_id_str", Val: userIDStr}, logging.Field{Key: "error", Val: err.Error()})
		return uuid.Nil, false
	}
	return uid, true
}

func (h *ReceiptHandlers) jsonError(w http.ResponseWriter, statusCode int, message string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	json.NewEncoder(w).Encode(map[string]string{"error": message})
}
