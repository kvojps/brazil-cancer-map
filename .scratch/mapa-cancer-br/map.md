# Mapa do Câncer no Brasil

Labels: wayfinder:map

## Destination

Uma **spec de MVP pronta para construir** de um mapa público do câncer no Brasil, mais uma **decisão de viabilidade (go/no-go)**. A spec define as fontes de dados, os indicadores por eixo e por tipo de câncer, a experiência "meu município", a stack e a hospedagem gratuita. Construir e publicar o site fica depois deste mapa.

## Notes

- **Tom:** esperança com honestidade. O mapa mostra o que dá para fazer e onde a situação melhora, sem esconder onde está ruim. Não é um "mapa de mortes".
- **Eixos:** Prevenção, Detecção precoce, Acesso ao tratamento (carro-chefe) e Panorama. Mortalidade aparece **só como tendência**, nunca como contagem absoluta de óbitos em destaque. Ver `GLOSSARY.md`.
- **Granularidade:** município sempre que a fonte permitir, UF no resto.
- **Público:** principal é o cidadão comum (inclusive pacientes e familiares); jornalistas e gestores são secundários. Linguagem simples.
- **Série histórica** é essencial no MVP, porque a tendência sustenta a mensagem de esperança.
- **Hospedagem:** site estático, sem backend, código aberto, dados pré-processados offline (GitHub Pages ou Cloudflare Pages).
- **Se já existir solução:** construímos mesmo assim se o que existir for técnico ou fragmentado. Desistimos só se já houver algo de "esperança + ação" voltado ao cidadão.
- Skills: `grilling` + `domain-modeling` (default), `research`, `prototype`.
- Tracker: markdown local (`.scratch/mapa-cancer-br/`). O repo não usa git, então as pesquisas ficam em `.scratch/mapa-cancer-br/research/`.

## Decisions so far

