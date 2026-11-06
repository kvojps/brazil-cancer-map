# Auditoria do ticket 25 — acessibilidade do lançamento

Data: 06/11/2026. Base de implementação: `31ddefb2cd3432fec45e7adbec38a570d7faa36e`. Auditoria local do site estático, sem publicação e sem certificação WCAG ou eMAG.

## Resultado e decisão de lançamento

A automação foi ampliada com axe no CI, relatórios por página e comparação das classes e origens de todas as seleções publicadas do mapa com o contrato JSON. Foram corrigidos nomes repetidos de regiões acessíveis na Metodologia e nos cartões. A sessão real com leitor de tela permanece pendente, por decisão do responsável: **“Deixar pendente para revisão humana”**.

Os orçamentos continuam excedidos. Decisão explícita do responsável: **“Manter metas e bloquear lançamento até reduzir”**. O [ticket 47](../mvp-implementacao/issues/47-reduzir-saida-e-transferencia.md) acompanha essa correção. O aceite desta automação não libera o lançamento nem encerra o ticket 25.

## Escopo e método

- Chromium 156.0.8078.47, Playwright Core 1.64.1 e axe-core 4.14.0; saída de `astro build` servida por `astro preview`, localmente em `http://127.0.0.1:4322`.
- Axe: inicial em Lista com PE, Municípios por UF com PE aberto, Como calculamos, Recife, Alcântara e Araioses; claro/escuro, com e sem JavaScript: 24 análises. Expansões nativas abertas; na consulta aprimorada, os Eixos são exclusivos e só o último permanece aberto. Os documentos sem scripts permitem conferir o conteúdo de todos os Eixos aberto.
- Para o cenário sem JavaScript, o documento carrega com scripts desativados. Apenas durante a análise se habilitam os temporizadores do axe, sem reproduzir os scripts do site; o modo legado mantém a análise nesse documento, sem criar outra página sem temporizadores. Essa instrumentação não equivale a uma sessão humana sem JavaScript.
- `map-state-accessibility.test.mjs`: cada combinação publicada de Indicador × Tipo × modo, nos dois temas, com WebGL indisponível. Compara a classe textual, a origem e o ano de Recife com o JSON publicado; verifica HPV sem Tendência, mortalidade sem Situação e notas do valor. Não é comparação exaustiva dos 5.571 municípios.
- As suítes existentes cobrem busca, seletores, ajuda, mapa/lista, consulta integrada, recolher versus limpar, histórico, links e Metodologia. Incluem 320/768/1280 px, dois temas, JavaScript ativo/desativado, zoom CSS e zoom nativo de 200% por extensão local. Falhas de lista, camada, perfil, WebGL e malha pendente têm testes de recuperação.

## Achados e correções

O axe identificou `landmark-unique` (moderado): duas regiões de tabela da Metodologia se chamavam “Conferência de mortalidade”, e várias seções de Ação apareciam como regiões de mesmo nome. A tabela de pesos agora se chama “População mundial padrão Segi/Doll”. As Ações usam `role="group"`, dentro dos artigos já nomeados por indicador: preservam nome e conteúdo sem multiplicar regiões indistinguíveis.

O teste reproduziu os achados antes da correção. O CI barra violações graves/críticas e a regressão de nomes de regiões; conserva os relatórios completos, inclusive resultados `incomplete`, como artifact `accessibility-results`. A configuração foi testada localmente por comandos equivalentes; não se afirma execução remota de um workflow ainda não enviado.

Há verificações inconclusivas do axe: contraste em controles com gradiente, símbolos e células fora da área visível da tabela; correspondência entre símbolo visível e nome acessível. Não foram contabilizadas como aprovações. Os botões com símbolos possuem nomes textuais, mas a experiência completa continua no roteiro humano abaixo.

### Foco: decisão posterior ao ticket 25

O critério original de manter foco no controle e oferecer atalho foi superado pela [decisão do painel](../ui-polimento/issues/04-painel-meu-municipio.md), implementada no [ticket 43](../mvp-implementacao/issues/43-painel-com-resultado-primeiro.md): depois da busca, foco no nome do município; o atalho foi removido. Clique/toque no mapa não desloca o foco. Recolher mantém a seleção e o foco no controle; limpar retorna o foco à busca ou ao seu botão. A auditoria segue essa decisão, sem restaurar o comportamento anterior.

