# MIT License
# Autor atual: David Assef
# Descrição: 09 deploy infraestrutura
# Data: 07-09-2025

# 🚀 Deploy e Infraestrutura - Backend ReciboFast

**Autor:** David Assef  
**Data:** 29-08-2025  
**Licença:** MIT License  

## 📋 Visão Geral

Este documento detalha as estratégias de deploy, configuração de infraestrutura, containerização e orquestração do backend do ReciboFast para ambientes de desenvolvimento, teste e produção.

## 🏗️ Arquitetura de Infraestrutura

### 🌐 Visão Geral da Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                    LOAD BALANCER                           │
│                 (Nginx/CloudFlare)                         │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                   API GATEWAY                              │
│              (Kong/AWS API Gateway)                        │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                 APPLICATION LAYER                          │
│    ┌─────────────┐  ┌─────────────┐  ┌─────────────┐      │
│    │   App 1     │  │   App 2     │  │   App 3     │      │
│    │ (Container) │  │ (Container) │  │ (Container) │      │
│    └─────────────┘  └─────────────┘  └─────────────┘      │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                   DATA LAYER                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │ PostgreSQL  │  │    Redis    │  │   Storage   │        │
│  │ (Primary)   │  │   (Cache)   │  │   (Files)   │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
└─────────────────────────────────────────────────────────────┘
```

## 🐳 Containerização com Docker

### 📦 Dockerfile

```dockerfile
# Dockerfile
# Multi-stage build para otimizar tamanho da imagem

# Stage 1: Build
FROM golang:1.21-alpine AS builder

# Instalar dependências do sistema
RUN apk add --no-cache git ca-certificates tzdata

# Definir diretório de trabalho
WORKDIR /app

# Copiar arquivos de dependências
COPY go.mod go.sum ./

# Download das dependências
RUN go mod download

# Copiar código fonte
COPY . .

# Build da aplicação
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o main ./cmd/api/main.go

# Stage 2: Runtime
FROM alpine:latest

# Instalar certificados CA e timezone
RUN apk --no-cache add ca-certificates tzdata

# Criar usuário não-root
RUN adduser -D -s /bin/sh appuser

# Definir diretório de trabalho
WORKDIR /root/

# Copiar binário da aplicação
COPY --from=builder /app/main .

# Copiar arquivos de configuração
COPY --from=builder /app/configs ./configs

# Definir permissões
RUN chown -R appuser:appuser /root

# Mudar para usuário não-root
USER appuser

# Expor porta
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8080/health || exit 1

# Comando de inicialização
CMD ["./main"]
```

### 🔧 Docker Compose para Desenvolvimento

```yaml
# docker-compose.yml
version: '3.8'

