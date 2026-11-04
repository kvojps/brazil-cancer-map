# 35: Prototipar o dashboard com identidade de observabilidade

**What to build:** uma proposta visual navegável para a v1 do Observatório do Câncer no Brasil, com identidade inspirada em ferramentas de observabilidade de tecnologia. O Mapa inicial é o centro da experiência; a consulta municipal completa acontece dentro dele. Entregar uma referência concreta para avaliação humana antes de implementar o redesign no produto.

**Blocked by:** None (can start immediately).

**Status:** resolved

## Contexto e decisões aprovadas

A interface atual tem excesso de texto e pouca hierarquia visual em navegação, controles, prévia, legenda e rodapé. O responsável rejeitou uma direção editorial e pediu um dashboard futurista, com tipografia precisa, superfícies bem definidas, ícones, controles compactos e acentos luminosos discretos. Claro e escuro devem receber o mesmo cuidado; cores semânticas dos indicadores permanecem preservadas.

As decisões desta entrevista revisam a hierarquia anterior: remover a tela municipal separada e apresentar os quatro Eixos no painel do próprio dashboard. Não basta renovar o CSS da prévia atual.

Referências:

- [Registro da entrevista](../../ui-ux-v1/redesign-interview.md).
- [Spec de UI/UX anterior](../../ui-ux-v1/spec.md), especialmente páginas, contrato e exceções dos indicadores.
- [Hierarquia anterior](../../ui-ux-v1/issues/03-hierarquia-e-navegacao.md) e [direção visual anterior](../../ui-ux-v1/issues/04-direcao-visual.md), revistas pelas decisões abaixo.
- [Spec do MVP](../../mapa-cancer-br/spec-mvp.md), §§2, 11 e 15; consultar também as seções e tickets dos indicadores representados.
- [Temas e navegação](30-temas-e-navegacao-compartilhados.md), [mapa e prévia](31-mapa-imersivo-com-previa-municipal.md), [alternativas ao mapa](32-busca-e-tabela-independentes-do-mapa.md), [consulta sem JavaScript](33-meu-municipio-sem-javascript.md) e [Metodologia](34-metodologia-no-padrao-visual.md).
- [Glossário](../../../GLOSSARY.md). As definições atuais de Mapa inicial e Meu município ainda descrevem prévia/ficha separadas; atualizar a documentação consolidada para a hierarquia aprovada no handoff, sem tratar o glossário como especificação de layout.

## Escopo e critérios de aceite

