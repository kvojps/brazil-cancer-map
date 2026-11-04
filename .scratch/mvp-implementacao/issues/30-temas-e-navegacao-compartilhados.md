# 30: Temas e navegação compartilhados

**What to build:** o cidadão encontra navegação, tipografia sem serifa, hierarquia compacta, superfícies, controles e bordas consistentes na inicial, em Meu município e na Metodologia. Pode escolher tema claro ou escuro e compartilhar essa escolha na URL. Referência: especificação de UI/UX da v1, seções Páginas e navegação e Tema e estado; MVP §§2 e 11. Complementa o ticket 09, já resolvido.

**Blocked by:** None (can start immediately).

**Status:** resolved

- [x] As três páginas compartilham navegação e padrões visuais da direção Mapa imersivo (C), mantendo identidade, aviso de construção e licenças do MVP; o protótipo serve como referência, sem promoção direta ao produto
- [x] O alternador usa `theme=light|dark`, preserva o estado pertinente e mantém a escolha explícita nos links internos, inclusive nos links para seções; não há persistência entre visitas
- [x] Sem parâmetro válido, o tema acompanha a preferência do sistema; isso funciona por CSS sem JavaScript. Com JavaScript, a escolha explícita da URL é aplicada sem impedir leitura básica
- [x] Tipo de câncer, elegibilidade, padrões e correção de URLs continuam obedecendo ao MVP; indicador e modo permanecem restritos ao mapa
- [x] Fundos, textos, controles e malha neutra se adaptam ao tema; cores e significados de Tendência/Situação, pontos de dado insuficiente e hachura de faixa C são preservados, sem inversão global do mapa
- [x] Navegação e alternador funcionam pelo teclado com foco visível; as páginas permanecem legíveis nos dois temas a 320, 768 e 1280 px e zoom de 200%, sem conteúdo cortado nem rolagem horizontal fora de tabelas
- [x] A preservação do tema e do estado na navegação, os parâmetros inválidos e a preferência do sistema são verificados; checagem e build do site passam


## Comments

### Implementação e validação — 2026-11-04

Commits: `e0b6bad` (`feat: share themes and navigation across pages`) e `fix: preserve live map state in shared navigation` (este commit).

- Layout comum com identidade, navegação, links de tema, salto para o conteúdo, tipografia sem serifa, superfícies, bordas e controles compartilhados. Aviso de construção e licenças mantidos. Páginas de leitura herdam o padrão; a composição específica da Metodologia e a separação prévia/ficha continuam nos tickets 34 e 31.
- `theme=light|dark` é aplicado no cabeçalho antes da leitura; sem escolha válida, CSS acompanha o sistema, inclusive sem JavaScript. Não há armazenamento entre visitas. Links internos, âncoras e links de conteúdo inserido dinamicamente preservam o tema e o Tipo de câncer. Downloads e fontes externas mantêm suas URLs.
- Estado do mapa continua usando a normalização e a elegibilidade existentes. Metodologia recebe apenas tipo/tema. Até a separação da ficha, a rota municipal ainda contém o mapa: sua seleção em curso é preservada no alternador, nas âncoras e no retorno ao mapa. Abrir uma outra ficha leva tipo/tema, sem impor indicador ou modo à ficha.
- Fundo, bordas e contornos do mapa acompanham as variáveis do tema e mudanças da preferência do sistema. Expressões de cor de Tendência/Situação, pontos e hachuras permanecem inalterados; nenhuma inversão global foi aplicada. Séries, texto e superfícies dos cartões se adaptam ao tema.
- Testes na interface pública de URLs acordada com o responsável: seis testes, incluindo duas regressões executadas primeiro em vermelho e depois em verde. Suíte completa do site: **28 testes passando**, com build estático completo incluído. `npm run check --prefix site`: zero erros, avisos ou sugestões. `git diff --check` passou. A execução dos testes exigiu sair do sandbox porque seu subprocesso de build recebeu `EPERM`.
- Verificação com Chromium headless nas rotas inicial, Recife e Metodologia, em claro/escuro: sem overflow horizontal a 320, 768 e 1280 px, e a 160, 384 e 640 px de viewport efetivo (correspondentes à redução de espaço disponível com zoom de 200%). Preferência escura do sistema, sobreposição explícita clara, leitura com JavaScript desativado, tema inválido removido, tema/tipo nos links, foco visível e preservação da seleção no mapa municipal verificados. As dimensões reduzidas simulam o espaço do zoom; não houve auditoria de acessibilidade nem certificação, que continuam no ticket 25.
- Revisão `code-review` em dois agentes: Padrões sem violações documentais; duas duplicações na navegação foram removidas. A repetição da paleta escura nos seletores CSS de preferência do sistema e escolha explícita foi mantida para aplicar as duas regras sem JavaScript. Spec apontou perda de indicador/modo no mapa municipal existente; corrigida, coberta por regressão e revisada novamente sem desvios adicionais.
