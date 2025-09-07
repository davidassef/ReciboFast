-- MIT License
-- Autor atual: David Assef
-- Descrição: Adiciona colunas para referenciar assinaturas por ID em recibos e contratos
-- Data: 06-09-2025

-- rf_receipts: assinatura utilizada na emissão do recibo
ALTER TABLE IF EXISTS rf_receipts
  ADD COLUMN IF NOT EXISTS signature_id uuid REFERENCES rf_signatures(id) ON DELETE SET NULL;

-- rf_contracts: assinatura padrão sugerida para documentos do contrato
ALTER TABLE IF EXISTS rf_contracts
  ADD COLUMN IF NOT EXISTS default_signature_id uuid REFERENCES rf_signatures(id) ON DELETE SET NULL;

-- Índices auxiliares
CREATE INDEX IF NOT EXISTS idx_receipts_signature_id ON rf_receipts(signature_id);
CREATE INDEX IF NOT EXISTS idx_contracts_default_signature_id ON rf_contracts(default_signature_id);
