# Histórico, links e recuperação da consulta

Implementação em andamento da [#49](https://github.com/kvojps/brazil-cancer-map/issues/49), parte da
[#44](https://github.com/kvojps/brazil-cancer-map/issues/44). Base da implementação:
`74c011f1748603e595523c136f64f1fdc17a1f1f`, branch `hml`.
Último build verificado: `144437b`, após `97a6f92` e `a9cc0ec`. A correção
posterior de enquadramento inicial está no commit que contém este relatório
e ainda precisa de build e validação de navegador. Regras permanentes na spec,
seções 11.1–11.2, e no contrato de interface.

## Comportamento

Cada entrada do histórico mantém seu contexto de leitura durante a visita:
Eixo e posições internas dos detalhes, UF, linhas abertas e posição da Lista.
O contexto é capturado antes da substituição da consulta, inclusive na seleção
pela busca a partir dos detalhes. Restaurar não cria entradas. O contexto fica
em memória do documento; não é persistido entre visitas nem acrescentado à URL.
Não há snapshot de câmera por entrada.

Seleção, limpeza, logo e restauração continuam usando a invalidação de respostas
do navegador existente. Interação deliberada cancela chegada e restauração de
posição pendentes, mantendo a conclusão do conteúdo atual. Links de Eixo usam a
entrada dos detalhes; âncora de chegada não cria etapa artificial. Recarga usa o
estado da URL e a âncora explícita, sem exigir a posição anterior.

O mapa agora oferece “Tentar mapa novamente”. Uma falha ao obter ou interpretar
a malha libera a instância incompleta; a tentativa seguinte refaz a aquisição, sem criar
histórico, abrir detalhes ou bloquear busca, Lista e consulta. A mensagem com
a nova tentativa fica na área disponível acima do resumo, com rolagem interna
quando necessária. O cancelamento da chegada também alcança a malha pendente:
ela pode terminar e destacar a seleção sem mover a câmera após interação.
Lista municipal, camada e perfil mantêm seus próprios mecanismos de erro e nova tentativa.
Falha de transporte não é Dado insuficiente, ausência no recorte ou ajuste C55
não calculável. Pipeline, estatística, dados e conteúdo clínico não mudaram.

## Evidências por percurso

Fronteira confirmada na #44: interface pública do navegador, ampliando suítes
existentes. As novas interações usam controles visíveis, sem clique forçado.

| Percurso/critério | Evidência automatizada |
| --- | --- |
| Detalhes → outro Eixo e leitura interna → Menu/Busca → logo → Voltar | `mobile-details`: restaura Eixo Prevenção, posição interna e Lista; contagem de entradas permanece estável na restauração. 390×844. |
| Lista PE, linha de Olinda aberta e rolada → Mapa → Lista RN → logo → Voltar/Avançar | `mobile-details`: cada entrada recupera UF, expansões e posição próprias, sem entradas adicionais. 390×844. |
| Recife em leitura → busca Natal com perfil retido → Voltar → liberar RN | `mobile-details`: primeira carga de RN controlada por rota HTTP, sem cache de perfil; Recife e sua leitura permanecem atuais após a resposta obsoleta e dois frames. 320×568. |
| Malha 503 ou topologia inválida → Lista e consulta funcionais → Mapa → nova tentativa | `mobile-details`: falha somente de `municipalities.topojson`, por HTTP 503 ou HTTP 200 com JSON sem a geometria esperada; repetição permite adquirir a malha, remove o aviso, deixa um canvas e mantém consulta recolhida e UF. Retry não acrescenta entrada. 390×844. |
| Busca com malha retida → Filtros/Escape → liberar malha | `map-touch`: compara nomes municipais em pontos públicos do canvas com a referência de Brasil, após composição e novos movimentos reais do mouse; consulta termina recolhida sem reenquadrar. Mesma camada e documento, malha retida na fronteira HTTP nas duas visitas. 390×844. |
| Âncora Prevenção → perfil PE 503 → retry → recarga | `mobile-details`: primeira tentativa controlada de perfil, erro distinto, retry bem-sucedido conserva resumo recolhido, URL e histórico; recarregar revela a âncora explícita. 390×844. |
| Detalhes deliberados, links entre Eixos, âncora direta e recarga | `mobile-details`: retorno explícito, foco, mesma entrada, retirada do hash, restauração de recortes e precedência da âncora. |
| Seleção/limpeza/logo durante carga e interação deliberada | `map-touch`, `logo-reset`, `mobile-details`, `list` e `integrated-profile`: recursos retidos, resposta supersedida, cache e nova tentativa; foco e conteúdo atuais. |
| Links canônicos, parâmetros inválidos, Tipo e modificadores | `municipality`, `map-alternatives`, `municipality-selection`, `logo-reset`; testes Node de normalização e navegação complementam a fronteira pública. |
| Transporte versus estados dos dados, sem WebGL | `map-alternatives`, `integrated-profile`, `municipal-panel` e auditoria dos estados: lista/camada/perfil, C55, Dado insuficiente, ausência no recorte, origem regional e Faixa C. |

O teste novo de Voltar durante carga falhou antes da correção por não recuperar
a leitura. O teste de retry da malha falhou antes de existir a ação de recuperação.
Tentativas iniciais de acesso direto à logo sob os detalhes não a acionavam;
o cenário foi corrigido para abrir Menu → Buscar município, como no percurso
existente da #48. Recargas do desenvolvimento também interferiram na preparação;
a verificação usa saída estática, separada do servidor de desenvolvimento.
A revisão encontrou ainda enquadramento tardio pela malha e limpeza incompleta
após erro de topologia. Ambos foram corrigidos e receberam cobertura pública.
O novo teste de geografia revelou que um movimento de mouse anterior à pintura
da malha não atualiza o tooltip sozinho; passou a repetir a observação pública
após recomposição, com limite de falha e sem pausa fixa. O retry também deixou
de ficar encoberto pelo resumo.

## Resultados e limites

Verificação local em Linux, Node 24.20.0 e Chrome for Testing
156.0.8078.4 (Chromium emulado), em 16–17/11/2026 (America/Recife).
Dados publicados preservados; SHA-256 do manifesto:
`a6f0903b978833e46421793dc5ec38e192b6f0468fedf93c18fe39c682816082`.

- `npm run check --prefix site`: 84 arquivos, sem erros, avisos ou sugestões,
  inclusive após a última correção de enquadramento inicial.
- `npm test --prefix site`: 88 testes aprovados no build de `144437b`; inclui
  build dos 5.574 documentos. A primeira execução falhou por import sem extensão
  na execução direta Node; a extensão foi corrigida e as repetições passaram.
- Suíte completa de navegador em `144437b`: **399 testes, 397 aprovados,
  2 falhos**, sem cancelamentos ou pulos, em aproximadamente 580 segundos,
  com dois arquivos simultâneos. Inclui ambas as suítes de acessibilidade:
  axe sem violações confirmadas, com verificações inconclusivas para revisão humana.
- Todas as regressões novas de histórico, posições, concorrência, foco,
  recuperação da malha e retry ancorado passaram nessa execução completa.
- `map-touch.test.mjs` repetido isoladamente no mesmo build: **21 testes,
  20 aprovados e 1 falho**, em aproximadamente 245 segundos. O teste de borda
  passou nessa repetição; a falha da logo persistiu.

A execução integrada usa o build estático servido localmente na porta 4339,
com `SITE_URL=http://127.0.0.1:4339` e `CHROMIUM_PATH` apontando para o Chrome
for Testing acima. Comando executado na raiz:

```sh
node --test --test-concurrency=2 site/browser-tests/*.test.mjs
```

### Falhas e última correção

1. `an unobstructed touch near the canvas edge does not shift a visible municipal boundary`:
   a preparação não encontrou município na borda desobstruída. Passou na repetição
   serial; essa repetição não apaga a falha nem comprova ausência de intermitência.
2. `390px: logo restores country geography while clearing selection preserves exploration`:
   o reset mostrava Urucará/AM no ponto que inicialmente mostrava Bonfim/RR.
   A falha foi reproduzida em série e também segurando a malha até a camada concluir.

Causa identificada da segunda falha: na inicial sem município, a conclusão da
camada restaura a navegação com `close(false)`. A limpeza, mesmo sem seleção,
emitia cancelamento de chegada. Se isso acontecesse antes da malha, o Mapa inicial
conservava a câmera do construtor, enquanto a logo aplicava o enquadramento normal.
A última correção limita esse cancelamento à limpeza de uma seleção existente;
a restauração de histórico continua tendo seu cancelamento próprio. O teste da
logo agora retém a malha até a camada terminar para controlar essa ordem.
A revisão estática confirmou essa correção; **o navegador ainda não a validou**.

### O que falta para concluir a #49

- Gerar novo build e repetir `npm test --prefix site` após a última correção.
- Executar `map-touch.test.mjs` isoladamente, incluindo a ordem controlada
  camada → malha, o teste de borda e o reset em 390/1280 px.
- Repetir a suíte completa com `--test-concurrency=1`, investigar qualquer falha
  restante e registrar o resultado da revisão efetivamente testada.
- Atualizar este relatório e os critérios da issue; encerrar a #49 somente após
  resolver as falhas e concluir as verificações pendentes.

O responsável pediu para registrar o progresso e commitar neste ponto, antes de
concluir essa validação. A issue permanece aberta. Os commits são locais na
branch `hml`, sem push ou deploy nesta execução.

Conferência física Android/Google Chrome pertence à #52 e permanece pendente.
Esta execução não comprova teclado virtual, barras móveis, reconhecimento de
toque físico, iOS/Safari, Firefox ou acessibilidade humana com leitor de tela.
Ampliação e composição extrema continuam nos recortes #50–#51; as repetições
originais de primeira seleção/filtros/logo ficam nos relatórios das respectivas
entregas e na conferência conjunta. Não houve deploy, push ou alteração dos dados.
A issue pai #44 não é encerrada por esta entrega.

## Revisão do código

Duas revisões independentes compararam a entrega à base: Standards, sem
violações ou smells acionáveis; Spec, com dois achados P2 corrigidos no
`a9cc0ec`. A segunda revisão confirmou ambas as correções. A conferência complementar
encontrou um terceiro P2 no retry após falha de chegada por âncora: a chegada
pendente sobrevive ao erro e expande a consulta na tentativa seguinte. A falha
foi reproduzida e corrigida em `144437b`, consumindo somente a chegada pendente;
a URL conserva a âncora para uma recarga explícita. O novo teste também passou.
As execuções intermediárias interrompidas durante as revisões não são contadas
como aprovação completa. As duas falhas da execução completa e a correção
posterior ainda não validada estão registradas acima.
