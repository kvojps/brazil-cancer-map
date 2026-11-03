# Que regras de método e ressalvas a mortalidade e o Acesso ao tratamento mostram?

Type: grilling
Status: resolved
Assignee: Kvojps (Codex session 2026-11-02)
Blocked by: 15

## Question

Com [Como as fontes oficiais tratam C55, C26 e a padronização por idade na mortalidade?](15-metodos-mortalidade.md) em mãos, decidir:
- a população padrão e as faixas da padronização por idade;
- se o pipeline redistribui o C55 na mortalidade por colo do útero e o C26 na colorretal, ou só mostra uma ressalva;
- como a ressalva de qualidade aparece **por UF e por tipo de câncer**, já que a faixa A/B/C muda com o tipo ([Qual a qualidade dos dados dos outros tipos de câncer por UF?](10-medir-completude-outros-tipos.md));
- o texto da nota de método que explica por que "Todos os cânceres" muda de definição entre os eixos ([Quais indicadores entram no MVP?](04-indicadores-do-mvp.md));
- como a legenda e o tooltip deixam claro que a cor não é ranking.
- a nota de método precisa explicar a Referência ([Qual é a Referência de cada indicador?](18-referencia-de-cada-indicador.md)): mamografia em 50–69 e não 50–74, HPV pelo Censo 2022 fixo, a regra das 3 faixas e o congelamento do citopatológico.

## Comments

### Rodada 1 — 2026-11-02

O usuário confirmou: “Concordo com tudo.”

- Adotar padronização direta pela população mundial Segi/Doll, faixas quinquenais até 79 anos e última faixa 80+.
- Redistribuir C55 entre colo e corpo do útero conforme a proporção por UF, ano e idade. Nota visível: “Estimativa ajustada para registros sem localização definida; pode diferir do INCA.” A diferença na tendência padronizada completa ainda não foi medida. Não redistribuir C26 nem as demais causas mal definidas no MVP.
- Mostrar sempre o percentual sem informação de tratamento junto ao percentual em até 60 dias; a ressalva varia por UF e tipo selecionado. Na faixa C, manter hachura e o aviso “Muitos casos estão sem informação de tratamento; o resultado pode não representar toda a situação.” Ausência de registro não significa ausência de tratamento.

Ticket permanece aberto para definir os textos de método e legenda e completar as regras operacionais.

### Rodada 2 — 2026-11-02

O usuário confirmou todas as propostas e acrescentou: “É necessário que detalhamos tudo sobre como chegamos aos dados em uma seção de metodologia”.

## Answer

Decidido com o usuário em duas rodadas de grilling em 2026-11-02.

### Mortalidade: padronização e ajustes

- Padronização direta pela população mundial Segi/Doll, faixas quinquenais de 0–4 até 75–79 e última faixa 80+. Denominador POPSVS, conforme [Qual a série e o formato da estimativa populacional do MS/SVS por município, sexo e idade?](13-denominador-populacional.md). Os pesos e a fórmula devem estar publicados na metodologia.
- Na mortalidade por colo do útero, redistribuir C55 entre C53 e C54 na proporção C53/(C53+C54) da UF de residência × ano × faixa etária. Aplicar essa proporção aos C55 do município, preservando valores fracionários. C54 recebe o restante; não somar C55 inteiro a C53. O total de todos os cânceres não ganha casos com essa redistribuição.
- Se C53+C54 for zero na célula estadual, usar a proporção nacional do mesmo ano e idade. Se ela também não puder ser calculada, sinalizar ajuste não calculável; não inventar proporção nem apresentar silenciosamente o resultado como ajustado.
- Nota visível: **“Estimativa ajustada para registros sem localização definida; pode diferir do INCA.”** Explicar o ajuste e a diferença em relação à série sem redistribuição na metodologia.
- C26, R00–R99 e demais causas mal definidas ficam sem redistribuição no MVP e são limitações declaradas.
- A pesquisa mediu a diferença nas contagens, não na tendência padronizada completa. A metodologia não pode apresentar a aproximação como efeito já comprovado na classe de Tendência; a execução deverá validar a série ajustada completa.

### Qualidade no Acesso ao tratamento

