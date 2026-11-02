# Métodos da mortalidade: C55, C26, causas mal definidas e padronização por idade

Pesquisa do ticket `issues/15-metodos-mortalidade.md`. Data da verificação: **2026-11-02**.
Método: leitura do Atlas On-line de Mortalidade do INCA (páginas públicas dos modelos), do guia do INCA sobre o Atlas (2014), do Atlas impresso de 2002, das publicações "dados e números" do INCA sobre colo do útero (2021 e 2025), da tabela da OMS sobre populações padrão e de artigos brasileiros revisados por pares. Também houve uma **conferência numérica**: o SIM de 2022 a 2024 (microdados `DO<UF><ANO>.dbf`), a população do MS/SVS (`POPSBR22–24`, ver `research/13-denominador-populacional.md`) e consultas ao TabNet para a série de 2014 a 2024. Os scripts estão em `research/15-scripts/`. Quando a fonte não é primária, isso está indicado.

## Resumo

- **O INCA não redistribui nada na mortalidade.** O Atlas On-line trabalha com a causa básica do SIM como ela vem, por categoria CID de 3 dígitos. Ele oferece C53, C54 e C55 como itens separados no seletor. O número oficial de óbitos por câncer do colo do útero em 2022 (6.983) é **exatamente** a contagem de C53 no SIM, sem nada do C55. Com isso cai a premissa do ticket 09, que chamava a redistribuição de "método usual do INCA".
- **A padronização do INCA usa a população mundial de Segi, modificada por Doll et al. (1966)**, com a última faixa em **80 anos ou mais**. O Atlas também oferece uma população padrão brasileira (Censo 1991, 2000, 2010 ou 2022), mas o mapa e os números de capa do INCA usam a mundial. A OMS 2000–2025 não é usada pelo INCA.
- **A redistribuição do C55 é o padrão da literatura brasileira.** O C55 é repartido entre colo (C53) e corpo (C54) na proporção observada, por faixa etária, UF e ano. Isso **muda a tendência**: de 2014 a 2024, o C55 caiu de 23,7% para 15,2% dos óbitos por câncer de útero. Com isso, a contagem de óbitos só de C53 cresce **2,9% ao ano**, e a contagem corrigida cresce **1,8% ao ano**. Essa diferença de 1,1 ponto ao ano é maior que a faixa de "estável" do mapa (±1% ao ano).
- **O C26 não é redistribuído por ninguém** na mortalidade colorretal, e redistribuí-lo quase não muda a tendência (4,56% contra 4,51% ao ano nas contagens).
- **R00–R99 e C76–C80 só são redistribuídos em pesquisas** (correção "GBD" ou "50% das mal definidas"). Nenhuma fonte oficial que alimenta o Atlas ou os "dados e números" do INCA faz isso.

---

## 1. Como o INCA calcula (Atlas On-line de Mortalidade)

### 1.1 O que o Atlas oferece

