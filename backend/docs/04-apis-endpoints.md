# MIT License
# Autor atual: David Assef
# Descrição: 04 apis endpoints
# Data: 07-09-2025

# 🌐 APIs e Endpoints - Backend ReciboFast

**Autor:** David Assef  
**Data:** 29-08-2025  
**Licença:** MIT License  

## 📋 Visão Geral

Este documento detalha todas as APIs e endpoints disponíveis no backend do ReciboFast, incluindo especificações, exemplos de uso, códigos de resposta e estruturas de dados.

## 🏗️ Arquitetura da API

### 📡 Padrões Utilizados
- **REST**: Representational State Transfer
- **JSON**: Formato de dados padrão
- **HTTP Status Codes**: Códigos de resposta padronizados
- **Bearer Token**: Autenticação via JWT
- **CORS**: Cross-Origin Resource Sharing habilitado

### 🔗 Base URL
```
Development: http://localhost:8080/api/v1
Production:  https://api.recibofast.com/v1
```

## 🔐 Autenticação

### 🎫 JWT Token
Todos os endpoints protegidos requerem um token JWT no header:

```http
Authorization: Bearer <jwt_token>
```

### 🔑 Estrutura do Token
```json
{
  "user_id": "uuid",
  "email": "usuario@email.com",
  "exp": 1642694400,
  "iat": 1642608000,
  "iss": "recibofast-api",
  "aud": "recibofast-app"
}
```

## 🏥 Health Check

### `GET /health`
Verifica o status da API e suas dependências.

**Resposta de Sucesso (200)**:
```json
{
  "status": "healthy",
  "timestamp": "2025-01-20T10:30:00Z",
  "version": "1.0.0",
  "services": {
    "database": "healthy",
    "redis": "healthy"
  },
  "uptime": "2h30m15s"
}
```

**Resposta de Erro (503)**:
```json
{
  "status": "unhealthy",
  "timestamp": "2025-01-20T10:30:00Z",
  "version": "1.0.0",
  "services": {
    "database": "unhealthy",
    "redis": "healthy"
  },
  "errors": [
    "Database connection failed"
  ]
}
```

## 👤 Autenticação e Usuários

### `POST /auth/register`
Registra um novo usuário no sistema.

**Request Body**:
```json
{
  "name": "João Silva",
  "email": "joao@email.com",
  "password": "senha123",
  "confirm_password": "senha123"
}
```

