# Conferência física Android/Google Chrome — #52

Roteiro preparado pela [#51](https://github.com/kvojps/brazil-cancer-map/issues/51)
para a [spec #44](https://github.com/kvojps/brazil-cancer-map/issues/44).
**Não executado. Obrigatório antes de encerrar a #44.** Emulação e observações
anteriores em Samsung Internet não preenchem este registro.

## Identificação obrigatória

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

## Registro por execução

Copiar para cada cenário: ID da matriz automatizada, configuração, URL inicial,
município/Indicador/Tipo/modo/visualização, sequência exata, esperado, observado,
tentativas/ocorrências, aprovado/falho/não executado (motivo), relato reproduzido
ou não reproduzido nas tentativas, captura/vídeo e URL final. Registrar foco
visível e qual área rolou; distinguir observação visual de medição instrumentada.
Preservar falhas mesmo quando uma nova tentativa passar.

## Sequência no aparelho

1. **T01–T05:** abrir `/`, reconhecer Brasil e padrões sem painel vazio.
   Arrastar e ampliar o mapa com os dedos; tocar municípios. Conferir resumo
   recolhido, câmera, filtros, ausência de rolagem externa e hover residual.
   Buscar Recife por toque e Enter, cancelar outra busca. Abrir Lista, escolher PE,
   expandir Olinda e selecionar pelo nome; alcançar a última linha acima do
   resumo. Alternar Mapa/Lista e conferir UF, expansão, posição e câmera.
2. **T06–T10, T12–T14:** tocar texto do resumo (não expande), Ver detalhes,
   quatro Eixos e Ações. No Menu dos detalhes, abrir busca, filtros e legenda,
   um por vez. Cancelar/fechar e conferir leitura e retorno do foco. Trocar
   Indicador, depois somente Tipo; conferir Eixo e explicação quando não há
   Indicador. Recolher conserva consulta; limpar conserva filtros e exploração.
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
   e ampliar a 200%. Conferir o ciclo do aviso descrito abaixo; alcançar nome, retorno, Menu, filtros, legenda,
   busca e Ações por rolagens internas, sem reduzir fonte. Recuperar espaço e
   conferir Eixo, leitura, URL/histórico e consulta. Mapa não precisa permanecer
   simultaneamente visível no extremo.
6. **Estados de conteúdo:** repetir leitura e saídas com Alcântara (regional e
   Faixa C/resumo longo), Balsas, Araioses (Dado insuficiente), Recife/próstata
   (ressalva integral), mortalidade (sem Situação) e ausência no recorte.
   Confirmar os estados nos dados da revisão, sem presumir composição pelo nome.
7. **T27–T28:** conferir alternativas se mapa falhar, consulta por busca/Lista,
   páginas de leitura e índice por UF; desativar JavaScript no Chrome e abrir
   documento municipal com seis Tipos, quatro Eixos, Ações e rolagem normal.

## Repetições e encerramento

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

## Reconferência do aviso corrigido — #53

A falha histórica da abertura continua registrada separadamente: na revisão
`da45e329f4687f5e48ebb297b128446e2e271c0c`, a emulação reproduziu faixa de
16 px que cortava o texto. Isso não substitui nem reclassifica a observação física
relatada pelo responsável. A [evidência da correção](construction-notice.md)
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
5. Repetir sobre detalhes e Lista: abrir busca, Menu, filtros e legenda e então
   Ler aviso. Conferir uma superfície por vez; ao fechar, manter município,
   Tipo, Indicador, Eixo, visualização, leitura e posições dentro do novo máximo.
   Abrir/fechar o aviso não cria entrada no histórico nem altera a URL.

Registrar nova execução, tentativas, esperado/observado, capturas e limitações
sem apagar a falha histórica. Android/Chrome físico, barras móveis e teclado
real continuam **não executados pelo agente**. A #52 e a spec pai #44 permanecem
abertas até suas próprias verificações.
