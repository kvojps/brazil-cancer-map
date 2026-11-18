# Contrato de interface

As decisões de UI que os testes e o CSS usam como contrato. Comentários no código citam estas seções pelo nome, por exemplo `docs/ui-contract.md, section Painel Meu município`. A regra de produto está na [spec](spec.md), seção 11, e os links municipais no [ADR 10](adr/0010-static-municipal-links.md).

**Como ler:**

- O que está aqui foi escolhido pelo responsável sobre protótipos e implementado depois. Os testes de navegador passaram quando cada parte foi entregue, em novembro de 2026. A verificação integrada mais recente é a da [auditoria](validation/accessibility-audit.md).
- **Verificado só no Chromium.** Firefox, Safari, leitor de tela e aparelho real não têm registro de teste ([limites](#o-que-não-foi-verificado)).
- Alguns pontos ainda aguardam confirmação do responsável, listados na spec, seção 17. Eles valem como estão até a decisão, e aparecem aqui marcados como **a confirmar**.

| Seção | Testes e código que a usam |
|---|---|
| [Fundamentos visuais](#fundamentos-visuais) | `site/src/shared/theme.css`, `site/scripts/map-tones.mjs`, `site/tests/node/map-tones.test.mjs`, `site/tests/browser/visual-foundations.test.mjs` |
| [Primeira tela no celular](#primeira-tela-no-celular) | `site/src/shared/theme.css`, `site/tests/browser/phone-first-screen.test.mjs` |
| [Desktop em tela cheia](#desktop-em-tela-cheia) | `site/src/layouts/Base.astro`, `site/tests/browser/desktop-first-screen.test.mjs` |
| [Painel Meu município](#painel-meu-município) | `site/src/profile/panel-result.ts`, `site/tests/browser/municipal-panel.test.mjs` |
| [Lista](#lista) | `site/tests/browser/list.test.mjs` |
| [Municípios por UF](#municípios-por-uf) | `site/tests/browser/reading-pages.test.mjs` |
| [Como calculamos](#como-calculamos) | `site/src/pages/metodologia.astro`, `site/tests/browser/reading-pages.test.mjs` |

## Páginas e navegação

- O Mapa inicial é um dashboard com o Brasil inteiro, o mapa dominante e o cabeçalho compacto. Abre em até 60 dias × Todos os cânceres × Tendência, sem município selecionado e sem painel vazio.
- Navegação principal: "Mapa", "Municípios por UF" e "Como calculamos". O índice só existe em `/municipios/`, nunca na inicial nem abaixo do mapa.
- **Logo e item Mapa:** a logo reinicia a exploração em Mapa, Brasil inteiro, até 60 dias × Todos os cânceres × Tendência, sem seleção, painel, detalhes, âncora ou superfície temporária; preserva somente tema válido explícito, ou o acompanhamento do sistema. Com JavaScript no dashboard, mantém o foco na marca quando acionada por teclado e invalida respostas e chegadas municipais pendentes. Cria uma entrada quando muda o estado; repetir no estado inicial não duplica entradas. Voltar recupera a consulta anterior e Avançar retorna ao reset. O item Mapa conserva município, recorte, visualização e tema, inclusive desde páginas de leitura. Limpar seleção conserva filtros, visualização e câmera; recolher detalhes conserva a consulta. Links modificados e navegação sem JavaScript mantêm o comportamento nativo.
- A busca de município fica no cabeçalho de todas as páginas.
- O tema é um único controle com nome acessível: lua no claro, para ativar o escuro, e sol no escuro, para ativar o claro.
- Selecionar um município no mapa, na busca, na Lista ou por link apresenta Meu município no próprio dashboard: resumo recolhido no celular e consulta completa no desktop, sem ficha separada.
- O aviso de construção fica no topo de todas as páginas, sem dispensar a faixa. Na abertura normal mobile em retrato, o texto integral é visível sem corte nem rolagem. No dashboard mobile com JavaScript, quando faltar espaço ao texto e à interface nas dimensões e ampliação atuais, mostra “Em construção · Ler aviso”, sem reduzir fontes (spec, seção 2).

## Estado e URL

- **Seleção:** no caminho `/municipio/<código>-<nome>/`, um documento estático com o município já no HTML, sem redirect por JavaScript. Busca, clique no mapa e linha da lista atualizam esse caminho pela History API. A inicial `/` fica sem seleção.
- **Parâmetros:** `indicador`, `tipo` (por exemplo `tipo=breast`), `modo=hoje`, `visualizacao=lista` e `theme=light|dark`. Valores iguais ao padrão são omitidos.
- **Compatibilidade:** `?municipio=<código>` é só para links antigos. Com JavaScript, vira o caminho municipal. O caminho prevalece sobre uma query conflitante, e códigos desconhecidos são removidos.
- **Retorno:** `/municipios/?municipio=<código>` carrega a seleção, para o link Mapa preservar tema, recorte e seleção. **A confirmar.**
- **Nada é lembrado entre visitas.** Sem tema válido, o site acompanha o sistema.
- **Link inválido:** corrigido campo a campo, com a URL reescrita para o estado mostrado (spec, seção 11.1).
- Trocas rápidas não exibem resultados da seleção anterior como atuais. Seleção, limpeza, logo e Voltar/Avançar invalidam respostas obsoletas; interação deliberada durante carga cancela direcionamento tardio, sem impedir o conteúdo atual.
- **Recarga:** conserva o estado representado na URL e revela âncora explícita. Âncora válida de Tipo prevalece sobre Tipo anterior. Posições internas e câmera não são parâmetros públicos nem exigem persistência após recarga. Links com modificadores mantêm o comportamento nativo.

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

Com JavaScript, vale abaixo de 768 px, inclusive em paisagem, altura reduzida e
ampliação. A viewport visual determina a altura disponível. Sem JavaScript,
a consulta municipal mantém a leitura completa e a rolagem normal do documento.

- **Tela:** o aviso no topo, e o mapa de ponta a ponta em toda a altura abaixo dele. O resto flutua sobre o mapa. Um dedo move o mapa, a tela do mapa não rola, e o rodapé não é alcançado ali: o menu leva a fontes, licenças e código.
- **Aviso:** faixa invertida, sempre visível, inclusive na Lista e com a página rolada.
- **Cabeçalho:** cartão flutuante com menu hambúrguer, nome e ícone de busca. A busca expande sobre o cabeçalho e fecha ao escolher um município. O menu reúne Mapa, Municípios por UF, Como calculamos, Fontes e condições de reutilização, Código-fonte e tema. **A confirmar:** Fontes, Código-fonte e tema no menu.
- **Filtros:** botão flutuante com o recorte vigente, por exemplo "Até 60 dias · Todos os cânceres · Tendência". Abre uma folha que sobe da base, não modal, com até 50% da altura, seletores nativos de 44 px e o mapa mudando ao vivo. "Ver mapa" ou Escape fecha. A folha usa `popover="manual"` e fecha ao abrir o menu, a busca ou a legenda.
- **Coordenação temporária:** O menu do cabeçalho, Busca, Filtros e Legenda abrem um por vez no modo flutuante. Busca e Filtros ficam na exploração, e Legenda aparece junto do resultado no resumo e nos detalhes. A troca fecha a superfície anterior e leva o foco ao primeiro controle da nova; fechar devolve o foco ao invocador visível, inclusive ao botão Legenda do painel. O retorno preserva Mapa/Lista, seleção, filtros aplicados, posição, zoom, UF, linhas abertas e estado do painel, sem entrada nova no histórico. Fechar busca sem seleção mantém a consulta anterior. Selecionar outro município pela busca, inclusive com Enter, fecha a busca, foca o nome e apresenta o novo resumo recolhido; durante a carga, nenhum resultado anterior aparece como atual. Busca e Lista continuam independentes do mapa, e a composição desktop mantém seus controles permanentes.
- **Legenda:** cartão no canto inferior esquerdo, com período e cada classe à vista. O ⓘ abre a legenda completa. A hachura aparece como "Faixa C".
- **Mapa/Lista:** canto inferior direito no Mapa. Na Lista flutuante, fica ao lado de Filtros, acima da área rolável.
- **Enquadramento:** o país vai até Fernando de Noronha, e não até a Ilha da Trindade, reservando a altura de Filtros e da legenda (`site/src/map/framing.ts`).
- **Busca:** "1 município encontrado." e "N municípios encontrados.". **A confirmar:** sem "Abrir consulta" nos resultados no modo flutuante.
- **Adaptação ao espaço:** o resumo permanece inferior e sobreposto, com rolagem interna e fontes preservadas. A reserva para exploração diminui com o espaço disponível e pode chegar a zero: não se exige mapa simultaneamente visível no extremo. A barra dos detalhes e o conteúdo têm rolagens próprias. O aviso permanece no topo. Quando necessário, “Ler aviso” abre a mensagem integral sobre o dashboard, com leitura rolável, Fechar alcançável, Esc e retorno do foco ao acionador; fechar mantém a faixa compacta. Recuperar altura restaura automaticamente a faixa integral, preservando a leitura já aberta e foco visível. Se o acionador desaparecer com foco, o destino é Fechar na leitura aberta ou a mensagem integral. A leitura compartilha a coordenação de uma superfície por vez com busca, Menu, filtros e legenda, inclusive sobre detalhes. Abrir/fechar não altera URL, histórico, seleção, filtros, Mapa/Lista, Eixo ou posições internas (salvo o novo máximo rolável). Desktop, documentos de leitura e acesso sem JavaScript conservam o aviso integral.
- **Exploração extrema:** quando a altura útil não conserva a reserva normal para exploração, ou a largura é muito estreita, cabeçalho e exploração ganham áreas internas roláveis. Busca, filtros, Menu e legenda continuam alcançáveis. Os tamanhos demonstrativos do protótipo não são breakpoints universais nem garantia para qualquer altura arbitrária.
- **Recuperação:** altura e largura podem mudar sem nova entrada no histórico, preservando consulta, filtros, visualização e Eixo. A leitura interna conserva sua posição, limitada somente ao novo máximo. Não há compactação de fontes ou remoção de ressalvas para caber.
- **Sem JavaScript e páginas de leitura:** mantêm a rolagem normal. Desktop preserva sua composição existente.


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

- **Controles no celular:** Os alvos de “Ver detalhes”, “Compartilhar”, dos dois controles ×, de Legenda e do seletor nativo de Tipo de câncer têm pelo menos 44 × 44 px, com 8 px de separação entre alvos adjacentes. Nomes longos quebram linha ao lado do ×. Controles e valor selecionado podem ocupar novas linhas com texto ampliado.
- **Resumo do Indicador:** número em 32 px, o que ele mede e o ano; a classe da leitura do mapa com a cor e a textura do mapa, mais o período da Tendência ou a Referência; no 60 dias, a % de todos os casos sem informação; a origem, quando regional; e o aviso da Faixa C.
- **Dado insuficiente:** o texto ocupa o lugar do número, com a textura de pontos e a explicação. O aviso da Faixa C sai do bloco e fica no Eixo aberto, junto da Tendência do estado e da Ação.
- **Mortalidade:** a taxa em destaque, ao lado da classe, sem contagem de óbitos e sem Situação (spec, seção 11.2).
- **Celular, recolhido:** A folha ocupa a base de ponta a ponta e mostra nome/UF, resultado e período. “Ver detalhes” é o único botão preenchido, e o × junto ao nome, “Limpar seleção”, encerra a seleção. Legenda aparece como ajuda discreta junto ao resultado. Tocar no texto conserva o resumo. Mapa/Lista fica acima da folha. O enquadramento desconta a folha e os controles. Resumos longos rolam internamente, mantendo origem regional, Faixa C, ressalvas e comandos alcançáveis.
- **Celular, aberto:** A folha ocupa toda a área abaixo do aviso. O nome e o único ×, “Fechar detalhes”, ficam no topo da barra, com o × no canto superior direito. A área de leitura reúne resultado, Legenda, o seletor de Tipo de câncer e os Eixos. Em altura reduzida, a barra e a leitura admitem rolagem própria. Busca e Filtros voltam a ficar disponíveis na exploração ao recolher.
- **Desktop:** coluna ao lado do mapa, com o nome fixo no topo.
- **Ações:** “Ver detalhes” expande a consulta no celular. “Fechar detalhes” recolhe e devolve o foco a “Ver detalhes”, com município, filtros e contexto de Mapa ou Lista preservados. “Limpar seleção” encerra a seleção no resumo. Os quatro Eixos e as Ações continuam acessíveis com Dado insuficiente.
- **Compartilhar:** botão secundário ao lado de “Ver detalhes” no resumo, com quebra de linha quando faltar espaço. Nos detalhes móveis, ícone e texto ficam abaixo do nome e antes do resultado. No desktop, ficam junto ao nome. A ação usa a rota municipal estática e serializa apenas o recorte normalizado atual, omitindo padrões. O destinatário chega ao Mapa com o tema do aparelho, no resumo em telas móveis, e pode ler a consulta básica sem JavaScript. A URL e o histórico de quem envia são preservados. O compartilhamento nativo precede a tentativa de cópia, e o cancelamento retorna à consulta. “Link copiado” aparece por três segundos em uma região de status, alinhado ao botão quando houver espaço. Cada nova cópia reinicia esse prazo. Se a cópia falhar, “Link da consulta municipal” é um campo somente leitura que recebe foco com o endereço selecionado.
- **Eixos:** um aberto por vez; Ver detalhes abre o Eixo do Indicador, salvo âncora explícita. Trocar Tipo conserva o Eixo em leitura. Se a normalização mudar o Indicador, revela o Eixo correspondente. Um Eixo sem Indicador pertinente mantém explicação e Ações. Acesso ao tratamento continua primeiro na ordem dos Eixos. Os fechados mostram os próprios resultados no título. A textura da Faixa C no título vale só para o 60 dias. **A confirmar:** "Fumantes na capital" e "Casos estimados na UF" nos títulos.
- **Ordem no Eixo aberto:** título, período dos dados, Situação e Referência, Tendência, % sem informação, Ação, série e, por fim, fonte e método.
- **Tipo de câncer:** O seletor nativo fica junto ao rótulo e acompanha o recorte do Mapa ou da Lista. No celular, o valor selecionado quebra linha quando necessário. Sem JavaScript, a consulta oferece links nativos dos seis Tipos.
- **Textos sobre a interface:** saem "Consulta pronta…" e "Meu município — dados sobre…". A nota sobre "Todos os cânceres" fica em "Por que 'Todos os cânceres' muda entre os Eixos?", e a nota de 2018 e 2024 em "O que é este número?".
- **Anúncio da seleção:** só para leitores de tela. Selecionar um município não muda a altura do cabeçalho nem dos controles.
- **Foco:** a busca leva o foco ao nome do município. Expandir leva o foco ao nome nos detalhes; recolher devolve ao botão “Ver detalhes”. O conteúdo recolhido sai da ordem de foco. Limpar devolve o foco à busca ou ao seu botão. O toque no mapa conserva o foco da exploração; não existe chegada tardia ao nome. A busca foca o nome sem rolar o documento e fecha o campo, retirando dele o foco.
- **Histórico e contexto:** abrir detalhes acrescenta uma entrada ao histórico; o primeiro Voltar recolhe, os seguintes percorrem municípios e filtros. Voltar/Avançar restauram os detalhes quando pertinente, o Eixo em leitura e as posições internas dos detalhes e da Lista por entrada, incluindo UF e expansões, durante a visita; restaurar não cria entradas. A câmera não exige snapshot por entrada. O retorno explícito reutiliza a entrada anterior, sem duplicar etapas. Links entre Eixos atualizam a âncora na mesma entrada de detalhes; a chegada por âncora abre diretamente o Eixo solicitado na própria entrada, sem criar etapa artificial; seu controle de retorno recolhe e retira a âncora com substituição da entrada. Mapa/Lista preservam seleção, filtros, posição e zoom do mapa, UF e linhas abertas da Lista e a posição de rolagem de cada visualização durante a visita.
- **Falha:** mensagem e “Tentar novamente” no resumo, sem expansão automática. O mapa continua disponível; falha, Dado insuficiente e “Sem dado neste recorte” são estados distintos. Uma resposta atrasada nunca aparece como resultado da seleção atual. Lista municipal, camada, mapa/malha e perfil têm falhas e saídas separadas; nova tentativa não cria entrada nem abre detalhes. O mapa oferece “Tentar mapa novamente” e descarta a instância incompleta após falha da malha. Busca, Lista e consulta independem do WebGL.
- **Contorno de seleção:** ganha uma borda externa na cor da superfície.
- **Toque no canvas:** seleciona e destaca o município e, no modo de folha, apresenta somente o painel recolhido, sem tooltip concorrente. Remove o hover anterior. Tooltip e contorno de hover voltam com movimento real de mouse, inclusive em dispositivo híbrido e independentemente da largura. O tooltip não intercepta o ponteiro nem o toque.
- **Rotação e viewport visual:** preservam seleção, filtros, Eixo e histórico; não reenquadram o município nem a UF. Depois da mudança de tamanho ou composição, a câmera só recebe o deslocamento mínimo para revelar seleção encoberta, sem alterar o zoom. A busca tem rolagem interna quando a altura útil cai; resultados e controles permanecem alcançáveis.
- **Câmera:** seleção pelo mapa preserva zoom e posição. Se o painel ou os controles encobrirem o ponto tocado, apenas o menor deslocamento que o revele é permitido, sem zoom. Busca e link direto enquadram os limites do município, usando a malha já carregada e a área útil fora das sobreposições. A chegada dos dados ao painel respeita a origem da seleção, sem reenquadrar a UF.
- **Na próstata:** resumo recolhido e detalhes exibem a mesma ressalva integral, inclusive em composição flutuante. **A confirmar:** só a ressalva da próstata sai de cima do mapa com município selecionado.
- **A confirmar:** C55 não calculável sem os pontos, e "Sem dado neste recorte" com amostra neutra, sem os pontos.
- **Chegada ao resumo:** canvas, busca e link municipal sem âncora começam recolhidos, sem deslocamento externo após a carga, inclusive com cache ou nova tentativa. O conteúdo anterior sai durante a nova seleção. Nova seleção ou limpeza invalida respostas anteriores; interação deliberada cancela reenquadramento tardio. A Lista preserva a exploração ao selecionar nomes; a composição extrema mantém rolagem interna, conforme a #50; detalhes e comandos foram adaptados na #46.
- **Sem JavaScript:** no celular, a página de município é uma página comum, sem mapa nem filtros, com os Eixos abertos. O bloco de resultado existe só com JavaScript, e o número fica no cartão. Com JavaScript, uma âncora municipal abre o painel e o Eixo de destino; não é necessário passar pelo botão para alcançar o destino do link.

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
- **Barra:** seletor de UF e contagem. Na composição flutuante mobile, cabeçalho, Filtros e Mapa/Lista permanecem disponíveis acima da Lista. As linhas rolam dentro do espaço restante, sem rolagem externa, inclusive com resumo municipal sobreposto. Mapa/Lista fica ao lado de Filtros para não interceptar as linhas.
- **Notas:** o parágrafo longo vai para "Como ler esta lista", com o aviso da Faixa C. Fica à vista o período da Tendência, ou a Referência em "como está hoje", e o ano do valor.
- **Semântica:** papéis ARIA de tabela nas duas formas, `aria-colindex`, rótulos em texto real e `aria-expanded` no controle da linha. "Dados em lista" e a legenda da tabela continuam só para leitores de tela. A árvore de acessibilidade do Chromium foi conferida. **Falta conferir com leitor de tela.**
- **A folha do painel:** a área interna inclui espaço final para trazer a última linha, inclusive expandida, acima do resumo. O foco por teclado também respeita essa área. As linhas podem passar atrás do resumo durante a exploração. Notas abertas rolam em área própria sem tomar toda a Lista.
- **Seleção e contexto:** selecionar o nome atualiza o caminho municipal e apresenta resumo recolhido, mantendo Lista, UF, expansões, filtros e posição interna; expandir uma linha é ação distinta. Alternar Mapa/Lista recupera o contexto de cada visualização durante a visita. Não serializa câmera ou posições na URL, não persiste entre visitas e não reescreve milhares de links só por mudar a seleção. Busca e Lista funcionam com WebGL indisponível ou malha pendente, com falha e nova tentativa independentes do mapa. Com pouco espaço, a exploração da Lista e seus comandos admitem rolagem interna.
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

- **Texto de gráfico:** a limitação de 6,5 px a 320 px foi corrigida na #30; valem as regras de [séries históricas em telas estreitas](#séries-históricas-em-telas-estreitas), com texto de 16 px e alternativa em tabela.
- **Aviso a 320 px com zoom de 200%:** a medição anterior (212 de 450 px) usava o texto longo. A #45 entrega a redação curta aprovada na #44; a conferência extrema e seus limites estão descritos no [roteiro mobile](mobile-validation.md).
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
- **WebGL:** `map-touch.test.mjs` verifica toque emulado no canvas, contorno e preservação da câmera por geografia visível. Isso não comprova toque ou GPU de aparelho físico; a [verificação integrada](mobile-validation.md) registra os limites.
- **Falha intermitente:** o teste do cabeçalho em `/municipios/` com JavaScript falhou duas vezes contra o servidor de desenvolvimento, logo após editar arquivos, sem causa confirmada. Rode a suíte contra a saída estática.
- **Gesto de arrastar a folha:** não foi implementado.

## Séries históricas em telas estreitas

Os cinco gráficos de série compartilham a apresentação responsiva, sem refazer
estatística: apenas as coordenadas horizontais são adaptadas à largura do cartão.
Mantêm altura de 200 px, rótulos de 16 px, margem esquerda de 64 px e direita de
32 px; anos finais alinham à direita e a nota de dose única permanece dentro do
gráfico. A largura mínima é 240 px: abaixo dela, a rolagem fica restrita ao
gráfico, com foco por teclado, mantendo o piso de 12 px. Sem JavaScript, o SVG
original de 570 px permanece legível em uma área com rolagem. A série em tabela
continua disponível em todos os casos.

Os comandos e limites de verificação estão no [roteiro mobile](mobile-validation.md). Teclado virtual é aproximado por
redução de área útil; não existe evidência de verificação física nesta entrega.
