# Inventário do `.scratch`

Conferido em 06/11/2026, no commit `73066c1`. Cobre os 154 arquivos versionados de `mapa-cancer-br`, `mvp-implementacao`, `ui-polimento` e `ui-ux-v1`. Todos foram lidos, com as seções `## Comments`, os scripts, as tabelas, os JSON e as seis capturas. Um script conferiu que cada arquivo aparece em uma única linha da seção 1.

**Para conferir antes de apagar:** a seção 1 diz o destino de cada arquivo. As seções 2 a 5 dizem o que os tickets 04 e 05 precisam levar. A seção 6 lista as referências para o ticket 10. A seção 7 traz o que a tag não preserva e os pontos que dependem de você.

**"Só na tag"** significa ficar apenas em `archive/scratch`, que ainda não existe. Os nomes em `docs/data/` são propostas para o ticket 05.

**Como ler as referências:**

- **"Ticket N" nas colunas de origem e "pesquisa N":** esforço `mapa-cancer-br`. **"impl N":** `mvp-implementacao`. **"polimento N":** `ui-polimento`. **"UI N":** `ui-ux-v1`.
- **"Ticket N" nas colunas "Corrigir em" e "Ação", e fora das tabelas de origem:** este esforço, `documentacao`.
- **"Spec §N":** a spec do MVP, futura `docs/spec.md`. **"Seis da spec":** a spec deste esforço.
- **ADRs por nome:** a numeração está na seção 5.

## Respostas do responsável (06/11/2026)

| Pergunta | Resposta | Efeito |
|---|---|---|
| ADRs além dos seis da spec | Licenças, Cascata territorial, Redistribuição do C55 e Links municipais estáticos | O ticket 04 cria dez ADRs (seção 5) |
| O ticket 46 (celular real) aconteceu? | "Aconteceu, sem problemas" | Vale como declaração. Modelo, sistema e navegador seguem sem registro |
| Taxa de mortalidade em destaque no painel | Manter a taxa e ajustar o texto | A spec §11.2 e o `GLOSSARY.md` passam a descrever o que o site faz |
| Textos "a aprovar" e decisões "a confirmar" | Quarta dívida na §17 | A lista D41 vai para a §17. Os textos atuais continuam valendo |

## 1. Destino de cada arquivo

### `mapa-cancer-br`

| Arquivo ou grupo | Destino | Motivo |
|---|---|---|
| `spec-mvp.md` | `docs/spec.md` | É a spec viva, com a numeração atual e as correções da seção 3 |
| `map.md` | Só na tag | Índice das decisões, repetido na spec e nos tickets. O resumo da decisão 27 está superado (V4) |
| `issues/01-dados-disponiveis-por-eixo.md`, `issues/02-solucoes-existentes.md` | Só na tag | A conclusão já está na spec §1 e §4 |
| `issues/03-hospedagem-e-mapa-estatico.md` | ADR 1 | Traz as alternativas da hospedagem e do mapa |
| `issues/04-indicadores-do-mvp.md` | Spec §3 e §5 | Falta levar o porquê de cada item adiado para a v2 |
| `issues/05-go-no-go-e-posicionamento.md` | Spec §1 | Critério de ter Ação para cada indicador e condição que reabriria o go |
| `issues/06-experiencia-meu-municipio.md` | Spec §11.1 | Só o motivo de a Tendência ser o padrão. A ficha separada está superada (V8) |
| `issues/07-stack-e-pipeline.md` | ADR 1, spec §13 a §15 | Contrato e JSON commitados |
| `issues/08-recorte-do-mvp.md` | Spec §3 | Motivo de cobrir o Brasil inteiro e de o Eixo vazio virar conteúdo |
| `issues/09-medir-completude-por-uf.md`, `issues/10-medir-completude-outros-tipos.md` | Spec §3, `docs/data/quality-by-state.md` | Estadiamento e estômago fora, "Todos" sem C76–C80 |
| `issues/11-metodos-tendencia-e-pequenos-numeros.md`, `issues/12-tendencia-e-municipios-pequenos.md`, `issues/25-escala-da-faixa-estavel.md` | ADR 2, ADR Cascata, spec §7 e §8 | Trazem as alternativas e a regra vigente. Os modelos do ticket 12 estão superados pelo 25 |
| `issues/13-denominador-populacional.md` | ADR 5, `docs/data-sources.md` | |
| `issues/14-metas-oficiais.md`, `issues/18-referencia-de-cada-indicador.md` | Spec §9 | Justificativa de cada Referência, das faixas fixas e das exceções |
| `issues/15-metodos-mortalidade.md`, `issues/19-metodo-e-ressalvas.md` | ADR C55, spec §6.2, §6.3 e §12 | Os textos aprovados já estão no site |
| `issues/16-direitos-e-orientacoes-sus.md`, `issues/20-conteudo-das-acoes.md` | Spec §10 | Regras editoriais. Ver também a pesquisa 16 abaixo |
| `issues/17-calendario-das-fontes.md` | `docs/data-sources.md` | Calendário. A parte de CI vai só como contexto do ADR 6 |
| `issues/21-atualizacao-dos-dados.md` | ADR 6, spec §16 | O agendamento foi substituído (V3). As regras de falha e de datas continuam valendo |
| `issues/22-nome-dominio-licenca.md`, `issues/24-licenca-do-codigo.md` | ADR Licenças, spec §2 | O motivo da AGPL e o custo de não ter CLA estão só aqui |
| `issues/23-consolidar-spec.md` | Só na tag | Registro de processo |
| `issues/26-estado-inicial-do-mapa.md` | Spec §11.1 | Motivo do estado inicial. O formato da URL está superado (V9) |
| `issues/27-quebra-de-serie-do-painel.md`, `issues/28-queda-das-cirurgias-em-2024.md` | ADR 3, `docs/data/painel-series-breaks.md` | Causa, alternativas descartadas e custos aceitos |
| `issues/29-aviso-em-construcao.md` | Spec §2 | Motivo do texto e da faixa sem botão de fechar |
| `issues/30-fonte-oficial-coortes-hpv.md` | ADR 4 | Decisão e evidência de Recife/2025 |
| `research/01-dados-disponiveis-por-eixo.md` | `docs/data-sources.md` | Endereços, formatos, licenças e limitações por Fonte |
| `research/02-solucoes-existentes.md` | Só na tag | Retrato de novembro de 2026, que envelhece. A conclusão está na spec §1 |
| `research/03-hospedagem-e-mapa-estatico.md` | ADR 1, `docs/data-sources.md` | Alternativas no ADR. Comando do mapshaper, malha e 2 lagoas nas fontes |
| `research/09-medir-completude-por-uf.md`, `research/09-tabela-uf.csv`, `research/10-medir-completude-outros-tipos.md`, `research/10-tabela-uf-sim.csv`, `research/10-tabela-uf-tipo-painel.csv` | `docs/data/quality-by-state.md` | Evidência do recorte, com números copiados |
| `research/09-scripts/*`, `research/10-scripts/*`, `research/15-scripts/*`, `research/27-scripts/*`, `research/28-scripts/*` | Só na tag | Exploratórios: dependem de pickles e Parquets locais, e o pipeline já faz a conta vigente |
| `research/11-metodos-tendencia-e-pequenos-numeros.md` | ADR 2, ADR Cascata | Métodos descartados e a tabela de margem da variação anual. O resto fica na tag |
| `research/13-denominador-populacional.md` | `docs/data-sources.md`, ADR 5 | Colunas, armadilhas do arquivo e por que o Censo não equivale ao POPSVS |
| `research/14-metas-oficiais.md` | `docs/data-sources.md`, spec §9 | Documento de cada Referência, com os valores lidos em gráfico marcados como tal |
| `research/15-metodos-mortalidade.md` | `docs/data/sim-atlas-check.md`, ADR C55 | `pipeline/references/sim-atlas.json` cita essa conferência |
| `research/16-direitos-e-orientacoes-sus.md` | `docs/data/action-sources.md` | Serve à revisão clínica pendente: fatos, fontes, datas e o que não foi confirmado |
| `research/17-calendario-das-fontes.md` | `docs/data-sources.md`, ADR 6 | Ritmo, tamanhos e estabilidade. Os limites de CI só como contexto |
| `research/18-hpv-official-inputs.md` | `docs/data/hpv-official-inputs.md` | Necessário para repetir a auditoria: NT 16, consulta ao TabNet e limites do dicionário |
| `research/27-quebra-de-serie-do-painel.md`, `research/28-queda-das-cirurgias-em-2024.md` | `docs/data/painel-series-breaks.md`, ADR 3 | Sustentam o recorte de quimio e radio |

