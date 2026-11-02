# Que métodos existem para classificar tendência e estabilizar taxas de municípios pequenos?

Type: research
Status: open
Blocked by:

## Question

Quais métodos as fontes de referência (INCA, Ministério da Saúde, IBGE, Observatório de Oncologia, CDC/NCI, IARC, atlas municipais de saúde) usam para:

1. classificar a direção de uma série anual curta (cerca de 10 anos) como melhorando, estável ou piorando, levando em conta a incerteza (por exemplo, a variação percentual anual com intervalo de confiança, o Joinpoint ou a regressão de Poisson);
2. lidar com municípios de poucos casos: supressão abaixo de um número mínimo de casos, agregação (região de saúde, anos somados) ou suavização (bayesiana empírica, por exemplo);
3. mostrar isso num mapa coroplético sem induzir a um ranking.

Para cada método: o que exige do dado (número mínimo de casos, anos), se dá para pré-calcular offline em Python, e um exemplo público que o usa. Interessam em especial as séries do Painel-Oncologia (% em até 60 dias), do SISCAN (razões), do SI-PNI (cobertura) e do SIM (taxa padronizada).
