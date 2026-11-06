# 01: Provar a reprodução

**What to build:** o guia do pesquisador só promete o que foi executado, então os níveis 1 e 2 de reprodução são testados de verdade, em clone temporário, e o resultado fica registrado aqui por fonte. Referência: [spec](../spec.md), "Níveis de reprodução" e "Lacunas conhecidas".

**Blocked by:** None (can start immediately)

**Status:** resolved

- [x] Nível 1: a Release `data-2026-11-05` é baixada em pasta vazia, `restore-release` roda nos formatos Parquet e CSV, e o resultado é comparado aos JSON commitados em `site/public/dados/`, com cada diferença explicada
- [x] Nível 2: num clone temporário, o estado local é exportado e restaurado com `restore-state --output data/clean`, depois `run --step compute`, `validate` e `export` rodam por `source`, e o resultado é comparado aos JSON commitados ignorando `pipeline_version`
- [x] Os comentários deste ticket trazem, por `source`: igual, diferente (com o que mudou) ou não executável (com o motivo). Inclui o caso do HPV e o que exige Chromium ou arquivo externo
- [x] Os comandos exatos executados ficam registrados aqui, para o ticket 08 usar
- [x] Toda diferença real em indicador é copiada para o ticket 11, sem corrigir o pipeline
- [x] Nada é baixado das fontes e nada é publicado; o repositório principal e `site/public/dados/` não são alterados

## Comments

### Resultado (06/11/2026, commit `9cf8226`)

Nenhum valor de indicador mudou nos dois níveis. O nível 1 funciona nos dois formatos. No nível 2, 6 das 10 `sources` ficam iguais só com o estado e `popsvs` valida sem publicar nada; `mesh` e `painel` exigem arquivos que o estado não traz, e o HPV difere em metadados.

### Nível 1: verificar

| Formato | `restore-release` | Comparação com `site/public/dados/` |
| --- | --- | --- |
| Parquet | exit 0, 7 s | 48 arquivos, 0 diferem em conteúdo |
| CSV | exit 0, 6 s | 48 arquivos, 0 diferem em conteúdo |

- **Diferença em bytes:** 21 arquivos são idênticos e os 27 `profiles/*.json` diferem só na ordem das chaves de `indicators`. O restore grava em ordem alfabética das tabelas, como a saída mostra. O arquivo commitado termina em `estimated_cases`, `smoking`, `hpv`, diferente da ordem atual do registro, o que sugere a ordem histórica das publicações (inferência, não executada). A comparação canônica mantém `1` e `1.0` distintos, então também não há troca de tipo numérico.
- **Efeito no site:** nenhum encontrado. Uma busca em `site/src` e `site/browser-tests` não achou iteração sobre `profile.indicators` por ordem de chave; isso não foi medido no navegador.
- **Parquet e CSV** geram saídas idênticas em bytes.
- **`manifest.json`** é idêntico em bytes, inclusive `pipeline_version: 0.1.0+df740cd-dirty`.

### Nível 2: recalcular, por `source`

A coluna "só com o estado" é o que se espera para o pesquisador numa Release que inclua o estado, o que ainda não foi executado com uma Release assim. O clone tem também os JSON commitados, e `cnes`, `hpv` e outras `sources` leem deles a malha. Como o `mesh` não publica nessa rodada, o resultado significa estado mais malha commitada. A coluna seguinte acrescenta apenas os arquivos locais citados. A comparação ignora `pipeline_version`. A coluna "O que `compute` faz" foi lida no código.

| `source` | Só com o estado | Com arquivo externo | O que `compute` faz |
| --- | --- | --- | --- |
| `mesh` | **não executável:** `validate` e `export` exigem `data/raw/mesh/ibge_municipalities.json` | **igual** (2,4 MB) | nada |
| `popsvs` | **igual**, mas não publica no site: só valida | não precisa | nada |
| `painel` | **não executável:** `compute` roda; `validate` e `export` exigem as 26 páginas de `data/raw/painel/tabnet/` (13 anos, 2 tabelas) | **igual** (468 KB) | recalcula |
| `cnes` | **igual**; exige mapshaper | não precisa | recalcula |
| `siscan` | **igual** | não precisa | recalcula |
| `siscan_cytopathology` | **igual** | não precisa | recalcula |
| `sim` | **igual**; `compute` leva cerca de 80 s e 1,2 GB de RAM | não precisa | recalcula |
| `hpv` | **diferente:** só metadados, ver abaixo | não precisa | recalcula |
| `inca` | **igual**; lê `pipeline/references/`, sem estado | não precisa | nada |
| `vigitel` | **igual** | não precisa | recalcula |

