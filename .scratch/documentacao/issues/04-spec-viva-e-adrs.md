# 04: Spec viva e ADRs

**What to build:** quem chega ao repositório encontra as regras vigentes e o porquê das decisões difíceis em `docs/`, sem depender do `.scratch`. Referência: [spec](../spec.md), "Spec viva" e "ADRs"; tabela do [inventário](02-inventario-do-scratch.md).

**Blocked by:** 02 — Inventário do `.scratch`

**Status:** ready-for-agent

- [ ] `docs/spec.md` traz o conteúdo vigente da spec do MVP, com a mesma numeração de seções
- [ ] As divergências estão corrigidas no próprio texto: atualização manual, Cloudflare Workers, 5.571 municípios e as demais apontadas no inventário
- [ ] As decisões do inventário com destino na spec foram incorporadas
- [ ] Citações de ticket saíram, trocadas por link para ADR quando houver, e a justificativa necessária está no próprio texto
- [ ] A §17 registra as quatro dívidas conhecidas com números e decisões já tomadas: redução de tamanho, sessão humana de acessibilidade, revisão clínica das Ações e textos a aprovar, com a lista D41 do inventário copiada no próprio texto
- [ ] A spec §11.2 e `GLOSSARY.md:9` dizem que o painel mostra a taxa de mortalidade, sem contagem de óbitos e sem Situação
- [ ] Os dez ADRs da spec estão em `docs/adr/`, no formato do projeto, com contexto, alternativas e evidências no próprio texto, sem link para o `.scratch`
- [ ] Nenhuma regra nova é criada: mudança além do que os tickets decidiram volta ao responsável

## Comments

### Respostas do responsável no inventário (06/11/2026)

Os critérios acima já incorporam as respostas: dez ADRs, quatro dívidas na §17 e a taxa de mortalidade no painel. Detalhes no [inventário](../inventario.md).
