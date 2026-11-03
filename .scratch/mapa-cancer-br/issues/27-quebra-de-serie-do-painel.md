# O que causa a quebra de 2018–2019 no Painel-Oncologia, e como a Tendência do 60 dias deve tratá-la?

Type: research
Status: resolved
Assignee: Kvojps (Claude session 2026-11-03, ticket 27)
Blocked by:

## Question

A implementação do Mapa inicial ([ticket 04 de implementação](../../mvp-implementacao/issues/04-60-dias-todos-em-tendencia.md)) mostrou uma quebra na série nacional do Painel-Oncologia ("Todos" do tratamento, extração de 17/10/2026):

| Ano de diagnóstico | Casos | % em até 60 dias | % sem informação de tratamento |
|---|---|---|---|
| 2014 | 163.990 | 46,5% | 4,3% |
| 2015 | 165.176 | 46,2% | 4,6% |
| 2016 | 169.043 | 47,1% | 4,0% |
| 2017 | 173.784 | 47,1% | 3,5% |
| 2018 | 249.706 | 45,4% | 16,9% |
| 2019 | 328.248 | 39,7% | 29,8% |
| 2020 | 302.032 | 41,4% | 29,5% |
| 2021 | 335.523 | 38,5% | 30,9% |
| 2022 | 357.005 | 37,0% | 31,4% |
| 2023 | 374.027 | 37,1% | 31,2% |
| 2024 | 345.217 | 33,5% | 33,6% |

Entre 2017 e 2019, os casos quase dobram e a % sem informação de tratamento passa de ~4% para ~30%. Isso parece uma mudança no registro (por exemplo, a entrada de diagnósticos do SISCAN sem tratamento vinculado), e não no atendimento. Mas é só uma hipótese, ainda não verificada.

A janela da Tendência (2015–2024) atravessa a quebra. Como as duas porcentagens usam todos os casos diagnosticados como denominador, a % em até 60 dias cai junto, e o Mapa inicial sai com 906 municípios "piorando" e só 108 "melhorando". Parte desse "piorando" pode ser efeito do registro. Isso contraria o tom da spec ("não se promete melhora onde o dado mostra piora", mas também não se mostra piora que o dado não sustenta) e a regra de que falta de registro não significa falta de tratamento.

Investigar e decidir:

