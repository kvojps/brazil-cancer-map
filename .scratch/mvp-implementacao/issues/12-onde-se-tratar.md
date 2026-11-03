# 12: Onde se tratar (CNES) junto do 60 dias

**What to build:** junto do cartão do 60 dias, a ficha mostra onde se tratar: os CACON/UNACON e os serviços de radioterapia habilitados mais próximos do município, com a Ação correspondente. Não pinta o mapa e não tem Referência. Referência: spec, seções 4, 5, 10.2 e 11.2.

**Blocked by:** 10 — Ficha do Meu município com o cartão do 60 dias

**Status:** ready-for-agent

- [ ] O pipeline baixa as habilitações do CNES (DBC, mensal) e identifica CACON, UNACON e radioterapia, com a situação atual
- [ ] Para cada município, calcula os estabelecimentos habilitados mais próximos e exporta na camada da ficha
- [ ] A ficha mostra a lista junto do 60 dias, com nome, município e tipo de habilitação
- [ ] A Ação "Saiba como chegar ao atendimento especializado" tem o "Saiba mais" explicando que a regulação define o hospital e que o paciente não escolhe
- [ ] A validação confere a contagem de habilitações por UF numa faixa plausível; se falhar, o CNES não é publicado
- [ ] A metodologia ganha a seção de Onde se tratar
