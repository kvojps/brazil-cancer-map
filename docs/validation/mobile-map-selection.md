# Seleção municipal por toque — issue #27

Verificação em 14/11/2026, no Chromium local, para a
[#27](https://github.com/kvojps/brazil-cancer-map/issues/27), parte da
[#26](https://github.com/kvojps/brazil-cancer-map/issues/26).

## Comportamento entregue

O mapa distingue movimento real de mouse e toque por eventos de ponteiro.
Toque remove tooltip e hover anteriores; o movimento de mouse volta a
oferecer o tooltip no mesmo dispositivo. O tooltip não intercepta o ponteiro.
Selecionar pelo canvas conserva a câmera e mostra o painel recolhido no modo
de folha. Somente um ponto encoberto por sobreposições provoca deslocamento,
calculado para o lugar visível mais próximo, sem alterar o zoom.

Busca e link direto enquadram os limites do município na malha carregada,
descontando as sobreposições. A conclusão do carregamento do resultado usa
a mesma regra da seleção inicial. Permanecem as URLs estáticas e os
resultados prontos do Contrato de dados.

Regras permanentes na [spec, seção 11.1](../spec.md#111-mapa-inicial) e no
[contrato de interface](../ui-contract.md#painel-meu-município).

## Evidências

Os cinco cenários de
[`map-touch.test.mjs`](../../site/browser-tests/map-touch.test.mjs) usam a
página pública, WebGL e toque emulado no canvas, sem disparar o evento
interno da aplicação:

- alternância mouse/toque e seleções sucessivas depois de ampliar e arrastar
  o mapa, verificando que os mesmos pontos continuam representando os
  mesmos municípios;
- chegada por link direto, com Recife ocupando várias células visíveis do
  mapa, preservando recorte e tema;
- chegada pela busca, com o mesmo enquadramento municipal;
- primeiro toque sem seleção, painel recolhido, URL municipal, ausência de
  popup e contorno efetivamente renderizado, identificado em captura do canvas;
- toque desobstruído a 10 px da borda, com uma fronteira municipal localizada
  antes e depois com precisão de um pixel, para detectar pequenos deslocamentos indevidos.

Antes das correções, o primeiro cenário falhou pela permanência do popup e,
depois, pela mudança da geografia após a seleção. A regressão da borda também
falhou antes do ajuste de oclusão: um ponto que representava São Lourenço da
Mata passou a representar Paudalho. Os cinco cenários passaram depois das
correções, inclusive contra a saída estática.

O teste do contorno oculta somente as sobreposições HTML durante a captura;
as interações e a verificação de visibilidade usam a composição normal.
O enquadramento é observado pela geografia renderizada, sem expor uma API
de teste para acessar a câmera interna.

## Verificações executadas

Comandos a partir da raiz, com a prévia estática na porta 4322:

```sh
npm run check --prefix site
NODE_OPTIONS=--max-old-space-size=5120 npm test --prefix site
SITE_URL=http://127.0.0.1:4322 node --test site/browser-tests/map-touch.test.mjs
SITE_URL=http://127.0.0.1:4322 node --test --test-concurrency=2 site/browser-tests/*.test.mjs
```

Resultados finais: tipos sem erros, avisos ou sugestões nos 74 arquivos;
87 testes Node aprovados, incluindo o build; cinco cenários de toque
aprovados isoladamente; **322 testes de navegador aprovados**, sem falhas,
cancelamentos ou exclusões. A suíte completa inclui acessibilidade, desktop,
Lista, filtros, URLs, consulta sem WebGL e leitura sem JavaScript. O axe
não detectou violações, mas manteve verificações inconclusivas para revisão humana.

A primeira execução completa, serial, aprovou 321 de 322 testes. O teste
existente de abrir o menu com Filtros abertos consultava a visibilidade
imediatamente, sem aguardar o handler assíncrono de `details.toggle`.
Ele passou isoladamente e na repetição dos 43 testes do arquivo mobile,
antes de qualquer ajuste. O teste agora aguarda o estado oculto dos Filtros,
tanto ao abrir menu quanto busca; esse ajuste não muda o produto. A execução
completa final, com dois arquivos simultâneos, aprovou os 322 testes.

## Revisão e limites

A revisão independente de padrões apontou duplicação na leitura das
sobreposições; ela foi reunida em `overlayBoxes`. A revisão de aderência
apontou o recolhimento ao selecionar novamente pelo mapa e a margem que
movia pontos desobstruídos. Ambos foram corrigidos. A segunda leitura dos
dois eixos não encontrou pendências.

Não houve teste em aparelho físico, Firefox, Safari ou leitor de tela.
A emulação não comprova teclado virtual, barras do navegador ou toque em
aparelho real; a validação física conjunta permanece no escopo da #26.
Esta entrega não altera o pipeline, os dados, o resumo editorial ou o
histórico dos detalhes, nem publica o site.
