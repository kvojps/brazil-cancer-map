# Quando e onde o pipeline roda para atualizar os dados?

Type: grilling
Status: open
Blocked by: 17

## Question

Com [Com que frequência cada fonte do MVP publica dados novos?](17-calendario-das-fontes.md) em mãos, decidir:
- a frequência de atualização do site (por fonte ou tudo junto);
- se o pipeline roda manualmente na máquina do mantenedor ou por agendamento no CI, e onde fica o cache de dezenas de GB do SI-PNI;
- o que acontece quando a etapa de validação falha ou uma fonte muda de formato;
- como o site mostra a data de cada dado ao cidadão (o `manifest.json` de [Qual stack e pipeline de dados usar?](07-stack-e-pipeline.md)).
