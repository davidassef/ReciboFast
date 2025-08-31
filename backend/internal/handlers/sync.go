// MIT License
// Autor atual: David Assef
// Descrição: Handler do endpoint de sincronização incremental
// Data: 29-08-2025

package handlers

import (
	"encoding/json"
	"net/http"
	"time"
)

// SyncChanges
// Docstring: Retorna alterações desde o parâmetro 'since' para reduzir payload; suporta ETag e paginação por cursor.
func (h *Handlers) SyncChanges(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()
	sinceStr := q.Get("since")
	var since time.Time
	var err error
	if sinceStr == "" {
		since = time.Now().Add(-24 * time.Hour)
	} else {
		since, err = time.Parse(time.RFC3339, sinceStr)
		if err != nil {
			h.jsonError(w, http.StatusBadRequest, "since inválido")
			return
		}
	}
	limit := h.parseLimit(q.Get("limit"), 100)
	cursor := q.Get("cursor")
	fields := q.Get("fields")

	uid, ok := h.AuthUser(r.Context())
	if !ok { h.jsonError(w, http.StatusUnauthorized, "não autorizado"); return }

	res, nextCursor, etag, err := h.SyncSvc.FetchChanges(r.Context(), uid, since, limit, cursor, fields)
	if err != nil { h.jsonError(w, http.StatusInternalServerError, err.Error()); return }

	if match := r.Header.Get("If-None-Match"); match != "" && match == etag {
		w.WriteHeader(http.StatusNotModified)
		return
	}
	w.Header().Set("ETag", etag)
	w.Header().Set("Content-Type", "application/json")

	_ = json.NewEncoder(w).Encode(struct{
		Changes interface{} `json:"changes"`
		Next   string      `json:"next_cursor,omitempty"`
	}{Changes: res, Next: nextCursor})
}
