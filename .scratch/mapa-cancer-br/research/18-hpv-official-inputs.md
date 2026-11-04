# HPV: insumos oficiais para reconstruir a coorte

Verificação: **2026-11-04**. Fontes primárias; consulta HTTP real ao TabNet e leitura de amostra DBF do FTP. Nenhum arquivo mensal grande foi baixado.

## Resultado

**Há acesso público ao histórico consolidado completo de 2015–2019 pelo TabNet atual.** O FTP antigo está congelado em maio/2019 e não serve sozinho para fechar 2019. Para 2020 em diante existem microdados RNDS mensais; a equivalência da deduplicação pública com o tratamento interno do Ministério ainda exige validação. Não substituir a coorte por doses anuais/população.

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

**Consulta pequena executada:** Brasileia/AC (`SMunicípio=120010 BRASILEIA|120010|6`), feminino, D1, 2019: 9 anos **48**, 10 **5**, 11 **1**, 12 **4**, 13 **2**, 14 **2**, total **62**. Resposta identifica os filtros e a fonte SI-PNI. Artefatos temporários desta sessão: `/tmp/hpv-tabnet.html` (formulário), `/tmp/hpv-query.py` (geração de payload), `/tmp/hpv-post.txt` e `/tmp/hpv-result.html`. Para produção, consultar dez tabelas (cinco anos × dois sexos), preservar CSV bruto e metadados de extração. A consulta nacional completa ainda não foi executada nesta pesquisa.

## FTP: útil para inspeção, inadequado como única base fechada

Listagens verificadas: `ftp://ftp.datasus.gov.br/dissemin/publicos/PNI/DADOS/` e `.../AUXILIARES/`. Arquivos `DPNI<UF><aa>.dbf`; a amostra `DPNIAC15.dbf` tem 7,4 MB e 34.162 linhas. Campos relevantes: `ANO`, `ANOMES`, `MUNIC` (6 dígitos), `FX_ETARIA`, `IMUNO`, `DOSE`, `QT_DOSE`. O sexo está embutido no imunobiológico. A amostra contém D1 feminina com `IMUNO=93`, `DOSE=01`. Não confundir os códigos históricos de imunobiológico **93 feminino / 94 masculino** com códigos modernos de vacina.

Todos os arquivos listados tinham data **23/05/2019**; `AUXILIARES/dpnibr.def` informa atualização **20/05/2019**. Logo `DPNI<UF>19.dbf` é parcial. A própria definição arquivada alerta sobre parcialidade de 2014. A definição atual do TabNet é mais recente: preferir sua extração para o baseline, inclusive 2015–2018.

## RNDS desde 2020 e códigos modernos

[Catálogo oficial PNI 2020](https://dadosabertos.saude.gov.br/dataset/doses-aplicadas-pelo-programa-de-nacional-de-imunizacoes-pni-2020) disponibiliza meses/anos; padrão CSV `https://s3.sa-east-1.amazonaws.com/ckan.saude.gov.br/PNI/csv/vacinacao_<mes>_<ano>_csv.zip`. O [dicionário oficial](https://s3.sa-east-1.amazonaws.com/ckan.saude.gov.br/dbbni/Dicionario_tb_ria_rotina.pdf) define `co_paciente` como identificador do paciente atribuído na RNDS, `co_documento` como identificador do documento, `co_municipio_paciente` como residência e `nu_idade_paciente` como idade. Também documenta substituição/alteração (`co_troca_documento`, `st_documento`) e `st_vida_paciente`. Portanto contar documentos distintos não equivale a contar pessoas.

A [ficha oficial do MS — cuidado da mulher na prevenção do câncer](https://www.gov.br/saude/pt-br/composicao/saps/publicacoes/fichas-tecnicas/equipe-de-atencao-primaria-e-saude-da-familia/cuidado-da-mulher-na-prevencao-do-cancer) confirma **67 = HPV quadrivalente** e **93 = HPV nonavalente**. Incluir ambos; não filtrar apenas a sigla HPV4. O dicionário publicado usa nomes como `co_vacina`, `sg_vacina`, `dt_deleted`, enquanto o extrator existente espera outros nomes: conferir cabeçalhos reais por versão antes de fixar mapeamento.

**Limite documental:** o dicionário não especifica algoritmo de hash, escopo/salt, estabilidade entre meses/anos/republicações, nem a ligação de múltiplos CNS/CPF ao paciente unificado. Define identificador de paciente, o que sustenta usar `co_paciente` como chave candidata, mas não prova que a deduplicação pública reproduz a qualificação interna da NT. Tampouco explica atribuição municipal quando uma pessoa muda de município. Isso é uma limitação de equivalência e validação, não motivo para descartar a série ou trocar seu método.

## Próximo passo concreto

1. Extrair o baseline TabNet 2015–2019 por município × sexo × idade, D1; registrar data da consulta e comparar a amostra de Brasileia acima.
2. Manter RNDS longitudinal por paciente com 67/93 e idade 9–14; tratar registros substituídos/excluídos conforme esquema real, antes de contar cada indivíduo.
3. Compor diagonais até cada ano de avaliação e dividir pelo Censo 2022; não somar simplesmente totais anuais. Confirmar o comportamento de repetições entre o bloco consolidado e o identificado contra o painel oficial (a NT reconhece limitações de duplicidade no bloco antigo).
4. Validar vários municípios/sexos/anos contra o painel oficial de coortes; se não houver igualdade, registrar a divergência e procurar esclarecimento DPNI (`pni@saude.gov.br`, contato listado no catálogo), sem afirmar equivalência exata sem evidência.
