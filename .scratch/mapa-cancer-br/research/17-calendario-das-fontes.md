# Calendário das fontes: frequência, atraso, tamanho e limites de CI

Pesquisa do ticket `issues/17-calendario-das-fontes.md`. Data da verificação: **2026-11-02**.
Método: listagem direta do FTP do DATASUS (`ftp://ftp.datasus.gov.br/dissemin/publicos/`) com `curl`, para ver data de gravação e tamanho de cada arquivo; cabeçalhos HTTP (`HEAD`) dos ZIPs do SI-PNI no S3 do Portal de Dados Abertos do SUS, sem baixar os arquivos; leitura do diretório central de um ZIP do SI-PNI por requisição de intervalo (`Range`), para saber o tamanho descompactado; páginas do Vigitel, do INCA e do FTP de geociências do IBGE; documentação oficial do GitHub Actions e do GitLab CI; execuções públicas de workflows que acessam o FTP do DATASUS. Datas do FTP estão no formato que o servidor mostra (mês-dia-ano), convertidas aqui para dia/mês/ano. Quando algo é inferência ou estimativa, isso está indicado.

## Resumo

- **Quase tudo é leve.** Painel-Oncologia (0,2 GB), SIM (1,4 GB de 2014–2024 em arquivos nacionais, mais 0,4 GB de preliminares), CNES (~24 MB por mês), POPSVS (~4 MB por ano), Vigitel (83 MB) e malha IBGE (237 MB) somam menos de 3 GB na carga completa.
- **Dois gigantes:** o **SISCAN** (mamografia + citopatológico 2016–2025 = **24,4 GB** de CSV sem compressão, regravado inteiro uma vez por ano) e o **SI-PNI** (**~215 GB zipados** de 2020 a set/2026, cerca de 4 vezes isso descompactado). O SI-PNI **regrava o ano corrente inteiro a cada mês**, então a "atualização incremental" é baixar de novo **~23–28 GB zipados** (o ano corrente todo).
- **Ritmos:** Painel-Oncologia e CNES são **mensais**; SI-PNI é **mensal**, com atraso de ~1 mês; SIM preliminar é **mensal** e o ano X fica **final em dezembro de X+1**; SISCAN, POPSVS, Vigitel e malha IBGE são **anuais**; a Estimativa INCA é **trienal**.
- **Endereços estáveis** no FTP do DATASUS (mesmos nomes de pasta e de arquivo há anos). O que muda: o portal do SI-PNI (o domínio antigo `opendatasus` redireciona para `dadosabertos`, e a API CKAN pública não responde mais), a página da Estimativa INCA a cada edição, e detalhes de formato (nomes de coluna minúsculos no POPSVS 2025).
- **GitHub Actions gratuito dá conta**, com cuidado: repositório público tem minutos ilimitados em runner padrão (4 CPUs, 16 GB de RAM, **14 GB de SSD**), **6 h por job** e até 20 jobs em paralelo. O cache de 10 GB **apaga entradas sem uso há 7 dias**, então não serve para guardar estado entre execuções mensais. Workflows de terceiros acessam o FTP do DATASUS a partir do GitHub Actions com sucesso. O SI-PNI e o SISCAN precisam ser processados **em fluxo, um arquivo por vez**, sem guardar o bruto.

---

## 1. Fontes do FTP do DATASUS

### Painel-Oncologia

Listagem de `ftp://ftp.datasus.gov.br/dissemin/publicos/painel_oncologia/Dados/` em 2026-11-02.

| Item | Situação |
|---|---|
| Arquivos | `POBR2013.dbc` … `POBR2026.dbc`, um arquivo nacional por ano de diagnóstico |
| Frequência | **Mensal.** Os 14 arquivos (2013 a 2026) têm a mesma data de gravação, **17/10/2026**: todos os anos são regravados juntos. O dicionário diz que a atualização é mensal, inclusive para anos anteriores ([ticket 01](01-dados-disponiveis-por-eixo.md); dicionário em `ftp://ftp.datasus.gov.br/dissemin/publicos/painel_oncologia/Doc/Dicionario_Painel_Oncologia.pdf`) |
| Atraso | O ano corrente já aparece parcial (`POBR2026.dbc`, 7,3 MB). Não existe uma data de "consolidação": cada ano é revisado todo mês. Na prática, os **2 últimos anos ficam provisórios**, porque a % "sem informação de tratamento" ainda cai com o tempo ([research/09](09-medir-completude-por-uf.md)) |
| Tamanho completo | **0,20 GB** (14 arquivos, de 6,9 a 24,0 MB) |
| Tamanho incremental | O mesmo da carga completa (tudo é regravado). Baixar tudo de novo é barato |
| Estabilidade | Nome e formato (DBC) iguais desde a criação. A pasta `Doc/` e o dicionário são de 12/2022 |

