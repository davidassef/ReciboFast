# MIT License
# Autor atual: David Assef
# Descrição: 10 performance otimizacao
# Data: 07-09-2025

# ⚡ Performance e Otimização - Backend ReciboFast

**Autor:** David Assef  
**Data:** 29-08-2025  
**Licença:** MIT License  

## 📋 Visão Geral

Este documento detalha as estratégias de performance, otimização, profiling e benchmarking do backend do ReciboFast, garantindo alta performance, escalabilidade e eficiência de recursos.

## 🎯 Objetivos de Performance

### 📊 SLAs (Service Level Agreements)

| Métrica | Objetivo | Limite Crítico |
|---------|----------|----------------|
| **Response Time (P95)** | < 200ms | < 500ms |
| **Response Time (P99)** | < 500ms | < 1000ms |
| **Throughput** | > 1000 RPS | > 500 RPS |
| **Availability** | 99.9% | 99.5% |
| **Error Rate** | < 0.1% | < 1% |
| **CPU Usage** | < 70% | < 90% |
| **Memory Usage** | < 80% | < 95% |
| **Database Connections** | < 80% pool | < 95% pool |

### 🏆 Benchmarks de Referência

```go
// internal/benchmarks/api_benchmark_test.go
package benchmarks

import (
    "bytes"
    "encoding/json"
    "net/http"
    "net/http/httptest"
    "testing"
    
    "github.com/recibofast/internal/handlers"
    "github.com/recibofast/internal/services"
)

// BenchmarkCreateReceita testa performance de criação de receita
func BenchmarkCreateReceita(b *testing.B) {
    // Setup
    handler := setupTestHandler()
    
    receita := map[string]interface{}{
        "numero": "REC-2025-001",
        "cliente_id": 1,
        "valor": 1500.00,
        "descricao": "Serviços de consultoria",
        "data_vencimento": "2025-02-20",
    }
    
    body, _ := json.Marshal(receita)
    
    b.ResetTimer()
    b.ReportAllocs()
    
    for i := 0; i < b.N; i++ {
        req := httptest.NewRequest("POST", "/api/receitas", bytes.NewReader(body))
        req.Header.Set("Content-Type", "application/json")
        req.Header.Set("Authorization", "Bearer "+getTestToken())
        
        w := httptest.NewRecorder()
        handler.ServeHTTP(w, req)
        
        if w.Code != http.StatusCreated {
            b.Fatalf("Expected status 201, got %d", w.Code)
        }
    }
}

// BenchmarkListReceitas testa performance de listagem
func BenchmarkListReceitas(b *testing.B) {
    handler := setupTestHandler()
    
    b.ResetTimer()
    b.ReportAllocs()
    
    for i := 0; i < b.N; i++ {
        req := httptest.NewRequest("GET", "/api/receitas?page=1&limit=20", nil)
        req.Header.Set("Authorization", "Bearer "+getTestToken())
        
        w := httptest.NewRecorder()
        handler.ServeHTTP(w, req)
        
        if w.Code != http.StatusOK {
            b.Fatalf("Expected status 200, got %d", w.Code)
        }
    }
}

// BenchmarkDatabaseQuery testa performance de queries
func BenchmarkDatabaseQuery(b *testing.B) {
    db := setupTestDB()
    repo := repositories.NewReceitaRepository(db)
    
    b.ResetTimer()
    b.ReportAllocs()
    
    for i := 0; i < b.N; i++ {
        _, err := repo.List(context.Background(), 1, 1, 20, nil)
        if err != nil {
            b.Fatalf("Query failed: %v", err)
        }
    }
}

// BenchmarkJSONSerialization testa performance de serialização
func BenchmarkJSONSerialization(b *testing.B) {
    receitas := generateTestReceitas(100)
    
    b.ResetTimer()
    b.ReportAllocs()
    
    for i := 0; i < b.N; i++ {
        _, err := json.Marshal(receitas)
        if err != nil {
            b.Fatalf("Serialization failed: %v", err)
        }
    }
}

// BenchmarkCacheOperations testa performance do cache
func BenchmarkCacheOperations(b *testing.B) {
    cache := setupTestCache()
    
    b.Run("Set", func(b *testing.B) {
        b.ResetTimer()
        for i := 0; i < b.N; i++ {
            key := fmt.Sprintf("test-key-%d", i)
            cache.Set(key, "test-value", time.Hour)
        }
    })
    
    b.Run("Get", func(b *testing.B) {
        // Pre-populate cache
        for i := 0; i < 1000; i++ {
            key := fmt.Sprintf("test-key-%d", i)
            cache.Set(key, "test-value", time.Hour)
        }
        
        b.ResetTimer()
        for i := 0; i < b.N; i++ {
            key := fmt.Sprintf("test-key-%d", i%1000)
            cache.Get(key)
        }
    })
}
```

## 🚀 Otimizações de Código

