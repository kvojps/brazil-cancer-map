# 33: Meu município responsivo e navegável sem JavaScript

**What to build:** a página própria Meu município oferece a ficha completa no padrão visual compartilhado, com leitura e acesso aos Tipos de câncer mesmo sem JavaScript. Referência: especificação de UI/UX da v1, seções Páginas e navegação, Acesso sem mapa ou JavaScript e Critérios verificáveis; MVP §§10 e 11.2.

**Blocked by:** 30 — Temas e navegação compartilhados.

**Status:** ready-for-agent

- [ ] A ficha mantém quatro Eixos empilhados, Acesso ao tratamento primeiro e Onde se tratar junto do tratamento; o desenho dos cartões segue o padrão visual compartilhado e se adapta ao conteúdo
- [ ] Tipo de câncer e tema explícito são preservados na navegação entre inicial e ficha; indicador e modo do mapa não restringem o conteúdo dos quatro Eixos
- [ ] Sem JavaScript, o HTML contém indicadores, ressalvas, Ações, fontes, navegação e links por âncoras aos blocos de cada Tipo de câncer, sem depender de interpretar query string no servidor
- [ ] Com JavaScript, o filtro por Tipo de câncer continua funcionando e os links diretos aos tipos levam a conteúdo visível e pertinente
- [ ] Ação, origem territorial, período e ressalvas essenciais ficam visíveis; detalhes extensos usam expansões ou links para as seções pertinentes da Metodologia, sem substituir textos clínicos por exemplos do protótipo
- [ ] Permanecem corretos origem regional, dado insuficiente, faixa C, ausência de carga, períodos distintos, HPV sem Tendência, mortalidade sem Situação, ajuste não calculável e ausência de Situação no tratamento/próstata, sem duplicar regras editoriais divergentes da prévia
- [ ] Cartões, navegação e expansões funcionam pelo teclado, com foco visível e ordem lógica; a ficha é verificada com e sem JavaScript, nos dois temas, a 320, 768 e 1280 px e zoom de 200%, sem cortes e com altura natural no celular
- [ ] Checagem e build passam; a implementação preserva o carregamento de detalhes sob demanda e evita repetir recursos desnecessariamente na saída estática
