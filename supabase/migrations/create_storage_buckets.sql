-- Autor: David Assef
-- Data: 20-01-2025
-- Descrição: Configuração dos buckets do Supabase Storage para assinaturas e recibos
-- MIT License

-- Criar bucket para assinaturas
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'signatures',
  'signatures',
  false,
  5242880, -- 5MB
  ARRAY['image/png', 'image/jpeg', 'image/jpg']
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