# Validação da navegação resiliente — ticket 38

## Convenção de URL e documentos

`/municipio/<código>-<nome>/` é o documento estático canônico do dashboard selecionado. Busca, clique no mapa e ativação simples de uma linha da lista atualizam esse caminho com History API; recarga, compartilhamento e abertura em outra aba recebem o mesmo município no HTML. Não há redirecionamento JavaScript nem nova regra de redirect na hospedagem. A inicial `/` permanece sem seleção. `?municipio=<código>` é compatibilidade aprimorada de links antigos: com JavaScript, resolve para o caminho municipal por `replaceState`; nunca é apresentado como substituto da seleção estática sem JavaScript. O caminho municipal prevalece sobre uma query conflitante; códigos desconhecidos são removidos.

Indicador, Tipo e modo mantêm os parâmetros existentes e suas correções campo a campo. `visualizacao=lista` seleciona a alternativa textual; ausência ou valor inválido mostra Mapa, omitindo o parâmetro. Tema continua em `theme=light|dark`, sem persistência. A seleção e filtros são preservados ao alternar a visualização. Âncoras municipais antigas continuam acessíveis, inclusive os seis Tipos nativos já presentes no HTML e as seções da Metodologia. O índice tem destino próprio na inicial, sem herdar `municipio`, para permanecer correto ao recarregar ou compartilhar.

Mapa e lista ocupam a mesma área; ambos mantêm sua instância e o filtro por UF ao alternar. O índice nacional fica numa expansão nativa somente na inicial, com link nos documentos municipais. A âncora do índice está dentro da expansão: acessá-la abre o conteúdo nativamente. Sem JavaScript, “Explorar em lista” leva a esse índice, cujos links alcançam documentos com os quatro Eixos, indicadores, Ações, ressalvas, fontes e seis Tipos no HTML.

## Reuso e resiliência

Reutilizados `MapExperience`, `MunicipalityProfile`, cartões, renderizador da tabela, busca, cache de perfis e carregamento cartográfico opcional. Não há novas fórmulas, classes ou conteúdo clínico, nem mudanças de pipeline/JSON. A lista mantém valores, classes textuais, períodos, origens, notas, qualidade e elegibilidade existentes. A troca para Lista anuncia o contexto por foco em seu título; os botões Mapa/Lista têm `aria-pressed`. Busca, seleção e carregamento mantêm regiões de status e tentativas independentes da malha/WebGL. Foco retorna a um controle conectado/visível após recolher ou limpar a consulta.

A resolução da seleção por caminho/URL é compartilhada pela entrada e restauração do histórico. Resultados atrasados continuam invalidados por geração de requisição. O destaque do mapa recebe a seleção atual mesmo quando o renderizador termina de carregar depois da consulta.

## Verificações

- `npm run check --prefix site`: 44 arquivos, zero erros, avisos e hints.
- `npm run test --prefix site`: 40 testes passaram; o hook inclui build integral dos 5.573 documentos. Duração da suíte final: 18,46 s. Build isolado medido com `/usr/bin/time -p`: 21,84 s na primeira execução; 26,40 s numa execução posterior sob carga.
- `SITE_URL=http://127.0.0.1:4322 node --test --test-isolation=none site/browser-tests/*.test.mjs`: **34 testes passaram**, zero falhas, 138,05 s, contra `astro preview` da saída final. Captura da lista em tema escuro conferida visualmente (`/tmp/ticket38-list.png`, artefato local).
- TDD nas interfaces confirmadas pelo responsável: preservação de visualização nos links, restauração por documento municipal e destino estático do índice falharam antes das respectivas mudanças. O navegador também confirmou a falha inicial da alternância e a correção.
- Regressão de âncoras: `popstate` pode preceder `hashchange`; restauração agora respeita o Tipo da âncora antes de reescrever a URL.
- Cenários de navegador: WebGL indisponível, malha pendente, falhas de lista/camada/perfil e novas tentativas, seleção por teclado, filtros, seis Tipos, Mapa/Lista, Voltar/Avançar, respostas atrasadas, URL inválida e compatibilidade de links antigos, recarga sem JavaScript e índice compartilhável.
- Matriz das alternativas e da consulta: claro/escuro, 320/768/1280 px, JavaScript ativo/desativado, zoom CSS e zoom nativo de 200% pela extensão de teste. Rolagem horizontal restrita à tabela. Classes e origem permanecem legíveis em texto.

## Standards

Revisão independente pela skill `code-review`, base `5b53cab`. Nenhuma violação documentada; uma sugestão heurística de duplicação na resolução de seleção foi corrigida com `municipalityFromUrl`. Reexame: nenhum achado restante.

## Spec

Revisão independente na mesma base encontrou um destino incorreto do índice: a seleção herdada fazia a canonicalização apontar para documento sem índice. Corrigidos o transporte do parâmetro e a posição da âncora na expansão, com regressões de URL e navegador. Reexame: nenhum achado acionável restante.

Revisão final: zero achados em Standards; zero em Spec.

## Custos e limites

Medição local de arquivos e estimativas gzip, sem alegar compressão HTTP configurada na hospedagem. Não há duplicação física de malha/JSON por município; shell e estilos/scripts são compartilhados, e os dados continuam sob `dados/`. O HTML municipal continua contendo os seis Tipos para leitura sem JavaScript; o índice nacional não é repetido nesses documentos.

Saída final: **5.626 arquivos, 765.046.511 bytes**, incluindo 5.571 documentos municipais, inicial e Metodologia. Acréscimo de 1.245.020 bytes sobre a medição do ticket 37. Contagem por `Path.rglob`, soma de `stat().st_size`; gzip com `gzip.compress` do Python.

| Recurso | Bytes | Bytes gzip estimados |
| --- | ---: | ---: |
| Inicial | 668.831 | 88.384 |
| Documento de Recife | 143.227 | 18.138 |
| Perfil da UF PE | 1.637.016 | 161.053 |
| Primeira visita inicial: HTML, todos os assets compartilhados, lista, camada padrão e malha | 6.119.249 | 1.388.885 |

A estimativa da primeira visita inclui cada asset emitido uma vez (JS, CSS e worker) e os quatro arquivos de entrada; não é captura de transferência HTTP nem inclui cabeçalhos. Excede nominalmente a meta aproximada de 1,3 MB. Selecionar Recife a partir da inicial acrescenta cerca de 179 KB gzip estimados (HTML + perfil PE); entrada direta reutiliza o HTML municipal já recebido e, com JavaScript, ainda carrega o JSON da UF. Uma visita com JavaScript desativado recebe HTML e CSS, sem malha/JSON. Hospedagem deve servir os `index.html` dos caminhos municipais diretamente; a prévia estática local verifica esse comportamento sem redirect ou servidor de aplicação.

O orçamento segue excedido e sem aprovação. A auditoria global, leitor de tela, contraste medido, dispositivo tátil real e revisão clínica permanecem nos requisitos de lançamento. Não houve publicação nem acesso a configuração de um provedor de hospedagem remoto; a verificação de hospedagem se limita aos arquivos gerados e à prévia estática local.
