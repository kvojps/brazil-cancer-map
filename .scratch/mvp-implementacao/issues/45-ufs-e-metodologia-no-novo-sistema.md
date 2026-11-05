# 45: Levar Municípios por UF e Como calculamos ao novo sistema

**What to build:** Aplicar a lista de UFs com filetes e a Metodologia com sumário sempre à mão, além de cabeçalho comum com busca nessas páginas. O conteúdo da Metodologia não muda.

**Blocked by:** 41 e 42 — cabeçalho e busca das composições.

**Status:** ready-for-agent

## Referências

- [Decisão das páginas](../../ui-polimento/issues/06-lista-ufs-metodologia.md), que traz também as pendências citadas abaixo.
- [Mapa do polimento](../../ui-polimento/map.md), [spec vigente](../../ui-ux-v1/spec.md) e [glossário](../../../GLOSSARY.md).
- Fonte primária: branch descartável local `prototype/ui-polimento-paginas`, commit `38c9db3`, em `/municipios/?ufs=A` e `/metodologia/?metod=A`.

## Critérios de aceite

- [ ] Cabeçalho em faixa no fluxo da página, com menu hambúrguer abaixo de 1024 px
- [ ] Busca de município no cabeçalho das duas páginas, levando ao dashboard com a seleção, sem pesar o carregamento da Metodologia; sem JavaScript, leva a Municípios por UF
- [ ] Saem "← Voltar ao mapa" e os rótulos acima dos títulos, e o link Mapa preserva tema, recorte e seleção; o teste de retorno em `methodology.test.mjs` passa a usar esse link
- [ ] Municípios por UF em linhas com filete, alvos de 44 px e expansão sem JavaScript
- [ ] Sumário lateral fixo no desktop e linha fixa abaixo de 881 px, com seção atual, fechamento ao escolher e com Esc, e foco definido
- [ ] As 11 âncoras da Metodologia caem abaixo do aviso e do sumário, em teste automatizado, a 320, 390, 768 e 1280 px
- [ ] Conteúdo técnico idêntico ao anterior, conferido por comparação do texto
- [ ] Verificar nos dois temas a 320, 768 e 1280 px e no zoom de 200%, com e sem JavaScript, com teclado e foco visível, sem rolagem horizontal fora de tabelas; registrar limites e o que não foi verificado
- [ ] Atualizar os testes de navegador afetados por esta mudança, sem apagar a cobertura de comportamento; `npm run check`, `npm run build`, `npm test` e `npm run test:browser` passam em `site/`

## Limites

Não alterar pipeline, JSON publicados, método, classes, textos clínicos ou conteúdo da Metodologia. Sem deploy. Aprovação visual não equivale a auditoria de acessibilidade nem a revisão clínica. Não promover o código descartável dos protótipos.

## Comments