## Desempenho e investigação

Medições reproduzíveis:

```sh
npm run measure:output --prefix site
CHROMIUM_PATH=/caminho/para/chromium npm run measure:visit --prefix site
```

`measure:output` soma `stat.size` de todos os arquivos de `dist`, sem usar blocos de disco. Também fornece uma estimativa conservadora por gzip local de todos os assets compartilhados, fonte e dados iniciais; inclui assets de outras páginas e não representa uma visita observada.

`measure:visit` usa contexto novo do Chromium a 1280 × 900, sem cache anterior, servidor HTTP local com `Content-Encoding: gzip` e nível 6, mapa inicial pronto, sem seleção; depois busca e seleciona Recife mantendo o cache. Soma os corpos efetivamente enviados pelo servidor, sem cabeçalhos HTTP. Todos os recursos enviados ficam discriminados no JSON. Não mede compressão do provedor, rede móvel, tempo de carregamento de campo ou Core Web Vitals.

| Grupo da saída estática | Bytes sem compressão |
| --- | ---: |
| 5.571 documentos municipais | 893.552.632 |
| 27 perfis por UF | 81.654.299 |
| 18 camadas do mapa | 18.892.303 |
| Malha TopoJSON | 2.403.064 |
| Assets compartilhados | 1.761.377 |
| Demais arquivos | 1.266.804 |
| **Total — 5.635 arquivos** | **999.530.479** |

O excesso principal é HTML municipal com seis Tipos, cartões, fontes, séries e Ações. Não há malha ou JSON duplicado fisicamente por município. Mesmo eliminando todo o HTML, os perfis por UF já ultrapassam 30 MB. É preciso revisar a representação e a repetição dos dados e documentos, preservando o requisito sem JavaScript; cortar apenas o chunk do mapa não resolve a saída estática.

A primeira visita local comprime cerca de **1,37 MB**, acima de 1.300.000 bytes. Malha (~722 KB gzip), biblioteca do mapa (~291 KB), worker (~148 KB), lista municipal (~80 KB) e camada padrão (~58 KB) dominam a transferência. A fonte Inter é local (~29 KB). Não houve requisição HTTP externa no cenário medido.

Ao selecionar Recife, são solicitados o documento municipal e o perfil PE, **295.403 bytes gzip adicionais**. A primeira visita transfere **1.369.414 bytes gzip**. Nenhum perfil de UF é solicitado na primeira visita; os detalhes continuam sob demanda. Os números exatos e hashes dos assets ficam nos registros [de saída](audit-25/output.json) e [de transferência](audit-25/visit.json).

## Revisão visual e limites

Capturas locais da inicial, Alcântara e Metodologia a 320 × 568, nos dois temas: aviso integral, legenda com nomes e texturas, origem regional, Faixa C e ressalvas legíveis. A inspeção visual é amostral; os outros tamanhos e o zoom são verificados pela automação. `check:tones` confirma as distâncias das cores previstas pela decisão de polimento nos dois temas; isso não é prova de contraste universal, de distinção por qualquer deficiência visual ou de leitura efetiva por tecnologia assistiva.

Capturas preservadas em [screenshots/](audit-25/screenshots/). A razão de contraste dos tokens sólidos foi calculada com `parseThemeTokens` e `contrastRatio`, exportados de `site/scripts/map-tones.mjs`: texto/controle 15,59:1 no claro e 13,17:1 no escuro; apoio/controle 6,80:1 e 5,69:1; link ou foco/superfície 7,00:1 e 8,26:1. As cores e razões estão em [contrast.json](audit-25/contrast.json). Essa amostra não resolve os casos inconclusivos de gradiente, sobreposição ou células fora da área visível. Os custos de contraste dos tons do mapa já aceitos na decisão de fundamentos continuam explícitos: no claro, “Sem direção clara” fica a 1,3:1 do fundo, Dado insuficiente a 1,05:1 e Piorando a 2,5:1; legenda, lista, textos e pontos são essenciais.

Os testes incluem Araioses (Dado insuficiente), Alcântara (origem regional e Faixa C), Balsas (Faixa C), períodos distintos, falta e falha de carga, HPV, próstata e mortalidade. O ajuste C55 não calculável é montado em teste, pois o dado publicado usado na sessão não garante esse caso em Recife. As séries e valores têm tabelas; classes, origem e avisos aparecem em texto. Há pontos para insuficiência e hachura para Faixa C, além dos textos; as classes de Tendência têm nomes mesmo quando a cor é semelhante.

