# 🔐 Segurança e Autenticação - Backend ReciboFast

**Autor:** David Assef  
**Data:** 29-08-2025  
**Licença:** MIT License  

## 📋 Visão Geral

Este documento detalha as estratégias de segurança, autenticação, autorização e proteção implementadas no backend do ReciboFast para garantir a proteção dos dados dos usuários e a integridade do sistema.

## 🛡️ Arquitetura de Segurança

### 🏗️ Camadas de Segurança

```
┌─────────────────────────────────────────────────────────────┐
│                    CAMADA DE REDE                          │
│  • HTTPS/TLS 1.3  • Firewall  • Rate Limiting  • CORS     │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                 CAMADA DE APLICAÇÃO                        │
│  • JWT Tokens  • RBAC  • Input Validation  • CSRF         │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                 CAMADA DE NEGÓCIO                          │
│  • Authorization  • Data Validation  • Business Rules      │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                 CAMADA DE DADOS                            │
│  • Encryption  • RLS  • Audit Logs  • Backup Security     │
└─────────────────────────────────────────────────────────────┘
```

## 🔑 Sistema de Autenticação

### 🎫 JWT (JSON Web Tokens)

```go
// internal/auth/jwt.go
package auth

import (
    "crypto/rand"
    "encoding/hex"
    "errors"
    "time"

    "github.com/golang-jwt/jwt/v5"
    "github.com/google/uuid"
    "golang.org/x/crypto/bcrypt"
)

type JWTManager struct {
    secretKey     []byte
    tokenDuration time.Duration
    refreshDuration time.Duration
}

type Claims struct {
    UserID   uuid.UUID `json:"user_id"`
    Email    string    `json:"email"`
    Role     string    `json:"role"`
    TokenType string   `json:"token_type"` // "access" ou "refresh"
    jwt.RegisteredClaims
}

type TokenPair struct {
    AccessToken  string    `json:"access_token"`
    RefreshToken string    `json:"refresh_token"`
    ExpiresAt    time.Time `json:"expires_at"`
    TokenType    string    `json:"token_type"`
}

func NewJWTManager(secretKey string, tokenDuration, refreshDuration time.Duration) *JWTManager {
    return &JWTManager{
        secretKey:       []byte(secretKey),
        tokenDuration:   tokenDuration,
        refreshDuration: refreshDuration,
    }
}

// Gerar par de tokens (access + refresh)
func (manager *JWTManager) GenerateTokenPair(userID uuid.UUID, email, role string) (*TokenPair, error) {
    // Access Token
    accessClaims := &Claims{
        UserID:    userID,
        Email:     email,
        Role:      role,
        TokenType: "access",
        RegisteredClaims: jwt.RegisteredClaims{
            ExpiresAt: jwt.NewNumericDate(time.Now().Add(manager.tokenDuration)),
            IssuedAt:  jwt.NewNumericDate(time.Now()),
            NotBefore: jwt.NewNumericDate(time.Now()),
            Issuer:    "recibo-fast-api",
            Subject:   userID.String(),
            ID:        uuid.New().String(),
        },
    }

    accessToken := jwt.NewWithClaims(jwt.SigningMethodHS256, accessClaims)
    accessTokenString, err := accessToken.SignedString(manager.secretKey)
    if err != nil {
        return nil, err
    }

    // Refresh Token
    refreshClaims := &Claims{
        UserID:    userID,
        Email:     email,
        Role:      role,
        TokenType: "refresh",
        RegisteredClaims: jwt.RegisteredClaims{
            ExpiresAt: jwt.NewNumericDate(time.Now().Add(manager.refreshDuration)),
            IssuedAt:  jwt.NewNumericDate(time.Now()),
            NotBefore: jwt.NewNumericDate(time.Now()),
            Issuer:    "recibo-fast-api",
            Subject:   userID.String(),
            ID:        uuid.New().String(),
        },
    }

    refreshToken := jwt.NewWithClaims(jwt.SigningMethodHS256, refreshClaims)
    refreshTokenString, err := refreshToken.SignedString(manager.secretKey)
    if err != nil {
        return nil, err
    }

    return &TokenPair{
        AccessToken:  accessTokenString,
        RefreshToken: refreshTokenString,
        ExpiresAt:    accessClaims.ExpiresAt.Time,
        TokenType:    "Bearer",
    }, nil
}

// Validar token
func (manager *JWTManager) ValidateToken(tokenString string) (*Claims, error) {
    token, err := jwt.ParseWithClaims(
        tokenString,
        &Claims{},
        func(token *jwt.Token) (interface{}, error) {
            if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
                return nil, errors.New("unexpected signing method")
            }
            return manager.secretKey, nil
        },
    )

    if err != nil {
        return nil, err
    }

    claims, ok := token.Claims.(*Claims)
    if !ok || !token.Valid {
        return nil, errors.New("invalid token")
    }

    return claims, nil
}

// Renovar access token usando refresh token
func (manager *JWTManager) RefreshToken(refreshTokenString string) (*TokenPair, error) {
    claims, err := manager.ValidateToken(refreshTokenString)
    if err != nil {
        return nil, err
    }

    if claims.TokenType != "refresh" {
        return nil, errors.New("invalid token type")
    }

    // Gerar novo par de tokens
    return manager.GenerateTokenPair(claims.UserID, claims.Email, claims.Role)
}

// Hash de senha
func HashPassword(password string) (string, error) {
    bytes, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
    return string(bytes), err
}

// Verificar senha
func CheckPasswordHash(password, hash string) bool {
    err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
    return err == nil
}

// Gerar token seguro para reset de senha
func GenerateSecureToken() (string, error) {
    bytes := make([]byte, 32)
    if _, err := rand.Read(bytes); err != nil {
        return "", err
    }
    return hex.EncodeToString(bytes), nil
}
```

