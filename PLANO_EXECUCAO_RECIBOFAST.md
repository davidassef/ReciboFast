# MIT License
# Autor atual: David Assef
# Descrição: Plano de execução com checklist e acompanhamento de progresso do ReciboFast
# Data: 07-09-2025

# PLANO DE EXECUÇÃO — ReciboFast

Documento vivo para acompanhar o progresso do desenvolvimento. Atualize os checkboxes e datas conforme avançar.

## Visão geral
- Objetivo: PWA para gestão de aluguéis e geração de recibos com assinatura, focado em performance em servidores freemium.
- Referência: `ARQUITETURA_RECIBOFAST` e `GUIA_EXECUCAO_RECIBOFAST.md`.

## Regras e DoD (Definition of Done)
- Código passa lint e testes
- Documentação e variáveis de ambiente atualizadas
- Logs mínimos adicionados (request-id, user_id)
- Sem credenciais em repositório

## Fase 0 — Preparação do ambiente ✅ CONCLUÍDA
[x] Criar projeto Supabase (URL/AnonKey) e buckets (signatures, receipts)
[x] Definir variáveis de ambiente (.env e .env.local)
[x] Configurar Docker Desktop
[x] Instalar Node/Angular/Ionic e Go 1.22+
[x] Criar repositório git e branch padrão `main`

Entrega: .envs prontos, projeto compila em branco (front/back) ✅

## Fase 1 — Banco de dados e RLS ✅ CONCLUÍDA
[x] Criar tabelas rf_* (profiles, payers, contracts, incomes, payments, receipts, signatures, settings)
[x] Índices compostos (owner_id, due_date/competencia)
[x] Policies RLS por owner_id = auth.uid()
[x] Buckets privados e policies
[x] Triggers para total_pago e timestamps

Entrega: migrations aplicadas, RLS validada com usuário de teste ✅

**Status Detalhado:**
- ✅ Schema completo das tabelas rf_* aplicado no Supabase
- ✅ Row Level Security (RLS) habilitado e configurado
- ✅ Políticas de isolamento por owner_id implementadas
- ✅ Índices de performance criados
- ✅ Triggers para updated_at e cálculo de total_pago
- ✅ Buckets de storage configurados (signatures, receipts)
- ✅ Políticas RLS para storage implementadas
- ✅ Permissões para roles authenticated e anon validadas

## Fase 2 — Backend Skeleton (Go) ✅ CONCLUÍDA
[x] main + router (chi), middlewares (recover, cors, gzip, rate limit, request-id)
[x] JWT Supabase (JWKS) e contexto com user_id
[x] Healthcheck `/healthz`
[x] Repositórios com pgxpool (pool baixo)
[x] Endpoint sync incremental GET `/api/v1/sync/changes`

Entrega: binário roda localmente; integração minimal com DB ✅

**Status Detalhado:**
- ✅ Servidor executando na porta 8080
- ✅ Middleware SupabaseAuth com validação JWKS
- ✅ Contexto de usuário implementado (pacote internal/context)
- ✅ Logs estruturados com zap
- ✅ Endpoint /api/v1/sync/changes testado e funcional
- ✅ Modo debug com header X-Debug-User
- ✅ Conexão com Supabase PostgreSQL configurada

## Fase 3 — Frontend Skeleton (React/Vite) ✅ CONCLUÍDA
[x] Estrutura de páginas (Dashboard, Receitas, Contratos, Recibos, Perfil)
[x] Auth Supabase (login Google/Email)
[x] PWA (SW ativo) e Tailwind CSS
[x] Estado global com Zustand

Entrega: navegação funcional e login básico ✅

**Status Detalhado:**
- ✅ Aplicação React com Vite e TypeScript
- ✅ Integração com Supabase Auth
- ✅ Roteamento com React Router
- ✅ UI com Tailwind CSS e shadcn/ui
- ✅ Estado global com Zustand
- ✅ Configuração PWA
- ✅ Estrutura de componentes e hooks

## Fase 4 — Receitas e Baixas ✅ CONCLUÍDA
[x] Modelos e validações no backend
[x] Repositórios e serviços para receitas
[x] Handlers CRUD para receitas implementados
[x] Middleware de autenticação JWT Supabase
[x] Rotas protegidas configuradas
[x] Endpoints para pagamentos implementados
[x] Registrar pagamentos (baixa total/parcial) com idempotência
[x] Formulário de cadastro/edição de receitas no frontend
[x] Componente ReceitaForm com validação Zod
[x] Integração frontend-backend preparada

