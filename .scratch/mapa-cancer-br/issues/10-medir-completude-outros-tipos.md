# Qual a qualidade dos dados dos outros tipos de câncer por UF?

Type: task
Status: open
Blocked by:

## Question

Rodar a medição de [Qual a qualidade dos dados de mama e colo do útero por UF?](09-medir-completude-por-uf.md) para os tipos candidatos definidos em [Qual é o recorte do MVP (tipos de câncer e região)?](08-recorte-do-mvp.md): próstata (C61), colorretal (C18–C21), pulmão (C33–C34) e estômago (C16), além de "Todos os cânceres" (C00–C97, sem C44). Reaproveitar os scripts de `research/09-scripts/`. Medir por UF:
- % de casos "sem informação de tratamento" (Painel-Oncologia)
- % de municípios com 20 casos ou mais em 5 anos
- no SIM, a % de óbitos por câncer de sítio mal definido que afeta cada tipo

O resultado é uma tabela por UF e tipo, com as faixas A/B/C, e uma recomendação de quais tipos se sustentam no MVP.