### `mvp-implementacao`

| Arquivo ou grupo | Destino | Motivo |
|---|---|---|
| `issues/01-esqueleto-do-monorepo.md`, `issues/11-busca-e-navegacao.md`, `issues/21-eixos-sem-indicador.md`, `issues/24-metodologia-consolidada.md`, `issues/28-aviso-em-construcao.md`, `issues/39-metodologia-no-console-horizontal.md` | Só na tag | Registro de entrega, com resultado já no código e em `docs/data/methodology-links.md` |
| `issues/02-tracer-malha-ate-o-mapa.md`, `issues/03-publicacao-cloudflare-pages.md`, `issues/04-60-dias-todos-em-tendencia.md`, `issues/05-cascata-regiao-imediata.md`, `issues/06-faixa-de-qualidade-abc.md`, `issues/07-seletor-de-tipo-de-cancer.md`, `issues/08-situacao-como-esta-hoje.md`, `issues/09-estado-na-url.md`, `issues/10-ficha-meu-municipio.md`, `issues/12-onde-se-tratar.md`, `issues/13-denominador-popsvs.md`, `issues/14-mamografia.md`, `issues/15-citopatologico.md`, `issues/16-tendencia-da-mortalidade.md`, `issues/17-redistribuicao-c55.md`, `issues/19-tabagismo-na-capital.md`, `issues/20-casos-novos-estimados.md`, `issues/22-dados-abertos-na-release.md`, `issues/27-tendencia-60-dias-quimio-radio.md`, `issues/29-valor-60-dias-quimio-radio.md` | Só na tag, depois da seção 2 | Os comentários têm decisões e resultados que não estão na spec. Cada um tem destino na seção 2 ou 4 |
| `issues/18-cobertura-hpv.md` | ADR 4, `docs/data/hpv-official-inputs.md` | Motivo da troca de fonte. O passo a passo de retomada fica na tag |
| `issues/23-atualizacao-agendada.md` | ADR 6, `docs/data-update.md` | É a decisão que substitui o Actions |
| `issues/25-auditoria-de-acessibilidade.md` | `docs/validation/accessibility-audit.md`, spec §17 | Decisões e pendência humana |
| `issues/26-revisao-clinica-das-acoes.md` | Spec §17 | Dívida aberta, apesar do status (V16) |
| `issues/30-temas-e-navegacao-compartilhados.md`, `issues/31-mapa-imersivo-com-previa-municipal.md`, `issues/32-busca-e-tabela-independentes-do-mapa.md`, `issues/33-meu-municipio-sem-javascript.md`, `issues/34-metodologia-no-padrao-visual.md`, `issues/36-console-horizontal-e-sistema-visual.md`, `issues/37-consulta-municipal-integrada.md` | Só na tag | Composição superada por entregas posteriores. Os requisitos vigentes vão para `docs/ui-contract.md` |
| `issues/35-prototipo-dashboard-de-observabilidade.md` | Spec §11 | Só a aprovação do Console horizontal e o que ela substitui |
| `issues/38-navegacao-resiliente-e-links-municipais.md` | ADR Links municipais, `docs/ui-contract.md` | Convenção final de URL e índice por UF |
| `issues/40-fundamentos-visuais-do-polimento.md`, `issues/41-mapa-inicial-em-tela-cheia-no-desktop.md`, `issues/42-primeira-tela-no-celular.md`, `issues/43-painel-com-resultado-primeiro.md`, `issues/44-lista-com-linhas-que-abrem.md`, `issues/45-ufs-e-metodologia-no-novo-sistema.md` | `docs/ui-contract.md`, spec §17 | Como cada pendência ficou, limites conhecidos e o que falta confirmar |
| `issues/46-verificacao-final-em-celular-real.md` | Só na tag | Sem registro no ticket. Fica a declaração do responsável (V17) |
| `issues/47-reduzir-saida-e-transferencia.md` | Spec §13 e §17 | Dívida com números e direção aceita |
| `scripts/resume-sim.py` | Só na tag | Retomada de uma carga de novembro de 2026, que não se repete |