Entrega: fluxo financeiro básico funcionando ✅

**Status Detalhado:**
- ✅ Modelos Income, Payment, PaymentRequest e IncomeFilter implementados
- ✅ Repositório IncomeRepository com métodos CRUD completos
- ✅ Serviço IncomeService com lógica de negócio e validações
- ✅ Handlers HTTP para receitas (Create, Get, Update, Delete, List)
- ✅ Handlers para pagamentos (AddPayment, GetIncomePayments)
- ✅ Middleware SupabaseAuth com validação JWKS e contexto de usuário
- ✅ Rotas protegidas configuradas (/api/v1/incomes, /api/v1/payments)
- ✅ Tratamento de erros e validações implementados
- ✅ Compilação do backend bem-sucedida sem erros
- ✅ Componente ReceitaForm implementado com validação completa
- ✅ Formulário responsivo com campos obrigatórios e opcionais
- ✅ Validação Zod integrada com feedback visual de erros
- ✅ Suporte para criação e edição de receitas

## Fase 5 — Integração Frontend-Backend ✅ CONCLUÍDA
[x] Implementar listagem de receitas com filtros e paginação
[x] Implementar modal de baixa de pagamentos
[x] Conectar frontend com backend através de serviços de API
[x] Alinhar pagamentosService.ts com rotas reais do backend
[x] Implementar mapeadores DTO (toBackendPaymentRequest, fromBackendPayment)
[x] Ajustar usePagamentos para usar endpoints /payments e /incomes/{id}/payments
[x] Validar typecheck do projeto sem erros
[x] Corrigir problemas de lint em arquivos legados
[x] Criar dashboard com resumos financeiros e atividade recente real
[x] Testes de integração frontend-backend validados
[x] Atualizar documentação completa (PRD, Arquitetura, README, GUIA_EXECUCAO)

Entrega: integração completa frontend-backend para pagamentos ✅

**Status Detalhado:**
- ✅ Página Receitas.tsx implementada com listagem completa
- ✅ Filtros avançados (categoria, data, valor, status)
- ✅ Tabela responsiva com ordenação por colunas
- ✅ Paginação funcional com controles de navegação
- ✅ Hook useReceitas para gerenciamento de estado
- ✅ Ações de visualização, edição e exclusão
- ✅ Integração com banco de dados local (IndexedDB)
- ✅ Modal de baixa de pagamentos implementado
- ✅ Componente PagamentoModal com validação completa
- ✅ Tipos de pagamento definidos (pagamento.ts)
- ✅ Integração do modal na página de receitas
- ✅ Botão de pagamento condicional (apenas para receitas não pagas)
- ✅ Atualização automática do status da receita após pagamento
- ✅ Serviço pagamentosService.ts alinhado com backend real
- ✅ Mapeadores DTO implementados para conversão de dados
- ✅ Hook usePagamentos ajustado para rotas /payments (POST) e /incomes/{id}/payments (GET)
- ✅ Typecheck do projeto aprovado sem erros de tipo
- ✅ Correção completa de problemas de lint em arquivos legados
- ✅ Dashboard implementado com resumos financeiros e atividade recente real
- ✅ Testes de integração frontend-backend validados
- ✅ Repositório GitHub configurado com branch main
- ✅ Documentação técnica completa atualizada (PRD, Arquitetura, README, GUIA_EXECUCAO)

## Fase 6 — Assinaturas e Recibos ✅ PARCIALMENTE CONCLUÍDA
### 6.1 — Sistema de Assinaturas
[ ] Upload de PNG (validação MIME e dimensões máx. 2MB)
[ ] Armazenamento em bucket privado `signatures` com metadados
[ ] Interface de seleção/preview e ajuste de escala
[ ] Validação de transparência e qualidade da imagem
[ ] Sistema de backup e versionamento de assinaturas

**Entrega 6.1**: assinatura pronta para uso nos recibos

