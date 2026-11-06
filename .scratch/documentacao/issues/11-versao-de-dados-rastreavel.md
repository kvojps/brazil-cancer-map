# 11: Versão de dados rastreável

**What to build:** o pesquisador consegue apontar o código exato de uma Versão de dados e recalcular a partir do estado dela. A próxima Release é gerada de árvore limpa e inclui o estado. Publicar é uma ação externa, por isso fica com o responsável. Referência: [spec](../spec.md), "Lacunas conhecidas".

**Blocked by:** 01 — Provar a reprodução

**Status:** ready-for-human

- [ ] Os JSON são gerados de árvore limpa, com `pipeline_version` sem `-dirty`
- [ ] A Release é publicada com `--state-dir`, com os `state-*.tar.gz` e sem extratos de pacientes ou auditoria HPV
- [ ] As diferenças encontradas no ticket 01, registradas abaixo, foram analisadas
- [ ] `docs/reproducibility.md` deixa de dizer "disponível a partir da próxima Release", e o nível 2 é conferido na Release nova

## Comments

### Diferenças copiadas do ticket 01 (06/11/2026)

Nenhum valor de indicador mudou. Detalhes e comandos estão no ticket 01. O pipeline não foi corrigido.

1. **Metadados do HPV nos JSON commitados.** O recálculo remove `audit_last_month` de `period` (mapas e perfis) e do manifesto, e troca `sources.hpv.files` de 81 nomes `vacinacao_*.zip` e `official.json` por `official.json` e `census.parquet`. `municipalities` e `series` são iguais. O manifesto publicado cita insumos diferentes dos que o código atual registra para esses mesmos valores. A expectativa é que gerar os JSON de árvore limpa resolva, o que ainda não foi feito.
2. **Nível 2 do HPV expira com o ano.** O `compute` exige em `official.json` todos os anos até o ano corrente. Com o relógio simulado em 01/03/2027 ele falha. Pelo código, o estado desta versão deve parar de recalcular já em 01/01/2027. Decidir se o `compute` deve usar os anos do próprio estado.
3. **`mesh` e `painel` não fecham o nível 2 só com o estado.** `validate` e `export` exigem `data/raw/mesh/ibge_municipalities.json` e `data/raw/painel/tabnet/`, fora de `state-*.tar.gz`. Com esses arquivos, as duas `sources` ficam iguais. Decidir se eles entram no estado ou se o guia mantém a ressalva.

### Conferir antes de publicar o estado

Não é diferença de resultado. `state-vigitel.tar.gz` traz `vigitel/interviews.parquet`, com 833.217 linhas por entrevista (`year`, `city`, `smoker`, `weight`), sem identificadores diretos. Não é extrato de paciente nem auditoria HPV, mas é dado individual, e a decisão é do responsável. `state-hpv.tar.gz` traz só `official.json` e `census.parquet`, como esperado.