### SISCAN

Listagem de `ftp://ftp.datasus.gov.br/dissemin/publicos/SISCAN/SISCAN/` em 2026-11-02.

| Item | Situação |
|---|---|
| Arquivos | CSV sem compressão, separador `;`, por tipo e ano: `SISCAN_MAMOGRAFIA_<ano>.csv`, `SISCAN_CITO_COLO_<ano>.csv` e outros (histopatológico, citologia de mama, variantes `_PACNT`), 2013–2025. 130 arquivos |
| Frequência | **Anual.** Os 130 arquivos foram gravados entre **09/01/2026 e 26/01/2026**, ou seja, **todos os anos foram regravados juntos** em janeiro. Não há arquivo de 2026 |
| Atraso | O ano X aparece em **janeiro de X+1**, já com o ano todo. Não há versão preliminar no FTP |
| Tamanho completo | Pasta inteira: **53,4 GB**. Só o que o MVP usa (mamografia e citopatológico 2016–2025): **24,4 GB**. O maior arquivo é `SISCAN_CITO_COLO_2023.csv` (2,06 GB) |
| Tamanho incremental | Se a regravação anual de todos os anos se repetir, **a atualização é a carga completa** (24,4 GB uma vez por ano). Comparar tamanho e data de cada arquivo para pular os que não mudaram |
| Estabilidade | Mesma pasta e mesmo padrão de nome. As pastas legadas (`SISCOLO4`, `SISMAMA`) seguem ao lado. Há também `TAB_SISCAN.rar` de 07/2022 |

**Incerteza:** vimos só uma "foto" do FTP. Não dá para saber se a regravação de todos os anos em janeiro é rotina ou se aconteceu só nesta edição. Também não sabemos se o ano X recebe correções depois de janeiro de X+1.

### SIM (mortalidade)

Listagens de `ftp://ftp.datasus.gov.br/dissemin/publicos/SIM/CID10/DORES/` e `.../SIM/PRELIM/DORES/` em 2026-11-02.

| Item | Situação |
|---|---|
| Arquivos finais | `DO<UF><ano>.dbc` por UF e **também `DOBR<ano>.dbc` nacional**, 1996–2024. O arquivo nacional dispensa baixar 27 UFs |
| Arquivos preliminares | `SIM/PRELIM/DORES/DO<UF><ano>.dbc`, por UF, **2025 e 2026** (sem arquivo nacional) |
| Frequência | Final: **anual**. Preliminar: atualizado ao longo do ano (2025 gravado em 28–30/08/2026; 2026 em 28/09/2026). Pelas datas, parece mensal ou quase, mas vimos uma só foto |
| Atraso até o final | O ano X fica final em **dezembro de X+1**: 2022 em 21/12/2023, 2023 em 19/12/2024, 2024 em 23/12/2025. Antes disso era mais lento (2019 em 04/2021, 2020 em 03/2022, 2021 em 04/2023). Então **2025 deve ficar final por volta de dezembro de 2026** |
| Revisões de anos antigos | Acontecem às vezes: 2009 e 2010 foram regravados em 25/02/2025; os `DOBR` de 1996–2018 em 24/01/2025; o `DOBR2023` em 21/01/2025 (um mês depois do lançamento) |
| Tamanho completo | Nacional 2014–2024: **1,40 GB** (~130 MB por ano). Nacional 1996–2024: 2,39 GB. Preliminares (2 anos, por UF): 0,40 GB |
| Tamanho incremental | Um ano novo por ano (~130–150 MB) mais os preliminares (~0,4 GB), além de algum ano antigo regravado de vez em quando |
| Estabilidade | Estrutura de pastas e nomes estável há mais de 10 anos (as datas de 31/01/2020 mostram uma migração em massa naquela data). Alguns arquivos têm extensão em maiúscula (`.DBC`): o baixador deve ignorar maiúsculas e minúsculas |

