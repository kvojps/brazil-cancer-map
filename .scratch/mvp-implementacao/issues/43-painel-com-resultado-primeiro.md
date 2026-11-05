# 43: Reorganizar Meu município com o resultado primeiro

**What to build:** Aplicar a folha com manchete no celular e a coluna no desktop, com o mesmo bloco de resultado, em todos os Eixos e cartões.

**Blocked by:** 41 e 42 — composições do desktop e do celular.

**Status:** ready-for-agent

## Referências

- [Decisão do painel](../../ui-polimento/issues/04-painel-meu-municipio.md), que traz também as pendências citadas abaixo.
- [Mapa do polimento](../../ui-polimento/map.md), [spec vigente](../../ui-ux-v1/spec.md) e [glossário](../../../GLOSSARY.md).
- Fonte primária: branch descartável local `prototype/ui-polimento-painel`, commit `fe6362f`, em `?painel=D`.

## Critérios de aceite

- [ ] Bloco de resultado igual recolhido e aberto, com número de 32 px, classe, período ou Referência, % sem informação, origem regional e aviso da Faixa C; Dado insuficiente como na decisão
- [ ] No celular, folha de ponta a ponta na base, abrindo até o aviso, sem nunca cobri-lo; botão Legenda e Mapa/Lista acima dela, e enquadramento descontando a folha
- [ ] No desktop, coluna de 400 px, mais larga acima de 1920 px, com nome fixo no topo e rolagem interna
- [ ] Um controle recolhe e expande, só no celular, e ✕ limpa a seleção; saem "Voltar ao mapa" e "Reabrir"
- [ ] Eixos com resultado no título fechado, um aberto por vez, na ordem interna da decisão, inclusive HPV, Mortalidade, tabagismo, casos estimados e Ações alternativas
- [ ] Textos sobre a interface, status só para leitores de tela, foco no nome depois da busca e contorno com borda externa, conforme a decisão
- [ ] Resolver as pendências da decisão: forma compacta em telas baixas sem perder o aviso da Faixa C, página comum no zoom de 200%, e textura da Faixa C no título só no 60 dias
- [ ] Testar Balsas (faixa C), Alcântara (Região imediata e faixa C), Araioses (Dado insuficiente) e próstata (ressalva)
- [ ] Verificar nos dois temas a 320, 768 e 1280 px e no zoom de 200%, com e sem JavaScript, com teclado e foco visível, sem rolagem horizontal fora de tabelas; registrar limites e o que não foi verificado
- [ ] Atualizar os testes de navegador afetados por esta mudança, sem apagar a cobertura de comportamento; `npm run check`, `npm run build`, `npm test` e `npm run test:browser` passam em `site/`

## Limites

Não alterar pipeline, JSON publicados, método, classes, textos clínicos ou conteúdo da Metodologia. Sem deploy. Aprovação visual não equivale a auditoria de acessibilidade nem a revisão clínica. Não promover o código descartável dos protótipos.

## Comments
