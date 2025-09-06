// MIT License
// Autor atual: David Assef
// Descrição: Testes unitários para SignatureService.ValidatePNG
// Data: 03-09-2025

package services

import (
	"bytes"
	"image"
	"image/color"
	"image/png"
	"strings"
	"testing"
)

func TestValidatePNG_Success(t *testing.T) {
	img := image.NewRGBA(image.Rect(0, 0, 2, 3))
	// pinta um pixel para evitar otimizações
	img.Set(0, 0, color.RGBA{R: 1, G: 2, B: 3, A: 255})
	var buf bytes.Buffer
	if err := png.Encode(&buf, img); err != nil {
		t.Fatalf("falha ao gerar PNG de teste: %v", err)
	}

	svc := NewSignatureService()
	w, h, sha, ct, err := svc.ValidatePNG(buf.Bytes())
	if err != nil {
		t.Fatalf("ValidatePNG retornou erro inesperado: %v", err)
	}
	if w != 2 || h != 3 {
		t.Fatalf("dimensões incorretas: got %dx%d", w, h)
	}
	if ct != "image/png" {
		t.Fatalf("contentType incorreto: %s", ct)
	}
	if sha == "" {
		t.Fatalf("hash não deve ser vazio")
	}
}

func TestValidatePNG_TooLarge(t *testing.T) {
	data := make([]byte, MaxSignatureSize+1)
	svc := NewSignatureService()
	_, _, _, _, err := svc.ValidatePNG(data)
	if err == nil {
		t.Fatalf("esperava erro de tamanho excedido")
	}
	if !strings.Contains(err.Error(), "excede 2MB") {
		t.Fatalf("mensagem de erro esperada conter 'excede 2MB', got: %v", err)
	}
}

func TestValidatePNG_InvalidPNG(t *testing.T) {
	svc := NewSignatureService()
	_, _, _, _, err := svc.ValidatePNG([]byte("not a png"))
	if err == nil {
		t.Fatalf("esperava erro para PNG inválido")
	}
	if !strings.Contains(err.Error(), "apenas arquivos PNG") {
		t.Fatalf("mensagem de erro esperada conter 'apenas arquivos PNG', got: %v", err)
	}
}
