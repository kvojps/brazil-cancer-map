# 15: Citopatológico (SISCAN)

**What to build:** o mapa e a ficha ganham a razão de citopatológicos em mulheres de 25–64, no eixo Detecção precoce, para colo do útero e Todos, com a série encerrada em 2025. Referência: spec, seções 5, 6.1, 6.4, 9, 10 e 11.2.

**Blocked by:** 14 — Mamografia (SISCAN)

**Status:** resolved

- [x] A razão é exames ÷ (mulheres de 25–64 ÷ 3), 2016–2025, reaproveitando o processamento do SISCAN do ticket 14
- [x] A série fica congelada em 2025: o pipeline nunca acrescenta anos novos
- [x] Tendência por quasi-Poisson com offset sobre 2016–2025; Referência = razão 1
- [x] O indicador pinta o mapa nos dois modos, para colo e Todos
- [x] O cartão diz "Série encerrada em 2025 pela mudança no rastreamento", com a ressalva do DNA-HPV, e traz a Ação do exame do colo, que explica a transição entre DNA-HPV e Papanicolau
- [x] A metodologia ganha a seção do citopatológico, com o congelamento


## Comments

### 2026-11-03 — implementação, carga completa e fechamento

Implementado sobre o processamento compartilhado do SISCAN do ticket 14. A fonte
`siscan_cytopathology` usa `pipeline/sources/siscan.py`, com
cache separado em `data/clean/siscan_cytopathology/`. O recorte é sexo F,
idades inclusivas de 25–64, residência e **ano de liberação**
(`CO_ANO_LIBERACAO`), campo que identifica os arquivos anuais do
citopatológico. O ano do resultado pode ser anterior; o CSV não possui o campo
de competência usado pela mamografia. Não filtramos motivo ou resultado do exame.

A razão usa mulheres de 25–64 do POPSVS divididas por três. Tendência, mínimo pelo
numerador, cascata, Referência 1, Situação e validação reaproveitam o mesmo cálculo
da mamografia. Download, limpeza e cálculo excluem anos posteriores a 2025.

O mapa oferece Colo e Todos em Tendência e Situação. O cartão compartilhado de
exames mostra a série congelada, a ressalva obrigatória da transição para DNA-HPV
e a Ação curta aprovada. Os detalhes clínicos novos continuam ocultos enquanto
não houver revisão profissional registrada. A metodologia documenta fórmula,
população, recortes, congelamento, modelo, mínimo, limitações e reprodução, com
links oficiais do INCA e do DATASUS.

**Carga e desempenho:** arquivos originais de 2016–2025 somam 16,34 GB. O transporte
prefere EPSV, evita REST 0 e usa oito trechos paralelos no SISCAN, com timeout de
30 segundos e retomada por trecho. Continua processando um CSV por vez e apagando
o bruto após sucesso. A medição e a carga confirmaram ganho em relação aos quatro
fluxos, com picos acima de 10 MB/s, mas sem ganho constante: o FTP oscilou bastante
e exigiu novas tentativas dos arquivos de 2020 e 2024. Os agregados concluídos
foram preservados pelo cache. A carga terminou e não restam CSVs brutos.

Contagens anuais de exames no recorte, antes de excluir residências fora da malha:

| Ano | Exames |
| --- | ---: |
| 2016 | 4.351.205 |
| 2017 | 5.057.273 |
| 2018 | 5.483.872 |
| 2019 | 5.693.576 |
| 2020 | 3.266.989 |
| 2021 | 4.982.153 |
| 2022 | 5.640.256 |
| 2023 | 6.966.579 |
| 2024 | 6.591.434 |
| 2025 | 5.910.845 |

**JSONs publicados no repositório:** `map/cytopathology/{all,cervix}.json`,
os acréscimos nas 27 fichas de UF e o manifesto, versão
`0.1.0+aac4065`. Extração registrada em 2026-11-04 (UTC).
Cobertura dos 5.571 municípios: 5.417 usam dado municipal e 154 da Região imediata.
Tendência: 882 melhorando, 527 piorando, 4.162 sem direção clara e nenhum estável.
Situação: 109 alcançou, 250 perto e 5.212 longe. Razão máxima 4,16, sem corte do
valor. Os limites operacionais são os mesmos da mamografia.

**Conferência:** todas as razões e séries passaram pelos limites de plausibilidade;
mapa e fichas concordam e não têm anos posteriores a 2025. Os demais indicadores
foram comparados com o estado anterior e permaneceram iguais nas 27 fichas.
Recife em 2025 foi conferido por consulta separada aos agregados e à população:
47.146 exames, 480.781 mulheres e razão 0,29418 (0,29 na tela). Não houve comparação
das contagens com o TabNet; essa limitação também está explícita na metodologia.

**Verificação:** 127 testes Python e 17 do site passaram, sem testes pendentes;
mypy e Astro check sem erros. O build estático foi executado pela suíte do site.
O Chromium carregou os quatro mapas, com as cores esperadas, e a ficha de Recife,
sem erros de console. Revisão em dois eixos: Standards e Spec sem achados
remanescentes após os ajustes.

Reprodução, com malha e POPSVS disponíveis:

```sh
uv run python -m pipeline run --source siscan_cytopathology
uv run pytest
uv run mypy
npm run check --prefix site
npm run test --prefix site
```

Commits que resolvem o ticket:

- `be6284c` — `feat: add frozen SISCAN cervical cytopathology indicator`.
- `e51c9d8` — `fix: prefer extended passive FTP and address screening review`.
- `aac4065` — `perf: tune SISCAN FTP concurrency and connection timeout`.
- Commit deste registro — `feat: publish cytopathology series and resolve ticket 15`.
