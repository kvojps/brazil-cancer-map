# Qual é a Referência de cada indicador?

Type: grilling
Status: resolved
Assignee: Kvojps (claude session 2026-11-02, ticket 18)
Blocked by: 14

## Question

Com as metas de [Que metas oficiais existem para os indicadores do MVP?](14-metas-oficiais.md) em mãos, decidir a Referência de cada indicador do MVP, ou seja, contra o que a Situação é comparada:
- a meta oficial, quando ela existe e faz sentido para o cidadão;
- o valor do Brasil, quando não existe meta;
- o caso do HPV, cujo mapa abre em "como está hoje" ([Como classificar a Tendência e tratar municípios pequenos no mapa?](12-tendencia-e-municipios-pequenos.md)): qual meta do PNI, e se o denominador é o **Censo 2022 fixo** (como o painel oficial do PNI) ou o **POPSVS ano a ano** (como os outros indicadores; ver [Qual a série e o formato da estimativa populacional do MS/SVS por município, sexo e idade?](13-denominador-populacional.md));
- as faixas de "como está hoje" no mapa (distância até a Referência), sem virar ranking.
- dois pontos levantados por [Que metas oficiais existem para os indicadores do MVP?](14-metas-oficiais.md): se a faixa da mamografia passa de 50–69 para **50–74** (NT 626/2025, confirmada em [O que o SUS e a lei garantem ao cidadão em cada Ação?](16-direitos-e-orientacoes-sus.md)), e como tratar a troca do citopatológico pelo **teste DNA-HPV** a cada 5 anos, que derruba a razão de citopatológicos e pode aparecer como "piorando" sem ser piora.

## Answer

Decidido em grilling em 2026-11-02. O glossário ganhou o termo **Situação**.

**Referência de cada indicador**

| Indicador | Referência | Texto para o público |
|---|---|---|
| % em até 60 dias | **100%** (Lei 12.732/2012) | "o que a lei garante" |
| Razão de mamografias (50–69) | **1** (ficha do INCA) | "meta" |
| Razão de citopatológicos (25–64) | **1** (ficha do INCA) | "meta" |
| Cobertura HPV (9–14) | **90%** para o total e para cada sexo (Plano de Dant); o cartão diz que a meta da OMS é para meninas | "meta para 2030" |
| % de fumantes na capital | **5,9%** (meta nacional do Plano de Dant aplicada a todas as capitais) | "meta do Brasil para 2030" |
| Tendência da mortalidade | **Nenhuma.** Não tem Situação, só Tendência. A Tendência do Brasil aparece como contexto, e as metas de mama (−10%) e colo (−20%, 30–69 anos) entram só em texto | — |
| Casos estimados e Onde se tratar | **Nenhuma** (são contexto) | — |

A definição de Referência no glossário continua com "o valor do Brasil quando não há meta", mas nenhum indicador do MVP usa esse caso.

**Pontos específicos**
- **Mamografia:** fica em **50–69 anos** com razão 1, porque é o que a ficha do INCA e a série histórica sustentam. Uma nota de método explica a NT 626/2025 (50–74), e a Ação fala em 50–74. Revemos quando o INCA publicar uma ficha para 50–74.
- **Denominador do HPV:** **Censo 2022 fixo**, como o painel do PNI, para o número bater com o oficial. A nota de método explica a diferença em relação ao POPSVS usado nos outros indicadores.
- **Citopatológico e DNA-HPV:** a série fica em **2016–2025, congelada em 2025**, com Referência 1 e Tendência calculada sobre essa janela. O cartão leva uma ressalva fixa: "a partir de 2025 o SUS está trocando o Papanicolau pelo teste de DNA-HPV, feito a cada 5 anos. Menos Papanicolaus não quer dizer menos cuidado." O DNA-HPV tem código SIGTAP 02.02.10.025-1 (BPA-I, SIA-SUS, desde 09/2025). Não há lista oficial de onde ele já foi implantado, e o único indicador combinado (o C7 da APS) não dá para recalcular com dado aberto. Por isso, o indicador que vai substituir a razão de citopatológicos foi para a fog.
- **60 dias na próstata:** **sem Situação e sem faixa** no "como está hoje", porque a vigilância ativa é conduta correta. Fica só a Tendência, com a ressalva fixa.

**"Como está hoje" (Situação no mapa e no cartão)**
- **3 faixas, com a mesma regra para todos os indicadores.** Os cortes são fixos e declarados no método, nunca quantis, porque quantil é ranking disfarçado.
  - **Alcançou:** ≥ Ref (no tabagismo, ≤ Ref).
  - **Perto:** ≥ 0,8 × Ref (no tabagismo, ≤ Ref ÷ 0,8 = 7,4%).
  - **Longe:** o resto.
- **Valores acima do possível** (HPV acima de 100%, razão muito acima de 1): entram como "alcançou", com a nota "valor acima do esperado, provavelmente erro no registro ou na estimativa de população". O número não é cortado.
- **Cor:** uma escala de **um só tom em 3 passos**, mais escura quanto mais perto da Referência, diferente das cores da Tendência. Usa as mesmas texturas (pontos para dado insuficiente e hachura para a faixa C). A legenda diz "distância até a meta, não é ranking".
- A cascata município → Região imediata → dado insuficiente ([Como classificar a Tendência e tratar municípios pequenos no mapa?](12-tendencia-e-municipios-pequenos.md)) vale também para a Situação, com a mesma Referência.
