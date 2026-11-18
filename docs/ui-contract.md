# Contrato de interface

Decisões de apresentação usadas pelo CSS e pelos testes. As regras de navegação,
estado e consulta estão na [spec](spec.md#11-experiência) e os endereços municipais,
no [ADR 10](adr/0010-static-municipal-links.md). Os itens a confirmar continuam
em vigor até decisão do responsável. [Pendências da spec](spec.md#17-pendências).

## Páginas e navegação

- O Mapa inicial abre com o Brasil inteiro, até 60 dias × Todos os cânceres ×
  Tendência, sem seleção ou painel vazio. A busca fica no cabeçalho de todas
  as páginas. A navegação principal reúne Mapa, Municípios por UF e Como
  calculamos. O índice fica em `/municipios/`.
- A logo reinicia a exploração e conserva o tema explícito válido. O item
  Mapa conserva seleção, recorte, visualização e tema. A seleção usa o
  documento estático `/municipio/<código>-<nome>/`. A normalização da URL,
  os links antigos, as âncoras e Voltar/Avançar seguem a [spec](spec.md#111-mapa-inicial).
- O tema tem um único controle com nome acessível, lua no claro e sol no
  escuro. Sem tema explícito válido, vale a preferência do sistema. Sem
  JavaScript, o controle fica oculto.
- O aviso de construção permanece no topo. A faixa integral e a leitura
  compacta do dashboard móvel seguem a [spec](spec.md#2-identidade-licenças-e-requisitos-de-lançamento).

## Fundamentos visuais

- Inter variável em subconjunto próprio, com `≥` e [licença](../site/public/fonts/OFL.txt).
  Algarismos tabulares apenas nos números. Pesos 600 para títulos e números
  e 500 para rótulos e controles. Escala de 12, 14, 16, 20, 24 e 32 px.
  Espaçamentos em múltiplos de 4 px.
- Marca monocromática na cor do texto, com a silhueta da malha do Brasil.
  Controles sem borda com superfície suave e raio de 8 px, de 40 px no desktop e
  44 px no celular. A seleção inverte texto e superfície. Cartões flutuantes
  têm raio de 12 px e sombra suave. Links têm sublinhado de 1 px.

| Token | Claro | Escuro |
|---|---|---|
| `--page` | `#f5f5f5` | `#0a0a0a` |
| `--surface` | `#fff` | `#1a1a1a` |
| `--soft` | `#efefef` | `#2a2a2a` |
| `--border` | `#d4d4d4` | `#333` |
| `--text` | `#171717` | `#f5f5f5` |
| `--muted` | `#525252` | `#a3a3a3` |
| `--link`, `--focus` | `#1a56b0` | `#8ab4f8` |
| `--notice-bg` / `--notice-text` | `#171717` / `#fafafa` | `#f5f5f5` / `#171717` |
| `--selection` | `#000` | `#fff` |

**Tons do mapa:**

| Classe | Claro | Escuro |
|---|---|---|
| Melhorando | `#0f6e6b` | `#35bdb6` |
| Piorando | `#d68f10` | `#e3a42c` |
| Estável | `#9aa0a9` | `#79818c` |
| Sem direção clara | `#d9dde2` | `#38414b` |
| Dado insuficiente, com pontos `#8a9099` | `#f3f2ec` | `#1e242b` |
| Hachura da faixa C | `rgba(31,41,51,.55)` | `rgba(230,237,243,.42)` |
| Fundo do mapa | `#f6f7f9` | `#12171d` |
| Contorno dos municípios | `#fff` | `#12171d` |
| Situação: Alcançou | `#54278f` | `#b9a3f2` |
| Situação: Perto | `#9e9ac8` | `#7a68b4` |
| Situação: Longe | `#dadaeb` | `#3d3760` |

A meta de distância entre tons é 8, com piso de 6 para pares que também se
distinguem por textura. O contraste reduzido de algumas classes no tema claro
depende de legenda, texto, Lista e pontos para manter a distinção.
[Verificação de tons](../site/tests/README.md#tons-do-mapa).

## Primeira tela no celular

- Abaixo de 768 px com JavaScript, o mapa ocupa a área abaixo do aviso, de
  ponta a ponta. O dashboard usa a viewport visual e mantém a rolagem
  interna, inclusive em paisagem, altura reduzida e ampliação. Um dedo move
  o mapa. O cabeçalho flutuante reúne menu, marca e busca expansível. Menu
  dá acesso às páginas, Fontes, código-fonte e tema.
- Filtros mostra o recorte vigente e abre uma folha não modal de até 50% da
  altura, com `popover="manual"`, seletores nativos de 44 px e atualização
  ao vivo. “Ver mapa” ou Escape fecha a folha. A legenda no canto inferior esquerdo mostra
  período, classes e Faixa C, e o ⓘ abre a explicação completa. Mapa/Lista
  fica à direita, acima do resumo quando houver, ou ao lado de Filtros na Lista.
- Menu, Busca, Filtros, Legenda e leitura do aviso abrem um por vez. O foco
  segue para o primeiro controle da superfície aberta e volta ao invocador
  visível ao fechar. Estado da consulta e histórico seguem a
  [spec](spec.md#112-meu-município-consulta-integrada).
- O enquadramento inicial inclui Fernando de Noronha e reserva espaço para
  filtros e legenda. A busca informa quantos municípios encontrou e fecha
  ao selecionar. Com pouco espaço, cabeçalho, exploração, resumo e
  detalhes admitem rolagem interna, com fontes preservadas. A reserva para
  o mapa pode chegar a zero. Sem JavaScript, leitura e rolagem ficam no fluxo.

## Desktop em tela cheia

- A partir de 768 px, aviso, cabeçalho, filtros e mapa preenchem
  `max(100dvh, 520px)`, com piso de 192 px para o mapa. A composição é por
  CSS, sem margens, cartões ou sombras. Aviso com pelo menos 43 px,
  cabeçalho de 48 px e filtros de 56 px
  em uma linha a partir de 1280 px, com seletores de 40 px e Mapa/Lista à
  direita. De 768 a 1023 px, o cabeçalho usa menu e os filtros têm duas linhas.
  “Panorama territorial” e o nome do Indicador ficam disponíveis a leitores de tela.
- O mapa tem 653 px de altura a 1280 × 800 e 753 px a 1440 × 900, com ou
  sem JavaScript. Selecionar um município reduz apenas a largura do mapa.
- Legenda no canto inferior esquerdo, com período, classes, acesso à
  explicação completa e, sem seleção, a frase correspondente a Tendência
  ou Situação. A ressalva de 18 rem fica sob os filtros sem redimensionar
  o mapa e entra no fluxo da Lista. O enquadramento reserva legenda e
  ressalva com a menor perda de zoom. A legenda usa ajuda de 24 px no
  desktop e 44 px no celular.
- Meu município tem a altura do mapa e 400 px de largura, ou 480 px acima de
  1920 px. A Lista ocupa a área do mapa. Ambos admitem rolagem interna por
  teclado. O rodapé vem depois da primeira tela e é alcançável por End, Tab
  ou rolagem sobre as barras.

## Painel Meu município

- No celular, o resumo sobreposto mostra nome/UF, resultado e período.
  “Ver detalhes” é o único botão preenchido. O × “Limpar seleção” fica junto
  ao nome. Nos detalhes, o × “Fechar detalhes” fica no alto à direita, e a
  barra e a leitura rolam separadamente quando necessário. Alvos de
  “Ver detalhes”, “Compartilhar”, dos dois ×, de Legenda e Tipo de câncer
  têm pelo menos 44 × 44 px e 8 px de separação. Nomes longos e o valor
  selecionado do controle nativo quebram linha. No desktop, o nome fica
  fixo no topo da coluna.
- Legenda acompanha o resultado. O resumo destaca o valor em 32 px, o que
  mede, a classe com cor e textura, o ano e o período da Tendência ou a
  Referência. Na leitura regional, “seu município e vizinhos” e o nome da
  região acompanham o resultado. O tratamento inclui a % sem informação e
  o aviso da Faixa C. Dado insuficiente substitui o valor por texto e pontos.
  Nesse caso, a Faixa C passa para o Eixo aberto, junto da Tendência da UF
  e da Ação. Mortalidade traz taxa e Tendência. C55 não calculável tem
  apresentação própria, sem pontos. HPV tem Situação e explica a série curta.
  A ressalva integral da próstata aparece no resumo e nos detalhes.
- Um Eixo aberto por vez, com Acesso ao tratamento primeiro e resultados
  nos títulos fechados. A hachura da Faixa C no título vale para o 60 dias.
  No Eixo aberto, a ordem é título, período, Situação e Referência,
  Tendência, % sem informação, Ação, série, fonte e método, conforme o
  Indicador. O seletor de Tipo fica junto do rótulo e acompanha Mapa/Lista.
  Os valores vêm prontos do [Contrato de dados](spec.md#15-contrato-de-dados).
- **Anúncio da seleção:** só para leitores de tela. Selecionar um município não muda a altura do cabeçalho nem dos controles.
- Busca foca o nome sem rolar o documento. Abrir detalhes foca o nome nos
  detalhes e recolher devolve o foco a “Ver detalhes”. Conteúdo recolhido
  sai da ordem de foco. Limpar devolve o foco à busca ou ao seu botão.
  Toque no mapa conserva o foco da exploração e retira o tooltip. Mouse
  restaura o hover, inclusive em dispositivos híbridos. A seleção ganha
  contorno externo na cor da superfície.
- “Compartilhar” é secundário e fica junto de “Ver detalhes” no resumo,
  abaixo do nome nos detalhes móveis e junto ao nome no desktop.
  Compartilhamento e cópia seguem a [spec](spec.md#112-meu-município-consulta-integrada).
  “Link copiado” aparece em uma região de status por três segundos, com
  prazo renovado a cada cópia e alinhamento ao botão quando couber.
  Em caso de falha, o campo “Link da consulta municipal” recebe foco com
  o endereço selecionado.
- Falha do perfil tem mensagem e “Tentar novamente” no resumo e difere
  de Dado insuficiente ou “Sem dado neste recorte”. O foco, a câmera e o
  contexto de cada visualização seguem as regras da
  [spec](spec.md#111-mapa-inicial), inclusive em rotação, recarga e nova tentativa.

## Lista

- Substitui o mapa na mesma área, com ordem por UF e nome. A própria
  largura da Lista define a apresentação. Abaixo de 640 px, cada linha
  exibe nome, classe com cor e textura, Faixa C quando aplicável e valor
  em 20 px. O nome seleciona o município. O ⌄ expande UF, outra leitura,
  nota do valor, origem, % sem informação e qualidade do registro.
- Na forma larga, a tabela tem filetes, cabeçalho e coluna do município
  fixos, e valores tabulares alinhados à direita. As duas formas mantêm
  semântica de tabela, rótulos em texto, `aria-colindex` e
  `aria-expanded` no controle da linha. “Dados em lista” e a legenda da
  tabela ficam disponíveis a leitores de tela.
- A barra mantém UF e contagem, com período da Tendência ou Referência e
  ano do valor à vista. “Como ler esta lista” reúne as notas e a Faixa C.
  No celular, a rolagem é interna e permite alcançar a última linha e
  manter o foco acima do resumo. Notas abertas têm rolagem própria.
  Alternar visualizações preserva a exploração durante a visita.

## Municípios por UF

- Linhas com filete, sigla, nome e contagem. A expansão nativa usa
  `details` e exibe em colunas links municipais com alvos de 44 px.
- Cabeçalho em faixa no fluxo, com menu abaixo de 1024 px. A busca só
  carrega a lista ao receber foco. Cada resultado é um link municipal,
  com alvo de 44 px no celular.
  Falha oferece “Tentar novamente” e acesso ao índice. Sem JavaScript,
  o ícone de busca leva ao índice.

## Como calculamos

- `/metodologia/` preserva as 11 âncoras e usa o cabeçalho das páginas de
  leitura. A partir de 881 px, sumário lateral fixo com seção atual
  marcada e leitura de 44 rem. Filetes separam as seções. Abaixo de 881 px,
  “Nesta página” abre o sumário sobre o texto e mostra a seção atual.
  A linha fica fixa a partir de 300 px de largura e altura. Sem JavaScript,
  o índice fica no fluxo.
- Tab leva do botão à lista. Escape fecha e devolve o foco ao botão.
  Escolher uma seção fecha o sumário e foca o destino, abaixo do aviso
  e do sumário.

## Sem mapa ou sem JavaScript

Busca, Lista e consulta funcionam sem WebGL ou malha carregada. Lista
municipal, camada, mapa/malha e perfil têm recuperação independente. Sem
JavaScript, Mapa/Lista fica oculto e a área do mapa e o ícone de busca
levam a Municípios por UF. O Menu e a folha móvel de Filtros continuam
abrindo. A folha contém os seletores desativados, o aviso e o link para
o índice. Cada documento municipal mantém os quatro Eixos, Ações,
ressalvas, fontes e links nativos dos seis Tipos de câncer, inclusive
pelas âncoras antigas.

## Séries históricas em telas estreitas

Os cinco gráficos ajustam apenas as coordenadas horizontais, com 200 px
de altura, rótulos de 16 px, margens de 64 px à esquerda e 32 px à direita,
anos finais alinhados à direita e nota de dose única dentro do gráfico.
Abaixo de 240 px, a rolagem fica restrita ao gráfico e aceita foco por
teclado, com texto de pelo menos 12 px. Sem JavaScript, o SVG de 570 px
rola localmente. A tabela permanece disponível.
