# Conferência do SIM com o Atlas do INCA

Sustenta a padronização por Segi/Doll com 80+ e a tolerância de ±3% da validação do SIM. `pipeline/references/sim-atlas.json` guarda a amostra que o pipeline compara a cada execução. O método está em [`/metodologia/#mortalidade`](https://brazil-cancer-map.kvojps.workers.dev/metodologia/#mortalidade).

Pesquisa verificada em 02/11/2026, com o SIM de 2022 a 2024, a população `POPSBR22–24` e consultas ao TabNet para 2014–2024. Os scripts exploratórios não fazem parte do repositório. O resultado com o código do pipeline é de 03/11/2026, e se manteve na carga completa de 04/11/2026.

## Resultado

Alvo: tabela 2 de *Controle do câncer do colo do útero no Brasil: dados e números 2025* (INCA; [cópia do PDF](https://colposcopia.org.br/wp-content/uploads/2025/05/Controle-do-cancer-do-colo-do-utero_completo.pdf), [arquivada](https://web.archive.org/web/2025/https://colposcopia.org.br/wp-content/uploads/2025/05/Controle-do-cancer-do-colo-do-utero_completo.pdf)), que cita o Atlas com taxas "ajustadas pela população mundial padrão". Recorte: C53, mulheres, por residência, 2022.

| Área | Óbitos Atlas | Óbitos SIM | Taxa Atlas | Taxa do pipeline | Diferença |
|---|---:|---:|---:|---:|---:|
| Brasil | 6.983 | 6.983 | 4,79 | 4,748142 | −0,9% |
| Minas Gerais | 466 | 466 | 2,97 | 2,938138 | −1,1% |
| Rio de Janeiro | 543 | 543 | 4,22 | 4,211732 | −0,2% |
| Pará | 417 | 417 | 9,11 | 8,919279 | −2,1% |
| São Paulo | 1.107 | 1.107 | 3,25 | 3,272509 | +0,7% |

- **As contagens batem exatamente.** O INCA usa só C53, sem C55, por residência. O TabNet confirma: 6.983 óbitos por C53 em 2022, com mais 1.927 por C55 ([TabNet SIM CID-10](http://tabnet.datasus.gov.br/cgi/deftohtm.exe?sim/cnv/obt10uf.def), extração de 02/12/2025).
- **As taxas ficam a cerca de 1%, e a diferença vem do denominador.** A taxa bruta do INCA implica cerca de 109,1 milhões de mulheres em 2022, e a `POPSVS` revista tem 107,9 milhões. O INCA provavelmente usou a série populacional anterior. Esse denominador foi inferido da taxa bruta, sem leitura da fonte.
- **Por isso a tolerância é de ±3%**, relativa à taxa oficial, e contagem diferente bloqueia a publicação. A conferência cobre esta amostra, e não os seis tipos e os onze anos.

## Faixas de idade

Agrupar em faixas quinquenais ou nas faixas do Atlas de 2002 muda a taxa em no máximo 0,02 por 100 mil:

| Área | Taxa bruta INCA | Bruta pipeline | Ajustada INCA | Quinquenal | Faixas do Atlas de 2002 |
|---|---:|---:|---:|---:|---:|
| Brasil | 6,40 | 6,47 | 4,79 | 4,75 | 4,76 |
| MG | 4,29 | 4,32 | 2,97 | 2,94 | 2,94 |
| RJ | 5,96 | 6,01 | 4,22 | 4,21 | 4,22 |
| PA | 9,52 | 9,78 | 9,11 | 8,92 | 8,94 |
| SP | 4,63 | 4,69 | 3,25 | 3,27 | 3,28 |

## O que o Atlas faz

O Atlas On-line ([mortalidade.inca.gov.br/MortalidadeWeb](https://mortalidade.inca.gov.br/MortalidadeWeb/)), versão 2.0.0, anos de 1979 a 2024, **não publica nota metodológica**: o botão "Notas Técnicas" mostra "No records found". O método vem das descrições dos modelos e do guia *Atlas On-line de Mortalidade: usos e aplicações* (INCA, 2014; [cópia no Internet Archive](https://web.archive.org/web/2020/https://www.inca.gov.br/sites/ufu.sti.inca.local/files//media/document//informativo-vigilancia-do-cancer-n5-edicao-especial-2014.pdf.pdf)).

| Item | O que o Atlas faz | Fonte |
|---|---|---|
| Numerador | Óbitos do SIM por residência, pela causa básica, em categorias CID-10 de 3 dígitos. Vai de C00 a C97, mais D46, e exclui C77–C79 | Guia de 2014, modelos 1 a 3 |
| C53, C54, C55 | Três itens separados no seletor de topografia | HTML do [Modelo 03](https://mortalidade.inca.gov.br/MortalidadeWeb/pages/Modelo03/consultar.xhtml) |
| C26, C76, C80, C97 | Também aparecem como itens próprios | Mesmo HTML |
| Redistribuição | Nenhuma é descrita, nem de C55, C26, C76–C80 ou R00–R99 | Guia de 2014 e páginas dos modelos |
| Taxa ajustada | Pelas populações mundial e brasileira. O mapa (Modelo 06) e o Modelo 04 usam só a mundial | Páginas dos modelos |
| População padrão brasileira | Censo 1991, 2000, 2010 e 2022 na versão atual | Seletor do Modelo 03 |
| Tendência | O Modelo 9 mostra a AAPC, mas a pessoa calcula o β fora do Atlas. Recomenda intervalos de pelo menos 8 anos | Guia de 2014, Modelo 9 |

O Atlas impresso (*Atlas de mortalidade por câncer no Brasil 1979–1999*, INCA, 2002; [PDF](https://ninho.inca.gov.br/jspui/bitstream/123456789/8977/1/Atlas%20de%20mortalidade%20por%20c%c3%a2ncer%20no%20Brasil%201979-1999%20-%202002.pdf)) descreve o método herdado: a população "proposta por Segi (1960), modificada por Doll et al. (1966)". Os pesos foram conferidos na tabela 1 da OMS ([Ahmad et al., GPE Discussion Paper 31, 2001](https://cdn.who.int/media/docs/default-source/gho-documents/global-health-estimates/gpe_discussion_paper_series_paper31_2001_age_standardization_rates.pdf)). Como a população do MS/SVS termina em 80+, as duas últimas faixas viram uma só, 80+ = 1.000. A tabela de pesos publicada está na metodologia.

**O que não foi confirmado:** que a versão on-line use Segi/Doll com 80+. A afirmação vem do Atlas de 2002, do guia de 2014 e da reprodução numérica. As faixas exatas da versão atual não foram conferidas, porque a consulta exige interação com a página.

## Comparação das populações padrão

| Opção | Quem usa | Faixas | Colo do útero, Brasil, 2022 (C53) |
|---|---|---|---|
| Mundial de Segi/Doll (1966) | INCA (Atlas, "dados e números", mapa), IARC/CI5, literatura brasileira | Quinquenais até 85+. Com a população do MS, 80+ = 1.000 | 4,75 por 100 mil (INCA: 4,79) |
| OMS 2000–2025 | OMS/GHE | Quinquenais até 100+ (80+ = 1,54%) | 5,27 |
| Brasil (Censo 2010 ou 2022) | Plano de Dant, opção no Atlas | Quinquenais | Não calculado |

Para a Tendência, a escolha muda pouco a inclinação, porque é o mesmo peso em todos os anos. Para o nível e para comparar com o INCA, só Segi/Doll funciona.

## C26: digestivo mal definido

Nenhuma fonte oficial redistribui o C26, e o projeto também não ([ADR 9](../adr/0009-c55-redistribution-cervix-only.md)). Medido no TabNet, 2014–2024:

- o C26 representa **5,0–5,9% dos óbitos digestivos** (C15–C26) em todos os anos;
- redistribuí-lo aumentaria o colorretal em cerca de 5% no Brasil, de 0,4% no ES a 7,6% no PI em 2024;
- a tendência quase não muda: +4,56% contra +4,51% ao ano nas contagens.

O número de 10,1% em [`quality-by-state.md`](quality-by-state.md) usa outro denominador, só colorretal, estômago e o próprio C26. Vale o de 5,0–5,9%.

## R00–R99 e C76–C80

| Fonte | Redistribui R00–R99? | Redistribui C76–C80? |
|---|---|---|
| INCA, Atlas On-line e "dados e números" | Não | Não. O "todas as neoplasias" do Atlas é C00–C97 sem C77–C79 |
| SIM/TabNet | Não | Não |
| Mortalidade prematura do Plano de Dant, como calculada pelo [CVE-SP](https://saude.sp.gov.br/resources/cve-centro-de-vigilancia-epidemiologica/areas-de-vigilancia/doencas-cronicas-nao-transmissiveis/dados/boletim_epidemio_dcnt_mortalidade_prematura.pdf) (fonte estadual, secundária para o método federal) | Não | Não |
| Gamarra et al. 2010; Azevedo e Silva et al. 2011 | Sim, 50% das R00–R99 | Gamarra: C76–C80 e C97 entre todos os cânceres |
| Teixeira et al. 2021 ([DOI](https://doi.org/10.1590/1980-549720210004.supl.1)) | Sim, no estilo GBD | Sim |

Hoje as R00–R99 são 4,5–5,3% de todos os óbitos e caem devagar, então o viés na tendência é pequeno e uniforme. A busca não encontrou nota técnica federal que mande redistribuir causas garbage nos indicadores oficiais de câncer. As citações completas dos artigos estão em [`c55-validation.md`](c55-validation.md#literatura).
