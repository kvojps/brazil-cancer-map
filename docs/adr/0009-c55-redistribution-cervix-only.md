# Redistribuição do C55 só no colo do útero

O C55 (útero, porção não especificada) vem caindo com a melhora do preenchimento das declarações de óbito, então parte do "aumento" do C53 é só óbito que antes era codificado como C55. Decidimos em 02/11/2026 redistribuir o C55 **na Tendência da mortalidade por colo do útero**, pela proporção C53/(C53+C54) da UF de residência × ano × faixa etária, aplicada aos C55 do município. O site **diverge do INCA de propósito**, e o cartão avisa: "Estimativa ajustada para registros sem localização definida; pode diferir do INCA."

C26, R00–R99 e C76–C80 ficam sem redistribuição e entram como limitações declaradas. O total de "Todos" não muda.

Regras vigentes: [spec, seção 6.2](../spec.md#62-mortalidade).

## Alternativas consideradas

- **Só C53, como o Atlas do INCA, com ressalva:** descartada. O INCA não redistribui nada e mostra C53, C54 e C55 separados, então o número bateria com o oficial. Mas a diferença na tendência é maior que a faixa de "estável" e poderia mudar a classe que pinta o mapa.
- **Somar o C55 inteiro ao C53:** descartada. Atribuiria ao colo os óbitos que pertencem ao corpo do útero.
- **Proporção calculada no próprio município:** descartada, porque é instável demais. Os óbitos ficam fracionários, o que não atrapalha o modelo.
- **Redistribuir também o C26:** descartada. Ninguém o redistribui, ele é 5–6% dos óbitos digestivos, e a tendência quase não muda (4,56% contra 4,51% ao ano nas contagens).
- **Redistribuir R00–R99 e C76–C80:** descartada. Só pesquisas fazem isso, com a correção do GBD ou de 50% das mal definidas. Nenhuma publicação oficial faz.

## Evidências

Óbitos no Brasil, TabNet:

| Ano | 2014 | 2016 | 2018 | 2020 | 2022 | 2024 |
|---|---:|---:|---:|---:|---:|---:|
| C53 | 5.448 | 5.847 | 6.526 | 6.627 | 6.983 | 7.493 |
| C54 | 1.366 | 1.576 | 1.743 | 1.944 | 2.284 | 2.726 |
| C55 | 2.116 | 2.143 | 2.090 | 1.823 | 1.927 | 1.830 |
| C55 / útero | 23,7% | 22,4% | 20,2% | 17,5% | 17,2% | 15,2% |

- De 2014 a 2024, as contagens crescem +2,89% ao ano só com C53 e +1,77% ao ano com o C55 redistribuído. **Esse efeito vale só para as contagens nacionais: o efeito sobre a classe da Tendência não está comprovado.**
- A literatura brasileira reparte o C55 dessa forma (Gamarra et al., 2010; Azevedo e Silva et al., 2010 e 2011). Em 1981–2006, a série nacional era levemente crescente sem correção (β = 0,012) e passou a decrescente corrigida (β = −0,054).
- Na taxa padronizada de 2022, o Brasil vai de 4,75 para 5,62 por 100 mil (+18%), MG +29% e RJ +33%. Sem o ajuste, o pipeline reproduz o INCA: 6.983 óbitos, exatamente o C53 do SIM, e 4,75 contra 4,79, diferença que vem da população revista.
- A validação da série ajustada cobre 64.304 células e 67.188 pontos de série, com 36 fallbacks para a proporção nacional e 5 células sem proporção calculável, cada uma com um C55. A amostra de C53 de 2022 manteve contagens exatas e taxas dentro de ±3% do Atlas.

## Consequências

- O número do colo do útero fica acima do publicado pelo INCA, e a metodologia precisa explicar por quê.
- A etapa fica na limpeza, por exceção declarada à regra de que toda a estatística mora em `compute`. O Parquet conserva as contagens originais, para a comparação com o Atlas.
- Quando nem a proporção nacional pode ser calculada, o resultado é sinalizado como "ajuste não calculável", sem inventar proporção e sem virar Dado insuficiente. A Tendência só é bloqueada se a falha cair na sua janela.
- O C26 fica como limitação do colorretal.
