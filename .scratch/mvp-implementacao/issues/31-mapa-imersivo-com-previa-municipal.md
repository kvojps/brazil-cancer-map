# 31: Mapa imersivo com prévia municipal

**What to build:** o Mapa inicial apresenta o Brasil e, ao selecionar ou buscar um município, abre uma prévia do indicador escolhido com acesso à página própria Meu município. Referência: especificação de UI/UX da v1, seções Páginas e navegação, Prévia e contrato existente e Critérios verificáveis; revisão expressa da apresentação do MVP §11.

**Blocked by:** 30 — Temas e navegação compartilhados.

**Status:** ready-for-agent

- [ ] A inicial adota mapa central e controles compactos, sem cartões numéricos nacionais; sem seleção, o painel orienta a buscar ou selecionar um município
- [ ] Seleção por mapa ou busca aproxima o mapa no estado, contorna o município e abre apenas a prévia; “Ver Meu município” abre a ficha completa em página própria
- [ ] O painel preenche a altura da linha do mapa no desktop, sem ficar fixo na rolagem; no celular, mapa e prévia se empilham com altura natural
- [ ] A prévia acompanha município, indicador, Tipo de câncer e modo atuais; links compartilháveis, histórico e retorno entre mapa e ficha mantêm o estado pertinente e o tema, sem restringir os quatro Eixos da ficha pelo indicador ou modo
- [ ] Nome e UF, resultado, Tendência, Situação e Referência quando aplicáveis, origem territorial, períodos, ressalvas essenciais e Ação aparecem usando resultados prontos do pipeline e regras editoriais reutilizadas dos cartões, sem estatística no front nem ampliação do contrato por conveniência visual
- [ ] Mortalidade não ganha Situação ou Referência, e ajuste C55 não calculável não vira automaticamente dado insuficiente; HPV mostra apenas Situação e “série curta, ainda sem direção”, com notas de denominador e dose única pertinentes; tratamento/próstata respeita a ausência de Situação
- [ ] Origem regional identifica “seu município e vizinhos” e o nome da Região imediata junto do resultado; dado insuficiente mantém explicação, Ação e acesso à ficha; ausência de carga tem estado compreensível sem presumir publicação de dados pendentes
- [ ] Faixa C mantém aviso e percentual sem informação, com hachura apenas no tratamento correspondente; período da qualidade e ano do valor permanecem distintos. Recorte quimio/radio, diferenças etárias de mamografia, transição DNA-HPV e demais ressalvas acompanham o resultado pertinente
- [ ] Detalhes exclusivos da ficha por UF são consultados sob demanda; falhas e respostas atrasadas não exibem resultados de outra seleção nem removem o acesso à ficha
- [ ] A seleção mantém o foco no controle, oferece acesso direto à prévia e anuncia resultados de forma acessível; fluxo, estados excepcionais e links técnicos são verificados nos dois temas, a 320, 768 e 1280 px e zoom de 200%, com checagem e build passando
