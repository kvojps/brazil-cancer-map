# Sistemas de observabilidade: interação aproveitável no Observatório

Pesquisa em 2026-11-04 para [O que aproveitar de sistemas de observabilidade no dashboard do Observatório?](../issues/02-observabilidade.md). Evidência para prototipar; não aprova direção visual nem altera método, indicadores ou contrato.

## Escopo e limites

Foram comparados quatro sistemas: Grafana, Elastic/Kibana, Datadog e Azure Monitor Workbooks. A inspeção consultou documentação oficial pública, seus exemplos descritos e material textual das páginas. Não houve sessão autenticada, teste de produto em execução, medição de desempenho, inspeção de telas móveis nem auditoria de teclado/leitor de tela. As conclusões sobre transferência são **inferências de projeto**, explicitadas abaixo, e não resultados de testes com cidadãos. Documentação de recursos não comprova facilidade de uso nem conformidade de acessibilidade.

O navegador retornou erro ao abrir a página do Geomap do Datadog; seu trecho indexado não foi usado para descrever interação. A URL antiga `workbooks-interactive` falhou; foi localizada a página oficial atual `workbooks-interactive-reports`. Microsoft Learn exibiu aviso genérico de autorização na página de mapas, mas entregou o corpo técnico. Não se presume acesso às imagens originais nem a funcionalidades além do texto recebido.

Base local: [mapa do esforço](../map.md), [GLOSSARY.md](../../../GLOSSARY.md), [spec do MVP](../../mapa-cancer-br/spec-mvp.md), §§2, 5–11, 13–15, e decisões [Como a experiência "meu município" deve parecer?](../../mapa-cancer-br/issues/06-experiencia-meu-municipio.md) e [Com que indicador, tipo e modo o Mapa inicial abre?](../../mapa-cancer-br/issues/26-estado-inicial-do-mapa.md). A exploração atual reabre apresentação; os significados e as restrições abaixo continuam sendo fronteiras da pesquisa.

## Comparação de padrões documentados

| Sistema | Composição e resumo | Contexto e passagem ao detalhe | Uso possível e limite |
|---|---|---|---|
| Grafana | A orientação oficial recomenda uma pergunta definida e progressão do geral ao específico, com gráficos focados e menor carga cognitiva. | Variáveis atualizam os elementos que as usam; parâmetros `var-` permitem contexto na URL. Geomap admite camadas e descrição visível como subtítulo. | Aproveitar hierarquia e filtros compartilháveis; não importar nomenclatura de infraestrutura nem todas as opções do editor. |
| Elastic/Kibana | Dashboards reúnem visualizações, métricas e controles; painéis podem ser organizados em seções recolhíveis. | Drilldown leva seleção, filtros e intervalo temporal ao destino. É diferente de filtrar a tela atual. | Tornar clara a diferença entre mudar o mapa e abrir Meu município. Não oferecer linguagem de consulta ao cidadão. |
| Datadog | Documenta widgets como séries, valor de consulta e tabela. | Variáveis filtram ou agrupam widgets selecionados, permitem vistas salvas e atualizam a URL. Um cabeçalho compacto pode esconder variáveis extras em `+ N`. | Mostrar o contexto que explica os números; evitar ocultar seleções essenciais numa contagem genérica. Não copiar vistas persistidas: a decisão sobre o estado inicial e a URL determina estado apenas na URL. |
| Azure Monitor Workbooks | Relatórios combinam controles e visualizações; mapas agregam medidas por localização e podem codificar tamanho e cor separadamente. | Seleção de linha exporta parâmetro para gráficos seguintes; visibilidade condicional revela detalhes. | Aproveitar a relação seleção → detalhe e explicação próxima ao mapa. Evitar tamanho e cor representando simultaneamente grandezas que o cidadão possa confundir. |