### 🔐 Middleware de Autenticação

```go
// internal/middleware/auth.go
package middleware

import (
    "net/http"
    "strings"

    "github.com/gin-gonic/gin"
    "github.com/google/uuid"
    
    "recibo-fast/internal/auth"
    "recibo-fast/internal/logging"
)

type AuthMiddleware struct {
    jwtManager *auth.JWTManager
    logger     *logging.Logger
}

func NewAuthMiddleware(jwtManager *auth.JWTManager, logger *logging.Logger) *AuthMiddleware {
    return &AuthMiddleware{
        jwtManager: jwtManager,
        logger:     logger,
    }
}

// Middleware de autenticação obrigatória
func (am *AuthMiddleware) RequireAuth() gin.HandlerFunc {
    return func(c *gin.Context) {
        token := am.extractToken(c)
        if token == "" {
            am.logger.LogError(
                c.Request.Context(),
                errors.New("missing authorization token"),
                "auth_middleware",
                logging.Fields{
                    "path":   c.Request.URL.Path,
                    "method": c.Request.Method,
                },
            )
            c.JSON(http.StatusUnauthorized, gin.H{"error": "Authorization token required"})
            c.Abort()
            return
        }

        claims, err := am.jwtManager.ValidateToken(token)
        if err != nil {
            am.logger.LogError(
                c.Request.Context(),
                err,
                "auth_middleware",
                logging.Fields{
                    "path":   c.Request.URL.Path,
                    "method": c.Request.Method,
                },
            )
            c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token"})
            c.Abort()
            return
        }

        if claims.TokenType != "access" {
            c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token type"})
            c.Abort()
            return
        }

        // Adicionar informações do usuário ao contexto
        c.Set("user_id", claims.UserID)
        c.Set("user_email", claims.Email)
        c.Set("user_role", claims.Role)
        
        // Adicionar ao contexto da requisição
        ctx := context.WithValue(c.Request.Context(), "user_id", claims.UserID)
        c.Request = c.Request.WithContext(ctx)

        c.Next()
    }
}

// Middleware de autenticação opcional
func (am *AuthMiddleware) OptionalAuth() gin.HandlerFunc {
    return func(c *gin.Context) {
        token := am.extractToken(c)
        if token != "" {
            claims, err := am.jwtManager.ValidateToken(token)
            if err == nil && claims.TokenType == "access" {
                c.Set("user_id", claims.UserID)
                c.Set("user_email", claims.Email)
                c.Set("user_role", claims.Role)
                
                ctx := context.WithValue(c.Request.Context(), "user_id", claims.UserID)
                c.Request = c.Request.WithContext(ctx)
            }
        }
        c.Next()
    }
}

// Middleware de autorização por role
func (am *AuthMiddleware) RequireRole(roles ...string) gin.HandlerFunc {
    return func(c *gin.Context) {
        userRole, exists := c.Get("user_role")
        if !exists {
            c.JSON(http.StatusForbidden, gin.H{"error": "Access denied"})
            c.Abort()
            return
        }

        roleStr, ok := userRole.(string)
        if !ok {
            c.JSON(http.StatusForbidden, gin.H{"error": "Invalid role"})
            c.Abort()
            return
        }

        for _, role := range roles {
            if roleStr == role {
                c.Next()
                return
            }
        }

        am.logger.LogError(
            c.Request.Context(),
            errors.New("insufficient permissions"),
            "auth_middleware",
            logging.Fields{
                "user_role":     roleStr,
                "required_roles": roles,
                "path":          c.Request.URL.Path,
                "method":        c.Request.Method,
            },
        )

        c.JSON(http.StatusForbidden, gin.H{"error": "Insufficient permissions"})
        c.Abort()
    }
}

// Extrair token do header Authorization
func (am *AuthMiddleware) extractToken(c *gin.Context) string {
    authHeader := c.GetHeader("Authorization")
    if authHeader == "" {
        return ""
    }

    parts := strings.SplitN(authHeader, " ", 2)
    if len(parts) != 2 || parts[0] != "Bearer" {
        return ""
    }

    return parts[1]
}

// Obter ID do usuário do contexto
func GetUserID(c *gin.Context) (uuid.UUID, error) {
    userID, exists := c.Get("user_id")
    if !exists {
        return uuid.Nil, errors.New("user not authenticated")
    }

    uid, ok := userID.(uuid.UUID)
    if !ok {
        return uuid.Nil, errors.New("invalid user ID")
    }

    return uid, nil
}

// Verificar se usuário é proprietário do recurso
func (am *AuthMiddleware) RequireOwnership(getResourceOwnerID func(*gin.Context) (uuid.UUID, error)) gin.HandlerFunc {
    return func(c *gin.Context) {
        userID, err := GetUserID(c)
        if err != nil {
            c.JSON(http.StatusUnauthorized, gin.H{"error": "Authentication required"})
            c.Abort()
            return
        }

        resourceOwnerID, err := getResourceOwnerID(c)
        if err != nil {
            c.JSON(http.StatusNotFound, gin.H{"error": "Resource not found"})
            c.Abort()
            return
        }

        if userID != resourceOwnerID {
            am.logger.LogError(
                c.Request.Context(),
                errors.New("access denied - not resource owner"),
                "auth_middleware",
                logging.Fields{
                    "user_id":          userID,
                    "resource_owner_id": resourceOwnerID,
                    "path":             c.Request.URL.Path,
                    "method":           c.Request.Method,
                },
            )
            c.JSON(http.StatusForbidden, gin.H{"error": "Access denied"})
            c.Abort()
            return
        }

        c.Next()
    }
}
```

