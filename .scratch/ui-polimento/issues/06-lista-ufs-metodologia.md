# Como Lista, Municípios por UF e Como calculamos devem ficar no novo sistema?

Labels: wayfinder:prototype
Type: prototype
**Status:** resolved
Assignee: Kvojps
Parent: ../map.md
Blocked by: 03

## Question

Prototipar, no celular e no desktop, a Lista, Municípios por UF e Como calculamos com os [fundamentos escolhidos](03-fundamentos-visuais.md): como a tabela larga da Lista funciona a 320 e 390 px sem rolagem horizontal fora dela, e como navegar a Metodologia, com 31.404 px de altura no celular, preservando as âncoras.

O conteúdo da Metodologia não muda, só a apresentação. O aviso continua visível com a página rolada, e o alternador Mapa/Lista segue a [primeira tela escolhida](02-celular-cabecalho-filtros-mapa.md) no celular e a [composição do desktop](05-desktop-tela-cheia.md), em que a Lista rola por dentro da área do mapa.

## Answer

O responsável aceitou a recomendação: **Lista C, Linhas que abrem; UFs A, Lista de UFs; Metodologia A, Sumário sempre à mão**, com as respostas recomendadas às quatro perguntas abertas.

**Lista**

- **Largura estreita:** cada linha mostra nome, classe da leitura do mapa com a cor e a textura do mapa, marca "Faixa C" quando houver e valor em 20 px. O ⌄ abre, na própria linha, UF, a outra leitura, nota do valor, % sem informação, origem do dado e qualidade do registro. O nome abre Meu município.
- **Quando vale:** pela largura da própria Lista, abaixo de 640 px, e não pela largura da janela. Assim a forma estreita também aparece a 768 px com o painel aberto.
- **Desktop:** tabela real com filetes, cabeçalho e coluna do município fixos, valores em algarismos tabulares e alinhados à direita, rolando por dentro da área do mapa.
- **Barra da Lista:** seletor de UF e contagem. No celular, só essa linha fica fixa ao rolar. O Mapa/Lista continua fixo na tela, e o cabeçalho e Filtros saem de vista com a rolagem.
- **Notas:** o parágrafo longo vai para "Como ler esta lista". Fica à vista o período da Tendência, ou a Referência na leitura Como está hoje, e o ano do valor.
- **Títulos:** "Dados em lista" e a legenda da tabela continuam só para leitores de tela.

**Municípios por UF**

- Linhas separadas por filete, com sigla, nome e quantidade de municípios, e links de 44 px em colunas ao abrir. A expansão é por `details`, sem JavaScript.

**Como calculamos**

- **Desktop:** sumário fixo na lateral, sem caixa, com a seção atual marcada, e coluna de leitura de 44 rem. Seções separadas por filete, sem caixas.
- **Abaixo de 881 px:** uma linha fixa, "Nesta página" com a seção atual, abre o índice sobre o texto. Ela fecha ao escolher uma seção e com Esc. Sem JavaScript, o índice fica no fluxo da página, sem a seção atual.
- **Conteúdo e âncoras:** não mudam. O espaço reservado no topo das seções mantém o título visível abaixo do aviso e do sumário.

**Comum às duas páginas**

- O cabeçalho é uma faixa no fluxo da página, sem cartão flutuante, com menu hambúrguer abaixo de 1024 px.
- Saem "← Voltar ao mapa" e os rótulos "Metodologia" e "Consulta municipal" acima dos títulos. O link Mapa do cabeçalho já preserva o estado.
- A busca de município passa a aparecer no cabeçalho dessas páginas. Esse ponto não foi prototipado.

**Regra alterada, com aval do responsável:** na Lista estreita, a origem regional e a % sem informação ficam na linha aberta, e não na fechada. A exceção vale só para a Lista, porque o painel do município continua com a origem junto do resultado.

Pendências para a implementação:

- **Leitor de tela:** as linhas em grade perdem a semântica de tabela. Restaurar com papéis ARIA ou outra estrutura, e testar.
- **Rótulos da linha:** no protótipo, vêm de `content` em CSS, que não é confiável para leitores de tela. Usar texto real.
- **Sem JavaScript:** a Lista só existe com JavaScript, como já prevê a spec. Conferir a saída para Municípios por UF.
- **Busca nas duas páginas:** definir como carregar a lista de municípios sem pesar a Metodologia, e o que acontece sem JavaScript. Escolher um município leva ao dashboard com a seleção.
- **Índice aberto e foco:** o foco ao escolher uma seção e a ordem de tabulação não foram testados.
- **Não verificado:** aparelho real, Safari, leitor de tela, Lista estreita com a folha do painel no celular, e a Lista com município selecionado no desktop, em que as últimas colunas podem ficar na rolagem interna. O tema escuro foi visto na Lista C aberta, em Municípios por UF na grade descartada e na Metodologia A.

Protótipo: branch descartável local `prototype/ui-polimento-paginas`, commit `38c9db3`; `npm run dev` em `site/`, com `/?visualizacao=lista&lista=C`, `/municipios/?ufs=A` e `/metodologia/?metod=A`. O código é só referência e deve ser reescrito na implementação.

## Comments

### Protótipo — 2026-11-05

Aguardando o julgamento do responsável. Branch descartável local `prototype/ui-polimento-paginas`, commit `38c9db3`, a partir de `prototype/ui-polimento-desktop`; `npm run dev` em `site/`, com `/?visualizacao=lista&lista=A|B|C`, `/municipios/?ufs=A|B` e `/metodologia/?metod=A|B|C`. Recomendação da sessão: Lista C, UFs A e Metodologia A. Caso difícil da Lista: UF MA, com Faixa C e Dado insuficiente.

Medido em emulação do Chromium, com todas as UFs: nenhuma variante tem rolagem horizontal fora da tabela a 320, 390, 640 (equivalente ao zoom de 200% em 1280 px), 768 e 1280 px, e as 11 âncoras da Metodologia caem abaixo do aviso e do sumário em todas as variantes, sem o aviso sair do topo.

| Lista a 390 × 844 | Altura média da linha | Altura da página |
|---|---|---|
| A, Linhas completas | 203 px | 1.123.488 px |
| B, Tabela com coluna fixa | 85 px | 1.142 px, com a tabela rolando por dentro (815 px na horizontal) |
| C, Linhas que abrem | 57 px | 318.034 px |

| Como calculamos a 390 × 844 | Altura com tudo como abre |
|---|---|
| A, Sumário sempre à mão | 28.277 px, antes 31.404 px |
| B, Seções recolhíveis | 1.235 px |
| C, Uma seção por vez | 5.488 px na seção 01 |

### Resolução — 2026-11-05

O responsável aceitou a recomendação: "Concordo com sua recomendação". A resposta cobre as três variantes, a origem regional na linha aberta da Lista, a saída de "← Voltar ao mapa", a busca nas duas páginas e Filtros saindo de vista ao rolar a Lista. A [spec vigente](../../ui-ux-v1/spec.md) foi ajustada na busca, na Lista e na Metodologia. Sem alteração no código do produto.
