# Denominador populacional: série e formato da estimativa do MS/SVS

Pesquisa do ticket `issues/13-denominador-populacional.md`. Data da verificação: **2026-11-02**.
Método: listagem direta do FTP do DATASUS (`ftp://ftp.datasus.gov.br/dissemin/publicos/IBGE/`), download e leitura dos arquivos de 2014, 2022, 2023, 2024 e 2025, leitura do `.DEF` do TabNet (pacote `Auxiliar/TAB_POP.zip`), das notas técnicas do MS/SVS e da Ripsa, das fichas técnicas do INCA e das notas técnicas do PNI. Quando a fonte não é primária, isso está indicado.

## Resumo

- A estimativa que o TabNet usa é o **"Estudo de Estimativas Populacionais por Município, Idade e Sexo"** do MS/SVSA/CGIAE, feito com o método da Ripsa. No FTP fica em `IBGE/POPSVS/`, com **um arquivo por ano de 2000 a 2025**.
- A granularidade é **município (código IBGE de 7 dígitos) × sexo × idade simples de 0 a 79 anos, mais 80 anos ou mais**. Dá para montar qualquer faixa: 9–14, 25–64, 50–69 e faixas quinquenais para padronização.
- A série **foi inteiramente revista depois do Censo 2022**: os arquivos de 2000 a 2024 foram regravados em 07/01/2025 com o novo método. **Não há quebra de método dentro da série atual**, mas os números antigos (publicados antes de 2025) não batem mais com os de hoje.
- O formato é **DBF dentro de ZIP** (não é DBC), com cerca de 3,4 MB por ano zipado.
- A **cobertura oficial de HPV não usa essa estimativa**: o PNI usa a **população do Censo 2022 fixa para todos os anos** (NT 16/2025-DPNI). As razões de mamografia e de citopatológico do INCA usam "IBGE" (na prática, a estimativa do TabNet) dividida por 2 e por 3.

---

## 1. O que existe no FTP

Listagem de `ftp://ftp.datasus.gov.br/dissemin/publicos/IBGE/` em 2026-11-02:

| Pasta | Conteúdo | Anos | Granularidade | Serve? |
|---|---|---|---|---|
| **`POPSVS/`** | `POPSBR00.zip` … `POPSBR25.zip` (um por ano, ~3,4 MB; o de 2025 tem 4,75 MB) | **2000–2025** | Município × sexo × idade simples | **Sim, é a base** |
| `POPTCU/` | `POPTBR92.zip` … `POPTBR25.zip` (~35–100 KB) | 1992–2025 (sem 1996) | Município, **só total** (estimativa enviada ao TCU) | Não serve: não tem sexo nem idade |
| `POP/` | `POPBR80.zip` … `POPBR12.zip` | 1980–2012 | Município × sexo × faixa etária, série antiga do DATASUS | Não: congelada em 2012, com métodos que mudam entre anos (`doc/populacao.pdf`) |
| `censo/` | Arquivos temáticos dos censos 1991, 2000 e 2010 (alfabetização, escolaridade, idosos, renda) | 1991, 2000, 2010 | — | Não |
| `projpop/` | `PROJUF00.dbf` … `PROJUF70.dbf` | 2000–2070 | **UF** × sexo × idade (projeção do IBGE) | Só para UF |
| `doc/` | `NT-POPULACAO-RESIDENTE-2000-2024.pdf`, `populacao.pdf`, `Pop_Residente_TCU_2024.pdf`, `Pop_Residente_TCU_ate_2023.pdf` | — | — | Documentação |
| `Auxiliar/` | `TAB_POP.zip` (`.DEF` e `.CNV` do TabNet) | — | — | Tabelas de conversão |

Datas de gravação em `POPSVS/`: os arquivos de **2000 a 2024 têm data de 07/01/2025** (regravados de uma vez na revisão pós-Censo). O de **2025 tem data de 29/10/2025**. Ainda **não existe arquivo de 2026**.

## 2. Formato e colunas (conferido nos arquivos)

