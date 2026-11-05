# Especificação de UI/UX da v1

Direção vigente: **A — Console horizontal**, aprovada pelo responsável em 2026-11-04 ao responder “A” à proposta do [ticket 35](../mvp-implementacao/issues/35-prototipo-dashboard-de-observabilidade.md). A aprovação cobre a composição apresentada, incluindo navegação, mapa, painel, legenda, lista, rodapé e Metodologia. Não constitui implementação, publicação, revisão clínica ou auditoria. Método e contrato continuam regidos pela [spec do MVP](../mapa-cancer-br/spec-mvp.md) e seus tickets de decisão.

## Decisões e referência visual

Fonte primária: branch descartável `prototype/35-observability-dashboard`, commit `86a8d87`, rota `/prototype/observability?variant=A`. Capturas e instruções estão em `site/src/prototypes/observability/` nessa branch; consultar com `git show prototype/35-observability-dashboard:site/src/prototypes/observability/README.md`. O commit `ce023a9` registra o vínculo da fonte no ticket. Não integrar código do protótipo ao produto.

O [handoff aprovado](observability-handoff.md) consolida escopo, evidência e limitações. A direção A substitui a direção C de `prototype/ui-ux-v1` (`2225bdd`), a separação mapa → prévia → ficha dos tickets de UI/UX 03–05 e a composição anterior dos tickets de implementação 30–34. Suas entregas continuam resolvidas e devem ser reaproveitadas; as diferenças estão nos tickets 36–39.

## Páginas e navegação

O Mapa inicial é um dashboard com Brasil inteiro, mapa dominante e cabeçalho compacto. Abre em tratamento em até 60 dias × Todos os cânceres × Tendência, sem município selecionado e sem painel vazio. Mantém o recorte quimio/radio e não acrescenta cartões numéricos nacionais nem apresentação longa.

A identidade combina o nome Observatório do Câncer no Brasil e símbolo simples. Navegação principal: “Mapa”, “Municípios por UF” e “Como calculamos”. A busca municipal fica no cabeçalho, e a barra horizontal de controles agrupa os filtros e o alternador “Mapa | Lista” ([decisão do desktop](../ui-polimento/issues/05-desktop-tela-cheia.md)). Tema em um único controle com nome acessível: lua no modo claro para ativar o escuro e sol no escuro para ativar o claro. Claro e escuro compartilham tipografia precisa, superfícies definidas, controles compactos e acentos luminosos discretos; cores semânticas permanecem intactas.

Selecionar um município no mapa, na busca, na lista ou por link direto abre Meu município no próprio dashboard, sem etapa de prévia nem navegação a uma ficha separada. No desktop, painel lateral com nome/UF e quatro Eixos expansíveis, inicialmente aberto no Eixo do indicador do mapa. A ordem mantém Acesso ao tratamento primeiro e Onde se tratar junto dele. Indicador e modo restringem o mapa, não os quatro Eixos; Tipo de câncer restringe o conteúdo pertinente.

No celular, o painel é inferior, expansível e inicialmente resumido. Há fechamento explícito. Um único controle recolhe e expande o painel e mantém a seleção ([decisão do painel](../ui-polimento/issues/04-painel-meu-municipio.md)); limpar/fechar a seleção é uma ação distinta. Oferecer foco visível, ordem lógica, anúncios de resultado e acesso direto ao painel pelo teclado, sem aprisionamento indevido de foco.

Quando mapa e Meu município estiverem lado a lado, o painel deve alinhar suas bordas superior e inferior às do bloco do mapa, com a legenda dentro dele. Expandir os Eixos não aumenta a altura desse conjunto: conteúdo excedente tem rolagem interna no painel. No celular, não há igualdade de altura com o mapa; o painel se ajusta ao conteúdo, respeitando o limite da janela e o comportamento inferior resumido/expansível existente. Decisão confirmada pelo responsável em 2026-11-04 e implementada diretamente na mesma sessão.

