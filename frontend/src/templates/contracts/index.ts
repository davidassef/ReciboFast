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
    { titulo: 'Definições', conteudo: 'Para fins deste contrato, os termos utilizados terão o significado atribuído neste instrumento e/ou em anexos acordados entre as partes.' },
    {
      titulo: 'Objeto e Escopo',
      conteudo:
        'O presente contrato tem por objeto a prestação dos serviços especificados pelas partes, incluindo, quando aplicável, cronograma, entregas parciais (milestones), requisitos funcionais e não funcionais. Quaisquer alterações de escopo deverão ser formalizadas por escrito.'
    },
    {
      titulo: 'Vigência e Prazo',
      conteudo:
        'Este contrato entra em vigor na data de sua assinatura e vigorará pelo prazo ajustado entre as partes, podendo ser prorrogado mediante termo aditivo.'
    },
    {
      titulo: 'Remuneração e Condições de Pagamento',
      conteudo:
        'O CONTRATANTE pagará ao CONTRATADO a quantia e a forma de pagamento acordadas (à vista, parcelado, contra-entrega ou por marcos). A mora sujeitará a parte inadimplente à incidência de multa, correção monetária e juros convencionados.'
    },
    {
      titulo: 'Reajuste',
      conteudo:
        'Na hipótese de serviços recorrentes, o valor poderá ser reajustado anualmente pelo índice acordado entre as partes (ex.: IPCA/IBGE), contado a partir da assinatura ou última revisão.'
    },
    { titulo: 'Tributos e Notas Fiscais', conteudo: 'Os tributos incidentes sobre a prestação de serviços serão de responsabilidade de quem a legislação determinar. As notas fiscais/recibos serão emitidos conforme exigências legais.' },
    {
      titulo: 'Obrigações do CONTRATADO',
      conteudo:
        'Executar os serviços com diligência, observando as boas práticas aplicáveis, e cumprir os prazos e padrões de qualidade definidos, mantendo comunicação adequada com o CONTRATANTE.'
    },
    {
      titulo: 'Obrigações do CONTRATANTE',
      conteudo:
        'Disponibilizar informações, acessos e insumos necessários à execução; aprovar entregas em tempo razoável; e efetuar os pagamentos nas datas convencionadas.'
    },
    {
      titulo: 'Propriedade Intelectual',
      conteudo:
        'Salvo estipulação em contrário, os direitos de propriedade intelectual sobre entregas específicas desenvolvidas sob encomenda serão cedidos/ licenciados ao CONTRATANTE após a quitação do preço, resguardados créditos autorais e ferramentas pré-existentes do CONTRATADO.'
    },
    {
      titulo: 'Confidencialidade e LGPD',
      conteudo:
        'As partes manterão confidenciais as informações a que tiverem acesso. Caso haja tratamento de dados pessoais, as partes comprometem-se a observar a legislação aplicável (LGPD), atuando como controladores e/ou operadores conforme o caso.'
    },
    { titulo: 'Não Exclusividade', conteudo: 'Salvo ajuste escrito em contrário, a relação entre as partes não é exclusiva, podendo ambas contratar com terceiros.' },
    { titulo: 'Não Solicitação de Profissionais', conteudo: 'Durante a vigência e por até 12 (doze) meses após o término, as partes se comprometem a não aliciar/contratar diretamente colaboradores essenciais da outra parte envolvidos na execução, salvo anuência expressa.' },
    {
      titulo: 'Garantia e Suporte',
      conteudo:
        'Quando aplicável, o CONTRATADO prestará garantia/suporte por período acordado, abrangendo correções de erros não imputáveis ao uso indevido ou a alterações não autorizadas.'
    },
    { titulo: 'Alteração de Escopo', conteudo: 'Qualquer modificação de escopo deverá ser formalizada, podendo implicar ajustes de prazo, custo e entregas. Sem formalização, prevalece o escopo originalmente contratado.' },
    { titulo: 'Comunicações', conteudo: 'As comunicações relevantes deverão ser realizadas por escrito (e-mail ou sistema), com confirmação de recebimento sempre que solicitado.' },
    { titulo: 'Força Maior', conteudo: 'Nenhuma das partes será responsabilizada por atrasos ou falhas decorrentes de caso fortuito ou força maior, desde que notifique a outra parte e adote medidas para mitigar seus efeitos.' },
    {
      titulo: 'Rescisão',
      conteudo:
        'O contrato poderá ser rescindido por inadimplemento, caso fortuito/força maior, ou por conveniência, mediante aviso prévio mínimo acordado. Permanecem exigíveis obrigações vencidas e cláusulas de confidencialidade e PI.'
    },
    {
      titulo: 'Responsabilidade',
      conteudo:
        'Cada parte responde pelos danos decorrentes de sua ação ou omissão, dentro dos limites legais e contratuais, excluídos lucros cessantes, salvo ajuste expresso.'
    },
    { titulo: 'Anticorrupção', conteudo: 'As partes declaram cumprir a legislação anticorrupção aplicável e se comprometem a não oferecer, prometer, autorizar, solicitar ou aceitar vantagem indevida relacionada a este contrato.' },
    { titulo: 'Cessão e Transferência', conteudo: 'A cessão de direitos e obrigações deste contrato somente será válida mediante anuência prévia e por escrito da outra parte, salvo cessão fiduciária de créditos.' },
    { titulo: 'Solução de Conflitos', conteudo: 'As partes envidarão esforços para solução amigável. Persistindo o impasse, poderão adotar mediação e, na sequência, arbitragem ou ação judicial, conforme acordado entre as partes.' },
    {
      titulo: 'Foro',
      conteudo:
        'Fica eleito o foro da comarca do CONTRATADO para dirimir controvérsias oriundas deste contrato, com renúncia a outro, por mais privilegiado que seja.'
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
    { titulo: 'DO LOCADOR', conteudo: 'Identificação do LOCADOR (usuário do sistema) conforme qualificação constante no cabeçalho deste instrumento.' },
    { titulo: 'DO LOCATÁRIO', conteudo: 'Identificação do LOCATÁRIO (cliente) conforme qualificação constante no cabeçalho deste instrumento.' },
    { titulo: 'FIADOR', conteudo: 'Suprimida, salvo ajuste diverso entre as partes.' },
    { titulo: 'OBJETO DA LOCAÇÃO', conteudo: 'Constitui objeto deste contrato a locação do bem descrito, entregue ao LOCATÁRIO em condições adequadas de uso e conservação, conforme vistoria.' },
    { titulo: 'DO PRAZO DE LOCAÇÃO', conteudo: 'O prazo de locação é o estipulado entre as partes, podendo ser renovado por acordo escrito. Findo o prazo, a devolução ocorrerá nas mesmas condições da entrega, ressalvado o desgaste natural.' },
    { titulo: 'DO VALOR MENSAL DA LOCAÇÃO', conteudo: 'O LOCATÁRIO pagará aluguel no valor e periodicidade ajustados. Em caso de reajuste, aplicar-se-á o índice acordado entre as partes, contado da assinatura ou última revisão.' },
    { titulo: 'DOS TRIBUTOS E DEMAIS ENCARGOS', conteudo: 'Obriga-se o LOCATÁRIO, além do pagamento do aluguel, ao pagamento, por sua conta exclusiva, do consumo de energia elétrica, água e demais taxas e leis incorporadas por força normativa no período de vigência deste contrato, bem como a manter a locação do imóvel pelo locatário.', itens: [
      { label: 'a)', conteudo: 'Manter o objeto da locação no perfeito estado de conservação e limpeza, correndo por sua conta as despesas necessárias de manutenção e conservação (pinturas, portas, fechaduras, instalações elétricas, trilhos, aparelhos e quaisquer outros).'},
      { label: 'b)', conteudo: 'Não efetuar qualquer alteração, adaptação ou benfeitoria sem autorização do LOCADOR; benfeitorias não serão indenizadas salvo ajuste legal.'},
      { label: 'c)', conteudo: 'Não transferir, emprestar ou ceder a terceiros, no todo ou em parte, os direitos e responsabilidades sobre o imóvel locado.'},
      { label: 'd)', conteudo: 'Encaminhar ao LOCADOR todas as notificações, avisos ou intimações dos poderes públicos entregues no imóvel, sob pena de responder por multas e penalidades decorrentes do não atendimento.'},
      { label: 'e)', conteudo: 'Facultar ao LOCADOR ou representantes legais examinar ou vistoriar o imóvel sempre que solicitado; e, no caso de venda, permitir a visita de interessados.'},
    ] },
    { titulo: 'DA VENDA DO IMÓVEL', conteudo: 'Na hipótese do imóvel ser colocado à venda, o LOCADOR deverá dar preferência ao LOCATÁRIO nas mesmas condições de preços e prazos, conforme legislação aplicável.' },
    { titulo: 'DO IMPOSTO PREDIAL', conteudo: 'As partes ajustam que o pagamento do imposto predial do imóvel locado correrá a cargo do LOCATÁRIO, durante o período da locação.' },
    { titulo: 'DA RESCISÃO CONTRATUAL', conteudo: 'O descumprimento de obrigações ensejará rescisão contratual mediante notificação escrita, sem prejuízo das penalidades e perdas e danos cabíveis.' },
    { titulo: 'DA INDENIZAÇÃO E DIREITO DE RETENÇÃO', conteudo: 'Toda e qualquer benfeitoria útil ou voluptuária realizada sem autorização não será indenizada, nem gerará direito de retenção. Benfeitorias necessárias observarão a lei ou ajuste expresso.' },
    { titulo: 'DAS VANTAGENS LEGAIS SUPERVINIENTES', conteudo: 'A locação está sujeita ao Código Civil e à Lei 8.245/1991, assegurando-se ao LOCADOR os direitos e vantagens conferidos por legislação superveniente.' },
    { titulo: 'DAS GARANTIAS', conteudo: 'Em garantia do cumprimento das obrigações, poderá haver caução, fiança ou seguro-fiança, conforme pactuado, destinado a cobrir débitos locatícios e danos.' },
    { titulo: 'DO PRAZO PARA OS PAGAMENTOS', conteudo: 'Fica convencionado que o LOCATÁRIO fará o pagamento dos aluguéis até o 5º (quinto) dia do vencimento de cada mês. O atraso sujeita o LOCATÁRIO à multa, juros e correção, sem prejuízo de cobrança por meios judiciais.' },
    { titulo: 'DA CLÁUSULA PENAL', conteudo: 'O LOCADOR e o LOCATÁRIO obrigam-se a respeitar o presente contrato; a parte que infringir dispositivo contratual incorrerá em multa equivalente a 01 (um) aluguel atualizado, sem prejuízo de outras penalidades legais. A multa poderá ser exigida cumulativamente com a rescisão.' },
    { titulo: 'FORO', conteudo: 'Fica eleito o foro da comarca do LOCADOR para resolver controvérsias oriundas deste instrumento, com renúncia a outro, por mais privilegiado que seja.' },
  ]
};