Baixei e li `POPSBR14.zip`, `POPSBR22.zip`, `POPSBR23.zip`, `POPSBR24.zip` e `POPSBR25.zip`. Cada ZIP tem **um único `.dbf`** (`pop14.dbf`, `POP22.dbf`, `POP25.dbf`…, ~25–27 MB descompactado), em formato "longo":

| Coluna | Tipo | Valores |
|---|---|---|
| `COD_MUN` | texto, 7 | Código IBGE de **7 dígitos** (com dígito verificador). O pipeline usa 6 dígitos, então é preciso cortar o último |
| `ANO` | texto, 4 | Ano de referência (um só por arquivo). População em **1º de julho** |
| `SEXO` | texto | `1` = Masculino, `2` = Feminino (conforme `SEXOSVS.CNV`) |
| `IDADE` | texto, 3 | `000` a `079` = idade simples; `080` = **80 anos ou mais** (81 valores) |
| `POP` | número | Pessoas |

Detalhes que o leitor precisa tratar:
- No arquivo de **2025 os nomes das colunas estão em minúsculas** (`cod_mun`, `ano`, `sexo`, `idade`, `pop`) e o campo `idade` tem largura 5. Os valores são iguais. Normalizar os nomes ao ler.
- São 902.340 linhas por ano (5.570 municípios × 2 sexos × 81 idades). Em 2025 são **5.571 municípios**: entra `5101837` (Boa Esperança do Norte, MT), com 5.877 habitantes. No mesmo ano, Nova Ubiratã (`5106240`) cai de 12.108 para 9.760. Isso confirma a regra do ticket 07: a série do município novo começa quando ele passa a existir.
- Em **2014 já há 5.570 municípios**: a série foi compatibilizada com a malha de 2022 para trás (a Ripsa chama isso de "compatibilização territorial").
- O `.DEF` do TabNet (`POPSVSBR.DEF`) lê exatamente esses arquivos (`IBGE\bases\PopSVS\POP??.dbf`) e oferece "Idade simples", "Faixa Etária 1" (0–4, 5–9, 10–14, 15–19 e depois de 10 em 10 até 80+) e "Faixa Etária 2" (quinquenal até 80+). As faixas são só agrupamentos da idade simples, então o pipeline pode montar qualquer recorte.

Totais do Brasil nos arquivos: 2014 = 200.811.131; 2022 = 210.862.983; 2023 = 211.695.158; 2024 = 212.583.750; 2025 = 213.421.037. O total de 2025 é igual à estimativa do IBGE publicada no DOU para 1º/07/2025, como a nota da Ripsa exige.

Leitura sem pacote especial: o DBF é simples e não precisa do `datasus_dbc`, basta o `dbfread` (que já está na stack). O PySUS também tem leitor para essa base.

## 3. Método, revisões e quebras

**Série atual (2000–2025): um método só.** A nota metodológica do FTP (`doc/NT-POPULACAO-RESIDENTE-2000-2024.pdf`) e a **Nota Técnica Ripsa nº 01/2025** (DOI 10.5281/zenodo.17990183, ligada na página do TabNet) descrevem o método:
- base nos Censos 2000, 2010 e **2022**;
- soma por sexo e idade igual às **Projeções da População do IBGE, revisão 2024**, para cada UF e ano;
- total municipal do último ano igual à **estimativa do IBGE publicada no DOU**;
- método de **Relação de Coortes** em duas etapas (UF → Região Geográfica Intermediária → município) e interpolação nos anos intermediários;
- compatibilização da malha municipal para toda a série, para garantir "comparabilidade temporal".

A Ripsa diz que as estimativas "serão revisadas e atualizadas **anualmente**", depois dos totais municipais que o IBGE publica todo **agosto** no DOU. Na atualização de 2025 foram usados os totais municipais do DOU de 2025 e a extensão das projeções estaduais até 2025.

**Quebra com a versão anterior.** Até 2024, o TabNet mostrava o estudo "2000–2021", baseado no Censo 2010 e na projeção do IBGE revisão 2018. A **Nota Técnica nº 41/2023-CGIAE/DAENT/SVSA/MS** comparou essa versão com o Censo 2022 e encontrou:
- superestimação de **~11,8 milhões de habitantes (5,8%)** no Brasil, maior no Norte (−10,3%; Amapá −21,8%);
- diferença acima de 20% em 11,1% dos municípios (por exemplo, Santana do Araguaia/PA: 77.542 estimados contra 32.413 recenseados);
- direção de crescimento 2010–2022 invertida em 32,1% dos municípios.

