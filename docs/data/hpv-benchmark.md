# SI-PNI: medição e orçamento de execução

Medição local em **04/11/2026**, Python 3.14.4, DuckDB 2.0, Linux. Arquivos oficiais no S3 do Ministério da Saúde. O CSV foi lido diretamente do ZIP; não houve cópia integral descompactada. Os ZIPs foram apagados depois da redução. Os dados locais não entram no git.

| Mês | ZIP (bytes) | Linhas | Registros elegíveis | Tempo medido | Pico de disco (bytes) |
|---|---:|---:|---:|---:|---:|
| abr/2020 | 1.097.258.290 | 7.394.059 | 106.050 | 69,51 s, somente limpeza | 1.113.555.123, ZIP + redução |
| mai/2020 | 1.458.728.143 | 9.853.856 | 214.038 | 375,23 s, download + limpeza | 1.526.722.929, diretórios raw/clean do HPV |

Em maio, o download levou **283,18 s** e a limpeza, aproximadamente **92,05 s**. O pico inclui os insumos fixos, o extrato de abril, o ZIP do mês e os arquivos temporários da redução. Não inclui dependências, checkout e outras fontes. São tamanhos lógicos dos arquivos presentes na etapa de maior coexistência, não uma amostragem do espaço ocupado por todo o sistema de arquivos. Não houve descompactação integral nem spill do DuckDB nessa amostra.

Abril foi reprocessado a partir de um ZIP já baixado: seu tempo não mede a rede. A primeira tentativa de limpeza preservou o bruto ao encontrar município inválido. A implementação passou a excluir e contabilizar registros não classificáveis: abril teve 648 registros de HPV com município inválido; maio teve 1.238 com município inválido e dois com sexo desconhecido. Registros excluídos da RNDS, documentos que não estão em estado final, outras vacinas e idades fora de 9–14 não entram no extrato. Os números de elegíveis são anteriores à deduplicação.

## Caberia em 14 GB e 6 horas?

**A amostra mensal cabe com folga; a partição anual completa ainda não foi medida em runner do GitHub Actions.** Não há comprovação de que todo ano caiba em seis horas. A execução anual continua sendo uma pendência do ticket 18.

A pesquisa de volume encontrou meses de até cerca de 4,9 GB compactados, e anos correntes de aproximadamente 23–28 GB compactados. Como um mês é apagado antes do próximo, não é necessário reservar o ano todo no disco. É preciso somar ao maior ZIP os extratos reduzidos já existentes, temporários, dependências e checkout; o limite é 14 GB para o job inteiro.

Extrapolação **local, não medição de CI**: aplicando a velocidade de maio a 28 GB compactados, download e limpeza levariam cerca de **120 minutos**. A extrapolação supõe a mesma rede e proporção de HPV/CSV; os meses de campanha e o runner podem mudar o resultado. Ela sugere viabilidade de um job por ano, sem garantir o limite de seis horas. Até a medição anual, a carga inicial deve ser acompanhada na máquina do mantenedor; não se declara o CI aprovado apenas com essa estimativa.

O workflow `.github/workflows/hpv.yml` limita cada partição a 360 minutos. Resta executar uma partição anual completa em CI, guardar as medições e registrar seu maior espaço total de disco. Se ultrapassar o orçamento, a partição roda na máquina do mantenedor. O workflow não publica o site e persiste somente os extratos e metadados em assets da Release `hpv-state`, abaixo de 2 GiB por asset; não depende do cache de sete dias.

## Reprodução

```sh
# Partição anual, inclusive cache dos meses que não mudaram:
uv run python -m pipeline run --source hpv --step download --year 2020
```

Para uma medição mensal isolada, a mesma interface pública usada pelo baixador pode ser executada assim:

```sh
uv run python -c 'from pipeline.sources.hpv import HpvSource; HpvSource().download_month(2020, 5)'
```

O metadado `data/clean/hpv/months/<ano>/<mes>.json` registra tamanho e data de origem, duração total, duração do download, se houve download, linhas, elegíveis, motivos de exclusão e pico dos diretórios da fonte. Se o mês já estiver atualizado, ele é reaproveitado e a medição anterior é preservada. Para medir novamente a rede, use diretórios novos ao construir `HpvSource`, sem apagar estado válido.

## Insumos fixos e publicação

A extração real do SIDRA gerou **66.840 células**, 5.570 municípios × dois sexos × seis idades; população total de 9–14: **16.439.492**. O endpoint foi particionado por sexo porque a consulta nacional combinada retornou HTTP 500. A tabela histórica do TabNet foi extraída para os cinco anos e os dois sexos; os totais por idade conferem com o total de cada resposta. A amostra independente de Brasileia/AC, feminino, D1, 2019, conferiu: **48, 5, 1, 4, 2, 2**, idades 9–14.

Boa Esperança do Norte (`510183`) não existe no Censo 2022: seu volume municipal não recebe população estimada. A cascata usa sua Região imediata, com os denominadores censitários existentes e os numeradores somados, e o cartão explica a ausência municipal. Ausências inesperadas ou fatias incompletas de idade/sexo bloqueiam o cálculo.

A carga completa dos meses de 2020 até o último disponível e a comparação das coberturas finais com o painel oficial **ainda não foram executadas**. Portanto não há JSON de HPV publicado em `site/public/dados/` nesta mudança. O seletor indica dados ainda não disponíveis. A exportação exige referências oficiais com fonte e data, para total e dois sexos; sem `pipeline/references/hpv.json` ou com divergência além da tolerância registrada (máximo de um ponto percentual), falha sem alterar a publicação anterior. As interfaces de cálculo/publicação foram verificadas com arquivos pequenos, incluindo deduplicação entre anos, saída da coorte, Censo fixo, cascata, valores acima de 100% e preservação da publicação anterior quando a validação falha.

Fontes: [NT 16/2025-DPNI](https://infoms.saude.gov.br/content/Default/SEI_0045605478_Nota_Tecnica_16.pdf), [SIDRA 9514](https://sidra.ibge.gov.br/tabela/9514), [TabNet](http://tabnet.datasus.gov.br/cgi/dhdat.exe?bd_pni/dpnibr.def), [pesquisa de volume do SI-PNI](../../.scratch/mapa-cancer-br/research/17-calendario-das-fontes.md), [pesquisa dos insumos oficiais](../../.scratch/mapa-cancer-br/research/18-hpv-official-inputs.md).
