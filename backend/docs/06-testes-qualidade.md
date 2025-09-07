# MIT License
# Autor atual: David Assef
# Descrição: 06 testes qualidade
# Data: 07-09-2025

# 🧪 Testes e Qualidade de Código - Backend ReciboFast

**Autor:** David Assef  
**Data:** 29-08-2025  
**Licença:** MIT License  

## 📋 Visão Geral

Este documento detalha as estratégias de testes, ferramentas de qualidade de código, métricas de cobertura e boas práticas utilizadas no backend do ReciboFast.

## 🎯 Estratégia de Testes

### 🏗️ Pirâmide de Testes

```
        /\     E2E Tests (10%)
       /  \    - Testes de fluxo completo
      /    \   - Testes de API externa
     /______\  
    /        \  Integration Tests (20%)
   /          \ - Testes de banco de dados
  /            \- Testes de serviços externos
 /______________\
/                \ Unit Tests (70%)
\________________/ - Testes de funções puras
                   - Testes de lógica de negócio
                   - Testes de validações
```

### 📊 Tipos de Testes

#### 🔬 Testes Unitários (70%)
- **Objetivo**: Testar funções e métodos isoladamente
- **Escopo**: Lógica de negócio, validações, transformações
- **Ferramentas**: `testing` (Go nativo), `testify`, `gomock`
- **Cobertura alvo**: 90%+

#### 🔗 Testes de Integração (20%)
- **Objetivo**: Testar interação entre componentes
- **Escopo**: Banco de dados, APIs externas, serviços
- **Ferramentas**: `testcontainers`, `dockertest`
- **Cobertura alvo**: 80%+

#### 🌐 Testes E2E (10%)
- **Objetivo**: Testar fluxos completos da aplicação
- **Escopo**: APIs REST, autenticação, workflows
- **Ferramentas**: `httptest`, `newman` (Postman)
- **Cobertura alvo**: Cenários críticos

## 🛠️ Ferramentas e Configuração

### 📦 Dependências de Teste

```go
// go.mod (seção de testes)
require (
    github.com/stretchr/testify v1.8.4
    github.com/golang/mock v1.6.0
    github.com/testcontainers/testcontainers-go v0.24.1
    github.com/ory/dockertest/v3 v3.10.0
    github.com/DATA-DOG/go-sqlmock v1.5.0
    github.com/go-faker/faker/v4 v4.2.0
)
```

### ⚙️ Configuração de Testes

```go
// internal/testing/config.go
package testing

import (
    "context"
    "database/sql"
    "fmt"
    "log"
    "os"
    "testing"
    "time"

    "github.com/ory/dockertest/v3"
    "github.com/ory/dockertest/v3/docker"
    _ "github.com/lib/pq"
)

type TestConfig struct {
    DB       *sql.DB
    Pool     *dockertest.Pool
    Resource *dockertest.Resource
}

func SetupTestDB(t *testing.T) *TestConfig {
    pool, err := dockertest.NewPool("")
    if err != nil {
        t.Fatalf("Could not connect to docker: %s", err)
    }

    // Configurar PostgreSQL para testes
    resource, err := pool.RunWithOptions(&dockertest.RunOptions{
        Repository: "postgres",
        Tag:        "15-alpine",
        Env: []string{
            "POSTGRES_PASSWORD=testpass",
            "POSTGRES_USER=testuser",
            "POSTGRES_DB=testdb",
            "listen_addresses = '*'",
        },
    }, func(config *docker.HostConfig) {
        config.AutoRemove = true
        config.RestartPolicy = docker.RestartPolicy{Name: "no"}
    })
    if err != nil {
        t.Fatalf("Could not start resource: %s", err)
    }

    hostAndPort := resource.GetHostPort("5432/tcp")
    databaseUrl := fmt.Sprintf("postgres://testuser:testpass@%s/testdb?sslmode=disable", hostAndPort)

    // Aguardar banco estar pronto
    pool.MaxWait = 120 * time.Second
    var db *sql.DB
    if err = pool.Retry(func() error {
        db, err = sql.Open("postgres", databaseUrl)
        if err != nil {
            return err
        }
        return db.Ping()
    }); err != nil {
        t.Fatalf("Could not connect to database: %s", err)
    }

    return &TestConfig{
        DB:       db,
        Pool:     pool,
        Resource: resource,
    }
}

func (tc *TestConfig) Teardown() {
    if tc.DB != nil {
        tc.DB.Close()
    }
    if tc.Pool != nil && tc.Resource != nil {
        tc.Pool.Purge(tc.Resource)
    }
}

// Limpar dados entre testes
func (tc *TestConfig) CleanDB() error {
    tables := []string{"receitas_historico", "anexos", "clientes", "receitas", "sessions", "users"}
    for _, table := range tables {
        if _, err := tc.DB.Exec(fmt.Sprintf("TRUNCATE TABLE %s CASCADE", table)); err != nil {
            return err
        }
    }
    return nil
}
```