Essa versão antiga **não está mais no FTP**: os arquivos foram substituídos. Consequências para o projeto:
1. Os números oficiais publicados **antes de 2025** (boletins do INCA, painéis antigos) foram calculados com a série antiga e **não vão bater** com o que o pipeline calcular. A validação deve comparar contra o TabNet atual, não contra PDFs antigos.
2. Na série atual não há degrau visível entre 2024 e 2025. Variação do total municipal de 2024 para 2025: mediana +0,09%, percentis 5–95 de −0,74% a +1,34%. O único salto grande é o desmembramento citado acima (−19,7%). Mesmo assim, os arquivos de 2000–2024 **não foram regravados** na atualização de 2025, embora a Ripsa diga que cada atualização reconstrói a série inteira. Quando sair a atualização de 2026, conferir se os anos anteriores mudaram (o baixador incremental já compara tamanho e data).

**Diferença em relação ao Censo 2022.** A estimativa para 2022 (210,86 milhões) é **maior que a contagem do Censo 2022** (203,08 milhões, IBGE), porque é ajustada às projeções do IBGE, que corrigem a sub-enumeração do Censo. Por isso, qualquer denominador "Censo 2022" (como o do HPV, abaixo) **não é intercambiável** com a estimativa do MS.

## 4. Acesso, licença e atualização

| Item | Situação |
|---|---|
| FTP | `ftp://ftp.datasus.gov.br/dissemin/publicos/IBGE/POPSVS/POPSBR<aa>.zip`. Também em https://datasus.saude.gov.br/transferencia-de-arquivos/ (fonte "IBGE", tipo "POPSVS") |
| TabNet | http://tabnet.datasus.gov.br/cgi/deftohtm.exe?ibge/cnv/popsvs2024br.def. Título: "População Residente - Estudo de Estimativas Populacionais por Município, Idade e Sexo **2000-2025** - Brasil". Períodos 2000 a 2025. O HTTPS do TabNet recusou conexão, o HTTP funcionou |
| Nota metodológica | Nota Técnica Ripsa 01/2025: http://tabnet.datasus.gov.br/cgi/IBGE/NT-Ripsa_01_2025_Estimativas_Populacionais.PDF. Versão anterior no FTP: `IBGE/doc/NT-POPULACAO-RESIDENTE-2000-2024.pdf` |
| Licença | Dados abertos do governo federal (Decreto 8.777/2016; ver `research/01-dados-disponiveis-por-eixo.md`). O FTP não traz licença explícita. A **nota técnica da Ripsa** (o texto) é **CC BY-NC-SA 4.0**. Citar como "Ministério da Saúde/SVSA/CGIAE – Estimativas populacionais (método Ripsa)" |
| Atualização | **Anual**: depois da estimativa do IBGE no DOU (agosto). O arquivo de 2025 saiu em 29/10/2025. O de 2026, esperado para cerca de out/2026, **ainda não está no FTP** em 02/11/2026 |
| Lacuna de ano | O último ano de denominador costuma chegar alguns meses depois do fim do ano. A NT 90/2025-DPNI adota, para a vacinação, a regra de usar o denominador do ano anterior enquanto o do ano corrente não está consolidado |

## 5. Que denominador os órgãos oficiais usam

### Razão de mamografias de rastreamento (INCA)
**Ficha técnica de indicadores das ações de controle do câncer de mama** (INCA, 2014), indicador 1.2:
- numerador: mamografias de rastreamento em mulheres de 50 a 69 anos residentes no local e período (SISCAN/SISMAMA; SIA/SUS, procedimento 0204030188, para 2013–2014);
- denominador: **"metade da população feminina nesta faixa etária no respectivo local e período"**;
- fontes: "SISCAN/SISMAMA; **IBGE**; SIA/SUS". Parâmetro: 1. Limitação: conta exames, não mulheres.

