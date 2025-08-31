# 📊 Monitoramento e Observabilidade - Backend ReciboFast

**Autor:** David Assef  
**Data:** 29-08-2025  
**Licença:** MIT License  

## 📋 Visão Geral

Este documento detalha a estratégia de monitoramento, observabilidade, logging, métricas e alertas implementados no backend do ReciboFast para garantir alta disponibilidade, performance e detecção proativa de problemas.

## 🎯 Pilares da Observabilidade

### 📊 Os Três Pilares

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│     LOGS        │    │    MÉTRICAS     │    │     TRACES      │
│                 │    │                 │    │                 │
│ • Eventos       │    │ • Performance   │    │ • Requisições   │
│ • Erros         │    │ • Recursos      │    │ • Latência      │
│ • Auditoria     │    │ • Negócio       │    │ • Dependências  │
│ • Debug         │    │ • Alertas       │    │ • Gargalos      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │  OBSERVABILIDADE │
                    │                 │
                    │ • Dashboards    │
                    │ • Alertas       │
                    │ • SLIs/SLOs     │
                    │ • Troubleshoot  │
                    └─────────────────┘
```

## 📝 Sistema de Logging

### 🏗️ Estrutura de Logs

```go
// internal/logging/logger.go
package logging

import (
    "context"
    "os"
    "time"

    "github.com/sirupsen/logrus"
    "github.com/google/uuid"
)

type Logger struct {
    *logrus.Logger
}

type LogEntry struct {
    *logrus.Entry
}

type Fields map[string]interface{}

// Configuração do logger
func NewLogger(level string, format string) *Logger {
    logger := logrus.New()
    
    // Configurar nível
    switch level {
    case "debug":
        logger.SetLevel(logrus.DebugLevel)
    case "info":
        logger.SetLevel(logrus.InfoLevel)
    case "warn":
        logger.SetLevel(logrus.WarnLevel)
    case "error":
        logger.SetLevel(logrus.ErrorLevel)
    default:
        logger.SetLevel(logrus.InfoLevel)
    }
    
    // Configurar formato
    if format == "json" {
        logger.SetFormatter(&logrus.JSONFormatter{
            TimestampFormat: time.RFC3339Nano,
            FieldMap: logrus.FieldMap{
                logrus.FieldKeyTime:  "timestamp",
                logrus.FieldKeyLevel: "level",
                logrus.FieldKeyMsg:   "message",
            },
        })
    } else {
        logger.SetFormatter(&logrus.TextFormatter{
            FullTimestamp:   true,
            TimestampFormat: "2006-01-02 15:04:05",
        })
    }
    
    logger.SetOutput(os.Stdout)
    
    return &Logger{Logger: logger}
}

// Contexto com trace ID
func (l *Logger) WithContext(ctx context.Context) *LogEntry {
    entry := l.WithFields(logrus.Fields{})
    
    // Extrair trace ID do contexto
    if traceID := ctx.Value("trace_id"); traceID != nil {
        entry = entry.WithField("trace_id", traceID)
    }
    
    // Extrair user ID do contexto
    if userID := ctx.Value("user_id"); userID != nil {
        entry = entry.WithField("user_id", userID)
    }
    
    return &LogEntry{Entry: entry}
}

// Logs estruturados
func (l *Logger) WithFields(fields Fields) *LogEntry {
    return &LogEntry{Entry: l.Logger.WithFields(logrus.Fields(fields))}
}

// Logs de requisição HTTP
func (l *Logger) LogHTTPRequest(ctx context.Context, method, path string, statusCode int, duration time.Duration, userID *uuid.UUID) {
    fields := Fields{
        "component":    "http",
        "method":       method,
        "path":         path,
        "status_code":  statusCode,
        "duration_ms":  duration.Milliseconds(),
        "trace_id":     ctx.Value("trace_id"),
    }
    
    if userID != nil {
        fields["user_id"] = userID.String()
    }
    
    entry := l.WithFields(fields)
    
    if statusCode >= 500 {
        entry.Error("HTTP request completed with server error")
    } else if statusCode >= 400 {
        entry.Warn("HTTP request completed with client error")
    } else {
        entry.Info("HTTP request completed successfully")
    }
}

