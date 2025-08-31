-- Migração para corrigir RLS e permissões das tabelas rf_*
-- Autor: David Assef
-- Data: 29-08-2025
-- Descrição: Habilita RLS em rf_profiles e garante permissões corretas para todas as tabelas

-- Habilitar RLS na tabela rf_profiles
ALTER TABLE rf_profiles ENABLE ROW LEVEL SECURITY;

-- Criar política RLS para rf_profiles (estava faltando)
CREATE POLICY "profiles_isolate" ON rf_profiles
    FOR ALL USING (id = auth.uid());

-- Verificar e garantir permissões para as roles anon e authenticated
-- Tabela rf_profiles
GRANT SELECT, INSERT, UPDATE, DELETE ON rf_profiles TO authenticated;
GRANT SELECT ON rf_profiles TO anon;

-- Tabela rf_payers
GRANT SELECT, INSERT, UPDATE, DELETE ON rf_payers TO authenticated;
GRANT SELECT ON rf_payers TO anon;

-- Tabela rf_contracts
GRANT SELECT, INSERT, UPDATE, DELETE ON rf_contracts TO authenticated;
GRANT SELECT ON rf_contracts TO anon;

-- Tabela rf_incomes
GRANT SELECT, INSERT, UPDATE, DELETE ON rf_incomes TO authenticated;
GRANT SELECT ON rf_incomes TO anon;

-- Tabela rf_payments
GRANT SELECT, INSERT, UPDATE, DELETE ON rf_payments TO authenticated;
GRANT SELECT ON rf_payments TO anon;

-- Tabela rf_receipts
GRANT SELECT, INSERT, UPDATE, DELETE ON rf_receipts TO authenticated;
GRANT SELECT ON rf_receipts TO anon;

-- Tabela rf_signatures
GRANT SELECT, INSERT, UPDATE, DELETE ON rf_signatures TO authenticated;
GRANT SELECT ON rf_signatures TO anon;

-- Tabela rf_settings
GRANT SELECT, INSERT, UPDATE, DELETE ON rf_settings TO authenticated;
GRANT SELECT ON rf_settings TO anon;

-- Garantir acesso à sequência rf_receipts_numero_seq
GRANT USAGE, SELECT ON SEQUENCE rf_receipts_numero_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE rf_receipts_numero_seq TO anon;

-- Comentário final
COMMENT ON TABLE rf_profiles IS 'Perfis de usuário com RLS habilitado';