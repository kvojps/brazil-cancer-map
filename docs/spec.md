# Spec — Observatório do Câncer no Brasil

Esta é a spec viva do projeto: as regras que valem hoje, com a numeração de seções que o código cita como "spec, section N". As decisões difíceis de reverter têm contexto e alternativas em [`adr/`](adr/); em divergência, vale o ADR mais recente. Os termos em maiúscula (Eixo, Indicador, Tendência, Situação, Referência, Ação, Região imediata, Dado insuficiente, Mapa inicial, Meu município, Tipo de câncer, Fonte, Contrato de dados, Versão de dados) seguem o [`GLOSSARY.md`](../GLOSSARY.md). **Fonte** é o provedor oficial; `source`, em código, é a unidade do pipeline.

Os caminhos em `docs/data-sources.md`, `docs/ui-contract.md`, `docs/data/` e `docs/validation/` indicam onde ficam os detalhes operacionais, as evidências e o contrato de interface.

---

## 1. Decisão e posicionamento

- **Go.** A lacuna está aberta: não existe mapa municipal, voltado ao cidadão, que junte os quatro Eixos e ligue o dado a uma Ação. Os quatro Eixos têm dado aberto. O que mais se aproxima é o Radar do Câncer (Oncoguia), mas ele só vai até a UF.
- **Condição do go:** a única coisa que reabriria a decisão é a qualidade do dado, se o dado municipal não se sustentasse em nenhuma UF. A medição confirmou o go: o dado se sustenta em parte das UFs, e o gargalo está no Painel-Oncologia, não no SIM (seção 6.3).
- **Posicionamento:** "Veja como está o cuidado com o câncer no seu município, e o que você pode fazer."
- **Diferenciais obrigatórios:** (1) granularidade municipal; (2) todo dado ligado a uma Ação; (3) Tendência no lugar de contagem de óbitos; (4) dados abertos para download e código aberto; (5) os quatro Eixos num lugar só. Sem os dois primeiros, o projeto seria só mais um Radar do Câncer.
- **Critério para um indicador entrar:** ter uma Ação associada ou justificar por que não tem. Indicadores sem Ação perdem prioridade.
- **Público:** o site equilibra o cidadão e o público técnico, sem entradas separadas por perfil.
- **Tom:** esperança com honestidade. Não se promete melhora onde o dado mostra piora, e não há ranking entre municípios, porque ele é punitivo e instável em municípios pequenos.
- **Oncoguia:** o site cita e linka o Radar do Câncer como fonte complementar. Uma parceria ativa fica para depois.

## 2. Identidade, licenças e requisitos de lançamento

- **Nome:** Observatório do Câncer no Brasil. **Subtítulo:** "Dados sobre o câncer no seu município, para entender e agir". O nome abrange os quatro Eixos, sem restringir o projeto ao acesso ao tratamento.
- **Endereço:** o subdomínio gratuito da hospedagem, hoje <https://brazil-cancer-map.kvojps.workers.dev>. Domínio próprio pago não entra no MVP.
- **Custo zero:** hospedagem, endereço e execução do pipeline não podem gerar custo, e o acesso é gratuito.
- **Código:** `AGPL-3.0-or-later`. O repositório tem um arquivo `LICENSE` com o texto da AGPL-3.0, a declaração da licença no README e um link para o código-fonte no rodapé do site. Motivo e custo: [ADR 7](adr/0007-licenses.md).
- **Textos do projeto** (Ações, metodologia, notas, ressalvas e glossário): CC BY-SA 4.0, com atribuição ao Observatório do Câncer no Brasil.
- **Dados:** os dados de terceiros seguem as condições de cada Fonte, e os arquivos que o pipeline gera não são cobertos pela licença do código. A metodologia e cada arquivo exportado identificam a Fonte, o período e as condições de reutilização. Quem citar o Observatório deve citar também as Fontes originais.
- **Contribuições:** entram sob a licença da parte alterada, sem CLA.
- **Tipografia:** Inter em subconjunto próprio, hospedada no site, com a licença publicada em `site/public/fonts/OFL.txt`.
- **Aviso de site em construção:** uma faixa fixa no topo de todas as páginas, sem botão de fechar, com o texto: **"Em construção. Este site ainda está sendo desenvolvido e os números não passaram por uma validação completa: podem conter erros e mudar."**
  - **Forma:** como o site não lembra nada entre visitas (seção 11.1), um botão de fechar faria a faixa voltar a cada visita. A faixa não recolhe nem ganha versão curta, inclusive no celular, e pode ganhar destaque. Ela é texto, não só cor, e não usa as cores da Tendência nem vermelho, para não ser lida como uma classe do mapa.
  - **Texto:** é genérico para não mudar a cada item resolvido. Evita "provisório" e "preliminar", que aqui querem dizer os anos recentes do dado (seção 6.4), e não diz "não use estes dados", para não afastar o público.
  - **Saída:** por decisão do responsável pelo projeto, e não por um critério fixo. Os arquivos de dados abertos não levam o aviso.
- **Acessibilidade** (requisito de lançamento, sem certificação formal de WCAG ou eMAG): toda informação do mapa tem alternativa em texto ou tabela, toda interação funciona pelo teclado e nenhuma informação depende só de cor (por isso as texturas da seção 11).

## 3. Escopo

- **Geografia:** o Brasil inteiro, com os 5.571 municípios da malha IBGE 2025, inclusive Boa Esperança do Norte (MT, 510183), instalado em 2025. Nenhuma UF fica de fora: o microdado do Painel-Oncologia já vem nacional, cobrir o país custa quase o mesmo que cobrir uma UF, e um piloto estadual deixaria a maioria das pessoas sem o próprio município. A ressalva de qualidade é por UF × tipo (seção 6.3).
- **Tipos de câncer:** a visão padrão é "Todos os cânceres", e o seletor tem **mama, colo do útero, próstata, colorretal e pulmão**. Um mapa só de mama e colo do útero deixaria de fora metade da população no Eixo carro-chefe, o Acesso ao tratamento.
- **Sem números nacionais somados:** o front não traz cartões numéricos nacionais nem médias de municípios. Somar a cascata repetiria os dados regionais.
- **Fora do MVP (v2):**
  - estômago: não se sustenta no Acesso ao tratamento (56% dos casos do país sem informação de tratamento e 10 UFs na faixa C), e um tipo com só um Eixo preenchido pareceria quebrado;
  - % tratada fora do município: ambígua, porque em município pequeno tratar fora é o esperado;
  - série antiga do HPV (2014–2019): tem quebra de método;
  - estadiamento do Painel: o estádio só é registrado para quem fez quimioterapia ou radioterapia, então o indicador fica enviesado e não mede detecção precoce;
  - tempo mediano até o tratamento; PNS; excesso de peso, álcool e hepatite B; produção SIA-SUS/APAC; RHC; o indicador que substituirá a razão de citopatológicos; abertura do site por perfil de quem visita.
