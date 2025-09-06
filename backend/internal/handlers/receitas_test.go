// MIT License
// Autor atual: David Assef
// Descrição: Testes dos handlers de receitas e pagamentos
// Data: 04-09-2025

package handlers

import (
    "context"
    "bytes"
    "encoding/json"
    "errors"
    "net/http"
    "net/http/httptest"
    "testing"
    "time"

    "github.com/go-chi/chi/v5"
    "github.com/google/uuid"
    ctxhelper "recibofast/internal/context"
    "recibofast/internal/logging"
    "recibofast/internal/models"
    "recibofast/internal/services"
)

// fakeIncomeService implementa services.IncomeService para testes de handler
// Permite configurar retornos e erros por método.
type fakeIncomeService struct {
    createResp *models.Income
    createErr  error

    getResp *models.Income
    getErr  error

    updateResp *models.Income
    updateErr  error

    deleteErr error

    listResp *models.IncomeResponse
    listErr  error

    addPayResp *models.PaymentResponse
    addPayErr  error

    getPaysResp []models.Payment
    getPaysErr  error
}

func (f *fakeIncomeService) CreateIncome(ownerID uuid.UUID, req *models.IncomeRequest) (*models.Income, error) {
    return f.createResp, f.createErr
}
func (f *fakeIncomeService) GetIncome(id, ownerID uuid.UUID) (*models.Income, error) {
    return f.getResp, f.getErr
}
func (f *fakeIncomeService) UpdateIncome(id, ownerID uuid.UUID, req *models.IncomeRequest) (*models.Income, error) {
    return f.updateResp, f.updateErr
}
func (f *fakeIncomeService) DeleteIncome(id, ownerID uuid.UUID) error { return f.deleteErr }
func (f *fakeIncomeService) ListIncomes(ownerID uuid.UUID, filter *models.IncomeFilter) (*models.IncomeResponse, error) {
    return f.listResp, f.listErr
}
func (f *fakeIncomeService) AddPayment(ownerID uuid.UUID, req *models.PaymentRequest) (*models.PaymentResponse, error) {
    return f.addPayResp, f.addPayErr
}
func (f *fakeIncomeService) GetIncomePayments(incomeID, ownerID uuid.UUID) ([]models.Payment, error) {
    return f.getPaysResp, f.getPaysErr
}
func (f *fakeIncomeService) CalculateIncomeStatus(income *models.Income) string { return models.StatusPendente }

func newIncomeHandlersForTest(svc services.IncomeService) *IncomeHandlers {
    return NewIncomeHandlers(svc, logging.NewLogger("dev"))
}

func setRouteParam(r *http.Request, key, val string) *http.Request {
    rctx := chi.NewRouteContext()
    rctx.URLParams.Add(key, val)
    return r.WithContext(context.WithValue(r.Context(), chi.RouteCtxKey, rctx))
}

func TestCreateIncome_Success(t *testing.T) {
    ownerID := uuid.New()
    svc := &fakeIncomeService{createResp: &models.Income{ID: uuid.New(), OwnerID: ownerID, Valor: 100, Status: models.StatusPendente}}
    h := newIncomeHandlersForTest(svc)

    cat := "Serviços"
    payload := models.IncomeRequest{Categoria: &cat, Competencia: "2025-09", Valor: 100}
    b, _ := json.Marshal(payload)

    req := httptest.NewRequest(http.MethodPost, "/api/v1/incomes", bytes.NewReader(b))
    req = req.WithContext(ctxhelper.SetUserID(req.Context(), ownerID.String()))
    rr := httptest.NewRecorder()

    h.CreateIncome(rr, req)

    if rr.Code != http.StatusCreated { t.Fatalf("status = %d, want %d", rr.Code, http.StatusCreated) }
    var out models.Income
    if err := json.NewDecoder(rr.Body).Decode(&out); err != nil { t.Fatalf("decode: %v", err) }
    if out.OwnerID != ownerID { t.Fatalf("owner = %s, want %s", out.OwnerID, ownerID) }
}

func TestCreateIncome_Unauthorized(t *testing.T) {
    svc := &fakeIncomeService{}
    h := newIncomeHandlersForTest(svc)

    req := httptest.NewRequest(http.MethodPost, "/api/v1/incomes", bytes.NewReader([]byte(`{}`)))
    rr := httptest.NewRecorder()

    h.CreateIncome(rr, req)

    if rr.Code != http.StatusUnauthorized { t.Fatalf("status = %d, want %d", rr.Code, http.StatusUnauthorized) }
}

