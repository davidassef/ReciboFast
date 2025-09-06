// MIT License
// Autor atual: David Assef
// Descrição: Modelos de dados para assinaturas (signatures)
// Data: 03-09-2025

package models

import (
 "time"
 "github.com/google/uuid"
)

// SignatureMetadata representa os metadados de uma assinatura armazenada.
// Docstring: Estrutura com informações essenciais para validação e auditoria.
// - OwnerID: identificador do usuário (auth.uid())
// - FileName: nome do arquivo enviado
// - Size: tamanho do arquivo em bytes
// - Width/Height: dimensões da imagem
// - Hash: hash SHA-256 do conteúdo
// - ContentType: tipo MIME do arquivo
// - StoragePath: caminho do objeto no bucket
// - CreatedAt: timestamp de criação
// - Version: número da versão do artefato
// - Notes: observações opcionais
// Tudo em PT-BR.

type SignatureMetadata struct {
	OwnerID     string    `json:"owner_id"`
	FileName    string    `json:"file_name"`
	Size        int64     `json:"size"`
	Width       int       `json:"width"`
	Height      int       `json:"height"`
	Hash        string    `json:"hash"`
	ContentType string    `json:"content_type"`
	StoragePath string    `json:"storage_path"`
	CreatedAt   time.Time `json:"created_at"`
	Version     int       `json:"version"`
	Notes       string    `json:"notes,omitempty"`
}

// SignatureRecord representa o registro persistido em `rf_signatures` no banco
// Docstring: Estrutura refletindo colunas da tabela para inserção via repositório
type SignatureRecord struct {
	ID        uuid.UUID
	OwnerID   uuid.UUID
	FilePath  string
	FileName  string
	FileSize  int64
	MimeType  string
	WidthPX   int
	HeightPX  int
	Hash      string
	Version   int
}
