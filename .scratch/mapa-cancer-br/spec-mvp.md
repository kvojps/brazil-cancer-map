# Spec do MVP — Observatório do Câncer no Brasil

Consolidação de 2026-11-02 de [Consolidar a spec do MVP](issues/23-consolidar-spec.md). Esta spec **não decide nada**: cada regra aponta para o ticket que a decidiu, e o ticket prevalece em caso de divergência. Os termos em maiúscula (Eixo, Indicador, Tendência, Situação, Referência, Ação, Região imediata, Dado insuficiente, Mapa inicial, Meu município, Tipo de câncer) seguem o [`GLOSSARY.md`](../../GLOSSARY.md).

Pendências de spec: os dois pontos que os tickets não tinham fixado viraram tickets próprios e já foram resolvidos (seção 17).

---

## 1. Decisão e posicionamento

- **Go.** A lacuna está aberta: não existe mapa municipal, voltado ao cidadão, que junte os quatro eixos e ligue o dado a uma Ação. Os quatro eixos têm dado aberto. O que mais se aproxima é o Radar do Câncer (Oncoguia), mas ele só vai até a UF. Fontes: [Vale construir, e como se diferenciar?](issues/05-go-no-go-e-posicionamento.md), [Já existe alguma solução que faz isso?](issues/02-solucoes-existentes.md). A qualidade medida confirmou o go: [Qual a qualidade dos dados de mama e colo do útero por UF?](issues/09-medir-completude-por-uf.md).
- **Posicionamento:** "Veja como está o cuidado com o câncer no seu município, e o que você pode fazer."
- **Diferenciais obrigatórios:** (1) granularidade municipal; (2) todo dado ligado a uma Ação; (3) Tendência no lugar de contagem de óbitos; (4) dados abertos para download e código aberto; (5) os quatro eixos num lugar só.
- **Tom:** esperança com honestidade. Não se promete melhora onde o dado mostra piora, e não há ranking entre municípios.
- **Oncoguia:** o site cita e linka o Radar do Câncer como fonte complementar. Uma parceria ativa fica para depois.

## 2. Identidade, licenças e requisitos de lançamento

Fontes: [Qual o nome, o domínio e a licença do projeto?](issues/22-nome-dominio-licenca.md), [Qual licença expressa a abertura aprovada para o código?](issues/24-licenca-do-codigo.md).

- **Nome:** Observatório do Câncer no Brasil. **Subtítulo:** "Dados sobre o câncer no seu município, para entender e agir".
- **Endereço:** o subdomínio gratuito da hospedagem (por exemplo `*.pages.dev`), conforme a disponibilidade no momento da publicação. Domínio próprio pago não entra no MVP.
- **Custo zero:** hospedagem, endereço e execução do pipeline não podem gerar custo, e o acesso é gratuito.
- **Código:** `AGPL-3.0-or-later`. O repositório precisa ter um arquivo `LICENSE` com o texto da AGPL-3.0, a declaração da licença no README e um link para o código-fonte no rodapé do site.
- **Textos do projeto** (Ações, metodologia, notas, ressalvas e glossário): CC BY-SA 4.0, com atribuição ao Observatório do Câncer no Brasil.
- **Dados:** os dados de terceiros seguem as condições de cada fonte, e os arquivos que o pipeline gera não são cobertos pela licença do código. A metodologia e cada arquivo exportado identificam a fonte, o período e as condições de reutilização. Quem citar o observatório deve citar também as fontes originais.
- **Contribuições:** entram sob a licença da parte alterada, sem CLA.
- **Acessibilidade** (requisito de lançamento, sem certificação formal de WCAG ou eMAG): toda informação do mapa tem alternativa em texto ou tabela, toda interação funciona pelo teclado e nenhuma informação depende só de cor (por isso as texturas da seção 11).

## 3. Escopo

Fontes: [Qual é o recorte do MVP (tipos de câncer e região)?](issues/08-recorte-do-mvp.md), [Quais indicadores entram no MVP?](issues/04-indicadores-do-mvp.md).

- **Geografia:** o Brasil inteiro, com os 5.570 municípios da malha IBGE 2025. Nenhuma UF fica de fora. A ressalva de qualidade é por UF × tipo (seção 6.3).
- **Tipos de câncer:** a visão padrão é "Todos os cânceres", e o seletor tem **mama, colo do útero, próstata, colorretal e pulmão**.
- **Fora do MVP (v2):** estômago e os demais tipos; tempo mediano até o tratamento; % tratada fora do município; série antiga do HPV (2014–2019); PNS; excesso de peso, álcool e hepatite B; produção SIA-SUS/APAC; RHC; estadiamento do Painel; o indicador que substituirá a razão de citopatológicos; abertura do site por perfil de quem visita.
- **Fora deste projeto:** dados individuais (só agregados públicos), orientação médica personalizada, infraestrutura paga, backend ou banco de dados.

## 4. Fontes de dados

Fontes: [Quais dados públicos existem para cada eixo?](issues/01-dados-disponiveis-por-eixo.md), [Com que frequência cada fonte do MVP publica dados novos?](issues/17-calendario-das-fontes.md), [Qual a série e o formato da estimativa populacional do MS/SVS por município, sexo e idade?](issues/13-denominador-populacional.md). Endereços, tamanhos e detalhes estão nas pesquisas em `research/01`, `research/13` e `research/17`.