Resultado, classificação, período, origem regional, Referência quando aplicável, Ação e ressalvas essenciais ficam junto do resultado. Explicações extensas ficam em expansões. A explicação do Tipo de câncer fica no ícone ⓘ junto ao rótulo, sem resumo fixo abaixo do seletor; abre por hover, foco, clique ou toque e preserva as notas dinâmicas. Ajuda dos controles usa popover acionável por clique, toque e teclado com descrição acessível; nenhuma ressalva essencial pode depender só de hover. A legenda compacta integra o mapa com cores/texturas e explicações sob demanda, distinguindo Tendência, Situação, qualidade C e dado insuficiente.

A Lista substitui o mapa na mesma área, pelo alternador “Mapa | Lista”, preservando filtros e seleção. Não há tabela ou índice por UF permanentemente abaixo do mapa. O rodapé compacto vem depois da área principal, com identidade, fontes/condições, licenças e código. O aviso integral de construção permanece em todas as páginas, conforme MVP §2.

Metodologia mantém `/metodologia/` e suas âncoras: sumário, coluna de leitura, seções e detalhes expansíveis no mesmo sistema visual. Preservar fontes, dados, versões, condições de reutilização, citação e reprodução, sem resumir o conteúdo de produção ao texto ilustrativo do protótipo.

## Tema e estado

Escolha explícita em `theme=light|dark`, preservada na navegação interna junto de seleção, indicador, Tipo de câncer, modo e visualização Mapa/Lista pertinentes. Sem tema válido, acompanhar o sistema; sem persistência entre visitas. Sem JavaScript, tema do sistema por CSS; a escolha explícita da URL pode ser aprimorada por JavaScript sem impedir leitura básica.

Preservar elegibilidade, padrões e correções de URL do MVP e o comportamento de Voltar/Avançar. Trocas rápidas não exibem resultados da seleção anterior como atuais. Fundos, textos, controles e malha neutra acompanham o tema; as cores estatísticas do mapa têm valores próprios por tema, definidos nos [fundamentos visuais](../ui-polimento/issues/03-fundamentos-visuais.md), sem mudar classes nem significados.

## Painel e contrato existente

O painel usa resultados prontos do pipeline. A aprovação visual não declara concluídas cargas ainda ausentes.

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

Interfaces de referência: `site/src/map/indicator-layer.ts` e `site/src/profile/profile.ts`. Consultar ficha por UF sob demanda quando o painel precisar de campos exclusivos dela; não ampliar o contrato por conveniência visual.

Exceções obrigatórias:

- Mortalidade tem apenas Tendência, sem Situação ou Referência; metas são contexto. Ajuste C55 não calculável não pode virar automaticamente dado insuficiente.
- HPV tem apenas Situação e a explicação “série curta, ainda sem direção”, sem inventar classe de Tendência. Preservar notas de denominador e dose única quando pertinentes.
- Tratamento/próstata não tem Situação: respeitar `has_status`.
- Dado regional identifica “seu município e vizinhos” e nome da região junto do resultado. Dado insuficiente mantém explicação e Ação no painel.
- Faixa C mantém aviso e percentual sem informação; hachura apenas no tratamento correspondente. Preservar distinção entre período da qualidade e ano do valor.
- Recorte quimio/radio, diferenças etárias de mamografia, transição DNA-HPV e demais ressalvas do MVP acompanham o resultado pertinente. Não substituir textos clínicos por exemplos do protótipo.

Nenhuma ampliação estatística do contrato foi identificada como necessária. A implementação deve reutilizar as regras editoriais dos cartões para evitar divergências entre mapa, painel e alternativa textual.

## Acesso sem mapa ou JavaScript e links antigos

Busca e lista inicializam independentemente do mapa/WebGL, com carregamento, falha e nova tentativa próprios. A lista mantém valores, classes, períodos, origens e avisos do estado indicador × Tipo × modo. A falha cartográfica mantém busca e consulta utilizáveis.

Sem JavaScript, o dashboard oferece link nativo para `/municipios/`, página própria com índice por UF em expansão sob demanda e links nativos para documentos com seleção municipal já renderizada, seus quatro Eixos, Ações, ressalvas, fontes e Tipos. Query string sozinha não seleciona conteúdo num servidor estático; usar caminhos pré-gerados ou blocos/âncoras presentes no documento.

