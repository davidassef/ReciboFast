-- MIT License
-- Autor atual: David Assef
-- Descrição: Script de validação das políticas RLS para tabelas rf_*
-- Data: 29-08-2025

-- Este script testa se as políticas RLS estão funcionando corretamente
-- Deve ser executado com diferentes contextos de usuário para validar isolamento

-- Verificar se RLS está habilitado em todas as tabelas rf_*
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled,
    CASE 
        WHEN rowsecurity THEN '✅ RLS Habilitado'
        ELSE '❌ RLS Desabilitado'
    END as status
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename LIKE 'rf_%'
ORDER BY tablename;

-- Verificar políticas existentes para tabelas rf_*
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public' 
    AND tablename LIKE 'rf_%'
ORDER BY tablename, policyname;

-- Verificar permissões das roles nas tabelas rf_*
SELECT 
    grantee,
    table_name,
    privilege_type
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
    AND table_name LIKE 'rf_%'
    AND grantee IN ('anon', 'authenticated')
ORDER BY table_name, grantee, privilege_type;

-- Verificar se as sequências têm permissões corretas
SELECT 
    grantee,
    object_name,
    privilege_type
FROM information_schema.role_usage_grants 
WHERE object_schema = 'public' 
    AND object_name LIKE 'rf_%seq'
    AND grantee IN ('anon', 'authenticated')
ORDER BY object_name, grantee;

-- Verificar buckets de storage
SELECT 
    id,
    name,
    public,
    file_size_limit,
    allowed_mime_types
FROM storage.buckets 
WHERE id IN ('signatures', 'receipts');

-- Verificar políticas de storage
SELECT 
    policyname,
    cmd,
    permissive,
    roles,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'storage' 
    AND tablename = 'objects'
    AND policyname LIKE '%signatures%' OR policyname LIKE '%receipts%'
ORDER BY policyname;