### 🏭 Factory de Dados de Teste

```go
// internal/testing/factories.go
package testing

import (
    "time"
    "github.com/google/uuid"
    "github.com/go-faker/faker/v4"
    "github.com/shopspring/decimal"
    "recibo-fast/internal/models"
)

type UserFactory struct{}

func (f *UserFactory) Build() *models.User {
    return &models.User{
        ID:            uuid.New(),
        Name:          faker.Name(),
        Email:         faker.Email(),
        PasswordHash:  "$2a$10$hashed_password",
        EmailVerified: true,
        Timezone:      "America/Sao_Paulo",
        Locale:        "pt-BR",
        Status:        "active",
        CreatedAt:     time.Now(),
        UpdatedAt:     time.Now(),
    }
}

func (f *UserFactory) BuildWithEmail(email string) *models.User {
    user := f.Build()
    user.Email = email
    return user
}

type ReceitaFactory struct{}

func (f *ReceitaFactory) Build(userID uuid.UUID) *models.Receita {
    return &models.Receita{
        ID:             uuid.New(),
        UserID:         userID,
        NumeroReceita:  fmt.Sprintf("REC-%s-%06d", time.Now().Format("2006"), rand.Intn(999999)),
        Descricao:      faker.Sentence(),
        Valor:          decimal.NewFromFloat(float64(rand.Intn(10000)) + 100),
        Status:         "pendente",
        DataEmissao:    time.Now(),
        DataVencimento: time.Now().AddDate(0, 0, 30),
        CreatedAt:      time.Now(),
        UpdatedAt:      time.Now(),
    }
}

func (f *ReceitaFactory) BuildWithStatus(userID uuid.UUID, status string) *models.Receita {
    receita := f.Build(userID)
    receita.Status = status
    if status == "pago" {
        now := time.Now()
        receita.DataPagamento = &now
    }
    return receita
}

type ClienteFactory struct{}

func (f *ClienteFactory) Build(receitaID uuid.UUID) *models.Cliente {
    email := faker.Email()
    telefone := faker.Phonenumber()
    documento := "12345678901"
    tipoDoc := "cpf"
    
    return &models.Cliente{
        ID:            uuid.New(),
        ReceitaID:     receitaID,
        Nome:          faker.Name(),
        Email:         &email,
        Telefone:      &telefone,
        Documento:     &documento,
        TipoDocumento: &tipoDoc,
        CreatedAt:     time.Now(),
        UpdatedAt:     time.Now(),
    }
}
```

## 🧪 Exemplos de Testes

### 🔬 Teste Unitário - Service

