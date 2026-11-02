# Qual é o recorte do MVP (tipos de câncer e região)?

Type: grilling
Status: resolved
Blocked by: 09

## Question

O MVP deve cobrir o Brasil inteiro e todos os cânceres, ou um recorte? Se for recorte, quais tipos de câncer (candidatos: mama + colo do útero, os únicos com dado nos quatro eixos) e qual abrangência geográfica (nacional, uma região ou uma UF piloto)?

## Answer

Decidido em grilling em 2026-11-02.

- **Geografia: o Brasil inteiro, sem excluir nenhuma UF.** O microdado do Painel-Oncologia já vem nacional e o site cabe com folga, então cobrir o país custa quase o mesmo que cobrir uma UF. Um piloto estadual também deixaria a maioria das pessoas sem o próprio município. As UFs da faixa C (MA, RO, RN, AP, RR) ficam no mapa com uma **ressalva de qualidade visível**. O formato dessa ressalva é decisão da Apresentação responsável.
- **Tipos de câncer: a visão padrão é "Todos os cânceres", com um seletor de 6 tipos candidatos.** São eles: mama, colo do útero, próstata, colorretal, pulmão e estômago. O motivo é a visibilidade, porque um mapa só de mama e colo do útero deixaria de fora metade da população justamente no eixo carro-chefe, o Acesso ao tratamento. Esse eixo e o Panorama (Painel-Oncologia, SIM) cobrem qualquer CID por município.
- **Cada eixo mostra o que existe para cada tipo, e a falta de indicador vira conteúdo.** Não é que falte campo na base. O SUS só tem rastreamento organizado para mama e colo do útero, e para próstata o INCA recomenda **não** rastrear com PSA quem não tem sintomas. A prevenção de outros tipos (tabagismo, obesidade, álcool) só existe por capital ou UF. As exceções municipais são as vacinas HPV e hepatite B. Quando um eixo fica vazio para um tipo, ele mostra a justificativa e uma Ação alternativa, como "conheça os sinais".
- **A lista de 6 tipos ainda não está fechada.** A qualidade do dado só foi medida para C50 e C53. A medição dos outros tipos fica em [Qual a qualidade dos dados dos outros tipos de câncer por UF?](10-medir-completude-outros-tipos.md), e [Quais indicadores entram no MVP?](04-indicadores-do-mvp.md) só confirma a lista depois dela.
- **Ficam para a v2** outros tipos além dos 6, como boca, fígado, pele e bexiga.
