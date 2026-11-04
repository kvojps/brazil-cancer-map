# Qual direção visual torna o dashboard claro, acolhedor e consistente?

> Registro histórico: a apresentação e a hierarquia foram substituídas pela alternativa A aprovada no [ticket 35](../../mvp-implementacao/issues/35-prototipo-dashboard-de-observabilidade.md). Consultar a [spec vigente](../spec.md) e o [handoff aprovado](../observability-handoff.md); o status deste ticket registra a entrega anterior.
Labels: wayfinder:prototype
Type: prototype
**Status:** resolved
Assignee: codex
Parent: ../map.md
Blocked by: 03

## Question

Criar alternativas descartáveis para avaliação humana da inicial e Meu município, em desktop e celular, usando a hierarquia aprovada. Explorar tipografia, espaçamento, superfícies, navegação, cartões, séries, legenda e composição em torno do mapa central. Cobrir ausência de dados, dado regional, qualidade C e períodos diferentes, sem inventar números apresentados como reais.

Validar com o responsável a direção e as interações; documentar os padrões reutilizáveis e o que permanece em aberto. Nenhuma alternativa está aprovada sem essa avaliação.

## Answer

Direção aprovada pelo responsável em 2026-11-04: “Ok, aprovado”, após escolher C, solicitar modo escuro e ajustar a altura do painel territorial.

### Padrões aprovados

- **Mapa imersivo (C)**: composição de dashboard moderno, com mapa central em superfície contínua, filtros em painel horizontal e prévia municipal lateral. Sem abertura editorial ou aparência de blog.
- **Tipografia e superfícies**: sem serifa, títulos compactos, hierarquia por peso e tamanho, controles compactos, bordas discretas, cantos arredondados e sombras suaves. A prévia e os cartões usam superfícies distintas do fundo do mapa.
- **Painel “Seu território”**: preenche toda a altura da linha do mapa no desktop, tanto sem seleção quanto com prévia. Não fica preso na rolagem. No celular, mapa e prévia se empilham e os blocos têm altura natural.
- **Dois temas**: claro e escuro, com alternador na navegação. Na ausência de escolha explícita, acompanhar a preferência do sistema. No protótipo, a escolha é compartilhável por `theme=light|dark`, sem armazenamento entre visitas; a política definitiva de URL da implementação fica para a especificação de handoff.
- **Semântica preservada**: adaptar fundos, painéis, texto, controles e malha neutra ao tema, mantendo os significados e cores de Tendência/Situação e texturas de dado insuficiente/qualidade C. Não aplicar inversão global de cores ao mapa.
- **Leitura dos indicadores**: território, origem regional, período e ressalvas ficam próximos do resultado; Referência quando aplicável, Ação mantida mesmo sem dados, percentual sem informação junto ao tratamento. A ficha completa mantém os quatro Eixos, Acesso ao tratamento primeiro, e preserva Tipo de câncer na navegação conforme a decisão de hierarquia.

### Artefato e limites

Fonte primária: branch descartável local `prototype/ui-ux-v1`, versão final `2225bdd`, na worktree `/tmp/brazil-cancer-ui-prototype`. Arquivo `site/src/components/VisualPrototype.astro`, montado apenas em desenvolvimento na inicial. Links e comando de execução nos comentários abaixo. Preservar o protótipo como referência, sem merge no produto.

A aprovação é da direção visual e dos ajustes apresentados. O protótipo usa números fictícios e malha sem classes estatísticas; não valida cálculos, dados reais, elegibilidade de filtros nem associação entre clique e município. Meu município é uma vista simulada; as demais seções são esboços. Não houve auditoria de contraste, teste formal de usabilidade, medição de desempenho ou comprovação de acessibilidade. Textos ilustrativos de Ação não substituem revisão editorial/clínica.

Aplicação às demais páginas, especificação verificável, comportamento sem JavaScript e critérios de acessibilidade/desempenho ficam em [Como aplicar a direção às demais páginas e entregar uma especificação verificável?](05-padrao-das-paginas-e-handoff.md). Não foi identificada necessidade comprovada de ampliar o contrato de dados; verificar os campos existentes ao especificar a prévia. Implementação e publicação permanecem fora deste esforço.

## Comments

### Alinhamento do painel territorial — 2026-11-04

A pedido do responsável, o painel “Seu território” da alternativa C passa a preencher a altura da linha do mapa no desktop (`align-self: stretch`), sem posicionamento fixo na rolagem. No celular, os blocos continuam empilhados com altura natural. Aplica-se aos dois temas e aos estados com e sem seleção.

### Direção escolhida e modo escuro — 2026-11-04

O responsável escolheu expressamente a alternativa C (Mapa imersivo) e pediu também modo escuro. A direção C está escolhida; a revisão de tema continua sujeita à avaliação humana.

