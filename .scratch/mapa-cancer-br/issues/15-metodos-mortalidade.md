# Como as fontes oficiais tratam C55, C26 e a padronização por idade na mortalidade?

Type: research
Status: resolved
Assignee: Kvojps (claude session 2026-11-02)
Blocked by:

## Question

A Tendência da mortalidade sai do SIM ([Como classificar a Tendência e tratar municípios pequenos no mapa?](12-tendencia-e-municipios-pequenos.md)). Levantar como o INCA (Atlas On-line de Mortalidade), o Ministério da Saúde e a literatura brasileira de referência fazem:
- a **redistribuição do C55** (útero, porção não especificada) entre colo (C53) e corpo (C54): método, por idade e por UF, e se ela muda a tendência;
- o tratamento do **C26** (digestivo mal definido) na mortalidade colorretal, e se há redistribuição;
- a redistribuição de **causas mal definidas (R00–R99)** e de **C76–C80**, se alguma fonte oficial faz;
- a **padronização por idade**: população padrão (mundial de Segi/Doll, OMS 2000–2025 ou Brasil 2010), faixas e o agrupamento em 80+.

Citar os documentos de método e dizer qual combinação deixa os números do pipeline comparáveis aos do Atlas do INCA.

## Answer

Pesquisa concluída em 2026-11-02. Os detalhes e as fontes estão em [research/15-metodos-mortalidade.md](../research/15-metodos-mortalidade.md).

- **O INCA não redistribui nada.** O Atlas On-line usa a causa básica do SIM como vem, por categoria CID de 3 dígitos, e mostra C53, C54 e C55 separados. O dado oficial de colo do útero em 2022 (6.983 óbitos) é exatamente o C53 do SIM, sem C55. Corrige o ticket 09, que chamava a redistribuição de "método usual do INCA".
- **Padronização do INCA:** população mundial de Segi/Doll (1966), método direto, última faixa 80+ (peso 1.000 em 100 mil). A OMS 2000–2025 não é usada. O pipeline reproduziu a taxa do INCA para 2022: 4,75 contra 4,79 no Brasil, com contagens idênticas. A diferença de ~1% vem da população revista do MS (ticket 13).
- **C55 muda a tendência.** O C55 caiu de 23,7% para 15,2% dos óbitos por câncer de útero entre 2014 e 2024. Só com C53, a contagem cresce 2,9% ao ano. Com o C55 redistribuído, cresce 1,8%. A diferença (~1,1 ponto ao ano) é do tamanho da faixa de "estável". A literatura (Gamarra 2010; Azevedo e Silva 2010, 2011) reparte o C55 na proporção C53/(C53+C54) por faixa etária, UF e ano. Em 1981–2006, isso transformou uma série "crescente" em "decrescente".
- **C26:** ninguém redistribui. Ele é 5–6% dos óbitos digestivos, e redistribuí-lo aumentaria o colorretal em ~5% sem mudar a tendência (4,56% contra 4,51% ao ano).
- **R00–R99 e C76–C80:** só pesquisas redistribuem (50% das mal definidas, ou o método GBD). Nenhuma fonte oficial faz isso.
- **Recomendação:**
  - Para bater com o Atlas: SIM por residência, sem redistribuição; C53 para o colo, C18–C21 para o colorretal; padronização direta por Segi com 80+; população `POPSVS`. Na validação, conferir as contagens exatas e as taxas com ±3%.
  - **Na Tendência do colo do útero, redistribuir o C55** (proporção da UF por ano e faixa quinquenal, aplicada aos municípios) e explicar na nota por que o número fica acima do INCA. A alternativa é usar só C53, com ressalva. Fica para decidir.
  - C26, R00–R99 e C76–C80 ficam sem correção e entram como limitação.
- **Incerteza:** o Atlas não publica nota de método. As faixas exatas da versão on-line e o denominador que o INCA usou não foram confirmados.