// Logs de banco de dados
func (l *Logger) LogDBQuery(ctx context.Context, query string, duration time.Duration, err error) {
    fields := Fields{
        "component":   "database",
        "query":       query,
        "duration_ms": duration.Milliseconds(),
        "trace_id":    ctx.Value("trace_id"),
    }
    
    entry := l.WithFields(fields)
    
    if err != nil {
        entry.WithError(err).Error("Database query failed")
    } else if duration > 1000*time.Millisecond {
        entry.Warn("Slow database query detected")
    } else {
        entry.Debug("Database query executed")
    }
}

// Logs de negócio
func (l *Logger) LogBusinessEvent(ctx context.Context, event string, entityType string, entityID uuid.UUID, details Fields) {
    fields := Fields{
        "component":   "business",
        "event":       event,
        "entity_type": entityType,
        "entity_id":   entityID.String(),
        "trace_id":    ctx.Value("trace_id"),
        "user_id":     ctx.Value("user_id"),
    }
    
    // Adicionar detalhes específicos
    for k, v := range details {
        fields[k] = v
    }
    
    l.WithFields(fields).Info("Business event occurred")
}

// Logs de erro
func (l *Logger) LogError(ctx context.Context, err error, component string, details Fields) {
    fields := Fields{
        "component": component,
        "trace_id":  ctx.Value("trace_id"),
        "user_id":   ctx.Value("user_id"),
    }
    
    for k, v := range details {
        fields[k] = v
    }
    
    l.WithFields(fields).WithError(err).Error("Error occurred")
}
```

### 🔍 Middleware de Logging

```go
// internal/middleware/logging.go
package middleware

import (
    "context"
    "time"

    "github.com/gin-gonic/gin"
    "github.com/google/uuid"
    
    "recibo-fast/internal/logging"
)

func LoggingMiddleware(logger *logging.Logger) gin.HandlerFunc {
    return func(c *gin.Context) {
        start := time.Now()
        
        // Gerar trace ID
        traceID := uuid.New().String()
        c.Set("trace_id", traceID)
        
        // Adicionar ao contexto
        ctx := context.WithValue(c.Request.Context(), "trace_id", traceID)
        c.Request = c.Request.WithContext(ctx)
        
        // Processar requisição
        c.Next()
        
        // Log da requisição
        duration := time.Since(start)
        
        var userID *uuid.UUID
        if uid, exists := c.Get("user_id"); exists {
            if parsedUID, ok := uid.(uuid.UUID); ok {
                userID = &parsedUID
            }
        }
        
        logger.LogHTTPRequest(
            ctx,
            c.Request.Method,
            c.Request.URL.Path,
            c.Writer.Status(),
            duration,
            userID,
        )
    }
}

// Middleware para capturar panics
func PanicRecoveryMiddleware(logger *logging.Logger) gin.HandlerFunc {
    return func(c *gin.Context) {
        defer func() {
            if err := recover(); err != nil {
                logger.LogError(
                    c.Request.Context(),
                    fmt.Errorf("panic recovered: %v", err),
                    "middleware",
                    logging.Fields{
                        "method": c.Request.Method,
                        "path":   c.Request.URL.Path,
                        "stack":  string(debug.Stack()),
                    },
                )
                
                c.JSON(500, gin.H{"error": "Internal server error"})
                c.Abort()
            }
        }()
        
        c.Next()
    }
}
```

## 📊 Sistema de Métricas

### 🎯 Métricas Implementadas

```go
// internal/metrics/metrics.go
package metrics

import (
    "time"

    "github.com/prometheus/client_golang/prometheus"
    "github.com/prometheus/client_golang/prometheus/promauto"
)

type Metrics struct {
    // Métricas HTTP
    HTTPRequestsTotal     *prometheus.CounterVec
    HTTPRequestDuration   *prometheus.HistogramVec
    HTTPRequestsInFlight  *prometheus.GaugeVec
    
    // Métricas de banco de dados
    DBConnectionsActive   prometheus.Gauge
    DBConnectionsIdle     prometheus.Gauge
    DBQueryDuration       *prometheus.HistogramVec
    DBQueriesTotal        *prometheus.CounterVec
    
    // Métricas de negócio
    ReceitasTotal         *prometheus.CounterVec
    ReceitasValorTotal    *prometheus.CounterVec
    UsuariosAtivos        prometheus.Gauge
    
    // Métricas de sistema
    GoRoutines            prometheus.Gauge
    MemoryUsage           prometheus.Gauge
    CPUUsage              prometheus.Gauge
}

