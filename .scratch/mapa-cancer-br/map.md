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

## Not yet specified

- **Apresentação responsável:** taxas padronizadas por idade, aviso de "isto não é orientação médica", créditos e citação das fontes. A medição de qualidade por UF já mostrou o que esta seção vai precisar decidir: marcação dos últimos anos como provisórios, redistribuição do C55 na mortalidade por colo do útero e exibição da % "sem informação de tratamento" junto do indicador. A medição dos outros tipos acrescentou mais dois pontos: a ressalva precisa ser por UF **e** por tipo, já que as faixas mudam com o tipo; e a mortalidade colorretal precisa tratar o C26 (digestivo mal definido). A escolha dos indicadores acrescentou mais dois pontos: a Referência de cada indicador sem meta oficial; e a nota de método explicando por que "Todos" muda de definição entre os eixos. A regra da Tendência e os municípios pequenos já viraram ticket (ver [Como classificar a Tendência e tratar municípios pequenos no mapa?](issues/12-tendencia-e-municipios-pequenos.md)). O protótipo acrescentou mais um ponto: como o mapa e a legenda deixam claro que a cor não é ranking.
- **Conteúdo de ação:** o que o site diz para fazer (onde se tratar, a Lei dos 60 dias, como pedir rastreamento no SUS) e quem valida esse conteúdo. Candidato: parceria com o Oncoguia, a avaliar com o protótipo em mãos.
- **Atualização dos dados:** com que frequência e como (manual ou por automação agendada no CI).
- **Identidade:** nome, domínio gratuito, acessibilidade (WCAG) e uso em celular.

## Out of scope

- Construir e publicar o site (é execução, fica depois do destino).
- Dados individuais de pacientes ou qualquer coisa sujeita à LGPD além de dados públicos agregados.
- Orientação médica personalizada.
- Tipos de câncer além dos 5 do seletor (estômago, boca, fígado, pele, bexiga…) e os indicadores adiados em [Quais indicadores entram no MVP?](issues/04-indicadores-do-mvp.md): ficam para a v2 do site, depois deste mapa.
- Infraestrutura paga, backend ou banco de dados.