### `ui-polimento`

| Arquivo ou grupo | Destino | Motivo |
|---|---|---|
| `map.md` | Spec §2 e §11 | Só três orientações: "sóbrio e preciso", aviso sem versão curta e "compatibilidade é layout e toque" |
| `issues/01-referencias-visuais.md` | Só na tag | Hipóteses para os protótipos. A decisão está nos tickets seguintes |
| `issues/02-celular-cabecalho-filtros-mapa.md`, `issues/03-fundamentos-visuais.md`, `issues/04-painel-meu-municipio.md`, `issues/05-desktop-tela-cheia.md`, `issues/06-lista-ufs-metodologia.md` | `docs/ui-contract.md`, com uma seção por decisão | Testes, CSS e scripts os citam como contrato (seção 6) |

### `ui-ux-v1`

| Arquivo ou grupo | Destino | Motivo |
|---|---|---|
| `spec.md` | `docs/ui-contract.md`, spec §11 | Páginas, tema, campos do contrato, exceções e acesso sem JavaScript |
| `map.md`, `redesign-interview.md`, `observability-handoff.md` | Só na tag | Histórico da direção visual. "Futurista" e "acentos luminosos" estão superados |
| `issues/01-paineis-territoriais.md`, `issues/02-observabilidade.md`, `research/01-paineis-territoriais.md`, `research/02-observabilidade.md` | Só na tag | Subsídio para protótipos, sem aprovação visual |
| `issues/03-hierarquia-e-navegacao.md`, `issues/04-direcao-visual.md`, `issues/05-padrao-das-paginas-e-handoff.md` | Só na tag | Marcados como históricos desde o ticket 35. Só o adiamento dos cartões nacionais vai para a spec (D30) |
| `validation-25.md` | `docs/validation/accessibility-audit.md` | Auditoria, limites e roteiro humano |
| `validation-36.md`, `validation-37.md`, `validation-39.md` | Só na tag | Medições parciais, superadas pela auditoria |
| `validation-38.md` | `docs/ui-contract.md` | Só a convenção de URL. As medições ficam na tag |
| `audit-25/axe-summary.json`, `audit-25/contrast.json`, `audit-25/output.json`, `audit-25/test-summary.json`, `audit-25/visit.json` | Só na tag | JSON brutos. O ticket 05 copia só os números para a auditoria |
| `audit-25/screenshots/*` | Só na tag | Capturas amostrais de uma data |

## 2. Decisões encontradas fora da spec e dos tickets de decisão

Cada linha traz o ticket de implementação (`impl`) ou o documento de origem, salvo quando o texto já diz. "Código" indica onde a regra já vive hoje.

### Método e dados

