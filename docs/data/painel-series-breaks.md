# Quebras de série do Painel-Oncologia

Evidência do recorte de quimio e radio no valor, na Situação e na Tendência do 60 dias. A decisão e o custo aceito estão no [ADR 3](../adr/0003-within-60-days-on-chemo-and-radio-cases.md), e o método em [`/metodologia/#60-dias`](https://brazil-cancer-map.kvojps.workers.dev/metodologia/#60-dias).

Medido em 03/11/2026 com os microdados `POBR2013–2026.dbc` (extração de 17/10/2026, a mesma do pipeline). Os scripts exploratórios não fazem parte do repositório. As regras são as do pipeline: "Todos" do tratamento = C00–C97 sem C44, C73 e C76–C80; "até 60 dias" = `TEMPO_TRAT` de `+0000` a `+0060` ou de `-0001` a `-0090`, como o TabNet; sem informação = `TRATAMENTO = 5`; cirurgia = `TRATAMENTO = 1`; quimio/radio = `TRATAMENTO` 2, 3 ou 4. Tipos: mama C50, colo C53, próstata C61, colorretal C18–C21, pulmão C33–C34.

**Como ler:** as seções 1 e 2 foram medidas **antes** das decisões, quando valor e Situação ainda usavam todos os casos. A seção 3 traz o resultado depois de adotado o recorte. Nas comparações "antes × depois" por estabelecimento e por UF, "antes" = meses de tratamento de abril de 2023 a fevereiro de 2024, e "depois" = janeiro a novembro de 2025 (11 meses cada).

## 1. Maio de 2018 e maio de 2019

### 1.1 Causa: documentação oficial

A **nota técnica** do Painel (http://tabnet.datasus.gov.br/cgi/painel_onco/doc/painel_oncologia.pdf, lida em 2026-11-03) diz:

> "Informações de diagnóstico de câncer de colo do útero e de mama estão disponíveis desde 2013 devido ao ano de início de implantação do SISCAN. Para os demais canceres as informações de diagnóstico oriundas do procedimento diagnóstico 'exame anatomopatológico para congelamento/parafina por peça cirúrgica ou por biópsia' (exceto colo uterino e mama) estão disponíveis a partir de maio de 2018, quando passou a ser obrigatório o registro do cartão nacional de saúde e da CID-10 (Portaria SAS Nº 643, de 17 de maio de 2018). Contudo, também estão disponíveis informações de casos anteriores a maio de 2018, em que, seguindo as regras definidas para construção do painel, havia informação de diagnóstico registrado na AIH ou na APAC."

Ou seja: **até abril de 2018, um caso dos outros cânceres só existia no Painel se já tivesse um registro de tratamento (AIH ou APAC) com o diagnóstico.** Por isso a % sem informação era de ~4%. A partir de maio de 2018, o exame anatomopatológico (BPA-I) passou a criar casos sozinho: casos ainda sem tratamento registrado e casos operados (o anatomopatológico da peça cirúrgica, junto da cirurgia do SIH). O SISCAN não é a origem da quebra: ele alimenta mama e colo desde 2013, e o que entrou em 2018 foi o BPA-I.

O dicionário (`ftp://ftp.datasus.gov.br/dissemin/publicos/painel_oncologia/Doc/Dicionario_Painel_Oncologia.pdf`) não traz campo de origem do registro. A nota técnica também diz que o caso é a combinação CNS master × CID-10 e que, nas cirurgias, "o resultado diagnóstico [pode ser] posterior ao tratamento", o que explica a regra dos −90 dias, que o TabNet aplica.

### 1.2 Causa: evidência nos microdados

**Por ano e tipo**

| Tipo | Ano | Casos | % ≤ 60 dias (todos os casos) | % sem informação | % ≤ 60 dias (tratados) |
|---|---|---:|---:|---:|---:|
| Todos | 2016 | 169.043 | 47,1 | 4,0 | 49,1 |
| Todos | 2017 | 173.784 | 47,1 | 3,5 | 48,8 |
| Todos | 2018 | 249.706 | 45,4 | 16,9 | 54,7 |
| Todos | 2019 | 328.248 | 39,7 | 29,8 | 56,6 |
| Todos | 2023 | 374.027 | 37,1 | 31,2 | 54,0 |
| Todos | 2024 | 345.217 | 33,5 | 33,6 | 50,5 |
| Mama | 2017 → 2019 | 38.772 → 53.146 | 41,7 → 36,5 | 5,6 → 17,7 | 44,2 → 44,4 |
| Colo | 2017 → 2019 | 11.430 → 18.164 | 37,5 → 39,5 | 8,4 → 22,4 | 40,9 → 50,9 |
| Próstata | 2017 → 2019 | 26.045 → 43.862 | 27,9 → 27,6 | 2,7 → 22,5 | 28,7 → 35,6 |
| Colorretal | 2017 → 2019 | 17.681 → 36.280 | 52,5 → 42,5 | 1,5 → 30,3 | 53,3 → 61,0 |
| Pulmão | 2017 → 2019 | 8.911 → 13.413 | 67,5 → 50,9 | 1,5 → 25,0 | 68,5 → 67,8 |

A quebra aparece em **todos os tipos, inclusive mama e colo**: mesmo com o SISCAN desde 2013, o anatomopatológico do BPA-I também acrescentou casos desses dois tipos.

**Por mês: a data da quebra**

"Todos", Brasil:

| Mês | Casos | % sem informação | % ≤ 60 dias (tratados) |
|---|---:|---:|---:|
| 2018-01 a 2018-04 | 13,5–15,5 mil/mês | 3,1–3,4 | 46,7–47,6 |
| **2018-05** | 25.019 | **21,1** | **58,3** |
| 2018-06 a 2019-04 | 20–26 mil/mês | 19,6–23,8 | 55–59 |
| **2019-05** | 30.658 | **34,9** | 56,9 |
| 2019-06 em diante | | ~34 | ~57 |

São **dois degraus**: maio de 2018 (Portaria 643) e maio de 2019 (sem explicação na documentação; forte no MA, RO, RJ e GO). Em maio de 2018, os cinco tipos saltam no mesmo mês (% sem informação: colorretal 1,0 → 18,4; próstata 2,3 → 15,9; pulmão 1,0 → 15,0; mama 5,7 → 16,0; colo 9,0 → 13,4).

**Por UF**

Mês do salto (primeiro mês de 2018–2019 com a % sem informação ≥ nível pré-quebra + 10 p.p.):

| Mês | UFs |
|---|---|
| 2018-05 | 16 UFs: RR, MA, PI, CE, RN, PB, PE, AL, BA, MG, ES, SP, PR, SC, RS, MT |
| 2018-06 a 2018-12 | PA, GO (jun), RO (jul), DF (ago), TO (set), AM (dez) |
| 2019 | RJ (mar), AC e AP (jun), SE (set) |
| 2018-01 | MS (oscilação já antes da portaria) |

A data é a **mesma na maior parte do país**, com atraso de adesão em algumas UFs. O nível pós-quebra varia muito: em 2022–2024, de 6% (TO) e 8% (AC) a 60% (MA).

**Por estabelecimento de diagnóstico e modalidade**

- Casos de estabelecimentos (`CNES_DIAG`) que **nunca** tinham diagnosticado antes de maio de 2018: 3% em 2018, 9–13% de 2019 a 2024. **A quebra não vem de estabelecimentos novos**, e sim de um tipo novo de registro nos mesmos hospitais. Mesmo nos estabelecimentos antigos, a % sem informação vai de ~4% para ~26%.
- 99,8% dos casos sem informação estão em estabelecimentos que também registram tratamentos: são hospitais oncológicos, e não laboratórios isolados.
- Por modalidade do primeiro tratamento ("Todos", casos por ano):

| Ano | Cirurgia | Quimio | Radio | Quimio + radio | Sem informação |
|---|---:|---:|---:|---:|---:|
| 2017 | 22.950 | 106.105 | 36.490 | 2.143 | 6.096 |
| 2018 | 56.363 | 112.089 | 36.778 | 2.156 | 42.320 |
| 2019 | 74.828 | 119.594 | 33.622 | 2.238 | 97.966 |
| 2023 | 76.667 | 141.565 | 36.244 | 2.776 | 116.775 |
| 2024 | 42.922 | 148.020 | 35.847 | 2.501 | 115.927 |

Os casos novos de 2018 são de dois tipos: **sem informação** (+36 mil em 2018) e **cirurgia** (+33 mil). A % em até 60 dias das cirurgias salta de 73% para 89% em maio de 2018, porque o diagnóstico da peça cirúrgica sai depois da operação, o que conta como "no prazo" até −90 dias. Por isso, trocar o denominador para os casos tratados **não corrige** a quebra: inverte o sinal dela.

### 1.3 A série de quimio e radio não tem degrau

% em até 60 dias entre os casos cujo primeiro tratamento é quimio, radio ou ambos (APAC), "Todos":

| 2018-01 a 04 | 2018-05 a 08 | 2019-02 a 04 | 2019-05 a 07 | 2024-01 a 06 |
|---|---|---|---|---|
| 42,6–43,8 | 42,5–43,8 | 40,6–41,7 | 41,4–43,7 | 38,0–41,7 |

Por ano: 44,3 (2014), 44,1, 45,1, 44,9, 42,6 (2018), 41,5, 45,3 (2020), 42,6, 39,5, 39,3, 41,0 (2024). Tipos: mama 39,2 → 35,0; colo 39,8 → 34,2; próstata 24,8 → 23,7; colorretal 45,7 → 42,9; pulmão 69,8 → 58,2.

A série passa pelas três quebras (maio de 2018, maio de 2019 e a de 2024, seção 2) **sem degrau**: o registro do diagnóstico e do tratamento pela APAC não mudou. É o único recorte comparável de 2014 a 2024. O custo é deixar de fora a cirurgia como primeiro tratamento (13,7% dos tratados em 2017, 29,8% em 2023, quase só no regime pós-quebra) e os casos sem tratamento registrado.

### 1.4 Efeito sobre as classes do Mapa inicial

"60 dias × Todos", só o dado do próprio município (sem a cascata), malha 2025 (5.571 municípios), com o `quasi_poisson_trend` do pipeline:

| Alternativa | Piorando | Melhorando | Estável | Sem direção clara | Não calculável | Municípios com ≥ 20/ano | Brasil: variação anual [IC 95%] |
|---|---:|---:|---:|---:|---:|---:|---|
| **A**. 2015–2024, todos os casos (regra da época) | 906 | 108 | 0 | 4.554 | 3 | 2.073 | −3,7% [−4,7; −2,7] piorando |
| **B**. 2019–2024, todos os casos | 386 | 96 | 2 | 5.071 | 16 | 2.416 | −3,3% [−5,6; −1,0] piorando |
| **C**. 2015–2024, denominador = tratados | 190 | 341 | 1 | 5.036 | 3 | 1.613 | +0,7% [−1,0; +2,5] sem direção |
| **D**. 2019–2024, denominador = tratados | 358 | 78 | 2 | 5.112 | 21 | 1.811 | −2,4% [−4,0; −0,7] piorando |
| **E**. 2019–2023, todos os casos | 248 | 99 | 1 | 5.192 | 31 | 2.438 | −2,4% [−5,3; +0,5] sem direção |
| **F**. 2019–2023, denominador = tratados | 244 | 86 | 4 | 5.201 | 36 | 1.812 | −1,8% [−4,1; +0,6] sem direção |
| **G**. 2015–2024, só quimio/radio | 448 | 151 | 2 | 4.955 | 15 | 1.225 | −1,3% [−2,2; −0,4] piorando |

Dos 906 municípios "piorando" em A, 696 viram "sem direção clara" em B. Por UF, A tem 21 UFs piorando; G tem 13, e RR e MA passam de piorando a sem direção e melhorando, respectivamente. **G é a alternativa adotada** ([ADR 3](../adr/0003-within-60-days-on-chemo-and-radio-cases.md)).

**Leitura:** a piora é real, mas menor. As alternativas limpas (E, F, G) estimam de −1,3% a −2,4% ao ano para o Brasil, contra −3,7% na regra da época: **entre metade e dois terços da inclinação atual vem do registro**, e cerca de metade dos municípios "piorando" de A sai dessa classe em G.

### 1.5 Primeiro sinal da queda das cirurgias

Casos com primeiro tratamento por cirurgia, "Todos", por mês: ~5,2–7,3 mil/mês em 2022 e 2023 e até fevereiro de 2024; depois 4.392 (abr/2024), 3.512, 3.041, … 1.914 (dez/2024), e **~1,5–2,2 mil/mês durante todo o ano de 2025**. Um atraso de registro deixaria os meses mais recentes mais baixos; aqui o patamar é plano em 2025, então é uma **mudança estrutural**, e não atraso. A nota técnica não a explica. Os casos sem informação e os de quimio/radio não mudam de patamar.

Efeito: 2024, que é o último ano consolidado e o ano da Situação, perde ~34 mil cirurgias, quase todas no prazo. A % em até 60 dias de todos os casos cai de 37,1% (2023) para 33,5% (2024), e a % sem informação sobe de 31,2% para 33,6%. A série de quimio/radio (G) não é afetada.

### 1.6 Alcance, medido antes das decisões

- **Situação sobre todos os casos, como era então:** o último ano consolidado, 2024, cai dentro do regime pós-2018 (sem efeito da quebra de 2018), mas sofre a queda das cirurgias de 2024 (seção 2). Como quase nenhum município chega a 80% do prazo, a faixa de Situação quase não muda; o número exibido, sim.
- **Faixa A/B/C:** os últimos 5 anos consolidados (2020–2024) estão todos no regime pós-2018, então a faixa não é afetada pela quebra de 2018. A queda das cirurgias em 2024 eleva um pouco a % sem informação desse ano (o denominador perde as cirurgias).
- **Mínimo de 20 por ano (cascata), janela 2015–2024, origem do dado:**

| Denominador do mínimo | Município | Região imediata | Dado insuficiente |
|---|---:|---:|---:|
| Todos os casos | 2.073 | 3.461 | 37 |
| Só quimio/radio | 1.225 | 4.273 | 73 |

- **Gráfico do cartão:** a série de todos os casos tem degraus em maio de 2018 e em 2024; a de quimio/radio, não.

## 2. Queda das cirurgias a partir de abril de 2024

A causa é **hipótese, sem confirmação oficial**.

- **A cirurgia não caiu no SUS; caiu o vínculo da cirurgia com o caso no Painel.** No SIH, as internações de cirurgia oncológica *sobem* em 2024 e 2025, em todas as UFs. No SIA, o exame anatomopatológico de peça cirúrgica ou biópsia também sobe.
- **Causa provável (hipótese, sem confirmação oficial):** a partir da competência 04/2024, a AIH ganhou um campo próprio para o **CPF do paciente**, seguindo a Lei nº 14.534/2023 (CPF como identificador "único e suficiente"). O CNS continua não obrigatório na AIH. O Painel monta o caso pelo **CNS master** × CID. Quando o hospital passa a mandar só o CPF, a cirurgia não se liga mais ao caso. Nenhuma nota do Painel, do SIH ou da SAES diz isso com todas as letras.
- **Data:** começa nas cirurgias de março e abril de 2024 (competência 04/2024) e se espalha até dezembro de 2024. Em 2025 o patamar fica plano em ~2 mil por mês (era ~6,5 mil).
- **Não é uniforme:** é um "liga/desliga" por hospital. 581 dos 909 estabelecimentos que operavam passam a ter zero ou quase zero cirurgias no Painel e concentram 95% da perda, mas continuam registrando quimio e radio normalmente. Em 17 UFs a queda é de 60–90%; em MA, RN, PB e GO quase não há queda.
- **Os casos perdidos, na maior parte, sumiram:** nos hospitais "desligados", para cada 10 cirurgias perdidas, ~3 reaparecem como casos de quimio/radio (o paciente operado aparece pelo tratamento seguinte) e o resto sai do Painel. A % sem informação não absorve as perdas.
- **Efeito:** a % em até 60 dias de todos os casos cai de 37,1% (2023) para 33,5% (2024) e fica em 33,4% em 2025 (provisório). Se as cirurgias perdidas voltassem, 2024 teria ~38,8%. A % sem informação sobe de 31,2% para 33,6% (2024) e 35,8% (2025). Quatro células UF × tipo mudam de faixa A/B/C na janela 2020–2024, todas na borda (diferença ≤ 0,6 p.p.).
- **A Situação quase não muda de classe** (quase todos os municípios ficam em "longe" em qualquer opção), mas **o número exibido muda**: um terço dos municípios perde mais de 5 p.p. de 2023 para 2024.
- **2025 também será afetado, e mais:** a queda vale o ano inteiro de 2025. Uma regra que dependa de "2024 é exceção" não serve quando 2025 se consolidar.

### 2.1 A cirurgia oncológica não caiu no SIH

TabNet do SIH, "Procedimentos hospitalares do SUS – por local de internação – Brasil" (http://tabnet.datasus.gov.br/cgi/deftohtm.exe?sih/cnv/qibr.def), AIH aprovadas do subgrupo **0416 Cirurgia em oncologia**, por ano de atendimento (consultado em 2026-11-03, arquivos de processamento de jan/2022 a ago/2026):

| | 2022 | 2023 | 2024 | 2025 |
|---|---:|---:|---:|---:|
| Brasil | 162.909 | 177.007 | 195.928 | 214.349 |
| São Paulo | 35.583 | 40.627 | 46.531 | 51.733 |
| Minas Gerais | 18.949 | 21.297 | 22.322 | 24.240 |
| Pernambuco | 5.715 | 6.517 | 8.166 | 9.308 |
| Rio Grande do Sul | 13.783 | 15.295 | 16.258 | 16.724 |

Mês a mês, o Brasil fica em 15–19 mil AIH/mês de 2023 a 2026, **sem degrau em abril de 2024** (mar/2024: 15.809; abr: 17.074; dez/2024: 14.153; mar/2025: 16.897). As 27 UFs crescem ou ficam estáveis de 2023 para 2025, inclusive SP, PE e TO, onde o Painel perde 80–90% das cirurgias.

Ressalva: o Painel não diz quais procedimentos do SIH conta como "cirurgia" (a nota técnica só diz que a cirurgia "é recuperada do Sistema de Informação Hospitalar (SIH)"). O subgrupo 0416 é a medida mais próxima, não a mesma.

### 2.2 O exame anatomopatológico também não caiu no SIA

TabNet do SIA, "Produção Ambulatorial do SUS – por local de atendimento" (http://tabnet.datasus.gov.br/cgi/deftohtm.exe?sia/cnv/qabr.def), quantidade aprovada do procedimento **02.03.02.003-0 Exame anatomo-patológico para congelamento/parafina por peça cirúrgica ou por biópsia (exceto colo uterino e mama)**, o que cria os casos desde a Portaria SAS nº 643/2018 (seção 1.1): 2,96 milhões em 2023, 3,39 milhões em 2024 e 3,66 milhões em 2025, quase tudo em BPA-I, sem degrau em 2024 (mar/2024: 264 mil; abr: 293 mil). O registro desse exame em APAC (procedimento secundário) começa em fev/2025, mas é residual (~1 mil/mês).

Não encontrei portaria SAES de 2023–2024 que mude o registro da cirurgia oncológica ou desse exame de forma que explique a queda. As portarias de 2024 que mexem nos anatomopatológicos (por exemplo, a SAES/MS nº 1.824, de 11/06/2024, e a nº 2.331, de 10/12/2024, das Ofertas de Cuidado Integrado em oncologia: https://bvsms.saude.gov.br/bvs/saudelegis/Saes/2024/prt1824_12_06_2024.html, https://bvsms.saude.gov.br/bvs/saudelegis/Saes/2024/prt2331_11_12_2024.html) são posteriores ao início da queda e tratam de outros fluxos.

### 2.3 O que mudou em abril de 2024: o CPF do paciente na AIH

Avisos do SIH (http://sihd.datasus.gov.br/principal/listarAvisos.php, lido em 2026-11-03):

> "Disponível novo layout da interface do SISAIH01 para CMPT 04/2024. Alteração devido ao novo campo CPF do Paciente: -> Unificação das linhas 34,35 e 36; -> Alteração na linha 41, coluna Preenchimento, retirado o código 4-CPF"

> "Informa-se a necessidade de reenvio da remessa da competência 04/2024 [...] imprescindível para correção em problema ocasionado na carga dos arquivos, especificamente na leitura dos dados do CPF do indivíduo atendido." (prazo prorrogado até 10/06/2024)

O layout da competência 04/2024 (ftp://ftp2.datasus.gov.br/public/sistemas/dsweb/SIHD/Manuais/Layout_do_SISAIH01_para_CMPT_202404.zip), comparado com o de 04/2023 (`..._CMPT_202304.zip`), cria o campo `NU_CPF_PAC` ("Numero do CPF do Paciente. Caso não informado, preencher com ZEROS") onde antes havia FILLER. O `NU_CNS` (CNS do paciente) continua com obrigatoriedade "N" nos dois layouts, e há o campo `JUSTIFICATIVA_CNS` ("justificativa devida à ausência de CNS do paciente"). Antes de 04/2024, o CPF só entrava como um dos tipos do "documento do paciente" (código 4, retirado em 2024).

A mudança segue a **Lei nº 14.534, de 11/01/2023** (https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2023/lei/l14534.htm): o CPF é o "número único e suficiente para identificação do cidadão nos bancos de dados de serviços públicos", com 12 meses para adequar os sistemas e 24 meses para a interoperabilidade dos cadastros.

A **nota técnica do Painel** (http://tabnet.datasus.gov.br/cgi/painel_onco/doc/painel_oncologia.pdf) diz que "a definição de caso foi feita a partir da combinação do cartão nacional de saúde com a [...] CID-10" e que "os dados apresentados no painel referem-se exclusivamente aos usuários que possuem cartão nacional de saúde master". O dicionário dos microdados (`ftp://ftp.datasus.gov.br/dissemin/publicos/painel_oncologia/Doc/Dicionario_Painel_Oncologia.pdf`) também usa o CNS (`cns_pac`). Nenhum dos dois cita o CPF nem traz histórico de mudanças.

No SIA, segundo uma página municipal (Cubatão, https://draca.cubatao.sp.gov.br/index.php/2025/08/21/cpf-sia/, fonte secundária sem documento federal citado), desde a competência 01/2025 não se pode informar CPF e CNS no mesmo atendimento, e o CPF é o preferido. Se isso valer, a APAC e o BPA-I podem sofrer o mesmo problema; nos microdados, até meados de 2026, os casos de quimio/radio por mês de tratamento não caem (seção 2.5).

### 2.4 Conclusão sobre a causa

- **Documentado:** (a) a cirurgia oncológica e o anatomopatológico não caíram no SUS (TabNet SIH e SIA); (b) a AIH passou a ter o CPF do paciente como campo próprio a partir da competência 04/2024, com o CNS não obrigatório, e houve problema de carga do CPF nessa competência (avisos e layouts do SIH); (c) o Painel liga os registros pelo CNS master (nota técnica).
- **Hipótese (não confirmada):** hospitais (ou os sistemas de faturamento deles e dos gestores) passaram a mandar a AIH com o CPF e sem o CNS, e o Painel, que vincula pelo CNS, deixou de ligar essas cirurgias aos casos. O padrão dos microdados (seção 2.5) bate com ela: data na competência 04/2024, padrão liga/desliga por hospital, os mesmos hospitais seguem ligando a APAC de quimio/radio, e a adoção se espalha ao longo de 2024. Não dá para testar diretamente com dados públicos: os arquivos RD do SIH não trazem CNS nem CPF.
- Nem o Painel nem o DATASUS publicaram explicação. Uma confirmação pediria um contato com o DATASUS/CGSI ou a SAES (por exemplo, pelo Fala.BR).

### 2.5 Medidas nos microdados

**Data: pelo mês do tratamento e pelo mês do diagnóstico**

"Todos", Brasil, casos cujo primeiro tratamento é cirurgia:

| Mês | Pelo mês do tratamento (`ANOMES_TRA`) | Pelo mês do diagnóstico (`ANOMES_DIA`) | Quimio/radio, pelo mês do tratamento |
|---|---:|---:|---:|
| 2023 (média) | 6.521 | 6.389 | 15.213 |
| 2024-01 | 6.478 | 6.021 | 15.932 |
| 2024-02 | 5.720 | 5.392 | 14.606 |
| 2024-03 | 5.647 | 5.164 | 15.628 |
| **2024-04** | **4.763** | 4.392 | 17.609 |
| 2024-05 | 3.805 | 3.512 | 16.501 |
| 2024-06 | 3.167 | 3.041 | 16.063 |
| 2024-09 | 2.657 | 2.552 | 17.011 |
| 2024-12 | 1.933 | 1.914 | 13.919 |
| 2025 (média jan–out) | 2.122 | 2.043 | 16.000 |
| 2026-01 a 05 | 1.430–1.870 | 1.330–1.750 | 11.800–14.800 |

Na cirurgia, o diagnóstico (o anatomopatológico da peça) quase sempre cai no mesmo mês do tratamento: ~80% dos casos de cirurgia têm `ANOMES_DIA = ANOMES_TRA` (e quase todos os outros ficam a 1–3 meses). Por isso as duas datas contam a mesma história. O primeiro mês de queda é **abril de 2024** pelo tratamento (a competência da AIH costuma ser o mês da alta ou o seguinte, então cirurgias do fim de março já entram na competência 04/2024). A queda continua até dezembro de 2024 e depois para. A quimio/radio não cai.

Os casos de cirurgia que sobram não são diferentes dos de antes: % em até 60 dias de 86,5% antes e 89,5% depois; 92% com diagnóstico no mesmo estabelecimento do tratamento, antes e depois.

**Por estabelecimento de tratamento (`CNES_TRAT`)**

Os 909 estabelecimentos com alguma cirurgia "antes", pela razão depois/antes das cirurgias por mês:

| Depois / antes | Estabelecimentos | Cirurgias antes | Cirurgias depois | Parte da perda líquida |
|---|---:|---:|---:|---:|
| 0 | 491 | 26.005 | 0 | 53% |
| 0–10% | 90 | 21.067 | 341 | 42% |
| 10–30% | 51 | 3.970 | 833 | 6% |
| 30–90% | 109 | 8.237 | 5.653 | 5% |
| 90–110% | 65 | 5.286 | 5.308 | 0% |
| acima de 110% | 102 | 6.951 | 10.088 | −6% |

É um **liga/desliga**: os estabelecimentos não perdem uma fração das cirurgias, perdem todas ou nenhuma. 46 estabelecimentos fazem metade da perda líquida, e 116 fazem 80%. Os maiores perdedores são hospitais oncológicos grandes (1.000–1.250 cirurgias em 11 meses → 0) que **continuam registrando quimio e radio no mesmo volume ou mais** (por exemplo, 1.431 → 1.816; 3.066 → 3.483). Ou seja, o hospital continua no Painel; só a AIH dele deixou de se ligar.

Entre os 183 hospitais "desligados" (≥ 20 cirurgias antes, < 10% depois e quimio/radio mantida em ≥ 50%), o último mês com cirurgias no nível normal é:

| Último mês normal | Hospitais | Cirurgias/mês que eles tinham |
|---|---:|---:|
| até 2024-01 | 7 | 120 |
| 2024-02 | 13 | 258 |
| **2024-03** | **39** | **944** |
| **2024-04** | **39** | **852** |
| 2024-05 | 27 | 409 |
| 2024-06 | 15 | 312 |
| 2024-07 a 10 | 15 | 219 |
| 2024-11 e 12 | 16 | 410 |
| 2025 | 12 | 52 |

Metade dos hospitais "desliga" em março a maio de 2024; o resto, ao longo de 2024. É o padrão esperado de uma troca de sistema adotada aos poucos por hospitais e gestores, e não de uma regra nova do Painel (que valeria para todos de uma vez e, como o Painel é refeito a cada mês para todos os anos, também mudaria os anos anteriores).

**Por UF**

Cirurgias por mês, pela UF de residência (a UF do estabelecimento de tratamento dá o mesmo quadro):

| UF | Antes | Depois | Depois/antes | Mês de queda* |
|---|---:|---:|---:|---|
| TO | 27 | 3 | 10% | 2024-03 |
| PE | 166 | 24 | 15% | 2024-04 |
| SP | 1.587 | 309 | 19% | 2024-04 |
| PA | 109 | 23 | 21% | 2024-11 |
| MG | 966 | 210 | 22% | 2024-05 |
| RS | 599 | 138 | 23% | 2024-04 |
| MS | 113 | 27 | 24% | 2024-04 |
| ES | 145 | 35 | 24% | 2024-05 |
| AM | 78 | 20 | 25% | 2024-11 |
| BA | 275 | 70 | 25% | 2024-04 |
| SE | 67 | 20 | 29% | 2024-05 |
| SC | 309 | 89 | 29% | 2024-04 |
| PR | 640 | 199 | 31% | 2024-04 |
| AL | 55 | 17 | 31% | 2024-03 |
| RJ | 379 | 124 | 33% | 2024-06 |
| RO | 36 | 13 | 36% | 2024-04 |
| DF | 77 | 29 | 38% | 2024-04 |
| PI | 52 | 29 | 56% | 2025-12 |
| CE | 192 | 142 | 74% | 2025-03 |
| MT | 95 | 73 | 77% | 2025-11 |
| GO | 198 | 162 | 82% | — |
| MA | 102 | 92 | 89% | — |
| RN | 150 | 149 | 99% | — |
| PB | 76 | 76 | 100% | — |
| AC, RR, AP | ≤ 6 | ≤ 5 | — | — |

\* Primeiro mês, a partir de mar/2024, abaixo de 70% do nível de antes sem voltar a 85% depois. Em PI, CE e MT a data marca oscilações em 2025, e não a queda de 2024.

A queda é **nacional, mas não total**: 17 UFs perdem 60–90% das cirurgias, quase todas a partir de abril–maio de 2024 (PA e AM em novembro de 2024). MA, RN, PB, GO e MT quase não perdem. Os ~2 mil casos de cirurgia por mês que restam em 2025 vêm em boa parte dessas UFs e dos hospitais que não "desligaram".

**Por tipo de câncer**

| Tipo | Cirurgias/mês antes | Depois | Depois/antes |
|---|---:|---:|---:|
| Todos | 6.502 | 2.082 | 32% |
| Mama | 708 | 224 | 32% |
| Colo | 405 | 151 | 37% |
| Próstata | 718 | 192 | 27% |
| Colorretal | 874 | 268 | 31% |
| Pulmão | 188 | 65 | 35% |

A queda é **igual em todos os tipos** (sobram 27–37%), o que também aponta para o registro, e não para a clínica.

**Os casos sumiram ou foram reclassificados?**

Balanço nacional, "Todos", por ano de diagnóstico:

| Ano | Cirurgia | Quimio/radio | Sem informação | Total |
|---|---:|---:|---:|---:|
| 2022 | 73.339 | 171.681 | 111.985 | 357.005 |
| 2023 | 76.667 | 180.585 | 116.775 | 374.027 |
| 2024 | 42.922 | 186.368 | 115.927 | 345.217 |
| 2025 (provisório) | 23.613 | 158.432 | 101.436 | 283.481 |

De 2023 para 2024: −33,7 mil cirurgias, +5,8 mil quimio/radio, −0,8 mil sem informação, −28,8 mil no total. A quimio/radio já vinha subindo ~+8 mil por ano (2021–2023), então o ganho de 2024 não mostra uma transferência clara no total nacional.

Nos casos **diagnosticados nos 183 hospitais "desligados"** (por `CNES_DIAG`), por semestre de diagnóstico:

| Semestre | Total | Cirurgia | Quimio/radio | Sem informação |
|---|---:|---:|---:|---:|
| 2023-2 | 89.591 | 20.512 | 46.743 | 22.336 |
| 2024-1 | 83.223 | 11.903 | 51.624 | 19.696 |
| 2024-2 | 70.409 | 2.411 | 52.123 | 15.875 |
| 2025-1 | 65.194 | 412 | 50.740 | 14.042 |

De 2023-2 para 2024-2: −18,1 mil cirurgias, +5,4 mil quimio/radio, −6,5 mil sem informação, −19,2 mil no total. Leitura:

- **A maior parte sumiu do Painel.** O caso inteiro desaparece, e não só a cirurgia. Se a cirurgia apenas deixasse de se ligar, o anatomopatológico da peça deixaria o caso em "sem informação", mas a % sem informação desses hospitais **cai**. Isso sugere que, para esses pacientes, o próprio diagnóstico (ou a ligação dele ao CNS master) também se perdeu, ou que o Painel usava a AIH para fechar o caso. Não há documentação para separar as duas explicações.
- **Cerca de 3 em cada 10 reaparecem como quimio/radio:** o paciente operado entra pelo tratamento seguinte (quimio ou radio adjuvante), registrado em APAC com CNS. Esses casos passam a contar na Tendência, mas o efeito é pequeno: nos hospitais "desligados", a % em até 60 dias da quimio/radio fica em 38,6% antes e 37,6% depois, e a distribuição do tempo quase não muda (61–180 dias: 41,4% → 40,6%).

Por isso a queda **aumenta** a % sem informação nacional (o denominador perde as cirurgias), mas não porque os casos virem "sem informação".

### 2.6 Efeito sobre os números

**Valor, % sem informação e alternativas, Brasil**

"Contrafactual" = as cirurgias que faltam em relação a 2023 (por UF × tipo), devolvidas com a % em até 60 dias das cirurgias do próprio ano. Serve só para medir o tamanho do efeito; não é proposta de método.

| Tipo | Ano | Todos os casos | Contrafactual | % sem informação (atual → contrafactual) | Sem as cirurgias | Só quimio/radio |
|---|---|---:|---:|---|---:|---:|
| Todos | 2023 | 37,1 | 37,1 | 31,2 | 23,9 | 39,3 |
| Todos | 2024 | **33,5** | 38,8 | 33,6 → 30,6 | 25,3 | 41,0 |
| Todos | 2025 (prov.) | 33,4 | 42,6 | 35,8 → 30,1 | 27,9 | 45,8 |
| Mama | 2023 → 2024 | 30,8 → 29,6 | 32,0 | 21,1 → 22,7 | 25,9 → 26,4 | 34,1 → 35,0 |
| Colo | 2023 → 2024 | 34,7 → 31,7 | 36,7 | 28,8 → 32,0 | 20,5 → 21,3 | 32,5 → 34,2 |
| Próstata | 2023 → 2024 | 26,3 → 23,0 | 28,2 | 21,3 → 24,7 | 16,4 → 17,3 | 22,0 → 23,7 |
| Colorretal | 2023 → 2024 | 39,0 → 34,4 | 40,8 | 32,7 → 35,0 | 23,6 → 25,7 | 40,9 → 42,9 |
| Pulmão | 2023 → 2024 | 47,1 → 47,3 | 49,9 | 26,0 → 25,4 | 39,2 → 41,7 | 56,4 → 58,2 |

- Em 2024 faltam ~34 mil cirurgias; em 2025, ~53 mil (o ano inteiro afetado). **2025 será pior que 2024**: o valor de todos os casos fica ~9 p.p. abaixo do contrafactual, contra ~5 p.p. em 2024.
- Os valores de 2025 ainda são provisórios. Na quimio/radio, o valor provisório fica inflado (45,8%) porque os casos ainda sem tratamento não entram no denominador; isso some quando o ano se consolida.
- Nos municípios, com a cascata, a mudança de 2023 para 2024 no valor de todos os casos tem mediana de −2,6 p.p.; **37% dos municípios perdem mais de 5 p.p.**, e a perda passa de 40 p.p. em alguns. Quem perde mais depende de onde a pessoa se opera (hospital "desligado" ou não), e não da qualidade do acesso.

**Faixa A/B/C (% sem informação, UF × tipo, janela 2020–2024)**

O efeito da queda na % sem informação acumulada de 2020–2024 é pequeno: em média +0,4 p.p. em "Todos" (no máximo +0,85), e no máximo +1,1 p.p. em colo e colorretal. Mudam de faixa só 4 das 162 células UF × tipo, todas na borda:

| Tipo | UF | 2020–2024 atual | Contrafactual | Faixa atual → sem a queda |
|---|---|---:|---:|---|
| Mama | MS | 15,3 | 15,0 | B → A |
| Mama | DF | 15,1 | 14,9 | B → A |
| Próstata | GO | 15,1 | 15,0 | B → A |
| Todos | PE | 35,1 | 34,5 | C → B |

Para comparação, a troca de janela de 2019–2023 para 2020–2024 muda 18 células, por causa da variação normal dos dados. Na janela futura 2021–2025 (com 2025 ainda provisório), o efeito cresce, mas continua pequeno: 4 células mudam (colorretal SP e todos PE de C para B, pulmão MS de C para B e todos SE de B para A, sem a queda).

**Leitura:** a faixa A/B/C é pouco afetada, e só nas bordas. PE "Todos" é o caso mais visível: fica em C (com hachura) por causa da queda.

**Situação (classe)**

"Todos", municípios com a cascata (5.571 municípios, 73 com dado insuficiente):

| Opção | Alcançou | Perto | Longe | Mediana do valor | Brasil |
|---|---:|---:|---:|---:|---:|
| 2024, todos os casos | 0 | 1 | 5.497 | 35,3 | 33,5 |
| 2023, todos os casos | 0 | 2 | 5.496 | 38,8 | 37,1 |
| 2024, sem as cirurgias | 0 | 0 | 5.498 | 27,8 | 25,3 |
| 2024, só quimio/radio | 0 | 3 | 5.495 | 42,2 | 41,0 |
| 2025 (prov.), todos os casos | 0 | 8 | 5.490 | 36,5 | 33,4 |
| 2025 (prov.), só quimio/radio | 11 | 52 | 5.433 | 46,2 | 45,8 |

Com a Referência de 100%, quase todos os municípios ficam em "longe" em qualquer opção. **A queda muda o número na barra, não a classe.** (As 63 classes "alcançou/perto" de 2025 provisório na quimio/radio vêm do viés do ano provisório e não devem ser lidas como reais.)

## 3. Resultado depois das decisões

Com a extração de 17/10/2026, sem repetir o download.

**Tendência sobre quimio e radio** ("60 dias × Todos", sem cascata):

| Classe | Todos os casos | Quimio/radio |
|---|---:|---:|
| Piorando | 906 | 448 |
| Melhorando | 108 | 151 |
| Estável | 0 | 2 |
| Sem direção clara | 4.554 | 4.955 |
| Não calculável | 3 | 15 |

Dos 906 "piorando", 562 passaram a "sem direção clara". Brasil: −1,3% ao ano [IC 95% −2,2; −0,4], piorando; antes, −3,7%. Os 12 municípios novos sem Tendência calculável não têm casos de quimio/radio na janela.

**Com a cascata:**

| Origem | Melhorando | Piorando | Estável | Sem direção clara | Total |
|---|---:|---:|---:|---:|---:|
| Município | 55 | 204 | 0 | 966 | 1.225 |
| Região imediata | 417 | 1.068 | 0 | 2.788 | 4.273 |
| Dado insuficiente | | | | | 73 |

**Valor do Brasil, Todos, diagnóstico de 2024:** 76.383 / 186.368 = 41,0% nos casos de quimio/radio; em todos os casos, 115.777 / 345.217 = 33,5%. Sem informação: 115.927 / 345.217 = 33,6%. A comparação dos JSON antes e depois confirmou zero mudança de `without_treatment_info` em qualquer município, nos seis tipos, e nenhuma mudança nas faixas de qualidade.

**Conferência com o TabNet:** contagens de casos e de "até 60 dias" exatas nas 351 combinações UF × ano (27 UFs, 2014–2026), nas tabelas de todos os casos e filtrada por modalidade.

**Vigilância mensal:** 16 alertas, sem bloquear a publicação. O limiar está em [`data-sources.md`](../data-sources.md#painel).

- Cirurgia: abril de 2020 e abril a dezembro de 2024. Em abril de 2024: 4.392 casos, 71% da mediana de 6.228. Em dezembro: 1.914, 58% da mediana de 3.276.
- Quimio/radio: abril de 2020.
- Sem informação: fevereiro de 2015, fevereiro de 2017 e abril a junho de 2020.

Os cinco alertas de 2020 se concentram no início da pandemia. Os anos provisórios 2025 e 2026 não geram alertas.

## Fontes

- Painel-Oncologia, nota técnica: http://tabnet.datasus.gov.br/cgi/painel_onco/doc/painel_oncologia.pdf (lida em 2026-11-03).
- Painel-Oncologia, dicionário dos microdados: ftp://ftp.datasus.gov.br/dissemin/publicos/painel_oncologia/Doc/Dicionario_Painel_Oncologia.pdf.
- SIH, avisos do SIHD (layout CMPT 04/2024 com o CPF do paciente; reenvio da competência 04/2024 por problema na leitura do CPF): http://sihd.datasus.gov.br/principal/listarAvisos.php (lido em 2026-11-03).
- SIH, layouts do SISAIH01, página http://sihd.datasus.gov.br/documentos/documentos_sisaih01.php: ftp://ftp2.datasus.gov.br/public/sistemas/dsweb/SIHD/Manuais/Layout_do_SISAIH01_para_CMPT_202404.zip e `..._CMPT_202304.zip`.
- Lei nº 14.534, de 11/01/2023 (CPF como identificador único e suficiente): https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2023/lei/l14534.htm.
- TabNet SIH, procedimentos hospitalares por local de internação: http://tabnet.datasus.gov.br/cgi/deftohtm.exe?sih/cnv/qibr.def (consultado em 2026-11-03).
- TabNet SIA, produção ambulatorial por local de atendimento: http://tabnet.datasus.gov.br/cgi/deftohtm.exe?sia/cnv/qabr.def (consultado em 2026-11-03).
- Portarias SAES/MS nº 1.824/2024 e nº 2.331/2024 (OCI oncologia): https://bvsms.saude.gov.br/bvs/saudelegis/Saes/2024/prt1824_12_06_2024.html, https://bvsms.saude.gov.br/bvs/saudelegis/Saes/2024/prt2331_11_12_2024.html (citadas só para descartar; não lidas na íntegra).
- Fonte secundária, CPF/CNS no SIA a partir de 01/2025: https://draca.cubatao.sp.gov.br/index.php/2025/08/21/cpf-sia/.