```go
// internal/services/receita_service_test.go
package services

import (
    "context"
    "testing"
    "time"

    "github.com/golang/mock/gomock"
    "github.com/google/uuid"
    "github.com/stretchr/testify/assert"
    "github.com/stretchr/testify/require"
    "github.com/shopspring/decimal"

    "recibo-fast/internal/models"
    "recibo-fast/internal/repositories/mocks"
    testingutils "recibo-fast/internal/testing"
)

func TestReceitaService_Create(t *testing.T) {
    ctrl := gomock.NewController(t)
    defer ctrl.Finish()

    mockRepo := mocks.NewMockReceitaRepository(ctrl)
    service := NewReceitaService(mockRepo)

    userFactory := &testingutils.UserFactory{}
    user := userFactory.Build()

    tests := []struct {
        name    string
        input   *CreateReceitaInput
        setup   func()
        wantErr bool
        errMsg  string
    }{
        {
            name: "sucesso_criar_receita",
            input: &CreateReceitaInput{
                UserID:         user.ID,
                Descricao:      "Consultoria em TI",
                Valor:          decimal.NewFromFloat(2500.00),
                DataVencimento: time.Now().AddDate(0, 0, 30),
                Cliente: &ClienteInput{
                    Nome:  "Tech Corp",
                    Email: "contato@techcorp.com",
                },
            },
            setup: func() {
                mockRepo.EXPECT().
                    Create(gomock.Any(), gomock.Any()).
                    Return(nil)
            },
            wantErr: false,
        },
        {
            name: "erro_valor_invalido",
            input: &CreateReceitaInput{
                UserID:         user.ID,
                Descricao:      "Consultoria em TI",
                Valor:          decimal.NewFromFloat(-100.00),
                DataVencimento: time.Now().AddDate(0, 0, 30),
            },
            setup:   func() {},
            wantErr: true,
            errMsg:  "valor deve ser maior que zero",
        },
        {
            name: "erro_data_vencimento_passado",
            input: &CreateReceitaInput{
                UserID:         user.ID,
                Descricao:      "Consultoria em TI",
                Valor:          decimal.NewFromFloat(2500.00),
                DataVencimento: time.Now().AddDate(0, 0, -1),
            },
            setup:   func() {},
            wantErr: true,
            errMsg:  "data de vencimento não pode ser no passado",
        },
    }

    for _, tt := range tests {t.Run(tt.name, func(t *testing.T) {
            tt.setup()

            result, err := service.Create(context.Background(), tt.input)

            if tt.wantErr {
                assert.Error(t, err)
                assert.Contains(t, err.Error(), tt.errMsg)
                assert.Nil(t, result)
            } else {
                assert.NoError(t, err)
                assert.NotNil(t, result)
                assert.Equal(t, tt.input.Descricao, result.Descricao)
                assert.Equal(t, tt.input.Valor, result.Valor)
                assert.Equal(t, "pendente", result.Status)
            }
        })
    }
}

func TestReceitaService_UpdateStatus(t *testing.T) {
    ctrl := gomock.NewController(t)
    defer ctrl.Finish()

    mockRepo := mocks.NewMockReceitaRepository(ctrl)
    service := NewReceitaService(mockRepo)

    receitaFactory := &testingutils.ReceitaFactory{}
    userID := uuid.New()
    receita := receitaFactory.Build(userID)

    tests := []struct {
        name       string
        receitaID  uuid.UUID
        newStatus  string
        setup      func()
        wantErr    bool
        errMsg     string
    }{
        {
            name:      "sucesso_marcar_como_pago",
            receitaID: receita.ID,
            newStatus: "pago",
            setup: func() {
                mockRepo.EXPECT().
                    GetByID(gomock.Any(), receita.ID).
                    Return(receita, nil)
                
                mockRepo.EXPECT().
                    Update(gomock.Any(), gomock.Any()).
                    Return(nil)
            },
            wantErr: false,
        },
        {
            name:      "erro_status_invalido",
            receitaID: receita.ID,
            newStatus: "status_inexistente",
            setup:     func() {},
            wantErr:   true,
            errMsg:    "status inválido",
        },
    }

    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            tt.setup()

            err := service.UpdateStatus(context.Background(), tt.receitaID, tt.newStatus)

            if tt.wantErr {
                assert.Error(t, err)
                assert.Contains(t, err.Error(), tt.errMsg)
            } else {
                assert.NoError(t, err)
            }
        })
    }
}
```

