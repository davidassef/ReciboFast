// MIT License
// Autor atual: David Assef
// Descrição: Cliente mínimo para Supabase Storage via REST
// Data: 03-09-2025

package storage

import (
	"bytes"
	"context"
	"errors"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	"recibofast/internal/config"
)

// Client provê operações básicas no Supabase Storage via REST.
// Docstring: usa Service Role Key para upload em buckets privados. Em PT-BR.

type Client struct {
	baseURL    string
	serviceKey string
	hc         *http.Client
}

// DeleteObject remove um objeto do bucket/caminho informado.
// Docstring: usado como compensação quando a persistência falha após upload.
func (c *Client) DeleteObject(ctx context.Context, bucket, objectPath string) error {
    if c.baseURL == "" || c.serviceKey == "" {
        return errors.New("configuração do Supabase Storage ausente (SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY)")
    }
    if bucket == "" || objectPath == "" {
        return errors.New("bucket ou caminho do objeto não informado")
    }

    url := fmt.Sprintf("%s/storage/v1/object/%s/%s", c.baseURL, bucket, objectPath)
    req, err := http.NewRequestWithContext(ctx, http.MethodDelete, url, nil)
    if err != nil { return err }
    req.Header.Set("Authorization", "Bearer "+c.serviceKey)

    resp, err := c.hc.Do(req)
    if err != nil { return err }
    defer resp.Body.Close()

    if resp.StatusCode >= 200 && resp.StatusCode < 300 {
        return nil
    }
    b, _ := io.ReadAll(resp.Body)
    return fmt.Errorf("falha ao deletar objeto no Storage: status=%d body=%s", resp.StatusCode, string(b))
}

// NewClient cria um cliente de Storage a partir da configuração.
func NewClient(cfg *config.Config) *Client {
	return &Client{
		baseURL:    strings.TrimRight(cfg.SupabaseURL, "/"),
		serviceKey: cfg.SupabaseServiceRoleKey,
		hc: &http.Client{Timeout: 20 * time.Second},
	}
}

// UploadObject envia um objeto para o bucket/caminho informado.
// contentType deve ser um MIME válido (ex.: image/png).
func (c *Client) UploadObject(ctx context.Context, bucket, objectPath string, content []byte, contentType string) error {
	if c.baseURL == "" || c.serviceKey == "" {
		return errors.New("configuração do Supabase Storage ausente (SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY)")
	}
	if bucket == "" || objectPath == "" {
		return errors.New("bucket ou caminho do objeto não informado")
	}

	url := fmt.Sprintf("%s/storage/v1/object/%s/%s", c.baseURL, bucket, objectPath)
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, url, io.NopCloser(bytes.NewReader(content)))
	if err != nil { return err }
	req.Header.Set("Authorization", "Bearer "+c.serviceKey)
	req.Header.Set("Content-Type", contentType)

	resp, err := c.hc.Do(req)
	if err != nil { return err }
	defer resp.Body.Close()

	if resp.StatusCode >= 200 && resp.StatusCode < 300 {
		return nil
	}
	b, _ := io.ReadAll(resp.Body)
	return fmt.Errorf("falha no upload para Storage: status=%d body=%s", resp.StatusCode, string(b))
}
