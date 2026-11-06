# 23: Atualização manual local dos dados

**What to build:** o mantenedor atualiza os dados manualmente na própria máquina, com um fluxo documentado para obter, validar, calcular e publicar os resultados. Cada fonte pode ser atualizada de forma independente, e uma falha numa fonte não quebra as outras nem renova a data exibida. Para HPV, a atualização usa as coortes oficiais agregadas do Ministério da Saúde; a carga pesada dos microdados fica como auditoria local opcional, executada explicitamente pelo mantenedor. Não há atualização agendada dos dados no GitHub Actions neste escopo. Referências: spec, seção 16 (o agendamento ali descrito é substituído pela decisão local registrada nos comentários deste ticket), e [decisão 30 — fonte oficial das coortes HPV](../../mapa-cancer-br/issues/30-fonte-oficial-coortes-hpv.md).

**Blocked by:** 22 — Dados abertos na GitHub Release

**Status:** resolved

- [x] Um fluxo de comandos documentado permite ao mantenedor obter, validar, calcular e publicar os dados na própria máquina, selecionando as fontes a atualizar e inspecionando os resultados antes da publicação
- [x] As fontes podem ser atualizadas independentemente; o README recomenda checagem mensal para Painel-Oncologia, CNES e HPV e anual conforme o calendário de cada série anual, sem execução automática; o citopatológico nunca recebe anos novos
- [x] A atualização manual do HPV obtém as coortes oficiais agregadas, com numeradores, denominadores, anos, filtros efetivos, fonte e data de extração; confere o Censo 2022 e as referências oficiais antes de calcular e publicar coberturas, Situação e cascata
- [x] A atualização e a publicação do HPV funcionam sem ZIPs mensais, extratos de pacientes, histórico de auditoria ou `audit.json`; separar essa execução da reconstrução local atualmente acoplada ao `compute` de `HpvSource`
- [x] O agendamento de microdados em `.github/workflows/hpv.yml` é desativado, sem criar agendamentos de atualização de dados para outras fontes; a carga e a redução mensal de microdados continuam disponíveis para auditoria local, acionadas explicitamente pelo mantenedor
- [x] Agregados e estado necessário à atualização ficam em assets de Release (< 2 GiB por arquivo), permitindo retomar o fluxo em outra máquina; o acervo bruto do SI-PNI e os extratos de pacientes usados na auditoria ficam locais, fora do git e das Releases
- [x] Falha de validação ou mudança de formato: a fonte afetada não publica, mantém a última versão válida, registra a falha e informa o mantenedor pela saída do comando e pelo código de saída
- [x] Indicadores e denominadores dependentes atualizam juntos, sem combinações inconsistentes
- [x] Uma tentativa que falhou não renova a data no `manifest.json`
- [x] O README documenta os pré-requisitos locais, os comandos de atualização e validação, a publicação nas Releases e o caminho para que os dados publicados apareçam no site, mantendo o build/testes do site no CI e a publicação no Cloudflare separados do processamento local
- [x] O README explicita que a atualização depende de uma execução manual do mantenedor, que o site mantém a última versão publicada entre execuções e que a auditoria pesada dos microdados é opcional e separada da atualização pelos agregados oficiais

## Comments

### Ajuste aprovado — 05/11/2026

O mantenedor pediu a revisão deste ticket após confirmar a adoção das coortes
oficiais agregadas no ticket 18. A atualização automática do indicador não deve
repetir a carga nacional de microdados nem depender de ela caber num runner.
Este ajuste substitui, para a operação agendada do HPV, a exigência anterior de
um job por ano de microdados. A auditoria local permanece disponível, com suas
medições e limitações documentadas no ticket 18.

O repositório é público e os runners padrão do GitHub Actions são gratuitos
nesse caso. A tentativa de medição do ticket 18 foi bloqueada por billing da
conta antes de iniciar qualquer etapa; isso não demonstra que o plano gratuito
seja incompatível com a atualização. A execução real dos workflows depende de
liberar esse acesso. Não contratar serviços pagos para cumprir este ticket.

Este ticket trata da atualização dos dados. O build/testes do site no CI e a
publicação já configurada no Cloudflare, registrada no ticket 03, continuam
separados dessa carga.

### Atualização local aprovada — 05/11/2026

O mantenedor decidiu executar a atualização dos dados manualmente na própria
máquina no MVP. Esta decisão substitui o agendamento no GitHub Actions previsto
na seção 16 da spec e no ajuste anterior deste ticket. A automação poderá ser
reavaliada futuramente, sem ser requisito para concluir este ticket.

Permanecem a publicação dos dados em Releases (ticket 22), as validações por
fonte, a atualização conjunta dos indicadores e denominadores dependentes e a
preservação da última versão válida e de sua data em caso de falha. O HPV segue
usando os agregados oficiais; a auditoria de microdados permanece local e
opcional. Liberar billing do Actions e demonstrar adequação aos limites dos
runners deixam de ser pré-requisitos deste ticket.

A alteração é de escopo do ticket, sem implementar o fluxo local nem encerrar
seus critérios. O caminho do arquivo é preservado para manter os links existentes.


### Implementação e revisão — 05/11/2026

- `53b415b` — `feat: prepare manual data updates with resumable release state`:
  comando `update` com snapshot para revisão, seleção de fontes, isolamento de
  falhas e grupos de dependências; HPV por coortes oficiais sem auditoria;
  exportação/restauração do estado em assets de Release; remoção do workflow
  de microdados e documentação do fluxo manual completo no README.
- `d7c5e91` — `fix: isolate optional HPV audit from aggregate cleaning`:
  limpeza de microdados restrita a `hpv-audit`, teste para ZIP de auditoria
  incompleto e proteção dos snapshots locais no `.gitignore`.

Validação: suíte completa do pipeline com **173 testes aprovados** e `mypy`
sem erros. Checagem Astro sem erros, avisos ou sugestões e build com
**5.574 páginas**. Os testes usaram `/var/tmp` porque `/tmp` excedeu a cota.

Revisão de código executada localmente contra o início do trabalho
(`f6d33bf`), limitada aos arquivos deste ticket: no eixo **Padrões**, sem
violações documentadas pendentes; no eixo **Spec**, identificado e corrigido
um acoplamento residual da etapa `clean` à auditoria opcional. Os revisores
paralelos da skill `code-review` não iniciaram por incompatibilidade do modelo
com a conta, portanto os dois eixos foram revisados pelo agente principal.
Não foi criada Release nem realizado deploy: o fluxo de publicação foi
validado na interface do CLI com fixtures, sem escrever no GitHub.