- [Quais dados públicos existem para cada eixo?](issues/01-dados-disponiveis-por-eixo.md): sim, os quatro eixos são viáveis com dado aberto e série de 10 anos ou mais. Acesso ao tratamento (Painel-Oncologia) é o mais forte e é municipal. A incidência só existe por UF e capital, e o tabagismo só por capital ou UF.
- [Já existe alguma solução que faz isso?](issues/02-solucoes-existentes.md): não. As ferramentas existentes são técnicas ou param na UF. A mais próxima é o Radar do Câncer (Oncoguia), que é estadual, sem download e sem orientar ação. Há espaço livre para um mapa municipal de "esperança + ação".
- [Como servir um mapa municipal do Brasil num site estático gratuito?](issues/03-hospedagem-e-mapa-estatico.md): cabe com folga. A primeira visita baixa ~1,3 MB e o site inteiro tem menos de 30 MB. Recomendação: Cloudflare Pages (com GitHub Pages como alternativa), MapLibre GL JS + TopoJSON simplificado do IBGE, dados em JSON por indicador. Sem DuckDB-WASM e sem PMTiles no MVP.
- [Vale construir, e como se diferenciar?](issues/05-go-no-go-e-posicionamento.md): **go**. Posicionamento: "Veja como está o cuidado com o câncer no seu município, e o que você pode fazer." O núcleo é município + Ação (novo termo no glossário), e todo indicador precisa ter uma Ação ou justificar a falta dela. O Oncoguia é citado, e a parceria fica para depois.
- [Qual a qualidade dos dados de mama e colo do útero por UF?](issues/09-medir-completude-por-uf.md): o dado se sustenta, então o go continua de pé. O gargalo é a % "sem informação de tratamento" do Painel-Oncologia: as faixas são A (SE, PI, TO, PA, AL, CE), B (16 UFs) e C (MA, RO, RN, AP, RR). O SIM está bom. O estadiamento do Painel não serve como indicador de detecção precoce. O C55 e os anos recentes pedem tratamento.
- [Qual é o recorte do MVP (tipos de câncer e região)?](issues/08-recorte-do-mvp.md): o MVP cobre o Brasil inteiro, e as UFs da faixa C ficam com ressalva. A visão padrão é "Todos os cânceres", com seletor de 6 tipos candidatos (mama, colo do útero, próstata, colorretal, pulmão, estômago). Quando um eixo não tem indicador para um tipo, ele mostra a justificativa. A lista depende da medição de qualidade dos outros tipos.
- [Qual a qualidade dos dados dos outros tipos de câncer por UF?](issues/10-medir-completude-outros-tipos.md): próstata, colorretal e pulmão se sustentam, mas o estômago não (56% sem tratamento, 10 UFs na faixa C). A recomendação é um seletor com 5 tipos. O "Todos" precisa excluir C76–C80. A faixa de qualidade muda com o tipo, e "até 60 dias" não serve para próstata sem ressalva.
- [Quais indicadores entram no MVP?](issues/04-indicadores-do-mvp.md): o seletor tem 5 tipos (sem estômago). São 8 indicadores: até 60 dias + onde se tratar (Acesso ao tratamento), mamografia e citopatológico no SISCAN (Detecção precoce), HPV municipal + tabagismo na capital (Prevenção), e tendência de mortalidade + casos estimados por UF (Panorama). Todo cartão mostra a situação comparada a uma Referência, a tendência e a Ação, sem ranking.
- [Como a experiência "meu município" deve parecer?](issues/06-experiencia-meu-municipio.md): a página inicial é o mapa do Brasil por município, pintado pela Tendência (o modo "como está hoje" é opcional, e a mortalidade aparece só como tendência). Ao clicar ou buscar, o mapa aproxima no estado e abre a ficha por eixo, com Acesso ao tratamento primeiro. As UFs da faixa C ficam hachuradas. O protótipo está no branch `prototype/06-meu-municipio`.
- [Qual stack e pipeline de dados usar?](issues/07-stack-e-pipeline.md): site em Astro com uma página estática por município e o mapa em MapLibre como ilha, sem mapa base. Pipeline em Python + DuckDB com 5 etapas (baixar com cache → limpar → calcular → validar → exportar). O front não faz conta. O contrato de dados tem a camada do mapa por indicador × tipo e a camada da ficha por UF, com JSON commitado e Parquet na Release. O denominador é a população MS/SVS, e a referência territorial é a malha 2025.
- [Que métodos existem para classificar tendência e estabilizar taxas de municípios pequenos?](issues/11-metodos-tendencia-e-pequenos-numeros.md): o padrão é a variação anual com intervalo de confiança, com "dado insuficiente" separado de "estável". Com 10 anos e poucos casos, a maioria dos municípios não terá tendência própria detectável. As opções são agregar (região imediata ou de saúde) ou suavizar (bayesiana empírica). A HPV ainda não sustenta uma tendência estatística.
- [Qual a série e o formato da estimativa populacional do MS/SVS por município, sexo e idade?](issues/13-denominador-populacional.md): a fonte é o POPSVS no FTP do DATASUS, 2000–2025, com município × sexo × idade simples. A série foi toda refeita pós-Censo 2022 em 2025, sem quebra, mas não bate com números oficiais antigos. O PNI calcula a cobertura HPV com o Censo 2022 fixo, e não com o POPSVS.
- [Como classificar a Tendência e tratar municípios pequenos no mapa?](issues/12-tendencia-e-municipios-pequenos.md): a Tendência tem 4 classes (melhorando, piorando, estável e sem direção clara), mais "dado insuficiente". A classe sai do IC 95% de uma única variação anual nos últimos até 10 anos consolidados, sem os anos provisórios. O HPV fica sem Tendência e o mapa dele abre em "como está hoje". O município com média abaixo de 20 por ano usa o dado da Região imediata. Se nem a região passa do mínimo, ele fica como dado insuficiente (pontos no mapa), e a mesma regra vale no mapa e na ficha.
- [Com que frequência cada fonte do MVP publica dados novos?](issues/17-calendario-das-fontes.md): Painel, CNES e SI-PNI saem todo mês e o SIM fecha o ano X em dezembro de X+1. Quase tudo cabe em menos de 3 GB, menos o SISCAN (24 GB) e o SI-PNI (~215 GB, ano corrente regravado todo mês). O GitHub Actions gratuito serve processando em fluxo, com o estado fora do cache de 7 dias.
- [Que metas oficiais existem para os indicadores do MVP?](issues/14-metas-oficiais.md): há meta oficial para 60 dias (100%, lei), mamografia e citopatológico (razão 1, INCA), HPV (90% até 2030, Plano de Dant) e tabagismo (5,9% em 2030). A mortalidade não tem meta compatível com o indicador. Ficaram em aberto a faixa 50–74 da mamografia (NT 626/2025) e o efeito do DNA-HPV no citopatológico.
- [O que o SUS e a lei garantem ao cidadão em cada Ação?](issues/16-direitos-e-orientacoes-sus.md): o tratamento começa em até 60 dias e os exames de diagnóstico saem em até 30. Se o prazo falhar, o caminho é secretaria, 136, Defensoria ou MP. A regulação define o hospital. Desde 2025 a mamografia é 50–74 a cada 2 anos e o colo usa DNA-HPV. O FIT colorretal chega ao SUS em 11/2026 e reabre a Ação de colorretal.
- [Como as fontes oficiais tratam C55, C26 e a padronização por idade na mortalidade?](issues/15-metodos-mortalidade.md): o INCA não redistribui nada. Usa o C53 do SIM e padroniza pela população mundial de Segi com 80+, e o pipeline reproduz o número com ~1% de diferença. O C55 caiu ao longo da série e infla a tendência do colo em ~1 ponto ao ano, então redistribuí-lo ainda pede decisão. O C26 quase não pesa.
- [Qual é a Referência de cada indicador?](issues/18-referencia-de-cada-indicador.md): 60 dias = 100%, mamografia e citopatológico = razão 1, HPV = 90% (Censo 2022 fixo), tabagismo = 5,9%. A mortalidade não tem Situação, só Tendência. O "como está hoje" tem 3 faixas fixas (alcançou, perto ≥ 80% e longe), sem quantis e numa escala de um só tom. A mamografia fica em 50–69, o citopatológico congela em 2025 com a ressalva do DNA-HPV, e a próstata fica sem Situação no 60 dias.

