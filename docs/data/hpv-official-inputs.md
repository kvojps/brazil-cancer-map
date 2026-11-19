# HPV: insumos oficiais da coorte e da auditoria

> Leitura curta. A [versão completa](https://github.com/kvojps/brazil-cancer-map/blob/11fd03c47e1ce09b9a2ccb873ccc75da1ccb304f/docs/data/hpv-official-inputs.md), com os campos do formulário do TabNet, a inspeção do FTP e a leitura do dicionário da RNDS, está no commit `11fd03c`.

O indicador publicado usa as **coortes agregadas oficiais** do Ministério ([ADR 4](../adr/0004-hpv-from-official-aggregates.md)). Este registro traz o que é preciso para repetir a **auditoria** com microdados, que é opcional e local. Limiares e endereços em uso estão em [`data-sources.md`](../data-sources.md#hpv).

**Data:** verificação dos insumos em 04/11/2026, com consulta HTTP real ao TabNet e amostra DBF do FTP; carga da auditoria e extração dos agregados oficiais em 05/11/2026. Os endereços não foram reconferidos desde então.

## Resultado

- **A coorte segue a [NT 16/2025-DPNI](https://infoms.saude.gov.br/content/Default/SEI_0045605478_Nota_Tecnica_16.pdf), §§4.1.1–4.1.5:** D1 consolidada de 2014–2019 somada a ao menos uma dose por pessoa na RNDS desde 2020, sobre o Censo 2022 fixo por município, sexo e idade. A diagonal é `ano_aplicacao - idade`, e não pode ser trocada por doses anuais divididas pela população. Para publicar 9–14 anos em 2020, o histórico começa em **2015**.
- **2015–2019 vêm do [TabNet atual](http://tabnet.datasus.gov.br/cgi/dhdat.exe?bd_pni/dpnibr.def)**, por POST HTTP direto. O FTP do PNI está congelado em 23/05/2019 e não fecha 2019 sozinho. A amostra de Brasileia/AC, feminino, D1, 2019, deu **48, 5, 1, 4, 2 e 2** para 9 a 14 anos (total 62).
- **Desde 2020 vêm os microdados RNDS mensais**, com os códigos **67 (quadrivalente) e 93 (nonavalente)**. Os códigos históricos do TabNet são outros: 93 feminino e 94 masculino.
- **A auditoria não reproduz os numeradores oficiais.** A carga de janeiro de 2020 a setembro de 2026, com 81 extratos, divergiu do painel oficial nos numeradores, com denominadores censitários idênticos. O dicionário não documenta o hash de `co_paciente` nem a qualificação interna da NT, e a deduplicação não foi ajustada para bater com amostras. Por isso o indicador usa os agregados oficiais.

**Referências oficiais da publicação** (`pipeline/references/hpv.json`, extração de 05/11/2026, tabela `KeWXGFP`, ano 2025):

| Município | Recorte | Numerador | Denominador | Cobertura |
|---|---|---:|---:|---:|
| Recife (261160) | Total | 96.082 | 108.423 | 88,6% |
| Recife (261160) | Meninas | 50.148 | 52.868 | 94,9% |
| Recife (261160) | Meninos | 45.934 | 55.555 | 82,7% |
| Brasileia (120010) | Total | 1.865 | 2.750 | 67,8% |
| Brasileia (120010) | Meninas | 982 | 1.314 | 74,7% |
| Brasileia (120010) | Meninos | 883 | 1.436 | 61,5% |
| Jundiaí (352590) | Total | 25.993 | 30.777 | 84,5% |
| Jundiaí (352590) | Meninas | 14.011 | 15.118 | 92,7% |
| Jundiaí (352590) | Meninos | 11.982 | 15.659 | 76,5% |

## Campos

- **TabNet 2015–2019:** POST Latin-1 a `webtabx.exe?bd_pni/dpnibr.def`, com linha Município, coluna Faixa_Etária, incremento Doses_aplicadas, imunobiológico HPV Quadrivalente Feminino ou Masculino, 1ª dose e idades 9–14. Os valores exatos do formulário são lidos da página atual por `pipeline/sources/hpv/historical_inputs.py`.
- **FTP `DPNI<UF><aa>.dbf`:** `ANO`, `ANOMES`, `MUNIC` (6 dígitos), `FX_ETARIA`, `IMUNO`, `DOSE` e `QT_DOSE`; o sexo vem embutido no imunobiológico.
- **RNDS:** o [dicionário oficial](https://s3.sa-east-1.amazonaws.com/ckan.saude.gov.br/dbbni/Dicionario_tb_ria_rotina.pdf) define `co_paciente` (paciente), `co_documento`, `co_municipio_paciente` (residência), `nu_idade_paciente`, `co_troca_documento`, `st_documento` e `st_vida_paciente`. Os cabeçalhos reais dos arquivos usam outros nomes: confira-os por versão antes de fixar um mapeamento.

## Como repetir a auditoria

1. Extrair do TabNet a D1 de 2015–2019 por município × sexo × idade e conferir a amostra de Brasileia. O formulário é lido e enviado por `pipeline/sources/hpv/historical_inputs.py`.
2. Manter a RNDS longitudinal por paciente com os códigos 67 e 93 e idade de 9 a 14 anos, tratando registros substituídos ou excluídos conforme o esquema real dos arquivos.
3. Compor as diagonais até cada ano de avaliação e dividir pelo Censo 2022, sem somar totais anuais.
4. Comparar com o painel oficial. Divergências podem ser levadas ao DPNI (`pni@saude.gov.br`), sem afirmar equivalência sem evidência.

Os comandos estão no [guia do mantenedor](../data-update.md#auditoria-hpv-opcional). A auditoria nunca substitui os numeradores oficiais.
