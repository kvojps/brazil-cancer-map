# Testes da inicial no navegador

Instale as dependências com `npm ci --prefix site` e inicie o site com
`npm run dev --prefix site`. Em outro terminal:

```sh
CHROMIUM_PATH=/caminho/para/chromium npm run test:browser --prefix site
```

O caminho padrão é `/snap/bin/chromium`. `SITE_URL` permite usar outro servidor,
inclusive a saída estática servida por `npm run preview --prefix site`.
Use Chromium com suporte a extensões locais para o teste de zoom nativo.

A suíte verifica a página pública: WebGL indisponível, malha pendente, falhas da
lista e da camada com nova tentativa, atualização dos links após mudar o Tipo de
câncer, acesso direto à ficha, filtro por UF, ausência de Situação e ajuste C55
não calculável. Percorre a busca por teclado e verifica a matriz de larguras
320/768/1280 px, temas claro/escuro e JavaScript ativo/desativado.

Além da simulação por CSS, a extensão local de teste `zoom-extension` usa
`chrome.tabs.setZoom` para aplicar zoom **nativo de 200%**. A suíte confirma a
redução da largura da viewport CSS e o aumento da densidade de pixels; verifica
que a rolagem horizontal fica contida na tabela. A extensão só é carregada pelo
navegador de teste e não integra o site publicado.

Esses testes não substituem uma sessão com leitor de tela nem a auditoria de
acessibilidade do lançamento (ticket 25). Os anúncios usam regiões de status e
os dados continuam expressos em texto.

A ficha municipal também é verificada em `municipality.test.mjs`: links estáticos
para os seis Tipos de câncer, âncora direta que prevalece sobre um filtro anterior,
preservação de tema e retorno, ativação de links e expansões pelo teclado e a
mesma matriz de temas/larguras/JavaScript, com expansões abertas. Inclui zoom
nativo de 200% pela extensão de teste.

Para verificar os documentos efetivamente gerados, rode `npm run build --prefix site`,
inicie `npm run preview --prefix site -- --port 4322` e use
`SITE_URL=http://127.0.0.1:4322 npm run test:browser --prefix site`.
Não execute builds simultâneos: eles compartilham o diretório de saída.

A lista agora ocupa a área do mapa. Os testes ativam “Lista” no alternador e
verificam Mapa/Lista, seleção e filtros ao usar Voltar/Avançar. A seleção
aprimorada usa o caminho estático `/municipio/<código>-<nome>/`; links antigos
com `?municipio=` são normalizados com JavaScript. A recarga desse caminho
continua entregando quatro Eixos e seis Tipos sem JavaScript. O índice por UF
fica na página `/municipios/`, com expansões nativas por UF; os testes verificam
o acesso pelos documentos municipais, recarga, tema e navegação pelo teclado.

`desktop-first-screen.test.mjs` verifica a composição do Mapa inicial a partir de
768 px: mapa de 653 e 753 px com e sem município, com e sem JavaScript; barras de 48
e 56 px; legenda no canto, com a legenda completa no ⓘ; ressalva sem mudar a altura
do mapa; menu e duas linhas de filtros até 1023 px; painel de 480 px acima de 1920 px;
rolagem da Lista, do painel e até o rodapé pelo teclado; altura mínima; e sem rolagem
horizontal. O enquadramento dentro do WebGL é conferido em capturas; a conta da área
reservada à legenda está em `tests/framing.test.mjs`.

`visual-foundations.test.mjs` verifica o contrato dos fundamentos visuais: aviso
integral, invertido e sempre visível nas quatro páginas, tema pela preferência do
sistema com e sem JavaScript, controles de 40 e 44 px com estado ativo invertido,
Inter servida pelo próprio site com o `≥` e algarismos tabulares, marca da silhueta,
foco pelo teclado e `/municipios/` sem rolagem horizontal. As distâncias de cor do
mapa são conferidas fora do navegador, por `npm run check:tones`, que também roda em
`npm test`. A fonte é gerada por `scripts/build-font.sh`.

`phone-first-screen.test.mjs` verifica a primeira tela abaixo de 768 px: mapa de ponta
a ponta sob o aviso a 390 × 844, 390 × 664 e 320 × 568, sem rolagem; um dedo move o mapa
com toque emulado; cabeçalho, menu, busca, folha de Filtros não modal e legenda
flutuantes; sem JavaScript, menu e folha abrem com os seletores desativados; a Lista
rola até o rodapé; e, em janelas baixas ou muito estreitas e no zoom nativo de 200%, os
controles saem de cima do mapa. O teclado virtual é uma altura típica descontada da
tela, pois a emulação do Chromium não o abre. O enquadramento dentro do WebGL é
conferido em capturas; a conta da área reservada está em `tests/framing.test.mjs`.

