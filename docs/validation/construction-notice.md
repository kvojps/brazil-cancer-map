# Aviso de construção legível no mobile — #53

## Revisões e investigação

Em 17/11/2026, baseline `da45e329f4687f5e48ebb297b128446e2e271c0c`
(branch `hml`, árvore inicialmente limpa). A revisão corrigida é o commit de
entrega que contém este documento, referenciado nas issues #53 e #52. Para resolver seu SHA localmente após o commit, use
`git log -1 --format=%H -- docs/validation/construction-notice.md`. Nenhum
push, publicação ou observação física faz parte desta verificação.

Reprodução em Linux, Node 24.20.0, Chrome for Testing 156.0.8078.4 / Playwright 1.64.1, viewport
mobile com toque emulado, JavaScript ativo, fonte CSS normal, tema claro,
servidor de desenvolvimento `http://127.0.0.1:4321/`, teclado fechado.
O manifesto publicado manteve SHA-256
`a6f0903b978833e46421793dc5ec38e192b6f0468fedf93c18fe39c682816082`;
não houve alteração de dados.

| Viewport CSS | Faixa antes | Texto antes | Resultado |
| --- | --- | --- | --- |
| 320 × 568 | 16 px | 39,1875 px, começando em y=8 | Texto cortado na abertura. |
| 390 × 844 | 16 px | 39,1875 px, começando em y=8 | Texto cortado na abertura. |
| 568 × 160 | 35,59375 px | 19,59375 px | Mensagem cabia com fonte normal. |

As [capturas anteriores](construction-notice-evidence/) mostram o corte. O relato
físico era de uma faixa branca fina; a emulação em tema claro mostrou faixa
escura com texto cortado. Reproduziu-se o defeito de legibilidade, sem presumir
identidade entre navegador, tema ou revisão servida no aparelho.

Causa confirmada nesta reprodução: a linha automática do grid, combinada com
a linha flexível e o marcador invisível que atravessa as duas linhas, não
reservava a altura intrínseca do aviso. Com `overflow: auto`, encolhia a faixa
ao preenchimento vertical (16 px); o texto transbordava na área rolável. O teto de um quarto da viewport era hipótese inicial e não
explica sozinho o encolhimento: os tetos eram 142 e 211 px nos dois retratos.
O teste de fragmentos visíveis falhou em ambos antes da alteração e passou ao
preservar a altura intrínseca do aviso. Uma execução intermediária no build
estático detectou que apenas preservar a altura do elemento não bastava:
a faixa tornava-se legível, mas sua linha ficava com 0 px e cobria a busca.
A comparação isolada de tamanhos de linha confirmou que `max-content` reserva
a altura correta, sem depender da ordem do CSS; foi aplicado também na
composição de altura extrema. O teste passou a exigir cabeçalho abaixo do aviso
e acionamento real da busca. A primeira suíte estática foi interrompida após
essa regressão confirmada; seus resultados não são os da revisão final.

## Comportamento e fronteira

O aviso integral mantém altura intrínseca e não tem rolagem interna no dashboard.
No build corrigido, a faixa mede 55,1875 px nos dois retratos, sem recortar texto
nem encobrir o cabeçalho. As capturas `after-*` e `reading-*` estão no mesmo
diretório das capturas anteriores.
Mede-se a altura real do parágrafo, incluindo seu preenchimento vertical,
mesmo quando invisível na forma compacta. A fronteira soma essa altura, as
alturas das barras/notas da Lista quando visíveis e a reserva de exploração
existente de 16 rem. A largura continua limitada à composição abaixo de 768 px;
a reserva acompanha a fonte atual, sem reduzir o texto.

Com a fonte Inter carregada, Mapa a 320 px de largura e texto a 100%:
**312 px de altura mantém a mensagem integral; 311 px compacta**. O teste
repete 312 → 311 → 312 e aguarda estabilização. Não é um breakpoint universal:
fonte, largura, ampliação e barras da Lista mudam o espaço necessário.
A medição independente do texto integral evita oscilação ao retirar o
preenchimento da faixa compacta.

“Ler aviso” tem alvo de toque de pelo menos 44 px. A mensagem abre em popover
coordenado com as outras superfícies, com Fechar separado da leitura rolável.
No extremo, reduz-se espaçamento, preservando fonte e alvo. Fechar/Esc retornam
foco ao acionador ou à mensagem integral, se a faixa já se recuperou. A leitura
aberta permanece aberta durante recuperação; compactar novamente uma mensagem
integral focada transfere foco ao acionador.

## Verificação

Os testes usam a interface pública no navegador, sem dublês de estado. Conferem
cada fragmento do texto contra viewport e ancestrais que recortam, além da
altura do alvo, foco, acesso por Tab/End e acesso ao início/fim da leitura.
O axe também confere contraste do acionador em hover nos dois temas: a regra
geral dos botões inicialmente criava fundo inadequado; a regressão foi
reproduzida e corrigida preservando o fundo transparente do aviso. Presença no DOM e
rolagem até o fim não são prova da legibilidade na abertura.

