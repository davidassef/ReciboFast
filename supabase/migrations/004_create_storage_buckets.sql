-- MIT License
-- Autor atual: David Assef
-- Descrição: Criação dos buckets de storage para assinaturas e recibos
-- Data: 29-08-2025

-- Criar bucket para assinaturas
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'signatures',
  'signatures',
  false,
  5242880, -- 5MB
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml']
) ON CONFLICT (id) DO NOTHING;

-- Criar bucket para recibos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'receipts',
  'receipts',
  false,
  10485760, -- 10MB
  ARRAY['application/pdf']
) ON CONFLICT (id) DO NOTHING;

-- Políticas RLS para bucket signatures
CREATE POLICY "signatures_select" ON storage.objects
FOR SELECT USING (
  bucket_id = 'signatures' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "signatures_insert" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'signatures' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "signatures_update" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'signatures' AND 
  auth.uid()::text = (storage.foldername(name))[1]
) WITH CHECK (
  bucket_id = 'signatures' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "signatures_delete" ON storage.objects
FOR DELETE USING (
  bucket_id = 'signatures' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Políticas RLS para bucket receipts
CREATE POLICY "receipts_select" ON storage.objects
FOR SELECT USING (
  bucket_id = 'receipts' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "receipts_insert" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'receipts' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "receipts_update" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'receipts' AND 
  auth.uid()::text = (storage.foldername(name))[1]
) WITH CHECK (
  bucket_id = 'receipts' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "receipts_delete" ON storage.objects
FOR DELETE USING (
  bucket_id = 'receipts' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Permissões são gerenciadas automaticamente pelo Supabase Storage
-- As políticas RLS acima controlam o acesso aos objetos