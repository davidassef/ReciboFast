// Autor: David Assef
// Descrição: Testes unitários do SignatureService com mocks do Supabase (sem rede)
// Data: 05-09-2025
// MIT License

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

// Mock do módulo '../../lib/supabase' isolado e auto-contido
vi.mock('../../lib/supabase', () => {
  const mockGetUser = vi.fn();
  const mockUpdateUser = vi.fn();
  const mockStorageFrom = vi.fn();
  const mockStorageUpload = vi.fn();
  const mockStorageRemove = vi.fn();
  const mockStorageGetPublicUrl = vi.fn();
  const mockFrom = vi.fn();
  const mockInsert = vi.fn();
  const mockSelect = vi.fn();
  const mockSingle = vi.fn();
  const mockUpdate = vi.fn();
  const mockDelete = vi.fn();

  const supabase = {
    auth: { getUser: mockGetUser, updateUser: mockUpdateUser },
    storage: { from: (bucket: string) => mockStorageFrom(bucket) },
    from: (table: string) => mockFrom(table),
  } as any;

  return { supabase, __mocks: { mockGetUser, mockUpdateUser, mockStorageFrom, mockStorageUpload, mockStorageRemove, mockStorageGetPublicUrl, mockFrom, mockInsert, mockSelect, mockSingle, mockUpdate, mockDelete } };
});

// Importa os mocks definidos na factory
import * as sbModule from '../../lib/supabase';
const {
  mockGetUser,
  mockUpdateUser,
  mockStorageFrom,
  mockStorageUpload,
  mockStorageRemove,
  mockStorageGetPublicUrl,
  mockFrom,
  mockInsert,
  mockSelect,
  mockSingle,
  mockUpdate,
  mockDelete,
} = (sbModule as any).__mocks;

// Importa o módulo sob teste após o mock
import { SignatureService } from '../../services/signatureService';

// Helpers de arquivo fake (evita dependência de File/Blob do ambiente)
const makeFakeFile = (name: string, type: string, size: number) => ({
  name,
  type,
  size,
}) as any;