- **Fora deste projeto:** dados individuais (só agregados públicos), orientação médica personalizada, infraestrutura paga, backend ou banco de dados.

## 4. Fontes de dados

Endereços, tamanhos, armadilhas e calendário de cada Fonte estão em `docs/data-sources.md`.

| Fonte | Uso no MVP | Granularidade | Acesso | Ritmo de publicação | Volume |
|---|---|---|---|---|---|
| Painel-Oncologia | % em até 60 dias; % sem informação de tratamento; faixa A/B/C | Município de residência | DBC no FTP DATASUS | Mensal, regrava todos os anos | ~0,2 GB |
| CNES (habilitações) | Onde se tratar (CACON, UNACON, radioterapia) | Estabelecimento | DBC no FTP DATASUS | Mensal (competência M por volta do dia 15 de M+1) | ~24 MB |
| SISCAN | Razão de mamografias e de citopatológicos | Município de residência | CSV no FTP | Anual, regrava tudo em janeiro de X+1 | 24,4 GB descompactado |
| Painel oficial de coortes HPV (SI-PNI/RNDS e TabNet) | Cobertura HPV | Município × sexo × ano | Tabela agregada pública do InfoMS/Qlik; CSV mensal S3 para auditoria | Checagem mensal | Agregado pequeno; auditoria mensal em fluxo |
| Vigitel | % de fumantes | Capital da UF | Microdado anual | ~20 meses após a coleta; nome do arquivo muda | pequeno |
| SIM | Tendência da mortalidade | Município de residência | `DOBR<ano>.dbc` no FTP | Ano X final em dezembro de X+1 | ~130 MB/ano |
| Estimativa INCA 2026–2028 | Casos novos estimados | UF e capital | Extração manual a cada edição | Trienal (próxima ~2029) | pequeno |
| POPSVS (MS/SVS) | Denominador de taxas e razões | Município × sexo × idade simples (0–79, 80+), 2000–2025 | `POPSBR<aa>.zip` no FTP | Anual (out/nov) | ~3,4 MB/ano |
| Censo 2022 (SIDRA 9514) | Denominador fixo do HPV | Município × sexo × idade | SIDRA | Fixo | pequeno |
| Malha municipal IBGE 2025 | Geometria e Região imediata | Município | Shapefile | Anual (fev–abr de X+1) | — |

Para o HPV, o numerador publicado é o agregado qualificado pelo próprio Ministério ([ADR 4](adr/0004-hpv-from-official-aggregates.md)). Os microdados mensais permanecem como auditoria local e não substituem o agregado oficial. O Observatório confere o Censo e calcula cobertura total, cascata e Situação a partir dos numeradores e denominadores oficiais.

Os endereços do FTP do DATASUS e do S3 do SI-PNI são estáveis. O portal do SI-PNI, o nome do arquivo do Vigitel e a página da Estimativa INCA mudam com frequência.

## 5. Indicadores

| Eixo | Indicador | Fonte | Granularidade | Período | Tipos | Referência | Tendência | No mapa? |
|---|---|---|---|---|---|---|---|---|
| Acesso ao tratamento | % de casos com 1º tratamento em até 60 dias, **medida nos casos tratados com quimio ou radio** ([ADR 3](adr/0003-within-60-days-on-chemo-and-radio-cases.md)), sempre com a % sem informação de tratamento de todos os casos ao lado | Painel-Oncologia | Município de residência | 2014 até o último ano consolidado; os 2 últimos anos ficam provisórios | Todos + 5 | 100% (Lei 12.732/2012); **próstata sem Situação** | Sim, **só sobre os casos tratados com quimio ou radio** (quasi-Poisson com offset `log(casos)`) | Sim |
| Acesso ao tratamento | Onde se tratar: CACON/UNACON e radioterapia habilitados mais próximos | CNES | Estabelecimento | Situação atual | Todos | Nenhuma (contexto) | Não | Não (só no Meu município, junto do 60 dias) |
| Detecção precoce | Razão de mamografias de rastreamento, mulheres de 50–69 | SISCAN | Município | 2016–2025 | Mama, Todos | 1 (ficha do INCA) | Sim (quasi-Poisson + offset) | Sim |
| Detecção precoce | Razão de citopatológicos, mulheres de 25–64. **Série encerrada em 2025** | SISCAN | Município | 2016–2025 | Colo, Todos | 1 (ficha do INCA) | Sim, sobre 2016–2025 (quasi-Poisson + offset) | Sim |
| Prevenção | Cobertura da vacina HPV, 9–14 anos, meninas e meninos juntos (detalhe por sexo ao abrir o cartão) | Painel oficial de coortes HPV | Município | 2020 até o último ano, com marca na dose única (2024) | Colo, Todos | 90% até 2030 (Plano de Dant), para o total e para cada sexo | **Não** ("série curta, ainda sem direção") | Sim, em "como está hoje" por padrão |
| Prevenção | % de fumantes adultos, "na capital do seu estado" | Vigitel | Capital da UF | Série do Vigitel | Pulmão, Todos | 5,9% (meta do Brasil para 2030), com a regra invertida | Sim (regressão ponderada pelos erros-padrão) | Não (só no Meu município) |
| Panorama | Tendência da mortalidade padronizada por idade | SIM | Município, com a cascata da seção 8 | 2014–2024, sem os anos preliminares | Todos + 5 | **Nenhuma: sem Situação, só Tendência.** A Tendência do Brasil aparece como contexto, e as metas de mama (−10%) e colo (−20%, 30–69 anos) entram só como texto | Sim (quasi-Poisson + offset) | Sim, só em modo Tendência |
| Panorama | Casos novos estimados (contexto, sem série). "Todos" exclui pele não melanoma, e Brasília usa os números do DF | Estimativa INCA 2026–2028 | UF e capital | Edição atual | Todos + 5 | Nenhuma (contexto) | Não | Não (só no Meu município) |