"Igual" foi conferido depois do `export` de cada `source`, que regravou os arquivos: até o HPV, só `manifest.json` difere em bytes, por causa da versão. `inca` e `vigitel` rodam depois do HPV, quando os perfis já diferem em bytes; para eles vale a comparação final, sensível a tipo numérico, que listou só os campos do HPV. No fim, 18 arquivos estão idênticos em bytes e os 30 restantes diferem apenas no HPV. A soma das etapas leva cerca de 2,5 minutos; cada clone ocupa cerca de 1,1 GB.

**HPV.** `municipalities` e `series` são iguais, então valor, Situação e cobertura por sexo não mudam. Só isto muda:

| Campo | Commitado | Recalculado |
| --- | --- | --- |
| `period.audit_last_month`, em `map/hpv/{all,cervix}.json` e nos 27 perfis (2 tipos cada) | `9` | ausente |
| `indicators.hpv.{all,cervix}.audit_last_month`, no manifesto | `9` | ausente |
| `sources.hpv.files`, no manifesto | 81 nomes `vacinacao_*.zip` e `official.json` | `official.json`, `census.parquet` |

Os JSON commitados trazem metadados da auditoria que o código atual não publica mais, e o `pipeline_version` deles aponta `df740cd-dirty`, então vêm de código anterior. O próprio `pipeline/tests/test_hpv.py:348` já exige a ausência de `audit_last_month`. Uma busca em `site/src` e `site/browser-tests` não achou uso desse campo.

**HPV depende do relógio.** O `compute` exige em `official.json` todos os anos de 2020 até o ano corrente, e o arquivo vai até 2026. Com o relógio simulado em 01/03/2027, numa cópia do estado, ele falha com `official HPV cohorts require complete years and provenance`. Sem atualizar `official.json`, o nível 2 do HPV deve parar de funcionar a partir de 2027; o ano de corte vem da leitura de `pipeline/sources/hpv.py`. O teste trocou `datetime` só no módulo do HPV e chamou `HpvSource` com os anos que o padrão produziria nesse ano; não é uma execução da CLI em 2027.

**O que exige o quê:**

- **Chromium:** só o `download` do HPV (`pipeline/hpv_official.py`, lido no código). Os níveis 1 e 2 não usam, e o Chromium não foi executado aqui.
- **mapshaper:** `cnes compute`, com `npm ci --prefix pipeline`.
- **Arquivo externo:** `mesh` e `painel`, na tabela acima. Os microdados do Vigitel e os demais `data/raw/` não foram necessários: o clone só com o estado não tinha `data/raw`, e as demais `sources` passaram.

### Limites desta prova

- **O estado veio do `data/clean` local**, porque a Release `data-2026-11-05` não traz `state-*.tar.gz`. A prova vale para esse estado e ainda não pode ser feita por quem está de fora. O ticket 11 a repete na Release nova.
- **Nada veio das fontes.** A rede foi usada só para a Release no GitHub e para as dependências (`uv`, `npm`). Na primeira rodada, os comandos Python dos níveis 1 e 2 rodaram com um `sitecustomize` que recusa e registra conexões: nenhuma tentativa foi registrada, e um teste de controle confirmou que a trava bloqueia. Ela não cobre o mapshaper, que é Node e, pelo código, só lê um arquivo local. A sequência abaixo, repetida do zero com os mesmos resultados, rodou sem essa trava.
- **Repositório principal:** `git status` limpo e nenhum arquivo novo em `data/` ou `site/public/dados/` após as execuções. Um erro de script ao editar este ticket criou quatro pastas vazias em `.scratch/documentacao/issues/data/`, já removidas, e rodou `uv sync --frozen` no repositório, sem alterar o `.venv`.
- **Código do pipeline:** não mudou. Em um clone de `9cf8226`, `pytest` deu 173 passando e `mypy` passou. Falhas intermediárias ali foram do ambiente: cota do tmpfs excedida pelos clones e mapshaper não instalado.

### Comandos executados, para o ticket 08

