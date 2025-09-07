-- MIT License
-- Autor: David Assef
-- Descrição: Adiciona flag de recorrência em contratos para automação de recibos
-- Data: 07-09-2025

-- Campo para habilitar recorrência (vencimento_dia já existe em 001_init.sql)
ALTER TABLE IF EXISTS rf_contracts
  ADD COLUMN IF NOT EXISTS recurrence_enabled boolean DEFAULT false;

-- Índice auxiliar por dono + recorrência
CREATE INDEX IF NOT EXISTS idx_contracts_owner_recurrence
  ON rf_contracts(owner_id, recurrence_enabled);

-- Comentários
COMMENT ON COLUMN rf_contracts.recurrence_enabled IS 'Quando true, gera recibo automaticamente 10 dias antes de vencimento_dia, via Edge Function';
