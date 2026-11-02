# Métodos para classificar a Tendência e lidar com municípios pequenos

Pesquisa do ticket `issues/11-metodos-tendencia-e-pequenos-numeros.md`. Data da verificação: **2026-11-02**.
Método: documentação oficial do NCI (Joinpoint, Cancer Trends Progress Report, State Cancer Profiles), do CDC (U.S. Cancer Statistics, CDC WONDER, Atlas de Doença Cardíaca e AVC), do NCHS, do Fingertips (saúde pública da Inglaterra), artigos revisados por pares (Epidemiologia e Serviços de Saúde, Ciência & Saúde Coletiva, International Journal of Health Geographics, Statistics in Medicine) e documentos do Ministério da Saúde e do INCA. As contas de "quantos casos são precisos" na seção 1.5 são **nossas**, feitas com fórmulas padrão (Poisson e binomial), e estão marcadas como tal.

Este documento lista opções. A escolha da regra fica para o ticket 12 ([Como classificar a Tendência e tratar municípios pequenos no mapa?](../issues/12-tendencia-e-municipios-pequenos.md)).

## Resumo

- **Para classificar a Tendência**, as fontes de referência usam quase sempre o mesmo princípio: estimar a variação anual (APC ou AAPC) com intervalo de confiança e chamar de "subindo" ou "caindo" só quando o intervalo não inclui zero. Mudam o modelo (log-linear, Joinpoint, Prais-Winsten, logística) e o nível de exigência (95% no NCI, 99,8% no Fingertips).
- **O NCI tem uma categoria que serve para o nosso caso:** separa "estável" (variação pequena e não significativa) de "mudança não significativa" (variação grande, mas incerta). Num município pequeno, quase tudo cai na segunda, e chamar isso de "estável" seria enganoso.
- **Com 10 a 11 anos de série, cabe no máximo 1 ponto de inflexão** no Joinpoint. O Joinpoint oficial só roda no Windows. Em Python, um modelo log-linear (ou logístico para %) sobre uma janela fixa reproduz o essencial.
- **Para municípios pequenos**, as fontes combinam três coisas: limiar mínimo de casos (16 no CDC e no NCI, 20 no CDC WONDER e NCHS), agregação de anos (3 a 5 anos) ou de área, e suavização bayesiana (empírica ou espacial completa). Tudo pode ser pré-calculado offline em Python.
- **Pelas nossas contas**, com 20 óbitos por ano, a margem de erro da variação anual em 10 anos fica em ±5% ao ano. Como a mortalidade por câncer costuma variar 1–2% ao ano, **a maioria dos municípios não terá tendência própria detectável**. A tendência municipal só se sustenta com agregação ou suavização.
- **Para não induzir ranking**, os exemplos mais alinhados ao projeto (Fingertips, Atlas Australiano do Câncer) comparam cada área com uma referência fixa, mostram a incerteza e não usam quantis. O próprio Atlas do CDC usa quintis, que é o que o projeto quer evitar.

---

## 1. Como classificar a direção de uma série curta

### 1.1 Variação percentual anual (APC) por regressão log-linear

**O que é.** Ajusta-se `log(taxa) = a + b·ano`. A APC é `100·(e^b − 1)`. Se o intervalo de confiança de 95% da APC não inclui zero, a série está subindo ou caindo; se inclui, não há evidência de mudança. É a base do Joinpoint e de quase todos os outros métodos desta lista.

