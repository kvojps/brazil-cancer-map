# Atualização manual local no lugar do agendamento em Actions

A primeira decisão, de 02/11/2026, previa atualizar os dados em GitHub Actions agendado, com runners gratuitos. Em 05/11/2026, logo depois de a medição em Actions ser bloqueada e de o HPV passar aos agregados oficiais, o mantenedor decidiu que **atualiza os dados manualmente na própria máquina**, sem nenhum agendamento de dados. A automação pode ser reavaliada no futuro, mas não é requisito. Quem vê o repositório não deve concluir que falta um cron: a falta é deliberada.

Continuam valendo a publicação em Releases, as validações por `source`, a atualização conjunta de indicadores e denominadores dependentes e a preservação da última versão válida em caso de falha.

Regras vigentes: [spec, seção 16](../spec.md#16-atualização-e-operação).

## Alternativas consideradas

- **Agendamento em Actions com microdados do HPV, um job por ano:** descartado. A atualização do indicador não deve repetir a carga nacional de microdados nem depender de ela caber num runner, e a medição nunca foi concluída.
- **Agendamento em Actions só com os agregados oficiais:** foi a primeira revisão depois da [troca da Fonte do HPV](0004-hpv-from-official-aggregates.md), e também foi substituída. Exigiria liberar a conta e demonstrar a adequação aos runners, o que deixou de ser pré-requisito.
- **Serviço pago:** descartado pela regra de custo zero. GitLab CI e runner próprio apareceram no levantamento, sem serem adotados.

## Evidências

Limites consultados em 02/11/2026, para repositório público: minutos ilimitados, 14 GB de disco, 6 h por job, assets de Release abaixo de 2 GiB. Agendamentos são desativados depois de 60 dias sem atividade, e o cache apaga o que fica 7 dias sem uso.

Volumes das Fontes: tudo somado fica abaixo de 3 GB, salvo o SISCAN, com 24,4 GB de CSV por ano, e o SI-PNI, com ~215 GB zipados e 23–28 GB por mês.

A tentativa de medir uma partição anual, em 05/11/2026, parou antes de qualquer etapa: "The job was not started because your account is locked due to a billing issue." **Não há medição do job anual**, e esse bloqueio não demonstra que o plano gratuito seja incompatível: só que o caminho dependia de algo fora do projeto. Medições locais: maio de 2020 levou 375,23 s com download, com pico de 1.526.722.929 bytes nos diretórios do HPV. A extrapolação inicial sugeria cerca de duas horas para 28 GB, mas não se confirmou: a partição de 2021, com 58,6 GB de tráfego, levou pelo menos 6 h 02 min na máquina do mantenedor, somando só as etapas mensais.

## Consequências

- Os dados só mudam quando o mantenedor executa o fluxo. Entre execuções, o site mantém a última versão publicada.
- `update` prepara um snapshot isolado para revisão. Uma falha é registrada, aparece na saída e retorna código 1, sem alterar os JSON do site nem renovar a data exibida.
- O estado necessário para retomar em outra máquina vai em assets de Release, abaixo de 2 GiB cada. A auditoria do HPV fica local e opcional.
- O deploy do site continua separado do processamento dos dados.
- O calendário de checagem é só uma recomendação: nada dispara a atualização nem avisa quando ela atrasa.
