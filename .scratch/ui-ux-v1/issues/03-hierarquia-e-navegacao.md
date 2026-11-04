# Como organizar resumo nacional, mapa e Meu município para os dois públicos?

Labels: wayfinder:grilling
Type: grilling
Status: claimed
Assignee: codex
Parent: ../map.md
Blocked by: 01, 02

## Question

Com as pesquisas em mãos, decidir com o responsável quais perguntas a inicial responde, quais indicadores resumem o Brasil, como se distinguem filtros globais e locais e como se navega ao Meu município. Identificar quais números já existem no contrato e quais exigiriam trabalho no pipeline. Definir a relação entre ficha lateral e página municipal, a prioridade de Ações e detalhes técnicos, e os estados sem seleção ou sem dados.

Registrar expressamente qualquer revisão das decisões anteriores de experiência; preservar os significados estatísticos. O equilíbrio entre públicos não pressupõe duas experiências separadas.

## Comments

### Inventário inicial — 2026-11-04

- A composição atual está em `site/src/components/MapExperience.astro`: controles no cabeçalho, mapa e ficha lado a lado, legenda e tabela abaixo. `Base.astro` reúne aviso de construção e rodapé; `MunicipalityProfile.astro` organiza os quatro eixos. O CSS atual é funcional, com poucos padrões compartilhados.
- O contrato verificado em `site/public/dados/profiles/PE.json` tem contexto de UF no tratamento e rastreamentos, Tendência nacional na mortalidade e estimativas estaduais/capital. Isso não constitui um conjunto completo de indicadores nacionais prontos para os cartões da inicial. Conferir as demais exportações antes de escolher os resumos; não calcular médias de municípios no front.
- Spec §§11.1–11.2 e a decisão [Como a experiência "meu município" deve parecer?](../../mapa-cancer-br/issues/06-experiencia-meu-municipio.md) fixam mapa central, ficha lateral/abaixo no celular e eixos empilhados. O novo esforço pode revisar a apresentação com aprovação explícita, sem alterar significados estatísticos por consequência do layout.
- A navegação usa seletores DOM e extrai `.profile` do HTML estático municipal. A implementação posterior precisa avaliar esses contratos, a rolagem da ficha e o redimensionamento do mapa.
- A leitura básica municipal funciona sem JavaScript, mas renderiza conteúdo de vários tipos; avaliar excesso e repetição ao desenhar a nova experiência.

## Answer

Acordo confirmado pelo responsável em 2026-11-04, após três rodadas de perguntas e confirmação final: “Concordo com tudo”.

### Hierarquia e navegação

- O Mapa inicial tem foco primário no Brasil e permite navegar por município. O mapa central, a legenda e o contexto do indicador sustentam essa visão nacional.
- Selecionar ou buscar um município abre uma prévia ao lado do mapa no desktop e abaixo no celular. A prévia oferece “Ver Meu município”, que abre a ficha completa em página própria.
- O Tipo de câncer persiste entre inicial e ficha completa. Indicador e modo de cor controlam apenas o mapa; não restringem os quatro Eixos da ficha. Acesso ao tratamento permanece primeiro.
- A prévia mostra nome e UF, resultado do indicador selecionado, Tendência, Referência quando aplicável, período, origem territorial, ressalvas essenciais e uma Ação. Não se cria Situação para mortalidade.
- Quando o dado vem da Região imediata, a origem “seu município e vizinhos” aparece junto do número. Dado insuficiente recebe explicação e mantém a Ação e o acesso à ficha; não é tratado como Tendência.
- Sem seleção, o espaço da prévia orienta: “Busque ou selecione um município para explorar os dados e saber o que pode fazer”. Legenda e contexto do indicador continuam visíveis.

### Resumo nacional adiado

Não haverá cartões de resumo numérico nacional nesta versão de UI/UX. O responsável decidiu adiar essa proposta por não haver agora um conjunto de dados nacionais adequado para sustentá-la. A visão Brasil é o mapa; não será preenchida com métricas substitutas nem médias de municípios calculadas no front. Não é necessário ampliar o contrato para tais cartões neste esforço. Sua eventual retomada pertence a outro esforço, com verificação dos cálculos e dados disponíveis antes de escolher os resumos.

### Metodologia, dados abertos e reprodução

A Metodologia tem página própria, acessível pela navegação principal e por links dos indicadores para as seções correspondentes. Deve permitir validação técnica e reprodução: definições dos indicadores, fontes e períodos, recortes, cálculos de Tendência e Situação, Referência, tratamento de municípios pequenos, qualidade, limitações e links para dados, código e instruções de reprodução. Mantêm-se os requisitos de versões, reutilização e citação da spec §§2, 12 e 15.

A leitura principal usa linguagem simples; explicações extensas e detalhe técnico ficam na Metodologia ou em expansões próximas do indicador. Ressalvas essenciais, origem e período permanecem visíveis, assim como a Ação. Recursos de metodologia, downloads e reprodução ainda pendentes são requisitos para a implementação, não capacidades presumidas como concluídas.

### Revisões e limites

Esta decisão revisa expressamente a apresentação em [Como a experiência “meu município” deve parecer?](../../mapa-cancer-br/issues/06-experiencia-meu-municipio.md) e na spec §11: o mapa passa a abrir uma prévia, e os quatro Eixos completos ficam na página Meu município. A definição de Meu município no glossário continua sendo a visão completa com os quatro Eixos; a prévia é apenas um acesso resumido a ela.

Não se alteram regras estatísticas, cores e texturas semânticas, Referência, Tendência, Situação ou cascata territorial. Detalhes de composição e interação serão avaliados em [Qual direção visual torna o dashboard claro, acolhedor e consistente?](04-direcao-visual.md); aplicação às demais páginas e critérios verificáveis ficam em [Como aplicar a direção às demais páginas e entregar uma especificação verificável?](05-padrao-das-paginas-e-handoff.md).
