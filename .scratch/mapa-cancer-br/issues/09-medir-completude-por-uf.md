# Qual a qualidade dos dados de mama e colo do útero por UF?

Type: task
Status: resolved
Blocked by:

## Question

Baixar os microdados do Painel-Oncologia e do SIM e medir, por UF e para mama (C50) e colo do útero (C53):
- % de casos "sem informação de tratamento"
- completude do estadiamento
- % de óbitos por causas mal definidas (R00–R99)

Com isso dá para saber onde o dado é bom o bastante para um piloto. O resultado é uma tabela por UF.

## Answer

Medição feita em 2026-11-02. Detalhes, tabela completa e scripts: [research/09-medir-completude-por-uf.md](../research/09-medir-completude-por-uf.md).

- **O dado municipal se sustenta em parte das UFs, então o go continua de pé.** As UFs se dividem em três faixas pelo pior valor de "sem informação de tratamento" entre mama e colo do útero (2019–2023):
  - **A (até 15%):** SE, PI, TO, PA, AL, CE;
  - **B (entre 15% e 35%):** 16 UFs;
  - **C (35% ou mais):** MA, RO, RN, AP, RR.
- **O gargalo está no Painel-Oncologia, não no SIM.** No SIM, os óbitos por causa mal definida ficam abaixo de 8,5% em todas as UFs.
- **Não usar "% de diagnóstico em estádio inicial" do Painel-Oncologia.** O estádio só é registrado para quem fez quimioterapia ou radioterapia. Quando o primeiro tratamento é cirurgia, o campo vem como "não se aplica". O indicador fica enviesado e não mede detecção precoce. Para esse eixo restam os indicadores do SISCAN.
- **Os últimos 1–2 anos de diagnóstico ficam incompletos.** A % sem tratamento de colo do útero no país passa de 22% (2019) para 32% (2024). Esses anos precisam aparecer como provisórios.
- **A tendência de mortalidade por colo do útero precisa tratar o C55** (útero, parte não especificada). Ele chega a 20–26% dos óbitos por câncer de útero em RJ, MG, AP, PB e SE.
- **Os números municipais de colo do útero são pequenos.** Na maioria das UFs, menos de 25% dos municípios somam 20 casos ou mais em 5 anos. Será preciso agregar vários anos ou usar região de saúde, ou suprimir o número abaixo de um limiar.
