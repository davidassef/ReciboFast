# MIT License
# Autor atual: David Assef
# Descrição: 03 configuracao ambiente
# Data: 07-09-2025

# ⚙️ Configuração e Variáveis de Ambiente - Backend ReciboFast

**Autor:** David Assef  
**Data:** 29-08-2025  
**Licença:** MIT License  

## 📋 Visão Geral

Este documento detalha todas as configurações necessárias para executar o backend do ReciboFast, incluindo variáveis de ambiente, configurações de banco de dados, logging e outras dependências.

## 🔧 Variáveis de Ambiente

### 📄 Arquivo `.env`

O backend utiliza variáveis de ambiente para configuração. Crie um arquivo `.env` na raiz do projeto backend:

```bash
# Configurações do Servidor
PORT=8080
HOST=localhost
ENVIRONMENT=development

# Configurações do Banco de Dados
DB_HOST=localhost
DB_PORT=5432
DB_NAME=recibo_fast
DB_USER=postgres
DB_PASSWORD=sua_senha_aqui
DB_SSLMODE=disable

# Configurações de Logging
LOG_LEVEL=info
LOG_FORMAT=json
LOG_OUTPUT=stdout

# Configurações de Segurança
JWT_SECRET=sua_chave_secreta_jwt_muito_segura_aqui
JWT_EXPIRATION=24h
CORS_ORIGINS=http://localhost:3000,http://localhost:5173

# Configurações de Rate Limiting
RATE_LIMIT_REQUESTS=100
RATE_LIMIT_WINDOW=1m

# Configurações de Upload
MAX_UPLOAD_SIZE=10MB
UPLOAD_PATH=./uploads

# Configurações de Cache (Redis - opcional)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# Configurações de Email (opcional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu_email@gmail.com
SMTP_PASSWORD=sua_senha_app
SMTP_FROM=noreply@recibofast.com
```

### 📋 Template `.env.example`

```bash
# Configurações do Servidor
PORT=8080
HOST=localhost
ENVIRONMENT=development

# Configurações do Banco de Dados
DB_HOST=localhost
DB_PORT=5432
DB_NAME=recibo_fast
DB_USER=postgres
DB_PASSWORD=your_password_here
DB_SSLMODE=disable

# Configurações de Logging
LOG_LEVEL=info
LOG_FORMAT=json
LOG_OUTPUT=stdout

# Configurações de Segurança
JWT_SECRET=your_very_secure_jwt_secret_key_here
JWT_EXPIRATION=24h
CORS_ORIGINS=http://localhost:3000,http://localhost:5173

# Configurações de Rate Limiting
RATE_LIMIT_REQUESTS=100
RATE_LIMIT_WINDOW=1m

# Configurações de Upload
MAX_UPLOAD_SIZE=10MB
UPLOAD_PATH=./uploads

# Configurações de Cache (Redis - opcional)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# Configurações de Email (opcional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password
SMTP_FROM=noreply@recibofast.com
```

## 🏗️ Estrutura de Configuração

### 📁 `internal/config/config.go`

```go
package config

import (
    "os"
    "strconv"
    "strings"
    "time"
)

// Config representa todas as configurações da aplicação
type Config struct {
    Server   ServerConfig
    Database DatabaseConfig
    Logger   LoggerConfig
    Security SecurityConfig
    Upload   UploadConfig
    Redis    RedisConfig
    Email    EmailConfig
}

// ServerConfig configurações do servidor HTTP
type ServerConfig struct {
    Port        string
    Host        string
    Environment string
    CORSOrigins []string
}

// DatabaseConfig configurações do banco de dados
type DatabaseConfig struct {
    Host     string
    Port     string
    Name     string
    User     string
    Password string
    SSLMode  string
    DSN      string
}

// LoggerConfig configurações de logging
type LoggerConfig struct {
    Level  string
    Format string
    Output string
}

// SecurityConfig configurações de segurança
type SecurityConfig struct {
    JWTSecret     string
    JWTExpiration time.Duration
    RateLimit     RateLimitConfig
}

// RateLimitConfig configurações de rate limiting
type RateLimitConfig struct {
    Requests int
    Window   time.Duration
}

// UploadConfig configurações de upload
type UploadConfig struct {
    MaxSize int64
    Path    string
}

// RedisConfig configurações do Redis
type RedisConfig struct {
    Host     string
    Port     string
    Password string
    DB       int
}

// EmailConfig configurações de email
type EmailConfig struct {
    SMTPHost     string
    SMTPPort     int
    SMTPUser     string
    SMTPPassword string
    FromAddress  string
}
```

### 🔄 Carregamento de Configurações

