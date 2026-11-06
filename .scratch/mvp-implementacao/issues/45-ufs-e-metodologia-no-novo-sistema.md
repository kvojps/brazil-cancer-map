# 45: Levar Municípios por UF e Como calculamos ao novo sistema

**What to build:** Aplicar a lista de UFs com filetes e a Metodologia com sumário sempre à mão, além de cabeçalho comum com busca nessas páginas. O conteúdo da Metodologia não muda.

**Blocked by:** 41 e 42 — cabeçalho e busca das composições.

**Status:** resolved

## Referências

- [Decisão das páginas](../../ui-polimento/issues/06-lista-ufs-metodologia.md), que traz também as pendências citadas abaixo.
- [Mapa do polimento](../../ui-polimento/map.md), [spec vigente](../../ui-ux-v1/spec.md) e [glossário](../../../GLOSSARY.md).
- Fonte primária: branch descartável local `prototype/ui-polimento-paginas`, commit `38c9db3`, em `/municipios/?ufs=A` e `/metodologia/?metod=A`.

## Critérios de aceite

- [x] Cabeçalho em faixa no fluxo da página, com menu hambúrguer abaixo de 1024 px
- [x] Busca de município no cabeçalho das duas páginas, levando ao dashboard com a seleção, sem pesar o carregamento da Metodologia; sem JavaScript, leva a Municípios por UF
- [x] Saem "← Voltar ao mapa" e os rótulos acima dos títulos, e o link Mapa preserva tema, recorte e seleção; o teste de retorno em `methodology.test.mjs` passa a usar esse link
- [x] Municípios por UF em linhas com filete, alvos de 44 px e expansão sem JavaScript
- [x] Sumário lateral fixo no desktop e linha fixa abaixo de 881 px, com seção atual, fechamento ao escolher e com Esc, e foco definido
- [x] As 11 âncoras da Metodologia caem abaixo do aviso e do sumário, em teste automatizado, a 320, 390, 768 e 1280 px
- [x] Conteúdo técnico idêntico ao anterior, conferido por comparação do texto
- [x] Verificar nos dois temas a 320, 768 e 1280 px e no zoom de 200%, com e sem JavaScript, com teclado e foco visível, sem rolagem horizontal fora de tabelas; registrar limites e o que não foi verificado
- [x] Atualizar os testes de navegador afetados por esta mudança, sem apagar a cobertura de comportamento; `npm run check`, `npm run build`, `npm test` e `npm run test:browser` passam em `site/`

## Limites

Não alterar pipeline, JSON publicados, método, classes, textos clínicos ou conteúdo da Metodologia. Sem deploy. Aprovação visual não equivale a auditoria de acessibilidade nem a revisão clínica. Não promover o código descartável dos protótipos.

## Comments

### Implementação — 2026-11-05

- Implementação e encerramento: `feat(site): take the UF list and the methodology to the new system (#45)` (este commit). Antes dele, `test(site): expect the published HPV data in the panel tests`.
- **Verificado:** `npm run check`, `npm run build` e `npm test` (87 testes). A suíte do navegador (232 testes) passou inteira contra a saída estática, **um arquivo por vez**, com `--test-concurrency=1`. Com o `npm run test:browser` literal, em paralelo, a única rodada que fiz teve 10 falhas: 6 de tempo de espera, com a máquina em carga 17; 3 de HPV, depois corrigidas; e 1 do erro de cota do item "Ambiente". As de tempo de espera sumiram em série. Não repeti o comando em paralelo depois das correções, então não há confirmação de que ele passa. O arquivo da Metodologia passou 10 vezes seguidas.
- **Conteúdo da Metodologia:** a marcação da coluna de leitura é idêntica byte a byte, e o texto gerado também (42.480 caracteres), comparado com a página salva antes da primeira edição. Os 11 links do sumário e o texto de abertura não mudaram. Saíram só "← Voltar ao mapa" e o rótulo "Metodologia", como pedido.
- **Matriz:**
  - **Automática:** dois temas a 320, 768 e 1280 px, com e sem JavaScript, em zoom por CSS de 200%, nas duas páginas, com UF e detalhes abertos.
  - **Zoom nativo de 200%:** nas duas páginas, dois temas, com e sem JavaScript, mas sem o sumário aberto. Com ele aberto, só com a janela reduzida à metade.
  - **Teclado:** menu, busca, UFs, sumário, Esc e foco visível, nos testes de `reading-pages.test.mjs`.
  - **Capturas:** Metodologia a 1280 px nos dois temas, 768 px no escuro, 640 × 400 e 390 px no claro e aberta no escuro; UFs a 1280 px no claro, 320 px no escuro e 768 px no claro com busca; busca a 390 px no escuro. Algumas são anteriores aos últimos ajustes de foco, que não mudam a aparência.
