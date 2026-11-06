# 24: Metodologia consolidada

**What to build:** a seção "Como calculamos" fica completa para o lançamento: além das seções de cada indicador, ela ganha o conteúdo transversal e os links oficiais reconferidos. Ela só detalha regras da spec e não cria regra nova. Referência: spec, seções 2 e 12.

**Blocked by:** 12 — Onde se tratar; 15 — Citopatológico; 17 — Redistribuição do C55; 18 — Cobertura da vacina HPV; 19 — Tabagismo na capital; 20 — Casos novos estimados

**Status:** resolved

- [x] Cada indicador cobre os 9 itens da seção 12
- [x] Há as duas definições de "Todos os cânceres"
- [x] Há a explicação de que o dado do município não estima o risco individual
- [x] Há as condições de reutilização e a forma de citar cada fonte, e a licença CC BY-SA 4.0 dos textos
- [x] Há as versões do código e dos dados, o acesso aos scripts e aos agregados e o histórico das revisões que alteram resultados
- [x] Todos os links oficiais foram reconferidos, com a data da conferência

## Comments

Concluído em 05/11/2026.

- `37082ab` — `docs: consolidate public methodology and verify source links`: completa o conteúdo transversal, explicita os casos em que regras não se aplicam, remove avisos antigos de downloads pendentes, acrescenta modelos de citação, versões/extrações e histórico; substitui o PDF de mamografia que retornou 404 pelo registro oficial da mesma ficha no Ninho/INCA.
- O commit de fechamento `docs: resolve consolidated methodology ticket` registra os critérios e estas validações.
- Conferência de todos os links oficiais, resultados e cobertura dos nove itens por indicador em `docs/data/methodology-links.md`. A consulta à página de malhas IBGE retornou 403; a limitação está registrada, sem afirmar confirmação de conteúdo. A CC BY-SA abriu pelo navegador de pesquisa após 403 na consulta direta.
- Validação: `npm run check` sem erros, avisos ou hints; `npm run build` concluído (5.574 páginas); `npm test` com 87 testes aprovados; `node --test site/browser-tests/methodology.test.mjs` com seis testes aprovados, incluindo teclado, temas, JavaScript e zoom nativo de 200%. A primeira suíte colidiu com um build paralelo; a repetição sem concorrência passou.
- Revisão com a skill `code-review` desde `9b34057`: Padrões, zero achados; Spec, zero achados.
- A pendência do ticket 18 é a medição operacional anual em CI, preservada na metodologia e em `docs/data/hpv-benchmark.md`; este fechamento não resolve nem declara aprovada essa medição.
