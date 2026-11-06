# 25: Auditoria de acessibilidade do lançamento

**What to build:** o site cumpre o requisito de acessibilidade de lançamento: toda informação do mapa tem alternativa em texto ou tabela, toda interação funciona pelo teclado e nenhuma informação depende só de cor. A auditoria inclui o redesign da UI/UX v1 e registra as medições de desempenho. Sem certificação formal de WCAG ou eMAG. Referências: MVP, seções 2 e 13; especificação de UI/UX da v1, seção Critérios verificáveis para a implementação.

**Blocked by:** 09 — Estado na URL; 11 — Busca e navegação; 21 — Eixos sem indicador; 24 — Metodologia consolidada; 30 — Temas e navegação compartilhados; 31 — Mapa imersivo com prévia municipal; 32 — Busca e tabela independentes do mapa; 33 — Meu município responsivo e navegável sem JavaScript; 34 — Metodologia no padrão visual compartilhado; 36 — Console horizontal; 37 — Consulta municipal integrada; 38 — Navegação resiliente e links; 39 — Metodologia no Console

**Status:** resolved

- [x] Todo o fluxo (seletores, busca, mapa, tabela alternativa, ficha, "Saiba mais", metodologia) funciona só pelo teclado, com foco visível
- [x] Cada estado do mapa (indicador × tipo × modo) tem alternativa em tabela com as mesmas classes, origens do dado e avisos
- [x] Texturas e textos distinguem dado insuficiente, faixa C e as classes sem depender de cor
- [x] Sem JavaScript, a inicial oferece lista por UF e links para documentos do dashboard com seleção; Meu município e Metodologia oferecem indicadores, ressalvas, Ações, fontes, navegação e links aos Tipos de câncer pertinentes
- [x] Com JavaScript e falha de WebGL ou inicialização do mapa simulada, busca e tabela continuam utilizáveis
- [x] O fluxo mapa/lista → consulta integrada → retorno, links técnicos e URLs compartilháveis preservam Tipo de câncer e tema pertinente, nos dois temas
- [x] A revisão cobre seleção municipal, origem regional, dado insuficiente, faixa C, ausência de carga, períodos distintos, HPV sem Tendência, mortalidade sem Situação e ajuste não calculável
- [x] Inicial, ficha e Metodologia são verificadas a 320, 768 e 1280 px e zoom de 200%, nos dois temas: sem conteúdo cortado, rolagem horizontal limitada às tabelas e altura natural dos blocos no celular
- [x] Conforme a decisão posterior do painel (polimento 04 e ticket 43), a busca leva o foco ao nome do município, o mapa não desloca o foco, recolher mantém o foco no controle e limpar devolve o foco à busca; controles, busca, lista, painel, expansões e Metodologia têm foco visível e ordem lógica pelo teclado
- [ ] Anúncios de resultados são verificados com leitor de tela; classes, avisos e origem são compreensíveis em texto; contraste e distinção das texturas são conferidos nos dois temas
- [ ] Uma checagem automatizada (por exemplo axe) roda no CI sem erros graves, complementada por revisão manual nos dois temas; ficam registrados ferramenta, páginas, estados, resultados e limitações, sem alegar certificação formal
- [x] O orçamento de ~1,3 MB na primeira visita com cache vazio e transferência comprimida e < 30 MB na saída estática total é medido, com cenário, recursos e método registrados; excessos são investigados e qualquer divergência exige justificativa e decisão explícita
- [x] A revisão de desempenho verifica ausência de fontes externas e carregamento de detalhes sob demanda

## Comments

### Atualização da decisão de orçamento — 06/11/2026

O responsável adiou a redução de saída estática e transferência para depois da V1. Conforme a decisão posterior registrada no [ticket 47](47-reduzir-saida-e-transferencia.md), o excesso medido fica aceito como dívida conhecida para a V1 e deixa de bloquear seu lançamento por orçamento. Esta atualização substitui as declarações anteriores de excesso sem aprovação e bloqueio até a redução, preservadas abaixo como histórico. As metas não foram cumpridas; a revisão humana de acessibilidade, a validação dos dados e a verificação da hospedagem continuam necessárias.

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

### Auditoria de lançamento — 06/11/2026

- Implementação e evidência em [validation-25.md](../../ui-ux-v1/validation-25.md): axe no CI, relatórios por página, 24 análises nos dois temas/com e sem scripts e 54 verificações de seleções publicadas do mapa sem WebGL. Corrigidas regiões com nomes repetidos em Ações e na Metodologia.
- A decisão posterior do [painel](../../ui-polimento/issues/04-painel-meu-municipio.md), implementada no ticket 43, prevalece sobre o critério antigo de foco. O critério foi alinhado a essa decisão, sem mudança de comportamento nesta auditoria.
- Saída corrigida: **999.530.479 bytes em 5.635 arquivos**. Primeira visita com cache vazio e HTTP gzip local: **1.369.414 bytes de corpos comprimidos**, sem cabeçalhos; seleção de Recife acrescenta **295.403 bytes**. Os perfis só carregam sob demanda; sem requisições HTTP externas no cenário. Limites e recursos constam nos JSONs anexos ao relatório.
- Decisão explícita do responsável: **“Manter metas e bloquear lançamento até reduzir”**. O excesso não está aprovado; o [ticket 47](47-reduzir-saida-e-transferencia.md) acompanha sua redução. O critério de medição está marcado porque a investigação e a decisão foram registradas, sem afirmar cumprimento dos orçamentos.
- O responsável decidiu **“Deixar pendente para revisão humana”** a sessão real com leitor de tela. Os dois critérios que incluem anúncios e revisão humana permanecem abertos; o roteiro está no relatório. O CI foi configurado e seus comandos foram executados localmente, sem alegar execução remota ou certificação. Por isso o ticket fica `ready-for-human`, sem resolução prematura.
- Validação final: checagem de tipos sem diagnósticos; 87 testes do site e 316 testes de navegador aprovados, sem falhas ou skips. Inclui 84 testes específicos de acessibilidade, já contados na suíte de navegador. Revisão independente: zero violações de padrões documentados; um achado de spec no CI corrigido e reavaliado, sem pendências de código.
- Commit `2e994b6` — automação, correções semânticas, medições e registro dos bloqueios. A revisão independente identificou uma falha no início da prévia no CI; corrigida com `--background` explícito e parada em `if: always()` no commit documental final desta auditoria.
