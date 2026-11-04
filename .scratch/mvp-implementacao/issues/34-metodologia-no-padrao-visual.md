# 34: Metodologia no padrão visual compartilhado

**What to build:** a Metodologia oferece leitura técnica organizada por indicador, navegação acessível e acesso a dados e fontes no padrão visual das demais páginas. Este ticket trata da apresentação e navegação; a consolidação do conteúdo pertence ao 24 e os downloads versionados ao 22. Referência: especificação de UI/UX da v1, seções Páginas e navegação e Acesso sem mapa ou JavaScript; MVP §§2, 12 e 15.

**Blocked by:** 30 — Temas e navegação compartilhados.

**Status:** resolved

- [x] A rota existente da Metodologia permanece, com sumário por indicador, coluna de leitura e tipografia, superfícies e controles compartilhados; a página se adapta ao conteúdo sem ocupar obrigatoriamente a grade do mapa
- [x] A navegação principal leva à página e os links técnicos dos indicadores têm destinos estáveis nas seções pertinentes, utilizáveis sem JavaScript e com tema explícito preservado na navegação aprimorada
- [x] Conteúdo básico, fontes, sumário, links e expansões são acessíveis no HTML sem JavaScript
- [x] Dados, fontes, versões, condições de reutilização, citação e reprodução têm organização e pontos de acesso na Metodologia, preservando os recursos existentes e permitindo incorporar as entregas dos tickets 22 e 24 sem exigir nova página de downloads ou presumir que essas entregas já estejam concluídas
- [x] Não altera método, recortes, Referência, classes ou cálculos, nem trata a revisão visual como conclusão dos tickets 22 ou 24
- [x] Sumário, links e expansões funcionam pelo teclado com foco visível e ordem lógica; leitura e navegação são verificadas nos dois temas, com e sem JavaScript, a 320, 768 e 1280 px e zoom de 200%, sem cortes ou rolagem horizontal fora de tabelas
- [x] Checagem e build passam, sem introduzir fontes externas


## Comments

### Implementação e validação — 2026-11-04

Commit: `feat: organize methodology navigation and data access` (este commit).

- Rota e âncoras existentes preservadas, com sumário por indicador e pelos acessos transversais. Coluna de leitura com largura limitada, sumário em superfície compartilhada e composição em coluna única em telas menores; sem altura vinculada ao mapa. Tipografia, temas, bordas e foco usam o padrão compartilhado.
- Dados e fontes, versões e reprodução, reutilização e citação têm seções próprias. Preservados os textos técnicos, links oficiais, scripts, manifesto e recursos existentes. A expansão nativa oferece camadas JSON publicadas; a página aponta para o índice de municípios e downloads das fichas. As pendências de agregados versionados e consolidação continuam explícitas: tickets 22 e 24 permanecem abertos.
- Tabelas técnicas têm região nomeada e focável com rolagem horizontal contida. Sumário, links, fontes, textos e expansão estão no HTML estático, sem dependência de JavaScript. Âncoras usam a preservação de tema da navegação compartilhada.
- `npm run check --prefix site`: zero erros, avisos ou sugestões. `npm test --prefix site`: 37 testes passando, incluindo build estático completo e o teste existente de metodologia/âncoras dos cartões. `git diff --check` passou. O subprocesso do build exigiu execução fora do sandbox após `EPERM`.
- Verificação pontual com Playwright/Chromium em servidor Astro local: claro/escuro, JavaScript ativo/desativado, 320/768/1280 px e zoom CSS e nativo de 200% pela extensão de teste existente. Sem overflow horizontal da página, com expansão aberta; zoom nativo confirmado por largura CSS reduzida à metade e densidade de pixels 2. Os dez links do sumário atingem seções existentes pelo teclado, mantêm tema explícito com JavaScript e a expansão abre por Enter com foco visível. Links locais para JSON retornaram sucesso. Capturas dos dois temas e script de verificação ficaram em `/tmp/cancer-browser/`; nenhuma dependência ou fonte externa acrescentada.
- A alteração é de apresentação e organização: não houve cálculo, alteração de método ou revisão clínica. Não se aplicou TDD por não haver lógica nova nem seam previamente acordada; usaram-se a suíte existente e verificação do comportamento público no navegador. Esta verificação não substitui a auditoria de acessibilidade do ticket 25.
- Revisão pela skill `code-review` em dois agentes: Padrões, zero achados; Spec, nenhum desvio funcional. A ressalva de evidência de navegador, checagem e build foi atendida pelas execuções acima.

- Revisão posterior (ticket 35, 2026-11-04): alternativa A aprovada. Esta entrega permanece resolvida como histórico; sua composição é adaptada pelo ticket 39 e pelos demais tickets 36–39, conforme a [spec vigente](../../ui-ux-v1/spec.md), sem perder os requisitos de dados/acessibilidade/resiliência.
