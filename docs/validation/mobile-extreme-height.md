# Altura extrema no dashboard mobile

Implementação da [#50](https://github.com/kvojps/brazil-cancer-map/issues/50),
parte da [#44](https://github.com/kvojps/brazil-cancer-map/issues/44).
Regras permanentes: spec, seções 2 e 11, e contrato de interface, seções
Primeira tela no celular, Painel Meu município e Lista.

## Ambiente e fronteira

Verificação em 17/11/2026, Linux, Node 24.20.0, npm 11.19.0 e Google Chrome
for Testing 156.0.8078.4 (build Playwright 1248), com build estático
servido localmente em `http://127.0.0.1:4328`. Base anterior à implementação:
`6b84e65`; os resultados deste documento correspondem ao código do commit que
introduz este relatório. Dados commitados da mesma base, sem nova aquisição ou
alteração; manifesto com `pipeline_version: 0.1.0+a98b5fd` e SHA-256
`a6f0903b978833e46421793dc5ec38e192b6f0468fedf93c18fe39c682816082`.

Ponto de teste confirmado: interface pública no navegador, reaproveitando as
suítes existentes. Os testes não usam uma API interna nova nem cliques forçados.
CSS a 200% altera `font-size` da raiz; zoom nativo a 200% usa a extensão local
existente e verifica redução da viewport CSS. Reduzir a janela aproxima a perda
de altura com teclado; não abre nem comprova teclado físico. São mecanismos
distintos. Emulação não comprova uso em aparelho real.

## Cenários e resultados

O primeiro teste em 568 × 160 com fonte CSS a 200% falhou nos dois temas:
o documento tinha rolagem externa. Durante a implementação também foram
reproduzidos deslocamento de leitura pela ancoragem automática, cabeçalho
interceptando a saída do resumo, instabilidade ao decidir a composição pela
altura dos próprios controles e sobreposição de Mapa/Lista no zoom nativo.
A primeira suíte completa terminou com 390 aprovações e 12 falhas em 402
testes: expectativas antigas de fluxo/rolagem externa, acesso à última linha
da Lista em altura reduzida e posição da folha de filtros, que encobria o
cabeçalho e excedia seu limite normal. As verificações focais subsequentes também corrigiram a posição normal da
legenda, que podia interceptar a busca, e a reserva/rolagem externa à tabela
para alcançar a última linha. O teste antigo de câmera exigia pixels idênticos
antes da redução de altura: passou a admitir o deslocamento mínimo previsto
na spec e observar a geografia recuperada antes de testar detalhes/retorno.
Esse cenário não mede independentemente o zoom ou a distância mínima; os testes
existentes de geografia exata após rotação e fronteira de um pixel continuam
sendo a evidência mais forte nesses aspectos. As falhas motivaram ajustes e permanecem registradas aqui; as execuções
intermediárias não representam a revisão final. A primeira execução ampla foi
interrompida para eliminar concorrência com o arquivo focal; não é contada como
suíte completa aprovada. A revisão também identificou perda dos seletores sem
JavaScript em telas baixas, corrigida preservando sua apresentação em fluxo.

| Cenário | Verificação pela interface |
| --- | --- |
| 568 × 160, fonte CSS 200%, claro/escuro | Fim do aviso alcançável, resumo, Ver detalhes, barra/Menu, filtros, busca cancelada, legenda, conteúdo e retorno; documento sem rolagem externa. |
| Recuperação para 390 × 844 mantendo fonte CSS 200% | Consulta, filtros, URL e Eixo conservados; posição interna limitada somente ao novo máximo; somente a abertura deliberada dos detalhes acrescenta histórico. |
| Alcântara, Balsas, Araioses, próstata e mortalidade em 568 × 160 | Origem regional, Faixa C, Dado insuficiente e ressalva de próstata preservados; detalhes, Ações, retorno, limpar, filtros e nova busca alcançáveis. |
| Larguras 195, 320 e 640 em alturas 422, 450 e 400 | Consulta com leitura interna; Menu, legenda e retorno alcançáveis. |
| Zoom nativo 200% | Ambos os temas; comandos, seleção, detalhes e retorno com JS; fluxo normal sem JS. |
| 320 × 568, 390 × 844, paisagem e altura reduzida | Suítes existentes de leitura, Lista, superfícies, detalhes e primeira tela protegem consulta, foco e contexto. |

Cada caso novo tem uma execução por combinação explicitada na suíte final;
não constitui repetição fria/cache de dez tentativas. As repetições dos três
cenários originais pertencem à verificação conjunta da #44. As suítes de
transporte, histórico, canvas e alternativas preservam sua própria preparação
de rede/cache e não equivalem a uma nova observação física.

## Comandos e limites

```sh
npm run check --prefix site
npm run build --prefix site
npm test --prefix site
SITE_URL=http://127.0.0.1:4328 CHROMIUM_PATH=/caminho/chrome node --test --test-concurrency=3 site/browser-tests/*.test.mjs
```

Tipos: 84 arquivos, sem erros, avisos ou sugestões. Build: 5.574 páginas.
Suíte Node final: 88 testes aprovados. Os 17 cenários focais de regressão
passaram após as correções. A revisão em eixos separados de padrões e spec
não deixou achados técnicos pendentes. A suíte completa final de navegador
passou com **402/402 testes**, sem falhas, cancelamentos ou pulos, em 435,67 s,
com concorrência 3. As auditorias automatizadas de acessibilidade incluídas
não apontaram violações; verificações inconclusivas do axe continuam exigindo
revisão humana. Todos os cenários da tabela foram aprovados nessa execução.

A conferência física Android/Google Chrome pertence à
[#52](https://github.com/kvojps/brazil-cancer-map/issues/52), permanece pendente e exige
aparelho, versões, revisão, orientação, tema, ampliação, teclado e barras reais,
além da matriz acordada. Este relatório não declara compatibilidade comprovada
com iOS/Safari, Firefox ou leitor de tela. Nenhum deploy foi executado. A #44
não pode ser encerrada apenas pela conclusão desta implementação.