Fonte: https://www.inca.gov.br/sites/ufu.sti.inca.local/files/media/document/ficha-tecnica-indicadores-mama-2014.pdf (hoje dá 404; lido pela cópia do Internet Archive).

A ficha do INCA diz só "IBGE". Fichas de pactuação estaduais que reproduzem o indicador indicam a fonte concreta como "Estimativa populacional IBGE/RIPSA. TABNET MS" e usam a mesma divisão por 2. Exemplo (fonte secundária): SESA-ES, Indicador 1.4.7, https://saude.es.gov.br/Media/sesa/Planejamento/ficha_de_qualificacao/Meta%201.4.7.pdf.

**Atenção, método mais novo do INCA:** em *Controle do câncer de mama no Brasil: dados e números 2024* (INCA), o indicador de monitoramento passou a ser a **cobertura** no SISCAN: mulheres de 50–69 anos com mamografia nos últimos 2 anos, divididas pela população feminina de 50–69 anos **menos as beneficiárias de planos privados (ANS)**. A população vem da **projeção do IBGE por UF** (edição 2018) e só é calculada por UF e região. Isso não serve para município sem dado da ANS municipal, mas mostra que o INCA migrou de "razão de exames" para "cobertura de mulheres SUS-dependentes" quando o dado permite. Fonte: https://ninho.inca.gov.br/jspui/bitstream/123456789/17002/1/Controle%20do%20c%C3%A2ncer%20de%20mamano%20Brasil%20-%20dados%20e%20n%C3%BAmeros%202024.pdf (pág. 27–28 e ficha técnica no anexo).

### Razão de citopatológicos (INCA)
**Ficha técnica de indicadores das ações de controle do câncer do colo do útero** (INCA, 2014), indicador 1.2:
- numerador: exames citopatológicos em mulheres de 25 a 64 anos residentes no local e ano;
- denominador: **"Nº de mulheres de 25 a 64 anos, residentes no respectivo local e ano / 3"** (um exame a cada três anos);
- fonte: "**IBGE** e SIA/SUS". Parâmetro: 1. Limitações: só SUS, conta exames e não mulheres.

Fonte: https://www.inca.gov.br/sites/ufu.sti.inca.local/files/media/document/fichatecnicaindicadorescolo14.pdf (404 hoje; lido pela cópia do Internet Archive).

Não verificado: alguns resultados de busca citam uma nota técnica do MS de 2025 que muda o rastreamento mamográfico para 50–74 anos. Não li a fonte primária. Vale um ticket à parte se o projeto quiser acompanhar a faixa nova.

### Cobertura da vacina HPV (PNI)
**Nota Técnica nº 16/2025-DPNI/SVSA/MS** (23/01/2025), nova metodologia por coorte de nascimento:
- numerador: indivíduos com **ao menos uma dose** de HPV, acumulados por ano de nascimento desde os 9 anos (dados identificados da RNDS a partir de 2020; D1 consolidada do TabNet para 2014–2019);
- denominador: **"população alvo da vacinação, abrangendo indivíduos de 9 a 14 anos com a separação por sexo (masculino e feminino), segundo os dados do Censo Demográfico de 2022 - IBGE"**;
- "Os dados do Censo - IBGE (2022) foram utilizados **para todos os anos da coorte vacinal**", porque "o país carece de dados segmentados por idade simples e atualizados por cada ano de avaliação". O denominador "poderá" ser atualizado quando houver dado novo;
- a cobertura é apresentada por idade (coorte) e para a faixa de 9 a 14 anos (soma das doses acumuladas dividida pela população de 9 a 14 anos);
- até 2023, o método antigo usava a estimativa do MS (2000–2021), que a NT reconhece como superestimada frente ao Censo 2022. Mesmo com o método novo, ainda há municípios acima de 100%: 512 no sexo masculino e 1.486 no feminino.

Fonte: https://infoms.saude.gov.br/content/Default/SEI_0045605478_Nota_Tecnica_16.pdf

