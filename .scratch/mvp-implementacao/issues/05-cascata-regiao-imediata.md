# 05: Cascata da Região imediata e Dado insuficiente

**What to build:** municípios pequenos deixam de mostrar uma Tendência sem sentido. Se o município não tem o mínimo de casos, ele assume o dado da sua Região imediata; se nem ela tem, fica como Dado insuficiente. O cidadão vê a origem do dado no tooltip. Referência: spec, seções 8 e 11.1.

**Blocked by:** 04 — Até 60 dias × Todos pinta o mapa em Tendência

**Status:** resolved

- [x] O mínimo é uma média de pelo menos 20 por ano na janela, contando o denominador da Tendência nas proporções (no 60 dias, os casos tratados com quimio ou radio, pelo [ticket de decisão 27](../../mapa-cancer-br/issues/27-quebra-de-serie-do-painel.md); se o ticket 27 de implementação ainda não estiver feito, os casos diagnosticados) e o numerador nas taxas
- [x] A cascata por indicador × tipo é município → Região imediata → dado insuficiente, igual para a Tendência e a Situação, e nunca sobe para a UF; ela é uma função reaproveitável pelos demais indicadores
- [x] A camada do mapa traz a origem do dado de cada município: município, região ou insuficiente
- [x] O município com dado da região recebe a cor da região, sem textura, e o tooltip diz "Seu município e vizinhos — região de X"
- [x] Dado insuficiente aparece em quase branco com textura de pontos, nunca branco puro, e entra na legenda
- [x] A contagem bruta do município com dado insuficiente não é exportada para exibição
- [x] Testes cobrem os três ramos da cascata

## Comments

Resolvido em `54f1870` (cascata reaproveitável em `pipeline/cascade.py`, camada do 60 dias com a origem do dado, cor da região, tooltip e textura de pontos no mapa), `4ad97ef` (revisão: nome `immediate_region`, nota da legenda sem "Região imediata", origem coerente com a cor) e no commit seguinte, que regenera a camada e o `manifest.json` e fecha este ticket.

Decisões tomadas na implementação, com o responsável pelo projeto:
- **Mínimo:** média de pelo menos 20 casos de quimio/radio por ano na janela da Tendência (hoje 2015–2024, ou seja, 200 casos), contando os anos sem caso. O dado da região soma todos os municípios da Região imediata, inclusive os que têm dado próprio.
- **A origem vale para a camada inteira:** o município com dado da região recebe a classe, o valor e a % sem informação da região; o município com dado insuficiente não exporta nem a classe nem as porcentagens (`value` e `without_treatment_info` ficam `null`), porque uma porcentagem de poucos casos revela a contagem bruta.
- **Contrato:** `origin` é `"municipality"`, `"immediate_region"` ou `"insufficient"`. O nome da região vem de `municipalities.json` (`immediate_regions`).
- **Classe não calculável:** um município ou região que passa do mínimo pode, em tese, não ter Tendência estimável (por exemplo, nenhum caso no prazo). Nesse caso o mapa mostra dado insuficiente e o tooltip diz "Poucos casos aqui para dizer a direção". Com a extração de 17/10/2026, isso não acontece em nenhum município.
- **Textos novos (a aprovar, como os dos tickets 04 e 27):**
  - legenda, dado insuficiente: "poucos casos no município e na sua região para dizer a direção.";
  - nota abaixo da legenda: "Municípios com poucos casos mostram o dado do município somado ao dos vizinhos, com a mesma cor.";
  - tooltip e tabela, origem: "Dado do próprio município", "Seu município e vizinhos — região de X" e "Poucos casos aqui para dizer a direção".
- **Texto do tooltip:** o [ticket de decisão 12](../../mapa-cancer-br/issues/12-tendencia-e-municipios-pequenos.md) fala em "dado da região de X" no tooltip e reserva "Seu município e vizinhos (região de X)" para o cartão. Segui este ticket e a spec (seção 11.1), que pedem "Seu município e vizinhos — região de X" no tooltip; vale confirmar.
- **Textura de pontos:** a `fill-pattern` do MapLibre não lê `feature-state`, então uma segunda camada desenha os pontos só sobre os códigos com dado insuficiente. Conferido no Chromium sem interface, via DevTools Protocol (o `--screenshot` direto não desenha o WebGL).

**Distribuição** ("60 dias × Todos", extração de 17/10/2026):

| Origem | Melhorando | Piorando | Estável | Sem direção clara | Total |
|---|---:|---:|---:|---:|---:|
| Município | 55 | 204 | 0 | 966 | 1.225 |
| Região imediata | 417 | 1.068 | 0 | 2.788 | 4.273 |
| Dado insuficiente | | | | | 73 |

Os 73 municípios com dado insuficiente ficam em 16 Regiões imediatas do Norte e de partes do Nordeste e do Centro-Oeste (por exemplo Tabatinga, Coari, São Gabriel da Cachoeira, Oiapoque, Pacaraima e Tutóia - Araioses).