```go
// LoadConfig carrega as configurações das variáveis de ambiente
func LoadConfig() (*Config, error) {
    config := &Config{}
    
    // Servidor
    config.Server = ServerConfig{
        Port:        getEnv("PORT", "8080"),
        Host:        getEnv("HOST", "localhost"),
        Environment: getEnv("ENVIRONMENT", "development"),
        CORSOrigins: strings.Split(getEnv("CORS_ORIGINS", "*"), ","),
    }
    
    // Banco de dados
    config.Database = DatabaseConfig{
        Host:     getEnv("DB_HOST", "localhost"),
        Port:     getEnv("DB_PORT", "5432"),
        Name:     getEnv("DB_NAME", "recibo_fast"),
        User:     getEnv("DB_USER", "postgres"),
        Password: getEnv("DB_PASSWORD", ""),
        SSLMode:  getEnv("DB_SSLMODE", "disable"),
    }
    
    // Construir DSN
    config.Database.DSN = fmt.Sprintf(
        "host=%s port=%s user=%s password=%s dbname=%s sslmode=%s",
        config.Database.Host,
        config.Database.Port,
        config.Database.User,
        config.Database.Password,
        config.Database.Name,
        config.Database.SSLMode,
    )
    
    // Logger
    config.Logger = LoggerConfig{
        Level:  getEnv("LOG_LEVEL", "info"),
        Format: getEnv("LOG_FORMAT", "json"),
        Output: getEnv("LOG_OUTPUT", "stdout"),
    }
    
    // Segurança
    jwtExpiration, _ := time.ParseDuration(getEnv("JWT_EXPIRATION", "24h"))
    rateLimitWindow, _ := time.ParseDuration(getEnv("RATE_LIMIT_WINDOW", "1m"))
    
    config.Security = SecurityConfig{
        JWTSecret:     getEnv("JWT_SECRET", ""),
        JWTExpiration: jwtExpiration,
        RateLimit: RateLimitConfig{
            Requests: getEnvAsInt("RATE_LIMIT_REQUESTS", 100),
            Window:   rateLimitWindow,
        },
    }
    
    // Upload
    maxSize := parseSize(getEnv("MAX_UPLOAD_SIZE", "10MB"))
    config.Upload = UploadConfig{
        MaxSize: maxSize,
        Path:    getEnv("UPLOAD_PATH", "./uploads"),
    }
    
    // Redis
    config.Redis = RedisConfig{
        Host:     getEnv("REDIS_HOST", "localhost"),
        Port:     getEnv("REDIS_PORT", "6379"),
        Password: getEnv("REDIS_PASSWORD", ""),
        DB:       getEnvAsInt("REDIS_DB", 0),
    }
    
    // Email
    config.Email = EmailConfig{
        SMTPHost:     getEnv("SMTP_HOST", ""),
        SMTPPort:     getEnvAsInt("SMTP_PORT", 587),
        SMTPUser:     getEnv("SMTP_USER", ""),
        SMTPPassword: getEnv("SMTP_PASSWORD", ""),
        FromAddress:  getEnv("SMTP_FROM", ""),
    }
    
    return config, nil
}

// Funções auxiliares
func getEnv(key, defaultValue string) string {
    if value := os.Getenv(key); value != "" {
        return value
    }
    return defaultValue
}

func getEnvAsInt(key string, defaultValue int) int {
    if value := os.Getenv(key); value != "" {
        if intValue, err := strconv.Atoi(value); err == nil {
            return intValue
        }
    }
    return defaultValue
}
```

## 🗄️ Configuração do Banco de Dados

### 🐘 PostgreSQL

#### Instalação Local
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install postgresql postgresql-contrib

# macOS
brew install postgresql
brew services start postgresql

# Windows
# Baixar do site oficial: https://www.postgresql.org/download/windows/
```

#### Configuração Inicial
```sql
-- Conectar como superusuário
psql -U postgres

-- Criar banco de dados
CREATE DATABASE recibo_fast;

-- Criar usuário (opcional)
CREATE USER recibo_user WITH PASSWORD 'senha_segura';

-- Conceder privilégios
GRANT ALL PRIVILEGES ON DATABASE recibo_fast TO recibo_user;

-- Sair
\q
```

#### String de Conexão
```go
// Formato DSN para PostgreSQL
"host=localhost port=5432 user=postgres password=senha dbname=recibo_fast sslmode=disable"
```

### 🐳 Docker Compose

```yaml
# docker-compose.yml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: recibo_fast
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: senha_segura
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 30s
      timeout: 10s
      retries: 3

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 30s
      timeout: 10s
      retries: 3

volumes:
  postgres_data:
  redis_data:
```

## 🔐 Configurações de Segurança

### 🔑 JWT (JSON Web Tokens)

```go
// Configuração JWT
type JWTConfig struct {
    Secret     string
    Expiration time.Duration
    Issuer     string
    Audience   string
}

