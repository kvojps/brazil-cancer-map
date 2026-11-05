# Como fazer o mapa dominar a primeira tela no desktop?

Labels: wayfinder:prototype
Type: prototype
**Status:** resolved
Assignee: Kvojps
Parent: ../map.md
Blocked by: 03

## Question

Prototipar a composição em tela cheia do Console horizontal a 1280 e 1440 px, com e sem município selecionado: mapa e legenda integrada inteiros na primeira tela, sem cartões flutuando sobre o fundo, tomando o protótipo aprovado no ticket 35 como ponto de partida. Eliminar a repetição entre "Explorar em lista" e o alternador Mapa/Lista. Definir também o comportamento a 768 px e em telas muito largas.

## Answer

O responsável aceitou a recomendação: **composição D, barras da A com a legenda no canto da B**.

- **Primeira tela:** aviso, cabeçalho, barra de filtros e mapa ocupam exatamente a altura da janela, sem margens, sem cartões e sem sombras. A 1280 × 800, o mapa tem 653 px de altura; a 1440 × 900, 753 px. Hoje tem 480 e 540 px.
- **Cabeçalho:** uma linha de 48 px, com marca, busca, Mapa, Municípios por UF, Como calculamos e tema. A busca fica no cabeçalho, e não na barra de filtros.
- **Filtros:** uma linha de 56 px a partir de 1280 px, com rótulo ao lado de cada seletor de 40 px, larguras fixas e Mapa/Lista na ponta direita. A barra de filtros tem fundo e filete, sem caixa própria.
- **Repetições que saem:** "Explorar em lista", ficando só Mapa/Lista. O título "Panorama territorial" e o nome do indicador continuam só para leitores de tela, porque o seletor já diz o que o mapa mostra.
- **Legenda:** encostada no canto inferior esquerdo do mapa, sem sombra, com filete nos lados internos. Mostra período, cada classe e, sem seleção, "A cor mostra a mudança, não um ranking". O ⓘ abre a legenda completa com todas as ressalvas.
- **Com município selecionado:** painel de 400 px ao lado do mapa, com a mesma altura e rolagem interna. O mapa só perde largura: a altura é a mesma com e sem seleção.
- **Lista:** ocupa a área do mapa e rola por dentro, mantendo os filtros e o painel à vista.
- **De 768 a 1023 px:** o cabeçalho continua em uma linha, com os links no menu hambúrguer, e os filtros ocupam duas linhas. A 768 × 1024, com seleção, o mapa fica com 368 px de largura ao lado do painel.
- **Acima de 1920 px:** o painel passa a 480 px, os seletores não esticam e só o mapa cresce.
- **Rodapé:** continua depois da primeira tela, sem entrar na conta da altura.

Pendências para a implementação:

- **Ressalva dinâmica:** a nota da próstata entra na barra de filtros e encolhe o mapa em 47 px a 1280 × 800. Definir se isso é aceitável ou se a nota reserva lugar.
- **Enquadramento:** ao selecionar, o zoom ainda não desconta a legenda, e Balsas ficou perto dela a 1280 × 800. Reservar essa área no enquadramento.
- **Sem JavaScript:** o protótipo só aplica a composição com JavaScript, e sem ele cai no layout antigo. A implementação precisa fazê-la por CSS e pela ordem do HTML, incluindo Mapa/Lista na barra.
- **Altura do aviso:** o protótipo mede a faixa com JavaScript para calcular a primeira tela, e ela tem duas linhas a 768 px. Resolver sem depender de JavaScript.
- **Altura mínima:** o protótipo fixa 520 px para a primeira tela. A 1280 × 600 a legenda de 200 px ocupa quase metade dos 453 px do mapa, sem cobrir o Brasil no enquadramento inicial.
- **Rodapé pela rolagem:** a rolagem do mouse sobre o mapa dá zoom, então o rodapé se alcança rolando sobre as barras, pela barra de rolagem ou pelo teclado. A Lista e o painel têm rolagem interna, que precisa ser acessível por teclado.
- **Testes de navegador:** os que dependem de "Explorar em lista", do título visível e da posição da legenda precisam mudar.
- **Não verificado:** zoom de 200%, leitor de tela, Safari, e a D no tema escuro com município selecionado. A D no tema escuro foi vista sem seleção, e a seleção no escuro foi vista só nas composições A, B e C.

Protótipo: branch descartável local `prototype/ui-polimento-desktop`, commit `cd08ce5`; `npm run dev` em `site/`, com `?desk=D`. O código é só referência e deve ser reescrito na implementação.

## Comments

### Protótipo — 2026-11-05

Aguardando o julgamento do responsável. Branch descartável local `prototype/ui-polimento-desktop`, commit `cd08ce5`, a partir de `prototype/ui-polimento-painel`; `npm run dev` em `site/`, com `?desk=A|B|C|D`. Recomendação da sessão: D. Casos difíceis: `/municipio/210140-balsas/` (faixa C), `/municipio/210020-alcantara/` (Região imediata e faixa C) e o Tipo de câncer Próstata (ressalva).

Altura do mapa medida, em px, sem e com município selecionado:

| Composição | 1280 × 800 | 1440 × 900 |
|---|---|---|
| Atual | 480, de 344 a 824, passando da dobra | 540, de 344 a 884, com a legenda abaixo da dobra |
| A, Faixa | 600 / 578 | 700 / 700 |
| B, Barra única | 710 / 710 | 810 / 810 |
| C, Coluna fixa | 653 / 578 | 753 / 700 |
| D, barras da A e legenda no canto | 653 / 653 | 753 / 753 |

Achado fora deste ticket: no celular, o protótipo do painel mostra a folha recolhida com margem de 8 px, e não de ponta a ponta como decidido no [ticket do painel](04-painel-meu-municipio.md). Vem de um estilo com escopo da Astro que vence a regra do protótipo, e já estava lá antes deste ticket. A decisão continua valendo; a implementação deve seguir a folha de ponta a ponta.

### Resolução — 2026-11-05

O responsável aceitou a recomendação: "Concordo com sua recomendação". A [spec vigente](../../ui-ux-v1/spec.md) foi ajustada na busca, em "Explorar em lista" e no alinhamento do painel. Sem alteração no código do produto.
