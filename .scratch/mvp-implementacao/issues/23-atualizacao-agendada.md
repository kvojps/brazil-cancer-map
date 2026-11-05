# 23: Atualização agendada no GitHub Actions

**What to build:** os dados se atualizam sozinhos, sem custo. Cada fonte é checada no seu ritmo por um workflow agendado num repositório público, e uma falha numa fonte não quebra as outras nem renova a data exibida. Para HPV, a atualização usa as coortes oficiais agregadas do Ministério da Saúde; a carga pesada dos microdados fica como auditoria local do mantenedor. Referências: spec, seção 16, e [decisão 30 — fonte oficial das coortes HPV](../../mapa-cancer-br/issues/30-fonte-oficial-coortes-hpv.md).

**Blocked by:** 22 — Dados abertos na GitHub Release

**Status:** ready-for-agent

- [ ] Workflows agendados com acionamento manual: checagem mensal para Painel-Oncologia, CNES e HPV; anual conforme o calendário de cada série anual; o citopatológico nunca recebe anos novos
- [ ] Jobs independentes por fonte, em runners padrão gratuitos; particionar apenas as etapas que precisarem, sem exigir jobs anuais de microdados SI-PNI para atualizar o HPV
- [ ] A checagem mensal do HPV obtém as coortes oficiais agregadas, com numeradores, denominadores, anos, filtros efetivos, fonte e data de extração; confere o Censo 2022 e as referências oficiais antes de calcular e publicar coberturas, Situação e cascata
- [ ] A atualização e a publicação do HPV funcionam sem ZIPs mensais, extratos de pacientes, histórico de auditoria ou `audit.json`; separar essa execução da reconstrução local atualmente acoplada ao `compute` de `HpvSource`
- [ ] O agendamento anual de microdados em `.github/workflows/hpv.yml` é substituído pela atualização mensal dos agregados oficiais; a carga e a redução mensal de microdados continuam disponíveis para auditoria local, acionadas explicitamente pelo mantenedor
- [ ] Agregados e estado necessário à atualização ficam em assets de Release (< 2 GiB por arquivo), não só no cache; o CI não baixa nem armazena o acervo bruto do SI-PNI ou os extratos de pacientes usados na auditoria local
- [ ] Falha de validação ou mudança de formato: a fonte afetada não publica, mantém a última versão válida, registra a falha e avisa o mantenedor pelo CI
- [ ] Indicadores e denominadores dependentes atualizam juntos, sem combinações inconsistentes
- [ ] Uma tentativa que falhou não renova a data no `manifest.json`
- [ ] Medir duração e pico de disco dos jobs de atualização efetivamente agendados, incluindo dependências e Chromium quando necessário, e registrar sua adequação aos limites gratuitos; a medição anual dos microdados do ticket 18 não é pré-requisito da atualização pelos agregados oficiais
- [ ] O README documenta a desativação dos agendamentos após 60 dias sem atividade, a atualização pelos agregados oficiais e a execução da auditoria pesada na máquina do mantenedor

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
