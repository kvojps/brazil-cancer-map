# 03: Corrigir o material público

**What to build:** quem segue a página Como calculamos encontra comandos que funcionam, sem notas sobre um CI que já não existe, e sabe o que escrever em `[versão]` ao citar. Referência: [spec](../spec.md), "Correções em material existente".

**Blocked by:** None (can start immediately)

**Status:** resolved

- [x] A reprodução do HPV em `site/src/pages/metodologia.astro` descreve o fluxo atual: `run --source hpv` com agregados oficiais e `hpv-audit` como auditoria opcional e separada
- [x] A metodologia não diz mais que há medição pendente em CI nem cita o limite de 14 GB e 6 horas por job como requisito vigente
- [x] `[versão]` nos modelos de citação fica definido como a Versão de dados, por exemplo `data-2026-11-05`
- [x] A nota de `docs/data/hpv-benchmark.md` e o trecho sobre o workflow removido refletem a atualização manual, mantendo as medições como registro histórico
- [x] `download-hpv.sh` é removido
- [x] Todo comando citado na metodologia é conferido contra o CLI, e os demais comandos quebrados encontrados são corrigidos
- [x] `npm run check`, `npm run build` e os testes que leem a metodologia passam
- [x] Nenhuma regra de método muda

## Comments

### Resultado (06/11/2026, commit `docs: correct public methodology material`)

**Comandos.** Os comandos da metodologia foram conferidos contra o parser do CLI, sem rodar as etapas. Só `run --source hpv --step download --year 2020` era rejeitado (exit 2). Os demais estavam certos: `run --source` com `painel`, `cnes`, `popsvs`, `siscan`, `siscan_cytopathology`, `sim`, `vigitel` e `inca`, além de `export-release` e `./download-vigitel.sh`. Não apareceu outro comando quebrado.

**Não executado.** `run --source hpv` e `hpv-audit` não foram rodados aqui: a carga completa está fora deste esforço, e o primeiro reescreveria os JSON publicados. A descrição vem da leitura de `pipeline/cli.py` e `pipeline/sources/hpv.py`. A última extração real registrada é a de 05/11/2026, em `docs/data/hpv-benchmark.md`.

**Verificação.** `npm run check` sem erros, `npm run build` concluído, `npm test` com 87 testes aprovados e `browser-tests/methodology.test.mjs` com 6.

**Fora do texto do ticket.** `docs/data/methodology-links.md:52` também dizia que a medição estava pendente e foi corrigido, conforme o inventário (V3).

**Para o ticket 10.** A nota do `hpv-benchmark.md` não cita mais o ticket 23, então a linha "Ticket 23 → ADR 6" do inventário não tem mais o que substituir. Os links para o `.scratch` nesse arquivo passaram das linhas 52 e 95 para 53 e 96.