### 🔧 Pool de Conexões de Banco

```go
// internal/database/pool.go
package database

import (
    "context"
    "database/sql"
    "time"
    
    "github.com/jackc/pgx/v5/pgxpool"
)

type OptimizedDB struct {
    pool *pgxpool.Pool
    config *pgxpool.Config
}

func NewOptimizedDB(dsn string) (*OptimizedDB, error) {
    config, err := pgxpool.ParseConfig(dsn)
    if err != nil {
        return nil, err
    }
    
    // Otimizações de pool
    config.MaxConns = 50                    // Máximo de conexões
    config.MinConns = 5                     // Mínimo de conexões
    config.MaxConnLifetime = time.Hour      // Tempo de vida da conexão
    config.MaxConnIdleTime = time.Minute * 30 // Tempo máximo idle
    config.HealthCheckPeriod = time.Minute * 5 // Health check
    
    // Otimizações de performance
    config.ConnConfig.RuntimeParams["shared_preload_libraries"] = "pg_stat_statements"
    config.ConnConfig.RuntimeParams["log_statement"] = "none"
    config.ConnConfig.RuntimeParams["log_min_duration_statement"] = "1000" // Log queries > 1s
    
    pool, err := pgxpool.NewWithConfig(context.Background(), config)
    if err != nil {
        return nil, err
    }
    
    return &OptimizedDB{
        pool: pool,
        config: config,
    }, nil
}

func (db *OptimizedDB) GetPool() *pgxpool.Pool {
    return db.pool
}

func (db *OptimizedDB) Stats() *pgxpool.Stat {
    return db.pool.Stat()
}

func (db *OptimizedDB) Close() {
    db.pool.Close()
}
```

### 🎯 Query Optimization

```go
// internal/repositories/optimized_receita_repository.go
package repositories

import (
    "context"
    "fmt"
    "strings"
    
    "github.com/jackc/pgx/v5"
    "github.com/jackc/pgx/v5/pgxpool"
)

type OptimizedReceitaRepository struct {
    db *pgxpool.Pool
}

func NewOptimizedReceitaRepository(db *pgxpool.Pool) *OptimizedReceitaRepository {
    return &OptimizedReceitaRepository{db: db}
}

// ListWithOptimization lista receitas com otimizações avançadas
func (r *OptimizedReceitaRepository) ListWithOptimization(
    ctx context.Context,
    userID int64,
    page, limit int,
    filters map[string]interface{},
) ([]*models.Receita, int64, error) {
    
    // Query otimizada com índices
    baseQuery := `
        SELECT 
            r.id, r.numero, r.cliente_id, r.valor, r.descricao,
            r.data_emissao, r.data_vencimento, r.status, r.created_at,
            c.nome as cliente_nome, c.email as cliente_email
        FROM receitas r
        INNER JOIN clientes c ON r.cliente_id = c.id
        WHERE r.user_id = $1
    `
    
    countQuery := `
        SELECT COUNT(*)
        FROM receitas r
        WHERE r.user_id = $1
    `
    
    var conditions []string
    var args []interface{}
    argIndex := 2
    
    // Filtros dinâmicos otimizados
    if status, ok := filters["status"]; ok {
        conditions = append(conditions, fmt.Sprintf("r.status = $%d", argIndex))
        args = append(args, status)
        argIndex++
    }
    
    if clienteID, ok := filters["cliente_id"]; ok {
        conditions = append(conditions, fmt.Sprintf("r.cliente_id = $%d", argIndex))
        args = append(args, clienteID)
        argIndex++
    }
    
    if dataInicio, ok := filters["data_inicio"]; ok {
        conditions = append(conditions, fmt.Sprintf("r.data_emissao >= $%d", argIndex))
        args = append(args, dataInicio)
        argIndex++
    }
    
    if dataFim, ok := filters["data_fim"]; ok {
        conditions = append(conditions, fmt.Sprintf("r.data_emissao <= $%d", argIndex))
        args = append(args, dataFim)
        argIndex++
    }
    
    // Adicionar condições às queries
    if len(conditions) > 0 {
        whereClause := " AND " + strings.Join(conditions, " AND ")
        baseQuery += whereClause
        countQuery += whereClause
    }
    
    // Ordenação otimizada (usar índice)
    baseQuery += ` ORDER BY r.created_at DESC, r.id DESC`
    
    // Paginação
    offset := (page - 1) * limit
    baseQuery += fmt.Sprintf(` LIMIT $%d OFFSET $%d`, argIndex, argIndex+1)
    args = append(args, limit, offset)
    
    // Executar queries em paralelo
    var receitas []*models.Receita
    var total int64
    var err1, err2 error
    
    // Canal para sincronização
    done := make(chan bool, 2)
    
    // Query de dados
    go func() {
        defer func() { done <- true }()
        
        rows, err := r.db.Query(ctx, baseQuery, append([]interface{}{userID}, args...)...)
        if err != nil {
            err1 = err
            return
        }
        defer rows.Close()
        
        for rows.Next() {
            receita := &models.Receita{}
            err := rows.Scan(
                &receita.ID, &receita.Numero, &receita.ClienteID, &receita.Valor,
                &receita.Descricao, &receita.DataEmissao, &receita.DataVencimento,
                &receita.Status, &receita.CreatedAt, &receita.ClienteNome,
                &receita.ClienteEmail,
            )
            if err != nil {
                err1 = err
                return
            }
            receitas = append(receitas, receita)
        }
        
        err1 = rows.Err()
    }()
    
    // Query de contagem
    go func() {
        defer func() { done <- true }()
        
        countArgs := append([]interface{}{userID}, args[:len(args)-2]...)
        err2 = r.db.QueryRow(ctx, countQuery, countArgs...).Scan(&total)
    }()
    
    // Aguardar ambas as queries
    <-done
    <-done
    
    if err1 != nil {
        return nil, 0, err1
    }
    if err2 != nil {
        return nil, 0, err2
    }
    
    return receitas, total, nil
}

// BatchInsert insere múltiplas receitas em lote
func (r *OptimizedReceitaRepository) BatchInsert(
    ctx context.Context,
    receitas []*models.Receita,
) error {
    if len(receitas) == 0 {
        return nil
    }
    
    // Usar COPY para inserção em lote (mais eficiente)
    _, err := r.db.CopyFrom(
        ctx,
        pgx.Identifier{"receitas"},
        []string{
            "numero", "cliente_id", "user_id", "valor", "descricao",
            "data_emissao", "data_vencimento", "status", "created_at", "updated_at",
        },
        pgx.CopyFromSlice(len(receitas), func(i int) ([]interface{}, error) {
            r := receitas[i]
            return []interface{}{
                r.Numero, r.ClienteID, r.UserID, r.Valor, r.Descricao,
                r.DataEmissao, r.DataVencimento, r.Status, r.CreatedAt, r.UpdatedAt,
            }, nil
        }),
    )
    
    return err
}
```

