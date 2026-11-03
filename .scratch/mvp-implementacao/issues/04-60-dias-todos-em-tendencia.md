# 04: Até 60 dias × Todos pinta o mapa em Tendência

**What to build:** o Mapa inicial abre no estado padrão — até 60 dias × Todos os cânceres × Tendência — com cada município pintado pela classe da sua Tendência, usando só o dado do próprio município (a cascata vem no ticket 05). É o primeiro indicador de ponta a ponta e traz o módulo de Tendência que os demais indicadores reaproveitam. Referência: spec, seções 4, 5, 6.4, 7, 11.1, 13, 14 e 15.

**Blocked by:** 02 — Tracer bullet: malha IBGE até o mapa no site

**Status:** ready-for-agent

- [ ] O pipeline baixa o Painel-Oncologia (DBC) com cache incremental e o limpa para Parquet padronizado, aplicando a definição de "Todos" do tratamento (C00–C97 sem C44, C73 e C76–C80) e marcando os 2 últimos anos de diagnóstico como provisórios
- [ ] O cálculo produz, por município de residência, a % em até 60 dias e a % sem informação de tratamento
- [ ] O módulo de Tendência calcula uma única variação percentual anual relativa sobre até 10 anos consolidados, com IC 95%, e classifica em melhorando, piorando, estável (IC inteiro dentro de ±1% ao ano) ou sem direção clara; os anos provisórios não entram
- [ ] O 60 dias usa quasi-Poisson com ligação log e offset `log(casos)`; o módulo tem testes com séries sintéticas para cada classe
- [ ] A validação compara a % em até 60 dias por UF com o TabNet; se falhar, nada do Painel é publicado
- [ ] A camada do mapa (um JSON por indicador × tipo, com os 5.570 municípios) traz a classe, o último valor e a % sem informação; o `manifest.json` traz a data de extração, a versão do pipeline e o período publicado
- [ ] O mapa pinta as cores da Tendência sem vermelho (verde-azulado, âmbar, cinza médio, cinza claro) e mostra a legenda de 5 entradas com os textos aprovados
- [ ] O tooltip mostra o nome do lugar, o indicador, o período, a classe e a origem do dado
- [ ] Uma tabela alternativa acessível pelo teclado apresenta o mesmo conteúdo do mapa
- [ ] O front não faz nenhuma conta estatística
