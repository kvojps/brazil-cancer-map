# Tracker: GitHub Issues

Issues e specs de trabalho ficam em
https://github.com/kvojps/brazil-cancer-map/issues.
Use o CLI `gh` dentro deste repositório.

A spec vigente do produto continua em `docs/spec.md`.
Em divergência, vale o ADR mais recente em `docs/adr/`.

## Operações

- Confirme o destino com `gh repo view --json nameWithOwner`.
- Crie issues com `gh issue create --title "..." --body-file <arquivo>`.
- Leia com `gh issue view <n> --json number,title,body,labels,comments`.
- Liste com `gh issue list --state open`.
- Comente com `gh issue comment <n> --body-file <arquivo>`.
- Aplique ou remova labels com `gh issue edit <n> --add-label "..."` ou `--remove-label "..."`.
- Publique tickets e specs de trabalho como issues, sem duplicá-los em arquivos locais.

## Organização

Cada issue descreve contexto, resultado esperado e critérios de aceite.
Use sub-issues para dividir esforços e dependências nativas para
bloqueios. Quando indisponíveis, use listas de tarefas no pai e
referências `Part of #<n>` e `Blocked by: #<n>` nas filhas.
Uma issue está desbloqueada quando todos os seus bloqueadores estão fechados.

Para exploração com wayfinder, a issue principal guarda notas,
decisões e dúvidas e usa o label `wayfinder:map`. As filhas usam labels
`wayfinder:<tipo>` (`research`, `prototype`, `grilling` ou `task`).
A próxima filha é a primeira na ordem do mapa que esteja aberta,
desbloqueada e sem responsável. Assuma uma filha atribuindo-a a você
com `gh issue edit <n> --add-assignee @me`; registre a resposta antes
de fechá-la e acrescente a referência na issue principal.
Crie os labels de wayfinder ao adotar esse fluxo, caso ainda não existam.

## Conclusão

Marque os critérios atendidos e registre a solução com links para
os commits ou PR. Use `Closes #<n>` no PR quando aplicável.
Feche como concluída somente quando os critérios estiverem atendidos.
Para fechamento manual, publique a explicação com `gh issue comment`
e então execute `gh issue close <n>`.

Decisões permanentes e evidências necessárias ficam na spec,
nos ADRs e em `docs/`.

`.scratch/` pode guardar rascunhos temporários; não é um tracker.

## Pull requests como entrada de triagem

**PRs as a request surface: no.**
