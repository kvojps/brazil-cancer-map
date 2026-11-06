# 10: Eliminar referências ao `.scratch`

**What to build:** o responsável pode apagar os esforços concluídos sem quebrar nada, porque nenhum arquivo fora do `.scratch` depende deles. Referência: [spec](../spec.md), "Regras" 1 e 2, "Spec viva" e "Canal externo e tracker".

**Blocked by:** 04 — Spec viva e ADRs; 05 — Referências e evidências; 09 — README como hub

**Status:** resolved

- [x] Os comentários com caminho `.scratch/...` em testes, CSS e scripts apontam para a seção correspondente de `docs/ui-contract.md`
- [x] Menções a "ticket N" em código e dados apontam para ADR ou seção da spec, e as "spec, section N" ficam como estão
- [x] `pipeline/references/sim-atlas.json` aponta para `docs/data/`
- [x] `AGENTS.md` aponta para `docs/spec.md` e os guias, diz que em divergência vale o ADR mais recente, e ganha as regras de atualizar o guia no mesmo commit e de registrar decisões antes de excluir um esforço
- [x] `docs/agents/issue-tracker.md` descreve o ciclo de vida do tracker, e `docs/agents/domain.md` continua correto
- [x] Fora de `.agents/`, `git grep '\.scratch' -- ':!.scratch'` só encontra a convenção do tracker em `AGENTS.md` e `docs/agents/`, sem caminho de esforço ou arquivo específico
- [x] Como só comentários mudam no código: `uv run pytest`, `uv run mypy`, `npm run check` e `npm test` passam, e o build continua igual
- [x] Num clone temporário, sem o `.scratch`, build e testes continuam passando
- [x] O `.scratch` não é apagado: isso é do responsável

## Comments


### Conclusão (06/11/2026)

Resolvido pelo commit `docs: replace scratch references with permanent documentation` (este commit).

Comentários de UI apontam ao contrato de interface; as referências a decisões
apontam à spec e a conferência do Atlas aponta à evidência em `docs/data/`.
AGENTS e o guia do tracker documentam a precedência dos ADRs, manutenção dos
guias no mesmo commit e preservação das decisões antes da exclusão pelo responsável.
O guia de domínio continua correto e não precisou mudar. Nenhum esforço foi apagado.

Verificação: `uv run pytest` com 173 aprovados (274 avisos de separação perfeita),
`uv run mypy` sem problemas em 48 arquivos, `npm run check --prefix site` sem
erros, avisos ou hints, `npm test --prefix site` com 87 aprovados, incluindo build;
o arquivo isolado `map-tones.test.mjs` passou com 10 testes. Cache do uv e
subprocessos do npm exigiram execução fora do sandbox.

Um clone local temporário foi materializado sem `.scratch`, com as alterações
aplicadas e dependências locais compartilhadas por links: nele, pytest passou
com 173 e npm test com 87, incluindo build. Não foi reinstalação das dependências.
Os 5.635 arquivos de saída foram comparados por SHA-256: só os 5.574 HTMLs mudam,
exclusivamente pelo comentário do aviso que deixa de citar o ticket antigo.
Restaurando esse comentário apenas em memória, todos os hashes são iguais aos
do build anterior. Os builds do repositório e do clone também são idênticos.

A busca fora do tracker e de `.agents/` encontra apenas as convenções permitidas
em AGENTS e docs/agents; não há mais menções numeradas a tickets em código ou dados.
`git diff --check` passou. TDD não se aplica à troca de referências sem lógica nova.

Revisão pela skill `code-review`, base `fdc997d`, com dois agentes independentes:
Standards sem violações (sugestão opcional de reduzir a repetição da regra de
encerramento); Spec sem achados. A regra curta em AGENTS e o procedimento no guia
foram mantidos para satisfazer os dois critérios explícitos do ticket.
