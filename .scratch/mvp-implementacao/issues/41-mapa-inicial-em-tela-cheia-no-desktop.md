# 41: Levar o Mapa inicial à tela cheia no desktop

**What to build:** Aplicar a composição D a partir de 768 px: aviso, cabeçalho, filtros e mapa ocupam exatamente a altura da janela, com legenda no canto e painel ao lado.

**Blocked by:** 40 — Fundamentos visuais.

**Status:** resolved

## Referências

- [Decisão do desktop](../../ui-polimento/issues/05-desktop-tela-cheia.md), que traz também as pendências citadas abaixo.
- [Mapa do polimento](../../ui-polimento/map.md), [spec vigente](../../ui-ux-v1/spec.md) e [glossário](../../../GLOSSARY.md).
- Fonte primária: branch descartável local `prototype/ui-polimento-desktop`, commit `cd08ce5`, em `?desk=D`.

## Critérios de aceite

- [x] Medidas da decisão a 1280 × 800 e 1440 × 900: mapa com 653 e 753 px de altura, igual com e sem município selecionado
- [x] Cabeçalho de 48 px com marca, busca, links e tema; barra de filtros de 56 px com rótulos ao lado, larguras fixas e Mapa/Lista na ponta direita
- [x] Saem "Explorar em lista" e os títulos visíveis repetidos, que continuam para leitores de tela
- [x] Legenda no canto inferior esquerdo, com ⓘ abrindo a legenda completa
- [x] Comportamento de 768 a 1023 px e acima de 1920 px conforme a decisão
- [x] Resolver as pendências da decisão: ressalva dinâmica, enquadramento descontando a legenda, composição por CSS e ordem do HTML sem JavaScript, altura do aviso sem medir por JavaScript, altura mínima, e alcance do rodapé com rolagem interna acessível por teclado
- [x] Verificar nos dois temas a 320, 768 e 1280 px e no zoom de 200%, com e sem JavaScript, com teclado e foco visível, sem rolagem horizontal fora de tabelas; registrar limites e o que não foi verificado
- [x] Atualizar os testes de navegador afetados por esta mudança, sem apagar a cobertura de comportamento; `npm run check`, `npm run build`, `npm test` e `npm run test:browser` passam em `site/`

## Limites

Não alterar pipeline, JSON publicados, método, classes, textos clínicos ou conteúdo da Metodologia. Sem deploy. Aprovação visual não equivale a auditoria de acessibilidade nem a revisão clínica. Não promover o código descartável dos protótipos.

## Comments

- Implementação e encerramento: `feat(site): take the home map to full screen on desktop (#41)` (este commit).
- **Verificado:** `npm run check`, `npm run build` e `npm test` (57 testes). `npm run test:browser` (92 testes) passou inteiro contra o servidor de desenvolvimento. Contra a saída estática, 91 passaram e 1 falhou: o teste media o rodapé com a rolagem ainda em andamento. Corrigido o teste, `desktop-first-screen.test.mjs` passou 3 vezes na saída estática e 1 no servidor de desenvolvimento; a suíte inteira não foi repetida depois desse ajuste, que só mudou esse teste.
- **Matriz:** dois temas a 320, 768 e 1280 px, com e sem JavaScript, sem rolagem horizontal, em zoom simulado na inicial e em `/municipio/261160-recife/`. Zoom nativo de 200% só em Recife, em janelas de 640, 1536 e 2560 px (320, 768 e 1280 px úteis). Tab com foco visível nos dois temas, em Recife e só a 1280 px. Capturas nos dois temas, incluindo a D no tema escuro com município, que a decisão deixara sem ver.
- **Pendências da decisão, como ficaram:**
  - **Ressalva dinâmica:** não muda a altura do mapa. Fica encostada sob a barra, no canto superior esquerdo, com 18rem de largura; na Lista entra no fluxo.
  - **Enquadramento:** ao selecionar, reserva a área da legenda e da ressalva, do lado que custa menos zoom (`src/map/framing.ts`). Um mapa pequeno demais mostra o estado sob elas. A seleção feita na Lista é enquadrada ao voltar ao Mapa.
  - **Composição sem JavaScript:** só CSS e ordem do HTML. A busca e Mapa/Lista mudaram de lugar no HTML.
  - **Altura do aviso:** nada é medido. Um item oculto no grid do `body` ocupa as três primeiras linhas com a altura da janela, e a linha do conteúdo fica com o que sobra. A rolagem continua sendo a da página, com o aviso fixo até o rodapé.
  - **Altura mínima:** mantida em 520 px; abaixo disso a página rola. A 1280 × 600 a legenda não cobre o Brasil no enquadramento inicial, conferido em captura. O mapa tem ainda um piso de 192 px para quando as barras crescem.
  - **Rodapé e rolagem interna:** a página rola por `End` e Tab chega ao rodapé; o painel ganhou `tabindex="0"` e rola por teclado, assim como a tabela da Lista.
- **Decisões a confirmar:**
  - O aviso ganhou altura mínima de 43 px a partir de 768 px, em todas as páginas. Sem isso o mapa teria cerca de 660 e 760 px, não os 653 e 753 da decisão, porque o aviso passou a ter 36 px no ticket 40.
  - Texto novo na legenda de canto, na Situação: "A cor mostra a distância até a referência, não um ranking." A decisão só definiu a frase da Tendência.
  - Texto novo sem JavaScript na área do mapa: "O mapa e os filtros precisam de JavaScript. Consulte os municípios por UF.", que substitui o "Carregando o mapa…" que nunca terminava e a dica de busca desativada.
  - Texto novo na busca sem resultado: "Nenhum município encontrado." A mensagem de status ficou só para leitores de tela a partir de 768 px, para não cobrir as barras.
- **Limites conhecidos:**
  - Sem JavaScript, Mapa/Lista continua oculto, porque a troca depende de script. O caminho é o link na área do mapa e "Municípios por UF".
  - De 1024 a cerca de 1150 px os filtros ainda ocupam duas linhas; a decisão só pede uma linha a partir de 1280 px.
  - A ressalva foi conferida livre do Brasil no enquadramento inicial a 1280 × 800. Abaixo de 1280 px não foi conferida e pode tocar o noroeste do Brasil.
  - Uma ressalva que aparece depois da seleção, como ao trocar para Próstata, não refaz o enquadramento e pode cobrir parte do estado, para não desfazer o que a pessoa moveu no mapa.
  - Abaixo de 768 px só mudou o necessário: a busca foi para o cabeçalho e Mapa/Lista para a barra. O restante fica para o ticket 42.
  - A busca no cabeçalho vale só para a inicial e as páginas de município; as demais ficam para o ticket 45.
  - Os links do menu de 768 a 1023 px repetem os da navegação principal no HTML, e só um conjunto aparece por vez.
  - A saída estática tem 859 MB, 20 MB a mais que no ticket 40.
- **Não verificado:** leitor de tela, Firefox, Safari (o grid do `body` só foi visto no Chromium), aparelho real e o enquadramento por teste automático, conferido só em capturas. Não equivale a auditoria de acessibilidade (ticket 25) nem a revisão clínica (ticket 26).
- Revisão em dois eixos aplicada. Corrigidos: reserva da ressalva e seleção pela Lista no enquadramento, retorno da busca sem resultado, sombra no retorno de dados, espaçamentos e cor por token, termos em inglês, largura do painel em um só lugar, e novos testes de zoom nativo e de foco nos dois temas.