| # | Decisão | Origem | Destino |
|---|---|---|---|
| D1 | 5.571 municípios: Boa Esperança do Norte (MT, 510183), instalado em 2025 | impl 02 | Spec §3, §13 a §15 |
| D2 | A malha é validada contra a lista oficial do IBGE, não contra uma contagem fixa. A simplificação usa 1,5% (0,71 MB gzip) | impl 02 | Spec §14, `data-sources` |
| D3 | Anos provisórios são os 2 mais recentes presentes nos dados | impl 04 | Spec §6.4 |
| D4 | "Até 60 dias" inclui tratamento de 1 a 90 dias antes do diagnóstico, como no TabNet | impl 04, código | Spec §9 |
| D5 | Estável tem precedência: IC dentro de ±1% é estável mesmo excluindo zero | impl 04, `pipeline/trend.py:42` | Spec §7 |
| D6 | O mínimo conta anos sem caso. A região soma todos os municípios, inclusive os com dado próprio | impl 05 | Spec §8 |
| D7 | A origem vale para a camada inteira. Dado insuficiente exporta `value` e `without_treatment_info` nulos, porque a % revelaria a contagem. `origin` tem três valores | impl 05 | Spec §8 e §15 |
| D8 | Classe não calculável aparece como Dado insuficiente. O C55 não calculável é outro caso e não vira insuficiente | impl 05, UI spec | Spec §8 |
| D9 | A faixa soma residência ignorada, como o TabNet. Os cortes valem sem arredondar: 15% exato é A, 35% exato é C | impl 06 | Spec §6.3 |
| D10 | Hachura não cobre Dado insuficiente, e cobre o município com dado da região. O "sem textura" da spec se refere só aos pontos | impl 06 | Spec §11.1 |
| D11 | Campos do contrato: `quality_band`, `quality`, `quality_years`, `has_status`, `value_cases`, `trend_cases`, `status_note`, `adjustment_note`. Não se publica `trend_estimate` | impl 06, 07, 08, 14, 27, 29 | Spec §15 |
| D12 | O corte "perto" do tabagismo é 5,9 ÷ 0,8 exato; 7,4% é o valor arredondado | impl 08 | Spec §9 |
| D13 | CNES: códigos 1704, 1706–1713 e 1715, nomes vindos de `CADGERBR.dbf`, competência comum às 27 UFs. Distância por haversine entre centroides, até 3 CACON/UNACON e 3 radioterapias, sem limite de UF | impl 12 | `data-sources`. O método já está em `/metodologia/` |
| D14 | POPSVS: só o ano imediatamente anterior, e só se faltar o arquivo inteiro. Município ausente é erro. 162 células por município × ano | impl 13 | Spec §6.1, `data-sources` |
| D15 | Mamografia: `CO_IND_CLINICA=02`, ano de competência, sem variantes `_PACNT`. Nota acima de 2, bloqueio fora de 0–10 | impl 14 | `data-sources` |
| D16 | Citopatológico: `CO_ANO_LIBERACAO` como ano, porque o arquivo não tem competência. Sem filtro por motivo ou resultado | impl 15 | `data-sources` |
| D17 | Download FTP em trechos paralelos: 4, e 8 no SISCAN, com EPSV, sem REST 0 e timeout de 30 s. A carga do FTP é lenta e instável | impl 14, 15, 16 | `data-sources` |
| D18 | C55: só registros femininos, idade ignorada em célula separada. A Tendência só é bloqueada se a falha cair na janela. O contexto nacional fica sem classe | impl 17 | Spec §6.2 |
| D19 | HPV: Boa Esperança do Norte usa a região, sem população inventada. Sem referências oficiais ou com divergência acima de `tolerance_pp`, não há exportação. Essa tolerância é de 0,01 p.p. em `pipeline/references/hpv.json:8`; 1 p.p. é só o máximo que o código aceita para ela. A Situação usa o último ano completo | impl 18, README, `pipeline/sources/hpv.py:351` | Spec §6.1, `data-sources` |
| D20 | Coortes oficiais obtidas com Chromium na sessão pública do InfoMS: 77.990 linhas, só agregados | `docs/data/hpv-benchmark.md` | `data-sources` |
| D21 | Tabagismo: `pesorake2025`, linearização de Taylor, últimos 10 anos de calendário, 2022 sem preenchimento. Validação de ±3% só no total das capitais | impl 19 | Spec §7 e §14, `data-sources` |
| D22 | Casos estimados: "Todos" exclui pele não melanoma, e Brasília usa os números do DF | impl 20 | Spec §5, `data-sources` |
| D23 | Painel: 1% nos casos e 0,5 p.p. nas porcentagens contra o TabNet. Filtro por modalidade, com tabelas próprias | impl 27, 29, `painel.py:436` | `data-sources` |
| D24 | Vigilância mensal: alerta abaixo de 75% da mediana dos 12 meses anteriores, com mês ausente valendo zero. Hoje dispara 16 alertas, sem bloquear | impl 29, `painel.py:632` | `data-sources`, `data-update` |
| D25 | Atualização manual local, com `update`, snapshot de revisão, grupos dependentes e `hpv-audit` separado | impl 23 | ADR 6, `data-update` |
| D26 | Só a etapa de método do C55 fica na limpeza, por exceção à regra de `compute` | impl 17, spec §14 | `AGENTS.md`, spec §14 |
| D27 | Detalhes clínicos ficam ocultos até haver `reviewer` e versão revisada iguais à atual. Só o texto curto aprovado aparece | impl 14, 21, cartões | Spec §10.4 |
| D28 | Orçamento adiado para depois da V1, com direção aceita de páginas compartilhadas | impl 47 | Spec §13 e §17 |

### Interface e público

