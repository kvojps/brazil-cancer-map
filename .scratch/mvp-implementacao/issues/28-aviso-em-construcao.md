# 28: Aviso de site em construção

**What to build:** toda página do site abre com uma faixa avisando que o projeto está em construção e que os números ainda não passaram por uma validação completa. Referência: spec, seção 2; decisão no [ticket de decisão 29](../../mapa-cancer-br/issues/29-aviso-em-construcao.md).

**Blocked by:** 02 — Tracer bullet: malha IBGE até o mapa no site

**Status:** resolved

- [x] A faixa fica no layout base, antes do conteúdo principal, e aparece em todas as páginas com o texto exato: "**Em construção.** Este site ainda está sendo desenvolvido e os números não passaram por uma validação completa: podem conter erros e mudar."
- [x] A faixa não pode ser fechada e é lida sem JavaScript, porque está no HTML estático
- [x] A faixa é um landmark rotulado para leitores de tela e tem contraste AA
- [x] A cor não repete a paleta da Tendência (verde-azulado, âmbar, cinzas) nem usa vermelho
- [x] Na largura de celular, a faixa quebra a linha sem gerar rolagem horizontal

## Comments

Resolvido no commit que acrescenta a faixa ao `site/src/layouts/Base.astro` e fecha este ticket. A faixa é um `<aside aria-label="Aviso">` antes do `<main>`, com texto azul-escuro `#1e3a5f` sobre azul-claro `#e8f0fb` (contraste de cerca de 10:1).
