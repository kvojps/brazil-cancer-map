# 18: Cobertura da vacina HPV (SI-PNI)

**What to build:** o eixo Prevenção ganha a cobertura da vacina HPV de 9–14 anos, meninas e meninos juntos, para colo do útero e Todos. O indicador abre no mapa em "como está hoje" e não tem Tendência estatística. Referência: spec, seções 4, 5, 6.1, 6.4, 9, 11 e 16.

**Blocked by:** 10 — Ficha do Meu município com o cartão do 60 dias

**Status:** ready-for-agent

- [x] O pipeline processa o SI-PNI novo um arquivo mensal por vez, em fluxo, apagando o bruto; o processamento é particionado por ano
- [ ] A duração e o pico de disco são medidos e registrados, e fica documentado se cabem num job do GitHub Actions (14 GB, 6 h)
- [ ] A contagem é "ao menos uma dose" em todos os anos, de 2020 ao último ano, com a mudança para dose única em 2024 marcada na série
- [x] O denominador é o Censo 2022 fixo (SIDRA 9514), 9–14 anos por sexo; o mínimo e a cascata contam o denominador
- [x] Referência 90% ("meta para 2030") para o total e para cada sexo; valores acima de 100% seguem a regra do acima do esperado
- [x] Sem Tendência: o cartão diz "série curta, ainda sem direção"
- [ ] No mapa, o HPV abre em "como está hoje", com uma nota no seletor explicando por quê
- [x] O cartão mostra o detalhe por sexo ao ser aberto, a marca da dose única, a nota do Censo 2022, a menção de que a meta da OMS é para meninas e a Ação aprovada da vacinação
- [x] A metodologia ganha a seção do HPV, com a diferença entre o Censo 2022 e o POPSVS


## Comments

Implementação iniciada em 04/11/2026. O usuário confirmou os testes no protocolo público `Source` e no estado do mapa e pediu para **manter o método oficial**, sem substituir a coorte por pessoas vacinadas apenas no ano.

- Implementados SI-PNI mensal em fluxo, cache incremental, exclusão do bruto após sucesso, partições anuais, Censo 2022/SIDRA 9514 e histórico D1 consolidado do TabNet 2015–2019. O histórico é necessário às coortes da série exibida desde 2020; não se publica uma série antiga.
- Cálculo longitudinal por paciente e diagonal de ano/idade, HPV quadrivalente e nonavalente, referência 90%, cascata pelo denominador, ausência de Tendência, detalhe por sexo e saída das coortes após 14 anos. Boa Esperança do Norte usa a região, sem inventar população municipal censitária.
- Cartão, Ação aprovada, metodologia e catálogo do mapa implementados. A opção permanece desabilitada enquanto não houver JSON publicado; não se apresenta a carga parcial como cobertura oficial.
- Insumos reais extraídos: 66.840 células do Censo e dez tabelas nacionais do TabNet, com amostra independente de Brasileia/2019 conferida. Dois meses reais foram processados, com exclusões registradas. Maio/2020: 375,23 segundos incluindo download, pico dos diretórios da fonte 1.526.722.929 bytes.
- [Medição e limites](../../../docs/data/hpv-benchmark.md). A extrapolação local sugere cerca de duas horas para 28 GB/ano, mas não comprova a duração nem o pico total de um job anual no GitHub Actions.
- **Pendências para resolver o ticket:** carga mensal completa desde 2020, comparação das coberturas com o painel oficial, publicação dos JSON para habilitar o mapa e medição de uma partição anual completa no runner. As caixas da série completa, da abertura pública do mapa e da capacidade anual continuam abertas; as demais registram a implementação concluída e verificada em testes, sem implicar publicação de dados reais. Nenhum dado sintético foi publicado.

Commits desta implementação parcial:

- `ea0af78` — `feat: add official HPV cohort pipeline and prevention card`.
- `1cd1658` — `fix: require official HPV coverage checks before publication`.

Revisão pela skill `code-review`, base `ccbd410`: Standards encontrou uma duplicação pequena no rótulo de disponibilidade do seletor, removida na revisão. Spec apontou a ausência de comparação oficial obrigatória, corrigida com referências que bloqueiam a publicação se ausentes ou divergentes, e confirmou as pendências públicas e de capacidade anual acima. O ticket não foi marcado como resolvido.


Verificação final após as correções: **149 testes Python** e **21 testes do site** passaram; a suíte do site executou o build estático. `mypy` e `astro check` sem erros. Os avisos de separação perfeita do statsmodels vêm das amostras sintéticas existentes. Os dois revisores reconferiram as correções: Standards sem achados pendentes; Spec com a comparação obrigatória corrigida, restando as pendências de carga, referências oficiais reais, publicação e capacidade anual.


### Retomada em sessão nova — 04/11/2026

**Estado da entrega:** implementação parcial, ainda não publicada. O status continua `ready-for-agent`; não fechar o ticket antes de cumprir as pendências abaixo. A sessão anterior encerrou antes da carga nacional, sem impedimento externo definitivo. A validação oficial obrigatória é parte da implementação e deve ser concluída, não removida para liberar a exportação.

**Resolvido e verificado:**

