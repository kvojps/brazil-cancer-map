# Consolidar a spec do MVP

Type: task
Status: resolved
Assignee: Kvojps (Claude session 2026-11-02, ticket 23)
Blocked by: 18, 19, 20, 21, 22, 24

## Question

Juntar as decisões do mapa numa spec de MVP pronta para construir: fontes, indicadores por eixo e tipo, regras de método, Tendência, Referência, Ações, experiência (mapa inicial e Meu município), stack, pipeline, contrato de dados, atualização, identidade e a decisão go. A spec só aponta para os tickets como fonte de cada decisão e não decide nada novo. Se aparecer uma lacuna, ela vira um ticket novo, e não uma decisão tomada aqui.


A spec deve incluir a seção pública de **metodologia**, acessível por “Como calculamos” nos cartões, com o percurso completo da fonte ao dado exibido e os requisitos de reprodução definidos em [Que regras de método e ressalvas a mortalidade e o Acesso ao tratamento mostram?](19-metodo-e-ressalvas.md#seção-pública-de-metodologia-requisito-do-mvp).

## Answer

Consolidado em 2026-11-02: **[spec-mvp.md](../spec-mvp.md)**. São 17 seções (decisão go, identidade e licenças, escopo, fontes, indicadores, método, Tendência, municípios pequenos, Referência e Situação, Ações, experiência, metodologia pública, stack, pipeline, contrato de dados, atualização e pendências). Cada regra aponta para o ticket que a decidiu, e nada novo foi decidido.

- **A seção "Como calculamos"** (seção 12) traz os nove itens de reprodução de [Que regras de método e ressalvas a mortalidade e o Acesso ao tratamento mostram?](19-metodo-e-ressalvas.md).
- **Duas lacunas viraram tickets**, marcados [pendente] na spec:
  - [Em que escala vale a faixa de "estável" (±1% ao ano) para proporções, razões e tabagismo?](25-escala-da-faixa-estavel.md)
  - [Com que indicador, tipo e modo o Mapa inicial abre?](26-estado-inicial-do-mapa.md)
- **Requisitos de execução antes de publicar** foram reunidos na seção 17, sem virar decisões: revisor clínico, reconferência das fontes das Ações, validação da série com o C55, medição do SI-PNI no CI e arquivos de licença.
- **O substituto da razão de citopatológicos** saiu do fog e foi para Out of scope (pós-MVP): o MVP fica completo com a série congelada, e o substituto depende de um dado e de uma Referência que ainda não existem.
- **Depois da consolidação**, o responsável pelo projeto decidiu que o `AGENTS.md` será gerado no início da execução da spec. Isso ficou registrado em "Primeiro passo da execução", na seção 17.
