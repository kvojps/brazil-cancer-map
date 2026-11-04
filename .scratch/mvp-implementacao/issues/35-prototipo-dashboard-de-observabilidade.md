# 35: Prototipar o dashboard com identidade de observabilidade

**What to build:** uma proposta visual navegável para a v1 do Observatório do Câncer no Brasil, com identidade inspirada em ferramentas de observabilidade de tecnologia. O Mapa inicial é o centro da experiência; a consulta municipal completa acontece dentro dele. Entregar uma referência concreta para avaliação humana antes de implementar o redesign no produto.

**Blocked by:** None (can start immediately).

**Status:** ready-for-agent

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

- [ ] Preparar protótipo navegável isolado do produto, com instruções e link local de avaliação; não publicar nem promover diretamente o protótipo ao site real
- [ ] Mostrar o Brasil inteiro na abertura, com o indicador de tratamento em até 60 dias no modo Tendência; sem seleção municipal e sem painel lateral vazio. Manter o recorte quimio/radio e as demais regras vigentes do indicador; não interpretar o redesign como mudança de método
- [ ] Usar praticamente toda a primeira tela para o dashboard, com mapa dominante, cabeçalho compacto e filtros agrupados, sem apresentação textual longa nem novos cartões de estatísticas nacionais
- [ ] Criar assinatura visual para “Observatório do Câncer no Brasil”, com símbolo simples; navegação principal “Mapa” e “Como calculamos”, busca municipal nos controles do mapa e alternância de tema por ícone de sol/lua com nome acessível
- [ ] Substituir notas extensas abaixo dos filtros por ajuda contextual em popover/tooltip acionável por clique, toque e teclado; manter descrições acessíveis e ressalvas essenciais pertinentes
- [ ] Integrar legenda compacta ao mapa, com classes e texturas distinguíveis; explicações extensas ficam sob demanda, preservando significado de Tendência, Situação e dado insuficiente
- [ ] Ao selecionar município, abrir painel lateral completo no desktop, com nome e UF e quatro Eixos em seções expansíveis; abrir inicialmente o Eixo relacionado ao indicador selecionado no mapa
- [ ] Apresentar resultado, classificação e período com hierarquia visual, mantendo origem regional, Referência quando aplicável, Ação e ressalvas essenciais junto do resultado; detalhes extensos ficam em expansões. Incluir Onde se tratar junto do tratamento
- [ ] No celular, abrir painel inferior expansível, inicialmente resumido, com fechamento explícito e seleção preservada ao voltar ao mapa
- [ ] Eliminar a navegação para uma tela municipal separada no fluxo proposto; demonstrar entrada por link municipal diretamente na seleção do dashboard, preservando o estado pertinente
- [ ] Posicionar “Explorar em lista” como botão secundário com ícone na barra de ferramentas, próximo à busca; ao abrir, a lista substitui o mapa na mesma área. Oferecer “Mapa | Lista”, mantendo filtros e seleção. Não deixar tabela ou índice por UF permanentemente abaixo do mapa, nem prejudicar a visualização principal
- [ ] Demonstrar acesso alternativo quando o mapa falha e especificar uma solução viável para consulta sem JavaScript e links municipais antigos, compatível com a remoção da tela separada. Não eliminar a acessibilidade/resiliência dos tickets 32 e 33 como consequência da simplificação visual
- [ ] Redesenhar “Como calculamos” no mesmo sistema visual, com sumário, seções, leitura organizada e detalhes expansíveis; manter acesso a fontes, método e reprodução
- [ ] Redesenhar rodapé compacto com identidade, fontes/licenças e código; posicioná-lo após a área principal do dashboard, sem disputar espaço com o mapa
- [ ] Mostrar desktop e celular nos dois temas, incluindo estados municipal, regional (“seu município e vizinhos”), dado insuficiente e qualidade C; representar também HPV sem Tendência e mortalidade sem Situação sem inventar classes
- [ ] Preservar dados, cálculos, contrato e regras editoriais/clínicas. Usar dados existentes ou sinalizar explicitamente qualquer conteúdo simulado; nenhuma simulação deve parecer resultado real. Manter aviso de construção e demais conteúdos obrigatórios
- [ ] Verificar navegação básica por teclado, foco visível, ajuda por toque e ausência de conteúdo cortado em 320, 768 e 1280 px nos dois temas; registrar checagens executadas e limitações, sem afirmar auditoria completa
- [ ] Apresentar a proposta ao responsável e registrar aprovação visual ou ajustes solicitados, cobrindo navegação, mapa, painel, legenda, lista, rodapé e Metodologia
- [ ] Consolidar as decisões aprovadas na spec e nos documentos pertinentes, explicitando o que substitui a hierarquia anterior e as pendências técnicas; fornecer handoff para implementação posterior
- [ ] Caso o design seja aprovado pelo responsável, gerar os tickets de implementação em `.scratch/mvp-implementacao/issues/`, com escopo, critérios de aceite, dependências e referências ao desenho aprovado; cobrir a aplicação ao produto e as mudanças de navegação, compatibilidade dos links e acesso sem mapa ou JavaScript, sem duplicar trabalho já concluído

## Limites da entrega

Este ticket entrega protótipo, avaliação visual, handoff e, caso o design seja aprovado, a geração dos tickets de implementação. A aprovação do desenho não equivale à implementação no produto, publicação, auditoria de acessibilidade ou revisão clínica. Não alterar pipeline, dados publicados, indicadores, classes, Referência, cascata ou recortes para acomodar o visual.

A retirada da tela municipal está aprovada. O mecanismo técnico de compatibilidade dos links e de consulta sem JavaScript precisa ser demonstrado e especificado, sem presumir que um redirecionamento dependente de JavaScript atende ao requisito.

## Comments

- Ticket criado após entrevista com o responsável. Abertura confirmada em Tendência de tratamento em até 60 dias; demais propostas aprovadas. Restrição explícita: “Explorar em lista” não pode prejudicar a visualização principal.
- Próximo passo autorizado: produzir a proposta visual navegável para avaliação antes da implementação do redesign no site real.
