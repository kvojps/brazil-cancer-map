# Especificação de UI/UX da v1

Especificação de apresentação pronta para implementação, aprovada em rodadas com o responsável em 2026-11-04. Não constitui implementação, auditoria ou autorização de publicação. Método e contrato continuam regidos pela [spec do MVP](../mapa-cancer-br/spec-mvp.md) e seus tickets de decisão.

## Decisões e referência visual

- [Hierarquia e navegação](issues/03-hierarquia-e-navegacao.md): mapa Brasil → prévia → Meu município completo; cartões nacionais adiados.
- [Direção visual](issues/04-direcao-visual.md): Mapa imersivo (C), claro/escuro e painel territorial com altura da linha do mapa no desktop. Referência descartável: branch `prototype/ui-ux-v1`, commit `2225bdd`, componente `site/src/components/VisualPrototype.astro`. Não promover o protótipo diretamente ao produto.
- [Padrão das páginas e handoff](issues/05-padrao-das-paginas-e-handoff.md): temas, páginas, acesso sem JavaScript e critérios de aceite.

## Páginas e navegação

A inicial mantém mapa central do Brasil, controles compactos e prévia lateral. Sem seleção, o painel orienta a buscar ou selecionar um município. Seleção aproxima o mapa no estado, contorna o município e abre a prévia; “Ver Meu município” leva à página municipal própria. No celular, mapa e prévia se empilham com altura natural. No desktop, o painel preenche a altura da linha do mapa, sem ficar fixo na rolagem.

Meu município mantém quatro Eixos empilhados, Acesso ao tratamento primeiro e Onde se tratar junto do tratamento. O Tipo de câncer persiste entre inicial e ficha; indicador e modo restringem apenas o mapa. A prévia não é a ficha completa. Ação, origem territorial, período e ressalvas essenciais permanecem visíveis; detalhes extensos usam expansões ou links à Metodologia.

Metodologia mantém página própria, sumário por indicador e coluna de leitura. Navegação principal e links de cada indicador levam à página e às seções pertinentes. Dados, fontes, versões, condições de reutilização, citação e reprodução ficam acessíveis por ela, conforme MVP §§2, 12 e 15. Preservar as rotas existentes: inicial, Metodologia e municípios; não criar página adicional de downloads como requisito deste esforço.

Todas as páginas compartilham navegação, tipografia sem serifa, hierarquia compacta, superfícies, controles, bordas discretas e temas. O aviso de construção, identidade e licenças continuam sujeitos ao MVP. A composição das páginas de leitura se adapta ao conteúdo, sem obrigá-las a ocupar a grade do mapa.

## Tema e estado

Escolha explícita em `theme=light|dark`, preservada na navegação interna junto do estado pertinente. Sem parâmetro válido, acompanhar a preferência do sistema. Não persistir escolha entre visitas. Sem JavaScript, o tema do sistema deve funcionar por CSS; aplicar a escolha explícita da URL depende do aprimoramento por JavaScript, sem impedir leitura básica.

Preservar Tipo de câncer e as regras existentes de elegibilidade, padrões e correção de URLs do MVP. Fundos, textos, controles e malha neutra mudam com o tema. Cores e significados de Tendência/Situação, pontos de dado insuficiente e hachura de faixa C são preservados; não inverter globalmente o mapa.

## Prévia e contrato existente

A prévia usa resultados prontos do pipeline, sem estatística no front. Esta conferência identifica fontes disponíveis, sem afirmar que todas as cargas estejam publicadas.

| Informação | Fonte existente |
| --- | --- |
| Nome, UF, código e Região imediata | `site/public/dados/municipalities.json`; `MunicipalityListing` |
| Valor, Tendência, Situação e origem | `IndicatorLayer.municipalities[code]`: `value`, `trend`, `status`, `origin` |
| Referência | `reference` e `has_status` |
| Período do valor, série e Tendência | `period.latest`, `first_year`, `last_year`, `trend`, `provisional` |
| Recorte do tratamento | `period.value_cases`, `trend_cases` |
| Qualidade e percentual sem informação | `quality`, `quality_band`, `without_treatment_info`, `period.quality_years` |
| Ressalvas variáveis | `status_note`, `adjustment_note`; `denominator_note` na ficha HPV |
| Série e contexto estadual/nacional | Ficha por UF: `series_id`, `series`, `uf_trend` ou `national_trend` |
| Fonte e atualização | `source` e `manifest.json` |
| Ação e ressalvas editoriais fixas | `site/src/content/actions.ts` e cartões existentes |

Interfaces de referência: `site/src/map/indicator-layer.ts` e `site/src/profile/profile.ts`. Consultar ficha por UF sob demanda quando a prévia precisar de campos exclusivos dela; não ampliar o contrato por conveniência visual.

Exceções obrigatórias:

- Mortalidade tem apenas Tendência, sem Situação ou Referência; metas são contexto. Ajuste C55 não calculável não pode virar automaticamente dado insuficiente.
- HPV tem apenas Situação e a explicação “série curta, ainda sem direção”, sem inventar classe de Tendência. Preservar notas de denominador e dose única quando pertinentes.
- Tratamento/próstata não tem Situação: respeitar `has_status`.
- Dado regional identifica “seu município e vizinhos” e nome da região junto do resultado. Dado insuficiente mantém explicação, Ação e acesso à ficha.
- Faixa C mantém aviso e percentual sem informação; hachura apenas no tratamento correspondente. Preservar distinção entre período da qualidade e ano do valor.
- Recorte quimio/radio, diferenças etárias de mamografia, transição DNA-HPV e demais ressalvas do MVP acompanham o resultado pertinente. Não substituir textos clínicos por exemplos do protótipo.

