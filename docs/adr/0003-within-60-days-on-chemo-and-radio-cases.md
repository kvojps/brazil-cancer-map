# Valor, Situação e Tendência dos 60 dias usando só quimio e radio

A série de todos os casos do Painel-Oncologia tem duas mudanças de registro, em 2018 e em 2024, que parecem piora do atendimento sem ser. Decidimos em 03/11/2026 que o valor, a Situação e a Tendência do 60 dias usam **só os casos cujo primeiro tratamento foi quimioterapia, radioterapia ou ambos** (`TRATAMENTO` 2, 3 ou 4). Barra, gráfico e classe mostram a mesma série, cujo registro não tem degrau desde 2014. A % sem informação e a faixa A/B/C continuam sobre todos os casos, porque medem a qualidade do registro, não o prazo.

Regras vigentes: [spec, seções 5, 6.3, 6.4, 7 e 9](../spec.md#64-anos-provisórios-e-séries-especiais).

## Causas

**Maio de 2018 (documentado).** A nota técnica do Painel diz que o diagnóstico pelo exame anatomopatológico (BPA-I) só entra a partir de maio de 2018, quando a Portaria SAS nº 643/2018 tornou obrigatórios o CNS e a CID-10 nesse procedimento. A % sem informação nacional vai de 3,3% (abril de 2018) para 21,1% (maio de 2018), nos cinco tipos ao mesmo tempo, com um segundo degrau em maio de 2019 (23,8% → 34,9%), sem explicação na documentação. Entraram casos sem tratamento registrado e casos operados, que contam como "no prazo" porque o diagnóstico da peça sai depois da cirurgia.

**Abril de 2024 (hipótese, sem confirmação oficial).** As cirurgias como primeiro tratamento caem de ~6 mil para ~2 mil por mês e ficam nesse patamar em 2025. Não houve queda real: no SIH, as cirurgias oncológicas sobem de 177 mil (2023) para 196 mil (2024) e 214 mil (2025). Na competência 04/2024, a AIH ganhou o CPF do paciente, e o Painel monta o caso por CNS × CID. A hipótese é que as AIH com CPF e sem CNS deixaram de se ligar aos casos, mas o dado público do SIH não permite testá-la.

## Alternativas consideradas

### Para a Tendência

Efeito no 60 dias × Todos, só com o dado do próprio município, na extração de 17/10/2026:

| Alternativa | Piorando | Melhorando | Brasil: variação anual [IC 95%] |
|---|---:|---:|---|
| 2015–2024, todos os casos | 906 | 108 | −3,7% [−4,7; −2,7] |
| 2019–2024, todos os casos | 386 | 96 | −3,3% [−5,6; −1,0] |
| 2015–2024, denominador = tratados | 190 | 341 | +0,7% [−1,0; +2,5] |
| 2019–2024, denominador = tratados | 358 | 78 | −2,4% [−4,0; −0,7] |
| 2019–2023, todos os casos | 248 | 99 | −2,4% [−5,3; +0,5] |
| 2019–2023, denominador = tratados | 244 | 86 | −1,8% [−4,1; +0,6] |
| **2015–2024, só quimio e radio (escolhida)** | **448** | **151** | **−1,3% [−2,2; −0,4]** |

- **Janela depois da quebra:** descartada. Fica com só 5 anos, mantém o degrau de 2019, deixa 2024 de fora e exigiria uma regra ad hoc a cada ano.
- **Denominador de todos os tratados:** descartado. Inverte a quebra, porque as cirurgias entram com tempo curto.
- **Manter e declarar:** descartado. Entre metade e dois terços da inclinação viria do registro.

### Para o valor e a Situação

A primeira decisão manteve o valor sobre todos os casos, comparável ao TabNet. A queda das cirurgias mudou isso. Foram descartadas:

- **Todos os casos com nota:** o viés cresce em 2025, para cerca de 9 p.p., e a nota fica permanente.
- **Congelar a Situação em 2023:** congela sem data de fim.
- **Todos os casos menos as cirurgias:** dá 23,9–27,9%, longe do número conhecido, e ainda mistura os casos sem informação.

## Evidências

- Quimio e radio, em até 60 dias: 44,3% em 2014, 42,6% em 2018 e 41,0% em 2024, sem degrau. Em 2024: 76.383 / 186.368 = 41,0%. Todos os casos em 2024: 33,5%, contra 37,1% em 2023.
- O valor e as contagens batem exatamente com o TabNet filtrado por modalidade nas 351 combinações UF × ano.
- A perda das cirurgias se concentra em 581 dos 909 hospitais que operam, que respondem por 95% dela e continuam registrando quimio e radio. Por isso os casos somem em vez de virar "sem informação".
- Na faixa A/B/C (2020–2024), a % sem informação sobe em média 0,4 p.p., e só 4 das 162 células UF × tipo mudam de faixa, todas na fronteira: mama em MS e DF e próstata em GO passam de A para B, e Todos em PE passa de B para C.

## Consequências

- **Custos aceitos:** o valor deixa de bater com o "todos os casos" do TabNet e deixa de fora quem começou pela cirurgia, cerca de 30% dos tratados antes da queda.
- A validação do valor usa a tabela do TabNet filtrada por modalidade, e a de todos os casos continua valendo para as contagens e a % sem informação.
- O mínimo da cascata conta os casos de quimio e radio. No 60 dias × Todos, 1.225 municípios usam o próprio dado, contra 2.073 se contasse todos os casos.
- O pipeline confere a contagem mensal por modalidade e alerta o mantenedor numa queda de patamar, sem bloquear, para pegar cedo uma quebra parecida na APAC.
- A Referência continua 100%, e a próstata continua sem Situação.