- [x] Preparar protótipo navegável isolado do produto, com instruções e link local de avaliação; não publicar nem promover diretamente o protótipo ao site real
- [x] Mostrar o Brasil inteiro na abertura, com o indicador de tratamento em até 60 dias no modo Tendência; sem seleção municipal e sem painel lateral vazio. Manter o recorte quimio/radio e as demais regras vigentes do indicador; não interpretar o redesign como mudança de método
- [x] Usar praticamente toda a primeira tela para o dashboard, com mapa dominante, cabeçalho compacto e filtros agrupados, sem apresentação textual longa nem novos cartões de estatísticas nacionais
- [x] Criar assinatura visual para “Observatório do Câncer no Brasil”, com símbolo simples; navegação principal “Mapa” e “Como calculamos”, busca municipal nos controles do mapa e alternância de tema por ícone de sol/lua com nome acessível
- [x] Substituir notas extensas abaixo dos filtros por ajuda contextual em popover/tooltip acionável por clique, toque e teclado; manter descrições acessíveis e ressalvas essenciais pertinentes
- [x] Integrar legenda compacta ao mapa, com classes e texturas distinguíveis; explicações extensas ficam sob demanda, preservando significado de Tendência, Situação e dado insuficiente
- [x] Ao selecionar município, abrir painel lateral completo no desktop, com nome e UF e quatro Eixos em seções expansíveis; abrir inicialmente o Eixo relacionado ao indicador selecionado no mapa
- [x] Apresentar resultado, classificação e período com hierarquia visual, mantendo origem regional, Referência quando aplicável, Ação e ressalvas essenciais junto do resultado; detalhes extensos ficam em expansões. Incluir Onde se tratar junto do tratamento
- [x] No celular, abrir painel inferior expansível, inicialmente resumido, com fechamento explícito e seleção preservada ao voltar ao mapa
- [x] Eliminar a navegação para uma tela municipal separada no fluxo proposto; demonstrar entrada por link municipal diretamente na seleção do dashboard, preservando o estado pertinente
- [x] Posicionar “Explorar em lista” como botão secundário com ícone na barra de ferramentas, próximo à busca; ao abrir, a lista substitui o mapa na mesma área. Oferecer “Mapa | Lista”, mantendo filtros e seleção. Não deixar tabela ou índice por UF permanentemente abaixo do mapa, nem prejudicar a visualização principal
- [x] Demonstrar acesso alternativo quando o mapa falha e especificar uma solução viável para consulta sem JavaScript e links municipais antigos, compatível com a remoção da tela separada. Não eliminar a acessibilidade/resiliência dos tickets 32 e 33 como consequência da simplificação visual
- [x] Redesenhar “Como calculamos” no mesmo sistema visual, com sumário, seções, leitura organizada e detalhes expansíveis; manter acesso a fontes, método e reprodução
- [x] Redesenhar rodapé compacto com identidade, fontes/licenças e código; posicioná-lo após a área principal do dashboard, sem disputar espaço com o mapa
- [x] Mostrar desktop e celular nos dois temas, incluindo estados municipal, regional (“seu município e vizinhos”), dado insuficiente e qualidade C; representar também HPV sem Tendência e mortalidade sem Situação sem inventar classes
- [x] Preservar dados, cálculos, contrato e regras editoriais/clínicas. Usar dados existentes ou sinalizar explicitamente qualquer conteúdo simulado; nenhuma simulação deve parecer resultado real. Manter aviso de construção e demais conteúdos obrigatórios
- [x] Verificar navegação básica por teclado, foco visível, ajuda por toque e ausência de conteúdo cortado em 320, 768 e 1280 px nos dois temas; registrar checagens executadas e limitações, sem afirmar auditoria completa
- [x] Apresentar a proposta ao responsável e registrar aprovação visual ou ajustes solicitados, cobrindo navegação, mapa, painel, legenda, lista, rodapé e Metodologia
- [x] Consolidar as decisões aprovadas na spec e nos documentos pertinentes, explicitando o que substitui a hierarquia anterior e as pendências técnicas; fornecer handoff para implementação posterior
- [x] Caso o design seja aprovado pelo responsável, gerar os tickets de implementação em `.scratch/mvp-implementacao/issues/`, com escopo, critérios de aceite, dependências e referências ao desenho aprovado; cobrir a aplicação ao produto e as mudanças de navegação, compatibilidade dos links e acesso sem mapa ou JavaScript, sem duplicar trabalho já concluído

## Limites da entrega

Este ticket entrega protótipo, avaliação visual, handoff e, caso o design seja aprovado, a geração dos tickets de implementação. A aprovação do desenho não equivale à implementação no produto, publicação, auditoria de acessibilidade ou revisão clínica. Não alterar pipeline, dados publicados, indicadores, classes, Referência, cascata ou recortes para acomodar o visual.

A retirada da tela municipal está aprovada. O mecanismo técnico de compatibilidade dos links e de consulta sem JavaScript precisa ser demonstrado e especificado, sem presumir que um redirecionamento dependente de JavaScript atende ao requisito.

## Comments

- Ticket criado após entrevista com o responsável. Abertura confirmada em Tendência de tratamento em até 60 dias; demais propostas aprovadas. Restrição explícita: “Explorar em lista” não pode prejudicar a visualização principal.
- Próximo passo autorizado: produzir a proposta visual navegável para avaliação antes da implementação do redesign no site real.

