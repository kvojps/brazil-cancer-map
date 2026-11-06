# 07: Guia do mantenedor

**What to build:** o mantenedor sabe o que checar a cada mês e ano e leva uma atualização da Fonte até o site seguindo só `docs/data-update.md`, sabendo o que fazer quando algo falha. Referência: [spec](../spec.md), "Regras".

**Blocked by:** 05 — Referências e evidências

**Status:** ready-for-agent

- [ ] Tabela de checagem por `source`: mensal (`painel`, `cnes`, `hpv`), anual conforme o calendário e a cada edição (`inca`). O citopatológico nunca recebe anos novos, e conferir uma Fonte não implica publicar período novo
- [ ] Pré-requisitos: `gh auth login`, Chromium para HPV e o arquivo do Vigitel
- [ ] Passo a passo: `update` → revisão → `export-release` → `release` → `restore-release` em `site/public/dados` → `check` e `build` → commit → push
- [ ] Critérios de revisão: `update.json`, manifesto, períodos, alertas e diffs. Publicar de árvore limpa e com `--state-dir`, como exige o ticket 11
- [ ] Grupos dependentes explicados: `popsvs` com mamografia, citopatológico e SIM, e `mesh` com todas
- [ ] O que fazer em falha, como retomar em outra máquina e o que nunca entra na Release (extratos de pacientes e auditoria HPV)
- [ ] `hpv-audit` aparece como opcional e separado
- [ ] `update --source inca` e `export-release` foram executados em pasta temporária sem alterar `site/public/dados/`
- [ ] O guia marca o que foi executado nesta validação e o que veio só da leitura do código

## Comments
