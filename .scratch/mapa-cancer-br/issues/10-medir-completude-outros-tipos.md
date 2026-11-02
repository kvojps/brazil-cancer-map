# Qual a qualidade dos dados dos outros tipos de câncer por UF?

Type: task
Status: resolved
Assignee: Kvojps (claude session 2026-11-02)
Blocked by:

## Question

Rodar a medição de [Qual a qualidade dos dados de mama e colo do útero por UF?](09-medir-completude-por-uf.md) para os tipos candidatos definidos em [Qual é o recorte do MVP (tipos de câncer e região)?](08-recorte-do-mvp.md): próstata (C61), colorretal (C18–C21), pulmão (C33–C34) e estômago (C16), além de "Todos os cânceres" (C00–C97, sem C44). Reaproveitar os scripts de `research/09-scripts/`. Medir por UF:
- % de casos "sem informação de tratamento" (Painel-Oncologia)
- % de municípios com 20 casos ou mais em 5 anos
- no SIM, a % de óbitos por câncer de sítio mal definido que afeta cada tipo

O resultado é uma tabela por UF e tipo, com as faixas A/B/C, e uma recomendação de quais tipos se sustentam no MVP.

## Answer

Medição feita em 2026-11-02. Detalhes, tabelas e scripts: [research/10-medir-completude-outros-tipos.md](../research/10-medir-completude-outros-tipos.md).

- **Próstata, colorretal e pulmão se sustentam.** Cada um tem só 2 ou 3 UFs na faixa C, o mesmo nível de mama e colo do útero. A % nacional sem tratamento é de 21% (próstata), 32% (colorretal) e 25% (pulmão).
- **O estômago não se sustenta no Acesso ao tratamento.** No país, 56% dos casos vêm sem tratamento, 10 UFs ficam na faixa C (AL 89%, RS 86%) e a série piora. A causa provável é que a cirurgia não está sendo ligada ao diagnóstico. **Recomendação:** um seletor com 5 tipos, e o estômago fica fora do MVP ou entra só no Panorama, com justificativa no eixo de tratamento.
- **"Todos os cânceres" precisa excluir C76–C80** (sítio mal definido e primário desconhecido), porque quase 90% desses casos vêm sem tratamento. Excluídos, o CE cai de 41% para 20%. A definição fica em C00–C97 sem C44, C73 e C76–C80, e deixa 7 UFs na faixa C (AL, MA, PE, RN, RO, RR, RS).
- **A faixa muda com o tipo**, então a ressalva de qualidade precisa ser por UF e por tipo, não uma lista fixa de UFs.
- **"Até 60 dias" não serve para próstata sem ressalva** (35%), porque nesse tipo a vigilância ativa é conduta correta.
- **Pulmão e estômago têm números municipais tão pequenos quanto colo do útero:** só 10–11% dos municípios somam 20 casos ou mais em 5 anos. Só o "Todos" (93%) funciona município a município sem agregar.
- **O SIM está bom.** C39 e C63 são desprezíveis. O C26 (digestivo mal definido) pesa 10% dos óbitos digestivos, chegando a 16% no PI, e é o equivalente menor do C55 para estômago e colorretal.
