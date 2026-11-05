# Verificação do ticket 39 — Metodologia no Console horizontal

Data: 04/11/2026. Escopo: apresentação e navegação de `/metodologia/` no sistema visual A. Não altera método, fontes, dados ou textos clínicos; não encerra os tickets 22, 24 ou 25.

## Composição e conteúdo

- Shell compartilhado existente: identidade, navegação, tema, aviso integral de construção e rodapé.
- Sumário numerado, fixo durante a leitura em desktop e no fluxo em telas estreitas; dez seções numeradas em superfícies do Console, coluna de até 72 caracteres e expansão nativa para downloads.
- Retorno ao mapa preserva indicador, Tipo, modo, seleção municipal, Mapa/Lista e tema pela URL com JavaScript, inclusive após navegar entre âncoras da Metodologia. Sem JavaScript, sumário, retorno nativo, fontes, downloads e expansão continuam utilizáveis; o tema acompanha o sistema, conforme a spec.
- Comparação literal da coluna de leitura contra `92935e2`: conteúdo, links e âncoras técnicos idênticos após remover apenas os novos marcadores numéricos dos títulos.
- Inspeção das capturas locais de 1280 px/claro e 320 px/escuro. Nenhuma fonte externa adicionada.

## Verificação automatizada

- Ciclo red/green na interface pública `navigationUrl`: o novo teste detectou a perda de seleção e visualização e passou após a correção. Dez testes desse arquivo passam.
- Ciclo red/green na página pública: os testes detectaram a ausência das seções numeradas antes da implementação.
- `npm run test --prefix site`: **41 testes passam**, sem falhas ou skips. A execução fora do sandbox foi necessária porque a suíte usa `spawnSync npm` para gerar o build.
- `npm run check --prefix site`: zero erros, avisos ou hints.
- `npm run build --prefix site`: 5.573 páginas geradas. Permanece o aviso de chunk JavaScript acima de 500 kB; esta entrega não altera o carregamento cartográfico.
- Suíte completa de navegador contra o build estático (`SITE_URL=http://127.0.0.1:4323 npm run test:browser --prefix site`): **40 testes passam**, sem falhas ou skips.
- `site/browser-tests/methodology.test.mjs`: seis testes passam no servidor de desenvolvimento e no build estático, cobrindo dez destinos do sumário, foco visível, ativação por Enter, expansão, retorno com estado e ausência de transbordamento global.
- Matriz: 320/768/1280 px × claro/escuro × JavaScript ativo/desativado; expansões abertas; zoom CSS de 100% e 200% e zoom nativo de 200% via extensão de teste. No zoom nativo, conferidos `devicePixelRatio = 2` e viewport CSS com metade da largura física. Tabelas permanecem em regiões com rolagem própria e foco por teclado.

## Limites

Verificação do novo desenho, sem certificação de acessibilidade, leitor de tela, dispositivo tátil real, medição de contraste ou revisão clínica. Fontes e URLs oficiais existentes foram preservadas; não houve nova pesquisa ou auditoria do conteúdo técnico. Orçamentos globais e publicação de dados versionados permanecem nos tickets próprios.

## Standards

Revisão independente do diff `92935e2...5575044`: nenhuma violação de código ou smell acionável. A revisão apontou o encerramento documental ainda pendente (status, critérios e commits); atendido no commit final deste ticket.

## Spec

Revisão independente do mesmo diff: nenhum desvio de requisito, alteração indevida de conteúdo ou ampliação de escopo identificados. A revisão solicitou concluir o registro da matriz e o encerramento, então ainda em andamento.

Revisão: Standards — um apontamento documental tratado, zero pendências de código; Spec — zero desvios, com evidência de execução registrada neste documento.
