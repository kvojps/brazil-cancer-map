# 18: Cobertura da vacina HPV (SI-PNI)

**What to build:** o eixo Prevenção ganha a cobertura da vacina HPV de 9–14 anos, meninas e meninos juntos, para colo do útero e Todos. O indicador abre no mapa em "como está hoje" e não tem Tendência estatística. Referência: spec, seções 4, 5, 6.1, 6.4, 9, 11 e 16.

**Blocked by:** 10 — Ficha do Meu município com o cartão do 60 dias

**Status:** ready-for-agent

- [ ] O pipeline processa o SI-PNI novo um arquivo mensal por vez, em fluxo, apagando o bruto; o processamento é particionado por ano
- [ ] A duração e o pico de disco são medidos e registrados, e fica documentado se cabem num job do GitHub Actions (14 GB, 6 h)
- [ ] A contagem é "ao menos uma dose" em todos os anos, de 2020 ao último ano, com a mudança para dose única em 2024 marcada na série
- [ ] O denominador é o Censo 2022 fixo (SIDRA 9514), 9–14 anos por sexo; o mínimo e a cascata contam o denominador
- [ ] Referência 90% ("meta para 2030") para o total e para cada sexo; valores acima de 100% seguem a regra do acima do esperado
- [ ] Sem Tendência: o cartão diz "série curta, ainda sem direção"
- [ ] No mapa, o HPV abre em "como está hoje", com uma nota no seletor explicando por quê
- [ ] O cartão mostra o detalhe por sexo ao ser aberto, a marca da dose única, a nota do Censo 2022, a menção de que a meta da OMS é para meninas e a Ação aprovada da vacinação
- [ ] A metodologia ganha a seção do HPV, com a diferença entre o Censo 2022 e o POPSVS
