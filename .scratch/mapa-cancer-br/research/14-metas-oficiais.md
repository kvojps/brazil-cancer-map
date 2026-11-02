# Metas oficiais para os indicadores do MVP

Pesquisa do ticket `issues/14-metas-oficiais.md`. Data da verificação: **2026-11-02**.
Método: leitura direta do *Plano de Ações Estratégicas para o Enfrentamento das DCNT no Brasil 2021–2030* (Plano de Dant, PDF do MS), das fichas técnicas de indicadores do INCA (2014), das notas técnicas do PNI (NT 41/2024, NT 16/2025, NT 90/2025, NI 62/2017), da Nota Metodológica C7 da SAPS (financiamento da APS, Portaria GM/MS 3.493/2024), da NT 4/2022-SAPS (Previne Brasil), da Resolução CIT 8/2016 (SISPACTO), das Leis 12.732/2012 e 13.896/2019 no Planalto, da página do IPEA sobre os ODS e da página da OMS sobre a eliminação do câncer do colo do útero. Quando a fonte não é primária, ou quando o número foi lido num gráfico, isso está indicado.

## Resumo

| Indicador do MVP | Meta ou parâmetro oficial | Unidade | População-alvo | Horizonte | Documento | Link | Serve como Referência? |
|---|---|---|---|---|---|---|---|
| **% com 1º tratamento em até 60 dias** | **100%** (direito de todo paciente) | % de casos | Pacientes com câncer maligno no SUS, contado da data do laudo patológico | Permanente, desde 2013 | Lei 12.732/2012, art. 2º | [planalto](https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2012/lei/l12732.htm) | **Sim** |
| (Lei dos 30 dias) | Exames de diagnóstico em até 30 dias quando a hipótese principal é câncer | dias | Pessoas com suspeita de câncer, com pedido médico fundamentado | Permanente, desde abr/2020 | Lei 13.896/2019 (inclui o § 3º no art. 2º da Lei 12.732) | [planalto](https://www.planalto.gov.br/ccivil_03/_ato2019-2022/2019/lei/l13896.htm) | Não: o Painel-Oncologia não mede esse intervalo. Serve para a Ação |
| **Razão de mamografias de rastreamento** | **1** (oferta suficiente: 1 exame a cada 2 anos por mulher) | razão | Mulheres de 50–69 anos | Sem prazo (parâmetro de análise) | Ficha técnica de indicadores do câncer de mama, INCA 2014, indicador 1.2 | [INCA (cópia do Internet Archive)](https://web.archive.org/web/2023/https://www.inca.gov.br/sites/ufu.sti.inca.local/files/media/document/ficha-tecnica-indicadores-mama-2014.pdf) | **Sim** |
| **Razão de citopatológicos** | **1** (1 exame a cada 3 anos por mulher) | razão | Mulheres de 25–64 anos | Sem prazo (parâmetro de análise) | Ficha técnica de indicadores do câncer do colo do útero, INCA 2014, indicador 1.2 | [INCA (cópia do Internet Archive)](https://web.archive.org/web/2023/https://www.inca.gov.br/sites/ufu.sti.inca.local/files/media/document/fichatecnicaindicadorescolo14.pdf) | **Sim** |
| **Cobertura da vacina HPV** | **90%** | % vacinados (≥ 1 dose desde 2024) | Meninas e meninos de 9–14 anos (ver ressalva sobre meninos) | 2030 | Plano de Dant 2021–2030, meta de fatores de risco; reafirmada pelo MS em 2024 e 2025 | [Plano de Dant (PDF)](https://www.gov.br/saude/pt-br/centrais-de-conteudo/publicacoes/svsa/doencas-cronicas-nao-transmissiveis-dcnt/09-plano-de-dant-2022_2030.pdf) | **Sim** |
| **% de fumantes adultos** | **Reduzir 40%**: de 9,8% (Vigitel 2019) para **5,9%** | % de adultos | Adultos (18+) do conjunto das capitais e DF (Vigitel) | 2030 | Plano de Dant 2021–2030, Figura 61 | [Plano de Dant (PDF)](https://www.gov.br/saude/pt-br/centrais-de-conteudo/publicacoes/svsa/doencas-cronicas-nao-transmissiveis-dcnt/09-plano-de-dant-2022_2030.pdf) | **Sim, com adaptação** (a meta é nacional, não por capital) |
| **Tendência da mortalidade por câncer** | Só há metas para a mortalidade **prematura (30–69 anos)**: DCNT −1/3; mama −10%; colo do útero −20%; aparelho digestivo −10% (base 2015) | taxa padronizada (pop. Brasil 2010) por 100 mil | 30–69 anos | 2030 | Plano de Dant 2021–2030; ODS 3.4 | [Plano de Dant (PDF)](https://www.gov.br/saude/pt-br/centrais-de-conteudo/publicacoes/svsa/doencas-cronicas-nao-transmissiveis-dcnt/09-plano-de-dant-2022_2030.pdf), [IPEA ODS 3](https://www.ipea.gov.br/ods/ods3.html) | **Não**: nenhuma meta casa com o indicador do MVP (todas as idades, padrão mundial, 5 tipos + todos). Usar o valor do Brasil |
| Casos novos estimados | Não há meta (é contexto) | — | — | — | — | — | Não se aplica |

**Em uma frase:** há meta oficial para quatro indicadores: 60 dias (100%), mamografia (razão 1), citopatológico (razão 1) e HPV (90%). O tabagismo tem meta nacional (5,9% em 2030) que precisa de adaptação para cada capital. A mortalidade não tem meta compatível, então a Referência é o valor do Brasil.

---

## 1. % com 1º tratamento em até 60 dias

**Lei 12.732/2012, art. 2º (redação vigente no Planalto):** o paciente com neoplasia maligna tem direito de se submeter ao primeiro tratamento no SUS "no prazo de até 60 (sessenta) dias contados a partir do dia em que for firmado o diagnóstico em laudo patológico", ou em prazo menor se o caso exigir. O § 1º diz que o tratamento começa com a cirurgia ou com o início da radioterapia ou da quimioterapia. Fonte: https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2012/lei/l12732.htm

- Como é um direito de cada paciente, a meta implícita é **100% dos casos**. É a Referência que o ticket 04 já tinha escolhido.
- O art. 3º prevê "penalidades administrativas" aos gestores que descumprirem a lei. Os arts. 2º-A e 2º-B, incluídos pela MP 1.301/2025 e pela Lei 15.233/2025, tratam de ampliar a radioterapia e a diálise e de punir estabelecimentos que não informam oferta e demanda. **Eles não mudam o prazo de 60 dias** (mesma página do Planalto).

**Lei 13.896/2019 (Lei dos 30 dias):** incluiu o § 3º no art. 2º: quando a principal hipótese diagnóstica for neoplasia maligna, "os exames necessários à elucidação devem ser realizados no prazo máximo de 30 (trinta) dias", mediante pedido fundamentado do médico. Publicada no DOU em 31/10/2019, com vigência 180 dias depois (abril de 2020). Fonte: https://www.planalto.gov.br/ccivil_03/_ato2019-2022/2019/lei/l13896.htm

- **Não gera outro parâmetro para o MVP.** O Painel-Oncologia conta o tempo **a partir do diagnóstico** e não registra a data da suspeita ou do pedido de exame. Não há como medir o intervalo de 30 dias com dado aberto.
- Serve como **Ação** e texto de direito ("se há suspeita de câncer, os exames devem sair em até 30 dias"), junto com a Lei dos 60 dias.

**Política Nacional de Prevenção e Controle do Câncer (Lei 14.758/2023):** não traz metas numéricas na lei. Notícias dizem que a regulamentação de 2025 deixa metas e indicadores para os planos regionais. **Não verifiquei a portaria de regulamentação.** Fontes: https://planalto.gov.br/ccivil_03/_Ato2023-2026/2023/Lei/L14758.htm e (secundária) https://futurodasaude.com.br/?p=33169

## 2. Razão de mamografias de rastreamento (50–69 anos)

**INCA, Ficha técnica de indicadores das ações de controle do câncer de mama (2014):**
- Indicador 1.2, *Razão de exames de mamografia de rastreamento realizados em mulheres de 50 a 69 anos e população da mesma faixa etária*. Denominador: metade da população feminina de 50–69 anos. **"Parâmetro: 1"**. "A razão igual a 1 indica que a oferta de exames é suficiente para atender a população alvo. É utilizado como proxy da cobertura."
- Indicador 1.1, *Cobertura da mamografia de rastreamento* (mulheres, não exames, nos últimos 2 anos): **"Parâmetro: 70% da população-alvo (OMS)"**. Não é o indicador do MVP.

Fonte: https://web.archive.org/web/2023/https://www.inca.gov.br/sites/ufu.sti.inca.local/files/media/document/ficha-tecnica-indicadores-mama-2014.pdf (o link original do INCA dá 404).

**Outros documentos conferidos:**

| Documento | O que diz | Serve? |
|---|---|---|
| **Resolução CIT nº 8/2016** (SISPACTO 2017–2021) | Inclui a razão de mamografias de rastreamento em 50–69 anos no rol de pactuação, mas **cada município, região e UF pactua a sua própria meta** todo ano (art. 6º) | Não há um valor nacional. A pactuação 2017–2021 terminou. Fonte: https://bvsms.saude.gov.br/bvs/saudelegis/cit/2016/res0008_24_11_2016.html |
| **Plano de DCNT 2011–2022** (balanço no Plano de Dant, cap. 2) | Meta: "Aumentar a cobertura de mamografia em mulheres de 50-69 anos nos últimos dois anos para 70%" | Medida por **inquérito** (Vigitel e PNS, inclui o setor privado), não pelo SISCAN. O plano novo (2021–2030) **não renovou** essa meta. Fonte: Plano de Dant, cap. 2.1 |
| **Nota Metodológica C7** (financiamento da APS, Portaria GM/MS 3.493/2024; versão assinada em jun/2026) | Uma das boas práticas é a mamografia em mulheres de 50–69 anos nos últimos 24 meses. O indicador sintético é classificado em Ótimo (> 75), Bom (> 50 a 75), Suficiente (> 25 a 50) e Regular (≤ 25) | É um indicador composto por equipe de APS, não a razão do MVP. Fonte: https://www.gov.br/saude/pt-br/composicao/saps/publicacoes/fichas-tecnicas/equipe-de-atencao-primaria-e-saude-da-familia/nota-metodologica-c7-cuidado-da-mulher-na-prevencao-do-cancer |

**Atenção, faixa etária nova:** a **NT Conjunta nº 360/2026-DGCI/DESF/DEPROS/SAPS/MS** (Outubro Rosa 2026) diz que a **NT nº 626/2025-CGCAN/DECAN/SAES/MS** passou a orientar o rastreamento mamográfico populacional para mulheres de **50 a 74 anos**, a cada dois anos. A NT 360 diz também que a faixa do indicador C7 (50–69) "não deve limitar o acesso" para mulheres de 70–74. Fonte: https://www.gov.br/saude/pt-br/centrais-de-conteudo/publicacoes/notas-tecnicas/2026/nota-tecnica-conjunta-no-360-2026-dgci-desf-depros-saps-ms.pdf. **Não li a NT 626/2025 em si.** Não há ainda ficha técnica do INCA com parâmetro para 50–74. Para o MVP, manter 50–69 e a razão 1 (é o que está nas fichas e na série histórica) e dizer isso numa nota de método.

## 3. Razão de citopatológicos (25–64 anos)

**INCA, Ficha técnica de indicadores das ações de controle do câncer do colo do útero (2014):**
- Indicador 1.2, *Razão de exames citopatológicos do colo do útero em mulheres de 25 a 64 anos e a população feminina da mesma faixa etária*. Denominador: mulheres de 25–64 anos ÷ 3. **"Parâmetro para análise: 1"**. "Expressa a realização de um exame a cada três anos, segundo as Diretrizes Nacionais."
- Indicador 1.1, *Cobertura* (mulheres com exame nos últimos 3 anos): **"Parâmetro para análise: 80%"**. Indicador 1.5, periodicidade trienal: 85%.

Fonte: https://web.archive.org/web/2023/https://www.inca.gov.br/sites/ufu.sti.inca.local/files/media/document/fichatecnicaindicadorescolo14.pdf

**Outros documentos conferidos:**

| Documento | O que diz | Serve? |
|---|---|---|
| **Resolução CIT nº 8/2016** (SISPACTO) | Razão de citopatológicos em 25–64 anos no rol; meta pactuada por cada ente | Não há valor nacional. Mesma fonte acima |
| **Previne Brasil** (Portaria GM/MS 102/2022 e NT nº 4/2022-SAPS/MS) | Indicador "Proporção de mulheres com coleta de citopatológico na APS" (25–64 anos, últimos 36 meses). **Parâmetro 80%**, mas "a meta atualmente pactuada para este indicador é de **40%**" | Outro indicador: mulheres cadastradas na APS, com dado do SISAB, não a razão do SISCAN/SIA. O Previne foi substituído pela Portaria 3.493/2024. Fontes: https://bvsms.saude.gov.br/bvs/saudelegis/gm/2022/prt0102_21_01_2022.html e a NT 4/2022 (cópia do SEI na SES-MG): https://www.saude.mg.gov.br/wp-content/uploads/2025/01/nota_tecnica_4_2022.pdf |
| **Plano de DCNT 2011–2022** | Meta: "Aumentar a cobertura de Papanicolau em mulheres de 25-64 anos nos últimos três anos para 85%" | Medida por inquérito. **Não renovada** no plano 2021–2030 |
| **Nota Metodológica C7** (APS, 2024–2026) | Boa prática: citopatológico em 25–64 anos nos últimos 36 meses, **ou teste molecular de DNA-HPV nos últimos 60 meses** (contado a partir de jan/2026) | Indicador composto de APS |

**Atenção, troca de método:** o teste de **DNA-HPV** está entrando no SUS. Segundo o MS (notícia de 28/10/2026), ele já está em 26 estados e, com resultado negativo, o próximo exame é **em 5 anos**. O Papanicolau continua existindo durante a transição. Fonte: https://www.gov.br/saude/pt-br/assuntos/noticias/2026/outubro/teste-para-deteccao-precoce-do-cancer-do-colo-do-utero-ja-esta-disponivel-em-26-estados-do-pais. **Consequência para o mapa:** onde o DNA-HPV for implantado, a razão de citopatológicos vai **cair por um bom motivo** (menos exames, intervalo maior). O parâmetro 1 do INCA deixa de valer nesses lugares, e a Tendência "piorando" seria enganosa. Isso precisa de um ticket ou de uma ressalva no cartão.

## 4. Cobertura da vacina HPV (9–14 anos)

**Meta atual: 90%.**
- **Plano de Dant 2021–2030** (MS, 2021), seção 6.2, metas de fatores de risco: "atingir 90% de cobertura vacinal contra o HPV", no Brasil, até 2030. O plano não detalha sexo nem idade na meta. Na tabela de ações (câncer, prevenção), fala em "aumentar a cobertura vacinal de HPV em meninas com idade de 9 a 14 anos e para meninos com idade de 11 a 14 anos", que era a faixa dos meninos em 2021. Fonte: https://www.gov.br/saude/pt-br/centrais-de-conteudo/publicacoes/svsa/doencas-cronicas-nao-transmissiveis-dcnt/09-plano-de-dant-2022_2030.pdf (páginas impressas 71 e 102).
- **Notícia do MS de 11/12/2024:** "O objetivo do ministério é chegar a 90% do público-alvo, composto por meninas e meninos de 9 a 14 anos." Fonte: https://www.gov.br/saude/pt-br/assuntos/noticias/2024/dezembro/brasil-esta-perto-de-alcancar-meta-de-vacinacao-contra-o-virus-do-hpv
- **Notícia do MS de 18/11/2025:** o ministro reafirma que "a nossa meta é vacinar 90% das meninas" e cita a meta global da OMS para 2030. Cobertura na época: mais de 82% das meninas e cerca de 67% dos meninos de 9–14 anos. Fonte: https://www.gov.br/saude/pt-br/assuntos/noticias/2025/novembro/ministro-da-saude-reafirma-meta-do-brasil-de-vacinar-90-das-meninas-contra-o-hpv-durante-seminario-da-opas
- **OMS, Estratégia Global de Eliminação do Câncer do Colo do Útero** (Assembleia Mundial da Saúde, agosto de 2020): "90% of girls fully vaccinated with the HPV vaccine by the age of 15", 70% rastreadas com teste de alto desempenho aos 35 e 45 anos, 90% tratadas, até 2030. Fonte: https://www.who.int/initiatives/cervical-cancer-elimination-initiative. A **NT 41/2024** diz que o Brasil é signatário dessa estratégia.

**Meta antiga: 80%.** A **Nota Informativa nº 62-SEI/2017-CGPNI/DEVIT/SVS/MS** fala da "meta preconizada de 80%" para meninas de 9–14 e meninos de 11–14 anos, desde 2014 (esquema de 2 doses). Fonte (cópia do documento SEI hospedada pelo Cofen): https://cofen.gov.br/wp-content/uploads/2017/09/NOTA-INFORMATIVA-Nº-62.pdf. Ela foi superada pelo Plano de Dant (2021).

**Por esquema:**
- **Até março de 2024:** 2 doses. O PNI media a cobertura da D1 e da D2 separadamente. A meta era 80% (NI 62/2017).
- **Desde abril de 2024:** **dose única** para 9–14 anos, meninas e meninos (**NT nº 41/2024-CGICI/DPNI/SVSA/MS**, assinada em 28/03/2024, publicada em 02/04/2024). Fonte: https://www.gov.br/saude/pt-br/centrais-de-conteudo/publicacoes/notas-tecnicas/2024/nota-tecnica-no-41-2024-cgici-dpni-svsa-ms/view
- A **NT nº 16/2025-DPNI** refez a série inteira desde 2014 contando **ao menos uma dose** (D1 até 2019, qualquer dose identificada na RNDS desde 2020). Na série oficial atual, "vacinado" já é "pelo menos uma dose" em todos os anos. Fonte: https://infoms.saude.gov.br/content/Default/SEI_0045605478_Nota_Tecnica_16.pdf. A NT 16 **não fala em meta**. A NT 90/2025-DPNI (regras gerais de cobertura) também não fala.
- A meta de 90% (2021) e a dose única (2024) se somam: para o MVP, **90% de pessoas com ao menos uma dose**.

**Por sexo:** não há documento normativo com uma meta diferente para meninos. A notícia de 2024 aplica os 90% a meninas e meninos. A de 2025 e a OMS falam só em meninas. **Recomendação:** usar 90% para o total e para cada sexo, e dizer no cartão que a meta da OMS é para meninas.

**Ressalva:** os números de cobertura nas notícias (82%/67% em 2025; 87%/74% em 2025 na notícia de out/2026) variam por recorte e data. Não usar essas notícias para validar o pipeline: usar o painel oficial.

## 5. % de fumantes adultos

**Plano de Dant 2021–2030**, seção 6.2: "reduzir a prevalência de tabagismo em 40%", no Brasil, até 2030.
- A linha de base é o **Vigitel 2019**: "deverá ser considerada como linha de base as prevalências provenientes do Vigitel 2019", e o monitoramento usa as edições futuras do Vigitel (e da PNS quando houver).
- A Figura 61 mostra a série de adultos (18+) **no conjunto das capitais e do DF**: 15,7% (2006), 9,8% (2019), com a **meta de 5,9% em 2030** (9,8 × 0,6 = 5,88). Os valores foram lidos no gráfico.
- Fonte: https://www.gov.br/saude/pt-br/centrais-de-conteudo/publicacoes/svsa/doencas-cronicas-nao-transmissiveis-dcnt/09-plano-de-dant-2022_2030.pdf (páginas impressas 71–75).
- O plano anterior (2011–2022) tinha a meta de reduzir 30%, atingida em 2019 (balanço no mesmo PDF).

**ODS:** a meta 3.a (Brasil) é "Fortalecer a implementação da Convenção-Quadro para o Controle do Tabaco no Brasil", com o indicador 3.a.1 (fumantes de 15 anos ou mais). **Não tem valor numérico.** Fonte: https://www.ipea.gov.br/ods/ods3.html

**Como usar no mapa (a decidir):** o MVP mostra a capital do estado. A meta é para o conjunto das capitais. Opções:
1. Referência = **5,9%** (meta nacional para 2030), igual para todas as capitais. É simples e é o número oficial.
2. Referência = o valor da própria capital em 2019 × 0,6. Fica proporcional, mas o número não está publicado em lugar nenhum.

Recomendo a opção 1, com o texto "meta do Brasil para 2030", porque é o que o documento diz.

## 6. Tendência da mortalidade por câncer

**Plano de Dant 2021–2030**, seção 6.1: são cinco metas para as DCNT, todas para a **mortalidade prematura (30 a 69 anos)**, com **linha de base em 2015** e prazo em 2030:

| Meta | CID-10 | 2015 → meta 2030 (lido no gráfico) |
|---|---|---|
| Reduzir em 1/3 a taxa padronizada de mortalidade prematura por DCNT | C00–C97, E10–E14, I00–I99, J30–J98 (exceto J36) | redução de 1/3 (o gráfico mostra a meta em ~192 por 100 mil; o valor de 2015 não ficou claro na leitura) |
| Reduzir em 1/3 a probabilidade incondicional de morte prematura por DCNT | idem | — |
| Reduzir em **10%** a mortalidade prematura por câncer de **mama** | C50 | 20,3 → **18,3** por 100 mil |
| Reduzir em **20%** a mortalidade prematura por câncer do **colo do útero** | C53 | 8,4 → **6,7** por 100 mil |
| Reduzir em **10%** a mortalidade prematura por câncer do **aparelho digestivo** | C15–C25, C26.0, C26.8, C26.9, C45.1, C48, C77.2, C78.4–C78.8 | 37,5 → **33,7** por 100 mil |

- As taxas são **padronizadas pela população do Brasil do Censo 2010** (método direto), não pela população mundial. Fonte: notas das Figuras 51–55 do Plano de Dant.
- **ODS 3.4 (ONU e Brasil):** "Até 2030, reduzir em um terço a mortalidade prematura por doenças não transmissíveis via prevenção e tratamento". O indicador 3.4.1 soma doenças do aparelho circulatório, tumores malignos, diabetes e doenças respiratórias crônicas. Fonte: https://www.ipea.gov.br/ods/ods3.html

**Por que nenhuma serve como Referência do MVP:**
- O indicador do MVP é a taxa padronizada **em todas as idades**, com a **população mundial**, para "Todos os cânceres" e 5 tipos. As metas são para **30–69 anos**, com a **população brasileira de 2010**.
- Não há meta para **todos os cânceres** sozinhos (a de DCNT mistura câncer com doenças cardíacas, diabetes e respiratórias), nem para **próstata**, **pulmão** ou **colorretal** (o colorretal está dentro de "aparelho digestivo", junto com estômago, fígado, pâncreas e esôfago).
- As metas são **nacionais**. Não há meta por município.

**Recomendação:** para a mortalidade, a **Referência é o valor do Brasil** (como o glossário já prevê quando não há meta). O Plano de Dant pode aparecer como texto de contexto em mama e colo do útero ("o Brasil tem a meta de reduzir em 10% / 20% as mortes de 30 a 69 anos até 2030"), sem virar número de comparação.

---

## Ressalvas e pontos incertos

1. **Valores lidos em gráficos.** As metas numéricas do Plano de Dant (5,9% de fumantes; 18,3 e 6,7 por 100 mil) vêm dos rótulos das figuras, não de uma tabela. Os percentuais (40%, 10%, 20%, 1/3) estão no texto e são certos. O valor de 2015 da mortalidade prematura por DCNT não ficou claro.
2. **HPV para meninos.** A única fonte que aplica os 90% aos meninos é uma notícia do MS (dez/2024). O Plano de Dant não diz o sexo na meta, e a OMS fala só em meninas.
3. **Fichas do INCA de 2014.** São as fichas técnicas mais recentes que encontrei com o parâmetro da razão. O link original do INCA está fora do ar (lido pelo Internet Archive). O INCA, em publicações recentes, passou a preferir a **cobertura** de mulheres (parâmetro 70% para mama e 80% para colo), que o MVP não calcula por município.
4. **Mamografia 50–74 anos (NT 626/2025)** e **DNA-HPV no colo do útero** mudam as faixas e os intervalos do rastreamento. Não li a NT 626/2025. Os dois pontos merecem decisão antes do lançamento.
5. **Regulamentação da Lei 14.758/2023 (PNPCC):** não verifiquei se a portaria de 2025 cria metas nacionais numéricas.
6. **A meta de 100% (60 dias)** é um direito, não uma meta de gestão. O cartão deve deixar isso claro ("a lei garante a todos"), e o número do município quase sempre vai ficar abaixo.