## Roteiro humano pendente

Registrar data, responsável, sistema, navegador, versão e leitor de tela. Executar nos temas claro e escuro, sem usar mouse:

1. Percorrer a inicial com Tab e Shift+Tab, ativar ajuda com Enter/Espaço e fechar com Escape. Conferir foco visível, ordem e ausência de aprisionamento.
2. Buscar “Recife PE”, ouvir a contagem, navegar nos resultados com as setas e selecionar. Ouvir município, resultado, classe e período uma vez; confirmar foco no nome e acesso aos quatro Eixos, Tipo, Ações, “Saiba mais”, recolher e limpar.
3. Repetir com Alcântara, Balsas e Araioses. Confirmar que região, Faixa C e Dado insuficiente são compreensíveis, sem depender da cor ou do desenho.
4. Abrir Lista, filtrar UF, abrir uma linha, conferir os cabeçalhos e a associação de cada célula. Rolar pelo teclado sem perder o foco. Navegar para a consulta e voltar, preservando Tipo e tema.
5. Conferir HPV sem Tendência, mortalidade sem Situação, próstata sem comparação com o prazo, avisos e períodos distintos. Usar o caso de teste de C55 não calculável para essa mensagem específica.
6. Visitar Como calculamos, usar sumário, expansões e links técnicos. Repetir documentos municipais sem JavaScript; confirmar fontes, Ações, links de Tipo e navegação.
7. A 320/768/1280 px e zoom de 200%, conferir leitura e contraste dos controles com gradiente, símbolos, foco e classes; distinguir as texturas em ambos os temas. Registrar problemas e corrigir antes do aceite.

O teste em aparelho físico e Safari segue também no [ticket 46](../mvp-implementacao/issues/46-verificacao-final-em-celular-real.md). Nenhum teste automatizado substitui a verificação dos anúncios com leitor de tela.

## Verificação executada

- `npm run check --prefix site`: zero erros, avisos ou hints.
- `npm test --prefix site`: 87 testes aprovados, sem falhas ou skips; o hook gera o build integral. A execução inicial no sandbox recebeu `spawnSync npm EPERM`; a repetição autorizada fora dele passou.
- `npm run test:a11y --prefix site`, contra a saída estática: 84 testes aprovados, incluindo 24 páginas/estados axe e 54 combinações do mapa, mais seus seis agrupadores. Nenhuma violação confirmada pelo axe após as correções; permanecem as verificações inconclusivas discriminadas no [resumo](audit-25/axe-summary.json).
- `npm run check:tones --prefix site`: todas as distâncias satisfeitas nos dois temas.
- `SITE_URL=http://127.0.0.1:4322 node --test --test-concurrency=1 site/browser-tests/*.test.mjs`: **316 testes aprovados**, zero falhas, cancelamentos ou skips; 852,31 s contra o build estático. Inclui as novas verificações de acessibilidade. Os três resultados são preservados em [test-summary.json](audit-25/test-summary.json); os 84 testes específicos já estão incluídos nos 316, não devem ser somados novamente.

## Standards

Revisão independente do diff `31ddefb...2e994b6`: nenhuma violação documentada. Uma observação de julgamento, baixa prioridade: possível Shotgun Surgery, pois os sete cartões repetem o contêiner `<section class="card-action" role="group" aria-label="Ação">`. A duplicação já existia; extrair um componente compartilhado é uma oportunidade de manutenção, sem bloquear esta correção semântica localizada.

## Spec

A revisão independente encontrou um achado P1: a etapa de prévia poderia permanecer em primeiro plano no GitHub Actions, impedindo a auditoria. O comportamento automático em segundo plano observado localmente depende da detecção de agente do Astro 7 e não era garantia para o CI. Corrigido com `--background` explícito; o próprio comando aguarda prontidão por até 30 segundos. A etapa final `preview -- stop` usa `if: always()`. A revisão do ajuste encerrou o achado: zero pendências de Spec no código.

Revisão: Standards — zero violações e uma observação de manutenção; Spec — um achado corrigido, zero pendências de código. Permanecem as limitações humanas e de orçamento descritas acima.
