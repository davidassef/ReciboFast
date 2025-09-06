// Autor: David Assef
// Descrição: Testes unitários do ReceiptService com mocks (sem rede)
// Data: 05-09-2025
// MIT License

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

// Mocks utilitários Supabase
const mockGetUser = vi.fn();
const mockFrom = vi.fn();
const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockOrder = vi.fn();
const mockLimit = vi.fn();
const mockSingle = vi.fn();
const mockInsert = vi.fn();
const mockUpdate = vi.fn();

// Mocks Storage
const mockStorageFrom = vi.fn();
const mockStorageUpload = vi.fn();
const mockStorageGetPublicUrl = vi.fn();

// Mock do módulo '../lib/supabase'
vi.mock('../../lib/supabase', () => {
  const supabase = {
    auth: {
      getUser: mockGetUser,
    },
    from: (table: string) => mockFrom(table),
    storage: {
      from: (bucket: string) => mockStorageFrom(bucket),
    },
  } as any;
  return { supabase };
});

// Mock jsPDF para não gerar PDFs reais
vi.mock('jspdf', () => {
  class MockPDF {
    internal = { pageSize: { getWidth: () => 210, getHeight: () => 297 } };
    setFont() {}
    setFontSize() {}
    text() {}
    line() {}
    addImage() {}
    output() { return new Blob(["%PDF-1.4 mock"], { type: 'application/pdf' }); }
  }
  return { default: MockPDF };
});

// Mock qrcode
vi.mock('qrcode', () => ({
  default: { toDataURL: async () => 'data:image/png;base64,MOCK' },
}));

// Importa módulo sob teste após mocks
import { ReceiptService } from '../../services/receiptService';

// Helpers
const USER_ID = 'user-1';

describe('ReceiptService', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // auth.getUser
    mockGetUser.mockResolvedValue({ data: { user: { id: USER_ID } }, error: null });

    // Storage encadeado
    mockStorageFrom.mockImplementation((_bucket: string) => ({
      upload: mockStorageUpload,
      getPublicUrl: mockStorageGetPublicUrl,
    }));

    // from encadeado
    mockFrom.mockImplementation((_table: string) => ({
      select: (..._cols: any[]) => {
        mockSelect(..._cols);
        return {
          eq: (...args: any[]) => { mockEq(...args); return this; },
          order: (...args: any[]) => { mockOrder(...args); return this; },
          limit: (...args: any[]) => { mockLimit(...args); return this; },
          single: () => mockSingle(),
        } as any;
      },
      insert: (..._values: any[]) => ({ select: () => ({ single: () => mockSingle() }) }),
      update: (..._values: any[]) => ({ eq: () => ({}) }),
      eq: () => ({})
    }));

    // Defaults:
    mockSingle.mockResolvedValue({ data: null, error: null });
    mockStorageUpload.mockResolvedValue({ data: { path: `${USER_ID}/REC-2025-000001.pdf` }, error: null });
    mockStorageGetPublicUrl.mockReturnValue({ data: { publicUrl: 'https://example.com/file.pdf' } });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('createReceipt: deve criar recibo mínimo sem assinatura/qr code', async () => {
    // Simular que não há recibos anteriores (generateReceiptNumber retorna REC-2025-000001)
    // chain: from('rf_receipts').select('receipt_number').eq('user_id').order().limit(1).single()
    mockFrom.mockImplementationOnce((_table: string) => ({
      select: () => ({
        eq: () => ({
          order: () => ({ limit: () => ({ single: () => Promise.resolve({ data: null, error: null }) }) })
        })
      })
    }));

    // Payer
    mockFrom.mockImplementationOnce((_table: string) => ({
      select: () => ({
        eq: () => ({ eq: () => ({ single: () => Promise.resolve({ data: { id: 'payer-1', name: 'Pagador', document: '123', email: 'p@e.com', phone: '999' }, error: null }) }) })
      })
    }));

    // Profile
    mockFrom.mockImplementationOnce((_table: string) => ({
      select: () => ({
        eq: () => ({ single: () => Promise.resolve({ data: { id: 'profile-1', name: 'Emissor', document: '456', email: 'e@e.com', phone: '888' }, error: null }) })
      })
    }));

    // Insert receipt
    mockFrom.mockImplementationOnce((_table: string) => ({
      insert: () => ({ select: () => ({ single: () => Promise.resolve({ data: { id: 'r1' }, error: null }) }) })
    }));

    // Update file_path
    mockFrom.mockImplementationOnce((_table: string) => ({
      update: () => ({ eq: () => ({}) })
    }));

    const result = await ReceiptService.createReceipt({
      payer_id: 'payer-1',
      amount: 123.45,
      description: 'Teste',
      payment_date: '2025-09-05',
      payment_method: 'pix',
      include_qr_code: false,
      include_signature: false,
    } as any);

    expect(result).toHaveProperty('id', 'r1');
    expect(mockStorageUpload).toHaveBeenCalledTimes(1);
  });

  it('getReceiptPDFUrl: deve retornar URL pública', async () => {
    // Buscar receipt com file_path
    mockFrom.mockImplementationOnce((_table: string) => ({
      select: () => ({ eq: () => ({ eq: () => ({ single: () => Promise.resolve({ data: { file_path: `${USER_ID}/REC-2025-000001.pdf` }, error: null }) }) }) })
    }));

    const url = await ReceiptService.getReceiptPDFUrl('r1');
    expect(url).toContain('https://');
  });
});