## 🛡️ Validação e Sanitização de Entrada

### 🔍 Middleware de Validação

```go
// internal/middleware/validation.go
package middleware

import (
    "net/http"
    "regexp"
    "strings"

    "github.com/gin-gonic/gin"
    "github.com/go-playground/validator/v10"
    
    "recibo-fast/internal/logging"
)

type ValidationMiddleware struct {
    validator *validator.Validate
    logger    *logging.Logger
}

func NewValidationMiddleware(logger *logging.Logger) *ValidationMiddleware {
    v := validator.New()
    
    // Registrar validações customizadas
    v.RegisterValidation("cpf", validateCPF)
    v.RegisterValidation("cnpj", validateCNPJ)
    v.RegisterValidation("phone", validatePhone)
    v.RegisterValidation("strong_password", validateStrongPassword)
    v.RegisterValidation("no_sql_injection", validateNoSQLInjection)
    v.RegisterValidation("no_xss", validateNoXSS)
    
    return &ValidationMiddleware{
        validator: v,
        logger:    logger,
    }
}

// Middleware para validar JSON
func (vm *ValidationMiddleware) ValidateJSON(model interface{}) gin.HandlerFunc {
    return func(c *gin.Context) {
        if err := c.ShouldBindJSON(model); err != nil {
            vm.logger.LogError(
                c.Request.Context(),
                err,
                "validation_middleware",
                logging.Fields{
                    "path":   c.Request.URL.Path,
                    "method": c.Request.Method,
                },
            )
            c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid JSON format"})
            c.Abort()
            return
        }

        if err := vm.validator.Struct(model); err != nil {
            errors := vm.formatValidationErrors(err)
            c.JSON(http.StatusBadRequest, gin.H{"errors": errors})
            c.Abort()
            return
        }

        c.Set("validated_data", model)
        c.Next()
    }
}

// Middleware para sanitizar entrada
func (vm *ValidationMiddleware) SanitizeInput() gin.HandlerFunc {
    return func(c *gin.Context) {
        // Sanitizar query parameters
        for key, values := range c.Request.URL.Query() {
            for i, value := range values {
                c.Request.URL.Query()[key][i] = vm.sanitizeString(value)
            }
        }

        // Sanitizar headers específicos
        if userAgent := c.GetHeader("User-Agent"); userAgent != "" {
            c.Request.Header.Set("User-Agent", vm.sanitizeString(userAgent))
        }

        c.Next()
    }
}

// Formatar erros de validação
func (vm *ValidationMiddleware) formatValidationErrors(err error) map[string]string {
    errors := make(map[string]string)
    
    for _, err := range err.(validator.ValidationErrors) {
        field := strings.ToLower(err.Field())
        
        switch err.Tag() {
        case "required":
            errors[field] = "Este campo é obrigatório"
        case "email":
            errors[field] = "Formato de email inválido"
        case "min":
            errors[field] = "Valor muito pequeno"
        case "max":
            errors[field] = "Valor muito grande"
        case "cpf":
            errors[field] = "CPF inválido"
        case "cnpj":
            errors[field] = "CNPJ inválido"
        case "phone":
            errors[field] = "Número de telefone inválido"
        case "strong_password":
            errors[field] = "Senha deve ter pelo menos 8 caracteres, incluindo maiúscula, minúscula, número e símbolo"
        case "no_sql_injection":
            errors[field] = "Conteúdo suspeito detectado"
        case "no_xss":
            errors[field] = "Conteúdo HTML não permitido"
        default:
            errors[field] = "Valor inválido"
        }
    }
    
    return errors
}

// Sanitizar string
func (vm *ValidationMiddleware) sanitizeString(input string) string {
    // Remover caracteres de controle
    input = regexp.MustCompile(`[\x00-\x1f\x7f]`).ReplaceAllString(input, "")
    
    // Escapar HTML básico
    input = strings.ReplaceAll(input, "<", "&lt;")
    input = strings.ReplaceAll(input, ">", "&gt;")
    input = strings.ReplaceAll(input, "&", "&amp;")
    input = strings.ReplaceAll(input, "\"", "&quot;")
    input = strings.ReplaceAll(input, "'", "&#x27;")
    
    return strings.TrimSpace(input)
}

// Validações customizadas
func validateCPF(fl validator.FieldLevel) bool {
    cpf := fl.Field().String()
    // Implementar validação de CPF
    return isValidCPF(cpf)
}

func validateCNPJ(fl validator.FieldLevel) bool {
    cnpj := fl.Field().String()
    // Implementar validação de CNPJ
    return isValidCNPJ(cnpj)
}

func validatePhone(fl validator.FieldLevel) bool {
    phone := fl.Field().String()
    // Validar formato de telefone brasileiro
    phoneRegex := regexp.MustCompile(`^\+?55?\s?\(?[1-9]{2}\)?\s?[9]?[0-9]{4}-?[0-9]{4}$`)
    return phoneRegex.MatchString(phone)
}

func validateStrongPassword(fl validator.FieldLevel) bool {
    password := fl.Field().String()
    
    if len(password) < 8 {
        return false
    }
    
    hasUpper := regexp.MustCompile(`[A-Z]`).MatchString(password)
    hasLower := regexp.MustCompile(`[a-z]`).MatchString(password)
    hasNumber := regexp.MustCompile(`[0-9]`).MatchString(password)
    hasSymbol := regexp.MustCompile(`[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]`).MatchString(password)
    
    return hasUpper && hasLower && hasNumber && hasSymbol
}

func validateNoSQLInjection(fl validator.FieldLevel) bool {
    input := strings.ToLower(fl.Field().String())
    
    // Padrões suspeitos de SQL injection
    sqlPatterns := []string{
        "union", "select", "insert", "update", "delete", "drop",
        "exec", "execute", "sp_", "xp_", "--", "/*", "*/",
        "char(", "nchar(", "varchar(", "nvarchar(", "alter",
        "begin", "cast", "create", "cursor", "declare", "fetch",
    }
    
    for _, pattern := range sqlPatterns {
        if strings.Contains(input, pattern) {
            return false
        }
    }
    
    return true
}

func validateNoXSS(fl validator.FieldLevel) bool {
    input := strings.ToLower(fl.Field().String())
    
    // Padrões suspeitos de XSS
    xssPatterns := []string{
        "<script", "</script>", "javascript:", "onload=", "onerror=",
        "onclick=", "onmouseover=", "onfocus=", "onblur=", "onchange=",
        "onsubmit=", "<iframe", "<object", "<embed", "<link",
        "<meta", "<style", "</style>", "expression(", "url(",
    }
    
    for _, pattern := range xssPatterns {
        if strings.Contains(input, pattern) {
            return false
        }
    }
    
    return true
}

// Implementações auxiliares
func isValidCPF(cpf string) bool {
    // Implementar algoritmo de validação de CPF
    // Remover caracteres não numéricos
    cpf = regexp.MustCompile(`[^0-9]`).ReplaceAllString(cpf, "")
    
    if len(cpf) != 11 {
        return false
    }
    
    // Verificar se todos os dígitos são iguais
    if regexp.MustCompile(`^(\d)\1{10}$`).MatchString(cpf) {
        return false
    }
    
    // Calcular dígitos verificadores
    // ... implementar algoritmo completo
    return true // Simplificado para exemplo
}

func isValidCNPJ(cnpj string) bool {
    // Implementar algoritmo de validação de CNPJ
    cnpj = regexp.MustCompile(`[^0-9]`).ReplaceAllString(cnpj, "")
    
    if len(cnpj) != 14 {
        return false
    }
    
    // Verificar se todos os dígitos são iguais
    if regexp.MustCompile(`^(\d)\1{13}$`).MatchString(cnpj) {
        return false
    }
    
    // Calcular dígitos verificadores
    // ... implementar algoritmo completo
    return true // Simplificado para exemplo
}
```

