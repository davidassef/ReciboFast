# MIT License
# Autor atual: David Assef
# Descrição: README do projeto ReciboFast
# Data: 07-09-2025

# 🧾 ReciboFast

> **Sistema completo de gestão de aluguéis e geração de recibos com assinatura digital**

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](https://choosealicense.com/licenses/mit/)
[![Go Version](https://img.shields.io/badge/Go-1.23+-blue.svg)](https://golang.org/)
[![React](https://img.shields.io/badge/React-18+-61DAFB.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8+-3178C6.svg)](https://www.typescriptlang.org/)
[![PWA](https://img.shields.io/badge/PWA-Ready-purple.svg)](https://web.dev/progressive-web-apps/)

## 📋 Sobre o Projeto

O **ReciboFast** é uma Progressive Web Application (PWA) moderna desenvolvida para simplificar a gestão de aluguéis e automatizar a geração de recibos profissionais. O sistema oferece uma solução completa para proprietários de imóveis, administradoras e inquilinos.

### ✨ Principais Funcionalidades

- 🏠 **Gestão de Receitas**: Cadastro e controle de receitas de aluguel
- 💰 **Registro de Pagamentos**: Baixas totais e parciais com histórico completo
- 📄 **Geração de Recibos**: PDFs profissionais com assinatura digital
- ✍️ **Assinaturas Digitais**: Upload e aplicação de assinaturas personalizadas
- 🔐 **QR Code**: Verificação de autenticidade dos recibos
- 📊 **Dashboard**: Resumos financeiros; atividade recente integrada ao Supabase (rendas criadas e pagamentos recebidos)
- 🔒 **Segurança**: Autenticação via Google OAuth e isolamento de dados por usuário
- 📱 **PWA**: Funciona offline e pode ser instalada como app nativo

## 🏗️ Arquitetura

### Stack Tecnológico

**Frontend:**
- React 18 + TypeScript
- Vite (dev server e build)
- Tailwind CSS (estilização)
- PWA (vite-plugin-pwa)
- Vitest + jsdom (testes)

**Backend:**
- Go 1.23
- Chi Router (HTTP router)
- PostgreSQL (banco de dados)
- JWT (autenticação)
- Zap (logging estruturado)

**Infraestrutura:**
- Supabase (BaaS - Backend as a Service)
- Supabase Auth (autenticação)
- Supabase Storage (arquivos)
- Row Level Security (RLS)
- Docker & Docker Compose

### Arquitetura do Sistema

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │   Supabase      │
│   (React PWA)   │◄──►│   (Go API)      │◄──►│  (PostgreSQL)   │
│                 │    │                 │    │                 │
│ • React 18      │    │ • Chi Router    │    │ • Database      │
│ • Vite          │    │ • JWT Auth      │    │ • Auth          │
│ • TypeScript    │    │ • Rate Limit    │    │ • Storage       │
│ • Tailwind CSS  │    │ • Logging       │    │ • RLS           │
│ • PWA + Vitest  │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🚀 Instalação e Configuração

### Pré-requisitos

- **Node.js** 18+ e npm
- **Go** 1.23+
- **Docker** e Docker Compose
- **Git**
- Conta no [Supabase](https://supabase.com)

### 1. Clone o Repositório

```bash
git clone https://github.com/davidassef/ReciboFast.git
cd ReciboFast
```

### 2. Configuração do Supabase

1. Crie um novo projeto no [Supabase](https://supabase.com)
2. Copie a URL e a chave anônima do projeto
3. Execute as migrations do banco de dados:

```sql
-- Execute os arquivos na ordem:
-- 1. supabase/001_init.sql
-- 2. supabase/migrations/003_fix_rls_permissions.sql
-- 3. supabase/migrations/004_create_storage_buckets.sql
```

### 3. Configuração das Variáveis de Ambiente

**Backend (.env):**
```bash
cp backend/.env.example backend/.env
```

Edite o arquivo `backend/.env`:
```env
# Supabase
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_ANON_KEY=sua-chave-anonima
SUPABASE_SERVICE_ROLE_KEY=sua-chave-service-role

# Database
DATABASE_URL=postgresql://postgres:senha@db.seu-projeto.supabase.co:5432/postgres

# Server
PORT=8080
ENVIRONMENT=development
JWT_SECRET=seu-jwt-secret

# CORS
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```

**Frontend (.env.local):**
Crie um arquivo `frontend/.env.local` com as variáveis abaixo (consulte também `frontend/ENV_EXAMPLE.txt`):
```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anonima
# Opcional (cliente REST usa base relativa /api por padrão via rewrites/proxy)
# VITE_API_BASE_URL=/api/v1
```

### 4. Instalação das Dependências

**Frontend:**
```bash
cd frontend
npm install
```

**Backend:**
```bash
cd backend
go mod download
```

## 🏃‍♂️ Executando o Projeto

### Desenvolvimento Local

**Opção 1: Docker Compose (Recomendado)**
```bash
# Na raiz do projeto
docker-compose up -d
```

**Opção 2: Execução Manual (Foco atual)**

1. **Backend:**
   ```bash
   cd backend
   go run cmd/api/main.go  # Certifique-se de que o arquivo main.go está em cmd/api/
   # Servidor respeita a variável de ambiente PORT (padrão 8080). Ex.: PORT=9090 go run cmd/api/main.go
   ```

2. **Frontend:**
   ```bash
   cd frontend
   npm install
   npm run dev
   # Aplicação rodando em http://localhost:5173
   ```

### Acessos

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8080
- **Health Check**: http://localhost:8080/healthz
- **API Docs**: http://localhost:8080/api/v1/

## 🧪 Testes

### Frontend
```bash
cd frontend

# Testes unitários (Vitest)
npx vitest

# Lint
npm run lint
```

### Backend
```bash
cd backend

# Executar testes
go test ./...

# Testes com coverage
go test -cover ./...

# Testes verbosos
go test -v ./...
```

## 📦 Build e Deploy

### Deploy recomendado (Frontend no Vercel, Backend no Render)

1. **Backend (Render)**
   - Crie um Web Service apontando para a pasta `backend/` do repositório (usa `backend/Dockerfile`).
   - Defina as variáveis de ambiente:
     - `ALLOWED_ORIGINS` — ex.: `https://seu-app.vercel.app, *.vercel.app` (wildcard suportado)
     - Outras variáveis da sua API, se aplicável.
   - Health check path: `/healthz`.
   - Anote a URL pública, por exemplo: `https://recibofast-backend.onrender.com`.

2. **Frontend (Vercel)**
   - Importe o projeto com diretório raiz `frontend/`.
   - Em `frontend/vercel.json`, substitua `RENDER_BACKEND_URL` pela URL pública do Render.
   - Defina as variáveis de ambiente:
     - `VITE_SUPABASE_URL`
     - `VITE_SUPABASE_ANON_KEY`
   - O Vercel executará `npm run build` e publicará o conteúdo de `dist/`.

3. **Supabase (produção)**
   - Authentication > URL Configuration:
     - Redirect URLs: `https://seu-app.vercel.app/auth/callback`, `https://seu-app.vercel.app`
   - CORS/domínios permitidos: adicione o domínio do Vercel (produção e opcionalmente preview).
   - Revise RLS/Policies das tabelas usadas (ex.: `rf_contracts`, `rf_receipts`, assinaturas).

### Build de Produção (local)

**Frontend:**
```bash
cd frontend
npm run build
# Saída em: dist/
```

**Backend:**
```bash
cd backend
go build -o bin/recibofast cmd/api/main.go
# Saída em: bin/recibofast
```

### Docker (opcional)

- Frontend: `frontend/Dockerfile` usa Node 20 (build) e NGINX (runtime) com SPA fallback (`frontend/nginx.conf`).
- Backend: `backend/Dockerfile` compila e roda o binário (porta `PORT`).

```bash
# Exemplo de build das imagens locais
docker build -t recibofast-frontend ./frontend
docker build -t recibofast-backend ./backend
```

## 📚 Documentação

### Estrutura do Projeto

```
ReciboFast/
├── frontend/                 # Aplicação React + Vite
│   ├── src/
│   │   ├── components/      # Componentes reutilizáveis
│   │   ├── pages/           # Páginas da aplicação
│   │   ├── services/        # Chamadas à API
│   │   ├── hooks/           # Hooks personalizados
│   │   ├── contexts/        # Estados globais
│   │   ├── utils/           # Funções utilitárias
│   │   └── assets/          # Arquivos estáticos
│   └── public/              # Assets públicos do Vite
├── backend/                 # API Go
│   ├── cmd/               # Ponto de entrada
│   ├── internal/
│   │   ├── handlers/      # Controladores HTTP
│   │   ├── services/      # Lógica de negócio
│   │   ├── models/        # Estruturas de dados
│   │   ├── storage/       # Camada de persistência
│   │   └── middleware/    # Middlewares HTTP
│   └── docs/              # Documentação da API
├── supabase/               # Migrations e configurações
│   └── migrations/        # Scripts SQL
├── .trae/                  # Documentação do projeto
│   └── documents/         # Documentos técnicos
└── docker-compose.yml      # Configuração Docker
```

### Documentos Técnicos

- 📋 [PRD - Requisitos de Produto](.trae/documents/PRD_SISTEMA_ASSINATURAS_RECIBOS.md)
- 🏗️ [Arquitetura Técnica](.trae/documents/ARQUITETURA_TECNICA_RECIBOFAST.md)
- 📊 [Status do Projeto](STATUS_PROJETO_RECIBOFAST.md)
- 🗓️ [Plano de Execução](PLANO_EXECUCAO_RECIBOFAST.md)
- 🔄 [Próximos Passos](.trae/documents/ITENS_PENDENTES_PROJETO_RECIBOFAST.md)

## 🔐 Segurança

### Autenticação e Autorização
- **JWT Tokens** com validação JWKS
- **Google OAuth** integrado via Supabase Auth
- **Row Level Security (RLS)** no banco de dados
- **Isolamento de dados** por usuário (owner_id)

### Boas Práticas Implementadas
- Validação de entrada em todas as APIs
- Rate limiting para prevenir abuso
- CORS configurado adequadamente
- Logs estruturados para auditoria
- Variáveis de ambiente para credenciais
- Criptografia de dados sensíveis

## 🤝 Contribuição

### Como Contribuir

1. **Fork** o projeto
2. Crie uma **branch** para sua feature (`git checkout -b feature/AmazingFeature`)
3. **Commit** suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. **Push** para a branch (`git push origin feature/AmazingFeature`)
5. Abra um **Pull Request**

### Padrões de Código

- **Frontend**: ESLint + Prettier configurados para React/Vite
- **Backend**: gofmt + golint
- **Commits**: Conventional Commits
- **Testes**: Cobertura mínima de 80%
- **Documentação**: Sempre atualizar README e docs

## 📈 Status do Projeto

### Fases Concluídas ✅
- **Fase 1**: Banco de Dados e RLS (100%)
- **Fase 2**: Backend Skeleton (100%)
- **Fase 3**: Frontend Skeleton (100%)
- **Fase 4**: Receitas e Baixas (100%)
- **Fase 5**: Integração Frontend-Backend (95%)

### Em Desenvolvimento 🔄
- Dashboard com resumos financeiros avançados (cards com métricas reais)
- Correções de lint em arquivos legados
- Testes de integração completos

### Próximas Fases 📋
- **Fase 6**: Assinaturas e Recibos (observação: Recibos não possuem vencimento; fluxo simplificado de emissão)
- **Fase 7**: Sincronização e Offline
- **Fase 8**: Telemetria e Segurança
- **Fase 9**: Docker e Deploy
- **Fase 10**: Qualidade e Performance

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 👨‍💻 Autor

**David Assef**
- GitHub: [@davidassef](https://github.com/davidassef)
- Email: davidassef@gmail.com

## 🙏 Agradecimentos

- [Supabase](https://supabase.com) pela infraestrutura BaaS
- [React](https://react.dev) e [Vite](https://vitejs.dev) pelo stack frontend
- [Go](https://golang.org) pela linguagem backend
- [Tailwind CSS](https://tailwindcss.com) pelo framework CSS
- Comunidade open source pelas ferramentas e bibliotecas

---

<div align="center">
  <p>Feito com ❤️ por <a href="https://github.com/davidassef">David Assef</a></p>
  <p>⭐ Deixe uma estrela se este projeto te ajudou!</p>
</div>