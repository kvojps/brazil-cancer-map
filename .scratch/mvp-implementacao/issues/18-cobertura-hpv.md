# 18: Cobertura da vacina HPV (SI-PNI)

**What to build:** o eixo Prevenção ganha a cobertura da vacina HPV de 9–14 anos, meninas e meninos juntos, para colo do útero e Todos. O indicador abre no mapa em "como está hoje" e não tem Tendência estatística. Referência: spec, seções 4, 5, 6.1, 6.4, 9, 11 e 16.

**Blocked by:** 10 — Ficha do Meu município com o cartão do 60 dias

**Status:** ready-for-agent

- [ ] O pipeline processa o SI-PNI novo um arquivo mensal por vez, em fluxo, apagando o bruto; o processamento é particionado por ano
- [ ] A duração e o pico de disco são medidos e registrados, e fica documentado se cabem num job do GitHub Actions (14 GB, 6 h)
- [ ] A contagem é "ao menos uma dose" em todos os anos, de 2020 ao último ano, com a mudança para dose única em 2024 marcada na série
- [ ] O denominador é o Censo 2022 fixo (SIDRA 9514), 9–14 anos por sexo; o mínimo e a cascata contam o denominador
- [ ] Referência 90% ("meta para 2030") para o total e para cada sexo; valores acima de 100% seguem a regra do acima do esperado
- [ ] Sem Tendência: o cartão diz "série curta, ainda sem direção"
- [ ] No mapa, o HPV abre em "como está hoje", com uma nota no seletor explicando por quê
- [ ] O cartão mostra o detalhe por sexo ao ser aberto, a marca da dose única, a nota do Censo 2022, a menção de que a meta da OMS é para meninas e a Ação aprovada da vacinação
- [ ] A metodologia ganha a seção do HPV, com a diferença entre o Censo 2022 e o POPSVS


## Comments

Implementação iniciada em 04/11/2026. O usuário confirmou os testes no protocolo público `Source` e no estado do mapa e pediu para **manter o método oficial**, sem substituir a coorte por pessoas vacinadas apenas no ano.

- Implementados SI-PNI mensal em fluxo, cache incremental, exclusão do bruto após sucesso, partições anuais, Censo 2022/SIDRA 9514 e histórico D1 consolidado do TabNet 2015–2019. O histórico é necessário às coortes da série exibida desde 2020; não se publica uma série antiga.
- Cálculo longitudinal por paciente e diagonal de ano/idade, HPV quadrivalente e nonavalente, referência 90%, cascata pelo denominador, ausência de Tendência, detalhe por sexo e saída das coortes após 14 anos. Boa Esperança do Norte usa a região, sem inventar população municipal censitária.
- Cartão, Ação aprovada, metodologia e catálogo do mapa implementados. A opção permanece desabilitada enquanto não houver JSON publicado; não se apresenta a carga parcial como cobertura oficial.
- Insumos reais extraídos: 66.840 células do Censo e dez tabelas nacionais do TabNet, com amostra independente de Brasileia/2019 conferida. Dois meses reais foram processados, com exclusões registradas. Maio/2020: 375,23 segundos incluindo download, pico dos diretórios da fonte 1.526.722.929 bytes.
- [Medição e limites](../../../docs/data/hpv-benchmark.md). A extrapolação local sugere cerca de duas horas para 28 GB/ano, mas não comprova a duração nem o pico total de um job anual no GitHub Actions.
- **Pendências para resolver o ticket:** carga mensal completa desde 2020, comparação das coberturas com o painel oficial, publicação dos JSON para habilitar o mapa e medição de uma partição anual completa no runner. As caixas continuam abertas porque a entrega pública e a capacidade anual ainda não foram demonstradas. Nenhum dado sintético foi publicado.

Commits desta implementação parcial:

- `ea0af78` — `feat: add official HPV cohort pipeline and prevention card`.
- Commit da revisão — `fix: require official HPV coverage checks before publication`.

Revisão pela skill `code-review`, base `ccbd410`: Standards encontrou uma duplicação pequena no rótulo de disponibilidade do seletor, removida na revisão. Spec apontou a ausência de comparação oficial obrigatória, corrigida com referências que bloqueiam a publicação se ausentes ou divergentes, e confirmou as pendências públicas e de capacidade anual acima. O ticket não foi marcado como resolvido.


Verificação final após as correções: **149 testes Python** e **21 testes do site** passaram; a suíte do site executou o build estático. `mypy` e `astro check` sem erros. Os avisos de separação perfeita do statsmodels vêm das amostras sintéticas existentes. Os dois revisores reconferiram as correções: Standards sem achados pendentes; Spec com a comparação obrigatória corrigida, restando as pendências de carga, referências oficiais reais, publicação e capacidade anual.
