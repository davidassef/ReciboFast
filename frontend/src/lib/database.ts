// Autor: David Assef
// Descrição: Configuração do IndexedDB com Dexie para armazenamento offline
// Data: 20-01-2025
// MIT License

import Dexie, { Table } from 'dexie';

// Interfaces para os dados
export interface Receita {
  id?: number;
  titulo: string;
  descricao: string;
  valor: number;
  data_vencimento: string;
  status: 'pendente' | 'pago' | 'vencido';
  cliente_id?: string;
  cliente_nome?: string;
  created_at?: string;
  updated_at?: string;
  synced?: boolean;
}

export interface Contrato {
  id?: number;
  titulo: string;
  descricao: string;
  valor_total: number;
  data_inicio: string;
  data_fim: string;
  status: 'ativo' | 'concluido' | 'cancelado';
  cliente_id?: string;
  cliente_nome?: string;
  created_at?: string;
  updated_at?: string;
  synced?: boolean;
}

export interface Recibo {
  id?: number;
  numero: string;
  descricao: string;
  valor: number;
  data_emissao: string;
  data_vencimento: string;
  status: 'pendente' | 'pago' | 'vencido';
  cliente_id?: string;
  cliente_nome?: string;
  receita_id?: number;
  contrato_id?: number;
  created_at?: string;
  updated_at?: string;
  synced?: boolean;
}

export interface Cliente {
  id?: number;
  nome: string;
  email?: string;
  telefone?: string;
  documento?: string;
  endereco?: string;
  created_at?: string;
  updated_at?: string;
  synced?: boolean;
}

export interface SyncQueue {
  id?: number;
  table_name: string;
  record_id: number;
  action: 'create' | 'update' | 'delete';
  data?: Record<string, unknown>;
  created_at: string;
  attempts: number;
  last_error?: string;
}

// Classe do banco de dados
export class ReciboFastDB extends Dexie {
  receitas!: Table<Receita>;
  contratos!: Table<Contrato>;
  recibos!: Table<Recibo>;
  clientes!: Table<Cliente>;
  syncQueue!: Table<SyncQueue>;

  constructor() {
    super('ReciboFastDB');
    
    this.version(1).stores({
      receitas: '++id, titulo, valor, data_vencimento, status, cliente_id, created_at, synced',
      contratos: '++id, titulo, valor_total, data_inicio, data_fim, status, cliente_id, created_at, synced',
      recibos: '++id, numero, valor, data_emissao, data_vencimento, status, cliente_id, receita_id, contrato_id, created_at, synced',
      clientes: '++id, nome, email, documento, created_at, synced',
      syncQueue: '++id, table_name, record_id, action, created_at, attempts'
    });
  }
}

// Instância do banco
export const db = new ReciboFastDB();

// Funções utilitárias para sincronização
export const addToSyncQueue = async (
  tableName: string,
  recordId: number,
  action: 'create' | 'update' | 'delete',
  data?: Record<string, unknown>
) => {
  await db.syncQueue.add({
    table_name: tableName,
    record_id: recordId,
    action,
    data,
    created_at: new Date().toISOString(),
    attempts: 0
  });
};

export const markAsSynced = async (tableName: string, recordId: number) => {
  const table = (db as Record<string, unknown>)[tableName];
  if (table) {
    await table.update(recordId, { synced: true, updated_at: new Date().toISOString() });
  }
};

export const getPendingSyncItems = async () => {
  return await db.syncQueue.orderBy('created_at').toArray();
};

export const removeSyncItem = async (syncId: number) => {
  await db.syncQueue.delete(syncId);
};

export const incrementSyncAttempts = async (syncId: number, error?: string) => {
  const item = await db.syncQueue.get(syncId);
  if (item) {
    await db.syncQueue.update(syncId, {
      attempts: item.attempts + 1,
      last_error: error
    });
  }
};

