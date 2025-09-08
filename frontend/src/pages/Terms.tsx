// MIT License
// Autor: David Assef
// Descrição: Página de Termos de Uso do ReciboFast
// Data: 08-09-2025

import React from 'react';

const Terms: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto p-6 prose prose-neutral">
      <h1>Termos de Uso do ReciboFast</h1>
      <p>Última atualização: 08/09/2025</p>

      <h2>1. Aceitação dos Termos</h2>
      <p>
        Ao criar uma conta ou utilizar o ReciboFast, você concorda com estes Termos de Uso e com a nossa Política de Privacidade.
        Se você não concorda, não utilize o serviço.
      </p>

      <h2>2. Uso do Serviço</h2>
      <ul>
        <li>Você é responsável pela veracidade e segurança das informações inseridas.</li>
        <li>É proibido utilizar o serviço para atividades ilegais, fraudulentas ou que violem direitos de terceiros.</li>
        <li>Podemos suspender ou encerrar contas que violem estes Termos.</li>
      </ul>

      <h2>3. Assinaturas Digitais e Recibos</h2>
      <p>
        O ReciboFast oferece recursos de assinatura digital e geração de recibos. A validade jurídica pode depender da legislação aplicável
        no seu país e de como o serviço é utilizado. Recomendamos consultar um profissional legal se necessário.
      </p>

      <h2>4. Limitação de Responsabilidade</h2>
      <p>
        O serviço é fornecido "como está". Não garantimos disponibilidade contínua, ausência de erros ou adequação a um propósito específico.
        Em nenhuma circunstância seremos responsáveis por danos indiretos, incidentais ou consequentes decorrentes do uso do serviço.
      </p>

      <h2>5. Privacidade e Proteção de Dados</h2>
      <p>
        O uso do serviço está sujeito à nossa Política de Privacidade. Tomamos medidas para proteger seus dados, mas você também é responsável
        por manter suas credenciais seguras.
      </p>

      <h2>6. Modificações</h2>
      <p>Podemos atualizar estes Termos periodicamente. A continuação do uso após alterações implica aceitação das novas condições.</p>

      <h2>7. Contato</h2>
      <p>Para dúvidas, contate: suporte@recibofast.app</p>
    </div>
  );
};

export default Terms;
