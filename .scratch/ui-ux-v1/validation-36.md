# Verificação do Console horizontal — ticket 36

Execução em 04/11/2026, Chromium local via Playwright. Escopo: composição do Console A, cabeçalho, filtros, ajuda, legenda e rodapé. Painel completo, alternância Mapa/Lista e índice recolhido ficam nos tickets 37–38; reorganização da metodologia no 39. “Explorar em lista” abre e foca a alternativa textual existente nesta etapa.

## Verificações

- `npm run check --prefix site`: 42 arquivos, zero erros, avisos ou hints.
- `npm run test --prefix site`: 37 testes passaram. A suíte executa `astro build`, incluindo todos os documentos municipais. Build avisa sobre o chunk cartográfico acima de 500 kB; carregamento continua sob demanda.
- `SITE_URL=http://127.0.0.1:4325 npm run test:browser --prefix site`: 26 testes passaram. Inclui busca por teclado, falhas de WebGL/malha/lista/camada, nova tentativa, estado, C55, ausência de Situação, dois temas, 320/768/1280 px, JavaScript ativo/desativado e zoom nativo de 200%.
- Roteiro adicional contra a compilação estática: claro/escuro × 320/768/1280 px, sem transbordamento horizontal global e sem erros JavaScript capturados. Conferidos estado inicial até 60 dias × Todos × Tendência, painel oculto, abertura de ajuda por Enter e clique, fechamento por Escape e botão, retorno de foco ao acionador, mortalidade sem Situação e atualização de Referência na Situação.
- Roteiro adicional de zoom: extensão local existente com `chrome.tabs.setZoom(..., 2)`, dois temas × 320/768/1280 px. Confirmados `devicePixelRatio=2`, encaixe do popover na viewport, abertura por teclado, Escape, retorno de foco e ausência de transbordamento global.
- Ajuda usa Popover API nativa (`popover`, `popovertarget`), com descrições acessíveis e fechamento explícito. Explicações de classes não dependem de hover; cores e texturas continuam acompanhadas dos nomes. Ressalvas essenciais ficam visíveis; detalhes de origem e períodos usam expansão nativa.

Os roteiros adicionais e capturas foram usados como verificação manual assistida e ficaram em `/tmp/cancer-browser/`; não integram a suíte permanente. Não foram criados testes em novas fronteiras sem acordo prévio, conforme a skill TDD. Os testes existentes foram adaptados aos controles públicos separados de Indicador e Leitura.

## Recursos e orçamento

Primeira visita ao HTML compilado, contexto Chromium novo, sem cache, servidor HTTP local com gzip para HTML/CSS/JS/JSON. Medição via Resource Timing (`encodedBodySize` e `transferSize`), aguardando dados e mapa prontos; sem fontes ou mapa-base externos. Valores aproximados:

| Recurso | Corpo gzip |
| --- | ---: |
| HTML inicial (inclui índice estático) | 89 kB |
| CSS do dashboard e MapLibre | 12 kB |
| JS de experiência, estado e navegação | 14 kB |
| Municípios | 78 kB |
| Camada inicial de tratamento | 52 kB |
| Renderizador cartográfico | 289 kB |
| Worker MapLibre | 147 kB |
| Malha municipal | 713 kB |
| Total | 1,39 MB |

Transferência com overhead reportado pelo navegador: aproximadamente 1,40 MB. A referência de 1,3 MB é aproximada: o resultado excede 1,3 MB decimal em cerca de 7%; malha e MapLibre concentram o custo. Essa medição é local com gzip, não uma medição da CDN/Brotli nem aprovação do orçamento global.

Saída estática final: aproximadamente **677 MB** (`du -sb site/dist`, 677.135.316 bytes nesta execução), acima da meta de 30 MB e próxima dos cerca de 675 MB já registrados no handoff. O cabeçalho/rodapé compartilhados são replicados nos documentos municipais existentes. Não houve ampliação de JSON, pipeline nem pré-geração de novas combinações. O excesso permanece pendência de lançamento do ticket 25; o custo da solução de documentos municipais será tratado explicitamente no ticket 38. Esta entrega não aprova publicação ou esse excesso.

## Limites

Não é auditoria completa de acessibilidade ou revisão clínica. Sem leitor de tela, dispositivo tátil físico, medição de contraste ou avaliação de todos os municípios. Clique e teclado verificados; acionamento por toque depende do comportamento nativo do botão/popover e não foi exercido em hardware real. HPV permanece sem carga publicada, portanto a restrição de disponibilidade foi preservada, sem simular números ou converter ausência em dado insuficiente. O índice estático permanece na composição existente até o ticket 38.

## Standards

Revisão independente do diff desde `f20f181` identificou apenas o encerramento documental pendente do ticket; nenhum defeito adicional de padrões ou smell acionável. O ticket é atualizado no commit final.

## Spec

Revisão independente identificou a nota de Todos escondida e a falta do registro de validação. Corrigidos com síntese visível junto ao seletor e este registro; texto integral continua na ajuda. Também foi apontado o encerramento documental, atendido no commit final.

Resultado: Standards, 1 apontamento documental resolvido; Spec, 2 apontamentos e a pendência de encerramento resolvidos. Nenhuma mudança estatística identificada.
