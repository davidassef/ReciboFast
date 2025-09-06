// MIT License
// Autor atual: David Assef
// Descrição: Handler para gerenciamento de assinaturas no backend ReciboFast
// Data: 04-09-2025

package handlers

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"

	"github.com/google/uuid"
	ctxhelper "recibofast/internal/context"
	"recibofast/internal/config"
	"recibofast/internal/logging"
	"recibofast/internal/models"
	"recibofast/internal/repositories"
	"recibofast/internal/services"
)

// StorageClient define as operações necessárias de Storage para o handler.
// Docstring: Interface fina para permitir mocking em testes, evitando dependência
// direta do cliente concreto do Supabase Storage. Em PT-BR.
type StorageClient interface {
	UploadObject(ctx context.Context, bucket, objectPath string, content []byte, contentType string) error
	DeleteObject(ctx context.Context, bucket, objectPath string) error
}

// SignatureHandlers contém os handlers para operações com assinaturas
// Docstring: expõe endpoint para upload multipart, valida PNG e retorna metadados.
type SignatureHandlers struct {
	sigSvc *services.SignatureService
	log   logging.Logger
	cfg   *config.Config
	store StorageClient
	repo  repositories.SignatureRepository
}

// NewSignatureHandlers cria uma nova instância dos handlers de assinatura
func NewSignatureHandlers(sigSvc *services.SignatureService, log logging.Logger, cfg *config.Config, store StorageClient, repo repositories.SignatureRepository) *SignatureHandlers {
	return &SignatureHandlers{sigSvc: sigSvc, log: log, cfg: cfg, store: store, repo: repo}
}

// UploadSignature recebe um arquivo PNG (campo "file"), valida e retorna metadados
// Requer autenticação (middleware SupabaseAuth) e respeita limite de 2MB.
func (h *SignatureHandlers) UploadSignature(w http.ResponseWriter, r *http.Request) {
	userID, ok := h.getUserID(r)
	if !ok {
		h.jsonError(w, http.StatusUnauthorized, "usuário não autenticado")
		return
	}

	// Limite seguro para multipart (3MB) – serviço valida 2MB
	err := r.ParseMultipartForm(3 * 1024 * 1024)
	if err != nil {
		h.jsonError(w, http.StatusBadRequest, "falha ao processar formulário de upload")
		return
	}

	file, header, err := r.FormFile("file")
	if err != nil {
		h.jsonError(w, http.StatusBadRequest, "arquivo não encontrado no campo 'file'")
		return
	}
	defer file.Close()

	// Lê até 2MB + 1 para detectar excesso
	maxPlus := services.MaxSignatureSize + 1
	limited := io.LimitedReader{R: file, N: maxPlus}
	b, _ := io.ReadAll(&limited)
	if int64(len(b)) > services.MaxSignatureSize {
		h.jsonError(w, http.StatusBadRequest, "arquivo excede 2MB")
		return
	}

	width, height, sha256hex, contentType, err := h.sigSvc.ValidatePNG(b)
	if err != nil {
		h.jsonError(w, http.StatusBadRequest, err.Error())
		return
	}

	// Faz upload do arquivo para o Supabase Storage
	objectPath := fmt.Sprintf("%s/%s_%d.png", userID.String(), sha256hex[:12], time.Now().UTC().Unix())
	if err := h.store.UploadObject(r.Context(), h.cfg.BucketSigns, objectPath, b, contentType); err != nil {
		h.log.Error("erro ao fazer upload para Storage", logging.Field{Key: "error", Val: err.Error()})
		h.jsonError(w, http.StatusInternalServerError, "falha ao armazenar a assinatura")
		return
	}

	meta := models.SignatureMetadata{
		OwnerID:     userID.String(),
		FileName:    header.Filename,
		Size:        int64(len(b)),
		Width:       width,
		Height:      height,
		Hash:        sha256hex,
		ContentType: contentType,
		StoragePath: objectPath,
		CreatedAt:   time.Now().UTC(),
		Version:     1,
	}

	// Persiste metadados no banco (rf_signatures)
	rec := &models.SignatureRecord{
		OwnerID:  userID,
		FilePath: objectPath,
		FileName: header.Filename,
		FileSize: int64(len(b)),
		MimeType: contentType,
		WidthPX:  width,
		HeightPX: height,
		Hash:     sha256hex,
		Version:  1,
	}
	if err := h.repo.Create(r.Context(), rec); err != nil {
		// Compensação: remover objeto do Storage se persistência falhar
		if derr := h.store.DeleteObject(r.Context(), h.cfg.BucketSigns, objectPath); derr != nil {
			h.log.Error("falha ao deletar objeto no Storage após erro de persistência", logging.Field{Key: "error", Val: derr.Error()}, logging.Field{Key: "objectPath", Val: objectPath})
		}
		h.log.Error("erro ao persistir metadados de assinatura", logging.Field{Key: "error", Val: err.Error()})
		h.jsonError(w, http.StatusInternalServerError, "falha ao persistir metadados da assinatura")
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]any{
		"status":    "uploaded",
		"metadata":  meta,
	})
}

// Métodos auxiliares

func (h *SignatureHandlers) getUserID(r *http.Request) (uuid.UUID, bool) {
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

func (h *SignatureHandlers) jsonError(w http.ResponseWriter, statusCode int, message string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	json.NewEncoder(w).Encode(map[string]string{"error": message})
}