### CNES (habilitações e estabelecimentos)

Listagens de `ftp://ftp.datasus.gov.br/dissemin/publicos/CNES/200508_/Dados/HB/` e `.../ST/` em 2026-11-02.

| Item | Situação |
|---|---|
| Arquivos | `HB<UF><aamm>.dbc` (habilitações) e `ST<UF><aamm>.dbc` (estabelecimentos), por UF e competência mensal, desde 2005 |
| Frequência | **Mensal.** A competência M sai por volta do **dia 15 de M+1**: `HBSP2606` em 15/07/2026, `2607` em 17/08, `2608` em 15/09, `2609` em 15/10/2026 |
| Atraso | ~2 semanas depois do fim do mês. A última competência em 2026-11-02 é **09/2026** |
| Tamanho completo | Pastas inteiras: HB 0,15 GB e ST 3,38 GB. Mas o MVP só precisa da **competência mais recente** ("situação atual") |
| Tamanho incremental | Uma competência: HB **~1,1 MB** + ST **~23 MB** (27 UFs) |
| Estabilidade | Mesma pasta (`200508_`) desde 2005 |

### POPSVS (denominador)

Detalhes em [research/13](13-denominador-populacional.md). Resumo do calendário:

| Item | Situação |
|---|---|
| Frequência | **Anual**, depois da estimativa municipal do IBGE publicada no DOU em agosto. `POPSBR25.zip` foi gravado em **29/10/2025**. Os arquivos de 2000–2024 foram regravados juntos em 07/01/2025 (revisão pós-Censo) |
| Atraso | O ano X aparece por volta de **outubro/novembro de X**. Em 2026-11-02 o de 2026 **ainda não saiu** |
| Tamanho | ~3,4 MB por ano; série inteira **0,09 GB**. Incremental: 1 arquivo de ~5 MB por ano |
| Estabilidade | Endereço estável, mas o arquivo de 2025 trouxe **nomes de coluna em minúsculas** (ver research/13) |

## 2. SI-PNI novo (vacinação, Portal de Dados Abertos do SUS)

Fonte: página do dataset https://dadosabertos.saude.gov.br/dataset/doses-aplicadas-pelo-programa-de-nacional-de-imunizacoes-pni-2026 (metadados embutidos na página) e `HEAD` de cada arquivo `https://s3.sa-east-1.amazonaws.com/ckan.saude.gov.br/PNI/csv/vacinacao_<mes>_<ano>_csv.zip`.

| Item | Situação |
|---|---|
| Arquivos | Um ZIP por **mês** e ano, com um único CSV (`;`) de microdados, uma linha por dose, de todas as vacinas. Há também uma versão JSON (`.../PNI/json/vacinacao_<mes>_<ano>_json.zip`) |
| Frequência | **Mensal.** O dataset 2026 foi criado em 05/01/2026 e modificado em **01/11/2026**. Nessa data, **os 9 meses de 2026 (jan a set) foram regravados juntos** (Last-Modified 01/11/2026 em todos) |
| Atraso | ~1 mês: em 2026-11-02 existe até **setembro/2026**; outubro ainda não (o endereço responde 403) |
| Revisão de anos anteriores | Os anos 2020–2025 foram **todos regravados em agosto de 2026** (entre 07/08 e 30/08/2026). Não sabemos se isso é rotina anual ou um evento único. Os CSVs trazem a coluna `dt_deletado_rnds`, o que indica que registros antigos podem ser apagados depois |
| Tamanho completo (zipado) | 2020: 15,0 GB · 2021: 58,6 GB · 2022: 39,8 GB · 2023: 25,5 GB · 2024: 26,1 GB · 2025: 27,3 GB · 2026 (jan–set): 23,1 GB. **Total ~215 GB.** Cada mês tem de 1,2 a 4,9 GB |
| Tamanho descompactado | Medido no ZIP de set/2026: 1,83 GB zipado → **7,18 GB** de CSV (razão ~3,9). Por extrapolação, o ano de 2026 até setembro passa de **90 GB** descompactado, e a série inteira passa de **800 GB** |
| Tamanho incremental | Como o ano corrente é regravado todo mês, **a atualização mensal é baixar o ano corrente inteiro de novo: ~23–28 GB zipados**. Quando um ano anterior for regravado, ele também precisa ser reprocessado (o baixador deve comparar `Last-Modified` e `Content-Length`) |
| Filtro na origem | **Não existe.** A API https://apidadosabertos.saude.gov.br/vacinacao/doses-aplicadas-pni-2026 só aceita `limit` e `offset` (conferido no `swagger.json`), sem filtro por vacina ou município. Não serve para pegar só o HPV |
| Leitura parcial | O S3 aceita `Range` (`Accept-Ranges: bytes`), mas o CSV dentro do ZIP é um só bloco comprimido: para achar as linhas `HPV4` é preciso descomprimir o arquivo todo |
| Estabilidade | O padrão de endereço no S3 é o mesmo desde 2020. O portal mudou: `opendatasus.saude.gov.br` redireciona para `dadosabertos.saude.gov.br`, que agora é um site Next.js, e o endpoint CKAN `.../api/3/action/package_show` devolve 404. **Não dependa da API do portal**: monte as URLs do S3 pelo padrão `<mes>_<ano>`, com os meses abreviados em português (`jan`, `fev`, `mar`, `abr`, `mai`, `jun`, `jul`, `ago`, `set`, `out`, `nov`, `dez`) |