services:
  # Aplicação Principal
  app:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: recibofast-api
    ports:
      - "8080:8080"
    environment:
      - ENV=development
      - DB_HOST=postgres
      - DB_PORT=5432
      - DB_USER=recibofast
      - DB_PASSWORD=recibofast123
      - DB_NAME=recibofast_dev
      - REDIS_HOST=redis
      - REDIS_PORT=6379
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    volumes:
      - ./logs:/app/logs
      - ./uploads:/app/uploads
    networks:
      - recibofast-network
    restart: unless-stopped

  # Banco de Dados PostgreSQL
  postgres:
    image: postgres:15-alpine
    container_name: recibofast-postgres
    environment:
      - POSTGRES_USER=recibofast
      - POSTGRES_PASSWORD=recibofast123
      - POSTGRES_DB=recibofast_dev
      - POSTGRES_INITDB_ARGS=--encoding=UTF-8 --lc-collate=C --lc-ctype=C
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./scripts/init-db.sql:/docker-entrypoint-initdb.d/init-db.sql
    networks:
      - recibofast-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U recibofast -d recibofast_dev"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped

  # Cache Redis
  redis:
    image: redis:7-alpine
    container_name: recibofast-redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
      - ./configs/redis.conf:/usr/local/etc/redis/redis.conf
    command: redis-server /usr/local/etc/redis/redis.conf
    networks:
      - recibofast-network
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 3s
      retries: 5
    restart: unless-stopped

  # Nginx (Load Balancer/Reverse Proxy)
  nginx:
    image: nginx:alpine
    container_name: recibofast-nginx
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./configs/nginx.conf:/etc/nginx/nginx.conf
      - ./configs/ssl:/etc/nginx/ssl
      - ./logs/nginx:/var/log/nginx
    depends_on:
      - app
    networks:
      - recibofast-network
    restart: unless-stopped

  # Monitoramento - Prometheus
  prometheus:
    image: prom/prometheus:latest
    container_name: recibofast-prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./configs/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.console.libraries=/etc/prometheus/console_libraries'
      - '--web.console.templates=/etc/prometheus/consoles'
      - '--storage.tsdb.retention.time=200h'
      - '--web.enable-lifecycle'
    networks:
      - recibofast-network
    restart: unless-stopped

  # Visualização - Grafana
  grafana:
    image: grafana/grafana:latest
    container_name: recibofast-grafana
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin123
    volumes:
      - grafana_data:/var/lib/grafana
      - ./configs/grafana/provisioning:/etc/grafana/provisioning
    networks:
      - recibofast-network
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
  prometheus_data:
  grafana_data:

networks:
  recibofast-network:
    driver: bridge
```

### 🔧 Configuração do Nginx

```nginx
# configs/nginx.conf
events {
    worker_connections 1024;
}

