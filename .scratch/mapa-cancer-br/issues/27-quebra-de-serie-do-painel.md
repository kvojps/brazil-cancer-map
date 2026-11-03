# O que causa a quebra de 2018–2019 no Painel-Oncologia, e como a Tendência do 60 dias deve tratá-la?

Type: research
Status: ready-for-agent
Blocked by:

## Question

A implementação do Mapa inicial ([ticket 04 de implementação](../../mvp-implementacao/issues/04-60-dias-todos-em-tendencia.md)) mostrou uma quebra na série nacional do Painel-Oncologia ("Todos" do tratamento, extração de 17/10/2026):

| Ano de diagnóstico | Casos | % em até 60 dias | % sem informação de tratamento |
|---|---|---|---|
| 2014 | 163.990 | 46,5% | 4,3% |
| 2015 | 165.176 | 46,2% | 4,6% |
| 2016 | 169.043 | 47,1% | 4,0% |
| 2017 | 173.784 | 47,1% | 3,5% |
| 2018 | 249.706 | 45,4% | 16,9% |
| 2019 | 328.248 | 39,7% | 29,8% |
| 2020 | 302.032 | 41,4% | 29,5% |
| 2021 | 335.523 | 38,5% | 30,9% |
| 2022 | 357.005 | 37,0% | 31,4% |
| 2023 | 374.027 | 37,1% | 31,2% |
| 2024 | 345.217 | 33,5% | 33,6% |

Entre 2017 e 2019, os casos quase dobram e a % sem informação de tratamento passa de ~4% para ~30%. Isso parece uma mudança no registro (por exemplo, a entrada de diagnósticos do SISCAN sem tratamento vinculado), e não no atendimento. Mas é só uma hipótese, ainda não verificada.

A janela da Tendência (2015–2024) atravessa a quebra. Como as duas porcentagens usam todos os casos diagnosticados como denominador, a % em até 60 dias cai junto, e o Mapa inicial sai com 906 municípios "piorando" e só 108 "melhorando". Parte desse "piorando" pode ser efeito do registro. Isso contraria o tom da spec ("não se promete melhora onde o dado mostra piora", mas também não se mostra piora que o dado não sustenta) e a regra de que falta de registro não significa falta de tratamento.

Investigar e decidir:

1. **Causa:** o que mudou no Painel em 2018–2019? Fontes: a nota técnica (http://tabnet.datasus.gov.br/cgi/painel_onco/doc/painel_oncologia.pdf), o dicionário (`ftp://ftp.datasus.gov.br/dissemin/publicos/painel_oncologia/Doc/`) e normas do MS sobre o SISCAN e o Painel. Nos microdados, medir a quebra:
   - por UF;
   - por tipo de câncer (os 5 do seletor);
   - por mês de diagnóstico (`ANOMES_DIA`), para datar a quebra;
   - por estabelecimento de diagnóstico (`CNES_DIAG`) e modalidade (`TRATAMENTO`).

   A pergunta é se os casos novos são majoritariamente "sem informação" e se a quebra tem a mesma data em todo o país.
2. **Efeito:** quanto da classe "piorando" do Mapa inicial vem da quebra? Recalcular as classes com cada alternativa abaixo e comparar as distribuições.
3. **Tratamento:** recomendar uma alternativa, com prós e contras. Candidatas, sem excluir outras:
   - começar a janela da Tendência depois da quebra (por exemplo 2019 em diante, com menos de 10 anos e IC mais largo);
   - trocar o denominador da % em até 60 dias para os casos com tratamento registrado, deixando a % sem informação ao lado. Isso muda a comparação com o TabNet, que usa todos os casos;
   - manter o cálculo e declarar a quebra na metodologia e no cartão;
   - combinar alternativas (por exemplo, janela pós-quebra só para o 60 dias).
4. **Alcance:** a escolha também afeta:
   - a Situação (último ano consolidado);
   - a faixa A/B/C (últimos 5 anos, [ticket 06 de implementação](../../mvp-implementacao/issues/06-faixa-de-qualidade-abc.md));
   - o mínimo de 20 casos por ano da cascata (ticket 05 de implementação), já que os casos dobraram;
   - o gráfico da série no cartão (a quebra precisa de marca, como a dose única do HPV?).

## Resultado esperado

- A resposta, registrada sob `## Answer` neste arquivo, com a causa documentada (fonte oficial ou evidência nos microdados) e a medição do efeito sobre as classes.
- A decisão tomada com o responsável pelo projeto, refletida na spec ([spec-mvp.md](../spec-mvp.md), seções 5, 6.4, 7 e 12) e no `map.md`.
- **Um ticket de implementação** novo em `.scratch/mvp-implementacao/issues/`, `ready-for-agent`, com critérios verificáveis. Ele deve aplicar a decisão no pipeline, regenerar a camada do mapa e o `manifest.json`, ajustar a validação contra o TabNet se o denominador mudar e acrescentar a nota de método.

Os scripts de medição ficam em `research/27-scripts/`, como nas pesquisas 09 e 10.