func NewMetrics() *Metrics {
    return &Metrics{
        // HTTP Metrics
        HTTPRequestsTotal: promauto.NewCounterVec(
            prometheus.CounterOpts{
                Name: "http_requests_total",
                Help: "Total number of HTTP requests",
            },
            []string{"method", "path", "status_code"},
        ),
        
        HTTPRequestDuration: promauto.NewHistogramVec(
            prometheus.HistogramOpts{
                Name:    "http_request_duration_seconds",
                Help:    "HTTP request duration in seconds",
                Buckets: prometheus.DefBuckets,
            },
            []string{"method", "path"},
        ),
        
        HTTPRequestsInFlight: promauto.NewGaugeVec(
            prometheus.GaugeOpts{
                Name: "http_requests_in_flight",
                Help: "Number of HTTP requests currently being processed",
            },
            []string{"method", "path"},
        ),
        
        // Database Metrics
        DBConnectionsActive: promauto.NewGauge(
            prometheus.GaugeOpts{
                Name: "db_connections_active",
                Help: "Number of active database connections",
            },
        ),
        
        DBConnectionsIdle: promauto.NewGauge(
            prometheus.GaugeOpts{
                Name: "db_connections_idle",
                Help: "Number of idle database connections",
            },
        ),
        
        DBQueryDuration: promauto.NewHistogramVec(
            prometheus.HistogramOpts{
                Name:    "db_query_duration_seconds",
                Help:    "Database query duration in seconds",
                Buckets: []float64{0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1.0, 2.0, 5.0},
            },
            []string{"operation", "table"},
        ),
        
        DBQueriesTotal: promauto.NewCounterVec(
            prometheus.CounterOpts{
                Name: "db_queries_total",
                Help: "Total number of database queries",
            },
            []string{"operation", "table", "status"},
        ),
        
        // Business Metrics
        ReceitasTotal: promauto.NewCounterVec(
            prometheus.CounterOpts{
                Name: "receitas_total",
                Help: "Total number of receitas created",
            },
            []string{"status", "user_id"},
        ),
        
        ReceitasValorTotal: promauto.NewCounterVec(
            prometheus.CounterOpts{
                Name: "receitas_valor_total",
                Help: "Total value of receitas in cents",
            },
            []string{"status", "currency"},
        ),
        
        UsuariosAtivos: promauto.NewGauge(
            prometheus.GaugeOpts{
                Name: "usuarios_ativos",
                Help: "Number of active users in the last 24 hours",
            },
        ),
        
        // System Metrics
        GoRoutines: promauto.NewGauge(
            prometheus.GaugeOpts{
                Name: "go_routines",
                Help: "Number of goroutines",
            },
        ),
        
        MemoryUsage: promauto.NewGauge(
            prometheus.GaugeOpts{
                Name: "memory_usage_bytes",
                Help: "Memory usage in bytes",
            },
        ),
        
        CPUUsage: promauto.NewGauge(
            prometheus.GaugeOpts{
                Name: "cpu_usage_percent",
                Help: "CPU usage percentage",
            },
        ),
    }
}

// Registrar métricas HTTP
func (m *Metrics) RecordHTTPRequest(method, path, statusCode string, duration time.Duration) {
    m.HTTPRequestsTotal.WithLabelValues(method, path, statusCode).Inc()
    m.HTTPRequestDuration.WithLabelValues(method, path).Observe(duration.Seconds())
}

// Registrar métricas de banco
func (m *Metrics) RecordDBQuery(operation, table, status string, duration time.Duration) {
    m.DBQueriesTotal.WithLabelValues(operation, table, status).Inc()
    m.DBQueryDuration.WithLabelValues(operation, table).Observe(duration.Seconds())
}

// Registrar criação de receita
func (m *Metrics) RecordReceitaCreated(status, userID string, valor float64) {
    m.ReceitasTotal.WithLabelValues(status, userID).Inc()
    m.ReceitasValorTotal.WithLabelValues(status, "BRL").Add(valor)
}

// Atualizar métricas de sistema
func (m *Metrics) UpdateSystemMetrics() {
    // Implementar coleta de métricas de sistema
    // Goroutines, memória, CPU, etc.
}
```

### 🔧 Middleware de Métricas

```go
// internal/middleware/metrics.go
package middleware

import (
    "strconv"
    "time"

    "github.com/gin-gonic/gin"
    
    "recibo-fast/internal/metrics"
)

