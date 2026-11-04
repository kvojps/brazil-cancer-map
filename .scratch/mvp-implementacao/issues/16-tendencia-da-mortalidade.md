# 16: Tendência da mortalidade (SIM)

**What to build:** o eixo Panorama ganha a Tendência da mortalidade padronizada por idade, para Todos e os 5 tipos. Ela pinta o mapa só em modo Tendência e não tem Situação. Referência: spec, seções 4, 5, 6.2, 7, 10 e 11.

**Blocked by:** 10 — Ficha do Meu município com o cartão do 60 dias; 13 — Denominador POPSVS no pipeline

**Status:** resolved

- [x] O pipeline baixa os `DOBR<ano>.dbc` de 2014–2024 (sem os preliminares) e usa residência e causa básica
- [x] "Todos" é C00–C97 sem C44; mama C50 (mulheres), colo C53, próstata C61, pulmão C33–C34, colorretal C18–C21 (o ajuste do C55 vem no ticket 17)
- [x] Padronização direta pela população mundial de Segi/Doll, faixas quinquenais de 0–4 a 75–79 e 80+
- [x] Tendência por quasi-Poisson com offset; mínimo e cascata contam os óbitos
- [x] O indicador pinta o mapa só em modo Tendência; o seletor não oferece "como está hoje" para ele
- [x] O cartão não tem Situação, mostra a Tendência do Brasil como contexto e as metas de mama (−10%) e colo (−20%, 30–69) só como texto; a Ação aprovada da mortalidade remete aos caminhos de prevenção e cuidado do tipo
- [x] A validação compara contagens exatas e taxas (±3%) com o Atlas do INCA, considerando o POPSVS revisto; se falhar, o SIM não é publicado
- [x] A metodologia ganha a seção da mortalidade, com os pesos e a fórmula, e as limitações C26, R00–R99 e C76–C80

## Comments

### Sessão de implementação — 2026-11-03 (continuação pendente)

O código do ticket está implementado e revisado. **O ticket permanece `ready-for-agent`: falta concluir a carga de 2024, calcular e validar a série completa e publicar os JSON.** A pedido do usuário, esta sessão encerra a carga em 2023. Nenhum JSON do SIM foi publicado; os dados anteriores do site estão preservados.

Implementado:

- `SimSource` registrado, com cache do download nacional, residência, causa básica, exclusão dos preliminares e óbitos fetais, recortes CID/sexo e decodificação da idade do SIM. Todos usa categorias CID exatas, C00–C97 sem C44; o C55 do colo continua no ticket 17.
- Padronização direta Segi/Doll com 80+, população POPSVS, agregação de óbitos e população antes da taxa regional, mínimo contado em óbitos reais e quasi-Poisson com offset. Janela da cascata, do modelo e do rótulo alinhadas, inclusive quando o último ano é provisório.
- Validação com contagens exatas e tolerância estrita de ±3% relativa à taxa oficial; divergência bloqueia o export e preserva a publicação anterior. Referências e proveniência em `pipeline/references/sim-atlas.json`.
- Mapa somente em Tendência para Todos e os cinco tipos; cartão sem Situação, contexto do Brasil, metas apenas em texto e Ação aprovada. Metodologia com fórmula, pesos, limitações e tabela da conferência real.
- Leitura projetada das seis colunas necessárias do DBF; testes exercitam o DBF real e substituem somente a descompressão externa.

Verificado:

- 136 testes Python passando; mypy sem erros. Última execução completa com fixtures DBF reais: 136 passando, 246 avisos de previsão perfeita em séries sintéticas (também presentes nos testes anteriores).
- 19 testes do site passaram antes da carga real; check do Astro sem erros, avisos ou hints. Foi acrescentado um teste de cartão com dados publicados, que deve ser executado após o primeiro export do SIM.
- POPSVS local ampliado de 2016–2025 para **2014–2025**, limpo e validado, sem reconstruir municípios anteriores à sua criação.
- Conferência real do C53 feminino em 2022, Brasil e quatro UFs: **todas as contagens exatas e taxas dentro de ±3%**. Brasil: 6.983 óbitos, 4,748142 contra 4,79 no Atlas; MG: 466, 2,938138 contra 2,97; RJ: 543, 4,211732 contra 4,22; PA: 417, 8,919279 contra 9,11; SP: 1.107, 3,272509 contra 3,25.
- Revisão independente Standards/Spec desde `13547e7`: nenhuma violação bloqueante. Corrigidos o desalinhamento da janela provisória e a tolerância contra o Atlas. Permanecem apenas sugestões opcionais de centralizar destinos geográficos e tipar as estruturas internas.

Estado dos arquivos locais (fora do git):

