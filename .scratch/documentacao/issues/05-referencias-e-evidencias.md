# 05: Referências e evidências

**What to build:** quem mantém os dados ou confere o método encontra em `docs/` o que sabemos de cada Fonte e as evidências citadas, e quem mexe na interface encontra o contrato que os testes verificam. Referência: [spec](../spec.md), "Estrutura final" e "Regras"; tabela do [inventário](02-inventario-do-scratch.md).

**Blocked by:** 02 — Inventário do `.scratch`

**Status:** resolved

- [x] `docs/data-sources.md` traz, por `source` e Fonte: insumos, pré-requisitos, calendário, endereços, volumes, validações, limiares operacionais e referências oficiais, reunindo o que está nas seções POPSVS, SISCAN, HPV e CNES do README e nas pesquisas
- [x] A tabela distingue Fonte de `source`, inclusive `siscan` e `siscan_cytopathology`, e `mesh` e `popsvs`, que não geram Indicador
- [x] O que está só no README e é método foi para `/metodologia/`, sem criar regra nova
- [x] `docs/data/` guarda os números e resultados das evidências do inventário, sem os scripts exploratórios, incluindo a conferência do SIM com o Atlas que `pipeline/references/sim-atlas.json` cita
- [x] `docs/ui-contract.md` reúne as decisões de UI que os testes e o CSS usam como contrato, com seções que os comentários do código possam citar
- [x] `docs/validation/accessibility-audit.md` traz a auditoria, seus limites e o que continua pendente, sem os JSON brutos
- [x] Nenhum desses documentos cita o `.scratch`

## Comments

### Andamento (06/11/2026), interrompido a pedido do responsável

**O ticket continua aberto.** O trabalho foi interrompido durante a revisão. **Nada foi commitado:** as mudanças estão só na árvore de trabalho. As caixas seguem desmarcadas porque a revisão não terminou, embora os documentos abaixo já existam.

**Escrito:**

- `docs/data-sources.md`: tabela de Fonte e `source`, calendário, regras comuns, uma seção por `source`, Referências oficiais e índice das evidências.
- `docs/ui-contract.md`: seções por decisão, com a tabela de quais testes e código usam cada uma, para o ticket 10 citar. Inclui os limites aceitos e o que não foi verificado.
- `docs/validation/accessibility-audit.md`: auditoria, limites e roteiro humano pendente, sem os JSON brutos.
- `docs/data/`: `quality-by-state.md`, com `quality-by-state-treatment.csv` e `quality-by-state-deaths.csv`; `painel-series-breaks.md`; `sim-atlas-check.md`; `c55-validation.md`; `hpv-official-inputs.md`; `action-sources.md`.
- `site/src/pages/metodologia.astro`: novo trecho "A população usada como denominador", em `#dados-e-fontes`, com o método do POPSVS que estava só no README. Foi a única mudança de método encontrada. É preciso conferir se falta outra.
- `docs/data/hpv-benchmark.md`: as duas citações ao `.scratch` agora apontam para `docs/` e para o ADR 4. O inventário deixava isso para o ticket 10, mas o critério daqui pede documentos sem `.scratch`.

**Verificado:**

- `npm run check` sem erros, `npm test` com 87 testes, `uv run pytest` com 173 e `uv run mypy` sem erros.
- `npm run check:tones` passou nos dois temas.
- Contra a saída estática, `methodology`, `reading-pages` e `accessibility` passaram (78 testes). A suíte inteira de navegador **não** foi rodada.
- Um script conferiu os links e as âncoras internas dos documentos novos, sem nenhum quebrado. Ele não foi guardado. Os endereços externos **não** foram reconferidos, e os documentos dizem a data de cada um.
- Uma busca não encontrou `.scratch` nem citação de ticket nos documentos novos e em `docs/data/`.
- Conferidos com script, a partir das origens: os totais do axe, as faixas por tipo, os grupos da saída estática e a soma dos recursos da primeira visita. Os demais números foram copiados das origens, sem segunda conferência.
- A carga das fontes não foi repetida. Validações e limiares vêm da leitura do código, e o documento diz isso.

**Falta:**

1. **Revisão em dois eixos, base `3cf213e`:** foi iniciada e interrompida, sem resultado. Precisa ser refeita.
2. Corrigir o que a revisão apontar.
3. Marcar as caixas, trocar o status para `resolved` e registrar o commit, no mesmo commit da última mudança.

**Para decidir ou observar:**

- O código exige mudança para receber dados novos em três pontos: o POPSVS de 2026, um ano novo de mamografia, que divide a constante `YEARS` com o citopatológico, e a próxima edição do INCA. Foram só registrados em `docs/data-sources.md`, sem mudar o pipeline.
- `pipeline/references/sim-atlas.json` ainda cita o `.scratch`. A troca fica para o ticket 10, e `docs/data/sim-atlas-check.md` já existe como destino.
- `metodologia.astro` diz "tolerância de até um ponto percentual" no HPV, e o valor registrado é 0,01 p.p. O texto não está errado, porque 1 p.p. é o máximo aceito, e não foi alterado.


### Conclusão (06/11/2026)

Revisão refeita sobre a base `3cf213e`, incluindo os arquivos ainda não versionados, em dois agentes independentes: **Standards: zero achados; Spec: zero achados**. A revisão documental incluiu consultas amostrais ao código e às evidências originais. O método restante no README já está nas seções dos indicadores da Metodologia; a ressalva geral sobre a revisão populacional foi transportada neste ticket.

Verificação final: `npm run check --prefix site` sem erros, avisos ou hints; `npm test --prefix site` com 87 testes aprovados (inclui build); `uv run pytest` com 173 aprovados; `uv run mypy` sem problemas em 48 arquivos. O pytest emitiu 274 avisos de separação perfeita do statsmodels. Os testes foram repetidos com acesso fora do sandbox após bloqueios de cache e subprocessos. Conferidos 11 documentos: nenhum caminho `.scratch` nem link Markdown local para arquivo ausente. As verificações de navegador e de âncoras registradas acima não foram repetidas nesta conclusão; a suíte completa de navegador continua sem nova execução neste ticket.

Resolvido pelo commit `docs: preserve source references and validation evidence`.
