# Como aplicar a direção às demais páginas e entregar uma especificação verificável?

> Registro histórico: a apresentação e a hierarquia foram substituídas pela alternativa A aprovada no [ticket 35](../../mvp-implementacao/issues/35-prototipo-dashboard-de-observabilidade.md). Consultar a [spec vigente](../spec.md) e o [handoff aprovado](../observability-handoff.md); o status deste ticket registra a entrega anterior.
Labels: wayfinder:grilling
Type: grilling
**Status:** resolved
Assignee: codex
Parent: ../map.md
Blocked by: 04

## Question

Decidir com o responsável como o sistema visual se aplica a metodologia, leitura municipal sem JavaScript e acesso a dados/fontes, respeitando o inventário de páginas existente. Consolidar critérios de UI/UX, responsividade, teclado, foco, alternativas ao mapa, desempenho e consistência para uma especificação de implementação. Separar as dependências já abertas do MVP das necessidades novas do redesign e explicitar mudanças na spec anterior.

## Answer

As seis propostas das duas rodadas foram aprovadas expressamente pelo responsável. A [especificação de UI/UX da v1](../spec.md) consolida a direção anteriormente aprovada, as páginas e os critérios verificáveis para implementação.

- Padrão visual compartilhado, Metodologia com sumário e coluna de leitura, dados/fontes pela Metodologia e quatro Eixos em Meu município.
- Tema compartilhável por `theme=light|dark`, preferência do sistema sem parâmetro e sem persistência entre visitas.
- Leitura básica no HTML, links por Tipo de câncer e índice estático por UF. Com JavaScript, busca e tabela devem funcionar independentemente da inicialização do mapa.
- Aceite nos dois temas e em 320/768/1280 px, zoom de 200%, teclado, foco, anúncios por leitor de tela, textos e texturas sem dependência exclusiva de cor, checagem automatizada e revisão manual.
- Medição da transferência inicial comprimida em torno de 1,3 MB e saída estática abaixo de 30 MB, investigação de excessos e detalhes sob demanda.

A conferência do contrato identificou os campos necessários, incluindo metadados e conteúdo editorial já existentes. Não foi identificada necessidade de ampliar o contrato estatístico. HPV, mortalidade, próstata e ajuste C55 exigem suas exceções próprias; ausência de classe não equivale automaticamente a dado insuficiente. A busca/tabela atual depende do mapa e de JavaScript: a alternativa independente e o índice estático são requisitos novos, não capacidades concluídas.

A especificação separa essas mudanças das dependências já abertas de metodologia, downloads, auditoria, revisão clínica e cargas do MVP. Não houve mudança no produto nem auditoria ou medição neste esforço. O mapa não tem outras decisões abertas.

## Critérios de encerramento

- [x] Aplicação às páginas, tema e leitura sem JavaScript aprovados.
- [x] Critérios verificáveis de responsividade, acessibilidade e desempenho aprovados.
- [x] Campos da prévia conferidos e exceções documentadas.
- [x] Dependências do MVP e revisões de apresentação explicitadas.
- [x] Especificação de handoff consolidada e mapa atualizado.

## Comments

### Direção aprovada para o handoff — 2026-11-04

Partir de [Qual direção visual torna o dashboard claro, acolhedor e consistente?](04-direcao-visual.md), agora resolvido: C (Mapa imersivo), temas claro/escuro e painel territorial com altura da linha do mapa no desktop. A resposta desse ticket concentra os padrões aprovados e limites da avaliação. Especificar a aplicação às demais páginas, a política definitiva do tema na URL, os critérios verificáveis e a correspondência entre campos da prévia e contrato existente. Não tratar o protótipo como implementação pronta ou auditoria de acessibilidade.

### Primeira rodada aprovada — 2026-11-04

O responsável confirmou “Concordo com tudo” para os três pontos:

- Navegação, tipografia, superfícies e temas compartilhados; Metodologia com sumário por indicador e coluna de leitura; Meu município com quatro Eixos empilhados; dados e fontes acessíveis pela Metodologia, preservando as páginas existentes.
- Tema explícito em `theme=light|dark`, preservado na navegação interna; sem parâmetro, seguir o sistema; sem persistência entre visitas.
- Meu município e Metodologia mantêm conteúdo e navegação básicos sem JavaScript, incluindo indicadores, ressalvas, Ações, fontes e acesso por links aos Tipos de câncer. Busca e tabela na inicial oferecem alternativa ao mapa; o comportamento preciso sem JavaScript e os critérios verificáveis serão detalhados na rodada seguinte.

O ticket permanece em discussão: esta aprovação não encerra os critérios de acessibilidade, responsividade, desempenho ou a verificação do contrato da prévia.


### Segunda rodada aprovada — 2026-11-04

O responsável confirmou “Concordo com tudo” para a lista estática de municípios por UF sem JavaScript, os critérios de responsividade/acessibilidade e os orçamentos e evidências de desempenho. As duas rodadas encerram as decisões deste ticket.

### Resolução — 2026-11-04

Aprovações humanas registradas nas duas rodadas acima. Resolução, especificação e atualização do glossário/mapa no commit `docs: finalize approved UI UX handoff specification`. Validação documental: links locais, estados dos tickets e diff; nenhum teste do produto se aplica a esta alteração de documentos.
