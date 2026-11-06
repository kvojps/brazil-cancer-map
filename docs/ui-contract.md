# Contrato de interface

As decisões de UI que os testes e o CSS usam como contrato. Comentários no código citam estas seções pelo nome, por exemplo `docs/ui-contract.md, section Painel Meu município`. A regra de produto está na [spec](spec.md), seção 11, e os links municipais no [ADR 10](adr/0010-static-municipal-links.md).

**Como ler:**

- O que está aqui foi escolhido pelo responsável sobre protótipos e implementado depois. Os testes de navegador passaram quando cada parte foi entregue, em novembro de 2026. A verificação integrada mais recente é a da [auditoria](validation/accessibility-audit.md).
- **Verificado só no Chromium.** Firefox, Safari, leitor de tela e aparelho real não têm registro de teste ([limites](#o-que-não-foi-verificado)).
- Alguns pontos ainda aguardam confirmação do responsável, listados na spec, seção 17. Eles valem como estão até a decisão, e aparecem aqui marcados como **a confirmar**.

| Seção | Testes e código que a usam |
|---|---|
| [Fundamentos visuais](#fundamentos-visuais) | `site/src/shared/theme.css`, `site/scripts/map-tones.mjs`, `site/tests/map-tones.test.mjs`, `site/browser-tests/visual-foundations.test.mjs` |
| [Primeira tela no celular](#primeira-tela-no-celular) | `site/src/shared/theme.css`, `site/browser-tests/phone-first-screen.test.mjs` |
| [Desktop em tela cheia](#desktop-em-tela-cheia) | `site/src/layouts/Base.astro`, `site/browser-tests/desktop-first-screen.test.mjs` |
| [Painel Meu município](#painel-meu-município) | `site/src/profile/panel-result.ts`, `site/browser-tests/municipal-panel.test.mjs` |
| [Lista](#lista) | `site/browser-tests/list.test.mjs` |
| [Municípios por UF](#municípios-por-uf) | `site/browser-tests/reading-pages.test.mjs` |
| [Como calculamos](#como-calculamos) | `site/src/pages/metodologia.astro`, `site/browser-tests/reading-pages.test.mjs` |

## Páginas e navegação

- O Mapa inicial é um dashboard com o Brasil inteiro, o mapa dominante e o cabeçalho compacto. Abre em até 60 dias × Todos os cânceres × Tendência, sem município selecionado e sem painel vazio.
- Navegação principal: "Mapa", "Municípios por UF" e "Como calculamos". O índice só existe em `/municipios/`, nunca na inicial nem abaixo do mapa.
- A busca de município fica no cabeçalho de todas as páginas.
- O tema é um único controle com nome acessível: lua no claro, para ativar o escuro, e sol no escuro, para ativar o claro.
- Selecionar um município no mapa, na busca, na lista ou por link abre Meu município no próprio dashboard, sem etapa de prévia nem ficha separada.
- O aviso de construção fica em todas as páginas, integral e sem fechar (spec, seção 2).

## Estado e URL

- **Seleção:** no caminho `/municipio/<código>-<nome>/`, um documento estático com o município já no HTML, sem redirect por JavaScript. Busca, clique no mapa e linha da lista atualizam esse caminho pela History API. A inicial `/` fica sem seleção.
- **Parâmetros:** `indicador`, `tipo` (por exemplo `tipo=breast`), `modo=hoje`, `visualizacao=lista` e `theme=light|dark`. Valores iguais ao padrão são omitidos.
- **Compatibilidade:** `?municipio=<código>` é só para links antigos. Com JavaScript, vira o caminho municipal. O caminho prevalece sobre uma query conflitante, e códigos desconhecidos são removidos.
- **Retorno:** `/municipios/?municipio=<código>` carrega a seleção, para o link Mapa preservar tema, recorte e seleção. **A confirmar.**
- **Nada é lembrado entre visitas.** Sem tema válido, o site acompanha o sistema.
- **Link inválido:** corrigido campo a campo, com a URL reescrita para o estado mostrado (spec, seção 11.1).
- Trocas rápidas não exibem resultados da seleção anterior como atuais, e Voltar/Avançar restauram o estado.

## Fundamentos visuais

**Sistema:** neutro, sóbrio e preciso, com a cor reservada aos dados.

- **Fonte:** Inter variável em subconjunto próprio, hospedada no site, com o `≥` e `OFL.txt` publicado (`site/public/fonts/`). `tnum` só nos algarismos, porque a Inter também alargava hífens em texto corrido. Títulos e números em peso 600, rótulos e controles em 500.
- **Escala:** 12, 14, 16, 20, 24 e 32 px, com 12 px como piso. **Espaçamento:** múltiplos de 4 px.
- **Marca:** silhueta do Brasil derivada da malha real, monocromática, na cor do texto.
- **Controles:** preenchidos com o tom suave, sem borda, raio de 8 px, 40 px no desktop e 44 px no celular. O estado ativo inverte texto e superfície. Cartões flutuantes têm raio de 12 px e sombra suave, sem borda. Links sublinhados com filete de 1 px.
- **Tema sem JavaScript:** pela preferência do sistema. O controle de tema some sem JavaScript, porque ali não faria nada.

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

**Por que os tons:** "Sem direção clara" era a classe de 67% dos municípios no estado inicial e dominava o tema escuro. Na paleta anterior, "Melhorando" e "Estável" tinham ΔE 1,5 com protanopia. Agora têm 19,1 no claro e 16,3 no escuro.

**Distâncias:** meta de pelo menos 8, com piso de 6 nos pares que também se distinguem por textura (`site/scripts/map-tones.mjs`). `npm run check:tones --prefix site` passou nos dois temas em 06/11/2026.

**Custos aceitos no tema claro:**

- "Sem direção clara" fica a 1,3:1 do fundo, e o contorno do país perde força.
- "Dado insuficiente" depende dos pontos: ΔE de 6,4 a 6,8 contra "Sem direção clara" e 1,05:1 contra o fundo.
- "Piorando" fica a 2,5:1 do fundo. A legenda e a lista compensam.

## Primeira tela no celular

Vale abaixo de 768 px, com pelo menos 520 px de altura e 300 px de largura: `(max-width: 767px) and (min-width: 300px) and (min-height: 520px)`. Essa condição se repete nos componentes, porque CSS não tem media query nomeada.

- **Tela:** o aviso no topo, e o mapa de ponta a ponta em toda a altura abaixo dele. O resto flutua sobre o mapa. Um dedo move o mapa, a tela do mapa não rola, e o rodapé não é alcançado ali: o menu leva a fontes, licenças e código.
- **Aviso:** faixa invertida, sempre visível, inclusive na Lista e com a página rolada.
- **Cabeçalho:** cartão flutuante com menu hambúrguer, nome e ícone de busca. A busca expande sobre o cabeçalho e fecha ao escolher um município. O menu reúne Mapa, Municípios por UF, Como calculamos, Fontes e condições de reutilização, Código-fonte e tema. **A confirmar:** Fontes, Código-fonte e tema no menu.
- **Filtros:** botão flutuante com o recorte vigente, por exemplo "Até 60 dias · Todos os cânceres · Tendência". Abre uma folha que sobe da base, não modal, com até 50% da altura, seletores nativos de 44 px e o mapa mudando ao vivo. "Ver mapa" fecha. A folha fecha ao abrir o menu ou a busca. **A confirmar:** `popover="manual"`.
- **Legenda:** cartão no canto inferior esquerdo, com período e cada classe à vista. O ⓘ abre a legenda completa. A hachura aparece como "Faixa C".
- **Mapa/Lista:** canto inferior direito. Na Lista, fica fixo na tela.
- **Enquadramento:** o país vai até Fernando de Noronha, e não até a Ilha da Trindade, reservando a altura de Filtros e da legenda (`site/src/map/framing.ts`).
- **Busca:** "1 município encontrado." e "N municípios encontrados.". **A confirmar:** sem "Abrir consulta" nos resultados no modo flutuante.
- **Fora do modo flutuante**, como no zoom de 200%: cabeçalho, seletores, busca, legenda e Mapa/Lista ficam em fluxo, fora do mapa, e a página rola até o rodapé. O botão Filtros não existe nesse modo, porque os seletores ficam à vista.

## Desktop em tela cheia

Vale a partir de 768 px.

- **Primeira tela:** aviso, cabeçalho, filtros e mapa ocupam exatamente a altura da janela, sem margens, cartões nem sombras. Medidas que os testes conferem: mapa com **653 px** a 1280 × 800 e **753 px** a 1440 × 900, iguais com e sem município.
- **Altura mínima:** a composição usa `max(100dvh, 520px)`, com piso de 192 px para o mapa quando as barras crescem. Nada é medido por JavaScript: um item oculto no grid do `body` ocupa as três primeiras linhas.
- **Aviso:** altura mínima de 43 px a partir de 768 px. **A confirmar.**
- **Cabeçalho:** uma linha de **48 px**, com marca, busca, Mapa, Municípios por UF, Como calculamos e tema.
- **Filtros:** uma linha de **56 px** a partir de 1280 px, com rótulo ao lado de cada seletor de 40 px, larguras fixas e Mapa/Lista na ponta direita, com fundo e filete, sem caixa.
- **Saem:** "Explorar em lista". "Panorama territorial" e o nome do indicador continuam só para leitores de tela.
- **Legenda:** encostada no canto inferior esquerdo do mapa, sem sombra, com filete nos lados internos. Mostra período, cada classe e, sem seleção, "A cor mostra a mudança, não um ranking". O ⓘ abre a legenda completa. **A confirmar:** "A cor mostra a distância até a referência, não um ranking.", na Situação.
- **Com município:** painel de **400 px** ao lado do mapa, com a mesma altura e rolagem interna. O mapa só perde largura.
- **Lista:** ocupa a área do mapa e rola por dentro, com filtros e painel à vista.
- **De 768 a 1023 px:** cabeçalho em uma linha, com os links no menu hambúrguer, e filtros em duas linhas.
- **Acima de 1920 px:** painel de **480 px**, seletores sem esticar, e só o mapa cresce.
- **Ressalva dinâmica:** não muda a altura do mapa. Fica encostada sob a barra, no canto superior esquerdo, com 18rem. Na Lista, entra no fluxo.
- **Enquadramento:** ao selecionar, reserva a área da legenda e da ressalva, do lado que custa menos zoom.
- **Rodapé:** depois da primeira tela. A rolagem sobre o mapa dá zoom, então o rodapé se alcança por `End`, Tab ou rolando sobre as barras. O painel tem `tabindex="0"` e rola pelo teclado, assim como a tabela da Lista.
- **Sem JavaScript:** a composição vem só de CSS e da ordem do HTML. Mapa/Lista fica oculto, e a área do mapa traz o link para Municípios por UF. **A confirmar:** o texto "O mapa e os filtros precisam de JavaScript. Consulte os municípios por UF."

## Painel Meu município

- **Bloco de resultado, igual recolhido e aberto:** número em 32 px, o que ele mede e o ano; a classe da leitura do mapa com a cor e a textura do mapa, mais o período da Tendência ou a Referência; no 60 dias, a % de todos os casos sem informação; a origem, quando regional; e o aviso da Faixa C.
- **Dado insuficiente:** o texto ocupa o lugar do número, com a textura de pontos e a explicação. O aviso da Faixa C sai do bloco e fica no Eixo aberto, junto da Tendência do estado e da Ação.
- **Mortalidade:** a taxa em destaque, ao lado da classe, sem contagem de óbitos e sem Situação (spec, seção 11.2).
- **Celular, recolhido:** folha de ponta a ponta na base. Tocar nela a abre. Acima ficam o botão Legenda, com as cores, e Mapa/Lista. O enquadramento desconta a folha e os controles. Até 600 px de altura, os textos auxiliares caem a 12 px, sem cortar nada, e o número continua em 32 px.
- **Celular, aberto:** a folha sobe até o aviso, que nunca é coberto. Cabeçalho, Filtros, Legenda e Mapa/Lista saem de cena. Filtros, menu e busca, quando abertos, tomam o lugar da folha.
- **Desktop:** coluna ao lado do mapa, com o nome fixo no topo.
- **Ações:** um único controle recolhe e expande, só no celular, e ✕ limpa a seleção. Saem "Voltar ao mapa" e "Reabrir".
- **Eixos:** um aberto por vez, começando pelo Eixo do indicador do mapa, com Acesso ao tratamento primeiro. Os fechados mostram os próprios resultados no título. A textura da Faixa C no título vale só para o 60 dias. **A confirmar:** "Fumantes na capital" e "Casos estimados na UF" nos títulos.
- **Ordem no Eixo aberto:** título, período dos dados, Situação e Referência, Tendência, % sem informação, Ação, série e, por fim, fonte e método.
- **Tipo de câncer:** seletor nativo no painel, ligado ao do mapa. Sem JavaScript, links nativos dos seis Tipos.
- **Textos sobre a interface:** saem "Consulta pronta…" e "Meu município — dados sobre…". A nota sobre "Todos os cânceres" fica em "Por que 'Todos os cânceres' muda entre os Eixos?", e a nota de 2018 e 2024 em "O que é este número?".
- **Status:** só para leitores de tela. Selecionar um município não muda a altura do cabeçalho nem dos controles.
- **Foco:** a busca leva o foco ao nome do município. Recolher mantém o foco no controle. Limpar devolve o foco à busca ou ao seu botão. **A confirmar:** o toque no mapa não move o foco.
- **Contorno de seleção:** ganha uma borda externa na cor da superfície.
- **Na próstata:** o painel recolhido usa a versão curta "Sem comparação com o prazo da lei: vigilância ativa pode ser a conduta correta", e o aberto traz o texto integral. **A confirmar:** só a ressalva da próstata sai de cima do mapa com município selecionado.
- **A confirmar:** C55 não calculável sem os pontos, e "Sem dado neste recorte" com amostra neutra, sem os pontos.
- **Fora do modo flutuante:** o painel faz parte de uma página comum, sem folha nem controle de recolher. Um toque no mapa leva a página ao painel.
- **Sem JavaScript:** no celular, a página de município é uma página comum, sem mapa nem filtros, com os Eixos abertos. O bloco de resultado existe só com JavaScript, e o número fica no cartão.

### Campos do Contrato de dados

O painel usa resultados prontos do pipeline e não amplia o contrato por conveniência visual. Interfaces: `site/src/map/indicator-layer.ts` e `site/src/profile/profile.ts`.

| Informação | Origem |
|---|---|
| Nome, UF, código e Região imediata | `site/public/dados/municipalities.json` |
| Valor, Tendência, Situação e origem | `municipalities[code]` da camada: `value`, `trend`, `status`, `origin` |
| Referência | `reference`, `has_status` |
| Período do valor, série e Tendência | `period.latest`, `first_year`, `last_year`, `trend`, `provisional` |
| Recorte do tratamento | `period.value_cases`, `trend_cases` |
| Qualidade e % sem informação | `quality`, `quality_band`, `without_treatment_info`, `period.quality_years` |
| Ressalvas variáveis | `status_note`, `adjustment_note`; `denominator_note` na ficha do HPV |
| Série e contexto | Ficha por UF: `series_id`, `series`, `uf_trend` ou `national_trend` |
| Fonte e atualização | `source`, `manifest.json` |
| Ação e ressalvas fixas | `site/src/content/actions.ts` e cartões |

### Exceções por indicador

- **Mortalidade:** só Tendência, sem Situação nem Referência. Ajuste C55 não calculável não vira Dado insuficiente.
- **HPV:** só Situação e a explicação "série curta, ainda sem direção", sem inventar classe de Tendência. Preserva as notas de denominador e de dose única.
- **Tratamento na próstata:** sem Situação, respeitando `has_status`.
- **Dado regional:** "seu município e vizinhos" e o nome da região junto do resultado.
- **Faixa C:** aviso e % sem informação, com hachura só no tratamento. O período da qualidade não se confunde com o ano do valor.

## Lista

Substitui o mapa na mesma área, pelo alternador "Mapa | Lista", preservando filtros e seleção. Ordem por UF e nome, sem ranking. Sem JavaScript, a Lista não é oferecida, e o caminho é Municípios por UF.

- **Forma estreita:** abaixo de **640 px da largura da própria Lista**, por container query, e não da janela. Assim também aparece a 768 px com o painel aberto. Cada linha mostra nome, classe com a cor e a textura do mapa, marca "Faixa C" quando houver e valor em 20 px. O ⌄ abre, na própria linha, UF, a outra leitura, nota do valor, % sem informação, origem do dado e qualidade do registro. O nome abre Meu município.
- **Exceção aprovada:** na forma estreita, a origem regional e a % sem informação ficam na linha aberta. No painel, a origem continua junto do resultado.
- **Forma larga:** tabela real com filetes, cabeçalho e coluna do município fixos, valores em algarismos tabulares alinhados à direita, rolando por dentro da área do mapa. A 1280 px com o painel, a Lista fica com 880 px, e as últimas colunas ficam na rolagem interna.
- **Barra:** seletor de UF e contagem. No celular, só essa linha fica fixa ao rolar. Cabeçalho e Filtros saem de vista.
- **Notas:** o parágrafo longo vai para "Como ler esta lista", com o aviso da Faixa C. Fica à vista o período da Tendência, ou a Referência em "como está hoje", e o ano do valor.
- **Semântica:** papéis ARIA de tabela nas duas formas, `aria-colindex`, rótulos em texto real e `aria-expanded` no controle da linha. "Dados em lista" e a legenda da tabela continuam só para leitores de tela. A árvore de acessibilidade do Chromium foi conferida. **Falta conferir com leitor de tela.**
- **A folha do painel:** garante o alcance: a rolagem leva a última linha acima dela, e o foco do teclado não fica embaixo. Enquanto a pessoa rola, linhas passam por trás da folha e de Mapa/Lista.
- **A confirmar:** "Tendência: Série curta, ainda sem direção" no HPV; "por 100 mil" em 12 px sob o número da mortalidade; linhas que continuam abertas ao trocar filtros; Faixa C com Dado insuficiente sem a marca na linha fechada.

## Municípios por UF

- Linhas separadas por filete, com sigla, nome completo e quantidade de municípios, e links de 44 px em colunas ao abrir. A expansão usa `details`, sem JavaScript.
- Os links levam aos documentos municipais, com os quatro Eixos, Ações, ressalvas, fontes e seis Tipos no HTML.
- O cabeçalho é uma faixa no fluxo da página, sem cartão flutuante, com menu hambúrguer abaixo de 1024 px. Saem "← Voltar ao mapa" e os rótulos acima dos títulos. O link Mapa preserva o estado.
- **Busca:** a lista de municípios carrega só ao focar o campo, e cada resultado é um link para `/municipio/<código>-<nome>/`. Se a lista falha, há "Tentar novamente" e o link para esta página. Sem JavaScript, o campo sai e fica o ícone que leva a Municípios por UF.

## Como calculamos

- `/metodologia/` mantém o conteúdo e as 11 âncoras. O cabeçalho e a busca seguem [Municípios por UF](#municípios-por-uf).
- **A partir de 881 px:** sumário fixo na lateral, sem caixa, com a seção atual marcada, e coluna de leitura de 44 rem. Seções separadas por filete, sem caixas.
- **Abaixo de 881 px:** uma linha fixa, "Nesta página" com a seção atual, abre o índice sobre o texto. Fecha ao escolher uma seção e com Esc. Sem JavaScript, o índice fica no fluxo da página. A linha só é fixa com ao menos 300 px de largura e 300 px de altura.
- **Âncoras:** caem abaixo do aviso e do sumário a 320, 390, 768 e 1280 px, em teste automatizado.
- **Foco:** Tab vai do botão à lista. Esc fecha e volta ao botão. Ao escolher, o foco vai para a seção, com `tabindex="-1"`. Um `scroll-margin` evita que o teclado deixe o foco atrás da linha fixa.
- **A confirmar:** o índice também fecha com clique fora e ao sair dele com Tab; a linha do sumário e os resultados da busca sem preenchimento nem sublinhado.

## Sem mapa ou sem JavaScript

- Busca e lista iniciam sem depender da malha nem do WebGL, com carregamento, falha e nova tentativa próprios. A falha do mapa mantém a consulta utilizável.
- **Sem JavaScript:** a área do mapa traz o link para `/municipios/`, de onde se alcançam os documentos municipais. Menu e folha de Filtros abrem, com seletores desativados, aviso e o mesmo link. O ícone de busca é um link para Municípios por UF (**a confirmar**).
- Query string sozinha não seleciona conteúdo num servidor estático. Os caminhos são pré-gerados, sem redirect na hospedagem.
- Âncoras municipais antigas continuam levando aos seis Tipos, e as da Metodologia às seções.

## Limites aceitos

Conhecidos e aceitos ao entregar cada parte:

- **Texto de gráfico:** 12,6 px a partir de 768 px, mas 6,5 px a 320 px, abaixo do piso de 12 px. Corrigir exige redesenhar o gráfico, e a série continua legível em "Ver a série em tabela".
- **Aviso a 320 px com zoom de 200%:** ocupa 212 de 450 px, 47% da altura. A 320 px sem zoom, 94 de 900 px.
- **Teclado com todas as UFs na Lista:** 5.571 links e 5.571 botões na ordem de tabulação. O filtro por UF é a saída.
- **Distância de cor:** no tema claro, "Longe" contra "Dado insuficiente" fica em 7,2 a 7,5, abaixo da meta de 8. **Esse par não foi listado na decisão de tons**, e passa pelo piso de 6.
- **Glifos:** `☾`, `☀`, `☷`, `ⓘ` e `Σ` não existem na Inter e vêm da fonte do sistema, então variam por aparelho.
- **Rótulos de ajuda da legenda:** 24 px no desktop, sem preenchimento, e 44 px no celular.
- **Filtros de 1024 a cerca de 1150 px:** duas linhas. A decisão só pede uma linha a partir de 1280 px.
- **Ressalva abaixo de 1280 px:** não foi conferida e pode tocar o noroeste do Brasil. Uma ressalva que aparece depois da seleção não refaz o enquadramento.
- **Enquadramento no celular:** feito uma vez. Trocar a leitura ou girar a tela não o refaz, para não desfazer o que a pessoa moveu. A 320 × 568, o país fica com cerca de 190 px de altura.
- **Zoom de 200% com município:** o painel vem depois do mapa e da Lista, então quem abre um link direto precisa rolar.

## O que não foi verificado

- **Leitor de tela:** sem sessão registrada. O roteiro está na [auditoria](validation/accessibility-audit.md#roteiro-humano-pendente).
- **Firefox e Safari:** sem registro. O grid do `body` e o foco na âncora só foram vistos no Chromium.
- **Aparelho real:** declarado pelo responsável, sem registro de aparelho, sistema ou navegador. Teclado virtual só em emulação, descontando uma altura típica. Ficam sem conferência a altura verdadeira, o deslocamento no Safari e o `100dvh` com o teclado aberto.
- **Enquadramento e contorno dentro do WebGL:** conferidos em capturas, não por teste automático.
- **Falha intermitente:** o teste do cabeçalho em `/municipios/` com JavaScript falhou duas vezes contra o servidor de desenvolvimento, logo após editar arquivos, sem causa confirmada. Rode a suíte contra a saída estática.
- **Gesto de arrastar a folha:** não foi implementado.