| # | Decisão | Origem | Destino |
|---|---|---|---|
| D29 | Equilibrar cidadão e público técnico, sem entradas por perfil. Revê o público do mapa original | UI map | Spec §1 |
| D30 | Sem cartões numéricos nacionais nem médias de municípios no front. Somar a cascata repetiria dados regionais | UI 03, UI research 01 | Spec §3 |
| D31 | "Sóbrio e preciso" no lugar de "futurista". O aviso "Em construção" não recolhe nem encurta e pode ganhar destaque | polimento map | Spec §2 e §11 |
| D32 | Parâmetros de URL no contrato: `tipo=breast`, `modo=hoje`, `visualizacao=lista`, `theme`. `?municipio=` é só compatibilidade. `/municipios/?municipio=<código>` carrega a seleção para o retorno | impl 09, 38, 45 | Spec §11.1, `ui-contract` |
| D33 | Documento canônico em `/municipio/<código>-<nome>/`, sem redirect por JavaScript. Índice só em `/municipios/`, com item na navegação principal | impl 38 | ADR Links municipais, spec §11.1 |
| D34 | Modo flutuante só com pelo menos 520 px de altura e 300 px de largura. Fora disso, página comum com controles fora do mapa | impl 42, 43 | `ui-contract` |
| D35 | Com o indicador de mortalidade, o painel mostra a taxa em destaque, ao lado da classe. Confirmado pelo responsável | impl 43 | Spec §11.2, `GLOSSARY.md` |
| D36 | Foco: a busca leva ao nome do município, o toque no mapa não move o foco, recolher fica no controle e limpar volta à busca. Substitui o critério inicial da auditoria | polimento 04, impl 43, `validation-25` | `ui-contract`, auditoria |
| D37 | Lista estreita: origem regional e % sem informação só na linha aberta, por exceção da Lista. Faixa C com Dado insuficiente fica sem a marca na linha fechada | polimento 06, impl 44 | `ui-contract` |
| D38 | Aviso com altura mínima de 43 px a partir de 768 px. Filtros em `popover="manual"`. O controle de tema some sem JavaScript | impl 40, 41, 42 | `ui-contract` |
| D39 | Inter em subconjunto próprio, com `≥`, `tnum` só nos algarismos e `OFL.txt` publicado | impl 40 | `ui-contract`, spec §2 |
| D40 | Limites aceitos: texto de gráfico com 6,5 px a 320 px, aviso com 47% da altura em 320 px com zoom, 5.571 links e botões na ordem de tabulação sem filtro de UF. Distância de cor: piso de 6 nos pares com textura (`site/scripts/map-tones.mjs:12`). No tema claro, "Longe" contra "Dado insuficiente" fica em 7,2 a 7,5, par que a decisão não listou | impl 40, 44 | `ui-contract` |

### Aprovações em aberto

| # | Item | Origem | Destino |
|---|---|---|---|
| D41 | Textos propostos e não aprovados: legenda, tooltip e tabela (impl 04, 05, 06, 27), ressalva da próstata (impl 07), nota do 60 dias (spec §11.2). Decisões a confirmar: impl 41 (altura do aviso, textos novos), 42 (popover, busca sem script, "Abrir consulta" fora abaixo de 768 px, menu), 43 (C55 sem pontos, "Sem dado neste recorte", ressalva sobre o mapa no celular, tabagismo e casos nos títulos, toque no mapa sem mover o foco), 44 (HPV sob "Tendência", unidade da mortalidade, linhas abertas, Faixa C com Dado insuficiente), 45 (seleção por UF, fechar o índice, linha do sumário) | Tickets citados | Spec §17, como quarta dívida |

## 3. Divergências e o que vale hoje

