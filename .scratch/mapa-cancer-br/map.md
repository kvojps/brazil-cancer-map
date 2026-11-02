# Mapa do Câncer no Brasil

Labels: wayfinder:map

## Destination

Uma **spec de MVP pronta para construir** de um mapa público do câncer no Brasil, mais uma **decisão de viabilidade (go/no-go)**. A spec define as fontes de dados, os indicadores por eixo, a experiência "meu município", a stack e a hospedagem gratuita. Construir e publicar o site fica depois deste mapa.

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

## Not yet specified

- **Apresentação responsável:** municípios pequenos com números instáveis, taxas padronizadas por idade, aviso de "isto não é orientação médica", créditos e citação das fontes.
- **Conteúdo de ação:** o que o site diz para fazer (onde se tratar, a Lei dos 60 dias, como pedir rastreamento no SUS) e quem valida esse conteúdo.
- **Atualização dos dados:** com que frequência e como (manual ou por automação agendada no CI).
- **Identidade:** nome, domínio gratuito, acessibilidade (WCAG) e uso em celular.

## Out of scope

- Construir e publicar o site (é execução, fica depois do destino).
- Dados individuais de pacientes ou qualquer coisa sujeita à LGPD além de dados públicos agregados.
- Orientação médica personalizada.
- Infraestrutura paga, backend ou banco de dados.
