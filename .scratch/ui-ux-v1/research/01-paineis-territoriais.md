# Painéis territoriais: referências para entender e explorar um município

Pesquisa do [Quais padrões de painéis territoriais e de saúde ajudam a entender e explorar um município?](../issues/01-paineis-territoriais.md), conferida em 04/11/2026. Subsídio para protótipos e decisão humana; não aprova direção visual nem altera método ou contrato de dados.

## Resultado

As seis referências oferecem peças complementares: entrada por lugar (IBGE), consulta especializada (INCA e Radar), visão local multidimensional (Fingertips e State Cancer Profiles) e exploração cartográfica com adaptação móvel documentada (CDC PLACES). Nenhuma evidência consultada demonstra que copiar uma dessas interfaces melhora a compreensão do nosso público. A hipótese mais promissora para avaliar é combinar **território e período explícitos, mapa com seleção persistente, ficha local por Eixo e acesso progressivo à explicação técnica**, mantendo a Ação visível.

## Método e limites

- **O — observação direta:** conteúdo e controles expostos pela extração textual da página pública. Não equivale a operação em navegador visual.
- **D — documentação do produto:** descrição publicada pelo responsável; confirma o comportamento declarado, sem provar execução ou facilidade de uso.
- **I — inferência:** interpretação ou proposta desta pesquisa, a ser testada.

Foram relidas a [pesquisa anterior](../../mapa-cancer-br/research/02-solucoes-existentes.md), o [mapa deste esforço](../map.md), o [Glossário](../../../GLOSSARY.md) e a [spec §§2, 5–11 e 13–15](../../mapa-cancer-br/spec-mvp.md). As fontes abaixo foram abertas novamente: conclusões antigas sobre atualização, exclusividade, licenças ou granularidade não são tomadas como prova atual. A busca foi intencional, não um inventário exaustivo. Não houve testes com usuários, leitor de tela, toque, desempenho ou auditoria de conformidade. Interfaces JavaScript podem ter controles que a extração não mostra; ausência na extração não prova ausência no produto.

## Comparação de seis sistemas