func MetricsMiddleware(m *metrics.Metrics) gin.HandlerFunc {
    return func(c *gin.Context) {
        start := time.Now()
        
        // Incrementar requests em andamento
        m.HTTPRequestsInFlight.WithLabelValues(c.Request.Method, c.FullPath()).Inc()
        
        // Processar requisição
        c.Next()
        
        // Decrementar requests em andamento
        m.HTTPRequestsInFlight.WithLabelValues(c.Request.Method, c.FullPath()).Dec()
        
        // Registrar métricas
        duration := time.Since(start)
        statusCode := strconv.Itoa(c.Writer.Status())
        
        m.RecordHTTPRequest(
            c.Request.Method,
            c.FullPath(),
            statusCode,
            duration,
        )
    }
}
```

## 🔍 Distributed Tracing

### 📡 Configuração do Jaeger

```go
// internal/tracing/tracer.go
package tracing

import (
    "context"
    "io"
    "time"

    "github.com/opentracing/opentracing-go"
    "github.com/uber/jaeger-client-go"
    "github.com/uber/jaeger-client-go/config"
    "github.com/uber/jaeger-client-go/log"
    "github.com/uber/jaeger-client-go/metrics"
)

type Tracer struct {
    tracer opentracing.Tracer
    closer io.Closer
}

func NewTracer(serviceName, jaegerEndpoint string) (*Tracer, error) {
    cfg := config.Configuration{
        ServiceName: serviceName,
        Sampler: &config.SamplerConfig{
            Type:  jaeger.SamplerTypeConst,
            Param: 1, // Sample 100% of traces
        },
        Reporter: &config.ReporterConfig{
            LogSpans:            true,
            BufferFlushInterval: 1 * time.Second,
            LocalAgentHostPort:  jaegerEndpoint,
        },
    }

    tracer, closer, err := cfg.NewTracer(
        config.Logger(log.StdLogger),
        config.Metrics(metrics.NullFactory),
    )
    if err != nil {
        return nil, err
    }

    opentracing.SetGlobalTracer(tracer)

    return &Tracer{
        tracer: tracer,
        closer: closer,
    }, nil
}

func (t *Tracer) Close() error {
    return t.closer.Close()
}

// Iniciar span
func StartSpan(ctx context.Context, operationName string) (opentracing.Span, context.Context) {
    span, ctx := opentracing.StartSpanFromContext(ctx, operationName)
    return span, ctx
}

// Adicionar tags ao span
func AddSpanTags(span opentracing.Span, tags map[string]interface{}) {
    for key, value := range tags {
        span.SetTag(key, value)
    }
}

// Registrar erro no span
func LogSpanError(span opentracing.Span, err error) {
    span.SetTag("error", true)
    span.LogFields(
        log.String("event", "error"),
        log.String("message", err.Error()),
    )
}
```

### 🔗 Middleware de Tracing

```go
// internal/middleware/tracing.go
package middleware

import (
    "github.com/gin-gonic/gin"
    "github.com/opentracing/opentracing-go"
    "github.com/opentracing/opentracing-go/ext"
    
    "recibo-fast/internal/tracing"
)