| Fonte | Uso no MVP | Granularidade | Acesso | Ritmo de publicação | Volume |
|---|---|---|---|---|---|
| Painel-Oncologia | % em até 60 dias; % sem informação de tratamento; faixa A/B/C | Município de residência | DBC no FTP DATASUS | Mensal, regrava todos os anos | ~0,2 GB |
| CNES (habilitações) | Onde se tratar (CACON, UNACON, radioterapia) | Estabelecimento | DBC no FTP DATASUS | Mensal (competência M por volta do dia 15 de M+1) | ~24 MB |
| SISCAN | Razão de mamografias e de citopatológicos | Município de residência | CSV no FTP | Anual, regrava tudo em janeiro de X+1 | 24,4 GB descompactado |
| SI-PNI novo | Cobertura HPV | Município | CSV mensal (S3) | Mensal, regrava o ano corrente inteiro | ~215 GB zipado; ~23–28 GB por mês |
| Vigitel | % de fumantes | Capital da UF | Microdado anual | ~20 meses após a coleta; nome do arquivo muda | pequeno |
| SIM | Tendência da mortalidade | Município de residência | `DOBR<ano>.dbc` no FTP | Ano X final em dezembro de X+1 | ~130 MB/ano |
| Estimativa INCA 2026–2028 | Casos novos estimados | UF e capital | Extração manual a cada edição | Trienal (próxima ~2029) | pequeno |
| POPSVS (MS/SVS) | Denominador de taxas e razões | Município × sexo × idade simples (0–79, 80+), 2000–2025 | `POPSBR<aa>.zip` no FTP | Anual (out/nov) | ~3,4 MB/ano |
| Censo 2022 (SIDRA 9514) | Denominador fixo do HPV | Município × sexo × idade | SIDRA | Fixo | pequeno |
| Malha municipal IBGE 2025 | Geometria e Região imediata | Município | Shapefile | Anual (fev–abr de X+1) | — |

Os endereços do FTP do DATASUS e do S3 do SI-PNI são estáveis. O portal do SI-PNI, o nome do arquivo do Vigitel e a página da Estimativa INCA mudam com frequência.

## 5. Indicadores

Fontes: [Quais indicadores entram no MVP?](issues/04-indicadores-do-mvp.md), [Qual é a Referência de cada indicador?](issues/18-referencia-de-cada-indicador.md), [Como classificar a Tendência e tratar municípios pequenos no mapa?](issues/12-tendencia-e-municipios-pequenos.md).

| Eixo | Indicador | Fonte | Granularidade | Período | Tipos | Referência | Tendência | No mapa? |
|---|---|---|---|---|---|---|---|---|
| Acesso ao tratamento | % de casos com 1º tratamento em até 60 dias, sempre com a % sem informação de tratamento ao lado | Painel-Oncologia | Município de residência | 2014 até o último ano consolidado; os 2 últimos anos ficam provisórios | Todos + 5 | 100% (Lei 12.732/2012); **próstata sem Situação** | Sim, **só sobre os casos tratados com quimio ou radio** (quasi-Poisson com offset `log(casos)`, [ticket 25](issues/25-escala-da-faixa-estavel.md), [ticket 27](issues/27-quebra-de-serie-do-painel.md)) | Sim |
| Acesso ao tratamento | Onde se tratar: CACON/UNACON e radioterapia habilitados mais próximos | CNES | Estabelecimento | Situação atual | Todos | Nenhuma (contexto) | Não | Não (só na ficha, junto do 60 dias) |
| Detecção precoce | Razão de mamografias de rastreamento, mulheres de 50–69 | SISCAN | Município | 2016–2025 | Mama, Todos | 1 (ficha do INCA) | Sim (quasi-Poisson + offset) | Sim |
| Detecção precoce | Razão de citopatológicos, mulheres de 25–64. **Série encerrada em 2025** | SISCAN | Município | 2016–2025 | Colo, Todos | 1 (ficha do INCA) | Sim, sobre 2016–2025 (quasi-Poisson + offset) | Sim |
| Prevenção | Cobertura da vacina HPV, 9–14 anos, meninas e meninos juntos (detalhe por sexo ao abrir o cartão) | SI-PNI novo | Município | 2020 até o último ano, com marca na dose única (2024) | Colo, Todos | 90% até 2030 (Plano de Dant), para o total e para cada sexo | **Não** ("série curta, ainda sem direção") | Sim, em "como está hoje" por padrão |
| Prevenção | % de fumantes adultos, "na capital do seu estado" | Vigitel | Capital da UF | Série do Vigitel | Pulmão, Todos | 5,9% (meta do Brasil para 2030), com a regra invertida | Sim (regressão ponderada pelos erros-padrão) | Não (só na ficha) |
| Panorama | Tendência da mortalidade padronizada por idade | SIM | Município, com a cascata da seção 8 | 2014–2024, sem os anos preliminares | Todos + 5 | **Nenhuma: sem Situação, só Tendência.** A Tendência do Brasil aparece como contexto, e as metas de mama (−10%) e colo (−20%, 30–69 anos) entram só como texto | Sim (quasi-Poisson + offset) | Sim, só em modo Tendência |
| Panorama | Casos novos estimados (contexto, sem série) | Estimativa INCA 2026–2028 | UF e capital | Edição atual | Todos + 5 | Nenhuma (contexto) | Não | Não (só na ficha) |