**"Todos os cânceres" muda de definição por Eixo:**
- tratamento: C00–C97 sem C44, C73 e C76–C80. Quase 90% dos casos de C76–C80 vêm sem informação de tratamento: excluídos, o Ceará cai de 41% para 20%;
- mortalidade: C00–C97 sem C44.

Códigos por tipo na mortalidade: mama C50 (mulheres); colo C53, com a redistribuição do C55 da seção 6.2; próstata C61; pulmão C33–C34; colorretal C18–C21.

**Eixo sem indicador para o tipo:** a falta de indicador vira conteúdo: o Eixo mostra a justificativa e a Ação alternativa (seção 10.3). Ficam vazios a Detecção precoce de próstata, colorretal e pulmão (sem rastreamento organizado com indicador aberto; o INCA desaconselha o PSA para quem não tem sintomas) e a Prevenção de mama, próstata e colorretal (sem indicador com dado aberto).

## 6. Regras de método

### 6.1 Denominadores

Decisão e alternativas: [ADR 5](adr/0005-population-denominators.md).

- O POPSVS é o denominador padrão. A série 2000–2025 foi refeita pós-Censo 2022, sem quebra. Números oficiais publicados antes de 2025 **não batem** com ele (a estimativa antiga superestimava ~5,8%), e a validação precisa levar isso em conta.
- Mamografia: mulheres de 50–69 ÷ 2. Citopatológico: mulheres de 25–64 ÷ 3.
- HPV: **Censo 2022 fixo**, 9–14 anos por sexo, como o painel do PNI. A nota de método explica a diferença em relação ao POPSVS. Sem referências oficiais de cobertura, ou com divergência acima de `tolerance_pp` (hoje 0,01 p.p.), não há exportação.
- % em até 60 dias: não usa população como denominador.
- Ano sem arquivo de população: usa o do ano imediatamente anterior, só se faltar o arquivo inteiro, e marca o resultado como provisório. Município ausente é erro, e cada município × ano tem 162 células.
- O código do município tem 6 dígitos. A malha 2025 é a referência territorial, e o município novo tem série a partir de quando passou a existir, sem recalcular o município de origem. No HPV, Boa Esperança do Norte usa a região, sem população inventada.

### 6.2 Mortalidade

- SIM por residência, causa básica.
- Padronização direta pela população mundial de Segi/Doll, faixas quinquenais de 0–4 a 75–79 e última faixa 80+. Os pesos e a fórmula são publicados na metodologia.
- **Redistribuição do C55 (só no colo do útero, [ADR 9](adr/0009-c55-redistribution-cervix-only.md)):** a proporção C53/(C53+C54) da UF de residência × ano × faixa etária, só com registros femininos, é aplicada aos C55 do município, preservando valores fracionários, e o C54 recebe o restante. A idade ignorada fica em célula separada, sem entrar na padronização. O total de "Todos" não muda. Se C53+C54 = 0 na UF, usa-se a proporção nacional do mesmo ano e idade. Se nem ela puder ser calculada, o resultado fica sinalizado como "ajuste não calculável": o ano afetado fica sem taxa, a Tendência só é bloqueada se a falha cair na sua janela, e o contexto nacional fica sem classe.
- Nota visível no cartão do colo: **"Estimativa ajustada para registros sem localização definida; pode diferir do INCA."**
- C26, R00–R99 e C76–C80 ficam sem redistribuição e entram como limitações declaradas.
- A série ajustada completa é validada no pipeline. A pesquisa só mediu o efeito sobre as contagens, então a metodologia não pode apresentá-lo como efeito comprovado na classe da Tendência.

### 6.3 Qualidade do Acesso ao tratamento (faixas A/B/C)

- A faixa é calculada por **UF × tipo selecionado** (inclusive "Todos"), sobre os últimos cinco anos consolidados, e o período aparece na tela. Não se usa uma lista fixa de UFs, porque a faixa muda com o tipo.
- A soma inclui os casos com município de residência ignorado, como o TabNet.
- A: até 15% sem informação de tratamento; B: acima de 15% e abaixo de 35%; C: 35% ou mais. Os cortes valem sem arredondar: 15% exato é A, e 35% exato é C.
- Na faixa C, o indicador de tratamento correspondente ganha hachura e o aviso: **"Muitos casos estão sem informação de tratamento; o resultado pode não representar toda a situação."** A hachura não se aplica aos outros Eixos.
- A % sem informação de tratamento aparece sempre ao lado da % em até 60 dias, porque falta de registro não significa falta de tratamento.
- A faixa e a % sem informação usam **todos os casos diagnosticados**, como o TabNet: medem a qualidade do registro. O valor, a Situação e a Tendência do 60 dias usam o recorte de quimio e radio (seções 7 e 9, [ADR 3](adr/0003-within-60-days-on-chemo-and-radio-cases.md)). Os 5 anos da faixa (hoje 2020–2024) ficam todos depois da quebra de 2018 (seção 6.4). A queda das cirurgias de 2024 sobe a % sem informação em média 0,4 p.p. e muda a faixa de só 4 das 162 células UF × tipo, todas na fronteira; a metodologia registra isso.
- Próstata leva uma ressalva fixa (a vigilância ativa pode ser a conduta correta; o texto está na seção 17) e não tem Situação.

### 6.4 Anos provisórios e séries especiais

