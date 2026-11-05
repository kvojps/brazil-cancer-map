# 43: Reorganizar Meu município com o resultado primeiro

**What to build:** Aplicar a folha com manchete no celular e a coluna no desktop, com o mesmo bloco de resultado, em todos os Eixos e cartões.

**Blocked by:** 41 e 42 — composições do desktop e do celular.

**Status:** resolved

## Referências

- [Decisão do painel](../../ui-polimento/issues/04-painel-meu-municipio.md), que traz também as pendências citadas abaixo.
- [Mapa do polimento](../../ui-polimento/map.md), [spec vigente](../../ui-ux-v1/spec.md) e [glossário](../../../GLOSSARY.md).
- Fonte primária: branch descartável local `prototype/ui-polimento-painel`, commit `fe6362f`, em `?painel=D`.

## Critérios de aceite

- [x] Bloco de resultado igual recolhido e aberto, com número de 32 px, classe, período ou Referência, % sem informação, origem regional e aviso da Faixa C; Dado insuficiente como na decisão
- [x] No celular, folha de ponta a ponta na base, abrindo até o aviso, sem nunca cobri-lo; botão Legenda e Mapa/Lista acima dela, e enquadramento descontando a folha
- [x] No desktop, coluna de 400 px, mais larga acima de 1920 px, com nome fixo no topo e rolagem interna
- [x] Um controle recolhe e expande, só no celular, e ✕ limpa a seleção; saem "Voltar ao mapa" e "Reabrir"
- [x] Eixos com resultado no título fechado, um aberto por vez, na ordem interna da decisão, inclusive HPV, Mortalidade, tabagismo, casos estimados e Ações alternativas
- [x] Textos sobre a interface, status só para leitores de tela, foco no nome depois da busca e contorno com borda externa, conforme a decisão
- [x] Resolver as pendências da decisão: forma compacta em telas baixas sem perder o aviso da Faixa C, página comum no zoom de 200%, e textura da Faixa C no título só no 60 dias
- [x] Testar Balsas (faixa C), Alcântara (Região imediata e faixa C), Araioses (Dado insuficiente) e próstata (ressalva)
- [x] Verificar nos dois temas a 320, 768 e 1280 px e no zoom de 200%, com e sem JavaScript, com teclado e foco visível, sem rolagem horizontal fora de tabelas; registrar limites e o que não foi verificado
- [x] Atualizar os testes de navegador afetados por esta mudança, sem apagar a cobertura de comportamento; `npm run check`, `npm run build`, `npm test` e `npm run test:browser` passam em `site/`

## Limites

Não alterar pipeline, JSON publicados, método, classes, textos clínicos ou conteúdo da Metodologia. Sem deploy. Aprovação visual não equivale a auditoria de acessibilidade nem a revisão clínica. Não promover o código descartável dos protótipos.

## Comments

- Implementação e encerramento: `feat(site): put the result first in the Meu município panel (#43)` (este commit).
- **Verificado:** `npm run check`, `npm run build` e `npm test` (76 testes). `npm run test:browser` (163 testes) passou inteiro contra a saída estática; desta vez não rodei a suíte contra o servidor de desenvolvimento.
- **Matriz:** Balsas, Alcântara, Araioses e próstata (Recife) nos dois temas, a 320, 768 e 1280 px, com e sem JavaScript, com os detalhes abertos e sem rolagem horizontal na página nem no painel. Zoom nativo de 200% a 390 × 844 nos dois temas, com JavaScript, para o painel; `municipality.test.mjs` cobre o zoom nativo também sem JavaScript. Janelas de 195 × 422, 320 × 450 e 640 × 400 em fluxo. Teclado e foco visível na folha a 390 × 664 e na coluna a 1280 px. Em capturas: 390 × 844 e 320 × 568 no tema claro, 320 × 568 e 1280 × 800 no escuro, 195 × 422 e sem JavaScript a 390 × 844.
- **Pendências da decisão, como ficaram:**
  - **Telas baixas:** até 600 px de altura, a folha recolhida reduz os textos auxiliares a 12 px e o espaçamento, sem cortar nada. O número continua com 32 px. Em Alcântara a 320 × 568 a folha fica abaixo de 55% da altura, com o aviso da Faixa C inteiro, e o nome livre de Legenda e Mapa/Lista.
  - **Zoom de 200%:** fora do modo flutuante (menos de 520 px de altura ou de 300 px de largura), o painel faz parte de uma página comum, sem folha nem controle de recolher, e a página rola até o rodapé. Um toque no mapa leva a página ao painel.
  - **Demais cartões:** HPV, Mortalidade, tabagismo, casos estimados e Ações alternativas seguem a ordem da decisão. Mantive o "Período dos dados" em destaque logo abaixo do título, como pede a spec do MVP, §11.2, e a "Qualidade do registro" junto do resultado; só a nota de 2018 e 2024 foi para "O que é este número?".
  - **Faixa C no título do Eixo:** a textura vale só para o 60 dias.
  - **Sem JavaScript:** no celular, a página de município é uma página comum: sem mapa nem filtros, que não funcionariam, com todos os Eixos abertos e os links dos Tipos. O bloco de resultado e os resultados nos títulos dos Eixos existem só com JavaScript, pois dependem do estado do mapa; sem ele, o número fica no cartão.
