// MIT License
// Autor atual: David Assef
// Descrição: Serviço de validação e extração de metadados de assinaturas (PNG)
// Data: 03-09-2025

package services

import (
	"bytes"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"image/png"
)

// SignatureService provê validação e metadados para imagens de assinatura.
// Docstring: Valida PNG até 2MB, retorna dimensões, hash e content-type.
// Tudo em PT-BR.

type SignatureService struct{}

func NewSignatureService() *SignatureService { return &SignatureService{} }

// MaxSignatureSize define o tamanho máximo do arquivo de assinatura (2MB)
const MaxSignatureSize int64 = 2 * 1024 * 1024 // 2MB

// ValidatePNG valida os bytes de uma imagem PNG e retorna dimensões e hash.
// Parâmetros:
// - data: conteúdo bruto do arquivo PNG
// Retorno:
// - width, height: dimensões em pixels
// - sha256hex: hash do conteúdo em hexadecimal
// - contentType: sempre "image/png" quando válido
// - err: erro de validação, se houver
func (s *SignatureService) ValidatePNG(data []byte) (width int, height int, sha256hex string, contentType string, err error) {
	if int64(len(data)) == 0 {
		return 0, 0, "", "", errors.New("arquivo vazio")
	}
	if int64(len(data)) > MaxSignatureSize {
		return 0, 0, "", "", errors.New("arquivo excede 2MB")
	}

	// Decodifica cabeçalho para obter dimensões (apenas PNG)
	cfg, err := png.DecodeConfig(bytes.NewReader(data))
	if err != nil {
		return 0, 0, "", "", errors.New("apenas arquivos PNG válidos são aceitos")
	}

	// Calcula SHA-256 do conteúdo
	sum := sha256.Sum256(data)
	sha256hex = hex.EncodeToString(sum[:])

	return cfg.Width, cfg.Height, sha256hex, "image/png", nil
}
