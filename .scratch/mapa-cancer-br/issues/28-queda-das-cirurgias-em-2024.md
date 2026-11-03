# Por que os casos tratados por cirurgia caem no Painel a partir de abril de 2024?

Type: research
Status: resolved
Assignee: Kvojps (Claude session 2026-11-03, ticket 28)
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

## Answer

Pesquisa feita e decisão tomada com o responsável pelo projeto em 2026-11-03. Detalhes, tabelas, fontes e scripts: [research/28-queda-das-cirurgias-em-2024.md](../research/28-queda-das-cirurgias-em-2024.md) e [`research/28-scripts/`](../research/28-scripts/).

**Causa: as cirurgias continuam acontecendo; o que quebrou foi o vínculo da cirurgia ao caso no Painel.**
- **Não houve queda real (documentado).** As cirurgias oncológicas aprovadas no SIH (subgrupo 0416) sobem: 177 mil em 2023, 196 mil em 2024 e 214 mil em 2025, em todas as 27 UFs. O exame anatomopatológico (SIA 02.03.02.003-0), que cria casos, também sobe, sem degrau em abril de 2024.
- **O que mudou em abril de 2024 (documentado).** A partir da competência 04/2024, o layout do SISAIH01 ganhou o CPF do paciente (`NU_CPF_PAC`), seguindo a Lei nº 14.534/2023, e o CNS continua não obrigatório. O SIHD pediu o reenvio dos arquivos de 04/2024 por um problema na leitura do CPF. O Painel monta o caso por CNS × CID (nota técnica).
- **Hipótese, sem confirmação do DATASUS:** os hospitais passaram a enviar a AIH com CPF e sem CNS, e essas cirurgias deixaram de se ligar aos casos. O dado público do SIH não traz CNS nem CPF, então a hipótese não pode ser testada. Nenhuma portaria SAES de 2023–2024 explica a queda.

**Medidas nos microdados** (extração de 17/10/2026):
- **Data:** pelo mês do tratamento, a cirurgia como primeiro tratamento cai de ~6,5 mil por mês (2023) para 4.763 em abril de 2024 e ~1,9 mil em dezembro. Em 2025 fica plana em ~2,1 mil por mês. Quimio e radio ficam em ~15–17 mil por mês.
- **Por estabelecimento, tudo ou nada:** 581 dos 909 hospitais que operam caem a zero ou quase zero e respondem por 95% da perda. Eles continuam registrando quimio e radio. Metade dos que desligam de vez para entre março e maio de 2024; o resto, aos poucos, até dezembro.
- **Nacional, mas não total:** 17 UFs perdem 60–90% das cirurgias; MA, RN, PB e GO quase não perdem. Todos os tipos caem igual.
- **Os casos sumiram, não foram reclassificados:** nos hospitais que desligam, do 2º semestre de 2023 ao de 2024, as cirurgias caem 18,1 mil e o total de casos cai 19,2 mil. Quimio/radio sobe 5,4 mil (cerca de 3 em 10 operados reaparecem pelo tratamento seguinte), e a % sem informação **cai**. Esses casos quase não mexem no prazo de quimio/radio (38,6% → 37,6% em até 60 dias).
- **Efeito sobre o valor de todos os casos:** 37,1% (2023), 33,5% (2024) e 33,4% (2025, provisório). Faltam ~34 mil cirurgias em 2024 e ~53 mil em 2025. Em 37% dos municípios, o valor cai mais de 5 p.p. de 2023 para 2024.
- **Faixa A/B/C (2020–2024):** a % sem informação sobe em média 0,4 p.p. (no máximo 1,1). Só 4 das 162 células UF × tipo mudam de faixa, todas na fronteira: mama MS e DF e próstata GO passam de A para B, e Todos PE passa de B para C.
- **Classe da Situação:** quase todo município está "longe" em qualquer regra; o que muda é o número da barra.

**Decisão:**
1. **Valor e Situação do 60 dias passam a usar só os casos cujo primeiro tratamento foi quimioterapia, radioterapia ou ambos** (`TRATAMENTO` 2, 3 ou 4), o mesmo recorte da Tendência ([ticket 27](27-quebra-de-serie-do-painel.md)): numerador = esses casos em até 60 dias, denominador = esses casos, no último ano consolidado. Brasil: 39,3% em 2023 e 41,0% em 2024. Barra, gráfico e classe mostram a mesma série, sem degrau em 2018, 2019 ou 2024, e a regra vale sem mudança quando 2025 se consolidar. A Referência continua 100% (lei), a próstata continua sem Situação, e a cascata não muda (o mínimo já conta os casos de quimio/radio).
2. **A % sem informação e a faixa A/B/C continuam sobre todos os casos diagnosticados**, como no TabNet: elas medem a qualidade do registro, não o prazo. A faixa absorve a queda das cirurgias (4 células de fronteira), e a metodologia registra isso.
3. **Custo aceito:** o valor deixa de bater com o "todos os casos" do TabNet e deixa de fora quem começou pela cirurgia (~30% dos tratados antes da queda). A validação do valor passa a usar a tabela do TabNet filtrada por modalidade, que o pipeline já baixa ([implementação 27](../../mvp-implementacao/issues/27-tendencia-60-dias-quimio-radio.md)).
4. **Alternativas descartadas:** manter 2024 com todos os casos e nota (o viés cresce em 2025, ~9 p.p., e a nota fica permanente); congelar a Situação em 2023 (congela sem data de fim); todos os casos menos as cirurgias (23,9–27,9%, longe do número conhecido, e ainda mistura os sem informação).
5. **Vigilância:** o pipeline passa a conferir a contagem mensal de casos por modalidade e a alertar quando uma cai de patamar, para pegar cedo uma quebra parecida na APAC (por exemplo, a regra de CPF ou CNS no SIA desde 01/2025, citada por fonte secundária).

**Textos para o público** (propostos, a aprovar como os demais):
- título da barra e do gráfico: "Casos tratados com quimioterapia ou radioterapia: % que começou em até 60 dias";
- nota do cartão, no lugar das duas notas do ticket 27: "Os números deste cartão vêm dos casos tratados com quimioterapia ou radioterapia, cujo registro não mudou desde 2014. Os demais casos tiveram mudanças de registro em 2018 e em 2024, quando muitas cirurgias deixaram de aparecer no painel do Ministério da Saúde."

Spec atualizada: seções 5, 6.3, 6.4, 9, 11.2, 12, 14 e 17 de [spec-mvp.md](../spec-mvp.md). Ticket de implementação: [29 — Valor e Situação do 60 dias sobre os casos de quimio e radio](../../mvp-implementacao/issues/29-valor-60-dias-quimio-radio.md); os tickets 08 e 10 de implementação foram ajustados.
