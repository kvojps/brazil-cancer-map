# 07: Guia do mantenedor

**What to build:** o mantenedor sabe o que checar a cada mês e ano e leva uma atualização da Fonte até o site seguindo só `docs/data-update.md`, sabendo o que fazer quando algo falha. Referência: [spec](../spec.md), "Regras".

**Blocked by:** 05 — Referências e evidências

**Status:** resolved

- [x] Tabela de checagem por `source`: mensal (`painel`, `cnes`, `hpv`), anual conforme o calendário e a cada edição (`inca`). O citopatológico nunca recebe anos novos, e conferir uma Fonte não implica publicar período novo
- [x] Pré-requisitos: `gh auth login`, Chromium para HPV e o arquivo do Vigitel
- [x] Passo a passo: `update` → revisão → `export-release` → `release` → `restore-release` em `site/public/dados` → `check` e `build` → commit → push
- [x] Critérios de revisão: `update.json`, manifesto, períodos, alertas e diffs. Publicar de árvore limpa e com `--state-dir`, como exige o ticket 11
- [x] Grupos dependentes explicados: `popsvs` com mamografia, citopatológico e SIM, e `mesh` com todas
- [x] O que fazer em falha, como retomar em outra máquina e o que nunca entra na Release (extratos de pacientes e auditoria HPV)
- [x] `hpv-audit` aparece como opcional e separado
- [x] `update --source inca` e `export-release` foram executados em pasta temporária sem alterar `site/public/dados/`
- [x] O guia marca o que foi executado nesta validação e o que veio só da leitura do código

## Comments

### Conclusão (06/11/2026)

Criado `docs/data-update.md` com agenda, pré-requisitos, preparação, revisão, publicação, falhas, retomada e auditoria HPV separada. O fluxo registra os limites reais da Release existente e as pendências da próxima publicação, sem prometer estado completo.

Validação executada em `/tmp/maintainer-guide-5U9yVG`: `update --source inca` com estado inicialmente ausente retornou sucesso, `successful: [inca]` e nenhuma falha; `export-release` produziu 18 assets CSV/Parquet. Nenhuma alteração em `site/public/dados/`. Não foram executados publicação, push, restauração nem carga das demais fontes. Por ser documentação, não foram acrescentados testes nem aplicado TDD.

Revisão `code-review` em dois agentes independentes, base `09e44d8`: Standards sem achados; Spec sem desvios materiais. A pendência de confirmar a exportação e os dados intactos foi conferida depois da revisão. `uv run pytest`: 173 aprovados, com 274 avisos de separação perfeita; `uv run mypy`: 48 arquivos sem problemas; Astro check: 71 arquivos, sem erros, avisos ou hints.

A suíte do site passou com 87 testes (incluindo build), repetida fora do sandbox após bloqueio EPERM dos subprocessos. `git diff --check` passou.

Resolvido pelo commit `docs: add maintainer data update guide`.
