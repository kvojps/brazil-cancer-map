# Handoff aprovado — A, Console horizontal

O responsável escolheu **“A”** em 2026-11-04 após a apresentação das três alternativas do ticket 35. Adota-se a composição A para navegação, mapa, painel municipal, legenda, lista, rodapé e Como calculamos. Não houve pedido adicional de ajuste. A escolha aprova a proposta visual, sem aprovar publicação ou converter o protótipo em implementação.

## Fonte primária e reprodução

Branch local descartável: `prototype/35-observability-dashboard`. Código, capturas e README: commit `86a8d87`; vínculo no ticket: `ce023a9`. A branch conserva A/B/C como evidência. A main recebe apenas a decisão, este handoff, a especificação e os tickets.

Consultar sem trocar a árvore de trabalho:

```sh
git show prototype/35-observability-dashboard:site/src/prototypes/observability/README.md
git show prototype/35-observability-dashboard:site/src/prototypes/observability/review/console-desktop-dark.png > /tmp/console-desktop-dark.png
```

Para executar, usar checkout/worktree dessa branch e `npm run prototype:observability --prefix site`; abrir `/prototype/observability?variant=A&theme=dark` no endereço informado pelo Astro. A rota é exclusiva do desenvolvimento. A porta 4323 usada na apresentação não é endereço de produção nem serviço permanente.

## Desenho adotado

Cabeçalho compacto com símbolo, nome, “Mapa”, “Como calculamos” e sol/lua acessível. Barra horizontal agrupando indicador, modo, Tipo de câncer, busca, botão secundário “Explorar em lista” e ajuda. Brasil inteiro na abertura, tratamento em até 60 dias em Tendência, sem seleção e sem painel vazio. Mapa ocupa a área principal com legenda compacta e explicações sob demanda; nenhuma nova estatística nacional.

Seleção abre consulta completa no próprio dashboard: painel lateral no desktop e inferior expansível no celular. Os quatro Eixos são expansíveis, inicialmente aberto o Eixo correspondente ao indicador do mapa. Acesso ao tratamento vem primeiro, com Onde se tratar junto. Nome/UF, resultado, classe, período, origem regional, Referência pertinente, Ação e ressalvas essenciais ficam junto do resultado. Recolher preserva seleção; fechamento da seleção é explícito.

Lista substitui mapa na mesma área e preserva filtros/seleção. Índice estático por UF fica acessível sob demanda, sem área permanente abaixo do mapa. Rodapé vem após o dashboard. Como calculamos mantém a rota e âncoras, com sumário, seções, coluna de leitura e expansões no mesmo sistema visual. A spec consolidada detalha os comportamentos normativos.

## Limitações conhecidas e aceitas como escopo do protótipo

Mapa/lista nacionais usam os JSON publicados; fichas completas limitadas a Abreu e Lima, Afrânio e Manoel Urbano; filtro de Tipo limitado a Todos os cânceres. Essas restrições não são requisitos do produto: a implementação deve atender todos os municípios e Tipos pertinentes.

HPV foi representado como **simulação visual sem números**, por ausência de camada publicada nesta cópia. Demonstra a restrição de modo sem inventar resultado real ou classe. Essa representação satisfaz a avaliação visual do protótipo permitida pelo ticket 35; a avaliação com cobertura real depende da carga e não foi realizada. Mortalidade usa dados reais e não oferece Situação. A aprovação A não resolve a carga HPV nem autoriza substituir ausência de carga por uma classe calculada de dado insuficiente no produto.

O mapa SVG, o tema escuro inicial sem JavaScript e os textos resumidos de metodologia são limitações descartáveis. Reutilizar os componentes e o conteúdo atuais; reescrever a composição de produção sem incorporar essas limitações. Não copiar o `@ts-nocheck`, o seletor de variantes, simulações ou a projeção simplificada do protótipo.

## Compatibilidade e resiliência

Direção de implementação: reaproveitar `/municipio/<slug>/` como documento estático do próprio dashboard com seleção e quatro Eixos no HTML, preservando os links existentes. Isso remove a tela municipal distinta sem exigir renomear URLs. Caso a execução escolha outra rota canônica, manter a antiga com redirect HTTP ou o mesmo HTML selecionado; nunca depender apenas de redirecionamento JavaScript. A escolha técnica final deve ser registrada no ticket 38, com verificação da hospedagem e tamanho da saída.

Sem JavaScript, índice e links nativos levam à consulta renderizada no mesmo shell; links de Tipo devem apontar a conteúdo já presente no HTML, por âncora ou documento pré-gerado. Com JavaScript, seleção, estado compartilhável e histórico aprimoram o painel. Falha/demora de mapa não bloqueia busca/lista. O protótipo demonstrou o princípio com três seleções por âncora; geração nacional, redirects e navegação final são trabalho posterior.

## Verificação já executada e limites

Chromium: A/B/C × claro/escuro × 320/768/1280, com seleção regional e Eixos abertos, sem erros JavaScript capturados nem transbordamento horizontal global. Ajuda por clique, falha simulada, retorno/reabertura da seleção, busca por ↓/Enter e variantes por seta verificados. Metodologia em seis combinações de temas/larguras; seis visitas sem JavaScript com consultas estáticas. `astro check`: zero erros/avisos, 44 arquivos na captura final.

Não é auditoria completa: sem leitor de tela, dispositivo tátil real, contraste medido, zoom nativo ou revisão clínica. A implementação deve executar sua matriz de regressão; a auditoria e o orçamento globais continuam no ticket 25. A saída existente de cerca de 675 MB já excedia a meta de 30 MB; não aprovar expansão silenciosa. O JSON lista 5.571 municípios e a spec menciona 5.570; preservar os dados e encaminhar a reconciliação fora do redesenho visual.

## Execução posterior

- 36: sistema visual A, cabeçalho, controles, ajuda, legenda e rodapé; reaproveita 30/31.
- 37: consulta completa e painel responsivo; reaproveita 31/33.
- 38: Mapa/Lista, estado, links antigos e documentos estáticos sem JavaScript; reaproveita 09/32/33.
- 39: Metodologia no sistema A; reaproveita 34, sem substituir conteúdo dos tickets 22/24.

Ordem: 36 → 37 → 38; 39 pode seguir após 36. Não reabrir as entregas anteriores nem duplicar auditoria, cargas ou revisão clínica. O ticket 35 encerra a proposta e o handoff, sem implementar esses trabalhos.
