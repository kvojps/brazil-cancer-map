# Validação integrada mobile — issue #31

Verificação local em 15/11/2026 da
[#31](https://github.com/kvojps/brazil-cancer-map/issues/31), contra os critérios
conjuntos da [especificação #26](https://github.com/kvojps/brazil-cancer-map/issues/26).
Base integrada: `98e3e69816132edf1e9e69a7c4c14b2f748994a2`.
Responsável pela execução automatizada: Codex, Linux, Node 24.20.0,
Chrome for Testing 156.0.8078.4 e Playwright 1.64.1.

## Entregas e fronteira da conferência

As quatro entregas estavam integradas e fechadas antes desta execução:

- [#27](https://github.com/kvojps/brazil-cancer-map/issues/27): toque, hover,
  destaque e enquadramento; [evidência própria](mobile-map-selection.md).
- [#28](https://github.com/kvojps/brazil-cancer-map/issues/28): resumo, detalhes,
  retorno, histórico e recuperação de erros.
- [#29](https://github.com/kvojps/brazil-cancer-map/issues/29): exclusão entre
  busca, filtros e legenda e retorno do foco.
- [#30](https://github.com/kvojps/brazil-cancer-map/issues/30): espaço útil,
  gráficos e leitura estreita/horizontal; [evidência própria](mobile-reading.md).

O fechamento dessas entregas não foi usado como prova dos critérios conjuntos.
A conferência abaixo cruza os percursos públicos dos testes existentes, a
[spec vigente, seção 11](../spec.md#11-experiência), o
[contrato de interface](../ui-contract.md) e o
[ADR 10](../adr/0010-static-municipal-links.md).
Foram estendidos os testes de chegada por busca, link direto e primeiro toque
para percorrer resumo → quatro Eixos → retorno, conservando URL e geografia.
Também foi ajustada a espera pelo fechamento da busca em um teste antigo,
conforme o registro de execução abaixo. Não houve alteração no código do
produto, pipeline ou dados publicados.

## Matriz dos critérios conjuntos

Os números de histórias abaixo correspondem à #26. Os caminhos de testes são
relativos a `site/browser-tests/`. Esta matriz descreve o alcance da automação;
não constitui aprovação física ou de leitor de tela.

| Histórias da #26 | Cenários e evidências verificáveis |
| --- | --- |
| 1–5, 29: toque, destaque, câmera, busca, link e mouse | `map-touch.test.mjs`: toque emulado no canvas WebGL, sem evento sintético de seleção; contorno em captura; ausência de popup; mouse após toque; zoom e deslocamento manuais; comparação de municípios nos mesmos pixels, inclusive borda e chegada por busca/link. Os três caminhos percorrem resumo, detalhes e retorno. |
| 6, 14, 17–18: Lista, retorno e seleção distinta de limpar | `mobile-details.test.mjs`: seleção pelo link da Lista, resumo, detalhes, “Voltar à lista”, posição de rolagem, UF, filtros e alternância Mapa/Lista; `integrated-profile.test.mjs`: recolher mantém seleção, limpar a encerra. |
| 7–10: nome/UF, resultado, período, origem e ressalvas | `municipal-panel.test.mjs`: Balsas com Faixa C, percentual sem informação e período; Alcântara com origem regional e ressalva longa; próstata com ressalvas curta/integral; mortalidade com ajuste C55 não calculável, valor e origem. `map-state-accessibility.test.mjs`: compara as 27 combinações de indicador/tipo/modo com os JSON publicados nos dois temas. |
| 11–13: Dado insuficiente, Ações e quatro Eixos | `municipal-panel.test.mjs`: Araioses sem número, explicação, contexto estadual e Ação nos detalhes; `mobile-details.test.mjs` e `integrated-profile.test.mjs`: abertura deliberada, quatro Eixos e recortes. |
| 14–16: retorno e histórico | `mobile-details.test.mjs`: Voltar recolhe antes de percorrer municípios/filtros; Avançar restaura; âncora direta, links entre Eixos e recarga da entrada de detalhes sem etapas extras. A troca de município no cenário de histórico é disparada por evento sintético; os controles de histórico são exercitados pelo navegador. `map-touch.test.mjs`: retorno e troca Mapa/Lista mantêm geografia; rotação conserva seleção e zoom explorado. |
| 19–21, 28: superfícies, seleção pela busca e foco | `mobile-surfaces.test.mjs`: busca/filtros/legenda exclusivos, Escape e controles de fechar, invocação por teclado, retorno do foco mesmo após Tab sair da superfície, filtros aplicados e nova consulta recolhida em Mapa/Lista. `municipal-panel.test.mjs`: foco visível e operação do painel por teclado. |
| 22–24: espaço estreito, horizontal, rotação e teclado | `mobile-reading.test.mjs`: 320 × 568, 390 × 844, 568 × 320, 844 × 390 e 390 × 360, nos dois temas; controles, última linha da Lista e Ações alcançáveis; foco e resultados após reduzir a altura da busca; ressalva longa com e sem seleção. `map-touch.test.mjs`: giro e retorno depois de ampliar. Altura reduzida aproxima teclado; não abre um teclado real. |
| 23, 25: ampliação, gráficos e tabela | `mobile-reading.test.mjs`: rótulos renderizados de pelo menos 12 px, eixos sem cortes e tabela; `municipal-panel.test.mjs`, `municipality.test.mjs`, `phone-first-screen.test.mjs`: zoom nativo de 200%, composição em fluxo e ambos os temas. |
| 26–27: falha, nova tentativa e mudanças rápidas | `integrated-profile.test.mjs`: erro no resumo recolhido, sem resultado antigo e distinto de Dado insuficiente; nova tentativa; resposta atrasada não substitui seleção atual. Esses dois cenários usam evento de seleção sintético, complementando os percursos reais de canvas, busca e Lista; não comprovam velocidade de toques reais. `mobile-details.test.mjs`: indisponibilidade no recorte também é distinta do erro. |
| 30: desktop, sem JavaScript e sem mapa | `desktop-first-screen.test.mjs`: composição, rolagem e teclado; `municipality.test.mjs`, `municipal-panel.test.mjs`, `reading-pages.test.mjs`: documentos estáticos, tipos, Eixos, links e índice sem JavaScript; `map-alternatives.test.mjs`: WebGL indisponível ou malha pendente sem bloquear busca, Lista e consulta. |

## Reprodução e resultados

Os comandos partem da raiz. `npm test` também gera o build; a suíte de navegador
usa esse mesmo `site/dist`, sem outro build simultâneo. O servidor local só
entrega arquivos estáticos; não consulta as Fontes oficiais.

```sh
npm run check --prefix site
npm test --prefix site
python3 -m http.server 4331 --bind 127.0.0.1 --directory site/dist
```

Em outro terminal, configure `CHROMIUM_PATH` com o Chromium instalado:

```sh
SITE_URL=http://127.0.0.1:4331 node --test site/browser-tests/map-touch.test.mjs
SITE_URL=http://127.0.0.1:4331 node --test --test-concurrency=3 site/browser-tests/*.test.mjs
```

- `npm run check`: 82 arquivos, nenhum erro, aviso ou sugestão.
- `npm test`: 88 testes aprovados em 29,60 s, incluindo build estático novo.
- `map-touch.test.mjs` isolado: seis testes aprovados em 71,84 s.

A primeira execução completa teve 347 aprovações e uma falha em 348 testes,
em 297,36 s. O cenário antigo “the search expands over the header and closes
when a municipality is chosen” encontrou a busca visível na leitura imediata
após clicar no resultado. O mesmo cenário passou duas vezes isoladamente,
sem alteração, em 4,78 s e 4,92 s. Foi substituída somente essa leitura
instantânea por `waitFor({ state: 'hidden' })`: o teste continua exigindo busca
oculta e falha se o fechamento não ocorrer, aguardando o estado público sem
pausa fixa. Não se atribui a falha a uma causa de produto comprovada nem se
declara falha persistente de fechamento; houve uma observação intermitente.

O arquivo `phone-first-screen.test.mjs` completo passou nos 43 testes em 39,74 s
após esse ajuste. A repetição completa sobre os arquivos finais passou nos
**348 testes de navegador**, em 311,14 s, sem falhas, cancelamentos, exclusões
ou testes pendentes. Inclui desktop, ausência de JavaScript/WebGL, ampliação
nativa, ambos os temas e as duas suítes de acessibilidade. Nas 24 auditorias de
documentos, o axe 4.14.0 não encontrou violações e registrou de zero a duas
verificações inconclusivas por documento, que exigem revisão humana.

## Revisão da entrega

### Standards

A revisão independente não encontrou violação documentada. Apontou uma
possível duplicação não bloqueante nos dois blocos curtos de resumo → detalhes
→ retorno de `map-touch.test.mjs`. Os passos foram mantidos explícitos em cada
cenário para facilitar a leitura do percurso; a comparação geográfica difere
entre primeiro toque e chegada enquadrada.
Na revisão complementar, a espera pelo estado oculto da busca não trouxe
preocupação adicional de padrões.

### Spec

A revisão independente não encontrou divergência bloqueante ou ampliação do
escopo. Confirmou que o percurso da Lista já está em `mobile-details.test.mjs`
e que a sessão física ausente impede concluir a #31. Sugeriu explicitar também
o evento sintético no cenário de histórico; a matriz foi ajustada.
A revisão complementar confirmou que esperar o fechamento da busca mantém
o comportamento exigido, sem demonstrar a causa da falha inicial.

Resultado: Standards, nenhuma violação e uma heurística não bloqueante; Spec,
nenhuma divergência da alteração, uma precisão documental atendida e o
requisito físico ainda pendente.

## Conferência física pendente

Em 15/11/2026, o responsável informou nesta sessão: “Ainda não conferi”. Não há
sessão física documentada. Naquela execução, a #31 permaneceu aberta e a #26 não foi editada nem
encerrada pela entrega. A tarefa restante é executar o roteiro abaixo em
aparelho real, corrigir falhas ou abrir trabalho explícito e anexar o resultado
na #31 e neste registro antes de reavaliar o fechamento.

Preencher os campos sem substituir os resultados pela emulação:

| Campo | Registro pendente |
| --- | --- |
| Data e responsável | A informar |
| Aparelho e sistema/versão | A informar |
| Navegador/versão e URL ou commit consultado | A informar |
| Toque no canvas e exploração de vizinhos | Conferir seleção/destaque, ausência de popup, câmera, resumo, detalhes e retorno. |
| Busca e teclado virtual | Abrir teclado real; alcançar resultados e fechar/selecionar; conferir foco e ausência de sobreposição. |
| Lista e link direto | Selecionar, ler, abrir detalhes e voltar; preservar UF, filtros e posição; abrir URL municipal diretamente. |
| Barras móveis do navegador | Expandir/recolher barras ao rolar; conferir controles, resumo, última linha e Ações alcançáveis. |
| Rotação e ampliação | Girar com zoom e seleção; voltar ao retrato; conferir contexto, gráficos e tabela. |
| Retorno e histórico | Usar Voltar/Avançar do navegador/sistema com detalhes abertos/fechados; conferir filtros e seleção. |
| Casos difíceis e resultado | Conferir origem regional, Faixa C, Dado insuficiente, mortalidade, erro/nova tentativa e trocas rápidas; anotar aprovado/falhou e evidências por cenário. |

Não houve teste físico, Safari/Firefox, leitor de tela, deploy nem nova carga de
dados. Emulação não comprova teclado virtual, barras móveis, GPU ou gesto do
sistema; axe e foco automatizado não comprovam anúncios de leitor de tela.
Uma sessão com leitor de tela continua distinta desta conferência.

## Revisão conjunta da especificação #26 — 15/11/2026

A revisão da pai conferiu a matriz das 30 histórias acima, as regras vigentes
na seção 11 da spec e no contrato de interface e a correção posterior da #32.
As entregas #27–#30 e a validação #31 estão concluídas; #32 também foi aprovada.
Isso não constitui, por si só, comprovação física dos critérios conjuntos.

A última execução registrada, após a correção de recuperação e posição de
leitura, está em [seleção municipal](mobile-selection-recovery.md): 351 testes
de navegador, 88 testes Node, tipos e build aprovados. Esta revisão documental
não repetiu os testes nem alterou o produto. Commits das entregas:
`61402d2` (#27), `133169a`, `b6617ab` e `1455822` (#28), `0db7b09` (#29),
`c020065`, `2f51fdc` e `98e3e69` (#30), `399a2e7` (#31),
`1a19394` e `62f03d9` (#32).

O responsável aprovou o fechamento técnico da #31 e da #32, conforme os
[registros da #31](https://github.com/kvojps/brazil-cancer-map/issues/31#issuecomment-6901723490)
e da [#32](https://github.com/kvojps/brazil-cancer-map/issues/32#issuecomment-6901700572).
Essas aprovações não foram registradas como execução física. A condição de
fechamento da especificação pai continua exigindo essa evidência.
A pendência tem acompanhamento próprio na
[#33](https://github.com/kvojps/brazil-cancer-map/issues/33), evitando deixar
trabalho humano sem ticket após o encerramento da #31.

Nesta revisão, o responsável informou: “Conferi; vou informar os resultados”.
Os campos e resultados da sessão ainda aguardam o relato; não se presume
aprovação de cenários individuais. A #26 permanece aberta até completar a
conferência conjunta com essa evidência.
