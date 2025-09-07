// MIT License
// Autor: David Assef
// Descrição: Serviço de API para Recibos (CRUD via backend /api/v1/receipts)
// Data: 06-09-2025

import { apiClient, type PaginatedResponse } from './api';

export interface BackendReceipt {
  id: string;
  owner_id: string;
  income_id?: string | null;
  numero: number;
  emitido_em?: string | null;
  pdf_url?: string | null;
  hash?: string | null;
  signature_id?: string | null;
  issuer_name?: string | null;
  issuer_document?: string | null;
  created_at?: string | null;
}

export interface CreateReceiptPayload {
  income_id?: string | null;
  pdf_url?: string | null;
  hash?: string | null;
  signature_id?: string | null;
  issuer_name?: string | null;
  issuer_document?: string | null;
}

export interface UpdateReceiptPayload extends CreateReceiptPayload {}

class ReceiptsApi {
  async list(page = 1, limit = 10) {
    return apiClient.get<PaginatedResponse<BackendReceipt>>(`/receipts?page=${page}&limit=${limit}`);
  }

  async get(id: string) {
    return apiClient.get<BackendReceipt>(`/receipts/${id}`);
  }

  async create(payload: CreateReceiptPayload) {
    return apiClient.post<BackendReceipt>('/receipts', payload as unknown as Record<string, unknown>);
  }

  async update(id: string, payload: UpdateReceiptPayload) {
    return apiClient.put<BackendReceipt>(`/receipts/${id}`, payload as unknown as Record<string, unknown>);
  }

  async remove(id: string) {
    return apiClient.delete<void>(`/receipts/${id}`);
  }
}

export const receiptsApi = new ReceiptsApi();