// Variante específica para Consultoria (reforça PI, metodologia e limitações de resultado)
const consultoriaTemplate: ContractTemplate = {
  key: 'servicos_consultoria',
  title: (numero) => `Contrato de Consultoria nº ${numero || ''}`.trim(),
  clientRoleLabel: 'Contratante',
  userRoleLabel: 'Consultor(a)',
  fallbackObjectText: () =>
    'As partes acordam a prestação de serviços de consultoria, análise e recomendações técnicas pelo Consultor ao Contratante, conforme escopo pactuado.',
  defaultClauses: () => [
    { titulo: 'Definições', conteudo: 'Relatórios, recomendações, entregas, dados e materiais terão o significado acordado entre as partes e/ou definido neste instrumento.' },
    { titulo: 'Objeto e Escopo', conteudo: 'Prestação de serviços de consultoria, incluindo diagnóstico, análise, reuniões, pareceres e relatórios, conforme escopo e cronograma acordados.' },
    { titulo: 'Metodologia', conteudo: 'O Consultor utilizará metodologia própria e/ou de mercado, podendo ajustar técnicas conforme necessidade, mantendo registro das premissas adotadas.' },
    { titulo: 'Vigência e Prazo', conteudo: 'O contrato vigora pelo período ajustado, podendo ser prorrogado por aditivo. Entregas ocorrerão conforme cronograma.' },
    { titulo: 'Remuneração e Pagamento', conteudo: 'Honorários serão pagos nas condições acordadas (fixo/variável/por etapa). Atrasos sujeitam o Contratante a multa/juros/correção conforme pactuado.' },
    { titulo: 'Limitação de Resultado', conteudo: 'As recomendações do Consultor não garantem, por si, resultados específicos; a implementação e seus efeitos dependem de variáveis sob controle do Contratante.' },
    { titulo: 'Confidencialidade e LGPD', conteudo: 'As partes manterão confidenciais os dados e informações; o tratamento de dados pessoais observará a LGPD, na qualidade de controlador/operador conforme o caso.' },
    { titulo: 'Propriedade Intelectual', conteudo: 'Relatórios e materiais produzidos poderão ter cessão/licença conforme ajuste. Ferramentas e know-how pré-existentes do Consultor permanecem sob sua titularidade.' },
    { titulo: 'Reajuste', conteudo: 'Em projetos de longa duração, honorários poderão ser reajustados periodicamente, conforme índice acordado ou renegociação por escopo.' },
    { titulo: 'Obrigações do Contratante', conteudo: 'Fornecer informações, acessos e disponibilidade de pessoal; validar premissas; deliberar sobre recomendações; cumprir cronogramas e pagamentos.' },
    { titulo: 'Força Maior', conteudo: 'Eventos de força maior poderão afetar prazos; o Consultor comunicará impactos e proporá replanejamento.' },
    { titulo: 'Rescisão', conteudo: 'Rescisão por inadimplemento, conveniência ou força maior, mediante aviso prévio; devidos os valores proporcionais às entregas já realizadas.' },
    { titulo: 'Responsabilidade', conteudo: 'Responsabilidade limitada aos danos diretos comprovados, excluídos lucros cessantes, salvo estipulação expressa em contrário.' },
    { titulo: 'Solução de Conflitos', conteudo: 'Busca-se solução amigável; persistindo, mediação e, se necessário, arbitragem ou Poder Judiciário, conforme ajuste.' },
    { titulo: 'Foro', conteudo: 'Fica eleito o foro da comarca do Consultor para dirimir controvérsias, salvo ajuste diverso.' },
  ]
};

/**
 * Seleciona o template com base no campo "tipo" do contrato.
 * Reconhece palavras como "aluguel"/"locação" para locação; caso contrário, usa prestação de serviços.
 */
export function getContractTemplate(tipo?: string): ContractTemplate {
  const t = (tipo || '').toLowerCase();
  if (t.includes('consult')) return consultoriaTemplate;
  if (t.includes('aluguel') || t.includes('loca')) return locacaoTemplate;
  return servicosTemplate;
}
