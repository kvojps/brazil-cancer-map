# 41: Levar o Mapa inicial à tela cheia no desktop

**What to build:** Aplicar a composição D a partir de 768 px: aviso, cabeçalho, filtros e mapa ocupam exatamente a altura da janela, com legenda no canto e painel ao lado.

**Blocked by:** 40 — Fundamentos visuais.

**Status:** ready-for-agent

## Referências

- [Decisão do desktop](../../ui-polimento/issues/05-desktop-tela-cheia.md), que traz também as pendências citadas abaixo.
- [Mapa do polimento](../../ui-polimento/map.md), [spec vigente](../../ui-ux-v1/spec.md) e [glossário](../../../GLOSSARY.md).
- Fonte primária: branch descartável local `prototype/ui-polimento-desktop`, commit `cd08ce5`, em `?desk=D`.

## Critérios de aceite

- [ ] Medidas da decisão a 1280 × 800 e 1440 × 900: mapa com 653 e 753 px de altura, igual com e sem município selecionado
- [ ] Cabeçalho de 48 px com marca, busca, links e tema; barra de filtros de 56 px com rótulos ao lado, larguras fixas e Mapa/Lista na ponta direita
- [ ] Saem "Explorar em lista" e os títulos visíveis repetidos, que continuam para leitores de tela
- [ ] Legenda no canto inferior esquerdo, com ⓘ abrindo a legenda completa
- [ ] Comportamento de 768 a 1023 px e acima de 1920 px conforme a decisão
- [ ] Resolver as pendências da decisão: ressalva dinâmica, enquadramento descontando a legenda, composição por CSS e ordem do HTML sem JavaScript, altura do aviso sem medir por JavaScript, altura mínima, e alcance do rodapé com rolagem interna acessível por teclado
- [ ] Verificar nos dois temas a 320, 768 e 1280 px e no zoom de 200%, com e sem JavaScript, com teclado e foco visível, sem rolagem horizontal fora de tabelas; registrar limites e o que não foi verificado
- [ ] Atualizar os testes de navegador afetados por esta mudança, sem apagar a cobertura de comportamento; `npm run check`, `npm run build`, `npm test` e `npm run test:browser` passam em `site/`

## Limites

Não alterar pipeline, JSON publicados, método, classes, textos clínicos ou conteúdo da Metodologia. Sem deploy. Aprovação visual não equivale a auditoria de acessibilidade nem a revisão clínica. Não promover o código descartável dos protótipos.

## Comments
