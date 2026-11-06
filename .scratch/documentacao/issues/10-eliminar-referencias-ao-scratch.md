# 10: Eliminar referências ao `.scratch`

**What to build:** o responsável pode apagar os esforços concluídos sem quebrar nada, porque nenhum arquivo fora do `.scratch` depende deles. Referência: [spec](../spec.md), "Regras" 1 e 2, "Spec viva" e "Canal externo e tracker".

**Blocked by:** 04 — Spec viva e ADRs; 05 — Referências e evidências; 09 — README como hub

**Status:** ready-for-agent

- [ ] Os comentários com caminho `.scratch/...` em testes, CSS e scripts apontam para a seção correspondente de `docs/ui-contract.md`
- [ ] Menções a "ticket N" em código e dados apontam para ADR ou seção da spec, e as "spec, section N" ficam como estão
- [ ] `pipeline/references/sim-atlas.json` aponta para `docs/data/`
- [ ] `AGENTS.md` aponta para `docs/spec.md` e os guias, diz que em divergência vale o ADR mais recente, e ganha as regras de atualizar o guia no mesmo commit e de registrar decisões antes de excluir um esforço
- [ ] `docs/agents/issue-tracker.md` descreve o ciclo de vida do tracker, e `docs/agents/domain.md` continua correto
- [ ] Fora de `.agents/`, `git grep '\.scratch' -- ':!.scratch'` só encontra a convenção do tracker em `AGENTS.md` e `docs/agents/`, sem caminho de esforço ou arquivo específico
- [ ] Como só comentários mudam no código: `uv run pytest`, `uv run mypy`, `npm run check` e `npm test` passam, e o build continua igual
- [ ] Num clone temporário, sem o `.scratch`, build e testes continuam passando
- [ ] O `.scratch` não é apagado: isso é do responsável

## Comments