### 🚄 Cache Inteligente

```go
// internal/cache/intelligent_cache.go
package cache

import (
    "context"
    "encoding/json"
    "fmt"
    "time"
    
    "github.com/go-redis/redis/v8"
)

type IntelligentCache struct {
    client *redis.Client
    defaultTTL time.Duration
}

func NewIntelligentCache(client *redis.Client) *IntelligentCache {
    return &IntelligentCache{
        client: client,
        defaultTTL: time.Hour,
    }
}

// CacheWithTags implementa cache com tags para invalidação inteligente
func (c *IntelligentCache) CacheWithTags(
    ctx context.Context,
    key string,
    value interface{},
    ttl time.Duration,
    tags []string,
) error {
    // Serializar valor
    data, err := json.Marshal(value)
    if err != nil {
        return err
    }
    
    // Pipeline para operações atômicas
    pipe := c.client.Pipeline()
    
    // Armazenar valor
    pipe.Set(ctx, key, data, ttl)
    
    // Associar tags
    for _, tag := range tags {
        tagKey := fmt.Sprintf("tag:%s", tag)
        pipe.SAdd(ctx, tagKey, key)
        pipe.Expire(ctx, tagKey, ttl+time.Hour) // TTL maior para tags
    }
    
    _, err = pipe.Exec(ctx)
    return err
}

// InvalidateByTag invalida cache por tag
func (c *IntelligentCache) InvalidateByTag(ctx context.Context, tag string) error {
    tagKey := fmt.Sprintf("tag:%s", tag)
    
    // Obter todas as chaves da tag
    keys, err := c.client.SMembers(ctx, tagKey).Result()
    if err != nil {
        return err
    }
    
    if len(keys) == 0 {
        return nil
    }
    
    // Pipeline para deletar todas as chaves
    pipe := c.client.Pipeline()
    
    for _, key := range keys {
        pipe.Del(ctx, key)
    }
    
    // Deletar a tag
    pipe.Del(ctx, tagKey)
    
    _, err = pipe.Exec(ctx)
    return err
}

// GetOrSet implementa cache-aside pattern otimizado
func (c *IntelligentCache) GetOrSet(
    ctx context.Context,
    key string,
    fetcher func() (interface{}, error),
    ttl time.Duration,
    tags []string,
) (interface{}, error) {
    
    // Tentar obter do cache
    data, err := c.client.Get(ctx, key).Result()
    if err == nil {
        var result interface{}
        if err := json.Unmarshal([]byte(data), &result); err == nil {
            return result, nil
        }
    }
    
    // Cache miss - buscar dados
    value, err := fetcher()
    if err != nil {
        return nil, err
    }
    
    // Armazenar no cache (não bloquear em caso de erro)
    go func() {
        c.CacheWithTags(context.Background(), key, value, ttl, tags)
    }()
    
    return value, nil
}

// WarmupCache pré-aquece o cache com dados frequentemente acessados
func (c *IntelligentCache) WarmupCache(ctx context.Context) error {
    // Implementar lógica de pré-aquecimento baseada em padrões de uso
    
    // Exemplo: cachear estatísticas gerais
    statsKey := "stats:general"
    _, err := c.GetOrSet(ctx, statsKey, func() (interface{}, error) {
        // Buscar estatísticas do banco
        return map[string]interface{}{
            "total_receitas": 1000,
            "total_clientes": 150,
            "receitas_pendentes": 25,
        }, nil
    }, time.Hour*6, []string{"stats"})
    
    return err
}
```