**Resposta de Sucesso (201)**:
```json
{
  "message": "Usuário criado com sucesso",
  "user": {
    "id": "uuid",
    "name": "João Silva",
    "email": "joao@email.com",
    "created_at": "2025-01-20T10:30:00Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Resposta de Erro (400)**:
```json
{
  "error": "Dados inválidos",
  "details": {
    "email": "Email já está em uso",
    "password": "Senha deve ter pelo menos 8 caracteres"
  }
}
```

### `POST /auth/login`
Autentica um usuário existente.

**Request Body**:
```json
{
  "email": "joao@email.com",
  "password": "senha123"
}
```

**Resposta de Sucesso (200)**:
```json
{
  "message": "Login realizado com sucesso",
  "user": {
    "id": "uuid",
    "name": "João Silva",
    "email": "joao@email.com"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expires_at": "2025-01-21T10:30:00Z"
}
```

**Resposta de Erro (401)**:
```json
{
  "error": "Credenciais inválidas",
  "message": "Email ou senha incorretos"
}
```

### `POST /auth/refresh`
Renova o token JWT.

**Headers**:
```http
Authorization: Bearer <jwt_token>
```

**Resposta de Sucesso (200)**:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expires_at": "2025-01-21T10:30:00Z"
}
```

### `POST /auth/logout`
Invalida o token atual (logout).

**Headers**:
```http
Authorization: Bearer <jwt_token>
```

**Resposta de Sucesso (200)**:
```json
{
  "message": "Logout realizado com sucesso"
}
```

## 🧾 Receitas

### `GET /receitas`
Lista todas as receitas do usuário autenticado.

**Headers**:
```http
Authorization: Bearer <jwt_token>
```

**Query Parameters**:
- `page` (int): Página (padrão: 1)
- `limit` (int): Itens por página (padrão: 20, máximo: 100)
- `status` (string): Filtrar por status (pendente, pago, cancelado)
- `data_inicio` (string): Data inicial (YYYY-MM-DD)
- `data_fim` (string): Data final (YYYY-MM-DD)
- `search` (string): Busca por descrição ou cliente
- `sort` (string): Campo para ordenação (data, valor, status)
- `order` (string): Direção da ordenação (asc, desc)

**Exemplo de Request**:
```http
GET /receitas?page=1&limit=10&status=pendente&sort=data&order=desc
```

**Resposta de Sucesso (200)**:
```json
{
  "data": [
    {
      "id": "uuid",
      "descricao": "Serviço de consultoria",
      "valor": 1500.00,
      "status": "pendente",
      "data_vencimento": "2025-01-25",
      "cliente": {
        "nome": "Empresa ABC",
        "email": "contato@empresaabc.com",
        "telefone": "(11) 99999-9999"
      },
      "created_at": "2025-01-20T10:30:00Z",
      "updated_at": "2025-01-20T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "total_pages": 5,
    "has_next": true,
    "has_prev": false
  },
  "summary": {
    "total_valor": 75000.00,
    "total_pendente": 25000.00,
    "total_pago": 45000.00,
    "total_cancelado": 5000.00
  }
}
```

### `GET /receitas/{id}`
Obtém uma receita específica.

**Headers**:
```http
Authorization: Bearer <jwt_token>
```

**Resposta de Sucesso (200)**:
```json
{
  "id": "uuid",
  "descricao": "Serviço de consultoria",
  "valor": 1500.00,
  "status": "pendente",
  "data_vencimento": "2025-01-25",
  "observacoes": "Pagamento via PIX",
  "cliente": {
    "nome": "Empresa ABC",
    "email": "contato@empresaabc.com",
    "telefone": "(11) 99999-9999",
    "endereco": {
      "rua": "Rua das Flores, 123",
      "cidade": "São Paulo",
      "cep": "01234-567",
      "estado": "SP"
    }
  },
  "anexos": [
    {
      "id": "uuid",
      "nome": "contrato.pdf",
      "url": "/uploads/contrato.pdf",
      "tamanho": 1024000
    }
  ],
  "created_at": "2025-01-20T10:30:00Z",
  "updated_at": "2025-01-20T10:30:00Z"
}
```

**Resposta de Erro (404)**:
```json
{
  "error": "Receita não encontrada",
  "message": "A receita solicitada não existe ou não pertence ao usuário"
}
```

### `POST /receitas`
Cria uma nova receita.

**Headers**:
```http
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request Body**:
```json
{
  "descricao": "Serviço de consultoria",
  "valor": 1500.00,
  "data_vencimento": "2025-01-25",
  "observacoes": "Pagamento via PIX",
  "cliente": {
    "nome": "Empresa ABC",
    "email": "contato@empresaabc.com",
    "telefone": "(11) 99999-9999",
    "endereco": {
      "rua": "Rua das Flores, 123",
      "cidade": "São Paulo",
      "cep": "01234-567",
      "estado": "SP"
    }
  }
}
```

**Resposta de Sucesso (201)**:
```json
{
  "message": "Receita criada com sucesso",
  "receita": {
    "id": "uuid",
    "descricao": "Serviço de consultoria",
    "valor": 1500.00,
    "status": "pendente",
    "data_vencimento": "2025-01-25",
    "created_at": "2025-01-20T10:30:00Z"
  }
}
```

### `PUT /receitas/{id}`
Atualiza uma receita existente.

**Headers**:
```http
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request Body**: (mesma estrutura do POST)

**Resposta de Sucesso (200)**:
```json
{
  "message": "Receita atualizada com sucesso",
  "receita": {
    "id": "uuid",
    "descricao": "Serviço de consultoria - Atualizado",
    "valor": 1800.00,
    "status": "pendente",
    "updated_at": "2025-01-20T11:30:00Z"
  }
}
```

### `PATCH /receitas/{id}/status`
Atualiza apenas o status de uma receita.

**Headers**:
```http
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request Body**:
```json
{
  "status": "pago",
  "data_pagamento": "2025-01-20",
  "observacoes": "Pago via PIX"
}
```

**Resposta de Sucesso (200)**:
```json
{
  "message": "Status atualizado com sucesso",
  "receita": {
    "id": "uuid",
    "status": "pago",
    "data_pagamento": "2025-01-20",
    "updated_at": "2025-01-20T11:30:00Z"
  }
}
```

### `DELETE /receitas/{id}`
Exclui uma receita.

**Headers**:
```http
Authorization: Bearer <jwt_token>
```

**Resposta de Sucesso (200)**:
```json
{
  "message": "Receita excluída com sucesso"
}
```

## 📊 Relatórios e Estatísticas

### `GET /receitas/estatisticas`
Obtém estatísticas das receitas.

**Headers**:
```http
Authorization: Bearer <jwt_token>
```

**Query Parameters**:
- `periodo` (string): Período (mes, trimestre, ano)
- `ano` (int): Ano específico
- `mes` (int): Mês específico

**Resposta de Sucesso (200)**:
```json
{
  "periodo": "2025-01",
  "resumo": {
    "total_receitas": 50,
    "valor_total": 75000.00,
    "valor_pendente": 25000.00,
    "valor_pago": 45000.00,
    "valor_cancelado": 5000.00,
    "taxa_conversao": 85.5
  },
  "por_status": {
    "pendente": {
      "quantidade": 15,
      "valor": 25000.00,
      "percentual": 30.0
    },
    "pago": {
      "quantidade": 30,
      "valor": 45000.00,
      "percentual": 60.0
    },
    "cancelado": {
      "quantidade": 5,
      "valor": 5000.00,
      "percentual": 10.0
    }
  },
  "evolucao_mensal": [
    {
      "mes": "2025-01",
      "valor": 75000.00,
      "quantidade": 50
    }
  ]
}
```

### `GET /receitas/relatorio`
Gera relatório em PDF ou Excel.

**Headers**:
```http
Authorization: Bearer <jwt_token>
```

**Query Parameters**:
- `formato` (string): pdf ou excel
- `data_inicio` (string): Data inicial (YYYY-MM-DD)
- `data_fim` (string): Data final (YYYY-MM-DD)
- `status` (string): Filtrar por status

**Resposta de Sucesso (200)**:
```http
Content-Type: application/pdf
Content-Disposition: attachment; filename="relatorio-receitas-2025-01.pdf"

[Binary PDF content]
```

## 📁 Upload de Arquivos

### `POST /receitas/{id}/anexos`
Faz upload de anexos para uma receita.

**Headers**:
```http
Authorization: Bearer <jwt_token>
Content-Type: multipart/form-data
```

**Form Data**:
- `arquivo` (file): Arquivo a ser enviado
- `descricao` (string): Descrição do arquivo

**Resposta de Sucesso (201)**:
```json
{
  "message": "Arquivo enviado com sucesso",
  "anexo": {
    "id": "uuid",
    "nome": "contrato.pdf",
    "url": "/uploads/contrato.pdf",
    "tamanho": 1024000,
    "tipo": "application/pdf",
    "created_at": "2025-01-20T10:30:00Z"
  }
}
```

### `DELETE /receitas/{id}/anexos/{anexo_id}`
Exclui um anexo.

**Headers**:
```http
Authorization: Bearer <jwt_token>
```

**Resposta de Sucesso (200)**:
```json
{
  "message": "Anexo excluído com sucesso"
}
```

## 🔄 Sincronização

### `GET /sync/status`
Verifica o status da sincronização.

**Headers**:
```http
Authorization: Bearer <jwt_token>
```

**Resposta de Sucesso (200)**:
```json
{
  "status": "synced",
  "last_sync": "2025-01-20T10:30:00Z",
  "pending_changes": 0,
  "conflicts": 0
}
```

### `POST /sync/push`
Envia alterações locais para o servidor.

**Headers**:
```http
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request Body**:
```json
{
  "changes": [
    {
      "type": "create",
      "entity": "receita",
      "data": {
        "descricao": "Nova receita",
        "valor": 1000.00
      },
      "timestamp": "2025-01-20T10:30:00Z"
    }
  ]
}
```

**Resposta de Sucesso (200)**:
```json
{
  "message": "Sincronização realizada com sucesso",
  "processed": 1,
  "conflicts": 0,
  "errors": 0
}
```

## ❌ Códigos de Erro

### 📋 Status Codes

| Código | Significado | Descrição |
|--------|-------------|----------|
| 200 | OK | Requisição bem-sucedida |
| 201 | Created | Recurso criado com sucesso |
| 400 | Bad Request | Dados inválidos na requisição |
| 401 | Unauthorized | Token inválido ou ausente |
| 403 | Forbidden | Acesso negado |
| 404 | Not Found | Recurso não encontrado |
| 409 | Conflict | Conflito de dados |
| 422 | Unprocessable Entity | Dados válidos mas não processáveis |
| 429 | Too Many Requests | Rate limit excedido |
| 500 | Internal Server Error | Erro interno do servidor |
| 503 | Service Unavailable | Serviço temporariamente indisponível |

### 🔍 Estrutura de Erro Padrão

```json
{
  "error": "Título do erro",
  "message": "Descrição detalhada do erro",
  "code": "ERROR_CODE",
  "timestamp": "2025-01-20T10:30:00Z",
  "path": "/api/v1/receitas",
  "details": {
    "field": "Erro específico do campo"
  }
}
```

### 📝 Códigos de Erro Específicos

| Código | Descrição |
|--------|----------|
| `INVALID_TOKEN` | Token JWT inválido |
| `EXPIRED_TOKEN` | Token JWT expirado |
| `MISSING_TOKEN` | Token não fornecido |
| `INVALID_CREDENTIALS` | Email ou senha incorretos |
| `EMAIL_ALREADY_EXISTS` | Email já cadastrado |
| `RECEITA_NOT_FOUND` | Receita não encontrada |
| `INVALID_STATUS` | Status inválido |
| `FILE_TOO_LARGE` | Arquivo muito grande |
| `INVALID_FILE_TYPE` | Tipo de arquivo não permitido |
| `RATE_LIMIT_EXCEEDED` | Limite de requisições excedido |
| `DATABASE_ERROR` | Erro de banco de dados |
| `VALIDATION_ERROR` | Erro de validação de dados |

## 🧪 Exemplos de Uso

### 📱 Fluxo Completo - Criar Receita

```bash
# 1. Login
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "joao@email.com",
    "password": "senha123"
  }'

# 2. Criar receita (usando token do login)
curl -X POST http://localhost:8080/api/v1/receitas \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "descricao": "Consultoria em TI",
    "valor": 2500.00,
    "data_vencimento": "2025-02-15",
    "cliente": {
      "nome": "Tech Corp",
      "email": "contato@techcorp.com"
    }
  }'

# 3. Listar receitas
curl -X GET "http://localhost:8080/api/v1/receitas?page=1&limit=10" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# 4. Atualizar status
curl -X PATCH http://localhost:8080/api/v1/receitas/{id}/status \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "status": "pago",
    "data_pagamento": "2025-01-20"
  }'
```

### 🔄 Rate Limiting

```bash
# Exemplo de resposta quando rate limit é excedido
HTTP/1.1 429 Too Many Requests
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1642608060
Retry-After: 60

{
  "error": "Rate limit exceeded",
  "message": "Muitas requisições. Tente novamente em 60 segundos.",
  "code": "RATE_LIMIT_EXCEEDED"
}
```

## 📚 Referências

- [REST API Design Best Practices](https://restfulapi.net/)
- [HTTP Status Codes](https://httpstatuses.com/)
- [JWT Best Practices](https://auth0.com/blog/a-look-at-the-latest-draft-for-jwt-bcp/)
- [API Versioning](https://restfulapi.net/versioning/)
- [OpenAPI Specification](https://swagger.io/specification/)

---

*Última atualização: 29-08-2025*