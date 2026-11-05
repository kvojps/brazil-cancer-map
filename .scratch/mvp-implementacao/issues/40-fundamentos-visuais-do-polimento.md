# 40: Aplicar os fundamentos visuais do polimento

**What to build:** Aplicar a todas as páginas o sistema escolhido: fonte, escala, espaçamento, superfícies, controles, marca e tons do mapa nos dois temas. As composições não mudam aqui.

**Blocked by:** None (can start immediately).

**Status:** resolved

## Referências

- [Decisão dos fundamentos](../../ui-polimento/issues/03-fundamentos-visuais.md), que traz também as pendências citadas abaixo.
- [Mapa do polimento](../../ui-polimento/map.md), [spec vigente](../../ui-ux-v1/spec.md) e [glossário](../../../GLOSSARY.md).
- Fonte primária: branch descartável local `prototype/ui-polimento-fundamentos`, commit `0b0ff2c`, em `?fund=B&mapa=2`.

## Critérios de aceite

- [x] Inter variável hospedada no próprio site, em subconjunto próprio com o `≥`, algarismos tabulares e `OFL.txt` publicado; sem fontes externas
- [x] Escala de 12 a 32 px, espaçamento em múltiplos de 4 px e tokens de superfície, texto, link, foco e seleção nos dois temas, conforme a decisão
- [x] Controles preenchidos, sem borda, com raio de 8 px, 40 px no desktop e 44 px no celular, e estado ativo invertido
- [x] Marca da silhueta do Brasil, derivada da malha real, no lugar do `◈`
- [x] Aviso em faixa invertida, integral, sem fechar, com o texto exato, em todas as páginas e sempre visível com a página rolada
- [x] Tons do mapa, pontos, hachura e Situação por tema, inclusive em `TREND_COLORS`, `STATUS_COLORS`, cartões e testes, com as distâncias de cor da decisão conferidas por script
- [x] O tema funciona pela preferência do sistema sem JavaScript
- [x] Remover da spec vigente os "acentos luminosos", substituídos pela decisão
- [x] Verificar nos dois temas a 320, 768 e 1280 px e no zoom de 200%, com e sem JavaScript, com teclado e foco visível, sem rolagem horizontal fora de tabelas; registrar limites e o que não foi verificado
- [x] Atualizar os testes de navegador afetados por esta mudança, sem apagar a cobertura de comportamento; `npm run check`, `npm run build`, `npm test` e `npm run test:browser` passam em `site/`

## Limites

Não alterar pipeline, JSON publicados, método, classes, textos clínicos ou conteúdo da Metodologia. Sem deploy. Aprovação visual não equivale a auditoria de acessibilidade nem a revisão clínica. Não promover o código descartável dos protótipos.

## Comments

- Implementação e encerramento: `feat(site): apply the visual foundations of the UI polish (#40)` (este commit).
- **Verificado:** `npm run check`, `npm run build`, `npm test` (53 testes) e `npm run check:tones`; `npm run test:browser` (65 testes) contra o servidor de desenvolvimento e contra a saída estática. Isso cobre 320, 768 e 1280 px, zoom de 200% (nativo pela extensão de teste e simulado), dois temas, com e sem JavaScript, teclado e foco visível, sem rolagem horizontal fora de tabelas. Tons do mapa conferidos também em capturas, com a troca de tema ao vivo.
- **Distâncias de cor:** o script reproduz os valores da decisão (1,5, 19,1 e 16,3). Abaixo da meta de 8 só ficam dois pares do tema claro, ambos com os pontos de "Dado insuficiente": "Sem direção clara" (6,4 a 6,8, custo aceito) e "Longe" (7,2 a 7,5, **não listado na decisão**). O script aplica o piso de 6 do protótipo aos pares com textura.
- **Limites conhecidos:**
  - Texto dos gráficos: 12,6 px a partir de 768 px, mas 6,5 px em 320 px, abaixo do piso de 12 px. Corrigir exige redesenhar o gráfico, e nenhum ticket de 41 a 46 cobre isso. A série continua legível em "Ver a série em tabela".
  - Aviso sempre visível em 320 px com zoom de 200%: ocupa 212 px de 450 px (47% da altura). Em 320 px sem zoom, 94 px de 900 px.
  - Glifos `☾`, `☀`, `☷` e `ⓘ` não existem na Inter e vêm da fonte do sistema, então variam por aparelho. `Σ` também, na Metodologia.
  - Rótulos de ajuda da legenda têm 24 px e sem preenchimento no desktop (44 px no celular), e os links do cabeçalho só sublinham ao passar o ponteiro, como no protótipo aprovado. O sumário da Metodologia segue sem sublinhado até o ticket 45.
  - A saída estática já tinha 816 MB antes desta mudança e agora tem 839 MB; a ficha de Recife cresceu cerca de 520 B. Pendência anterior da spec, não resolvida aqui.
  - O contorno de seleção junto da faixa do aviso segue para o ticket 43, conforme a decisão.
- **Não verificado:** aparelho real (ticket 46), leitor de tela, Firefox e Safari, e a cor dos pixels do mapa por teste automático (só em capturas). Não equivale a auditoria de acessibilidade (ticket 25) nem a revisão clínica (ticket 26).
- **Além do pedido, para a composição funcionar nos dois temas:** o controle de tema some sem JavaScript, porque ali o link não faria nada; a malha sem camada usa o tom suave, porque no escuro o fundo e o contorno são iguais; o rodapé cita a licença da fonte; o subconjunto limita o `tnum` aos algarismos, porque a Inter também alargava hífens em texto corrido (o protótipo tinha esse defeito).
- Teste `static cancer links reach readable cards without JavaScript`: falhou 2 vezes em execuções completas da suíte contra o servidor de desenvolvimento, sem reproduzir isolado (8 execuções) nem na saída estática. Causa provável, não confirmada: lia o alvo sem esperar o documento que o clique recarrega. Passou a esperar o alvo visível, sem perder cobertura, e a suíte passou nas duas execuções seguintes; vale observar se volta a falhar.
- Revisão em dois eixos aplicada: fonte e `tnum` no mapa e nos controles, peso 500 nos controles, nomes em inglês nos testes e token `--insufficient` conforme o glossário. Ficaram como estão, por decisão de escopo, os cinco cartões com gráficos repetidos e os estilos do MapLibre em `theme.css`.