// Funções de CRUD para Receitas
export const receitasDB = {
  async getAll() {
    return await db.receitas.orderBy('created_at').reverse().toArray();
  },

  async getById(id: number) {
    return await db.receitas.get(id);
  },

  async create(receita: Omit<Receita, 'id'>) {
    const now = new Date().toISOString();
    const id = await db.receitas.add({
      ...receita,
      created_at: now,
      updated_at: now,
      synced: false
    });
    
    await addToSyncQueue('receitas', id, 'create', receita);
    return id;
  },

  async update(id: number, changes: Partial<Receita>) {
    const updated = {
      ...changes,
      updated_at: new Date().toISOString(),
      synced: false
    };
    
    await db.receitas.update(id, updated);
    await addToSyncQueue('receitas', id, 'update', updated);
  },

  async delete(id: number) {
    await db.receitas.delete(id);
    await addToSyncQueue('receitas', id, 'delete');
  },

  async getByStatus(status: string) {
    return await db.receitas.where('status').equals(status).toArray();
  }
};

// Funções de CRUD para Contratos
export const contratosDB = {
  async getAll() {
    return await db.contratos.orderBy('created_at').reverse().toArray();
  },

  async getById(id: number) {
    return await db.contratos.get(id);
  },

  async create(contrato: Omit<Contrato, 'id'>) {
    const now = new Date().toISOString();
    const id = await db.contratos.add({
      ...contrato,
      created_at: now,
      updated_at: now,
      synced: false
    });
    
    await addToSyncQueue('contratos', id, 'create', contrato);
    return id;
  },

  async update(id: number, changes: Partial<Contrato>) {
    const updated = {
      ...changes,
      updated_at: new Date().toISOString(),
      synced: false
    };
    
    await db.contratos.update(id, updated);
    await addToSyncQueue('contratos', id, 'update', updated);
  },

  async delete(id: number) {
    await db.contratos.delete(id);
    await addToSyncQueue('contratos', id, 'delete');
  },

  async getByStatus(status: string) {
    return await db.contratos.where('status').equals(status).toArray();
  }
};

// Funções de CRUD para Recibos
export const recibosDB = {
  async getAll() {
    return await db.recibos.orderBy('created_at').reverse().toArray();
  },

  async getById(id: number) {
    return await db.recibos.get(id);
  },

  async create(recibo: Omit<Recibo, 'id'>) {
    const now = new Date().toISOString();
    const id = await db.recibos.add({
      ...recibo,
      created_at: now,
      updated_at: now,
      synced: false
    });
    
    await addToSyncQueue('recibos', id, 'create', recibo);
    return id;
  },

  async update(id: number, changes: Partial<Recibo>) {
    const updated = {
      ...changes,
      updated_at: new Date().toISOString(),
      synced: false
    };
    
    await db.recibos.update(id, updated);
    await addToSyncQueue('recibos', id, 'update', updated);
  },

  async delete(id: number) {
    await db.recibos.delete(id);
    await addToSyncQueue('recibos', id, 'delete');
  },

  async getByStatus(status: string) {
    return await db.recibos.where('status').equals(status).toArray();
  }
};

// Funções de CRUD para Clientes
export const clientesDB = {
  async getAll() {
    return await db.clientes.orderBy('nome').toArray();
  },

  async getById(id: number) {
    return await db.clientes.get(id);
  },

  async create(cliente: Omit<Cliente, 'id'>) {
    const now = new Date().toISOString();
    const id = await db.clientes.add({
      ...cliente,
      created_at: now,
      updated_at: now,
      synced: false
    });
    
    await addToSyncQueue('clientes', id, 'create', cliente);
    return id;
  },

  async update(id: number, changes: Partial<Cliente>) {
    const updated = {
      ...changes,
      updated_at: new Date().toISOString(),
      synced: false
    };
    
    await db.clientes.update(id, updated);
    await addToSyncQueue('clientes', id, 'update', updated);
  },

  async delete(id: number) {
    await db.clientes.delete(id);
    await addToSyncQueue('clientes', id, 'delete');
  },

  async searchByName(name: string) {
    return await db.clientes.where('nome').startsWithIgnoreCase(name).toArray();
  }
};

export default db;