## 🚫 Proteção contra Ataques

### 🛡️ Rate Limiting

```go
// internal/middleware/ratelimit.go
package middleware

import (
    "net/http"
    "strconv"
    "time"

    "github.com/gin-gonic/gin"
    "golang.org/x/time/rate"
    
    "recibo-fast/internal/logging"
)

type RateLimiter struct {
    limiter *rate.Limiter
    logger  *logging.Logger
}

type RateLimitConfig struct {
    RequestsPerSecond int
    BurstSize         int
    WindowSize        time.Duration
}

func NewRateLimiter(config RateLimitConfig, logger *logging.Logger) *RateLimiter {
    limiter := rate.NewLimiter(
        rate.Limit(config.RequestsPerSecond),
        config.BurstSize,
    )
    
    return &RateLimiter{
        limiter: limiter,
        logger:  logger,
    }
}

// Middleware de rate limiting global
func (rl *RateLimiter) GlobalRateLimit() gin.HandlerFunc {
    return func(c *gin.Context) {
        if !rl.limiter.Allow() {
            rl.logger.LogError(
                c.Request.Context(),
                errors.New("rate limit exceeded"),
                "rate_limiter",
                logging.Fields{
                    "client_ip": c.ClientIP(),
                    "path":      c.Request.URL.Path,
                    "method":    c.Request.Method,
                    "user_agent": c.GetHeader("User-Agent"),
                },
            )
            
            c.Header("X-RateLimit-Limit", strconv.Itoa(int(rl.limiter.Limit())))
            c.Header("X-RateLimit-Remaining", "0")
            c.Header("Retry-After", "60")
            
            c.JSON(http.StatusTooManyRequests, gin.H{
                "error": "Rate limit exceeded. Please try again later.",
                "retry_after": 60,
            })
            c.Abort()
            return
        }
        
        c.Next()
    }
}

// Rate limiting por IP
func (rl *RateLimiter) IPRateLimit(requestsPerMinute int) gin.HandlerFunc {
    clients := make(map[string]*rate.Limiter)
    
    return func(c *gin.Context) {
        ip := c.ClientIP()
        
        limiter, exists := clients[ip]
        if !exists {
            limiter = rate.NewLimiter(
                rate.Limit(requestsPerMinute)/60, // Por segundo
                requestsPerMinute,                 // Burst
            )
            clients[ip] = limiter
        }
        
        if !limiter.Allow() {
            rl.logger.LogError(
                c.Request.Context(),
                errors.New("IP rate limit exceeded"),
                "rate_limiter",
                logging.Fields{
                    "client_ip": ip,
                    "path":      c.Request.URL.Path,
                    "method":    c.Request.Method,
                },
            )
            
            c.JSON(http.StatusTooManyRequests, gin.H{
                "error": "Too many requests from this IP",
            })
            c.Abort()
            return
        }
        
        c.Next()
    }
}

// Rate limiting por usuário autenticado
func (rl *RateLimiter) UserRateLimit(requestsPerMinute int) gin.HandlerFunc {
    users := make(map[string]*rate.Limiter)
    
    return func(c *gin.Context) {
        userID, exists := c.Get("user_id")
        if !exists {
            c.Next()
            return
        }
        
        userIDStr := userID.(uuid.UUID).String()
        
        limiter, exists := users[userIDStr]
        if !exists {
            limiter = rate.NewLimiter(
                rate.Limit(requestsPerMinute)/60,
                requestsPerMinute,
            )
            users[userIDStr] = limiter
        }
        
        if !limiter.Allow() {
            rl.logger.LogError(
                c.Request.Context(),
                errors.New("user rate limit exceeded"),
                "rate_limiter",
                logging.Fields{
                    "user_id": userIDStr,
                    "path":    c.Request.URL.Path,
                    "method":  c.Request.Method,
                },
            )
            
            c.JSON(http.StatusTooManyRequests, gin.H{
                "error": "Too many requests from this user",
            })
            c.Abort()
            return
        }
        
        c.Next()
    }
}
```

