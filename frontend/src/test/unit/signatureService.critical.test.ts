// Autor: David Assef
// Descrição: Testes críticos do SignatureService (is_default, path no Storage, delete)
// Data: 05-09-2025
// MIT License

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

const mockGetUser = vi.fn();
const mockStorageFrom = vi.fn();
const mockStorageUpload = vi.fn();
const mockStorageRemove = vi.fn();
const mockFrom = vi.fn();
const mockUpdate = vi.fn();
const mockInsert = vi.fn();
const mockSelect = vi.fn();
const mockSingle = vi.fn();

vi.mock('../../lib/supabase', () => {
  const supabase = {
    auth: { getUser: mockGetUser },
    storage: { from: (bucket: string) => mockStorageFrom(bucket) },
    from: (table: string) => mockFrom(table),
  } as any;
  return { supabase };
});

import { SignatureService } from '../../services/signatureService';

const USER_ID = 'user-1';

describe('SignatureService (crítico)', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockGetUser.mockResolvedValue({ data: { user: { id: USER_ID } }, error: null });

    mockStorageFrom.mockImplementation((_bucket: string) => ({
      upload: mockStorageUpload,
      remove: mockStorageRemove,
    }));

    mockFrom.mockImplementation((table: string) => {
      const chain: any = {
        update: (...args: any[]) => { mockUpdate(...args); return { eq: () => chain }; },
        insert: (...args: any[]) => { mockInsert(...args); return { select: () => ({ single: () => mockSingle() }) }; },
        select: (..._cols: any[]) => chain,
        single: () => mockSingle(),
        eq: () => chain,
      };
      return chain;
    });

    mockSingle.mockResolvedValue({ data: { id: 'sig-1', file_path: `${USER_ID}/a.png` }, error: null });
  });

  afterEach(() => vi.restoreAllMocks());

  it('uploadSignature: quando is_default=true deve remover padrões anteriores', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(1_690_000_000_000);
    vi.spyOn(Math, 'random').mockReturnValue(0.123456);

    const file: any = { name: 'sig.png', type: 'image/png', size: 1000 };
    mockStorageUpload.mockResolvedValue({ data: { path: `${USER_ID}/1690000000000-4fzy.png` }, error: null });
    mockSingle.mockResolvedValueOnce({ data: { id: 'created-id' }, error: null });

    await SignatureService.uploadSignature({ name: 'S', file, is_default: true });

    // removeDefaultSignature deve ter executado update({ is_default: false }).eq('user_id', USER_ID)
    expect(mockUpdate).toHaveBeenCalledWith({ is_default: false });
  });

  it('uploadSignature: path no Storage deve começar com user.id', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(1_690_000_000_000);
    vi.spyOn(Math, 'random').mockReturnValue(0.123456);

    const file: any = { name: 'sig.jpg', type: 'image/jpeg', size: 2048 };
    mockStorageUpload.mockResolvedValue({ data: { path: `${USER_ID}/1690000000000-4fzy.jpg` }, error: null });
    mockSingle.mockResolvedValueOnce({ data: { id: 'created-id' }, error: null });

    await SignatureService.uploadSignature({ name: 'S', file, is_default: false });

    const [calledPath] = mockStorageUpload.mock.calls[0];
    expect(typeof calledPath).toBe('string');
    expect(calledPath.startsWith(`${USER_ID}/`)).toBe(true);
  });

  it('deleteSignature: remove arquivo do Storage e deleta registro', async () => {
    // deleteSignature: busca rf_signatures -> remove(storage) -> delete(db)
    const chain: any = {
      delete: vi.fn().mockReturnValue({ eq: () => ({ eq: () => ({}) }) }),
      select: vi.fn().mockReturnValue({ eq: () => ({ eq: () => ({ single: () => Promise.resolve({ data: { file_path: `${USER_ID}/a.png` }, error: null }) }) }) }),
    };
    mockFrom.mockImplementationOnce((_table: string) => chain) // select file_path
                  .mockImplementationOnce((_table: string) => chain); // delete

    await SignatureService.deleteSignature('sig-1');
    expect(mockStorageRemove).toHaveBeenCalledWith([`${USER_ID}/a.png`]);
  });
});
