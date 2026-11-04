# 33: Meu município responsivo e navegável sem JavaScript

**What to build:** a página própria Meu município oferece a ficha completa no padrão visual compartilhado, com leitura e acesso aos Tipos de câncer mesmo sem JavaScript. Referência: especificação de UI/UX da v1, seções Páginas e navegação, Acesso sem mapa ou JavaScript e Critérios verificáveis; MVP §§10 e 11.2.

**Blocked by:** 30 — Temas e navegação compartilhados.

**Status:** resolved

- [x] A ficha mantém quatro Eixos empilhados, Acesso ao tratamento primeiro e Onde se tratar junto do tratamento; o desenho dos cartões segue o padrão visual compartilhado e se adapta ao conteúdo
- [x] Tipo de câncer e tema explícito são preservados na navegação entre inicial e ficha; indicador e modo do mapa não restringem o conteúdo dos quatro Eixos
- [x] Sem JavaScript, o HTML contém indicadores, ressalvas, Ações, fontes, navegação e links por âncoras aos blocos de cada Tipo de câncer, sem depender de interpretar query string no servidor
- [x] Com JavaScript, o filtro por Tipo de câncer continua funcionando e os links diretos aos tipos levam a conteúdo visível e pertinente
- [x] Ação, origem territorial, período e ressalvas essenciais ficam visíveis; detalhes extensos usam expansões ou links para as seções pertinentes da Metodologia, sem substituir textos clínicos por exemplos do protótipo
- [x] Permanecem corretos origem regional, dado insuficiente, faixa C, ausência de carga, períodos distintos, HPV sem Tendência, mortalidade sem Situação, ajuste não calculável e ausência de Situação no tratamento/próstata, sem duplicar regras editoriais divergentes da prévia
- [x] Cartões, navegação e expansões funcionam pelo teclado, com foco visível e ordem lógica; a ficha é verificada com e sem JavaScript, nos dois temas, a 320, 768 e 1280 px e zoom de 200%, sem cortes e com altura natural no celular
- [x] Checagem e build passam; a implementação preserva o carregamento de detalhes sob demanda e evita repetir recursos desnecessariamente na saída estática


## Comments

### Implementação e validação — 2026-11-04

Commit: `feat: make municipal profiles navigable without JavaScript` (este commit).

- Navegação por Tipo de câncer com seis destinos estáticos `#tipo-*`, sem interpretação de query string no servidor. Com JavaScript, a âncora direta seleciona conteúdo visível, sincroniza o tipo na URL e marca o link atual. Links de Eixos permanecem disponíveis e indicador/modo não restringem os quatro Eixos. Tipo, tema e contexto de retorno continuam usando a navegação compartilhada.
- Ficha com título principal, largura de leitura, cartões de altura natural, navegação que quebra linhas e rolagem de tabelas contida nas expansões. Onde se tratar permanece junto do tratamento e usa a mesma superfície dos cartões. Componentes e textos clínicos existentes foram preservados; nenhuma regra estatística ou editorial nova foi criada.
- `npm run check --prefix site`: zero erros, avisos ou sugestões. `npm test --prefix site`: 37 testes passando, incluindo build completo e regressões de origem regional, dado insuficiente, faixa C, próstata, períodos distintos, ausência de carga, HPV e mortalidade/ajuste. `npm run test:browser --prefix site`: 26 testes passando, dos quais sete cobrem a ficha municipal. `git diff --check` passou. Execução de Chromium e do subprocesso de build exigiu sair do sandbox.
- Ficha verificada com e sem JavaScript, em claro/escuro, a 320, 768 e 1280 px, com expansões abertas e zoom CSS e nativo de 200%. O teste nativo confirma largura CSS pela metade e densidade duplicada. Links por tipo, âncora divergente do filtro, foco visível, ativação de link e expansão pelo teclado e retorno com tipo/tema verificados. Inspeção visual adicional a 320 px no tema escuro. Essa verificação não substitui a auditoria de acessibilidade do ticket 25.
- Saída conferida: 5.571 fichas, 27 arquivos compartilhados por UF; a ficha Recife tem 126.108 bytes de HTML (14.986 bytes gzip) e referencia dois scripts compartilhados. Nenhum recurso de mapa ou cópia de JSON por município foi acrescentado; o carregamento dos detalhes da prévia sob demanda permanece intacto. O tamanho total da saída existente é cerca de 675 MB; esta mudança não resolve o orçamento global do site.
- Revisão `code-review` por agentes independentes: Padrões sem violações remanescentes, após desacoplar o seletor CSS do texto acessível de Onde se tratar; Spec sem problemas funcionais remanescentes após conferir as evidências de validação.