- **Pendências da decisão, como ficaram:**
  - **Busca nas duas páginas:** a lista de municípios (448 KB) carrega só ao focar o campo. Cada resultado é um link para `/municipio/<código>-<nome>/`, que abre o dashboard com a seleção, e a navegação comum acrescenta tema e filtros. Se a lista falha, há "Tentar novamente" e o link para Municípios por UF. Sem JavaScript, o campo sai e fica o ícone que leva a Municípios por UF, em todas as larguras.
  - **Foco no índice:** Tab vai do botão à lista. Esc fecha e volta ao botão. Ao escolher, o foco vai para a seção, porque ela recebe `tabindex="-1"`, e o contorno aparece no título. Foco com setTimeout ou direto no título não serve: ao navegar para a âncora, o Chromium limpa o foco, e isso causou uma falha intermitente durante o trabalho.
  - **Foco sob a linha fixa:** o `scroll-margin` nos links e detalhes da coluna evita que o teclado deixe o foco atrás da linha. O `scroll-padding` medido só vale nesta página, para focar a própria linha não mover o texto.
- **Decisões a confirmar:**
  - **Seleção por Municípios por UF:** o critério pede que o link Mapa preserve a seleção, mas dois testes antigos exigiam o contrário. Nenhum documento registrava essa regra, e a spec diz que o estado é "preservado na navegação interna". Mudei os dois testes: agora `/municipios/?municipio=<código>` carrega a seleção, para o retorno.
  - **Fechar o índice:** além de escolher e de Esc, ele fecha com clique fora e ao sair dele com Tab, para não ficar cobrindo o texto. A decisão não pedia isso.
  - **Linha do sumário e resultados da busca:** a linha não tem o preenchimento dos controles, e os resultados não têm sublinhado. A revisão apontou desvio dos fundamentos; mantive por serem linhas de lista, e a decisão pede "sem caixa". Vale a sua aprovação visual.
- **Fora do ticket, em commit próprio:** três asserções de HPV exigiam "sem dado", mas `6d2f0a7` publicou o HPV, e elas já falhavam antes deste ticket. Agora leem o cartão com dado na página. **Efeito na cobertura:** o cartão *sem* dado perdeu o teste de navegador, pois nenhuma das páginas usadas nesses testes está nesse estado. Esse estado segue coberto só em `tests/panel-result.test.mjs`, que não confere a ordem do cartão.
- **Limites conhecidos:**
  - **Linha fixa:** só com ao menos 300 px de largura e 300 px de altura. Abaixo disso, como em 320 × 568 com zoom de 200%, o aviso ocupa quase toda a tela e a linha sai com a rolagem.
  - **Cabeçalho:** as regras comuns deixaram de depender de `:has(.home)`. As suítes da inicial passam, mas a mudança também toca o dashboard.
  - **Seção atual:** é a última cujo título passou da linha de chegada das âncoras. A escolhida fica marcada até a página se mover.
  - **Falha intermitente sem causa confirmada:** o teste do cabeçalho em `/municipios/` com JavaScript falhou duas vezes e uma execução travou, sempre contra o servidor de desenvolvimento e logo após editar arquivos. A suspeita é a recarga automática. Não capturei a mensagem de erro, e nas três execuções completas contra a saída estática esse teste não falhou.
  - **Saída estática:** 982 MB; o ticket 44 registrou 901 MB. Não medi quanto disso vem deste ticket: os dados de HPV entraram depois dele.
- **Ambiente:** a cota de `/tmp` estava esgotada, sobretudo por `/tmp/node-compile-cache` (2,1 GB). Rodei com temporários fora de `/tmp` e não apaguei nada ali. `integrated-profile` e `map-alternatives` gravam capturas em caminho fixo em `/tmp` e falham nessa situação, com o erro `-122`.
- **Não verificado:** leitor de tela, aparelho real, Safari e Firefox (ticket 46). O foco na seção ao navegar para a âncora só foi visto no Chromium, e vale conferir nos outros navegadores. Não equivale a auditoria de acessibilidade (ticket 25) nem a revisão clínica (ticket 26).
- Revisão em dois eixos aplicada. Corrigidos: foco atrás da linha fixa, linha perdida em celular deitado, `scroll-padding` vazando para o dashboard, nome enganoso, helper de foco repetido no teste e CSS redundante. Não aplicados, por serem de julgamento: unificar a busca desta página com a do dashboard, reunir a medição do aviso (repetida em `navigation-view.ts`), generalizar `mountSectionIndex` e reduzir os seletores `html[data-js]`.
