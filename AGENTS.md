## Execução do MVP

O projeto é o Observatório do Câncer no Brasil. A **spec** é [`.scratch/mapa-cancer-br/spec-mvp.md`](.scratch/mapa-cancer-br/spec-mvp.md): leia a seção que toca o seu ticket antes de mudar código. Cada regra da spec cita o ticket de decisão (em `.scratch/mapa-cancer-br/issues/`) que a fixou; se a spec e esse ticket divergirem, vale o ticket. Os tickets de implementação ficam em `.scratch/mvp-implementacao/issues/`. Nomeie conceitos com os termos do [`GLOSSARY.md`](GLOSSARY.md).

Monorepo com duas partes, ligadas só pelo contrato de dados (spec, seção 15): os JSON em `site/public/dados/`.

- **`pipeline/`**: Python, rodado com `uv` (`uv run python -m pipeline run`, `uv run pytest`, `uv run mypy`). Cada fonte implementa o protocolo `Source` em `pipeline/source.py` e entra no registro de `pipeline/sources/`. Toda a estatística mora na etapa `compute`. A malha é simplificada pelo mapshaper, ferramenta Node fixada em `pipeline/package.json` (`npm ci --prefix pipeline`).
- **`site/`**: Astro com saída estática (`npm run build`, `npm run check`). O front recebe taxa, razão, classe da Tendência, Situação, cascata e faixa A/B/C prontas do pipeline e só as exibe: a conta estatística fica toda no pipeline.

`data/raw/` e `data/clean/` são locais e ficam fora do git.

**Fechar um ticket:** ao terminar um ticket, marque todas as caixas de critério, troque a linha de status para `**Status:** resolved` e acrescente ao fim do arquivo, sob `## Comments`, os commits que o resolveram. Faça isso no mesmo commit da última mudança do ticket.

**Idioma:** código e commits em inglês: identificadores, módulos, nomes de arquivo, flags do CLI, testes, comentários, docstrings e mensagens de commit. Em português ficam os textos que o público lê no site e os documentos (spec, tickets, glossário, README). Ao traduzir um termo do `GLOSSARY.md` para o código, use sempre a mesma palavra em inglês (por exemplo Tendência → `trend`, Situação → `status`, Região imediata → `immediate_region`).

## Agent skills

### Issue tracker

Issues live as local markdown files under `.scratch/<feature>/`. See `docs/agents/issue-tracker.md`.

### Triage labels

Default five-role vocabulary (needs-triage, needs-info, ready-for-agent, ready-for-human, wontfix), recorded as `Status:` lines. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: `GLOSSARY.md` + `docs/adr/` at the repo root. See `docs/agents/domain.md`.
