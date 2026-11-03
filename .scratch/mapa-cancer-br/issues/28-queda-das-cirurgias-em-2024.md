# Por que os casos tratados por cirurgia caem no Painel a partir de abril de 2024?

Type: research
Status: ready-for-agent
Blocked by: 27

## Question

A pesquisa da quebra de 2018 ([ticket 27](27-quebra-de-serie-do-painel.md), [pesquisa, seção 4](../research/27-quebra-de-serie-do-painel.md#4-achado-novo-queda-das-cirurgias-a-partir-de-abril-de-2024)) achou uma segunda mudança no Painel-Oncologia (extração de 17/10/2026). Os casos de "Todos" com primeiro tratamento por cirurgia (`TRATAMENTO = 1`) ficam entre ~5,2 e 7,3 mil por mês de 2022 até fevereiro de 2024. Depois caem (4.392 em abril de 2024, 1.914 em dezembro de 2024) e ficam em ~1,5–2,2 mil por mês durante todo o ano de 2025. O patamar plano em 2025 indica uma mudança no registro, não um atraso. Casos sem informação e casos de quimio/radio não mudam.

A Situação do 60 dias usa 2024, o último ano consolidado. A queda rebaixa a % em até 60 dias de todos os casos de 37,1% (2023) para 33,5% (2024) e eleva a % sem informação de 31,2% para 33,6%. Hoje o cartão leva uma nota (spec, seção 11.2), e a Tendência, feita só com quimio e radio, não é afetada.

Investigar:
1. **Causa:** mudança no SIH (AIH), na tabela SIGTAP (procedimentos cirúrgicos oncológicos ou anatomopatológico de peça cirúrgica), na regra de vínculo do Painel ou outra. Fontes: notas do DATASUS, portarias SAES de 2024, TabNet do SIH (as cirurgias oncológicas caem no SIH também?).
2. **Medir:** por UF, por tipo de câncer, por estabelecimento de tratamento (`CNES_TRAT`) e pela `ANOMES_TRA`, para datar a mudança e ver se ela é nacional. Os casos que perderam a cirurgia sumiram ou foram reclassificados?
3. **Decidir:** a Situação continua em 2024 com a nota, ou muda (por exemplo, a Situação fica em 2023 ou o valor exclui as cirurgias)? A regra precisa valer também para 2025, quando ele se consolidar. Ver também o efeito na faixa A/B/C (2020–2024).

## Resultado esperado

A resposta sob `## Answer`, com a causa documentada e a decisão tomada com o responsável pelo projeto, refletida na spec (seções 6.4, 9 e 11.2). Se a regra mudar, um ticket de implementação novo. Scripts em `research/28-scripts/`, partindo dos de `research/27-scripts/`.
