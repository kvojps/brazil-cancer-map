# 40: Aplicar os fundamentos visuais do polimento

**What to build:** Aplicar a todas as páginas o sistema escolhido: fonte, escala, espaçamento, superfícies, controles, marca e tons do mapa nos dois temas. As composições não mudam aqui.

**Blocked by:** None (can start immediately).

**Status:** ready-for-agent

## Referências

- [Decisão dos fundamentos](../../ui-polimento/issues/03-fundamentos-visuais.md), que traz também as pendências citadas abaixo.
- [Mapa do polimento](../../ui-polimento/map.md), [spec vigente](../../ui-ux-v1/spec.md) e [glossário](../../../GLOSSARY.md).
- Fonte primária: branch descartável local `prototype/ui-polimento-fundamentos`, commit `0b0ff2c`, em `?fund=B&mapa=2`.

## Critérios de aceite

- [ ] Inter variável hospedada no próprio site, em subconjunto próprio com o `≥`, algarismos tabulares e `OFL.txt` publicado; sem fontes externas
- [ ] Escala de 12 a 32 px, espaçamento em múltiplos de 4 px e tokens de superfície, texto, link, foco e seleção nos dois temas, conforme a decisão
- [ ] Controles preenchidos, sem borda, com raio de 8 px, 40 px no desktop e 44 px no celular, e estado ativo invertido
- [ ] Marca da silhueta do Brasil, derivada da malha real, no lugar do `◈`
- [ ] Aviso em faixa invertida, integral, sem fechar, com o texto exato, em todas as páginas e sempre visível com a página rolada
- [ ] Tons do mapa, pontos, hachura e Situação por tema, inclusive em `TREND_COLORS`, `STATUS_COLORS`, cartões e testes, com as distâncias de cor da decisão conferidas por script
- [ ] O tema funciona pela preferência do sistema sem JavaScript
- [ ] Remover da spec vigente os "acentos luminosos", substituídos pela decisão
- [ ] Verificar nos dois temas a 320, 768 e 1280 px e no zoom de 200%, com e sem JavaScript, com teclado e foco visível, sem rolagem horizontal fora de tabelas; registrar limites e o que não foi verificado
- [ ] Atualizar os testes de navegador afetados por esta mudança, sem apagar a cobertura de comportamento; `npm run check`, `npm run build`, `npm test` e `npm run test:browser` passam em `site/`

## Limites

Não alterar pipeline, JSON publicados, método, classes, textos clínicos ou conteúdo da Metodologia. Sem deploy. Aprovação visual não equivale a auditoria de acessibilidade nem a revisão clínica. Não promover o código descartável dos protótipos.

## Comments
