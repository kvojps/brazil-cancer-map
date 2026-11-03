# 19: Tabagismo na capital (Vigitel)

**What to build:** a ficha ganha a % de fumantes adultos "na capital do seu estado", no eixo Prevenção, para pulmão e Todos. O indicador não pinta o mapa. Referência: spec, seções 4, 5, 7 e 9.

**Blocked by:** 10 — Ficha do Meu município com o cartão do 60 dias

**Status:** ready-for-agent

- [ ] O pipeline extrai do microdado do Vigitel a prevalência e o IC por capital e ano; a localização do arquivo, cujo nome muda, fica configurável
- [ ] Tendência por regressão ponderada de `log(prevalência)` contra o ano, com peso 1/EP² e EP do log = EP/prevalência tirado do IC
- [ ] Referência 5,9% ("meta do Brasil para 2030"), com a regra invertida: alcançou ≤ 5,9%, perto ≤ 7,4%
- [ ] O cartão aparece na ficha de todos os municípios da UF, com o rótulo "na capital do seu estado" e a Ação aprovada do tabagismo
- [ ] A metodologia ganha a seção do tabagismo, com o exemplo de 9% para 8% como queda de 11%
