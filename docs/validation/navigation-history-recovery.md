# Histórico, links e recuperação da consulta

Entrega da [#49](https://github.com/kvojps/brazil-cancer-map/issues/49), parte da
[#44](https://github.com/kvojps/brazil-cancer-map/issues/44). Base da implementação:
`74c011f1748603e595523c136f64f1fdc17a1f1f`, branch `hml`.
Regras permanentes na spec, seções 11.1–11.2, e no contrato de interface.

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

O mapa agora oferece “Tentar mapa novamente”. Uma falha ao obter a malha libera
a instância incompleta; a tentativa seguinte refaz a aquisição, sem criar
histórico, abrir detalhes ou bloquear busca, Lista e consulta. Lista municipal,
camada e perfil mantêm seus próprios mecanismos de erro e nova tentativa.
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
| Malha 503 → Lista e consulta funcionais → Mapa → nova tentativa | `mobile-details`: falha somente de `municipalities.topojson`; repetição permite adquirir a malha, remove o aviso, deixa um canvas e mantém consulta recolhida e UF. Retry não acrescenta entrada. 390×844. |
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

## Execução e limites

Verificação local em Linux, Chromium emulado, em 16/11/2026 (America/Recife).
Dados publicados preservados; SHA-256 do manifesto:
`a6f0903b978833e46421793dc5ec38e192b6f0468fedf93c18fe39c682816082`.

- `npm run check --prefix site`: 84 arquivos, sem erros, avisos ou sugestões.
- `npm test --prefix site`: 88 testes aprovados; inclui build dos 5.574 documentos.
  A primeira execução falhou por import sem extensão na execução direta Node;
  a extensão foi corrigida e a suíte completa passou.
- `mobile-details.test.mjs`: 22 testes aprovados antes de adicionar o retry da
  malha; a execução final da suíte de navegador será registrada abaixo.

Conferência física Android/Google Chrome pertence à #52 e permanece pendente.
Esta execução não comprova teclado virtual, barras móveis, reconhecimento de
toque físico, iOS/Safari, Firefox ou acessibilidade humana com leitor de tela.
Ampliação e composição extrema continuam nos recortes #50–#51; as repetições
originais de primeira seleção/filtros/logo ficam nos relatórios das respectivas
entregas e na conferência conjunta. Não houve deploy, push ou alteração dos dados.
A issue pai #44 não é encerrada por esta entrega.