`municipal-panel.test.mjs` verifica o painel Meu município com os casos difíceis: Balsas
(faixa C), Alcântara (Região imediata e faixa C, o bloco mais longo, a 320 × 568), Araioses
(Dado insuficiente) e próstata (ressalva curta e integral). Cobre o mesmo bloco recolhido e
aberto, a folha de ponta a ponta que abre até o aviso, Filtros, menu e busca no lugar da
folha, a coluna de 400 e 480 px com o nome fixo, os Eixos com resultado no título e um aberto
por vez, a ordem interna dos cartões, o foco no nome depois da busca, a mensagem de status só
para leitores de tela e a página comum em janelas baixas, no zoom nativo de 200% e sem
JavaScript. O contorno e o enquadramento dentro
do WebGL são conferidos em capturas; a conta da área reservada à folha está em
`tests/framing.test.mjs`.

`reading-pages.test.mjs` verifica Municípios por UF e Como calculamos: cabeçalho em faixa no
fluxo, com menu abaixo de 1024 px; a busca, que só carrega a lista de municípios ao ser usada,
leva ao dashboard com a seleção, tem falha com nova tentativa e, sem JavaScript, vira link para
Municípios por UF; o retorno pelo link Mapa; as UFs em linhas com alvos de 44 px; o sumário lateral
e a linha fixa, com seção atual, fechamento e foco; e as 11 âncoras abaixo do aviso e do sumário a
320, 390, 768 e 1280 px, com e sem JavaScript.

`list.test.mjs` verifica a Lista: abaixo de 640 px da própria largura, linhas com nome,
classe com a textura do mapa, Faixa C e valor em 20 px, com o ⌄ abrindo os demais campos em
texto real e `aria-expanded`; a forma larga, com cabeçalho e município fixos, rolando por dentro
da área do mapa, também a 1280 px com o painel aberto; a troca de forma pela largura da Lista,
e não da janela; UF e contagem fixas no celular, com Mapa/Lista e o aviso; a folha sem cobrir as
últimas linhas nem o foco do teclado; ordem por UF e nome; próstata e mortalidade sem Situação;
HPV sem Tendência, com camada montada no teste; e falha de
carga com nova tentativa. A semântica de tabela é conferida na árvore de acessibilidade do
Chromium, o que não substitui uma sessão com leitor de tela. Com os arquivos em paralelo, o
servidor de desenvolvimento pode estourar os tempos de espera: use a saída estática.
Em uma máquina carregada, mesmo a saída estática pode estourar. Nesse caso, rode um arquivo por
vez: `node --test --test-concurrency=1 browser-tests/*.test.mjs`. O servidor de desenvolvimento
também pode estourar o limite de memória do Node; se cair, aumente-o com
`NODE_OPTIONS=--max-old-space-size=5120`.

## Auditoria automatizada de acessibilidade

Com o build estático e a prévia já disponíveis:

```sh
SITE_URL=http://127.0.0.1:4321 CHROMIUM_PATH=/caminho/para/chromium npm run test:a11y --prefix site
```

`accessibility.test.mjs` executa axe na inicial, no índice por UF, na Metodologia e
em três documentos municipais, com e sem scripts, nos dois temas. A inicial usa a Lista filtrada por
PE; o índice abre PE e as expansões dos documentos são abertas. Falham violações
graves/críticas e nomes repetidos de regiões acessíveis. `A11Y_REPORT_DIR` permite
guardar os relatórios completos, incluindo verificações inconclusivas.

`map-state-accessibility.test.mjs` percorre as 27 combinações publicadas de
Indicador, Tipo e modo, nos dois temas, com WebGL indisponível, e compara a classe,
a origem, as notas e o ano de Recife com os JSONs publicados. Os demais testes
continuam cobrindo interação, recuperação, responsividade, zoom e teclado.

O job do site no CI instala o Chromium, inicia `astro preview --background`, roda
esses dois arquivos, guarda o artifact `accessibility-results` e encerra a prévia.
Os resultados e limites da auditoria, incluindo revisão humana e bloqueio por
orçamento, estão em [validation-25.md](../../.scratch/ui-ux-v1/validation-25.md).

Medições locais reproduzíveis, após o build:

```sh
npm run measure:output --prefix site
CHROMIUM_PATH=/caminho/para/chromium npm run measure:visit --prefix site
```

A segunda medição inicia seu próprio servidor HTTP local com gzip e usa contexto
novo do navegador; soma corpos comprimidos, sem cabeçalhos. Registra primeira
visita e seleção de Recife na mesma sessão. Não comprova compressão no provedor.
