# 19: Tabagismo na capital (Vigitel)

**What to build:** a ficha ganha a % de fumantes adultos "na capital do seu estado", no eixo Prevenção, para pulmão e Todos. O indicador não pinta o mapa. Referência: spec, seções 4, 5, 7 e 9.

**Blocked by:** 10 — Ficha do Meu município com o cartão do 60 dias

**Status:** ready-for-agent

- [ ] O pipeline extrai do microdado do Vigitel a prevalência e o IC por capital e ano; a localização do arquivo, cujo nome muda, fica configurável
- [ ] Tendência por regressão ponderada de `log(prevalência)` contra o ano, com peso 1/EP² e EP do log = EP/prevalência tirado do IC
- [ ] Referência 5,9% ("meta do Brasil para 2030"), com a regra invertida: alcançou ≤ 5,9%, perto ≤ 7,4%
- [ ] O cartão aparece na ficha de todos os municípios da UF, com o rótulo "na capital do seu estado" e a Ação aprovada do tabagismo
- [ ] A metodologia ganha a seção do tabagismo, com o exemplo de 9% para 8% como queda de 11%


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
