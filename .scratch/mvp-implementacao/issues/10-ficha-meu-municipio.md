# 10: Ficha do Meu município com o cartão do 60 dias

**What to build:** cada município tem a sua página, a ficha do Meu município, que funciona sem JavaScript para a leitura básica. Ela mostra os quatro eixos empilhados, com o Acesso ao tratamento primeiro, e o primeiro cartão de indicador completo, o do 60 dias, que serve de modelo para os demais. A metodologia pública ("Como calculamos") nasce aqui com a seção do 60 dias. Referência: spec, seções 10, 11.2, 12, 13 e 15.

**Blocked by:** 05 — Cascata da Região imediata; 06 — Faixa de qualidade A/B/C; 08 — Situação e modo "como está hoje"

**Status:** ready-for-agent

- [ ] O pipeline exporta a camada da ficha: um JSON por UF com a série completa dos indicadores e tipos dos seus municípios, além da Tendência da UF de cada indicador × tipo
- [ ] O Astro gera uma página estática por município (~5.570) em `/municipio/<código>-<nome>`, legível sem JS
- [ ] Os quatro eixos aparecem empilhados, com o Acesso ao tratamento primeiro; os eixos ainda sem indicador ficam com espaço reservado
- [ ] O cartão do 60 dias mostra: a Situação (valor e barra contra a Referência); a Tendência (classe e série com os anos provisórios tracejados, sem o número da variação); a % sem informação de tratamento ao lado; o período dos dados em destaque; a data de atualização nos detalhes; "O que é este número?"; e "Como calculamos"
- [ ] No 60 dias, o gráfico mostra a série da Tendência (casos tratados com quimio ou radio), com o título e a nota da spec, seção 11.2; a barra da Situação e a % sem informação usam todos os casos; enquanto o último ano for 2024, o cartão leva a nota da queda das cirurgias ([ticket de decisão 27](../../mapa-cancer-br/issues/27-quebra-de-serie-do-painel.md))
- [ ] Com dado da região, o cartão diz "Seu município e vizinhos (região de X)", com a série e a Situação da região e uma nota de uma linha com o motivo
- [ ] Com dado insuficiente, o cartão mostra o texto aprovado, a Tendência da UF como contexto ("no seu estado") e mantém a Ação
- [ ] Faixa C: o cartão abre com o aviso; próstata: ressalva fixa
- [ ] Ação do 60 dias com o texto curto aprovado e o "Saiba mais" com Lei 12.732/2012, Lei 13.896/2019, secretaria de saúde, Ouvidoria do SUS 136, Defensoria Pública e Ministério Público, mais o aviso "Informação geral. A equipe de saúde orienta o cuidado indicado para você."
- [ ] As Ações ficam num registro de conteúdo com fonte oficial, data de conferência, público, critérios, exceções, versão revisada, data e responsável pela revisão (campos de revisão podem ficar pendentes)
- [ ] A página de metodologia existe e documenta o 60 dias nos 9 itens da seção 12