func TestGetIncome_NotFound(t *testing.T) {
    svc := &fakeIncomeService{getErr: models.ErrIncomeNotFound}
    h := newIncomeHandlersForTest(svc)

    id := uuid.New()
    req := httptest.NewRequest(http.MethodGet, "/api/v1/incomes/"+id.String(), nil)
    req = req.WithContext(ctxhelper.SetUserID(req.Context(), uuid.New().String()))
    req = setRouteParam(req, "id", id.String())

    rr := httptest.NewRecorder()
    h.GetIncome(rr, req)

    if rr.Code != http.StatusNotFound { t.Fatalf("status = %d, want %d", rr.Code, http.StatusNotFound) }
}

func TestAddPayment_Insufficient(t *testing.T) {
    svc := &fakeIncomeService{addPayErr: models.ErrInsufficientAmount}
    h := newIncomeHandlersForTest(svc)

    ownerID := uuid.New()
    reqBody := models.PaymentRequest{IncomeID: uuid.New(), Valor: 200}
    b, _ := json.Marshal(reqBody)

    req := httptest.NewRequest(http.MethodPost, "/api/v1/incomes/payments", bytes.NewReader(b))
    req = req.WithContext(ctxhelper.SetUserID(req.Context(), ownerID.String()))

    rr := httptest.NewRecorder()
    h.AddPayment(rr, req)

    if rr.Code != http.StatusBadRequest { t.Fatalf("status = %d, want %d", rr.Code, http.StatusBadRequest) }
}

func TestDeleteIncome_Success(t *testing.T) {
    svc := &fakeIncomeService{}
    h := newIncomeHandlersForTest(svc)

    ownerID := uuid.New()
    id := uuid.New()
    req := httptest.NewRequest(http.MethodDelete, "/api/v1/incomes/"+id.String(), nil)
    req = req.WithContext(ctxhelper.SetUserID(req.Context(), ownerID.String()))
    req = setRouteParam(req, "id", id.String())

    rr := httptest.NewRecorder()
    h.DeleteIncome(rr, req)

    if rr.Code != http.StatusNoContent { t.Fatalf("status = %d, want %d", rr.Code, http.StatusNoContent) }
}

func TestListIncomes_Success(t *testing.T) {
    ownerID := uuid.New()
    now := time.Now().UTC()
    incomes := []models.Income{{ID: uuid.New(), OwnerID: ownerID, Competencia: "2025-09", Valor: 100, Status: models.StatusPendente, CreatedAt: &[]time.Time{now}[0]}}
    svc := &fakeIncomeService{listResp: &models.IncomeResponse{Incomes: incomes, Total: 1, Page: 1, PerPage: 10, TotalPages: 1}}
    h := newIncomeHandlersForTest(svc)

    url := "/api/v1/incomes?search=abc&status=pendente&categoria=servicos&competencia=2025-09&sort_field=created_at&sort_order=desc&page=1&per_page=10"
    req := httptest.NewRequest(http.MethodGet, url, nil)
    req = req.WithContext(ctxhelper.SetUserID(req.Context(), ownerID.String()))
    rr := httptest.NewRecorder()

    h.ListIncomes(rr, req)

    if rr.Code != http.StatusOK { t.Fatalf("status = %d, want %d", rr.Code, http.StatusOK) }
    var out models.IncomeResponse
    if err := json.NewDecoder(rr.Body).Decode(&out); err != nil { t.Fatalf("decode: %v", err) }
    if out.Total != 1 || len(out.Incomes) != 1 { t.Fatalf("unexpected resp: %+v", out) }
}

func TestListIncomes_Error(t *testing.T) {
    ownerID := uuid.New()
    svc := &fakeIncomeService{listErr: errors.New("boom")}
    h := newIncomeHandlersForTest(svc)

    req := httptest.NewRequest(http.MethodGet, "/api/v1/incomes?page=1&per_page=10", nil)
    req = req.WithContext(ctxhelper.SetUserID(req.Context(), ownerID.String()))
    rr := httptest.NewRecorder()

    h.ListIncomes(rr, req)
    if rr.Code != http.StatusInternalServerError { t.Fatalf("status = %d, want %d", rr.Code, http.StatusInternalServerError) }
}

func TestListIncomes_Unauthorized(t *testing.T) {
    svc := &fakeIncomeService{}
    h := newIncomeHandlersForTest(svc)

    req := httptest.NewRequest(http.MethodGet, "/api/v1/incomes?page=1&per_page=10", nil)
    rr := httptest.NewRecorder()
    h.ListIncomes(rr, req)
    if rr.Code != http.StatusUnauthorized { t.Fatalf("status = %d, want %d", rr.Code, http.StatusUnauthorized) }
}

