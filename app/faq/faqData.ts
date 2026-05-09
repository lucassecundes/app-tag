export interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

export const faqData: FAQItem[] = [
  {
    id: '1',
    question: 'O que é a TAG+?',
    answer: 'A TAG+ é um mini rastreador inteligente desenvolvido para ajudar você a acompanhar veículos, motos, bicicletas, bagagens e outros bens de valor de forma prática, discreta e sem instalação.\n\nEla funciona integrada ao aplicativo TAG+, permitindo visualizar a última localização registrada, histórico de posições e informações do dispositivo direto pelo celular ou pela plataforma web.'
  },
  {
    id: '2',
    question: 'A TAG+ usa chip ou plano de internet?',
    answer: 'Não. A TAG+ não utiliza chip, plano de dados, internet própria ou cartão SIM.\n\nEla atualiza a localização por meio de uma rede colaborativa de dispositivos compatíveis próximos. Quando algum dispositivo compatível passa perto da TAG+, a localização é enviada de forma segura para a central.'
  },
  {
    id: '3',
    question: 'A TAG+ tem GPS?',
    answer: 'A TAG+ não funciona como um rastreador GPS tradicional com chip e transmissão contínua.\n\nEla utiliza tecnologia de localização inteligente por proximidade de dispositivos compatíveis. Isso permite que o equipamento seja pequeno, discreto, econômico e com bateria de longa duração.'
  },
  {
    id: '4',
    question: 'A localização é em tempo real?',
    answer: 'A TAG+ não é indicada como rastreador de atualização contínua em tempo real.\n\nA localização é atualizada sempre que a TAG+ se conecta a dispositivos compatíveis próximos. Em regiões com maior circulação de pessoas e aparelhos, as atualizações tendem a ocorrer com mais frequência. Em locais isolados, pode demorar mais para atualizar.'
  },
  {
    id: '5',
    question: 'De quanto em quanto tempo a TAG+ atualiza?',
    answer: 'Não existe um intervalo fixo de atualização, pois a TAG+ depende da presença de dispositivos compatíveis próximos.\n\nEm áreas urbanas, movimentadas e com boa circulação, as atualizações costumam ser mais frequentes. Em locais afastados, garagens fechadas, áreas rurais ou com pouca movimentação, o tempo entre uma atualização e outra pode ser maior.'
  },
  {
    id: '6',
    question: 'A TAG+ funciona em qualquer lugar do Brasil?',
    answer: 'Sim, a TAG+ pode funcionar em diferentes regiões do Brasil, desde que existam dispositivos compatíveis próximos para ajudar na atualização da localização.\n\nQuanto maior a movimentação de pessoas e aparelhos na região, melhor tende a ser a frequência de atualização.'
  },
  {
    id: '7',
    question: 'A TAG+ funciona fora do Brasil?',
    answer: 'Sim. A TAG+ pode funcionar em outros países, pois utiliza uma rede colaborativa de dispositivos compatíveis.\n\nO desempenho pode variar conforme a quantidade de dispositivos próximos na região onde a TAG+ estiver.'
  },
  {
    id: '8',
    question: 'Precisa instalar no veículo?',
    answer: 'Não. A TAG+ não precisa de instalação técnica, ligação elétrica ou mão de obra especializada.\n\nBasta ativar o dispositivo, cadastrar no aplicativo e posicionar a TAG+ em um local discreto no veículo ou objeto que deseja proteger.'
  },
  {
    id: '9',
    question: 'A TAG+ tem mensalidade?',
    answer: 'A TAG+ é vendida sem mensalidade recorrente no primeiro ano de rastreamento incluso.\n\nApós o período incluso, pode haver renovação anual do serviço para manter o acesso ao sistema, aplicativo, plataforma e central de localização. Os valores de renovação podem variar conforme a condição comercial vigente.'
  },
  {
    id: '10',
    question: 'O primeiro ano já está incluso?',
    answer: 'Sim. A TAG+ acompanha 1 ano de rastreamento incluso a partir da ativação do dispositivo.\n\nDurante esse período, você pode usar o aplicativo, acessar as localizações registradas e acompanhar sua TAG+ normalmente.'
  },
  {
    id: '11',
    question: 'O que acontece depois de 1 ano?',
    answer: 'Após o primeiro ano, é necessário renovar o serviço para continuar utilizando o sistema de rastreamento da TAG+.\n\nA renovação mantém o acesso ao aplicativo, histórico, localização e demais funcionalidades disponíveis na plataforma.'
  },
  {
    id: '12',
    question: 'A TAG+ é discreta?',
    answer: 'Sim. A TAG+ foi desenvolvida para ser pequena, discreta e silenciosa.\n\nEla não emite som, não possui luzes chamativas e pode ser posicionada em locais ocultos, dificultando sua identificação.'
  },
  {
    id: '13',
    question: 'A TAG+ emite algum alerta para pessoas próximas?',
    answer: 'A proposta da TAG+ é oferecer rastreamento discreto e silencioso.\n\nEla não possui sirene, não toca, não vibra e não acende luzes durante o uso comum, mantendo o dispositivo mais reservado no local onde foi colocado.'
  },
  {
    id: '14',
    question: 'A TAG+ serve para carro?',
    answer: 'Sim. A TAG+ é muito utilizada em carros para auxiliar na localização e proteção do veículo.\n\nPor ser pequena e sem fios, pode ser escondida em locais estratégicos, funcionando como uma camada extra de segurança.'
  },
  {
    id: '15',
    question: 'A TAG+ serve para moto?',
    answer: 'Sim. A TAG+ também pode ser usada em motos.\n\nComo não precisa de instalação elétrica, ela pode ser posicionada em compartimentos ou pontos discretos, desde que o local não bloqueie totalmente a comunicação do dispositivo.'
  },
  {
    id: '16',
    question: 'Posso usar a TAG+ em bicicleta?',
    answer: 'Sim. A TAG+ pode ser usada em bicicletas, desde que fique bem fixada e protegida contra impactos, quedas ou exposição excessiva.\n\nEla ajuda a registrar a última localização informada quando houver dispositivos compatíveis próximos.'
  },
  {
    id: '17',
    question: 'Posso usar em bagagem ou mochila?',
    answer: 'Sim. A TAG+ pode ser usada em malas, mochilas, bolsas e outros objetos de valor.\n\nEla é uma boa opção para quem deseja acompanhar a última localização registrada de itens pessoais durante viagens, deslocamentos ou transporte.'
  },
  {
    id: '18',
    question: 'A TAG+ serve para pets?',
    answer: 'A TAG+ pode ser usada em alguns casos para acompanhar objetos, coleiras ou acessórios, mas o uso principal recomendado é em veículos, motos, bicicletas, bagagens e bens de valor.\n\nPara pets, é importante avaliar o tamanho, fixação, segurança e conforto do animal.'
  },
  {
    id: '19',
    question: 'A TAG+ tem imã?',
    answer: 'Alguns modelos ou versões da TAG+ podem acompanhar fixação com imã, dependendo da oferta comercial.\n\nO imã ajuda na fixação em superfícies metálicas, mas é importante posicionar corretamente para evitar quedas, impactos ou deslocamento do dispositivo.'
  },
  {
    id: '20',
    question: 'O imã é super forte?',
    answer: 'O imã auxilia na fixação, mas a força pode variar conforme o modelo, superfície e local de aplicação.\n\nPara uso em veículos ou motos, recomendamos posicionar a TAG+ em um local protegido, estável e discreto, evitando áreas expostas a pancadas, calor excessivo, água direta ou vibração intensa.'
  },
  {
    id: '21',
    question: 'A TAG+ é à prova d’água?',
    answer: 'A resistência pode variar conforme o modelo adquirido.\n\nMesmo quando há proteção contra respingos, recomendamos evitar contato direto com água, submersão, lavagem de alta pressão ou instalação em locais totalmente expostos à chuva.'
  },
  {
    id: '22',
    question: 'Qual é o tamanho da TAG+?',
    answer: 'A TAG+ é compacta e foi pensada para ser discreta.\n\nO tamanho reduzido facilita esconder o dispositivo em veículos, motos, bagagens e objetos sem chamar atenção.'
  },
  {
    id: '23',
    question: 'A bateria dura quanto tempo?',
    answer: 'A bateria da TAG+ pode durar bastante tempo, pois o dispositivo não utiliza chip, GPS dedicado ou transmissão contínua.\n\nA duração pode variar conforme o uso, ambiente, frequência de comunicação e condições do dispositivo. Em uso normal, a proposta é oferecer longa autonomia.'
  },
  {
    id: '24',
    question: 'A bateria é recarregável?',
    answer: 'Depende do modelo da TAG+.\n\nAlgumas versões podem utilizar bateria substituível ou sistema interno de longa duração. Consulte as informações do modelo adquirido ou fale com o suporte da Besat para confirmar.'
  },
  {
    id: '25',
    question: 'Como faço para ativar a TAG+?',
    answer: 'Após receber sua TAG+, basta seguir as instruções enviadas pela Besat.\n\nNormalmente, o processo envolve ativar o dispositivo, acessar o aplicativo TAG+, fazer login com os dados recebidos e cadastrar a TAG+ usando QR Code ou código de identificação.'
  },
  {
    id: '26',
    question: 'Como cadastro a TAG+ no aplicativo?',
    answer: 'Você pode cadastrar a TAG+ pelo aplicativo usando o QR Code ou o ID do dispositivo.\n\nDepois do cadastro, a TAG+ ficará vinculada à sua conta e poderá ser acompanhada pelo app ou plataforma web.'
  },
  {
    id: '27',
    question: 'O aplicativo está disponível para Android e iPhone?',
    answer: 'Sim. O aplicativo TAG+ está disponível para Android e iOS.\n\nAlém disso, também pode haver acesso via navegador web, permitindo acompanhar seus dispositivos por diferentes plataformas.'
  },
  {
    id: '28',
    question: 'Posso acessar pelo computador?',
    answer: 'Sim. A TAG+ também pode contar com acesso pela plataforma web.\n\nIsso permite acompanhar suas TAGs pelo computador, além do aplicativo no celular.'
  },
  {
    id: '29',
    question: 'Posso cadastrar mais de uma TAG+ na mesma conta?',
    answer: 'Sim. Você pode cadastrar múltiplas TAGs em uma única conta.\n\nIsso é ideal para quem deseja proteger mais de um veículo, moto, bicicleta, bagagem ou objeto de valor.'
  },
  {
    id: '30',
    question: 'Posso compartilhar o acesso com outra pessoa?',
    answer: 'Dependendo da configuração da sua conta e do sistema, pode ser possível compartilhar o acesso ou permitir que outra pessoa acompanhe a TAG+.\n\nPara esse tipo de configuração, recomendamos falar com o suporte da Besat.'
  },
  {
    id: '31',
    question: 'A TAG+ mostra histórico de localização?',
    answer: 'Sim. O sistema pode registrar o histórico de localizações recebidas pela TAG+.\n\nAssim, você pode consultar posições anteriores, horários e trajetos registrados conforme as atualizações disponíveis.'
  },
  {
    id: '32',
    question: 'A TAG+ mostra o endereço da localização?',
    answer: 'Sim. Quando a localização é registrada, o sistema pode exibir o endereço aproximado no aplicativo ou plataforma.\n\nA precisão do endereço pode variar conforme a qualidade da localização recebida e a disponibilidade dos serviços de mapa.'
  },
  {
    id: '33',
    question: 'A TAG+ tem cerca virtual?',
    answer: 'Sim. A TAG+ pode contar com recurso de cerca virtual, dependendo da versão do aplicativo e das funcionalidades liberadas na sua conta.\n\nCom a cerca virtual, você pode definir uma área de referência e acompanhar movimentações relacionadas ao dispositivo.'
  },
  {
    id: '34',
    question: 'A TAG+ envia alerta de movimento?',
    answer: 'Dependendo da versão do sistema e das configurações disponíveis, a TAG+ pode oferecer alertas relacionados à movimentação ou saída de área.\n\nÉ importante lembrar que os alertas dependem da atualização da localização. Como a TAG+ não transmite continuamente, o aviso pode ocorrer quando uma nova posição for registrada.'
  },
  {
    id: '35',
    question: 'A TAG+ bloqueia o veículo?',
    answer: 'Não. A TAG+ não faz bloqueio remoto do veículo.\n\nEla é uma solução de rastreamento discreto, sem fios e sem instalação. Para bloqueio remoto, é necessário um rastreador veicular convencional instalado no sistema elétrico do veículo.'
  },
  {
    id: '36',
    question: 'A TAG+ corta combustível?',
    answer: 'Não. A TAG+ não possui função de bloqueio, corte de combustível ou corte de ignição.\n\nEla não é ligada ao sistema elétrico do veículo, por isso não realiza comandos físicos no automóvel.'
  },
  {
    id: '37',
    question: 'Qual a diferença entre TAG+ e rastreador convencional?',
    answer: 'A TAG+ é pequena, discreta, sem chip, sem mensalidade no primeiro ano e sem instalação.\n\nJá o rastreador convencional normalmente usa chip, GPS, conexão própria, instalação elétrica e pode oferecer recursos como bloqueio remoto, atualização mais frequente e monitoramento mais avançado.\n\nA TAG+ é ideal para quem busca uma camada extra de proteção discreta e prática. O rastreador convencional é indicado para quem precisa de monitoramento constante e recursos de bloqueio.'
  },
  {
    id: '38',
    question: 'A TAG+ substitui um rastreador veicular com chip?',
    answer: 'Depende da sua necessidade.\n\nSe você precisa de atualização contínua, bloqueio remoto e monitoramento operacional, o rastreador com chip pode ser mais indicado.\n\nSe você busca um dispositivo discreto, pequeno, sem instalação e com baixo custo de manutenção, a TAG+ pode ser uma excelente opção.'
  },
  {
    id: '39',
    question: 'A TAG+ é indicada para recuperação de veículo roubado?',
    answer: 'A TAG+ pode auxiliar na localização do veículo ao informar a última posição registrada e novas posições quando houver comunicação com dispositivos compatíveis próximos.\n\nNo entanto, ela não garante recuperação, não substitui seguro, não substitui monitoramento 24h e não deve ser usada como único recurso de segurança em situações críticas.'
  },
  {
    id: '40',
    question: 'Em caso de roubo, o que devo fazer?',
    answer: 'Em caso de roubo ou furto, acione imediatamente as autoridades competentes e registre um boletim de ocorrência.\n\nVocê pode consultar a localização da TAG+ no aplicativo e fornecer as informações às autoridades, sempre evitando agir por conta própria.'
  },
  {
    id: '41',
    question: 'A Besat garante a recuperação do veículo?',
    answer: 'Não. A TAG+ é uma tecnologia de apoio à localização e proteção, mas não garante recuperação, indenização ou localização imediata.\n\nA recuperação depende de diversos fatores, como região, movimentação, presença de dispositivos compatíveis próximos e atuação das autoridades.'
  },
  {
    id: '42',
    question: 'A TAG+ funciona em garagem fechada?',
    answer: 'Pode funcionar, mas a atualização pode ser mais limitada em garagens fechadas, subsolos ou locais com pouca circulação de dispositivos compatíveis.\n\nNesses ambientes, a TAG+ pode demorar mais para registrar uma nova localização.'
  },
  {
    id: '43',
    question: 'A TAG+ funciona em área rural?',
    answer: 'Pode funcionar, mas o desempenho tende a depender da quantidade de dispositivos compatíveis próximos.\n\nEm áreas rurais, estradas isoladas ou locais com pouca movimentação, as atualizações podem ser menos frequentes.'
  },
  {
    id: '44',
    question: 'A localização da TAG+ é exata?',
    answer: 'A localização pode ser bastante útil, mas pode variar em precisão conforme o ambiente, sinal disponível, proximidade de dispositivos compatíveis e condições da rede.\n\nEm alguns casos, a localização pode ser aproximada.'
  },
  {
    id: '45',
    question: 'Por que minha TAG+ ainda não atualizou?',
    answer: 'A TAG+ pode não atualizar imediatamente se estiver em um local com poucos dispositivos compatíveis próximos, garagem fechada, área isolada ou se ainda estiver aguardando a primeira comunicação.\n\nTambém é importante verificar se o dispositivo foi ativado corretamente e cadastrado no aplicativo.'
  },
  {
    id: '46',
    question: 'Quanto tempo demora para aparecer a primeira localização?',
    answer: 'Após a ativação, a primeira localização pode aparecer em poucos minutos ou demorar mais, dependendo da região e da presença de dispositivos compatíveis próximos.\n\nEm alguns casos, pode levar de alguns minutos até algumas horas para a primeira posição ser registrada.'
  },
  {
    id: '47',
    question: 'A TAG+ precisa ficar carregando?',
    answer: 'Não como um rastreador comum com bateria recarregável frequente.\n\nA TAG+ foi projetada para baixo consumo, justamente por não usar chip, GPS dedicado ou transmissão contínua.'
  },
  {
    id: '48',
    question: 'A TAG+ consome bateria do carro?',
    answer: 'Não. A TAG+ não é ligada na bateria do veículo.\n\nEla funciona de forma independente, sem instalação elétrica e sem consumir energia do carro ou da moto.'
  },
  {
    id: '49',
    question: 'A TAG+ precisa de sinal de celular?',
    answer: 'A TAG+ não utiliza chip próprio nem plano de celular.\n\nA localização é atualizada quando o dispositivo se comunica com aparelhos compatíveis próximos, que ajudam a enviar a posição para a central.'
  },
  {
    id: '50',
    question: 'A TAG+ precisa estar conectada ao meu celular?',
    answer: 'Não necessariamente.\n\nDepois de ativada e cadastrada, a TAG+ pode atualizar a localização por meio de dispositivos compatíveis próximos, não dependendo exclusivamente do seu celular.'
  },
  {
    id: '51',
    question: 'Posso colocar a TAG+ escondida no veículo?',
    answer: 'Sim. Esse é um dos principais diferenciais da TAG+.\n\nEla pode ser posicionada de forma discreta no veículo, desde que o local escolhido não bloqueie totalmente a comunicação do dispositivo.'
  },
  {
    id: '52',
    question: 'Onde devo instalar ou esconder a TAG+?',
    answer: 'Recomendamos colocar em um local discreto, protegido e com menor risco de queda ou dano.\n\nEvite locais com muito calor, exposição direta à água, partes metálicas que bloqueiem totalmente o sinal, áreas de forte impacto ou locais de difícil acesso para futuras manutenções.'
  },
  {
    id: '53',
    question: 'A TAG+ pode ficar dentro do porta-luvas?',
    answer: 'Pode, desde que o local permita boa comunicação.\n\nSe perceber que as atualizações estão demorando muito, teste outro ponto do veículo com menos bloqueio e melhor exposição.'
  },
  {
    id: '54',
    question: 'A TAG+ pode ficar no porta-malas?',
    answer: 'Pode, mas o desempenho pode variar conforme o veículo, o material ao redor e a circulação de dispositivos compatíveis próximos.\n\nSe o porta-malas causar muita barreira de sinal, a atualização pode ser menos frequente.'
  },
  {
    id: '55',
    question: 'A TAG+ pode ser usada em caminhão?',
    answer: 'Sim. A TAG+ pode ser usada em caminhões como uma camada extra de localização discreta.\n\nPara operações de frota, logística, bloqueio remoto ou monitoramento constante, a Besat também possui soluções de rastreamento veicular convencional e sistemas mais completos.'
  },
  {
    id: '56',
    question: 'A TAG+ pode ser usada em máquinas, carretas ou equipamentos?',
    answer: 'Sim. Ela pode ser usada em diversos bens de valor, desde que seja possível posicionar o dispositivo de forma segura e protegida.\n\nO desempenho dependerá da região, movimentação e presença de dispositivos compatíveis próximos.'
  },
  {
    id: '57',
    question: 'A TAG+ tem mensalidade escondida?',
    answer: 'Não. A TAG+ não possui mensalidade tradicional como rastreadores com chip.\n\nO primeiro ano de rastreamento é incluso. Depois desse período, pode existir uma renovação anual para manter o serviço ativo.'
  },
  {
    id: '58',
    question: 'Preciso assinar contrato?',
    answer: 'A contratação pode variar conforme a oferta comercial.\n\nEm geral, a TAG+ é adquirida com o primeiro ano de serviço incluso, sem mensalidade mensal tradicional. Para detalhes comerciais, consulte as condições no momento da compra.'
  },
  {
    id: '59',
    question: 'Quais formas de pagamento são aceitas?',
    answer: 'As formas de pagamento podem variar conforme a página de checkout ativa.\n\nNormalmente, podem estar disponíveis opções como cartão de crédito, Pix ou boleto, conforme a condição comercial vigente.'
  },
  {
    id: '60',
    question: 'A TAG+ tem garantia?',
    answer: 'Sim. A TAG+ possui garantia contra defeitos de fabricação, conforme as condições informadas pela Besat no momento da compra.\n\nA garantia não cobre mau uso, danos físicos, violação do dispositivo, exposição inadequada à água, quedas, impactos ou instalação incorreta em locais inadequados.'
  },
  {
    id: '61',
    question: 'Posso devolver a TAG+ se me arrepender da compra?',
    answer: 'Compras realizadas pela internet seguem as regras de direito de arrependimento previstas no Código de Defesa do Consumidor.\n\nConsulte a política de trocas e devoluções da Besat para verificar prazos, condições e procedimentos.'
  },
  {
    id: '62',
    question: 'Como recebo a TAG+?',
    answer: 'Após a compra, a TAG+ é enviada para o endereço informado no pedido.\n\nO prazo de entrega pode variar conforme a região, transportadora, Correios e modalidade de envio escolhida.'
  },
  {
    id: '63',
    question: 'Recebo código de rastreio da entrega?',
    answer: 'Sim. Quando o pedido é postado, você pode receber o código de rastreamento para acompanhar o envio.\n\nAs informações podem ser enviadas por e-mail, WhatsApp ou pelos canais de atendimento da Besat.'
  },
  {
    id: '64',
    question: 'A TAG+ é segura?',
    answer: 'Sim. A TAG+ foi desenvolvida para oferecer uma solução discreta, prática e segura para acompanhamento de bens.\n\nOs dados de localização são vinculados à conta do usuário e acessados pelo aplicativo ou plataforma autorizada.'
  },
  {
    id: '65',
    question: 'Meus dados ficam protegidos?',
    answer: 'Sim. A Besat utiliza os dados de localização para prestar o serviço de rastreamento e exibir as informações no aplicativo e na plataforma.\n\nOs dados não devem ser usados para fins de publicidade ou marketing sem autorização do usuário.'
  },
  {
    id: '66',
    question: 'Outra pessoa consegue ver minha TAG+?',
    answer: 'Não. Apenas usuários autorizados na conta conseguem visualizar as informações da TAG+.\n\nPor isso, é importante manter seus dados de acesso protegidos e não compartilhar senha com terceiros não autorizados.'
  },
  {
    id: '67',
    question: 'A TAG+ pode ser usada para rastrear pessoas sem autorização?',
    answer: 'Não. A TAG+ deve ser utilizada de forma legal, ética e autorizada.\n\nO uso para perseguição, vigilância indevida, rastreamento de pessoas sem consentimento ou qualquer finalidade ilegal é proibido.'
  },
  {
    id: '68',
    question: 'A TAG+ é um produto da Besat?',
    answer: 'Sim. A TAG+ faz parte das soluções de rastreamento da Besat, empresa especializada em tecnologias para localização, segurança e monitoramento.'
  },
  {
    id: '69',
    question: 'Como falo com o suporte?',
    answer: 'Você pode falar com a equipe da Besat pelos canais oficiais de atendimento disponíveis no site.\n\nO suporte pode ajudar com ativação, cadastro, dúvidas sobre localização, renovação, garantia e funcionamento do aplicativo.'
  },
  {
    id: '70',
    question: 'Para quem a TAG+ é indicada?',
    answer: 'A TAG+ é indicada para quem deseja uma solução discreta, pequena e prática para acompanhar veículos, motos, bicicletas, bagagens e bens de valor.\n\nEla é ideal para quem busca uma camada extra de proteção sem instalação, sem chip e sem mensalidade mensal tradicional.'
  }
];