**Consequência para o pipeline.** O que o MVP guarda do SI-PNI é pequeno (doses de HPV por município, sexo, idade e mês). O caminho é: baixar um ZIP por vez (≤ 5 GB, cabe no disco), descomprimir em fluxo (`unzip -p` ou leitor de ZIP em Python), filtrar `sg_imunobiologico` de HPV e agregar com DuckDB, salvar o agregado em Parquet e apagar o ZIP. O agregado por ano é o "estado" que evita reprocessar anos que não mudaram.

**Estimativa de tempo (não medida no CI):** baixar ~25 GB do S3 em São Paulo e descomprimir ~100 GB de CSV deve levar de **30 minutos a 2 horas** por ano num runner de 4 CPUs. O reprocessamento de toda a série (2020–2026) não cabe com folga num job de 6 h, mas cabe em **um job por ano** rodando em paralelo. Medir na primeira execução.

## 3. Fontes fora do DATASUS

### Vigitel

Fonte: https://svs.aids.gov.br/daent/cgdnt/vigitel/ e cabeçalhos HTTP dos arquivos.

| Item | Situação |
|---|---|
| Arquivo | Base unificada `vigitel-2006-2024-peso-rake-csv.zip` (**83,1 MB**, 87.121.523 bytes), com dicionário XLSX e nota metodológica. Há também versão Stata (160,3 MB) e arquivos antigos por ano (2006–2021, 2023) |
| Frequência | **Anual.** A base 2006–2024 foi publicada em **24/08/2026**; o relatório "Vigitel Brasil 2006-2024" em **30/12/2025** |
| Atraso | A coleta do ano X sai como relatório no fim de X+1 e como microdado ~20 meses depois (2024 → agosto de 2026). O Vigitel 2025 (com interior) ainda não saiu |
| Incremental | A base é unificada: cada edição **substitui** o arquivo e muda o nome (`2006-2024` → provavelmente `2006-2025`). Download completo e incremental são iguais (~85 MB) |
| Estabilidade | **Baixa para automação:** o nome do arquivo muda a cada edição, e a página mudou de layout ("Documentação antiga (até 2023) - Memória"). Não há arquivo anual de 2022. O baixador deve achar o link na página por padrão de nome (`vigitel-2006-*-peso-rake-csv.zip`) e falhar de forma visível se não achar |

### Estimativa INCA

Fonte: https://www.gov.br/inca/pt-br/assuntos/cancer/numeros/estimativa (modificada em 05/02/2026) e subpáginas (`.../estimativa/estado-capital`, `.../por-neoplasia-taxas-brutas`, `.../por-neoplasia-taxas-ajustadas`). PDF no repositório Ninho (https://ninho.inca.gov.br/jspui/handle/123456789/18038).

| Item | Situação |
|---|---|
| Frequência | **A cada 3 anos.** Edição atual: triênio **2026–2028**, lançada em 04/02/2026 ([ticket 01](01-dados-disponiveis-por-eixo.md)). A próxima deve sair por volta do início de 2029 (inferência pelo triênio) |
| Formato | Tabelas em HTML nas páginas do gov.br e PDF. **Sem CSV oficial** |
| Tamanho | Desprezível (algumas páginas HTML) |
| Estabilidade | **Baixa:** a página é reescrita a cada edição, e a metodologia mudou nesta edição (correção de sub-registro, segundo a própria página). Não vale automatizar: **extrair uma vez por edição, à mão ou com script avulso, e commitar a tabela** |