### 🛡️ CORS e Segurança de Headers

```go
// internal/middleware/security.go
package middleware

import (
    "net/http"
    "strings"

    "github.com/gin-gonic/gin"
)

type SecurityConfig struct {
    AllowedOrigins   []string
    AllowedMethods   []string
    AllowedHeaders   []string
    ExposedHeaders   []string
    AllowCredentials bool
    MaxAge           int
}

// Middleware de CORS
func CORSMiddleware(config SecurityConfig) gin.HandlerFunc {
    return func(c *gin.Context) {
        origin := c.Request.Header.Get("Origin")
        
        // Verificar se a origem é permitida
        if isOriginAllowed(origin, config.AllowedOrigins) {
            c.Header("Access-Control-Allow-Origin", origin)
        }
        
        c.Header("Access-Control-Allow-Methods", strings.Join(config.AllowedMethods, ", "))
        c.Header("Access-Control-Allow-Headers", strings.Join(config.AllowedHeaders, ", "))
        c.Header("Access-Control-Expose-Headers", strings.Join(config.ExposedHeaders, ", "))
        
        if config.AllowCredentials {
            c.Header("Access-Control-Allow-Credentials", "true")
        }
        
        if config.MaxAge > 0 {
            c.Header("Access-Control-Max-Age", fmt.Sprintf("%d", config.MaxAge))
        }
        
        // Responder a requisições OPTIONS
        if c.Request.Method == "OPTIONS" {
            c.AbortWithStatus(http.StatusNoContent)
            return
        }
        
        c.Next()
    }
}

// Middleware de headers de segurança
func SecurityHeadersMiddleware() gin.HandlerFunc {
    return func(c *gin.Context) {
        // Prevenir clickjacking
        c.Header("X-Frame-Options", "DENY")
        
        // Prevenir MIME type sniffing
        c.Header("X-Content-Type-Options", "nosniff")
        
        // Ativar proteção XSS do browser
        c.Header("X-XSS-Protection", "1; mode=block")
        
        // Forçar HTTPS
        c.Header("Strict-Transport-Security", "max-age=31536000; includeSubDomains")
        
        // Content Security Policy
        c.Header("Content-Security-Policy", "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self'; frame-ancestors 'none';")
        
        // Referrer Policy
        c.Header("Referrer-Policy", "strict-origin-when-cross-origin")
        
        // Permissions Policy
        c.Header("Permissions-Policy", "geolocation=(), microphone=(), camera=()")
        
        c.Next()
    }
}

// Middleware anti-CSRF
func CSRFMiddleware() gin.HandlerFunc {
    return func(c *gin.Context) {
        // Para requisições que modificam dados
        if c.Request.Method != "GET" && c.Request.Method != "HEAD" && c.Request.Method != "OPTIONS" {
            // Verificar se é uma requisição AJAX
            if c.GetHeader("X-Requested-With") != "XMLHttpRequest" {
                // Verificar token CSRF
                token := c.GetHeader("X-CSRF-Token")
                if token == "" {
                    c.JSON(http.StatusForbidden, gin.H{"error": "CSRF token required"})
                    c.Abort()
                    return
                }
                
                // Validar token CSRF (implementar validação)
                if !isValidCSRFToken(token, c) {
                    c.JSON(http.StatusForbidden, gin.H{"error": "Invalid CSRF token"})
                    c.Abort()
                    return
                }
            }
        }
        
        c.Next()
    }
}

// Verificar se origem é permitida
func isOriginAllowed(origin string, allowedOrigins []string) bool {
    for _, allowed := range allowedOrigins {
        if allowed == "*" || allowed == origin {
            return true
        }
        
        // Suporte a wildcards
        if strings.HasPrefix(allowed, "*.") {
            domain := strings.TrimPrefix(allowed, "*.")
            if strings.HasSuffix(origin, "."+domain) || origin == "https://"+domain || origin == "http://"+domain {
                return true
            }
        }
    }
    return false
}

// Validar token CSRF (implementação simplificada)
func isValidCSRFToken(token string, c *gin.Context) bool {
    // Implementar validação de token CSRF
    // Pode usar sessão, JWT, ou outro mecanismo
    return true // Simplificado para exemplo
}
```

