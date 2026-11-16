# Detalhes e Menu da consulta municipal

Entrega da [#46](https://github.com/kvojps/brazil-cancer-map/issues/46), parte da
[#44](https://github.com/kvojps/brazil-cancer-map/issues/44). As regras entregues
ficam na spec, seção 11.2, e no contrato de interface, seção Painel Meu município.

## Comportamento

Na composição mobile flutuante, Ver detalhes abre o Eixo do Indicador e foca o
nome municipal. Os detalhes ocupam a área abaixo do aviso; a barra de nome,
retorno e Menu fica separada do conteúdo com rolagem interna. O mesmo botão que
abre os detalhes passa à barra como retorno, preservando sua identidade para o
teclado. O texto do resumo não expande a consulta.

O Menu oferece busca, filtros e legenda; esta também fica junto do resultado.
Abre uma superfície por vez, com foco em seu primeiro controle. Fechar ou Escape
retoma a leitura e devolve foco ao invocador visível ou ao Menu dos detalhes.
Cancelar a busca conserva a consulta; selecionar outro município fecha a busca,
foca o nome e apresenta seu novo resumo recolhido.

Trocar Indicador mantém detalhes abertos e abre seu Eixo. Trocar só Tipo de
câncer conserva o Eixo em leitura, exceto quando a normalização muda efetivamente
o Indicador. Recolher após aplicar filtros conserva o recorte, a seleção e a
exploração. Fechar uma superfície, recolher detalhes e limpar seleção continuam
sendo ações separadas.

Não foram alterados os cartões editoriais, Ações, períodos, Fontes, ressalvas,
Contrato de dados nem estatística. Desktop mantém a consulta lateral e o HTML
municipal sem JavaScript mantém quatro Eixos e seis Tipos por links nativos.

## Verificações

Fronteira: interface pública no navegador, conforme o ponto de teste aprovado
na #44. Os cenários ampliam as suítes existentes, sem uma infraestrutura nova.

| Suíte | Cenários |
| --- | --- |
| `mobile-surfaces.test.mjs` | Menu → busca/filtros/legenda; exclusividade, foco na superfície e retorno visível; mesmo Eixo e posição interna ao cancelar; nenhuma entrada de histórico para abrir/fechar; legenda junto do resultado; seleção por Enter encerra busca e mostra novo resumo. |
| `mobile-details.test.mjs` | Abertura deliberada, âncoras, foco, retorno e histórico existentes; troca só de Tipo conserva Eixo; troca de Indicador abre seu Eixo; mamografia → próstata normaliza para tratamento sem recolher. Esperas por condições observáveis substituem as pausas fixas anteriores. |
| `mobile-reading.test.mjs` | Posição de leitura no conteúdo interno após resize, nas alturas de 568 e 844 px; espera pela nova geometria sem pausa fixa. |
| `phone-first-screen.test.mjs` | Ressalva de próstata após conclusão observável da carga do recorte. |
| `municipal-panel.test.mjs` | Origem regional, Faixa C, Dado insuficiente, próstata, períodos, Fontes, Ações, desktop, zoom nativo e ausência de JavaScript. |
| Suíte completa de navegador | Regressões dos demais percursos, temas, navegação, mapas, leitura e auditorias automatizadas. |

O teste novo do Menu falhou antes da implementação porque o controle não
existia. Uma segunda verificação detectou deslocamento da leitura ao focar a
barra dentro da área rolável; separar a barra da leitura corrigiu esse cenário.
A exigência adicional de foco dentro das superfícies detectou a visibilidade
herdada do cabeçalho e dos filtros; os controles abertos ficam visíveis mesmo
quando a exploração está oculta pelos detalhes.

## Execução em 16/11/2026

Ambiente local: Node 24.20.0 e Chromium 1248 do Playwright, com toque mobile
emulado. Código baseado em `213f35c9ae20fdb1ffe6ce086af02264a3db9501`, com as
alterações desta entrega. Os dados publicados não mudaram; SHA-256 do manifesto:
`a6f0903b978833e46421793dc5ec38e192b6f0468fedf93c18fe39c682816082`.
A revisão efetiva é o commit que contém este relatório. O build estático contém
a última mudança de código; depois dele, somente testes e documentos mudaram.

- `npm run check --prefix site`: 82 arquivos, zero erros, avisos ou sugestões.
- `npm test --prefix site`: 88 testes aprovados. O comando também gerou o build
  estático; a última execução concluiu em 29,37 s.
- Os três cenários corrigidos de leitura/ressalva passaram isoladamente contra
  a saída estática: 3/3, em 7,78 s.

A prévia final foi iniciada com
`npm run preview --prefix site -- --host 127.0.0.1 --port 4322`.
A porta solicitada estava ocupada; a URL efetiva foi `http://127.0.0.1:4323`.
A suíte completa inclui as auditorias automatizadas de acessibilidade:

```sh
SITE_URL=http://127.0.0.1:4323 CHROMIUM_PATH=/home/kvojps/.cache/ms-playwright/chromium-1248/chrome-linux64/chrome node --test --test-concurrency=2 site/browser-tests/*.test.mjs
```

Resultado final: **374 testes aprovados, zero falhas, cancelamentos ou testes
ignorados**, em 440,24 s. Os dois cenários de posição interna e a ressalva
assíncrona passaram novamente na suíte completa. As auditorias axe não
encontraram violações; mantêm verificações inconclusivas para revisão humana.

### Falhas observadas antes da rodada final

As primeiras execuções no sandbox não puderam abrir o Chromium nem iniciar o
subprocesso do build (`EPERM`); a prévia inicial não ficou disponível, e uma
rodada dirigida encontrou `ERR_CONNECTION_REFUSED`. Essas tentativas não
validaram o comportamento do produto. As execuções seguintes usaram permissão
para os processos locais necessários.

Uma rodada de desenvolvimento de detalhes/superfícies teve 21 aprovações em 23:
falharam a UF preservada na Lista e o foco no nome após busca. A rodada dirigida
seguinte passou 5/5, incluindo esses cenários. Havia recarga automática durante
a edição; isso não comprova a causa das falhas, nem a repetição isolada demonstra
ausência de intermitência.

A rodada ampliada no servidor de desenvolvimento passou 49/51. Em Alcântara,
a barra de ferramentas do Astro interceptou o clique em Ver detalhes; o log
identificou `astro-dev-toolbar`. O teste de teclado ainda esperava a ordem
anterior da barra. A expectativa foi atualizada para retorno → Menu → Limpar
seleção → Legenda → Tipo; a verificação de teclado passou isoladamente.

A primeira suíte completa contra a saída estática passou 371/374, em 425,99 s.
Dois testes de leitura ainda observavam `scrollTop` do painel, mas a rolagem
passou ao conteúdo `.panel-reading`. Foram ajustados para observar esse conteúdo
e aguardar a mudança efetiva de altura após resize. O terceiro teste lia a
ressalva imediatamente após alterar o Tipo, antes da conclusão da carga da
camada. Agora espera o texto público esperado, como já fazia para mortalidade.
Não houve alteração de código do produto entre essa rodada e a final.

## Revisão

Comparação com `213f35c9ae20fdb1ffe6ce086af02264a3db9501`, em dois eixos
independentes. Padrões: sem violações documentadas; o apontamento inicial de
repetição na escolha do invocador foi resolvido por `openerFor`. O retorno de
foco no desktop continua condicionado ao foco estar na superfície.
Spec: sem pendências de implementação após acrescentar este relatório e o
cenário de normalização do Indicador. A revisão complementar dos ajustes dos
testes não encontrou achados relevantes. Resultado: zero pendências em cada eixo.

## Limites

Emulação não comprova aparelho físico Android/Chrome, teclado virtual, barras
móveis reais nem uso com leitor de tela. Axe não substitui revisão humana.
A adaptação extrema continua na #50; a verificação combinada de histórico na
#49 e a conferência conjunta da especificação na #44. Esta entrega não encerra
a issue pai. Não houve aquisição de Fontes, pipeline, push, merge ou deploy.