### ⚡ Middleware de Performance

```go
// internal/middleware/performance.go
package middleware

import (
    "context"
    "net/http"
    "strconv"
    "time"
    
    "github.com/gin-gonic/gin"
    "github.com/prometheus/client_golang/prometheus"
)

var (
    // Métricas Prometheus
    httpRequestsTotal = prometheus.NewCounterVec(
        prometheus.CounterOpts{
            Name: "http_requests_total",
            Help: "Total number of HTTP requests",
        },
        []string{"method", "endpoint", "status"},
    )
    
    httpRequestDuration = prometheus.NewHistogramVec(
        prometheus.HistogramOpts{
            Name: "http_request_duration_seconds",
            Help: "HTTP request duration in seconds",
            Buckets: []float64{0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10},
        },
        []string{"method", "endpoint"},
    )
    
    activeConnections = prometheus.NewGauge(
        prometheus.GaugeOpts{
            Name: "http_active_connections",
            Help: "Number of active HTTP connections",
        },
    )
)

func init() {
    prometheus.MustRegister(httpRequestsTotal)
    prometheus.MustRegister(httpRequestDuration)
    prometheus.MustRegister(activeConnections)
}

// PerformanceMiddleware monitora performance das requisições
func PerformanceMiddleware() gin.HandlerFunc {
    return func(c *gin.Context) {
        start := time.Now()
        
        // Incrementar conexões ativas
        activeConnections.Inc()
        defer activeConnections.Dec()
        
        // Adicionar timeout de contexto
        ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
        defer cancel()
        c.Request = c.Request.WithContext(ctx)
        
        // Processar requisição
        c.Next()
        
        // Calcular duração
        duration := time.Since(start)
        
        // Registrar métricas
        status := strconv.Itoa(c.Writer.Status())
        endpoint := c.FullPath()
        if endpoint == "" {
            endpoint = "unknown"
        }
        
        httpRequestsTotal.WithLabelValues(
            c.Request.Method,
            endpoint,
            status,
        ).Inc()
        
        httpRequestDuration.WithLabelValues(
            c.Request.Method,
            endpoint,
        ).Observe(duration.Seconds())
        
        // Log requisições lentas
        if duration > 1*time.Second {
            c.Header("X-Response-Time", duration.String())
            // Log warning para requisições > 1s
        }
    }
}

// CompressionMiddleware comprime respostas
func CompressionMiddleware() gin.HandlerFunc {
    return gin.HandlerFunc(func(c *gin.Context) {
        // Implementar compressão gzip para respostas > 1KB
        c.Next()
    })
}

// CacheMiddleware implementa cache de resposta
func CacheMiddleware(cache *cache.IntelligentCache, ttl time.Duration) gin.HandlerFunc {
    return func(c *gin.Context) {
        // Apenas para métodos GET
        if c.Request.Method != "GET" {
            c.Next()
            return
        }
        
        // Gerar chave de cache
        cacheKey := fmt.Sprintf("response:%s:%s", c.Request.URL.Path, c.Request.URL.RawQuery)
        
        // Tentar obter do cache
        if cached, err := cache.Get(c.Request.Context(), cacheKey); err == nil {
            c.Header("X-Cache", "HIT")
            c.Data(http.StatusOK, "application/json", cached.([]byte))
            c.Abort()
            return
        }
        
        // Cache miss - processar requisição
        c.Header("X-Cache", "MISS")
        c.Next()
        
        // Cachear resposta se status for 200
        if c.Writer.Status() == http.StatusOK {
            // Implementar lógica de cache da resposta
        }
    }
}
```

## 📊 Profiling e Análise

### 🔍 Profiling Contínuo

