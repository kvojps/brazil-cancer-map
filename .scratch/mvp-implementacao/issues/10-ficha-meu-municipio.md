# 10: Ficha do Meu município com o cartão do 60 dias

**What to build:** cada município tem a sua página, a ficha do Meu município, que funciona sem JavaScript para a leitura básica. Ela mostra os quatro eixos empilhados, com o Acesso ao tratamento primeiro, e o primeiro cartão de indicador completo, o do 60 dias, que serve de modelo para os demais. A metodologia pública ("Como calculamos") nasce aqui com a seção do 60 dias. Referência: spec, seções 10, 11.2, 12, 13 e 15.

**Blocked by:** 05 — Cascata da Região imediata; 06 — Faixa de qualidade A/B/C; 08 — Situação e modo "como está hoje"

**Status:** resolved

- [x] O pipeline exporta a camada da ficha: um JSON por UF com a série completa dos indicadores e tipos dos seus municípios, além da Tendência da UF de cada indicador × tipo
- [x] O Astro gera uma página estática por município (~5.570) em `/municipio/<código>-<nome>`, legível sem JS
- [x] Os quatro eixos aparecem empilhados, com o Acesso ao tratamento primeiro; os eixos ainda sem indicador ficam com espaço reservado
- [x] O cartão do 60 dias mostra: a Situação (valor e barra contra a Referência); a Tendência (classe e série com os anos provisórios tracejados, sem o número da variação); a % sem informação de tratamento ao lado; o período dos dados em destaque; a data de atualização nos detalhes; "O que é este número?"; e "Como calculamos"
- [x] No 60 dias, a barra da Situação e o gráfico mostram a mesma série, a dos casos tratados com quimio ou radio, com o título e a nota única da spec, seção 11.2; a % sem informação ao lado usa todos os casos ([tickets de decisão 27](../../mapa-cancer-br/issues/27-quebra-de-serie-do-painel.md) e [28](../../mapa-cancer-br/issues/28-queda-das-cirurgias-em-2024.md))
- [x] Com dado da região, o cartão diz "Seu município e vizinhos (região de X)", com a série e a Situação da região e uma nota de uma linha com o motivo
- [x] Com dado insuficiente, o cartão mostra o texto aprovado, a Tendência da UF como contexto ("no seu estado") e mantém a Ação
- [x] Faixa C: o cartão abre com o aviso; próstata: ressalva fixa
- [x] Ação do 60 dias com o texto curto aprovado e o "Saiba mais" com Lei 12.732/2012, Lei 13.896/2019, secretaria de saúde, Ouvidoria do SUS 136, Defensoria Pública e Ministério Público, mais o aviso "Informação geral. A equipe de saúde orienta o cuidado indicado para você."
- [x] As Ações ficam num registro de conteúdo com fonte oficial, data de conferência, público, critérios, exceções, versão revisada, data e responsável pela revisão (campos de revisão podem ficar pendentes)
- [x] A página de metodologia existe e documenta o 60 dias nos 9 itens da seção 12


## Comments

Implementado em 2026-11-03:

- Camada `profiles/<UF>.json` para as 27 UFs, com os seis tipos, séries completas disponíveis, origem geográfica, Situação, qualidade e Tendência estadual como contexto. Séries regionais são compartilhadas; casos insuficientes não expõem valores nem séries locais. A agregação territorial é compartilhada com a camada do mapa.
- Astro gera as 5.571 fichas da malha IBGE 2025 existente, em `/municipio/<código>-<nome>/`. Os seis tipos têm HTML legível sem JavaScript; o seletor melhora a navegação com JavaScript. Os quatro eixos aparecem empilhados; indicadores futuros têm espaço reservado. A tabela do mapa dá acesso às fichas; busca e abertura junto ao mapa continuam no ticket 11.
- Cartão do 60 dias com barra, gráfico, tabela acessível, anos provisórios tracejados, porcentagem sem informação, contexto regional/estadual, aviso da faixa C, ressalva da próstata e Ação permanente. Barra e gráfico usam quimio/radio; ausência de informação e faixa usam todos os casos.
- Registro editorial em `site/src/content/actions.ts`, com fontes oficiais, conferência, público, critérios, exceções, versão e revisão pendente. O Planalto bloqueou a consulta automatizada; os prazos foram reconferidos nas fontes oficiais da Câmara e do Senado. A aprovação editorial/clínica dos textos continua no ticket 26; isso não impede a implementação deste ticket.
- Metodologia pública em `/metodologia/#60-dias`, cobrindo os nove itens da spec, limites, fontes, códigos, fórmulas, quebras, cascata, qualidade, validações, reprodução e reutilização.
- Reexecutadas `compute`, `validate` e `export` com os dados locais de 17/10/2026. Os 33 JSON de mapa/ficha mantiveram hashes idênticos após a refatoração. O manifesto identifica a versão commitada `0.1.0+d6256ba`. Os alertas de patamar mensal previstos continuaram sendo emitidos.
- Validação final: 99 testes Python e 9 testes do site passando; mypy sem erros; Astro check sem erros, avisos ou hints. Os testes do site executam o build e verificam o HTML publicado para município, região, dado insuficiente, faixa C, próstata e metodologia. Sem teste interativo em navegador.
- Revisão `code-review`, base `2f36760`, em dois agentes: Spec sem achados; Standards apontou o fechamento do ticket e sugeriu remover duplicações de agregação e slug. As duas duplicações foram corrigidas, e este commit conclui o fechamento.
- Medição do build: 5.571 HTMLs municipais, cerca de 308 MB sem compressão e estimativa de 34,8 MB gzip (amostra de 56 páginas), além dos assets. Os 27 JSON de ficha somam 9,7 MB sem compressão e 0,53 MB gzip. O conjunto supera a estimativa inicial de menos de 30 MB da seção 13; a leitura sem JavaScript inclui os seis tipos em cada HTML. O tamanho foi registrado para o acompanhamento do orçamento do MVP, sem alterar o contrato ou suprimir conteúdo exigido.

Commits que resolveram o ticket:

- `f933517` — `feat: add static municipality profiles and treatment methodology`.
- `d6256ba` — `refactor: share territorial series aggregation for municipality profiles`.
- Commit deste fechamento — `docs: resolve municipality profile ticket and pin published data version`.