- Painel: os 2 anos de diagnóstico mais recentes presentes nos dados são provisórios (hoje 2025 e 2026, com 2026 ainda parcial). SIM: os anos preliminares ficam fora. Os anos provisórios aparecem tracejados no gráfico e não entram na Tendência.
- HPV: a mudança para dose única em 2024 fica marcada na série. A contagem oficial é "ao menos uma dose" em todos os anos, e a Situação usa o último ano completo.
- Painel: **quebra de série em maio de 2018**. Com a Portaria SAS nº 643/2018, o exame anatomopatológico (BPA-I) passou a criar casos, os sem tratamento registrado e os operados. A % sem informação vai de ~4% para ~30% (com um segundo degrau em maio de 2019), e a série de todos os casos não é comparável antes e depois. Os casos tratados com quimio ou radio (APAC) não têm degrau, por isso a Tendência usa só eles (seção 7).
- Painel: **queda das cirurgias a partir de abril de 2024**, de ~6 mil para ~2 mil casos por mês, e assim em 2025. As cirurgias não caíram no SIH: o que se perdeu foi o vínculo da AIH ao caso, em 581 hospitais, coincidindo com a entrada do CPF do paciente na AIH (competência 04/2024). A causa não tem confirmação oficial. Os casos operados somem do Painel em vez de virar "sem informação", e a % em até 60 dias de todos os casos cai de 37,1% (2023) para 33,5% (2024). Por isso o valor e a Situação também usam só quimio e radio (seção 9), série que não é afetada. O pipeline confere a contagem mensal por modalidade para pegar quebras parecidas (seção 14).
- Citopatológico: a série fica congelada em 2025 e não recebe anos novos. A troca do Papanicolau pelo teste de DNA-HPV, feito a cada 5 anos, reduz a contagem sem representar menos cuidado.

## 7. Tendência

Escala, faixa e métodos descartados: [ADR 2](adr/0002-trend-as-relative-annual-change.md).

- **Cálculo:** uma única variação anual sobre os últimos até 10 anos consolidados (hoje SIM 2015–2024, Painel 2015–2024 e SISCAN 2016–2025), com IC 95%. Não há Joinpoint nem Prais-Winsten no MVP. Uma virada recente aparece no gráfico, não na classe.
- **Escala única:** toda Tendência é uma **variação percentual anual**, relativa ao próprio valor do indicador. Nunca se usam pontos percentuais nem razão de chances.
- **Modelos:**
  - quasi-Poisson com offset de população (mortalidade padronizada e razões do SISCAN);
  - quasi-Poisson com ligação log e offset `log(casos)` ("Poisson modificado") para o 60 dias, **só sobre os casos cujo primeiro tratamento foi quimioterapia, radioterapia ou ambos** (`TRATAMENTO` 2, 3 ou 4): numerador = esses casos em até 60 dias; denominador = esses casos. Esse recorte atravessa sem degrau as quebras do Painel de 2018, 2019 e 2024 (seção 6.4). Vale para todos os tipos;
  - regressão ponderada de `log(prevalência)` contra o ano, com peso 1/EP² e EP do log = EP/prevalência, para o tabagismo na capital. A prevalência e o IC vêm dos microdados do Vigitel, com `pesorake2025` e linearização de Taylor, nos últimos 10 anos de calendário, sem preencher 2022.
- **Classes:**
  - **estável** quando o IC inteiro cabe em **±1% ao ano (relativo)**, com o mesmo corte para todos os indicadores. É uma convenção do projeto, mais tolerante que a do NCI (±0,5%). Estável tem precedência: um IC dentro de ±1% é estável mesmo excluindo zero;
  - **melhorando** ou **piorando** quando o IC exclui zero (o sentido de "melhorando" depende do indicador);
  - **sem direção clara** quando o IC é largo e inclui zero.
- **Dado insuficiente** não é uma classe (seção 8).
- **Esperado:** com amostras pequenas, "estável" quase nunca aparece. O tabagismo na capital fica em melhorando/piorando ou sem direção clara, e o 60 dias só chega a "estável" com cerca de 400 casos por ano (capitais e regiões grandes).
- **HPV:** sem Tendência estatística, pela série curta e pela mudança de esquema em 2024.

## 8. Municípios pequenos

Decisão e alternativas: [ADR 8](adr/0008-territorial-cascade.md).

- **Mínimo:** média de pelo menos 20 por ano na janela, contando os anos sem caso. Nas taxas, conta o numerador (óbitos, exames). Nas proporções e coberturas, conta o denominador da Tendência (no 60 dias, os casos tratados com quimio ou radio; no HPV, a população de 9–14 anos).
- **Cascata por indicador × tipo**, igual para a Tendência e para a Situação: o município usa o próprio dado se passar do mínimo; se não passar, usa o da **Região imediata** (IBGE, 510 regiões, código já na malha) se ela passar; senão fica como **Dado insuficiente**. Nunca se sobe para a UF. A região soma todos os seus municípios, inclusive os que têm dado próprio.
- **A origem vale para a camada inteira:** o município com dado da região recebe a classe, o valor, a Situação e a % sem informação da região.
- **Dado insuficiente:** a camada exporta `value` e `without_treatment_info` nulos, porque uma porcentagem de poucos casos revelaria a contagem bruta. A contagem bruta do município com Dado insuficiente não é exibida.
- **Classe não calculável:** aparece como Dado insuficiente. O C55 não calculável é outro caso (seção 6.2) e não vira Dado insuficiente.
- A suavização bayesiana foi descartada.
- A mesma regra vale no mapa e no Meu município. Todo o cálculo fica no pipeline.

## 9. Referência e Situação

- Referências e textos para o público: 60 dias = 100% ("o que a lei garante"); mamografia e citopatológico = razão 1 ("meta"); HPV = 90% ("meta para 2030"; o cartão diz que a meta da OMS é para meninas); tabagismo = 5,9% ("meta do Brasil para 2030"). Mortalidade, casos estimados e onde se tratar não têm Referência. O glossário prevê o valor do Brasil quando não há meta, mas nenhum indicador usa esse caso.
- **Por que cada Referência:**
  - **60 dias:** é um direito de todo paciente (Lei 12.732/2012, art. 2º). A Lei 13.896/2019 (exames em até 30 dias) não gera outro parâmetro, porque o Painel conta o tempo a partir do diagnóstico. Ela entra como direito na Ação.
  - **Mamografia e citopatológico:** fichas técnicas do INCA de 2014, com 1 exame a cada 2 anos e a cada 3 anos. O SISPACTO não tem valor nacional, e Previne Brasil e C7 da APS medem outros indicadores.
  - **HPV:** Plano de Dant 2021–2030. O Ministério aplica a meta a meninas e meninos. A meta de 80% era do esquema de 2 doses.
  - **Tabagismo:** o Plano de Dant quer reduzir 40% até 2030, de 9,8% (Vigitel 2019) para 5,9% no conjunto das capitais. O percentual está no texto do plano, e os valores 9,8% e 5,9% foram lidos nos rótulos de um gráfico. A meta é nacional e foi aplicada a todas as capitais.
  - **Mortalidade:** não há meta compatível. As metas do Plano de Dant e do ODS 3.4 são para 30–69 anos, padronizadas pela população do Brasil de 2010.