- DBC nacionais completos em `data/raw/sim/DOBR2014.dbc` até `DOBR2023.dbc`; 2024 fica para a próxima sessão. O FTP teve transferências intermitentes; 2023 foi concluído por uma tentativa separada com quatro conexões e timeout de 30 segundos.
- Parquet anuais em `data/clean/sim-annual-check/<ano>/deaths.parquet`, de 2014 a 2023. O de 2014 foi reaproveitado da primeira limpeza real; sua pasta pode não conter `extract.json`.
- Conferência real de 2022 em `data/clean/sim-annual-check/2022/validation.json` e `computed.json`. Esses cálculos cobrem somente 2022 e **não são a série completa para publicação**.
- Não apagar os Parquet anuais nem repetir a limpeza de todos os anos sem necessidade. Os scripts em `/tmp` foram operacionais desta sessão; a retomada persistente está em `scripts/resume-sim.py`.

Para continuar:

1. Executar na raiz: `uv run python .scratch/mvp-implementacao/scripts/resume-sim.py`. O script confere o cache remoto, baixa 2024, limpa somente os anos novos ou alterados, reúne os onze Parquet, executa `compute`, valida e exporta. A estatística continua integralmente em `SimSource.compute`. **Se a validação falhar, não publicar nem afrouxar as referências.**
2. Conferir período 2014–2024, Tendência 2015–2024, 5.570 municípios, os seis tipos, contexto nacional, cascata e ausência de Situação. Os novos JSON devem ficar em `site/public/dados/map/mortality/`, fichas por UF e manifesto, preservando os outros indicadores.
3. Executar `npm run test --prefix site` (inclui build e o teste do cartão com dados publicados) e `npm run check --prefix site`. Reexecutar testes Python se houver mudanças no pipeline; eles já passaram nesta sessão.
4. Revisar os dados gerados e a metodologia. A tabela de 2022 já registra a conferência real; o texto final da metodologia usa a presença de `manifest.sources.sim` para informar a primeira publicação.
5. Marcar o primeiro critério, trocar o status para `resolved` e registrar o commit final **no mesmo commit da publicação e da última mudança do ticket**. Até lá, não considerar a carga completa nem o ticket resolvido.

Commits desta implementação:

- `f2b0160` — `feat: add age-standardized SIM mortality trends`.
- `cd28bc2` — `fix: align mortality cascade with consolidated trend window`.
- `25516de` — `fix: enforce Atlas tolerance against official mortality rates`.
- `3ce05b0` — `fix: match exact mortality ICD categories`.
- `b465de0` — `test: exercise SIM through real DBF fixtures`.
- Commit deste registro de retomada — `docs: record SIM progress and remaining ticket 16 work`.


### Conclusão da carga e publicação — 2026-11-04

Retomada executada por `scripts/resume-sim.py`, sem repetir a limpeza de 2014–2023. O arquivo final `DOBR2024.dbc` foi baixado do FTP, conferido pelo cache remoto e limpo. Os onze Parquet foram reunidos; `SimSource.compute`, `validate` e `export` concluíram com sucesso. A amostra do Atlas manteve contagens exatas e taxas dentro de ±3%, sem alterar referências ou tolerância.

Publicado em `site/public/dados/`: seis mapas de mortalidade, fichas das 27 UFs e manifesto com extração em 2026-11-04. Séries 2014–2024; Tendência 2015–2024; nenhum ano preliminar, nenhuma Situação. Contexto nacional presente nos seis tipos. Auditoria confirmou igualdade entre mapa e ficha, cascata e preservação integral dos indicadores anteriores.

A cobertura é de **5.571 municípios**, conforme a correção da malha oficial registrada no ticket 02, incluindo Boa Esperança do Norte. Não foram reconstruídos dados municipais anteriores à criação; a cascata usa a Região imediata quando atende ao mínimo. A metodologia agora menciona a cobertura da malha publicada, sem repetir a contagem desatualizada da spec.

Verificações: 136 testes Python passaram (246 avisos de previsão perfeita em séries sintéticas); mypy sem erros; 20 testes do site passaram, incluindo build e cartão com dados reais publicados, sem skips. Astro check sem erros, avisos ou hints. O primeiro teste do site foi bloqueado pelo sandbox ao criar o subprocesso de build; a execução autorizada fora dele passou.

Revisão independente: Standards — nenhuma violação ou sugestão de refatoração acionável; Spec — nenhuma lacuna ou desvio de escopo. A divergência da contagem antiga de municípios foi resolvida pela decisão já registrada no ticket 02.

O ajuste C55 continua reservado ao ticket 17; esta publicação usa C53 sem redistribuição, conforme o escopo deste ticket.

Commit final desta publicação (o mesmo que encerra o ticket): `feat: publish validated SIM mortality series for 2014-2024`.
