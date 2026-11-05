# 42: Aplicar a primeira tela do celular

**What to build:** Aplicar a variante C abaixo de 768 px: mapa inteiro sob o aviso, com cabeçalho, Filtros, legenda e Mapa/Lista flutuando.

**Blocked by:** 40 — Fundamentos visuais.

**Status:** ready-for-agent

## Referências

- [Decisão da primeira tela](../../ui-polimento/issues/02-celular-cabecalho-filtros-mapa.md), que traz também as pendências citadas abaixo.
- [Mapa do polimento](../../ui-polimento/map.md), [spec vigente](../../ui-ux-v1/spec.md) e [glossário](../../../GLOSSARY.md).
- Fonte primária: branch descartável local `prototype/ui-polimento-celular`, commits `5155e38` e `7ae4518`, em `?variant=C&aviso=2`.

## Critérios de aceite

- [ ] Mapa de ponta a ponta abaixo do aviso; um dedo move o mapa e a tela do mapa não rola
- [ ] Cabeçalho flutuante com menu hambúrguer e busca que expande; o menu reúne as páginas, fontes, código e tema
- [ ] Botão Filtros sempre com o recorte vigente, abrindo folha não modal, com seletores nativos de 44 px e mapa mudando ao vivo
- [ ] Legenda e Mapa/Lista flutuando nos cantos inferiores, e enquadramento até Fernando de Noronha
- [ ] Menu e Filtros abrem sem JavaScript, com seletores desativados, aviso e link para Municípios por UF
- [ ] Resolver as pendências da decisão: enquadramento reservando a área dos controles a 390 × 664 e 320 × 568, controles fora do mapa no zoom de 200%, confusão entre aviso e contorno de seleção, e textos da busca
- [ ] Verificar teclado virtual aberto na busca, ao menos em emulação, e registrar o que depende do [aparelho real](46-verificacao-final-em-celular-real.md)
- [ ] Verificar nos dois temas a 320, 768 e 1280 px e no zoom de 200%, com e sem JavaScript, com teclado e foco visível, sem rolagem horizontal fora de tabelas; registrar limites e o que não foi verificado
- [ ] Atualizar os testes de navegador afetados por esta mudança, sem apagar a cobertura de comportamento; `npm run check`, `npm run build`, `npm test` e `npm run test:browser` passam em `site/`

## Limites

Não alterar pipeline, JSON publicados, método, classes, textos clínicos ou conteúdo da Metodologia. Sem deploy. Aprovação visual não equivale a auditoria de acessibilidade nem a revisão clínica. Não promover o código descartável dos protótipos.

## Comments
