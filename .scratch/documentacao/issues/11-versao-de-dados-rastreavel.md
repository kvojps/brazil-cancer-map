# 11: Versão de dados rastreável

**What to build:** o pesquisador consegue apontar o código exato de uma Versão de dados e recalcular a partir do estado dela. A próxima Release é gerada de árvore limpa e inclui o estado. Publicar é uma ação externa, por isso fica com o responsável. Referência: [spec](../spec.md), "Lacunas conhecidas".

**Blocked by:** 01 — Provar a reprodução

**Status:** ready-for-human

- [x] Os JSON são gerados de árvore limpa, com `pipeline_version` sem `-dirty`
- [ ] A Release é publicada com `--state-dir`, com os `state-*.tar.gz` e sem extratos de pacientes ou auditoria HPV
- [x] As diferenças encontradas no ticket 01, registradas abaixo, foram analisadas
- [ ] `docs/reproducibility.md` deixa de dizer "disponível a partir da próxima Release", e o nível 2 é conferido na Release nova

## Comments

### Diferenças copiadas do ticket 01 (06/11/2026)

Nenhum valor de indicador mudou. Detalhes e comandos estão no ticket 01. O pipeline não foi corrigido.

1. **Metadados do HPV nos JSON commitados.** O recálculo remove `audit_last_month` de `period` (mapas e perfis) e do manifesto, e troca `sources.hpv.files` de 81 nomes `vacinacao_*.zip` e `official.json` por `official.json` e `census.parquet`. `municipalities` e `series` são iguais. O manifesto publicado cita insumos diferentes dos que o código atual registra para esses mesmos valores. Naquele momento, a expectativa era que gerar os JSON de árvore limpa resolvesse, o que ainda não havia sido feito. A preparação abaixo confere essa hipótese.
2. **Nível 2 do HPV expira com o ano.** O `compute` exige em `official.json` todos os anos até o ano corrente. Com o relógio simulado em 01/03/2027 ele falha. Pelo código, o estado desta versão deve parar de recalcular já em 01/01/2027. Decidir se o `compute` deve usar os anos do próprio estado.
3. **`mesh` e `painel` não fecham o nível 2 só com o estado.** `validate` e `export` exigem `data/raw/mesh/ibge_municipalities.json` e `data/raw/painel/tabnet/`, fora de `state-*.tar.gz`. Com esses arquivos, as duas `sources` ficam iguais. Decidir se eles entram no estado ou se o guia mantém a ressalva.

### Conferir antes de publicar o estado

Não é diferença de resultado. `state-vigitel.tar.gz` traz `vigitel/interviews.parquet`, com 833.217 linhas por entrevista (`year`, `city`, `smoker`, `weight`), sem identificadores diretos. Não é extrato de paciente nem auditoria HPV, mas é dado individual, e a decisão é do responsável. `state-hpv.tar.gz` traz só `official.json` e `census.parquet`, como esperado.


### Preparação local (06/11/2026)

O contrato foi regenerado num clone local limpo de
`a98b5fd8d4d43602d26ac020426928b7531b4952`, sem baixar Fontes e sem alterar
`site/public/dados/` do repositório principal. O manifesto gerado registra
`pipeline_version: 0.1.0+a98b5fd`, sem `-dirty`. `compute`, `validate` e
`export` passaram nas dez `source`s, com os insumos externos de `mesh` e
`painel` copiados separadamente.

A comparação sensível aos tipos numéricos encontrou exatamente 60 diferenças:
58 remoções de `audit_last_month`, a lista de insumos HPV e `pipeline_version`.
Nenhum valor de Indicador mudou. As decisões e a evidência ficam preservadas
em `docs/data/traceable-version.md`, com links nos guias e na spec.

Decisão de escopo: manter as ressalvas de HPV dependente do relógio e dos
arquivos externos de `mesh`/`painel`; nenhuma correção do pipeline neste
esforço. A publicação segue com o responsável. O guia deixa de prometer
"disponível a partir da próxima Release" e registra que o nível 2 ainda não
foi comprovado com uma Release pública.

O ticket continua `ready-for-human`: faltam publicar uma versão inédita com
`--state-dir`, baixar os assets publicados, repetir o nível 2 e só então
incorporar os JSON ao site. Não se marca `resolved` antes dessas etapas.

Verificações: `uv run mypy` (48 arquivos), testes de Release (5) e suíte
Python completa (173), todos passando. Sem novos testes, pois a mudança é
documental; as fronteiras existentes de exportação/restauração foram exercidas.

A proposta foi preservada em `data/release-traceable-11/` (ignorado pelo git),
com `dados/`, `clean/`, `assets/`, `external-raw/` e `SHA256SUMS`. Os 27
checksums da cópia conferem. CSV e Parquet restauram 48 arquivos sem diferenças.
Os checksums ficam também em `docs/data/traceable-version-sha256.txt`.

Revisão em dois eixos contra `a98b5fd`: Standards, zero achados; Spec, zero
achados, mantendo explícitas as etapas humanas pendentes.

Commit de preparação: `docs: prepare traceable data version`.

Recálculo dos assets locais: estado restaurado em destino novo, dez
`source`s com `compute`, `validate` e `export`, comparação final de 48
arquivos com zero diferenças, inclusive `pipeline_version`. Foram usados
os mesmos arquivos externos de `mesh`/`painel`. Essa prova local não foi
confundida com a conferência pendente de uma nova Release pública.