Esta sequência rodou do zero. `REPO` é o repositório local, onde está o `data/clean` usado no nível 2. Quem não tem esse estado só consegue rodar o nível 1. A execução clonou de `REPO`; o clone pelo GitHub não foi testado.

```bash
REPO=/caminho/do/repositorio
WORK=$(mktemp -d)

cat > "$WORK/compare.py" <<'PY'
import json, pathlib, sys
committed, produced = map(pathlib.Path, sys.argv[1:3])
names = lambda root: {p.relative_to(root) for p in root.rglob('*') if p.suffix in ('.json', '.topojson')}
def canonical(path):
    data = json.loads(path.read_text())
    if isinstance(data, dict):
        data.pop('pipeline_version', None)
    return json.dumps(data, sort_keys=True)
different = sorted(str(n) for n in names(committed) ^ names(produced)) + sorted(
    str(n) for n in names(committed) & names(produced) if canonical(committed / n) != canonical(produced / n))
print(len(names(committed)), 'files,', len(different), 'differ')
print(*different, sep='\n')
PY

# Level 1
mkdir "$WORK/assets"
gh release download data-2026-11-05 --repo kvojps/brazil-cancer-map --dir "$WORK/assets"
git clone -q "$REPO" "$WORK/clone"
cd "$WORK/clone"
uv sync --frozen -q
for format in parquet csv; do
  uv run --frozen python -m pipeline restore-release --assets "$WORK/assets" --format "$format" --output "$WORK/level1-$format"
  uv run --frozen python "$WORK/compare.py" site/public/dados "$WORK/level1-$format"
done
diff -r "$WORK/level1-parquet" "$WORK/level1-csv" && echo 'parquet == csv'

# Level 2
npm ci --prefix pipeline --silent
git archive HEAD site/public/dados | tar -x -C "$WORK" --one-top-level=committed
uv run --frozen python -m pipeline export-release --data-dir site/public/dados --state-dir "$REPO/data/clean" --output "$WORK/state"
uv run --frozen python -m pipeline restore-state --assets "$WORK/state" --output data/clean
# External files for mesh and painel. Without the next three lines, both sources fail validate and export.
mkdir -p data/raw/mesh data/raw/painel
cp "$REPO/data/raw/mesh/ibge_municipalities.json" data/raw/mesh/
cp -r "$REPO/data/raw/painel/tabnet" data/raw/painel/
for source in mesh popsvs painel cnes siscan siscan_cytopathology sim hpv inca vigitel; do
  for step in compute validate export; do
    uv run --frozen python -m pipeline run --source "$source" --step "$step" || echo "FAILED $source $step"
  done
done
uv run --frozen python "$WORK/compare.py" "$WORK/committed/site/public/dados" site/public/dados
```

Saída: `48 files, 0 differ` nos dois formatos do nível 1, `parquet == csv` e `48 files, 30 differ` no nível 2: `manifest.json`, `map/hpv/*` e os 27 perfis. No nível 2 executado, a versão ficou `0.1.0+9cf8226`, sem `-dirty`. A rodada só com o estado usou a mesma sequência sem as três linhas de arquivos externos. O bloco acima foi extraído deste ticket e executado como está, depois da revisão. Os scripts auxiliares de diagnóstico (ordem das chaves, trava de rede e relógio simulado) ficaram fora dele e não foram guardados: valem como registro do que foi observado.

**Para o guia:**

- A spec fala em JSON "idênticos" no nível 1. O executado é igual em conteúdo, não em bytes, por causa da ordem das chaves nos 27 perfis.
- `git diff` sozinho não serve para conferir: os JSON têm uma linha só e `pipeline_version` sempre muda. Por isso o `compare.py`.
- Lido no código, não executado: sem `--output`, `restore-release` grava em `site/public/dados/`, e `export-release` grava em `data/release/`.
- `painel validate` imprime alertas de queda mensal em stderr. Eles não bloqueiam a validação.

### Fora do pedido, para o ticket 11

`state-vigitel.tar.gz` traz `vigitel/interviews.parquet`, com 833.217 linhas por entrevista (`year`, `city`, `smoker`, `weight`). Não é diferença de resultado; ficou registrado porque o estado será publicado.

### Fechamento

Resolvido pelo commit `docs: record reproduction results`. O pipeline não foi alterado.