| # | Divergência | Onde | Vale hoje | Corrigir em |
|---|---|---|---|---|
| V1 | 5.570 municípios | Spec §3, §13, §14, §15, impl 02, 04, 10, 16 | 5.571, como malha, JSON e README | Ticket 04 |
| V2 | Cloudflare Pages e `*.pages.dev` | Spec §2, §13, tickets 03, 07, 22 | Cloudflare Workers, em `workers.dev` | Ticket 04 |
| V3 | Actions agendado e medição em CI | Spec §14, §16, §17, tickets 17, 21, `docs/data/hpv-benchmark.md:21,27,85,114`, `metodologia.astro:251` | Atualização manual, sem workflow de dados | Tickets 03 e 04 |
| V4 | Valor e Situação do 60 dias sobre todos os casos | `map.md` (decisão 27), ticket 27 itens 2 e 3, impl 27 | Quimio e radio (ticket 28). A % sem informação e a faixa seguem sobre todos os casos | Ticket 04 |
| V5 | Modelo logístico no 60 dias | Tickets 11, 12 | Quasi-Poisson com offset, ticket 25 | Ticket 04 |
| V6 | Referência da mortalidade é o valor do Brasil | Tickets 04, 14, pesquisa 14, `GLOSSARY.md:21` | Sem Referência (ticket 18). Nenhum indicador usa o "valor do Brasil" | Ticket 04, avaliar o glossário |
| V7 | Tendência com 3 classes | Tickets 04, 06 | 4 classes mais Dado insuficiente | Só na tag |
| V8 | Prévia e ficha em tela separada | Tickets 06, 07, impl 10, 11, 31, 33, UI 03 a 05 | Consulta integrada no Console horizontal | Ticket 04 |
| V9 | URL `?indicador=mamografia&tipo=mama` | Ticket 26 | Identificadores do contrato, em inglês (D32) | Ticket 04 |
| V10 | "Convenção será registrada no ticket 38" | Spec §11.1, UI spec | Já decidida (D33) | Ticket 04 |
| V11 | Índice por UF na inicial | Impl 32, 38 (primeira versão), `validation-38` | `/municipios/`, na navegação principal | Ticket 05 |
| V12 | Fonte do HPV é "SI-PNI novo" e "ao menos uma dose reconstruída" | Spec §5, tickets 04, 18, impl 18 | Agregados oficiais, decisão 30. A spec §4 já diz isso | Ticket 04 |
| V13 | `audit_last_month` e 81 ZIPs no manifesto | `site/public/dados/` | Metadado antigo: nenhum valor muda | Ticket 11 |
| V14 | Impl 18 diz "não resolver o ticket", mas está `resolved` com a caixa de medição marcada | Impl 18, `31378f8` | A medição anual deixou de ser requisito (impl 23). **Não há medição do job anual** | Ticket 05 |
| V15 | Impl 25 `resolved` com duas caixas abertas. Impl 44 marca "sessão registrada", mas o comentário diz que falta | Impl 25, 44, `31378f8` | Sessão com leitor de tela **não tem registro**. É dívida da §17 | Tickets 04 e 05 |
| V16 | Impl 26 `resolved` com todas as caixas marcadas | Impl 26, `31378f8`, `site/src/content/actions.ts` | `reviewer: null` em todas as Ações: revisão **pendente**, e os detalhes clínicos seguem ocultos | Ticket 04 |
| V17 | Impl 46 `resolved`, sem nenhum comentário | Impl 46, `31378f8` | O responsável declarou que aconteceu, sem problemas. Não há aparelho nem navegador registrados | Ticket 05, nos limites |
| V18 | "Bloquear lançamento até reduzir" | Impl 25, `validation-25`, impl 47 (primeiro comentário), `site/browser-tests/README.md:128` | Dívida conhecida, sem bloquear por orçamento (impl 47) | Tickets 04, 05 e 10 |
| V19 | Próstata: "é conduta correta" contra "pode ser" | Spec §6.3, `site/src/map/indicator-layer.ts:295` | O texto do site, ainda a aprovar | Spec §17 |
| V20 | Tooltip: "dado da região de X" | Ticket 12 | "Seu município e vizinhos — região de X" | Só na tag |
| V21 | Mortalidade "só como Tendência" contra taxa em destaque | `GLOSSARY.md:9`, spec §11.2, impl 43 | A taxa aparece, sem contagem de óbitos (D35) | Ticket 04 |
| V22 | Faixa A até 15%: os scripts usam "< 15" | Pesquisas 09, 10 | "Até 15%" inclusive, como `pipeline/sources/painel.py` | Ticket 05, ao copiar as tabelas |
| V23 | C26 pesa 10% ou 5–6% dos óbitos digestivos | Pesquisa 10 (só colorretal e estômago no denominador), pesquisa 15 (C15–C26) | 5–6%, conforme a pesquisa 15 | Ticket 05 |
| V24 | "Toda a estatística mora em `compute`" | `AGENTS.md:7`, contra spec §14 e impl 17 | C55 na limpeza é exceção declarada (D26) | Ticket 10 |
| V25 | "Vale o ticket" em divergência | `AGENTS.md:3`, contra a spec deste esforço | Hoje ainda vale o ticket, porque não há ADR. Passa a valer o ADR mais recente quando os ADRs existirem | Ticket 10 |
| V26 | "Compara com números oficiais" em toda `source` | Spec §14 | SISCAN só tem faixa plausível e presença dos municípios. Tabagismo só confere o total das capitais | Ticket 04 |
| V27 | "CI verifica tipos, testes e build" | `README.md:211`, contra `.github/workflows/ci.yml` | No site, o CI roda `check`, `build` e `test:a11y`, sem `npm test` nem `test:browser` | Ticket 06 |
| V28 | Aviso em azul-claro | Impl 28 | Faixa invertida, polimento 03 | `ui-contract` |
| V29 | HPV sem dado publicado | Impl 36, 37, 43, 44, UI handoff | Publicado desde `6d2f0a7` | Só na tag |
| V30 | Requisitos antes de publicar | Spec §17 | Cumpridos: LICENSE, C55, links conferidos. Obsoleto: SI-PNI no CI. Abertos: revisão clínica e reconferência das fontes das Ações | Ticket 04 |
| V31 | Release "disponível depois da primeira publicação" e Release `hpv-state` | `README.md:249-255` | Existe só `data-2026-11-05`, sem `state-*` | Tickets 08 e 11 |

## 4. Evidências que sustentam o método

| Evidência | O que sustenta | Origem | Destino | Cuidado ao copiar |
|---|---|---|---|---|
| Tabelas por UF | Recorte de 5 tipos, "Todos" sem C76–C80, estadiamento e estômago fora | Pesquisas 09 e 10, com os CSV | `docs/data/quality-by-state.md` | Janela 2019–2023 e faixas históricas. As faixas vigentes são por UF × tipo em 2020–2024, nos JSON |
| Quebras de maio de 2018 e 2019 | Recorte de quimio e radio na Tendência | Pesquisa 27 §1 a §3, impl 27 | `docs/data/painel-series-breaks.md` | Tabela das sete alternativas, com Brasil de −3,7% para −1,3% ao ano. Extração de 17/10/2026 |
| Queda das cirurgias em 2024 | Recorte de quimio e radio no valor e na Situação | Pesquisa 28, impl 29 | `docs/data/painel-series-breaks.md` | A causa é **hipótese, sem confirmação oficial**. Inclui 581 de 909 hospitais, SIH 177 mil → 196 mil → 214 mil, 4 de 162 células e 76.383 / 186.368 = 41,0% |
| Conferência do Painel com o TabNet | Validação do valor e das contagens | Impl 04, 27, 29 | `data-sources` | Exata nas 351 combinações UF × ano |
| Conferência do SIM com o Atlas | Padronização Segi/Doll com 80+, tolerância de ±3% | Pesquisa 15 §1.3, impl 16, `pipeline/references/sim-atlas.json` | `docs/data/sim-atlas-check.md` | Contagens exatas em 5 áreas, taxas de 2022. O Atlas não publica nota de método |
| Validação do C55 | Redistribuição no colo do útero | Impl 17, `pipeline/references/sim-c55-validation.json`, pesquisa 15 §2 | `docs/data/c55-validation.md` | 64.304 células, 36 fallbacks e 5 células não calculáveis. **O efeito sobre a classe da Tendência não está comprovado**: 2,9% contra 1,8% ao ano vale só para contagens nacionais |
| Coortes do HPV | Agregados oficiais, sem reconstrução | Decisão 30, impl 18, `pipeline/references/hpv.json`, pesquisa 18 | ADR 4, `docs/data/hpv-official-inputs.md` | Recife/2025: 88,6%, 94,9% e 82,7%, e denominadores iguais (52.868 e 55.555). Nove referências de 2025 |
| Medições da auditoria HPV | Atualização sem microdados | `docs/data/hpv-benchmark.md` | Já está em `docs/` | Medem etapas locais, **nunca o job inteiro** |
| Denominador POPSVS | Validação contra o TabNet atual | Pesquisa 13 | `data-sources`, ADR 5 | Superestimativa antiga de 5,8%. Totais por ano e Recife como conferência |
| Margem da variação anual | Mínimo de 20 por ano e cascata | Pesquisa 11 §1.5 | ADR 2, ADR Cascata | Conta aproximada do projeto, sem sobredispersão |
| Distribuição da cascata | Efeito do mínimo no mapa | Pesquisa 27 §5, impl 05 | ADR Cascata | 1.225, 4.273 e 73 no 60 dias × Todos, extração de 17/10/2026 |
| Resultados do SISCAN | Plausibilidade das razões | Impl 14, 15 | `docs/data/` ou `data-sources` | Contagens anuais e Recife/2025 (47.146 ÷ 480.781 × 3). **Sem comparação com o TabNet** |
| Tamanho e hospedagem | Site estático e orçamento | Pesquisa 03, `validation-25`, `audit-25/output.json`, `audit-25/visit.json` | ADR 1, auditoria | Estimativa de 1,3 MB e 30 MB é de antes da página por município. Medição real: 999.530.479 e 1.369.414 bytes |
| Acessibilidade | Requisito de lançamento | `validation-25`, `audit-25/` | Auditoria | Axe 4.14 sem violação em 24 cenários, mas com inconclusivos: 3.498 nós de contraste e 48 de nome acessível. 316 testes de navegador. **Sem sessão com leitor de tela** |

