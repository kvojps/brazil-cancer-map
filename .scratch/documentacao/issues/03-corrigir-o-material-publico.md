# 03: Corrigir o material público

**What to build:** quem segue a página Como calculamos encontra comandos que funcionam, sem notas sobre um CI que já não existe, e sabe o que escrever em `[versão]` ao citar. Referência: [spec](../spec.md), "Correções em material existente".

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] A reprodução do HPV em `site/src/pages/metodologia.astro` descreve o fluxo atual: `run --source hpv` com agregados oficiais e `hpv-audit` como auditoria opcional e separada
- [ ] A metodologia não diz mais que há medição pendente em CI nem cita o limite de 14 GB e 6 horas por job como requisito vigente
- [ ] `[versão]` nos modelos de citação fica definido como a Versão de dados, por exemplo `data-2026-11-05`
- [ ] A nota de `docs/data/hpv-benchmark.md` e o trecho sobre o workflow removido refletem a atualização manual, mantendo as medições como registro histórico
- [ ] `download-hpv.sh` é removido
- [ ] Todo comando citado na metodologia é conferido contra o CLI, e os demais comandos quebrados encontrados são corrigidos
- [ ] `npm run check`, `npm run build` e os testes que leem a metodologia passam
- [ ] Nenhuma regra de método muda

## Comments
