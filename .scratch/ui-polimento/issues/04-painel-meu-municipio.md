# Como o painel Meu município deve apresentar o resultado primeiro?

Labels: wayfinder:prototype
Type: prototype
**Status:** resolved
Assignee: Kvojps
Parent: ../map.md
Blocked by: 02, 03

## Question

Prototipar o painel no celular e no desktop: nome, resultado e classe visíveis quando recolhido; destaque do número; ordem do conteúdo no Eixo aberto; redução das ações Recolher, Voltar ao mapa e Limpar seleção; apresentação dos filtros de Tipo de câncer; e o que fazer com os textos sobre a própria interface.

Período, origem regional, Referência, Ação e ressalvas essenciais continuam junto do resultado. Testar com casos difíceis: faixa C, Dado insuficiente e dado da Região imediata. Corrigir também a mensagem de status e o link que hoje deformam a barra de filtros ao selecionar.

No celular, partir da [primeira tela escolhida](02-celular-cabecalho-filtros-mapa.md): a legenda e o alternador Mapa/Lista flutuam nos cantos inferiores, justamente onde o painel recolhido aparece. Definir o que acontece com eles com um município selecionado, mantendo legível o contorno do município, o que a legenda explica e o aviso, que nunca é coberto.

## Answer

O responsável aceitou a recomendação: **variante A, Folha com manchete, com duas peças da C**, o botão Legenda e o resultado no título dos Eixos fechados.

- **Resultado:** bloco igual com o painel recolhido ou aberto, com o número em 32 px, o que ele mede e o ano; a classe da leitura do mapa com a cor e a textura do mapa, mais o período da Tendência ou a Referência; no 60 dias, a % de todos os casos sem informação de tratamento; a origem, quando regional; e o aviso da Faixa C.
- **Dado insuficiente:** o texto ocupa o lugar do número, com a textura de pontos e a explicação. O aviso da Faixa C sai do bloco, porque não há resultado a ressalvar, e fica no Eixo aberto, junto da Tendência do estado e da Ação.
- **Celular, recolhido:** folha de ponta a ponta na base. Tocar nela a abre. Acima dela ficam o botão Legenda, com as cores e que abre a legenda completa, e Mapa/Lista. O enquadramento do mapa desconta a folha e os controles.
- **Celular, aberto:** a folha sobe até o aviso, que nunca é coberto. O cabeçalho, Filtros, Legenda e Mapa/Lista saem de cena. Filtros, menu e busca, quando abertos, tomam o lugar da folha.
- **Desktop:** coluna de 400 px ao lado do mapa, com o nome fixo no topo. A composição da tela cheia segue para o [ticket do desktop](05-desktop-tela-cheia.md).
- **Ações:** um único controle recolhe e expande, só no celular, e ✕ limpa a seleção. Saem "Voltar ao mapa" e "Reabrir".
- **Eixos:** um aberto por vez, começando pelo Eixo do indicador do mapa, conforme a spec. Os Eixos fechados mostram os próprios resultados no título.
- **Ordem no Eixo aberto:** título, Situação e Referência, Tendência, % sem informação, Ação, série e, por fim, fonte e método. O título completo do 60 dias continua no Eixo.
- **Tipo de câncer:** seletor nativo no painel, ligado ao do mapa. Sem JavaScript, continuam os links.
- **Textos sobre a interface:** saem "Consulta pronta…" e "Meu município — dados sobre…". A nota sobre "Todos os cânceres" fica em "Por que 'Todos os cânceres' muda entre os Eixos?".
- **Status e foco:** a mensagem de status passa a ser só para leitores de tela e o link "Ir para Meu município" sai: a 1280 px, o cabeçalho e os controles não mudaram de altura ao selecionar. Depois da busca, o foco vai para o nome do município.
- **Contorno:** ganha uma borda externa na cor da superfície.

Decisões incluídas por conta do "concordo", sem resposta específica do responsável; se discordar, basta reabrir estes dois pontos:

- A nota sobre as mudanças de registro de 2018 e 2024 fica em "O que é este número?", ainda dentro do cartão. O texto continua pendente de aprovação na spec.
- Na próstata, o painel recolhido usa a versão curta "Sem comparação com o prazo da lei: vigilância ativa pode ser a conduta correta", e o aberto traz o texto integral. Com município selecionado, a caixa longa sobre o mapa sai no celular.

Pendências para a implementação:

- **Telas baixas:** a 320 × 568, no caso mais longo, a folha recolhida toma cerca de 60% da altura, e o botão Legenda e Mapa/Lista cobrem o nome do município. Falta uma forma compacta sem perder o aviso da Faixa C.
- **Zoom de 200%:** a 195 × 422 a folha toma 75% da altura e Filtros fica espremido. Proposta ainda não testada: nessa condição, a tela vira uma página comum com rolagem, junto da pendência da [primeira tela](02-celular-cabecalho-filtros-mapa.md).
- **Demais cartões:** só 60 dias, mamografia e citopatológico foram reorganizados. HPV, Mortalidade, tabagismo, casos estimados e as Ações alternativas precisam seguir a mesma ordem.
- **Faixa C no título do Eixo:** a textura vale só para o 60 dias.
- **Sem JavaScript:** a página de município rola como página comum, mas não foi verificada além da primeira tela a 390 px.
- **Não verificado:** aparelho real, Safari, leitor de tela, tema escuro no desktop e na combinação escolhida, e gesto de arrastar, que não foi implementado. O contorno e a faixa do aviso não se confundiram nas capturas, só no enquadramento inicial, sem arrastar o mapa até a faixa.

Protótipo: branch descartável local `prototype/ui-polimento-painel`, commit `fe6362f`; `npm run dev` em `site/`, com `?painel=D`. O código é só referência e deve ser reescrito na implementação.

## Comments

### Protótipo — 2026-11-05

Aguardando o julgamento do responsável. Branch descartável local `prototype/ui-polimento-painel`, commit `bc9ff4e`, a partir de `prototype/ui-polimento-fundamentos`; `npm run dev` em `site/`, com `?painel=A|B|C`. Casos difíceis: `/municipio/210140-balsas/` (faixa C), `/municipio/210020-alcantara/` (Região imediata e faixa C) e `/municipio/210090-araioses/` (Dado insuficiente).

### Resolução — 2026-11-05

O responsável aceitou a recomendação: "Concordo com sua recomendação". Ao conferir a spec antes de fechar, o protótipo foi corrigido: o título completo do 60 dias voltou ao Eixo e a % sem informação foi para junto do valor. O responsável não viu essa correção, que aumenta a folha recolhida em duas linhas. Specs ajustadas nas ações do painel e no lugar da nota do 60 dias. Sem alteração no código do produto.