**"Todos os cânceres" muda de definição por eixo** ([Quais indicadores entram no MVP?](issues/04-indicadores-do-mvp.md), [Qual a qualidade dos dados dos outros tipos de câncer por UF?](issues/10-medir-completude-outros-tipos.md)):
- tratamento: C00–C97 sem C44, C73 e C76–C80;
- mortalidade: C00–C97 sem C44.

Códigos por tipo na mortalidade ([Como as fontes oficiais tratam C55, C26 e a padronização por idade na mortalidade?](issues/15-metodos-mortalidade.md)): mama C50 (mulheres); colo C53, com a redistribuição do C55 da seção 6.2; próstata C61; pulmão C33–C34; colorretal C18–C21.

**Eixo sem indicador para o tipo:** o eixo mostra a justificativa e a Ação alternativa (seção 10.3). Ficam vazios a Detecção precoce de próstata, colorretal e pulmão (sem rastreamento organizado com indicador aberto) e a Prevenção de mama, próstata e colorretal (sem indicador com dado aberto).

## 6. Regras de método

### 6.1 Denominadores

Fontes: [Qual stack e pipeline de dados usar?](issues/07-stack-e-pipeline.md), [Qual a série e o formato da estimativa populacional do MS/SVS por município, sexo e idade?](issues/13-denominador-populacional.md), [Qual é a Referência de cada indicador?](issues/18-referencia-de-cada-indicador.md).

- O POPSVS é o denominador padrão. A série 2000–2025 foi refeita pós-Censo 2022, sem quebra. Números oficiais publicados antes de 2025 **não batem** com ele (a estimativa antiga superestimava ~5,8%), e a validação precisa levar isso em conta.
- Mamografia: mulheres de 50–69 ÷ 2. Citopatológico: mulheres de 25–64 ÷ 3.
- HPV: **Censo 2022 fixo**, 9–14 anos por sexo, como o painel do PNI. A nota de método explica a diferença em relação ao POPSVS.
- % em até 60 dias: não usa população como denominador.
- Ano sem arquivo de população: usa o do ano anterior e marca o resultado como provisório.
- O código do município tem 6 dígitos. A malha 2025 é a referência territorial, e o município novo tem série a partir de quando passou a existir, sem recalcular o município de origem.

### 6.2 Mortalidade

Fonte: [Que regras de método e ressalvas a mortalidade e o Acesso ao tratamento mostram?](issues/19-metodo-e-ressalvas.md), com base em [Como as fontes oficiais tratam C55, C26 e a padronização por idade na mortalidade?](issues/15-metodos-mortalidade.md).

- SIM por residência, causa básica.
- Padronização direta pela população mundial de Segi/Doll, faixas quinquenais de 0–4 a 75–79 e última faixa 80+. Os pesos e a fórmula são publicados na metodologia.
- **Redistribuição do C55 (só no colo do útero):** a proporção C53/(C53+C54) da UF de residência × ano × faixa etária é aplicada aos C55 do município, preservando valores fracionários, e o C54 recebe o restante. O total de "Todos" não muda. Se C53+C54 = 0 na UF, usa-se a proporção nacional do mesmo ano e idade. Se nem ela puder ser calculada, o resultado fica sinalizado como "ajuste não calculável".
- Nota visível no cartão do colo: **"Estimativa ajustada para registros sem localização definida; pode diferir do INCA."**
- C26, R00–R99 e C76–C80 ficam sem redistribuição e entram como limitações declaradas.
- A execução deve validar a série ajustada completa. A pesquisa só mediu o efeito sobre as contagens, então a metodologia não pode apresentá-lo como efeito comprovado na classe da Tendência.

### 6.3 Qualidade do Acesso ao tratamento (faixas A/B/C)

Fontes: [Que regras de método e ressalvas a mortalidade e o Acesso ao tratamento mostram?](issues/19-metodo-e-ressalvas.md), [Qual a qualidade dos dados dos outros tipos de câncer por UF?](issues/10-medir-completude-outros-tipos.md).

- A faixa é calculada por **UF × tipo selecionado** (inclusive "Todos"), sobre os últimos cinco anos consolidados, e o período aparece na tela. Não se usa uma lista fixa de UFs.
- A: até 15% sem informação de tratamento; B: acima de 15% e abaixo de 35%; C: 35% ou mais.
- Na faixa C, o indicador de tratamento correspondente ganha hachura e o aviso: **"Muitos casos estão sem informação de tratamento; o resultado pode não representar toda a situação."** A hachura não se aplica aos outros eixos.
- A % sem informação de tratamento aparece sempre ao lado da % em até 60 dias, porque falta de registro não significa falta de tratamento.
- A faixa, a % sem informação, o valor e a Situação do 60 dias usam **todos os casos diagnosticados**, como o TabNet. Só a Tendência usa o recorte de quimio e radio (seção 7). Os 5 anos da faixa (hoje 2020–2024) ficam todos depois da quebra de 2018 (seção 6.4), então ela não é afetada ([ticket 27](issues/27-quebra-de-serie-do-painel.md)).
- Próstata leva uma ressalva fixa (a vigilância ativa é conduta correta) e não tem Situação.

### 6.4 Anos provisórios e séries especiais

