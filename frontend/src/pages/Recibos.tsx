// Autor: David Assef
// Descrição: Página de gerenciamento de recibos
// Data: 11-09-2025
// MIT License

import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  Filter, 
  CreditCard,
  Calendar,
  FileText,
  Eye,
  Edit,
  Trash2,
  Download,
  Send,
  X,
  ChevronDown,
  CheckCircle,
  PauseCircle,
  Ban
} from 'lucide-react';
import { cn } from '../lib/utils';
import { supabase } from '../lib/supabase';
import { SignatureService } from '../services/signatureService';
import { receiptsApi } from '../services';
import { ReceiptService as SupaReceiptService } from '../services/receiptService';
import { ReceiptsMinimalService } from '../services/receiptsSupabaseService';
import { generateRecurringReceipts } from '../utils/recibos';

interface Recibo {
  id: string;
  numero: string;
  cliente: string;
  valor: number;
  dataEmissao: string;
  status: 'emitido' | 'enviado' | 'pago' | 'vencido' | 'suspenso' | 'revogado';
  descricao: string;
  formaPagamento?: string;
  useLogo?: boolean;
  logoDataUrl?: string; // Logo personalizada por recibo (base64/dataURL)
  cpf?: string; // CPF do cliente (opcional)
  signatureId?: string; // ID da assinatura selecionada (persistência)
  signatureDataUrl?: string; // Assinatura anexada (base64/dataURL)
  contractId?: string; // vínculo opcional com contrato para automação
  issuerName?: string; // Emitir em nome de
  issuerDocumento?: string; // Documento do emissor alternativo
}

// Lista será carregada do backend

const getStatusColor = (status: Recibo['status']) => {
  switch (status) {
    case 'pago':
      return 'bg-green-100 text-green-800';
    case 'enviado':
      return 'bg-blue-100 text-blue-800';
    case 'emitido':
      return 'bg-yellow-100 text-yellow-800';
    case 'vencido':
      return 'bg-red-100 text-red-800';
    case 'suspenso':
      return 'bg-orange-100 text-orange-800';
    case 'revogado':
      return 'bg-gray-200 text-gray-700';
    default:
      return 'bg-gray-100 text-gray-800';
  }
  };

  // Helper simples para detectar UUIDs
  const isUUID = (v: string | undefined | null) => !!v && /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/.test(v);

const getStatusLabel = (status: Recibo['status']) => {
  switch (status) {
    case 'pago':
      return 'Pago';
    case 'enviado':
      return 'Enviado';
    case 'emitido':
      return 'Emitido';
    case 'vencido':
      return 'Vencido';
    case 'suspenso':
      return 'Suspenso';
    case 'revogado':
      return 'Revogado';
    default:
      return status;
  }
};