- Fonte `HpvSource` registrada no pipeline, com ZIP mensal em fluxo, cache por tamanho/data/versão do extrato, remoção do bruto após sucesso e CLI particionado por ano.
- Insumos fixos reais baixados e limpos: Censo 2022 por município × sexo × idade (SIDRA 9514) e D1 consolidada do TabNet 2015–2019. Não usar o FTP antigo para fechar 2019: ele está congelado em maio daquele ano.
- Cálculo da cobertura por coorte com ao menos uma dose, deduplicação longitudinal, vacinas 67/93 (quadrivalente/nonavalente), saída da faixa após 14 anos, ano corrente provisório, denominador censitário fixo e cascata pelo denominador. Implementado e testado com arquivos pequenos; falta executar e validar a série nacional inteira.
- Situação contra 90% no total e em cada sexo, sem cortar valores acima de 100%, com a nota aprovada; ausência de Tendência estatística; série e detalhe por sexo no cartão; Ação curta aprovada; metodologia pública.
- Estado do mapa normaliza HPV para `status` em Todos e colo do útero. O seletor explica a ausência de Tendência, mas permanece **desabilitado** enquanto não houver HPV no manifesto publicado.
- Exportação bloqueada na ausência de referências oficiais ou em caso de divergência; testes conferem que uma falha preserva a publicação anterior.
- Workflow anual com estado incremental em Release implementado em `.github/workflows/hpv.yml`, mas **não executado nesta sessão**. Não houve push, publicação dos JSON HPV nem deploy do indicador.
- Revisão em dois agentes concluída e correções reconferidas. Última verificação: 149 testes Python, 21 testes do site com build, mypy e Astro check passando.

**Falta executar, nesta ordem:**

1. Conferir o último mês realmente publicado no S3. O código atual percorre os meses anteriores ao mês corrente; ainda não foi verificado se lida corretamente com o atraso da fonte. Se o mês mais recente ainda não existir, ajustar a descoberta da disponibilidade sem tratar meses intermediários ausentes como zero nem truncar silenciosamente o histórico.
2. Completar o download e a redução dos meses desde janeiro/2020 até esse último mês, particionando por ano. Reaproveitar os insumos fixos existentes. O acervo foi estimado na pesquisa em cerca de 215 GB compactados até setembro/2026; não é preciso guardar os ZIPs simultaneamente. Não encerrar novamente após apenas uma amostra de benchmark.
3. Executar `compute` com o histórico completo. Conferir sobretudo a equivalência da deduplicação pública e da atribuição municipal com o painel oficial, incluindo a transição de coortes e o município criado após o Censo.
4. Obter coberturas reais do painel oficial para uma amostra de municípios com dado próprio, em anos consolidados, abrangendo total e ambos os sexos. Criar `pipeline/references/hpv.json` com procedência e data; não inventar referências nem copiar as amostras sintéticas dos testes. Se houver divergência, investigar e corrigir o método antes da publicação.
5. Rodar `validate` e `export`; conferir e commitar `site/public/dados/map/hpv/{all,cervix}.json`, fichas por UF e manifesto atualizado. A presença de HPV no manifesto habilita o seletor no próximo build. Testar no site a abertura em “como está hoje”, a nota, o cartão e os valores reais; o teste de estado do mapa sozinho não demonstra essa entrega pública.
6. Executar uma partição anual completa no runner e registrar duração e pico de disco do **job inteiro**, incluindo dependências, checkout, restauração e compactação em `/tmp`. As medições atuais só cobrem meses locais e os diretórios da fonte. Avaliar os limites de 14 GB/6 h; se não couber, documentar a execução na máquina do mantenedor conforme a spec.
7. Reexecutar os testes e a revisão das mudanças finais; marcar as caixas restantes e resolver o ticket no mesmo commit da última mudança, registrando os commits sob `Comments`.

**Estado local disponível nesta máquina (fora do git):**

- `data/clean/hpv/census.parquet` — 66.840 células, 5.570 municípios; população total 9–14: 16.439.492.
- `data/clean/hpv/legacy.parquet` e `legacy.json` — histórico consolidado 2015–2019 e procedência.
- `data/clean/hpv/months/2020/04.{parquet,json}` e `05.{parquet,json}` — somente abril e maio/2020; os ZIPs já foram apagados. Esses extratos foram gerados durante o desenvolvimento, antes da inclusão de `extract_version` no metadado. O cache final pode precisar reprocessá-los; não adicionar a versão manualmente sem verificar a compatibilidade.
- Os demais meses **não foram processados**. Não há `pipeline/references/hpv.json` real nem JSON HPV publicado. Em outra máquina, os insumos locais também precisarão ser baixados.

**Comandos para retomar:**

```sh
# Repetir por ano de 2020 até o ano corrente, após conferir a disponibilidade:
uv run python -m pipeline run --source hpv --step download --year 2020

# Depois de completar o histórico e registrar as referências oficiais:
uv run python -m pipeline run --source hpv --step compute
uv run python -m pipeline run --source hpv --step validate
uv run python -m pipeline run --source hpv --step export

uv run pytest pipeline/tests/test_hpv.py -v
uv run pytest
uv run mypy
npm test --prefix site
npm run check --prefix site
```

A flag `--year` serve apenas para `download`/`clean`; o cálculo usa o histórico completo. O formato das referências está no [README](../../../README.md). A investigação dos dados está em [18-hpv-official-inputs.md](../../mapa-cancer-br/research/18-hpv-official-inputs.md), e os números dos benchmarks em [hpv-benchmark.md](../../../docs/data/hpv-benchmark.md). Maio/2020 mediu 375,23 s incluindo download e 1.526.722.929 bytes nos diretórios HPV; isso não comprova o orçamento anual no runner.

Preferências já confirmadas pelo usuário: manter o método oficial por coorte; testes nas interfaces públicas `Source` e estado do mapa; revisão anterior comparada a `ccbd410`. Commits existentes: `ea0af78` e `1cd1658`.
