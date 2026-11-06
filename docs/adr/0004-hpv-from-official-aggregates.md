# HPV com agregados oficiais do Ministério, e microdados só como auditoria

O plano inicial reconstruía a cobertura da vacina HPV a partir dos microdados do SI-PNI/RNDS, mas a reconstrução não reproduz o número qualificado pelo Ministério. Decidimos em 05/11/2026 publicar as **coortes oficiais agregadas** do painel do Ministério da Saúde. A redução dos microdados continua disponível para auditoria local, e sua reconstrução nunca substitui nem se apresenta como equivalente ao numerador oficial.

O método continua sendo a coorte de 9–14 anos com ao menos uma dose, incluindo as vacinas quadrivalente e nonavalente, sem Tendência. O Observatório soma os numeradores e denominadores oficiais para o total e as Regiões imediatas, e confere os denominadores contra o Censo 2022.

Regras vigentes: [spec, seções 4, 5, 6.1 e 6.4](../spec.md#4-fontes-de-dados).

## Alternativas consideradas

- **Publicar a reconstrução longitudinal dos microdados:** descartada. A NT 16/2025 descreve remoção de duplicidades e erros na RNDS, sem documentar como reproduzir esse tratamento com as chaves públicas. Atribuir pelo primeiro ou pelo último município e contar por coorte não reproduziu a amostra.
- **Ajustar a deduplicação até bater com as amostras:** descartada, porque seria uma correção arbitrária sem base no método oficial.
- **Doses aplicadas no ano divididas pela população:** descartada. Não é o método oficial por coorte.

## Evidências

- A carga de janeiro de 2020 a setembro de 2026 concluiu com 81 extratos mensais, e a reconstrução ainda divergiu do painel em municípios e sexos distintos.
- Em Recife/2025, os denominadores locais e oficiais são iguais (52.868 meninas e 55.555 meninos), mas os numeradores reconstruídos não são. As coberturas oficiais são 88,6% no total, 94,9% em meninas e 82,7% em meninos.
- A validação usa nove referências oficiais de 2025, de Recife, Brasileia e Jundiaí, cada uma no total e em cada sexo, com tolerância de 0,01 p.p. Sem referências ou com divergência acima dela, nada é exportado.
- As coortes oficiais foram obtidas com Chromium na sessão pública do InfoMS: 77.990 linhas, só agregados.
- O acervo dos microdados tem cerca de 215 GB zipados até setembro de 2026, e a atualização mensal repetiria 23–28 GB, porque o ano corrente é regravado todo mês.

## Consequências

- A atualização do indicador funciona sem ZIPs mensais, extratos de pacientes nem histórico de auditoria, o que também sustenta a [atualização manual](0006-manual-local-data-update.md).
- Extratos com chaves de pacientes ficam locais, fora do git e das Releases.
- A extração depende de uma sessão pública do painel, que exige Chromium e pode mudar sem aviso.
- O projeto não consegue explicar município a município a diferença entre o agregado oficial e os microdados públicos.