- **Situação** é o valor do último ano consolidado comparado à Referência.
- No 60 dias, o valor é a % em até 60 dias **dos casos tratados com quimioterapia, radioterapia ou ambos** (`TRATAMENTO` 2, 3 ou 4), o mesmo recorte da Tendência ([ADR 3](adr/0003-within-60-days-on-chemo-and-radio-cases.md)). Ele não bate com o "todos os casos" do TabNet e é validado contra a tabela do TabNet filtrada por modalidade. "Até 60 dias" inclui o tratamento de 1 a 90 dias antes do diagnóstico, como no TabNet.
- **"Como está hoje": 3 faixas fixas**, nunca quantis, porque quantil é ranking disfarçado:
  - **alcançou:** ≥ Ref (no tabagismo, ≤ Ref);
  - **perto:** ≥ 0,8 × Ref (no tabagismo, ≤ Ref ÷ 0,8 exato; 7,4% é o valor arredondado);
  - **longe:** o resto.
- Valores acima do possível (HPV acima de 100%, razão muito acima de 1) entram como "alcançou", sem cortar o número, com a nota "valor acima do esperado, provavelmente erro no registro ou na estimativa de população".
- Mamografia fica em 50–69, embora a orientação vigente seja 50–74 (NT 626/2025), porque é o que a ficha do INCA e a série histórica sustentam. O tema é revisto quando o INCA publicar uma ficha para 50–74.
- 60 dias na próstata: sem Situação e sem faixa, só a Tendência com a ressalva fixa.

## 10. Ações

### 10.1 Comportamento

- A Ação aparece **sempre**, inclusive com Situação boa, Tendência melhorando ou Dado insuficiente. A cor do mapa não determina conduta.
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

- O responsável pelo projeto convida um **profissional de saúde revisor** para os textos sobre exames, sintomas e vacinação. **O nome ainda não foi definido**, e a revisão está pendente (seção 17).
- Cada Ação registra fonte oficial, data de conferência, público, critérios, exceções, versão revisada, data e responsável pela revisão.
- Os detalhes clínicos ficam ocultos até haver `reviewer` e versão revisada iguais à versão atual. Enquanto isso, só o texto curto aprovado aparece.
- Faixas etárias, intervalos, exceções e disponibilidade (inclusive 50–74 na mamografia, o FIT e o resgate do HPV para 15–19 anos até 31/12/2026) são reconferidos nas fontes oficiais antes de publicar.
- Toda alteração clínica posterior exige nova revisão, e orientações temporárias têm data de revisão.

## 11. Experiência

A apresentação é a do **Console horizontal**, aprovado pelo responsável em 04/11/2026: a consulta municipal acontece no próprio dashboard e substitui a separação entre prévia e ficha. A aparência segue "sóbrio e preciso": menos bordas e caixas, tipografia e números fortes, cor reservada aos dados. No celular, "compatibilidade" significa layout e toque. As decisões de UI que os testes usam como contrato estão em `docs/ui-contract.md`.

### 11.1 Mapa inicial

- A página inicial é o mapa do Brasil por município, com a busca de município, o seletor de Tipo de câncer e o seletor do que o mapa mostra (indicador e modo).
- **Estado inicial:** até 60 dias × Todos os cânceres × Tendência, sem município selecionado, com a hachura da faixa C já na primeira impressão, aceita como a ressalva honesta. O indicador é o carro-chefe e o que corresponde ao posicionamento.
- **Estado na URL:** a seleção municipal fica no caminho `/municipio/<código>-<nome>/` ([ADR 10](adr/0010-static-municipal-links.md)), e os demais parâmetros usam os identificadores do contrato: `indicador`, `tipo` (por exemplo `tipo=breast`), `modo=hoje`, `visualizacao=lista` e `theme`. Valores iguais ao padrão são omitidos. `?municipio=` é só compatibilidade com links antigos, e `/municipios/?municipio=<código>` carrega a seleção para o retorno. Nada é lembrado entre visitas: sem seleção ou parâmetros, o site abre no estado inicial.
- **Combinações que não existem:** ao trocar para um tipo sem aquele indicador, o mapa volta para o até 60 dias com um aviso de uma linha, e o seletor mostra os indicadores que não se aplicam desabilitados, com o motivo. Um link inválido é corrigido em silêncio, campo a campo (valor desconhecido → padrão; modo impossível → o modo que o indicador tem), e a URL é reescrita para o estado mostrado.
- Indicadores que pintam o mapa: até 60 dias, mamografia, citopatológico, HPV e tendência da mortalidade, filtrados pelo tipo. Tabagismo, Onde se tratar e Casos estimados ficam só no Meu município: o tabagismo é dado da capital e não pinta municípios.
- **Modo padrão: Tendência.** "Como está hoje" é opcional. Com a Referência de 100% da lei, o 60 dias pintaria o Brasil inteiro de "longe": é honesto, mas não diferencia nenhum município. A Tendência diferencia e sustenta a esperança sem esconder quem piora. A mortalidade só tem Tendência. O HPV abre em "como está hoje", com uma nota no seletor explicando por quê.
- **Cores da Tendência** (sem vermelho): melhorando em verde-azulado; piorando em âmbar; estável em cinza médio; sem direção clara em cinza claro; Dado insuficiente em quase branco com **textura de pontos**, nunca branco puro. No tema escuro, sem direção clara fica em cinza escuro e Dado insuficiente em quase preto, mantendo os pontos, para a classe menos informativa não dominar o mapa.
- **Cores da Situação:** uma escala de um só tom em 3 passos, mais escura quanto mais perto da Referência e diferente das cores da Tendência. No tema escuro, a escala fica mais clara quanto mais perto da Referência.
- **Texturas:** pontos só para Dado insuficiente; hachura diagonal só para a faixa C, e só no indicador de tratamento correspondente. O município que usa o dado da Região imediata recebe a cor da região, sem pontos, e recebe a hachura se a sua UF estiver na faixa C. O município com Dado insuficiente fica só com os pontos, sem hachura: ele não mostra resultado a ressalvar, e assim as duas texturas nunca se sobrepõem.
- **Legendas:**
  - Tendência: "A cor mostra como o indicador mudou ao longo dos anos. Não é um ranking entre municípios." (5 entradas). Entre elas: "**Estável**: quase não mudou, menos de 1% por ano em relação ao próprio valor." e "**Sem direção clara**: pode ter subido ou caído; os dados não bastam para dizer." Os mesmos textos valem no cartão, que mostra a classe e a série, sem o número da variação.
  - Situação: "A cor mostra a distância até a referência. Não é um ranking entre municípios."