### Malha municipal IBGE

Fonte: https://geoftp.ibge.gov.br/organizacao_do_territorio/malhas_territoriais/malhas_municipais/ (listagem).

| Item | Situação |
|---|---|
| Arquivo | `municipio_2025/Brasil/BR_Municipios_2025.zip`, **237 MB** (Last-Modified 26/02/2026) |
| Frequência | **Anual.** Datas das pastas: 2020 em 01/03/2021, 2021 em 09/03/2022, 2022 em 28/03/2023, 2024 em 29/04/2025, 2025 em 26/03/2026. A de 2023 tem data de 15/12/2024 (provavelmente regravada depois) |
| Atraso | A malha do ano X sai entre **fevereiro e abril de X+1** |
| Estabilidade | Padrão de endereço estável (`municipio_<ano>/Brasil/BR_Municipios_<ano>.zip`). A decisão do ticket 07 é fixar a malha 2025: atualizar só quando surgir município novo, de forma manual |

## 4. Quadro-resumo

| Fonte | Frequência | Ano X aparece | Ano X "fecha" | Carga completa usada no MVP | Atualização típica | Formato/endereço |
|---|---|---|---|---|---|---|
| Painel-Oncologia | Mensal | Durante X (parcial) | Sem data; tratar 2 últimos anos como provisórios | 0,2 GB | 0,2 GB (tudo regravado) | Estável |
| SISCAN | Anual | Jan de X+1 | Jan de X+1 (incerto se há correção depois) | 24,4 GB (CSV sem compressão) | 24,4 GB por ano (tudo regravado) | Estável |
| SI-PNI novo | Mensal | ~1 mês depois de cada mês | Incerto: anos antigos regravados em ago/2026 | ~215 GB zip (~800 GB CSV) | ~23–28 GB zip por mês (ano corrente inteiro) | Endereço S3 estável; portal instável |
| Vigitel | Anual | ~20 meses depois (microdado) | Idem | 83 MB | 83 MB por ano | Nome muda a cada edição |
| SIM | Preliminar mensal; final anual | Preliminar durante X | Dez de X+1 | 1,4 GB (nacional 2014–2024) + 0,4 GB prelim. | ~0,5 GB por ano | Estável |
| Estimativa INCA | Trienal | — | — | Desprezível | Uma vez a cada 3 anos | Muda a cada edição (manual) |
| CNES | Mensal | ~dia 15 de M+1 | — | ~24 MB (última competência) | ~24 MB por mês | Estável |
| POPSVS | Anual | Out/nov de X | Revisões ocasionais da série | 0,09 GB | ~5 MB por ano | Estável (colunas mudaram em 2025) |
| Malha IBGE | Anual | Fev–abr de X+1 | — | 237 MB | Manual, quando houver município novo | Estável |

**Leitura:** um ritmo **mensal** pega Painel-Oncologia, CNES, SIM preliminar e SI-PNI. As fontes anuais (SISCAN em janeiro, SIM final em dezembro, POPSVS em outubro/novembro, Vigitel em agosto) entram na mesma rodada mensal, porque o baixador incremental só baixa o que mudou. Os anos provisórios continuam marcados conforme o ticket 12.

## 5. Limites para rodar o pipeline num CI

### GitHub Actions (plano gratuito, repositório público)

| Limite | Valor | Fonte |
|---|---|---|
| Minutos | **Grátis e ilimitados** em runner padrão para repositório público | https://docs.github.com/en/billing/concepts/product-billing/github-actions e https://docs.github.com/en/actions/reference/runners/github-hosted-runners |
| Máquina | `ubuntu-latest`: **4 CPUs, 16 GB de RAM, 14 GB de SSD** (x64). O `ubuntu-slim` tem 1 CPU, 5 GB e 14 GB | https://docs.github.com/en/actions/reference/runners/github-hosted-runners |
| Tempo por job | **6 horas** (o job é encerrado e falha) | https://docs.github.com/en/actions/reference/limits |
| Tempo por workflow | 35 dias | idem |
| Jobs em paralelo | **20** no plano Free | idem |
| Cache | **10 GB por repositório**; entradas **sem acesso há mais de 7 dias são apagadas**. Aumentar o limite é pago | https://docs.github.com/en/actions/reference/workflows-and-actions/dependency-caching |
| Artefatos | 500 MB de armazenamento no plano Free (o GitHub não aumenta esse limite) | https://docs.github.com/en/actions/reference/limits |
| Release assets | Até 1.000 arquivos por release, **cada um com menos de 2 GiB**, sem limite de tamanho total nem de banda | https://docs.github.com/en/repositories/releasing-projects-on-github/about-releases |
| Agendamento (`schedule`) | Pode **atrasar** em horários de pico (como o início de cada hora) e jobs podem ser descartados; intervalo mínimo de 5 min; roda só no branch padrão; **em repositório público, é desativado depois de 60 dias sem atividade no repositório** | https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows |

