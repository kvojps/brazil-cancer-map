/** Editorial registry: clinical review remains pending until a reviewer is appointed. */
export const referralAction = {
  title: 'Saiba como chegar ao atendimento especializado.',
  summary: 'Pergunte à equipe que acompanha você sobre o encaminhamento e o serviço de referência.',
  disclaimer: 'Informação geral. A equipe de saúde orienta o cuidado indicado para você.',
  details: 'A entrada no SUS é pela UBS ou pela equipe que acompanha você. A regulação municipal ou estadual define o hospital conforme a rede de atendimento e a necessidade de cuidado; o paciente não escolhe o hospital. A lista de proximidade ajuda a conhecer a rede, mas não é um encaminhamento e não garante vaga ou disponibilidade de tratamento.',
  audience: 'Pessoas com suspeita ou diagnóstico de câncer e quem as acompanha no SUS.',
  criteria: 'Acesso ao serviço especializado por encaminhamento e regulação do SUS.',
  exceptions: 'A habilitação não significa que o serviço atende todos os tipos de câncer ou todas as idades. A equipe e a regulação orientam o serviço adequado.',
  version: '1',
  checkedAt: '2026-11-03',
  sources: [
    { title: 'INCA — Onde tratar pelo SUS', url: 'https://www.gov.br/inca/pt-br/assuntos/cancer/tratamento/onde-tratar-pelo-sus' },
    { title: 'INCA — Atendimento e regulação', url: 'https://www.gov.br/inca/pt-br/acesso-a-informacao/perguntas-frequentes/atendimento-no-inca/' },
  ],
  verificationNote: 'Fontes oficiais conferidas. Revisão editorial e clínica pendente.',
  reviewedVersion: null,
  reviewedAt: null,
  reviewer: null,
};

export const treatmentAction = {
  title: 'Conheça seus direitos e acompanhe seu encaminhamento.',
  summary: 'Se estiver esperando para começar o tratamento, veja os prazos e os canais de ajuda.',
  disclaimer: 'Informação geral. A equipe de saúde orienta o cuidado indicado para você.',
  details: [
    'A Lei 12.732/2012 prevê o primeiro tratamento no SUS em até 60 dias do diagnóstico firmado em laudo patológico, ou em prazo menor conforme a necessidade terapêutica registrada.',
    'A Lei 13.896/2019 prevê até 30 dias para exames necessários ao diagnóstico quando a principal hipótese é câncer, mediante solicitação fundamentada do médico.',
    'Peça à secretaria de saúde informações sobre seu encaminhamento. Para dúvidas ou reclamações, procure a Ouvidoria do SUS 136. A Defensoria Pública e o Ministério Público também são canais de ajuda para garantir direitos.',
  ],
  audience: 'Pessoas com suspeita ou diagnóstico de câncer e quem as acompanha no SUS.',
  criteria: 'Prazo do tratamento contado do diagnóstico firmado em laudo patológico; exames quando a principal hipótese é neoplasia maligna, mediante solicitação fundamentada do médico.',
  exceptions: 'O tratamento pode precisar começar em prazo menor, conforme a necessidade terapêutica registrada. A vigilância ativa pode ser indicada na próstata.',
  version: '1',
  checkedAt: '2026-11-03',
  sources: [
    { title: 'Lei 12.732/2012', url: 'https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2012/lei/l12732.htm' },
    { title: 'Lei 13.896/2019', url: 'https://www.planalto.gov.br/ccivil_03/_ato2019-2022/2019/lei/l13896.htm' },
    { title: 'Câmara dos Deputados — exames para diagnóstico', url: 'https://www.camara.leg.br/noticias/608585-lei-assegura-exame-no-sus-para-diagnostico-de-cancer-em-ate-30-dias/' },
    { title: 'Senado Federal — prazo para tratamento', url: 'https://www12.senado.leg.br/noticias/materias/2014/05/22/cas-avalia-primeiro-ano-da-lei-que-estipula-prazo-para-inicio-do-tratamento-de-cancer' },
    { title: 'Ouvidoria do SUS', url: 'https://www.gov.br/saude/pt-br/canais-de-atendimento/ouvsus' },
  ],
  verificationNote: 'Planalto bloqueou a consulta automatizada; prazos reconferidos nas páginas oficiais da Câmara e do Senado. Revisão editorial e clínica pendente.',
  reviewedVersion: null,
  reviewedAt: null,
  reviewer: null,
};