func TestUpdateIncome_Success(t *testing.T) {
    ownerID := uuid.New()
    id := uuid.New()
    svc := &fakeIncomeService{updateResp: &models.Income{ID: id, OwnerID: ownerID, Competencia: "2025-09", Valor: 150, Status: models.StatusParcial}}
    h := newIncomeHandlersForTest(svc)

    payload := models.IncomeRequest{Competencia: "2025-09", Valor: 150}
    b, _ := json.Marshal(payload)
    req := httptest.NewRequest(http.MethodPut, "/api/v1/incomes/"+id.String(), bytes.NewReader(b))
    req = req.WithContext(ctxhelper.SetUserID(req.Context(), ownerID.String()))
    req = setRouteParam(req, "id", id.String())
    rr := httptest.NewRecorder()

    h.UpdateIncome(rr, req)

    if rr.Code != http.StatusOK { t.Fatalf("status = %d, want %d", rr.Code, http.StatusOK) }
    var out models.Income
    if err := json.NewDecoder(rr.Body).Decode(&out); err != nil { t.Fatalf("decode: %v", err) }
    if out.ID != id { t.Fatalf("id mismatch") }
}

func TestUpdateIncome_NotFound(t *testing.T) {
    ownerID := uuid.New()
    id := uuid.New()
    svc := &fakeIncomeService{updateErr: models.ErrIncomeNotFound}
    h := newIncomeHandlersForTest(svc)
    payload := models.IncomeRequest{Competencia: "2025-09", Valor: 150}
    b, _ := json.Marshal(payload)

    req := httptest.NewRequest(http.MethodPut, "/api/v1/incomes/"+id.String(), bytes.NewReader(b))
    req = req.WithContext(ctxhelper.SetUserID(req.Context(), ownerID.String()))
    req = setRouteParam(req, "id", id.String())
    rr := httptest.NewRecorder()

    h.UpdateIncome(rr, req)
    if rr.Code != http.StatusNotFound { t.Fatalf("status = %d, want %d", rr.Code, http.StatusNotFound) }
}

func TestUpdateIncome_Unauthorized(t *testing.T) {
    id := uuid.New()
    svc := &fakeIncomeService{}
    h := newIncomeHandlersForTest(svc)
    payload := models.IncomeRequest{Competencia: "2025-09", Valor: 150}
    b, _ := json.Marshal(payload)

    req := httptest.NewRequest(http.MethodPut, "/api/v1/incomes/"+id.String(), bytes.NewReader(b))
    req = setRouteParam(req, "id", id.String())
    rr := httptest.NewRecorder()

    h.UpdateIncome(rr, req)
    if rr.Code != http.StatusUnauthorized { t.Fatalf("status = %d, want %d", rr.Code, http.StatusUnauthorized) }
}

func TestGetIncomePayments_Success(t *testing.T) {
    ownerID := uuid.New()
    id := uuid.New()
    pays := []models.Payment{{ID: uuid.New(), IncomeID: id, Valor: 50}}
    svc := &fakeIncomeService{getPaysResp: pays}
    h := newIncomeHandlersForTest(svc)

    req := httptest.NewRequest(http.MethodGet, "/api/v1/incomes/"+id.String()+"/payments", nil)
    req = req.WithContext(ctxhelper.SetUserID(req.Context(), ownerID.String()))
    req = setRouteParam(req, "id", id.String())
    rr := httptest.NewRecorder()

    h.GetIncomePayments(rr, req)

    if rr.Code != http.StatusOK { t.Fatalf("status = %d, want %d", rr.Code, http.StatusOK) }
    var out struct{ Payments []models.Payment `json:"payments"` }
    if err := json.NewDecoder(rr.Body).Decode(&out); err != nil { t.Fatalf("decode: %v", err) }
    if len(out.Payments) != 1 { t.Fatalf("payments len = %d, want 1", len(out.Payments)) }
}

func TestGetIncomePayments_NotFound(t *testing.T) {
    ownerID := uuid.New()
    id := uuid.New()
    svc := &fakeIncomeService{getPaysErr: models.ErrIncomeNotFound}
    h := newIncomeHandlersForTest(svc)

    req := httptest.NewRequest(http.MethodGet, "/api/v1/incomes/"+id.String()+"/payments", nil)
    req = req.WithContext(ctxhelper.SetUserID(req.Context(), ownerID.String()))
    req = setRouteParam(req, "id", id.String())
    rr := httptest.NewRecorder()

    h.GetIncomePayments(rr, req)
    if rr.Code != http.StatusNotFound { t.Fatalf("status = %d, want %d", rr.Code, http.StatusNotFound) }
}

func TestGetIncomePayments_Unauthorized(t *testing.T) {
    id := uuid.New()
    svc := &fakeIncomeService{}
    h := newIncomeHandlersForTest(svc)

    req := httptest.NewRequest(http.MethodGet, "/api/v1/incomes/"+id.String()+"/payments", nil)
    req = setRouteParam(req, "id", id.String())
    rr := httptest.NewRecorder()

    h.GetIncomePayments(rr, req)
    if rr.Code != http.StatusUnauthorized { t.Fatalf("status = %d, want %d", rr.Code, http.StatusUnauthorized) }
}
