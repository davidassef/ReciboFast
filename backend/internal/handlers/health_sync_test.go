// MIT License
// Autor atual: David Assef
// Descrição: Testes dos handlers /healthz e /api/v1/sync/changes
// Data: 04-09-2025

package handlers

import (
    "encoding/json"
    "io"
    "net/http"
    "net/http/httptest"
    "testing"
    "time"

    "recibofast/internal/config"
    ctxhelper "recibofast/internal/context"
    "recibofast/internal/logging"
)

type healthSyncDeps struct{}

func newHandlersForTest(t *testing.T) *Handlers {
    t.Helper()
    logger := logging.NewLogger("dev")
    cfg := config.FromEnv()
    return NewHandlers(Deps{Logger: logger, DB: nil, Cfg: cfg})
}

func TestHealthOK(t *testing.T) {
    h := newHandlersForTest(t)
    rr := httptest.NewRecorder()
    req := httptest.NewRequest(http.MethodGet, "/healthz", nil)

    h.Health(rr, req)

    if rr.Code != http.StatusOK {
        t.Fatalf("status code = %d, want %d", rr.Code, http.StatusOK)
    }
    body, _ := io.ReadAll(rr.Body)
    if string(body) != "ok" {
        t.Fatalf("body = %q, want %q", string(body), "ok")
    }
}

func TestSyncChanges_InvalidSince(t *testing.T) {
    h := newHandlersForTest(t)

    req := httptest.NewRequest(http.MethodGet, "/api/v1/sync/changes?since=invalid", nil)
    req = req.WithContext(ctxhelper.SetUserID(req.Context(), "00000000-0000-0000-0000-000000000001"))
    rr := httptest.NewRecorder()

    h.SyncChanges(rr, req)

    if rr.Code != http.StatusBadRequest {
        t.Fatalf("status code = %d, want %d", rr.Code, http.StatusBadRequest)
    }
}

func TestSyncChanges_NotModifiedWithMatchingETag(t *testing.T) {
    h := newHandlersForTest(t)

    since := time.Now().Add(-10 * time.Minute).UTC().Format(time.RFC3339)

    // Primeira chamada para obter o ETag
    req1 := httptest.NewRequest(http.MethodGet, "/api/v1/sync/changes?since="+since+"&limit=10", nil)
    req1 = req1.WithContext(ctxhelper.SetUserID(req1.Context(), "00000000-0000-0000-0000-000000000001"))
    rr1 := httptest.NewRecorder()
    h.SyncChanges(rr1, req1)

    if rr1.Code != http.StatusOK {
        t.Fatalf("primeira chamada status = %d, want %d", rr1.Code, http.StatusOK)
    }
    etag := rr1.Header().Get("ETag")
    if etag == "" {
        t.Fatalf("ETag vazio na primeira resposta")
    }

    // Segunda chamada com If-None-Match igual ao ETag
    req2 := httptest.NewRequest(http.MethodGet, "/api/v1/sync/changes?since="+since+"&limit=10", nil)
    req2 = req2.WithContext(ctxhelper.SetUserID(req2.Context(), "00000000-0000-0000-0000-000000000001"))
    req2.Header.Set("If-None-Match", etag)
    rr2 := httptest.NewRecorder()
    h.SyncChanges(rr2, req2)

    if rr2.Code != http.StatusNotModified {
        t.Fatalf("segunda chamada status = %d, want %d", rr2.Code, http.StatusNotModified)
    }
}

func TestSyncChanges_OKPayload(t *testing.T) {
    h := newHandlersForTest(t)
    since := time.Now().Add(-1 * time.Hour).UTC().Format(time.RFC3339)

    req := httptest.NewRequest(http.MethodGet, "/api/v1/sync/changes?since="+since+"&limit=5", nil)
    req = req.WithContext(ctxhelper.SetUserID(req.Context(), "00000000-0000-0000-0000-000000000001"))
    rr := httptest.NewRecorder()

    h.SyncChanges(rr, req)

    if rr.Code != http.StatusOK {
        t.Fatalf("status code = %d, want %d", rr.Code, http.StatusOK)
    }
    if rr.Header().Get("ETag") == "" {
        t.Fatalf("ETag header não encontrado")
    }
    var body struct{
        Changes map[string]any `json:"changes"`
        Next    string        `json:"next_cursor"`
    }
    if err := json.NewDecoder(rr.Body).Decode(&body); err != nil {
        t.Fatalf("falha ao decodificar body: %v", err)
    }
    if body.Changes == nil {
        t.Fatalf("payload changes ausente")
    }
}
