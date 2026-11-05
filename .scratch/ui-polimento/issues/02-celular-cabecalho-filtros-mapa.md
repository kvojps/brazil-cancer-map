# Como deve ser a primeira tela do site no celular?

Labels: wayfinder:prototype
Type: prototype
**Status:** resolved
Assignee: Kvojps
Parent: ../map.md
Blocked by:

## Question

Prototipar a 390 px, com dados reais, a primeira tela do Mapa inicial: aviso "Em construção", cabeçalho com menu hambúrguer, busca compacta, botão **Filtros** e mapa do Brasil. Definir como o botão Filtros abre os seletores de Indicador, Leitura e Tipo de câncer, e se ele mostra o que está selecionado.

O aviso fica integral e não recolhível, possivelmente com mais destaque, e o desenho precisa acomodá-lo sem esconder o mapa. A spec do MVP, §2, exige faixa fixa no topo, sem fechar, com o texto exato, sem vermelho e sem as cores da Tendência. Partir das recomendações para este protótipo na [pesquisa de referências](01-referencias-visuais.md). Definir também como a página rola quando o gesto de um dedo no mapa move o mapa, e onde ficam a legenda e o alternador Mapa/Lista. Alvos de toque de 44 px. Menu e filtros precisam funcionar sem JavaScript.

## Answer

O responsável escolheu a **variante C, Mapa inteiro, com o aviso 2, faixa invertida**, e aceitou as demais propostas.

- **Tela:** o aviso fica no topo, e o mapa ocupa de ponta a ponta toda a altura abaixo dele (91% em 390 × 844, 89% em 390 × 664). O resto flutua sobre o mapa.
- **Aviso:** faixa integral, sem fechar, com o texto exato, sempre visível, inclusive na Lista e com a página rolada. Fundo no tom escuro do aviso e texto claro, com contraste de 10:1 no tema claro e 10,4:1 no escuro.
- **Cabeçalho:** cartão flutuante com menu hambúrguer, nome do site e ícone de busca. A busca expande sobre o cabeçalho e fecha ao escolher um município. O menu leva a Mapa, Municípios por UF, Como calculamos, Fontes e condições de reutilização, Código-fonte e troca de tema.
- **Filtros:** botão flutuante logo abaixo do cabeçalho, sempre com o recorte vigente, por exemplo "Até 60 dias · Todos os cânceres · Tendência". Abre uma folha que sobe da base, não modal e com até 50% da altura. Os seletores nativos têm 44 px, o mapa muda ao vivo e "Ver mapa" fecha a folha.
- **Legenda:** cartão flutuante no canto inferior esquerdo, com período e cada classe sempre à vista. O ⓘ abre a legenda completa com todas as ressalvas. A hachura aparece com o rótulo curto "Faixa C".
- **Mapa/Lista:** alternador flutuante no canto inferior direito. Na Lista, fica fixo na tela.
- **Rolagem:** um dedo no mapa move o mapa, e a tela do mapa não rola. O rodapé não é alcançado ali: o menu leva a fontes, licenças e código. A Lista rola normalmente.
- **Enquadramento:** no celular, o mapa vai até Fernando de Noronha, e não até a Ilha da Trindade, para o país ficar maior.
- **Sem JavaScript:** menu e folha de Filtros abrem. Os seletores ficam desativados, com um aviso e o link para Municípios por UF, e o mapa troca "Carregando…" pelo mesmo link. O responsável aceitou isso como cumprimento do critério, pois um site estático não redesenha o mapa sem JavaScript.

Pendências da variante escolhida, a resolver na implementação:

- **Legenda sobre o Brasil:** em 390 × 664 o cartão encosta no Rio Grande do Sul, e em 320 × 568 cobre parte do Sul. O enquadramento inicial precisa reservar a área dos controles.
- **Zoom de 200%:** a 195 × 422 px o nome ocupa três linhas e o botão Filtros fica espremido, com o texto quebrado no meio das palavras. O protótipo só libera a rolagem em telas com menos de 520 px de altura. Falta os controles saírem de cima do mapa nessa condição, para cumprir a spec vigente.
- **Aviso e seleção:** conferir nos dois temas se a faixa invertida se confunde com o contorno de município selecionado, `#142f55` no tema claro.
- **Textos da busca:** corrigir "1 municípios encontrados" e o "Use Tab para escolher", que não serve ao toque.
- **Não verificado:** teclado virtual aberto na busca, Safari no iPhone e aparelho real. O teste no celular do responsável segue previsto para o fim. A emulação em Chromium cobriu 390 e 320 px, tema escuro, sem JavaScript, toque e Lista.

Protótipo: branch descartável local `prototype/ui-polimento-celular`, commits `5155e38` e `7ae4518`; `npm run dev` em `site/`, com `?variant=C&aviso=2`. O código é só referência e deve ser reescrito na implementação.

## Comments

### Resolução — 2026-11-05

O responsável escolheu a variante C depois de receber a recomendação pela A com o aviso 2: "Escolho o visual C concordo com o restante". Ficam aceitos o aviso 2, o rótulo "Faixa C" e o comportamento sem JavaScript. Sem alteração no código do produto.
