# 13: Denominador POPSVS no pipeline

**What to build:** prefactor. O pipeline passa a ter a população MS/SVS por município, sexo e idade simples (0–79, 80+), 2000–2025, como denominador padrão para as taxas e razões dos tickets seguintes. Referência: spec, seções 4 e 6.1.

**Blocked by:** 01 — Esqueleto do monorepo e requisitos de licença

**Status:** resolved

- [x] O baixador busca os arquivos `POPSBR<aa>.zip` com cache incremental
- [x] A limpeza gera Parquet padronizado (código de 6 dígitos, ano, sexo, idade, população)
- [x] Uma função devolve a população por município × ano × recorte de sexo e idade; quando falta o ano, usa o anterior e marca o resultado como provisório
- [x] O município novo tem série a partir de quando passou a existir, sem recalcular o de origem
- [x] A validação confere os totais do Brasil e das UFs numa faixa plausível e documenta que números oficiais anteriores a 2025 não batem (a estimativa antiga superestimava ~5,8%)
- [x] Testes cobrem o recorte de idade e o fallback de ano


## Comments

Implementado em 2026-11-03:

- Fonte `popsvs` registrada, com listagem dos ZIP de 2000–2025 e cache incremental por tamanho/data. Limpeza lê DBF com nomes de colunas em ambas as caixas, normaliza código municipal para seis dígitos e grava Parquet sem reconstruir séries municipais.
- `Population.get` seleciona sexo e limites inclusivos de idade (80 representa 80+). Usa somente o ano imediatamente anterior quando o ano inteiro está ausente, com marca provisória; ausência municipal gera erro.
- Validação exige 162 células distintas por município/ano, domínios válidos, 27 UFs e totais plausíveis nacionais e estaduais. Faixas, uso e ressalva da revisão pós-Censo 2022 (~5,8% de superestimação antiga) documentados no README.
- Verificação: 111 testes Python passando e mypy sem erros. Testes usam ZIP/DBF sintéticos e Parquet reais, cobrindo recortes, fallback, município novo, cache e rejeição de dados implausíveis/duplicados. Não foi realizada a carga real do FTP nesta sessão.
- Revisão em dois agentes desde `fd72f9c`: Standards sem violações (sugestão de nomes explícitos aplicada); Spec sem divergências funcionais.

Commits que resolveram o ticket:

- Commit deste fechamento — `feat: add POPSVS population denominators and resolve ticket 13`.