- Painel: os 2 últimos anos de diagnóstico são provisórios. SIM: os anos preliminares ficam fora. Os anos provisórios aparecem tracejados no gráfico e não entram na Tendência ([Como classificar a Tendência e tratar municípios pequenos no mapa?](issues/12-tendencia-e-municipios-pequenos.md)).
- HPV: a mudança para dose única em 2024 fica marcada na série. A contagem oficial é "ao menos uma dose" em todos os anos.
- Painel: **quebra de série em maio de 2018** ([ticket 27](issues/27-quebra-de-serie-do-painel.md)). Com a Portaria SAS nº 643/2018, o exame anatomopatológico (BPA-I) passou a criar casos, os sem tratamento registrado e os operados. A % sem informação vai de ~4% para ~30% (com um segundo degrau em maio de 2019), e a série de todos os casos não é comparável antes e depois. Os casos tratados com quimio ou radio (APAC) não têm degrau, por isso a Tendência usa só eles (seção 7).
- Painel: **queda das cirurgias a partir de abril de 2024**, de ~6 mil para ~2 mil casos por mês, sem explicação oficial e investigada no [ticket 28](issues/28-queda-das-cirurgias-em-2024.md). Ela rebaixa a % em até 60 dias de todos os casos em 2024. O cartão e a metodologia levam a nota de 2024 (seção 11.2). A Tendência de quimio e radio não é afetada.
- Citopatológico: a série fica congelada em 2025 e não recebe anos novos ([Qual é a Referência de cada indicador?](issues/18-referencia-de-cada-indicador.md), [Quando e onde o pipeline roda para atualizar os dados?](issues/21-atualizacao-dos-dados.md)).

## 7. Tendência

Fonte: [Como classificar a Tendência e tratar municípios pequenos no mapa?](issues/12-tendencia-e-municipios-pequenos.md), com base em [Que métodos existem para classificar tendência e estabilizar taxas de municípios pequenos?](issues/11-metodos-tendencia-e-pequenos-numeros.md). Escala e modelos: [Em que escala vale a faixa de "estável" (±1% ao ano) para proporções, razões e tabagismo?](issues/25-escala-da-faixa-estavel.md).

- **Cálculo:** uma única variação anual sobre os últimos até 10 anos consolidados (SIM 2014–2024; Painel de 2014 ao último ano consolidado; SISCAN 2016–2025), com IC 95%. Não há Joinpoint nem Prais-Winsten no MVP. Uma virada recente aparece no gráfico, não na classe.
- **Escala única:** toda Tendência é uma **variação percentual anual**, relativa ao próprio valor do indicador. Nunca se usam pontos percentuais nem razão de chances.
- **Modelos:**
  - quasi-Poisson com offset de população (mortalidade padronizada e razões do SISCAN);
  - quasi-Poisson com ligação log e offset `log(casos)` ("Poisson modificado") para o 60 dias, **só sobre os casos cujo primeiro tratamento foi quimioterapia, radioterapia ou ambos** (`TRATAMENTO` 2, 3 ou 4): numerador = esses casos em até 60 dias; denominador = esses casos. Esse recorte atravessa sem degrau as quebras do Painel de 2018, 2019 e 2024 (seção 6.4, [ticket 27](issues/27-quebra-de-serie-do-painel.md)). Vale para todos os tipos;
  - regressão ponderada de `log(prevalência)` contra o ano, com peso 1/EP² e EP do log = EP/prevalência tirado do IC do Vigitel, para o tabagismo na capital.
- **Classes:**
  - **melhorando** ou **piorando** quando o IC exclui zero (o sentido de "melhorando" depende do indicador);
  - **estável** quando o IC inteiro cabe em **±1% ao ano (relativo)**, com o mesmo corte para todos os indicadores. É uma convenção do projeto, mais tolerante que a do NCI (±0,5%);
  - **sem direção clara** quando o IC é largo e inclui zero.
- **Dado insuficiente** não é uma classe (seção 8).
- **Esperado:** com amostras pequenas, "estável" quase nunca aparece. O tabagismo na capital fica em melhorando/piorando ou sem direção clara, e o 60 dias só chega a "estável" com cerca de 400 casos por ano (capitais e regiões grandes).
- **HPV:** sem Tendência estatística.

## 8. Municípios pequenos

Fonte: [Como classificar a Tendência e tratar municípios pequenos no mapa?](issues/12-tendencia-e-municipios-pequenos.md).

- **Mínimo:** média de pelo menos 20 por ano na janela. Nas taxas, conta o numerador (óbitos, exames). Nas proporções e coberturas, conta o denominador da Tendência (no 60 dias, os casos tratados com quimio ou radio, [ticket 27](issues/27-quebra-de-serie-do-painel.md); no HPV, a população de 9–14 anos). A origem que esse mínimo escolhe vale para o cartão inteiro, Situação inclusive.
- **Cascata por indicador × tipo**, igual para a Tendência e para a Situação: o município usa o próprio dado se passar do mínimo; se não passar, usa o da **Região imediata** (IBGE, 510 regiões, código já na malha) se ela passar; senão fica como **dado insuficiente**. Nunca se sobe para a UF.
- A suavização bayesiana foi descartada.
- A contagem bruta do município com dado insuficiente não é exibida.
- A mesma regra vale no mapa e na ficha. Todo o cálculo fica no pipeline.

## 9. Referência e Situação

Fonte: [Qual é a Referência de cada indicador?](issues/18-referencia-de-cada-indicador.md), com base em [Que metas oficiais existem para os indicadores do MVP?](issues/14-metas-oficiais.md).

