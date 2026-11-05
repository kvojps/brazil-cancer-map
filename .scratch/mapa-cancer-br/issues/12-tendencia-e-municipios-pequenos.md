# Como classificar a Tendência e tratar municípios pequenos no mapa?

Type: grilling
Status: resolved
Assignee: Kvojps (claude session 2026-11-02)
Blocked by: 11

## Question

O mapa inicial é pintado pela Tendência ([Como a experiência "meu município" deve parecer?](06-experiencia-meu-municipio.md)), então a regra que classifica um indicador como melhorando, estável ou piorando define a primeira impressão do site. Com os métodos de [Que métodos existem para classificar tendência e estabilizar taxas de municípios pequenos?](11-metodos-tendencia-e-pequenos-numeros.md) em mãos, decidir:

- a regra da Tendência para cada indicador (janela de anos, tratamento da incerteza, o que fazer com os anos provisórios e com a quebra de método do HPV em 2024);
- o que acontece com o município de poucos casos: suprimir, agregar (com quem) ou suavizar. A mesma regra precisa valer na cor do mapa e na ficha;
- como o mapa e a ficha mostram "dado insuficiente" sem parecer um buraco ou um erro.

## Answer

Decidido em grilling em 2026-11-02.

**Classes da Tendência** (o glossário foi atualizado)
- **Melhorando** ou **piorando**: o IC 95% da variação anual exclui zero.
- **Estável**: o IC inteiro fica dentro de ±1% ao ano, ou seja, sabemos que quase não mudou.
- **Sem direção clara**: o IC é largo e inclui zero.
- **Dado insuficiente** fica fora das classes: vale quando nem o município nem a região chegam ao mínimo de casos.

**Cálculo** (no pipeline, etapa "calcular")
- **Uma única variação anual** sobre os **últimos até 10 anos consolidados**: SIM 2014–2024, Painel 2014 até o último ano consolidado, SISCAN 2016–2025. Sem Joinpoint no MVP. Uma virada recente aparece no gráfico da série, não na classe.
- **Os anos provisórios ficam fora** do cálculo e aparecem tracejados no gráfico. São os 2 últimos anos do Painel e os anos preliminares do SIM.
- **Modelos:**
  - quasi-Poisson com offset de população para a mortalidade padronizada e as razões do SISCAN;
  - binomial/logística para a % em até 60 dias;
  - regressão ponderada pelos erros-padrão para o tabagismo do Vigitel na capital.

  A regra de classificação é a mesma para todos. Prais-Winsten fica de fora.
- **HPV:** sem Tendência estatística. O cartão diz "série curta, ainda sem direção" e marca a mudança para dose única em 2024. No mapa, quando o indicador escolhido é HPV, o modo padrão é "como está hoje" contra a meta do PNI, com uma nota no seletor explicando por quê.

**Municípios pequenos**
- **Mínimo:** média de **pelo menos 20 por ano** na janela (o limite de "instável" do CDC WONDER). Nas taxas, conta-se o numerador (óbitos, exames). Nas proporções e coberturas, conta-se o denominador (casos diagnosticados, população de 9–14 anos).
- **Cascata, para cada indicador × tipo de câncer separadamente:**
  - se o município passa do mínimo, usa o próprio dado;
  - se não passa, usa o dado da **Região imediata** do IBGE (510 regiões, com código já na malha), se ela passar;
  - se nem a região passa, fica como **dado insuficiente**.

  Nunca se sobe para a UF. A regra vale para a **Tendência e para a Situação**.
- A suavização bayesiana foi descartada porque é difícil de explicar ao cidadão.

**Na tela** (a mesma regra vale no mapa e na ficha)
- **Mapa:**
  - melhorando em verde-azulado;
  - piorando em âmbar;
  - estável em cinza médio;
  - sem direção clara em cinza claro;
  - dado insuficiente em quase branco com **textura de pontos**, nunca branco puro.

  O município que usa o dado da região ganha **a cor da região, sem textura**, e o tooltip diz "dado da região de X". As texturas ficam reservadas para os pontos do dado insuficiente e a hachura diagonal da faixa C. A legenda tem as 5 entradas e "não é um ranking".
- **Ficha:**
  - Dado da região: o cartão diz "**Seu município e vizinhos** (região de X)" e mostra a série e a Situação da região, com uma nota de uma linha explicando o motivo.
  - Dado insuficiente: o cartão diz "**Poucos casos aqui para dizer a direção**. Isso é comum em municípios pequenos e não é um problema do seu município." Mostra a Tendência da UF como contexto ("no seu estado") e mantém a Ação. A contagem bruta do município não aparece, para evitar identificar pessoas e porque ela é instável.

**Glossário:** a Tendência passou a ter 4 classes. Entraram os termos **Região imediata** e **Dado insuficiente**. "Agregado" fica só como termo técnico do pipeline.

> **Atualização (2026-11-02):** os modelos do 60 dias e do tabagismo e a escala do ±1% foram redefinidos em [Em que escala vale a faixa de "estável" (±1% ao ano) para proporções, razões e tabagismo?](25-escala-da-faixa-estavel.md).

## Comments

### Tema escuro — 2026-11-05

Nos pontos de cor do tema escuro, esta decisão foi alterada pelos [fundamentos visuais](../../ui-polimento/issues/03-fundamentos-visuais.md). O tema claro segue a regra acima.
