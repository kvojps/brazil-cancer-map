# Com que frequência cada fonte do MVP publica dados novos?

Type: research
Status: resolved
Assignee: Kvojps (claude session 2026-11-02)
Blocked by:

## Question

Para decidir quando e onde o pipeline roda ([Qual stack e pipeline de dados usar?](07-stack-e-pipeline.md)), levantar para cada fonte do MVP (Painel-Oncologia, SISCAN, SI-PNI novo, Vigitel, SIM, Estimativa INCA, CNES, POPSVS, malha IBGE):
- a frequência de atualização e o atraso típico (quando o ano X fica preliminar e quando fica consolidado);
- o tamanho do download completo e o de uma atualização incremental (em especial o SI-PNI, que tem dezenas de GB);
- se a fonte muda de formato ou de endereço com frequência.

Levantar também os limites gratuitos para rodar o pipeline num CI: GitHub Actions (disco, tempo por job, cache de 10 GB, artefatos) e alternativas gratuitas, e se dá para baixar do FTP do DATASUS a partir deles.

## Answer

Pesquisa concluída em 2026-11-02. Os detalhes e as fontes estão em [research/17-calendario-das-fontes.md](../research/17-calendario-das-fontes.md).

- **Ritmo das fontes:**
  - **Mensais:** Painel-Oncologia (regrava todos os anos de uma vez, 0,2 GB), CNES (competência M sai por volta do dia 15 de M+1, ~24 MB) e SI-PNI (~1 mês de atraso).
  - **SIM:** preliminar atualizado ao longo do ano; o ano X fica final em **dezembro de X+1** (2024 saiu em 23/12/2025). Há arquivo nacional `DOBR<ano>.dbc` (~130 MB por ano).
  - **Anuais:** SISCAN (todos os anos regravados em janeiro de X+1), POPSVS (out/nov do próprio ano), Vigitel (microdado ~20 meses depois da coleta) e malha IBGE (fev–abr de X+1).
  - **Trienal:** Estimativa INCA (próxima por volta de 2029).
- **Tamanhos:** tudo somado, menos de 3 GB, exceto dois casos:
  - **SISCAN:** 24,4 GB de CSV sem compressão (mamografia + citopatológico 2016–2025), baixados de novo uma vez por ano.
  - **SI-PNI:** ~215 GB zipados (2020 a set/2026), cerca de 4× isso descompactado. **O ano corrente inteiro é regravado todo mês**, então a atualização mensal é ~23–28 GB. Os anos 2020–2025 foram regravados em ago/2026. A API do portal não filtra por vacina, então é preciso descomprimir tudo e filtrar o HPV.
- **Estabilidade:** os endereços do FTP do DATASUS e do S3 do SI-PNI são estáveis. Mudam o portal do SI-PNI (a API CKAN não responde mais), o nome do arquivo do Vigitel a cada edição e a página da Estimativa INCA a cada edição (extrair à mão).
- **GitHub Actions grátis dá conta** (repositório público): minutos ilimitados, 4 CPUs, 16 GB de RAM, **14 GB de disco**, **6 h por job** e 20 jobs em paralelo. O cache de 10 GB apaga o que fica 7 dias sem uso, então o estado incremental (agregados e `manifest`) vai para o git ou para um asset de Release (até 2 GiB por arquivo). O `schedule` atrasa e é desativado depois de 60 dias sem atividade.
- **FTP do DATASUS a partir do CI:** workflows de terceiros acessam com sucesso, mas com falhas ocasionais, então o baixador precisa de novas tentativas. SI-PNI e SISCAN: um arquivo por vez, em fluxo, apagando o bruto; SI-PNI com um job por ano. Alternativas: GitLab CI (400 min/mês, 30 GB de disco), runner self-hosted ou a máquina do mantenedor para a carga inicial.