### 🔗 Teste de Integração - Repository

```go
// internal/repositories/receita_repository_test.go
package repositories

import (
    "context"
    "testing"
    "time"

    "github.com/google/uuid"
    "github.com/stretchr/testify/assert"
    "github.com/stretchr/testify/require"

    "recibo-fast/internal/models"
    testingutils "recibo-fast/internal/testing"
)

func TestReceitaRepository_Integration(t *testing.T) {
    if testing.Short() {
        t.Skip("Pulando teste de integração em modo short")
    }

    testConfig := testingutils.SetupTestDB(t)
    defer testConfig.Teardown()

    // Executar migrações
    err := runMigrations(testConfig.DB)
    require.NoError(t, err)

    repo := NewReceitaRepository(testConfig.DB)
    userFactory := &testingutils.UserFactory{}
    receitaFactory := &testingutils.ReceitaFactory{}

    t.Run("criar_e_buscar_receita", func(t *testing.T) {
        defer testConfig.CleanDB()

        // Criar usuário
        user := userFactory.Build()
        err := createUser(testConfig.DB, user)
        require.NoError(t, err)

        // Criar receita
        receita := receitaFactory.Build(user.ID)
        err = repo.Create(context.Background(), receita)
        require.NoError(t, err)

        // Buscar receita
        found, err := repo.GetByID(context.Background(), receita.ID)
        require.NoError(t, err)
        assert.Equal(t, receita.ID, found.ID)
        assert.Equal(t, receita.Descricao, found.Descricao)
        assert.Equal(t, receita.Valor, found.Valor)
    })

    t.Run("listar_receitas_com_filtros", func(t *testing.T) {
        defer testConfig.CleanDB()

        // Criar usuário
        user := userFactory.Build()
        err := createUser(testConfig.DB, user)
        require.NoError(t, err)

        // Criar receitas com diferentes status
        receitaPendente := receitaFactory.BuildWithStatus(user.ID, "pendente")
        receitaPaga := receitaFactory.BuildWithStatus(user.ID, "pago")
        
        err = repo.Create(context.Background(), receitaPendente)
        require.NoError(t, err)
        
        err = repo.Create(context.Background(), receitaPaga)
        require.NoError(t, err)

        // Buscar apenas receitas pendentes
        filters := &ListReceitasFilters{
            UserID: user.ID,
            Status: "pendente",
            Limit:  10,
            Offset: 0,
        }
        
        receitas, total, err := repo.List(context.Background(), filters)
        require.NoError(t, err)
        assert.Equal(t, int64(1), total)
        assert.Len(t, receitas, 1)
        assert.Equal(t, "pendente", receitas[0].Status)
    })

    t.Run("atualizar_receita", func(t *testing.T) {
        defer testConfig.CleanDB()

        // Criar usuário e receita
        user := userFactory.Build()
        err := createUser(testConfig.DB, user)
        require.NoError(t, err)

        receita := receitaFactory.Build(user.ID)
        err = repo.Create(context.Background(), receita)
        require.NoError(t, err)

        // Atualizar status
        receita.Status = "pago"
        now := time.Now()
        receita.DataPagamento = &now
        
        err = repo.Update(context.Background(), receita)
        require.NoError(t, err)

        // Verificar atualização
        updated, err := repo.GetByID(context.Background(), receita.ID)
        require.NoError(t, err)
        assert.Equal(t, "pago", updated.Status)
        assert.NotNil(t, updated.DataPagamento)
    })
}
```

### 🌐 Teste E2E - API

