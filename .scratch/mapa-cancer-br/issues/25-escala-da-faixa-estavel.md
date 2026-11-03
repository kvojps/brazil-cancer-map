# Em que escala vale a faixa de "estável" (±1% ao ano) para proporções, razões e tabagismo?

Type: grilling
Status: resolved
Assignee: Kvojps (Claude session 2026-11-02, ticket 25)
Blocked by: 23

## Question

[Como classificar a Tendência e tratar municípios pequenos no mapa?](12-tendencia-e-municipios-pequenos.md) define "estável" como "o IC 95% inteiro dentro de ±1% ao ano", com a mesma regra para todos os indicadores, mas os modelos são diferentes:
- quasi-Poisson com offset (mortalidade padronizada, razões do SISCAN): o coeficiente vira uma variação **relativa** por ano (APC);
- binomial/logístico (% em até 60 dias): o coeficiente é uma razão de chances por ano, que pode ser lida como variação relativa da proporção, em **pontos percentuais** ou em odds;
- regressão ponderada (% de fumantes na capital): a escala depende de o modelo ser linear (p.p.) ou log-linear (relativa).

A pesquisa [Que métodos existem para classificar tendência e estabilizar taxas de municípios pequenos?](11-metodos-tendencia-e-pequenos-numeros.md) mistura as escalas (% ao ano e p.p. ao ano). Decidir em que escala o ±1% vale para cada indicador (ou se a faixa muda por indicador) e como a metodologia pública explica isso. Ao resolver, atualizar a seção 7 de [spec-mvp.md](../spec-mvp.md).

## Answer

Decidido em grilling em 2026-11-02.

**Escala única.** Toda Tendência é medida como **variação percentual anual**, a mudança em relação ao próprio valor do indicador, e não em pontos percentuais nem em razão de chances. Em p.p., a faixa pesaria de forma diferente conforme o tamanho do indicador: sobre um tabagismo de 9%, ±1 p.p. equivale a ±11% relativo, e isso deixaria chamar de "estável" uma série que pode estar mudando muito.

**Faixa de "estável": ±1% ao ano para todos os indicadores, sem exceção.** É uma convenção do projeto, mais tolerante que a do NCI (±0,5%, que o próprio NCI chama de "um tanto arbitrária, mas consistente entre medidas").

**Modelos** (substituem os do [ticket 12](12-tendencia-e-municipios-pequenos.md) para o 60 dias e o tabagismo):
- mortalidade padronizada e razões do SISCAN: quasi-Poisson com offset de população (sem mudança);
- % em até 60 dias: **quasi-Poisson com ligação log e offset `log(casos)`** ("Poisson modificado") no lugar do logístico. O coeficiente já é a variação relativa. Se a curva ajustada passar um pouco de 100% perto do teto, a classe não muda, porque só a inclinação conta;
- tabagismo na capital: **regressão ponderada de `log(prevalência)` contra o ano**, com peso 1/EP², e EP do log = EP/prevalência, tirado do IC publicado pelo Vigitel.

**Consequências esperadas** (vão para a metodologia): com amostras pequenas, "estável" quase nunca aparece. O tabagismo na capital (cerca de 2 mil entrevistas por ano) tem IC da variação anual em torno de ±1,6% (conta aproximada nossa) e fica em melhorando/piorando ou sem direção clara. O 60 dias precisa de cerca de 400 casos por ano para chegar a "estável" (pesquisa 11, seção 1.5), o que só acontece nas capitais e nas regiões grandes.

**Textos:**
- Legenda e cartão: "**Estável**: quase não mudou, menos de 1% por ano em relação ao próprio valor." e "**Sem direção clara**: pode ter subido ou caído; os dados não bastam para dizer."
- Metodologia: um parágrafo dizendo que a Tendência é a variação percentual anual, com o exemplo do tabagismo (passar de 9% para 8% é uma queda de 11%, não de "1 ponto"), o modelo de cada indicador, o corte de ±1% como convenção do projeto e o aviso de que, com poucos casos, "estável" raramente aparece, o que é esperado e não indica falha.
- O cartão mostra a classe e a série, sem o número da variação. Exibir esse número ficou fora deste ticket.

Spec atualizada: seções 7, 11.1, 12 e 17 de [spec-mvp.md](../spec-mvp.md). Glossário: a definição de Tendência agora diz em que escala ela é medida.