| Cenário | Cobertura |
| --- | --- |
| 320 × 568 e 390 × 844, abertura | Mensagem inteira visível inicialmente, sem rolagem interna/externa. |
| 568 × 160, texto normal | Compacto, abrir, Fechar, Esc, retorno de foco e consulta/URL/histórico preservados. |
| Recuperar 390 × 844 com leitura aberta | Integral reaparece, leitura e foco em Fechar permanecem; fechar foca mensagem; nova redução foca Ler aviso. |
| 568 × 160, fonte CSS 200%, claro/escuro | Compacto e Fechar legíveis, fonte do acionador de 28 px, foco visível e ambas extremidades do texto alcançáveis. |
| Busca, filtros e legenda sobre detalhes; Menu na exploração | Uma superfície por vez; Eixo, posição de leitura, município, filtros, Lista e histórico conservados. |
| 320 × 312/311/312 | Fronteira estável, sem compactação indiscriminada na abertura. |
| Desktop 1280 × 800, leitura 320 × 568, sem JS 568 × 160 | Mensagem integral existente preservada. |

Ampliação dirigida: regra CSS `html { font-size: 200% !important; }`.
Redução de altura: `page.setViewportSize`; não abre teclado Android nem simula
barras reais do Chrome. As suítes existentes também exercitam zoom nativo com
extensão, navegação, Lista, detalhes e alternativas sem WebGL. O resultado final está registrado abaixo.

Comandos, a partir da raiz, sequenciais para não reconstruir a saída servida:

```sh
npm run check --prefix site
npm test --prefix site
npm run preview --prefix site -- --host 127.0.0.1 --port 4322
SITE_URL=http://127.0.0.1:4322 CHROMIUM_PATH=/home/kvojps/.cache/ms-playwright/chromium-1248/chrome-linux64/chrome node --test --test-concurrency=4 site/browser-tests/*.test.mjs
```

O teste existente de toque com carga pendente passou a rolar a mensagem aberta
por “Ler aviso”, em vez da faixa. Preserva a guarda contra chegada tardia que
interrompa leitura deliberada. A expectativa antiga de faixa rolável falhou na
suíte ampla antes dessa adaptação. O teste de coordenação usa prazo de 15 s para
composição inicial da Lista sob carga paralela; o prazo inicial de 5 s esgotou
na execução ampla, e a reconferência isolada com o prazo ajustado passou.
Quatro testes antigos de fundamentos também incluíam o texto e o botão ocultos
na inspeção do DOM; passaram a conferir texto e controles efetivamente visíveis.
A execução ampla intermediária terminou com 406 de 412 aprovados: essas quatro
expectativas antigas, a expectativa de rolagem da faixa e o timeout de
coordenação explicam as seis falhas, preservadas no log intermediário.

Outra execução ampla aprovou 411/412; a única falha foi a medição imediata após
redimensionar com zoom nativo. A reprodução instrumentada registrou viewport
de 284 px enquanto `--dashboard-height` ainda estava em 422 px, ajustando-se
a 284 px na composição seguinte. O teste de primeira tela passou a aguardar
a condição pública de ausência de rolagem antes da medição; não foram
alterados estilos para essa sincronização. O log anterior à sincronização
permanece em `browser-before-sync.log`.

Execuções adicionais no desenvolvimento usaram `node --test
site/browser-tests/construction-notice.test.mjs` e os arquivos
`mobile-details.test.mjs`/`mobile-surfaces.test.mjs`. A primeira registrou os
ciclos vermelho/verde da abertura, do compacto e das correções da revisão.
A execução dos arquivos existentes coincidiu com alterações e recarga do dev;
seus resultados não substituem a conferência sobre build estático. O sandbox
bloqueou a inicialização do Chromium e subprocessos do build; as execuções
foram repetidas com permissão para processos/servidores locais.

## Resultado final

| Verificação | Resultado |
| --- | --- |
| `npm run check --prefix site` | 86 arquivos, 0 erros, avisos ou sugestões. |
| `npm test --prefix site` | 88/88 aprovados; inclui build estático e guarda de memória no desenvolvimento. |
| Suíte completa de navegador, concorrência 4 | **412/412 aprovados**, 0 falhas, 384,7 s, após a sincronização do zoom. |
| Arquivo completo `phone-first-screen.test.mjs`, reconferência isolada | 39/39 aprovados. |
| `git diff --check` | Sem erros de espaço em branco. |
| Revisão Standards / Spec | 0 achados pendentes em cada eixo. |

Logs versionados em [construction-notice-evidence/](construction-notice-evidence/):
`check.log`, `node.log`, `browser.log` (final), `phone.log`,
`native-zoom-diagnostic.log`, `browser-intermediate.log` (406/412) e
`browser-before-sync.log` (411/412). Nos logs foram removidos apenas códigos
ANSI de cor e espaços finais. A suíte final inclui os arquivos de
acessibilidade e zoom nativo. O axe não registrou violações; as verificações
inconclusivas indicadas no log continuam exigindo revisão humana.

## Limites e acompanhamento

Emulação não comprova renderização/toque no Android/Google Chrome físico,
teclado real, barras móveis, iOS/Safari, Firefox nem leitor de tela.
O [roteiro físico atualizado](mobile-navigation-physical.md#reconferência-do-aviso-corrigido--53)
permanece na #52, preservando a falha histórica e exigindo identificação de
aparelho, versões, URL/revisão, viewport, tema, orientação, ampliação e teclado.
A conclusão da #53 não conclui a #52 nem a spec pai #44.

## Revisão de código

**Standards:** alvo de toque inicialmente insuficiente foi corrigido para 44 px;
nenhum achado pendente na reconferência.

**Spec:** corrigidos foco na nova compactação e documentação de evidência/roteiro;
nenhum achado pendente na reconferência. A sobreposição descoberta no build e
o hover com contraste inadequado também receberam regressões dirigidas.

As duas revisões independentes seguem a skill `code-review`, usando como ponto
fixo o baseline informado acima; o diff revisado inclui todos os arquivos da
entrega. Os resultados finais acima foram conferidos antes do commit.
