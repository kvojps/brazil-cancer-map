# 11: Versão de dados rastreável

**What to build:** o pesquisador consegue apontar o código exato de uma Versão de dados e recalcular a partir do estado dela. A próxima Release é gerada de árvore limpa e inclui o estado. Publicar é uma ação externa, por isso fica com o responsável. Referência: [spec](../spec.md), "Lacunas conhecidas".

**Blocked by:** 01 — Provar a reprodução

**Status:** ready-for-human

- [ ] Os JSON são gerados de árvore limpa, com `pipeline_version` sem `-dirty`
- [ ] A Release é publicada com `--state-dir`, com os `state-*.tar.gz` e sem extratos de pacientes ou auditoria HPV
- [ ] As diferenças encontradas no ticket 01, registradas abaixo, foram analisadas
- [ ] `docs/reproducibility.md` deixa de dizer "disponível a partir da próxima Release", e o nível 2 é conferido na Release nova

## Comments
