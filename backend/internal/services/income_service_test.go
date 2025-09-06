// MIT License
// Autor atual: David Assef
// Descrição: Testes unitários do IncomeService com repositório fake
// Data: 04-09-2025

package services

import (
    "testing"
    "time"

    "github.com/google/uuid"
    "recibofast/internal/models"
)

// fakeIncomeRepo implementa repositories.IncomeRepository para testes
// Permite configurar comportamentos e capturar chamadas.
type fakeIncomeRepo struct {
    // Inputs capturados
    created   *models.Income
    updated   *models.Income
    deletedID uuid.UUID
    listOwner uuid.UUID

    // Controle de retornos
    getByIDResp *models.Income
    getByIDErr  error
    getByIDFn   func(id, ownerID uuid.UUID) (*models.Income, error)

    listResp  []models.Income
    listTotal int
    listErr   error

    addPayErr       error
    getPaysResp     []models.Payment
    getPaysErr      error
    updateTotalErr  error

    // Observabilidade
    addPayCalled    bool
    lastPayment     *models.Payment
    updateTotalCount int
}

func TestGetIncome_UpdatesStatusWhenOverdue(t *testing.T) {
    repo := &fakeIncomeRepo{}
    svc := NewIncomeService(repo)

    ownerID := uuid.New()
    id := uuid.New()
    yesterday := time.Now().Add(-24 * time.Hour)
    income := &models.Income{ID: id, OwnerID: ownerID, Valor: 100, TotalPago: 0, Status: models.StatusPendente, DueDate: &yesterday}
    repo.getByIDResp = income

    got, err := svc.GetIncome(id, ownerID)
    if err != nil { t.Fatalf("GetIncome err: %v", err) }
    if got.Status != models.StatusVencido { t.Fatalf("status = %s, want %s", got.Status, models.StatusVencido) }
    if repo.updated == nil { t.Fatalf("esperava Update ter sido chamado para persistir novo status") }
}

func TestUpdateIncome_RecalculateStatusToPago(t *testing.T) {
    repo := &fakeIncomeRepo{}
    svc := NewIncomeService(repo)

    ownerID := uuid.New()
    id := uuid.New()
    // Receita com total pago já igual ao valor final desejado
    existing := &models.Income{ID: id, OwnerID: ownerID, Valor: 200, TotalPago: 100, Status: models.StatusParcial}
    repo.getByIDResp = existing

    req := &models.IncomeRequest{Competencia: "2025-09", Valor: 100} // ao atualizar, TotalPago(100) >= Valor(100) -> pago
    out, err := svc.UpdateIncome(id, ownerID, req)
    if err != nil { t.Fatalf("UpdateIncome err: %v", err) }
    if out.Status != models.StatusPago { t.Fatalf("status = %s, want %s", out.Status, models.StatusPago) }
    if repo.updated == nil { t.Fatalf("esperava Update ter sido chamado") }
}

func TestAddPayment_ExceedsSaldo(t *testing.T) {
    ownerID := uuid.New()
    incomeID := uuid.New()
    existing := &models.Income{ID: incomeID, OwnerID: ownerID, Valor: 100, TotalPago: 80}

    repo := &fakeIncomeRepo{getByIDResp: existing}
    svc := NewIncomeService(repo)

    req := &models.PaymentRequest{IncomeID: incomeID, Valor: 30}
    if _, err := svc.AddPayment(ownerID, req); err == nil {
        t.Fatalf("esperava erro de valor excedente")
    }
}

func (f *fakeIncomeRepo) Create(income *models.Income) error { f.created = income; return nil }
func (f *fakeIncomeRepo) GetByID(id, ownerID uuid.UUID) (*models.Income, error) {
    if f.getByIDFn != nil { return f.getByIDFn(id, ownerID) }
    return f.getByIDResp, f.getByIDErr
}
func (f *fakeIncomeRepo) Update(income *models.Income) error { f.updated = income; return nil }
func (f *fakeIncomeRepo) Delete(id, ownerID uuid.UUID) error { f.deletedID = id; return nil }
func (f *fakeIncomeRepo) List(ownerID uuid.UUID, filter *models.IncomeFilter) ([]models.Income, int, error) {
    f.listOwner = ownerID
    return f.listResp, f.listTotal, f.listErr
}
func (f *fakeIncomeRepo) AddPayment(payment *models.Payment) error { f.addPayCalled = true; f.lastPayment = payment; return f.addPayErr }
func (f *fakeIncomeRepo) GetPayments(incomeID, ownerID uuid.UUID) ([]models.Payment, error) { return f.getPaysResp, f.getPaysErr }
func (f *fakeIncomeRepo) UpdateTotalPago(incomeID uuid.UUID) error { f.updateTotalCount++; return f.updateTotalErr }

