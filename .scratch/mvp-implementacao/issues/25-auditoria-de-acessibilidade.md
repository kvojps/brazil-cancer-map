# 25: Auditoria de acessibilidade do lançamento

**What to build:** o site cumpre o requisito de acessibilidade de lançamento: toda informação do mapa tem alternativa em texto ou tabela, toda interação funciona pelo teclado e nenhuma informação depende só de cor. Sem certificação formal de WCAG ou eMAG. Referência: spec, seção 2.

**Blocked by:** 09 — Estado na URL; 11 — Busca e navegação; 21 — Eixos sem indicador; 24 — Metodologia consolidada

**Status:** ready-for-agent

- [ ] Todo o fluxo (seletores, busca, mapa, tabela alternativa, ficha, "Saiba mais", metodologia) funciona só pelo teclado, com foco visível
- [ ] Cada estado do mapa (indicador × tipo × modo) tem alternativa em tabela com as mesmas classes, origens do dado e avisos
- [ ] Texturas e textos distinguem dado insuficiente, faixa C e as classes sem depender de cor
- [ ] As páginas de município são legíveis sem JS
- [ ] Uma checagem automatizada (por exemplo axe) roda no CI sem erros graves
- [ ] O orçamento de ~1,3 MB na primeira visita e < 30 MB no site inteiro é medido e cumprido
