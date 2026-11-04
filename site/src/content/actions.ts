/** Editorial registry: clinical review remains pending until a reviewer is appointed. */
export const mammographyAction = {
  title: 'Converse na UBS sobre quando fazer a mamografia.',
  summary: 'Informe sua idade, seu histórico e qualquer alteração nas mamas.',
  disclaimer: 'Informação geral. A equipe de saúde orienta o cuidado indicado para você.',
  details: [
    'A orientação atual do SUS é o rastreamento de mulheres de 50 a 74 anos, a cada dois anos (NT 626/2025). O indicador acompanha 50–69 anos para preservar a comparação histórica.',
    'Entre 40 e 49 anos e acima de 74 anos, mulheres sem sintomas podem conversar com a equipe sobre o exame por demanda e seus possíveis benefícios e riscos.',
    'Se perceber alteração nas mamas, procure a UBS sem esperar a próxima mamografia de rastreamento. A equipe orienta a avaliação conforme seu histórico e sua necessidade.',
  ],
  audience: 'Mulheres e pessoas que procuram orientação sobre o cuidado com as mamas no SUS.',
  criteria: 'Rastreamento bienal entre 50 e 74 anos, conforme NT 626/2025.',
  exceptions: 'Fora dessa faixa, decisão compartilhada; alterações nas mamas exigem avaliação, independentemente do calendário de rastreamento.',
  version: '1', checkedAt: '2026-11-03',
  sources: [{ title: 'Ministério da Saúde — Nota Técnica 626/2025', url: 'https://www.gov.br/saude/pt-br/centrais-de-conteudo/publicacoes/notas-tecnicas/2025/nota-tecnica-no-626-2025-cgcan-decan-saes-ms.pdf/view' }],
  verificationNote: 'Faixa etária e periodicidade conferidas na NT 626/2025. Revisão clínica pendente.',
  reviewedVersion: null, reviewedAt: null, reviewer: null,
};

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


export const cervicalScreeningAction = {
  title: 'Confira na UBS se seu exame está em dia.',
  summary: 'Pergunte sobre o exame indicado e a disponibilidade do teste de HPV ou do Papanicolau.',
  transition: 'A partir de 2025 o SUS está trocando o Papanicolau pelo teste de DNA-HPV, feito a cada 5 anos. Menos Papanicolaus não quer dizer menos cuidado.',
  disclaimer: 'Informação geral. A equipe de saúde orienta o cuidado indicado para você.',
  details: [
    'O rastreamento é indicado para mulheres e pessoas com colo do útero de 25 a 64 anos que já tiveram atividade sexual. Após resultado negativo, o teste de DNA-HPV é repetido em cinco anos.',
    'Onde o DNA-HPV ainda não foi implantado, o Papanicolau continua a cada três anos após dois exames normais anuais consecutivos. Resultados alterados e situações especiais exigem orientação da equipe.',
  ],
  audience: 'Mulheres e pessoas com colo do útero, de 25 a 64 anos, que já tiveram atividade sexual.',
  criteria: 'DNA-HPV a cada cinco anos após resultado negativo; Papanicolau onde o teste não está implantado.',
  exceptions: 'Resultados alterados, imunossupressão e histórico de lesões exigem avaliação individual pela equipe.',
  version: '1', checkedAt: '2026-11-03',
  sources: [{ title: 'INCA — Detecção precoce do câncer do colo do útero', url: 'https://www.gov.br/inca/pt-br/assuntos/gestor-e-profissional-de-saude/controle-do-cancer-do-colo-do-utero/acoes/deteccao-precoce' }],
  verificationNote: 'Transição e periodicidade conferidas no INCA. Revisão clínica dos detalhes pendente.',
  reviewedVersion: null, reviewedAt: null, reviewer: null,
};

