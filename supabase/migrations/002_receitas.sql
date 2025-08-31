-- MIT License
-- Autor: David Assef
-- Descrição: Migração para criar tabela receitas com RLS
-- Data: 20-01-2025

-- Criar tabela receitas
CREATE TABLE IF NOT EXISTS receitas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    titulo VARCHAR(255) NOT NULL,
    descricao TEXT,
    valor DECIMAL(10,2) NOT NULL CHECK (valor > 0),
    data_vencimento DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'pendente' CHECK (status IN ('pendente', 'pago', 'vencido')),
    cliente_id UUID,
    cliente_nome VARCHAR(255),
    categoria VARCHAR(100),
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    synced_at TIMESTAMP WITH TIME ZONE
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_receitas_user_id ON receitas(user_id);
CREATE INDEX IF NOT EXISTS idx_receitas_status ON receitas(status);
CREATE INDEX IF NOT EXISTS idx_receitas_data_vencimento ON receitas(data_vencimento);
CREATE INDEX IF NOT EXISTS idx_receitas_cliente_id ON receitas(cliente_id);
CREATE INDEX IF NOT EXISTS idx_receitas_created_at ON receitas(created_at);

-- Habilitar RLS (Row Level Security)
ALTER TABLE receitas ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para receitas
CREATE POLICY "Users can view own receitas" ON receitas
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own receitas" ON receitas
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own receitas" ON receitas
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own receitas" ON receitas
    FOR DELETE USING (auth.uid() = user_id);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para atualizar updated_at automaticamente
CREATE TRIGGER update_receitas_updated_at
    BEFORE UPDATE ON receitas
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Conceder permissões para roles anon e authenticated
GRANT SELECT, INSERT, UPDATE, DELETE ON receitas TO authenticated;
GRANT SELECT ON receitas TO anon;

-- Comentários para documentação
COMMENT ON TABLE receitas IS 'Tabela para armazenar receitas dos usuários';
COMMENT ON COLUMN receitas.id IS 'Identificador único da receita';
COMMENT ON COLUMN receitas.user_id IS 'ID do usuário proprietário da receita';
COMMENT ON COLUMN receitas.titulo IS 'Título/nome da receita';
COMMENT ON COLUMN receitas.descricao IS 'Descrição detalhada da receita';
COMMENT ON COLUMN receitas.valor IS 'Valor da receita em decimal';
COMMENT ON COLUMN receitas.data_vencimento IS 'Data de vencimento da receita';
COMMENT ON COLUMN receitas.status IS 'Status da receita: pendente, pago ou vencido';
COMMENT ON COLUMN receitas.cliente_id IS 'ID do cliente (referência futura)';
COMMENT ON COLUMN receitas.cliente_nome IS 'Nome do cliente';
COMMENT ON COLUMN receitas.categoria IS 'Categoria da receita';
COMMENT ON COLUMN receitas.observacoes IS 'Observações adicionais';
COMMENT ON COLUMN receitas.created_at IS 'Data de criação do registro';
COMMENT ON COLUMN receitas.updated_at IS 'Data da última atualização';
COMMENT ON COLUMN receitas.synced_at IS 'Data da última sincronização';