```go
// tests/e2e/receitas_api_test.go
package e2e

import (
    "bytes"
    "encoding/json"
    "fmt"
    "net/http"
    "net/http/httptest"
    "testing"
    "time"

    "github.com/gin-gonic/gin"
    "github.com/stretchr/testify/assert"
    "github.com/stretchr/testify/require"

    "recibo-fast/internal/handlers"
    testingutils "recibo-fast/internal/testing"
)

func TestReceitasAPI_E2E(t *testing.T) {
    if testing.Short() {
        t.Skip("Pulando teste E2E em modo short")
    }

    testConfig := testingutils.SetupTestDB(t)
    defer testConfig.Teardown()

    // Configurar aplicação
    gin.SetMode(gin.TestMode)
    app := setupTestApp(testConfig.DB)

    t.Run("fluxo_completo_receita", func(t *testing.T) {
        defer testConfig.CleanDB()

        // 1. Registrar usuário
        registerPayload := map[string]interface{}{
            "name":     "João Silva",
            "email":    "joao@teste.com",
            "password": "senha123",
        }
        
        registerBody, _ := json.Marshal(registerPayload)
        req := httptest.NewRequest("POST", "/auth/register", bytes.NewBuffer(registerBody))
        req.Header.Set("Content-Type", "application/json")
        
        w := httptest.NewRecorder()
        app.ServeHTTP(w, req)
        
        assert.Equal(t, http.StatusCreated, w.Code)
        
        var registerResp map[string]interface{}
        err := json.Unmarshal(w.Body.Bytes(), &registerResp)
        require.NoError(t, err)
        
        token := registerResp["token"].(string)
        require.NotEmpty(t, token)

        // 2. Criar receita
        receitaPayload := map[string]interface{}{
            "descricao":       "Consultoria em TI",
            "valor":           2500.00,
            "data_vencimento": time.Now().AddDate(0, 0, 30).Format("2006-01-02"),
            "cliente": map[string]interface{}{
                "nome":  "Tech Corp",
                "email": "contato@techcorp.com",
            },
        }
        
        receitaBody, _ := json.Marshal(receitaPayload)
        req = httptest.NewRequest("POST", "/receitas", bytes.NewBuffer(receitaBody))
        req.Header.Set("Content-Type", "application/json")
        req.Header.Set("Authorization", "Bearer "+token)
        
        w = httptest.NewRecorder()
        app.ServeHTTP(w, req)
        
        assert.Equal(t, http.StatusCreated, w.Code)
        
        var receitaResp map[string]interface{}
        err = json.Unmarshal(w.Body.Bytes(), &receitaResp)
        require.NoError(t, err)
        
        receitaID := receitaResp["id"].(string)
        require.NotEmpty(t, receitaID)
        assert.Equal(t, "pendente", receitaResp["status"])

        // 3. Listar receitas
        req = httptest.NewRequest("GET", "/receitas", nil)
        req.Header.Set("Authorization", "Bearer "+token)
        
        w = httptest.NewRecorder()
        app.ServeHTTP(w, req)
        
        assert.Equal(t, http.StatusOK, w.Code)
        
        var listResp map[string]interface{}
        err = json.Unmarshal(w.Body.Bytes(), &listResp)
        require.NoError(t, err)
        
        receitas := listResp["receitas"].([]interface{})
        assert.Len(t, receitas, 1)

        // 4. Atualizar status para pago
        statusPayload := map[string]interface{}{
            "status": "pago",
        }
        
        statusBody, _ := json.Marshal(statusPayload)
        req = httptest.NewRequest("PATCH", fmt.Sprintf("/receitas/%s/status", receitaID), bytes.NewBuffer(statusBody))
        req.Header.Set("Content-Type", "application/json")
        req.Header.Set("Authorization", "Bearer "+token)
        
        w = httptest.NewRecorder()
        app.ServeHTTP(w, req)
        
        assert.Equal(t, http.StatusOK, w.Code)

        // 5. Verificar atualização
        req = httptest.NewRequest("GET", fmt.Sprintf("/receitas/%s", receitaID), nil)
        req.Header.Set("Authorization", "Bearer "+token)
        
        w = httptest.NewRecorder()
        app.ServeHTTP(w, req)
        
        assert.Equal(t, http.StatusOK, w.Code)
        
        var getResp map[string]interface{}
        err = json.Unmarshal(w.Body.Bytes(), &getResp)
        require.NoError(t, err)
        
        assert.Equal(t, "pago", getResp["status"])
        assert.NotNil(t, getResp["data_pagamento"])
    })
}
```

