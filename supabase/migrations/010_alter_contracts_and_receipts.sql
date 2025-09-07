-- MIT License
-- Autor: David Assef
-- Descrição: Adiciona colunas extras em rf_contracts e vínculo contract_id em rf_receipts
-- Data: 07-09-2025

-- rf_contracts: colunas extras usadas na UI
ALTER TABLE IF EXISTS rf_contracts
  ADD COLUMN IF NOT EXISTS numero TEXT,
  ADD COLUMN IF NOT EXISTS tipo TEXT,
  ADD COLUMN IF NOT EXISTS data_inicio DATE,
  ADD COLUMN IF NOT EXISTS data_fim DATE,
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'ativo',
  ADD COLUMN IF NOT EXISTS issuer_name TEXT,
  ADD COLUMN IF NOT EXISTS issuer_document TEXT;

-- Índices auxiliares
CREATE INDEX IF NOT EXISTS idx_contracts_status ON rf_contracts(status);
CREATE INDEX IF NOT EXISTS idx_contracts_vencimento ON rf_contracts(vencimento_dia);

-- Comentários
COMMENT ON COLUMN rf_contracts.numero IS 'Identificador do contrato exibido na UI';
COMMENT ON COLUMN rf_contracts.tipo IS 'Tipo do contrato (Aluguel, Serviços, etc.)';
COMMENT ON COLUMN rf_contracts.data_inicio IS 'Data de início do contrato';
COMMENT ON COLUMN rf_contracts.data_fim IS 'Data de término do contrato';
COMMENT ON COLUMN rf_contracts.status IS 'Status textual (ativo, inativo, vencido)';
COMMENT ON COLUMN rf_contracts.issuer_name IS 'Nome do emissor alternativo (quando emitir em nome de outra pessoa)';
COMMENT ON COLUMN rf_contracts.issuer_document IS 'Documento do emissor alternativo';

-- rf_receipts: vínculo opcional com contrato
ALTER TABLE IF EXISTS rf_receipts
  ADD COLUMN IF NOT EXISTS contract_id uuid REFERENCES rf_contracts(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_receipts_contract_id ON rf_receipts(contract_id);
