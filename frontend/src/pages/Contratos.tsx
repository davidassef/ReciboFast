// Autor: David Assef
// Descrição: Página de gerenciamento de contratos
// Data: 06-09-2025
// MIT License

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  Filter, 
  FileText,
  CreditCard,
  Calendar,
  Users,
  Eye,
  Edit,
  Trash2,
  Download,
  X,
  ChevronDown
} from 'lucide-react';
import { cn } from '../lib/utils';
import { supabase } from '../lib/supabase';
import { SignatureService } from '../services/signatureService';
import { ContractsService } from '../services/contractsService';

type ClausulaItem = { id: string; label: string; conteudo: string };
type Clausula = { id: string; titulo: string; conteudo: string; itens?: ClausulaItem[] };

interface Contrato {
  id: string;
  numero: string;
  cliente: string;
  valor: number;
  dataInicio: string; // opcional
  dataFim: string; // opcional
  status: 'ativo' | 'inativo' | 'vencido';
  tipo: string;
  descricao: string;
  documento: string; // CPF ou CNPJ obrigatório
  signatureId?: string; // ID da assinatura selecionada
  signatureUrl?: string; // URL resolvida para preview/print
  objeto?: string;
  clausulas?: Clausula[];
  issuerName?: string; // Emitir em nome de outra pessoa
  issuerDocumento?: string; // Documento do emissor alternativo
  recurrenceEnabled?: boolean; // recebimento recorrente
  recurrenceDay?: number; // dia do recebimento (1-28)
}

const _mockContratos: Contrato[] = [
  {
    id: '1',
    numero: 'CONT-001',
    cliente: 'João Silva',
    valor: 5000.00,
    dataInicio: '2025-01-01',
    dataFim: '2025-12-31',
    status: 'ativo',
    tipo: 'Consultoria',
    descricao: 'Consultoria em TI - Suporte técnico mensal',
    documento: '000.000.000-00'
  },
  {
    id: '2',
    numero: 'CONT-002',
    cliente: 'Maria Santos',
    valor: 8000.00,
    dataInicio: '2024-06-01',
    dataFim: '2025-05-31',
    status: 'ativo',
    tipo: 'Desenvolvimento',
    descricao: 'Desenvolvimento de sistema web',
    documento: '00.000.000/0000-00'
  },
  {
    id: '3',
    numero: 'CONT-003',
    cliente: 'Pedro Costa',
    valor: 3000.00,
    dataInicio: '2024-01-01',
    dataFim: '2024-12-31',
    status: 'vencido',
    tipo: 'Manutenção',
    descricao: 'Manutenção de software',
    documento: '000.000.000-00'
  }
];

