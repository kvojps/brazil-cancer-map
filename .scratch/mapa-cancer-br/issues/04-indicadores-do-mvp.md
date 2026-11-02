# Quais indicadores entram no MVP?

Type: grilling
Status: resolved
Assignee: Kvojps (claude session 2026-11-02)
Blocked by: 01, 08, 10

## Question

Com os dados viáveis em mãos, quais indicadores entram no MVP em cada eixo, com qual granularidade e período, e quais ficam para a v2? Inclui decidir como cada indicador comunica "esperança + situação".

## Answer

Decidido em grilling em 2026-11-02.

**Tipos de câncer.** O seletor tem **5 tipos**: mama, colo do útero, próstata, colorretal e pulmão. A visão padrão continua sendo "Todos os cânceres". O **estômago fica para a v2**, porque não se sustenta no Acesso ao tratamento ([Qual a qualidade dos dados dos outros tipos de câncer por UF?](10-medir-completude-outros-tipos.md)), e um tipo com só um eixo preenchido pareceria quebrado.

**Indicadores do MVP**

| Eixo | Indicador | Fonte | Granularidade | Período | Tipos |
|---|---|---|---|---|---|
| Acesso ao tratamento | **% de casos com 1º tratamento em até 60 dias**, sempre com a % "sem informação de tratamento" ao lado | Painel-Oncologia | Município de residência | 2014–último ano, com os 2 últimos provisórios | Todos + 5 tipos. Próstata leva uma ressalva fixa (vigilância ativa) |
| Acesso ao tratamento | **Onde se tratar**: CACON/UNACON e radioterapia habilitados mais próximos | CNES | Estabelecimento | Situação atual | Todos |
| Detecção precoce | **Razão de mamografias de rastreamento** em mulheres de 50–69 anos | SISCAN | Município | 2016–2025 | Mama, Todos |
| Detecção precoce | **Razão de citopatológicos** em mulheres de 25–64 anos | SISCAN | Município | 2016–2025 | Colo do útero, Todos |
| Prevenção | **Cobertura da vacina HPV** em 9–14 anos, meninas e meninos juntos (o detalhe por sexo aparece ao abrir o cartão) | SI-PNI novo | Município | 2020–último ano, com marca na mudança para dose única (2024) | Colo do útero, Todos |
| Prevenção | **% de fumantes adultos**, exibido como "na capital do seu estado" | Vigitel | Capital da UF | Série do Vigitel | Pulmão, Todos |
| Panorama | **Tendência da mortalidade** padronizada por idade | SIM | Município (com a regra de agregação da Apresentação responsável) | 2014–2024, sem os anos preliminares | Todos + 5 tipos |
| Panorama | **Casos novos estimados** (contexto, sem série) | Estimativa INCA 2026–2028 | UF e capital | Edição atual | Todos + 5 tipos |

**Definição de "Todos os cânceres" por eixo.** No Acesso ao tratamento, "Todos" é C00–C97 sem C44, C73 e C76–C80, por causa da qualidade do Painel. No Panorama, é C00–C97 sem C44, que é o padrão da mortalidade. A diferença é explicada numa nota de método.

**Eixo sem indicador para um tipo:** o eixo mostra a justificativa e uma Ação alternativa.
- Detecção precoce de próstata, colorretal e pulmão: não há rastreamento organizado no SUS, e o INCA desaconselha o PSA para quem não tem sintomas. A Ação é "conheça os sinais".
- Prevenção de mama, próstata e colorretal: não há indicador com dado aberto. A Ação é sobre fatores de risco.

**Como cada indicador comunica "esperança + situação".** Todo indicador usa o mesmo cartão:
1. **Situação:** o valor do último ano consolidado comparado a uma **Referência**. É a meta oficial quando ela existe (100% em até 60 dias, pela Lei 12.732/2012) e o valor do Brasil quando não existe.
2. **Tendência:** a direção nos últimos anos (melhorando, estável ou piorando), dita com honestidade.
3. **Ação:** o que fazer, ou por que não há Ação.

Não há ranking entre municípios, porque ele é punitivo e instável em municípios pequenos.

**Ficam para a v2:** o estômago; o tempo mediano até o tratamento; a % tratados fora do município (ambígua, porque em município pequeno tratar fora é o esperado); a série antiga do HPV (2014–2019, com quebra de método); a PNS; excesso de peso e álcool; a hepatite B; a produção SIA-SUS e APAC; o RHC; e o estadiamento do Painel (descartado em [Qual a qualidade dos dados de mama e colo do útero por UF?](09-medir-completude-por-uf.md)).
