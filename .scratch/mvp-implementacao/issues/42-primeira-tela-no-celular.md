# 42: Aplicar a primeira tela do celular

**What to build:** Aplicar a variante C abaixo de 768 px: mapa inteiro sob o aviso, com cabeçalho, Filtros, legenda e Mapa/Lista flutuando.

**Blocked by:** 40 — Fundamentos visuais.

**Status:** resolved

## Referências

- [Decisão da primeira tela](../../ui-polimento/issues/02-celular-cabecalho-filtros-mapa.md), que traz também as pendências citadas abaixo.
- [Mapa do polimento](../../ui-polimento/map.md), [spec vigente](../../ui-ux-v1/spec.md) e [glossário](../../../GLOSSARY.md).
- Fonte primária: branch descartável local `prototype/ui-polimento-celular`, commits `5155e38` e `7ae4518`, em `?variant=C&aviso=2`.

## Critérios de aceite

- [x] Mapa de ponta a ponta abaixo do aviso; um dedo move o mapa e a tela do mapa não rola
- [x] Cabeçalho flutuante com menu hambúrguer e busca que expande; o menu reúne as páginas, fontes, código e tema
- [x] Botão Filtros sempre com o recorte vigente, abrindo folha não modal, com seletores nativos de 44 px e mapa mudando ao vivo
- [x] Legenda e Mapa/Lista flutuando nos cantos inferiores, e enquadramento até Fernando de Noronha
- [x] Menu e Filtros abrem sem JavaScript, com seletores desativados, aviso e link para Municípios por UF
- [x] Resolver as pendências da decisão: enquadramento reservando a área dos controles a 390 × 664 e 320 × 568, controles fora do mapa no zoom de 200%, confusão entre aviso e contorno de seleção, e textos da busca
- [x] Verificar teclado virtual aberto na busca, ao menos em emulação, e registrar o que depende do [aparelho real](46-verificacao-final-em-celular-real.md)
- [x] Verificar nos dois temas a 320, 768 e 1280 px e no zoom de 200%, com e sem JavaScript, com teclado e foco visível, sem rolagem horizontal fora de tabelas; registrar limites e o que não foi verificado
- [x] Atualizar os testes de navegador afetados por esta mudança, sem apagar a cobertura de comportamento; `npm run check`, `npm run build`, `npm test` e `npm run test:browser` passam em `site/`

## Limites

Não alterar pipeline, JSON publicados, método, classes, textos clínicos ou conteúdo da Metodologia. Sem deploy. Aprovação visual não equivale a auditoria de acessibilidade nem a revisão clínica. Não promover o código descartável dos protótipos.

## Comments

- Implementação e encerramento: `feat(site): apply the phone first screen of the home map (#42)` (este commit).
- **Verificado:** `npm run check`, `npm run build` e `npm test` (60 testes). `npm run test:browser` (135 testes) passou inteiro contra a saída estática e contra o servidor de desenvolvimento.
- **Matriz:** dois temas a 320, 390, 768 e 1280 px, com e sem JavaScript, sem rolagem horizontal, com menu e folha abertos. Zoom nativo de 200% a 390 × 844 e 320 × 568, nos dois temas, com e sem JavaScript, com os controles fora do mapa. Janelas de 195 × 422, 160 × 450, 320 × 450 e 640 × 400 no mesmo modo em fluxo. Tab e foco visível nos dois temas a 390 px; 768 e 1280 px seguem cobertos por `desktop-first-screen.test.mjs`. Um dedo move o mapa com toque emulado, sem rolar a página.
- **Pendências da decisão, como ficaram:**
  - **Enquadramento:** o país é enquadrado até Fernando de Noronha, reservando a altura de Filtros e da legenda (`src/map/framing.ts`). Em capturas a 390 × 664 e 320 × 568, nos dois temas, a legenda fica livre do Sul e Filtros, do Norte. A reserva é um retângulo: a 320 × 568 o país fica com cerca de 190 px de altura, embora o canto sudoeste esteja vazio. Refinar isso rende pouco, cerca de 15% pela conta que fiz.
  - **Zoom de 200%:** abaixo de 520 px de altura ou de 300 px de largura, cabeçalho, seletores, busca, legenda e Mapa/Lista ficam em fluxo, fora do mapa, e a página rola até o rodapé. O botão Filtros não existe nesse modo, porque os seletores ficam sempre à vista.
  - **Aviso e seleção:** não se confundem nos dois temas, conferido em captura de Boa Vista. O contorno é fino, fica dentro do mapa e é separado da faixa pelo cabeçalho e por Filtros. Os tons são próximos (`#000` e `#171717` no tema claro); o `#142f55` citado na decisão deixou de valer no ticket 40. Não mudei nenhuma cor.
  - **Textos da busca:** "1 município encontrado." e "N municípios encontrados.", sem o "Use Tab para escolher".