func TestCreateIncome_DefaultStatusAndDueDate(t *testing.T) {
    repo := &fakeIncomeRepo{}
    svc := NewIncomeService(repo)

    ownerID := uuid.New()
    due := time.Now().Add(24 * time.Hour).UTC().Format(time.RFC3339)
    cat := "Serviços"

    req := &models.IncomeRequest{
        Categoria:   &cat,
        Competencia: "2025-09",
        Valor:       150.0,
        // Status em branco deve virar pendente
        DueDate: &due,
    }

    income, err := svc.CreateIncome(ownerID, req)
    if err != nil { t.Fatalf("CreateIncome err: %v", err) }
    if income.Status != models.StatusPendente { t.Fatalf("status = %s, want %s", income.Status, models.StatusPendente) }
    if repo.created == nil { t.Fatalf("esperava Create ter sido chamado") }
    if income.DueDate == nil { t.Fatalf("due date deveria ter sido setado") }
}

func TestCreateIncome_InvalidDate(t *testing.T) {
    repo := &fakeIncomeRepo{}
    svc := NewIncomeService(repo)

    ownerID := uuid.New()
    badDate := "2025/09/01" // formato inválido

    req := &models.IncomeRequest{Competencia: "2025-09", Valor: 100, DueDate: &badDate}
    if _, err := svc.CreateIncome(ownerID, req); err == nil {
        t.Fatalf("esperava erro de formato de data")
    }
}

func TestCalculateIncomeStatus(t *testing.T) {
    repo := &fakeIncomeRepo{}
    svc := NewIncomeService(repo)

    now := time.Now()
    yesterday := now.Add(-24 * time.Hour)

    cases := []struct{
        in   models.Income
        want string
    }{
        {in: models.Income{Valor: 100, TotalPago: 100}, want: models.StatusPago},
        {in: models.Income{Valor: 200, TotalPago: 50}, want: models.StatusParcial},
        {in: models.Income{Valor: 100, TotalPago: 0, DueDate: &[]time.Time{yesterday}[0]}, want: models.StatusVencido},
        {in: models.Income{Valor: 100, TotalPago: 0}, want: models.StatusPendente},
    }

    for i, c := range cases {
        got := svc.CalculateIncomeStatus(&c.in)
        if got != c.want {
            t.Fatalf("case %d: got %s, want %s", i, got, c.want)
        }
    }
}

func TestAddPayment_SuccessFlow(t *testing.T) {
    // Receita com saldo devedor
    ownerID := uuid.New()
    incomeID := uuid.New()
    existing := &models.Income{ID: incomeID, OwnerID: ownerID, Valor: 200, TotalPago: 50, Status: models.StatusParcial}

    repo := &fakeIncomeRepo{getByIDResp: existing}
    svc := NewIncomeService(repo)

    pago := time.Now().UTC().Format(time.RFC3339)
    req := &models.PaymentRequest{IncomeID: incomeID, Valor: 50, PagoEm: &pago}

    // Após AddPayment e UpdateTotalPago, GetByID é chamado novamente no serviço; vamos mudar a resposta
    repo2Resp := *existing
    repo2Resp.TotalPago = 100
    repo2Resp.Status = models.StatusParcial

    call := 0
    repo.getByIDFn = func(id, owner uuid.UUID) (*models.Income, error) {
        call++
        if call == 1 { return existing, nil }
        return &repo2Resp, nil
    }

    resp, err := svc.AddPayment(ownerID, req)
    if err != nil { t.Fatalf("AddPayment err: %v", err) }
    if !repo.addPayCalled { t.Fatalf("esperava AddPayment ter sido chamado") }
    if repo.updateTotalCount != 1 { t.Fatalf("UpdateTotalPago chamado %d, want 1", repo.updateTotalCount) }
    if resp.Payment.Valor != 50 { t.Fatalf("payment valor = %v, want 50", resp.Payment.Valor) }
    if resp.Income.TotalPago != 100 { t.Fatalf("income total_pago = %v, want 100", resp.Income.TotalPago) }
}
