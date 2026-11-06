# Tendência em variação percentual relativa, com faixa de ±1% em todos os indicadores

O Mapa inicial é pintado pela Tendência, então a regra que classifica cada indicador define a primeira impressão do site. Os modelos diferem por indicador, e o coeficiente de um modelo logístico ou linear não está na mesma escala do de um quasi-Poisson. Decidimos em 02/11/2026 que toda Tendência é uma única **variação percentual anual, relativa ao próprio valor do indicador**, sobre os últimos até 10 anos consolidados, com IC 95%. "Estável" significa o IC inteiro dentro de ±1% ao ano, sem exceção por indicador.

O corte é uma convenção do projeto, mais tolerante que a do NCI (±0,5%, que o próprio NCI chama de "um tanto arbitrária, mas consistente entre medidas"). A separação entre "estável" e "sem direção clara" impede que falta de dado vire falsa estabilidade.

Regras vigentes e modelos: [spec, seção 7](../spec.md#7-tendência).

## Alternativas consideradas

- **Pontos percentuais:** descartados. A faixa pesaria de forma diferente conforme o tamanho do indicador: sobre um tabagismo de 9%, ±1 p.p. equivale a ±11% relativo, e isso deixaria chamar de "estável" uma série que pode estar mudando muito.
- **Razão de chances, com modelo logístico no 60 dias:** descartada. O coeficiente não se lê como variação do próprio valor. O 60 dias usa quasi-Poisson com ligação log e offset `log(casos)`, cujo coeficiente já é a variação relativa. Se a curva ajustada passar um pouco de 100% perto do teto, a classe não muda, porque só a inclinação conta.
- **Faixa diferente por indicador, como ±1 p.p. nas porcentagens:** descartada, pelo mesmo motivo dos pontos percentuais. A regra de classificação é uma só para todos.
- **Joinpoint:** descartado no MVP. Com 7 a 11 anos, a documentação do NCI recomenda no máximo 1 ponto de inflexão, e o método não detecta mudança nos 2 últimos anos. Uma virada recente aparece no gráfico, não na classe.
- **Prais-Winsten:** descartado, embora seja o padrão nos artigos brasileiros. Não aceita zero no log, o que pesa em municípios com ano sem caso. Com 10 anos, a autocorrelação que ele corrige é mal estimada, e o NCHS recomenda erros não correlacionados na mortalidade.

## Evidências

Margem da variação anual em 10 anos, em conta aproximada do projeto, com número constante de eventos por ano e sem sobredispersão:

| Eventos por ano (taxas) | Margem da variação anual |
|---:|---:|
| 5 | ±10% |
| 20 | ±5% |
| 100 | ±2,2% |
| 500 | ±1,0% |
| 2.000 | ±0,5% |

No 60 dias, a mesma conta dá ±0,5 p.p. ao ano com 400 casos tratados por ano. No tabagismo na capital, com cerca de 2 mil entrevistas por ano, o IC da variação anual fica em torno de ±1,6%, também em conta aproximada. A mortalidade por câncer costuma variar de 1% a 2% ao ano.

## Consequências

- Com amostras pequenas, "estável" quase nunca aparece, e isso é esperado. No 60 dias × Todos, com a cascata, nenhum município ficou estável na extração de 17/10/2026. A metodologia avisa disso.
- O tabagismo na capital fica em melhorando, piorando ou sem direção clara.
- O cartão mostra a classe e a série, sem o número da variação, e o Contrato de dados não publica esse número.
- Mudar a escala ou o corte reclassificaria o mapa inteiro.
