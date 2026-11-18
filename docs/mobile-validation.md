# Verificação mobile

## Reprodução automatizada

Prepare Chromium e a prévia estática conforme o [guia de desenvolvimento](development.md#testes-e-verificações).
Execute `npm test` antes de iniciar a prévia: ele também reconstrói a saída.
Não reconstrua o site durante os testes. Com a prévia disponível, execute da raiz:

```sh
export SITE_URL=http://127.0.0.1:4322
export CHROMIUM_PATH=/caminho/para/chromium
npm run test:browser --prefix site
MOBILE_REPORT_DIR=/tmp/mobile-search node site/scripts/verify-mobile-navigation.mjs
MOBILE_ARRIVAL=canvas MOBILE_REPORT_DIR=/tmp/mobile-canvas node site/scripts/verify-mobile-navigation.mjs
```

O roteiro percorre primeira seleção → Filtros → Escape → logo, com dez tentativas
frias e dez com cache da aplicação por viewport (320×568 e 390×844).
A busca seleciona Recife; `MOBILE_ARRIVAL=canvas` usa toque emulado no mapa.
Frio significa contexto novo. Cache significa preparar a mesma seleção no mesmo
documento e retornar pela logo; não comprova cache de disco ou persistência entre
visitas. No canvas, a preparação conserva a câmera e exige a mesma URL municipal
sem novas respostas de perfil/documento. `MOBILE_REPORT_DIR` recebe os registros
por tentativa e capturas de falha. Preserve falhas mesmo se uma repetição passar.

A suíte completa inclui os dois arquivos de `test:a11y`. Para executá-la em série,
use `node --test --test-concurrency=1 site/tests/browser/*.test.mjs`.
`A11Y_REPORT_DIR` permite guardar relatórios axe com verificações inconclusivas.
Emulação não comprova teclado, barras do navegador, toque, CPU ou GPU físicos.
JavaScript desativado, falhas por recurso, zoom nativo e fonte ampliada têm
cenários próprios; não equivalem à configuração de texto do Android.
Firefox, Safari e leitor de tela continuam sem sessão registrada.
Veja também a [auditoria de acessibilidade](validation/accessibility-audit.md).

## Matriz de transições

Referência dos IDs usados no roteiro físico. Os nomes correspondem aos arquivos
em `site/tests/browser/`, com sufixo `.test.mjs`. A matriz descreve cobertura e
resultados esperados; não declara aprovação da revisão atual.

| ID / origem → sequência | Critério/esperado e evidência observável | Cenários executados |
| --- | --- | --- |
| T01 inicial → abrir `/` | Brasil, padrões omitidos, sem painel vazio; geometria da primeira tela | `phone-first-screen`, `desktop-first-screen`; `map-touch`: logo restaura geografia nacional |
| T02 exploração → tocar canvas | Resumo recolhido, hover removido, foco no canvas, câmera preservada | `map-touch`: hybrid device, first cold canvas touch, outline e geografia; série canvas |
| T03 busca → resultado/Enter | Busca fecha, caminho municipal, nome focado, resumo atual | `map-touch`: cold keyboard search e search frames Recife; `mobile-surfaces`; série search |
| T04 Lista → nome/expandir/última linha | UF, expansão, filtros e rolagem interna; última linha/foco acima do resumo | `list`: floating list; `municipality-selection`; `mobile-reading` |
| T05 Mapa → Lista → Mapa | Consulta preservada, posições e geografia recuperadas | `mobile-details`: returning from list details; `map-touch`: hybrid device; `map-alternatives`: list replaces map |
| T06 resumo → tocar texto | Não expande nem rola | `mobile-details`: details are deliberate; `municipal-panel`: collapsed summary |
| T07 resumo → Ver detalhes | Abre Eixo do Indicador e entrada deliberada, nome focado | `mobile-details`: details are deliberate; `municipal-panel`; `map-touch`: direct link/search |
| T08 detalhes → recolher | Preserva seleção/recorte/exploração; retorno por histórico ou remoção de hash | `mobile-details`: anchors, list return, links between axes |
| T09 consulta → abrir superfície | Só uma, sem entrada; foco e leitura conservados | `mobile-surfaces`: temporary surfaces e details commands; `phone-first-screen` |
| T10 superfície → fechar/Escape/fora | Foco no invocador visível; busca cancelada conserva consulta; filtros persistem | `mobile-surfaces`; `phone-first-screen`: menu; série de filtros |
| T11 teclado real → Voltar físico | Pode dispensar apenas teclado; registrar comportamento do Chrome | **Não executado**, exige aparelho: roteiro físico, passo 5 |
| T12 detalhes → trocar Indicador | Permanece aberto no Eixo do novo Indicador, URL normalizada | `mobile-details`: details keep the reading axis; `integrated-profile` |
| T13 detalhes → trocar Tipo | Conserva Eixo; normalização que muda Indicador abre Eixo correspondente; Ações sem número | `mobile-details`: details keep the reading axis e unavailable result |
| T14 consulta → limpar | Retira município/contorno, conserva filtros/câmera e foco visível | `integrated-profile`: returning from clearing; `map-touch`: logo restores country geography while clearing preserves exploration |
| T15 consulta → logo | Brasil/Mapa/padrões, sem painel/superfícies, tema mantido; histórico/foco | `logo-reset`: list and municipal details, closes surfaces, pending response; `map-touch`; séries adicionais |
| T16 leitura/menu → Mapa | Conserva contexto, distinto da logo | `logo-reset`: metodologia e municipios; `reading-pages` |
| T17 link municipal → chegar | Documento canônico, resumo sem etapa artificial; modificadores nativos | `municipality`, `mobile-details`, `logo-reset`: modified activation; `map-touch`: direct link |
| T18 âncora de Eixo/Tipo → chegar | Destino explícito prevalece, detalhes na mesma entrada | `mobile-details`: municipal anchors; `municipality`: native anchors |
| T19 detalhes → link entre Eixos | Destino visível/focado; hash por replace, sem etapa adicional | `mobile-details`: links between axes |
| T20 consulta → Voltar/Avançar/recarga | Restaura URL/detalhes/leitura/Lista, sem push na restauração; recarga revela âncora | `mobile-details`: history restores, Back during new profile load, reloading; `map-alternatives`: invalid state, directory link survives reload |
| T21 carga → nova seleção | Só consulta atual aparece/foca; resumo recolhido | `integrated-profile`: delayed previous municipality; `map-touch`: delayed first touch/new selection; `mobile-details`: new search supersedes anchor |
| T22 carga → limpar/logo | Resposta anterior não reabre nem toma foco | `map-touch`: delayed first touch/clear; `logo-reset`: pending municipal response |
| T23 carga → interação deliberada | Conteúdo conclui sem direcionamento tardio | `map-touch`: mesh pending, deliberate internal scroll; `mobile-details`: deliberate scrolling during anchored load |
| T24 falha → Tentar novamente | Mensagem própria, sem Dado insuficiente falso ou detalhes involuntários | `integrated-profile`: profile failure; `map-alternatives`: layer/list failure; `mobile-details`: mesh failure e anchored retry; `map-touch`: search retry |
| T25 viewport → rotação/altura/ampliação | Consulta/Eixo/histórico preservados; foco/controles e rolagens internas | `mobile-reading`, `phone-first-screen`: native 200%; `municipal-panel`: native 200%; `map-touch`: rotation |
| T26 extremo → recuperar altura | Aviso/barra/conteúdo alcançáveis e leitura limitada só ao máximo novo; sem histórico adicional | `mobile-details`: extreme height with 200% CSS text em ambos os temas; `map-touch`: recovery |
| T27 WebGL/malha falha ou pendente → alternativas | Busca/Lista/consulta funcionam sem canvas | `map-alternatives`: WebGL fails, pending map; `mobile-details`: mesh transport/invalid topology retry |
| T28 leitura/sem JS → navegar | Rolagem normal; HTML municipal com seis Tipos/quatro Eixos/Ações e links nativos | `reading-pages`, `municipality`, `municipal-panel`, `map-alternatives` |
| T29 estados de resultado → ler e agir | Regional/Faixa C/resumo longo, próstata integral, insuficiente, mortalidade e ausência distinguíveis | `municipal-panel`: Alcântara, Balsas, Araioses, prostate, mortality, extreme summary; `integrated-profile`; `mobile-details`: unavailable result; `map-alternatives`: C55 |

T20 agrupa recarga com travessia do histórico; T29 explicita os estados
complementares da #38. T11 é a única transição integralmente reservada ao
aparelho. Em T03, T25 e T26, dispensa de teclado, barras móveis e viewport visual
físicos continuam pendentes apesar da cobertura emulada das ações correspondentes.


## Conferência em aparelho físico


Roteiro preparado pela [#51](https://github.com/kvojps/brazil-cancer-map/issues/51)
para a [spec #44](https://github.com/kvojps/brazil-cancer-map/issues/44).
**Não executado. Obrigatório antes de encerrar a #44.** Emulação e observações
anteriores em Samsung Internet não preenchem este registro.

### Identificação obrigatória

| Campo | Preencher no aparelho |
| --- | --- |
| Data e responsável | Pendente |
| Modelo do aparelho e versão Android | Pendente |
| Versão completa Google Chrome | Pendente |
| URL acessível pelo aparelho | Pendente; localhost do computador não é acessível pelo telefone |
| Revisão do site | Referência automatizada anterior: `ad83c2b5894b5d3aa621cdec858cb5e028725b18`; para o aviso corrigido, usar o commit da #53 e confirmar a revisão efetivamente servida |
| Dados | SHA-256 do manifesto: `a6f0903b978833e46421793dc5ec38e192b6f0468fedf93c18fe39c682816082`; confirmar na URL testada |
| Viewport CSS e orientação | Registrar antes/depois de teclado e rotação |
| Tema | Claro e escuro |
| Ampliação | 100% e 200%; registrar se zoom da página, tamanho do texto do Chrome ou configuração Android |
| Rede/cache | Wi-Fi/dados, condição de lentidão, cache frio ou previamente carregado |

Se a revisão mudar, registrar resultados separadamente e repetir os percursos
afetados. Nenhum deploy é exigido por este roteiro. O responsável deve obter uma
URL da revisão que decidiu testar antes de iniciar.

### Registro por execução

Copiar para cada cenário: ID da matriz automatizada, configuração, URL inicial,
município/Indicador/Tipo/modo/visualização, sequência exata, esperado, observado,
tentativas/ocorrências, aprovado/falho/não executado (motivo), relato reproduzido
ou não reproduzido nas tentativas, captura/vídeo e URL final. Registrar foco
visível e qual área rolou; distinguir observação visual de medição instrumentada.
Preservar falhas mesmo quando uma nova tentativa passar.

### Sequência no aparelho

1. **T01–T05:** abrir `/`, reconhecer Brasil e padrões sem painel vazio.
   Arrastar e ampliar o mapa com os dedos; tocar municípios. Conferir resumo
   recolhido, câmera, filtros, ausência de rolagem externa e hover residual.
   Buscar Recife por toque e Enter, cancelar outra busca. Abrir Lista, escolher PE,
   expandir Olinda e selecionar pelo nome; alcançar a última linha acima do
   resumo. Alternar Mapa/Lista e conferir UF, expansão, posição e câmera.
2. **T06–T10, T12–T14:** tocar texto do resumo (não expande), Ver detalhes,
   quatro Eixos e Ações. Abrir e fechar Legenda junto ao resultado, pelo controle
   e por Escape, e conferir o retorno do foco. Trocar Tipo de câncer nos detalhes
   e conferir o Eixo em leitura. Usar o × “Fechar detalhes” e conferir o mesmo
   Mapa ou Lista, com foco em “Ver detalhes”. Na exploração, abrir Busca e
   Filtros. Usar o × “Limpar seleção” no resumo e conferir filtros e exploração.
3. **T15–T20:** logo reinicia Brasil/Mapa/padrões sem município e mantém tema;
   repetição no estado inicial não cria etapa. Voltar recupera consulta e
   Avançar recupera reset. Ir a Como calculamos e retornar pelo item Mapa com
   contexto. Abrir link municipal e âncoras de Eixo/Tipo; recarregar; atravessar
   Voltar/Avançar com Lista, filtros, detalhes e leitura. Não exigir câmera
   persistida após recarga. Links modificados devem continuar nativos.
4. **T21–T24:** em rede lenta, selecionar outro município durante a carga;
   repetir limpando e pela logo. Interagir deliberadamente enquanto aguarda:
   resposta antiga não muda consulta, foco ou leitura. Induzir falha de rede,
   registrar recurso efetivamente afetado e tentar novamente; retry não abre
   detalhes. Não classificar falha de rede como Dado insuficiente. Simulação
   global offline não demonstra isoladamente cada falha por recurso.
5. **T11, T25–T26:** ler resumo/detalhes com teclado real aberto; Voltar físico pode
   primeiro dispensar só teclado — registrar a sequência observada. Mostrar e
   esconder barras do Chrome; girar retrato/paisagem; reduzir altura com teclado
   e ampliar a 200%. Conferir o ciclo do aviso descrito abaixo. Alcançar nome,
   Fechar detalhes, Legenda, Tipo de câncer e Ações por rolagens internas.
   Na exploração, conferir Busca e Filtros. Recuperar espaço e
   conferir Eixo, leitura, URL/histórico e consulta. Mapa não precisa permanecer
   simultaneamente visível no extremo.
6. **Estados de conteúdo:** repetir leitura e saídas com Alcântara (regional e
   Faixa C/resumo longo), Balsas, Araioses (Dado insuficiente), Recife/próstata
   (ressalva integral), mortalidade (sem Situação) e ausência no recorte.
   Confirmar os estados nos dados da revisão, sem presumir composição pelo nome.
7. **T27–T28:** conferir alternativas se mapa falhar, consulta por busca/Lista,
   páginas de leitura e índice por UF; desativar JavaScript no Chrome e abrir
   documento municipal com seis Tipos, quatro Eixos, Ações e rolagem normal.

### Repetições e encerramento

Para os três relatos originais — primeira seleção/resumo, apresentação dos
filtros e logo após seleção — executar **10 tentativas frias e 10 com cache por
cenário-alvo**. No frio, limpar dados do site e confirmar nova visita; no cache,
declarar exatamente o que foi previamente carregado. Não usar uma tentativa de
cada condição como substituto da série. Registrar os denominadores por cenário,
orientação e configuração escolhida; não é exigido produto cartesiano de todas
as condições. Para filtros, distinguir controles em fluxo, popover aberto e
fixação indevida no topo da viewport.

Todos os campos e resultados continuam pendentes. A #52 deve registrar as
evidências na revisão efetivamente testada; a #44 exige ainda sua conferência
conjunta. iOS/Safari não executado por falta de aparelho; Firefox e leitor de
tela não executados, sem sessão disponível. Não declarar compatibilidade ou
acessibilidade humana com base no axe ou no Chromium emulado.

### Reconferência do aviso corrigido — #53

A falha histórica da abertura continua registrada separadamente: na revisão
`da45e329f4687f5e48ebb297b128446e2e271c0c`, a emulação reproduziu faixa de
16 px que cortava o texto. Isso não substitui nem reclassifica a observação física
relatada pelo responsável. A [issue da correção](https://github.com/kvojps/brazil-cancer-map/issues/53)
identifica os arquivos e testes da nova revisão; usar o commit da entrega #53
referenciado na issue, conferindo que a URL do aparelho realmente o serve.

1. Abrir a revisão corrigida em retrato, teclado fechado, em claro e escuro.
   Ler integralmente “Em construção. Dados ainda não validados; podem conter
   erros e mudar.” logo na abertura, sem rolar a faixa. Registrar viewport real;
   as referências emuladas são 320 × 568 e 390 × 844.
2. Reduzir altura com teclado real e em paisagem; ampliar texto a 200%, registrando
   o mecanismo. Quando faltar espaço, conferir “Em construção · Ler aviso” legível
   e acionável. Não exigir compactação se ainda houver espaço para texto e interface.
3. Acionar Ler aviso: alcançar todas as linhas por rolagem interna, com Fechar
   acessível e foco visível. Fechar mantém a faixa compacta e retorna foco ao
   acionador. Com teclado externo, conferir Esc. Registrar separadamente o que o
   primeiro Voltar físico faz, sem pressupor que se comporte como Esc.
4. Recuperar altura com leitura fechada e aberta. A faixa integral reaparece;
   leitura aberta continua acessível e não perde foco. Ao fechá-la, foco vai à
   mensagem integral se o acionador já desapareceu. Compactar novamente com
   essa mensagem focada deve levar o foco a Ler aviso.
5. Abrir Legenda nos detalhes ou Busca, menu do cabeçalho e Filtros na Lista,
   depois acionar Ler aviso. Conferir uma superfície por vez. Ao fechar, manter município,
   Tipo, Indicador, Eixo, visualização, leitura e posições dentro do novo máximo.
   Abrir/fechar o aviso não cria entrada no histórico nem altera a URL.

Registrar nova execução, tentativas, esperado/observado, capturas e limitações
sem apagar a falha histórica. Android/Chrome físico, barras móveis e teclado
real continuam **não executados pelo agente**. A #52 e a spec pai #44 permanecem
abertas até suas próprias verificações.

## Espaçamento dos controles — #55

A [conferência dos controles de Meu município](validation/mobile-controls.md)
registra dimensões, distâncias, alinhamento e texto ampliado, com capturas de
320 × 568, 568 × 320 e 568 × 160. Amplia T06–T10 e T25–T26 da matriz,
preservando o contrato de rolagem interna. A evidência é emulação de Chromium;
não preenche a conferência física da #52 nem encerra a spec #54.