A **Nota Técnica nº 90/2025-DPNI/SVSA/MS** (17/12/2025), sobre as regras gerais de cobertura a partir de 2024, diz que se usam "estimativas populacionais do local e período analisados", com o SINASC para menores de 1 ano e 1 ano. Ela não revoga a regra específica do HPV na NT 16. Fonte: https://www.gov.br/saude/pt-br/centrais-de-conteudo/publicacoes/notas-tecnicas/2025/nota-tecnica-no-90-2025-dpni-svsa-ms.pdf

**Onde pegar o Censo 2022 por idade simples e município:** SIDRA/IBGE, tabela **9514** ("População residente, por sexo, idade e forma de declaração da idade"), com nível territorial N6 (município), sexo e 134 categorias de idade. API: https://servicodados.ibge.gov.br/api/v3/agregados/9514/metadados

### Taxa de mortalidade padronizada
O INCA (Atlas de Mortalidade por Câncer, citado na ficha de mama 2024) usa taxa bruta e taxa **ajustada pela população mundial**, com o SIM no numerador e a população do TabNet no denominador. A estimativa do MS tem faixas quinquenais até **80 anos ou mais**. Portanto, a população padrão (Segi/mundial) precisa ser colapsada em 80+ para casar com as faixas disponíveis.

## 6. Conferência rápida (Recife, código 2611606)

| Ano | Total | Mulheres 25–64 | Mulheres 50–69 | 9–14 anos (ambos os sexos) |
|---|---|---|---|---|
| 2014 | 1.588.393 | 477.972 | 170.874 | 135.572 |
| 2022 | 1.594.897 | 483.470 | 200.476 | 119.647 |
| 2025 | 1.588.376 | 480.781 | 208.549 | 120.307 |

As faixas saem diretamente da soma das idades simples. O envelhecimento entre 2014 e 2025 (+22% de mulheres de 50–69 e −11% de 9–14 anos) mostra por que um denominador fixo distorce a série: é o caso do Censo 2022 aplicado a todos os anos, como faz o PNI no HPV.

---

## Recomendação (entrada para a decisão)

| Indicador | Denominador recomendado | Por quê |
|---|---|---|
| **Razão de mamografias de rastreamento** | Estimativa MS/SVS (`POPSVS`), mulheres de 50–69 anos, mesmo município e ano, **÷ 2** | É a ficha técnica do INCA e a forma usada nas pactuações via TabNet. Série anual coerente de 2016 a 2025 |
| **Razão de citopatológicos** | Estimativa MS/SVS, mulheres de 25–64 anos, mesmo município e ano, **÷ 3** | Ficha técnica do INCA. Mesmo arquivo e mesma lógica |
| **Cobertura da vacina HPV (9–14)** | **Censo 2022 (SIDRA 9514), 9–14 anos por sexo, fixo para todos os anos**, como na NT 16/2025-DPNI | É o único jeito de bater com o painel oficial de cobertura, que é a referência que o cidadão e o gestor veem. Custo: a série fica sensível ao envelhecimento da população e ainda há municípios acima de 100%. Alternativa a decidir: usar `POPSVS` 9–14 por ano (mais correta demograficamente, mas não bate com o oficial). Em qualquer caso, limitar a exibição a 100% com nota |
| **Taxa de mortalidade padronizada** | Estimativa MS/SVS por sexo e faixa quinquenal até 80+, mesmo município e ano (ou soma dos anos do período agregado), padronizada pela população mundial colapsada em 80+ | Mesma base do TabNet e do INCA. Série única de 2000 a 2025, sem quebra de método |
| **% de casos tratados em até 60 dias** | **Nenhum**. O denominador são os próprios casos do Painel-Oncologia | Proporção interna do sistema |

Regras práticas para o pipeline:
- Baixar `POPSBR00–25.zip` do FTP (~90 MB no total). Ler com `dbfread`, normalizar os nomes de colunas para minúsculas e cortar o código para 6 dígitos.
- Para um ano sem arquivo de população (por exemplo, 2026 hoje), usar o **ano anterior** e marcar o valor como provisório. Quando o arquivo novo sair, verificar se os anos anteriores foram regravados.
- Na validação, comparar contra o **TabNet atual**, nunca contra publicações anteriores a 2025, que usaram a série antiga superestimada.
