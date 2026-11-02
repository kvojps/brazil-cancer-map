# Que métodos existem para classificar tendência e estabilizar taxas de municípios pequenos?

Type: research
Status: resolved
Assignee: Kvojps (claude session 2026-11-02)
Blocked by:

## Question

Quais métodos as fontes de referência (INCA, Ministério da Saúde, IBGE, Observatório de Oncologia, CDC/NCI, IARC, atlas municipais de saúde) usam para:

1. classificar a direção de uma série anual curta (cerca de 10 anos) como melhorando, estável ou piorando, levando em conta a incerteza (por exemplo, a variação percentual anual com intervalo de confiança, o Joinpoint ou a regressão de Poisson);
2. lidar com municípios de poucos casos: supressão abaixo de um número mínimo de casos, agregação (região de saúde, anos somados) ou suavização (bayesiana empírica, por exemplo);
3. mostrar isso num mapa coroplético sem induzir a um ranking.

Para cada método: o que exige do dado (número mínimo de casos, anos), se dá para pré-calcular offline em Python, e um exemplo público que o usa. Interessam em especial as séries do Painel-Oncologia (% em até 60 dias), do SISCAN (razões), do SI-PNI (cobertura) e do SIM (taxa padronizada).

## Answer

Pesquisa concluída em 2026-11-02. Os detalhes e as fontes estão em [research/11-metodos-tendencia-e-pequenos-numeros.md](../research/11-metodos-tendencia-e-pequenos-numeros.md).

- **Tendência:** as fontes de referência estimam a variação anual (APC ou AAPC) com intervalo de confiança e só chamam de "subindo" ou "caindo" quando o intervalo exclui zero. O NCI separa "mudança não significativa" de "estável" (±0,5% ao ano). O Fingertips (Inglaterra) usa os últimos 5 pontos com 99,8% de confiança. Os artigos brasileiros usam Prais-Winsten. Com 7–11 anos, o Joinpoint aceita no máximo 1 ponto de quebra e não detecta mudança nos 2 últimos anos. Tudo dá para pré-calcular em Python (`statsmodels`, `piecewise-regression`).
- **Municípios pequenos:** CDC e NCI suprimem taxas com menos de 16 casos (o CDC WONDER marca como instável abaixo de 20). A suavização pode ser bayesiana empírica (`esda.smoothing`) ou um modelo BYM2 (PyMC/NumPyro). As unidades de agregação no Brasil são a região imediata do IBGE (510, com código já na malha), a região de saúde e a macrorregião (120).
- **Conta aproximada:** com 20 óbitos por ano em 10 anos, a margem da variação anual fica em ±5% ao ano, e a mortalidade por câncer muda 1–2% ao ano. **A maioria dos municípios não terá tendência própria detectável.**
- **Sem ranking:** os bons exemplos comparam cada lugar com uma referência fixa e mostram a incerteza (Fingertips, atlas australiano). O atlas do CDC, que pinta por quintis, é o contraexemplo. Sugestão: um quarto estado, "dado insuficiente", separado de "estável".
- **Opções por série, para decidir no ticket 12:**
  - % em até 60 dias: modelo logístico com mínimo de casos, ou recuo para a região.
  - Razões do SISCAN: Poisson ou binomial negativa com offset de população.
  - HPV: ainda sem tendência estatística, por causa da quebra de 2024 e da série curta.
  - SIM: agregação regional, com suavização bayesiana empírica ou espaço-temporal.
- **Não verificado:** quantas são as regiões de saúde hoje, e se o INCA ou o Atlas Brasil publicam método de tendência municipal.
