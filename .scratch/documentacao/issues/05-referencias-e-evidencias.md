# 05: Referências e evidências

**What to build:** quem mantém os dados ou confere o método encontra em `docs/` o que sabemos de cada Fonte e as evidências citadas, e quem mexe na interface encontra o contrato que os testes verificam. Referência: [spec](../spec.md), "Estrutura final" e "Regras"; tabela do [inventário](02-inventario-do-scratch.md).

**Blocked by:** 02 — Inventário do `.scratch`

**Status:** ready-for-agent

- [ ] `docs/data-sources.md` traz, por `source` e Fonte: insumos, pré-requisitos, calendário, endereços, volumes, validações, limiares operacionais e referências oficiais, reunindo o que está nas seções POPSVS, SISCAN, HPV e CNES do README e nas pesquisas
- [ ] A tabela distingue Fonte de `source`, inclusive `siscan` e `siscan_cytopathology`, e `mesh` e `popsvs`, que não geram Indicador
- [ ] O que está só no README e é método foi para `/metodologia/`, sem criar regra nova
- [ ] `docs/data/` guarda os números e resultados das evidências do inventário, sem os scripts exploratórios, incluindo a conferência do SIM com o Atlas que `pipeline/references/sim-atlas.json` cita
- [ ] `docs/ui-contract.md` reúne as decisões de UI que os testes e o CSS usam como contrato, com seções que os comentários do código possam citar
- [ ] `docs/validation/accessibility-audit.md` traz a auditoria, seus limites e o que continua pendente, sem os JSON brutos
- [ ] Nenhum desses documentos cita o `.scratch`

## Comments