const Recibos: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [recibos, setRecibos] = useState<Recibo[]>([]);
  const [loadedLocal, setLoadedLocal] = useState(false);

  // Persistência local simples
  useEffect(() => {
    try {
      const saved = localStorage.getItem('recibos');
      if (saved) setRecibos(JSON.parse(saved));
    } catch {}
    setLoadedLocal(true);
  }, []);

  // Geração automática de recibos recorrentes (local) a partir de contratos
  useEffect(() => {
    try {
      const rawContracts = localStorage.getItem('contratos');
      if (!rawContracts) return;
      const contratos: any[] = JSON.parse(rawContracts);
      if (!Array.isArray(contratos) || contratos.length === 0) return;

      // Usa recibos já persistidos como base para evitar duplicatas em recarregamentos
      const rawExisting = localStorage.getItem('recibos');
      const existing: Recibo[] = rawExisting ? JSON.parse(rawExisting) : recibos;

      const toCreate = generateRecurringReceipts(new Date(), contratos, existing);
      if (toCreate.length > 0) {
        setRecibos(prev => {
          const byId = new Map(prev.map(p => [p.id, p]));
          for (const n of toCreate) byId.set(n.id, n);
          return Array.from(byId.values()).sort((a,b) => (b.dataEmissao || '').localeCompare(a.dataEmissao || ''));
        });
      }
    } catch (e) {
      console.warn('Falha ao processar recorrência local de contratos:', e);
    }
    // executa apenas na montagem
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('recibos', JSON.stringify(recibos));
    } catch {}
  }, [recibos]);
  const [showNovoRecibo, setShowNovoRecibo] = useState(false);
  const [novoRecibo, setNovoRecibo] = useState<Partial<Recibo>>({
    numero: '',
    cliente: '',
    valor: 0,
    dataEmissao: '',
    status: 'emitido',
    descricao: '',
    formaPagamento: 'PIX'
  });
  const [showViewRecibo, setShowViewRecibo] = useState(false);
  const [reciboSelecionado, setReciboSelecionado] = useState<Recibo | null>(null);
  const [showEditRecibo, setShowEditRecibo] = useState(false);
  const [editRecibo, setEditRecibo] = useState<Partial<Recibo>>({});
  const [defaultLogoUrl, setDefaultLogoUrl] = useState<string | null>(null);
  const [defaultSignatureUrl, setDefaultSignatureUrl] = useState<string | null>(null);
  const [defaultSignaturePath, setDefaultSignaturePath] = useState<string | null>(null);
  const [currentUserName, setCurrentUserName] = useState<string>('');
  // Opções armazenadas do usuário
  const [logoOptions, setLogoOptions] = useState<Array<{ path: string; url: string; name: string }>>([]);
  const [signatureOptions, setSignatureOptions] = useState<Array<{ id: string; url: string; name: string }>>([]);
  const [printWithLogo, setPrintWithLogo] = useState<boolean>(false);
  const [novoValorInput, setNovoValorInput] = useState<string>('');
  const [editValorInput, setEditValorInput] = useState<string>('');
  const location = useLocation() as any;
  const navigate = useNavigate();
  // Controle explícito de inclusão de assinatura (checkbox)
  const [novoUseSignature, setNovoUseSignature] = useState<boolean>(false);
  const [editUseSignature, setEditUseSignature] = useState<boolean>(false);
  // Controle de "Emitir em nome de outra pessoa"
  const [novoEmitirOutro, setNovoEmitirOutro] = useState<boolean>(false);
  const [editEmitirOutro, setEditEmitirOutro] = useState<boolean>(false);
  // Assinatura por touch (canvas)
  const [showSignCanvas, setShowSignCanvas] = useState<false | 'novo' | 'edit'>(false);
  const [canvasKey, setCanvasKey] = useState<number>(0);

  // Inicialização do canvas de assinatura quando o modal está aberto
  useEffect(() => {
    if (!showSignCanvas) return;
    const canvas = document.getElementById('signature-canvas') as HTMLCanvasElement | null;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let drawing = false;
    const DPR = window.devicePixelRatio || 1;
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * DPR;
      canvas.height = rect.height * DPR;
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.strokeStyle = '#111827';
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, rect.width, rect.height);
    };
    resize();
    const start = (x: number, y: number) => { drawing = true; ctx.beginPath(); ctx.moveTo(x, y); };
    const move = (x: number, y: number) => { if (!drawing) return; ctx.lineTo(x, y); ctx.stroke(); };
    const end = () => { drawing = false; };
    const getPos = (e: MouseEvent | TouchEvent) => {
      const rect = canvas.getBoundingClientRect();
      if ('touches' in e) {
        const t = e.touches[0] || (e as any).changedTouches?.[0];
        return { x: t.clientX - rect.left, y: t.clientY - rect.top };
      }
      const m = e as MouseEvent;
      return { x: m.clientX - rect.left, y: m.clientY - rect.top };
    };
    const onDown = (e: any) => { e.preventDefault(); const p = getPos(e); start(p.x, p.y); };
    const onMove = (e: any) => { e.preventDefault(); const p = getPos(e); move(p.x, p.y); };
    const onUp = (e: any) => { e.preventDefault(); end(); };
    window.addEventListener('resize', resize);
    canvas.addEventListener('mousedown', onDown);
    canvas.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    canvas.addEventListener('touchstart', onDown, { passive: false } as any);
    canvas.addEventListener('touchmove', onMove, { passive: false } as any);
    window.addEventListener('touchend', onUp, { passive: false } as any);
    return () => {
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('mousedown', onDown);
      canvas.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      canvas.removeEventListener('touchstart', onDown as any);
      canvas.removeEventListener('touchmove', onMove as any);
      window.removeEventListener('touchend', onUp as any);
    };
  }, [showSignCanvas, canvasKey]);

  // Exclusão segura com confirmação de senha
  const [showDeleteRecibo, setShowDeleteRecibo] = useState(false);
  const [deleteTargetRecibo, setDeleteTargetRecibo] = useState<Recibo | null>(null);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  // Tombstones de exclusão para persistir removidos mesmo com merge remoto
  const [deletedIds, setDeletedIds] = useState<string[]>([]);
  useEffect(() => {
    try {
      const raw = localStorage.getItem('deleted_receipts');
      if (raw) setDeletedIds(JSON.parse(raw));
    } catch {}
  }, []);

  const filteredRecibos = recibos.filter(recibo => {
    const matchesSearch = recibo.cliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         recibo.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         recibo.descricao.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'todos' || recibo.status === statusFilter;
    return matchesSearch && matchesStatus && !deletedIds.includes(recibo.id);
  });

  const totalRecibos = filteredRecibos.reduce((sum, recibo) => sum + recibo.valor, 0);
  const recibosPagos = filteredRecibos.filter(r => r.status === 'pago').length;

  // Helpers de moeda (pt-BR)
  const formatCurrencyDigitsToBR = (value: string): string => {
    const digits = value.replace(/\D/g, '');
    if (!digits) return '';
    const number = (parseInt(digits, 10) / 100).toFixed(2);
    const [intPart, decPart] = number.split('.');
    const intFormatted = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return `${intFormatted},${decPart}`;
  };

  // Valor por extenso (pt-BR) simplificado para dinheiro
  const numeroPorExtensoBRL = (valor: number): string => {
    const unidades = ['', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove'];
    const especiais = ['dez', 'onze', 'doze', 'treze', 'quatorze', 'quinze', 'dezesseis', 'dezessete', 'dezoito', 'dezenove'];
    const dezenas = ['', '', 'vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta', 'setenta', 'oitenta', 'noventa'];
    const centenas = ['', 'cem', 'cento', 'duzentos', 'trezentos', 'quatrocentos', 'quinhentos', 'seiscentos', 'setecentos', 'oitocentos', 'novecentos'];

    const toWords = (n: number): string => {
      if (n === 0) return '';
      if (n < 10) return unidades[n];
      if (n < 20) return especiais[n - 10];
      if (n < 100) {
        const d = Math.floor(n / 10);
        const r = n % 10;
        return r ? `${dezenas[d]} e ${unidades[r]}` : dezenas[d];
      }
      if (n === 100) return 'cem';
      if (n < 1000) {
        const c = Math.floor(n / 100);
        const r = n % 100;
        return r ? `${centenas[c + 1]} e ${toWords(r)}` : (c === 1 ? 'cem' : centenas[c + 1]);
      }
      if (n < 1000000) {
        const mil = Math.floor(n / 1000);
        const r = n % 1000;
        const milStr = mil === 1 ? 'mil' : `${toWords(mil)} mil`;
        return r ? `${milStr} ${r < 100 ? 'e ' : ''}${toWords(r)}` : milStr;
      }
      const milhoes = Math.floor(n / 1000000);
      const r = n % 1000000;
      const mStr = milhoes === 1 ? 'um milhão' : `${toWords(milhoes)} milhões`;
      return r ? `${mStr} ${r < 100 ? 'e ' : ''}${toWords(r)}` : mStr;
    };

    const inteiro = Math.floor(valor);
    const centavos = Math.round((valor - inteiro) * 100);
    const intStr = inteiro === 0 ? 'zero real' : `${toWords(inteiro)} ${inteiro === 1 ? 'real' : 'reais'}`;
    const centStr = centavos === 0 ? '' : `${centavos < 100 ? toWords(centavos) : ''} ${centavos === 1 ? 'centavo' : 'centavos'}`;
    return centStr ? `${intStr} e ${centStr}` : intStr;
  };

  // gestão de assinatura/logo removida deste módulo (ficará em Perfil)

  const updateReciboStatus = (recibo: Recibo, status: Recibo['status']) => {
    setRecibos(prev => prev.map(r => r.id === recibo.id ? { ...r, status } : r));
  };

  const parseCurrencyBRToNumber = (display: string): number => {
    const cleaned = display.trim().replace(/\./g, '').replace(',', '.');
    const n = parseFloat(cleaned);
    return isNaN(n) ? 0 : n;
  };

  const formatNumberToCurrencyBR = (n: number): string => {
    return new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
  };

  // Helpers CPF
  const onlyDigits = (v: string) => (v || '').replace(/\D/g, '');
  const formatCPF = (digits: string) => {
    const v = digits.slice(0, 11);
    return v
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  };

  // Validação CPF/CNPJ com checksum
  const validateCPF = (cpf: string): boolean => {
    const v = onlyDigits(cpf).padStart(11, '0');
    if (v.length !== 11 || /^([0-9])\1+$/.test(v)) return false;
    let sum = 0;
    for (let i = 0; i < 9; i++) sum += parseInt(v.charAt(i)) * (10 - i);
    let rev = 11 - (sum % 11);
    if (rev >= 10) rev = 0;
    if (rev !== parseInt(v.charAt(9))) return false;
    sum = 0;
    for (let i = 0; i < 10; i++) sum += parseInt(v.charAt(i)) * (11 - i);
    rev = 11 - (sum % 11);
    if (rev >= 10) rev = 0;
    return rev === parseInt(v.charAt(10));
  };

  const validateCNPJ = (cnpj: string): boolean => {
    const v = onlyDigits(cnpj).padStart(14, '0');
    if (v.length !== 14 || /^([0-9])\1+$/.test(v)) return false;
    const calc = (base: number) => {
      let size = base - 7, pos = base - 8, sum = 0;
      for (let i = 0; i < base - 1; i++) {
        sum += parseInt(v.charAt(i)) * size--;
        if (size < 2) size = 9;
      }
      let result = sum % 11;
      return (result < 2) ? 0 : 11 - result;
    };
    const d1 = calc(13);
    if (d1 !== parseInt(v.charAt(12))) return false;
    const d2 = calc(14);
    return d2 === parseInt(v.charAt(13));
  };

  // Carregar logo padrão do usuário a partir do user_metadata.default_logo_path
  useEffect(() => {
    const loadDefaultLogo = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setCurrentUserName(((user?.user_metadata as any)?.name || '').toString());
        const path = (user?.user_metadata as any)?.default_logo_path as string | undefined;
        if (!path) {
          setDefaultLogoUrl(null);
          return;
        }
        const { data: signed } = await supabase
          .storage
          .from('signatures')
          .createSignedUrl(path, 60 * 60);
        setDefaultLogoUrl(signed?.signedUrl || null);
      } catch (e) {
        console.warn('Não foi possível carregar a logo padrão:', e);
        setDefaultLogoUrl(null);
      }
    };
    loadDefaultLogo();
    const loadDefaultSignature = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        const path = (user?.user_metadata as any)?.default_signature_path as string | undefined;
        if (!path) { setDefaultSignatureUrl(null); setDefaultSignaturePath(null); return; }
        const { data: signed } = await supabase.storage.from('signatures').createSignedUrl(path, 60 * 60);
        setDefaultSignatureUrl(signed?.signedUrl || null);
        setDefaultSignaturePath(path);
      } catch (e) {
        console.warn('Não foi possível carregar a assinatura padrão:', e);
        setDefaultSignatureUrl(null);
        setDefaultSignaturePath(null);
      }
    };
    loadDefaultSignature();
  }, []);

  // Carregar recibos do backend/Supabase somente após carregar localStorage
  useEffect(() => {
    if (!loadedLocal) return;
    const load = async () => {
      try {
        const { data, error } = await receiptsApi.list(1, 50);
        if (error || !data) {
          // mantém dados locais (offline/localStorage)
          // tenta Supabase mesmo assim
        } else {
          const items = Array.isArray(data.items) ? data.items : [];
          if (items.length > 0) {
            const mapped: Recibo[] = items.map((it: any) => {
              const numeroStr = typeof it.numero === 'number' ? `RB-${String(it.numero).padStart(3,'0')}` : (it.numero || 'RB-—');
              const dateStr: string = (it.emitido_em || it.created_at || '').slice(0,10);
              return {
                id: it.id,
                numero: numeroStr,
                cliente: '—',
                valor: 0,
                dataEmissao: dateStr,
                status: 'emitido',
                descricao: '',
                formaPagamento: 'PIX',
                useLogo: false,
                logoDataUrl: undefined,
                cpf: undefined,
                signatureId: it.signature_id || undefined,
                signatureDataUrl: undefined,
                issuerName: it.issuer_name || undefined,
                issuerDocumento: it.issuer_document || undefined,
              } as Recibo;
            });
            // Mescla com dados locais existentes para não perder itens criados offline
            setRecibos((prev) => {
              const byId = new Map(prev.map((p) => [p.id, p]));
              mapped.forEach((m) => byId.set(m.id, m));
              return Array.from(byId.values());
            });
          }
        }
        // Tentar carregar também do Supabase (rf_receipts minimal) e mesclar
        try {
          const minis = await ReceiptsMinimalService.list();
          if (Array.isArray(minis) && minis.length > 0) {
            const mappedMinis: Recibo[] = minis.map((m: any) => ({
              id: m.id,
              numero: typeof m.numero === 'number' ? `RB-${String(m.numero).padStart(3, '0')}` : (m.numero || m.id),
              cliente: '—',
              valor: 0,
              dataEmissao: (m.emitido_em || m.created_at || '').slice(0, 10),
              status: 'emitido',
              descricao: '',
              formaPagamento: 'PIX',
              useLogo: false,
              logoDataUrl: undefined,
              cpf: undefined,
              signatureId: m.signature_id || undefined,
              signatureDataUrl: undefined,
              issuerName: undefined,
              issuerDocumento: undefined,
            }));
            setRecibos((prev) => {
              const byId = new Map(prev.map((p) => [p.id, p]));
              mappedMinis.forEach((m) => byId.set(m.id, m));
              return Array.from(byId.values());
            });
          }
        } catch (e) {
          // ignora falhas do Supabase e mantém local
        }
      } catch (err) {
        console.warn('Falha ao carregar recibos do backend:', err);
        // mantém dados locais
      }
    };
    load();
  }, [loadedLocal]);

  // Prefill de recibo ao navegar a partir de Contratos
  useEffect(() => {
    const s = (location && (location as any).state) as any;
    if (s && s.prefillRecibo) {
      const p = s.prefillRecibo;
      setShowNovoRecibo(true);
      setNovoRecibo(prev => ({
        ...prev,
        cliente: p.cliente || prev.cliente || '',
        cpf: p.documento || prev.cpf || '',
        signatureDataUrl: p.signatureUrl || prev.signatureDataUrl || defaultSignatureUrl || undefined,
        signatureId: p.signatureId || prev.signatureId,
        contractId: p.contractId || prev.contractId,
        useLogo: typeof p.useLogo === 'boolean' ? p.useLogo : (prev.useLogo ?? !!defaultLogoUrl),
        logoDataUrl: p.logoUrl || prev.logoDataUrl,
        descricao: p.descricao || prev.descricao,
        formaPagamento: p.formaPagamento || prev.formaPagamento,
        dataEmissao: p.dataEmissao || prev.dataEmissao,
      }));
      if (p.valor) {
        const formatter = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        setNovoValorInput(formatter.format(p.valor));
      }
      if (window.history?.replaceState) {
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, [location, defaultSignatureUrl, defaultLogoUrl]);

  // Inicializa checkboxes de inclusão de assinatura ao abrir modais
  useEffect(() => {
    if (showNovoRecibo) {
      setNovoUseSignature(!!defaultSignatureUrl || !!novoRecibo.signatureDataUrl);
    }
  }, [showNovoRecibo, defaultSignatureUrl]);

  useEffect(() => {
    if (showEditRecibo) {
      setEditUseSignature(!!defaultSignatureUrl || !!editRecibo.signatureDataUrl);
    }
  }, [showEditRecibo, defaultSignatureUrl, editRecibo.signatureDataUrl]);
  // Carrega a lista de assinaturas (via serviço central, por nome) e logos do usuário ao abrir modais
  useEffect(() => {
    const loadAssets = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        // Assinaturas: usar serviço central para listar por nome (display_name) e URL assinada
        const gallery = await SignatureService.getUserSignatures();
        const sigOptions = gallery.map(item => ({ id: item.id, url: item.thumbnail_url, name: item.display_name || item.name }));
        setSignatureOptions(sigOptions);

        // List logos (diretório raiz e subpasta branding)
        const logoOpts: Array<{ path: string; url: string; name: string }> = [];
        const rootPath = `${user.id}`;
        const brandPath = `${user.id}/branding`;
        const { data: brandRootList } = await supabase.storage.from('signatures').list(rootPath, { limit: 100, sortBy: { column: 'created_at', order: 'desc' } as any });
        const { data: brandSubList } = await supabase.storage.from('signatures').list(brandPath, { limit: 100, sortBy: { column: 'created_at', order: 'desc' } as any });
        const addLogo = async (basePath: string, files: any[] | null | undefined) => {
          if (!files) return;
          for (const f of files) {
            if (!f.name) continue;
            const full = `${basePath}/${f.name}`;
            const { data: s } = await supabase.storage.from('signatures').createSignedUrl(full, 60 * 60);
            if (s?.signedUrl) logoOpts.push({ path: full, url: s.signedUrl, name: f.name });
          }
        };
        await addLogo(rootPath, brandRootList);
        await addLogo(brandPath, brandSubList);
        setLogoOptions(logoOpts);
      } catch (e) {
        console.warn('Falha ao carregar assinaturas/logos do usuário:', e);
      }
    };
    if (showEditRecibo || showNovoRecibo) loadAssets();
  }, [showEditRecibo, showNovoRecibo]);

  

  // Uploads diretos e seletores de arquivo foram removidos deste módulo

  const handleCreateRecibo = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = (window.crypto && 'randomUUID' in window.crypto) ? window.crypto.randomUUID() : String(Date.now());
    const numero = (novoRecibo.numero && novoRecibo.numero.trim()) || `RB-${String(recibos.length + 1).padStart(3, '0')}`;
    const cliente = (novoRecibo.cliente || '').trim() || 'Cliente';
    const valor = parseCurrencyBRToNumber(novoValorInput);
    const hojeISO = new Date().toISOString().slice(0,10);
    const emissao = (novoRecibo.dataEmissao && novoRecibo.dataEmissao) || hojeISO;
    // Resolver ID/URL da assinatura se checkbox ativo e não houver seleção explícita
    let resolvedSignatureId: string | undefined = novoRecibo.signatureId;
    let resolvedSignatureUrl: string | undefined = novoRecibo.signatureDataUrl;
    if (novoUseSignature && !resolvedSignatureId && defaultSignaturePath) {
      try {
        const preview = await SignatureService.getSignatureByPath(defaultSignaturePath);
        resolvedSignatureId = preview.id;
        resolvedSignatureUrl = preview.url;
      } catch (err) {
        console.warn('Não foi possível resolver assinatura padrão por caminho:', err);
      }
    }
    // Cria localmente para resposta rápida na UI
    let novo: Recibo = {
      id,
      numero,
      cliente,
      valor,
      dataEmissao: emissao,
      status: (novoRecibo.status as Recibo['status']) || 'emitido',
      descricao: novoRecibo.descricao || '',
      formaPagamento: novoRecibo.formaPagamento || 'PIX',
      useLogo: novoRecibo.useLogo,
      logoDataUrl: novoRecibo.logoDataUrl,
      cpf: (novoRecibo.cpf && novoRecibo.cpf.trim()) ? novoRecibo.cpf : undefined,
      signatureId: novoEmitirOutro ? undefined : (novoUseSignature ? resolvedSignatureId : undefined),
      signatureDataUrl: novoEmitirOutro ? (novoRecibo.signatureDataUrl || undefined) : (novoUseSignature ? (resolvedSignatureUrl || defaultSignatureUrl || undefined) : undefined),
      issuerName: novoEmitirOutro ? ((novoRecibo.issuerName || '').trim() || undefined) : (currentUserName || undefined),
      issuerDocumento: novoEmitirOutro ? ((novoRecibo.issuerDocumento || '').trim() || undefined) : undefined,
      contractId: novoRecibo.contractId,
    };

    // Persistência no Supabase (rf_receipts) prioritária para evitar duplicados
    let supaSaved: { id: string; numero?: number | null; emitido_em?: string | null; created_at?: string | null } | null = null;
    try {
      const saved = await ReceiptsMinimalService.create({ signature_id: novo.signatureId ?? null, contract_id: novo.contractId ?? null });
      if (saved) {
        supaSaved = saved as any;
        const supaNumero = typeof saved.numero === 'number' ? `RB-${String(saved.numero).padStart(3, '0')}` : novo.numero;
        const supaData = (saved.emitido_em || saved.created_at || novo.dataEmissao || '').slice(0, 10);
        novo = { ...novo, id: saved.id, numero: supaNumero, dataEmissao: supaData };
      }
    } catch (err) {
      console.warn('Falha ao persistir recibo no Supabase. Tentando backend como fallback.', err);
    }

    // Fallback: backend (apenas se não salvou no Supabase)
    if (!supaSaved) {
      try {
        const payload = {
          income_id: null,
          pdf_url: null,
          hash: null,
          signature_id: novo.signatureId ?? null,
          issuer_name: novo.issuerName ?? null,
          issuer_document: novo.issuerDocumento ?? null,
        };
        const { data, error } = await receiptsApi.create(payload);
        if (!error && data) {
          const backendNumero = typeof data.numero === 'number' ? `RB-${String(data.numero).padStart(3, '0')}` : novo.numero;
          novo = { ...novo, id: data.id, numero: backendNumero };
        }
      } catch (err) {
        console.warn('Falha ao persistir recibo no backend. Mantendo item local.', err);
      }
    }

    setRecibos(prev => [novo, ...prev]);
    setShowNovoRecibo(false);
    setNovoRecibo({ numero: '', cliente: '', valor: 0, dataEmissao: '', status: 'emitido', descricao: '', formaPagamento: 'PIX' });
    setNovoValorInput('');
    setNovoEmitirOutro(false);
  };

  const generatePrintableHtml = (recibo: Recibo) => {
const logoUrl = recibo.useLogo ? (recibo.logoDataUrl || defaultLogoUrl) : null;
const style = `
<style>
:root { --fg:#0f172a; --muted:#64748b; --border:#cbd5e1; --bg:#ffffff; --panel:#f8fafc; }
*{box-sizing:border-box}
body{font-family: Georgia, 'Times New Roman', serif; margin:16px; background:var(--bg); color:var(--fg)}
.wrap{max-width:800px;margin:0 auto;border:1px solid var(--border);}
.head{display:flex;justify-content:space-between;align-items:center;padding:12px 16px;border-bottom:2px solid var(--border);}
.brand{display:flex;align-items:center;gap:12px}
.brand .logo{height:48px;object-fit:contain}
h1{font-size:22px;letter-spacing:.5px;margin:0}
.content{padding:16px;background:var(--panel)}
.row{display:flex;justify-content:space-between;gap:12px}
.muted{color:var(--muted)}
.signature{margin-top:32px;text-align:center}
.signature img{max-height:80px;object-fit:contain;margin-bottom:8px}
.signature .line{border-top:1px solid var(--border);margin-top:24px}
.center{text-align:center}
</style>
`;
const dataBR = recibo.dataEmissao ? new Date(recibo.dataEmissao).toLocaleDateString('pt-BR') : '';
const signerName = (recibo.issuerName && recibo.issuerName.trim()) || (currentUserName && currentUserName.trim()) || '';
return `
<html>
<head><meta charset="utf-8">${style}<title>Recibo ${recibo.numero}</title></head>
<body>
<div class="wrap">
<div class="head">
<div class="brand">
${logoUrl ? `<img class="logo" src="${logoUrl}" alt="Logo"/>` : ''}
<h1>Recibo</h1>
</div>
<div class="muted">${recibo.numero}</div>
</div>
<div class="content">
<div class="row"><div class="muted">Cliente</div><div>${recibo.cliente}</div></div>
<div class="row"><div class="muted">Valor</div><div>R$ ${recibo.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div></div>
<div class="row"><div class="muted">Emissão</div><div>${dataBR || '—'}</div></div>
${(recibo.issuerName || recibo.issuerDocumento) ? `<div class="row"><div class="muted">Emitido por</div><div>${recibo.issuerName || ''}${recibo.issuerDocumento ? ' • ' + recibo.issuerDocumento : ''}</div></div>` : ''}
${recibo.descricao ? `<div style="margin-top:12px"><div class="muted">Descrição</div><div>${recibo.descricao}</div></div>` : ''}
<div class="muted" style="margin-top:16px">E para maior clareza, afirmo o presente.</div>
${dataBR ? `<div class="center" style="margin-top:28px">${dataBR}</div>` : ''}
<div class="signature">
${recibo.signatureDataUrl ? `<img src="${recibo.signatureDataUrl}" alt="Assinatura" />` : ''}
<div class="line"></div>
<div class="muted" style="margin-top:8px">Assinatura${signerName ? ` — ${signerName}` : ''}</div>
</div>
</div>
</div>
<script>window.onload = () => { window.print(); };</script>
</body>
</html>`;
  };

  const handleDownloadRecibo = async (recibo: Recibo) => {
let toPrint = { ...recibo } as Recibo;
// Se temos ID mas não URL, resolve antes de imprimir
if (toPrint.signatureId && !toPrint.signatureDataUrl) {
try {
const preview = await SignatureService.getSignatureById(toPrint.signatureId);
toPrint.signatureDataUrl = preview.url;
} catch (err) {
console.warn('Não foi possível resolver URL da assinatura por ID:', err);
}
}
const win = window.open('', '_blank');
if (!win) return;
win.document.open();
win.document.write(generatePrintableHtml(toPrint));
win.document.close();
};

  const handleShareRecibo = async (recibo: Recibo) => {
// ...
};

  const handleViewRecibo = (recibo: Recibo) => {
    setReciboSelecionado(recibo);
    setShowViewRecibo(true);
    setPrintWithLogo(!!recibo.useLogo || !!defaultLogoUrl);
  };

  const handleEditReciboOpen = (recibo: Recibo) => {
setReciboSelecionado(recibo);
setEditRecibo({ ...recibo });
setEditValorInput(formatNumberToCurrencyBR(recibo.valor));
setShowEditRecibo(true);
};

  const handleEditReciboSubmit = async (e: React.FormEvent) => {
e.preventDefault();
if (!reciboSelecionado) return;
const novoValor = parseCurrencyBRToNumber(editValorInput);
// Resolver assinatura padrão se checkbox ativo e sem seleção explícita
let resolvedSignatureId: string | undefined = editRecibo.signatureId ?? reciboSelecionado.signatureId;
let resolvedSignatureUrl: string | undefined = editRecibo.signatureDataUrl ?? reciboSelecionado.signatureDataUrl;
if (editUseSignature && !resolvedSignatureId && defaultSignaturePath) {
try {
const preview = await SignatureService.getSignatureByPath(defaultSignaturePath);
resolvedSignatureId = preview.id;
resolvedSignatureUrl = preview.url;
} catch (err) {
console.warn('Não foi possível resolver assinatura padrão por caminho (edição):', err);
}
}
// Se editar para emissor alternativo, exigir documento válido e assinatura
if (editEmitirOutro || editRecibo.issuerName || editRecibo.issuerDocumento) {
const issuerName = (editRecibo.issuerName || reciboSelecionado.issuerName || '').trim();
const issuerDoc = (editRecibo.issuerDocumento || reciboSelecionado.issuerDocumento || '').trim();
const issuerDocDigits = onlyDigits(issuerDoc);
const issuerDocOk = issuerDocDigits.length === 11 ? validateCPF(issuerDoc) : issuerDocDigits.length === 14 ? validateCNPJ(issuerDoc) : false;
const sigOk = !!((editRecibo.signatureDataUrl || reciboSelecionado.signatureDataUrl || '').trim());
if (!issuerName || !issuerDocOk || !sigOk) {
alert('Para emitir em nome de outra pessoa, informe Nome do emissor, Documento válido (CPF/CNPJ) e a Assinatura do emissor.');
return;
}
}

setRecibos(prev => prev.map(r => r.id === reciboSelecionado.id ? {
...r,
numero: (editRecibo.numero || r.numero)!,
cliente: (editRecibo.cliente || r.cliente)!,
valor: isNaN(novoValor) ? r.valor : novoValor,
dataEmissao: (editRecibo.dataEmissao || r.dataEmissao)!,
status: (editRecibo.status as Recibo['status']) || r.status,
descricao: editRecibo.descricao ?? r.descricao,
formaPagamento: editRecibo.formaPagamento ?? r.formaPagamento,
useLogo: typeof editRecibo.useLogo === 'boolean' ? editRecibo.useLogo : r.useLogo,
logoDataUrl: editRecibo.logoDataUrl ?? r.logoDataUrl,
cpf: typeof editRecibo.cpf === 'string' ? editRecibo.cpf : r.cpf,
signatureId: (editEmitirOutro || editRecibo.issuerName || editRecibo.issuerDocumento) ? undefined : (editUseSignature ? (resolvedSignatureId ?? undefined) : undefined),
signatureDataUrl: (editEmitirOutro || editRecibo.issuerName || editRecibo.issuerDocumento) ? (editRecibo.signatureDataUrl ?? r.signatureDataUrl) : (editUseSignature ? (resolvedSignatureUrl ?? defaultSignatureUrl ?? undefined) : undefined),
issuerName: (editEmitirOutro || editRecibo.issuerName || editRecibo.issuerDocumento) ? (editRecibo.issuerName || r.issuerName) : undefined,
issuerDocumento: (editEmitirOutro || editRecibo.issuerName || editRecibo.issuerDocumento) ? (editRecibo.issuerDocumento || r.issuerDocumento) : undefined,
} : r));
setShowEditRecibo(false);
setReciboSelecionado(null);
setEditRecibo({});
setEditValorInput('');
};

  const openDeleteRecibo = (recibo: Recibo) => {
    setDeleteTargetRecibo(recibo);
    setDeletePassword('');
    setDeleteError(null);
    setShowDeleteRecibo(true);
  };

  const confirmDeleteRecibo = async () => {
    if (!deleteTargetRecibo) return;
    setDeleteLoading(true);
    setDeleteError(null);
    try {
      // Confirmação de senha (reauth) - irreversível
      const { data: { user } } = await supabase.auth.getUser();
      const email = (user?.email || '').trim();
      if (!email) {
        setDeleteError('Sessão inválida. Faça login novamente.');
        setDeleteLoading(false);
        return;
      }
      const { error: authErr } = await supabase.auth.signInWithPassword({ email, password: deletePassword });
      if (authErr) {
        setDeleteError('Senha incorreta. Tente novamente.');
        setDeleteLoading(false);
        return;
      }

      try {
        if (deleteTargetRecibo.id && isUUID(deleteTargetRecibo.id)) {
          // Prioriza remover do Supabase (rf_receipts minimal)
          const ok = await ReceiptsMinimalService.remove(deleteTargetRecibo.id);
          if (!ok) {
            // Fallback: API backend
            await receiptsApi.remove(deleteTargetRecibo.id);
          }
        }
      } catch (apiErr) {
        console.warn('Falha ao excluir recibo no backend. Removendo localmente.', apiErr);
      }

      // Marca tombstone para não reaparecer ao mesclar com dados remotos
      const deletedId = deleteTargetRecibo.id;
      setDeletedIds(prev => {
        const next = prev.includes(deletedId) ? prev : [...prev, deletedId];
        try { localStorage.setItem('deleted_receipts', JSON.stringify(next)); } catch {}
        return next;
      });

      setRecibos(prev => prev.filter(r => r.id !== deleteTargetRecibo.id));
      setShowDeleteRecibo(false);
      setDeleteTargetRecibo(null);
      setDeletePassword('');
    } catch (err) {
      setDeleteError('Erro inesperado ao confirmar exclusão.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const cancelDeleteRecibo = () => {
    setShowDeleteRecibo(false);
    setDeleteTargetRecibo(null);
    setDeletePassword('');
    setDeleteError(null);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Recibos</h1>
          <p className="text-gray-600 mt-1">
            Gerencie seus recibos emitidos
          </p>
        </div>
        <div className="mt-4 sm:mt-0 inline-flex items-center gap-2">
          <button onClick={() => setShowNovoRecibo(true)} className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <Plus className="w-4 h-4 mr-2" />
            Novo Recibo
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-full">
              <CreditCard className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Valor Total</p>
              <p className="text-2xl font-bold text-gray-900">
                R$ {totalRecibos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-full">
              <FileText className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pagos</p>
              <p className="text-2xl font-bold text-gray-900">
                {recibosPagos}
              </p>
            </div>
          </div>
        </div>
        
        
        
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-full">
              <FileText className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total</p>
              <p className="text-2xl font-bold text-gray-900">
                {filteredRecibos.length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Modal: Novo Recibo */}
      {showNovoRecibo && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-10">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowNovoRecibo(false)} />
          <div className="relative z-10 bg-white rounded-lg shadow-lg w-full sm:max-w-md md:max-w-lg lg:max-w-xl 2xl:max-w-2xl p-6 max-h-[70vh] flex flex-col overflow-hidden">
            <button className="absolute top-3 right-3 text-gray-500 hover:text-gray-700" onClick={() => setShowNovoRecibo(false)} aria-label="Fechar">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Novo Recibo</h3>
            <div className="flex-1 overflow-y-auto pr-1">
            <form className="space-y-4" onSubmit={handleCreateRecibo}>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Número</label>
                <input value={novoRecibo.numero || ''} onChange={(e) => setNovoRecibo(prev => ({ ...prev, numero: e.target.value }))} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="RB-001" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
                <input value={novoRecibo.cliente || ''} onChange={(e) => setNovoRecibo(prev => ({ ...prev, cliente: e.target.value }))} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Nome do cliente" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">CPF/CNPJ (opcional)</label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="000.000.000-00 ou 00.000.000/0000-00"
                  value={novoRecibo.cpf || ''}
                  onChange={(e) => {
                    const digits = onlyDigits(e.target.value);
                    const formatted = digits.length > 11
                      ? digits
                          .slice(0, 14)
                          .replace(/(\d{2})(\d)/, '$1.$2')
                          .replace(/(\d{3})(\d)/, '$1.$2')
                          .replace(/(\d{3})(\d)/, '$1/$2')
                          .replace(/(\d{4})(\d{1,2})$/, '$1-$2')
                      : formatCPF(digits);
                    setNovoRecibo(prev => ({ ...prev, cpf: formatted }));
                  }}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              {/* Emitir em nome de outra pessoa */}
              <div className="border rounded-lg p-3 space-y-2">
                <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    className="h-4 w-4"
                    checked={novoEmitirOutro}
                    onChange={(e) => setNovoEmitirOutro(e.target.checked)}
                  />
                  Emitir em nome de outra pessoa
                </label>
                {novoEmitirOutro && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nome do emissor</label>
                      <input
                        type="text"
                        value={novoRecibo.issuerName || ''}
                        onChange={(e) => setNovoRecibo(prev => ({ ...prev, issuerName: e.target.value }))}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Nome completo"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Documento do emissor</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="000.000.000-00 ou 00.000.000/0000-00"
                        value={novoRecibo.issuerDocumento || ''}
                        onChange={(e) => {
                          const digits = onlyDigits(e.target.value);
                          const formatted = digits.length > 11
                            ? digits
                                .slice(0, 14)
                                .replace(/(\d{2})(\d)/, '$1.$2')
                                .replace(/(\d{3})(\d)/, '$1.$2')
                                .replace(/(\d{3})(\d)/, '$1/$2')
                                .replace(/(\d{4})(\d{1,2})$/, '$1-$2')
                            : formatCPF(digits);
                          setNovoRecibo(prev => ({ ...prev, issuerDocumento: formatted }));
                        }}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Assinatura do emissor (imagem)</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          let uploadFile = file;
                          const lower = (file.name||'').toLowerCase();
                          const isHeic = file.type.includes('heic') || file.type.includes('heif') || lower.endsWith('.heic') || lower.endsWith('.heif');
                          if (isHeic) {
                            try {
                              const heic2any = (await import('heic2any')).default as any;
                              const conv = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.9 });
                              const blob: Blob = Array.isArray(conv) ? conv[0] : conv;
                              uploadFile = new File([blob], (file.name.replace(/\.[^.]+$/, '')||'assinatura')+'.jpg', { type: 'image/jpeg' });
                            } catch {}
                          }
                          const reader = new FileReader();
                          reader.onload = () => setNovoRecibo(prev => ({ ...prev, signatureDataUrl: String(reader.result||'') }));
                          reader.readAsDataURL(uploadFile);
                        }}
                        className="w-full px-3 py-2 border rounded-lg"
                      />
                      <div className="mt-2">
                        <button type="button" onClick={() => { setShowSignCanvas('novo'); setCanvasKey(k => k + 1); }} className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg">Assinar no touch</button>
                      </div>
                      {novoRecibo.signatureDataUrl && (
                        <img src={novoRecibo.signatureDataUrl} alt="Assinatura do emissor" className="h-10 object-contain border rounded bg-white px-2 mt-2" />
                      )}
                    </div>
                  </div>
                )}
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
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Emissão</label>
                  <input type="date" value={novoRecibo.dataEmissao || ''} onChange={(e) => setNovoRecibo(prev => ({ ...prev, dataEmissao: e.target.value }))} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select value={novoRecibo.status || 'emitido'} onChange={(e) => setNovoRecibo(prev => ({ ...prev, status: e.target.value as Recibo['status'] }))} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    <option value="emitido">Emitido</option>
                    <option value="enviado">Enviado</option>
                    <option value="pago">Pago</option>
                    <option value="vencido">Vencido</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Forma de Pagamento</label>
                  <select value={novoRecibo.formaPagamento || ''} onChange={(e) => setNovoRecibo(prev => ({ ...prev, formaPagamento: e.target.value }))} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    <option value="PIX">PIX</option>
                    <option value="Dinheiro">Dinheiro</option>
                    <option value="Transferência">Transferência</option>
                    <option value="Cartão">Cartão</option>
                    <option value="Outros">Outros</option>
                  </select>
                </div>
              </div>
              {/* Logo (selecionar da conta) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Logo</label>
                <div className="flex items-center gap-3">
                  <input id="novo-use-logo" type="checkbox" checked={!!novoRecibo.useLogo} onChange={(e) => setNovoRecibo(prev => ({ ...prev, useLogo: e.target.checked }))} className="h-4 w-4" />
                  <label htmlFor="novo-use-logo" className="text-sm text-gray-700">Exibir sua logo</label>
                </div>
                <div className="mt-2 flex items-center gap-3">
                  {logoOptions.length > 0 ? (
                    <>
                      <select
                        value={novoRecibo.logoDataUrl || ''}
                        onChange={(e) => {
                          const v = e.target.value;
                          if (v === '__create_logo__') { navigate('/assinaturas'); return; }
                          setNovoRecibo(prev => ({ ...prev, logoDataUrl: v || undefined }));
                        }}
                        className="px-3 py-2 border rounded-lg text-sm w-full max-w-xs"
                        disabled={!novoRecibo.useLogo}
                      >
                        <option value="">Selecione</option>
                        {logoOptions.map(opt => (
                          <option key={opt.path} value={opt.url}>{opt.name}</option>
                        ))}
                        <option value="__create_logo__">Cadastrar Nova Logo</option>
                      </select>
                      {(novoRecibo.logoDataUrl || defaultLogoUrl) && (
                        <img src={(novoRecibo.logoDataUrl || defaultLogoUrl) as string} alt="Logo" className="h-10 object-contain border rounded bg-white px-2" />
                      )}
                    </>
                  ) : (
                    <select
                      value={''}
                      onChange={(e) => { if (e.target.value === '__create_logo__') navigate('/assinaturas'); }}
                      className="px-3 py-2 border rounded-lg text-sm w-full max-w-xs"
                      disabled={!novoRecibo.useLogo}
                    >
                      <option value="__create_logo__">Cadastrar Nova Logo</option>
                    </select>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                <textarea value={novoRecibo.descricao || ''} onChange={(e) => setNovoRecibo(prev => ({ ...prev, descricao: e.target.value }))} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" rows={3} />
              </div>
              {/* Assinatura (selecionar da conta) - desabilitada ao emitir em nome de outra pessoa */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">Assinatura</label>
                </div>
                <div className="mt-1 flex items-center gap-3">
                  <input id="novo-use-signature" type="checkbox" checked={novoUseSignature && !novoEmitirOutro} onChange={(e) => { setNovoUseSignature(e.target.checked); if (!e.target.checked) setNovoRecibo(prev => ({ ...prev, signatureDataUrl: undefined })); }} className="h-4 w-4" disabled={novoEmitirOutro} />
                  <label htmlFor="novo-use-signature" className="text-sm text-gray-700">Usar sua assinatura</label>
                  {signatureOptions.length > 0 ? (
                    <>
                      <select
                        value={novoRecibo.signatureId || ''}
                        onChange={(e) => {
                          const id = e.target.value;
                          if (id === '__create_sig__') { navigate('/assinaturas'); return; }
                          const opt = signatureOptions.find(o => o.id === id);
                          setNovoRecibo(prev => ({ ...prev, signatureId: id || undefined, signatureDataUrl: opt?.url }));
                        }}
                        className="px-3 py-2 border rounded-lg text-sm w-full max-w-xs"
                        disabled={!novoUseSignature || novoEmitirOutro}
                      >
                        <option value="">Selecione</option>
                        {signatureOptions.map(opt => (
                          <option key={opt.id} value={opt.id}>{opt.name}</option>
                        ))}
                        <option value="__create_sig__">Cadastrar Nova Assinatura</option>
                      </select>
                      {(novoRecibo.signatureDataUrl || defaultSignatureUrl) && (
                        <img src={(novoRecibo.signatureDataUrl || defaultSignatureUrl) as string} alt="Assinatura" className="h-10 object-contain border rounded bg-white px-2" />
                      )}
                    </>
                  ) : (
                    <select
                      value={''}
                      onChange={(e) => { if (e.target.value === '__create_sig__') navigate('/assinaturas'); }}
                      className="px-3 py-2 border rounded-lg text-sm w-full max-w-xs"
                      disabled={!novoUseSignature || novoEmitirOutro}
                    >
                      <option value="">Selecione</option>
                      <option value="__create_sig__">Cadastrar Nova Assinatura</option>
                    </select>
                  )}
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowNovoRecibo(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Criar</button>
              </div>
            </form>
            </div>
          </div>
        </div>
      )}

      {/* Modais de gerenciamento foram removidos. Gestão de logo e assinatura fica na página de Perfil. */}

      {/* Modal: Visualizar Recibo */}
      {showViewRecibo && reciboSelecionado && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-10">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowViewRecibo(false)} />
          <div className="relative z-10 bg-white rounded-lg shadow-lg w-full sm:max-w-md md:max-w-lg lg:max-w-xl 2xl:max-w-2xl p-6 max-h-[70vh] flex flex-col overflow-hidden">
            <button className="absolute top-3 right-3 text-gray-500 hover:text-gray-700" onClick={() => setShowViewRecibo(false)} aria-label="Fechar">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{reciboSelecionado.numero}</h3>
            <div className="flex-1 overflow-y-auto pr-1">
            <div className="space-y-2 text-sm text-gray-700">
              <div className="flex justify-between"><span className="text-gray-500">Cliente</span><span className="font-medium">{reciboSelecionado.cliente}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Valor</span><span className="font-medium">R$ {reciboSelecionado.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Emissão</span><span>{new Date(reciboSelecionado.dataEmissao).toLocaleDateString('pt-BR')}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Status</span><span className={cn('inline-flex px-2 py-1 text-xs font-semibold rounded-full', getStatusColor(reciboSelecionado.status))}>{getStatusLabel(reciboSelecionado.status)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">CPF</span><span>{reciboSelecionado.cpf && reciboSelecionado.cpf.trim() ? reciboSelecionado.cpf : 'Não informado'}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Forma</span><span>{reciboSelecionado.formaPagamento && reciboSelecionado.formaPagamento.trim() ? reciboSelecionado.formaPagamento : 'Não informado'}</span></div>
              <div>
                <div className="text-gray-500">Descrição</div>
                <div className="mt-1">{reciboSelecionado.descricao && reciboSelecionado.descricao.trim() ? reciboSelecionado.descricao : 'Não informado'}</div>
              </div>
            </div>
            </div>
            <div className="flex items-center justify-between gap-3 mt-4">
              <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" className="h-4 w-4" checked={printWithLogo} onChange={(e) => setPrintWithLogo(e.target.checked)} />
                Exibir logo nesta impressão
              </label>
              <button onClick={() => handleDownloadRecibo({ ...reciboSelecionado, useLogo: printWithLogo })} className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Imprimir/Salvar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Editar Recibo */}
      {showEditRecibo && reciboSelecionado && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-10">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowEditRecibo(false)} />
          <div className="relative z-10 bg-white rounded-lg shadow-lg w-full sm:max-w-md md:max-w-lg lg:max-w-xl 2xl:max-w-2xl p-6 max-h-[70vh] flex flex-col overflow-hidden">
            <button className="absolute top-3 right-3 text-gray-500 hover:text-gray-700" onClick={() => setShowEditRecibo(false)} aria-label="Fechar">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Editar Recibo</h3>
            <div className="flex-1 overflow-y-auto pr-1">
            <form className="space-y-4" onSubmit={handleEditReciboSubmit}>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Número</label>
                <input value={editRecibo.numero || ''} onChange={(e) => setEditRecibo(prev => ({ ...prev, numero: e.target.value }))} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
                <input value={editRecibo.cliente || ''} onChange={(e) => setEditRecibo(prev => ({ ...prev, cliente: e.target.value }))} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">CPF/CNPJ (opcional)</label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="000.000.000-00 ou 00.000.000/0000-00"
                  value={editRecibo.cpf || ''}
                  onChange={(e) => {
                    const digits = onlyDigits(e.target.value);
                    const formatted = digits.length > 11
                      ? digits
                          .slice(0, 14)
                          .replace(/(\d{2})(\d)/, '$1.$2')
                          .replace(/(\d{3})(\d)/, '$1.$2')
                          .replace(/(\d{3})(\d)/, '$1/$2')
                          .replace(/(\d{4})(\d{1,2})$/, '$1-$2')
                      : formatCPF(digits);
                    setEditRecibo(prev => ({ ...prev, cpf: formatted }));
                  }}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              {/* Emitir em nome de outra pessoa (edição) */}
              <div className="border rounded-lg p-3 space-y-2">
                <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    className="h-4 w-4"
                    checked={editEmitirOutro || !!editRecibo.issuerName || !!editRecibo.issuerDocumento}
                    onChange={(e) => setEditEmitirOutro(e.target.checked)}
                  />
                  Emitir em nome de outra pessoa
                </label>
                {(editEmitirOutro || !!editRecibo.issuerName || !!editRecibo.issuerDocumento) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nome do emissor</label>
                      <input
                        type="text"
                        value={editRecibo.issuerName || ''}
                        onChange={(e) => setEditRecibo(prev => ({ ...prev, issuerName: e.target.value }))}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Nome completo"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Documento do emissor</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="000.000.000-00 ou 00.000.000/0000-00"
                        value={editRecibo.issuerDocumento || ''}
                        onChange={(e) => {
                          const digits = onlyDigits(e.target.value);
                          const formatted = digits.length > 11
                            ? digits
                                .slice(0, 14)
                                .replace(/(\d{2})(\d)/, '$1.$2')
                                .replace(/(\d{3})(\d)/, '$1.$2')
                                .replace(/(\d{3})(\d)/, '$1/$2')
                                .replace(/(\d{4})(\d{1,2})$/, '$1-$2')
                            : formatCPF(digits);
                          setEditRecibo(prev => ({ ...prev, issuerDocumento: formatted }));
                        }}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                )}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Assinatura do emissor (imagem)</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      let uploadFile = file;
                      const ext = (file.name.split('.').pop() || '').toLowerCase();
                      const isHeic = ext === 'heic' || ext === 'heif' || file.type === 'image/heic' || file.type === 'image/heif';
                      if (isHeic) {
                        try {
                          const heic2any = await import('heic2any');
                          // @ts-ignore
                          const conv = await (heic2any as any)({ blob: file, toType: 'image/jpeg' });
                          const blob: Blob = Array.isArray(conv) ? conv[0] : conv;
                          uploadFile = new File([blob], (file.name.replace(/\.[^.]+$/, '')||'assinatura')+'.jpg', { type: 'image/jpeg' });
                        } catch {}
                      }
                      const reader = new FileReader();
                      reader.onload = () => setEditRecibo(prev => ({ ...prev, signatureDataUrl: String(reader.result||'') }));
                      reader.readAsDataURL(uploadFile);
                    }}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                  <div className="mt-2">
                    <button type="button" onClick={() => { setShowSignCanvas('edit'); setCanvasKey(k => k + 1); }} className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg">Assinar no touch</button>
                  </div>
                  {editRecibo.signatureDataUrl && (
                    <img src={editRecibo.signatureDataUrl} alt="Assinatura do emissor" className="h-10 object-contain border rounded bg-white px-2 mt-2" />
                  )}
                </div>
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
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Emissão</label>
                  <input type="date" value={editRecibo.dataEmissao || ''} onChange={(e) => setEditRecibo(prev => ({ ...prev, dataEmissao: e.target.value }))} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select value={editRecibo.status || 'emitido'} onChange={(e) => setEditRecibo(prev => ({ ...prev, status: e.target.value as Recibo['status'] }))} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    <option value="emitido">Emitido</option>
                    <option value="enviado">Enviado</option>
                    <option value="pago">Pago</option>
                    <option value="vencido">Vencido</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Forma de Pagamento</label>
                  <select value={editRecibo.formaPagamento || ''} onChange={(e) => setEditRecibo(prev => ({ ...prev, formaPagamento: e.target.value }))} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    <option value="PIX">PIX</option>
                    <option value="Dinheiro">Dinheiro</option>
                    <option value="Transferência">Transferência</option>
                    <option value="Cartão">Cartão</option>
                    <option value="Outros">Outros</option>
                  </select>
                </div>
              </div>
              {/* Logo na edição (selecionar da conta) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Logo</label>
                <div className="flex items-center gap-3">
                  <input id="edit-use-logo" type="checkbox" checked={!!editRecibo.useLogo} onChange={(e) => setEditRecibo(prev => ({ ...prev, useLogo: e.target.checked }))} className="h-4 w-4" />
                  <label htmlFor="edit-use-logo" className="text-sm text-gray-700">Exibir logo da sua conta</label>
                </div>
                <div className="mt-2 flex items-center gap-3">
                  {logoOptions.length > 0 ? (
                    <>
                      <select
                        value={editRecibo.logoDataUrl || ''}
                        onChange={(e) => {
                          const v = e.target.value;
                          if (v === '__create_logo__') { navigate('/assinaturas'); return; }
                          setEditRecibo(prev => ({ ...prev, logoDataUrl: v || undefined }));
                        }}
                        className="px-3 py-2 border rounded-lg text-sm"
                        disabled={!editRecibo.useLogo}
                      >
                        <option value="">Selecione</option>
                        {logoOptions.map(opt => (
                          <option key={opt.path} value={opt.url}>{opt.name}</option>
                        ))}
                        <option value="__create_logo__">Cadastrar Nova Logo</option>
                      </select>
                      {(editRecibo.logoDataUrl || defaultLogoUrl) && (
                        <img src={(editRecibo.logoDataUrl || defaultLogoUrl) as string} alt="Logo" className="h-10 object-contain border rounded bg-white px-2" />
                      )}
                    </>
                  ) : (
                    <select
                      value={''}
                      onChange={(e) => { if (e.target.value === '__create_logo__') navigate('/assinaturas'); }}
                      className="px-3 py-2 border rounded-lg text-sm"
                      disabled={!editRecibo.useLogo}
                    >
                      <option value="__create_logo__">Cadastrar Nova Logo</option>
                    </select>
                  )}
                </div>
              </div>

              {/* Assinatura na edição (selecionar da conta) - desabilitada ao emitir em nome de outra pessoa */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Assinatura</label>
                  <div className="mt-1 flex items-center gap-3">
                  <input
                    id="edit-use-signature"
                    type="checkbox"
                    checked={editUseSignature && !editEmitirOutro}
                    onChange={(e) => {
                      setEditUseSignature(e.target.checked);
                      if (!e.target.checked) setEditRecibo(prev => ({ ...prev, signatureDataUrl: undefined }));
                    }}
                    className="h-4 w-4"
                    disabled={editEmitirOutro}
                  />
                  <label htmlFor="edit-use-signature" className="text-sm text-gray-700">Usar sua assinatura</label>
                  {signatureOptions.length > 0 ? (
                    <>
                      <select
                        value={editRecibo.signatureId || ''}
                        onChange={(e) => {
                          const id = e.target.value;
                          if (id === '__create_sig__') { navigate('/assinaturas'); return; }
                          const opt = signatureOptions.find(o => o.id === id);
                          setEditRecibo(prev => ({ ...prev, signatureId: id || undefined, signatureDataUrl: opt?.url }));
                        }}
                        className="px-3 py-2 border rounded-lg text-sm"
                        disabled={!editUseSignature || editEmitirOutro}
                      >
                        <option value="">Selecione</option>
                        {signatureOptions.map(opt => (
                          <option key={opt.id} value={opt.id}>{opt.name}</option>
                        ))}
                        <option value="__create_sig__">Cadastrar Nova Assinatura</option>
                      </select>
                      {(!editEmitirOutro && editUseSignature) && (editRecibo.signatureDataUrl || defaultSignatureUrl) && (
                        <img src={(editRecibo.signatureDataUrl || defaultSignatureUrl) as string} alt="Assinatura" className="h-10 object-contain border rounded bg-white px-2" />
                      )}
                    </>
                  ) : (
                    <select
                      value={''}
                      onChange={(e) => { if (e.target.value === '__create_sig__') navigate('/assinaturas'); }}
                      className="px-3 py-2 border rounded-lg text-sm"
                      disabled={!editUseSignature || editEmitirOutro}
                    >
                      <option value="">Selecione</option>
                      <option value="__create_sig__">Cadastrar Nova Assinatura</option>
                    </select>
                  )}
                </div>
              </div>
              <p className="mt-1 text-xs text-gray-500">A assinatura será exibida na impressão do recibo acima da linha de assinatura.</p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                <textarea value={editRecibo.descricao || ''} onChange={(e) => setEditRecibo(prev => ({ ...prev, descricao: e.target.value }))} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" rows={3} />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowEditRecibo(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Salvar</button>
              </div>
            </form>
            </div>
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
                placeholder="Buscar por cliente, número ou descrição..."
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
                <option value="emitido">Emitido</option>
                <option value="enviado">Enviado</option>
                <option value="pago">Pago</option>
                <option value="vencido">Vencido</option>
                <option value="suspenso">Suspenso</option>
                <option value="revogado">Revogado</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Lista responsiva (mobile) */}
      <div className="md:hidden space-y-3">
        {filteredRecibos.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border p-6 text-center">
            <div className="text-gray-500">
              <CreditCard className="w-12 h-12 mx-auto mb-4" />
              <p className="text-lg font-medium">Nenhum recibo encontrado</p>
              <p className="text-sm">Tente ajustar os filtros ou criar um novo recibo.</p>
            </div>
          </div>
        ) : (
          filteredRecibos.map((recibo) => (
            <details key={recibo.id} className="bg-white rounded-lg shadow-sm border">
              <summary className="list-none cursor-pointer p-4 flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{recibo.numero}</p>
                  <p className="text-sm text-gray-500 truncate">{recibo.cliente}</p>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-sm font-semibold text-gray-900">R$ {recibo.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                  <span className={cn('inline-flex px-2 py-1 text-xs font-semibold rounded-full', getStatusColor(recibo.status))}>
                    {getStatusLabel(recibo.status)}
                  </span>
                </div>
              </summary>
              <div className="px-4 pt-2 pb-4 border-t text-sm text-gray-700 space-y-2">
                <div className="flex justify-between gap-3"><span className="text-gray-500">Emissão</span><span>{new Date(recibo.dataEmissao).toLocaleDateString('pt-BR')}</span></div>
                {recibo.formaPagamento && (
                  <div className="flex justify-between gap-3"><span className="text-gray-500">Forma</span><span>{recibo.formaPagamento}</span></div>
                )}
                {recibo.descricao && (
                  <div className="flex justify-between gap-3"><span className="text-gray-500">Descrição</span><span className="text-right truncate">{recibo.descricao}</span></div>
                )}
                <div className="pt-2 flex items-center justify-end gap-2">
                  <button onClick={() => handleViewRecibo(recibo)} className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50" title="Visualizar">
                    <Eye className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDownloadRecibo(recibo)} className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50" title="Download">
                    <Download className="w-4 h-4" />
                  </button>
                  {recibo.status !== 'pago' && (
                    <button onClick={() => updateReciboStatus(recibo, 'pago')} className="text-green-700 hover:text-green-900 p-1 rounded hover:bg-green-50" title="Dar baixa (pago)">
                      <CheckCircle className="w-4 h-4" />
                    </button>
                  )}
                  {recibo.status !== 'suspenso' && (
                    <button onClick={() => updateReciboStatus(recibo, 'suspenso')} className="text-orange-600 hover:text-orange-800 p-1 rounded hover:bg-orange-50" title="Suspender">
                      <PauseCircle className="w-4 h-4" />
                    </button>
                  )}
                  {recibo.status !== 'revogado' && (
                    <button onClick={() => updateReciboStatus(recibo, 'revogado')} className="text-gray-700 hover:text-gray-900 p-1 rounded hover:bg-gray-100" title="Revogar">
                      <Ban className="w-4 h-4" />
                    </button>
                  )}
                  {recibo.status === 'emitido' && (
                    <button onClick={() => handleShareRecibo(recibo)} className="text-purple-600 hover:text-purple-900 p-1 rounded hover:bg-purple-50" title="Enviar">
                      <Send className="w-4 h-4" />
                    </button>
                  )}
                  <button onClick={() => handleEditReciboOpen(recibo)} className="text-gray-600 hover:text-gray-900 p-1 rounded hover:bg-gray-50" title="Editar">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button onClick={() => openDeleteRecibo(recibo)} className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50" title="Excluir">
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
                  Valor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Emissão
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
              {filteredRecibos.map((recibo) => (
                <tr key={recibo.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {recibo.numero}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {recibo.cliente}
                      </div>
                      <div className="text-sm text-gray-500 truncate max-w-xs">
                        {recibo.descricao}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div>
                      <div className="font-medium">
                        R$ {recibo.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </div>
                      {recibo.formaPagamento && (
                        <div className="text-xs text-gray-500">
                          {recibo.formaPagamento}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(recibo.dataEmissao).toLocaleDateString('pt-BR')}
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={cn(
                      'inline-flex px-2 py-1 text-xs font-semibold rounded-full',
                      getStatusColor(recibo.status)
                    )}>
                      {getStatusLabel(recibo.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button onClick={() => handleViewRecibo(recibo)} className="text-blue-600 hover:text-blue-900" title="Visualizar">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDownloadRecibo(recibo)} className="text-green-600 hover:text-green-900" title="Download">
                        <Download className="w-4 h-4" />
                      </button>
                      {recibo.status !== 'pago' && (
                        <button onClick={() => updateReciboStatus(recibo, 'pago')} className="text-green-700 hover:text-green-900" title="Dar baixa (pago)">
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      )}
                      {recibo.status !== 'suspenso' && (
                        <button onClick={() => updateReciboStatus(recibo, 'suspenso')} className="text-orange-600 hover:text-orange-800" title="Suspender">
                          <PauseCircle className="w-4 h-4" />
                        </button>
                      )}
                      {recibo.status !== 'revogado' && (
                        <button onClick={() => updateReciboStatus(recibo, 'revogado')} className="text-gray-700 hover:text-gray-900" title="Revogar">
                          <Ban className="w-4 h-4" />
                        </button>
                      )}
                      {recibo.status === 'emitido' && (
                        <button onClick={() => handleShareRecibo(recibo)} className="text-purple-600 hover:text-purple-900" title="Enviar">
                          <Send className="w-4 h-4" />
                        </button>
                      )}
                      <button onClick={() => handleEditReciboOpen(recibo)} className="text-gray-600 hover:text-gray-900" title="Editar">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => openDeleteRecibo(recibo)} className="text-red-600 hover:text-red-900" title="Excluir">
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

      {showDeleteRecibo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={cancelDeleteRecibo} />
          <div className="relative z-10 bg-white rounded-lg shadow-lg w-full max-w-md p-6">
            <button className="absolute top-3 right-3 text-gray-500 hover:text-gray-700" onClick={cancelDeleteRecibo} aria-label="Fechar">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Confirmar exclusão</h3>
            <p className="text-sm text-gray-600 mb-3">
              Esta ação é irreversível. Para excluir o recibo <strong>{deleteTargetRecibo?.numero}</strong>, confirme sua senha.
            </p>
            <input
              type="password"
              placeholder="Sua senha"
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-2"
            />
            {deleteError && <div className="text-sm text-red-600 mb-2">{deleteError}</div>}
            <div className="flex justify-end gap-2">
              <button onClick={cancelDeleteRecibo} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50" disabled={deleteLoading}>Cancelar</button>
              <button onClick={confirmDeleteRecibo} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50" disabled={deleteLoading || !deletePassword}>
                {deleteLoading ? 'Excluindo...' : 'Excluir definitivamente'}
              </button>
            </div>
          </div>
        </div>
      )}

      {filteredRecibos.length === 0 && (
        <div className="hidden md:block text-center py-12">
          <div className="text-gray-500">
            <CreditCard className="w-12 h-12 mx-auto mb-4" />
            <p className="text-lg font-medium">Nenhum recibo encontrado</p>
            <p className="text-sm">Tente ajustar os filtros ou criar um novo recibo.</p>
          </div>
        </div>
      )}

      {/* Modal: Assinatura por touch */}
      {showSignCanvas && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-10">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowSignCanvas(false)} />
          <div className="relative z-10 bg-white rounded-lg shadow-lg w-full max-w-lg p-6">
            <button className="absolute top-3 right-3 text-gray-500 hover:text-gray-700" onClick={() => setShowSignCanvas(false)} aria-label="Fechar">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Assinar no touch</h3>
            <div className="border rounded-lg bg-white">
              <div className="h-64">
                <canvas id="signature-canvas" key={canvasKey} className="w-full h-full" />
              </div>
            </div>
            <div className="flex justify-between gap-2 mt-4">
              <button type="button" onClick={() => setCanvasKey(k => k + 1)} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">Limpar</button>
              <div className="flex gap-2">
                <button type="button" onClick={() => setShowSignCanvas(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">Cancelar</button>
                <button type="button" onClick={() => {
                  const canvas = document.getElementById('signature-canvas') as HTMLCanvasElement | null;
                  if (!canvas) return;
                  const dataUrl = canvas.toDataURL('image/png');
                  if (showSignCanvas === 'novo') {
                    setNovoRecibo(prev => ({ ...prev, signatureDataUrl: dataUrl }));
                  } else {
                    setEditRecibo(prev => ({ ...prev, signatureDataUrl: dataUrl }));
                  }
                  setShowSignCanvas(false);
                }} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Usar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Recibos;