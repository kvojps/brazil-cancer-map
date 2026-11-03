# 06: Faixa de qualidade A/B/C com hachura

**What to build:** onde muitos casos estão sem informação de tratamento, o mapa avisa. A faixa de qualidade é calculada por UF × tipo selecionado, e a faixa C recebe hachura diagonal no indicador de tratamento, já na primeira impressão do Mapa inicial. Referência: spec, seções 6.3 e 11.1.

**Blocked by:** 04 — Até 60 dias × Todos pinta o mapa em Tendência

**Status:** resolved

- [x] A faixa é calculada por UF × tipo (inclusive "Todos") sobre os últimos cinco anos consolidados: A até 15% sem informação; B acima de 15% e abaixo de 35%; C 35% ou mais
- [x] Não há lista fixa de UFs; o período usado é exportado e aparece na tela
- [x] Na faixa C, os municípios recebem hachura diagonal só no indicador de tratamento correspondente, com o aviso "Muitos casos estão sem informação de tratamento; o resultado pode não representar toda a situação."
- [x] A hachura e os pontos do dado insuficiente não se confundem, e a hachura entra na legenda
- [x] A informação da faixa também está disponível na tabela alternativa

## Comments

Resolvido em `d45cf5f` (faixa por UF × tipo no pipeline, hachura, legenda, tooltip e tabela), `e04a0c6` (revisão: a faixa vira um `StrEnum` e o período da faixa se chama `quality_years`) e no commit seguinte, que regenera a camada e o `manifest.json` e fecha este ticket.

Decisões tomadas na implementação, com o responsável pelo projeto:
- **Cálculo:** a % sem informação soma todos os casos diagnosticados da janela (hoje 2020–2024, os cinco últimos anos consolidados) por UF de residência, inclusive os de município de residência ignorado, como o TabNet. Os cortes são comparados sem arredondar: 15% exato é A, 35% exato é C.
- **Contrato:** cada município traz `quality_band` (a faixa da sua UF); a camada traz `quality`, com a faixa e a % sem informação de cada UF; o período traz `quality_years`. Uma UF sem faixa (sem nenhum caso) reprova a validação.
- **Hachura e pontos:** o município com dado insuficiente numa UF da faixa C fica só com os pontos, sem hachura: ele não mostra resultado a ressalvar, e assim as duas texturas nunca se sobrepõem. A faixa da UF continua na tabela. A hachura são linhas escuras diagonais sobre a cor da Tendência, que continua visível; o município com dado da região também recebe a hachura, porque o "sem textura" da spec (seção 11.1) se refere aos pontos.
- **Textos novos (a aprovar):** na legenda, "Hachura (faixa C)" com o aviso aprovado e "Vale para todo o estado, com 35% ou mais dos casos de 2020–2024 sem informação de tratamento. As faixas A (até 15%) e B (acima de 15% e abaixo de 35%) não têm hachura."; no tooltip, "Qualidade do registro em UF (2020–2024): Faixa X (Y% sem informação de tratamento)", e o aviso em itálico na faixa C; na tabela, a coluna "Qualidade do registro na UF" e uma nota na legenda da tabela.
- **Limite conhecido:** a % exibida tem uma casa decimal, então uma UF a 34,96% apareceria como "Faixa B (35,0%)". Hoje nenhuma está tão perto do corte (as mais próximas: PE 35,1%, RJ 34,1%, SE 15,6%).

Conferido no Chromium sem interface, via DevTools Protocol: a hachura aparece nas UFs da faixa C, os pontos ficam sozinhos nos municípios com dado insuficiente e o tooltip mostra a faixa e o aviso.

**Faixas de "Todos" (2020–2024, extração de 17/10/2026):** C em RO (36,5%), RR (44,1%), MA (60,1%), RN (44,1%), PE (35,1%) e RS (38,9%), 1.133 municípios; A em AC, AM e TO, 223 municípios; B nas demais 18 UFs, 4.215 municípios. PE na faixa C confirma o [ticket de decisão 28](../../mapa-cancer-br/issues/28-queda-das-cirurgias-em-2024.md) ("Todos PE passa de B para C").