func TracingMiddleware() gin.HandlerFunc {
    return func(c *gin.Context) {
        // Extrair span do contexto ou criar novo
        spanCtx, _ := opentracing.GlobalTracer().Extract(
            opentracing.HTTPHeaders,
            opentracing.HTTPHeadersCarrier(c.Request.Header),
        )
        
        span := opentracing.GlobalTracer().StartSpan(
            c.Request.Method+" "+c.FullPath(),
            ext.RPCServerOption(spanCtx),
        )
        defer span.Finish()
        
        // Adicionar tags
        ext.HTTPMethod.Set(span, c.Request.Method)
        ext.HTTPUrl.Set(span, c.Request.URL.String())
        ext.Component.Set(span, "http-server")
        
        // Adicionar span ao contexto
        ctx := opentracing.ContextWithSpan(c.Request.Context(), span)
        c.Request = c.Request.WithContext(ctx)
        
        // Processar requisição
        c.Next()
        
        // Adicionar status code
        ext.HTTPStatusCode.Set(span, uint16(c.Writer.Status()))
        
        // Marcar erro se necessário
        if c.Writer.Status() >= 400 {
            ext.Error.Set(span, true)
        }
    }
}
```

## 🚨 Sistema de Alertas

### ⚠️ Configuração de Alertas

```yaml
# alerting/rules.yml
groups:
  - name: recibo-fast-backend
    rules:
      # Alertas de disponibilidade
      - alert: ServiceDown
        expr: up{job="recibo-fast-backend"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "ReciboFast Backend is down"
          description: "ReciboFast Backend has been down for more than 1 minute"
      
      # Alertas de performance
      - alert: HighResponseTime
        expr: histogram_quantile(0.95, http_request_duration_seconds_bucket{job="recibo-fast-backend"}) > 2
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High response time detected"
          description: "95th percentile response time is {{ $value }}s"
      
      - alert: HighErrorRate
        expr: rate(http_requests_total{job="recibo-fast-backend",status_code=~"5.."}[5m]) > 0.1
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "High error rate detected"
          description: "Error rate is {{ $value }} errors per second"
      
      # Alertas de banco de dados
      - alert: DatabaseConnectionsHigh
        expr: db_connections_active > 80
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High database connections"
          description: "Database has {{ $value }} active connections"
      
      - alert: SlowDatabaseQueries
        expr: histogram_quantile(0.95, db_query_duration_seconds_bucket) > 1
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Slow database queries detected"
          description: "95th percentile query time is {{ $value }}s"
      
      # Alertas de recursos
      - alert: HighMemoryUsage
        expr: memory_usage_bytes / (1024*1024*1024) > 1
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "High memory usage"
          description: "Memory usage is {{ $value }}GB"
      
      - alert: HighCPUUsage
        expr: cpu_usage_percent > 80
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "High CPU usage"
          description: "CPU usage is {{ $value }}%"
      
      # Alertas de negócio
      - alert: NoReceitasCreated
        expr: increase(receitas_total[1h]) == 0
        for: 2h
        labels:
          severity: warning
        annotations:
          summary: "No receitas created in the last hour"
          description: "No receitas have been created in the last 2 hours"
```

### 📧 Configuração de Notificações

```yaml
# alerting/alertmanager.yml
global:
  smtp_smarthost: 'smtp.gmail.com:587'
  smtp_from: 'alerts@recibofast.com'
  smtp_auth_username: 'alerts@recibofast.com'
  smtp_auth_password: 'app-password'

route:
  group_by: ['alertname']
  group_wait: 10s
  group_interval: 10s
  repeat_interval: 1h
  receiver: 'web.hook'
  routes:
    - match:
        severity: critical
      receiver: 'critical-alerts'
    - match:
        severity: warning
      receiver: 'warning-alerts'

receivers:
  - name: 'web.hook'
    webhook_configs:
      - url: 'http://localhost:5001/'
  
  - name: 'critical-alerts'
    email_configs:
      - to: 'dev-team@recibofast.com'
        subject: '🚨 CRITICAL: {{ .GroupLabels.alertname }}'
        body: |
          {{ range .Alerts }}
          Alert: {{ .Annotations.summary }}
          Description: {{ .Annotations.description }}
          Labels: {{ .Labels }}
          {{ end }}
    slack_configs:
      - api_url: 'https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK'
        channel: '#alerts-critical'
        title: '🚨 Critical Alert'
        text: '{{ .CommonAnnotations.summary }}'
  
  - name: 'warning-alerts'
    email_configs:
      - to: 'dev-team@recibofast.com'
        subject: '⚠️  WARNING: {{ .GroupLabels.alertname }}'
        body: |
          {{ range .Alerts }}
          Alert: {{ .Annotations.summary }}
          Description: {{ .Annotations.description }}
          Labels: {{ .Labels }}
          {{ end }}

inhibit_rules:
  - source_match:
      severity: 'critical'
    target_match:
      severity: 'warning'
    equal: ['alertname', 'instance']
```

## 📊 Dashboards

### 🎛️ Dashboard Principal (Grafana)

```json
{
  "dashboard": {
    "id": null,
    "title": "ReciboFast Backend - Overview",
    "tags": ["recibo-fast", "backend"],
    "timezone": "browser",
    "panels": [
      {
        "id": 1,
        "title": "Request Rate",
        "type": "stat",
        "targets": [
          {
            "expr": "rate(http_requests_total{job=\"recibo-fast-backend\"}[5m])",
            "legendFormat": "Requests/sec"
          }
        ],
        "fieldConfig": {
          "defaults": {
            "unit": "reqps",
            "thresholds": {
              "steps": [
                {"color": "green", "value": null},
                {"color": "yellow", "value": 100},
                {"color": "red", "value": 500}
              ]
            }
          }
        }
      },
      {
        "id": 2,
        "title": "Response Time (95th percentile)",
        "type": "stat",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, http_request_duration_seconds_bucket{job=\"recibo-fast-backend\"})",
            "legendFormat": "95th percentile"
          }
        ],
        "fieldConfig": {
          "defaults": {
            "unit": "s",
            "thresholds": {
              "steps": [
                {"color": "green", "value": null},
                {"color": "yellow", "value": 1},
                {"color": "red", "value": 2}
              ]
            }
          }
        }
      },
      {
        "id": 3,
        "title": "Error Rate",
        "type": "stat",
        "targets": [
          {
            "expr": "rate(http_requests_total{job=\"recibo-fast-backend\",status_code=~\"5..\"}[5m])",
            "legendFormat": "Errors/sec"
          }
        ],
        "fieldConfig": {
          "defaults": {
            "unit": "reqps",
            "thresholds": {
              "steps": [
                {"color": "green", "value": null},
                {"color": "yellow", "value": 0.01},
                {"color": "red", "value": 0.1}
              ]
            }
          }
        }
      },
      {
        "id": 4,
        "title": "HTTP Requests by Status Code",
        "type": "timeseries",
        "targets": [
          {
            "expr": "rate(http_requests_total{job=\"recibo-fast-backend\"}[5m])",
            "legendFormat": "{{status_code}}"
          }
        ]
      },
      {
        "id": 5,
        "title": "Database Connections",
        "type": "timeseries",
        "targets": [
          {
            "expr": "db_connections_active",
            "legendFormat": "Active"
          },
          {
            "expr": "db_connections_idle",
            "legendFormat": "Idle"
          }
        ]
      },
      {
        "id": 6,
        "title": "Business Metrics - Receitas Created",
        "type": "timeseries",
        "targets": [
          {
            "expr": "rate(receitas_total[5m])",
            "legendFormat": "{{status}}"
          }
        ]
      }
    ],
    "time": {
      "from": "now-1h",
      "to": "now"
    },
    "refresh": "5s"
  }
}
```

## 🏥 Health Checks

### 💓 Endpoint de Saúde

```go
// internal/handlers/health.go
package handlers

