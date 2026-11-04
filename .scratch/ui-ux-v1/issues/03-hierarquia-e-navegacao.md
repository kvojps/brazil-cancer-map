# Como organizar resumo nacional, mapa e Meu município para os dois públicos?

Labels: wayfinder:grilling
Type: grilling
Status: open
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
