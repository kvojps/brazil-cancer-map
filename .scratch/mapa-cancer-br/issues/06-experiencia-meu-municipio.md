# Como a experiência "meu município" deve parecer?

Type: prototype
Status: resolved
Assignee: Kvojps (claude session 2026-11-02)
Blocked by: 04, 05

## Question

Como deve ser a experiência central: a pessoa busca o município e vê os eixos, as tendências e o que pode fazer? Como o tom de esperança aparece na tela sem esconder a situação? Fazer um protótipo rústico para reagir.

## Answer

Decidido em 2026-11-02 reagindo a um protótipo com quatro variantes. O protótipo está no branch local `prototype/06-meu-municipio` (nunca é mergeado), em `.scratch/mapa-cancer-br/prototypes/06-meu-municipio/PROTOTIPO-meu-municipio.html`, com capturas de tela em `capturas/`.

**A página inicial é o mapa** (variante D). O site abre no Brasil por município. No topo ficam a busca de município, o seletor de Tipo de câncer e o seletor do que o mapa mostra. Ao clicar num município ou buscar por ele, o mapa aproxima no estado, contorna o município e abre a ficha dele ao lado (embaixo, no celular).

**A cor padrão do mapa é a Tendência** (melhorando, estável ou piorando). "Como está hoje", comparado à Referência, é uma alternativa que a pessoa liga. A mortalidade só tem o modo tendência. A paleta não usa vermelho: verde-azulado para melhorando, cinza para estável e âmbar para piorando. A legenda diz "não é um ranking", e as cores nunca vêm de posição (quantis), só da tendência ou da distância até a Referência.

O motivo de a tendência ser o padrão: com a Referência de 100% da lei, o "até 60 dias" pinta o Brasil inteiro de "bem abaixo". É honesto, mas não diferencia nenhum município e contradiz o tom. A tendência diferencia os municípios e sustenta a esperança sem esconder quem piora.

**Indicadores que o mapa pode mostrar:** até 60 dias, mamografia, citopatológico, vacina HPV e tendência da mortalidade, filtrados pelo Tipo de câncer. O tabagismo fica só na ficha, porque o dado é da capital e não pinta municípios. "Onde se tratar" e "Casos novos estimados" também ficam só na ficha.

**A ficha do município é a variante A (ficha por eixo).** Os quatro eixos ficam empilhados, com Acesso ao tratamento primeiro. Cada indicador é um cartão com Situação (valor, barra contra a Referência), Tendência (série com os anos provisórios tracejados) e Ação. "Onde se tratar" fica junto do "até 60 dias". O eixo sem indicador para o tipo mostra a justificativa e a Ação alternativa. "O que é este número?" abre a explicação e a fonte.

**Ressalvas na tela:** as UFs da faixa C aparecem hachuradas no mapa quando ele mostra o Acesso ao tratamento, e a ficha abre com um aviso. A % "sem informação de tratamento" fica no cartão do "até 60 dias". Próstata, HPV (dose única em 2024) e município pequeno (agregado) têm notas no próprio cartão.

**Descartadas:** a B (três perguntas: melhorando/atenção/o que fazer) e a C (por onde começar, por perfil de quem visita). A ideia de C de abrir pelas Ações conforme quem visita fica como possibilidade futura, fora do MVP.

**O que isto deixa em aberto (vai para a Apresentação responsável):**
- A regra da Tendência deixou de ser detalhe: agora ela pinta a página inicial. Ver [Como classificar a Tendência e tratar municípios pequenos no mapa?](12-tendencia-e-municipios-pequenos.md).
- No mapa, o município pequeno aparece com a cor do próprio dado, enquanto a ficha diz que o dado é agregado com os vizinhos. A mesma regra precisa valer nos dois lugares.

## Revisão de apresentação — 2026-11-04

A alternativa A aprovada no [ticket 35](../../mvp-implementacao/issues/35-prototipo-dashboard-de-observabilidade.md) substitui a apresentação/hierarquia anterior por consulta completa no dashboard. Ver [spec de UI/UX vigente](../../ui-ux-v1/spec.md). Preservar os requisitos estatísticos e editoriais; não interpretar este registro histórico como exigência de ficha em tela separada.