const getStatusColor = (status: Contrato['status']) => {
  switch (status) {
    case 'ativo':
      return 'bg-green-100 text-green-800';
    case 'inativo':
      return 'bg-gray-100 text-gray-800';
    case 'vencido':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const getStatusLabel = (status: Contrato['status']) => {
  switch (status) {
    case 'ativo':
      return 'Ativo';
    case 'inativo':
      return 'Inativo';
    case 'vencido':
      return 'Vencido';
    default:
      return status;
  }
};

const Contratos: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [contratos, setContratos] = useState<Contrato[]>([]);
  const [loadedLocal, setLoadedLocal] = useState(false);

  // Persistência local simples (localStorage)
  useEffect(() => {
    try {
      const saved = localStorage.getItem('contratos');
      if (saved) setContratos(JSON.parse(saved));
    } catch {}
    setLoadedLocal(true);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('contratos', JSON.stringify(contratos));
    } catch {}
  }, [contratos]);

  // Carregar contratos do Supabase (server-side) após carregar local
  useEffect(() => {
    if (!loadedLocal) return;
    const loadRemote = async () => {
      try {
        const list = await ContractsService.list();
        if (Array.isArray(list) && list.length > 0) {
          const mapped: Contrato[] = list.map((c) => ({
            id: c.id,
            numero: c.numero || `CONT-${c.id.slice(0, 6).toUpperCase()}`,
            cliente: c.cliente || 'Cliente',
            valor: Number(c.valor || 0),
            dataInicio: c.dataInicio || '',
            dataFim: c.dataFim || '',
            status: (c.status as Contrato['status']) || 'ativo',
            tipo: c.tipo || 'Outros',
            descricao: c.descricao || '',
            documento: c.documento || '',
            signatureId: c.signatureId || undefined,
            signatureUrl: undefined,
            objeto: undefined,
            clausulas: undefined,
            issuerName: c.issuerName || undefined,
            issuerDocumento: c.issuerDocumento || undefined,
            recurrenceEnabled: !!c.recurrenceEnabled,
            recurrenceDay: c.recurrenceDay || undefined,
          }));
          setContratos(prev => {
            const byId = new Map(prev.map(p => [p.id, p]));
            mapped.forEach(m => byId.set(m.id, { ...byId.get(m.id), ...m }));
            return Array.from(byId.values());
          });
        }
      } catch (e) {
        console.warn('Falha ao carregar contratos do Supabase (mantendo local):', e);
      }
    };
    loadRemote();
  }, [loadedLocal]);
  const [showNovoContrato, setShowNovoContrato] = useState(false);
  const [novoContrato, setNovoContrato] = useState<Partial<Contrato>>({
    numero: '',
    cliente: '',
    valor: 0,
    dataInicio: '',
    dataFim: '',
    status: 'ativo',
    tipo: 'Aluguel',
    descricao: '',
    documento: '',
    signatureUrl: undefined,
    recurrenceEnabled: false,
    recurrenceDay: undefined
  });
  const [showViewContrato, setShowViewContrato] = useState(false);
  const [contratoSelecionado, setContratoSelecionado] = useState<Contrato | null>(null);
  const [showEditContrato, setShowEditContrato] = useState(false);
  const [editContrato, setEditContrato] = useState<Partial<Contrato>>({});
  const [novoValorInput, setNovoValorInput] = useState<string>('');
  const [editValorInput, setEditValorInput] = useState<string>('');
  const [defaultSignatureUrl, setDefaultSignatureUrl] = useState<string | null>(null);
  const [defaultSignaturePath, setDefaultSignaturePath] = useState<string | null>(null);
  const [showSignatureSettings, setShowSignatureSettings] = useState(false);
  const [signatureUploading, setSignatureUploading] = useState(false);
  // Campos dinâmicos: objetivo e cláusulas
  const [novoObjeto, setNovoObjeto] = useState<string>('');
  const [novoClausulas, setNovoClausulas] = useState<Clausula[]>([]);
  const [editObjeto, setEditObjeto] = useState<string>('');
  const [editClausulas, setEditClausulas] = useState<Clausula[]>([]);
  // Assinaturas: opções e checkboxes controlados
  const [signatureOptions, setSignatureOptions] = useState<Array<{ id: string; url: string; name: string }>>([]);
  const [novoUseSignature, setNovoUseSignature] = useState<boolean>(false);
  const [editUseSignature, setEditUseSignature] = useState<boolean>(false);
  // Emitir em nome de outra pessoa
  const [novoEmitirOutro, setNovoEmitirOutro] = useState<boolean>(false);
  const [editEmitirOutro, setEditEmitirOutro] = useState<boolean>(false);
  // Exclusão segura com confirmação de senha
  const [showDeleteContrato, setShowDeleteContrato] = useState(false);
  const [deleteTargetContrato, setDeleteTargetContrato] = useState<Contrato | null>(null);
  const [deletePasswordContrato, setDeletePasswordContrato] = useState('');
  const [deleteLoadingContrato, setDeleteLoadingContrato] = useState(false);
  const [deleteErrorContrato, setDeleteErrorContrato] = useState<string | null>(null);

  // Helpers CPF/CNPJ
  const onlyDigits = (v: string) => (v || '').replace(/\D/g, '');
  const formatCPF = (digits: string) => {
    const v = digits.slice(0, 11);
    return v
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  };
  const formatCNPJ = (digits: string) => {
    const v = digits.slice(0, 14);
    return v
      .replace(/(\d{2})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1/$2')
      .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
  };
  const validateCPF = (cpfRaw: string): boolean => {
    const cpf = onlyDigits(cpfRaw);
    if (cpf.length !== 11 || /^([0-9])\1+$/.test(cpf)) return false;
    const calcDigit = (base: string, factorStart: number) => {
      let total = 0;
      for (let i = 0; i < base.length; i++) total += parseInt(base[i], 10) * (factorStart - i);
      const rest = (total * 10) % 11;
      return rest === 10 ? 0 : rest;
    };
    const d1 = calcDigit(cpf.substring(0, 9), 10);
    const d2 = calcDigit(cpf.substring(0, 10), 11);
    return d1 === parseInt(cpf[9], 10) && d2 === parseInt(cpf[10], 10);
  };
  const validateCNPJ = (cnpjRaw: string): boolean => {
    const cnpj = onlyDigits(cnpjRaw);
    if (cnpj.length !== 14 || /^([0-9])\1+$/.test(cnpj)) return false;
    const calc = (base: string) => {
      const factors = [6,5,4,3,2,9,8,7,6,5,4,3,2];
      let sum = 0;
      for (let i = 0; i < base.length; i++) sum += parseInt(base[i], 10) * factors[i+ (13-base.length)];
      const rest = sum % 11;
      return rest < 2 ? 0 : 11 - rest;
    };
    const d1 = calc(cnpj.substring(0, 12));
    const d2 = calc(cnpj.substring(0, 13));
    return d1 === parseInt(cnpj[12], 10) && d2 === parseInt(cnpj[13], 10);
  };

  useEffect(() => {
    const loadDefaultSignature = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        const path = (user?.user_metadata as any)?.default_signature_path as string | undefined;
        if (!path) { setDefaultSignatureUrl(null); setDefaultSignaturePath(null); return; }
        const { data: signed } = await supabase.storage.from('signatures').createSignedUrl(path, 60 * 60);
        setDefaultSignatureUrl(signed?.signedUrl || null);
        setDefaultSignaturePath(path);
      } catch {
        setDefaultSignatureUrl(null);
        setDefaultSignaturePath(null);
      }
    };
    loadDefaultSignature();
  }, []);

  // Sincroniza assinaturas automaticamente ao abrir modais de novo/editar
  useEffect(() => {
    const loadSignatures = async () => {
      try {
        const gallery = await SignatureService.getUserSignatures();
        const opts = gallery.map(i => ({ id: i.id, url: i.thumbnail_url, name: i.display_name || i.name }));
        setSignatureOptions(opts);
      } catch (e) {
        console.warn('Falha ao carregar assinaturas para contratos:', e);
      }
    };
    if (showNovoContrato || showEditContrato) {
      loadSignatures();
    }
  }, [showNovoContrato, showEditContrato]);

  // Inicializa estado do checkbox quando abre os modais
  useEffect(() => {
    if (showNovoContrato) setNovoUseSignature(!!defaultSignatureUrl || !!novoContrato.signatureUrl || !!novoContrato.signatureId);
  }, [showNovoContrato, defaultSignatureUrl, novoContrato.signatureUrl, novoContrato.signatureId]);
  useEffect(() => {
    if (showEditContrato) setEditUseSignature(!!defaultSignatureUrl || !!editContrato.signatureUrl || !!editContrato.signatureId);
  }, [showEditContrato, defaultSignatureUrl, editContrato.signatureUrl, editContrato.signatureId]);

  const filteredContratos = contratos.filter(contrato => {
    const matchesSearch = contrato.cliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         contrato.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         contrato.tipo.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'todos' || contrato.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalContratos = filteredContratos.reduce((sum, contrato) => sum + contrato.valor, 0);
  const contratosAtivos = filteredContratos.filter(c => c.status === 'ativo').length;

  // Helpers de moeda (pt-BR)
  const formatCurrencyDigitsToBR = (value: string): string => {
    const digits = value.replace(/\D/g, '');
    if (!digits) return '';
    const number = (parseInt(digits, 10) / 100).toFixed(2);
    const [intPart, decPart] = number.split('.');
    const intFormatted = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return `${intFormatted},${decPart}`;
  };

  const parseCurrencyBRToNumber = (display: string): number => {
    const cleaned = display.trim().replace(/\./g, '').replace(',', '.');
    const n = parseFloat(cleaned);
    return isNaN(n) ? 0 : n;
  };

  const formatNumberToCurrencyBR = (n: number): string => {
    return new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
  };

  const handleCreateContrato = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = (window.crypto && 'randomUUID' in window.crypto) ? window.crypto.randomUUID() : String(Date.now());
    const numero = (novoContrato.numero && novoContrato.numero.trim()) || `CONT-${String(contratos.length + 1).padStart(3, '0')}`;
    const cliente = (novoContrato.cliente || '').trim() || 'Cliente';
    const valor = parseCurrencyBRToNumber(novoValorInput);
    const fimISO = (novoContrato.dataFim && novoContrato.dataFim) || '';
    const inicioISO = (novoContrato.dataInicio && novoContrato.dataInicio) || '';
    // valida documento obrigatório
    const doc = novoContrato.documento?.trim() || '';
    const digits = onlyDigits(doc);
    const ok = digits.length === 11 ? validateCPF(digits) : digits.length === 14 ? validateCNPJ(digits) : false;
    if (!ok) {
      alert('Informe um CPF ou CNPJ válido para o cliente (obrigatório).');
      return;
    }
    // Resolver ID/URL da assinatura se checkbox ativo e não houver seleção explícita
    let resolvedSignatureId: string | undefined = novoContrato.signatureId as string | undefined;
    let resolvedSignatureUrl: string | undefined = novoContrato.signatureUrl as string | undefined;
    if (novoUseSignature && !resolvedSignatureId && defaultSignaturePath) {
      try {
        const preview = await SignatureService.getSignatureByPath(defaultSignaturePath);
        resolvedSignatureId = preview.id;
        resolvedSignatureUrl = preview.url;
      } catch (err) {
        console.warn('Não foi possível resolver assinatura padrão (contrato novo):', err);
      }
    }

    // Persistir no Supabase
    try {
      const created = await ContractsService.create({
        numero,
        cliente,
        documento: doc,
        valor,
        dataInicio: inicioISO || undefined,
        dataFim: fimISO || undefined,
        status: (novoContrato.status as Contrato['status']) || 'ativo',
        tipo: novoContrato.tipo || 'Aluguel',
        descricao: novoContrato.descricao || '',
        signatureId: novoUseSignature ? resolvedSignatureId : undefined,
        issuerName: novoEmitirOutro ? ((novoContrato.issuerName || '').trim() || undefined) : undefined,
        issuerDocumento: novoEmitirOutro ? ((novoContrato.issuerDocumento || '').trim() || undefined) : undefined,
        recurrenceEnabled: !!novoContrato.recurrenceEnabled,
        recurrenceDay: (typeof novoContrato.recurrenceDay === 'number') ? Math.min(28, Math.max(1, novoContrato.recurrenceDay as number)) : undefined
      });
      const novo: Contrato = {
        id: created.id,
        numero: created.numero || numero,
        cliente: created.cliente || cliente,
        valor: Number(created.valor || valor),
        dataInicio: created.dataInicio || inicioISO,
        dataFim: created.dataFim || fimISO,
        status: (created.status as Contrato['status']) || ((novoContrato.status as Contrato['status']) || 'ativo'),
        tipo: created.tipo || (novoContrato.tipo || 'Aluguel'),
        descricao: created.descricao || (novoContrato.descricao || ''),
        documento: created.documento || doc,
        signatureId: created.signatureId || (novoUseSignature ? resolvedSignatureId : undefined),
        signatureUrl: novoUseSignature ? (resolvedSignatureUrl || defaultSignatureUrl || undefined) : undefined,
        objeto: novoObjeto || undefined,
        clausulas: novoClausulas.length ? novoClausulas : undefined,
        issuerName: created.issuerName || (novoEmitirOutro ? ((novoContrato.issuerName || '').trim() || undefined) : undefined),
        issuerDocumento: created.issuerDocumento || (novoEmitirOutro ? ((novoContrato.issuerDocumento || '').trim() || undefined) : undefined),
        recurrenceEnabled: !!created.recurrenceEnabled,
        recurrenceDay: created.recurrenceDay || ((typeof novoContrato.recurrenceDay === 'number') ? Math.min(28, Math.max(1, novoContrato.recurrenceDay as number)) : undefined)
      };
      setContratos(prev => [novo, ...prev]);
    } catch (err) {
      console.warn('Falha ao persistir contrato no Supabase. Mantendo local.', err);
      const novo: Contrato = {
        id,
        numero,
        cliente,
        valor,
        dataInicio: inicioISO,
        dataFim: fimISO,
        status: (novoContrato.status as Contrato['status']) || 'ativo',
        tipo: novoContrato.tipo || 'Aluguel',
        descricao: novoContrato.descricao || '',
        documento: doc,
        signatureId: novoUseSignature ? resolvedSignatureId : undefined,
        signatureUrl: novoUseSignature ? (resolvedSignatureUrl || defaultSignatureUrl || undefined) : undefined,
        objeto: novoObjeto || undefined,
        clausulas: novoClausulas.length ? novoClausulas : undefined,
        issuerName: novoEmitirOutro ? ((novoContrato.issuerName || '').trim() || undefined) : undefined,
        issuerDocumento: novoEmitirOutro ? ((novoContrato.issuerDocumento || '').trim() || undefined) : undefined,
        recurrenceEnabled: !!novoContrato.recurrenceEnabled,
        recurrenceDay: (typeof novoContrato.recurrenceDay === 'number') ? Math.min(28, Math.max(1, novoContrato.recurrenceDay as number)) : undefined
      };
      setContratos(prev => [novo, ...prev]);
    }
    setShowNovoContrato(false);
    setNovoContrato({ numero: '', cliente: '', valor: 0, dataInicio: '', dataFim: '', status: 'ativo', tipo: 'Aluguel', descricao: '', documento: '', signatureId: undefined, signatureUrl: undefined, recurrenceEnabled: false, recurrenceDay: undefined });
    setNovoValorInput('');
    setNovoObjeto('');
    setNovoClausulas([]);
    setNovoEmitirOutro(false);
  };

  const handleViewContrato = (contrato: Contrato) => {
    setContratoSelecionado(contrato);
    setShowViewContrato(true);
  };

  const handleEmitirRecibo = (contrato: Contrato) => {
    navigate('/recibos', {
      state: {
        prefillRecibo: {
          cliente: contrato.cliente,
          documento: contrato.documento,
          signatureUrl: contrato.signatureUrl,
          signatureId: contrato.signatureId,
          contractId: contrato.id,
          descricao: `Contrato ${contrato.numero}`,
          useLogo: true,
        }
      }
    });
  };

  const generatePrintableContratoHtml = (contrato: Contrato) => {
    const style = `
      <style>
        :root { --fg:#0f172a; --muted:#64748b; --border:#e2e8f0; --bg:#ffffff; }
        *{box-sizing:border-box} body{font-family:Georgia, 'Times New Roman', serif; margin:32px; background:var(--bg); color:var(--fg)}
        h1{font-size:22px; text-align:center; margin:0 0 12px; text-transform:uppercase; letter-spacing:.5px}
        .section{margin-top:18px}
        .label{color:var(--muted)}
        .field{display:flex; justify-content:space-between; gap:16px; border-bottom:1px dotted var(--border); padding:6px 0}
        .clause{margin-top:10px; line-height:1.6; text-align:justify}
        .signatures{display:flex; justify-content:space-between; margin-top:48px}
        .sig{width:48%; text-align:center}
        .sig .line{margin-top:56px; border-top:1px solid var(--border);}
        .meta{display:grid; grid-template-columns:1fr 1fr; gap:8px 16px}
        .signature-img{max-height:80px; object-fit:contain; margin-bottom:12px}
        @media print{ body{margin:16px} }
      </style>
    `;
    const inicio = contrato.dataInicio ? new Date(contrato.dataInicio).toLocaleDateString('pt-BR') : 'Não informado';
    const fim = contrato.dataFim ? new Date(contrato.dataFim).toLocaleDateString('pt-BR') : 'Não informado';
    return `
      <html>
        <head><meta charset="utf-8">${style}<title>Contrato ${contrato.numero}</title></head>
        <body>
          <h1>Contrato de Prestação de Serviços nº ${contrato.numero}</h1>
          <div class="section">
            <div class="meta">
              <div class="field"><span class="label">Contratante</span><span>${contrato.cliente}</span></div>
              <div class="field"><span class="label">Documento</span><span>${contrato.documento || 'Não informado'}</span></div>
              <div class="field"><span class="label">Tipo</span><span>${contrato.tipo}</span></div>
              <div class="field"><span class="label">Valor</span><span>R$ ${contrato.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span></div>
              <div class="field"><span class="label">Início</span><span>${inicio}</span></div>
              <div class="field"><span class="label">Término</span><span>${fim}</span></div>
              <div class="field"><span class="label">Status</span><span>${getStatusLabel(contrato.status)}</span></div>
              ${(contrato.issuerName || contrato.issuerDocumento) ? `<div class="field"><span class="label">Emitido por</span><span>${contrato.issuerName || ''}${contrato.issuerDocumento ? ' • ' + contrato.issuerDocumento : ''}</span></div>` : ''}
            </div>
          </div>
          <div class="section">
            <div class="label">Objeto do Contrato</div>
            <div class="clause">${(contrato.objeto || contrato.descricao || 'As partes acordam a prestação de serviços conforme especificações fornecidas pelo contratante.')}</div>
          </div>
          ${Array.isArray(contrato.clausulas) && contrato.clausulas.length ? `
          <div class="section">
            <div class="label">Cláusulas</div>
            ${contrato.clausulas.map((cl, idx) => `
              <div class="clause"><strong>${cl.titulo || `Cláusula ${idx+1}`}:</strong> ${cl.conteudo || ''}
              ${Array.isArray(cl.itens) && cl.itens.length ? `
                <div style="margin-left:16px; margin-top:6px">
                  ${cl.itens.map(it => `<div><strong>${it.label}:</strong> ${it.conteudo}</div>`).join('')}
                </div>
              `: ''}
              </div>
            `).join('')}
          </div>`: ''}
          <div class="signatures">
            <div class="sig">
              ${contrato.signatureUrl ? `<img class="signature-img" src="${contrato.signatureUrl}" alt="Assinatura" />` : ''}
              <div class="line"></div>
              <div class="label">Contratante</div>
            </div>
            <div class="sig">
              <div class="line"></div>
              <div class="label">Contratado</div>
            </div>
          </div>
          <script>window.onload = () => { window.print(); };</script>
        </body>
      </html>
    `;
  };

  const handleDownloadContrato = async (contrato: Contrato) => {
    const c: Contrato = { ...contrato };
    if (c.signatureId && !c.signatureUrl) {
      try {
        const preview = await SignatureService.getSignatureById(c.signatureId);
        c.signatureUrl = preview.url;
      } catch (err) {
        console.warn('Não foi possível resolver URL da assinatura por ID (contrato):', err);
      }
    }
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.open();
    win.document.write(generatePrintableContratoHtml(c));
    win.document.close();
  };

  const handleEditContratoOpen = (contrato: Contrato) => {
    setContratoSelecionado(contrato);
    setEditContrato({ ...contrato });
    setEditValorInput(formatNumberToCurrencyBR(contrato.valor));
    setShowEditContrato(true);
    setEditObjeto(contrato.objeto || '');
    setEditClausulas(contrato.clausulas ? JSON.parse(JSON.stringify(contrato.clausulas)) : []);
  };

  const handleEditContratoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contratoSelecionado) return;
    const novoValor = parseCurrencyBRToNumber(editValorInput);
    // Resolver assinatura padrão se checkbox ativo e sem seleção explícita
    let resolvedSignatureId: string | undefined = editContrato.signatureId ?? contratoSelecionado.signatureId;
    let resolvedSignatureUrl: string | undefined = editContrato.signatureUrl ?? contratoSelecionado.signatureUrl;
    if (editUseSignature && !resolvedSignatureId && defaultSignaturePath) {
      try {
        const preview = await SignatureService.getSignatureByPath(defaultSignaturePath);
        resolvedSignatureId = preview.id;
        resolvedSignatureUrl = preview.url;
      } catch (err) {
        console.warn('Não foi possível resolver assinatura padrão (contrato edição):', err);
      }
    }

    try {
      const updated = await ContractsService.update(contratoSelecionado.id, {
        numero: editContrato.numero || contratoSelecionado.numero,
        cliente: editContrato.cliente || contratoSelecionado.cliente,
        documento: editContrato.documento || contratoSelecionado.documento,
        valor: isNaN(novoValor) ? contratoSelecionado.valor : novoValor,
        dataInicio: editContrato.dataInicio || contratoSelecionado.dataInicio,
        dataFim: editContrato.dataFim || contratoSelecionado.dataFim,
        status: (editContrato.status as Contrato['status']) || contratoSelecionado.status,
        tipo: editContrato.tipo || contratoSelecionado.tipo,
        descricao: editContrato.descricao ?? contratoSelecionado.descricao,
        signatureId: editUseSignature ? (resolvedSignatureId ?? undefined) : undefined,
        issuerName: (editEmitirOutro || editContrato.issuerName || editContrato.issuerDocumento) ? (editContrato.issuerName || contratoSelecionado.issuerName) : undefined,
        issuerDocumento: (editEmitirOutro || editContrato.issuerName || editContrato.issuerDocumento) ? (editContrato.issuerDocumento || contratoSelecionado.issuerDocumento) : undefined,
        recurrenceEnabled: !!editContrato.recurrenceEnabled,
        recurrenceDay: (typeof editContrato.recurrenceDay === 'number') ? Math.min(28, Math.max(1, editContrato.recurrenceDay as number)) : contratoSelecionado.recurrenceDay
      });
      setContratos(prev => prev.map(c => c.id === contratoSelecionado.id ? {
        ...c,
        numero: updated.numero || c.numero,
        cliente: updated.cliente || c.cliente,
        valor: Number(updated.valor || c.valor),
        dataInicio: updated.dataInicio || c.dataInicio,
        dataFim: updated.dataFim || c.dataFim,
        status: (updated.status as Contrato['status']) || c.status,
        tipo: updated.tipo || c.tipo,
        descricao: updated.descricao ?? c.descricao,
        signatureId: updated.signatureId || (editUseSignature ? (resolvedSignatureId ?? undefined) : undefined),
        signatureUrl: editUseSignature ? (resolvedSignatureUrl ?? defaultSignatureUrl ?? undefined) : undefined,
        objeto: editObjeto || undefined,
        clausulas: editClausulas.length ? editClausulas : undefined,
        issuerName: updated.issuerName || ((editEmitirOutro || editContrato.issuerName || editContrato.issuerDocumento) ? (editContrato.issuerName || c.issuerName) : undefined),
        issuerDocumento: updated.issuerDocumento || ((editEmitirOutro || editContrato.issuerName || editContrato.issuerDocumento) ? (editContrato.issuerDocumento || c.issuerDocumento) : undefined),
        recurrenceEnabled: !!updated.recurrenceEnabled,
        recurrenceDay: updated.recurrenceDay || ((typeof editContrato.recurrenceDay === 'number') ? Math.min(28, Math.max(1, editContrato.recurrenceDay as number)) : c.recurrenceDay)
      } : c));
    } catch (err) {
      console.warn('Falha ao atualizar contrato no Supabase. Atualizando local.', err);
      setContratos(prev => prev.map(c => c.id === contratoSelecionado.id ? {
        ...c,
        numero: (editContrato.numero || c.numero)!,
        cliente: (editContrato.cliente || c.cliente)!,
        valor: isNaN(novoValor) ? c.valor : novoValor,
        dataInicio: (editContrato.dataInicio || c.dataInicio)!,
        dataFim: (editContrato.dataFim || c.dataFim)!,
        status: (editContrato.status as Contrato['status']) || c.status,
        tipo: editContrato.tipo || c.tipo,
        descricao: editContrato.descricao ?? c.descricao,
        signatureId: editUseSignature ? (resolvedSignatureId ?? undefined) : undefined,
        signatureUrl: editUseSignature ? (resolvedSignatureUrl ?? defaultSignatureUrl ?? undefined) : undefined,
        objeto: editObjeto || undefined,
        clausulas: editClausulas.length ? editClausulas : undefined,
        issuerName: (editEmitirOutro || editContrato.issuerName || editContrato.issuerDocumento) ? (editContrato.issuerName || c.issuerName) : undefined,
        issuerDocumento: (editEmitirOutro || editContrato.issuerName || editContrato.issuerDocumento) ? (editContrato.issuerDocumento || c.issuerDocumento) : undefined,
        recurrenceEnabled: !!editContrato.recurrenceEnabled,
        recurrenceDay: (typeof editContrato.recurrenceDay === 'number') ? Math.min(28, Math.max(1, editContrato.recurrenceDay as number)) : c.recurrenceDay
      } : c));
    }
    setShowEditContrato(false);
    setContratoSelecionado(null);
    setEditContrato({});
    setEditValorInput('');
    setEditObjeto('');
    setEditClausulas([]);
    setEditEmitirOutro(false);
  };

  const openDeleteContrato = (contrato: Contrato) => {
    setDeleteTargetContrato(contrato);
    setDeletePasswordContrato('');
    setDeleteErrorContrato(null);
    setShowDeleteContrato(true);
  };

  const confirmDeleteContrato = async () => {
    if (!deleteTargetContrato) return;
    setDeleteLoadingContrato(true);
    setDeleteErrorContrato(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const email = (user?.email || '').trim();
      if (!email) {
        setDeleteErrorContrato('Sessão inválida. Faça login novamente.');
        setDeleteLoadingContrato(false);
        return;
      }
      const { error: authErr } = await supabase.auth.signInWithPassword({ email, password: deletePasswordContrato });
      if (authErr) {
        setDeleteErrorContrato('Senha incorreta. Tente novamente.');
        setDeleteLoadingContrato(false);
        return;
      }
      // Remoção persistente
      try {
        await ContractsService.remove(deleteTargetContrato.id);
      } catch (e) {
        console.warn('Falha ao excluir contrato remotamente, removendo localmente.', e);
      }
      setContratos(prev => prev.filter(c => c.id !== deleteTargetContrato.id));
      setShowDeleteContrato(false);
      setDeleteTargetContrato(null);
      setDeletePasswordContrato('');
    } catch (err) {
      setDeleteErrorContrato('Erro inesperado ao confirmar exclusão.');
    } finally {
      setDeleteLoadingContrato(false);
    }
  };

  const cancelDeleteContrato = () => {
    setShowDeleteContrato(false);
    setDeleteTargetContrato(null);
    setDeletePasswordContrato('');
    setDeleteErrorContrato(null);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Contratos</h1>
          <p className="text-gray-600 mt-1">
            Gerencie seus contratos (aluguéis, prestação de serviços e outros)
          </p>
        </div>
        <button onClick={() => setShowNovoContrato(true)} className="mt-4 sm:mt-0 inline-flex items-center px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors w-auto self-start">
          <Plus className="w-4 h-4 mr-2" />
          Novo Contrato
        </button>
      </div>

      {showDeleteContrato && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-10">
          <div className="absolute inset-0 bg-black/40" onClick={cancelDeleteContrato} />
          <div className="relative bg-white rounded-lg shadow-lg w-full max-w-md p-6 max-h-[85vh] overflow-y-auto">
            <button className="absolute top-3 right-3 text-gray-500 hover:text-gray-700" onClick={cancelDeleteContrato} aria-label="Fechar">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Confirmar exclusão</h3>
            <p className="text-sm text-gray-600 mb-3">
              Esta ação é irreversível. Para excluir o contrato <strong>{deleteTargetContrato?.numero}</strong>, confirme sua senha.
            </p>
            <input
              type="password"
              placeholder="Sua senha"
              value={deletePasswordContrato}
              onChange={(e) => setDeletePasswordContrato(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-2"
            />
            {deleteErrorContrato && <div className="text-sm text-red-600 mb-2">{deleteErrorContrato}</div>}
            <div className="flex justify-end gap-2">
              <button onClick={cancelDeleteContrato} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50" disabled={deleteLoadingContrato}>Cancelar</button>
              <button onClick={confirmDeleteContrato} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50" disabled={deleteLoadingContrato || !deletePasswordContrato}>
                {deleteLoadingContrato ? 'Excluindo...' : 'Excluir definitivamente'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-full">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Valor Total</p>
              <p className="text-2xl font-bold text-gray-900">
                R$ {totalContratos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-full">
              <Users className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Contratos Ativos</p>
              <p className="text-2xl font-bold text-gray-900">
                {contratosAtivos}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-full">
              <Calendar className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total</p>
              <p className="text-2xl font-bold text-gray-900">
                {filteredContratos.length}
              </p>
            </div>
          </div>
        </div>
      </div>
      

      {/* Modal: Novo Contrato */}
      {showNovoContrato && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-10">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowNovoContrato(false)} />
          <div className="relative bg-white rounded-lg shadow-lg w-full max-w-md p-6 max-h-[85vh] overflow-y-auto">
            <button className="absolute top-3 right-3 text-gray-500 hover:text-gray-700" onClick={() => setShowNovoContrato(false)} aria-label="Fechar">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Novo Contrato</h3>
            <form className="space-y-4" onSubmit={handleCreateContrato}>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Número</label>
                <input value={novoContrato.numero || ''} onChange={(e) => setNovoContrato(prev => ({ ...prev, numero: e.target.value }))} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="CONT-001" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
                <input value={novoContrato.cliente || ''} onChange={(e) => setNovoContrato(prev => ({ ...prev, cliente: e.target.value }))} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Nome do cliente" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">CPF/CNPJ do Cliente (obrigatório)</label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="000.000.000-00 ou 00.000.000/0000-00"
                  value={novoContrato.documento || ''}
                  onChange={(e) => {
                    const d = onlyDigits(e.target.value);
                    const formatted = d.length <= 11 ? formatCPF(d) : formatCNPJ(d);
                    setNovoContrato(prev => ({ ...prev, documento: formatted }));
                  }}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Valor (R$)</label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="Ex: 1.234,56"
                  value={novoValorInput}
                  onChange={(e) => setNovoValorInput(formatCurrencyDigitsToBR(e.target.value))}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Início</label>
                  <input type="date" value={novoContrato.dataInicio || ''} onChange={(e) => setNovoContrato(prev => ({ ...prev, dataInicio: e.target.value }))} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Término</label>
                  <input type="date" value={novoContrato.dataFim || ''} onChange={(e) => setNovoContrato(prev => ({ ...prev, dataFim: e.target.value }))} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                </div>
              </div>
              {/* Recorrência */}
              <div className="border rounded-lg p-3 space-y-2">
                <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    className="h-4 w-4"
                    checked={!!novoContrato.recurrenceEnabled}
                    onChange={(e) => setNovoContrato(prev => ({ ...prev, recurrenceEnabled: e.target.checked }))}
                  />
                  Recebimento recorrente
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Dia do recebimento (1–28)</label>
                    <input
                      type="number"
                      min={1}
                      max={28}
                      value={Number.isFinite(Number(novoContrato.recurrenceDay)) ? (novoContrato.recurrenceDay as number) : ''}
                      onChange={(e) => {
                        const n = parseInt(e.target.value || '0', 10);
                        setNovoContrato(prev => ({ ...prev, recurrenceDay: isNaN(n) ? undefined : Math.min(28, Math.max(1, n)) }));
                      }}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={!novoContrato.recurrenceEnabled}
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-500">Quando ativo, geraremos automaticamente um recibo 10 dias antes do dia informado.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Assinatura</label>
                <div className="flex items-center gap-3">
                  <input
                    id="contrato-use-signature"
                    type="checkbox"
                    checked={novoUseSignature}
                    onChange={(e) => {
                      setNovoUseSignature(e.target.checked);
                      if (!e.target.checked) {
                        setNovoContrato(prev => ({ ...prev, signatureUrl: undefined }));
                      }
                    }}
                    className="h-4 w-4"
                  />
                  <label htmlFor="contrato-use-signature" className="text-sm text-gray-700">Usar sua assinatura</label>
                  {signatureOptions.length > 0 ? (
                    <>
                      <select
                        value={novoContrato.signatureId || ''}
                        onChange={(e) => {
                          const id = e.target.value;
                          if (id === '__create_sig__') { navigate('/assinaturas'); return; }
                          const opt = signatureOptions.find(o => o.id === id);
                          setNovoContrato(prev => ({ ...prev, signatureId: id || undefined, signatureUrl: opt?.url }));
                        }}
                        className="px-3 py-2 border rounded-lg text-sm w-full max-w-xs"
                        disabled={!novoUseSignature}
                      >
                        <option value="">Selecione</option>
                        {signatureOptions.map(opt => (
                          <option key={opt.id} value={opt.id}>{opt.name}</option>
                        ))}
                        <option value="__create_sig__">Cadastrar Nova Assinatura</option>
                      </select>
                      {novoUseSignature && (novoContrato.signatureUrl || defaultSignatureUrl) && (
                        <img src={(novoContrato.signatureUrl || defaultSignatureUrl) as string} alt="Assinatura" className="h-10 object-contain border rounded bg-white px-2" />
                      )}
                    </>
                  ) : (
                    <select
                      value={''}
                      onChange={(e) => { if (e.target.value === '__create_sig__') navigate('/assinaturas'); }}
                      className="px-3 py-2 border rounded-lg text-sm w-full max-w-xs"
                      disabled={!novoUseSignature}
                    >
                      <option value="">Selecione</option>
                      <option value="__create_sig__">Cadastrar Nova Assinatura</option>
                    </select>
                  )}
                </div>
              </div>
              {/* Objetivo do contrato */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Objetivo do contrato</label>
                <textarea value={novoObjeto} onChange={(e) => setNovoObjeto(e.target.value)} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" rows={3} placeholder="Descreva o objeto do contrato" />
              </div>
              {/* Cláusulas dinâmicas */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium text-gray-700">Cláusulas</label>
                  <button type="button" onClick={() => setNovoClausulas(prev => [...prev, { id: crypto.randomUUID(), titulo: `Cláusula ${prev.length+1}`, conteudo: '', itens: [] }])} className="text-xs px-2 py-1 border rounded hover:bg-gray-50">Adicionar cláusula</button>
                </div>
                <div className="space-y-3">
                  {novoClausulas.map((cl, idx) => (
                    <div key={cl.id} className="border rounded p-2">
                      <div className="grid grid-cols-1 gap-2">
                        <input value={cl.titulo} onChange={(e) => setNovoClausulas(prev => prev.map(c => c.id===cl.id? { ...c, titulo: e.target.value }: c))} className="px-2 py-1 border rounded text-sm" placeholder={`Cláusula ${idx+1}`} />
                        <textarea value={cl.conteudo} onChange={(e) => setNovoClausulas(prev => prev.map(c => c.id===cl.id? { ...c, conteudo: e.target.value }: c))} className="px-2 py-1 border rounded text-sm" rows={2} placeholder="Conteúdo da cláusula" />
                        <div className="flex justify-end">
                          <button type="button" className="text-xs text-red-600 hover:underline" onClick={() => setNovoClausulas(prev => prev.filter(c => c.id !== cl.id))}>Remover cláusula</button>
                        </div>
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-gray-600">Subitens</span>
                            <button type="button" className="text-xs px-2 py-1 border rounded hover:bg-gray-50" onClick={() => setNovoClausulas(prev => prev.map(c => c.id===cl.id? { ...c, itens: [...(c.itens||[]), { id: crypto.randomUUID(), label: `${idx+1}.${(c.itens?.length||0)+1}`, conteudo: '' }] }: c))}>Adicionar subitem</button>
                          </div>
                          <div className="space-y-1">
                            {(cl.itens || []).map((it, jdx) => (
                              <div key={it.id} className="grid grid-cols-5 gap-2 items-center">
                                <input value={it.label} onChange={(e) => setNovoClausulas(prev => prev.map(c => c.id===cl.id? { ...c, itens: (c.itens||[]).map(x => x.id===it.id? { ...x, label: e.target.value }: x) }: c))} className="px-2 py-1 border rounded text-sm col-span-1" placeholder={`${idx+1}.${jdx+1}`} />
                                <input value={it.conteudo} onChange={(e) => setNovoClausulas(prev => prev.map(c => c.id===cl.id? { ...c, itens: (c.itens||[]).map(x => x.id===it.id? { ...x, conteudo: e.target.value }: x) }: c))} className="px-2 py-1 border rounded text-sm col-span-3" placeholder="Conteúdo do subitem" />
                                <button type="button" className="text-xs text-red-600 hover:underline col-span-1" onClick={() => setNovoClausulas(prev => prev.map(c => c.id===cl.id? { ...c, itens: (c.itens||[]).filter(x => x.id !== it.id) }: c))}>Remover</button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select value={novoContrato.status || 'ativo'} onChange={(e) => setNovoContrato(prev => ({ ...prev, status: e.target.value as Contrato['status'] }))} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    <option value="ativo">Ativo</option>
                    <option value="inativo">Inativo</option>
                    <option value="vencido">Vencido</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                  <select value={novoContrato.tipo || 'Aluguel'} onChange={(e) => setNovoContrato(prev => ({ ...prev, tipo: e.target.value }))} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    <option value="Aluguel">Aluguel</option>
                    <option value="Prestação de serviços">Prestação de serviços</option>
                    <option value="Consultoria">Consultoria</option>
                    <option value="Outros">Outros</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                <textarea value={novoContrato.descricao || ''} onChange={(e) => setNovoContrato(prev => ({ ...prev, descricao: e.target.value }))} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" rows={3} />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowNovoContrato(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Criar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Visualizar Contrato */}
      {showViewContrato && contratoSelecionado && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-10">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowViewContrato(false)} />
          <div className="relative bg-white rounded-lg shadow-lg w-full max-w-md p-6 max-h-[85vh] overflow-y-auto">
            <button className="absolute top-3 right-3 text-gray-500 hover:text-gray-700" onClick={() => setShowViewContrato(false)} aria-label="Fechar">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{contratoSelecionado.numero}</h3>
            <div className="space-y-2 text-sm text-gray-700">
              <div className="flex justify-between"><span className="text-gray-500">Cliente</span><span className="font-medium">{contratoSelecionado.cliente}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Valor</span><span className="font-medium">R$ {contratoSelecionado.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Período</span><span>{contratoSelecionado.dataInicio ? new Date(contratoSelecionado.dataInicio).toLocaleDateString('pt-BR') : 'Não informado'} — {contratoSelecionado.dataFim ? new Date(contratoSelecionado.dataFim).toLocaleDateString('pt-BR') : 'Não informado'}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Status</span><span className={cn('inline-flex px-2 py-1 text-xs font-semibold rounded-full', getStatusColor(contratoSelecionado.status))}>{getStatusLabel(contratoSelecionado.status)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Tipo</span><span>{contratoSelecionado.tipo}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Documento</span><span>{contratoSelecionado.documento || 'Não informado'}</span></div>
              {contratoSelecionado.signatureUrl && (
                <div className="pt-2">
                  <div className="text-gray-500">Assinatura</div>
                  <img src={contratoSelecionado.signatureUrl} alt="Assinatura" className="mt-1 h-12 object-contain border rounded bg-white px-2" />
                </div>
              )}
              {contratoSelecionado.descricao && (
                <div>
                  <div className="text-gray-500">Descrição</div>
                  <div className="mt-1">{contratoSelecionado.descricao}</div>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => handleDownloadContrato(contratoSelecionado)} className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Imprimir/Salvar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Editar Contrato */}
      {showEditContrato && contratoSelecionado && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-10">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowEditContrato(false)} />
          <div className="relative bg-white rounded-lg shadow-lg w-full max-w-md p-6 max-h-[85vh] overflow-y-auto">
            <button className="absolute top-3 right-3 text-gray-500 hover:text-gray-700" onClick={() => setShowEditContrato(false)} aria-label="Fechar">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Editar Contrato</h3>
            <form className="space-y-4" onSubmit={handleEditContratoSubmit}>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Número</label>
                <input value={editContrato.numero || ''} onChange={(e) => setEditContrato(prev => ({ ...prev, numero: e.target.value }))} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
                <input value={editContrato.cliente || ''} onChange={(e) => setEditContrato(prev => ({ ...prev, cliente: e.target.value }))} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">CPF/CNPJ do Cliente</label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="000.000.000-00 ou 00.000.000/0000-00"
                  value={editContrato.documento || ''}
                  onChange={(e) => {
                    const d = onlyDigits(e.target.value);
                    const formatted = d.length <= 11 ? formatCPF(d) : formatCNPJ(d);
                    setEditContrato(prev => ({ ...prev, documento: formatted }));
                  }}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Valor (R$)</label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="Ex: 1.234,56"
                  value={editValorInput}
                  onChange={(e) => setEditValorInput(formatCurrencyDigitsToBR(e.target.value))}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Início</label>
                  <input type="date" value={editContrato.dataInicio || ''} onChange={(e) => setEditContrato(prev => ({ ...prev, dataInicio: e.target.value }))} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Término</label>
                  <input type="date" value={editContrato.dataFim || ''} onChange={(e) => setEditContrato(prev => ({ ...prev, dataFim: e.target.value }))} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                </div>
              </div>
              {/* Recorrência (edição) */}
              <div className="border rounded-lg p-3 space-y-2">
                <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    className="h-4 w-4"
                    checked={!!editContrato.recurrenceEnabled}
                    onChange={(e) => setEditContrato(prev => ({ ...prev, recurrenceEnabled: e.target.checked }))}
                  />
                  Recebimento recorrente
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Dia do recebimento (1–28)</label>
                    <input
                      type="number"
                      min={1}
                      max={28}
                      value={Number.isFinite(Number(editContrato.recurrenceDay)) ? (editContrato.recurrenceDay as number) : ''}
                      onChange={(e) => {
                        const n = parseInt(e.target.value || '0', 10);
                        setEditContrato(prev => ({ ...prev, recurrenceDay: isNaN(n) ? undefined : Math.min(28, Math.max(1, n)) }));
                      }}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={!editContrato.recurrenceEnabled}
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-500">Geraremos automaticamente um recibo 10 dias antes do dia informado (quando ativo).</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Assinatura</label>
                <div className="flex items-center gap-3">
                  <input
                    id="contrato-edit-use-signature"
                    type="checkbox"
                    checked={editUseSignature}
                    onChange={(e) => {
                      setEditUseSignature(e.target.checked);
                      if (!e.target.checked) setEditContrato(prev => ({ ...prev, signatureUrl: undefined }));
                    }}
                    className="h-4 w-4"
                  />
                  <label htmlFor="contrato-edit-use-signature" className="text-sm text-gray-700">Usar sua assinatura</label>
                  <select
                    value={editContrato.signatureId || ''}
                    onChange={(e) => {
                      const id = e.target.value;
                      const opt = signatureOptions.find(o => o.id === id);
                      setEditContrato(prev => ({ ...prev, signatureId: id || undefined, signatureUrl: opt?.url }));
                    }}
                    className="px-3 py-2 border rounded-lg text-sm"
                    disabled={!editUseSignature || signatureOptions.length === 0}
                  >
                    <option value="">Padrão da conta (assinatura)</option>
                    {signatureOptions.map(opt => (
                      <option key={opt.id} value={opt.id}>{opt.name}</option>
                    ))}
                  </select>
                  {editUseSignature && (editContrato.signatureUrl ? (
                    <img src={editContrato.signatureUrl as string} alt="Assinatura" className="h-10 object-contain border rounded bg-white px-2" />
                  ) : defaultSignatureUrl ? (
                    <img src={defaultSignatureUrl} alt="Assinatura padrão" className="h-10 object-contain border rounded bg-white px-2" />
                  ) : (
                    <span className="text-xs text-gray-500">Nenhuma assinatura cadastrada. Cadastre em Perfil.</span>
                  ))}
                </div>
              </div>
              {/* Objetivo do contrato (edição) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Objetivo do contrato</label>
                <textarea value={editObjeto} onChange={(e) => setEditObjeto(e.target.value)} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" rows={3} placeholder="Descreva o objeto do contrato" />
              </div>
              {/* Cláusulas dinâmicas (edição) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium text-gray-700">Cláusulas</label>
                  <button type="button" onClick={() => setEditClausulas(prev => [...prev, { id: crypto.randomUUID(), titulo: `Cláusula ${prev.length+1}`, conteudo: '', itens: [] }])} className="text-xs px-2 py-1 border rounded hover:bg-gray-50">Adicionar cláusula</button>
                </div>
                <div className="space-y-3">
                  {editClausulas.map((cl, idx) => (
                    <div key={cl.id} className="border rounded p-2">
                      <div className="grid grid-cols-1 gap-2">
                        <input value={cl.titulo} onChange={(e) => setEditClausulas(prev => prev.map(c => c.id===cl.id? { ...c, titulo: e.target.value }: c))} className="px-2 py-1 border rounded text-sm" placeholder={`Cláusula ${idx+1}`} />
                        <textarea value={cl.conteudo} onChange={(e) => setEditClausulas(prev => prev.map(c => c.id===cl.id? { ...c, conteudo: e.target.value }: c))} className="px-2 py-1 border rounded text-sm" rows={2} placeholder="Conteúdo da cláusula" />
                        <div className="flex justify-end">
                          <button type="button" className="text-xs text-red-600 hover:underline" onClick={() => setEditClausulas(prev => prev.filter(c => c.id !== cl.id))}>Remover cláusula</button>
                        </div>
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-gray-600">Subitens</span>
                            <button type="button" className="text-xs px-2 py-1 border rounded hover:bg-gray-50" onClick={() => setEditClausulas(prev => prev.map(c => c.id===cl.id? { ...c, itens: [...(c.itens||[]), { id: crypto.randomUUID(), label: `${idx+1}.${(c.itens?.length||0)+1}`, conteudo: '' }] }: c))}>Adicionar subitem</button>
                          </div>
                          <div className="space-y-1">
                            {(cl.itens || []).map((it, jdx) => (
                              <div key={it.id} className="grid grid-cols-5 gap-2 items-center">
                                <input value={it.label} onChange={(e) => setEditClausulas(prev => prev.map(c => c.id===cl.id? { ...c, itens: (c.itens||[]).map(x => x.id===it.id? { ...x, label: e.target.value }: x) }: c))} className="px-2 py-1 border rounded text-sm col-span-1" placeholder={`${idx+1}.${jdx+1}`} />
                                <input value={it.conteudo} onChange={(e) => setEditClausulas(prev => prev.map(c => c.id===cl.id? { ...c, itens: (c.itens||[]).map(x => x.id===it.id? { ...x, conteudo: e.target.value }: x) }: c))} className="px-2 py-1 border rounded text-sm col-span-3" placeholder="Conteúdo do subitem" />
                                <button type="button" className="text-xs text-red-600 hover:underline col-span-1" onClick={() => setEditClausulas(prev => prev.map(c => c.id===cl.id? { ...c, itens: (c.itens||[]).filter(x => x.id !== it.id) }: c))}>Remover</button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select value={editContrato.status || 'ativo'} onChange={(e) => setEditContrato(prev => ({ ...prev, status: e.target.value as Contrato['status'] }))} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    <option value="ativo">Ativo</option>
                    <option value="inativo">Inativo</option>
                    <option value="vencido">Vencido</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                  <select value={editContrato.tipo || 'Aluguel'} onChange={(e) => setEditContrato(prev => ({ ...prev, tipo: e.target.value }))} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    <option value="Aluguel">Aluguel</option>
                    <option value="Prestação de serviços">Prestação de serviços</option>
                    <option value="Consultoria">Consultoria</option>
                    <option value="Outros">Outros</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                <textarea value={editContrato.descricao || ''} onChange={(e) => setEditContrato(prev => ({ ...prev, descricao: e.target.value }))} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" rows={3} />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowEditContrato(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Buscar por cliente, número ou tipo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <div className="relative w-full sm:w-auto">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full appearance-none pl-3 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="todos">Todos os Status</option>
                <option value="ativo">Ativo</option>
                <option value="inativo">Inativo</option>
                <option value="vencido">Vencido</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Lista responsiva (mobile) */}
      <div className="md:hidden space-y-3">
        {filteredContratos.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border p-6 text-center">
            <div className="text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-4" />
              <p className="text-lg font-medium">Nenhum contrato encontrado</p>
              <p className="text-sm">Tente ajustar os filtros ou criar um novo contrato.</p>
            </div>
          </div>
        ) : (
          filteredContratos.map((contrato) => (
            <details key={contrato.id} className="bg-white rounded-lg shadow-sm border">
              <summary className="list-none cursor-pointer p-4 flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{contrato.numero}</p>
                  <p className="text-sm text-gray-500 truncate">{contrato.cliente}</p>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-sm font-semibold text-gray-900">R$ {contrato.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                  <span className={cn('inline-flex px-2 py-1 text-xs font-semibold rounded-full', getStatusColor(contrato.status))}>
                    {getStatusLabel(contrato.status)}
                  </span>
                </div>
              </summary>
              <div className="px-4 pt-2 pb-4 border-t text-sm text-gray-700 space-y-2">
                <div className="flex justify-between gap-3"><span className="text-gray-500">Período</span><span>{new Date(contrato.dataInicio).toLocaleDateString('pt-BR')} — {new Date(contrato.dataFim).toLocaleDateString('pt-BR')}</span></div>
                <div className="flex justify-between gap-3"><span className="text-gray-500">Tipo</span><span>{contrato.tipo}</span></div>
                {contrato.descricao && (
                  <div className="flex justify-between gap-3"><span className="text-gray-500">Descrição</span><span className="text-right truncate">{contrato.descricao}</span></div>
                )}
                <div className="pt-2 flex items-center justify-end gap-2">
                  <button onClick={() => handleViewContrato(contrato)} className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50" title="Visualizar">
                    <Eye className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleEmitirRecibo(contrato)} className="text-purple-600 hover:text-purple-900 p-1 rounded hover:bg-purple-50" title="Emitir Recibo">
                    <FileText className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDownloadContrato(contrato)} className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50" title="Download">
                    <Download className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleEditContratoOpen(contrato)} className="text-gray-600 hover:text-gray-900 p-1 rounded hover:bg-gray-50" title="Editar">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button onClick={() => openDeleteContrato(contrato)} className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50" title="Excluir">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </details>
          ))
        )}
      </div>

      {/* Tabela (desktop) */}
      <div className="hidden md:block bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Número
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Valor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Período
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredContratos.map((contrato) => (
                <tr key={contrato.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {contrato.numero}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {contrato.cliente}
                      </div>
                      <div className="text-sm text-gray-500 truncate max-w-xs">
                        {contrato.descricao}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {contrato.tipo}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    R$ {contrato.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div>
                      <div>{new Date(contrato.dataInicio).toLocaleDateString('pt-BR')}</div>
                      <div className="text-xs">até {new Date(contrato.dataFim).toLocaleDateString('pt-BR')}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={cn(
                      'inline-flex px-2 py-1 text-xs font-semibold rounded-full',
                      getStatusColor(contrato.status)
                    )}>
                      {getStatusLabel(contrato.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button onClick={() => handleViewContrato(contrato)} className="text-blue-600 hover:text-blue-900" title="Visualizar">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleEmitirRecibo(contrato)} className="text-purple-600 hover:text-purple-900" title="Emitir Recibo">
                        <FileText className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDownloadContrato(contrato)} className="text-green-600 hover:text-green-900" title="Download">
                        <Download className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleEditContratoOpen(contrato)} className="text-gray-600 hover:text-gray-900" title="Editar">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => openDeleteContrato(contrato)} className="text-red-600 hover:text-red-900" title="Excluir">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredContratos.length === 0 && (
        <div className="hidden md:block text-center py-12">
          <div className="text-gray-500">
            <FileText className="w-12 h-12 mx-auto mb-4" />
            <p className="text-lg font-medium">Nenhum contrato encontrado</p>
            <p className="text-sm">Tente ajustar os filtros ou criar um novo contrato.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Contratos;