import (
    "context"
    "database/sql"
    "net/http"
    "time"

    "github.com/gin-gonic/gin"
    
    "recibo-fast/internal/logging"
)

type HealthHandler struct {
    db     *sql.DB
    logger *logging.Logger
}

type HealthResponse struct {
    Status    string                 `json:"status"`
    Timestamp time.Time              `json:"timestamp"`
    Version   string                 `json:"version"`
    Checks    map[string]HealthCheck `json:"checks"`
}

type HealthCheck struct {
    Status  string        `json:"status"`
    Message string        `json:"message,omitempty"`
    Latency time.Duration `json:"latency"`
}

func NewHealthHandler(db *sql.DB, logger *logging.Logger) *HealthHandler {
    return &HealthHandler{
        db:     db,
        logger: logger,
    }
}

// Health check básico
func (h *HealthHandler) Health(c *gin.Context) {
    ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second)
    defer cancel()
    
    response := HealthResponse{
        Status:    "healthy",
        Timestamp: time.Now(),
        Version:   "1.0.0", // Pegar da variável de ambiente
        Checks:    make(map[string]HealthCheck),
    }
    
    // Check database
    dbCheck := h.checkDatabase(ctx)
    response.Checks["database"] = dbCheck
    
    // Check external services (se houver)
    // emailCheck := h.checkEmailService(ctx)
    // response.Checks["email"] = emailCheck
    
    // Determinar status geral
    overallStatus := "healthy"
    for _, check := range response.Checks {
        if check.Status != "healthy" {
            overallStatus = "unhealthy"
            break
        }
    }
    response.Status = overallStatus
    
    // Retornar status HTTP apropriado
    statusCode := http.StatusOK
    if overallStatus != "healthy" {
        statusCode = http.StatusServiceUnavailable
    }
    
    c.JSON(statusCode, response)
}

