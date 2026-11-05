# 25: Auditoria de acessibilidade do lançamento

**What to build:** o site cumpre o requisito de acessibilidade de lançamento: toda informação do mapa tem alternativa em texto ou tabela, toda interação funciona pelo teclado e nenhuma informação depende só de cor. A auditoria inclui o redesign da UI/UX v1 e registra as medições de desempenho. Sem certificação formal de WCAG ou eMAG. Referências: MVP, seções 2 e 13; especificação de UI/UX da v1, seção Critérios verificáveis para a implementação.

**Blocked by:** 09 — Estado na URL; 11 — Busca e navegação; 21 — Eixos sem indicador; 24 — Metodologia consolidada; 30 — Temas e navegação compartilhados; 31 — Mapa imersivo com prévia municipal; 32 — Busca e tabela independentes do mapa; 33 — Meu município responsivo e navegável sem JavaScript; 34 — Metodologia no padrão visual compartilhado; 36 — Console horizontal; 37 — Consulta municipal integrada; 38 — Navegação resiliente e links; 39 — Metodologia no Console

**Status:** ready-for-agent

- [ ] Todo o fluxo (seletores, busca, mapa, tabela alternativa, ficha, "Saiba mais", metodologia) funciona só pelo teclado, com foco visível
- [ ] Cada estado do mapa (indicador × tipo × modo) tem alternativa em tabela com as mesmas classes, origens do dado e avisos
- [ ] Texturas e textos distinguem dado insuficiente, faixa C e as classes sem depender de cor
- [ ] Sem JavaScript, a inicial oferece lista por UF e links para documentos do dashboard com seleção; Meu município e Metodologia oferecem indicadores, ressalvas, Ações, fontes, navegação e links aos Tipos de câncer pertinentes
- [ ] Com JavaScript e falha de WebGL ou inicialização do mapa simulada, busca e tabela continuam utilizáveis
- [ ] O fluxo mapa/lista → consulta integrada → retorno, links técnicos e URLs compartilháveis preservam Tipo de câncer e tema pertinente, nos dois temas
- [ ] A revisão cobre seleção municipal, origem regional, dado insuficiente, faixa C, ausência de carga, períodos distintos, HPV sem Tendência, mortalidade sem Situação e ajuste não calculável
- [ ] Inicial, ficha e Metodologia são verificadas a 320, 768 e 1280 px e zoom de 200%, nos dois temas: sem conteúdo cortado, rolagem horizontal limitada às tabelas e altura natural dos blocos no celular
- [ ] Ao selecionar município, o foco permanece no controle e há acesso direto ao painel; controles, busca, lista, painel, expansões e Metodologia têm foco visível e ordem lógica pelo teclado
- [ ] Anúncios de resultados são verificados com leitor de tela; classes, avisos e origem são compreensíveis em texto; contraste e distinção das texturas são conferidos nos dois temas
- [ ] Uma checagem automatizada (por exemplo axe) roda no CI sem erros graves, complementada por revisão manual nos dois temas; ficam registrados ferramenta, páginas, estados, resultados e limitações, sem alegar certificação formal
- [ ] O orçamento de ~1,3 MB na primeira visita com cache vazio e transferência comprimida e < 30 MB na saída estática total é medido, com cenário, recursos e método registrados; excessos são investigados e qualquer divergência exige justificativa e decisão explícita
- [ ] A revisão de desempenho verifica ausência de fontes externas e carregamento de detalhes sob demanda

## Comments

### Escopo da UI/UX v1 — 2026-11-04

Ampliação aprovada junto da divisão dos tickets 30–34: incorporar os cenários do redesign à auditoria existente, sem criar auditoria duplicada. A aprovação visual não substitui estas verificações nem a revisão clínica das Ações.

- Escopo posterior aprovado no ticket 35: incluir o Console A dos tickets 36–39 na auditoria já prevista — painel inferior resumido/expandido, recolher versus limpar seleção, ajuda por clique/toque/teclado, Mapa/Lista, histórico, links legados e documentos selecionados sem JavaScript. As checagens do protótipo não substituem esta auditoria nem a medição de orçamento; a saída existente de cerca de 675 MB segue como excesso a investigar, sem aprovação implícita.

### Medição do ticket 37 — 2026-11-04

- [Registro da consulta integrada](../../ui-ux-v1/validation-37.md): saída de 763.801.491 bytes de arquivos (aproximadamente 764 MiB em disco), ainda acima da meta de 30 MB. O shell do dashboard acrescenta HTML por município; evitou-se repetir o índice nacional, que levaria a aproximadamente 4,1 GiB. Não se aprova o excesso: o ticket 38 deve avaliar geração/hospedagem e esta auditoria mantém a decisão explícita de orçamento pendente.
- Carga incremental estimada de uma seleção em PE: documento de Recife ~18 KB gzip mais perfil da UF ~161 KB gzip, com cache durante a visita. Medição local por compressão dos arquivos, sem alegar captura HTTP ou cumprimento do orçamento de primeira visita.

### Medição do ticket 38 — 2026-11-04

- [Validação da navegação resiliente](../../ui-ux-v1/validation-38.md): 5.626 arquivos e **765.046.511 bytes** de saída estática, +1.245.020 bytes sobre o ticket 37; sem repetir malha/JSON ou índice nacional por município. O HTML mantém os seis Tipos para leitura sem JavaScript. Build inicial medido em 21,84 s; suíte final com build integral em 18,46 s.
- Primeira visita estimada por compressão gzip local do HTML inicial, assets compartilhados, worker, lista, camada padrão e malha: **1.388.885 bytes gzip** (6.119.249 bytes sem compressão), acima da meta aproximada de 1,3 MB. Não é captura HTTP e não comprova compressão no provedor. Seleção de Recife acrescenta aproximadamente 179 KB gzip de HTML e perfil PE, com cache durante a visita.
- O excesso de saída (>30 MB) e de transferência estimada continua **sem aprovação**; requer investigação e decisão explícita nesta auditoria. A prévia estática local verifica documentos municipais sem redirect JavaScript; configuração do provedor remoto não foi acessada e não houve publicação.
