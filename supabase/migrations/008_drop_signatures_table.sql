-- MIT License
-- Autor atual: David Assef
-- Descrição: Remove a tabela duplicada 'signatures' e artefatos relacionados
-- Data: 03-09-2025

-- Remove políticas (se existirem)
DROP POLICY IF EXISTS "Users can view own signatures" ON signatures;
DROP POLICY IF EXISTS "Users can insert own signatures" ON signatures;
DROP POLICY IF EXISTS "Users can update own signatures" ON signatures;
DROP POLICY IF EXISTS "Users can delete own signatures" ON signatures;

-- Remove triggers (se existirem)
DROP TRIGGER IF EXISTS update_signatures_updated_at ON signatures;
DROP TRIGGER IF EXISTS ensure_single_active_signature_trigger ON signatures;

-- Remove funções auxiliares (se existirem)
DROP FUNCTION IF EXISTS ensure_single_active_signature();

-- Remove a tabela se existir
DROP TABLE IF EXISTS signatures CASCADE;
