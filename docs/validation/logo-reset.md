# Recomeçar a exploração pela logo

Entrega da [#48](https://github.com/kvojps/brazil-cancer-map/issues/48), parte da
[#44](https://github.com/kvojps/brazil-cancer-map/issues/44). Regras permanentes
na spec, seção 11.1, e no contrato de interface, seção Páginas e navegação.

## Comportamento

A logo tem destino nativo `/`, levando somente o tema válido explícito quando
há JavaScript. No dashboard pronto, sua ativação comum reinicia a exploração
sem recarregar o documento: Mapa, Brasil inteiro, até 60 dias × Todos os cânceres
× Tendência, sem seleção, detalhes, âncora ou superfície temporária. As cargas
municipais e chegadas anteriores são invalidadas pelo mecanismo de navegação
existente. O foco de teclado permanece na marca. Modificadores continuam usando
o link nativo; sem JavaScript, o link raiz acompanha o tema do sistema.

O reset cria uma entrada quando muda a URL e repetir no estado inicial não
acrescenta outra. Voltar recupera a consulta e Avançar o reset. O item Mapa
continua carregando o contexto, inclusive desde páginas de leitura. Limpar
seleção conserva filtros, visualização e câmera; recolher conserva a consulta.
A câmera é reenquadrada pelo reset tanto em mobile quanto em desktop.

A interface pública do navegador é a fronteira confirmada na #44. Não há API
interna de testes. Pipeline, estatística, Contrato de dados e conteúdo clínico
não mudaram. A integração de posições internas e novas superfícies permanece
no ticket de histórico, conforme o recorte da #48.

## Evidências por transição

| Origem e ação | Cobertura |
| --- | --- |
| Lista e detalhes com âncora → logo | `logo-reset`: tema escuro, foco visível por Enter, padrões, painel fechado, uma entrada, repetição sem duplicação, Voltar/Avançar. Em mobile, Menu → Buscar município torna a marca acessível sem forçar clique em controle oculto. |
| Busca, Filtros, Legenda ou Menu aberto → logo | `logo-reset`: quatro cenários, superfícies fechadas, sem foco devolvido ao invocador oculto, filtros padrão e ausência de tema explícito. |
| Consulta municipal pendente → logo | `logo-reset`: primeira carga de PE retida na fronteira HTTP; resposta liberada após reset; URL, painel e foco permanecem no estado inicial; Voltar ainda recupera Recife. |
| Páginas de leitura → Mapa ou logo | `logo-reset`: metodologia e índice por UF; Mapa conserva seleção, Tipo, Lista e tema; logo leva somente tema claro. |
| Link nativo | `logo-reset`: Ctrl+clique abre reset em outra aba sem mudar a consulta original; sem JavaScript, raiz nativa sem seleção. |
| Limpar seleção versus logo | `map-touch`: rótulos geográficos públicos em pontos do canvas demonstram câmera local preservada pela limpeza e Brasil restaurado pela logo, a 390 e 1280 px. |
| Logo após primeira seleção, carga fria/cache | `logo-reset`: dez contextos novos em 320×568; dez tentativas no mesmo contexto em 390×844, previamente aquecido com o documento de Recife e seus dados. Recarregar preserva cache HTTP do contexto, sem prometer cache de rede real ou memória JS entre documentos. |
| Compatibilidades | Suítes existentes de desktop, leitura, município estático, zoom, temas e sem JavaScript; auditorias axe e estados do mapa. |

## Revisão e execução em 16/11/2026

Base: `115d8a8448074585703d333b4d01a78b83f7cdd7`, branch `hml`.
Implementação inicial: `da52ec3`; runtime e testes finais: `e4d71d8`.
O build final usa essa revisão; somente este relatório muda após a execução. Dados publicados preservados; SHA-256 do manifesto:
`a6f0903b978833e46421793dc5ec38e192b6f0468fedf93c18fe39c682816082`.
Ambiente final: Linux, Node 24.20.0, Google Chrome for Testing
156.0.8078.4 (Chromium 1248 do Playwright), headless, toque emulado.

A primeira regressão falhou contra o comportamento anterior: a logo preservava
filtros e seleção. Uma rodada intermediária tentou acionar a marca oculta por
trás dos detalhes mobile e não navegou; a preparação passou a usar Menu → Buscar
município, sem clique forçado nem alteração do contrato de composição.
A primeira suíte Node foi bloqueada pelo sandbox ao criar subprocessos
(`spawnSync npm EPERM`); sua repetição autorizada passou em 88/88, em 23,37 s.
Os nove cenários iniciais passaram em desenvolvimento em 28,06 s. A checagem
de tipos passou com 83 arquivos e zero diagnósticos.

A revisão independente usou a base acima nos eixos Standards e Spec:

- Standards: zero violações documentadas e uma possível duplicação de baixo
  impacto. O fechamento completo passou a reutilizar a coordenação existente
  de superfícies, removendo o bloco duplicado.
- Spec: nenhuma divergência funcional comprovada; uma pendência documental
  de registrar revisão, execução e limites, atendida por este relatório.

A primeira rodada estática dirigida teve 26/28 aprovações: as duas comparações
novas de câmera falharam. No desktop, fechar o painel devolve largura ao canvas;
o teste passou a comparar pontos relativos ao centro, preservando a verificação
de zoom e posição geográfica. A comparação após o reset também passou a aguardar
o rótulo público esperado após a pintura WebGL, em vez de presumir que dois
frames do documento comprovam pintura do mapa. A rodada intermediária de câmera
falhou em 2/2 antes dessa correção da espera. O reset agora também finaliza o
enquadramento quando a camada e a legenda padrão estiverem prontas.

A revisão suplementar de Spec encontrou uma corrida entre reset pendente,
nova seleção e limpeza posterior: o reset poderia enquadrar Brasil na limpeza.
Selecionar um município agora cancela a intenção anterior de enquadramento.
O cenário HTTP controlado reproduziu a falha no build anterior: as duas
comparações de país passaram, mas a limpeza após nova seleção perdeu a
geografia local (2/3 aprovados na rodada, em 67,94 s). Standards confirmou a remoção
da duplicação; Spec considerou a corrida resolvida por leitura, condicionada
à execução sobre o build atualizado.

A revisão final independente de `115d8a8...e4d71d8` confirmou zero achados
pendentes nos dois eixos; a aprovação automatizada depende dos resultados abaixo.

- `npm run check --prefix site`: 83 arquivos, zero diagnósticos.
- Arquivo Node de navegação compartilhada: 11/11 aprovados.
- `npm test --prefix site`: 88/88 aprovados, em 27,88 s, incluindo build estático.
- Logo após seleção: 10/10 tentativas frias e 10/10 com cache aprovadas;
  zero preservações indevidas de seleção ou filtros nas vinte tentativas.
- Geografia: país restaurado a 390 e 1280 px; limpeza conserva exploração
  local; nova seleção cancela enquadramento pendente. Os três passaram na
  rodada final, em 20,68 s, 24,17 s e 9,94 s, respectivamente.
- Suíte completa de navegador: **392/392 aprovados**, zero falhas,
  cancelamentos ou ignorados, em 514,38 s. Inclui as duas auditorias
  automatizadas de acessibilidade. Axe não encontrou violações, mas manteve
  verificações inconclusivas para revisão humana.
- `git diff --check`: sem problemas de espaços em branco.

Comandos finais, sequenciais para build/prévia:

```sh
npm run check --prefix site
node --test --test-isolation=none site/tests/shared-navigation.test.mjs
npm run preview --prefix site -- stop
npm test --prefix site
npm run preview --prefix site -- --host 127.0.0.1 --port 4332
SITE_URL=http://127.0.0.1:4332 CHROMIUM_PATH=/home/kvojps/.cache/ms-playwright/chromium-1248/chrome-linux64/chrome node --test --test-concurrency=2 site/browser-tests/*.test.mjs
```

A suíte completa inclui as auditorias automatizadas de acessibilidade. A URL
local da revisão testada é `http://127.0.0.1:4332`. Não houve build simultâneo.


## Limites e pendências

Emulação não comprova Android/Google Chrome físico, teclado virtual real ou
barras móveis. A conferência no aparelho exigida pela #44 e atribuída à
[#52](https://github.com/kvojps/brazil-cancer-map/issues/52) continua **não executada** e deve registrar aparelho/versões, URL/revisão, viewport, orientação,
tema, ampliação e rede/cache. Não houve validação física nesta entrega.
A implementação não encerra a especificação pai #44. A integração de histórico
e posições internas segue na #49, a verificação conjunta na #51 e a conferência
física na #52; o fechamento da pai depende dos critérios e verificações conjuntos. iOS/Safari, Firefox e leitor de tela
humano continuam sem validação. A repetição finita não garante ausência de
intermitência. Não houve atualização de dados, Release ou deploy.
