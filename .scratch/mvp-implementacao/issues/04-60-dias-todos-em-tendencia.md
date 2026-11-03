# 04: Até 60 dias × Todos pinta o mapa em Tendência

**What to build:** o Mapa inicial abre no estado padrão — até 60 dias × Todos os cânceres × Tendência — com cada município pintado pela classe da sua Tendência, usando só o dado do próprio município (a cascata vem no ticket 05). É o primeiro indicador de ponta a ponta e traz o módulo de Tendência que os demais indicadores reaproveitam. Referência: spec, seções 4, 5, 6.4, 7, 11.1, 13, 14 e 15.

**Blocked by:** 02 — Tracer bullet: malha IBGE até o mapa no site

**Status:** resolved

- [x] O pipeline baixa o Painel-Oncologia (DBC) com cache incremental e o limpa para Parquet padronizado, aplicando a definição de "Todos" do tratamento (C00–C97 sem C44, C73 e C76–C80) e marcando os 2 últimos anos de diagnóstico como provisórios
- [x] O cálculo produz, por município de residência, a % em até 60 dias e a % sem informação de tratamento
- [x] O módulo de Tendência calcula uma única variação percentual anual relativa sobre até 10 anos consolidados, com IC 95%, e classifica em melhorando, piorando, estável (IC inteiro dentro de ±1% ao ano) ou sem direção clara; os anos provisórios não entram
- [x] O 60 dias usa quasi-Poisson com ligação log e offset `log(casos)`; o módulo tem testes com séries sintéticas para cada classe
- [x] A validação compara a % em até 60 dias por UF com o TabNet; se falhar, nada do Painel é publicado
- [x] A camada do mapa (um JSON por indicador × tipo, com os 5.570 municípios) traz a classe, o último valor e a % sem informação; o `manifest.json` traz a data de extração, a versão do pipeline e o período publicado
- [x] O mapa pinta as cores da Tendência sem vermelho (verde-azulado, âmbar, cinza médio, cinza claro) e mostra a legenda de 5 entradas com os textos aprovados
- [x] O tooltip mostra o nome do lugar, o indicador, o período, a classe e a origem do dado
- [x] Uma tabela alternativa acessível pelo teclado apresenta o mesmo conteúdo do mapa
- [x] O front não faz nenhuma conta estatística

## Comments

Resolvido em `90394fb` (pipeline do Painel, módulo de Tendência, validação contra o TabNet e mapa no site), `e24ca0a` e `3cc7541` (revisão: faixa plausível na validação, versão do pipeline, tipo de linha da tabela limpa) e no commit seguinte, que regenera o `manifest.json` e fecha este ticket.

Decisões tomadas na implementação, com o responsável pelo projeto:
- **Anos provisórios:** os 2 anos de diagnóstico mais recentes presentes nos dados (hoje 2025 e 2026, com 2026 ainda parcial). A Tendência usa 2015–2024 e o último valor é de 2024.
- **Denominador:** as duas porcentagens usam todos os casos diagnosticados, como a tabela do TabNet (até 30 + 31–60 + mais de 60 + sem informação = total) e o mínimo da cascata ("casos diagnosticados").
- **"Até 60 dias":** segue a regra do TabNet, que conta como no prazo o tratamento até 90 dias *antes* do diagnóstico (`-0001` a `-0090`).
- **Estável tem precedência:** um IC inteiro dentro de ±1% é estável mesmo quando exclui zero ("quase não mudou").
- **Textos da legenda:** só "Estável" e "Sem direção clara" tinham texto aprovado. "Melhorando", "Piorando" e "Dado insuficiente" foram escritos na implementação e precisam de aprovação.

A validação bate **exatamente** com o TabNet: mesmas contagens de casos e de "até 60 dias" em todas as UFs, ano a ano, de 2014 a 2026 (extração de 17/10/2026). Distribuição no Mapa inicial: 4.554 sem direção clara, 906 piorando, 108 melhorando, 0 estável e 3 sem Tendência calculável (até o ticket 05, aparecem como dado insuficiente). A predominância de "piorando" pode refletir o aumento da % sem informação de tratamento, que entra no denominador; a metodologia (ticket 24) deve dizer isso.

A camada tem 5.571 municípios, como a malha 2025 (ver o ticket 02). A abertura da tabela pelo teclado não pôde ser testada no Chromium sem interface (os eventos de tecla não chegam à página); ela usa `<details>`, `<select>` e uma região com `tabindex="0"`, que funcionam pelo teclado sem código próprio. A auditoria do ticket 25 deve conferir.

**Quebra de série:** depois do fechamento, a série nacional mostrou uma quebra em 2018–2019 (casos quase dobram, % sem informação de 4% para 30%) dentro da janela 2015–2024. A investigação e a decisão estão no [ticket de decisão 27](../../mapa-cancer-br/issues/27-quebra-de-serie-do-painel.md), que vai gerar um ticket de implementação próprio.
