# Lista com rolagem interna e contexto preservado

Entrega da [#47](https://github.com/kvojps/brazil-cancer-map/issues/47), parte da
[#44](https://github.com/kvojps/brazil-cancer-map/issues/44). Regras na spec,
seção 11, e no contrato de interface, seção Lista.

## Comportamento e fronteira

Na composição flutuante (largura de pelo menos 300 px e altura útil de pelo
menos 520 px), a Lista ocupa o espaço restante do dashboard. As linhas rolam
internamente; aviso, cabeçalho, Filtros, Mapa/Lista e UF permanecem disponíveis.
As notas abertas têm área rolável própria. O espaço final e o limite de altura
do resumo permitem alcançar campos e controles da última linha acima dele.
O limite do resumo desconta o início efetivo das linhas e reserva 6rem para
exploração, além da reserva mínima existente. As fontes não são compactadas.

Selecionar o nome conserva Lista, UF, expansões, filtros e posição interna;
o resumo começa recolhido e a seleção passa ao caminho municipal. O botão da
linha apenas expande os campos. Alternar visualizações recupera o contexto da
Lista. A seleção pela Lista conserva o zoom do Mapa; ao reaparecer, o Mapa pode
receber deslocamento mínimo para revelar a seleção, inclusive se estava fora
da área visível. O ponto de toque anterior só é reutilizado para seu próprio
município. Busca e link direto conservam seu enquadramento de chegada.

A fronteira de testes é a interface pública no navegador, aprovada na #44.
Não foi criada API de testes. Pipeline, estatística, Contrato de dados e textos
clínicos não mudaram. A forma estreita/larga continua seguindo a largura da
Lista. A remoção das linhas enquanto o Mapa está ativo e o reaproveitamento dos
links durante seleção já existiam; a entrega verifica sua preservação.

## Matriz de evidências

| Transição / critério | Observação automatizada |
| --- | --- |
| Percorrer Lista | `list`: roda do mouse move `scrollTop` interno, documento fica em zero; UF, aviso e controles permanecem no mesmo lugar. |
| Última linha e teclado | `list`: último município aberto, último campo revelado e retorno por Shift+Tab/Tab ao controle, acima do resumo em 390×844 e 320×568; foco em linhas intermediárias e retorno para cima. |
| Selecionar durante carga | `list`: documento de Olinda retido na fronteira HTTP, seleção de Recife, liberação da resposta antiga e consulta final de Recife; UF PE, linha de Olinda aberta, Tipo mama, Lista e posição mantidos nas duas larguras. |
| Alternar e retornar dos detalhes | `mobile-details` e `list`: posição interna, UF, expansões, caminho e filtros durante a visita. |
| Câmera | `map-touch`: toque emulado real, zoom deliberado, detalhes e Mapa/Lista; seleção de outro município pela Lista conserva rótulos geográficos nos pontos públicos observados. |
| Links sem reconstrução desnecessária | `municipality-selection`: observa mudanças de destino e substituições no DOM dos links durante seleções; UF e expansões recuperadas ao reabrir Lista. O evento interno de seleção desse teste não comprova toque no canvas. |
| Sem WebGL / malha pendente / falha | `map-alternatives`: Lista e busca independentes do canvas, falhas separadas e nova tentativa. `list`: falha de camada remove dados antigos e oferece recuperação. |
| Compatibilidade | Suítes existentes de desktop, leitura, município estático, zoom, temas e sem JavaScript; auditorias axe e estados do mapa. |

## Execução em 16/11/2026

Base: `0f3e8b4adfb87a5bb180d2cd6d02730ff891f841`, na branch `hml`.
Node 24.20.0, Chromium 1248 do Playwright, Linux, toque mobile emulado.
Dados publicados preservados; SHA-256 de `manifest.json`:
`a6f0903b978833e46421793dc5ec38e192b6f0468fedf93c18fe39c682816082`.
A revisão efetiva é o commit que contém este relatório.

- `npm run check --prefix site`: 82 arquivos, zero erros, avisos ou sugestões.
- Rodada intermediária da Lista: 27/27 testes aprovados, em 111,21 s.
- Última linha ampliada para 320 px, após a correção de altura do resumo e
  retorno real de foco por Tab: 2/2 aprovados, em 6,85 s.
- `npm test --prefix site`, revisão final: 88/88 aprovados, em 25,34 s; inclui
  geração do build estático.
- Cenários dirigidos após a correção sem JavaScript: 7/7 aprovados em 17,51 s
  (última linha nas duas larguras, borda e aviso nos dois temas/com e sem JS).
- Suíte completa de navegador final: **377/377 aprovados**, zero falhas,
  cancelamentos ou testes ignorados, em 469,32 s. Inclui as duas auditorias
  automatizadas de acessibilidade. Axe não encontrou violações, mas manteve
  verificações inconclusivas para revisão humana.
- `git diff --check`: sem problemas de espaços em branco.

Comandos da rodada final, executados sequencialmente (o teste Node gera build):

```sh
npm test --prefix site
npm run preview --prefix site -- --host 127.0.0.1 --port 44747
SITE_URL=http://127.0.0.1:44747 CHROMIUM_PATH=/home/kvojps/.cache/ms-playwright/chromium-1248/chrome-linux64/chrome node --test --test-concurrency=2 site/browser-tests/*.test.mjs
```

A prévia final usou a porta solicitada, `http://127.0.0.1:44747`. O build
contém o código final; depois da rodada, somente este relatório foi atualizado.
A suíte completa inclui as duas auditorias automatizadas de acessibilidade.
Não houve download de Fontes, atualização de dados, Release ou deploy.

## Revisão independente

Base confirmada pelo responsável: `0f3e8b4`. Dois revisores com contexto novo
examinaram o diff da implementação (`6ef8123`), conforme a skill `code-review`.

### Standards

Zero achados. Não foram identificadas violações dos padrões documentados nem
smells com justificativa suficiente. A medição da Lista permanece junto das
medições do painel; o enquadramento permanece no módulo da câmera.

### Spec

Zero achados de divergência de implementação. Os revisores mantiveram a
conclusão condicionada às verificações obrigatórias, sem tratar emulação como
validação física nem fechar a especificação pai.

A revisão suplementar examinou a correção posterior de `contain: size`,
preservando o fluxo de documentos sem JavaScript, e a espera por dados públicos no cenário de borda.
Não encontrou novos problemas de código ou de Spec. Apontou uma frase deste
relatório que dizia não haver mudança posterior no código; ela foi corrigida
para registrar o follow-up. Resultado: um ajuste documental de Standards,
resolvido; zero achados de Spec. A revisão final suplementar também conferiu a
exceção explícita no `noscript`: zero achados restantes nos dois eixos.

## Falhas encontradas e limites

O teste novo de rolagem falhou na revisão anterior: as linhas não rolavam na
área interna. Na primeira implementação, o alternador interceptava o botão de
Alcântara a 320 px. Mover Mapa/Lista para junto de Filtros corrigiu esse caso;
a reserva final passou a ser conteúdo rolável, sem impor altura mínima à área.
O teste geográfico detectou reenquadramento ao selecionar pela Lista; o percurso
passou a preservar a câmera. Uma rodada intermediária detectou regressão na
rotação e recuperação de altura: o ajuste de ponto fora da tela foi limitado ao
retorno da Lista. Essas rodadas foram substituídas pelas verificações completas, sem
apagar suas falhas. O teste ampliado da última linha também detectou campo
encoberto a 320 px, corrigido pelo limite de altura do resumo. Seu retorno de
foco usa tabulação real: focar novamente um botão já ativo após rolar outro
campo não solicita nova rolagem ao navegador.

A primeira rodada completa teve **374 aprovações e três falhas em 377 testes**,
em 475,75 s. Duas falhas, nos temas claro/escuro sem JavaScript, revelaram que a
contenção de tamanho também alcançava o documento estático e fazia o aviso
perder a referência da rolagem. A exceção sem JavaScript passou a retirar explicitamente a contenção.
A terceira falhou antes do toque, por não encontrar tooltip junto à borda: o
teste aguardava malha e HTML municipal, mas podia explorar antes dos dados da
camada. Seis execuções isoladas em contextos novos passaram sem mudar o teste;
isso não apagou a falha concorrente. A preparação passou a esperar resultado e
fim do carregamento públicos, retirando a pausa fixa de 300 ms, sem relaxar a
comparação da fronteira. Uma rodada posterior foi interrompida após detectar rolagem externa por foco
na Lista: o seletor condicional baseado em `html[data-js]` dentro de `@scope`
não aplicava a contenção ao dashboard. A correção final manteve a regra da
composição e acrescentou `contain: none` ao bloco `noscript` municipal já
existente. Os cenários de fim da Lista, aviso sem JavaScript e borda do mapa
são executados antes da nova suíte completa, sem esconder as falhas anteriores.

Tentativas iniciais no sandbox não abriram Chromium/servidor local; uma prévia
escolheu outra porta, e uma tentativa não alcançou o servidor pretendido. Os
processos necessários foram executados com permissão fora do sandbox. Rodadas
intermediárias foram interrompidas para reconstruir e verificar a revisão final;
não contam como aprovação de suíte completa.

A composição extrema abaixo de 300 px de largura ou 520 px de altura útil
continua na #50. A matriz integrada e as repetições frias/cache dos três cenários
originais da #44 pertencem à #51; a conferência física Android/Google Chrome,
à #52. Não foram executadas nesta entrega; emulação não comprova teclado real,
barras móveis, rotação física ou texto ampliado no aparelho. iOS/Safari,
Firefox e sessão humana com leitor de tela permanecem sem validação.

A issue #47 deve permanecer aberta enquanto houver verificação obrigatória
pendente. A entrega não fecha a especificação pai #44.