- **Tooltip:** nome do lugar, indicador, período, classe e origem geográfica do dado. Quando usa a região: **"Seu município e vizinhos — região de X"**.
- **Interação:** clicar num município, buscá-lo ou abrir seu link seleciona e destaca o município, abrindo a consulta completa no dashboard, sem tela municipal separada. Painel lateral no desktop; inferior, resumido e expansível no celular. Sem seleção, Brasil inteiro e nenhum painel vazio. Lista substitui o mapa na mesma área e preserva filtros e seleção; busca e lista independem do mapa. O índice por UF fica em `/municipios/`, com item na navegação principal.

### 11.2 Meu município (consulta integrada)

- Os quatro Eixos ficam em seções expansíveis no painel do dashboard, com **Acesso ao tratamento primeiro** e abertura inicial do Eixo do indicador selecionado no mapa. Onde se tratar fica junto do 60 dias. Recolher o painel mantém a seleção; limpar a seleção é uma ação distinta.
- **Cartão de indicador:** Situação (valor e barra contra a Referência), Tendência (série com os anos provisórios tracejados) e Ação. Também há "O que é este número?" (explicação e fonte), "Como calculamos" (link para a metodologia, seção 12), o **período dos dados em destaque** e a data de atualização nos detalhes.
- **Mortalidade:** com o indicador de mortalidade, o painel mostra a taxa de mortalidade em destaque, ao lado da classe da Tendência, sem contagem de óbitos e sem Situação.
- **Dado da região:** "Seu município e vizinhos (região de X)", com a série e a Situação da região e uma nota de uma linha com o motivo.
- **Dado insuficiente:** "Poucos casos aqui para dizer a direção. Isso é comum em municípios pequenos e não é um problema do seu município." O cartão mostra a Tendência da UF como contexto ("no seu estado") e mantém a Ação.
- **Cartão do 60 dias** ([ADR 3](adr/0003-within-60-days-on-chemo-and-radio-cases.md)): a barra da Situação e o gráfico mostram a mesma série, a dos casos tratados com quimio ou radio, com o título "Casos tratados com quimioterapia ou radioterapia: % que começou em até 60 dias", para que o número, a linha e a cor nunca se contradigam. A % sem informação de todos os casos fica ao lado. Nota, em "O que é este número?": "Os números deste cartão vêm dos casos tratados com quimioterapia ou radioterapia, cujo registro não mudou desde 2014. Os demais casos tiveram mudanças de registro em 2018 e em 2024, quando muitas cirurgias deixaram de aparecer no painel do Ministério da Saúde." Esse texto ainda precisa de aprovação (seção 17).
- **Ressalvas no cartão:** a faixa C abre com aviso e mostra a % sem informação de tratamento; próstata tem a ressalva fixa; HPV marca a dose única e a nota do Censo 2022; mamografia explica 50–69 vs 50–74; citopatológico diz "Série encerrada em 2025 pela mudança no rastreamento", com a ressalva do DNA-HPV; colo do útero leva a nota do ajuste do C55.
- **Nota de "Todos os cânceres"** junto ao seletor: "Cada eixo usa os registros adequados ao seu indicador. No tratamento, excluímos alguns tipos com informação incompleta. Por isso, 'Todos os cânceres' não reúne exatamente os mesmos tipos em todos os eixos."
- A página de cada município funciona sem JavaScript para a leitura básica.

## 12. Metodologia pública ("Como calculamos")

É uma seção do site, em linguagem simples e com detalhe técnico suficiente para reproduzir cada número. Ela só detalha regras desta spec e não cria regra nova. Para **cada indicador**, documenta:

1. fonte oficial e links, arquivos ou edição usados, data de extração e período coberto;
2. universo, unidade, residência ou estabelecimento, recortes de sexo e idade, códigos e exclusões;
3. numerador, denominador, fórmulas, população de referência e pesos (Segi com 80+);
4. limpeza, cruzamentos, registros ausentes, ajustes, redistribuições (C55) e regras de fallback (proporção nacional, "ajuste não calculável");
5. janela temporal, anos provisórios, consolidação, quebras de série (HPV 2024; Painel em maio de 2018 e nas cirurgias de 2024, com a escolha do recorte de quimio e radio para o valor, a Situação e a Tendência e o efeito medido) e congelamentos (citopatológico);
6. método da Tendência (variação percentual anual, nunca pontos percentuais, com o exemplo do tabagismo: de 9% para 8% é uma queda de 11%), modelo de cada indicador, incerteza, critérios das classes (±1% como convenção do projeto, com o aviso de que amostras pequenas raramente chegam a "estável"), Referência e cortes de Situação (inclusive a regra invertida do tabagismo e os valores acima do esperado);
7. mínimo de casos, substituição pela Região imediata e Dado insuficiente;
8. qualidade por UF × tipo, limitações (C26, R00–R99, C76–C80, cobertura só do SUS), diferenças em relação aos painéis oficiais (POPSVS revisto, C55, Censo 2022 no HPV) e validações feitas;
9. versões do código e dos dados, acesso aos scripts e aos agregados, e histórico das revisões que alteram resultados.

Inclui ainda: as duas definições de "Todos os cânceres"; a explicação de que o dado do município não estima o risco individual; e as condições de reutilização e a forma de citar cada Fonte (seção 2). Os links oficiais são reconferidos na execução.

## 13. Stack e arquitetura

Decisão e alternativas: [ADR 1](adr/0001-static-site-with-committed-json.md).

