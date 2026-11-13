## Execução do MVP

O projeto é o Observatório do Câncer no Brasil. A **spec** é [`docs/spec.md`](docs/spec.md): leia a seção que toca o seu ticket antes de mudar código. Em divergência, vale o ADR mais recente em [`docs/adr/`](docs/adr/). Nomeie conceitos com os termos do [`GLOSSARY.md`](GLOSSARY.md).

**Guias:** para setup, testes e contribuição, leia [`docs/development.md`](docs/development.md); para atualizar e publicar dados, [`docs/data-update.md`](docs/data-update.md); para verificar ou reproduzir dados, [`docs/reproducibility.md`](docs/reproducibility.md). Mudança em comando do CLI, fluxo de atualização ou pré-requisito atualiza o guia correspondente no mesmo commit.

**Tracker:** issues e specs de trabalho ficam no [GitHub Issues](https://github.com/kvojps/brazil-cancer-map/issues). Para criar, consultar, organizar ou fechar tickets, siga [`docs/agents/issue-tracker.md`](docs/agents/issue-tracker.md). Decisões permanentes e evidências necessárias ficam na spec, nos ADRs e em `docs/`.

Monorepo com duas partes, ligadas só pelo contrato de dados (spec, seção 15): os JSON em `site/public/dados/`.

- **`pipeline/`**: Python, rodado com `uv` (`uv run python -m pipeline run`, `uv run pytest`, `uv run mypy`). Cada fonte implementa o protocolo `Source` em `pipeline/source.py` e entra no registro de `pipeline/sources/`. Toda a estatística mora na etapa `compute`. A malha é simplificada pelo mapshaper, ferramenta Node fixada em `pipeline/package.json` (`npm ci --prefix pipeline`).
- **`site/`**: Astro com saída estática (`npm run build`, `npm run check`). O front recebe taxa, razão, classe da Tendência, Situação, cascata e faixa A/B/C prontas do pipeline e só as exibe: a conta estatística fica toda no pipeline.

`data/raw/` e `data/clean/` são locais e ficam fora do git.

**Fechar um ticket:** marque os critérios atendidos, registre a solução e os links para commits ou PR na issue e feche como concluída quando todos os critérios estiverem atendidos. Use `Closes #<n>` no PR quando aplicável.

**Issues pai de especificação:** concluir todas as sub-issues não encerra automaticamente a especificação. Antes de fechar a pai, confira todos os critérios da spec e as verificações conjuntas, registre um resumo com links para as entregas e feche somente quando tudo estiver atendido. Se restar trabalho, mantenha a pai aberta e registre-o em novas sub-issues.

**Idioma:** código e commits em inglês: identificadores, módulos, nomes de arquivo, flags do CLI, testes, comentários, docstrings e mensagens de commit. Em português ficam os textos que o público lê no site e os documentos (spec, tickets, glossário, README). Ao traduzir um termo do `GLOSSARY.md` para o código, use sempre a mesma palavra em inglês (por exemplo Tendência → `trend`, Situação → `status`, Região imediata → `immediate_region`).

## Agent skills

### Issue tracker

Issues e specs de trabalho ficam no GitHub Issues de `kvojps/brazil-cancer-map`. Veja `docs/agents/issue-tracker.md`.

### Triage labels

Cinco labels: needs-triage, needs-info, ready-for-agent, ready-for-human e wontfix. Veja `docs/agents/triage-labels.md`.

### Domain docs

Contexto único: `GLOSSARY.md` e `docs/adr/` na raiz. Veja `docs/agents/domain.md`.