A reprodução dos níveis 1 e 2 está registrada em [01-provar-a-reproducao.md](issues/01-provar-a-reproducao.md), deste esforço.

## 5. ADRs

O ticket 04 cria os seis da spec e os quatro aprovados em 06/11/2026.

| ADR | Material de contexto e alternativas |
|---|---|
| 1. Site estático com JSON commitados, sem backend | Tickets 03 e 07, pesquisa 03. Descartados: DuckDB-WASM (35,7 MB) e PMTiles |
| 2. Tendência em variação relativa, com faixa de ±1% | Tickets 11, 12 e 25, pesquisa 11. Descartados: Joinpoint, Prais-Winsten e pontos percentuais |
| 3. Valor, Situação e Tendência do 60 dias só com quimio e radio | Tickets 27 e 28, pesquisas 27 e 28. Ver V4: o 27 sozinho está superado |
| 4. HPV com agregados oficiais | Decisão 30, impl 18, pesquisa 18 |
| 5. POPSVS revisto e Censo 2022 fixo no HPV | Tickets 13 e 18, pesquisa 13 |
| 6. Atualização manual local | Impl 23, ticket 21, pesquisa 17, tentativa bloqueada por billing em `docs/data/hpv-benchmark.md` |
| 7. Licenças: AGPL-3.0-or-later, CC BY-SA 4.0, sem CLA | Tickets 22 e 24. Sem CLA, relicenciar exige a concordância dos contribuidores |
| 8. Cascata territorial | Tickets 11 e 12, pesquisa 11. Descartados: supressão, suavização bayesiana e subir para a UF |
| 9. Redistribuição do C55 só no colo do útero | Tickets 15 e 19, pesquisa 15, impl 17. Diverge do INCA de propósito. C26 e R00–R99 ficam sem redistribuição |
| 10. Links municipais estáticos | Impl 38, UI handoff. Fixa as URLs públicas e pesa na saída (893.552.632 bytes em documentos municipais) |

Considerados, sem virar ADR: Cloudflare Workers (imposto pelo provedor, vai para a spec), Console horizontal (reversível), faixas fixas de Situação (cabem na spec §9).

## 6. Referências ao `.scratch` fora dele, para o ticket 10

Linhas no commit `73066c1`. O ticket 10 refaz a busca com `git grep` antes de editar.

### Caminho explícito

| Arquivo e linha | Referência | Ação |
|---|---|---|
| `AGENTS.md:3` | Spec do MVP (2 ocorrências), e tickets de decisão e implementação | Apontar para `docs/spec.md` e os guias |
| `README.md:71` | Pesquisa 13 | `docs/data-sources.md`. Pode já sair no ticket 09 |
| `docs/data/hpv-benchmark.md:52` | Pesquisas 17 e 18 | `docs/data-sources.md` e `docs/data/hpv-official-inputs.md` |
| `docs/data/hpv-benchmark.md:95` | Decisão 30 | ADR 4 |
| `pipeline/references/sim-atlas.json:3` | Pesquisa 15 | `docs/data/sim-atlas-check.md` |
| `site/browser-tests/README.md:129` | `validation-25` | `docs/validation/accessibility-audit.md`, tirando "bloqueio por orçamento" (V18) |
| `site/browser-tests/desktop-first-screen.test.mjs:6` | Polimento 05 | `docs/ui-contract.md` |
| `site/browser-tests/list.test.mjs:6` | Polimento 06 | `docs/ui-contract.md` |
| `site/browser-tests/municipal-panel.test.mjs:6` | Polimento 04 | `docs/ui-contract.md` |
| `site/browser-tests/phone-first-screen.test.mjs:6` | Polimento 02 | `docs/ui-contract.md` |
| `site/browser-tests/reading-pages.test.mjs:5` | Polimento 06 | `docs/ui-contract.md` |
| `site/browser-tests/visual-foundations.test.mjs:5` | Polimento 03 | `docs/ui-contract.md` |
| `site/scripts/map-tones.mjs:2` | Polimento 03 | `docs/ui-contract.md` |
| `site/src/pages/metodologia.astro:281` | Polimento 06 | `docs/ui-contract.md` |
| `site/src/shared/theme.css:1` | Polimento 03 | `docs/ui-contract.md` |
| `site/src/shared/theme.css:239` | Polimento 02 | `docs/ui-contract.md` |
| `site/tests/map-tones.test.mjs:9` | Polimento 03 | `docs/ui-contract.md` |