- Referências e textos para o público: 60 dias = 100% ("o que a lei garante"); mamografia e citopatológico = razão 1 ("meta"); HPV = 90% ("meta para 2030"; o cartão diz que a meta da OMS é para meninas); tabagismo = 5,9% ("meta do Brasil para 2030"). Mortalidade, casos estimados e onde se tratar não têm Referência.
- **Situação** é o valor do último ano consolidado comparado à Referência.
- **"Como está hoje": 3 faixas fixas**, nunca quantis:
  - **alcançou:** ≥ Ref (no tabagismo, ≤ Ref);
  - **perto:** ≥ 0,8 × Ref (no tabagismo, ≤ 7,4%);
  - **longe:** o resto.
- Valores acima do possível (HPV acima de 100%, razão muito acima de 1) entram como "alcançou", sem cortar o número, com a nota "valor acima do esperado, provavelmente erro no registro ou na estimativa de população".
- Mamografia fica em 50–69, embora a orientação vigente seja 50–74 (NT 626/2025). O tema é revisto quando o INCA publicar uma ficha para 50–74.

## 10. Ações

Fonte: [Que Ação cada indicador mostra, e quem valida o conteúdo?](issues/20-conteudo-das-acoes.md), com base em [O que o SUS e a lei garantem ao cidadão em cada Ação?](issues/16-direitos-e-orientacoes-sus.md).

### 10.1 Comportamento

- A Ação aparece **sempre**, inclusive com Situação boa, Tendência melhorando ou dado insuficiente. A cor do mapa não determina conduta.
- Cada cartão traz um próximo passo em 1–2 frases e um "Saiba mais" com público, critérios, exceções, fontes e canais.
- O conteúdo parte da orientação nacional. Oferta local só aparece com fonte verificável: anúncio de oferta não basta.
- Aviso junto às Ações: **"Informação geral. A equipe de saúde orienta o cuidado indicado para você."** A metodologia explica que o dado do município não estima o risco individual.

### 10.2 Textos curtos aprovados

| Indicador | Ação |
|---|---|
| Tratamento em até 60 dias | **Conheça seus direitos e acompanhe seu encaminhamento.** Se estiver esperando para começar o tratamento, veja os prazos e os canais de ajuda. |
| Onde se tratar | **Saiba como chegar ao atendimento especializado.** Pergunte à equipe que acompanha você sobre o encaminhamento e o serviço de referência. |
| Mamografia | **Converse na UBS sobre quando fazer a mamografia.** Informe sua idade, seu histórico e qualquer alteração nas mamas. |
| Exame do colo do útero | **Confira na UBS se seu exame está em dia.** Pergunte sobre o exame indicado e a disponibilidade do teste de HPV ou do Papanicolau. |
| Vacinação HPV | **Confira sua vacinação contra o HPV.** Leve sua caderneta à UBS para verificar se há dose indicada para você. |
| Tabagismo | **Quer parar de fumar? Procure apoio.** Pergunte na UBS onde encontrar atendimento para parar de fumar. |
| Tendência de mortalidade | **Veja os caminhos de prevenção e cuidado.** Este dado descreve o território e não determina seu risco individual. |
| Casos estimados | **Explore as orientações de prevenção e detecção precoce.** A estimativa do estado não prevê quem terá câncer. |

O "Saiba mais" do 60 dias traz os direitos e canais: Lei 12.732/2012 (60 dias), Lei 13.896/2019 (30 dias para os exames de diagnóstico), secretaria de saúde, Ouvidoria do SUS 136, Defensoria Pública e Ministério Público. O de Onde se tratar explica que a regulação define o hospital e que o paciente não escolhe.

### 10.3 Eixos sem indicador e diferenças por tipo

- **Próstata e pulmão:** "Conheça os sinais e saiba quando procurar avaliação", com link oficial do tipo.
- **Colorretal:** "Conheça os sinais e pergunte na UBS sobre a indicação e a disponibilidade de exames de rastreamento". O FIT só é explicado nos detalhes, depois de conferidas as fontes, sem prometer oferta local e sem indicador de cobertura de FIT.
- **Mama e colo:** reaproveitam as Ações de exame. A mamografia distingue a faixa do indicador (50–69) da orientação vigente. O colo explica a transição entre DNA-HPV e Papanicolau.
- **Prevenção sem indicador:** fatores de risco, explicando que reduzir riscos não garante evitar o câncer.
- **Todos:** as orientações ficam organizadas por tipo, sem uma recomendação única de exame.
- **Panorama:** remete às Ações de prevenção e cuidado do tipo, sem sugerir conduta a partir da mortalidade local.

### 10.4 Validação editorial (requisito de publicação)

- O responsável pelo projeto convida um **profissional de saúde revisor** para os textos sobre exames, sintomas e vacinação. **O nome ainda não foi definido.**
- Cada Ação registra fonte oficial, data de conferência, público, critérios, exceções, versão revisada, data e responsável pela revisão.
- Faixas etárias, intervalos, exceções e disponibilidade (inclusive 50–74 na mamografia, o FIT e o resgate do HPV para 15–19 anos até 31/12/2026) são reconferidos nas fontes oficiais antes de publicar.
- Toda alteração clínica posterior exige nova revisão, e orientações temporárias têm data de revisão.

