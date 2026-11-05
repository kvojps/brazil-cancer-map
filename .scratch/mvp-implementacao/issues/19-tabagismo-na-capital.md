# 19: Tabagismo na capital (Vigitel)

**What to build:** a ficha ganha a % de fumantes adultos "na capital do seu estado", no eixo Prevenção, para pulmão e Todos. O indicador não pinta o mapa. Referência: spec, seções 4, 5, 7 e 9.

**Blocked by:** 10 — Ficha do Meu município com o cartão do 60 dias

**Status:** resolved

- [x] O pipeline extrai do microdado do Vigitel a prevalência e o IC por capital e ano; a localização do arquivo, cujo nome muda, fica configurável
- [x] Tendência por regressão ponderada de `log(prevalência)` contra o ano, com peso 1/EP² e EP do log = EP/prevalência tirado do IC
- [x] Referência 5,9% ("meta do Brasil para 2030"), com a regra invertida: alcançou ≤ 5,9%, perto ≤ 7,4%
- [x] O cartão aparece na ficha de todos os municípios da UF, com o rótulo "na capital do seu estado" e a Ação aprovada do tabagismo
- [x] A metodologia ganha a seção do tabagismo, com o exemplo de 9% para 8% como queda de 11%


## Comments

### Carga manual dos dados — 04/11/2026

Preparado o script executável [download-vigitel.sh](../../../download-vigitel.sh), seguindo o procedimento de carga manual do ticket 18, para executar no terminal sem manter uma sessão do agente acompanhando:

```sh
cd ~/Documentos/dev/brazil-cancer-map
./download-vigitel.sh
```

- Requer Bash, Python 3.11+, curl, flock e tee. Descobre na [página oficial](https://svs.aids.gov.br/daent/cgdnt/vigitel/) a edição mais recente da base unificada CSV e exige dicionário XLSX e nota metodológica PDF da mesma edição. Falha explicitamente se não encontrar os links esperados. A página consultada nesta sessão oferece a série **2006–2024**.
- Permite configurar `VIGITEL_PAGE_URL`, `VIGITEL_CSV_URL`, `VIGITEL_DICTIONARY_URL` e `VIGITEL_NOTE_URL`. As URLs dos arquivos devem ser HTTPS; as substituições explícitas exigem que o operador confira a compatibilidade da edição.
- Mostra progresso do curl no terminal e acrescenta a saída em `data/logs/vigitel-download.log`. Usa lock para impedir duas instâncias simultâneas do script.
- Guarda os arquivos em `data/raw/vigitel/microdata.zip`, `dictionary.xlsx` e `methodology.pdf`, sem descompactar o CSV. Verifica a integridade dos ZIP/XLSX e a presença de CSV no ZIP; verifica a assinatura PDF. Só renomeia cada `.part` após a verificação.
- Ao concluir os três downloads, grava `data/raw/vigitel/download.json` com URLs, data UTC, tamanhos e SHA-256; `urls.txt` e `index.html` preservam a descoberta. Dados e logs já são ignorados pelo git.
- Pode ser interrompido e executado novamente, mas **baixa os arquivos desde o início**, inclusive os completos; não oferece cache nem retomada por byte. A falha de qualquer arquivo encerra o script. Um `download.json` antigo não comprova uma tentativa nova: conferir data e hashes.
- Não chama o pipeline: a fonte Vigitel ainda não existe no registro. Não calcula prevalências, IC ou Tendência e não publica JSON. O download prepara apenas os insumos para implementar este ticket; os critérios continuam abertos e o ticket não está resolvido.

**Verificação nesta sessão:** `bash -n download-vigitel.sh` passou. A descoberta real dos três links funcionou e o download do CSV começou. A transferência estava muito lenta e foi interrompida deliberadamente para deixar a carga no terminal do usuário, conforme o procedimento do HPV. **A carga não foi concluída nem a integridade dos arquivos reais validada.** Pode restar `microdata.zip.part`; a execução seguinte o sobrescreve. Não foi criada fonte de dados, executado cálculo nem alterada a publicação.

**Próxima sessão:** conferir o log, a existência dos três arquivos finais e o manifesto com seus hashes; completar a carga se necessário. Inspecionar o dicionário e a nota para identificar tabagismo, capital, ano, pesos e desenho amostral antes de implementar a prevalência e o IC. Não tratar a disponibilidade do ZIP como cumprimento do primeiro critério. Prosseguir com os cálculos e a ficha conforme a spec, mantendo o rótulo “na capital do seu estado”.


### Implementação e validação — 05/11/2026

Implementado o indicador `smoking` com a fonte `VigitelSource`, registrada no CLI. O ZIP/CSV harmonizado é configurável por `VIGITEL_INPUT_PATH`; o download manual mantém `VIGITEL_CSV_URL`. Os hashes dos três insumos conferiram com o manifesto local. A extração preserva o SHA-256 do microdado e lê `fumante`, `pesorake2025`, capital, ano e idade, em fluxo, para Parquet.

O cálculo usa média ponderada e IC 95% por linearização de Taylor do desenho documentado pelo Ministério da Saúde (`svyset [pweight=pesorake2025]`), com domínios capital × ano. A Tendência usa log da prevalência e pesos pelo inverso da variância do log, nos últimos dez anos de calendário, sem preencher 2022. A Situação usa os cortes explícitos 5,9% e 7,4%, com menor sendo melhor. A validação bloqueia a exportação se o total ponderado das capitais em 2019, 2020, 2021, 2023 e 2024 divergir mais de 3% dos valores publicados na Figura 31, página 100 do relatório oficial. Essa comparação não valida cada capital separadamente; a metodologia documenta essa limitação e a revisão dos pesos de Fortaleza/Florianópolis de agosto de 2026.

A carga real concluiu as cinco etapas: foram publicadas as 27 capitais, com 18 anos observados entre 2006 e 2024, nos perfis das UFs e no manifesto, sem camada de mapa. Os indicadores anteriores foram preservados. A ficha de qualquer município da UF mostra a capital em Todos/Pulmão, com Situação, Tendência, gráfico, tabela com IC, origem, extração, Ação aprovada e link para a metodologia.

Validação: 159 testes Python; 42 testes do site, incluindo geração estática; 40 testes de navegador contra o build estático, com temas, JavaScript ligado/desligado e zoom de 200%; `uv run mypy` e `npm run check --prefix site`, sem erros. Os avisos de separação perfeita do statsmodels pertencem aos testes preexistentes. Revisão em dois agentes: padrões sem achados; os achados de spec (validação oficial e publicação dos JSON) foram tratados.

Commits: `06162ee` (fonte, cálculo, ficha, metodologia e testes), `5b20adf` (validação contra referência oficial e bloqueio de divergência). Os 27 perfis, o manifesto, o ajuste da numeração da metodologia e este encerramento entram juntos no commit `feat: publish Vigitel capital data and resolve ticket 19`.