export const hpvAction = {
  title: 'Confira sua vacinação contra o HPV.',
  summary: 'Leve sua caderneta à UBS para verificar se há dose indicada para você.',
  disclaimer: 'Informação geral. A equipe de saúde orienta o cuidado indicado para você.',
  details: ['A equipe da UBS confere as doses registradas e orienta a vacinação conforme sua idade e condição de saúde.'],
  audience: 'Pessoas que procuram orientação sobre a vacinação contra o HPV no SUS.',
  criteria: 'Indicação verificada pela equipe da UBS conforme o calendário do Ministério da Saúde.',
  exceptions: 'Grupos especiais têm esquemas próprios; a equipe orienta cada situação.',
  version: '1', checkedAt: '2026-11-04',
  sources: [{ title: 'Ministério da Saúde — HPV', url: 'https://www.gov.br/saude/pt-br/assuntos/saude-de-a-a-z/h/hpv/hpv' }],
  verificationNote: 'Texto curto aprovado no ticket 20. Revisão clínica dos detalhes pendente.',
  reviewedVersion: null, reviewedAt: null, reviewer: null,
};

interface AlternativeAction {
  title: string;
  summary: string;
  disclaimer: string;
  details: string[];
  audience: string;
  criteria: string;
  exceptions: string;
  version: string;
  checkedAt: string;
  sources: { title: string; url: string }[];
  verificationNote: string;
  reviewedVersion: string | null;
  reviewedAt: string | null;
  reviewer: string | null;
}

const cancerSources = {
  breast: { title: 'INCA — Câncer de mama', url: 'https://www.gov.br/inca/pt-br/assuntos/cancer/tipos/mama/versao-para-populacao' },
  prostate: { title: 'INCA — Câncer de próstata', url: 'https://www.gov.br/inca/pt-br/assuntos/cancer/tipos/prostata/versao-para-populacao' },
  colorectal: { title: 'INCA — Câncer de intestino', url: 'https://www.gov.br/inca/pt-br/assuntos/cancer/tipos/intestino/versao-para-populacao' },
  lung: { title: 'INCA — Câncer de pulmão', url: 'https://www.gov.br/inca/pt-br/assuntos/cancer/tipos/pulmao/versao-para-populacao' },
};

function alternativeAction(cancerType: keyof typeof cancerSources, content: Pick<AlternativeAction, 'title' | 'summary' | 'details' | 'criteria' | 'exceptions'>): AlternativeAction {
  return {
    ...content,
    disclaimer: treatmentAction.disclaimer,
    audience: `Pessoas que procuram orientação sobre ${cancerSources[cancerType].title.replace('INCA — ', '').toLowerCase()} e quem as acompanha.`,
    version: '1', checkedAt: '2026-11-04',
    sources: [cancerSources[cancerType]],
    verificationNote: 'Fonte oficial consultada. Revisão clínica pendente; reconferir os detalhes antes da publicação.',
    reviewedVersion: null, reviewedAt: null, reviewer: null,
  };
}