Fontes de cada linha: Grafana — [boas práticas](https://grafana.com/docs/grafana-cloud/learn-and-build/visualizations/dashboards/build-dashboards/best-practices/), [variáveis](https://grafana.com/docs/grafana/latest/visualizations/dashboards/variables/), [URL](https://grafana.com/docs/grafana/latest/visualizations/dashboards/build-dashboards/create-dashboard-url-variables/), [Geomap](https://grafana.com/docs/grafana/latest/visualizations/panels-visualizations/visualizations/geomap/); Elastic — [dashboards](https://www.elastic.co/docs/explore-analyze/dashboards/) e [drilldowns](https://www.elastic.co/docs/explore-analyze/dashboards/drilldowns); Datadog — [dashboards](https://docs.datadoghq.com/dashboards/) e [template variables](https://docs.datadoghq.com/dashboards/template_variables/); Azure — [interatividade](https://learn.microsoft.com/en-us/azure/azure-monitor/visualize/workbooks-interactive-reports), [visualizações](https://learn.microsoft.com/en-us/azure/azure-monitor/visualize/workbooks-visualizations) e [mapas](https://learn.microsoft.com/en-us/azure/azure-monitor/visualize/workbooks-map-visualizations).

## Transferir interação, sem importar estética operacional

As recomendações seguintes são inferências para o Observatório, sustentadas pelos mecanismos comparados e delimitadas pela spec.

**Resumo e densidade.** Prototipar um panorama que responda uma pergunta por bloco: qual território, qual Indicador, qual período e o que se pode entender. Um número grande precisa dessas três identidades junto dele. O mapa central pode organizar a exploração, mas cartões ao redor não devem parecer um placar de desempenho municipal. Evitar lista de “piores”, ordenação por cor ou medidor geral de saúde: Referência não é ranking, Tendência não é risco individual e os Eixos usam recortes diferentes (§§5, 7, 9–11). A orientação do Grafana sobre foco apoia reduzir painéis; não fornece um número universal de cartões.

**Contexto persistente.** Manter visíveis município/Brasil, Tipo de câncer e indicador/modo ativo; mostrar quais conteúdos mudaram quando uma seleção só afeta parte da página. O mecanismo de URL das referências sustenta compartilhar e voltar ao mesmo contexto. A implementação deve seguir a decisão sobre o estado inicial e a URL, inclusive padrões omitidos, ausência de memória entre visitas e aviso ao trocar para combinação inaplicável. Filtros essenciais não devem depender de hover ou de abrir um menu de excesso. No Meu município, o Tipo de câncer continua explicando todos os Eixos; a origem geográfica continua específica de cada Indicador.

**Do panorama ao detalhe.** Separar os verbos “mostrar no mapa” e “ver Meu município”. Busca e seleção geográfica devem chegar ao mesmo conteúdo; o contorno local e o nome do território confirmam a seleção. A ficha preserva os quatro Eixos, com Acesso ao tratamento primeiro; no celular, fica abaixo do mapa conforme decisão sobre a experiência Meu município. O detalhe técnico pode aparecer em “O que é este número?” e “Como calculamos”. Não ocultar ali o período, a origem “Seu município e vizinhos”, a qualidade faixa C ou ressalvas essenciais. Ação permanece visível mesmo com dado insuficiente (§§8, 10–11).

## Anual não é tempo real

Datadog documenta atualização mais frequente para janelas menores e variáveis cujos valores podem depender do intervalo consultado ([dashboards](https://docs.datadoghq.com/dashboards/), [variáveis](https://docs.datadoghq.com/dashboards/template_variables/)). Isso esclarece uma diferença de domínio, não uma proposta a copiar.

No Observatório, “último dado” é próprio de cada fonte: Situação usa último ano consolidado; Tendência usa janela de anos consolidados; há anos provisórios e série citopatológica encerrada. Prototipar período junto de cada valor e janela junto da série. Data de extração/atualização fica identificada separadamente, sem sugerir que todos os indicadores descrevem o mesmo ano (§§5–7, 11, 15). Evitar “ao vivo”, contador de atualização, pulsação, alerta sonoro, seletor “últimas 24 horas” e um único ano global que silenciosamente apague fontes. Não substituir Tendência estatística por diferença entre primeiro e último ponto, minigráfico ou seta de variação recente. Anos provisórios tracejados e a mudança de dose HPV em 2024 comunicam comparabilidade, não incidentes (§6.4).

## Estados que não podem virar o mesmo vazio

Grafana Alerting distingue consulta bem-sucedida sem pontos de falha de avaliação; essa evidência pertence a alertas, não demonstra comportamento dos painéis ([No Data and Error states](https://grafana.com/docs/grafana/latest/alerting/fundamentals/alert-rule-evaluation/nodata-and-error-states/)). A distinção é útil como princípio, mas os estados públicos precisam respeitar o domínio:

| Estado | Resposta a prototipar |
|---|---|
| Carregando JSON/mapa | Mensagem transitória identificando o conteúdo; não mostrar zero nem uma classe provisória. |
| Falha de carregamento | Explicar que o conteúdo não foi carregado, oferecer nova tentativa e conservar navegação/leitura estática disponível. |
| Dado insuficiente | Texto acolhedor previsto na spec, pontos no mapa, Ação mantida e contexto da UF na ficha; não tratar como falha técnica. |
| Sem direção clara | Classe válida da Tendência, explicitando incerteza; não chamar de estável. |
| Eixo sem indicador para o tipo | Justificativa e Ação alternativa; não esconder o Eixo nem sugerir erro. |
| Região imediata | Nomear “Seu município e vizinhos” e motivo; não apresentar número regional como municipal. |
| Série encerrada/provisória | Nota temporal específica; não usar “desatualizado” genérico. |

Não manter silenciosamente um número anterior quando o novo carregamento falha: a seleção e o dado poderiam divergir. O pipeline já entrega classes, origem e qualidade; estados de interface não autorizam recalcular, imputar zero ou agregar dados no navegador (§§13–15).

## Desktop, mobile e acessibilidade

Como critério externo, a explicação oficial de [WCAG Reflow](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html) considera largura equivalente a 320 CSS px e reconhece exceções para conteúdo que requer duas dimensões, como mapas. Isso não isenta os textos e controles ao redor. [WCAG Status Messages](https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html) orienta tornar mensagens de espera, resultado e erro programaticamente identificáveis sem necessariamente mover o foco. São referências de avaliação; não se está certificando o projeto.

Aplicação inferida: no desktop, testar mapa e resumo sem exigir leitura em zigue-zague; no mobile, reorganizar em fluxo vertical e manter busca acessível antes de exigir precisão no mapa. Comparar cartões empilhados com resumo compacto, sem reduzir fontes para caber a grade desktop. Mapa e série precisam alternativa textual/tabela; os mesmos filtros e ressalvas devem explicar ambas. Navegação e acesso a detalhes devem funcionar por teclado e toque, sem informação exclusiva em tooltip. Cor sempre acompanha rótulo e textura conforme §11; alto contraste ou tema escuro das referências não substituem essas exigências. Ler Meu município sem JavaScript continua requisito (§11.2).

## O que levar aos protótipos, sem escolher pelo responsável

1. Comparar densidades de resumo do Brasil com território/período explícitos, observando se cidadãos confundem resumos de anos diferentes.
2. Testar troca de Tipo de câncer e abertura/retorno de Meu município, verificando se a pessoa identifica os filtros ativos e a origem regional.
3. Incluir exemplos de dado insuficiente, faixa C, série provisória e erro técnico para verificar se os textos distinguem os estados.
4. Verificar mobile, zoom, teclado e alternativa tabular com os mesmos cenários; avaliar descoberta da Ação e dos detalhes técnicos.

Quantidade de cartões, disposição ao redor do mapa, estilo gráfico e navegação exata permanecem escolhas humanas informadas pelos protótipos. Novos resumos nacionais ou comparações que exijam campos ausentes precisam ser especificados depois, no contrato de dados, com cálculo no pipeline; esta pesquisa não os aprova.
