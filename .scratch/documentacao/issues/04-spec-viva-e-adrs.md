# 04: Spec viva e ADRs

**What to build:** quem chega ao repositório encontra as regras vigentes e o porquê das decisões difíceis em `docs/`, sem depender do `.scratch`. Referência: [spec](../spec.md), "Spec viva" e "ADRs"; tabela do [inventário](02-inventario-do-scratch.md).

**Blocked by:** 02 — Inventário do `.scratch`

**Status:** resolved

- [x] `docs/spec.md` traz o conteúdo vigente da spec do MVP, com a mesma numeração de seções
- [x] As divergências estão corrigidas no próprio texto: atualização manual, Cloudflare Workers, 5.571 municípios e as demais apontadas no inventário
- [x] As decisões do inventário com destino na spec foram incorporadas
- [x] Citações de ticket saíram, trocadas por link para ADR quando houver, e a justificativa necessária está no próprio texto
- [x] A §17 registra as quatro dívidas conhecidas com números e decisões já tomadas: redução de tamanho, sessão humana de acessibilidade, revisão clínica das Ações e textos a aprovar, com a lista D41 do inventário copiada no próprio texto
- [x] A spec §11.2 e `GLOSSARY.md:9` dizem que o painel mostra a taxa de mortalidade, sem contagem de óbitos e sem Situação
- [x] Os dez ADRs da spec estão em `docs/adr/`, no formato do projeto, com contexto, alternativas e evidências no próprio texto, sem link para o `.scratch`
- [x] Nenhuma regra nova é criada: mudança além do que os tickets decidiram volta ao responsável

## Comments

### Respostas do responsável no inventário (06/11/2026)

Os critérios acima já incorporam as respostas: dez ADRs, quatro dívidas na §17 e a taxa de mortalidade no painel. Detalhes no [inventário](../inventario.md).

### Resultado (06/11/2026)

`docs/spec.md` mantém as 27 seções numeradas da spec do MVP, e `docs/adr/` traz os dez ADRs. Uma busca confirmou que os dois não citam `.scratch`, tickets nem a tag, um script conferiu os links internos, e os números de acessibilidade da §17 foram somados de novo a partir do JSON da auditoria. São só documentos: não se aplicam TDD nem as suítes de teste.

**Revisão em dois eixos, base `1d4980f`.** Corrigidos na revisão: validações apagadas na §14, tolerância do HPV que faltava na §6.1, medição do HPV que contrariava a extrapolação no ADR 6, motivo inferido sobre a Região de Saúde no ADR 8, retirada do GitHub Pages sem decisão e resíduos históricos na §17. Não aplicados, por serem de julgamento: aberturas de ADR com mais de 3 frases e seções "Evidências", que o ticket pede; números repetidos entre ADRs, que a regra de copiar evidências sustenta.

**Pontos que voltam ao responsável, sem mudança:**

- `GLOSSARY.md:21` ainda diz que a Referência é "o valor do Brasil" quando não há meta, como o ticket de decisão manteve. Nenhum indicador usa esse caso, e a §9 registra isso (V6).
- O GitHub Pages segue como alternativa na §13, mas a saída de 999,5 MB está perto do limite de 1 GB.
- Os caminhos `docs/data-sources.md`, `docs/ui-contract.md`, `docs/data-update.md` e `docs/validation/accessibility-audit.md`, citados sem link, passam a existir com os tickets 05 e 07.
- Até o ticket 10, o `AGENTS.md` ainda aponta para a spec antiga e diz que vale o ticket (V25).

Resolvido pelo commit `docs: add living spec and ADRs`.