**Como o NCI rotula.** O Cancer Trends Progress Report usa quatro rótulos ([metodologia](https://progressreport.cancer.gov/methodology)):

| Rótulo | Regra |
|---|---|
| **Subindo** (RISING) | APC significativa e maior que zero |
| **Caindo** (FALLING) | APC significativa e menor que zero |
| **Estável** (STABLE) | APC entre −0,5% e +0,5% ao ano e não significativa |
| **Mudança não significativa** | APC maior que 0,5% (para cima ou para baixo), mas não significativa |

O próprio relatório chama os cortes de "um tanto arbitrários", mas consistentes entre medidas. A distinção entre "estável" e "mudança não significativa" é o ponto mais útil para o projeto: ela impede que a falta de dado vire falsa estabilidade.

O **State Cancer Profiles** (NCI/CDC) mostra, por condado, se a tendência está subindo, caindo ou estável, usando a **AAPC de 5 anos** calculada pelo Joinpoint ([5-Year Rate Changes](https://www.statecancerprofiles.cancer.gov/help/about/5yr_rate_changes.html), [Rate/Trend Comparison](https://statecancerprofiles.cancer.gov/help/about/rate_trend_comp.html)).

- **Exige:** taxa (ou contagem + população) por ano. Não funciona com ano de contagem zero na versão log-linear simples. Nesse caso, usa-se a versão de Poisson (1.3).
- **Python:** `numpy`/`statsmodels` (`OLS` ou `WLS` sobre o log, com pesos pela variância).
- **Exemplo público:** NCI Cancer Trends Progress Report; State Cancer Profiles.

### 1.2 Joinpoint (regressão segmentada do NCI)

**O que é.** Procura os anos em que a inclinação muda e calcula a APC de cada trecho, além da **AAPC**, que é a média ponderada das APCs num intervalo fixo (por exemplo, os últimos 5 anos). A AAPC permite comparar áreas com trechos de tamanhos diferentes ([Progress Report](https://progressreport.cancer.gov/methodology)).

**O que exige do dado.** A documentação do NCI recomenda um número máximo de pontos de inflexão conforme o número de anos ([Number of Joinpoints](https://surveillance.cancer.gov/help/joinpoint/setting-parameters/method-and-parameters-tab/number-of-joinpoints)):

| Anos na série | Máximo de pontos de inflexão |
|---|---|
| 0–6 | 0 |
| 7–11 | 1 |
| 12–16 | 2 |
| 17–21 | 3 |

"São precisos pelo menos sete pontos para considerar um ponto de inflexão." Por padrão, precisa haver pelo menos 2 anos entre o ponto de inflexão e a ponta da série ([NCHS, Irimata et al. 2022, Vital Health Stat 2(194)](https://stacks.cdc.gov/view/cdc/133679)). Na prática, **um ponto de inflexão nos últimos 2 anos nunca é detectado**. O NCHS mostra um caso assim, em que a queda de 2016–2017 não foi captada, e recomenda que, para dados de mortalidade, se use o modelo de erros não correlacionados.

Para a nossa série SIM 2014–2024 (11 anos): cabe **no máximo 1** ponto de inflexão. Para o SI-PNI novo (2020 em diante, ~6 anos): **nenhum**, então a regressão é uma reta só.

- **Python:** o Joinpoint oficial **só roda no Windows**. A versão de linha de comando (para lote) exige um acordo de transferência assinado com o NCI ([pedido da versão callable](https://surveillance.cancer.gov/joinpoint/callable/index.html)). O pacote R `nih.joinpoint` só chama esse executável. Em Python, a alternativa é a regressão segmentada pelo método de Muggeo, do pacote `piecewise-regression` ([Pilgrim 2021, JOSS](https://joss.theoj.org/papers/10.21105/joss.03859)), que escolhe o número de pontos pelo BIC, ou uma busca em grade feita à mão com `statsmodels`. Nenhuma das duas é o Joinpoint (ele usa teste de permutação), então os resultados podem diferir.
- **Exemplo público:** SEER, State Cancer Profiles, Cancer Trends Progress Report, Health, United States (NCHS).
- **Leitura para o projeto:** com 1 ponto de inflexão possível e o risco de não ver mudanças nas pontas, o Joinpoint rende pouco a mais do que uma **APC numa janela fixa** (por exemplo, os últimos 5 a 8 anos consolidados). E custa bem mais, porque não roda em Linux.

### 1.3 Regressão de Poisson (ou binomial negativa) com offset de população

**O que é.** Ajusta-se `óbitos ~ ano + offset(log população)`, com os grupos de idade como covariável ou com a padronização feita antes. A APC sai do coeficiente do ano. A diferença para 1.1 é que **aceita anos com zero óbitos** e pondera cada ano pelo seu número de eventos. Se a variação entre anos for maior do que a de Poisson (sobredispersão), usa-se a binomial negativa ou a quase-Poisson.

- **Exige:** contagens e população por ano (e por faixa etária, se a padronização for no modelo).
- **Python:** `statsmodels` (`GLM` com `families.Poisson` ou `NegativeBinomial`, e `offset`).
- **Exemplo público:** é o modelo de variância "Poisson" que o próprio Joinpoint oferece ([NCHS 2022](https://stacks.cdc.gov/view/cdc/133679)). O Atlas Australiano do Câncer modela as contagens como Poisson com offset de casos esperados (ver 2.4).

### 1.4 Prais-Winsten (o padrão nos artigos brasileiros)

**O que é.** É uma regressão linear do log da taxa contra o ano, corrigida para a autocorrelação entre anos seguidos. A APC sai da inclinação, e a série é classificada como **crescente** (APC positiva), **decrescente** (negativa) ou **estacionária** ("se não houver diferença significante entre seu valor e zero"). É o método ensinado por Antunes e Cardoso, no tutorial da revista do Ministério da Saúde ([Epidemiol. Serv. Saúde 2015;24(3):565-576](https://www.scielo.br/j/ress/a/zzG7bfRbP7xSmqgWX7FfGZL/?lang=pt)). É o mais usado em estudos de tendência de mortalidade no Brasil, e um artigo da RBE mostra que ignorar a autocorrelação distorce as tendências ([RBE 2018;21:e180020](https://scielosp.org/article/rbepid/2018.v21/e180020/en)).

- **Exige:** a mesma coisa que 1.1 (não aceita zero no log). Com 10 anos, a autocorrelação é mal estimada. O NCHS, por sua vez, considera que a mortalidade tem pouca ou nenhuma correlação entre anos e recomenda erros não correlacionados ([NCHS 2022](https://stacks.cdc.gov/view/cdc/133679)).
- **Python:** o `statsmodels` tem o `GLSAR` com `iterative_fit`, que é um GLS iterativo com erro AR. A documentação o marca como experimental e não diz se ele trata a primeira observação como no Prais-Winsten. O Prais-Winsten exato tem cerca de 20 linhas com `numpy` (transformar a série com o ρ estimado, mantendo o 1º ponto com o fator `√(1−ρ²)`).
- **Exemplo público:** centenas de artigos brasileiros sobre tendência de mortalidade, a maioria em nível de UF ou capital. Não achamos um painel público que aplique o método município a município.
- **Vantagem para o projeto:** o vocabulário "crescente, decrescente, estacionária" já é familiar a gestores e jornalistas de saúde no Brasil.

### 1.5 Tendência de proporções (% em até 60 dias, cobertura)

Para uma porcentagem com numerador e denominador, o modelo natural é a **regressão logística** (binomial) contra o ano. O **Fingertips** (dados de saúde pública da Inglaterra) usa exatamente isso ([Trend markers](https://fingertips.phe.org.uk/static-reports/public-health-technical-guidance/Presentation/Trend_markers.html)):

- **Proporções:** regressão logística sobre os **5 valores mais recentes**, com teste qui-quadrado.
- **Taxas padronizadas e outros:** regressão linear ponderada, com o erro-padrão tirado dos intervalos de confiança publicados.
- **Exigência alta:** é significativo só com p < 0,2% (nível de 99,8%).
- **Teste de robustez:** se a tendência é significativa, a inclinação é recalculada 5 vezes, tirando um ponto de cada vez. A seta só aparece se a direção não mudar em nenhuma das 6 contas. Caso contrário, aparece o marcador "sem mudança significativa".
- **Requisitos:** dado anual, pelo menos 5 pontos, sem quebra na série e **sem períodos sobrepostos** (médias móveis não servem).
- **Rótulos:** "Aumentando", "Diminuindo", "Sem mudança significativa". A cor da seta depende de o indicador ser "maior é melhor" ou "menor é melhor", e fica azul quando não há polaridade clara.

Isso conversa com o glossário: "melhorando depende do indicador" é a polaridade do Fingertips.

- **Python:** `statsmodels` (`GLM` binomial com `[sucessos, fracassos]`, ou `Logit`). Intervalos de cada ano: `statsmodels.stats.proportion.proportion_confint(method="wilson")`.
- **Exemplo público:** Fingertips (todos os perfis de saúde pública locais da Inglaterra).

### Quanto dado é preciso para ver uma tendência (conta nossa)

Supondo 10 anos com o mesmo número de eventos por ano e um modelo de Poisson (ou binomial com p ≈ 50%), a meia-largura do intervalo de 95% da variação anual fica em:

| Óbitos por ano | Erro relativo da taxa de 1 ano | Margem da APC em 10 anos |
|---|---|---|
| 5 | 45% | ±10% ao ano |
| 10 | 32% | ±7% ao ano |
| 20 | 22% | ±5% ao ano |
| 100 | 10% | ±2,2% ao ano |
| 500 | 4,5% | ±1,0% ao ano |
| 2.000 | 2,2% | ±0,5% ao ano |

| Casos tratados por ano (até 60 dias) | Intervalo de 1 ano para p = 50% (Wilson) | Margem da variação em 10 anos |
|---|---|---|
| 10 | 24%–76% | ±3,4 p.p. ao ano |
| 20 | 30%–70% | ±2,4 p.p. ao ano |
| 100 | 40%–60% | ±1,1 p.p. ao ano |
| 400 | — | ±0,5 p.p. ao ano |

Leitura: a mortalidade por câncer costuma mudar de 1% a 2% ao ano. Para detectar isso, um município precisa de **centenas de óbitos por ano** do tipo de câncer, o que só as capitais e os municípios grandes têm em "Todos os cânceres". Já a "% em até 60 dias" pode mudar vários pontos percentuais por ano (a política é recente), então ela é detectável em mais municípios. Ainda assim, a ressalva de 09 continua: em colo do útero, só 4–42% dos municípios somam 20 casos **em 5 anos**.

---

## 2. Como lidar com municípios de poucos casos

### 2.1 Supressão abaixo de um limiar

| Fonte | Regra | Motivo declarado |
|---|---|---|
| CDC U.S. Cancer Statistics (e State Cancer Profiles) | Taxa e contagem **não aparecem com menos de 16 casos ou óbitos** | Com menos de 16, o erro-padrão é ~25% da taxa ou mais, e o IC de 95% fica tão largo quanto a própria taxa. "Uma taxa suprimida não significa que a taxa era baixa." ([CDC](https://www.cdc.gov/united-states-cancer-statistics/technical-notes/suppression.html)) |
| CDC WONDER (mortalidade) | Taxa marcada **"não confiável" com menos de 20 óbitos**. Contagens de 1 a 9 suprimidas | Erro relativo `100·√(1/D)` ([CDC WONDER](https://wonder.cdc.gov/wonder/help/ucd.html)) |
| CDC Atlas de Doença Cardíaca e AVC | Sem suavização: ≥ 20 eventos e ≥ 100 pessoas-ano em **3 anos** | Ver 2.3 ([Statistical Methods](https://www.cdc.gov/heart-disease-stroke-atlas/statistical-methods/)) |

- **Exige:** só a contagem. É trivial.
- **Python:** `pandas` (`where`/`mask`).
- **Problema para o projeto:** num mapa pintado por Tendência, suprimir deixa **a maior parte do Brasil em cinza** (ver os números de 09). É honesto, mas apaga o interior, que é justamente o público do "meu município".

### 2.2 Agregação: anos somados ou área maior

**Anos somados.** É a saída mais comum. O Atlas do CDC usa 3 anos. O Atlas Australiano usa 5 anos (2010–2014) para os cinco cânceres mais comuns e 10 anos para os demais ([Duncan et al. 2019, Int J Health Geogr](https://pmc.ncbi.nlm.nih.gov/articles/PMC6771109/)). Para **tendência**, porém, somar anos tem um custo: com períodos sem sobreposição (por exemplo, 2014–16, 2017–19, 2020–22), uma série de 11 anos vira 3 ou 4 pontos. Médias móveis de 3 anos mantêm mais pontos, mas **não podem entrar num teste de tendência**, porque os pontos ficam correlacionados (o Fingertips exclui períodos sobrepostos de propósito). A alternativa limpa é ajustar o modelo de Poisson ou logístico **nos dados anuais** e usar a soma de anos só para mostrar a "Situação".

**Área maior.** As opções de agrupamento oficiais no Brasil:

| Recorte | Quantidade | Fonte |
|---|---|---|
| Região Geográfica Imediata (IBGE 2017) | 510 | [IBGE, Divisão Regional do Brasil](https://www.ibge.gov.br/geociencias/cartas-e-mapas/redes-geograficas/15778-divisoes-regionais-do-brasil.html?lang=pt-BR); o código `CD_RGI` já vem na malha municipal (ver pesquisa 03) |
| Região Geográfica Intermediária (IBGE 2017) | 133 | Idem |
| Região de Saúde (SUS, pactuada nas CIB/CIR) | não verificado nesta pesquisa | Mapa/Painel da Regionalização do Ministério da Saúde |
| Macrorregião de Saúde | 120 | [Fiocruz/PROADESS, NT 6, set. 2025](https://proadess.fiocruz.br/NT6_Macrorregioes%20Proadess_setembro2025.pdf) |

A Região de Saúde tem a vantagem de ser a unidade em que o SUS organiza a referência para tratamento oncológico, o que combina com o Acesso ao tratamento. A Região Imediata tem a vantagem de já vir pronta na malha do IBGE. As duas são estáveis o bastante para uma série de 10 anos? Para o IBGE, sim (divisão de 2017 ainda vigente na malha de 2025). Para as Regiões de Saúde, as CIB revisam a composição (por exemplo, o ES em 2024), e isso não foi medido aqui.

Uma variante é a **agregação adaptativa**: só o município abaixo do limiar herda a tendência da região, e o município grande mantém a própria. É o que a ficha do protótipo de 06 já sugere ("município pequeno (agregado)").

- **Python:** `pandas` (`groupby` por região e ano, depois o mesmo modelo de 1.3 ou 1.5).
- **Exemplo público:** CDC Atlas (critério "20 eventos no condado **e vizinhos**"); Atlas Australiano (períodos de 5 e 10 anos).

### 2.3 Suavização bayesiana empírica (global ou local)

**O que é.** Puxa a taxa de cada município para uma média, com peso maior quanto menor a população. Na versão **global**, a média é a do país ou da UF. Na **local** (ou espacial), é a dos vizinhos. Município grande quase não muda, e município pequeno passa a se parecer com o entorno.

- **Exige:** contagem e população por município, e uma matriz de vizinhança (para a versão local). Funciona com qualquer número de casos, inclusive zero. **Não dá intervalo de confiança direto** para o valor suavizado, então não serve sozinha para classificar a tendência com incerteza.
- **Python:** `esda.smoothing` (PySAL) tem `Empirical_Bayes`, `Spatial_Empirical_Bayes`, `Spatial_Rate`, `Age_Adjusted_Smoother` e funções de padronização direta e indireta ([código-fonte](https://raw.githubusercontent.com/pysal/esda/main/esda/smoothing.py)). A vizinhança vem de `libpysal.weights.Queen.from_dataframe` sobre a malha do IBGE.
- **Exemplo público:**
  - O **Atlas de Doença Cardíaca e AVC do CDC** suaviza as taxas por condado com **bayesiano empírico local**, desde que o condado tenha ≥ 20 eventos somando os vizinhos, ou ≥ 16 eventos próprios, ou ≥ 5.000 pessoas-ano, em 3 anos ([CDC](https://www.cdc.gov/heart-disease-stroke-atlas/statistical-methods/)). Esse atlas, porém, pinta por **quintis**, ou seja, por posição.
  - No Brasil: mortalidade por câncer de boca e orofaringe nos municípios de Minas Gerais com estimador bayesiano empírico global e local ([Ciênc. Saúde Coletiva 2018;23(1):153-160](https://scielosp.org/article/csc/2018.v23n1/153-160)) e mortalidade prematura por doenças crônicas, incluindo neoplasias, em todos os municípios do Brasil com bayesiano empírico local ([RBE 2021;24 supl. 1:e210003](https://scielosp.org/pdf/rbepid/2021.v24suppl1/e210003/pt)).

### 2.4 Modelos bayesianos espaciais e espaço-temporais completos (BYM, Leroux, BYM2)

**O que é.** É um modelo de Poisson (ou binomial) com efeitos aleatórios de área, que "toma emprestada" informação dos vizinhos, e opcionalmente do tempo. Dá estimativa e **intervalo de credibilidade** por área e por ano, e a tendência sai do próprio modelo.

- **Exemplo público principal:** o **Atlas Australiano do Câncer** ([Duncan et al. 2019](https://pmc.ncbi.nlm.nih.gov/articles/PMC6771109/)). Usa 2.148 áreas pequenas, prior de Leroux, contagens Poisson com offset de casos esperados pelas taxas nacionais por idade (binomial para o rastreamento de mama), estimação por MCMC e mediana a posteriori no mapa. O CDC também publica tendências por condado (2000–2019) de mortalidade cardiovascular com um modelo bayesiano espaço-temporal ([data.gov](https://catalog.data.gov/dataset/rates-and-trends-in-heart-disease-and-stroke-mortality-among-us-adults-35-by-county-a-2000-45659)) e distribui o **Rate Stabilizing Tool** (ArcGIS e R) para isso ([CDC RST](https://www.cdc.gov/heart-disease-and-stroke-data/rst)).
- **Exige:** contagens por área, ano e (de preferência) faixa etária; matriz de vizinhança; tempo de computação e alguém que saiba validar o modelo.
- **Python:** `PyMC` ou `NumPyro` (o BYM2 tem exemplos prontos nos dois). Roda offline. Para 5.570 municípios × 11 anos × 6 recortes de tipo, o NumPyro em CPU é viável, mas a convergência precisa ser checada caso a caso. O caminho mais usado na literatura (R-INLA) não é Python.
- **Custo para o projeto:** é o método mais correto e o mais difícil de explicar ao cidadão ("o valor do seu município foi estimado usando os vizinhos"). Também torna o pipeline mais pesado.

---

## 3. Como mostrar no mapa sem induzir a ranking

| Prática | Quem usa | Como funciona |
|---|---|---|
| **Comparar com uma referência fixa, com intervalo de confiança** | Fingertips | A cor diz se o valor local é estatisticamente melhor, parecido ou pior que a Inglaterra, ou que uma meta. Fica branco quando não há IC para comparar ([PHOF, Further information](https://fingertips.phe.org.uk/profile/public-health-outcomes-framework/supporting-information/further-info)). Bate com a Referência do glossário. |
| **Divergir da média nacional e esmaecer o incerto** | Atlas Australiano | Paleta divergente centrada na média nacional (amarelo = média), em escala log. Uma camada clara fica **mais opaca quanto maior a incerteza**, e a área incerta "some" na média. Um "V-plot" mostra a probabilidade a posteriori de estar acima ou abaixo da média. Não há lista ordenada: os resumos são por remoteness, nível socioeconômico e estado ([Duncan et al. 2019](https://pmc.ncbi.nlm.nih.gov/articles/PMC6771109/)). |
| **Gráfico de funil** | NHS (Reino Unido), CIHI (Canadá) | Valor contra precisão, com limites de controle em volta da meta. O CIHI diz que ele **desencoraja ranking inadequado** ([CIHI](https://repertoiredesindicateurs.icis.ca/sites/default/files/document/use-of-funnel-plots-for-reporting-performance-indicator-results-en.pdf), com base em [Spiegelhalter 2005, Stat Med 24:1185](https://doi.org/10.1002/sim.1970)). Serve mais para a ficha ou para jornalistas do que para o mapa. |
| **Cor pela tendência com polaridade** | Fingertips | Seta e cor por "melhorando/piorando" segundo o que é bom para o indicador. Com isso, um município ruim que melhora aparece em verde, e o mapa não é ordenado pelo nível. |
| **Categoria explícita para "dado insuficiente"** | CDC Atlas ("Insufficient Data"), CDC USCS | A área fica fora da escala de cor e aparece com rótulo próprio. |
| **Evitar quantis** | (contraexemplo) CDC Atlas | O CDC pinta por quintis, que são posição pura: 20% dos condados sempre ficam na pior cor, mesmo que todos melhorem. |

Para o projeto, a combinação natural é a que o ticket 06 já desenhou (cor pela Tendência, legenda "não é um ranking", sem quantis), **mais** duas coisas que as fontes acrescentam:

1. **Um quarto estado de cor**, separado de "estável", para "sem dado suficiente para dizer" (o "mudança não significativa" do NCI, ou o branco do Fingertips). Sem ele, a maioria dos municípios pequenos vai aparecer como "estável", o que é falso.
2. **A mesma unidade no mapa e na ficha.** Se a tendência do município pequeno vem da Região, o mapa deve pintar o município com a cor da Região (com hachura ou contorno de "agregado"), e não com a cor do próprio dado. Isso resolve a inconsistência apontada no fim de 06.

---

## 4. As quatro séries: o que cada método exige delas

| Série | Tipo de medida | Anos disponíveis (de 04) | Particularidade que pesa na escolha |
|---|---|---|---|
| **Painel-Oncologia, % em até 60 dias** | Proporção (tratados ≤ 60 d ÷ tratados) | 2014–último, 2 últimos provisórios | Denominador pequeno no interior. A % "sem informação de tratamento" muda com os anos e pode criar tendência artificial (ver 09). |
| **SISCAN, razão de mamografias e de citopatológicos** | Razão exames ÷ população-alvo (a de mamografia divide a população de 50–69 anos por 2, porque o exame é bienal) | 2016–2025 | Mede **oferta**, não cobertura real, e conta exames sem separar indicação ([INCA, ficha técnica 2014](https://www.inca.gov.br/sites/ufu.sti.inca.local/files/media/document/ficha-tecnica-indicadores-mama-2014.pdf); [ficha ES](https://saude.es.gov.br/Media/sesa/Planejamento/ficha_de_qualificacao/Meta%201.4.7.pdf)). Pode passar de 1. O SISPACTO não fixava meta. O numerador costuma ser grande o bastante (centenas de exames em municípios médios). |
| **SI-PNI, cobertura HPV** | Razão doses ÷ população-alvo, em % | 2020–último (~6 anos), com mudança para dose única em 2024 | O próprio Ministério encontrou coberturas atípicas e altas em municípios com menos de 100 nascidos vivos por ano, pela imprecisão do denominador ([MS, denominadores](https://www.gov.br/saude/pt-br/vacinacao/publicacoes/denominadores_calculo_coberturas_vacinais.pdf)). Valores acima de 100% vêm de erro de registro ou de população subestimada ([Fiocruz](https://dssbr.ensp.fiocruz.br/wp-content/uploads/2012/03/Ind030203-20120130.pdf)). A quebra de 2024 corta a série ao meio. |
| **SIM, taxa padronizada de mortalidade** | Taxa por 100 mil padronizada por idade | 2014–2024 sem preliminares (~10–11 anos) | Poucos óbitos por município e por tipo. Requer C55 redistribuído para colo do útero e cuidado com C26 no colorretal (09, 10). O INCA já publica taxas padronizadas por município (populações mundial e Brasil 2000) no Atlas On-line de Mortalidade ([Informativo Vigilância do Câncer n. 5, 2014](https://www.inca.gov.br/sites/ufu.sti.inca.local/files//media/document//informativo-vigilancia-do-cancer-n5-edicao-especial-2014.pdf.pdf)). |

## 5. Recomendação (opções para a decisão no ticket 12)

Nada aqui está decidido. São combinações coerentes com as fontes e com o tom do projeto, para o ticket 12 escolher.

**Regra comum às quatro séries (opção base).** Estimar a variação anual numa **janela fixa** dos anos consolidados (por exemplo, os últimos 5 a 8, sem os provisórios), com o modelo adequado ao tipo de medida, e rotular em quatro estados, à moda do NCI e do Fingertips: **melhorando / estável / piorando / sem dado suficiente**. "Melhorando" segue a polaridade do indicador. Tudo em Python com `statsmodels` + `pandas`, sem Joinpoint. Duas decisões ficam em aberto:
- **Nível de exigência:** 95%, como o NCI, ou mais estrito, como o Fingertips (99,8% + teste de tirar um ponto). O mais estrito reduz os falsos "piorando" num mapa com 5.570 municípios, onde 5% de falsos alarmes seriam ~280 municípios.
- **Corte de "estável":** ±0,5% ao ano, como o NCI, ou um corte próprio por indicador (por exemplo, ±1 p.p. ao ano para porcentagens).

**Por série:**

| Série | Opção A (mais simples) | Opção B (mais robusta) | Opção C (mais sofisticada) |
|---|---|---|---|
| **% até 60 dias (Painel)** | Logística anual por município, sem agregação. Abaixo de um mínimo de casos tratados no período (por exemplo, 20/ano em média), mostrar "sem dado suficiente" | Logística no município quando ele passa do mínimo, e na **Região de Saúde** quando não passa (agregação adaptativa). Faz sentido porque o tratamento é organizado por região | Modelo binomial bayesiano espaço-temporal (NumPyro/PyMC) |
| **Razões SISCAN** | Poisson com offset da população-alvo, por município. Os exames costumam ser numerosos o bastante | Igual à A, com binomial negativa se houver sobredispersão (é provável, porque a oferta depende de mutirões e de equipamentos) | — (não parece necessário) |
| **Cobertura HPV (SI-PNI)** | **Sem tendência estatística**: 4 anos antes da dose única e poucos depois não bastam (Joinpoint exige ≥ 7 pontos para qualquer inflexão, e o Fingertips exige ≥ 5 sem quebra). Mostrar só a Situação contra a meta, mais a série com a marca de 2024 | Logística ou Poisson só a partir de 2024, quando houver ≥ 5 anos. Até lá, "sem dado suficiente" | — |
| **Mortalidade padronizada (SIM)** | Poisson com offset e idade, na **Região Imediata ou de Saúde** para todos os municípios, mais o próprio município só nas capitais e nos grandes (por exemplo, ≥ 100 óbitos/ano no tipo) | Igual à A, com suavização **bayesiana empírica local** (`esda`) para a "Situação" e a tendência do agregado | Modelo **bayesiano espaço-temporal** (BYM2/Leroux) por município, como no Atlas Australiano, com IC por município. É o mais correto e o mais caro de manter e explicar |

**O que pesa a favor de cada caminho:**
- **A** é a mais fácil de explicar ("o número do seu município, quando há casos suficientes") e de reproduzir, mas deixa muito do mapa em "sem dado suficiente".
- **B** mantém o mapa preenchido sem inventar precisão, e a unidade agregada tem sentido no SUS (Região de Saúde). O custo é decidir a fonte da composição das regiões e a forma de mostrar "agregado" no mapa.
- **C** é o padrão-ouro dos atlas de pequenas áreas, mas exige alguém para validar modelos, tem um pipeline lento e é difícil de explicar para o cidadão.

**Pontos para o ticket 12 decidir junto:**
- Se os anos provisórios do Painel ficam **fora** do cálculo da tendência (recomendável pela piora artificial da % sem tratamento vista em 09) e aparecem só tracejados.
- Se a tendência do "até 60 dias" deve ser calculada só onde a % "sem informação de tratamento" é estável no período, já que essa % muda com o tempo e contamina o numerador.
- Qual recorte usar na agregação: Região de Saúde (lógica do SUS, composição revisada pelas CIB) ou Região Imediata do IBGE (estável e já na malha).

---

## Fontes

- NCI Joinpoint, número de pontos de inflexão: https://surveillance.cancer.gov/help/joinpoint/setting-parameters/method-and-parameters-tab/number-of-joinpoints
- NCI Joinpoint, versão de linha de comando (Windows): https://surveillance.cancer.gov/joinpoint/callable/index.html
- NCI Cancer Trends Progress Report, metodologia: https://progressreport.cancer.gov/methodology
- State Cancer Profiles, 5-Year Rate Changes: https://www.statecancerprofiles.cancer.gov/help/about/5yr_rate_changes.html
- State Cancer Profiles, Rate/Trend Comparison: https://statecancerprofiles.cancer.gov/help/about/rate_trend_comp.html
- Irimata KE et al. Guidance for selecting model options in the NCI Joinpoint Regression Software. NCHS Vital Health Stat 2(194), 2022: https://stacks.cdc.gov/view/cdc/133679
- CDC U.S. Cancer Statistics, supressão: https://www.cdc.gov/united-states-cancer-statistics/technical-notes/suppression.html
- CDC WONDER, mortalidade por causa básica: https://wonder.cdc.gov/wonder/help/ucd.html
- CDC Atlas de Doença Cardíaca e AVC, métodos: https://www.cdc.gov/heart-disease-stroke-atlas/statistical-methods/
- CDC Rate Stabilizing Tool: https://www.cdc.gov/heart-disease-and-stroke-data/rst
- Fingertips, marcadores de tendência: https://fingertips.phe.org.uk/static-reports/public-health-technical-guidance/Presentation/Trend_markers.html
- Fingertips, PHOF further information: https://fingertips.phe.org.uk/profile/public-health-outcomes-framework/supporting-information/further-info
- Duncan EW et al. Development of the Australian Cancer Atlas. Int J Health Geogr 2019: https://pmc.ncbi.nlm.nih.gov/articles/PMC6771109/
- Antunes JLF, Cardoso MRA. Uso da análise de séries temporais em estudos epidemiológicos. Epidemiol Serv Saúde 2015;24(3): https://www.scielo.br/j/ress/a/zzG7bfRbP7xSmqgWX7FfGZL/?lang=pt
- Autocorrelação na tendência de mortalidade por HIV no Brasil. RBE 2018;21:e180020: https://scielosp.org/article/rbepid/2018.v21/e180020/en
- Câncer de boca e orofaringe em MG, modelo bayesiano. Ciênc Saúde Coletiva 2018;23(1): https://scielosp.org/article/csc/2018.v23n1/153-160
- Mortalidade prematura por DCNT nos municípios brasileiros. RBE 2021;24 supl. 1: https://scielosp.org/pdf/rbepid/2021.v24suppl1/e210003/pt
- Spiegelhalter DJ. Funnel plots for comparing institutional performance. Stat Med 2005;24:1185–1202: https://doi.org/10.1002/sim.1970
- CIHI, uso de gráficos de funil: https://repertoiredesindicateurs.icis.ca/sites/default/files/document/use-of-funnel-plots-for-reporting-performance-indicator-results-en.pdf
- Pilgrim C. piecewise-regression. JOSS 2021: https://joss.theoj.org/papers/10.21105/joss.03859
- statsmodels GLSAR: https://www.statsmodels.org/stable/generated/statsmodels.regression.linear_model.GLSAR.html
- PySAL esda, suavização (código): https://raw.githubusercontent.com/pysal/esda/main/esda/smoothing.py
- IBGE, Divisão Regional do Brasil: https://www.ibge.gov.br/geociencias/cartas-e-mapas/redes-geograficas/15778-divisoes-regionais-do-brasil.html?lang=pt-BR
- Fiocruz/PROADESS, Macrorregiões de Saúde (NT 6, 2025): https://proadess.fiocruz.br/NT6_Macrorregioes%20Proadess_setembro2025.pdf
- INCA, ficha técnica dos indicadores de mama (2014): https://www.inca.gov.br/sites/ufu.sti.inca.local/files/media/document/ficha-tecnica-indicadores-mama-2014.pdf
- SESA-ES, ficha da razão de mamografias: https://saude.es.gov.br/Media/sesa/Planejamento/ficha_de_qualificacao/Meta%201.4.7.pdf
- Ministério da Saúde, denominadores para cálculo das coberturas vacinais: https://www.gov.br/saude/pt-br/vacinacao/publicacoes/denominadores_calculo_coberturas_vacinais.pdf
- Fiocruz/ENSP, ficha do indicador de cobertura vacinal: https://dssbr.ensp.fiocruz.br/wp-content/uploads/2012/03/Ind030203-20120130.pdf
- INCA, Informativo Vigilância do Câncer n. 5 (Atlas On-line de Mortalidade), 2014: https://www.inca.gov.br/sites/ufu.sti.inca.local/files//media/document//informativo-vigilancia-do-cancer-n5-edicao-especial-2014.pdf.pdf

## Limitações desta pesquisa

- Não verificamos o número atual de Regiões de Saúde nem a estabilidade da composição delas entre 2014 e 2024.
- Não achamos documentação de método de tendência publicada pelo INCA, pelo Observatório de Oncologia ou pelo Atlas Brasil para dados municipais. O Atlas On-line de Mortalidade do INCA publica taxas padronizadas por município, mas não confirmamos se ele suaviza ou classifica a tendência.
- A documentação do PySAL `esda` não abriu (404), então as classes foram conferidas no código-fonte. Os pacotes não foram instalados nem testados aqui.
- As tabelas da seção 1.5 são aproximações (eventos constantes por ano, sem sobredispersão). Dados reais, com sobredispersão, dão margens maiores.
- O Fingertips citado é o sistema da Inglaterra (OHID, ex-PHE). As páginas consultadas são as publicadas hoje, e a regra pode ter mudado com o tempo.
