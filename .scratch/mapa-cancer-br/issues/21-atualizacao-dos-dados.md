# Quando e onde o pipeline roda para atualizar os dados?

Type: grilling
Status: resolved
Assignee: Codex (sessão wayfinder)
Blocked by: 17

## Question

Com [Com que frequência cada fonte do MVP publica dados novos?](17-calendario-das-fontes.md) em mãos, decidir:
- a frequência de atualização do site (por fonte ou tudo junto);
- se o pipeline roda manualmente na máquina do mantenedor ou por agendamento no CI, e onde fica o cache de dezenas de GB do SI-PNI;
- o que acontece quando a etapa de validação falha ou uma fonte muda de formato;
- como o site mostra a data de cada dado ao cidadão (o `manifest.json` de [Qual stack e pipeline de dados usar?](07-stack-e-pipeline.md)).
- a razão de citopatológicos **não recebe anos novos** depois de 2025 ([Qual é a Referência de cada indicador?](18-referencia-de-cada-indicador.md)): como o site mostra um indicador congelado sem parecer desatualizado.

## Comments

### Rodada de decisões — 2026-11-02

O usuário concordou com:
- Atualização independente por fonte: checagem mensal para Painel-Oncologia, CNES e HPV; anual para séries anuais; Estimativa INCA a cada edição.
- Falha de validação preserva a última versão válida da fonte; outras fontes podem atualizar quando independentes. Indicadores e denominadores dependentes permanecem compatíveis. Registrar a falha e avisar o mantenedor pelo CI.
- Destacar o período dos dados no cartão e apresentar a data de atualização nos detalhes. Citopatológico identificado como série encerrada em 2025 pela mudança no rastreamento, com ressalva do DNA-HPV.

Pendente: execução em CI. O usuário perguntou se o plano gratuito suporta.

Verificação documental: [runners padrão em repositório público são gratuitos e ilimitados](https://docs.github.com/en/actions/reference/runners/github-hosted-runners), com Linux de 4 CPUs, 16 GB de RAM e 14 GB de disco. [Cada job tem limite de 6 horas](https://docs.github.com/en/actions/reference/limits). [Releases](https://docs.github.com/en/repositories/releasing-projects-on-github/about-releases) aceitam até 1000 assets por release, cada arquivo menor que 2 GiB. [Agendamentos são desativados após 60 dias sem atividade no repositório](https://docs.github.com/en/actions/how-tos/manage-workflow-runs/disable-and-enable-workflows).

Conclusão proposta: viável financeiramente em repositório público com runners padrão, mas a duração e o pico de disco do SI-PNI ainda precisam de medição na implementação. Processar em fluxo, particionar os jobs e persistir apenas agregados/estado em Releases; sem guardar o bruto completo no CI. Se não couber, executar a etapa pesada na máquina do mantenedor. Não foi realizado benchmark.

### Confirmação final — 2026-11-02

O usuário confirmou: “Concordo com tudo”.

## Answer

Decidido em grilling em 2026-11-02, com confirmação explícita do usuário.

**Frequência por fonte**
- Painel-Oncologia, CNES e HPV: checagem mensal.
- Séries anuais: checagem anual conforme o calendário da fonte.
- Estimativa INCA: atualização a cada edição.
- Cada fonte atualiza independentemente, respeitando a compatibilidade dos indicadores com seus denominadores. Checar uma fonte não significa publicar um período novo: as regras de anos consolidados continuam valendo.
- A razão de citopatológicos permanece encerrada em 2025; não recebe anos novos.

**Execução e custo**
- GitHub Actions agendado em repositório público, com runners padrão gratuitos, e acionamento manual disponível. O comando continua executável na máquina do mantenedor.
- Processar os arquivos grandes em fluxo, particionar os jobs e descartar os brutos após processamento. Persistir agregados e estado incremental em assets de Releases, com arquivos menores que 2 GiB; o cache temporário do Actions não é a única cópia do estado.
- Não manter o acervo bruto completo do SI-PNI no CI. A carga inicial pode rodar na máquina do mantenedor.
- Medir duração e pico de disco na implementação, especialmente no SI-PNI: a documentação permite o desenho proposto, mas não comprova seu desempenho. Se uma etapa pesada não couber nos limites gratuitos, ela roda na máquina do mantenedor, preservando o custo zero.
- Considerar na operação que o GitHub pode desativar agendamentos após 60 dias sem atividade; o acionamento manual permanece como alternativa após reativação.

**Falha de validação ou mudança de formato**
- Não publicar a nova versão da fonte que falhou. Preservar sua última versão válida e registrar a falha, com aviso ao mantenedor pelo CI.
- Outras fontes podem atualizar quando independentes. Indicadores e denominadores que precisam ser compatíveis são mantidos juntos; não publicar combinações inconsistentes.
- Corrigir a etapa afetada e repetir a validação antes de substituir os dados publicados.

**Datas e série encerrada**
- O cartão destaca o período dos dados; os detalhes mostram a data da última atualização do dado publicado. Uma tentativa que falhou não renova essa data.
- O `manifest.json` mantém a data de extração por fonte e a versão do pipeline, e deve permitir identificar o período publicado de cada indicador.
- Para citopatológico, mostrar “Série encerrada em 2025 pela mudança no rastreamento”, com a ressalva do DNA-HPV. A série histórica continua disponível, identificada como encerrada.

As fontes sobre limites e gratuidade estão no comentário de verificação acima. Nenhum pipeline foi implementado nem benchmark executado nesta decisão.