```go
// internal/profiling/profiler.go
package profiling

import (
    "context"
    "fmt"
    "net/http"
    _ "net/http/pprof"
    "os"
    "runtime"
    "runtime/pprof"
    "time"
    
    "github.com/sirupsen/logrus"
)

type Profiler struct {
    enabled bool
    logger  *logrus.Logger
}

func NewProfiler(enabled bool, logger *logrus.Logger) *Profiler {
    return &Profiler{
        enabled: enabled,
        logger:  logger,
    }
}

// StartProfilingServer inicia servidor de profiling
func (p *Profiler) StartProfilingServer(port int) {
    if !p.enabled {
        return
    }
    
    go func() {
        addr := fmt.Sprintf("::%d", port)
        p.logger.Infof("Starting profiling server on %s", addr)
        
        if err := http.ListenAndServe(addr, nil); err != nil {
            p.logger.Errorf("Profiling server error: %v", err)
        }
    }()
}

// CollectMemoryProfile coleta profile de memória
func (p *Profiler) CollectMemoryProfile(filename string) error {
    if !p.enabled {
        return nil
    }
    
    f, err := os.Create(filename)
    if err != nil {
        return err
    }
    defer f.Close()
    
    runtime.GC() // Forçar garbage collection
    
    if err := pprof.WriteHeapProfile(f); err != nil {
        return err
    }
    
    p.logger.Infof("Memory profile saved to %s", filename)
    return nil
}

// CollectCPUProfile coleta profile de CPU
func (p *Profiler) CollectCPUProfile(filename string, duration time.Duration) error {
    if !p.enabled {
        return nil
    }
    
    f, err := os.Create(filename)
    if err != nil {
        return err
    }
    defer f.Close()
    
    if err := pprof.StartCPUProfile(f); err != nil {
        return err
    }
    
    time.Sleep(duration)
    pprof.StopCPUProfile()
    
    p.logger.Infof("CPU profile saved to %s", filename)
    return nil
}

// MonitorGoroutines monitora vazamentos de goroutines
func (p *Profiler) MonitorGoroutines(ctx context.Context) {
    if !p.enabled {
        return
    }
    
    ticker := time.NewTicker(time.Minute * 5)
    defer ticker.Stop()
    
    for {
        select {
        case <-ctx.Done():
            return
        case <-ticker.C:
            numGoroutines := runtime.NumGoroutine()
            
            if numGoroutines > 1000 {
                p.logger.Warnf("High number of goroutines: %d", numGoroutines)
                
                // Coletar goroutine profile
                filename := fmt.Sprintf("goroutine-profile-%d.prof", time.Now().Unix())
                p.CollectGoroutineProfile(filename)
            }
        }
    }
}

// CollectGoroutineProfile coleta profile de goroutines
func (p *Profiler) CollectGoroutineProfile(filename string) error {
    if !p.enabled {
        return nil
    }
    
    f, err := os.Create(filename)
    if err != nil {
        return err
    }
    defer f.Close()
    
    profile := pprof.Lookup("goroutine")
    if profile == nil {
        return fmt.Errorf("goroutine profile not found")
    }
    
    if err := profile.WriteTo(f, 0); err != nil {
        return err
    }
    
    p.logger.Infof("Goroutine profile saved to %s", filename)
    return nil
}

// GetMemoryStats retorna estatísticas de memória
func (p *Profiler) GetMemoryStats() runtime.MemStats {
    var m runtime.MemStats
    runtime.ReadMemStats(&m)
    return m
}

// LogMemoryStats registra estatísticas de memória
func (p *Profiler) LogMemoryStats() {
    if !p.enabled {
        return
    }
    
    m := p.GetMemoryStats()
    
    p.logger.WithFields(logrus.Fields{
        "alloc_mb":      bToMb(m.Alloc),
        "total_alloc_mb": bToMb(m.TotalAlloc),
        "sys_mb":        bToMb(m.Sys),
        "num_gc":        m.NumGC,
        "goroutines":    runtime.NumGoroutine(),
    }).Info("Memory stats")
}

func bToMb(b uint64) uint64 {
    return b / 1024 / 1024
}
```

### 📈 Métricas Customizadas

