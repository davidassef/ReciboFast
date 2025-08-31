-- Autor: David Assef
-- Descrição: Criação da tabela de assinaturas para o sistema ReciboFast
-- Licença: MIT License
-- Data: 30-08-2025

-- Criar tabela de assinaturas
CREATE TABLE IF NOT EXISTS signatures (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL UNIQUE,
    file_size INTEGER NOT NULL CHECK (file_size > 0),
    mime_type TEXT NOT NULL CHECK (mime_type = 'image/png'),
    width INTEGER NOT NULL CHECK (width > 0),
    height INTEGER NOT NULL CHECK (height > 0),
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_signatures_user_id ON signatures(user_id);
CREATE INDEX IF NOT EXISTS idx_signatures_is_active ON signatures(is_active);
CREATE INDEX IF NOT EXISTS idx_signatures_created_at ON signatures(created_at DESC);

-- Criar índice único para garantir apenas uma assinatura ativa por usuário
CREATE UNIQUE INDEX IF NOT EXISTS idx_signatures_user_active 
ON signatures(user_id) 
WHERE is_active = true;

-- Habilitar RLS (Row Level Security)
ALTER TABLE signatures ENABLE ROW LEVEL SECURITY;

-- Política para usuários autenticados poderem ver apenas suas próprias assinaturas
CREATE POLICY "Users can view own signatures" ON signatures
    FOR SELECT USING (auth.uid() = user_id);

-- Política para usuários autenticados poderem inserir suas próprias assinaturas
CREATE POLICY "Users can insert own signatures" ON signatures
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Política para usuários autenticados poderem atualizar suas próprias assinaturas
CREATE POLICY "Users can update own signatures" ON signatures
    FOR UPDATE USING (auth.uid() = user_id);

-- Política para usuários autenticados poderem deletar suas próprias assinaturas
CREATE POLICY "Users can delete own signatures" ON signatures
    FOR DELETE USING (auth.uid() = user_id);

-- Função para atualizar o campo updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para atualizar updated_at automaticamente
CREATE TRIGGER update_signatures_updated_at 
    BEFORE UPDATE ON signatures 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Função para garantir apenas uma assinatura ativa por usuário
CREATE OR REPLACE FUNCTION ensure_single_active_signature()
RETURNS TRIGGER AS $$
BEGIN
    -- Se a nova assinatura está sendo marcada como ativa
    IF NEW.is_active = true THEN
        -- Desativar todas as outras assinaturas do mesmo usuário
        UPDATE signatures 
        SET is_active = false 
        WHERE user_id = NEW.user_id AND id != NEW.id;
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para garantir apenas uma assinatura ativa por usuário
CREATE TRIGGER ensure_single_active_signature_trigger
    BEFORE INSERT OR UPDATE ON signatures
    FOR EACH ROW
    EXECUTE FUNCTION ensure_single_active_signature();

-- Comentários para documentação
COMMENT ON TABLE signatures IS 'Tabela para armazenar metadados das assinaturas dos usuários';
COMMENT ON COLUMN signatures.id IS 'Identificador único da assinatura';
COMMENT ON COLUMN signatures.user_id IS 'ID do usuário proprietário da assinatura';
COMMENT ON COLUMN signatures.file_name IS 'Nome original do arquivo de assinatura';
COMMENT ON COLUMN signatures.file_path IS 'Caminho do arquivo no Supabase Storage';
COMMENT ON COLUMN signatures.file_size IS 'Tamanho do arquivo em bytes';
COMMENT ON COLUMN signatures.mime_type IS 'Tipo MIME do arquivo (apenas image/png permitido)';
COMMENT ON COLUMN signatures.width IS 'Largura da imagem em pixels';
COMMENT ON COLUMN signatures.height IS 'Altura da imagem em pixels';
COMMENT ON COLUMN signatures.is_active IS 'Indica se esta é a assinatura ativa do usuário';
COMMENT ON COLUMN signatures.created_at IS 'Data e hora de criação do registro';
COMMENT ON COLUMN signatures.updated_at IS 'Data e hora da última atualização do registro';