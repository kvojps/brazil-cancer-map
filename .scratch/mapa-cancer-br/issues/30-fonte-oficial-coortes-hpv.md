# 30: Qual fonte fornece o numerador qualificado das coortes HPV?

**Status:** resolved

## Decisão

Em 05/11/2026, o mantenedor aprovou usar as **coortes oficiais agregadas** do
painel do Ministério da Saúde como fonte do indicador. A redução mensal dos
microdados SI-PNI/RNDS continua disponível para auditoria, particionada por ano,
mas sua reconstrução não é publicada como equivalente à qualificação interna
do PNI.

O método continua sendo a coorte de 9–14 anos com ao menos uma dose, incluindo
HPV quadrivalente e nonavalente. A cobertura do total e das Regiões imediatas é
calculada pelo Observatório somando os numeradores e denominadores oficiais;
os denominadores são conferidos contra o Censo 2022/SIDRA 9514 local. Permanecem
as regras de mínimo, Situação, referência, dose única, ano provisório e ausência
de Tendência. Não se usa doses do ano divididas pela população.

## Evidência

A carga de janeiro/2020 a setembro/2026 concluiu com 81 extratos. Na amostra de
Recife/2025, os denominadores locais e oficiais conferem exatamente (52.868
meninas; 55.555 meninos), mas os numeradores reconstruídos divergem dos
qualificados pelo PNI. A NT 16/2025 descreve remoção de duplicidades e erros na
RNDS sem documentar integralmente a reprodução desse tratamento com as chaves
públicas. Variações de atribuição municipal e coorte não reproduziram a amostra.

## Comments

Aprovação expressa na retomada do [ticket de implementação 18](../../mvp-implementacao/issues/18-cobertura-hpv.md): “Usar coortes oficiais agregadas”.

Fonte: [painel oficial HPV](https://www.gov.br/saude/pt-br/vacinacao/paineis-de-vacinacao/hpv), tabela `KeWXGFP`; referências de Recife, Brasileia e Jundiaí/2025 em `pipeline/references/hpv.json`, consultadas em 05/11/2026.

Commit da decisão e implementação: `6d2f0a7` — `feat: publish qualified official HPV cohorts and retain local audit`.