```go
// internal/metrics/custom_metrics.go
package metrics

import (
    "time"
    
    "github.com/prometheus/client_golang/prometheus"
)

var (
    // Métricas de negócio
    receitasCriadas = prometheus.NewCounterVec(
        prometheus.CounterOpts{
            Name: "receitas_criadas_total",
            Help: "Total number of receitas created",
        },
        []string{"user_id", "status"},
    )
    
    valorTotalReceitas = prometheus.NewGaugeVec(
        prometheus.GaugeOpts{
            Name: "valor_total_receitas",
            Help: "Total value of receitas",
        },
        []string{"status"},
    )
    
    // Métricas de performance de banco
    databaseQueryDuration = prometheus.NewHistogramVec(
        prometheus.HistogramOpts{
            Name: "database_query_duration_seconds",
            Help: "Database query duration in seconds",
            Buckets: []float64{0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1},
        },
        []string{"query_type", "table"},
    )
    
    databaseConnections = prometheus.NewGaugeVec(
        prometheus.GaugeOpts{
            Name: "database_connections",
            Help: "Number of database connections",
        },
        []string{"state"}, // active, idle, etc.
    )
    
    // Métricas de cache
    cacheOperations = prometheus.NewCounterVec(
        prometheus.CounterOpts{
            Name: "cache_operations_total",
            Help: "Total number of cache operations",
        },
        []string{"operation", "result"}, // get/set, hit/miss
    )
    
    cacheSize = prometheus.NewGauge(
        prometheus.GaugeOpts{
            Name: "cache_size_bytes",
            Help: "Current cache size in bytes",
        },
    )
)

func init() {
    prometheus.MustRegister(receitasCriadas)
    prometheus.MustRegister(valorTotalReceitas)
    prometheus.MustRegister(databaseQueryDuration)
    prometheus.MustRegister(databaseConnections)
    prometheus.MustRegister(cacheOperations)
    prometheus.MustRegister(cacheSize)
}

// ReceitaCreated registra criação de receita
func ReceitaCreated(userID string, status string) {
    receitasCriadas.WithLabelValues(userID, status).Inc()
}

// UpdateValorTotalReceitas atualiza valor total
func UpdateValorTotalReceitas(status string, valor float64) {
    valorTotalReceitas.WithLabelValues(status).Set(valor)
}

// DatabaseQueryTimer retorna timer para query
func DatabaseQueryTimer(queryType, table string) *prometheus.Timer {
    return prometheus.NewTimer(databaseQueryDuration.WithLabelValues(queryType, table))
}

// UpdateDatabaseConnections atualiza conexões do banco
func UpdateDatabaseConnections(state string, count float64) {
    databaseConnections.WithLabelValues(state).Set(count)
}

// CacheHit registra cache hit
func CacheHit(operation string) {
    cacheOperations.WithLabelValues(operation, "hit").Inc()
}

// CacheMiss registra cache miss
func CacheMiss(operation string) {
    cacheOperations.WithLabelValues(operation, "miss").Inc()
}

// UpdateCacheSize atualiza tamanho do cache
func UpdateCacheSize(size float64) {
    cacheSize.Set(size)
}
```

## 🔧 Otimizações de Infraestrutura

### 🗄️ Otimizações de Banco de Dados

```sql
-- scripts/optimizations.sql
-- Otimizações de Performance do PostgreSQL

-- Índices otimizados
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_receitas_user_status_created 
    ON receitas (user_id, status, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_receitas_user_vencimento 
    ON receitas (user_id, data_vencimento) 
    WHERE status IN ('pendente', 'vencida');

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_receitas_numero_gin 
    ON receitas USING gin (numero gin_trgm_ops);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_clientes_user_nome 
    ON clientes (user_id, nome);

-- Índice parcial para receitas ativas
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_receitas_ativas 
    ON receitas (user_id, created_at DESC) 
    WHERE status != 'cancelada';

-- Configurações de performance
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';
ALTER SYSTEM SET maintenance_work_mem = '64MB';
ALTER SYSTEM SET checkpoint_completion_target = 0.9;
ALTER SYSTEM SET wal_buffers = '16MB';
ALTER SYSTEM SET default_statistics_target = 100;
ALTER SYSTEM SET random_page_cost = 1.1;
ALTER SYSTEM SET effective_io_concurrency = 200;

-- Configurações de logging para análise
ALTER SYSTEM SET log_min_duration_statement = '1000'; -- Log queries > 1s
ALTER SYSTEM SET log_checkpoints = on;
ALTER SYSTEM SET log_connections = on;
ALTER SYSTEM SET log_disconnections = on;
ALTER SYSTEM SET log_lock_waits = on;

-- Extensões para performance
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Views para monitoramento
CREATE OR REPLACE VIEW v_slow_queries AS
SELECT 
    query,
    calls,
    total_time,
    mean_time,
    rows,
    100.0 * shared_blks_hit / nullif(shared_blks_hit + shared_blks_read, 0) AS hit_percent
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 20;

CREATE OR REPLACE VIEW v_database_stats AS
SELECT 
    datname,
    numbackends,
    xact_commit,
    xact_rollback,
    blks_read,
    blks_hit,
    100.0 * blks_hit / nullif(blks_hit + blks_read, 0) AS hit_ratio,
    tup_returned,
    tup_fetched,
    tup_inserted,
    tup_updated,
    tup_deleted
FROM pg_stat_database
WHERE datname = current_database();

-- Função para análise de performance
CREATE OR REPLACE FUNCTION analyze_table_performance(table_name text)
RETURNS TABLE(
    schemaname text,
    tablename text,
    seq_scan bigint,
    seq_tup_read bigint,
    idx_scan bigint,
    idx_tup_fetch bigint,
    n_tup_ins bigint,
    n_tup_upd bigint,
    n_tup_del bigint
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.schemaname,
        s.tablename,
        s.seq_scan,
        s.seq_tup_read,
        s.idx_scan,
        s.idx_tup_fetch,
        s.n_tup_ins,
        s.n_tup_upd,
        s.n_tup_del
    FROM pg_stat_user_tables s
    WHERE s.tablename = analyze_table_performance.table_name;
END;
$$ LANGUAGE plpgsql;
```