// Gerar token
func GenerateToken(userID string, config JWTConfig) (string, error) {
    claims := jwt.MapClaims{
        "user_id": userID,
        "exp":     time.Now().Add(config.Expiration).Unix(),
        "iat":     time.Now().Unix(),
        "iss":     config.Issuer,
        "aud":     config.Audience,
    }
    
    token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
    return token.SignedString([]byte(config.Secret))
}
```

### 🛡️ CORS (Cross-Origin Resource Sharing)

```go
// Configuração CORS
func CORSMiddleware(origins []string) gin.HandlerFunc {
    config := cors.Config{
        AllowOrigins:     origins,
        AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
        AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
        ExposeHeaders:    []string{"Content-Length"},
        AllowCredentials: true,
        MaxAge:           12 * time.Hour,
    }
    
    return cors.New(config)
}
```

### 🚦 Rate Limiting

```go
// Rate limiting por IP
func RateLimitMiddleware(requests int, window time.Duration) gin.HandlerFunc {
    limiter := rate.NewLimiter(rate.Every(window/time.Duration(requests)), requests)
    
    return func(c *gin.Context) {
        if !limiter.Allow() {
            c.JSON(http.StatusTooManyRequests, gin.H{
                "error": "Rate limit exceeded",
            })
            c.Abort()
            return
        }
        c.Next()
    }
}
```

## 📊 Configurações de Logging

### 📝 Estrutura de Logs

```go
// Configuração do logger
func SetupLogger(config LoggerConfig) *logrus.Logger {
    logger := logrus.New()
    
    // Nível de log
    level, err := logrus.ParseLevel(config.Level)
    if err != nil {
        level = logrus.InfoLevel
    }
    logger.SetLevel(level)
    
    // Formato
    if config.Format == "json" {
        logger.SetFormatter(&logrus.JSONFormatter{
            TimestampFormat: time.RFC3339,
        })
    } else {
        logger.SetFormatter(&logrus.TextFormatter{
            FullTimestamp: true,
        })
    }
    
    // Output
    if config.Output == "file" {
        file, err := os.OpenFile("app.log", os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0666)
        if err == nil {
            logger.SetOutput(file)
        }
    }
    
    return logger
}
```

## 🚀 Ambientes de Execução

### 🔧 Development
```bash
ENVIRONMENT=development
LOG_LEVEL=debug
DB_SSLMODE=disable
CORS_ORIGINS=http://localhost:3000,http://localhost:5173
```

### 🧪 Testing
```bash
ENVIRONMENT=testing
LOG_LEVEL=warn
DB_NAME=recibo_fast_test
JWT_EXPIRATION=1h
```

### 🏭 Production
```bash
ENVIRONMENT=production
LOG_LEVEL=info
DB_SSLMODE=require
CORS_ORIGINS=https://recibofast.com
JWT_SECRET=super_secure_production_secret
```

## 🔍 Validação de Configurações

```go
// ValidateConfig valida as configurações obrigatórias
func ValidateConfig(config *Config) error {
    var errors []string
    
    // Validações obrigatórias
    if config.Database.Password == "" {
        errors = append(errors, "DB_PASSWORD é obrigatório")
    }
    
    if config.Security.JWTSecret == "" {
        errors = append(errors, "JWT_SECRET é obrigatório")
    }
    
    if len(config.Security.JWTSecret) < 32 {
        errors = append(errors, "JWT_SECRET deve ter pelo menos 32 caracteres")
    }
    
    if len(errors) > 0 {
        return fmt.Errorf("Erros de configuração: %s", strings.Join(errors, ", "))
    }
    
    return nil
}
```

## 📋 Checklist de Configuração

### ✅ Obrigatório
- [ ] Arquivo `.env` criado
- [ ] `DB_PASSWORD` definida
- [ ] `JWT_SECRET` definido (32+ caracteres)
- [ ] `CORS_ORIGINS` configurado
- [ ] Banco PostgreSQL rodando
- [ ] Conexão com banco testada

### 🔧 Opcional
- [ ] Redis configurado
- [ ] SMTP configurado
- [ ] Rate limiting ajustado
- [ ] Logs em arquivo
- [ ] SSL/TLS habilitado

## 🛠️ Comandos Úteis

```bash
# Verificar variáveis de ambiente
env | grep -E "(DB_|JWT_|LOG_)"

# Testar conexão com banco
psql -h localhost -U postgres -d recibo_fast -c "SELECT version();"

# Testar Redis
redis-cli ping

# Validar arquivo .env
go run cmd/api/main.go --validate-config

# Executar com configurações específicas
ENVIRONMENT=production go run cmd/api/main.go
```

---

## 📚 Referências

- [12 Factor App](https://12factor.net/)
- [Go Environment Variables](https://golang.org/pkg/os/#Getenv)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [JWT Best Practices](https://auth0.com/blog/a-look-at-the-latest-draft-for-jwt-bcp/)
- [CORS Guide](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)

---

*Última atualização: 29-08-2025*