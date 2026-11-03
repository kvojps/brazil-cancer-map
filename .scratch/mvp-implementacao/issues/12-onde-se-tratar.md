# 12: Onde se tratar (CNES) junto do 60 dias

**What to build:** junto do cartão do 60 dias, a ficha mostra onde se tratar: os CACON/UNACON e os serviços de radioterapia habilitados mais próximos do município, com a Ação correspondente. Não pinta o mapa e não tem Referência. Referência: spec, seções 4, 5, 10.2 e 11.2.

**Blocked by:** 10 — Ficha do Meu município com o cartão do 60 dias

**Status:** resolved

- [x] O pipeline baixa as habilitações do CNES (DBC, mensal) e identifica CACON, UNACON e radioterapia, com a situação atual
- [x] Para cada município, calcula os estabelecimentos habilitados mais próximos e exporta na camada da ficha
- [x] A ficha mostra a lista junto do 60 dias, com nome, município e tipo de habilitação
- [x] A Ação "Saiba como chegar ao atendimento especializado" tem o "Saiba mais" explicando que a regulação define o hospital e que o paciente não escolhe
- [x] A validação confere a contagem de habilitações por UF numa faixa plausível; se falhar, o CNES não é publicado
- [x] A metodologia ganha a seção de Onde se tratar

## Comments

Implementado em 2026-11-03:

- Fonte `cnes` registrada no protocolo Source. Seleciona a competência mais recente comum a HB e ST das 27 UFs, usa o cache incremental e cruza habilitações vigentes com estabelecimentos e nomes da tabela oficial `CADGERBR.dbf`, em `TAB_CNES.zip`. Os nomes não existem nos DBC HB/ST. O auxiliar acrescenta cerca de 123 MB à carga inicial, além dos 24 MB estimados para os DBC. Foi necessário corrigir o terminador NUL do cabeçalho de alguns DBF descompactados para permitir sua leitura por dbfread.
- Códigos incluídos: 1704, 1706–1713 e 1715, com as modalidades específicas visíveis. Vigência por CMPT_INI/CMPT_FIM e competência por COMPETEN; duplicatas de CNES × habilitação removidas. Nomes ausentes, divergências com ST e códigos municipais desconhecidos bloqueiam a publicação.
- Proximidade calculada em `compute`, pela fórmula de haversine entre centroides da malha publicada. Para cada município, até três CACON/UNACON e até três serviços com radioterapia, sem repetição e sem restringir à UF. Distâncias aproximadas em linha reta, sem representar rota, tempo de viagem ou escolha do hospital. Empates resolvidos pelo CNES. Essas escolhas operacionais estão explícitas na metodologia.
- CNES incluído em `where_to_treat` nas 27 fichas de UF, com catálogo compartilhado por ficha e listas por município. Os dados anteriores do Painel-Oncologia foram conferidos e preservados integralmente. Nenhuma camada do mapa ou Referência acrescentada.
- Competência real publicada: 202609; extração em 03/11/2026. Limpeza identificou 364 estabelecimentos e 480 habilitações ativas. As contagens das 27 UFs passaram nas faixas documentadas. Listas para os 5.571 municípios da malha existente, conforme o ticket 10; os JSON novos do CNES acrescentam cerca de 1,14 MB sem compressão. Manifesto identifica a versão commitada `0.1.0+44f11d2`.
- Lista legível no HTML estático, junto ao 60 dias, com nome, município/UF, habilitações e competência. Ação permanente com público, critérios, exceções, fontes oficiais e data de conferência; explica que a regulação define o hospital e que o paciente não escolhe. Revisão editorial/clínica permanece registrada como pendente, acompanhada pelo ticket 26.
- Metodologia em `/metodologia/#onde-se-tratar`: fontes e arquivos, códigos, limpeza, cálculo, limitações, faixas de validação por UF, reprodução, versões e reutilização. Fontes oficiais do CNES e do INCA reconferidas.
- Validação: 105 testes Python e 12 testes do site passando; mypy sem erros; Astro check sem erros, avisos ou hints. A suíte do site inclui o build das fichas estáticas. Testes cobrem vigência e duplicação, nomes ausentes, seleção da competência comum, proximidade/radioterapia, bloqueio da publicação, preservação de outras fontes e lista renderizada. Sem verificação interativa em navegador.
- Revisão `code-review` desde `7656c10`, em dois agentes paralelos: Standards sem achados; Spec sem desvios confirmados. O teste de metodologia foi ajustado para aceitar os atributos CSS gerados pelo Astro, mantendo a conferência dos nove itens do 60 dias e acrescentando a seção CNES.

Commits que resolveram o ticket:

- `44f11d2` — `feat: add CNES nearby oncology services to municipality profiles`.
- Commit deste fechamento — `feat: publish validated CNES profiles and resolve treatment services ticket`.