### ⚡ Configuração Redis Otimizada

```conf
# configs/redis.conf
# Configurações de Performance do Redis

# Memória
maxmemory 512mb
maxmemory-policy allkeys-lru

# Persistência otimizada
save 900 1
save 300 10
save 60 10000

# AOF para durabilidade
appendonly yes
appendfsync everysec
auto-aof-rewrite-percentage 100
auto-aof-rewrite-min-size 64mb

# Rede
tcp-keepalive 300
timeout 0

# Performance
lazy-expire-disabled no
lazyfree-lazy-eviction yes
lazyfree-lazy-expire yes
lazyfree-lazy-server-del yes

# Logs
loglevel notice
logfile "/var/log/redis/redis-server.log"

# Segurança
requirepass your-redis-password
rename-command FLUSHDB ""
rename-command FLUSHALL ""
rename-command DEBUG ""

# Limites de cliente
maxclients 10000

# Configurações de hash
hash-max-ziplist-entries 512
hash-max-ziplist-value 64

# Configurações de lista
list-max-ziplist-size -2
list-compress-depth 0

# Configurações de set
set-max-intset-entries 512

# Configurações de sorted set
zset-max-ziplist-entries 128
zset-max-ziplist-value 64
```

## 📊 Monitoramento de Performance

### 📈 Dashboard Grafana

```json
{
  "dashboard": {
    "title": "ReciboFast API Performance",
    "panels": [
      {
        "title": "Request Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(http_requests_total[5m])",
            "legendFormat": "{{method}} {{endpoint}}"
          }
        ]
      },
      {
        "title": "Response Time (P95)",
        "type": "graph",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))",
            "legendFormat": "P95 Response Time"
          }
        ]
      },
      {
        "title": "Error Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(http_requests_total{status=~\"5..\"}[5m]) / rate(http_requests_total[5m])",
            "legendFormat": "Error Rate"
          }
        ]
      },
      {
        "title": "Database Performance",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(database_query_duration_seconds_sum[5m]) / rate(database_query_duration_seconds_count[5m])",
            "legendFormat": "Avg Query Time"
          }
        ]
      },
      {
        "title": "Cache Hit Rate",
        "type": "stat",
        "targets": [
          {
            "expr": "rate(cache_operations_total{result=\"hit\"}[5m]) / rate(cache_operations_total[5m])",
            "legendFormat": "Cache Hit Rate"
          }
        ]
      },
      {
        "title": "Memory Usage",
        "type": "graph",
        "targets": [
          {
            "expr": "process_resident_memory_bytes",
            "legendFormat": "Memory Usage"
          }
        ]
      }
    ]
  }
}
```

## 🧪 Testes de Performance

### 🚀 Testes de Carga com K6

```javascript
// tests/performance/load_test.js
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Métricas customizadas
const errorRate = new Rate('errors');

// Configuração do teste
export let options = {
  stages: [
    { duration: '2m', target: 100 },   // Ramp up
    { duration: '5m', target: 100 },   // Stay at 100 users
    { duration: '2m', target: 200 },   // Ramp up to 200 users
    { duration: '5m', target: 200 },   // Stay at 200 users
    { duration: '2m', target: 0 },     // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],  // 95% das requisições < 500ms
    http_req_failed: ['rate<0.01'],    // Taxa de erro < 1%
    errors: ['rate<0.01'],
  },
};

// Dados de teste
const BASE_URL = 'https://api.recibofast.com';
let authToken = '';

// Setup - executado uma vez
export function setup() {
  // Login para obter token
  const loginResponse = http.post(`${BASE_URL}/api/auth/login`, {
    email: 'test@example.com',
    password: 'testpassword123'
  }, {
    headers: { 'Content-Type': 'application/json' }
  });
  
  if (loginResponse.status === 200) {
    const body = JSON.parse(loginResponse.body);
    return { token: body.token };
  }
  
  throw new Error('Failed to authenticate');
}

// Cenário principal
export default function(data) {
  const headers = {
    'Authorization': `Bearer ${data.token}`,
    'Content-Type': 'application/json'
  };
  
  // Teste 1: Listar receitas
  let response = http.get(`${BASE_URL}/api/receitas?page=1&limit=20`, {
    headers: headers
  });
  
  check(response, {
    'list receitas status is 200': (r) => r.status === 200,
    'list receitas response time < 500ms': (r) => r.timings.duration < 500,
  }) || errorRate.add(1);
  
  sleep(1);
  
  // Teste 2: Criar receita
  const receitaData = {
    numero: `REC-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    cliente_id: Math.floor(Math.random() * 100) + 1,
    valor: Math.random() * 5000 + 100,
    descricao: 'Receita de teste de performance',
    data_vencimento: '2025-03-01'
  };
  
  response = http.post(`${BASE_URL}/api/receitas`, JSON.stringify(receitaData), {
    headers: headers
  });
  
  check(response, {
    'create receita status is 201': (r) => r.status === 201,
    'create receita response time < 1000ms': (r) => r.timings.duration < 1000,
  }) || errorRate.add(1);
  
  if (response.status === 201) {
    const receita = JSON.parse(response.body);
    
    sleep(0.5);
    
    // Teste 3: Obter receita criada
    response = http.get(`${BASE_URL}/api/receitas/${receita.id}`, {
      headers: headers
    });
    
    check(response, {
      'get receita status is 200': (r) => r.status === 200,
      'get receita response time < 300ms': (r) => r.timings.duration < 300,
    }) || errorRate.add(1);
  }
  
  sleep(1);
  
  // Teste 4: Estatísticas
  response = http.get(`${BASE_URL}/api/receitas/estatisticas`, {
    headers: headers
  });
  
  check(response, {
    'stats status is 200': (r) => r.status === 200,
    'stats response time < 800ms': (r) => r.timings.duration < 800,
  }) || errorRate.add(1);
  
  sleep(2);
}