- **Monorepo** com `pipeline/` e `site/`.
- **Site:** Astro com saída estática. Tem uma página por município (`/municipio/<código>-<nome>/`, 5.571 HTMLs) mais a página do mapa, o índice por UF e a metodologia.
- **Mapa:** uma ilha em TypeScript + MapLibre GL JS (BSD-3), com TopoJSON da malha IBGE 2025 simplificado a 1–2% com mapshaper (hoje 1,5%, 0,71 MB gzip), sem as 2 lagoas, **sem mapa base**, com `promoteId: "CD_MUN"` e `feature-state` para trocar indicador e ano.
- **O front não faz conta estatística.** Taxa, razão, classe da Tendência, Situação, cascata e faixa A/B/C chegam prontas do pipeline.
- **Hospedagem:** Cloudflare Workers com assets estáticos, no plano gratuito, em `workers.dev`. O painel da Cloudflare deixou de oferecer a criação de projetos Pages, previstos no início. Os limites são os mesmos: 20.000 arquivos de até 25 MiB. O GitHub Pages segue como alternativa prevista, com limite de 1 GB de site. Não usa DuckDB-WASM nem PMTiles.
- **Orçamento:** as metas são ~1,3 MB na primeira visita e menos de 30 MB no site inteiro. Elas não estão cumpridas, e o excesso é dívida conhecida que não bloqueia a V1 por orçamento (seção 17). Acessibilidade, validação dos dados e verificação da hospedagem continuam exigidas.

## 14. Pipeline

Python + DuckDB (pandas onde já existe código). O comando é `python -m pipeline run`, que também roda uma `source` ou etapa por vez, na máquina do mantenedor. A atualização para revisão usa `python -m pipeline update` (seção 16).

1. **Baixar:** um baixador por `source`, com cache incremental em `data/raw/` (compara tamanho e data) e novas tentativas contra falhas do FTP. O dado bruto nunca entra no git. A auditoria do SI-PNI e o SISCAN são processados um arquivo por vez, em fluxo, apagando o bruto.
2. **Limpar:** um módulo por `source` gera Parquet padronizado em `data/clean/` (código IBGE de 6 dígitos, ano, tipo, sexo, faixa etária e contagem). Os DBC passam por `datasus_dbc` + `dbfread`, e os CSVs grandes pelo DuckDB. Aqui entram as exclusões de CID, a marca de ano provisório e a redistribuição do C55, única etapa de método fora de `compute`, por exceção declarada.
3. **Calcular:** uma função testável por indicador, com o denominador, a Situação, a Tendência, a cascata e a faixa A/B/C. Fora a exceção do C55, é o único lugar com estatística.
4. **Validar:** confere a presença dos municípios e a faixa plausível dos valores e, onde a Fonte permite, compara com números oficiais. **Se falhar, nada daquela `source` é publicado.** A comparação oficial varia:
   - Malha: comparada com a lista oficial do IBGE, e não com uma contagem fixa, hoje 5.571 municípios.
   - Painel: a % em até 60 dias, as contagens e a % sem informação contra o TabNet, nas tabelas de todos os casos e filtrada por modalidade. A contagem nacional de casos por mês e por modalidade de primeiro tratamento gera um alerta para o mantenedor numa queda de patamar (como a das cirurgias em 2024), sem bloquear a publicação.
   - SIM: contagens exatas e taxas com ±3% contra o Atlas do INCA, considerando o POPSVS revisto.
   - HPV: denominadores contra o Censo 2022 e coberturas contra referências do painel oficial.
   - Tabagismo: a comparação oficial cobre só o total ponderado das capitais, com ±3%, sem validar cada capital.
   - SISCAN: sem comparação com números oficiais, só a faixa plausível e a presença dos municípios.
   - CNES, POPSVS e Estimativa INCA: conferência de consistência interna (cobertura, faixas plausíveis e totais), sem comparação com outro número oficial. Os limiares estão em `docs/data-sources.md`.
5. **Exportar:** gera o Contrato de dados (seção 15).

## 15. Contrato de dados

É a única fronteira entre `pipeline/` e `site/`.

- **Camada do mapa:** um JSON por indicador × tipo, com os 5.571 municípios. Cada um traz a classe da Tendência, o último valor, a faixa de Situação, `origin` (`"municipality"`, `"immediate_region"` ou `"insufficient"`) e `quality_band`. Conforme o indicador, a camada traz também `quality`, `has_status`, `status_note` e `adjustment_note`, e o período traz `quality_years`, `value_cases` e `trend_cases`. Não se publica o número da variação (`trend_estimate`).
- **Camada do perfil:** um JSON por UF, com a série completa de todos os indicadores e tipos dos seus municípios. Carrega sob demanda, quando um município é selecionado.
- **`manifest.json`:** a data de extração de cada Fonte, a versão do pipeline e o período publicado de cada indicador.
- Os JSON ficam **commitados** em `site/public/dados/`, e o deploy é só `astro build`.
- O **Parquet/CSV** completo vai como asset de uma **GitHub Release** por versão. Serve de download aberto e permite reconstruir o site sem o pipeline. Cada arquivo identifica a Fonte, o período e as condições de reutilização. A Release é a Versão de dados, identificada por um nome como `data-2026-11-05`.

## 16. Atualização e operação

Decisão e alternativas: [ADR 6](adr/0006-manual-local-data-update.md).

- **Manual:** a atualização depende de uma execução do mantenedor na própria máquina, sem agendamento de dados no GitHub Actions. Entre execuções, o site mantém a última versão publicada.
- **Por Fonte, de forma independente:**
  - checagem mensal para Painel-Oncologia, CNES e HPV;
  - checagem anual conforme o calendário da Fonte para as séries anuais;
  - Estimativa INCA a cada edição.

  Checar uma Fonte não significa publicar um período novo: valem as regras de ano consolidado. O citopatológico não recebe anos novos.
- **Fluxo:** `update` prepara um snapshot para revisão, sem tocar nos JSON do site. Depois da revisão, os dados vão para uma Release e, com um commit dos JSON, para o site. Os comandos estão em `docs/data-update.md`.
- **Estado:** agregados e estado necessário à retomada ficam em assets de Release (< 2 GiB por arquivo). A primeira Release, `data-2026-11-05`, ainda não traz esses assets. O acervo bruto do SI-PNI e os extratos de pacientes da auditoria ficam locais, fora do git e das Releases.
- **HPV:** a atualização usa as coortes oficiais agregadas. A auditoria dos microdados é opcional, local e acionada à parte, com `hpv-audit`.
- **Falha de validação ou mudança de formato:**
  - a `source` afetada não publica, mantém a última versão válida, registra a falha e avisa o mantenedor pela saída do comando e pelo código de saída;
  - as `source`s independentes seguem atualizando, mas indicadores e denominadores dependentes ficam juntos, sem combinações inconsistentes;
  - uma tentativa que falhou não renova a data exibida.