http {
    upstream recibofast_backend {
        least_conn;
        server app:8080 max_fails=3 fail_timeout=30s;
        # Adicionar mais instâncias conforme necessário
        # server app2:8080 max_fails=3 fail_timeout=30s;
        # server app3:8080 max_fails=3 fail_timeout=30s;
    }

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=login:10m rate=1r/s;

    # Configurações gerais
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    client_max_body_size 10M;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Logs
    access_log /var/log/nginx/access.log;
    error_log /var/log/nginx/error.log;

    # HTTP Server (redirect to HTTPS)
    server {
        listen 80;
        server_name api.recibofast.com;
        return 301 https://$server_name$request_uri;
    }

    # HTTPS Server
    server {
        listen 443 ssl http2;
        server_name api.recibofast.com;

        # SSL Configuration
        ssl_certificate /etc/nginx/ssl/recibofast.crt;
        ssl_certificate_key /etc/nginx/ssl/recibofast.key;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
        ssl_prefer_server_ciphers off;
        ssl_session_cache shared:SSL:10m;
        ssl_session_timeout 10m;

        # API Routes
        location /api/ {
            limit_req zone=api burst=20 nodelay;
            
            proxy_pass http://recibofast_backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            
            # Timeouts
            proxy_connect_timeout 30s;
            proxy_send_timeout 30s;
            proxy_read_timeout 30s;
            
            # Buffer settings
            proxy_buffering on;
            proxy_buffer_size 4k;
            proxy_buffers 8 4k;
        }

        # Auth Routes (more restrictive)
        location /api/auth/ {
            limit_req zone=login burst=5 nodelay;
            
            proxy_pass http://recibofast_backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Health Check
        location /health {
            proxy_pass http://recibofast_backend;
            access_log off;
        }

        # Static files (if any)
        location /static/ {
            alias /var/www/static/;
            expires 1y;
            add_header Cache-Control "public, immutable";
        }

        # Security
        location ~ /\. {
            deny all;
        }
    }
}
```

## ☸️ Kubernetes (Produção)

### 🚀 Deployment

```yaml
# k8s/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: recibofast-api
  namespace: recibofast
  labels:
    app: recibofast-api
    version: v1.0.0
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  selector:
    matchLabels:
      app: recibofast-api
  template:
    metadata:
      labels:
        app: recibofast-api
        version: v1.0.0
    spec:
      containers:
      - name: recibofast-api
        image: recibofast/api:v1.0.0
        ports:
        - containerPort: 8080
          name: http
        env:
        - name: ENV
          value: "production"
        - name: DB_HOST
          valueFrom:
            secretKeyRef:
              name: recibofast-secrets
              key: db-host
        - name: DB_USER
          valueFrom:
            secretKeyRef:
              name: recibofast-secrets
              key: db-user
        - name: DB_PASSWORD
          valueFrom:
            secretKeyRef:
              name: recibofast-secrets
              key: db-password
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: recibofast-secrets
              key: jwt-secret
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 8080
          initialDelaySeconds: 30
          periodSeconds: 10
          timeoutSeconds: 5
          failureThreshold: 3
        readinessProbe:
          httpGet:
            path: /health
            port: 8080
          initialDelaySeconds: 5
          periodSeconds: 5
          timeoutSeconds: 3
          failureThreshold: 3
        volumeMounts:
        - name: config-volume
          mountPath: /app/configs
        - name: logs-volume
          mountPath: /app/logs
      volumes:
      - name: config-volume
        configMap:
          name: recibofast-config
      - name: logs-volume
        emptyDir: {}
      imagePullSecrets:
      - name: recibofast-registry-secret
---
apiVersion: v1
kind: Service
metadata:
  name: recibofast-api-service
  namespace: recibofast
  labels:
    app: recibofast-api
spec:
  selector:
    app: recibofast-api
  ports:
  - port: 80
    targetPort: 8080
    protocol: TCP
    name: http
  type: ClusterIP
```

### 🔐 ConfigMap e Secrets

```yaml
# k8s/configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: recibofast-config
  namespace: recibofast
data:
  app.yaml: |
    server:
      port: 8080
      read_timeout: 30s
      write_timeout: 30s
      idle_timeout: 120s
    
    cors:
      allowed_origins:
        - "https://app.recibofast.com"
        - "https://www.recibofast.com"
      allowed_methods:
        - "GET"
        - "POST"
        - "PUT"
        - "DELETE"
        - "OPTIONS"
      allowed_headers:
        - "Content-Type"
        - "Authorization"
        - "X-Requested-With"
      allow_credentials: true
    
    rate_limit:
      global: 1000
      per_ip: 100
      per_user: 200
    
    logging:
      level: "info"
      format: "json"
      output: "stdout"

---
apiVersion: v1
kind: Secret
metadata:
  name: recibofast-secrets
  namespace: recibofast
type: Opaque
data:
  db-host: <base64-encoded-db-host>
  db-user: <base64-encoded-db-user>
  db-password: <base64-encoded-db-password>
  db-name: <base64-encoded-db-name>
  jwt-secret: <base64-encoded-jwt-secret>
  encryption-key: <base64-encoded-encryption-key>
  redis-host: <base64-encoded-redis-host>
  redis-password: <base64-encoded-redis-password>
```

### 🌐 Ingress

```yaml
# k8s/ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: recibofast-ingress
  namespace: recibofast
  annotations:
    kubernetes.io/ingress.class: "nginx"
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
    nginx.ingress.kubernetes.io/rate-limit: "100"
    nginx.ingress.kubernetes.io/rate-limit-window: "1m"
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/force-ssl-redirect: "true"
    nginx.ingress.kubernetes.io/proxy-body-size: "10m"
spec:
  tls:
  - hosts:
    - api.recibofast.com
    secretName: recibofast-tls
  rules:
  - host: api.recibofast.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: recibofast-api-service
            port:
              number: 80
```

### 📊 HorizontalPodAutoscaler

```yaml
# k8s/hpa.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: recibofast-api-hpa
  namespace: recibofast
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: recibofast-api
  minReplicas: 3
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
      - type: Percent
        value: 10
        periodSeconds: 60
    scaleUp:
      stabilizationWindowSeconds: 60
      policies:
      - type: Percent
        value: 50
        periodSeconds: 60
```

## 🔄 CI/CD Pipeline

### 🚀 GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy ReciboFast API

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: recibofast/api

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: recibofast_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
      
      redis:
        image: redis:7
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 6379:6379

    steps:
    - uses: actions/checkout@v4
    
    - name: Set up Go
      uses: actions/setup-go@v4
      with:
        go-version: '1.21'
    
    - name: Cache Go modules
      uses: actions/cache@v3
      with:
        path: ~/go/pkg/mod
        key: ${{ runner.os }}-go-${{ hashFiles('**/go.sum') }}
        restore-keys: |
          ${{ runner.os }}-go-
    
    - name: Install dependencies
      run: go mod download
    
    - name: Run tests
      env:
        DB_HOST: localhost
        DB_PORT: 5432
        DB_USER: postgres
        DB_PASSWORD: postgres
        DB_NAME: recibofast_test
        REDIS_HOST: localhost
        REDIS_PORT: 6379
        JWT_SECRET: test-secret-key-for-testing-only
      run: |
        go test -v -race -coverprofile=coverage.out ./...
        go tool cover -html=coverage.out -o coverage.html
    
    - name: Upload coverage to Codecov
      uses: codecov/codecov-action@v3
      with:
        file: ./coverage.out
    
    - name: Run security scan
      run: |
        go install github.com/securecodewarrior/gosec/v2/cmd/gosec@latest
        gosec ./...
    
    - name: Run linter
      uses: golangci/golangci-lint-action@v3
      with:
        version: latest

  build:
    needs: test
    runs-on: ubuntu-latest
    if: github.event_name == 'push'
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Set up Docker Buildx
      uses: docker/setup-buildx-action@v3
    
    - name: Log in to Container Registry
      uses: docker/login-action@v3
      with:
        registry: ${{ env.REGISTRY }}
        username: ${{ github.actor }}
        password: ${{ secrets.GITHUB_TOKEN }}
    
    - name: Extract metadata
      id: meta
      uses: docker/metadata-action@v5
      with:
        images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
        tags: |
          type=ref,event=branch
          type=ref,event=pr
          type=sha,prefix={{branch}}-
          type=raw,value=latest,enable={{is_default_branch}}
    
    - name: Build and push Docker image
      uses: docker/build-push-action@v5
      with:
        context: .
        push: true
        tags: ${{ steps.meta.outputs.tags }}
        labels: ${{ steps.meta.outputs.labels }}
        cache-from: type=gha
        cache-to: type=gha,mode=max

  deploy-staging:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/develop'
    environment: staging
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Configure kubectl
      uses: azure/k8s-set-context@v3
      with:
        method: kubeconfig
        kubeconfig: ${{ secrets.KUBE_CONFIG_STAGING }}
    
    - name: Deploy to staging
      run: |
        kubectl set image deployment/recibofast-api recibofast-api=${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:develop -n recibofast-staging
        kubectl rollout status deployment/recibofast-api -n recibofast-staging
    
    - name: Run smoke tests
      run: |
        # Aguardar deployment
        sleep 30
        
        # Testar health endpoint
        curl -f https://api-staging.recibofast.com/health || exit 1
        
        # Testar endpoint de autenticação
        curl -f -X POST https://api-staging.recibofast.com/api/auth/login \
          -H "Content-Type: application/json" \
          -d '{"email":"test@example.com","password":"wrongpassword"}' || true

  deploy-production:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    environment: production
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Configure kubectl
      uses: azure/k8s-set-context@v3
      with:
        method: kubeconfig
        kubeconfig: ${{ secrets.KUBE_CONFIG_PROD }}
    
    - name: Deploy to production
      run: |
        kubectl set image deployment/recibofast-api recibofast-api=${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:latest -n recibofast
        kubectl rollout status deployment/recibofast-api -n recibofast
    
    - name: Run production smoke tests
      run: |
        sleep 30
        curl -f https://api.recibofast.com/health || exit 1
    
    - name: Notify deployment
      uses: 8398a7/action-slack@v3
      with:
        status: ${{ job.status }}
        channel: '#deployments'
        webhook_url: ${{ secrets.SLACK_WEBHOOK }}
      if: always()
```

## 🌍 Ambientes

### 🔧 Configuração por Ambiente

```go
// internal/config/environment.go
package config

import (
    "fmt"
    "os"
)

type Environment string

const (
    Development Environment = "development"
    Testing     Environment = "testing"
    Staging     Environment = "staging"
    Production  Environment = "production"
)

type EnvironmentConfig struct {
    Environment Environment
    
    // Database
    DatabaseConfig DatabaseConfig
    
    // Redis
    RedisConfig RedisConfig
    
    // Server
    ServerConfig ServerConfig
    
    // Security
    SecurityConfig SecurityConfig
    
    // Logging
    LoggingConfig LoggingConfig
    
    // Monitoring
    MonitoringConfig MonitoringConfig
}

func LoadEnvironmentConfig() (*EnvironmentConfig, error) {
    env := Environment(os.Getenv("ENV"))
    if env == "" {
        env = Development
    }
    
    config := &EnvironmentConfig{
        Environment: env,
    }
    
    switch env {
    case Development:
        return loadDevelopmentConfig(config)
    case Testing:
        return loadTestingConfig(config)
    case Staging:
        return loadStagingConfig(config)
    case Production:
        return loadProductionConfig(config)
    default:
        return nil, fmt.Errorf("unknown environment: %s", env)
    }
}

func loadDevelopmentConfig(config *EnvironmentConfig) (*EnvironmentConfig, error) {
    config.DatabaseConfig = DatabaseConfig{
        Host:     "localhost",
        Port:     5432,
        User:     "recibofast",
        Password: "recibofast123",
        Database: "recibofast_dev",
        SSLMode:  "disable",
        MaxConns: 10,
    }
    
    config.RedisConfig = RedisConfig{
        Host:     "localhost",
        Port:     6379,
        Password: "",
        DB:       0,
    }
    
    config.ServerConfig = ServerConfig{
        Port:         8080,
        ReadTimeout:  30,
        WriteTimeout: 30,
        IdleTimeout:  120,
    }
    
    config.SecurityConfig = SecurityConfig{
        JWTSecret:           "dev-jwt-secret-key",
        JWTExpiration:       15 * 60, // 15 minutes
        JWTRefreshExpiration: 7 * 24 * 60 * 60, // 7 days
        AllowedOrigins:      []string{"http://localhost:3000", "http://localhost:5173"},
    }
    
    config.LoggingConfig = LoggingConfig{
        Level:  "debug",
        Format: "text",
        Output: "stdout",
    }
    
    config.MonitoringConfig = MonitoringConfig{
        EnableMetrics: true,
        EnableTracing: true,
        MetricsPort:   9090,
    }
    
    return config, nil
}

func loadTestingConfig(config *EnvironmentConfig) (*EnvironmentConfig, error) {
    config.DatabaseConfig = DatabaseConfig{
        Host:     "localhost",
        Port:     5432,
        User:     "postgres",
        Password: "postgres",
        Database: "recibofast_test",
        SSLMode:  "disable",
        MaxConns: 5,
    }
    
    config.RedisConfig = RedisConfig{
        Host:     "localhost",
        Port:     6379,
        Password: "",
        DB:       1, // Use different DB for tests
    }
    
    config.ServerConfig = ServerConfig{
        Port:         8081,
        ReadTimeout:  10,
        WriteTimeout: 10,
        IdleTimeout:  30,
    }
    
    config.SecurityConfig = SecurityConfig{
        JWTSecret:           "test-jwt-secret-key",
        JWTExpiration:       5 * 60, // 5 minutes for faster testing
        JWTRefreshExpiration: 60 * 60, // 1 hour
        AllowedOrigins:      []string{"*"},
    }
    
    config.LoggingConfig = LoggingConfig{
        Level:  "error", // Reduce noise in tests
        Format: "json",
        Output: "stdout",
    }
    
    config.MonitoringConfig = MonitoringConfig{
        EnableMetrics: false,
        EnableTracing: false,
    }
    
    return config, nil
}

func loadStagingConfig(config *EnvironmentConfig) (*EnvironmentConfig, error) {
    config.DatabaseConfig = DatabaseConfig{
        Host:     os.Getenv("DB_HOST"),
        Port:     5432,
        User:     os.Getenv("DB_USER"),
        Password: os.Getenv("DB_PASSWORD"),
        Database: os.Getenv("DB_NAME"),
        SSLMode:  "require",
        MaxConns: 20,
    }
    
    config.RedisConfig = RedisConfig{
        Host:     os.Getenv("REDIS_HOST"),
        Port:     6379,
        Password: os.Getenv("REDIS_PASSWORD"),
        DB:       0,
    }
    
    config.ServerConfig = ServerConfig{
        Port:         8080,
        ReadTimeout:  30,
        WriteTimeout: 30,
        IdleTimeout:  120,
    }
    
    config.SecurityConfig = SecurityConfig{
        JWTSecret:           os.Getenv("JWT_SECRET"),
        JWTExpiration:       15 * 60,
        JWTRefreshExpiration: 7 * 24 * 60 * 60,
        AllowedOrigins:      []string{"https://app-staging.recibofast.com"},
    }
    
    config.LoggingConfig = LoggingConfig{
        Level:  "info",
        Format: "json",
        Output: "stdout",
    }
    
    config.MonitoringConfig = MonitoringConfig{
        EnableMetrics: true,
        EnableTracing: true,
        MetricsPort:   9090,
    }
    
    return config, nil
}

func loadProductionConfig(config *EnvironmentConfig) (*EnvironmentConfig, error) {
    config.DatabaseConfig = DatabaseConfig{
        Host:     os.Getenv("DB_HOST"),
        Port:     5432,
        User:     os.Getenv("DB_USER"),
        Password: os.Getenv("DB_PASSWORD"),
        Database: os.Getenv("DB_NAME"),
        SSLMode:  "require",
        MaxConns: 50,
    }
    
    config.RedisConfig = RedisConfig{
        Host:     os.Getenv("REDIS_HOST"),
        Port:     6379,
        Password: os.Getenv("REDIS_PASSWORD"),
        DB:       0,
    }
    
    config.ServerConfig = ServerConfig{
        Port:         8080,
        ReadTimeout:  30,
        WriteTimeout: 30,
        IdleTimeout:  120,
    }
    
    config.SecurityConfig = SecurityConfig{
        JWTSecret:           os.Getenv("JWT_SECRET"),
        JWTExpiration:       15 * 60,
        JWTRefreshExpiration: 7 * 24 * 60 * 60,
        AllowedOrigins:      []string{"https://app.recibofast.com", "https://www.recibofast.com"},
    }
    
    config.LoggingConfig = LoggingConfig{
        Level:  "info",
        Format: "json",
        Output: "stdout",
    }
    
    config.MonitoringConfig = MonitoringConfig{
        EnableMetrics: true,
        EnableTracing: true,
        MetricsPort:   9090,
    }
    
    return config, nil
}
```

## 📊 Monitoramento e Observabilidade

### 📈 Configuração do Prometheus

```yaml
# configs/prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  - "alert_rules.yml"

alerting:
  alertmanagers:
    - static_configs:
        - targets:
          - alertmanager:9093

scrape_configs:
  - job_name: 'recibofast-api'
    static_configs:
      - targets: ['app:8080']
    metrics_path: '/metrics'
    scrape_interval: 10s
    
  - job_name: 'postgres'
    static_configs:
      - targets: ['postgres-exporter:9187']
    
  - job_name: 'redis'
    static_configs:
      - targets: ['redis-exporter:9121']
    
  - job_name: 'nginx'
    static_configs:
      - targets: ['nginx-exporter:9113']
    
  - job_name: 'node'
    static_configs:
      - targets: ['node-exporter:9100']
```

### 🚨 Regras de Alerta

```yaml
# configs/alert_rules.yml
groups:
- name: recibofast-api
  rules:
  - alert: HighErrorRate
    expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.1
    for: 5m
    labels:
      severity: critical
    annotations:
      summary: "High error rate detected"
      description: "Error rate is {{ $value }} errors per second"
      
  - alert: HighResponseTime
    expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 1
    for: 5m
    labels:
      severity: warning
    annotations:
      summary: "High response time detected"
      description: "95th percentile response time is {{ $value }} seconds"
      
  - alert: DatabaseConnectionsHigh
    expr: pg_stat_activity_count > 80
    for: 5m
    labels:
      severity: warning
    annotations:
      summary: "High number of database connections"
      description: "Database has {{ $value }} active connections"
      
  - alert: RedisMemoryHigh
    expr: redis_memory_used_bytes / redis_memory_max_bytes > 0.8
    for: 5m
    labels:
      severity: warning
    annotations:
      summary: "Redis memory usage is high"
      description: "Redis memory usage is {{ $value | humanizePercentage }}"
      
  - alert: ServiceDown
    expr: up == 0
    for: 1m
    labels:
      severity: critical
    annotations:
      summary: "Service is down"
      description: "{{ $labels.job }} service is down"
```

## 🔧 Scripts de Deploy

### 🚀 Script de Deploy Automatizado

```bash
#!/bin/bash
# scripts/deploy.sh

set -e

# Configurações
ENVIRONMENT=${1:-staging}
IMAGE_TAG=${2:-latest}
NAMESPACE="recibofast-${ENVIRONMENT}"

echo "🚀 Iniciando deploy para ambiente: $ENVIRONMENT"
echo "📦 Usando imagem: recibofast/api:$IMAGE_TAG"

# Verificar se kubectl está configurado
if ! kubectl cluster-info &> /dev/null; then
    echo "❌ kubectl não está configurado corretamente"
    exit 1
fi

# Verificar se o namespace existe
if ! kubectl get namespace $NAMESPACE &> /dev/null; then
    echo "📁 Criando namespace: $NAMESPACE"
    kubectl create namespace $NAMESPACE
fi

# Aplicar configurações
echo "⚙️ Aplicando configurações..."
kubectl apply -f k8s/configmap.yaml -n $NAMESPACE
kubectl apply -f k8s/secrets.yaml -n $NAMESPACE

# Deploy da aplicação
echo "🔄 Fazendo deploy da aplicação..."
kubectl set image deployment/recibofast-api recibofast-api=recibofast/api:$IMAGE_TAG -n $NAMESPACE

# Aguardar rollout
echo "⏳ Aguardando rollout..."
kubectl rollout status deployment/recibofast-api -n $NAMESPACE --timeout=300s

# Verificar health
echo "🏥 Verificando saúde da aplicação..."
sleep 30

if [ "$ENVIRONMENT" = "production" ]; then
    HEALTH_URL="https://api.recibofast.com/health"
else
    HEALTH_URL="https://api-${ENVIRONMENT}.recibofast.com/health"
fi

if curl -f $HEALTH_URL > /dev/null 2>&1; then
    echo "✅ Deploy realizado com sucesso!"
    echo "🌐 Aplicação disponível em: $HEALTH_URL"
else
    echo "❌ Falha no health check"
    echo "📋 Logs da aplicação:"
    kubectl logs -l app=recibofast-api -n $NAMESPACE --tail=50
    exit 1
fi

# Limpeza de imagens antigas (manter apenas as 3 mais recentes)
echo "🧹 Limpando imagens antigas..."
kubectl get replicasets -n $NAMESPACE -o jsonpath='{.items[*].metadata.name}' | \
    tr ' ' '\n' | \
    grep recibofast-api | \
    sort -r | \
    tail -n +4 | \
    xargs -r kubectl delete replicaset -n $NAMESPACE

echo "🎉 Deploy concluído com sucesso!"
```

### 🔄 Script de Rollback

```bash
#!/bin/bash
# scripts/rollback.sh

set -e

ENVIRONMENT=${1:-staging}
NAMESPACE="recibofast-${ENVIRONMENT}"

echo "🔄 Iniciando rollback para ambiente: $ENVIRONMENT"

# Verificar histórico de rollouts
echo "📋 Histórico de rollouts:"
kubectl rollout history deployment/recibofast-api -n $NAMESPACE

# Fazer rollback
echo "⏪ Fazendo rollback..."
kubectl rollout undo deployment/recibofast-api -n $NAMESPACE

# Aguardar rollback
echo "⏳ Aguardando rollback..."
kubectl rollout status deployment/recibofast-api -n $NAMESPACE --timeout=300s

# Verificar health
echo "🏥 Verificando saúde da aplicação..."
sleep 30

if [ "$ENVIRONMENT" = "production" ]; then
    HEALTH_URL="https://api.recibofast.com/health"
else
    HEALTH_URL="https://api-${ENVIRONMENT}.recibofast.com/health"
fi

if curl -f $HEALTH_URL > /dev/null 2>&1; then
    echo "✅ Rollback realizado com sucesso!"
else
    echo "❌ Falha no health check após rollback"
    kubectl logs -l app=recibofast-api -n $NAMESPACE --tail=50
    exit 1
fi

echo "🎉 Rollback concluído com sucesso!"
```

## 📚 Checklist de Deploy

### ✅ Pré-Deploy

- [x] Testes unitários passando
- [x] Testes de integração passando
- [x] Análise de segurança executada
- [x] Linter executado sem erros
- [x] Cobertura de testes adequada (>80%)
- [x] Documentação atualizada
- [x] Variáveis de ambiente configuradas
- [x] Secrets configurados
- [x] Backup do banco de dados realizado

### 🚀 Deploy

- [x] Build da imagem Docker
- [x] Push para registry
- [x] Deploy para staging
- [x] Smoke tests em staging
- [x] Aprovação para produção
- [x] Deploy para produção
- [x] Health checks
- [x] Monitoramento ativo

### 📊 Pós-Deploy

- [x] Verificar métricas de performance
- [x] Verificar logs de erro
- [x] Verificar alertas
- [x] Testar funcionalidades críticas
- [x] Notificar equipe
- [x] Documentar mudanças

## 🛠️ Comandos Úteis

### 🐳 Docker

```bash
# Build da imagem
docker build -t recibofast/api:latest .

# Executar localmente
docker run -p 8080:8080 --env-file .env recibofast/api:latest

# Docker Compose
docker-compose up -d
docker-compose logs -f app
docker-compose down

# Limpeza
docker system prune -a
```

### ☸️ Kubernetes

```bash
# Deploy
kubectl apply -f k8s/ -n recibofast

# Status
kubectl get pods -n recibofast
kubectl get services -n recibofast
kubectl get ingress -n recibofast

# Logs
kubectl logs -l app=recibofast-api -n recibofast -f

# Scaling
kubectl scale deployment recibofast-api --replicas=5 -n recibofast

# Port forward para debug
kubectl port-forward svc/recibofast-api-service 8080:80 -n recibofast
```

## 📚 Referências

- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [Go Docker Images](https://hub.docker.com/_/golang)
- [Nginx Configuration](https://nginx.org/en/docs/)
- [Prometheus Monitoring](https://prometheus.io/docs/)
- [GitHub Actions](https://docs.github.com/en/actions)

---

*Última atualização: 29-08-2025*