// Readiness check (para Kubernetes)
func (h *HealthHandler) Ready(c *gin.Context) {
    ctx, cancel := context.WithTimeout(c.Request.Context(), 2*time.Second)
    defer cancel()
    
    // Verificar se o serviço está pronto para receber tráfego
    dbCheck := h.checkDatabase(ctx)
    
    if dbCheck.Status == "healthy" {
        c.JSON(http.StatusOK, gin.H{
            "status": "ready",
            "timestamp": time.Now(),
        })
    } else {
        c.JSON(http.StatusServiceUnavailable, gin.H{
            "status": "not ready",
            "timestamp": time.Now(),
            "reason": "database not available",
        })
    }
}

// Liveness check (para Kubernetes)
func (h *HealthHandler) Live(c *gin.Context) {
    // Check básico - o processo está rodando?
    c.JSON(http.StatusOK, gin.H{
        "status": "alive",
        "timestamp": time.Now(),
    })
}

func (h *HealthHandler) checkDatabase(ctx context.Context) HealthCheck {
    start := time.Now()
    
    err := h.db.PingContext(ctx)
    latency := time.Since(start)
    
    if err != nil {
        return HealthCheck{
            Status:  "unhealthy",
            Message: err.Error(),
            Latency: latency,
        }
    }
    
    // Verificar se a latência está aceitável
    if latency > 1*time.Second {
        return HealthCheck{
            Status:  "degraded",
            Message: "high latency",
            Latency: latency,
        }
    }
    
    return HealthCheck{
        Status:  "healthy",
        Latency: latency,
    }
}
```

## 📈 SLIs e SLOs

### 🎯 Service Level Indicators (SLIs)

```go
// internal/sli/indicators.go
package sli

import (
    "context"
    "time"

    "github.com/prometheus/client_golang/prometheus"
    "github.com/prometheus/client_golang/prometheus/promauto"
)

type SLIMetrics struct {
    // Availability SLI
    RequestsTotal    *prometheus.CounterVec
    RequestsSuccess  *prometheus.CounterVec
    
    // Latency SLI
    RequestLatency   *prometheus.HistogramVec
    
    // Quality SLI
    ErrorsTotal      *prometheus.CounterVec
}

func NewSLIMetrics() *SLIMetrics {
    return &SLIMetrics{
        RequestsTotal: promauto.NewCounterVec(
            prometheus.CounterOpts{
                Name: "sli_requests_total",
                Help: "Total requests for SLI calculation",
            },
            []string{"service", "endpoint"},
        ),
        
        RequestsSuccess: promauto.NewCounterVec(
            prometheus.CounterOpts{
                Name: "sli_requests_success_total",
                Help: "Successful requests for SLI calculation",
            },
            []string{"service", "endpoint"},
        ),
        
        RequestLatency: promauto.NewHistogramVec(
            prometheus.HistogramOpts{
                Name:    "sli_request_latency_seconds",
                Help:    "Request latency for SLI calculation",
                Buckets: []float64{0.1, 0.25, 0.5, 1.0, 2.5, 5.0, 10.0},
            },
            []string{"service", "endpoint"},
        ),
        
        ErrorsTotal: promauto.NewCounterVec(
            prometheus.CounterOpts{
                Name: "sli_errors_total",
                Help: "Total errors for SLI calculation",
            },
            []string{"service", "endpoint", "error_type"},
        ),
    }
}

// Registrar requisição para SLI
func (s *SLIMetrics) RecordRequest(service, endpoint string, success bool, latency time.Duration, errorType string) {
    labels := []string{service, endpoint}
    
    // Total de requisições
    s.RequestsTotal.WithLabelValues(labels...).Inc()
    
    // Requisições bem-sucedidas
    if success {
        s.RequestsSuccess.WithLabelValues(labels...).Inc()
    } else {
        s.ErrorsTotal.WithLabelValues(service, endpoint, errorType).Inc()
    }
    
    // Latência
    s.RequestLatency.WithLabelValues(labels...).Observe(latency.Seconds())
}
```

### 🎯 Service Level Objectives (SLOs)

```yaml
# slo/objectives.yml
slos:
  - name: "api-availability"
    description: "API deve estar disponível 99.9% do tempo"
    target: 99.9
    window: "30d"
    query: |
      (
        sum(rate(sli_requests_success_total{service="recibo-fast-api"}[5m]))
        /
        sum(rate(sli_requests_total{service="recibo-fast-api"}[5m]))
      ) * 100
    
  - name: "api-latency-p95"
    description: "95% das requisições devem ser processadas em menos de 500ms"
    target: 95
    window: "7d"
    query: |
      histogram_quantile(0.95, 
        rate(sli_request_latency_seconds_bucket{service="recibo-fast-api"}[5m])
      ) < 0.5
    
  - name: "api-latency-p99"
    description: "99% das requisições devem ser processadas em menos de 2s"
    target: 99
    window: "7d"
    query: |
      histogram_quantile(0.99, 
        rate(sli_request_latency_seconds_bucket{service="recibo-fast-api"}[5m])
      ) < 2.0
    
  - name: "database-availability"
    description: "Banco de dados deve estar disponível 99.95% do tempo"
    target: 99.95
    window: "30d"
    query: |
      (
        sum(rate(db_queries_total{status="success"}[5m]))
        /
        sum(rate(db_queries_total[5m]))
      ) * 100
