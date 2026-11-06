# 01: Provar a reprodução

**What to build:** o guia do pesquisador só promete o que foi executado, então os níveis 1 e 2 de reprodução são testados de verdade, em clone temporário, e o resultado fica registrado aqui por fonte. Referência: [spec](../spec.md), "Níveis de reprodução" e "Lacunas conhecidas".

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] Nível 1: a Release `data-2026-11-05` é baixada em pasta vazia, `restore-release` roda nos formatos Parquet e CSV, e o resultado é comparado aos JSON commitados em `site/public/dados/`, com cada diferença explicada
- [ ] Nível 2: num clone temporário, o estado local é exportado e restaurado com `restore-state --output data/clean`, depois `run --step compute`, `validate` e `export` rodam por `source`, e o resultado é comparado aos JSON commitados ignorando `pipeline_version`
- [ ] Os comentários deste ticket trazem, por `source`: igual, diferente (com o que mudou) ou não executável (com o motivo). Inclui o caso do HPV e o que exige Chromium ou arquivo externo
- [ ] Os comandos exatos executados ficam registrados aqui, para o ticket 08 usar
- [ ] Toda diferença real em indicador é copiada para o ticket 11, sem corrigir o pipeline
- [ ] Nada é baixado das fontes e nada é publicado; o repositório principal e `site/public/dados/` não são alterados

## Comments
