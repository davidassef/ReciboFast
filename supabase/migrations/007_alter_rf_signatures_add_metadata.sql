-- MIT License
-- Autor atual: David Assef
-- Descrição: Adiciona colunas de metadados à tabela rf_signatures e cria índices
-- Data: 03-09-2025

-- Adiciona colunas de metadados (permitindo NULL para compatibilidade retroativa)
ALTER TABLE rf_signatures
  ADD COLUMN IF NOT EXISTS file_name TEXT,
  ADD COLUMN IF NOT EXISTS file_size BIGINT CHECK (file_size IS NULL OR file_size > 0),
  ADD COLUMN IF NOT EXISTS mime_type TEXT CHECK (mime_type IS NULL OR mime_type = 'image/png'),
  ADD COLUMN IF NOT EXISTS hash TEXT,
  ADD COLUMN IF NOT EXISTS version INT DEFAULT 1;

-- Índices úteis
CREATE INDEX IF NOT EXISTS idx_rf_signatures_owner ON rf_signatures(owner_id);
CREATE INDEX IF NOT EXISTS idx_rf_signatures_created_at ON rf_signatures(created_at DESC);

-- Comentários
COMMENT ON COLUMN rf_signatures.file_name IS 'Nome original do arquivo de assinatura';
COMMENT ON COLUMN rf_signatures.file_size IS 'Tamanho do arquivo em bytes';
COMMENT ON COLUMN rf_signatures.mime_type IS 'Tipo MIME do arquivo (apenas image/png permitido)';
COMMENT ON COLUMN rf_signatures.hash IS 'Hash SHA-256 do conteúdo para auditoria e deduplicação';
COMMENT ON COLUMN rf_signatures.version IS 'Versão do artefato de assinatura';
