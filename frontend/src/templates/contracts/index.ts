// Autor: David Assef
// Descrição: Templates de contratos por tipo (prestação de serviços, locação, etc.)
// Data: 13-09-2025
// MIT License

/**
 * Tipos e utilitários para geração de modelos de contrato.
 * As funções retornam labels e blocos de cláusulas padrão para cada tipo.
 * Os textos são baseados em modelos públicos (Sebrae/CRECI) e servem como ponto de partida.
 * Não substituem orientação jurídica especializada.
 */

export type ClausulaBasica = { titulo: string; conteudo: string };

export interface ContractTemplate {
  key: string;
  /** Título do contrato mostrado no cabeçalho */
  title: (numero?: string) => string;
  /** Papel do cliente (ex.: Contratante, Locatário) */
  clientRoleLabel: string;
  /** Papel do usuário do app (ex.: Contratado, Locador) */
  userRoleLabel: string;
  /**
   * Texto padrão para o objeto do contrato quando o usuário não informar
   */
  fallbackObjectText: (ctx?: { tipo?: string }) => string;
  /** Cláusulas padrão quando nenhuma for fornecida pelo usuário */
  defaultClauses: (ctx?: { tipo?: string }) => ClausulaBasica[];
}

const servicosTemplate: ContractTemplate = {
  key: 'servicos',
  title: (numero) => `Contrato de Prestação de Serviços nº ${numero || ''}`.trim(),
  clientRoleLabel: 'Contratante',
  userRoleLabel: 'Contratado',
  fallbackObjectText: () =>
    'As partes acordam a prestação de serviços conforme especificações fornecidas pelo contratante, com observância das condições estabelecidas neste instrumento.',
  defaultClauses: () => [
    {
      titulo: 'Objeto e Escopo',
      conteudo:
        'O presente contrato tem por objeto a prestação dos serviços descritos no objeto, podendo incluir etapas, entregas e marcos definidos entre as partes.'
    },
    {
      titulo: 'Prazo de Execução',
      conteudo:
        'Os serviços serão executados no prazo acordado entre as partes, podendo ser ajustado por escrito em caso de necessidade superveniente.'
    },
    {
      titulo: 'Remuneração e Pagamento',
      conteudo:
        'A remuneração devida ao CONTRATADO será paga conforme as condições combinadas, podendo contemplar adiantamentos, parcelas ou pagamento contra entrega.'
    },
    {
      titulo: 'Obrigações das Partes',
      conteudo:
        'Compete ao CONTRATADO executar os serviços com diligência e qualidade; ao CONTRATANTE, fornecer informações e insumos necessários, bem como efetuar os pagamentos devidos.'
    },
    {
      titulo: 'Rescisão',
      conteudo:
        'O presente instrumento poderá ser rescindido por qualquer das partes em caso de descumprimento contratual, mediante notificação por escrito, sem prejuízo das penalidades cabíveis.'
    },
    {
      titulo: 'Foro',
      conteudo:
        'Para dirimir quaisquer controvérsias oriundas deste contrato, as partes elegem o foro da comarca do CONTRATADO, com renúncia de qualquer outro, por mais privilegiado que seja.'
    }
  ]
};

const locacaoTemplate: ContractTemplate = {
  key: 'locacao',
  title: (numero) => `Contrato de Locação nº ${numero || ''}`.trim(),
  clientRoleLabel: 'Locatário',
  userRoleLabel: 'Locador',
  fallbackObjectText: () =>
    'As partes ajustam a locação do bem descrito, observando as condições, prazos e responsabilidades estabelecidas neste contrato.',
  defaultClauses: () => [
    {
      titulo: 'Objeto da Locação',
      conteudo:
        'Constitui objeto deste contrato a locação do bem descrito, entregue ao LOCATÁRIO em condições de uso e conservação adequadas.'
    },
    {
      titulo: 'Prazo da Locação',
      conteudo:
        'O prazo de locação é o estabelecido entre as partes, podendo ser renovado mediante acordo por escrito.'
    },
    {
      titulo: 'Aluguel e Encargos',
      conteudo:
        'O LOCATÁRIO pagará o aluguel no valor e na periodicidade ajustados, além dos encargos ordinários de uso. O reajuste, quando aplicável, observará o índice acordado entre as partes.'
    },
    {
      titulo: 'Conservação e Vistoria',
      conteudo:
        'O LOCATÁRIO se compromete a zelar pelo bem, responsabilizando-se por danos decorrentes de mau uso. A vistoria poderá ser realizada na entrega e na devolução.'
    },
    {
      titulo: 'Rescisão e Multas',
      conteudo:
        'O descumprimento das obrigações contratuais sujeita a parte infratora às penalidades previstas, sem prejuízo de perdas e danos.'
    },
    {
      titulo: 'Foro',
      conteudo:
        'Fica eleito o foro da comarca do LOCADOR para dirimir quaisquer dúvidas oriundas deste contrato, com renúncia a qualquer outro.'
    }
  ]
};

/**
 * Seleciona o template com base no campo "tipo" do contrato.
 * Reconhece palavras como "aluguel"/"locação" para locação; caso contrário, usa prestação de serviços.
 */
export function getContractTemplate(tipo?: string): ContractTemplate {
  const t = (tipo || '').toLowerCase();
  if (t.includes('aluguel') || t.includes('loca')) return locacaoTemplate;
  return servicosTemplate;
}