describe('SignatureService', () => {
  const USER_ID = 'user-1';

  beforeEach(() => {
    vi.clearAllMocks();

    // auth.getUser mock default
    mockGetUser.mockResolvedValue({ data: { user: { id: USER_ID } }, error: null });

    // storage mocks encadeados
    mockStorageFrom.mockImplementation((_bucket: string) => ({
      upload: mockStorageUpload,
      remove: mockStorageRemove,
      getPublicUrl: mockStorageGetPublicUrl,
      createSignedUrl: vi.fn().mockResolvedValue({ data: { signedUrl: '' }, error: null }), // força fallback
    }));

    // from mocks encadeados (insert/select/single, update/delete)
    mockFrom.mockImplementation((_table: string) => ({
      insert: mockInsert,
      update: mockUpdate,
      delete: mockDelete,
      select: mockSelect,
      single: mockSingle,
      order: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
    }));

    // select/single por padrão retornam array vazio
    mockSelect.mockReturnThis();
    mockSingle.mockResolvedValue({ data: null, error: null });

    // getPublicUrl default
    mockStorageGetPublicUrl.mockReturnValue({ data: { publicUrl: 'https://example.com/file.png' } });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('validateSignatureFile', () => {
    it('deve invalidar tipo de arquivo não permitido', () => {
      const file = makeFakeFile('sig.gif', 'image/gif', 10);
      const result = SignatureService.validateSignatureFile(file);
      expect(result.isValid).toBe(false);
      expect(result.errors.join(' ')).toMatch(/Tipo de arquivo não permitido/i);
    });

    it('deve invalidar arquivo acima do limite', () => {
      const file = makeFakeFile('sig.png', 'image/png', 6 * 1024 * 1024);
      const result = SignatureService.validateSignatureFile(file);
      expect(result.isValid).toBe(false);
      expect(result.errors.join(' ')).toMatch(/Arquivo muito grande/i);
    });

    it('deve aceitar arquivo válido', () => {
      const file = makeFakeFile('sig.png', 'image/png', 1000);
      const result = SignatureService.validateSignatureFile(file);
      expect(result.isValid).toBe(true);
    });
  });

  describe('uploadSignature', () => {
    it('deve lançar erro quando usuário não autenticado', async () => {
      mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: null });
      const file = makeFakeFile('sig.png', 'image/png', 1000);
      await expect(
        SignatureService.uploadSignature({ name: 'Minha Assinatura', file, is_default: false })
      ).rejects.toThrow(/Usuário não autenticado/);
    });

    it('deve lançar erro quando validação de arquivo falha', async () => {
      const file = makeFakeFile('sig.gif', 'image/gif', 1000);
      await expect(
        SignatureService.uploadSignature({ name: 'Inválido', file, is_default: false })
      ).rejects.toThrow(/Tipo de arquivo não permitido/i);
    });

    it('deve subir arquivo e inserir metadados com sucesso', async () => {
      // Determinismo do fileName gerado
      vi.spyOn(Date, 'now').mockReturnValue(1_690_000_000_000);
      vi.spyOn(Math, 'random').mockReturnValue(0.123456);

      const file = makeFakeFile('sig.png', 'image/png', 2048);

      // Upload OK
      mockStorageUpload.mockResolvedValue({ data: { path: `${USER_ID}/1690000000000-4fzy.${'png'}` }, error: null });

      // insert().select().single() OK
      const inserted = {
        id: 'sig-1',
        name: 'Minha Assinatura',
        file_path: `${USER_ID}/1690000000000-4fzy.png`,
        file_size: file.size,
        is_default: false,
        created_at: new Date().toISOString(),
      };
      mockInsert.mockReturnValue({
        select: () => ({
          single: () => Promise.resolve({ data: inserted, error: null }),
        }),
      });

      const result = await SignatureService.uploadSignature({ name: 'Minha Assinatura', file, is_default: false });
      expect(result).toMatchObject({ id: 'sig-1', name: 'Minha Assinatura', file_path: expect.any(String) });
      expect(mockStorageUpload).toHaveBeenCalledTimes(1);
      expect(mockInsert).toHaveBeenCalledTimes(1);
    });

    it('deve remover arquivo do storage se insert no banco falhar', async () => {
      vi.spyOn(Date, 'now').mockReturnValue(1_690_000_000_000);
      vi.spyOn(Math, 'random').mockReturnValue(0.123456);

      const file = makeFakeFile('sig.png', 'image/png', 2048);

      // Upload OK
      mockStorageUpload.mockResolvedValue({ data: { path: `${USER_ID}/1690000000000-4fzy.png` }, error: null });

      // insert falha
      mockInsert.mockReturnValue({
        select: () => ({
          single: () => Promise.resolve({ data: null, error: { message: 'falha banco' } }),
        }),
      });

      await expect(
        SignatureService.uploadSignature({ name: 'Minha Assinatura', file, is_default: true })
      ).rejects.toThrow(/Erro ao salvar assinatura/i);

      expect(mockStorageRemove).toHaveBeenCalledTimes(1);
      const args = mockStorageRemove.mock.calls[0][0];
      expect(Array.isArray(args)).toBe(true);
      expect(args[0]).toContain(USER_ID);
    });
  });

  describe('getUserSignatures', () => {
    it('deve retornar itens da galeria com URLs públicas', async () => {
      const rows = [
        { id: 'sig-1', name: 'S1', file_path: `${USER_ID}/a.png`, is_default: false, created_at: '2025-01-01T00:00:00Z' },
        { id: 'sig-2', name: 'S2', file_path: `${USER_ID}/b.png`, is_default: true, created_at: '2025-01-02T00:00:00Z' },
      ];

      // from('rf_signatures').select().order()
      mockFrom.mockImplementation((table: string) => {
        if (table === 'rf_signatures') {
          const chain: any = {
            select: () => chain,
            eq: () => chain,
            order: () => Promise.resolve({ data: rows, error: null }),
          };
          return chain;
        }
        if (table === 'signatures') {
          const chain: any = {
            select: () => chain,
            eq: () => chain,
            order: () => Promise.resolve({ data: [], error: null }),
          };
          return chain;
        }
        return { select: mockSelect, single: mockSingle } as any;
      });

      mockStorageGetPublicUrl.mockImplementation(({ }: any) => ({ data: { publicUrl: 'https://example.com/p.png' } }));

      const gallery = await SignatureService.getUserSignatures();
      expect(gallery).toHaveLength(2);
      expect(gallery[0]).toHaveProperty('thumbnail_url');
    });
  });
});