Nenhuma ampliação estatística do contrato foi identificada como necessária. A implementação deve reutilizar as regras editoriais dos cartões para evitar divergências entre prévia e ficha.

## Acesso sem mapa ou JavaScript

Com JavaScript, busca e tabela são alternativas ao mapa e devem funcionar mesmo quando WebGL ou a inicialização do mapa falhar. Tabela mantém classes, valores, origens e avisos do estado indicador × tipo × modo.

Sem JavaScript, a inicial oferece lista estática de municípios organizada por UF, com links para fichas. Meu município e Metodologia entregam conteúdo básico no HTML: indicadores, ressalvas, Ações, fontes, navegação e links aos Tipos de câncer. Em site estático, links por âncoras aos blocos de cada tipo são uma forma de cumprir o acesso sem depender de interpretar query string no servidor. Não exigir interatividade do mapa sem JavaScript.

Lacuna atual verificada: busca inicia desabilitada e tabela tem corpo vazio; a inicialização de ambas aguarda também o mapa. A ficha já é renderizada no build, mas contém todos os tipos e seu filtro depende de JavaScript. O índice estático e os links de tipos são trabalho novo do front.

## Critérios verificáveis para a implementação

Os itens abaixo são critérios futuros, não verificações já executadas neste esforço.

- [ ] Conferir mapa → prévia → ficha → retorno, Tipo de câncer preservado, links técnicos e URLs compartilháveis nos dois temas.
- [ ] Conferir seleção municipal, origem regional, dado insuficiente, faixa C, ausência de carga, períodos distintos, HPV sem Tendência, mortalidade sem Situação e ajuste não calculável.
- [ ] Verificar inicial, ficha e Metodologia a 320, 768 e 1280 px e zoom de 200%, em ambos os temas: sem conteúdo cortado; rolagem horizontal limitada às tabelas; no celular, blocos com altura natural.
- [ ] Percorrer controles, busca, tabela, prévia, ficha, expansões e Metodologia só pelo teclado, com foco visível e ordem lógica. Ao selecionar, manter foco no controle e oferecer acesso direto à prévia.
- [ ] Verificar anúncios de resultados com leitor de tela; classes, avisos e origem compreensíveis em texto, sem depender só de cor. Conferir contraste e distinção das texturas nos dois temas.
- [ ] Desativar JavaScript e conferir lista por UF, links para fichas e tipos, indicadores, ressalvas, Ações, fontes e Metodologia. Simular falha de WebGL com JavaScript ativo e confirmar busca/tabela utilizáveis.
- [ ] Executar checagem automatizada de acessibilidade, sem erros graves, e revisão manual nos dois temas. Registrar ferramenta, páginas, estados e limitações; sem alegar certificação formal.
- [ ] Medir primeira visita com cache vazio e transferência comprimida, com orçamento em torno de 1,3 MB; medir saída estática total abaixo de 30 MB. Registrar cenário, recursos e método, investigar excessos e evitar fontes externas. Carregar detalhes sob demanda. Divergência de orçamento requer justificativa e decisão explícita, não omissão.

## Dependências e fronteira da implementação

| Trabalho | Tratamento no handoff |
| --- | --- |
| Novo padrão visual, temas, prévia separada, navegação, índice sem JS e independência do mapa | Trabalho novo do redesign |
| Estado na URL já implementado | Preservar e adaptar ao tema e à separação prévia/ficha; [ticket existente](../mvp-implementacao/issues/09-estado-na-url.md) |
| Metodologia completa e reprodução | Dependência já aberta: [Metodologia consolidada](../mvp-implementacao/issues/24-metodologia-consolidada.md) |
| Downloads versionados | Dependência já aberta: [Dados abertos na GitHub Release](../mvp-implementacao/issues/22-dados-abertos-na-release.md) |
| Auditoria e medição de orçamento | Dependência já aberta: [Auditoria de acessibilidade do lançamento](../mvp-implementacao/issues/25-auditoria-de-acessibilidade.md); incluir os cenários deste redesign |
| Aprovação dos textos de Ação | Dependência humana: [Revisão clínica das Ações](../mvp-implementacao/issues/26-revisao-clinica-das-acoes.md) |
| Cargas HPV, tabagismo e atualização | Pendências próprias do MVP; o layout deve representar ausência sem presumir conclusão |

## Revisões explícitas da spec anterior

Esta especificação complementa o MVP, revisando a apresentação do §11: seleção abre prévia; Meu município completo fica em página própria; mantém-se o caminho municipal e acrescenta-se tema compartilhável à política de estado. Explicita padrão visual comum, alternativas sem mapa/JavaScript e critérios de verificação. Os tickets de hierarquia e direção visual registram as aprovações que sustentam essas mudanças.

Não altera método, indicadores, recortes, Referência, classes de Tendência/Situação ou cascata. Implementação, publicação, cartões numéricos nacionais, novos indicadores e resolução das cargas pendentes permanecem fora deste esforço. Aprovação visual não substitui teste formal de usabilidade, auditoria, medição ou revisão clínica.
