## Execução do MVP

O projeto é o Observatório do Câncer no Brasil. A **spec** é [`.scratch/mapa-cancer-br/spec-mvp.md`](.scratch/mapa-cancer-br/spec-mvp.md): leia a seção que toca o seu ticket antes de mudar código. Cada regra da spec cita o ticket de decisão (em `.scratch/mapa-cancer-br/issues/`) que a fixou; se a spec e esse ticket divergirem, vale o ticket. Os tickets de implementação ficam em `.scratch/mvp-implementacao/issues/`. Nomeie conceitos com os termos do [`GLOSSARY.md`](GLOSSARY.md).

Monorepo com duas partes, ligadas só pelo contrato de dados (spec, seção 15): os JSON em `site/public/dados/`.

- **`pipeline/`**: Python, rodado com `uv` (`uv run python -m pipeline run`, `uv run pytest`, `uv run mypy`). Cada fonte implementa o protocolo `Fonte` em `pipeline/fonte.py` e entra no registro de `pipeline/fontes/`. Toda a estatística mora na etapa calcular.
- **`site/`**: Astro com saída estática (`npm run build`, `npm run check`). O front recebe taxa, razão, classe da Tendência, Situação, cascata e faixa A/B/C prontas do pipeline e só as exibe: a conta estatística fica toda no pipeline.

`data/raw/` e `data/clean/` são locais e ficam fora do git.

## Agent skills

### Issue tracker

Issues live as local markdown files under `.scratch/<feature>/`. See `docs/agents/issue-tracker.md`.

### Triage labels

Default five-role vocabulary (needs-triage, needs-info, ready-for-agent, ready-for-human, wontfix), recorded as `Status:` lines. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: `GLOSSARY.md` + `docs/adr/` at the repo root. See `docs/agents/domain.md`.
