# 05: Cascata da Região imediata e Dado insuficiente

**What to build:** municípios pequenos deixam de mostrar uma Tendência sem sentido. Se o município não tem o mínimo de casos, ele assume o dado da sua Região imediata; se nem ela tem, fica como Dado insuficiente. O cidadão vê a origem do dado no tooltip. Referência: spec, seções 8 e 11.1.

**Blocked by:** 04 — Até 60 dias × Todos pinta o mapa em Tendência

**Status:** ready-for-agent

- [ ] O mínimo é uma média de pelo menos 20 por ano na janela, contando o denominador da Tendência nas proporções (no 60 dias, os casos tratados com quimio ou radio, pelo [ticket de decisão 27](../../mapa-cancer-br/issues/27-quebra-de-serie-do-painel.md); se o ticket 27 de implementação ainda não estiver feito, os casos diagnosticados) e o numerador nas taxas
- [ ] A cascata por indicador × tipo é município → Região imediata → dado insuficiente, igual para a Tendência e a Situação, e nunca sobe para a UF; ela é uma função reaproveitável pelos demais indicadores
- [ ] A camada do mapa traz a origem do dado de cada município: município, região ou insuficiente
- [ ] O município com dado da região recebe a cor da região, sem textura, e o tooltip diz "Seu município e vizinhos — região de X"
- [ ] Dado insuficiente aparece em quase branco com textura de pontos, nunca branco puro, e entra na legenda
- [ ] A contagem bruta do município com dado insuficiente não é exportada para exibição
- [ ] Testes cobrem os três ramos da cascata