### 6.2 — Geração de Recibos ✅ PARCIALMENTE CONCLUÍDA
[x] Template paisagem moderno (PDF client-side com jsPDF)
[x] Aplicação de assinatura proporcional e posicionamento
[x] Registro de recibo com hash SHA-256 e metadados
[x] Upload opcional do PDF no bucket `receipts`
[x] QRCode para verificação de autenticidade
[x] Campos dinâmicos (locatário, valor, competência, observações)
[x] Preview antes da geração final

**Entrega 6.2**: geração e download/compartilhamento de recibos

**Critérios de Aceitação Fase 6:**
- Upload de assinatura funcional com validações
- Geração de PDF com layout profissional
- QRCode funcional para verificação
- Armazenamento seguro com RLS
- Interface intuitiva para usuário final

### Progresso Adicional Fase 6:
[x] Remoção completa do conceito de vencimento em Recibos
[x] Ajuste de UI para 3 colunas nos cards de resumo
[x] Integração de assinaturas padrão no fluxo de Recibos

## Fase 7 — Sincronização e Offline
[ ] Endpoint incremental estável (cursor, since, ETag)
[ ] Background Sync e fila limitada
[ ] SWR/NetworkFirst por rota; fallback offline

Entrega: experiência robusta em redes instáveis

## Fase 8 — Telemetria, Segurança e Limites
[ ] Logs estruturados e sampling
[ ] Rate limit/circuit breaker/backpressure
[ ] Criptografia field-level onde aplicável
[ ] Headers de segurança e CORS restrito

Entrega: resiliência e segurança alinhadas ao freemium

## Fase 9 — Docker e Deploy
[ ] Dockerfile backend (multi-stage) e frontend (nginx)
[ ] docker-compose (dev) e scripts de build
[ ] Deploy em provedor freemium

Entrega: build reproduzível e deploy estável

## Fase 10 — Qualidade e Performance
[ ] Testes unitários/chave (front/back)
[ ] Testes k6 (latência p50/p95) nos fluxos críticos
[ ] Perf audit do PWA (Lighthouse) e budgets do Vite/React

Entrega: critérios de qualidade aprovados

## Backlog de melhorias
[ ] Templates adicionais de recibo (tema claro/escuro)
[ ] Exportações CSV/Excel
[ ] Modo Lite (redução de animações e pré-carregamentos)
[ ] View materializada de dashboards

## Desafios Encontrados e Soluções

### Fase 5 - Integração Frontend-Backend
**Desafios:**
- Alinhamento de tipos TypeScript entre frontend e backend
- Problemas de lint em arquivos legados (76 issues iniciais)
- Mapeamento correto de DTOs para comunicação API
- Sincronização de estado entre IndexedDB local e backend

**Soluções Implementadas:**
- ✅ Criação de mapeadores DTO específicos (toBackendPaymentRequest, fromBackendPayment)
- ✅ Refatoração completa do pagamentosService.ts para usar rotas reais
- ✅ Correção sistemática de todos os problemas de lint
- ✅ Implementação de typecheck rigoroso sem erros
- ✅ Testes de integração abrangentes para validar fluxo completo

## Riscos e Mitigação
- Limites do provedor freemium → rate limit, cache, jobs off-peak
- PDFs pesados → tamanho/qualidade controlados e client-first
- Quotas de Storage → limpeza de órfãos e caps por usuário
- Complexidade de assinaturas → validação MIME rigorosa e preview antes do upload

## Métricas de Sucesso

### Fase 6 - Assinaturas e Recibos
- **Performance**: Upload de assinatura < 3s para arquivos até 2MB
- **Qualidade**: Geração de PDF < 5s com layout consistente
- **Usabilidade**: Fluxo completo (assinatura → recibo) em < 60s
- **Segurança**: 100% dos uploads validados (MIME + dimensões)
- **Confiabilidade**: QRCode verificável em 100% dos recibos gerados

## Gatilhos de Release e Checkpoints
- **Beta**: Fases 0–7 concluídas + métricas básicas
- **RC**: Fase 8–9 concluídas sem regressões de performance
- **GA**: Fase 10 concluída e documentação atualizada
- **Milestone Atual**: Fase 6 (Assinaturas e Recibos) - Estimativa: 3-4 semanas

