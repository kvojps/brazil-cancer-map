# Navegação mobile: verificação integrada — #51

Verificação da [#51](https://github.com/kvojps/brazil-cancer-map/issues/51),
parte da [spec #44](https://github.com/kvojps/brazil-cancer-map/issues/44).
O inventário anterior é a [resolução da #38](https://github.com/kvojps/brazil-cancer-map/issues/38#issuecomment-6904227740);
o protocolo é a [resolução da #39](https://github.com/kvojps/brazil-cancer-map/issues/39#issuecomment-6904317227).

## Revisão, dados e reprodução

Executado em 17/11/2026, Linux, Node 24.20.0, npm 11.19.0, Chrome for Testing
156.0.8078.4 (Playwright Chromium 1248), headless com SwiftShader.
Código do produto: `ad83c2b5894b5d3aa621cdec858cb5e028725b18`, branch `hml`.
Esta entrega acrescenta roteiro/evidências/documentação; não altera o produto
nem os dados. Build estático local: `http://127.0.0.1:4328`, sem deploy.
Manifesto com `pipeline_version: 0.1.0+a98b5fd`, SHA-256
`a6f0903b978833e46421793dc5ec38e192b6f0468fedf93c18fe39c682816082`.
Árvore Git de `site/public/dados`: `6ffc98ee2b05850c8c1ef2d94f72b2570bd5ae62`.
O commit que contém este relatório identifica a versão dos roteiros.

Comandos a partir da raiz, em ordem; aguardar cada comando terminar. `npm test`
também reconstrói a saída: somente iniciar o servidor e navegador depois dele.
Não executar builds simultâneos nem reconstruir enquanto testa a saída servida.

```sh
npm run check --prefix site
npm run build --prefix site
npm test --prefix site
python3 -m http.server 4328 --bind 127.0.0.1 --directory site/dist
```

Em outro terminal, definir `CHROMIUM_PATH` para o executável instalado:

```sh
export SITE_URL=http://127.0.0.1:4328
export CHROMIUM_PATH=/caminho/para/chrome
A11Y_REPORT_DIR=/tmp/51-a11y node --test --test-concurrency=3 site/browser-tests/*.test.mjs
MOBILE_REPORT_DIR=/tmp/51-search node site/scripts/verify-mobile-navigation.mjs
MOBILE_ARRIVAL=canvas MOBILE_REPORT_DIR=/tmp/51-canvas node site/scripts/verify-mobile-navigation.mjs
```

A suíte completa inclui exatamente os dois arquivos de `test:a11y`, sem precisar
reexecutá-los. Os logs versionados estão em [mobile-navigation-evidence](mobile-navigation-evidence/).
O roteiro adicional não usa evento interno de seleção nem interceptação HTTP.
As suítes existentes usam eventos internos em alguns cenários de navegação;
somente `map-touch` e a série `canvas` demonstram reconhecimento de toque no canvas.

## Matriz de transições

IDs organizam a matriz da #44, com referências às linhas equivalentes da
#38. Cada linha automatizável é executada pela suíte completa, uma vez por caso
parametrizado do arquivo; frequência detalhada aparece nos nomes do log.
Esta tabela registra sequência e esperado; o resultado observado de cada teste
está no log, sem atribuir aprovação a passos físicos. Todos os arquivos abaixo
ficam em `site/browser-tests/`, com sufixo `.test.mjs`.

| ID / origem → sequência | Critério/esperado e evidência observável | Cenários executados |
| --- | --- | --- |
| T01 inicial → abrir `/` | Brasil, padrões omitidos, sem painel vazio; geometria da primeira tela | `phone-first-screen`, `desktop-first-screen`; `map-touch`: logo restaura geografia nacional |
| T02 exploração → tocar canvas | Resumo recolhido, hover removido, foco no canvas, câmera preservada | `map-touch`: hybrid device, first cold canvas touch, outline e geografia; série canvas |
| T03 busca → resultado/Enter | Busca fecha, caminho municipal, nome focado, resumo atual | `map-touch`: cold keyboard search e search frames Recife; `mobile-surfaces`; série search |
| T04 Lista → nome/expandir/última linha | UF, expansão, filtros e rolagem interna; última linha/foco acima do resumo | `list`: floating list; `municipality-selection`; `mobile-reading` |
| T05 Mapa → Lista → Mapa | Consulta preservada, posições e geografia recuperadas | `mobile-details`: returning from list details; `map-touch`: hybrid device; `map-alternatives`: list replaces map |
| T06 resumo → tocar texto | Não expande nem rola | `mobile-details`: details are deliberate; `municipal-panel`: collapsed summary |
| T07 resumo → Ver detalhes | Abre Eixo do Indicador e entrada deliberada, nome focado | `mobile-details`: details are deliberate; `municipal-panel`; `map-touch`: direct link/search |
| T08 detalhes → recolher | Preserva seleção/recorte/exploração; retorno por histórico ou remoção de hash | `mobile-details`: anchors, list return, links between axes |
| T09 consulta → abrir superfície | Só uma, sem entrada; foco e leitura conservados | `mobile-surfaces`: temporary surfaces e details commands; `phone-first-screen` |
| T10 superfície → fechar/Escape/fora | Foco no invocador visível; busca cancelada conserva consulta; filtros persistem | `mobile-surfaces`; `phone-first-screen`: menu; série de filtros |
| T11 teclado real → Voltar físico | Pode dispensar apenas teclado; registrar comportamento do Chrome | **Não executado**, exige aparelho: roteiro físico, passo 5 |
| T12 detalhes → trocar Indicador | Permanece aberto no Eixo do novo Indicador, URL normalizada | `mobile-details`: details keep the reading axis; `integrated-profile` |
| T13 detalhes → trocar Tipo | Conserva Eixo; normalização que muda Indicador abre Eixo correspondente; Ações sem número | `mobile-details`: details keep the reading axis e unavailable result |
| T14 consulta → limpar | Retira município/contorno, conserva filtros/câmera e foco visível | `integrated-profile`: returning from clearing; `map-touch`: logo restores country geography while clearing preserves exploration |
| T15 consulta → logo | Brasil/Mapa/padrões, sem painel/superfícies, tema mantido; histórico/foco | `logo-reset`: list and municipal details, closes surfaces, pending response; `map-touch`; séries adicionais |
| T16 leitura/menu → Mapa | Conserva contexto, distinto da logo | `logo-reset`: metodologia e municipios; `reading-pages` |
| T17 link municipal → chegar | Documento canônico, resumo sem etapa artificial; modificadores nativos | `municipality`, `mobile-details`, `logo-reset`: modified activation; `map-touch`: direct link |
| T18 âncora de Eixo/Tipo → chegar | Destino explícito prevalece, detalhes na mesma entrada | `mobile-details`: municipal anchors; `municipality`: native anchors |
| T19 detalhes → link entre Eixos | Destino visível/focado; hash por replace, sem etapa adicional | `mobile-details`: links between axes |
| T20 consulta → Voltar/Avançar/recarga | Restaura URL/detalhes/leitura/Lista, sem push na restauração; recarga revela âncora | `mobile-details`: history restores, Back during new profile load, reloading; `map-alternatives`: invalid state, directory link survives reload |
| T21 carga → nova seleção | Só consulta atual aparece/foca; resumo recolhido | `integrated-profile`: delayed previous municipality; `map-touch`: delayed first touch/new selection; `mobile-details`: new search supersedes anchor |
| T22 carga → limpar/logo | Resposta anterior não reabre nem toma foco | `map-touch`: delayed first touch/clear; `logo-reset`: pending municipal response |
| T23 carga → interação deliberada | Conteúdo conclui sem direcionamento tardio | `map-touch`: mesh pending, deliberate internal scroll; `mobile-details`: deliberate scrolling during anchored load |
| T24 falha → Tentar novamente | Mensagem própria, sem Dado insuficiente falso ou detalhes involuntários | `integrated-profile`: profile failure; `map-alternatives`: layer/list failure; `mobile-details`: mesh failure e anchored retry; `map-touch`: search retry |
| T25 viewport → rotação/altura/ampliação | Consulta/Eixo/histórico preservados; foco/controles e rolagens internas | `mobile-reading`, `phone-first-screen`: native 200%; `municipal-panel`: native 200%; `map-touch`: rotation |
| T26 extremo → recuperar altura | Aviso/barra/conteúdo alcançáveis e leitura limitada só ao máximo novo; sem histórico adicional | `mobile-details`: extreme height with 200% CSS text em ambos os temas; `map-touch`: recovery |
| T27 WebGL/malha falha ou pendente → alternativas | Busca/Lista/consulta funcionam sem canvas | `map-alternatives`: WebGL fails, pending map; `mobile-details`: mesh transport/invalid topology retry |
| T28 leitura/sem JS → navegar | Rolagem normal; HTML municipal com seis Tipos/quatro Eixos/Ações e links nativos | `reading-pages`, `municipality`, `municipal-panel`, `map-alternatives` |
| T29 estados de resultado → ler e agir | Regional/Faixa C/resumo longo, próstata integral, insuficiente, mortalidade e ausência distinguíveis | `municipal-panel`: Alcântara, Balsas, Araioses, prostate, mortality, extreme summary; `integrated-profile`; `mobile-details`: unavailable result; `map-alternatives`: C55 |

T20 agrupa recarga com travessia do histórico; T29 explicita os estados
complementares da #38. T11 é a única transição integralmente reservada ao
aparelho. Em T03, T25 e T26, dispensa de teclado, barras móveis e viewport visual
físicos continuam pendentes apesar da cobertura emulada das ações correspondentes.

## Matriz finita de ambiente e recursos

Não é um produto cartesiano. `mobile-reading` percorre 320×568, 390×844,
568×320, 844×390 e 390×360 nos dois temas. `phone-first-screen` e
`municipal-panel` conferem zoom nativo 200% com extensão local e redução da
viewport CSS, inclusive sem JS. `mobile-details` confere 568×160 e fonte CSS
200%, claro/escuro, recuperação para 390×844, fim do aviso, barra/Menu, busca,
filtros, legenda, Ações e posição de leitura. Fonte CSS e zoom nativo são
mecanismos distintos; nenhum comprova a configuração de texto do Android.

As falhas e atrasos são controlados na fronteira HTTP: lista municipal, camada,
malha, perfil por UF e documento municipal, conforme os testes nomeados na matriz.
Gates retêm respostas até a ação do usuário; 503 ou topologia inválida induzem
falha; remover a interceptação permite retry. Isso simula ordem e falha por
recurso, não uma latência móvel quantificada, offline completo, corrupção de
cache HTTP, CPU/GPU física ou comportamento do provedor. Os casos observam
URL, DOM, foco, geometria, scroll interno e geografia pública conforme pertinente.
As chegadas novas usam dois frames após conteúdo/composição, sem pausa fixa de
200 ms para aprovar foco; testes antigos de hover/animação ainda usam esperas
próprias que não constituem tolerância para foco.

## Repetições e resultados

O roteiro `site/scripts/verify-mobile-navigation.mjs` executa 10 tentativas frias
e 10 com cache em cada viewport, separadamente por busca e canvas. Cada tentativa
percorre primeira seleção → filtros → Escape → logo; portanto os três cenários
têm denominadores próprios iguais, sem contar os três passos como três tentativas
independentes do mesmo relato. Estado inicial: `/`, tema escuro, recorte padrão.
Canvas escolhe um ponto por hover público, depois aplica toque emulado; município
efetivamente selecionado está no caminho/registro. Busca escolhe Recife.

Frio: contexto novo, sem cache nem memória da aplicação. Cache: no mesmo contexto
e documento, preparar exatamente a mesma seleção e retornar pela logo antes de
medir; preserva promises/dados da aplicação. Não há interceptação HTTP nessa série.
O registro de respostas de perfil/documento durante a sequência distingue
reutilização da aplicação de cache HTTP; eventos CDP de cache são auxiliares.
Não afirmar que houve cache de disco apenas por chamar a série de quente.
No canvas quente, a preparação final inclui uma seleção após o enquadramento
nacional e Limpar seleção, conservando a câmera dessa exploração. O roteiro
registra a URL preparada e exige que a seleção medida corresponda a ela.
Não é uma recarga fria nem uma prova de persistência entre visitas.

As séries finais passaram **80/80 tentativas**, com **240 observações** dos três
cenários. Para cada linha abaixo, primeira seleção, filtros e logo tiveram
10/10 aprovações individualmente; nenhum dos três relatos originais foi
reproduzido nessas tentativas. Não são denominadores físicos.

| Viewport | Seleção | Condição | Primeira seleção / filtros / logo |
| --- | --- | --- | --- |
| 320×568 | Busca | Fria | 10/10 · 10/10 · 10/10 |
| 320×568 | Busca | Cache preparado | 10/10 · 10/10 · 10/10 |
| 390×844 | Busca | Fria | 10/10 · 10/10 · 10/10 |
| 390×844 | Busca | Cache preparado | 10/10 · 10/10 · 10/10 |
| 320×568 | Canvas | Fria | 10/10 · 10/10 · 10/10 |
| 320×568 | Canvas | Cache preparado | 10/10 · 10/10 · 10/10 |
| 390×844 | Canvas | Fria | 10/10 · 10/10 · 10/10 |
| 390×844 | Canvas | Cache preparado | 10/10 · 10/10 · 10/10 |

As 40 tentativas frias registraram duas respostas de perfil/documento por
seleção; as 40 quentes registraram zero, confirmando a reutilização preparada.
Cada registro conserva URL,
foco, scroll, dimensões do documento, retângulos de nome/aviso/filtros, `position`,
estado de popover/detalhes, respostas e erro, quando houver. Filtros são
inspecionados abertos e fechados: popover intencional fixo é distinto de seletores
permanentes em fluxo ou fixação indevida no topo. A série finita não prova
ausência de intermitência nem substitui a série física.

## Falhas preservadas e coerência documental

Antes da série final, houve uma execução restrita de `npm test` que falhou ao
iniciar subprocessos; a repetição autorizada passou com 88/88. A primeira série
de navegador começou por engano durante o build interno dessa repetição:
duas tentativas frias em 320×568 receberam saída incompleta/listagem de diretório
e falharam esperando busca. As 38 tentativas seguintes passaram. A imagem e os
40 registros dessa execução de preparação permanecem versionados; não contam
como série final válida sobre build estável nem como reprodução de falha do produto.

A primeira série canvas completou 40/40 percursos da interface, mas das vinte
tentativas chamadas de cache, dez solicitaram dois recursos municipais, uma
solicitou um e nove não solicitaram novos recursos: a preparação não assegurava
a reutilização em toda a série após o enquadramento nacional.
Essa rodada não comprova cache e permanece em `canvas-preparation-attempts.json`.
O roteiro final prepara novamente o alvo depois do enquadramento nacional e
limpa a seleção conservando a câmera; exige mesma URL municipal e zero respostas
novas de perfil/documento na seleção medida. A rodada search anterior também
passou 40/40; foi repetida para executar a versão final das asserções de filtros.

A suíte completa terminou com **401/402 aprovados**, uma falha, sem pulos ou
cancelamentos, em 516,25 s. `interaction while the mesh is pending cancels late
municipal framing` falhou em `country geography provides public reference points`,
antes da seleção e da asserção de cancelamento; o log não capturou screenshot,
foco ou geometria naquele instante, uma limitação da evidência dessa falha.
Sua repetição isolada passou 1/1 em 7,57 s, sem alteração de produto ou teste.
**Falha não reproduzida nessa única repetição; causa não confirmada.** Não é
correto apresentar a suíte completa como aprovada nem atribuir o caso à carga
concorrente sem evidência. T23 tem aprovação isolada desse cenário e dos outros
testes de interação, mas conserva a falha de preparação no conjunto.

Tipos: 84 arquivos, zero erros/avisos/sugestões. Build: 5.574 páginas em 19,40 s.
Node: 88/88. Auditoria automatizada: 24 documentos/condições com axe 4.14.0,
zero violações e 41 ocorrências de verificações inconclusivas;
`axe-summary.json` preserva os IDs e alvos inconclusivos para
revisão humana. A auditoria de estados do mapa incluída na suíte compara as
27 combinações publicadas nos dois temas com os JSON. Resultados por caso e
duração estão em `browser.log`; repetição em `mesh-isolated.log`.

Leitura comparada: spec §§2 e 11, contrato de interface (navegação, URL,
primeira tela, Lista e Meu município), ADRs 1/10 e guia de desenvolvimento
concordam com composição interna mobile, exceções sem JS/leitura/desktop,
reset distinto de retorno e responsabilidades estatísticas do pipeline.
Corrigida a nota antiga do contrato que dizia não haver teste automático de
WebGL: `map-touch` observa geografia e contorno. Relatórios anteriores que
descrevem fluxo ou logo com contexto permanecem históricos, não regras atuais.

## Limites obrigatórios

O [roteiro físico](mobile-navigation-physical.md) está preparado, **não executado**.
A #52 deve registrar Android/Google Chrome, teclado/barras/toque reais e a
revisão efetivamente testada. A #44 permanece aberta; concluir a #51 não valida
seus critérios conjuntos nem elimina a etapa humana. iOS/Safari não executado
por falta de aparelho, Firefox e leitor de tela sem sessão de validação.
Axe não demonstra acessibilidade humana. Nenhuma carga de Fontes, mudança de
pipeline/estatística/Contrato de dados/conteúdo clínico ou publicação ocorreu.

## Revisão da entrega

Skill `code-review`, referência fixa
`ad83c2b5894b5d3aa621cdec858cb5e028725b18`, em dois agentes independentes.

**Standards:** um achado documental corrigido: a primeira redação atribuía duas
respostas municipais a todas as tentativas quentes da rodada canvas de
preparação; a contagem foi reconciliada com o JSON (10 com duas, 1 com uma,
9 sem respostas) no relatório e no índice de evidências. Correção confirmada
pelo revisor. Uma sugestão opcional de extrair o pequeno percurso repetido da
logo não foi aplicada: preparação e medição mantêm esperas próprias explícitas.
Nenhuma violação obrigatória pendente.

**Spec:** zero achados. A entrega de evidências da #51 registra a falha da
suíte completa e não pressupõe aprovação conjunta da #44; conferência física
continua pertencendo à #52. As correções posteriores à execução afetam somente
o relato documental, sem alterar produto, roteiro ou dados testados.

Resultado: Standards 1 corrigido, 0 obrigatórios pendentes; Spec 0.