## 🔐 Criptografia e Proteção de Dados

### 🔒 Criptografia de Dados Sensíveis

```go
// internal/crypto/encryption.go
package crypto

import (
    "crypto/aes"
    "crypto/cipher"
    "crypto/rand"
    "crypto/sha256"
    "encoding/base64"
    "errors"
    "io"

    "golang.org/x/crypto/pbkdf2"
)

type Encryptor struct {
    key []byte
}

func NewEncryptor(password string, salt []byte) *Encryptor {
    key := pbkdf2.Key([]byte(password), salt, 10000, 32, sha256.New)
    return &Encryptor{key: key}
}

// Criptografar dados
func (e *Encryptor) Encrypt(plaintext string) (string, error) {
    block, err := aes.NewCipher(e.key)
    if err != nil {
        return "", err
    }

    gcm, err := cipher.NewGCM(block)
    if err != nil {
        return "", err
    }

    nonce := make([]byte, gcm.NonceSize())
    if _, err = io.ReadFull(rand.Reader, nonce); err != nil {
        return "", err
    }

    ciphertext := gcm.Seal(nonce, nonce, []byte(plaintext), nil)
    return base64.StdEncoding.EncodeToString(ciphertext), nil
}

// Descriptografar dados
func (e *Encryptor) Decrypt(ciphertext string) (string, error) {
    data, err := base64.StdEncoding.DecodeString(ciphertext)
    if err != nil {
        return "", err
    }

    block, err := aes.NewCipher(e.key)
    if err != nil {
        return "", err
    }

    gcm, err := cipher.NewGCM(block)
    if err != nil {
        return "", err
    }

    nonceSize := gcm.NonceSize()
    if len(data) < nonceSize {
        return "", errors.New("ciphertext too short")
    }

    nonce, ciphertext := data[:nonceSize], data[nonceSize:]
    plaintext, err := gcm.Open(nil, nonce, ciphertext, nil)
    if err != nil {
        return "", err
    }

    return string(plaintext), nil
}

// Gerar salt aleatório
func GenerateSalt() ([]byte, error) {
    salt := make([]byte, 32)
    _, err := rand.Read(salt)
    return salt, err
}

// Hash seguro para senhas
func HashPassword(password string) (string, error) {
    return bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
}

// Verificar hash de senha
func VerifyPassword(password, hash string) bool {
    err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
    return err == nil
}
```

## 🔍 Auditoria e Logs de Segurança

### 📊 Sistema de Auditoria

