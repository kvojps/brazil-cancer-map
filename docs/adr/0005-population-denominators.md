# Denominadores: POPSVS revisto, e Censo 2022 fixo no HPV

Taxas e razões precisam bater com os números oficiais na validação, mas as Fontes oficiais não usam a mesma população. Decidimos em 02/11/2026 usar a estimativa **POPSVS** do Ministério da Saúde, revista depois do Censo 2022, como denominador padrão, e o **Censo 2022 fixo** (SIDRA 9514) em todos os anos da cobertura do HPV, como o painel do PNI. Um leitor esperaria um só denominador: o desvio é deliberado, para que cada número possa ser comparado com a sua referência oficial.

Regras vigentes: [spec, seção 6.1](../spec.md#61-denominadores).

## Alternativas consideradas

- **POPSVS ano a ano também no HPV:** descartado, embora seja mais correto demograficamente. O número deixaria de bater com o painel oficial, que é o que o cidadão e o gestor veem.
- **Censo ou projeção do IBGE como padrão:** descartados. O POPSVS tem idade simples de 0 a 79 e 80+, por município, sexo e ano, de 2000 a 2025, e é o que o TabNet e o INCA usam.
- **A estimativa anterior do Ministério:** não existe mais no FTP, e superestimava a população.

## Evidências

- A série 2000–2024 foi inteiramente regravada em 07/01/2025 pelo método Ripsa pós-Censo 2022, sem quebra interna. O arquivo de 2025 é de 29/10/2025.
- A estimativa antiga superestimava em cerca de 5,8%. Por isso, números oficiais publicados antes de 2025 não servem como alvo de igualdade, e a conferência usa o TabNet atual.
- A estimativa de 2022 (210,86 milhões) é maior que a contagem do Censo 2022 (203,08 milhões), porque corrige a sub-enumeração. Os dois denominadores não são intercambiáveis.
- A NT 16/2025-DPNI usa o Censo 2022 "para todos os anos da coorte vacinal". Em Recife/2025, os denominadores locais e os oficiais são iguais: 52.868 meninas e 55.555 meninos.
- De 2014 a 2025, as mulheres de 50–69 anos crescem 22%, e a população de 9–14 anos cai 11%: é a medida de quanto um denominador fixo pode distorcer uma série.

## Consequências

- A série do HPV fica sensível ao envelhecimento da população, e há municípios acima de 100% também no painel oficial (512 no sexo masculino e 1.486 no feminino, segundo a nota técnica). O valor não é cortado e leva a nota de "acima do esperado".
- Boa Esperança do Norte (MT), instalado depois do Censo, usa a região no HPV, sem população inventada.
- A metodologia precisa explicar a diferença entre os dois denominadores, e a validação do SIM precisa considerar o POPSVS revisto.
- Ano sem arquivo de população usa o ano imediatamente anterior e fica marcado como provisório.
