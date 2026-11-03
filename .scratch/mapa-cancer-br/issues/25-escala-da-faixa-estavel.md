# Em que escala vale a faixa de "estável" (±1% ao ano) para proporções, razões e tabagismo?

Type: grilling
Status: open
Blocked by: 23

## Question

[Como classificar a Tendência e tratar municípios pequenos no mapa?](12-tendencia-e-municipios-pequenos.md) define "estável" como "o IC 95% inteiro dentro de ±1% ao ano", com a mesma regra para todos os indicadores, mas os modelos são diferentes:
- quasi-Poisson com offset (mortalidade padronizada, razões do SISCAN): o coeficiente vira uma variação **relativa** por ano (APC);
- binomial/logístico (% em até 60 dias): o coeficiente é uma razão de chances por ano, que pode ser lida como variação relativa da proporção, em **pontos percentuais** ou em odds;
- regressão ponderada (% de fumantes na capital): a escala depende de o modelo ser linear (p.p.) ou log-linear (relativa).

A pesquisa [Que métodos existem para classificar tendência e estabilizar taxas de municípios pequenos?](11-metodos-tendencia-e-pequenos-numeros.md) mistura as escalas (% ao ano e p.p. ao ano). Decidir em que escala o ±1% vale para cada indicador (ou se a faixa muda por indicador) e como a metodologia pública explica isso. Ao resolver, atualizar a seção 7 de [spec-mvp.md](../spec-mvp.md).
