// MIT License
// Autor atual: David Assef
// Descrição: Handler de healthcheck do backend ReciboFast
// Data: 29-08-2025

package handlers

import (
	"net/http"
)

// Health responde com 200 para verificações simples de vida.
func (h *Handlers) Health(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(http.StatusOK)
	_, _ = w.Write([]byte("ok"))
}