**O que isso significa para o pipeline:**
- **Disco de 14 GB** é o limite real. Cabem o maior ZIP do SI-PNI (4,9 GB) e o maior CSV do SISCAN (2,1 GB), mas não um ano inteiro de nenhum dos dois. Processar **um arquivo por vez e apagar em seguida**.
- **O cache não guarda estado entre rodadas mensais**: ele apaga o que ficar 7 dias sem uso. O estado incremental (agregados em Parquet por fonte e ano, e o `manifest` com data e tamanho de cada arquivo de origem) deve ficar **commitado no repositório** ou como **asset de Release**, que não expira. Os agregados do SI-PNI e do SISCAN são pequenos (MB, não GB).
- **6 h por job:** separar o SI-PNI em **um job por ano** (matriz), e as fontes leves num job próprio.
- **Agendamento:** marcar o cron fora da hora cheia (por exemplo, minuto 17) e manter `workflow_dispatch` para rodar à mão. Como o próprio commit mensal dos dados conta como atividade, a desativação por 60 dias não deve acontecer enquanto o pipeline rodar (inferência; se uma rodada falhar por 2 meses, o cron para).
- Observação em repositórios de terceiros: workflows com cron às 09:00 UTC foram criados por volta das 15:00 UTC (`SidneyBissoli/healthbR` em 01/11/2026, `RenatoKR/SIASUS` em 02/11/2026). Isso combina com o aviso de atraso da documentação. Não conte com horário exato.

### Dá para baixar do FTP do DATASUS a partir do GitHub Actions?

**Sim, segundo o uso de terceiros (evidência indireta; não testamos num workflow próprio).**
- `RenatoKR/SIASUS`, workflow `sync-datasus.yml`, usa `lftp` em `ubuntu-latest` contra o FTP do DATASUS todo dia; as execuções de 28/10 a 02/11/2026 terminaram com sucesso: https://github.com/RenatoKR/SIASUS/actions/workflows/sync-datasus.yml
- `raphaelfh/omnisus`, workflow `probe.yml` ("Ground-truth probe against ftp.datasus.gov.br"), semanal, com sucesso de 06/10 a 02/11/2026 e uma falha em 05/10/2026: https://github.com/raphaelfh/omnisus/actions/workflows/probe.yml
- `SidneyBissoli/healthbR`, workflow `check-endpoints.yaml`, mensal, verifica pastas do SIM, SINASC e SIH: sucesso de 24/08 a 01/11/2026, **falhas em 01/07 e 01/08/2026** (causa não verificada): https://github.com/SidneyBissoli/healthbR/actions/workflows/check-endpoints.yaml

Leitura: o FTP é alcançável a partir dos IPs do GitHub, mas **falha de vez em quando**. O baixador precisa de novas tentativas com espera, e uma rodada que falhe não pode publicar nada (já previsto na etapa Validar do ticket 07). O S3 do SI-PNI e os sites do IBGE e do Vigitel são HTTPS comuns.

### Alternativas gratuitas

