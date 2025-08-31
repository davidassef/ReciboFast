// MIT License
// Autor atual: David Assef
// Descrição: Erros personalizados para os modelos do sistema
// Data: 29-08-2025

package models

import "errors"

// Erros de validação para receitas
var (
	ErrCompetenciaRequired = errors.New("competência é obrigatória")
	ErrValorInvalid        = errors.New("valor deve ser maior que zero")
	ErrIncomeIDRequired    = errors.New("ID da receita é obrigatório")
	ErrIncomeNotFound      = errors.New("receita não encontrada")
	ErrPaymentNotFound     = errors.New("pagamento não encontrado")
	ErrInsufficientAmount  = errors.New("valor do pagamento excede o saldo devedor")
	ErrInvalidStatus       = errors.New("status inválido")
	ErrInvalidDateFormat   = errors.New("formato de data inválido")
	ErrUnauthorized        = errors.New("não autorizado")
	ErrDuplicatePayment    = errors.New("pagamento duplicado")
)

// Constantes para status de receitas
const (
	StatusPendente   = "pendente"
	StatusParcial    = "parcial"
	StatusPago       = "pago"
	StatusVencido    = "vencido"
	StatusCancelado  = "cancelado"
)

// ValidStatus verifica se o status é válido
func ValidStatus(status string) bool {
	validStatuses := []string{
		StatusPendente,
		StatusParcial,
		StatusPago,
		StatusVencido,
		StatusCancelado,
	}
	
	for _, validStatus := range validStatuses {
		if status == validStatus {
			return true
		}
	}
	return false
}

// GetValidStatuses retorna todos os status válidos
func GetValidStatuses() []string {
	return []string{
		StatusPendente,
		StatusParcial,
		StatusPago,
		StatusVencido,
		StatusCancelado,
	}
}