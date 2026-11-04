# 34: Metodologia no padrão visual compartilhado

**What to build:** a Metodologia oferece leitura técnica organizada por indicador, navegação acessível e acesso a dados e fontes no padrão visual das demais páginas. Este ticket trata da apresentação e navegação; a consolidação do conteúdo pertence ao 24 e os downloads versionados ao 22. Referência: especificação de UI/UX da v1, seções Páginas e navegação e Acesso sem mapa ou JavaScript; MVP §§2, 12 e 15.

**Blocked by:** 30 — Temas e navegação compartilhados.

**Status:** ready-for-agent

- [ ] A rota existente da Metodologia permanece, com sumário por indicador, coluna de leitura e tipografia, superfícies e controles compartilhados; a página se adapta ao conteúdo sem ocupar obrigatoriamente a grade do mapa
- [ ] A navegação principal leva à página e os links técnicos dos indicadores têm destinos estáveis nas seções pertinentes, utilizáveis sem JavaScript e com tema explícito preservado na navegação aprimorada
- [ ] Conteúdo básico, fontes, sumário, links e expansões são acessíveis no HTML sem JavaScript
- [ ] Dados, fontes, versões, condições de reutilização, citação e reprodução têm organização e pontos de acesso na Metodologia, preservando os recursos existentes e permitindo incorporar as entregas dos tickets 22 e 24 sem exigir nova página de downloads ou presumir que essas entregas já estejam concluídas
- [ ] Não altera método, recortes, Referência, classes ou cálculos, nem trata a revisão visual como conclusão dos tickets 22 ou 24
- [ ] Sumário, links e expansões funcionam pelo teclado com foco visível e ordem lógica; leitura e navegação são verificadas nos dois temas, com e sem JavaScript, a 320, 768 e 1280 px e zoom de 200%, sem cortes ou rolagem horizontal fora de tabelas
- [ ] Checagem e build passam, sem introduzir fontes externas
