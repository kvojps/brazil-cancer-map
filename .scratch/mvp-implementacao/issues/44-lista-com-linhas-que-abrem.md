# 44: Aplicar a Lista com linhas que abrem

**What to build:** Aplicar a Lista nos dois formatos: linhas que abrem quando estreita e tabela com cabeçalho e município fixos quando larga, conforme a largura da própria Lista.

**Blocked by:** 41 e 42 — composições do desktop e do celular.

**Status:** ready-for-agent

## Referências

- [Decisão das páginas](../../ui-polimento/issues/06-lista-ufs-metodologia.md), que traz também as pendências citadas abaixo.
- [Mapa do polimento](../../ui-polimento/map.md), [spec vigente](../../ui-ux-v1/spec.md) e [glossário](../../../GLOSSARY.md).
- Fonte primária: branch descartável local `prototype/ui-polimento-paginas`, commit `38c9db3`, em `/?visualizacao=lista&lista=C`.

## Critérios de aceite

- [ ] Abaixo de 640 px de largura da Lista, linha com nome, classe com cor e textura, marca "Faixa C" e valor; o ⌄ abre os demais campos na própria linha
- [ ] Na forma larga, tabela rolando por dentro da área do mapa, com filtros e painel à vista
- [ ] Seletor de UF e contagem fixos ao rolar no celular; Mapa/Lista fixo na tela e o aviso sempre visível
- [ ] Período ou Referência e ano do valor à vista; o parágrafo longo em "Como ler esta lista", com o aviso da Faixa C preservado
- [ ] Semântica de tabela preservada para leitores de tela nas duas formas, com rótulos em texto real e `aria-expanded` no controle da linha; sessão com leitor de tela registrada
- [ ] A folha do painel não cobre as linhas nem Mapa/Lista com município selecionado; conferir as colunas a 1280 px com o painel aberto
- [ ] Ordem por UF e nome, sem ranking, e cobertura de HPV sem Tendência, mortalidade sem Situação, próstata sem Situação e falha de carga com nova tentativa
- [ ] Verificar nos dois temas a 320, 768 e 1280 px e no zoom de 200%, com e sem JavaScript, com teclado e foco visível, sem rolagem horizontal fora de tabelas; registrar limites e o que não foi verificado
- [ ] Atualizar os testes de navegador afetados por esta mudança, sem apagar a cobertura de comportamento; `npm run check`, `npm run build`, `npm test` e `npm run test:browser` passam em `site/`

## Limites

Não alterar pipeline, JSON publicados, método, classes, textos clínicos ou conteúdo da Metodologia. Sem deploy. Aprovação visual não equivale a auditoria de acessibilidade nem a revisão clínica. Não promover o código descartável dos protótipos.

## Comments
