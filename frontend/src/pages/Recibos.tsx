// Autor: David Assef
// Descrição: Página de gerenciamento de recibos
// Data: 05-09-2025
// MIT License

import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
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

interface Recibo {
  id: string;
  numero: string;
  cliente: string;
  valor: number;
  dataEmissao: string;
  dataVencimento: string;
  status: 'emitido' | 'enviado' | 'pago' | 'vencido' | 'suspenso' | 'revogado';
  descricao: string;
  formaPagamento?: string;
  useLogo?: boolean;
  logoDataUrl?: string; // Logo personalizada por recibo (base64/dataURL)
  cpf?: string; // CPF do cliente (opcional)
  signatureDataUrl?: string; // Assinatura anexada (base64/dataURL)
}

const mockRecibos: Recibo[] = [
  {
    id: '1',
    numero: 'RB-001',
    cliente: 'João Silva',
    valor: 500.00,
    dataEmissao: '2025-01-15',
    dataVencimento: '2025-01-30',
    status: 'pago',
    descricao: 'Consultoria em TI - Janeiro 2025',
    formaPagamento: 'PIX'
  },
  {
    id: '2',
    numero: 'RB-002',
    cliente: 'Maria Santos',
    valor: 750.00,
    dataEmissao: '2025-01-18',
    dataVencimento: '2025-02-02',
    status: 'enviado',
    descricao: 'Desenvolvimento de sistema - Fase 1'
  },
  {
    id: '3',
    numero: 'RB-003',
    cliente: 'Pedro Costa',
    valor: 300.00,
    dataEmissao: '2025-01-10',
    dataVencimento: '2025-01-25',
    status: 'vencido',
    descricao: 'Manutenção de software'
  },
  {
    id: '4',
    numero: 'RB-004',
    cliente: 'Ana Oliveira',
    valor: 1200.00,
    dataEmissao: '2025-01-20',
    dataVencimento: '2025-02-05',
    status: 'emitido',
    descricao: 'Consultoria estratégica'
  }
];

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
  const [recibos, setRecibos] = useState<Recibo[]>(mockRecibos);
  const [showNovoRecibo, setShowNovoRecibo] = useState(false);
  const [novoRecibo, setNovoRecibo] = useState<Partial<Recibo>>({
    numero: '',
    cliente: '',
    valor: 0,
    dataEmissao: '',
    dataVencimento: '',
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
  // Opções armazenadas do usuário
  const [logoOptions, setLogoOptions] = useState<Array<{ path: string; url: string; name: string }>>([]);
  const [signatureOptions, setSignatureOptions] = useState<Array<{ path: string; url: string; name: string }>>([]);
  const [printWithLogo, setPrintWithLogo] = useState<boolean>(false);
  const [novoValorInput, setNovoValorInput] = useState<string>('');
  const [editValorInput, setEditValorInput] = useState<string>('');
  const location = useLocation() as any;

  const filteredRecibos = recibos.filter(recibo => {
    const matchesSearch = recibo.cliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         recibo.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         recibo.descricao.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'todos' || recibo.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalRecibos = filteredRecibos.reduce((sum, recibo) => sum + recibo.valor, 0);
  const recibosPagos = filteredRecibos.filter(r => r.status === 'pago').length;
  const recibosVencidos = filteredRecibos.filter(r => r.status === 'vencido').length;

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

  // Carregar logo padrão do usuário a partir do user_metadata.default_logo_path
  useEffect(() => {
    const loadDefaultLogo = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
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
        if (!path) { setDefaultSignatureUrl(null); return; }
        const { data: signed } = await supabase.storage.from('signatures').createSignedUrl(path, 60 * 60);
        setDefaultSignatureUrl(signed?.signedUrl || null);
      } catch (e) {
        console.warn('Não foi possível carregar a assinatura padrão:', e);
        setDefaultSignatureUrl(null);
      }
    };
    loadDefaultSignature();
  }, []);

  // Prefill de recibo ao navegar a partir de Contratos
  useEffect(() => {
    const s = (location && location.state) as any;
    if (s && s.prefillRecibo) {
      const p = s.prefillRecibo;
      setShowNovoRecibo(true);
      setNovoRecibo(prev => ({
        ...prev,
        cliente: p.cliente || prev.cliente || '',
        cpf: p.documento || prev.cpf || '',
        signatureDataUrl: p.signatureUrl || prev.signatureDataUrl || defaultSignatureUrl || undefined,
        useLogo: typeof p.useLogo === 'boolean' ? p.useLogo : (prev.useLogo ?? !!defaultLogoUrl),
        logoDataUrl: p.logoUrl || prev.logoDataUrl,
        descricao: p.descricao || prev.descricao,
        formaPagamento: p.formaPagamento || prev.formaPagamento,
        dataEmissao: p.dataEmissao || prev.dataEmissao,
        dataVencimento: p.dataVencimento || prev.dataVencimento,
      }));
      if (p.valor) {
        const formatter = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        setNovoValorInput(formatter.format(p.valor));
      }
      // limpa o state de navegação
      if (window.history?.replaceState) {
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, [location.state, defaultSignatureUrl, defaultLogoUrl]);
  // Carrega a lista de arquivos de assinatura e logo do usuário ao abrir modais
  useEffect(() => {
    const loadAssets = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        // List signatures (diretório raiz do usuário e subpasta signatures)
        const sigOptions: Array<{ path: string; url: string; name: string }> = [];
        const rootPath = `${user.id}`;
        const sigPath = `${user.id}/signatures`;
        const { data: sigRootList } = await supabase.storage.from('signatures').list(rootPath, { limit: 100, sortBy: { column: 'created_at', order: 'desc' } as any });
        const { data: sigSubList } = await supabase.storage.from('signatures').list(sigPath, { limit: 100, sortBy: { column: 'created_at', order: 'desc' } as any });
        const addSigned = async (basePath: string, files: any[] | null | undefined) => {
          if (!files) return;
          for (const f of files) {
            if (!f.name) continue;
            const full = `${basePath}/${f.name}`;
            const { data: s } = await supabase.storage.from('signatures').createSignedUrl(full, 60 * 60);
            if (s?.signedUrl) sigOptions.push({ path: full, url: s.signedUrl, name: f.name });
          }
        };
        await addSigned(rootPath, sigRootList);
        await addSigned(sigPath, sigSubList);
        setSignatureOptions(sigOptions);

        // List logos (diretório raiz e subpasta branding)
        const logoOpts: Array<{ path: string; url: string; name: string }> = [];
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

  const handleCreateRecibo = (e: React.FormEvent) => {
    e.preventDefault();
    const id = (window.crypto && 'randomUUID' in window.crypto) ? window.crypto.randomUUID() : String(Date.now());
    const numero = (novoRecibo.numero && novoRecibo.numero.trim()) || `RB-${String(recibos.length + 1).padStart(3, '0')}`;
    const cliente = (novoRecibo.cliente || '').trim() || 'Cliente';
    const valor = parseCurrencyBRToNumber(novoValorInput);
    const hojeISO = new Date().toISOString().slice(0,10);
    const emissao = (novoRecibo.dataEmissao && novoRecibo.dataEmissao) || hojeISO;
    const venc = (novoRecibo.dataVencimento && novoRecibo.dataVencimento) || hojeISO;
    const novo: Recibo = {
      id,
      numero,
      cliente,
      valor,
      dataEmissao: emissao,
      dataVencimento: venc,
      status: (novoRecibo.status as Recibo['status']) || 'emitido',
      descricao: novoRecibo.descricao || '',
      formaPagamento: novoRecibo.formaPagamento,
      useLogo: !!novoRecibo.useLogo,
      logoDataUrl: novoRecibo.logoDataUrl,
      cpf: novoRecibo.cpf || undefined,
      signatureDataUrl: novoRecibo.signatureDataUrl || undefined
    };
    setRecibos(prev => [novo, ...prev]);
    setShowNovoRecibo(false);
    setNovoRecibo({ numero: '', cliente: '', valor: 0, dataEmissao: '', dataVencimento: '', status: 'emitido', descricao: '', formaPagamento: 'PIX' });
    setNovoValorInput('');
  };

  const handleViewRecibo = (recibo: Recibo) => {
    setReciboSelecionado(recibo);
    setShowViewRecibo(true);
    setPrintWithLogo(!!recibo.useLogo || !!defaultLogoUrl);
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
        .title{font-size:32px;font-weight:800;letter-spacing:.5px}
        .head-right{font-weight:700;text-align:right;}
        .head-right div{line-height:1.2}
        .panel{padding:16px;background:#fff}
        .text{line-height:1.7;text-align:justify}
        .strong{font-weight:700}
        .muted{color:var(--muted)}
        .center{ text-align:center }
        .signature{ margin-top:40px; display:flex; flex-direction:column; align-items:center }
        .signature img{ max-height:80px; object-fit:contain; margin-bottom:8px }
        .line{ width:60%; border-top:1px solid var(--border); margin-top:28px }
        .logo{ max-height:42px; object-fit:contain; margin-right:12px }
        @media print{ body{margin:0} }
      </style>
    `;
    const numero = recibo.numero || '';
    const valorBR = `R$ ${recibo.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
    const valorExtenso = numeroPorExtensoBRL(recibo.valor).toUpperCase();
    const cliente = (recibo.cliente || '').trim();
    const cpf = (recibo.cpf || '').trim();
    const descricao = (recibo.descricao || '').trim();
    const dataEmissao = recibo.dataEmissao ? new Date(recibo.dataEmissao) : null;
    const dataBR = dataEmissao ? dataEmissao.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }) : '';

    const linhaIdent = cliente ? `Eu, <span class="strong">${cliente}</span>${cpf ? `, CPF nº <span class="strong">${cpf}</span>` : ''}, declaro ter recebido nesta data a quantia de: <span class="strong">${valorBR}</span> (<span class="strong">${valorExtenso}</span>).` : '';
    const linhaRef = descricao ? `Referente a: <span class="strong">${descricao}</span>.` : '';

    return `
      <html>
        <head><meta charset="utf-8">${style}<title>Recibo ${numero}</title></head>
        <body>
          <div class="wrap">
            <div class="head">
              <div style="display:flex; align-items:center">
                ${logoUrl ? `<img class="logo" src="${logoUrl}" alt="Logo" />` : ''}
                <div class="title">RECIBO</div>
              </div>
              <div class="head-right">
                ${numero ? `<div>Nº: ${numero}</div>` : ''}
                <div>VALOR: ${valorBR}</div>
              </div>
            </div>
            <div class="panel">
              <div class="text">
                ${linhaIdent}
                ${linhaRef ? `<br/><br/>${linhaRef}` : ''}
              </div>
              <div class="muted" style="margin-top:16px">E para maior clareza, afirmo o presente.</div>
              ${dataBR ? `<div class="center" style="margin-top:28px">${dataBR}</div>` : ''}
              <div class="signature">
                ${recibo.signatureDataUrl ? `<img src="${recibo.signatureDataUrl}" alt="Assinatura" />` : ''}
                <div class="line"></div>
                <div class="muted" style="margin-top:8px">Assinatura</div>
              </div>
            </div>
          </div>
          <script>window.onload = () => { window.print(); };</script>
        </body>
      </html>`;
  };

  const handleDownloadRecibo = (recibo: Recibo) => {
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.open();
    win.document.write(generatePrintableHtml(recibo));
    win.document.close();
  };

  const handleShareRecibo = async (recibo: Recibo) => {
    const text = `Recibo ${recibo.numero}\nCliente: ${recibo.cliente}\nValor: R$ ${recibo.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\nStatus: ${getStatusLabel(recibo.status)}\nEmissão: ${new Date(recibo.dataEmissao).toLocaleDateString('pt-BR')}\nVencimento: ${new Date(recibo.dataVencimento).toLocaleDateString('pt-BR')}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: `Recibo ${recibo.numero}`, text });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(text);
        alert('Resumo do recibo copiado para a área de transferência.');
      } else {
        alert(text);
      }
    } catch (e) {
      console.warn('Falha ao compartilhar:', e);
    }
  };

  const handleEditReciboOpen = (recibo: Recibo) => {
    setReciboSelecionado(recibo);
    setEditRecibo({ ...recibo });
    setEditValorInput(formatNumberToCurrencyBR(recibo.valor));
    setShowEditRecibo(true);
  };

  const handleEditReciboSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reciboSelecionado) return;
    const novoValor = parseCurrencyBRToNumber(editValorInput);
    setRecibos(prev => prev.map(r => r.id === reciboSelecionado.id ? {
      ...r,
      numero: (editRecibo.numero || r.numero)!,
      cliente: (editRecibo.cliente || r.cliente)!,
      valor: isNaN(novoValor) ? r.valor : novoValor,
      dataEmissao: (editRecibo.dataEmissao || r.dataEmissao)!,
      dataVencimento: (editRecibo.dataVencimento || r.dataVencimento)!,
      status: (editRecibo.status as Recibo['status']) || r.status,
      descricao: editRecibo.descricao ?? r.descricao,
      formaPagamento: editRecibo.formaPagamento ?? r.formaPagamento,
      useLogo: typeof editRecibo.useLogo === 'boolean' ? editRecibo.useLogo : r.useLogo,
      logoDataUrl: editRecibo.logoDataUrl ?? r.logoDataUrl,
      cpf: typeof editRecibo.cpf === 'string' ? editRecibo.cpf : r.cpf,
      signatureDataUrl: editRecibo.signatureDataUrl ?? r.signatureDataUrl,
    } : r));
    setShowEditRecibo(false);
    setReciboSelecionado(null);
    setEditRecibo({});
    setEditValorInput('');
  };

  const handleDeleteRecibo = (recibo: Recibo) => {
    if (window.confirm(`Excluir o recibo ${recibo.numero}?`)) {
      setRecibos(prev => prev.filter(r => r.id !== recibo.id));
    }
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
            <div className="p-3 bg-red-100 rounded-full">
              <Calendar className="w-6 h-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Vencidos</p>
              <p className="text-2xl font-bold text-gray-900">
                {recibosVencidos}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowNovoRecibo(false)} />
          <div className="relative bg-white rounded-lg shadow-lg w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <button className="absolute top-3 right-3 text-gray-500 hover:text-gray-700" onClick={() => setShowNovoRecibo(false)} aria-label="Fechar">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Novo Recibo</h3>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Emissão</label>
                  <input type="date" value={novoRecibo.dataEmissao || ''} onChange={(e) => setNovoRecibo(prev => ({ ...prev, dataEmissao: e.target.value }))} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Vencimento</label>
                  <input type="date" value={novoRecibo.dataVencimento || ''} onChange={(e) => setNovoRecibo(prev => ({ ...prev, dataVencimento: e.target.value }))} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
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
                  <label htmlFor="novo-use-logo" className="text-sm text-gray-700">Exibir logo da sua conta</label>
                </div>
                <div className="mt-2 flex items-center gap-3">
                  <select
                    value={novoRecibo.logoDataUrl || ''}
                    onChange={(e) => setNovoRecibo(prev => ({ ...prev, logoDataUrl: e.target.value || undefined }))}
                    className="px-3 py-2 border rounded-lg text-sm"
                    disabled={!novoRecibo.useLogo}
                  >
                    <option value="">Padrão da conta</option>
                    {logoOptions.map(opt => (
                      <option key={opt.path} value={opt.url}>{opt.name}</option>
                    ))}
                  </select>
                  {(novoRecibo.logoDataUrl || defaultLogoUrl) ? (
                    <img src={(novoRecibo.logoDataUrl || defaultLogoUrl) as string} alt="Logo padrão" className="h-10 object-contain border rounded bg-white px-2" />
                  ) : (
                    <span className="text-xs text-gray-500">Nenhuma logo cadastrada. Cadastre em Perfil.</span>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                <textarea value={novoRecibo.descricao || ''} onChange={(e) => setNovoRecibo(prev => ({ ...prev, descricao: e.target.value }))} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" rows={3} />
              </div>
              {/* Assinatura (selecionar da conta) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Assinatura</label>
                <div className="mt-1 flex items-center gap-3">
                  <input id="novo-use-signature" type="checkbox" checked={!!novoRecibo.signatureDataUrl || !!defaultSignatureUrl} onChange={(e) => setNovoRecibo(prev => ({ ...prev, signatureDataUrl: e.target.checked ? (defaultSignatureUrl || undefined) : undefined }))} className="h-4 w-4" />
                  <label htmlFor="novo-use-signature" className="text-sm text-gray-700">Incluir assinatura</label>
                  <select
                    value={novoRecibo.signatureDataUrl || ''}
                    onChange={(e) => setNovoRecibo(prev => ({ ...prev, signatureDataUrl: e.target.value || undefined }))}
                    className="px-3 py-2 border rounded-lg text-sm"
                    disabled={signatureOptions.length === 0}
                  >
                    <option value="">Padrão da conta</option>
                    {signatureOptions.map(opt => (
                      <option key={opt.path} value={opt.url}>{opt.name}</option>
                    ))}
                  </select>
                  {novoRecibo.signatureDataUrl ? (
                    <img src={novoRecibo.signatureDataUrl as string} alt="Assinatura" className="h-10 object-contain border rounded bg-white px-2" />
                  ) : defaultSignatureUrl ? (
                    <img src={defaultSignatureUrl} alt="Assinatura padrão" className="h-10 object-contain border rounded bg-white px-2" />
                  ) : (
                    <span className="text-xs text-gray-500">Nenhuma assinatura cadastrada. Cadastre em Perfil.</span>
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
      )}

      {/* Modais de gerenciamento foram removidos. Gestão de logo e assinatura fica na página de Perfil. */}

      {/* Modal: Visualizar Recibo */}
      {showViewRecibo && reciboSelecionado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowViewRecibo(false)} />
          <div className="relative bg-white rounded-lg shadow-lg w-full max-w-md p-6">
            <button className="absolute top-3 right-3 text-gray-500 hover:text-gray-700" onClick={() => setShowViewRecibo(false)} aria-label="Fechar">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{reciboSelecionado.numero}</h3>
            <div className="space-y-2 text-sm text-gray-700">
              <div className="flex justify-between"><span className="text-gray-500">Cliente</span><span className="font-medium">{reciboSelecionado.cliente}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Valor</span><span className="font-medium">R$ {reciboSelecionado.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Emissão</span><span>{new Date(reciboSelecionado.dataEmissao).toLocaleDateString('pt-BR')}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Vencimento</span><span>{new Date(reciboSelecionado.dataVencimento).toLocaleDateString('pt-BR')}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Status</span><span className={cn('inline-flex px-2 py-1 text-xs font-semibold rounded-full', getStatusColor(reciboSelecionado.status))}>{getStatusLabel(reciboSelecionado.status)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">CPF</span><span>{reciboSelecionado.cpf && reciboSelecionado.cpf.trim() ? reciboSelecionado.cpf : 'Não informado'}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Forma</span><span>{reciboSelecionado.formaPagamento && reciboSelecionado.formaPagamento.trim() ? reciboSelecionado.formaPagamento : 'Não informado'}</span></div>
              <div>
                <div className="text-gray-500">Descrição</div>
                <div className="mt-1">{reciboSelecionado.descricao && reciboSelecionado.descricao.trim() ? reciboSelecionado.descricao : 'Não informado'}</div>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowEditRecibo(false)} />
          <div className="relative bg-white rounded-lg shadow-lg w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <button className="absolute top-3 right-3 text-gray-500 hover:text-gray-700" onClick={() => setShowEditRecibo(false)} aria-label="Fechar">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Editar Recibo</h3>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Emissão</label>
                  <input type="date" value={editRecibo.dataEmissao || ''} onChange={(e) => setEditRecibo(prev => ({ ...prev, dataEmissao: e.target.value }))} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Vencimento</label>
                  <input type="date" value={editRecibo.dataVencimento || ''} onChange={(e) => setEditRecibo(prev => ({ ...prev, dataVencimento: e.target.value }))} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
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
                  <select
                    value={editRecibo.logoDataUrl || ''}
                    onChange={(e) => setEditRecibo(prev => ({ ...prev, logoDataUrl: e.target.value || undefined }))}
                    className="px-3 py-2 border rounded-lg text-sm"
                    disabled={!editRecibo.useLogo}
                  >
                    <option value="">Padrão da conta</option>
                    {logoOptions.map(opt => (
                      <option key={opt.path} value={opt.url}>{opt.name}</option>
                    ))}
                  </select>
                  {(editRecibo.logoDataUrl || defaultLogoUrl) ? (
                    <img src={(editRecibo.logoDataUrl || defaultLogoUrl) as string} alt="Logo" className="h-10 object-contain border rounded bg-white px-2" />
                  ) : (
                    <span className="text-xs text-gray-500">Nenhuma logo cadastrada. Cadastre em Perfil.</span>
                  )}
                </div>
              </div>

              {/* Assinatura na edição (selecionar da conta) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Assinatura</label>
                <div className="mt-1 flex items-center gap-3">
                  <input id="edit-use-signature" type="checkbox" checked={!!editRecibo.signatureDataUrl || !!defaultSignatureUrl} onChange={(e) => setEditRecibo(prev => ({ ...prev, signatureDataUrl: e.target.checked ? (defaultSignatureUrl || undefined) : undefined }))} className="h-4 w-4" />
                  <label htmlFor="edit-use-signature" className="text-sm text-gray-700">Incluir assinatura</label>
                  <select
                    value={editRecibo.signatureDataUrl || ''}
                    onChange={(e) => setEditRecibo(prev => ({ ...prev, signatureDataUrl: e.target.value || undefined }))}
                    className="px-3 py-2 border rounded-lg text-sm"
                    disabled={signatureOptions.length === 0}
                  >
                    <option value="">Padrão da conta</option>
                    {signatureOptions.map(opt => (
                      <option key={opt.path} value={opt.url}>{opt.name}</option>
                    ))}
                  </select>
                  {editRecibo.signatureDataUrl ? (
                    <img src={editRecibo.signatureDataUrl as string} alt="Assinatura" className="h-10 object-contain border rounded bg-white px-2" />
                  ) : defaultSignatureUrl ? (
                    <img src={defaultSignatureUrl} alt="Assinatura padrão" className="h-10 object-contain border rounded bg-white px-2" />
                  ) : (
                    <span className="text-xs text-gray-500">Nenhuma assinatura cadastrada. Cadastre em Perfil.</span>
                  )}
                </div>
                <p className="mt-1 text-xs text-gray-500">A assinatura será exibida na impressão do recibo acima da linha de assinatura.</p>
              </div>
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
                <div className="flex justify-between gap-3"><span className="text-gray-500">Vencimento</span><span>{new Date(recibo.dataVencimento).toLocaleDateString('pt-BR')}</span></div>
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
                  <button onClick={() => handleDeleteRecibo(recibo)} className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50" title="Excluir">
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
                  Vencimento
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
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(recibo.dataVencimento).toLocaleDateString('pt-BR')}
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
                      <button onClick={() => handleDeleteRecibo(recibo)} className="text-red-600 hover:text-red-900" title="Excluir">
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

      {filteredRecibos.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-500">
            <CreditCard className="w-12 h-12 mx-auto mb-4" />
            <p className="text-lg font-medium">Nenhum recibo encontrado</p>
            <p className="text-sm">Tente ajustar os filtros ou criar um novo recibo.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Recibos;