## 📊 Cobertura de Código

### 🎯 Configuração de Cobertura

```bash
#!/bin/bash
# scripts/test-coverage.sh

set -e

echo "🧪 Executando testes com cobertura..."

# Executar testes unitários
go test -v -race -coverprofile=coverage.out -covermode=atomic ./...

# Gerar relatório HTML
go tool cover -html=coverage.out -o coverage.html

# Mostrar resumo da cobertura
go tool cover -func=coverage.out

# Verificar cobertura mínima (80%)
COVERAGE=$(go tool cover -func=coverage.out | grep total | awk '{print $3}' | sed 's/%//')
MIN_COVERAGE=80

if (( $(echo "$COVERAGE < $MIN_COVERAGE" | bc -l) )); then
    echo "❌ Cobertura de $COVERAGE% está abaixo do mínimo de $MIN_COVERAGE%"
    exit 1
else
    echo "✅ Cobertura de $COVERAGE% está acima do mínimo de $MIN_COVERAGE%"
fi

echo "📊 Relatório de cobertura gerado em coverage.html"
```

### 📈 Métricas de Qualidade

```yaml
# .github/workflows/quality.yml
name: Quality Checks

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: testpass
          POSTGRES_USER: testuser
          POSTGRES_DB: testdb
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Set up Go
      uses: actions/setup-go@v3
      with:
        go-version: 1.21
    
    - name: Cache Go modules
      uses: actions/cache@v3
      with:
        path: ~/go/pkg/mod
        key: ${{ runner.os }}-go-${{ hashFiles('**/go.sum') }}
        restore-keys: |
          ${{ runner.os }}-go-
    
    - name: Install dependencies
      run: go mod download
    
    - name: Run linter
      uses: golangci/golangci-lint-action@v3
      with:
        version: latest
    
    - name: Run tests
      run: |
        go test -v -race -coverprofile=coverage.out -covermode=atomic ./...
        go tool cover -func=coverage.out
    
    - name: Upload coverage to Codecov
      uses: codecov/codecov-action@v3
      with:
        file: ./coverage.out
        flags: unittests
        name: codecov-umbrella
    
    - name: Run security scan
      uses: securecodewarrior/github-action-gosec@master
      with:
        args: './...'
```

## 🔍 Análise Estática

### 🛠️ Configuração do Linter

```yaml
# .golangci.yml
run:
  timeout: 5m
  issues-exit-code: 1
  tests: true
  modules-download-mode: readonly

linters:
  enable:
    - errcheck
    - gosimple
    - govet
    - ineffassign
    - staticcheck
    - typecheck
    - unused
    - gocyclo
    - gofmt
    - goimports
    - golint
    - gosec
    - misspell
    - unconvert
    - dupl
    - goconst
    - gocognit
    - godox
    - maligned
    - prealloc

linters-settings:
  gocyclo:
    min-complexity: 15
  
  gocognit:
    min-complexity: 20
  
  dupl:
    threshold: 100
  
  goconst:
    min-len: 3
    min-occurrences: 3
  
  gosec:
    excludes:
      - G404 # Weak random number generator
  
  maligned:
    suggest-new: true

issues:
  exclude-rules:
    - path: _test\.go
      linters:
        - gocyclo
        - errcheck
        - dupl
        - gosec
    
    - path: internal/testing/
      linters:
        - errcheck
        - gosec
  
  max-issues-per-linter: 0
  max-same-issues: 0
```

