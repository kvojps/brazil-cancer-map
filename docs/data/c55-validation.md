# Validação da redistribuição do C55

> Leitura curta. A [versão completa](https://github.com/kvojps/brazil-cancer-map/blob/11fd03c47e1ce09b9a2ccb873ccc75da1ccb304f/docs/data/c55-validation.md), com as contagens anuais do relatório e o efeito por ano, está no commit `11fd03c`.

Sustenta a redistribuição do C55 no colo do útero. A decisão e as alternativas estão no [ADR 9](../adr/0009-c55-redistribution-cervix-only.md), e o método em [`/metodologia/#mortalidade`](https://brazil-cancer-map.kvojps.workers.dev/metodologia/#mortalidade). O relatório da execução está em `pipeline/references/sim-c55-validation.json`.

**Data:** execução de 04/11/2026, pipeline `0.1.0+ddbacb4`, anos 2014–2024, 5.571 municípios.

## Resultado

**A integridade da série ajustada passou, mas o ajuste não é calculável em todas as células.** O efeito sobre a classe da Tendência não está comprovado.

| Conferência | Resultado |
|---|---:|
| Células município × ano × idade | 64.304 |
| Pontos de série | 67.188 |
| Usos do fallback nacional | 36 |
| Células sem proporção calculável | 5 |
| Conferência de integridade | passou |
| Demais tipos e indicadores sem mudança | sim |
| Mapa e ficha concordam | sim |

- **As cinco células** têm um C55 cada, sem proporção estadual nem nacional: Mossoró e São Paulo (2015), Rio de Janeiro (2020), Ubiratã (2021) e Macapá (2023). Ficam sinalizadas, sem proporção inventada, e os territórios que as incluem e o contexto nacional ficam com "ajuste não calculável", sem classe de Tendência. As fichas afetadas exibem o aviso e a nota obrigatória.
- **Efeito na Tendência, só nas contagens nacionais do TabNet:** +2,89% ao ano só com C53, contra +1,77% com o C55 redistribuído. A diferença de ~1,1 ponto supera a faixa de "estável" (±1%), então a escolha **pode** mudar a classe, sobretudo onde o C55 pesa mais de 20% dos óbitos por câncer de útero (RJ, MG, AP, PB e SE). Não foi medida na taxa padronizada por UF.
- **Efeito no nível,** colo do útero em 2022, taxa ajustada por 100 mil: Brasil 4,75 → 5,62 (+18%), MG 2,94 → 3,79 (+29%), RJ 4,21 → 5,59 (+33%), PA 8,92 → 9,91 (+11%), SP 3,27 → 4,01 (+22%). A correção é desigual entre as UFs, e o cartão do colo avisa que o número difere do INCA.
- A comparação com o Atlas usa o C53 original ([`sim-atlas-check.md`](sim-atlas-check.md)), e por isso não valida a série ajustada.

## Método

A conferência verifica que C53+C54+C55 se conservam, que a alocação não reduz C53 nem C54, que os outros tipos, inclusive "Todos", não mudam, e que todo ponto sem taxa está sinalizado. O sucesso da integridade não significa ajuste calculável em todas as células.

## Literatura

O INCA não redistribui o C55. A literatura brasileira reparte todo o C55 entre C53 e C54 na proporção original:

- Gamarra, Valente e Azevedo e Silva (2010), Rev Saúde Pública 44(4):629–38, [DOI 10.1590/S0034-89102010000400006](https://doi.org/10.1590/S0034-89102010000400006). O C55 foi a correção de maior peso no Brasil: +55,6%.
- Azevedo e Silva, Girianelli, Gamarra e Bustamante-Teixeira (2010), Cad Saúde Pública 26(12), [DOI 10.1590/S0102-311X2010001200018](https://doi.org/10.1590/S0102-311X2010001200018). Corrigida, a série nacional passa de levemente crescente a decrescente.
- Azevedo e Silva et al. (2011), Rev Saúde Pública 45(6):1009–18 ([PDF](https://www.redalyc.org/pdf/672/67240194002.pdf)). Mesma regra.
