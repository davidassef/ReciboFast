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
    { titulo: 'Definições', conteudo: 'Os termos utilizados neste contrato terão o significado aqui estabelecido e/ou na legislação aplicável.' },
    {
      titulo: 'Objeto da Locação',
      conteudo:
        'Constitui objeto deste contrato a locação do bem descrito (imóvel/ móvel), entregue ao LOCATÁRIO em condições adequadas de uso e conservação, conforme vistoria.'
    },
    {
      titulo: 'Prazo e Renovação',
      conteudo:
        'O prazo de locação é o estipulado entre as partes, podendo ser renovado por acordo escrito. Findo o prazo, a devolução ocorrerá nas mesmas condições da entrega, ressalvado o desgaste natural.'
    },
    {
      titulo: 'Aluguel, Encargos e Reajuste',
      conteudo:
        'O LOCATÁRIO pagará aluguel no valor e periodicidade ajustados, além de encargos usuais (ex.: consumo, taxas ordinárias). O reajuste dar-se-á anualmente pelo índice acordado (ex.: IPCA/IBGE), a contar da assinatura ou última revisão.'
    },
    { titulo: 'IPTU, Condomínio e Outras Despesas', conteudo: 'Salvo ajuste em contrário, o LOCATÁRIO arcará com as despesas ordinárias de condomínio e consumo; impostos como IPTU seguirão a legislação e a alocação pactuada entre as partes.' },
    {
      titulo: 'Garantias',
      conteudo:
        'Poderá ser exigida garantia (caução, fiador ou seguro-fiança) conforme pactuado, destinada a cobrir débitos locatícios, danos e outras obrigações.'
    },
    {
      titulo: 'Conservação, Uso e Benfeitorias',
      conteudo:
        'Compete ao LOCATÁRIO zelar pelo bem, utilizando-o conforme a destinação pactuada. Benfeitorias dependerão de autorização do LOCADOR e sua indenização seguirá o que for ajustado.'
    },
    { titulo: 'Seguro', conteudo: 'Quando aplicável, as partes poderão acordar contratação de seguro para cobertura de riscos relacionados ao bem locado.' },
    {
      titulo: 'Vistorias e Entrega das Chaves',
      conteudo:
        'Serão realizadas vistorias na entrada e saída. A entrega das chaves formaliza a devolução, acompanhada do acerto de contas pendentes.'
    },
    { titulo: 'Proibições', conteudo: 'É vedado ao LOCATÁRIO modificar a destinação do bem, bem como realizar obras sem autorização do LOCADOR, manter atividades ilícitas ou que infrinjam regulamentos internos.' },
    {
      titulo: 'Inadimplemento e Multas',
      conteudo:
        'O atraso no pagamento sujeita o LOCATÁRIO à multa e demais encargos convencionados, sem prejuízo de medidas legais cabíveis.'
    },
    {
      titulo: 'Sublocação e Cessão',
      conteudo:
        'Vedada a sublocação ou cessão, total ou parcial, sem autorização expressa do LOCADOR.'
    },
    {
      titulo: 'Direito de Preferência',
      conteudo:
        'Em caso de alienação do bem locado, observar-se-á o direito de preferência do LOCATÁRIO, na forma da lei.'
    },
    { titulo: 'Força Maior', conteudo: 'Ocorrendo situações de força maior que impeçam o uso regular do bem, as partes negociarão soluções de boa-fé, respeitando a legislação aplicável.' },
    {
      titulo: 'Rescisão',
      conteudo:
        'O contrato poderá ser rescindido por inadimplemento das obrigações, por mútuo acordo, ou por outras hipóteses legais, mediante aviso prévio quando aplicável.'
    },
    { titulo: 'Comunicações', conteudo: 'As comunicações relevantes entre as partes deverão ser realizadas por escrito (e-mail ou sistema), com comprovação de envio quando solicitado.' },
    { titulo: 'Cessão e Transferência', conteudo: 'A cessão de posição contratual depende de anuência da outra parte, salvo hipóteses legais específicas.' },
    {
      titulo: 'Foro',
      conteudo:
        'Fica eleito o foro da comarca do LOCADOR para resolver controvérsias oriundas deste instrumento, com renúncia a outro, por mais privilegiado que seja.'
    }
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
