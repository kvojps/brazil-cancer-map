# Revisão visual da v1 — entrevista

Entrevista em andamento. Não substitui integralmente a especificação anterior nem autoriza implementação antes da confirmação do entendimento compartilhado.

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

## Pendências da entrevista

- Identidade, navegação e comportamento inicial dos temas.
- Conteúdo do dashboard antes de selecionar um município.
- Solução técnica para links municipais e consulta sem JavaScript, respeitando a remoção da tela municipal.
- Identidade, navegação, rodapé e critérios para aprovação visual.

## Comments

Primeira rodada: responsável priorizou panorama nacional, dashboard de observabilidade e liberdade de reorganização sem mudança nos dados.

Segunda rodada: confirmou remoção da tela municipal, direção de observabilidade e inclusão de “Como calculamos”. A pergunta Q4 sobre ocupação da primeira tela não recebeu resposta explícita.

Terceira rodada: aprovou Q4, Q8, Q9 e Q10. Ressalva explícita: a alternativa em lista não pode prejudicar a visualização principal.