### 🔒 Análise de Segurança

```bash
#!/bin/bash
# scripts/security-scan.sh

set -e

echo "🔒 Executando análise de segurança..."

# Instalar gosec se não estiver instalado
if ! command -v gosec &> /dev/null; then
    echo "Instalando gosec..."
    go install github.com/securecodewarrior/gosec/v2/cmd/gosec@latest
fi

# Executar análise de segurança
gosec -fmt json -out gosec-report.json -stdout -verbose=text ./...

# Verificar dependências vulneráveis
if command -v nancy &> /dev/null; then
    go list -json -m all | nancy sleuth
else
    echo "⚠️  Nancy não instalado. Instale com: go install github.com/sonatypecommunity/nancy@latest"
fi

echo "✅ Análise de segurança concluída"
```

## 🚀 Performance e Benchmarks

### ⚡ Testes de Performance

```go
// internal/services/receita_service_bench_test.go
package services

import (
    "context"
    "testing"
    "time"

    "github.com/google/uuid"
    "github.com/shopspring/decimal"

    testingutils "recibo-fast/internal/testing"
)

func BenchmarkReceitaService_Create(b *testing.B) {
    testConfig := testingutils.SetupTestDB(&testing.T{})
    defer testConfig.Teardown()

    service := setupReceitaService(testConfig.DB)
    userFactory := &testingutils.UserFactory{}
    user := userFactory.Build()
    
    // Criar usuário uma vez
    createUser(testConfig.DB, user)

    input := &CreateReceitaInput{
        UserID:         user.ID,
        Descricao:      "Benchmark Test",
        Valor:          decimal.NewFromFloat(1000.00),
        DataVencimento: time.Now().AddDate(0, 0, 30),
    }

    b.ResetTimer()
    b.RunParallel(func(pb *testing.PB) {
        for pb.Next() {
            _, err := service.Create(context.Background(), input)
            if err != nil {
                b.Fatal(err)
            }
        }
    })
}

func BenchmarkReceitaService_List(b *testing.B) {
    testConfig := testingutils.SetupTestDB(&testing.T{})
    defer testConfig.Teardown()

    service := setupReceitaService(testConfig.DB)
    userFactory := &testingutils.UserFactory{}
    receitaFactory := &testingutils.ReceitaFactory{}
    
    user := userFactory.Build()
    createUser(testConfig.DB, user)

    // Criar 1000 receitas para teste
    for i := 0; i < 1000; i++ {
        receita := receitaFactory.Build(user.ID)
        service.Create(context.Background(), &CreateReceitaInput{
            UserID:         receita.UserID,
            Descricao:      receita.Descricao,
            Valor:          receita.Valor,
            DataVencimento: receita.DataVencimento,
        })
    }

    filters := &ListReceitasFilters{
        UserID: user.ID,
        Limit:  50,
        Offset: 0,
    }

    b.ResetTimer()
    for i := 0; i < b.N; i++ {
        _, _, err := service.List(context.Background(), filters)
        if err != nil {
            b.Fatal(err)
        }
    }
}
```

### 📊 Profiling

```bash
#!/bin/bash
# scripts/profile.sh

set -e

echo "📊 Executando profiling..."

# CPU profiling
go test -cpuprofile=cpu.prof -bench=. ./internal/services/

# Memory profiling
go test -memprofile=mem.prof -bench=. ./internal/services/

# Analisar profiles
echo "Para analisar os profiles, execute:"
echo "go tool pprof cpu.prof"
echo "go tool pprof mem.prof"

# Gerar relatórios
go tool pprof -top cpu.prof > cpu-report.txt
go tool pprof -top mem.prof > mem-report.txt

echo "✅ Profiling concluído"
echo "📄 Relatórios gerados: cpu-report.txt, mem-report.txt"
```