```

## 🔧 Configuração de Deploy

### 🐳 Docker Compose para Monitoramento

```yaml
# docker-compose.monitoring.yml
version: '3.8'

services:
  prometheus:
    image: prom/prometheus:latest
    container_name: prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml
      - ./monitoring/rules.yml:/etc/prometheus/rules.yml
      - prometheus_data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.console.libraries=/etc/prometheus/console_libraries'
      - '--web.console.templates=/etc/prometheus/consoles'
      - '--storage.tsdb.retention.time=200h'
      - '--web.enable-lifecycle'
      - '--web.enable-admin-api'
    networks:
      - monitoring

  grafana:
    image: grafana/grafana:latest
    container_name: grafana
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin123
      - GF_USERS_ALLOW_SIGN_UP=false
    volumes:
      - grafana_data:/var/lib/grafana
      - ./monitoring/grafana/dashboards:/etc/grafana/provisioning/dashboards
      - ./monitoring/grafana/datasources:/etc/grafana/provisioning/datasources
    networks:
      - monitoring

  alertmanager:
    image: prom/alertmanager:latest
    container_name: alertmanager
    ports:
      - "9093:9093"
    volumes:
      - ./monitoring/alertmanager.yml:/etc/alertmanager/alertmanager.yml
      - alertmanager_data:/alertmanager
    command:
      - '--config.file=/etc/alertmanager/alertmanager.yml'
      - '--storage.path=/alertmanager'
      - '--web.external-url=http://localhost:9093'
    networks:
      - monitoring

  jaeger:
    image: jaegertracing/all-in-one:latest
    container_name: jaeger
    ports:
      - "16686:16686"
      - "14268:14268"
    environment:
      - COLLECTOR_OTLP_ENABLED=true
    networks:
      - monitoring

  node-exporter:
    image: prom/node-exporter:latest
    container_name: node-exporter
    ports:
      - "9100:9100"
    volumes:
      - /proc:/host/proc:ro
      - /sys:/host/sys:ro
      - /:/rootfs:ro
    command:
      - '--path.procfs=/host/proc'
      - '--path.rootfs=/rootfs'
      - '--path.sysfs=/host/sys'
      - '--collector.filesystem.mount-points-exclude=^/(sys|proc|dev|host|etc)($$|/)'
    networks:
      - monitoring

volumes:
  prometheus_data:
  grafana_data:
  alertmanager_data:

networks:
  monitoring:
    driver: bridge
```

### ⚙️ Configuração do Prometheus

```yaml
# monitoring/prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  - "rules.yml"

alerting:
  alertmanagers:
    - static_configs:
        - targets:
          - alertmanager:9093

scrape_configs:
  - job_name: 'recibo-fast-backend'
    static_configs:
      - targets: ['host.docker.internal:8080']
    metrics_path: '/metrics'
    scrape_interval: 5s
    
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']
      
  - job_name: 'node-exporter'
    static_configs:
      - targets: ['node-exporter:9100']
      
  - job_name: 'postgres-exporter'
    static_configs:
      - targets: ['postgres-exporter:9187']
```

## 📚 Referências

- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/)
- [Jaeger Documentation](https://www.jaegertracing.io/docs/)
- [OpenTracing Go](https://github.com/opentracing/opentracing-go)
- [Logrus Documentation](https://github.com/sirupsen/logrus)
- [SLI/SLO Best Practices](https://sre.google/sre-book/service-level-objectives/)
- [The Four Golden Signals](https://sre.google/sre-book/monitoring-distributed-systems/)

---

*Última atualização: 29-08-2025*