- Mostrar sempre a **% sem informação de tratamento** junto à % em até 60 dias. Falta de registro não significa falta de tratamento.
- Classificação por **UF × tipo selecionado**, inclusive “Todos”, usando os últimos cinco anos consolidados; mostrar o período. Não usar a lista histórica fixa de UFs.
- **A:** até 15%; **B:** acima de 15% e abaixo de 35%; **C:** 35% ou mais. Calcular a proporção com os registros da janela, sem transformar o corte em ranking.
- Na faixa C, hachura e aviso: **“Muitos casos estão sem informação de tratamento; o resultado pode não representar toda a situação.”** A hachura vale apenas para o indicador de tratamento correspondente, não para os outros eixos.
- A ressalva fixa da próstata e a ausência de Situação permanecem conforme [Qual é a Referência de cada indicador?](18-referencia-de-cada-indicador.md).

### “Todos os cânceres”

Nota junto ao seletor, com detalhe em “Como calculamos”:

> Cada eixo usa os registros adequados ao seu indicador. No tratamento, excluímos alguns tipos com informação incompleta. Por isso, ‘Todos os cânceres’ não reúne exatamente os mesmos tipos em todos os eixos.

Publicar os códigos na metodologia: tratamento = C00–C97 sem C44, C73 e C76–C80; mortalidade = C00–C97 sem C44, conforme [Quais indicadores entram no MVP?](04-indicadores-do-mvp.md). Os demais indicadores conservam seus recortes e fontes próprios.

### Legenda e tooltip

- **Tendência:** “A cor mostra como o indicador mudou ao longo dos anos. Não é um ranking entre municípios.”
- **Situação:** “A cor mostra a distância até a referência. Não é um ranking entre municípios.”
- Tooltip: nome do lugar, indicador, período, classe e origem geográfica do dado. Quando usa a Região imediata: **“Seu município e vizinhos — região de X”.**
- Preservar classes, cores, pontos para dado insuficiente e a mesma regra no mapa e na ficha de [Como classificar a Tendência e tratar municípios pequenos no mapa?](12-tendencia-e-municipios-pequenos.md). Hachura é ressalva de qualidade, não classe de Tendência.

### Notas das referências

Explicação curta no cartão, mantendo as ressalvas essenciais visíveis, com detalhes em “Como calculamos”:

- **Mamografia:** “Este indicador acompanha exames entre 50 e 69 anos para preservar a comparação histórica. A orientação atual do SUS abrange 50 a 74 anos.”
- **HPV:** “Usamos a população do Censo 2022 como referência fixa, conforme o painel oficial.” Explicar a diferença para o POPSVS.
- **Citopatológico:** “Série encerrada em 2025. A troca pelo teste de DNA-HPV pode reduzir os Papanicolaus sem representar menos cuidado.” Não sugerir que a série congelada descreve o cuidado atual.
- **Faixas de Situação:** publicar os cortes fixos de alcançou, perto e longe, inclusive a regra invertida do tabagismo e os valores acima do esperado, remetendo à decisão em [Qual é a Referência de cada indicador?](18-referencia-de-cada-indicador.md).

### Seção pública de metodologia: requisito do MVP

O usuário exige detalhar **todo o percurso da fonte ao dado exibido**. A spec deve prever uma seção pública de metodologia, acessível nos cartões por **“Como calculamos”**, com linguagem simples e detalhe técnico suficiente para reproduzir os resultados.

Para cada indicador, documentar:

- fonte oficial e links, arquivos/edição usados, data de extração e período coberto;
- universo, unidade, município de residência ou localização do estabelecimento, recortes de sexo/idade, códigos e exclusões;
- numerador, denominador, fórmulas, população de referência e pesos;
- limpeza, cruzamentos, registros ausentes, ajustes, redistribuições e regras de fallback;
- janela temporal, anos provisórios, consolidação, quebras de série e congelamentos;
- método de Tendência, incerteza e critérios das classes, Referência e cortes de Situação;
- mínimo de casos, substituição pela Região imediata e dado insuficiente;
- qualidade por UF e tipo, limitações, diferenças em relação aos painéis oficiais e validações realizadas;
- versões do código e dos dados, acesso aos scripts e dados agregados usados e histórico das revisões que alterem os resultados.

A seção detalha as decisões dos tickets, sem criar regras novas silenciosamente. Sua redação final integra a consolidação da spec; construir a seção no site continua fora deste mapa. Os links oficiais e orientações devem ser conferidos na execução, sem tratar esta decisão como nova validação das fontes.
