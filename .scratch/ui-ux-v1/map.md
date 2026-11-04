# Evolução de UI/UX da v1 — dashboard e Meu município

Labels: wayfinder:map

## Destination

Uma especificação de UI/UX pronta para implementar, sustentada por pesquisa de referências e protótipos avaliados pelo responsável pelo projeto. Cobre o Mapa inicial como dashboard com mapa central, a visão Meu município e o padrão visual das demais páginas.

## Notes

- Alinhamento com o responsável em 2026-11-04: pesquisa + protótipos + especificação; implementação fica para outro esforço.
- Equilibrar cidadão e público técnico. Esta orientação revisa a prioridade de público do mapa original; linguagem simples, Ação e acesso aos detalhes técnicos devem coexistir. Não implica criar entradas por perfil.
- Foco inicial no Brasil pelo mapa central; selecionar município abre prévia e acesso ao Meu município completo. Cartões de resumo numérico nacional foram adiados. Cada número identifica território e período.
- Há liberdade para renovar o visual, preservando nome, tom acolhedor e significados das cores e texturas dos dados.
- Consultar `GLOSSARY.md`, a spec do MVP e os tickets que a fundamentam. O novo esforço reabre a apresentação; não altera silenciosamente método, Referência, Tendência, Situação, qualidade ou recorte dos indicadores.
- Skills: `grilling` + `domain-modeling` nas decisões; `research` nas investigações; `prototype` nas propostas concretas.
- Tracker: Markdown local, conforme `docs/agents/issue-tracker.md`. Tickets abertos usam `Status: open`; claim com `Status: claimed` e responsável.
- Pesquisas são evidência, não aprovação de direção visual. Registrar limites de acesso e distinguir observação de inferência.
- As evidências são preservadas no branch descartável `research/ui-ux-v1`, sem PR e sem merge, conforme o wayfinder. Os tickets apontam para os arquivos e commits da pesquisa.
- A implementação atual já tem mapa, ficha, filtros, URL compartilhável e tabela alternativa. HPV, tabagismo, downloads, atualização, metodologia, auditoria de acessibilidade e revisão clínica têm pendências próprias em `.scratch/mvp-implementacao/`; não presumir que estão concluídas.

## Decisions so far

- [Quais padrões de painéis territoriais e de saúde ajudam a entender e explorar um município?](issues/01-paineis-territoriais.md): seis referências apoiam orientação territorial e aprofundamento progressivo, com limites e hipóteses para protótipos.
- [O que aproveitar de sistemas de observabilidade no dashboard do Observatório?](issues/02-observabilidade.md): contexto na URL e panorama → detalhe são transferíveis; tempo real e linguagem de incidentes não se adequam às séries anuais.

- [Como organizar resumo nacional, mapa e Meu município para os dois públicos?](issues/03-hierarquia-e-navegacao.md): mapa Brasil → prévia → ficha completa, Tipo de câncer preservado e Metodologia própria para validação e reprodução; cartões nacionais adiados.
- [Qual direção visual torna o dashboard claro, acolhedor e consistente?](issues/04-direcao-visual.md): C (Mapa imersivo) aprovada, com visual de dashboard, temas claro/escuro e painel territorial ocupando a altura do mapa no desktop.

- [Como aplicar a direção às demais páginas e entregar uma especificação verificável?](issues/05-padrao-das-paginas-e-handoff.md): páginas, tema compartilhável, alternativas sem JavaScript e critérios aprovados; [especificação pronta para implementação](spec.md).

## Not yet specified

- Nenhuma decisão restante. Rota concluída com a [especificação de UI/UX da v1](spec.md); implementação e validações pertencem ao esforço seguinte.

## Out of scope

- Implementar ou publicar o redesign neste esforço.
- Novos indicadores, mudanças estatísticas e resolução das cargas de dados pendentes do MVP.
- Orientação médica personalizada, ranking de municípios e infraestrutura paga.
- Cartões de resumo numérico nacional: adiados por ausência de conjunto adequado de dados, conforme [Como organizar resumo nacional, mapa e Meu município para os dois públicos?](issues/03-hierarquia-e-navegacao.md); eventual retomada em outro esforço.