### Menção a ticket, sem caminho

| Arquivo e linha | Referência | Ação |
|---|---|---|
| `docs/data/hpv-benchmark.md:1` | Ticket 23 | ADR 6 |
| `docs/data/hpv-benchmark.md:21,114` | Ticket 18 | Reescrever (V3, ticket 03) |
| `docs/data/methodology-links.md:52` | Ticket 18 | Reescrever (V3) |
| `site/browser-tests/README.md:27` | Ticket 25 | Auditoria |
| `site/src/content/actions.ts:96` | "aprovado no ticket 20" | Spec §10. **Não é comentário**, é um valor. Não aparece no HTML: só `WhereToTreat.astro` exibe `verificationNote`, e esta Ação é a do HPV |
| `site/src/profile/panel-result.ts:12` | "decision 04 of the UI polish" | `docs/ui-contract.md` |
| `site/src/layouts/Base.astro:31` | Ticket 29 | Spec §2 |
| `site/tests/municipality.test.mjs:13` | Ticket 14, em mensagem de `skip` que não dispara mais | Reescrever a mensagem. **Não é comentário**, é uma string do teste |
| `site/browser-tests/integrated-profile.test.mjs:106` | `/tmp/ticket37-*` | Só nome de captura. Renomear é opcional |
| `site/browser-tests/map-alternatives.test.mjs:226` | `/tmp/ticket38-list.png` | Só nome de captura. Renomear é opcional |

A spec diz que "no código só mudam comentários", e o ticket 10 pede para trocar as menções em "código e dados". As duas linhas marcadas acima são as únicas exceções: nenhuma muda o build nem o resultado de teste, mas precisam de aval no ticket 10.

### Podem ficar

- **Convenção do tracker:** `AGENTS.md:20` e `docs/agents/issue-tracker.md:3,7,8,9,15,25,26,28`, pela regra 2. A linha 8 cita `spec-mvp.md` como exemplo: tirar o exemplo, que nomeia um arquivo de esforço.
- **Fora da busca pelo ticket 10:** `.agents/skills/` (`ask-matt`, `code-review`, `setup-matt-pocock-skills`, `to-tickets`), que traz só a convenção. `.claude/skills/` são links para essa pasta.
- **"spec, section N":** ficam como estão, 46 linhas em `pipeline/` e `site/src/`, e `AGENTS.md:5`.
- **"the desktop decision":** `site/src/layouts/Base.astro:95` não cita arquivo nem número. Pode apontar para a seção do `docs/ui-contract.md`.

## 7. Antes de apagar

**A tag não preserva os protótipos.** Tickets citam branches que `archive/scratch` não inclui:

| Branch | Situação | Citada em |
|---|---|---|
| `prototype/06-meu-municipio`, `prototype/35-observability-dashboard`, `prototype/ui-ux-v1`, `prototype/ui-ux-visual-direction`, `prototype/ui-polimento-celular`, `prototype/ui-polimento-desktop`, `prototype/ui-polimento-fundamentos`, `prototype/ui-polimento-paginas`, `prototype/ui-polimento-painel` | **Só local, sem cópia remota** | Spec §11, tickets 06, 26, impl 35 a 45, polimento, UI |
| `research/ui-polimento`, `research/ui-ux-v1` | No GitHub | Polimento 01, UI map, UI 01 e 02 |
| `agent/hpv-18-benchmark` | Só no GitHub | Impl 18, `docs/data/hpv-benchmark.md:108` |

Decidir se vale enviar as locais ou se elas podem se perder: as decisões não dependem delas. Só as capturas e os protótipos aprovados vivem ali.

**A tag precisa existir antes de apagar**, apontando para um commit que ainda tenha o `.scratch`. É tarefa do responsável.

**Pontos com data:**

- **31/12/2026:** resgate do HPV para 15–19 anos, citado na spec §10.4. O site não menciona esse resgate hoje. Reconferir na revisão clínica.
- **Novembro de 2026:** início do FIT nas UBS, segundo a pesquisa 16. A Ação diz "implantação gradual". Reconferir.
- **01/01/2027:** o nível 2 do HPV deve deixar de recalcular (ticket 11).
- **Dezembro de 2026:** SIM 2025 deve ficar final, pelo padrão de 2023–2025.

**Limites deste inventário:**

- As divergências entre spec e site foram conferidas lendo o código e os JSON. O site não foi aberto no navegador nesta sessão.
- Nas referências, a busca cobre os padrões de `.scratch`, nomes de esforço e menção a ticket. Uma citação em outra forma de escrita pode ter passado, e o ticket 10 confere de novo.
- Um destino "só na tag" é proposta: o ticket 04 ou 05 pode trazer um trecho se a escrita mostrar que falta.