| Opção | Limites | Comentário |
|---|---|---|
| **GitLab CI** (GitLab.com, plano Free) | **400 minutos de computação por mês** por namespace; runner `saas-linux-small-amd64`: 2 CPUs, 8 GB de RAM, **30 GB de disco** (o `medium` tem 4 CPUs, 16 GB e 50 GB; não conferimos o fator de custo dele no plano Free) | Mais disco, mas 400 minutos por mês não cobrem a rodada do SI-PNI se ela levar horas. Fontes: https://docs.gitlab.com/ci/pipelines/compute_minutes/ e https://docs.gitlab.com/ci/runners/hosted_runners/linux/ |
| **Runner self-hosted** no GitHub Actions | Grátis (o GitHub não cobra), job de até 5 dias | Usa a máquina do mantenedor; resolve o disco, mas depende de ela estar ligada. Fonte: https://docs.github.com/en/actions/reference/limits |
| **Computador do mantenedor** | Sem limite de disco ou tempo | O ticket 07 já prevê o mesmo comando local. Bom para a carga inicial do SI-PNI (~215 GB), que pode ser feita uma vez e publicada como asset de Release |

**Recomendação que sai desta pesquisa (a decisão fica no ticket 21):** carga inicial completa (sobretudo SI-PNI 2020–2025 e SISCAN) feita **uma vez** localmente ou em jobs paralelos por ano; depois, **um workflow mensal no GitHub Actions** (por volta do dia 20, depois do CNES do dia 15) que baixa só o que mudou, reprocessa o SI-PNI do ano corrente em fluxo e reprocessa um ano anterior só quando o `Last-Modified` dele mudar. Tudo cabe no plano gratuito de repositório público.

## O que fica incerto

- Se a regravação de **todos os anos** do SISCAN (jan/2026) e do SI-PNI 2020–2025 (ago/2026) é rotina ou evento único. Só dá para saber acompanhando o `manifest` por alguns meses.
- O tempo real de download e descompressão do SI-PNI num runner do GitHub (estimado, não medido).
- A causa das falhas ocasionais nos workflows de terceiros que acessam o FTP.
- A data exata em que o SIM 2025 fica final (esperado em dezembro de 2026, pelo padrão de 2023–2025).
- O nome do arquivo da próxima base unificada do Vigitel.

## Fontes

- FTP DATASUS (listagens em 2026-11-02): `ftp://ftp.datasus.gov.br/dissemin/publicos/painel_oncologia/Dados/`, `.../SISCAN/SISCAN/`, `.../SIM/CID10/DORES/`, `.../SIM/PRELIM/DORES/`, `.../CNES/200508_/Dados/HB/`, `.../CNES/200508_/Dados/ST/`, `.../IBGE/POPSVS/`
- SI-PNI, dataset 2026: https://dadosabertos.saude.gov.br/dataset/doses-aplicadas-pelo-programa-de-nacional-de-imunizacoes-pni-2026
- SI-PNI, arquivos: `https://s3.sa-east-1.amazonaws.com/ckan.saude.gov.br/PNI/csv/vacinacao_<mes>_<ano>_csv.zip` (cabeçalhos `HEAD` de 2020 a 2026; diretório central de `vacinacao_set_2026_csv.zip` lido por `Range`)
- API de Dados Abertos do SUS: https://apidadosabertos.saude.gov.br/v1/ (especificação em https://apidadosabertos.saude.gov.br/static/swagger.json)
- Vigitel: https://svs.aids.gov.br/daent/cgdnt/vigitel/
- Estimativa INCA: https://www.gov.br/inca/pt-br/assuntos/cancer/numeros/estimativa
- Malha IBGE: https://geoftp.ibge.gov.br/organizacao_do_territorio/malhas_territoriais/malhas_municipais/
- GitHub Actions: https://docs.github.com/en/actions/reference/limits; https://docs.github.com/en/actions/reference/runners/github-hosted-runners; https://docs.github.com/en/actions/reference/workflows-and-actions/dependency-caching; https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows; https://docs.github.com/en/billing/concepts/product-billing/github-actions; https://docs.github.com/en/repositories/releasing-projects-on-github/about-releases
- GitLab CI: https://docs.gitlab.com/ci/pipelines/compute_minutes/; https://docs.gitlab.com/ci/runners/hosted_runners/linux/
- Workflows de terceiros que acessam o FTP do DATASUS (evidência indireta): https://github.com/RenatoKR/SIASUS/actions/workflows/sync-datasus.yml; https://github.com/raphaelfh/omnisus/actions/workflows/probe.yml; https://github.com/SidneyBissoli/healthbR/actions/workflows/check-endpoints.yaml
- Pesquisas anteriores do projeto: [research/01](01-dados-disponiveis-por-eixo.md), [research/03](03-hospedagem-e-mapa-estatico.md), [research/09](09-medir-completude-por-uf.md), [research/13](13-denominador-populacional.md)