- **Teclado virtual:** a emulação do Chromium não abre o teclado. O teste desconta uma altura típica (260, 280 e 300 px a 320 × 568, 360 × 640 e 390 × 844) e confere que o campo e a lista de resultados ficam acima dela. A lista tem 26% da altura da tela e rola por dentro. Ficam para o [aparelho real](46-verificacao-final-em-celular-real.md): a altura verdadeira do teclado, se o Safari desloca a página ao focar o campo e se o `100dvh` se mantém com o teclado aberto.
- **Decisões a confirmar:**
  - A folha de Filtros usa `popover="manual"`, e não `details`. Abre sem JavaScript e não depende de `::details-content` para os seletores aparecerem no desktop. Como um popover fica acima de tudo, a folha fecha ao abrir o menu ou a busca, o que antecipa a regra da decisão do painel.
  - Sem JavaScript, o ícone de busca é um link para Municípios por UF, pois a busca não funciona sem script. O menu aberto por cima de uma folha já aberta fica em parte coberto nesse caso, até a pessoa fechar a folha em Filtros.
  - Abaixo de 768 px, no modo flutuante, cada resultado da busca é só o botão de 44 px: o link "Abrir consulta" sai, porque o botão já abre a consulta. No modo em fluxo e no desktop o link continua.
  - O menu ganhou Fontes, Código-fonte e tema só abaixo de 768 px. De 768 a 1023 px ele continua como no ticket 41.
- **Provisório até o ticket 43:** com um município selecionado, o painel fica acima de Mapa/Lista, a legenda de canto sai e um botão "Legenda" dentro do painel abre a legenda completa. Isso diverge da decisão do painel, que pede a folha de ponta a ponta e o botão fora dela, e serve só para nada ficar inalcançável. O enquadramento ainda não desconta o painel, que pode cobrir o estado selecionado. Com o painel expandido a 320 × 568, Filtros fica coberto até recolher.
- **Limites conhecidos:**
  - O cabeçalho flutuante vale só para a inicial e as páginas de município; as demais ficam para o ticket 45.
  - O enquadramento do país é feito uma vez: trocar a Leitura ou girar a tela não o refaz, para não desfazer o que a pessoa moveu.
  - Em celular deitado com menos de 520 px de altura e largura abaixo de 768 px, vale o modo em fluxo, e a tela do mapa rola.
  - A condição do modo flutuante se repete em cinco componentes e no `theme.css`, pois CSS não tem media query nomeada.
  - A saída estática tem 878 MB, 19 MB a mais que no ticket 41.
- **Não verificado:** teclado virtual real, Safari no iPhone, Firefox, aparelho real (ticket 46), leitor de tela e o enquadramento por teste automático, conferido só em capturas. Não equivale a auditoria de acessibilidade (ticket 25) nem a revisão clínica (ticket 26).
- Revisão em dois eixos aplicada. Corrigidos: folha cobrindo o menu aberto, painel recolhido cortando Filtros a 320 × 568, retorno de foco ao fechar a folha, link dos resultados no modo em fluxo, mudança indevida do atalho no desktop, espaçamento e raios fora dos fundamentos, inversão em botão comum. Não aplicados, por serem de julgamento: extrair o texto da Leitura, repetido em quatro lugares, e reunir as regras de texto oculto.