## 11. Experiência

Fontes: [Como a experiência "meu município" deve parecer?](issues/06-experiencia-meu-municipio.md) (protótipo no branch `prototype/06-meu-municipio`, nunca mergeado), [Como classificar a Tendência e tratar municípios pequenos no mapa?](issues/12-tendencia-e-municipios-pequenos.md), [Qual é a Referência de cada indicador?](issues/18-referencia-de-cada-indicador.md), [Que regras de método e ressalvas a mortalidade e o Acesso ao tratamento mostram?](issues/19-metodo-e-ressalvas.md).

### 11.1 Mapa inicial

- A página inicial é o mapa do Brasil por município. No topo ficam a busca de município, o seletor de Tipo de câncer e o seletor do que o mapa mostra (indicador e modo).
- **Estado inicial:** até 60 dias × Todos os cânceres × Tendência, com a hachura da faixa C já na primeira impressão ([Com que indicador, tipo e modo o Mapa inicial abre?](issues/26-estado-inicial-do-mapa.md)).
- **Estado na URL:** o município no caminho (`/municipio/<slug>/`); indicador, tipo e modo na query string, omitindo os valores padrão. Nada é lembrado entre visitas: sem parâmetros, o site abre no estado inicial.
- **Combinações que não existem:** ao trocar para um tipo sem aquele indicador, o mapa volta para o até 60 dias com um aviso de uma linha, e o seletor mostra os indicadores que não se aplicam desabilitados, com o motivo. Um link inválido é corrigido em silêncio, campo a campo (valor desconhecido → padrão; modo impossível → o modo que o indicador tem), e a URL é reescrita para o estado mostrado.
- Indicadores que pintam o mapa: até 60 dias, mamografia, citopatológico, HPV e tendência da mortalidade, filtrados pelo tipo. Tabagismo, Onde se tratar e Casos estimados ficam só na ficha.
- **Modo padrão: Tendência.** "Como está hoje" é opcional. A mortalidade só tem Tendência. O HPV abre em "como está hoje", com uma nota no seletor explicando por quê.
- **Cores da Tendência** (sem vermelho): melhorando em verde-azulado; piorando em âmbar; estável em cinza médio; sem direção clara em cinza claro; dado insuficiente em quase branco com **textura de pontos**, nunca branco puro.
- **Cores da Situação:** uma escala de um só tom em 3 passos, mais escura quanto mais perto da Referência e diferente das cores da Tendência.
- **Texturas:** pontos só para dado insuficiente; hachura diagonal só para a faixa C, e só no indicador de tratamento correspondente. O município que usa o dado da Região imediata recebe a cor da região, sem textura.
- **Legendas:**
  - Tendência: "A cor mostra como o indicador mudou ao longo dos anos. Não é um ranking entre municípios." (5 entradas). Entre elas: "**Estável**: quase não mudou, menos de 1% por ano em relação ao próprio valor." e "**Sem direção clara**: pode ter subido ou caído; os dados não bastam para dizer." Os mesmos textos valem no cartão, que mostra a classe e a série, sem o número da variação.
  - Situação: "A cor mostra a distância até a referência. Não é um ranking entre municípios."
- **Tooltip:** nome do lugar, indicador, período, classe e origem geográfica do dado. Quando usa a região: **"Seu município e vizinhos — região de X"**.
- **Interação:** clicar num município ou buscá-lo aproxima o mapa no estado, contorna o município e abre a ficha ao lado (embaixo, no celular).

### 11.2 Meu município (ficha)

- Os quatro eixos ficam empilhados, com o **Acesso ao tratamento primeiro**. Onde se tratar fica junto do 60 dias.
- **Cartão de indicador:** Situação (valor e barra contra a Referência), Tendência (série com os anos provisórios tracejados) e Ação. Também há "O que é este número?" (explicação e fonte), "Como calculamos" (link para a metodologia, seção 12), o **período dos dados em destaque** e a data de atualização nos detalhes.
- **Dado da região:** "Seu município e vizinhos (região de X)", com a série e a Situação da região e uma nota de uma linha com o motivo.
- **Dado insuficiente:** "Poucos casos aqui para dizer a direção. Isso é comum em municípios pequenos e não é um problema do seu município." O cartão mostra a Tendência da UF como contexto ("no seu estado") e mantém a Ação.
- **Cartão do 60 dias** ([ticket 27](issues/27-quebra-de-serie-do-painel.md)): o gráfico mostra a série da Tendência, com o título "Casos tratados com quimioterapia ou radioterapia: % que começou em até 60 dias", para que a linha e a cor nunca se contradigam. A barra da Situação mostra o valor de todos os casos, com a % sem informação ao lado. Notas: "A direção é medida nos casos tratados com quimioterapia ou radioterapia, cujo registro não mudou desde 2014. Em 2018, o painel passou a incluir diagnósticos por biópsia, o que mudou a contagem dos demais casos." e, enquanto o último ano for 2024, "Em 2024, caiu o registro de cirurgias no painel do Ministério da Saúde; o valor deste ano pode estar abaixo do real." Esses textos ainda precisam de aprovação.
- **Ressalvas no cartão:** a faixa C abre com aviso e mostra a % sem informação de tratamento; próstata tem a ressalva fixa; HPV marca a dose única e a nota do Censo 2022; mamografia explica 50–69 vs 50–74; citopatológico diz "Série encerrada em 2025 pela mudança no rastreamento", com a ressalva do DNA-HPV; colo do útero leva a nota do ajuste do C55.
- **Nota de "Todos os cânceres"** junto ao seletor: "Cada eixo usa os registros adequados ao seu indicador. No tratamento, excluímos alguns tipos com informação incompleta. Por isso, 'Todos os cânceres' não reúne exatamente os mesmos tipos em todos os eixos."
- A página de cada município funciona sem JavaScript para a leitura básica.

