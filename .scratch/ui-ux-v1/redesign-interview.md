# Revisão visual da v1 — entrevista

Entrevista concluída com escolha da alternativa A em 2026-11-04. A decisão foi consolidada na [spec vigente](spec.md) e no [handoff aprovado](observability-handoff.md); a implementação segue pelos tickets 36–39, sem promoção do protótipo ou publicação.

## Decisões confirmadas pelo responsável

- A missão da inicial é visualizar a situação do Brasil. A consulta municipal parte desse panorama e aparece lateralmente.
- A direção desejada é um dashboard futurista inspirado em ferramentas de observabilidade de tecnologia. A proposta editorial foi rejeitada.
- É permitido reorganizar a interface e os textos; os dados não podem mudar.
- Remover a tela municipal específica: o responsável confirmou expressamente a remoção na segunda rodada. O destino dos links existentes e o acesso sem JavaScript ainda precisam ser definidos.
- Direção visual confirmada: dashboard inspirado em ferramentas de observabilidade, superfícies escuras definidas, tipografia precisa, controles compactos, ícones e acentos luminosos discretos; tema claro também trabalhado e cores dos indicadores preservadas.
- A página referida inicialmente como contribuição é “Como calculamos” (Metodologia), incluída no redesign com sumário, seções e detalhes expansíveis.
- Dashboard ocupa praticamente a primeira tela, com cabeçalho compacto, controles agrupados, mapa dominante e sem apresentação longa. Legenda compacta integrada ao mapa e explicações dos filtros em popovers acessíveis por clique, toque e teclado.
- Painel municipal completo com nome e UF, quatro Eixos expansíveis e abertura inicial do Eixo associado ao indicador do mapa. Resultado, classificação, período, origem regional e ressalvas essenciais permanecem visíveis; detalhes extensos são progressivos.
- No celular, seleção abre painel inferior expansível, inicialmente resumido, com fechamento explícito e seleção preservada ao retornar ao mapa.
- “Explorar em lista” é uma entrada secundária discreta para as alternativas ao mapa, sem ocupar espaço permanente ou prejudicar a visualização principal. Preservar acesso sem mapa e sem JavaScript.
- Links municipais antigos devem abrir a seleção correspondente no dashboard, sem tela municipal própria. A solução técnica deve preservar a consulta sem JavaScript; ainda não foi definida.

## Relação com decisões anteriores

A consulta municipal integrada substitui a hierarquia de `issues/03-hierarquia-e-navegacao.md` e a seção de páginas de `spec.md`, que mantêm prévia e ficha em páginas distintas. A remoção da tela foi aprovada; o tratamento técnico das rotas ainda está pendente.

Tabela e índice por UF cumprem requisitos de acessibilidade e resiliência do ticket 32 da implementação. Seu desenho e sua posição podem mudar; a alternativa de acesso precisa ser preservada ou explicitamente revista.

## Aprovação visual e pendências técnicas

O responsável respondeu “A” à proposta navegável do ticket 35: **Console horizontal** aprovado, incluindo navegação, mapa, painel completo, legenda, lista, rodapé e Como calculamos. A aprovação confirma a hierarquia integrada e substitui a direção C anterior; não altera métodos ou dados.

A identidade, temas, abertura sem seleção, ajuda contextual e consulta responsiva seguem A. A aprovação não elimina as limitações conhecidas: três fichas de amostra, filtro Todos os cânceres, demonstração HPV explicitamente sem números e ausência de redirects no protótipo. A implementação deve atender todos os municípios/Tipos e preservar os estados reais de ausência de carga.

Pendências técnicas: convenção final de URL/documentos estáticos, links legados sem dependência de JavaScript, geração nacional e tamanho da saída; matriz de regressão, auditoria e revisão clínica permanecem nos respectivos tickets. Preferir reutilizar os caminhos municipais atuais como documentos do dashboard com seleção, sem ficha separada.

## Comments

Primeira rodada: responsável priorizou panorama nacional, dashboard de observabilidade e liberdade de reorganização sem mudança nos dados.

Segunda rodada: confirmou remoção da tela municipal, direção de observabilidade e inclusão de “Como calculamos”. A pergunta Q4 sobre ocupação da primeira tela não recebeu resposta explícita.

Terceira rodada: aprovou Q4, Q8, Q9 e Q10. Ressalva explícita: a alternativa em lista não pode prejudicar a visualização principal.

Quarta rodada: escolha humana “A”, sem ajustes adicionais. Spec e handoff consolidados; tickets 36–39 criados para implementação posterior.
