# Conferência do SIM com o Atlas do INCA

> Leitura curta. A [versão completa](https://github.com/kvojps/brazil-cancer-map/blob/11fd03c47e1ce09b9a2ccb873ccc75da1ccb304f/docs/data/sim-atlas-check.md), com a leitura do Atlas, as faixas de idade e a comparação das populações padrão e das fontes que redistribuem causas, está no commit `11fd03c`.

Sustenta a padronização por Segi/Doll com 80+ e a tolerância de ±3% da validação do SIM. `pipeline/references/sim-atlas.json` guarda a amostra que o pipeline compara a cada execução. O método está em [`/metodologia/#mortalidade`](https://brazil-cancer-map.kvojps.workers.dev/metodologia/#mortalidade).

**Data:** pesquisa de 02/11/2026, com o SIM de 2022 a 2024, a população `POPSBR22–24` e o TabNet de 2014–2024. Resultado com o código do pipeline em 03/11/2026, mantido na carga completa de 04/11/2026.

## Resultado

Alvo: tabela 2 de *Controle do câncer do colo do útero no Brasil: dados e números 2025* (INCA; [cópia do PDF](https://colposcopia.org.br/wp-content/uploads/2025/05/Controle-do-cancer-do-colo-do-utero_completo.pdf), [arquivada](https://web.archive.org/web/2025/https://colposcopia.org.br/wp-content/uploads/2025/05/Controle-do-cancer-do-colo-do-utero_completo.pdf)), com taxas do Atlas "ajustadas pela população mundial padrão". Recorte: C53, mulheres, por residência, 2022.

| Área | Óbitos Atlas | Óbitos SIM | Taxa Atlas | Taxa do pipeline | Diferença |
|---|---:|---:|---:|---:|---:|
| Brasil | 6.983 | 6.983 | 4,79 | 4,748142 | −0,9% |
| Minas Gerais | 466 | 466 | 2,97 | 2,938138 | −1,1% |
| Rio de Janeiro | 543 | 543 | 4,22 | 4,211732 | −0,2% |
| Pará | 417 | 417 | 9,11 | 8,919279 | −2,1% |
| São Paulo | 1.107 | 1.107 | 3,25 | 3,272509 | +0,7% |

- **As contagens batem exatamente.** O INCA usa só C53, sem C55, por residência. O TabNet confirma: 6.983 óbitos por C53 em 2022, mais 1.927 por C55 (extração de 02/12/2025).
- **As taxas ficam a cerca de 1%, e a diferença vem do denominador.** A taxa bruta do INCA implica ~109,1 milhões de mulheres em 2022, contra 107,9 milhões na `POPSVS` revista. Esse denominador foi inferido, sem leitura da fonte.
- **Por isso a tolerância é de ±3%**, relativa à taxa oficial, e contagem diferente bloqueia a publicação. A conferência cobre esta amostra, e não os seis tipos e os onze anos.
- **Só Segi/Doll reproduz o nível do INCA:** 4,75 por 100 mil no Brasil, contra 5,27 com a população padrão da OMS 2000–2025. Agrupar a idade em faixas quinquenais ou nas do Atlas de 2002 muda a taxa em no máximo 0,02 por 100 mil.
- **Não foi confirmado** que o Atlas On-line use Segi/Doll com 80+: ele não publica nota metodológica. A afirmação vem do Atlas impresso de 2002, do guia de 2014 e da reprodução numérica.

## C26: digestivo mal definido

Nenhuma fonte oficial redistribui o C26, e o projeto também não ([ADR 9](../adr/0009-c55-redistribution-cervix-only.md)). Medido no TabNet, 2014–2024:

- o C26 representa **5,0–5,9% dos óbitos digestivos** (C15–C26) em todos os anos;
- redistribuí-lo aumentaria o colorretal em cerca de 5% no Brasil, de 0,4% no ES a 7,6% no PI em 2024;
- a tendência quase não muda: +4,56% contra +4,51% ao ano nas contagens.

O número de 10,1% em [`quality-by-state.md`](quality-by-state.md) usa outro denominador, só colorretal, estômago e o próprio C26. Vale o de 5,0–5,9%.

**R00–R99 e C76–C80** também não são redistribuídos pelo INCA, pelo SIM/TabNet nem pelo Plano de Dant. Parte da literatura redistribui ([`c55-validation.md`](c55-validation.md#literatura)). As R00–R99 são 4,5–5,3% de todos os óbitos e caem devagar, então o viés na tendência é pequeno e uniforme.

## Método

Taxa padronizada pela população mundial de Segi (1960), modificada por Doll et al. (1966), com as duas últimas faixas somadas em 80+ = 1.000, porque a população do MS/SVS termina em 80+. Os pesos foram conferidos na tabela 1 da [OMS (Ahmad et al., 2001)](https://cdn.who.int/media/docs/default-source/gho-documents/global-health-estimates/gpe_discussion_paper_series_paper31_2001_age_standardization_rates.pdf). Fontes do método do INCA: [Atlas On-line](https://mortalidade.inca.gov.br/MortalidadeWeb/), versão 2.0.0, e [*Atlas de mortalidade por câncer no Brasil 1979–1999*](https://ninho.inca.gov.br/jspui/bitstream/123456789/8977/1/Atlas%20de%20mortalidade%20por%20c%c3%a2ncer%20no%20Brasil%201979-1999%20-%202002.pdf). Contagens do [TabNet SIM CID-10](http://tabnet.datasus.gov.br/cgi/deftohtm.exe?sim/cnv/obt10uf.def). Os scripts exploratórios não fazem parte do repositório.
