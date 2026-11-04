# 32: Busca e tabela independentes do mapa

**What to build:** o cidadão consegue encontrar seu município e consultar os resultados mesmo quando o mapa não inicializa; sem JavaScript, encontra uma lista de municípios por UF com links para as fichas. Referência: especificação de UI/UX da v1, seções Acesso sem mapa ou JavaScript e Critérios verificáveis; MVP §§2 e 11.

**Blocked by:** None (can start immediately).

**Status:** resolved

- [x] Com JavaScript, busca e tabela inicializam sem aguardar WebGL ou a inicialização do mapa; falha ou demora do mapa não impede seu uso
- [x] A tabela acompanha o estado indicador × Tipo de câncer × modo, com os mesmos valores, classes, origens e avisos da camada, respeitando estados sem Situação ou Tendência e dado insuficiente
- [x] Busca e tabela oferecem acesso à ficha municipal preservando Tipo de câncer e tema explícito quando presentes; a alternativa continua utilizável sem prévia ou mapa disponíveis
- [x] Falhas de carregamento dos próprios dados são explicadas com possibilidade de tentar novamente, sem tabela silenciosamente vazia nem resultados antigos apresentados como atuais
- [x] Sem JavaScript, a inicial entrega no HTML uma lista estática organizada por UF, com links para as fichas municipais, sem exigir interação com o mapa
- [x] Busca, resultados, tabela e índice funcionam pelo teclado, com ordem lógica, foco visível e anúncios acessíveis de resultados; informações permanecem compreensíveis sem depender só de cor
- [x] O acesso é verificado com JavaScript desativado e com falha de WebGL simulada; tabela e índice são legíveis nos dois temas a 320, 768 e 1280 px e zoom de 200%, limitando rolagem horizontal às tabelas; checagem e build passam


## Comments

- Implementação: `d097f56` — `Decouple municipality search and table from the map`.
- O commit de fechamento `Fix alternative navigation and verify native browser zoom` inclui os ajustes da revisão, os testes finais e este registro.
- Busca e tabela iniciam com a lista municipal, antes de importar o renderizador do mapa. Falhas da lista ou da camada têm explicação e botão de nova tentativa; mudanças de seleção limpam os resultados anteriores. Resultados da busca têm acesso direto à ficha, preservando o Tipo de câncer atual e o tema mesmo após mudar os controles.
- Índice municipal gerado no HTML, organizado por UF, com expansões e links nativos. Tabela apresenta modo, Referência, períodos, classes, valores, origem, qualidade e notas; ajuste C55 não calculável se distingue de dado insuficiente. A descrição refluível fica fora da rolagem horizontal, associada à tabela por `aria-describedby`.
- Validação em Chromium 156 com Playwright: 19 testes da página; WebGL indisponível, mapa pendente, falhas de lista/camada com recuperação, navegação por teclado, links e mudanças de estado. Matriz claro/escuro × 320/768/1280 px × JavaScript ativo/desativado, incluindo zoom nativo de 200% por `chrome.tabs.setZoom` e verificação da viewport CSS/DPR. Rolagem horizontal contida na tabela; capturas das seis combinações de tema/largura revisadas para legibilidade.
- Checagem Astro sem erros, avisos ou sugestões; build estático concluído (5.573 páginas); 37 testes do site e 151 testes do pipeline aprovados. O build mantém o aviso de tamanho do chunk do mapa; o pipeline mantém os avisos de separação perfeita dos modelos nas amostras de teste.
- Revisão `code-review`: padrões e spec revisados separadamente. Corrigidos o link de busca com Tipo de câncer anterior e a falta de verificação de zoom nativo; sem pendências na revisão final. A sessão com leitor de tela e a auditoria de lançamento permanecem no ticket 25; os anúncios desta entrega usam regiões de status, sem alegação de certificação.
- Reprodução dos testes: `site/browser-tests/README.md`.
