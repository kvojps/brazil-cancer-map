# 32: Busca e tabela independentes do mapa

**What to build:** o cidadão consegue encontrar seu município e consultar os resultados mesmo quando o mapa não inicializa; sem JavaScript, encontra uma lista de municípios por UF com links para as fichas. Referência: especificação de UI/UX da v1, seções Acesso sem mapa ou JavaScript e Critérios verificáveis; MVP §§2 e 11.

**Blocked by:** None (can start immediately).

**Status:** ready-for-agent

- [ ] Com JavaScript, busca e tabela inicializam sem aguardar WebGL ou a inicialização do mapa; falha ou demora do mapa não impede seu uso
- [ ] A tabela acompanha o estado indicador × Tipo de câncer × modo, com os mesmos valores, classes, origens e avisos da camada, respeitando estados sem Situação ou Tendência e dado insuficiente
- [ ] Busca e tabela oferecem acesso à ficha municipal preservando Tipo de câncer e tema explícito quando presentes; a alternativa continua utilizável sem prévia ou mapa disponíveis
- [ ] Falhas de carregamento dos próprios dados são explicadas com possibilidade de tentar novamente, sem tabela silenciosamente vazia nem resultados antigos apresentados como atuais
- [ ] Sem JavaScript, a inicial entrega no HTML uma lista estática organizada por UF, com links para as fichas municipais, sem exigir interação com o mapa
- [ ] Busca, resultados, tabela e índice funcionam pelo teclado, com ordem lógica, foco visível e anúncios acessíveis de resultados; informações permanecem compreensíveis sem depender só de cor
- [ ] O acesso é verificado com JavaScript desativado e com falha de WebGL simulada; tabela e índice são legíveis nos dois temas a 320, 768 e 1280 px e zoom de 200%, limitando rolagem horizontal às tabelas; checagem e build passam
