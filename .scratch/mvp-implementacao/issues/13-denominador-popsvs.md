# 13: Denominador POPSVS no pipeline

**What to build:** prefactor. O pipeline passa a ter a população MS/SVS por município, sexo e idade simples (0–79, 80+), 2000–2025, como denominador padrão para as taxas e razões dos tickets seguintes. Referência: spec, seções 4 e 6.1.

**Blocked by:** 01 — Esqueleto do monorepo e requisitos de licença

**Status:** ready-for-agent

- [ ] O baixador busca os arquivos `POPSBR<aa>.zip` com cache incremental
- [ ] A limpeza gera Parquet padronizado (código de 6 dígitos, ano, sexo, idade, população)
- [ ] Uma função devolve a população por município × ano × recorte de sexo e idade; quando falta o ano, usa o anterior e marca o resultado como provisório
- [ ] O município novo tem série a partir de quando passou a existir, sem recalcular o de origem
- [ ] A validação confere os totais do Brasil e das UFs numa faixa plausível e documenta que números oficiais anteriores a 2025 não batem (a estimativa antiga superestimava ~5,8%)
- [ ] Testes cobrem o recorte de idade e o fallback de ano
