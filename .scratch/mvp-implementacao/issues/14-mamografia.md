# 14: Mamografia (SISCAN)

**What to build:** o mapa e a ficha ganham a razão de mamografias de rastreamento em mulheres de 50–69, no eixo Detecção precoce, para mama e Todos. Referência: spec, seções 4, 5, 6.1, 7, 9, 10 e 11.

**Blocked by:** 10 — Ficha do Meu município com o cartão do 60 dias; 13 — Denominador POPSVS no pipeline

**Status:** ready-for-agent

- [ ] O pipeline baixa o SISCAN e processa os CSVs um arquivo por vez, em fluxo, pelo DuckDB, apagando o bruto
- [ ] A razão é exames de rastreamento ÷ (mulheres de 50–69 ÷ 2), 2016–2025, por município de residência
- [ ] Tendência por quasi-Poisson com offset de população; mínimo e cascata contam o numerador
- [ ] Referência = razão 1 ("meta"), com as 3 faixas de Situação e a nota de valor acima do esperado
- [ ] O indicador pinta o mapa nos dois modos, para mama e Todos, e entra no seletor e na tabela de combinações válidas
- [ ] O cartão da ficha explica 50–69 vs 50–74 (NT 626/2025) e traz a Ação aprovada da mamografia
- [ ] A validação confere a faixa plausível e a presença dos municípios; se falhar, o SISCAN não é publicado
- [ ] A metodologia ganha a seção da mamografia
