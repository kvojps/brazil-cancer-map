# Restauração das referências de validação do tratamento

## Código e estado

A implementação da [issue #4](https://github.com/kvojps/brazil-cancer-map/issues/4)
parte de `79992adbb1d9ee34244b0d22297fec866a8cf2ac`. O commit que introduz
este documento contém o código e os testes correspondentes.

`painel.clean` copia para `clean/painel/tabnet/` as duas páginas oficiais de
cada ano observado nos dados limpos: `ANO.html` e `chemo_radio/ANO.html`.
A leitura e a verificação do formato ocorrem antes de escrever o novo estado.
A cópia anterior das referências é substituída, sem manter anos estranhos ao
período. `validate` e `export` usam exclusivamente as referências do estado.
Os mecanismos existentes de snapshot, exportação e restauração já preservam
esses arquivos; não houve mudança de formato de asset ou de CLI.

Não se empacotam o diretório bruto, DBC ou extratos de pacientes. A exclusão
da auditoria opcional HPV e o limite de menos de 2 GiB por asset permanecem.
As comparações oficiais de contagens e percentuais mantêm suas tolerâncias.
A prova negativa encontrou uma lacuna anterior: uma tabela com cabeçalhos
válidos, mas sem linhas de UF, passava sem comparação. Agora ela bloqueia
a publicação, assim como páginas ausentes, ilegíveis e divergentes.

## Referência independente

`pipeline/tests/fixtures/painel-contract.json` foi gerado **antes de alterar
`pipeline/sources/painel.py`**, com o código base e os insumos sintéticos
agora definidos em `pipeline/tests/test_painel_state.py`. A expectativa fica
versionada e não é recalculada pelo teste. SHA-256:

```text
dc559fe8342729b7eb9a4d90f7188fe3df39dd55d95cfdd273546467e7368c3a
```

São treze anos (2014–2026), cinco localizações de câncer e um município,
Porto Velho. Por ano, há 1.000 casos em Todos: 600 no prazo, 100 sem informação,
500 tratados com quimio ou radio e 200 destes no prazo. Cada localização tem
um quinto dessas contagens. Os dois últimos anos são provisórios. As páginas
TabNet sintéticas expressam essas contagens no formato oficial. Apenas o
adaptador externo de decodificação DBC é simulado; limpeza, cálculo,
validação e publicação são reais. Isso não verifica o decodificador DBC.

Comparam-se os oito documentos JSON (seis camadas, perfil e manifesto), além
do índice municipal, por serialização canônica, preservando tipos numéricos,
códigos, período, Referência, Situação, Tendência, faixa A/B/C, séries,
proveniência e data de extração. Não se exige identidade byte a byte.
Somente `pipeline_version` varia por identificar o código executado: seu
preenchimento é conferido separadamente, e esse campo é normalizado para
comparar os demais metadados. A referência registra a versão base com
`-dirty` porque o teste ainda não estava commitado; não é uma Release.

## Prova pelo fluxo público

`pipeline/tests/test_painel_state.py` executa `main`, entrada pública da CLI:

1. Prepara os insumos e executa `clean`, `compute`, `validate` e `export`.
2. Modifica as páginas do cache depois da preparação para detectar uso
   acidental da versão posterior; há também ano estranho e extrato no bruto.
3. Executa `export-release --state-dir`, verifica as 26 páginas no asset,
   a ausência dos extratos e remove todo o diretório original.
4. Bloqueia conexões de rede e executa `restore-state` e `restore-release`
   em outro diretório. Cria as `source`s pelo registro existente.
5. Executa `compute`, `validate` e `export` e compara com a referência fixa.

Antes da correção, o teste falhou porque o asset não tinha páginas HTML.
Depois da correção, passou. Outros testes removem ou corrompem cada tabela,
introduzem divergências e páginas vazias: validação e exportação falham e
preservam o contrato. Um snapshot independente mantém suas referências
mesmo após mudar o estado original. Uma atualização do Painel com falha de
download conserva estado e contrato anteriores e registra a falha no relatório.
O limite de tamanho é exercitado com teto reduzido. Os testes existentes de
dependências, Releases e comparações oficiais continuam na suíte completa.

Comandos executados na raiz, com Python 3.14+ e dependências instaladas:

```bash
UV_CACHE_DIR=/tmp/cancer-uv-cache uv run pytest pipeline/tests/test_painel_state.py -q
UV_CACHE_DIR=/tmp/cancer-uv-cache uv run pytest pipeline/tests/test_painel_state.py pipeline/tests/test_painel_publish.py -q
UV_CACHE_DIR=/tmp/cancer-uv-cache uv run mypy
UV_CACHE_DIR=/tmp/cancer-uv-cache uv run pytest
```

Em 12/11/2026, os 11 testes do novo arquivo passaram; tipos estritos passaram
nos 50 arquivos. A suíte Python completa passou com **205 testes**, em
90,94 s, e 430 avisos `PerfectSeparationWarning` do statsmodels nas fixtures.
O resultado também está registrado na issue junto ao commit.

## Pré-requisitos e limites

A preparação inicial exige os DBC e as páginas oficiais correspondentes.
O recálculo restaurado exige Python 3.14+, dependências de `uv sync --frozen`,
estado e contrato correspondentes e o código gerador. Não exige navegador,
DBC nem rede. `update` coleta novos dados; para reproduzir, use apenas
`run --source painel --step compute`, depois `validate` e `export`.

A garantia cobre estados preparados pelo fluxo corrigido. A prova é pequena
e sintética, sem nova coleta nacional nem reprodução dos assets públicos.
`data-2026-11-06` continua sem as páginas no estado e seu código gerador
continua procurando-as em `data/raw/painel/tabnet/`. Código atual não inventa
insumos ausentes: um estado antigo exigiria as páginas efetivamente usadas
na publicação, agora no diretório limpo. Uma consulta atual não as substitui.
`data-2026-11-05` continua sem estado. Nenhuma Release existente foi alterada,
nenhuma Versão de dados foi publicada e nenhum deploy foi executado.