export const earlyDetectionActions = {
  prostate: alternativeAction('prostate', {
    title: 'Conheça os sinais e saiba quando procurar avaliação',
    summary: 'Consulte as orientações oficiais sobre próstata e converse na UBS sobre alterações ou dúvidas.',
    details: ['Dificuldade para urinar e alterações no jato urinário podem ter diferentes causas e precisam de avaliação. O INCA não recomenda rastreamento populacional do câncer de próstata.'],
    criteria: 'Avaliação de sinais, sintomas e histórico pela equipe de saúde.',
    exceptions: 'Exames em pessoas sem sintomas exigem conversa sobre benefícios e riscos; não há recomendação única de exame para todos.',
  }),
  lung: alternativeAction('lung', {
    title: 'Conheça os sinais e saiba quando procurar avaliação',
    summary: 'Consulte as orientações oficiais sobre pulmão e converse na UBS sobre alterações ou dúvidas.',
    details: ['Tosse persistente, sangue no escarro e falta de ar precisam de avaliação e podem ter diferentes causas.'],
    criteria: 'Avaliação de sinais, sintomas e exposições pela equipe de saúde.',
    exceptions: 'A equipe define a necessidade de investigação; esta orientação não indica exame de rastreamento para todos.',
  }),
  colorectal: alternativeAction('colorectal', {
    title: 'Conheça os sinais e pergunte na UBS sobre a indicação e a disponibilidade de exames de rastreamento',
    summary: 'Consulte as orientações oficiais sobre câncer colorretal. A equipe orienta a avaliação conforme sua necessidade.',
    details: ['Sangue nas fezes e mudanças persistentes do hábito intestinal precisam de avaliação. O teste imunoquímico fecal (FIT) pesquisa pequenas quantidades de sangue nas fezes. O Ministério da Saúde anunciou implantação gradual; isso não confirma oferta no seu município. Pergunte na UBS sobre indicação, disponibilidade e acompanhamento do resultado.'],
    criteria: 'Indicação de exames e avaliação do histórico pela equipe da UBS.',
    exceptions: 'Sintomas exigem avaliação própria, independentemente do rastreamento. Não há confirmação de oferta local nesta ficha.',
  }),
};
earlyDetectionActions.colorectal.sources.push({
  title: 'Ministério da Saúde — implantação gradual do FIT',
  url: 'https://www.gov.br/saude/pt-br/assuntos/noticias/2026/outubro/ministerio-da-saude-inicia-oferta-no-sus-de-nove-medicamentos-oncologicos-de-alta-tecnologia-em-todas-as-regioes-do-pais',
});

export const preventionActions = {
  breast: alternativeAction('breast', {
    title: 'Conheça os fatores de risco do câncer de mama.',
    summary: 'Converse na UBS sobre fatores de risco e hábitos de proteção. Reduzir riscos não garante evitar o câncer.',
    details: ['Atividade física, controle do peso e evitar bebidas alcoólicas ajudam a reduzir riscos. Idade e histórico familiar também influenciam o risco.'],
    criteria: 'Orientação de prevenção conforme histórico e condições de saúde.',
    exceptions: 'Nem todos os fatores de risco podem ser modificados; hábitos de proteção não substituem avaliação de alterações nas mamas.',
  }),
  prostate: alternativeAction('prostate', {
    title: 'Conheça os fatores de risco do câncer de próstata.',
    summary: 'Converse na UBS sobre fatores de risco e hábitos de proteção. Reduzir riscos não garante evitar o câncer.',
    details: ['Idade, histórico familiar e excesso de gordura corporal estão relacionados ao risco. Converse sobre cuidados com o peso e atividade física.'],
    criteria: 'Orientação de prevenção conforme histórico e condições de saúde.',
    exceptions: 'Idade e histórico familiar não podem ser modificados; hábitos saudáveis não garantem proteção individual.',
  }),
  colorectal: alternativeAction('colorectal', {
    title: 'Conheça os fatores de risco do câncer colorretal.',
    summary: 'Converse na UBS sobre fatores de risco e hábitos de proteção. Reduzir riscos não garante evitar o câncer.',
    details: ['Atividade física, controle do peso e alimentação com fibras ajudam na prevenção. Tabagismo e consumo de álcool também estão relacionados ao risco.'],
    criteria: 'Orientação de prevenção conforme histórico e condições de saúde.',
    exceptions: 'Histórico familiar e doenças intestinais podem exigir acompanhamento específico; hábitos saudáveis não substituem avaliação.',
  }),
};

export const smokingAction = alternativeAction('lung', {
  title: 'Quer parar de fumar? Procure apoio.',
  summary: 'Pergunte na UBS onde encontrar atendimento para parar de fumar.',
  details: ['A equipe da UBS orienta sobre o atendimento para parar de fumar e os recursos disponíveis na rede.'],
  criteria: 'Pessoas que desejam apoio para parar de fumar.',
  exceptions: 'A equipe orienta o cuidado e a disponibilidade do atendimento local.',
});