- [Que regras de método e ressalvas a mortalidade e o Acesso ao tratamento mostram?](issues/19-metodo-e-ressalvas.md): Segi/Doll com 80+, redistribuição do C55, qualidade por UF × tipo e notas visíveis; o MVP terá metodologia pública reproduzível, da fonte ao dado exibido.

- [Que Ação cada indicador mostra, e quem valida o conteúdo?](issues/20-conteudo-das-acoes.md): textos curtos dos oito indicadores aprovados, com detalhes expansíveis e alternativas por tipo; Ação sempre visível, oferta local só com confirmação e revisão profissional de conteúdo clínico exigida antes de publicar, sob responsabilidade do projeto.

- [Quando e onde o pipeline roda para atualizar os dados?](issues/21-atualizacao-dos-dados.md): atualização por fonte no GitHub Actions gratuito de repositório público, com execução local para etapas pesadas que não couberem; falhas preservam a última versão válida, e o site distingue período dos dados de data de atualização, identificando o citopatológico como série encerrada.

- [Qual o nome, o domínio e a licença do projeto?](issues/22-nome-dominio-licenca.md): Observatório do Câncer no Brasil, com foco nos dados, custo zero, código aberto com copyleft e acessibilidade obrigatória; a licença concreta será escolhida em ticket próprio.

- [Qual licença expressa a abertura aprovada para o código?](issues/24-licenca-do-codigo.md): AGPL-3.0-or-later para o código (cobre também forks modificados que rodam como serviço na rede), CC BY-SA 4.0 para os textos do projeto e contribuições sem CLA. Os dados continuam seguindo as condições de cada fonte.

- [Em que escala vale a faixa de "estável" (±1% ao ano) para proporções, razões e tabagismo?](issues/25-escala-da-faixa-estavel.md): a Tendência é sempre a variação percentual anual (relativa, nunca p.p.), com ±1% para todos os indicadores. O 60 dias passa a usar Poisson modificado, o tabagismo usa regressão ponderada do log, e a metodologia avisa que amostras pequenas raramente chegam a "estável".

- [Consolidar a spec do MVP](issues/23-consolidar-spec.md): a spec está em [spec-mvp.md](spec-mvp.md), com cada regra apontando para o seu ticket. Duas lacunas viraram tickets (a escala do "estável" e o estado inicial do mapa), e os requisitos de execução antes de publicar ficaram reunidos na seção 17.

- [Com que indicador, tipo e modo o Mapa inicial abre?](issues/26-estado-inicial-do-mapa.md): abre em até 60 dias × Todos os cânceres × Tendência, com a hachura da faixa C visível. A URL guarda o estado (município no caminho, o resto na query string) e nada é lembrado entre visitas. Combinações inválidas voltam ao padrão, com um aviso na troca de tipo.

## Not yet specified

Nada. A spec está consolidada em [spec-mvp.md](spec-mvp.md) e não há tickets abertos.

## Out of scope

- Construir e publicar o site (é execução, fica depois do destino).
- Dados individuais de pacientes ou qualquer coisa sujeita à LGPD além de dados públicos agregados.
- Orientação médica personalizada.
- Tipos de câncer além dos 5 do seletor (estômago, boca, fígado, pele, bexiga…) e os indicadores adiados em [Quais indicadores entram no MVP?](issues/04-indicadores-do-mvp.md): ficam para a v2 do site, depois deste mapa.
- Infraestrutura paga, backend ou banco de dados.
- O substituto da razão de citopatológicos (citopatológico + DNA-HPV, SIGTAP 02.02.10.025-1): o MVP fica completo com a série congelada em 2025 ([Qual é a Referência de cada indicador?](issues/18-referencia-de-cada-indicador.md)), e o substituto depende de dado aberto por município de residência e de uma Referência oficial que ainda não existem. Fica para depois do MVP.
