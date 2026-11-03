# 23: Atualização agendada no GitHub Actions

**What to build:** os dados se atualizam sozinhos, sem custo. Cada fonte é checada no seu ritmo por um workflow agendado num repositório público, e uma falha numa fonte não quebra as outras nem renova a data exibida. Referência: spec, seção 16.

**Blocked by:** 22 — Dados abertos na GitHub Release

**Status:** ready-for-agent

- [ ] Workflows agendados com acionamento manual: checagem mensal para Painel-Oncologia, CNES e HPV; anual conforme o calendário de cada série anual; o citopatológico nunca recebe anos novos
- [ ] Jobs particionados (SI-PNI com um job por ano), em runners padrão gratuitos
- [ ] Agregados e estado incremental ficam em assets de Release, não só no cache; o CI não guarda o acervo bruto do SI-PNI
- [ ] Falha de validação ou mudança de formato: a fonte afetada não publica, mantém a última versão válida, registra a falha e avisa o mantenedor pelo CI
- [ ] Indicadores e denominadores dependentes atualizam juntos, sem combinações inconsistentes
- [ ] Uma tentativa que falhou não renova a data no `manifest.json`
- [ ] O README documenta a desativação dos agendamentos após 60 dias sem atividade e o que roda na máquina do mantenedor