- Proposta disponível para avaliação na branch descartável `prototype/35-observability-dashboard`, rota `/prototype/observability?variant=A&theme=dark`. Iniciar com `npm run prototype:observability --prefix site`; nesta sessão: http://127.0.0.1:4323/prototype/observability?variant=A&theme=dark. Alternativas A (Console), B (Estação) e C (Atlas), com setas e estado exposto.
- Instruções, escopo da demonstração, capturas, checagens e handoff técnico: `site/src/prototypes/observability/README.md` na branch descartável (fora da main; ver o [handoff consolidado](../../ui-ux-v1/observability-handoff.md)). Código isolado da rota real, sem publicação nem mudança nos dados/pipeline. Fichas completas apenas nas três amostras reais; mapa/lista nacionais; Tipo limitado a Todos os cânceres. Os critérios marcados referem-se à demonstração nessas amostras, não à implementação no produto.
- Chromium: 18 combinações de variantes/temas/larguras (320/768/1280), metodologia em seis combinações, seis consultas estáticas sem JavaScript, busca por teclado, ajuda por clique e falha de mapa. Sem erros JavaScript capturados ou transbordamento horizontal global. `npm run check --prefix site`: zero erros/avisos. Limitações detalhadas no README; sem auditoria completa, teste tátil real ou revisão clínica.
- Limitação do critério de estados: a camada HPV não existe nos dados publicados desta cópia. O protótipo sinaliza sua demonstração como simulação visual sem números; não representa cobertura real. O critério correspondente permanece aberto para avaliação com dados disponíveis. A mortalidade usa os dados existentes e não oferece Situação.
- Handoff propõe documentos estáticos do próprio dashboard com seleção municipal e fallback textual, com redirects HTTP dos links legados ou o mesmo HTML nas rotas antigas. O protótipo demonstra o princípio sem JavaScript em três seleções por âncora; redirects e geração nacional permanecem para implementação posterior.
- Veredito: aguardando escolha visual e ajustes do responsável para navegação, mapa, painel, legenda, lista, rodapé e metodologia. Sem aprovação presumida; spec e glossário não foram reescritos nem foram criados tickets de implementação condicionados à aprovação. Ticket permanece aberto.
- Fonte primária capturada no commit `86a8d87` da branch `prototype/35-observability-dashboard` (protótipo, capturas e handoff). Pergunta: qual estrutura preserva o mapa dominante e acomoda a consulta municipal completa? Resposta visual ainda depende da avaliação humana. Não fazer merge da branch descartável no produto.

### Aprovação e fechamento — 2026-11-04

- O responsável respondeu **“A”**, escolhendo Console horizontal após receber o link e a apresentação. Essa escolha aprova a composição apresentada para navegação, mapa, painel, legenda, lista, rodapé e Metodologia. Nenhum ajuste adicional foi solicitado; substitui o veredito pendente dos comentários anteriores.
- O critério visual de estados é concluído com a demonstração explicitamente simulada e sem números de HPV, permitida pelo escopo do protótipo. Não houve avaliação com cobertura real nem conclusão da carga; essa limitação permanece no handoff e nos tickets de implementação. Os demais estados usam as amostras reais e a matriz já registrada.
- [Spec de UI/UX](../../ui-ux-v1/spec.md), MVP §11, glossário e entrevista consolidados. [Handoff aprovado](../../ui-ux-v1/observability-handoff.md) na main; código/capturas mantidos exclusivamente na branch de referência, sem merge do protótipo.
- Implementação posterior: [36 — Console e sistema visual](36-console-horizontal-e-sistema-visual.md), [37 — Consulta integrada](37-consulta-municipal-integrada.md), [38 — Navegação resiliente e links](38-navegacao-resiliente-e-links-municipais.md), [39 — Metodologia](39-metodologia-no-console-horizontal.md). Os tickets 30–34 permanecem resolvidos e são reaproveitados; 22/24/25/26 e cargas não são encerrados por esta aprovação.
- Commit de fechamento: `docs: approve console dashboard and record implementation handoff` (este commit), reunindo decisão, critérios marcados, status resolved e tickets. Fontes do protótipo: `86a8d87` e vínculo `ce023a9` na branch descartável.
- Validação do fechamento: 21 documentos conferidos, links Markdown locais válidos, critérios do 35 marcados e dependências/critérios dos tickets 36–39 presentes; `git diff --check` passou. Nenhum código do produto alterado, portanto não foram repetidos os testes do site/pipeline.