As rotas antigas `/municipio/<slug>/` devem entregar o dashboard com seleção equivalente, sem ficha com navegação própria. A solução proposta é reutilizar essas rotas como documentos selecionados do dashboard, reduzindo migração; se a implementação optar por nova rota canônica, usar redirects HTTP da hospedagem, preservando parâmetros e âncoras compatíveis, ou entregar o mesmo HTML do dashboard na rota antiga. Redirecionamento apenas por JavaScript não atende. A convenção técnica final e seu custo devem ser registrados no ticket 38 antes de concluir a mudança.

## Critérios verificáveis para a implementação

- Brasil inteiro sem seleção na abertura; consulta integrada, quatro Eixos, mapa/lista, tema e estado compartilhável, Voltar/Avançar e links legados.
- Origem municipal/regional, insuficiência, qualidade C, ausência/falha de carga, períodos distintos, HPV sem Tendência, mortalidade sem Situação, C55 não calculável e tratamento/próstata sem Situação.
- Dois temas em 320/768/1280 px e zoom de 200%, sem cortes ou rolagem horizontal fora de tabelas; painel inferior resumido/expandido e fechamento/reabertura distinguíveis.
- Teclado, foco, anúncios, ajuda por toque/clique, contraste e texturas; matriz sem JavaScript e com falha de WebGL. Registrar cenários e limitações sem alegar certificação.
- Preservar carregamento sob demanda; medir primeira visita com cache vazio e transferência comprimida (orçamento em torno de 1,3 MB) e saída estática (meta inferior a 30 MB). Os cerca de 675 MB já observados na saída existente são uma pendência, não um orçamento aprovado. Medir, investigar e registrar decisão explícita para qualquer excesso.

## Dependências e fronteira da implementação

| Trabalho | Ticket / reaproveitamento |
| --- | --- |
| Console A: identidade, cabeçalho, controles, legenda e rodapé | [36](../mvp-implementacao/issues/36-console-horizontal-e-sistema-visual.md); reaproveita 30 e 31 |
| Meu município completo integrado e responsivo | [37](../mvp-implementacao/issues/37-consulta-municipal-integrada.md); reaproveita 31 e 33 |
| Mapa/Lista, links municipais e acesso sem mapa/JavaScript | [38](../mvp-implementacao/issues/38-navegacao-resiliente-e-links-municipais.md); reaproveita 09, 32 e 33 |
| Como calculamos no Console A | [39](../mvp-implementacao/issues/39-metodologia-no-console-horizontal.md); reaproveita 34 |
| Conteúdo técnico / dados versionados | Tickets 24 / 22; continuam independentes |
| Auditoria de lançamento / orçamento | Ticket 25; incluir os novos fluxos, sem duplicar auditoria |
| Revisão clínica / cargas HPV e tabagismo | Tickets próprios; aprovação visual não os encerra |

## Revisões explícitas da spec anterior

A consulta completa passa a integrar o dashboard e substitui a prévia seguida de ficha própria. O painel vazio inicial desaparece; o painel móvel é inferior e expansível. A lista ocupa a área do mapa, e o índice estático fica sob demanda. A direção A substitui C e a direção editorial rejeitada. A Metodologia permanece uma página de leitura e as rotas antigas mantêm acesso funcional sem JavaScript.

Nenhuma mudança de método, indicadores, recortes, Referência, classes, cascata ou contrato estatístico foi aprovada. Os exemplos do protótipo não substituem textos clínicos nem resultados publicados.

### Revisão da consulta por UF — 2026-11-05

Aprovada a transferência do índice para `/municipios/`, com apresentação por UF, nome completo e quantidade de municípios. A inicial e os documentos municipais mantêm acesso por link nativo; a consulta continua funcionando sem JavaScript. Substitui a exigência anterior de incluir o índice completo no HTML da inicial, reduzindo seu volume e a interferência na área do mapa.

O acesso à consulta por UF fica na navegação principal, entre “Mapa” e “Como calculamos”, sem link adicional abaixo do mapa (posição aprovada em 2026-11-05).