## 17. Pendências

### Dívidas conhecidas

**1. Redução de tamanho.** A medição é de 06/11/2026, com HTTP gzip local, sem conferir a compressão na hospedagem.

| Medida | Medido | Meta |
|---|---:|---:|
| Saída estática completa | 999.530.479 bytes | menos de 30 MB |
| Primeira visita, cache vazio | 1.369.414 bytes gzip | cerca de 1,3 MB |

Os 5.571 documentos municipais somam 893.552.632 bytes, e os 27 perfis por UF, 81.654.299. Só os perfis já passam de 30 MB, então reduzir assets ou HTML não basta. O responsável decidiu em 06/11/2026 adiar a redução para depois da V1, e essa decisão substitui o bloqueio anterior por orçamento. A direção aceita para investigar é usar páginas compartilhadas para séries, explicações e Ações completas, acessíveis por links no Meu município, preservando os resultados e avisos locais dos seis Tipos de câncer e a leitura sem JavaScript. Não há arquitetura validada nem mudança de contrato autorizada.

**2. Sessão humana de acessibilidade.** Não há registro de sessão com leitor de tela. A automação não a substitui: o axe 4.14 não encontrou violação confirmada nas 24 análises, mas deixou verificações inconclusivas (3.498 nós de contraste e 48 de nome acessível), e os 316 testes de navegador não verificam anúncios. A sessão precisa registrar data, responsável, sistema, navegador e leitor de tela, e conferir também a semântica da Lista. O roteiro está em `docs/validation/accessibility-audit.md`. A verificação em celular real foi declarada pelo responsável ("Aconteceu, sem problemas"), sem registro de aparelho, sistema ou navegador.

**3. Revisão clínica das Ações.** O código registra `reviewer: null` em todas as Ações, e o site trata a revisão como pendente: os detalhes clínicos seguem ocultos (seção 10.4). `reviewer` não é preenchido sem nome, data e versão reais. Na revisão, reconferir também os pontos com data:

- o resgate do HPV para 15–19 anos, até 31/12/2026, que o site não menciona hoje;
- o início do FIT nas UBS, previsto para novembro de 2026, que a Ação descreve como implantação gradual.

**4. Textos propostos e decisões a confirmar.** Os textos atuais continuam valendo até a decisão do responsável.

Textos propostos, ainda não aprovados:

- **Legenda:** as entradas de melhorando, piorando e Dado insuficiente ("poucos casos no município e na sua região para dizer a direção."); a nota "Municípios com poucos casos mostram o dado do município somado ao dos vizinhos, com a mesma cor."; a entrada "Hachura (faixa C)", com a explicação "Vale para todo o estado, com 35% ou mais dos casos de 2020–2024 sem informação de tratamento. As faixas A (até 15%) e B (acima de 15% e abaixo de 35%) não têm hachura."; e a frase sobre os casos tratados com quimioterapia ou radioterapia.
- **Tooltip e tabela:** as origens "Dado do próprio município", "Seu município e vizinhos — região de X" e "Poucos casos aqui para dizer a direção"; a linha de qualidade do registro na UF com a faixa e a %, e o aviso da faixa C no tooltip; a coluna "Qualidade do registro na UF" e a nota na legenda da tabela; e a frase sobre os casos tratados com quimioterapia ou radioterapia.
- **Ressalva da próstata:** "Na próstata, acompanhar o câncer antes de tratar (vigilância ativa) pode ser a conduta correta. Por isso, começar o tratamento depois de 60 dias não indica, sozinho, falta de acesso, e este indicador não é comparado ao prazo da lei: o mapa mostra só a Tendência."
- **Nota do 60 dias:** o texto da seção 11.2.

Decisões a confirmar:

- **Mapa no desktop:** o aviso com altura mínima de 43 px a partir de 768 px; a frase de canto "A cor mostra a distância até a referência, não um ranking."; o texto sem JavaScript "O mapa e os filtros precisam de JavaScript. Consulte os municípios por UF."; e o texto da busca sem resultado, "Nenhum município encontrado."
- **Primeira tela no celular:** a folha de Filtros em `popover="manual"`; o ícone de busca como link para Municípios por UF, sem JavaScript; "Abrir consulta" fora dos resultados abaixo de 768 px; e Fontes, Código-fonte e tema no menu abaixo de 768 px.
- **Painel:** o C55 não calculável sem os pontos; "Sem dado neste recorte" com amostra neutra, sem os pontos; a ressalva sobre o mapa no celular, em que só a da próstata sai com município selecionado; "Fumantes na capital" e "Casos estimados na UF" nos títulos dos Eixos; e o toque no mapa sem mover o foco.
- **Lista:** "Tendência: Série curta, ainda sem direção" no HPV, sob o rótulo Tendência; "por 100 mil" em 12 px sob o número da mortalidade, na forma estreita; as linhas que continuam abertas ao trocar os filtros; e a Faixa C com Dado insuficiente sem a marca na linha fechada.
- **Municípios por UF e Metodologia:** `/municipios/?municipio=<código>` carregando a seleção; o índice da Metodologia que também fecha com clique fora e ao sair dele com Tab; e a linha do sumário e os resultados da busca sem preenchimento nem sublinhado.

### Requisitos antes de publicar

Já cumpridos: `LICENSE`, declarações de licença no README e link para o código-fonte no rodapé; validação da série completa ajustada pelo C55; reconferência dos links oficiais da metodologia. A medição do SI-PNI em CI deixou de ser requisito com a atualização manual.

Continuam abertos:

- revisor clínico convidado e revisão registrada (seção 10.4 e dívida 3);
- reconferência das fontes das Ações: 50–74 na mamografia, FIT, resgate do HPV e listas de sinais;
- verificação da hospedagem, inclusive a compressão.

### Após o MVP

- Substituto da razão de citopatológicos (citopatológico + DNA-HPV, SIGTAP 02.02.10.025-1), quando houver dado aberto por município de residência e uma Referência oficial.
- Itens de v2 da seção 3 e a possível parceria com o Oncoguia.
