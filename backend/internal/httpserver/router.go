// MIT License
// Autor atual: David Assef
// Descrição: Configuração do roteador HTTP e middlewares
// Data: 29-08-2025

package httpserver

import (
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/httprate"
	"github.com/jackc/pgx/v5/pgxpool"

	"recibofast/internal/config"
	"recibofast/internal/handlers"
	"recibofast/internal/logging"
	"recibofast/internal/repositories"
	"recibofast/internal/services"
)

// AppDeps injeta dependências no roteador.
type AppDeps struct {
	Logger logging.Logger
	DB     *pgxpool.Pool
	Cfg    *config.Config
}

// NewRouter cria e retorna um roteador configurado.
func NewRouter(deps AppDeps) http.Handler {
	r := chi.NewRouter()

	// Middlewares padrão com foco em leveza
	r.Use(middleware.RequestID)
	r.Use(middleware.RealIP)
	r.Use(middleware.Recoverer)
	r.Use(middleware.Timeout(15 * time.Second))
	r.Use(middleware.Compress(5)) // gzip nível moderado
	// Limite simples por IP (ajuste conforme necessidade)
	r.Use(httprate.LimitByIP(100, 1*time.Minute))

	// Repositories
	incomeRepo := repositories.NewIncomeRepository(deps.DB)

	// Services
	incomeService := services.NewIncomeService(incomeRepo)

	// Handlers
	h := handlers.NewHandlers(handlers.Deps{
		Logger:   deps.Logger,
		DB:       deps.DB,
		Cfg:      deps.Cfg,
	})

	// Income Handlers
	incomeHandlers := handlers.NewIncomeHandlers(incomeService, deps.Logger)

	// Healthcheck
	r.Get("/healthz", h.Health)

	// API v1
	r.Route("/api/v1", func(r chi.Router) {
		// Middleware de Auth JWT Supabase com validação completa via JWKS
		r.With(SupabaseAuth(deps)).Get("/sync/changes", h.SyncChanges)
		
		// Rotas de receitas (protegidas por autenticação)
		r.Route("/incomes", func(r chi.Router) {
			r.Use(SupabaseAuth(deps))
			r.Get("/", incomeHandlers.ListIncomes)
			r.Post("/", incomeHandlers.CreateIncome)
			r.Get("/{id}", incomeHandlers.GetIncome)
			r.Put("/{id}", incomeHandlers.UpdateIncome)
			r.Delete("/{id}", incomeHandlers.DeleteIncome)
			r.Get("/{id}/payments", incomeHandlers.GetIncomePayments)
		})

		// Rotas de pagamentos (protegidas por autenticação)
		r.Route("/payments", func(r chi.Router) {
			r.Use(SupabaseAuth(deps))
			r.Post("/", incomeHandlers.AddPayment)
		})
	})

	return r
}
