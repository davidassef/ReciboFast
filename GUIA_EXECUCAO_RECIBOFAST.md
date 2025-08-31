# MIT License
# Autor atual: David Assef
# Descrição: Guia técnico para execução e setup do projeto ReciboFast
# Data: 29-08-2025 - Atualizado com progresso da integração Supabase

# GUIA DE EXECUÇÃO DO PROJETO — ReciboFast

Este guia orienta o setup local, variáveis de ambiente, ferramentas, padrões de código, execução, build e deploy (incluindo Docker) do ReciboFast. Baseado no documento `ARQUITETURA_RECIBOFAST`.

## 1. Pré-requisitos ✅ CONFIGURADO
- Git, Docker Desktop (última estável) ✅
- Node.js 20+ e npm 10+ (ou pnpm 9+) ✅
- Angular CLI 18+, Ionic CLI 7+ ✅
- Go 1.22+ ✅
- Conta e projeto Supabase (URL e Anon Key), buckets de Storage e Auth ativado (Google) ✅
- Opcional: k6 (testes de performance), golangci-lint, OpenSSL ✅

## 2. Variáveis de ambiente ✅ CONFIGURADO
Arquivos de ambiente configurados para Frontend e Backend.

Frontend (.env.local) - PENDENTE:
- NG_APP_SUPABASE_URL
- NG_APP_SUPABASE_ANON_KEY
- NG_APP_API_BASE_URL

Backend (.env) - CONFIGURADO ✅:
- API_PORT=8080 ✅
- CORS_ORIGINS=https://localhost:4200,https://seu-dominio ✅
- SUPABASE_URL=https://<project>.supabase.co ✅
- SUPABASE_JWT_PUBLIC_KEY="<copie do JWKS do Supabase ou configure JWKS_URL>" ✅
- DB_URL="postgres://usuario:senha@host:5432/postgres?sslmode=require&pool_max_conns=10" ✅
- STORAGE_BUCKET_SIGNATURES=signatures ✅
- STORAGE_BUCKET_RECEIPTS=receipts ✅
- (Opcional segurança) MASTER_KEY="chave-base64-para-envelope-encryption" ✅

Observações:
- SUPABASE JWT: preferir verificação via JWKS (env JWKS_URL=https://<project>.supabase.co/auth/v1/jwks) no backend.
- Nunca commitar chaves; usar gerenciador de segredos no deploy.

## 3. Setup do Frontend (Angular + Ionic + Tailwind) 🔄 PRÓXIMA FASE
- Inicialização do projeto (aguardando):
```bash
# Criar app Angular com roteamento e standalone (ajustar conforme preferência)
# ng new recibofast --routing --style=css --standalone

# Adicionar Ionic no projeto
# cd recibofast && ng add @ionic/angular

# Adicionar Tailwind
# npm install -D tailwindcss postcss autoprefixer
# npx tailwindcss init -p
# Configure tailwind.config.js e inclua diretivas @tailwind no styles.css

# Instalar Dexie e supabase-js
# npm install dexie @supabase/supabase-js

# Instalar libs de PDF client-side (opcional)
# npm install pdf-lib jspdf qrcode
```
- PWA:
```bash
# ng add @angular/pwa
```
- Execução em desenvolvimento:
```bash
# npm install
# npm run start
```

**Status:** Aguardando conclusão da Fase 2 para iniciar

## 4. Setup do Backend (Golang) ✅ FUNCIONAL
- Estrutura implementada ✅:
```
/cmd/api ✅
/internal/{context,handlers,httpserver,middleware,models,services} ✅
```
- Inicialização e dependências ✅:
```bash
# go mod init github.com/sua-org/recibofast ✅
# go get github.com/go-chi/chi/v5 \
#        github.com/jackc/pgx/v5/pgxpool \
#        go.uber.org/zap \
#        github.com/goccy/go-json \
#        github.com/go-chi/httprate \
#        github.com/sony/gobreaker \
#        github.com/phpdave11/gofpdf ✅

# (Lint opcional)
# go install github.com/golangci/golangci-lint/cmd/golangci-lint@latest ✅
```
- Execução local ✅:
```bash
# export $(cat .env | xargs)  # Windows: use um arquivo .env.local no VSCode ou setx
# go run ./cmd/api ✅ SERVIDOR RODANDO NA PORTA 8080
```

**Status Atual:**
- ✅ Servidor executando corretamente
- ✅ Middleware de autenticação Supabase implementado
- ✅ Validação JWKS funcionando
- ✅ Endpoint /api/v1/sync/changes testado

## 5. Supabase (DB, Storage, Auth)
- Criar tabelas e RLS conforme `ARQUITETURA_RECIBOFAST` (rf_profiles, rf_payers, rf_contracts, rf_incomes, rf_payments, rf_receipts, rf_signatures, rf_settings)
- Ativar RLS em todas as tabelas e policies por owner_id = auth.uid()
- Buckets privados: `signatures` e `receipts`
- Auth: ativar Google Provider e configurar redirect URLs para a origem do PWA

## 6. Padrões de código e qualidade
- Seguir `rules.instructions.md` (nomes descritivos, SRP, sem duplicação, docstrings PT-BR)
- Frontend: ESLint + Prettier; TypeScript estrito
- Backend: golangci-lint (vet, staticcheck, gosimple), zap para logs
- Commits claros (ex.: "Implementa endpoint /incomes"), PRs pequenos

## 7. Segurança
- JWT Supabase validado no backend (JWKS); middleware injeta user_id no contexto
- SQL parametrizado com pgx; considerar geração com sqlc
- Rate limit (httprate), circuit breaker (gobreaker), body size limit e timeouts
- Criptografia "field-level" para dados sensíveis (AES-GCM) com envelope encryption
- CSP, CORS restrito, HSTS (prod)

## 8. Build e Docker
- Backend Dockerfile (multi-stage, CGO_ENABLED=0, -ldflags "-s -w")
- Frontend Dockerfile (build Node → servir com nginx:alpine com cache forte)
- docker-compose (dev) com backend, frontend (nginx) e reverse proxy opcional

## 9. Execução rápida (Dev)
```bash
# Backend
# go run ./cmd/api

# Frontend
# npm run start

# Docker (dev)
# docker compose up --build
```

## 10. Testes
- Frontend: Jest/Testing Library
- Backend: `go test ./...`
- Performance: k6 com cenários de baixas, listagem e sync incremental

## 11. Observabilidade
- Logs estruturados (zap), sampling em prod
- Métricas essenciais: contadores de erros, latências p50/p95, recibos emitidos

## 12. Referências
- `ARQUITETURA_RECIBOFAST` (na raiz)
- Documentação Supabase (RLS, Storage, Auth)
- Angular, Ionic e Tailwind

— Fim —