## Histórico de alterações
- 30-08-2025: Fase 5 (Integração Frontend-Backend) 100% CONCLUÍDA
  - ✅ Integração completa do fluxo de pagamentos frontend-backend
  - ✅ Serviço pagamentosService.ts alinhado com rotas reais (/payments POST, /incomes/{id}/payments GET)
  - ✅ Mapeadores DTO implementados (toBackendPaymentRequest, fromBackendPayment)
  - ✅ Hook usePagamentos ajustado para usar endpoints do backend real
  - ✅ Typecheck do projeto aprovado sem erros de tipo
  - ✅ Correção completa de problemas de lint em arquivos legados
  - ✅ Dashboard implementado com resumos financeiros e atividade recente real
  - ✅ Testes de integração frontend-backend validados
  - ✅ Repositório GitHub configurado com branch main
  - ✅ Documentação técnica completa atualizada (PRD, Arquitetura, README, GUIA_EXECUCAO)
  - ✅ Arquivo .gitignore otimizado para projetos React/Go
  - 🎯 Próximo: Iniciar Fase 6 - Assinaturas e Recibos
- 29-01-2025: Fase 1 (Banco de dados e RLS) completamente implementada
  - ✅ Todas as tabelas rf_* criadas e configuradas
  - ✅ Row Level Security (RLS) habilitado e validado
  - ✅ Políticas de isolamento por owner_id implementadas
  - ✅ Buckets de storage e políticas configuradas
  - ✅ Permissões para roles authenticated e anon validadas

- 29-01-2025: Fase 5 (Frontend Receitas) significativamente avançada
  - ✅ Listagem de receitas implementada com filtros avançados
  - ✅ Página Receitas.tsx com tabela responsiva e paginação
  - ✅ Hook useReceitas para gerenciamento de estado
  - ✅ Filtros por categoria, data de vencimento, valor e status
  - ✅ Ordenação por colunas (título, valor, data)
  - ✅ Ações de CRUD integradas (visualizar, editar, excluir)
  - ✅ Integração com IndexedDB para armazenamento local
  - ✅ Modal de baixa de pagamentos completamente implementado
  - ✅ Componente PagamentoModal com validação Zod
  - ✅ Tipos de pagamento definidos e integrados
  - ✅ Botão de pagamento condicional na listagem
  - ✅ Atualização automática do status após pagamento
  - 🎯 Próximo: Integração frontend-backend e serviços de API
- 29-01-2025: Fase 4 (Receitas e Baixas) completamente concluída
  - ✅ Backend CRUD completo para receitas e pagamentos implementado
  - ✅ Modelos Income, Payment, PaymentRequest e IncomeFilter implementados
  - ✅ Repositório IncomeRepository com todos os métodos CRUD
  - ✅ Serviço IncomeService com lógica de negócio e validações
  - ✅ Handlers HTTP completos para receitas e pagamentos
  - ✅ Middleware SupabaseAuth com validação JWKS e contexto de usuário
  - ✅ Rotas protegidas configuradas e testadas
  - ✅ Correção de importações circulares e compilação bem-sucedida
  - ✅ Frontend: Componente ReceitaForm implementado com validação Zod
  - ✅ Formulário responsivo para cadastro/edição de receitas
  - ✅ Validação completa de campos obrigatórios e opcionais
  - ✅ Interface preparada para integração com backend
  - 🎯 Próximo: Implementar listagem de receitas e modal de pagamentos
- 29-08-2025: Fase 1 completamente implementada
  - ✅ Schema completo das tabelas rf_* aplicado no Supabase
  - ✅ Row Level Security (RLS) habilitado e validado
  - ✅ Buckets de storage (signatures, receipts) configurados
  - ✅ Políticas RLS para storage implementadas
  - ✅ Correções técnicas aplicadas via migrations
  - ✅ Fase 3 (Frontend Skeleton) também concluída com React/Vite
  - 🎯 Projeto pronto para Fase 4 - Receitas e Baixas
- 29-08-2025: atualização de documentação e revisão de progresso
  - Documentação atualizada com data correta
  - Revisão do status das fases implementadas
  - Backend skeleton totalmente funcional
  - Próxima fase: Frontend skeleton
- 29-01-2025: atualização com progresso da integração Supabase
  - Fase 0 e Fase 2 marcadas como concluídas

— Fim —
