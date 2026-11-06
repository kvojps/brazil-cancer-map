# HPV: insumos oficiais da coorte e da auditoria

O indicador publicado usa as **coortes agregadas oficiais** do Ministério ([ADR 4](../adr/0004-hpv-from-official-aggregates.md)). Este registro traz o que é preciso para repetir a **auditoria** com microdados, que é opcional e local: a NT 16/2025, a consulta ao TabNet e os limites do dicionário. Limiares e endereços em uso estão em [`data-sources.md`](../data-sources.md#hpv), e duração e disco em [`hpv-benchmark.md`](hpv-benchmark.md).

Verificação: **04/11/2026**. Fontes primárias, com consulta HTTP real ao TabNet e leitura de amostra DBF do FTP. Nenhum arquivo mensal grande foi baixado nessa etapa, e os endereços não foram reconferidos desde então.

## Resultado da verificação

**Há acesso público ao histórico consolidado completo de 2015–2019 pelo TabNet atual.** O FTP antigo está congelado em maio/2019 e não serve sozinho para fechar 2019. Para 2020 em diante existem microdados RNDS mensais. A coorte não pode ser substituída por doses anuais divididas pela população.

A [NT 16/2025-DPNI](https://infoms.saude.gov.br/content/Default/SEI_0045605478_Nota_Tecnica_16.pdf), §§4.1.1–4.1.5, manda combinar D1 consolidada de 2014–2019 com ao menos uma dose por indivíduo na RNDS desde 2020, HPV quadrivalente e nonavalente. Usa Censo 2022 fixo por município, sexo e idade. A diagonal oficial é `ano_aplicacao - idade`: para idade 14 em 2024 entram idade 9 em 2019 até idade 14 em 2024. Para publicar a faixa 9–14 em **2020**, o primeiro histórico necessário é **2015**, não apenas 2019. Em 2025 todas as seis idades já têm janela iniciada em 2020; 2014 só é necessário para anos de avaliação anteriores a 2020. A regra da diagonal vem do exemplo explícito da NT; não é preciso inventar data de nascimento ausente nos microdados.

## TabNet: caminho funcional e reproduzível

Página: [Imunizações — doses aplicadas — Brasil](http://tabnet.datasus.gov.br/cgi/dhdat.exe?bd_pni/dpnibr.def). O HTTP direto funcionou; o navegador de pesquisa reescreve o parâmetro e retorna erro, portanto esse erro não significa indisponibilidade da fonte. A página informa atualização em **maio de 2023**, bases 1994–2022.

Selecionar: linha Município; coluna Faixa_Etária; incremento Doses_aplicadas; um ano 2015–2019; imunobiológico HPV Quadrivalente — Feminino ou Masculino; dose 1ª dose; idades simples 9–14. A tabela oferece **Salva como CSV** e contém os valores no JavaScript `data.addRows`, mesmo sem executar navegador.

O formulário envia POST a `http://tabnet.datasus.gov.br/cgi/webtabx.exe?bd_pni/dpnibr.def`, com codificação de formulário **Latin-1**. Valores exatos conferidos no HTML atual:

| Campo | Valor |
|---|---|
| `Linha` | `Município\|CONCAT(CONCAT(DISSEMINACAO.TB_TBN_MUNICIPIO.CO_MUNICIPIO, ' '), DISSEMINACAO.TB_TBN_MUNICIPIO.NO_MUNICIPIO)  where FATO.CO_MUNICIPIO= DISSEMINACAO.TB_TBN_MUNICIPIO.CO_MUNICIPIO` |
| `Coluna` | `Faixa_Etária\|FATO.CO_FX_ETARIA\|1\|bd_pni\cnv\FXET.CNV` |
| `Incremento` | `Doses_aplicadas\|QT_DOSE` |
| `PAno` | `2019\|2019\|4` (trocar ano) |
| `nomedef` | `bd_pni/dpnibr.def` |
| `SImunobiológicos` | `HPV Quadrivalente - Feminino\|93\|2` ou `HPV Quadrivalente - Masculino\|94\|2` |
| `SDose` | `1ª dose\|01,32\|2` |
| `SMunicípio` | `TODAS_AS_CATEGORIAS__` (para todos os municípios) |
| `SFaixa_Etária` | repetir: `9 anos\|A5,C4,D6\|2`, `10 anos\|B3,C5,D7\|2`, `11 anos\|B4,C6,D8\|2`, `12 anos\|27,S2,R2\|2`, `13 anos\|B5,C7,D9\|2`, `14 anos\|B6,C8,E0\|2` |

Os demais seletores `S...` podem seguir o formulário com `TODAS_AS_CATEGORIAS__`. Os caracteres `\|` na tabela representam separadores literais `|` (o escape é apenas Markdown). Usar os valores extraídos do formulário evita depender de SQL de apresentação fixado no código.

**Consulta pequena executada:** Brasileia/AC (`SMunicípio=120010 BRASILEIA|120010|6`), feminino, D1, 2019: 9 anos **48**, 10 **5**, 11 **1**, 12 **4**, 13 **2**, 14 **2**, total **62**. Resposta identifica os filtros e a fonte SI-PNI. A extração nacional consulta dez tabelas (cinco anos × dois sexos) e foi executada depois desta verificação: os resultados estão em [`hpv-benchmark.md`](hpv-benchmark.md).

## FTP: útil para inspeção, inadequado como única base fechada

Listagens verificadas: `ftp://ftp.datasus.gov.br/dissemin/publicos/PNI/DADOS/` e `.../AUXILIARES/`. Arquivos `DPNI<UF><aa>.dbf`; a amostra `DPNIAC15.dbf` tem 7,4 MB e 34.162 linhas. Campos relevantes: `ANO`, `ANOMES`, `MUNIC` (6 dígitos), `FX_ETARIA`, `IMUNO`, `DOSE`, `QT_DOSE`. O sexo está embutido no imunobiológico. A amostra contém D1 feminina com `IMUNO=93`, `DOSE=01`. Não confundir os códigos históricos de imunobiológico **93 feminino / 94 masculino** com códigos modernos de vacina.

Todos os arquivos listados tinham data **23/05/2019**; `AUXILIARES/dpnibr.def` informa atualização **20/05/2019**. Logo `DPNI<UF>19.dbf` é parcial. A própria definição arquivada alerta sobre parcialidade de 2014. A definição atual do TabNet é mais recente: preferir sua extração para o baseline, inclusive 2015–2018.

## RNDS desde 2020 e códigos modernos

[Catálogo oficial PNI 2020](https://dadosabertos.saude.gov.br/dataset/doses-aplicadas-pelo-programa-de-nacional-de-imunizacoes-pni-2020) disponibiliza meses/anos; padrão CSV `https://s3.sa-east-1.amazonaws.com/ckan.saude.gov.br/PNI/csv/vacinacao_<mes>_<ano>_csv.zip`. O [dicionário oficial](https://s3.sa-east-1.amazonaws.com/ckan.saude.gov.br/dbbni/Dicionario_tb_ria_rotina.pdf) define `co_paciente` como identificador do paciente atribuído na RNDS, `co_documento` como identificador do documento, `co_municipio_paciente` como residência e `nu_idade_paciente` como idade. Também documenta substituição/alteração (`co_troca_documento`, `st_documento`) e `st_vida_paciente`. Portanto contar documentos distintos não equivale a contar pessoas.

A [ficha oficial do MS — cuidado da mulher na prevenção do câncer](https://www.gov.br/saude/pt-br/composicao/saps/publicacoes/fichas-tecnicas/equipe-de-atencao-primaria-e-saude-da-familia/cuidado-da-mulher-na-prevencao-do-cancer) confirma **67 = HPV quadrivalente** e **93 = HPV nonavalente**. Incluir ambos; não filtrar apenas a sigla HPV4. O dicionário publicado usa nomes como `co_vacina`, `sg_vacina`, `dt_deleted`, enquanto o cabeçalho real dos arquivos usa outros nomes: conferir os cabeçalhos por versão antes de fixar um mapeamento.

**Limite documental:** o dicionário não especifica algoritmo de hash, escopo/salt, estabilidade entre meses/anos/republicações, nem a ligação de múltiplos CNS/CPF ao paciente unificado. Define identificador de paciente, o que sustenta usar `co_paciente` como chave candidata, mas não prova que a deduplicação pública reproduz a qualificação interna da NT. Tampouco explica atribuição municipal quando uma pessoa muda de município. Isso é uma limitação de equivalência e validação, não motivo para descartar a série ou trocar seu método.

## O que a auditoria mostrou

A carga completa, de janeiro de 2020 a setembro de 2026, foi concluída em 05/11/2026, com 81 extratos. A reconstrução local divergiu do painel oficial nos numeradores, em municípios e sexos distintos, mesmo com denominadores censitários idênticos. Atribuir a pessoa ao primeiro ou ao último município, e contar por coorte, não reproduziu os numeradores qualificados. A NT 16/2025 informa a remoção de duplicidades e erros na RNDS, sem documentar como reproduzir essa qualificação a partir das chaves públicas. A deduplicação não foi ajustada para bater com amostras.

Conferência dos agregados oficiais usados na publicação (`pipeline/references/hpv.json`, extração de 05/11/2026, tabela `KeWXGFP`, ano de referência 2025):

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

## Como repetir

1. Extrair o histórico do TabNet 2015–2019 por município × sexo × idade, D1, e conferir a amostra de Brasileia acima.
2. Manter a RNDS longitudinal por paciente com os códigos 67 e 93 e idade de 9 a 14 anos, tratando registros substituídos ou excluídos conforme o esquema real, antes de contar cada pessoa.
3. Compor as diagonais até cada ano de avaliação e dividir pelo Censo 2022, sem somar totais anuais.
4. Comparar com o painel oficial. Divergências são registradas e podem ser levadas ao DPNI (`pni@saude.gov.br`, contato listado no catálogo), sem afirmar equivalência sem evidência.

Os comandos estão em `docs/data-update.md`. Essa auditoria nunca substitui os numeradores oficiais.