```go
// internal/audit/audit.go
package audit

import (
    "context"
    "encoding/json"
    "time"

    "github.com/google/uuid"
    
    "recibo-fast/internal/logging"
)

type AuditEvent struct {
    ID          uuid.UUID              `json:"id"`
    Timestamp   time.Time              `json:"timestamp"`
    UserID      *uuid.UUID             `json:"user_id,omitempty"`
    Action      string                 `json:"action"`
    Resource    string                 `json:"resource"`
    ResourceID  *uuid.UUID             `json:"resource_id,omitempty"`
    IPAddress   string                 `json:"ip_address"`
    UserAgent   string                 `json:"user_agent"`
    Success     bool                   `json:"success"`
    ErrorMsg    string                 `json:"error_message,omitempty"`
    Metadata    map[string]interface{} `json:"metadata,omitempty"`
}

type AuditLogger struct {
    logger *logging.Logger
}

func NewAuditLogger(logger *logging.Logger) *AuditLogger {
    return &AuditLogger{logger: logger}
}

// Log de evento de auditoria
func (al *AuditLogger) LogEvent(ctx context.Context, event AuditEvent) {
    event.ID = uuid.New()
    event.Timestamp = time.Now()
    
    // Serializar evento para JSON
    eventJSON, err := json.Marshal(event)
    if err != nil {
        al.logger.LogError(ctx, err, "audit_logger", logging.Fields{
            "event": event,
        })
        return
    }
    
    al.logger.WithFields(logging.Fields{
        "component":   "audit",
        "event_type":  "security_audit",
        "user_id":     event.UserID,
        "action":      event.Action,
        "resource":    event.Resource,
        "resource_id": event.ResourceID,
        "ip_address":  event.IPAddress,
        "success":     event.Success,
        "audit_data":  string(eventJSON),
    }).Info("Security audit event")
}

// Log de login
func (al *AuditLogger) LogLogin(ctx context.Context, userID uuid.UUID, email, ipAddress, userAgent string, success bool, errorMsg string) {
    event := AuditEvent{
        UserID:     &userID,
        Action:     "login",
        Resource:   "authentication",
        IPAddress:  ipAddress,
        UserAgent:  userAgent,
        Success:    success,
        ErrorMsg:   errorMsg,
        Metadata: map[string]interface{}{
            "email": email,
        },
    }
    
    al.LogEvent(ctx, event)
}

// Log de logout
func (al *AuditLogger) LogLogout(ctx context.Context, userID uuid.UUID, ipAddress, userAgent string) {
    event := AuditEvent{
        UserID:    &userID,
        Action:    "logout",
        Resource:  "authentication",
        IPAddress: ipAddress,
        UserAgent: userAgent,
        Success:   true,
    }
    
    al.LogEvent(ctx, event)
}

// Log de acesso a recurso
func (al *AuditLogger) LogResourceAccess(ctx context.Context, userID uuid.UUID, action, resource string, resourceID *uuid.UUID, ipAddress, userAgent string, success bool, errorMsg string) {
    event := AuditEvent{
        UserID:     &userID,
        Action:     action,
        Resource:   resource,
        ResourceID: resourceID,
        IPAddress:  ipAddress,
        UserAgent:  userAgent,
        Success:    success,
        ErrorMsg:   errorMsg,
    }
    
    al.LogEvent(ctx, event)
}

// Log de mudança de dados sensíveis
func (al *AuditLogger) LogDataChange(ctx context.Context, userID uuid.UUID, action, resource string, resourceID uuid.UUID, oldData, newData interface{}, ipAddress, userAgent string) {
    event := AuditEvent{
        UserID:     &userID,
        Action:     action,
        Resource:   resource,
        ResourceID: &resourceID,
        IPAddress:  ipAddress,
        UserAgent:  userAgent,
        Success:    true,
        Metadata: map[string]interface{}{
            "old_data": oldData,
            "new_data": newData,
        },
    }
    
    al.LogEvent(ctx, event)
}

// Log de tentativa de acesso negado
func (al *AuditLogger) LogAccessDenied(ctx context.Context, userID *uuid.UUID, action, resource string, reason, ipAddress, userAgent string) {
    event := AuditEvent{
        UserID:    userID,
        Action:    action,
        Resource:  resource,
        IPAddress: ipAddress,
        UserAgent: userAgent,
        Success:   false,
        ErrorMsg:  reason,
        Metadata: map[string]interface{}{
            "denial_reason": reason,
        },
    }
    
    al.LogEvent(ctx, event)
}
```

## 🔧 Configuração de Segurança

### ⚙️ Configurações de Produção

```go
// internal/config/security.go
package config

import (
    "time"
)

type SecurityConfig struct {
    // JWT Configuration
    JWTSecret           string        `env:"JWT_SECRET,required"`
    JWTExpiration       time.Duration `env:"JWT_EXPIRATION" envDefault:"15m"`
    JWTRefreshExpiration time.Duration `env:"JWT_REFRESH_EXPIRATION" envDefault:"7d"`
    
    // Password Policy
    MinPasswordLength   int  `env:"MIN_PASSWORD_LENGTH" envDefault:"8"`
    RequireUppercase    bool `env:"REQUIRE_UPPERCASE" envDefault:"true"`
    RequireLowercase    bool `env:"REQUIRE_LOWERCASE" envDefault:"true"`
    RequireNumbers      bool `env:"REQUIRE_NUMBERS" envDefault:"true"`
    RequireSymbols      bool `env:"REQUIRE_SYMBOLS" envDefault:"true"`
    
    // Rate Limiting
    GlobalRateLimit     int `env:"GLOBAL_RATE_LIMIT" envDefault:"1000"`
    IPRateLimit         int `env:"IP_RATE_LIMIT" envDefault:"100"`
    UserRateLimit       int `env:"USER_RATE_LIMIT" envDefault:"200"`
    
    // CORS
    AllowedOrigins      []string `env:"ALLOWED_ORIGINS" envSeparator:","`
    AllowCredentials    bool     `env:"ALLOW_CREDENTIALS" envDefault:"true"`
    
    // Encryption
    EncryptionKey       string `env:"ENCRYPTION_KEY,required"`
    EncryptionSalt      string `env:"ENCRYPTION_SALT,required"`
    
    // Session
    SessionTimeout      time.Duration `env:"SESSION_TIMEOUT" envDefault:"24h"`
    MaxConcurrentSessions int         `env:"MAX_CONCURRENT_SESSIONS" envDefault:"5"`
    
    // Security Headers
    EnableHSTS          bool `env:"ENABLE_HSTS" envDefault:"true"`
    EnableCSP           bool `env:"ENABLE_CSP" envDefault:"true"`
    EnableXFrameOptions bool `env:"ENABLE_X_FRAME_OPTIONS" envDefault:"true"`
    
    // Audit
    EnableAuditLog      bool   `env:"ENABLE_AUDIT_LOG" envDefault:"true"`
    AuditLogLevel       string `env:"AUDIT_LOG_LEVEL" envDefault:"info"`
    
    // TLS
    TLSCertFile         string `env:"TLS_CERT_FILE"`
    TLSKeyFile          string `env:"TLS_KEY_FILE"`
    MinTLSVersion       string `env:"MIN_TLS_VERSION" envDefault:"1.2"`
}

// Validar configurações de segurança
func (sc *SecurityConfig) Validate() error {
    if len(sc.JWTSecret) < 32 {
        return errors.New("JWT secret must be at least 32 characters")
    }
    
    if len(sc.EncryptionKey) < 32 {
        return errors.New("encryption key must be at least 32 characters")
    }
    
    if sc.MinPasswordLength < 8 {
        return errors.New("minimum password length must be at least 8")
    }
    
    return nil
}
```