| Sistema e fontes primárias | Evidência observada/documentada | Implicação para o Observatório (I) | Limite de inspeção |
|---|---|---|---|
| **IBGE Cidades** — [entrada oficial](https://www.ibge.gov.br/cidadesat/), [guia IBGE Educa](https://educa.ibge.gov.br/criancas/brasil/2849-seu-estado-e-sua-cidade/19640-vamos-conhecer-o-brasil.html) | O: entrada distingue Brasil, estados e municípios, com escolha de lugar. D: o guia ensina busca por nome, Panorama com mapas/gráficos e Pesquisas para aprofundar e comparar. | Adotar a orientação pelo lugar e adaptar panorama → detalhe. Evitar rankings: o próprio portal os oferece, mas são incompatíveis com nossa Referência. Não transformar “comparar” em competição entre municípios. | A URL [Recife/Panorama](https://cidades.ibge.gov.br/brasil/pe/recife/panorama) retornou 403. Organização interna vem do guia oficial, não de inspeção visual da ficha atual. |
| **Atlas On-line de Mortalidade / INCA** — [entrada e modelos](https://mortalidade.inca.gov.br/MortalidadeWeb/) | O: separa consultas em modelos; identifica finalidade, unidade e recortes antes da consulta. Há modelos para mapa municipal de taxas, taxas ajustadas e AAPC. O público declarado é profissional de saúde pública. | Adotar definição, unidade e período reconhecíveis; adaptar opções técnicas para “O que é este número?” e metodologia. Evitar obrigar o cidadão a escolher modelo estatístico antes de obter uma resposta territorial. | Extração da entrada, sem completar formulários ou validar saídas. Não se confirmou experiência móvel ou exportação. A existência de AAPC não implica equivalência ao método do MVP. |
| **Radar do Câncer / Oncoguia** — [gráfico dinâmico](https://radardocancer.org.br/grafico-dinamico) | O: filtros de métrica, câncer, período, idade, sexo, raça/cor, UF de tratamento e estadiamento; botões aplicar/limpar; configuração dos eixos X/Y. | Adaptar descoberta dos filtros e rótulos de geografia. Evitar transportar toda essa densidade à entrada e chamar UF de tratamento de dado do município de residência. Separar o recorte do dado da localização de quem visita. | Só controles extraídos; não se executaram filtros. Não se verificaram valores, resultados, acessibilidade, atualização nem completude das fontes por indicador. |
| **Fingertips / DHSC** — [perfis locais](https://fingertips.phe.org.uk/profile/health-profiles), [guia](https://fingertips.phe.org.uk/profile/guidance) | D: reúne indicadores para visão da saúde local; permite diferentes níveis geográficos, comparação com média regional/nacional e exportação. O: a página registra atualizações por indicador, não só uma data genérica do portal. | Adaptar perfil multidimensional e proveniência por indicador. Evitar importar a média regional como nossa Referência: metas e Brasil seguem as decisões locais. Separar “período do dado” de “atualizado em”. | A visão interativa não foi operada. A [declaração de acessibilidade](https://fingertips.phe.org.uk/information/site-accessibility-statement) documenta falhas: contraste, teclado, rótulos e informação só por cor. É alerta, não certificação a reproduzir. |
| **State Cancer Profiles / NCI e CDC** — [Quick Profiles](https://statecancerprofiles.cancer.gov/quick-profiles/index.php), [guia específico](https://statecancerprofiles.cancer.gov/help/about/quick_profiles.html) | O: seleção de estado e alternativa por formulário ao mapa. D: perfil organiza tabelas por tema ao longo do controle do câncer, com valores estaduais/nacionais e links para gráficos e mapas mais detalhados. | Adotar caminho equivalente sem mapa e aprofundamento a partir de um resumo. Adaptar para os quatro Eixos, com Acesso primeiro. Não copiar classificação ou cálculo de tendências: a documentação usa Joinpoint e segmento recente, diferente do MVP. | Perfil estadual, não ficha municipal observada. Nenhuma saída específica foi validada. O link de pular mapa é evidência de alternativa, não prova de acessibilidade completa. |
| **CDC PLACES** — [apresentação](https://www.cdc.gov/places/tools/interactive-map-tool.html), [guia de uso](https://www.cdc.gov/places/tools/explore-places-interactive-map.html) | D: mapa inicia nacional, oferece categorias/medidas e busca; níveis mudam com zoom. Guia documenta teclas para mover/zoom e, no celular, menus verticais e detalhes/legenda inferiores. D: estimativas são modeladas. | Adaptar detalhe inferior no celular e seleção explícita de tema. Evitar trocar a origem estatística ao dar zoom: nossa cascata é definida pelo pipeline. Não esconder a legenda como condição para entender a cor. | Não se operou o aplicativo ArcGIS; mobile e teclado vêm do guia. Não se importam estimativas, prevalência ou metodologia PLACES. |

## O que adotar, adaptar ou evitar nos protótipos

As propostas seguintes são **inferências de design**, apoiadas nos padrões acima e limitadas pelas regras do projeto. Não são decisões aprovadas.

### Hierarquia e orientação

**Adotar:** cabeçalho territorial claro (“Brasil” ou município + UF), seleção por busca além do clique e resumo que conduz ao detalhe. IBGE e Quick Profiles sustentam a existência desse padrão, sem demonstrar sua eficácia aqui.

**Adaptar:** avaliar indicadores ao redor do mapa central, como pede o mapa deste esforço, sem criar um placar sintético de “saúde do município”. Cada número precisa declarar seu território, recorte e período. Ao selecionar município, é necessário distinguir o que mudou para o contexto local do que continua sendo Brasil. Um bloco nacional residual com título ambíguo pode induzir leitura local.

**Evitar:** somar casos municipais/regionais apresentados pela cascata para produzir resumo Brasil: os dados regionais repetem-se nos municípios. Qualquer novo resumo nacional requer definição metodológica e, se faltar no contrato, proposta explícita de alteração, calculada no pipeline (§§13–15).

### Seleção e filtros

**Adotar:** busca, seleção territorial visível, contorno e caminho equivalente em texto/tabela. A seleção precisa sobreviver à leitura do detalhe e constar na URL conforme [Com que indicador, tipo e modo o Mapa inicial abre?](../../mapa-cancer-br/issues/26-estado-inicial-do-mapa.md).

**Adaptar:** expor Tipo de câncer, Indicador e modo com rótulos; detalhes adicionais podem ficar próximos da explicação técnica. O Radar mostra que filtros especializados cabem numa área própria, mas não prova que todos devem ocupar o topo. Preservar o aviso quando a troca de tipo força outro indicador e os motivos das opções incompatíveis (§11.1).

**Evitar:** adotar camadas geográficas automáticas do PLACES. Município selecionado continua sendo o município; a origem do Indicador pode ser município, Região imediata, UF ou capital conforme a regra específica, nunca conforme o zoom. Não permitir que um mapa de estabelecimentos substitua silenciosamente residência por tratamento.

### Séries, contexto e honestidade

**Adotar:** distinguir uma visão resumida dos detalhes de fonte e método, como Quick Profiles. **Adaptar:** no cartão, nomear separadamente “Como mudou” (Tendência) e “Como está hoje” (Situação versus Referência). Mostrar período próprio de cada componente, não uma data única que sugira simultaneidade. “Hoje” usa último ano consolidado, não tempo real.

**Evitar:** converter tendência em posição relativa ou importar semáforos de outros produtos. Estável e sem direção clara não são sinônimos. Mortalidade tem apenas Tendência; HPV não tem Tendência estatística; próstata não tem Situação. A série pode mostrar virada recente sem mudar a classe calculada para toda a janela. Preservar tracejado de provisórios e notas de quebras (§§5–9).

### Qualidade e origem perto do número

**Adotar:** origem e período junto ao resultado, atualização e fonte no aprofundamento. **Adaptar:** “Seu município e vizinhos — região de X” explica o dado emprestado sem chamar o lugar de “agregado”. Dado insuficiente exige mensagem própria; o contexto da UF deve se identificar como contexto e não ocupar a posição de resultado municipal (§§8 e 11).

**Evitar:** uma nota geral de qualidade que apague diferenças por indicador. A/B/C vale para UF × tipo e qualidade do registro do tratamento; não mede desempenho clínico nem todos os Eixos. A % sem informação fica ao lado do 60 dias, com seus recortes distintos: todos os diagnosticados para qualidade, quimio/radio para valor e série. Faixa C conserva hachura e aviso; insuficiência conserva pontos. Não usar nenhuma dessas texturas como decoração.

### Ação e público misto

**Adotar:** uma leitura curta útil com acesso à explicação. **Adaptar:** colocar Ação no percurso principal, sem condicionar seu aparecimento à cor, ao resultado ou à disponibilidade de dado. Fontes técnicas ficam acessíveis por “O que é este número?” e “Como calculamos”; isso atende profundidades distintas sem criar entradas por perfil.

**Evitar:** concluir da mortalidade ou do indicador territorial qual exame ou tratamento uma pessoa deve fazer. Manter aviso de informação geral, critérios e canais nos detalhes. Não trocar a Ação aprovada por recomendação gerada a partir do município (§10). “Onde se tratar” informa encaminhamento, não reserva nem escolha direta de hospital.

### Mobile e acessibilidade

**Adaptar:** avaliar ficha abaixo do mapa, em fluxo de página, com busca e território sempre reconhecíveis. O detalhe inferior documentado no PLACES sustenta a possibilidade, mas não determina se painel deslizante ou seção normal funciona melhor. Não exigir gesto de arrastar, hover ou descoberta de ícone para conhecer Ação, qualidade ou legenda.

**Adotar como requisito do projeto:** teclado em toda interação, alternativas textuais/tabela, rótulos além de cor e leitura básica da página municipal sem JavaScript (§§2 e 11). A declaração do Fingertips mostra por que aparência institucional não é evidência de conformidade. Testar foco, leitura e rolagem em tela estreita; cartões densos e barras fixas podem ocultar conteúdo. Não houve avaliação dessas propriedades nesta pesquisa.

## Questões que a evidência não decide

1. Quantos resumos Brasil/local devem aparecer sem competir com mapa, ressalvas e Ação?
2. As pessoas reconhecem a mudança de contexto Brasil → município e a origem regional sem explicação do moderador?
3. Conseguem explicar a diferença entre Tendência, Situação e qualidade e localizar o período correto?
4. Em tela estreita, encontram o detalhe e a Ação sem perder a seleção? Conseguem repetir por teclado e alternativa tabular?
5. Qual aprofundamento técnico atende gestores sem tornar obrigatória a configuração extensa vista no Radar/Atlas?

Essas questões pedem protótipos e avaliação pelo responsável e pelo público. Não há base aqui para declarar um layout vencedor, atestar acessibilidade ou substituir a validação clínica/editorial pendente. O aviso de construção e os requisitos de lançamento da spec §2 continuam obrigatórios.
