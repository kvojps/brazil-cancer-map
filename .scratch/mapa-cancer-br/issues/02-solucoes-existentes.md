# Já existe alguma solução que faz isso?

Type: research
Status: resolved
Blocked by:

## Question

Que ferramentas já mapeiam o câncer no Brasil? Candidatas: Atlas On-line de Mortalidade do INCA, PAINEL-Oncologia, Observatório de Oncologia, Global Cancer Observatory (GLOBOCAN/IARC), painéis de secretarias estaduais, projetos open-source ou jornalísticos (por exemplo no GitHub). Para cada uma, responder:
- público-alvo
- eixos e indicadores cobertos
- granularidade e série histórica
- tom (técnico ou cidadão, mórbido ou orientado à ação)
- se está ativa e atualizada
- licença ou código aberto
- se os dados podem ser reutilizados

Conclusão esperada: qual lacuna resta para um mapa de "esperança + ação" voltado ao cidadão, ou se ela já está coberta.

## Answer

Ver [`research/02-solucoes-existentes.md`](../research/02-solucoes-existentes.md) (tabela comparativa com fontes, acessadas em 02/11/2026).

- **Oficiais, ativos e técnicos:** o Atlas On-line de Mortalidade do INCA (município, 1979–2024, com tendência AAPC) e o PAINEL-Oncologia no Tabnet (Lei dos 60 dias, município, 2013–2026) servem a gestores. Dá para reutilizar os dados, mas a interface é Tabnet ou JSF.
- **Observatório de Oncologia (TJCC):** ativo nos estudos (out/2026), mas os indicadores estão parados em 2024. Fica quase todo no nível Brasil ou UF, não tem download e destaca a carga da doença e a morte.
- **GLOBOCAN 2024 (GCO):** só tem dado nacional, todos os direitos reservados. Não há painel estadual ativo: as SES publicam boletins em PDF que reusam o PAINEL-Oncologia.
- **Concorrente mais próximo:** o **Radar do Câncer** (Oncoguia + cliqueSUS), atualizado em 01/11/2026. Cobre acesso (descumprimento dos 60 dias, deslocamento) e detecção (mamografia, estádio), mas só por **UF**. Não tem "meu município", não tem licença nem download, mostra contagens de óbitos e não diz o que fazer. O Atlas CCC ("onde tratar") está parado em 2022.
- **GitHub:** só pipelines e datasets reaproveitáveis (onco-360 GPL-3.0, cancer-mama-brasil MIT/CC BY). Nenhum é produto para o cidadão.
- **Lacuna:** não existe mapa municipal, para o cidadão, de "esperança + ação" que junte os 4 eixos, mostre a tendência de melhora e ligue o dado à ação (rastreamento, Lei dos 60 dias, onde tratar). O espaço não está coberto, então a recomendação é **go**. Vale considerar parceria ou citação com o Oncoguia.
