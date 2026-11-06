# Issue tracker: Local Markdown

Os tickets e as specs de trabalho vivem em `.scratch/<feature>/`. A spec vigente do produto está em `docs/spec.md`; em divergência, vale o ADR mais recente em `docs/adr/`.

## Conventions

- One feature per directory: `.scratch/<feature-slug>/`
- The spec is `.scratch/<feature-slug>/spec.md`, or a named `spec-*.md`
- Implementation issues are one file per ticket at `.scratch/<feature-slug>/issues/<NN>-<slug>.md`, numbered from `01`, never a single combined tickets file
- Triage state is recorded as a `Status:` line near the top of each issue file (see `triage-labels.md` for the role strings)
- Comments and conversation history append to the bottom of the file under a `## Comments` heading

## When a skill says "publish to the issue tracker"

Create a new file under `.scratch/<feature-slug>/` (creating the directory if needed).

## When a skill says "fetch the relevant ticket"

Read the file at the referenced path. The user will normally pass the path or the issue number directly.

## Wayfinding operations

Used by `/wayfinder`. The **map** is a file with one **child** file per ticket.

- **Map**: `.scratch/<effort>/map.md` (the Notes / Decisions-so-far / Fog body).
- **Child ticket**: `.scratch/<effort>/issues/NN-<slug>.md`, numbered from `01`, with the question in the body. A `Type:` line records the ticket type (`research`/`prototype`/`grilling`/`task`); a `Status:` line records `claimed`/`resolved`.
- **Blocking**: a `Blocked by: NN, NN` line near the top. A ticket is unblocked when every file it lists is `resolved`.
- **Frontier**: scan `.scratch/<effort>/issues/` for files that are open, unblocked, and unclaimed; first by number wins.
- **Claim**: set `Status: claimed` and save before any work.
- **Resolve**: append the answer under an `## Answer` heading, set `Status: resolved`, then append a context pointer (gist + link) to the map's Decisions-so-far in `map.md`.

## Ciclo de vida

GitHub Issues é o canal externo. O que exigir trabalho vira ticket local no tracker.
Ao concluir um esforço, registre suas decisões vigentes em `docs/spec.md` e
`docs/adr/` e copie para `docs/` as evidências necessárias para operar, verificar
ou entender o projeto. Confira que nenhum arquivo permanente depende do esforço.
Só então o responsável exclui o diretório do esforço; o agente não faz a exclusão.
Fora do tracker, apenas `AGENTS.md` e `docs/agents/` podem citar a convenção da
pasta, nunca um esforço ou arquivo específico.