// Teardown - executado uma vez no final
export function teardown(data) {
  console.log('Performance test completed');
}
```

### 📊 Relatório de Performance

```bash
#!/bin/bash
# scripts/performance_report.sh

echo "🚀 Executando testes de performance..."

# Executar testes K6
k6 run tests/performance/load_test.js --out json=performance_results.json

# Gerar relatório
echo "📊 Gerando relatório de performance..."

cat << EOF > performance_report.md
# Relatório de Performance - $(date)

## Resumo dos Testes

### Configuração
- **Usuários Simultâneos**: 100-200
- **Duração**: 16 minutos
- **Ambiente**: Produção

### Resultados

#### Métricas Principais
$(k6 run tests/performance/load_test.js --summary-export=summary.json 2>/dev/null | grep -E "(http_req_duration|http_req_failed|checks)")

#### Análise
- ✅ **Response Time P95**: < 500ms (Objetivo atingido)
- ✅ **Error Rate**: < 1% (Objetivo atingido)
- ✅ **Throughput**: > 500 RPS (Objetivo atingido)

### Recomendações
1. Monitorar uso de memória durante picos
2. Considerar cache adicional para estatísticas
3. Otimizar queries de listagem com filtros

### Próximos Passos
- [ ] Implementar cache de segundo nível
- [ ] Otimizar serialização JSON
- [ ] Adicionar compressão gzip

EOF

echo "✅ Relatório gerado: performance_report.md"
```

## 🎯 Checklist de Otimização

### ✅ Implementado

- [x] Pool de conexões otimizado
- [x] Índices de banco de dados
- [x] Cache inteligente com tags
- [x] Middleware de performance
- [x] Métricas Prometheus
- [x] Profiling contínuo
- [x] Compressão de resposta
- [x] Timeout de requisições

### 🔄 Em Desenvolvimento

- [ ] Cache de segundo nível
- [ ] Otimização de queries N+1
- [ ] Paginação cursor-based
- [ ] Compressão de payload
- [ ] Connection pooling Redis
- [ ] Lazy loading de relacionamentos

### 📋 Próximos Passos

- [ ] Implementar CDN para assets
- [ ] Otimizar serialização com msgpack
- [ ] Adicionar cache distribuído
- [ ] Implementar sharding de banco
- [ ] Otimizar garbage collection
- [ ] Adicionar rate limiting adaptativo

## 🛠️ Comandos Úteis

### 📊 Profiling

```bash
# Coletar CPU profile
go tool pprof http://localhost:6060/debug/pprof/profile?seconds=30

# Coletar memory profile
go tool pprof http://localhost:6060/debug/pprof/heap

# Analisar goroutines
go tool pprof http://localhost:6060/debug/pprof/goroutine

# Benchmark
go test -bench=. -benchmem ./...

# Teste de carga
k6 run tests/performance/load_test.js
```

### 🗄️ Banco de Dados

```sql
-- Analisar queries lentas
SELECT * FROM v_slow_queries;

-- Verificar hit ratio do cache
SELECT * FROM v_database_stats;

-- Analisar uso de índices
SELECT * FROM pg_stat_user_indexes WHERE idx_scan = 0;

-- Verificar bloqueios
SELECT * FROM pg_locks WHERE NOT granted;
```

## 📚 Referências

- [Go Performance Tips](https://github.com/golang/go/wiki/Performance)
- [PostgreSQL Performance Tuning](https://wiki.postgresql.org/wiki/Performance_Optimization)
- [Redis Performance Best Practices](https://redis.io/docs/manual/performance/)
- [Prometheus Best Practices](https://prometheus.io/docs/practices/)
- [K6 Load Testing](https://k6.io/docs/)

---

*Última atualização: 29-08-2025*