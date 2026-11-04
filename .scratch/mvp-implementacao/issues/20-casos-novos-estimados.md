# 20: Casos novos estimados (INCA 2026–2028)

**What to build:** o eixo Panorama da ficha ganha os casos novos estimados pelo INCA para a UF e a capital, como contexto, sem série, sem Referência e sem Tendência. Referência: spec, seções 4, 5 e 10.2.

**Blocked by:** 10 — Ficha do Meu município com o cartão do 60 dias

**Status:** resolved

- [x] Os números da edição 2026–2028 são extraídos manualmente e versionados no repositório como dado de entrada, com fonte e data de extração
- [x] O pipeline valida o arquivo (todas as UFs e capitais, Todos + 5 tipos) e o exporta na camada da ficha
- [x] O cartão mostra a estimativa da UF e da capital e a Ação aprovada: "Explore as orientações de prevenção e detecção precoce. A estimativa do estado não prevê quem terá câncer."
- [x] A metodologia ganha a seção dos casos estimados

## Comments

Implementado em `bf1cd7e` (`feat: add INCA annual case estimates to municipality profiles`). O insumo manual está em `pipeline/references/inca-estimates-2026.json`, extraído em 2026-11-04 das tabelas oficiais do INCA; os 324 valores foram reconferidos na revisão. Todos exclui pele não melanoma. Brasília usa os números do Distrito Federal, com explicação no insumo, no cartão e na metodologia.

Revisão pela skill `code-review`: padrões — um achado administrativo (fechamento deste ticket), resolvido neste registro; nenhum cheiro de código relevante. Spec — nenhum achado. Validação: 151 testes Python e 22 testes do site passaram; `uv run mypy` e `npm run check` passaram; o build estático integra a suíte do site. Os avisos de separação perfeita do statsmodels permanecem nos testes estatísticos existentes.

O manifesto foi regenerado após o commit de implementação para registrar uma versão limpa e reproduzível do pipeline. Esta atualização e o fechamento do ticket entram juntos no commit `chore: finalize INCA estimate publication and close ticket 20`.