- **Decisões a confirmar:**
  - **Taxa de mortalidade como número principal:** com o indicador de mortalidade, o bloco mostra a taxa em 32 px (por exemplo, "78,32 por 100 mil") e o Eixo Panorama a repete no título. Segui o protótipo e o painel anterior, e a taxa não é contagem absoluta. O glossário, porém, diz que a mortalidade aparece no mapa só como Tendência, e a decisão não tratou desse caso. Se preferir, a classe da Tendência pode ocupar o lugar do número.
  - **C55 não calculável:** em 73 das 74 ocorrências há valor publicado. O bloco mostra o número, a origem e "Ajuste não calculável", sem os pontos. Sem valor, o texto ocupa o lugar do número, também sem pontos.
  - **"Sem dado neste recorte":** usa uma amostra neutra, sem os pontos reservados ao Dado insuficiente. O protótipo usava os pontos.
  - **Ressalva sobre o mapa no celular:** só a da próstata sai com município selecionado. As do HPV e da mortalidade ficam, pois o bloco não as traz.
  - **Tabagismo e casos estimados nos títulos dos Eixos:** o protótipo só trazia os indicadores do mapa. Incluí "Fumantes na capital" e "Casos estimados na UF", que deixam claro o recorte.
  - **Toque no mapa:** deixou de mover o foco para a busca. Só a busca leva o foco ao nome.
- **Limites conhecidos:**
  - **HPV:** nenhuma UF tem HPV publicado. O cartão com dado e o bloco do HPV são cobertos pela leitura do código e por `tests/panel-result.test.mjs`, não por uma página real. Hoje o título de Prevenção mostra "Vacina HPV: Sem dado neste recorte" onde o HPV se aplica.
  - **Enquadramento:** com a folha aberta, o mapa não é reenquadrado; isso fica para quando ela recolhe. Com a folha recolhida, trocar um filtro continua reenquadrando o estado e desfaz o que a pessoa moveu, como já acontecia.
  - **Zoom de 200%:** o painel fica depois dos controles e do mapa na página. A busca e o toque no mapa levam até ele, mas quem abre um link direto precisa rolar.
  - **Condição do modo flutuante:** agora também em `navigation-view.ts` e em `profile.css`, pois CSS não tem media query nomeada.
  - A saída estática tem 898 MB, 20 MB a mais que no ticket 42.
- **Não verificado:** aparelho real, Safari e Firefox (ticket 46), leitor de tela e gesto de arrastar, que não foi implementado. O contorno e o enquadramento dentro do WebGL foram conferidos só em capturas. O tema escuro foi visto em capturas a 320 × 568 e 1280 × 800, e não a 768 px; a 768 px ele só tem os testes automáticos. Não equivale a auditoria de acessibilidade (ticket 25) nem a revisão clínica (ticket 26).
- Revisão em dois eixos aplicada. Corrigidos: número e origem perdidos no ajuste C55, pontos em dado ausente, número reduzido na forma compacta, período dos dados sem destaque, ressalva escondida em todos os indicadores, qualidade do registro movida, enquadramento contra a folha aberta. Os testes também acharam e corrigi: foco no nome com a busca aberta e link para um Eixo reescrito pela navegação compartilhada. Não aplicados, por serem de julgamento: reunir os textos por indicador em um só lugar, dividir o `render` de `navigation-view.ts` e unificar o mapeamento entre indicador e Eixo, hoje em `axisFor` e `axisResults`.