Adicionado botão de alternância claro/escuro na navegação do protótipo. Sem `theme` na URL, usa a preferência do sistema; `theme=light` ou `theme=dark` fixa o tema compartilhável. A alternância mantém município simulado, Tipo de câncer, cenário e vista. Sem armazenamento entre visitas. Fundos, painéis, controles, textos, gráfico ilustrativo e malha neutra se adaptam; cores semânticas da Tendência e texturas permanecem. C passa a ser a variante padrão interna; os links de avaliação continuam usando `variant=C`.

Avaliar [C em modo claro](http://127.0.0.1:4322/?variant=C&theme=light) e [C em modo escuro](http://127.0.0.1:4322/?variant=C&theme=dark), incluindo prévia, ficha, qualidade C e dado insuficiente no celular. `npm run check` passou sem diagnósticos. Ainda sem auditoria de contraste ou inspeção visual automatizada. Sem mudança no produto.

### Revisão após avaliação — 2026-11-04

O responsável considerou as primeiras alternativas com aparência de blog e pediu um visual mais moderno. A rodada editorial não foi aprovada. Revisados os protótipos nos mesmos links: Painel claro (A), Central de análise com cabeçalho escuro e filtros laterais (B), Mapa imersivo com painéis sobre superfície contínua (C). Tipografia sem serifa, abertura compacta, controles menores, bordas discretas e superfícies de dashboard substituem o tratamento editorial. Mantidos os cenários e ressalvas. `npm run check` passou sem diagnósticos; avaliação visual da revisão continua pendente.

### Protótipos para avaliação — 2026-11-04

- Artefato preservado no branch descartável local `prototype/ui-ux-v1`, commit `90fbaf2` (`prototype: explore three dashboard visual directions`), sem merge. Worktree: `/tmp/brazil-cancer-ui-prototype`. Código: `site/src/components/VisualPrototype.astro`, montado na inicial apenas em desenvolvimento.
- Executar: `cd /tmp/brazil-cancer-ui-prototype/site` e `npm run dev -- --host 127.0.0.1 --port 4322`. A worktree reutiliza `node_modules` do checkout principal por link simbólico; em outro ambiente, instalar dependências com `npm ci`.
- Avaliação: [Atlas editorial](http://127.0.0.1:4322/?variant=A), [Mesa de exploração](http://127.0.0.1:4322/?variant=B) e [Guia pelo território](http://127.0.0.1:4322/?variant=C). Barra inferior alterna variantes e cenários; setas do teclado também alternam fora dos campos de formulário.
- Estruturas: Atlas dispõe filtros horizontais, mapa e prévia lateral; Mesa usa coluna de filtros, mapa central e prévia lateral; Guia organiza busca, mapa com legenda lateral e prévia abaixo. No celular os blocos se empilham.
- Navegação simulada mapa → prévia → Meu município com quatro Eixos, Acesso ao tratamento primeiro e Tipo de câncer preservado. Estado relevante exposto na barra e na URL. Meu município é uma vista simulada na mesma rota, não uma página municipal real. A Metodologia abre a página atual, não um novo desenho.
- Cenários: municipal, Região imediata, dado insuficiente e qualidade C. Ação mantida; origem, período, Referência e percentual sem informação próximos ao resultado. Qualidade C traz aviso e hachura apenas no tratamento; há período diferente no bloco de Detecção precoce.
- Limites: números e série fictícios explicitamente identificados; malha municipal real do pipeline, em cinza uniforme, sem atribuição de classes. Clique na malha e busca abrem um município de exemplo, sem associação geográfica. Indicador e modo de cor estão desabilitados; troca de Tipo de câncer testa preservação, sem simular sua elegibilidade. Conteúdo e Ações não representam aprovação editorial. Os demais Eixos são esboços de hierarquia.
- Verificação: `npm run check` sem diagnósticos; `npm run build` concluído (5.573 páginas); inicial em desenvolvimento respondeu HTTP 200. Ainda sem inspeção visual automatizada ou validação humana em desktop/celular.
- Pendente: avaliação do responsável para escolher/compor direção, ajustar densidade e interações e então registrar os padrões aprovados. Ticket continua claimed; nenhuma direção aprovada e nenhum código promovido ao produto.

### Diretriz da hierarquia — 2026-11-04

Seguir [Como organizar resumo nacional, mapa e Meu município para os dois públicos?](03-hierarquia-e-navegacao.md): inicial Brasil sem cartões numéricos nacionais, prévia municipal e ficha completa em página própria, Tipo de câncer preservado e Metodologia acessível. Prototipar também o estado sem seleção e o acesso aos detalhes técnicos sem esconder ressalvas essenciais. A proposta de cartões ao redor do mapa fica adiada.

### Resolução — 2026-11-04

Aprovação expressa do responsável registrada na resposta acima. Commits do protótipo: `90fbaf2` (alternativas iniciais), `2c3f101` (revisão para dashboard), `a3938c5` (modo escuro) e `2225bdd` (altura do painel). Encerramento e atualização do mapa no mesmo commit `docs: record approved immersive map visual direction`. Verificação mais recente: `npm run check` sem diagnósticos. Nenhuma alteração no código do produto.

