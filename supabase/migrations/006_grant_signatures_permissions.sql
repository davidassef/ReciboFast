-- Migração: Conceder permissões para a tabela signatures
-- Autor: David Assef
-- Data: 21-01-2025
-- Descrição: Concede permissões adequadas aos roles anon e authenticated para a tabela signatures
-- MIT License

-- Conceder permissões SELECT para o role anon (usuários não autenticados)
-- Permite visualizar assinaturas públicas se necessário
GRANT SELECT ON signatures TO anon;

-- Conceder todas as permissões para o role authenticated (usuários autenticados)
-- Permite operações completas CRUD para usuários logados
GRANT ALL PRIVILEGES ON signatures TO authenticated;

-- Comentário sobre as permissões concedidas
COMMENT ON TABLE signatures IS 'Tabela para armazenar metadados das assinaturas dos usuários - Permissões: anon (SELECT), authenticated (ALL)';