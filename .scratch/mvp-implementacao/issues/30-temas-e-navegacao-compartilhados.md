# 30: Temas e navegação compartilhados

**What to build:** o cidadão encontra navegação, tipografia sem serifa, hierarquia compacta, superfícies, controles e bordas consistentes na inicial, em Meu município e na Metodologia. Pode escolher tema claro ou escuro e compartilhar essa escolha na URL. Referência: especificação de UI/UX da v1, seções Páginas e navegação e Tema e estado; MVP §§2 e 11. Complementa o ticket 09, já resolvido.

**Blocked by:** None (can start immediately).

**Status:** ready-for-agent

- [ ] As três páginas compartilham navegação e padrões visuais da direção Mapa imersivo (C), mantendo identidade, aviso de construção e licenças do MVP; o protótipo serve como referência, sem promoção direta ao produto
- [ ] O alternador usa `theme=light|dark`, preserva o estado pertinente e mantém a escolha explícita nos links internos, inclusive nos links para seções; não há persistência entre visitas
- [ ] Sem parâmetro válido, o tema acompanha a preferência do sistema; isso funciona por CSS sem JavaScript. Com JavaScript, a escolha explícita da URL é aplicada sem impedir leitura básica
- [ ] Tipo de câncer, elegibilidade, padrões e correção de URLs continuam obedecendo ao MVP; indicador e modo permanecem restritos ao mapa
- [ ] Fundos, textos, controles e malha neutra se adaptam ao tema; cores e significados de Tendência/Situação, pontos de dado insuficiente e hachura de faixa C são preservados, sem inversão global do mapa
- [ ] Navegação e alternador funcionam pelo teclado com foco visível; as páginas permanecem legíveis nos dois temas a 320, 768 e 1280 px e zoom de 200%, sem conteúdo cortado nem rolagem horizontal fora de tabelas
- [ ] A preservação do tema e do estado na navegação, os parâmetros inválidos e a preferência do sistema são verificados; checagem e build do site passam
