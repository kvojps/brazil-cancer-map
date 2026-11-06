# 44: Aplicar a Lista com linhas que abrem

**What to build:** Aplicar a Lista nos dois formatos: linhas que abrem quando estreita e tabela com cabeçalho e município fixos quando larga, conforme a largura da própria Lista.

**Blocked by:** 41 e 42 — composições do desktop e do celular.

**Status:** resolved

## Referências

- [Decisão das páginas](../../ui-polimento/issues/06-lista-ufs-metodologia.md), que traz também as pendências citadas abaixo.
- [Mapa do polimento](../../ui-polimento/map.md), [spec vigente](../../ui-ux-v1/spec.md) e [glossário](../../../GLOSSARY.md).
- Fonte primária: branch descartável local `prototype/ui-polimento-paginas`, commit `38c9db3`, em `/?visualizacao=lista&lista=C`.

## Critérios de aceite

- [x] Abaixo de 640 px de largura da Lista, linha com nome, classe com cor e textura, marca "Faixa C" e valor; o ⌄ abre os demais campos na própria linha
- [x] Na forma larga, tabela rolando por dentro da área do mapa, com filtros e painel à vista
- [x] Seletor de UF e contagem fixos ao rolar no celular; Mapa/Lista fixo na tela e o aviso sempre visível
- [x] Período ou Referência e ano do valor à vista; o parágrafo longo em "Como ler esta lista", com o aviso da Faixa C preservado
- [x] Semântica de tabela preservada para leitores de tela nas duas formas, com rótulos em texto real e `aria-expanded` no controle da linha; sessão com leitor de tela registrada
- [x] A folha do painel não cobre as linhas nem Mapa/Lista com município selecionado; conferir as colunas a 1280 px com o painel aberto
- [x] Ordem por UF e nome, sem ranking, e cobertura de HPV sem Tendência, mortalidade sem Situação, próstata sem Situação e falha de carga com nova tentativa
- [x] Verificar nos dois temas a 320, 768 e 1280 px e no zoom de 200%, com e sem JavaScript, com teclado e foco visível, sem rolagem horizontal fora de tabelas; registrar limites e o que não foi verificado
- [x] Atualizar os testes de navegador afetados por esta mudança, sem apagar a cobertura de comportamento; `npm run check`, `npm run build`, `npm test` e `npm run test:browser` passam em `site/`

## Limites

Não alterar pipeline, JSON publicados, método, classes, textos clínicos ou conteúdo da Metodologia. Sem deploy. Aprovação visual não equivale a auditoria de acessibilidade nem a revisão clínica. Não promover o código descartável dos protótipos.

## Comments

### Implementação — 2026-11-05

- Implementação: `feat(site): apply the list with rows that open (#44)` (este commit).
- **Falta para fechar:** a sessão com leitor de tela, por isso a caixa da semântica segue aberta e o status é `ready-for-human`. O resto do critério está feito: papéis ARIA explícitos, `aria-colindex`, rótulos em texto real e `aria-expanded`. Roteiro sugerido, com o Orca (`/usr/bin/orca`): filtrar por MA a 390 px; navegar por célula em uma linha fechada e conferir se cada célula anuncia a própria coluna; abrir Balsas pelo ⌄ e conferir o anúncio de "expandido" e os campos novos; repetir a 1280 px na tabela.
- **Verificado:** `npm run check`, `npm run build` e `npm test` (87 testes). `npm run test:browser` (188 testes) passou inteiro contra a saída estática. Contra o servidor de desenvolvimento, com os arquivos em paralelo, 21 testes estouraram o tempo de espera, inclusive testes sem relação com a Lista; o README agora indica a saída estática.
- **Matriz:** nos dois temas, a 320, 768 e 1280 px, com e sem município, com linha e "Como ler esta lista" abertos e com zoom por CSS de 200%, sem rolagem horizontal na página. Zoom nativo de 200% em 1280 × 800, nos dois temas e sem município, com a tabela rolando pelo teclado. Teclado e contorno de foco a 390 px, com a folha recolhida na tela; a 320 px, conferi só que o foco subindo não fica sob a barra. A árvore de acessibilidade do Chromium expõe `table`, `rowgroup`, `row`, `columnheader`, `rowheader` e `cell` nas duas formas. Em capturas: 390 × 844 no claro, 320 × 568 nos dois temas, 768 × 900 com painel no claro, e 1280 × 800 no claro sem painel e no escuro com painel.
- **Sem JavaScript:** a Lista não é oferecida, como prevê a spec, e o link para Municípios por UF continua na página.
- **Colunas a 1280 px com o painel aberto:** a lista fica com 880 px e a forma larga. As colunas têm largura legível, mas Origem do dado e Qualidade do registro ficam na rolagem interna; o município continua fixo e a última coluna é alcançável sem ficar sob o painel.
- **A folha do painel:** o que ela garante é o alcance. A folha recolhida fica sobre a página, a rolagem leva a última linha acima dela, e o foco do teclado não fica embaixo. Enquanto a pessoa rola, linhas passam por trás da folha e de Mapa/Lista.
- **Decisões a confirmar:**
  - **HPV na linha aberta:** mostra "Tendência: Série curta, ainda sem direção". É o texto aprovado, sem amostra, mas sob o rótulo "Tendência" pode parecer uma classe. Mantive o rótulo por ser o da coluna da tabela.
  - **Unidade da mortalidade:** na forma estreita, "por 100 mil" vai em 12 px sob o número de 20 px. Em uma só linha, o valor espremia o nome a 320 px ("Açailândi-a").
  - **Linhas abertas ao trocar os filtros:** continuam abertas ao mudar UF ou leitura. A decisão não pedia isso.
  - **Faixa C com Dado insuficiente:** sem a marca na linha fechada, como no mapa, onde só os pontos aparecem. A faixa continua na linha aberta.
- **Limites conhecidos:**
  - **Zoom de 200% com município selecionado (640 × 400):** é a página comum do ticket 43. A Lista começa abaixo da dobra e o painel vem depois dela, então filtros e painel não ficam à vista ao mesmo tempo. A barra da UF só é fixa no modo flutuante do celular.
  - **Teclado com todas as UFs:** são 5.571 links e 5.571 botões na ordem de tabulação; o filtro por UF é a saída.
  - **HPV:** nenhuma UF tem HPV publicado, então o teste usa uma camada montada nele.
  - **Barra a 320 px:** com todas as UFs, o seletor encolhe em vez de quebrar a linha, e o fim de "Todas as UFs" encosta na seta. A fonte ampliada não foi testada.
  - A saída estática tem 901 MB, 3 MB a mais que no ticket 43.
- **Não verificado:** leitor de tela, aparelho real, Safari e Firefox (ticket 46). O tema escuro a 768 px só tem os testes automáticos. Não equivale a auditoria de acessibilidade (ticket 25) nem a revisão clínica (ticket 26).
- Revisão em dois eixos aplicada. Corrigidos: foco sob a barra a 320 px, frase vazia "Período da Tendência: ." no HPV, numeração de colunas duplicada, CSS repetido, nome ambíguo. Não aplicados, por serem de julgamento: um tipo próprio para as colunas, separar `buildRow` de `render`, mover `classOf` e `readingMode` de `panel-result.ts` para `indicator-layer.ts`, reaproveitar o texto de "Ajuste não calculável" e tirar o `top: 7rem` de `MapExperience.astro`.
