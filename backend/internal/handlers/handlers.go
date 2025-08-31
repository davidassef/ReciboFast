// MIT License
// Autor atual: David Assef
// Descrição: Montagem de handlers e utilitários comuns
// Data: 29-08-2025

package handlers

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"

	"recibofast/internal/config"
	ctxhelper "recibofast/internal/context"
	"recibofast/internal/logging"
	"recibofast/internal/services"
)

type Deps struct {
	Logger  logging.Logger
	DB      *pgxpool.Pool
	Cfg     *config.Config
}

type Handlers struct {
	log     logging.Logger
	DB      *pgxpool.Pool
	Cfg     *config.Config
	SyncSvc *services.SyncService
}

func NewHandlers(d Deps) *Handlers {
	return &Handlers{
		log:     d.Logger,
		DB:      d.DB,
		Cfg:     d.Cfg,
		SyncSvc: services.NewSyncService(d.DB),
	}
}

func (h *Handlers) jsonError(w http.ResponseWriter, code int, msg string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	_ = jsonEncode(w, map[string]string{"error": msg})
}

// AuthUser obtém o user_id do contexto (middleware de auth)
func (h *Handlers) AuthUser(ctx context.Context) (string, bool) {
	// Usa a função helper do pacote context
	userID, ok := ctxhelper.GetUserID(ctx)
	h.log.Debug("AuthUser: verificando contexto", logging.Field{Key: "user_id", Val: userID}, logging.Field{Key: "found", Val: fmt.Sprintf("%v", ok)})
	return userID, ok
}

func (h *Handlers) parseLimit(v string, def int) int {
	if v == "" { return def }
	i, err := strconv.Atoi(v)
	if err != nil || i <= 0 || i > 1000 { return def }
	return i
}

// util: retorna um RFC3339 com fuso fixo se necessário
func (h *Handlers) rfc3339(t time.Time) string { return t.UTC().Format(time.RFC3339) }

// jsonEncode é um helper fino para codificar respostas JSON usando a stdlib.
func jsonEncode(w http.ResponseWriter, v interface{}) error {
	return json.NewEncoder(w).Encode(v)
}