## 📋 Checklist de Qualidade

### ✅ Antes de Fazer Commit

- [ ] Todos os testes passam (`go test ./...`)
- [ ] Cobertura de código ≥ 80%
- [ ] Linter sem erros (`golangci-lint run`)
- [ ] Análise de segurança sem vulnerabilidades críticas
- [ ] Documentação atualizada
- [ ] Benchmarks não regrediram significativamente

### ✅ Antes de Deploy

- [ ] Todos os testes E2E passam
- [ ] Performance dentro dos SLAs
- [ ] Logs estruturados implementados
- [ ] Métricas de monitoramento configuradas
- [ ] Rollback plan definido

### ✅ Revisão de Código

- [ ] Código segue padrões do projeto
- [ ] Testes adequados implementados
- [ ] Tratamento de erros apropriado
- [ ] Documentação clara e atualizada
- [ ] Performance considerada
- [ ] Segurança validada

## 🛠️ Ferramentas Auxiliares

### 📦 Makefile

```makefile
# Makefile
.PHONY: test test-unit test-integration test-e2e coverage lint security benchmark clean

# Testes
test: test-unit test-integration

test-unit:
	@echo "🧪 Executando testes unitários..."
	go test -v -race -short ./...

test-integration:
	@echo "🔗 Executando testes de integração..."
	go test -v -race ./... -tags=integration

test-e2e:
	@echo "🌐 Executando testes E2E..."
	go test -v ./tests/e2e/...

# Cobertura
coverage:
	@echo "📊 Gerando relatório de cobertura..."
	./scripts/test-coverage.sh

# Qualidade
lint:
	@echo "🔍 Executando linter..."
	golangci-lint run

security:
	@echo "🔒 Executando análise de segurança..."
	./scripts/security-scan.sh

# Performance
benchmark:
	@echo "⚡ Executando benchmarks..."
	go test -bench=. -benchmem ./...

profile:
	@echo "📊 Executando profiling..."
	./scripts/profile.sh

# Utilitários
clean:
	@echo "🧹 Limpando arquivos temporários..."
	rm -f coverage.out coverage.html
	rm -f cpu.prof mem.prof
	rm -f gosec-report.json
	rm -f *.test

# CI/CD
ci: lint test coverage security
	@echo "✅ Pipeline de CI concluído"

# Desenvolvimento
dev-setup:
	@echo "🛠️  Configurando ambiente de desenvolvimento..."
	go mod download
	go install github.com/golangci/golangci-lint/cmd/golangci-lint@latest
	go install github.com/securecodewarrior/gosec/v2/cmd/gosec@latest

# Ajuda
help:
	@echo "Comandos disponíveis:"
	@echo "  test          - Executar todos os testes"
	@echo "  test-unit     - Executar apenas testes unitários"
	@echo "  test-integration - Executar testes de integração"
	@echo "  test-e2e      - Executar testes E2E"
	@echo "  coverage      - Gerar relatório de cobertura"
	@echo "  lint          - Executar linter"
	@echo "  security      - Executar análise de segurança"
	@echo "  benchmark     - Executar benchmarks"
	@echo "  profile       - Executar profiling"
	@echo "  clean         - Limpar arquivos temporários"
	@echo "  ci            - Executar pipeline completo"
	@echo "  dev-setup     - Configurar ambiente de desenvolvimento"
```

## 📚 Referências

- [Go Testing Package](https://pkg.go.dev/testing)
- [Testify Framework](https://github.com/stretchr/testify)
- [Testcontainers Go](https://golang.testcontainers.org/)
- [GolangCI-Lint](https://golangci-lint.run/)
- [Gosec Security Scanner](https://github.com/securecodewarrior/gosec)
- [Go Benchmarks](https://pkg.go.dev/testing#hdr-Benchmarks)
- [Testing Best Practices](https://go.dev/doc/tutorial/add-a-test)

---

*Última atualização: 29-08-2025*