### 🔒 Exemplo de .env de Produção

```bash
# .env.production
# Configurações de Segurança - ReciboFast Backend

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-with-at-least-32-characters-here
JWT_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d

# Password Policy
MIN_PASSWORD_LENGTH=8
REQUIRE_UPPERCASE=true
REQUIRE_LOWERCASE=true
REQUIRE_NUMBERS=true
REQUIRE_SYMBOLS=true

# Rate Limiting
GLOBAL_RATE_LIMIT=1000
IP_RATE_LIMIT=100
USER_RATE_LIMIT=200

# CORS
ALLOWED_ORIGINS=https://app.recibofast.com,https://www.recibofast.com
ALLOW_CREDENTIALS=true

# Encryption
ENCRYPTION_KEY=your-encryption-key-with-at-least-32-characters-here
ENCRYPTION_SALT=your-salt-with-at-least-32-characters-here

# Session
SESSION_TIMEOUT=24h
MAX_CONCURRENT_SESSIONS=5

# Security Headers
ENABLE_HSTS=true
ENABLE_CSP=true
ENABLE_X_FRAME_OPTIONS=true

# Audit
ENABLE_AUDIT_LOG=true
AUDIT_LOG_LEVEL=info

# TLS
TLS_CERT_FILE=/etc/ssl/certs/recibofast.crt
TLS_KEY_FILE=/etc/ssl/private/recibofast.key
MIN_TLS_VERSION=1.2

# Database Security
DB_SSL_MODE=require
DB_SSL_CERT=/etc/ssl/certs/postgresql.crt
DB_SSL_KEY=/etc/ssl/private/postgresql.key
DB_SSL_ROOT_CERT=/etc/ssl/certs/ca-certificates.crt
```

## 📚 Checklist de Segurança

### ✅ Implementado

- [x] Autenticação JWT com refresh tokens
- [x] Hash seguro de senhas com bcrypt
- [x] Validação e sanitização de entrada
- [x] Rate limiting por IP e usuário
- [x] Headers de segurança (HSTS, CSP, etc.)
- [x] CORS configurado adequadamente
- [x] Logs de auditoria para ações sensíveis
- [x] Criptografia de dados sensíveis
- [x] Validação de CPF/CNPJ
- [x] Proteção contra SQL injection
- [x] Proteção contra XSS

### 🔄 Em Desenvolvimento

- [ ] Implementação completa de CSRF protection
- [ ] Sistema de blacklist de tokens
- [ ] Detecção de anomalias de acesso
- [ ] Implementação de 2FA (Two-Factor Authentication)
- [ ] Rotação automática de chaves
- [ ] Backup criptografado

### 📋 Próximos Passos

- [ ] Implementar WAF (Web Application Firewall)
- [ ] Adicionar honeypots para detectar ataques
- [ ] Implementar rate limiting distribuído com Redis
- [ ] Adicionar geolocalização para detecção de acessos suspeitos
- [ ] Implementar sistema de reputação de IPs
- [ ] Adicionar alertas em tempo real para tentativas de ataque
- [ ] Implementar backup automático com criptografia
- [ ] Adicionar testes de penetração automatizados

## 🛠️ Ferramentas de Segurança

### 🔍 Análise Estática

```bash
# Instalar ferramentas de análise
go install github.com/securecodewarrior/gosec/v2/cmd/gosec@latest
go install honnef.co/go/tools/cmd/staticcheck@latest
go install github.com/golangci/golangci-lint/cmd/golangci-lint@latest

# Executar análises
gosec ./...
staticcheck ./...
golangci-lint run
```

### 🧪 Testes de Segurança

```bash
# Testes de dependências vulneráveis
go list -json -m all | nancy sleuth

# Scan de vulnerabilidades
govulncheck ./...

# Testes de carga para rate limiting
go test -run TestRateLimit -v
```

## 📚 Referências

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP Go Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Go_SCP_Cheat_Sheet.html)
- [JWT Best Practices](https://auth0.com/blog/a-look-at-the-latest-draft-for-jwt-bcp/)
- [Go Crypto Package](https://pkg.go.dev/crypto)
- [Gin Security Middleware](https://github.com/gin-gonic/gin#using-middleware)
- [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework)

---

*Última atualização: 29-08-2025*