## 12. Metodologia pública ("Como calculamos")

Fonte: [Que regras de método e ressalvas a mortalidade e o Acesso ao tratamento mostram?](issues/19-metodo-e-ressalvas.md#seção-pública-de-metodologia-requisito-do-mvp).

É uma seção do site, em linguagem simples e com detalhe técnico suficiente para reproduzir cada número. Ela só detalha regras desta spec e não cria regra nova. Para **cada indicador**, documenta:

1. fonte oficial e links, arquivos ou edição usados, data de extração e período coberto;
2. universo, unidade, residência ou estabelecimento, recortes de sexo e idade, códigos e exclusões;
3. numerador, denominador, fórmulas, população de referência e pesos (Segi com 80+);
4. limpeza, cruzamentos, registros ausentes, ajustes, redistribuições (C55) e regras de fallback (proporção nacional, "ajuste não calculável");
5. janela temporal, anos provisórios, consolidação, quebras de série (HPV 2024; Painel em maio de 2018 e nas cirurgias de 2024, com a escolha do recorte de quimio e radio para a Tendência e o efeito medido no [ticket 27](issues/27-quebra-de-serie-do-painel.md)) e congelamentos (citopatológico);
6. método da Tendência (variação percentual anual, nunca pontos percentuais, com o exemplo do tabagismo: de 9% para 8% é uma queda de 11%), modelo de cada indicador, incerteza, critérios das classes (±1% como convenção do projeto, com o aviso de que amostras pequenas raramente chegam a "estável"), Referência e cortes de Situação (inclusive a regra invertida do tabagismo e os valores acima do esperado);
7. mínimo de casos, substituição pela Região imediata e dado insuficiente;
8. qualidade por UF × tipo, limitações (C26, R00–R99, C76–C80, cobertura só do SUS), diferenças em relação aos painéis oficiais (POPSVS revisto, C55, Censo 2022 no HPV) e validações feitas;
9. versões do código e dos dados, acesso aos scripts e aos agregados, e histórico das revisões que alteram resultados.

Inclui ainda: as duas definições de "Todos os cânceres"; a explicação de que o dado do município não estima o risco individual; e as condições de reutilização e a forma de citar cada fonte (seção 2). Os links oficiais são reconferidos na execução.

## 13. Stack e arquitetura

Fontes: [Qual stack e pipeline de dados usar?](issues/07-stack-e-pipeline.md), [Como servir um mapa municipal do Brasil num site estático gratuito?](issues/03-hospedagem-e-mapa-estatico.md).

- **Monorepo** com `pipeline/` e `site/`.
- **Site:** Astro com saída estática. Tem uma página por município (`/municipio/<código>-<nome>`, ~5.570 HTMLs) mais a página do mapa e a metodologia.
- **Mapa:** uma ilha em TypeScript + MapLibre GL JS (BSD-3), com TopoJSON da malha IBGE 2025 simplificado a 1–2% com mapshaper (~0,6–0,9 MB gzip), sem as 2 lagoas, **sem mapa base**, com `promoteId: "CD_MUN"` e `feature-state` para trocar indicador e ano.
- **O front não faz conta estatística.** Taxa, razão, classe da Tendência, Situação, cascata e faixa A/B/C chegam prontas do pipeline.
- **Hospedagem:** Cloudflare Pages, com GitHub Pages como alternativa equivalente. O orçamento estimado é ~1,3 MB na primeira visita e menos de 30 MB no site inteiro. Não usa DuckDB-WASM nem PMTiles.

## 14. Pipeline

Fontes: [Qual stack e pipeline de dados usar?](issues/07-stack-e-pipeline.md), [Quando e onde o pipeline roda para atualizar os dados?](issues/21-atualizacao-dos-dados.md).

Python + DuckDB (pandas onde já existe código). O comando é `python -m pipeline run`, que também roda uma fonte ou etapa por vez, tanto na máquina do mantenedor quanto no CI.

1. **Baixar:** um baixador por fonte, com cache incremental em `data/raw/` (compara tamanho e data) e novas tentativas contra falhas do FTP. O dado bruto nunca entra no git. SI-PNI e SISCAN são processados um arquivo por vez, em fluxo, apagando o bruto.
2. **Limpar:** um módulo por fonte gera Parquet padronizado em `data/clean/` (código IBGE de 6 dígitos, ano, tipo, sexo, faixa etária e contagem). Os DBC passam por `datasus_dbc` + `dbfread`, e os CSVs grandes pelo DuckDB. Aqui entram as exclusões de CID, a marca de ano provisório e a redistribuição do C55.
3. **Calcular:** uma função testável por indicador, com o denominador, a Situação, a Tendência, a cascata e a faixa A/B/C. É o único lugar com estatística.
4. **Validar:** compara com os números oficiais (por exemplo a % em até 60 dias por UF contra o TabNet; contagens exatas e taxas do SIM com ±3% contra o Atlas do INCA, considerando o POPSVS revisto), confere a presença dos 5.570 municípios e a faixa plausível dos valores. **Se falhar, nada daquela fonte é publicado.**
5. **Exportar:** gera o contrato de dados (seção 15).

## 15. Contrato de dados

Fonte: [Qual stack e pipeline de dados usar?](issues/07-stack-e-pipeline.md), complementado por [Quando e onde o pipeline roda para atualizar os dados?](issues/21-atualizacao-dos-dados.md). É a única fronteira entre `pipeline/` e `site/`.

- **Camada do mapa:** um JSON por indicador × tipo, com os 5.570 municípios. Cada um traz a classe da Tendência, o último valor e a faixa de qualidade (e, pelas seções 8 e 9, a faixa de Situação e a origem do dado: município, região ou insuficiente).
- **Camada da ficha:** um JSON por UF, com a série completa de todos os indicadores e tipos dos seus municípios. Carrega quando o mapa aproxima no estado.
- **`manifest.json`:** a data de extração de cada fonte, a versão do pipeline e o período publicado de cada indicador.
- Os JSON ficam **commitados** em `site/public/dados/`, e o deploy é só `astro build`.
- O **Parquet/CSV** completo vai como asset de uma **GitHub Release** por versão. Serve de download aberto e permite reconstruir o site sem o pipeline. Cada arquivo identifica a fonte, o período e as condições de reutilização.

## 16. Atualização e operação

Fontes: [Quando e onde o pipeline roda para atualizar os dados?](issues/21-atualizacao-dos-dados.md), [Com que frequência cada fonte do MVP publica dados novos?](issues/17-calendario-das-fontes.md).

- **Por fonte, de forma independente:**
  - checagem mensal para Painel-Oncologia, CNES e HPV;
  - checagem anual conforme o calendário da fonte para as séries anuais;
  - Estimativa INCA a cada edição.

  Checar uma fonte não significa publicar um período novo: valem as regras de ano consolidado. O citopatológico não recebe anos novos.
- **Onde roda:** GitHub Actions agendado num repositório público, com runners padrão gratuitos e acionamento manual. Os jobs são particionados (SI-PNI com um job por ano). Agregados e estado incremental ficam em assets de Release (< 2 GiB por arquivo), e não só no cache de 7 dias. O CI não guarda o acervo bruto do SI-PNI. A carga inicial pode rodar na máquina do mantenedor.
- **Medir na implementação** a duração e o pico de disco, sobretudo do SI-PNI (limites: 14 GB de disco, 6 h por job). O que não couber roda na máquina do mantenedor, sem custo.
- **Atenção:** agendamentos são desativados depois de 60 dias sem atividade no repositório, e o acionamento manual continua disponível.
- **Falha de validação ou mudança de formato:**
  - a fonte afetada não publica, mantém a última versão válida, registra a falha e avisa o mantenedor pelo CI;
  - as fontes independentes seguem atualizando, mas indicadores e denominadores dependentes ficam juntos, sem combinações inconsistentes;
  - uma tentativa que falhou não renova a data exibida.

## 17. Pendências

### Lacunas encontradas na consolidação (viraram tickets)

- ~~[Em que escala vale a faixa de "estável" (±1% ao ano) para proporções, razões e tabagismo?](issues/25-escala-da-faixa-estavel.md)~~: resolvido, com variação relativa em todos os indicadores (seção 7).
- ~~[Com que indicador, tipo e modo o Mapa inicial abre?](issues/26-estado-inicial-do-mapa.md)~~: resolvido, com até 60 dias × Todos × Tendência e o estado guardado na URL (seção 11.1).

### Lacunas encontradas na execução

- ~~[O que causa a quebra de 2018–2019 no Painel-Oncologia, e como a Tendência do 60 dias deve tratá-la?](issues/27-quebra-de-serie-do-painel.md)~~: resolvido. A Tendência do 60 dias passa a usar só os casos tratados com quimio e radio (seções 6.4, 7 e 8).
- [Por que os casos tratados por cirurgia caem no Painel a partir de abril de 2024?](issues/28-queda-das-cirurgias-em-2024.md): aberto.

### Primeiro passo da execução

- **Gerar o `AGENTS.md`** na raiz do repositório ao iniciar a implementação desta spec, antes de qualquer código. Ele orienta os agentes que vão construir o projeto e aponta para esta spec, para o `GLOSSARY.md` e para a estrutura do monorepo (`pipeline/` e `site/`). Decisão do responsável pelo projeto em 2026-11-02, registrada na consolidação.

### Requisitos de execução antes de publicar (não são decisões abertas)

- Revisor clínico convidado e revisão registrada (seção 10.4).
- Reconferir as fontes das Ações: 50–74 na mamografia, FIT, resgate do HPV, listas de sinais.
- Validar a série completa ajustada pelo C55 (seção 6.2).
- Medir duração e disco do SI-PNI no CI (seção 16).
- `LICENSE`, declarações de licença no README e link para o código-fonte no rodapé (seção 2).
- Reconferir os links oficiais da metodologia.

### Após o MVP

- Substituto da razão de citopatológicos (citopatológico + DNA-HPV, SIGTAP 02.02.10.025-1), quando houver dado aberto por município de residência e uma Referência oficial.
- Itens de v2 da seção 3 e a possível parceria com o Oncoguia.