1. **Causa:** o que mudou no Painel em 2018–2019? Fontes: a nota técnica (http://tabnet.datasus.gov.br/cgi/painel_onco/doc/painel_oncologia.pdf), o dicionário (`ftp://ftp.datasus.gov.br/dissemin/publicos/painel_oncologia/Doc/`) e normas do MS sobre o SISCAN e o Painel. Nos microdados, medir a quebra:
   - por UF;
   - por tipo de câncer (os 5 do seletor);
   - por mês de diagnóstico (`ANOMES_DIA`), para datar a quebra;
   - por estabelecimento de diagnóstico (`CNES_DIAG`) e modalidade (`TRATAMENTO`).

   A pergunta é se os casos novos são majoritariamente "sem informação" e se a quebra tem a mesma data em todo o país.
2. **Efeito:** quanto da classe "piorando" do Mapa inicial vem da quebra? Recalcular as classes com cada alternativa abaixo e comparar as distribuições.
3. **Tratamento:** recomendar uma alternativa, com prós e contras. Candidatas, sem excluir outras:
   - começar a janela da Tendência depois da quebra (por exemplo 2019 em diante, com menos de 10 anos e IC mais largo);
   - trocar o denominador da % em até 60 dias para os casos com tratamento registrado, deixando a % sem informação ao lado. Isso muda a comparação com o TabNet, que usa todos os casos;
   - manter o cálculo e declarar a quebra na metodologia e no cartão;
   - combinar alternativas (por exemplo, janela pós-quebra só para o 60 dias).
4. **Alcance:** a escolha também afeta:
   - a Situação (último ano consolidado);
   - a faixa A/B/C (últimos 5 anos, [ticket 06 de implementação](../../mvp-implementacao/issues/06-faixa-de-qualidade-abc.md));
   - o mínimo de 20 casos por ano da cascata (ticket 05 de implementação), já que os casos dobraram;
   - o gráfico da série no cartão (a quebra precisa de marca, como a dose única do HPV?).

## Resultado esperado

- A resposta, registrada sob `## Answer` neste arquivo, com a causa documentada (fonte oficial ou evidência nos microdados) e a medição do efeito sobre as classes.
- A decisão tomada com o responsável pelo projeto, refletida na spec ([spec-mvp.md](../spec-mvp.md), seções 5, 6.4, 7 e 12) e no `map.md`.
- **Um ticket de implementação** novo em `.scratch/mvp-implementacao/issues/`, `ready-for-agent`, com critérios verificáveis. Ele deve aplicar a decisão no pipeline, regenerar a camada do mapa e o `manifest.json`, ajustar a validação contra o TabNet se o denominador mudar e acrescentar a nota de método.

Os scripts de medição ficam em `research/27-scripts/`, como nas pesquisas 09 e 10.

## Answer

Pesquisa feita e decisão tomada com o responsável pelo projeto em 2026-11-03. Detalhes, tabelas e scripts: [research/27-quebra-de-serie-do-painel.md](../research/27-quebra-de-serie-do-painel.md) e [`research/27-scripts/`](../research/27-scripts/).

**Causa (fonte oficial e microdados).** A nota técnica do Painel diz que o diagnóstico pelo exame anatomopatológico (BPA-I) só entra no Painel **a partir de maio de 2018**, quando a Portaria SAS nº 643, de 17/05/2018, tornou obrigatórios o CNS e a CID-10 nesse procedimento. Antes disso, um caso fora de mama e colo só existia se houvesse diagnóstico registrado na AIH ou na APAC, ou seja, quase só casos já tratados. Os microdados confirmam:
- a quebra tem data: a % sem informação nacional vai de 3,3% (abril de 2018) para 21,1% (maio de 2018), nos cinco tipos ao mesmo tempo, inclusive mama e colo; há um segundo degrau em maio de 2019 (23,8% → 34,9%), sem explicação na documentação;
- 16 UFs saltam em maio de 2018; as demais, com atraso de 1 a 16 meses (RJ em março de 2019, SE em setembro de 2019);
- não são estabelecimentos novos: 87–97% dos casos pós-quebra vêm de estabelecimentos que já diagnosticavam, e 99,8% dos casos sem informação estão em estabelecimentos que também tratam. O que mudou foi o tipo de registro;
- os casos novos são de dois tipos: sem tratamento registrado (+36 mil em 2018) e **cirurgia** (+33 mil). As cirurgias entram com tempo curto (89% em até 60 dias, contra 73% antes), porque o diagnóstico da peça sai depois da operação. Por isso, trocar o denominador para os tratados inverte a quebra em vez de corrigi-la;
- a % em até 60 dias dos casos tratados com **quimio ou radio (APAC)** não tem degrau em nenhuma quebra: 44,3% em 2014, 42,6% em 2018 e 41,0% em 2024.

**Efeito sobre as classes** ("60 dias × Todos", sem cascata): o cálculo atual (2015–2024, todos os casos) dá 906 municípios piorando e o Brasil em −3,7% ao ano. As alternativas limpas dão de −1,3% (só quimio/radio, 2015–2024: 448 piorando, 151 melhorando) a −2,4% (2019–2023: 248 piorando). A piora é real, mas **entre metade e dois terços da inclinação atual vem do registro**. A tabela das sete alternativas está na pesquisa, seção 3.

**Achado novo:** a partir de abril de 2024, os casos com primeiro tratamento por cirurgia caem de ~6 mil para ~2 mil por mês e ficam nesse patamar em 2025. Não é atraso de registro, e a documentação não explica. A % em até 60 dias de 2024 cai de 37,1% para 33,5% por isso. Virou o [ticket 28](28-queda-das-cirurgias-em-2024.md).

**Decisão:**
1. **Tendência do 60 dias:** a classe sai **só dos casos cujo primeiro tratamento foi quimioterapia, radioterapia ou ambos** (`TRATAMENTO` 2, 3 ou 4), com numerador = esses casos em até 60 dias e denominador = esses casos, na janela normal (até 10 anos consolidados, hoje 2015–2024) e com o mesmo modelo (quasi-Poisson, offset `log(casos)`). Vale para todos os tipos do seletor. Alternativas descartadas: janela pós-quebra (só 5 anos, degrau de 2019 dentro, 2024 de fora e regra ad hoc a cada ano), denominador de tratados (inverte a quebra) e manter e declarar (dois terços da queda seriam do registro).
2. **Valor, Situação e % sem informação:** continuam sobre **todos os casos diagnosticados**, comparáveis ao TabNet e à lei (100%). A validação atual contra o TabNet não muda.
3. **Gráfico do cartão:** mostra a **série da Tendência** (quimio/radio), com título que diz isso, para que a linha e a cor nunca se contradigam. O valor de todos os casos aparece na barra da Situação, com a % sem informação ao lado.
4. **Cascata:** o mínimo de 20 por ano conta o denominador da Tendência (casos de quimio/radio), e a origem escolhida vale para o cartão inteiro (Tendência e Situação), como manda a seção 8. Com isso, em "Todos", 1.225 municípios usam o próprio dado (2.073 contando todos os casos), 4.273 usam a Região imediata e 73 ficam com dado insuficiente.
5. **Faixa A/B/C:** sem mudança. Os 5 anos da faixa (2020–2024) estão todos no regime pós-2018.
6. **Quebra de 2024:** a Situação continua em 2024, com nota no cartão e na metodologia, e a causa vai para o ticket 28.

**Textos para o público** (propostos, a aprovar como os demais textos novos do ticket 04 de implementação):
- título do gráfico: "Casos tratados com quimioterapia ou radioterapia: % que começou em até 60 dias";
- nota da Tendência no cartão: "A direção é medida nos casos tratados com quimioterapia ou radioterapia, cujo registro não mudou desde 2014. Em 2018, o painel passou a incluir diagnósticos por biópsia, o que mudou a contagem dos demais casos.";
- nota de 2024: "Em 2024, caiu o registro de cirurgias no painel do Ministério da Saúde; o valor deste ano pode estar abaixo do real."

Spec atualizada: seções 5, 6.3, 6.4, 7, 8, 11.2, 12 e 17 de [spec-mvp.md](../spec-mvp.md). Ticket de implementação: [27 — Tendência do 60 dias sobre os casos de quimio e radio](../../mvp-implementacao/issues/27-tendencia-60-dias-quimio-radio.md).
