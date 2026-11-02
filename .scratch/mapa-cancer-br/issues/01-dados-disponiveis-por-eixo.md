# Quais dados públicos existem para cada eixo?

Type: research
Status: resolved
Blocked by:

## Question

Existem dados públicos suficientes para montar o mapa? Para cada eixo (Prevenção, Detecção precoce, Acesso ao tratamento, Panorama/tendência de mortalidade), levantar as fontes candidatas: SI-PNI (HPV), Vigitel/PNS (tabagismo), SIA/SISCAN (rastreamento), CNES (CACON/UNACON), PAINEL-Oncologia (tempo até tratamento), Estimativas INCA, SIM e RCBP/RHC. Para cada fonte, responder:
- granularidade (município ou UF)
- série histórica disponível (anos)
- forma de acesso (download, API, TabNet, FTP de DBC, pacotes como PySUS ou microdatasus) e formato
- licença e termos de uso
- frequência de atualização e defasagem
- lacunas e problemas conhecidos de qualidade

Conclusão esperada: quais eixos são viáveis no MVP e com quais indicadores candidatos.

## Answer

Sim. Há dados públicos e abertos (Decreto 8.777/2016) para os quatro eixos, com pelo menos um indicador por eixo em **nível municipal** e série de 10 anos ou mais. Detalhes e fontes em [research/01-dados-disponiveis-por-eixo.md](../research/01-dados-disponiveis-por-eixo.md).

- **Acesso ao tratamento (mais forte):** o Painel-Oncologia tem microdado nacional em DBC no FTP (2013–2026, atualização mensal) com município de residência, diagnóstico e tratamento. Permite medir a % tratada em até 60 dias, o tempo mediano e a % tratada fora do município. O CNES (habilitações) dá os CACON/UNACON para o "onde me tratar".
- **Detecção precoce:** o SISCAN tem CSV no FTP (2013–2025) por município de residência, com mamografia e citopatológico. Indicador: razão de exames por população-alvo. Cobre só o SUS.
- **Prevenção:** o SI-PNI novo tem CSV mensal (2020–2026, ~1,4 GB por mês) com município e registros `HPV4`, o que permite calcular a cobertura HPV municipal. Há quebra de série em 2020 e mudança para dose única em 2024. Tabagismo existe só por capital (Vigitel 2006–2024) ou UF (PNS 2013/2019).
- **Panorama:** o SIM (1996–2024 finais, 2025–26 preliminares) permite tendência municipal padronizada, suavizada para municípios pequenos. A incidência existe só por UF e capital (INCA 2026–2028). O RCBP é inviável como camada nacional.
- Riscos: instabilidade em municípios pequenos, cobertura só do SUS, volume do SI-PNI e do SISCAN no pipeline, e completude de estadiamento e de "sem informação de tratamento".