O Atlas On-line ([mortalidade.inca.gov.br/MortalidadeWeb](https://mortalidade.inca.gov.br/MortalidadeWeb/)) está na versão 2.0.0, com anos de 1979 a 2024. Ele não tem nota metodológica publicada: o botão "Notas Técnicas" mostra "No records found" (conferido em 2026-11-02). O método vem das descrições dos modelos e do guia oficial *Atlas On-line de Mortalidade: usos e aplicações* (INCA, 2014; [cópia no Internet Archive](https://web.archive.org/web/2020/https://www.inca.gov.br/sites/ufu.sti.inca.local/files//media/document//informativo-vigilancia-do-cancer-n5-edicao-especial-2014.pdf.pdf); o link original no site do INCA dá 404).

| Item | O que o Atlas faz | Fonte |
|---|---|---|
| Numerador | Óbitos do SIM por **residência**, pela causa básica, em **categorias CID-10 de 3 dígitos**. Vai de C00 a C97, mais D46, e **exclui C77–C79** (neoplasias secundárias) | Guia de 2014, modelos 1 a 3 |
| C53, C54, C55 | São **três itens separados** no seletor de topografia ("C53 - COLO DO UTERO", "C54 - CORPO DO UTERO", "C55 - UTERO, SOE"). O usuário escolhe o que somar | HTML do [Modelo 03](https://mortalidade.inca.gov.br/MortalidadeWeb/pages/Modelo03/consultar.xhtml) |
| C26, C76, C80, C97 | Também aparecem como itens próprios ("C26 - LOCALIZACOES MAL DEFINIDAS NO APARELHO DIGESTIVO", "C80 - LOCALIZACAO PRIMARIA DESCONHECIDA") | Mesmo HTML |
| Redistribuição | **Nenhuma** é descrita, nem de C55, C26, C76–C80 ou R00–R99 | Guia de 2014 e páginas dos modelos |
| Taxa ajustada | "ajustadas por idade pelas populações mundial e brasileira". O **mapa (Modelo 06) e o Modelo 04 usam só a mundial** | Páginas dos modelos |
| População padrão brasileira | Censo 1991, 2000, 2010 e **2022** na versão atual (o guia de 2014 listava 1991, 2000 e 2010) | Seletor do Modelo 03 |
| Tendência | O Modelo 9 mostra a AAPC, mas o próprio usuário precisa calcular o β da regressão linear fora do Atlas e digitá-lo. A recomendação é usar intervalos de pelo menos 8 anos | Guia de 2014, Modelo 9 |

### 1.2 População padrão mundial e faixas etárias

O Atlas impresso (*Atlas de mortalidade por câncer no Brasil 1979–1999*, INCA, 2002; [PDF no repositório do INCA](https://ninho.inca.gov.br/jspui/bitstream/123456789/8977/1/Atlas%20de%20mortalidade%20por%20c%c3%a2ncer%20no%20Brasil%201979-1999%20-%202002.pdf)) descreve o método que o on-line herdou:
- "A população padrão mundial usada neste Atlas [...] proposta por **Segi (1960), modificada por Doll et al. (1966)** e usada nas publicações da série [...] IARC, Cancer Incidence in Five Continents".
- Tabelas com as faixas **0–4, 5–9, 10–14, 15–19, 20–29, 30–39, 40–49, 50–59, 60–69, 70–79 e 80 anos e +**. A nota de rodapé diz "(1) População Padrão Mundial, modificada por Doll et al. (1966)".
- A população padrão Brasil daquela edição era a Contagem de 1996.

Os pesos de Segi/Doll, conferidos na tabela 1 da OMS ([Ahmad et al., *Age standardization of rates: a new WHO standard*, GPE Discussion Paper 31, 2001](https://cdn.who.int/media/docs/default-source/gho-documents/global-health-estimates/gpe_discussion_paper_series_paper31_2001_age_standardization_rates.pdf)), por 100.000:

| 0–4 | 5–9 | 10–14 | 15–19 | 20–24 | 25–29 | 30–34 | 35–39 | 40–44 | 45–49 | 50–54 | 55–59 | 60–64 | 65–69 | 70–74 | 75–79 | 80–84 | 85+ |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 12.000 | 10.000 | 9.000 | 9.000 | 8.000 | 8.000 | 6.000 | 6.000 | 6.000 | 6.000 | 5.000 | 4.000 | 4.000 | 3.000 | 2.000 | 1.000 | 500 | 500 |

Como a população do MS/SVS termina em 80+, as duas últimas faixas viram uma só, **80+ = 1.000**. O padrão da OMS 2000–2025 é bem mais velho (80–84 = 0,91% e 85+ = 0,63%), e o mesmo documento mostra que o ranking entre países muda conforme o padrão. Ele **não é usado pelo INCA**.

### 1.3 Conferência: o pipeline reproduz o INCA?

O alvo foi a tabela 2 de *Controle do câncer do colo do útero no Brasil: dados e números 2025* (INCA; [cópia do PDF](https://colposcopia.org.br/wp-content/uploads/2025/05/Controle-do-cancer-do-colo-do-utero_completo.pdf), [arquivada](https://web.archive.org/web/2025/https://colposcopia.org.br/wp-content/uploads/2025/05/Controle-do-cancer-do-colo-do-utero_completo.pdf)). A fonte citada é "INCA, Atlas da mortalidade, [2024a]", com taxas "ajustadas pela população mundial padrão". A ficha técnica do anexo define a taxa como "Número de óbitos por câncer do colo do útero em mulheres / população feminina × 100 mil", com fonte "Atlas de mortalidade por câncer". Não há menção ao C55.

Cálculo com o SIM de 2022 (C53, mulheres, por residência), a população `POPSBR22` e os pesos de Segi com 80+ (script `15-scripts/taxa_colo_vs_inca.py`):

| Local | Óbitos INCA | Óbitos C53 no SIM | Taxa bruta INCA | Bruta pipeline | Ajustada INCA | Ajustada pipeline (quinquenal) | Ajustada pipeline (faixas do Atlas 2002) | Ajustada com C55 redistribuído |
|---|---|---|---|---|---|---|---|---|
| Brasil | 6.983 | **6.983** | 6,40 | 6,47 | 4,79 | 4,75 | 4,76 | 5,62 (+18%) |
| MG | 466 | **466** | 4,29 | 4,32 | 2,97 | 2,94 | 2,94 | 3,79 (+29%) |
| RJ | 543 | **543** | 5,96 | 6,01 | 4,22 | 4,21 | 4,22 | 5,59 (+33%) |
| PA | 417 | **417** | 9,52 | 9,78 | 9,11 | 8,92 | 8,94 | 9,91 (+11%) |
| SP | 1.107 | **1.107** | 4,63 | 4,69 | 3,25 | 3,27 | 3,28 | 4,01 (+22%) |

O que isso mostra:
1. **As contagens batem exatamente.** O INCA usa só C53, sem C55, por residência. A série do TabNet confirma: 6.983 óbitos por C53 em 2022, com mais 1.927 por C55 ([TabNet SIM CID-10](http://tabnet.datasus.gov.br/cgi/deftohtm.exe?sim/cnv/obt10uf.def), extração de 02/12/2025).
2. **As taxas ficam a cerca de 1% das do INCA**, e a diferença vem do denominador. A taxa bruta do INCA implica cerca de 109,1 milhões de mulheres em 2022, enquanto a `POPSVS` revista em 2025 tem 107,9 milhões. O INCA provavelmente usou a série populacional anterior (ver `research/13`). Agrupar em faixas quinquenais ou nas faixas do Atlas de 2002 muda a taxa em no máximo 0,02.
3. Com o C55 redistribuído, o nível sobe de 11% (PA) a 33% (RJ). Essa correção é desigual entre UFs.

## 2. C55 (útero, porção não especificada)

### 2.1 Método da literatura

Os artigos de referência repartem **todo o C55** entre C53 e C54 **na proporção original** dos dois, dentro de cada célula:
- **Gamarra, Valente e Azevedo e Silva (2010)**, *Correção da magnitude da mortalidade por câncer do colo do útero no Brasil, 1996–2005*, Rev Saúde Pública 44(4):629–38, [DOI 10.1590/S0034-89102010000400006](https://doi.org/10.1590/S0034-89102010000400006) ([PDF](https://www.redalyc.org/pdf/672/67240186006.pdf)). Diz que "todos os óbitos por câncer do útero porção não especificada foram redistribuídos **segundo faixa etária, UF, área geográfica e ano**, entre os óbitos por câncer do colo e corpo do útero, conforme sua proporção original". É a etapa 7 de uma cadeia de 8: sub-registro, idade ignorada, sexo ignorado, UF ignorada, C57.8–C57.9, C76–C80 e C97, C55 e R00–R99. Das três etapas que mais pesaram no Brasil, **o C55 foi a maior: +55,6%**. O sub-registro deu +22,0% e as mal definidas, +21,2%. A correção total foi de +103%, de 35% nas capitais do Sul a 339% no interior do Nordeste.
- **Azevedo e Silva, Girianelli, Gamarra e Bustamante-Teixeira (2010)**, *Evolução da mortalidade por câncer do colo do útero no Brasil, 1981–2006*, Cad Saúde Pública 26(12), [DOI 10.1590/S0102-311X2010001200018](https://doi.org/10.1590/S0102-311X2010001200018) ([texto](https://www.scielo.br/j/csp/a/H3jJHHGfchyjz3xBXJFNyMt/)). Faz a redistribuição do C55 "according to their original proportions", padroniza pela população mundial de Segi/Doll por faixa quinquenal e usa regressão linear simples.
- **Azevedo e Silva et al. (2011)**, *Tendência da mortalidade por câncer nas capitais e interior do Brasil entre 1980 e 2006*, Rev Saúde Pública 45(6):1009–18 ([PDF](https://www.redalyc.org/pdf/672/67240194002.pdf)). Usa a mesma regra do C55, "mantendo a mesma proporção dos óbitos por câncer do colo e de corpo do útero".
- Um estudo de 2023 sobre o Sudeste (Rev Saúde Pública v. 57, art. 25, [PDF](https://scielosp.org/pdf/rsp/2023.v57/25/pt)) é descrito na busca como aplicando a mesma correção, mais 50% das mal definidas. **Não li o texto completo** (o PDF não baixou).

### 2.2 A redistribuição muda a tendência

**Evidência publicada.** Em Azevedo e Silva et al. (2010), a série nacional de 1981–2006 **sem correção era levemente crescente** (β = 0,012; p = 0,007). **Corrigida, passou a ser decrescente** (β = −0,054; p < 0,001). No interior do país, a série era crescente sem correção (β = 0,048) e ficou **estável** depois dela (β = −0,005; p = 0,479). O motivo é que o C55 caiu ao longo do tempo (β = −0,127 nas capitais e −0,053 no interior), com a melhora do preenchimento das declarações de óbito. Assim, uma parte do "aumento" do C53 é só óbito que antes era codificado como C55.

**Evidência atual (TabNet, Brasil, 2014–2024; script `15-scripts/tabnet_series.py`):**

| Ano | 2014 | 2016 | 2018 | 2020 | 2022 | 2024 |
|---|---|---|---|---|---|---|
| C53 | 5.448 | 5.847 | 6.526 | 6.627 | 6.983 | 7.493 |
| C54 | 1.366 | 1.576 | 1.743 | 1.944 | 2.284 | 2.726 |
| C55 | 2.116 | 2.143 | 2.090 | 1.823 | 1.927 | 1.830 |
| C55 / útero | 23,7% | 22,4% | 20,2% | 17,5% | 17,2% | 15,2% |

A variação anual das **contagens** de 2014 a 2024 foi de **+2,89% ao ano só com C53** e de **+1,77% ao ano com o C55 redistribuído**. Somar o C55 inteiro ao C53 dá +1,73%. A diferença de cerca de 1,1 ponto ao ano vale também para a taxa padronizada, já que o envelhecimento e a população afetam as duas séries do mesmo jeito. Isso é uma aproximação: não refiz a série padronizada ano a ano. É mais do que a faixa de ±1% ao ano que define "estável" no ticket 12. Ou seja, **a escolha sobre o C55 pode mudar a classe da Tendência do colo do útero**, especialmente nas UFs onde o C55 pesa mais (RJ, MG, AP, PB e SE ficam acima de 20%, segundo o ticket 09).

### 2.3 Detalhes de implementação, se o projeto redistribuir

- **Célula da proporção:** UF de residência × ano × faixa quinquenal, como em Gamarra et al. Uma célula sem C53 nem C54 usa a proporção nacional da mesma faixa e do mesmo ano.
- **Município:** aplicar a proporção da UF a cada C55 municipal. A proporção calculada no próprio município é instável demais. Os óbitos ficam fracionários, o que não atrapalha o modelo quasi-Poisson.
- **Corpo do útero (C54)** recebe o resto. O projeto não publica C54, então isso só importa para a conta.

## 3. C26 (digestivo mal definido) e o colorretal

- **Nenhuma fonte oficial redistribui o C26.** O Atlas lista o C26 como item próprio (seção 1.1). Os estudos brasileiros de tendência do colorretal usam **C18–C20** (Guimarães et al., *Tendência da mortalidade por câncer de cólon e reto no Brasil segundo sexo, 1980–2009*, Cad Saúde Colet 2012;20(1):121–7, [PDF](https://ninho.inca.gov.br/jspui/bitstream/123456789/8929/1/Tend%c3%aancia%20da%20mortalidade%20por%20c%c3%a2ncer%20de%20c%c3%b3lon%20e%20reto%20no%20Brasil%20segundo%20sexo%2c%201980%e2%80%932009.pdf); Azevedo e Silva et al. 2011, acima) ou **C18–C21** (estudo do INCA na Rev Bras Cancerol 2024, segundo o resumo na busca, [link](https://rbc.inca.gov.br/index.php/revista/article/download/4404/3459/35744); não li o texto completo). Todos padronizam por Segi/Doll e nenhum mexe no C26.
- Na correção de "causas garbage" no estilo GBD, o "câncer não especificado" é redistribuído entre os cânceres específicos (Teixeira et al., *Proposta metodológica para redistribuição de óbitos por causas garbage nas estimativas de mortalidade para DCNT*, Rev Bras Epidemiol 2021;24 supl. 1, [DOI 10.1590/1980-549720210004.supl.1](https://doi.org/10.1590/1980-549720210004.supl.1), [preprint](https://preprints.scielo.org/index.php/scielo/preprint/download/1611/2547/2652)). A lista de códigos fica num anexo que não está no preprint.
- **Efeito medido (TabNet, 2014–2024):** o C26 representa **5,0–5,9% dos óbitos digestivos** (C15–C26) em todos os anos. Redistribuí-lo proporcionalmente entre C15–C25 aumentaria o colorretal em cerca de 5% no Brasil (de 0,4% no ES a 7,6% no PI, em 2024), mas **a tendência quase não muda**: +4,56% contra +4,51% ao ano nas contagens. Atenção: o ticket 10 citou "10% dos óbitos digestivos" para o C26. A diferença deve vir de outro denominador, e o número daqui (C26 ÷ C15–C26) é o que deve valer.

## 4. Causas mal definidas (R00–R99) e C76–C80

| Fonte | Redistribui R00–R99? | Redistribui C76–C80? |
|---|---|---|
| INCA, Atlas On-line e "dados e números" | Não | Não. O "todas as neoplasias" do Atlas é C00–C97 sem C77–C79 |
| SIM/TabNet (MS) | Não. Dado bruto | Não |
| Indicador de mortalidade prematura do Plano DANT 2021–2030, como calculado pelo CVE-SP | Não: "Óbitos: Tabnet", padronização direta pela **população Brasil Censo 2010** ([boletim CVE-SP](https://saude.sp.gov.br/resources/cve-centro-de-vigilancia-epidemiologica/areas-de-vigilancia/doencas-cronicas-nao-transmissiveis/dados/boletim_epidemio_dcnt_mortalidade_prematura.pdf); fonte estadual, secundária para o método federal) | Não |
| Gamarra et al. 2010; Azevedo e Silva et al. 2011 | Sim: **50%** das R00–R99, proporcionalmente, por faixa quinquenal, ano, sexo e capital/interior. Os 50% se justificam porque o câncer é mais bem declarado que as outras causas | Gamarra: C76–C80 e C97 entre todos os cânceres |
| Teixeira et al. 2021 (financiado pela SVS) | Sim, no estilo GBD (níveis 1 a 4 de causas garbage), por município, com suavização bayesiana | Sim (nível 3) |

O efeito citado na literatura: as mal definidas aumentaram a mortalidade geral por câncer em ~10% em 1980 e ~5% em 2006, e mudaram a tendência só nas mulheres das capitais (Azevedo e Silva et al. 2011). Hoje as R00–R99 são 4,5–5,3% de todos os óbitos e caem devagar (ticket 09). Com isso, o viés na tendência por não corrigir é pequeno e uniforme.

**Não encontrei nota técnica federal** (MS/SVSA) que mande redistribuir causas garbage nos indicadores oficiais de câncer. Os trabalhos no estilo GBD são pesquisas financiadas pelo MS, não indicadores de rotina.

## 5. Padronização: comparação das opções

| Opção | Quem usa | Faixas | Efeito no colo do útero, Brasil, 2022 (C53) |
|---|---|---|---|
| **Mundial de Segi/Doll (1966)** | INCA (Atlas, "dados e números", mapa), IARC/CI5, literatura brasileira | Quinquenais até 85+. Com a população do MS, **80+ = 1.000** | **4,75** por 100 mil (INCA: 4,79) |
| OMS 2000–2025 | OMS/GHE | Quinquenais até 100+ (80+ = 1,54%) | 5,27 |
| Brasil (Censo 2010 ou 2022) | Plano DANT (CVE-SP), opção no Atlas | Quinquenais | Não calculado. Fica mais perto da taxa bruta (6,47) porque a população brasileira é mais velha que a de Segi |

Para a **Tendência**, a escolha do padrão muda pouco a inclinação, porque é o mesmo peso em todos os anos. Para o **nível** e para comparar com o INCA, só Segi/Doll funciona.

---

## Recomendação (entrada para a decisão)

**Para bater com o Atlas do INCA**, a combinação é:
1. **Numerador:** SIM, causa básica por **residência**, categoria de 3 dígitos como vem. **Sem redistribuição** de C55, C26, C76–C80 ou R00–R99.
2. **Códigos:** colo do útero = **C53**; mama = C50 (mulheres); próstata = C61; pulmão = C33–C34; colorretal = **C18–C21**, a mesma definição do Painel no ticket 10 e a que o INCA usa em seus estudos mais recentes; "Todos" = C00–C97 (o Atlas tira C77–C79, que quase nunca são causa básica).
3. **Padronização direta** pela **população mundial de Segi/Doll**, faixas quinquenais com **80+ = 1.000**. Usar as faixas do Atlas de 2002 em vez das quinquenais muda no máximo 0,02 por 100 mil.
4. **Denominador:** `POPSVS` (ticket 13). Os números vão ficar **~1% abaixo** dos publicados pelo INCA até 2025, porque o INCA ainda usava a série populacional anterior. Na validação, **conferir as contagens exatamente** e as taxas com tolerância de ±3%.

**Mas para a Tendência do colo do útero, recomendo redistribuir o C55**, como faz a literatura (proporção C53/(C53+C54) por UF × ano × faixa quinquenal, aplicada também aos municípios). Sem isso, a melhora na codificação infla a variação anual em ~1 ponto, o tamanho da faixa de "estável". Em várias UFs, isso pode pintar de "piorando" um colo do útero que está estável, ou de "estável" um que melhora. Isso cria duas versões do número:
- **Opção A (recomendada):** a Tendência e o valor no cartão usam C53 + C55 redistribuído. A nota de método diz "inclui a parte dos óbitos por câncer de útero sem local definido que provavelmente é do colo; por isso o número fica acima do publicado pelo INCA". A validação contra o INCA usa a série sem redistribuição, que o pipeline calcula do mesmo jeito.
- Opção B: tudo só com C53, igual ao INCA, e uma ressalva fixa no cartão do colo do útero dizendo que a tendência pode estar superestimada. É mais simples, mas o erro cai exatamente na cor do mapa.

**C26, R00–R99 e C76–C80:** não redistribuir no MVP. Nenhuma fonte oficial faz isso, o efeito na tendência é pequeno (C26) ou uniforme (mal definidas), e a correção no estilo GBD é difícil de explicar e de manter. Citar na página de método como limitação.

## Incertezas

- O Atlas On-line **não publica nota metodológica**. A afirmação de que ele usa Segi/Doll com 80+ vem do Atlas de 2002, do guia de 2014 e da reprodução numérica (diferença de ~1% explicada pelo denominador). As faixas exatas da versão atual não foram confirmadas, porque a consulta exige interação com a página.
- A diferença de 1,1 ponto ao ano foi medida nas **contagens** nacionais, não na taxa padronizada por UF. Ela é uma boa aproximação, mas o efeito por UF precisa ser medido no pipeline.
- O denominador que o INCA usou em 2022 (~109,1 milhões de mulheres) foi inferido da taxa bruta. Não li a fonte.
- O estudo de 2023 sobre o Sudeste e o artigo do INCA de 2024 sobre colorretal foram vistos só pelo resumo na busca.
