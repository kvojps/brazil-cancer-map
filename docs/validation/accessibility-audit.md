# Auditoria de acessibilidade do lançamento

Data: 06/11/2026. Base da implementação: `31ddefb2cd3432fec45e7adbec38a570d7faa36e`. Auditoria local do site estático, sem publicação e **sem certificação WCAG ou eMAG**. O requisito está na [spec](../spec.md), seção 2, e as dívidas na seção 17.

## Resultado

| Item | Situação |
|---|---|
| Violações confirmadas do axe, em 24 análises | Nenhuma, depois das correções |
| Verificações inconclusivas do axe | **3.498 nós de contraste e 48 de nome acessível**, não contadas como aprovações |
| Testes de navegador | 316 aprovados, que não verificam anúncios |
| Sessão com leitor de tela | **Não aconteceu.** Pendente, por decisão do responsável: "Deixar pendente para revisão humana" |
| Aparelho real | Declarado pelo responsável ("Aconteceu, sem problemas"), **sem registro de aparelho, sistema ou navegador** |
| Orçamento de tamanho | **Não cumprido.** É dívida conhecida, que não bloqueia a V1 |

**Orçamento:** a primeira decisão foi manter as metas e bloquear o lançamento até reduzir. Em decisão posterior de 06/11/2026, o responsável adiou a redução para depois da V1 e aceitou o excesso como dívida conhecida, e essa decisão substitui a anterior. As metas continuam pendentes. A exceção não dispensa acessibilidade, validação dos dados nem verificação da hospedagem.

**Registro antigo:** o commit `31378f8` marcou a auditoria como resolvida, com anúncios e revisão humana ainda abertos. Não há registro dessa sessão, e esta auditoria a trata como não feita.

## Escopo e método

- Chromium 156.0.8078.47, Playwright Core 1.64.1 e axe-core 4.14.0, com a saída de `astro build` servida por `astro preview` em `http://127.0.0.1:4322`.
- **Axe, 24 análises:** inicial em Lista com PE, Municípios por UF com PE aberto, Como calculamos, Recife, Alcântara e Araioses, nos temas claro e escuro, com e sem JavaScript. Expansões nativas abertas. Na consulta aprimorada, os Eixos são exclusivos, e só o último fica aberto.
- **Sem JavaScript:** o documento carrega com scripts desativados, e só durante a análise se habilitam os temporizadores do axe. Essa instrumentação não equivale a uma sessão humana sem JavaScript.
- **`map-state-accessibility.test.mjs`:** cada combinação publicada de Indicador × Tipo × modo, nos dois temas, com WebGL indisponível. Compara a classe textual, a origem e o ano de Recife com o JSON publicado, e verifica HPV sem Tendência, mortalidade sem Situação e notas do valor. **Não é comparação exaustiva dos 5.571 municípios.**
- **Suítes existentes:** busca, seletores, ajuda, mapa/lista, consulta integrada, recolher versus limpar, histórico, links e Metodologia. Incluem 320, 768 e 1280 px, dois temas, JavaScript ativo e desativado, zoom por CSS e zoom nativo de 200% por extensão local. Falhas de lista, camada, perfil, WebGL e malha pendente têm testes de recuperação.
- **Casos difíceis:** Araioses (Dado insuficiente), Alcântara (origem regional e Faixa C), Balsas (Faixa C), períodos distintos, falta e falha de carga, HPV, próstata e mortalidade. O C55 não calculável é montado em teste, porque o dado publicado de Recife não garante esse caso.

## Achados e correções

O axe identificou `landmark-unique` (moderado): duas regiões de tabela da Metodologia se chamavam "Conferência de mortalidade", e várias seções de Ação apareciam como regiões de mesmo nome. A tabela de pesos passou a se chamar "População mundial padrão Segi/Doll". As Ações usam `role="group"`, dentro dos artigos já nomeados por indicador. O teste reproduziu os achados antes da correção.

O CI barra violações graves e críticas e a regressão de nomes de regiões, e guarda os relatórios, inclusive os inconclusivos, no artifact `accessibility-results`. Os comandos foram executados localmente, e esta auditoria não registra execução remota do workflow. O job do site no CI roda `check`, `build` e `test:a11y`, sem `npm test` nem `test:browser`.

**Inconclusivos do axe:**

| Regra | Nós | Onde |
|---|---:|---|
| `color-contrast` | 3.498 | Controles com gradiente, símbolos e células fora da área visível da tabela |
| `label-content-name-mismatch` | 48 | Correspondência entre símbolo visível e nome acessível |

Os botões com símbolos têm nomes textuais, mas a experiência completa continua no roteiro humano.

**Foco:** o critério inicial, de manter o foco no controle e oferecer atalho, foi superado pela decisão do [painel](../ui-contract.md#painel-meu-município), e a auditoria segue essa decisão.

## Contraste e distinção

Razão de contraste dos tokens sólidos, calculada com `parseThemeTokens` e `contrastRatio` de `site/scripts/map-tones.mjs`. Exclui gradientes, composição com transparência e hover, e não cobre a página inteira.

| Par | Claro | Escuro |
|---|---:|---:|
| `--text` / `--surface` | 17,93:1 | 15,96:1 |
| `--text` / `--soft` | 15,59:1 | 13,17:1 |
| `--muted` / `--surface` | 7,81:1 | 6,90:1 |
| `--muted` / `--soft` | 6,80:1 | 5,69:1 |
| `--link` ou `--focus` / `--surface` | 7,00:1 | 8,26:1 |
| `--notice-text` / `--notice-bg` | 17,18:1 | 16,44:1 |

Essa amostra não resolve os casos inconclusivos. `check:tones` confirma as distâncias de cor previstas nos dois temas, o que não prova contraste universal, distinção por qualquer deficiência visual nem leitura por tecnologia assistiva. Os custos aceitos dos tons do mapa estão em [`ui-contract.md`](../ui-contract.md#fundamentos-visuais): legenda, lista, textos e pontos são essenciais neles.

Séries e valores têm tabelas, e classes, origem e avisos aparecem em texto. Há pontos para Dado insuficiente e hachura para Faixa C, além dos textos. A revisão visual foi amostral, com capturas da inicial, de Alcântara e da Metodologia a 320 × 568, nos dois temas. Outros tamanhos e o zoom foram verificados pela automação.

## Desempenho

Medições reproduzíveis, depois do build:

```sh
npm run measure:output --prefix site
CHROMIUM_PATH=/caminho/para/chromium npm run measure:visit --prefix site
```

`measure:output` soma `stat.size` de todos os arquivos de `dist`. `measure:visit` usa contexto novo do Chromium a 1280 × 900, sem cache, servidor HTTP local com gzip nível 6 e mapa pronto, sem seleção, e depois busca e seleciona Recife mantendo o cache. Soma os corpos enviados, sem cabeçalhos. **Não mede a compressão do provedor, rede móvel, tempo de carregamento de campo nem Core Web Vitals.**

| Grupo da saída estática | Arquivos | Bytes sem compressão |
|---|---:|---:|
| Documentos municipais | 5.571 | 893.552.632 |
| Perfis por UF | 27 | 81.654.299 |
| Camadas do mapa | 18 | 18.892.303 |
| Malha TopoJSON | 1 | 2.403.064 |
| Assets compartilhados (`_astro`) | 11 | 1.761.377 |
| Demais arquivos | 7 | 1.266.804 |
| **Total** | **5.635** | **999.530.479** |

O excesso principal é o HTML municipal com seis Tipos, cartões, fontes, séries e Ações. Não há malha nem JSON duplicado por município. Mesmo sem nenhum HTML, os perfis por UF já passam de 30 MB. A direção aceita para reduzir está na spec, seção 17.

**Primeira visita:** 1.369.414 bytes gzip, acima da meta de cerca de 1,3 MB. Sem requisição HTTP externa no cenário. Nenhum perfil de UF é solicitado.

| Recurso | Bytes gzip |
|---|---:|
| Malha TopoJSON | 722.479 |
| Biblioteca do mapa | 291.255 |
| Worker do mapa | 148.331 |
| Lista municipal | 80.285 |
| Camada padrão | 57.630 |
| Fonte Inter | 29.284 |
| Demais (HTML, CSS, scripts) | 40.150 |

**Seleção de Recife:** mais 295.403 bytes gzip: documento municipal (22.748) e perfil de PE (272.655).

## Verificação executada

- `npm run check --prefix site`: zero erros, avisos ou hints.
- `npm test --prefix site`: 87 testes aprovados, sem falhas nem skips.
- `npm run test:a11y --prefix site`, contra a saída estática: 84 testes aprovados, incluindo as 24 análises do axe e as 54 combinações do mapa, mais seis agrupadores.
- `npm run check:tones --prefix site`: distâncias satisfeitas nos dois temas.
- `SITE_URL=http://127.0.0.1:4322 node --test --test-concurrency=1 site/browser-tests/*.test.mjs`: **316 testes aprovados**, sem falhas, cancelamentos nem skips, em 852,31 s. Os 84 de acessibilidade já estão nesses 316, e não se somam.

## Roteiro humano pendente

Registrar data, responsável, sistema, navegador, versão e leitor de tela. Executar nos temas claro e escuro, sem usar mouse:

1. Percorrer a inicial com Tab e Shift+Tab, ativar a ajuda com Enter ou Espaço e fechar com Escape. Conferir foco visível, ordem e ausência de aprisionamento.
2. Buscar "Recife PE", ouvir a contagem, navegar nos resultados com as setas e selecionar. Ouvir município, resultado, classe e período uma vez. Confirmar o foco no nome e o acesso aos quatro Eixos, Tipo, Ações, "Saiba mais", recolher e limpar.
3. Repetir com Alcântara, Balsas e Araioses. Confirmar que região, Faixa C e Dado insuficiente são compreensíveis sem depender da cor ou do desenho.
4. Abrir a Lista, filtrar por UF, abrir uma linha, conferir os cabeçalhos e a associação de cada célula. Filtrar por MA a 390 px, navegar por célula numa linha fechada, abrir Balsas pelo ⌄ e conferir o anúncio de "expandido". Repetir a 1280 px, na tabela. Rolar pelo teclado sem perder o foco. Ir à consulta e voltar, preservando Tipo e tema.
5. Conferir HPV sem Tendência, mortalidade sem Situação, próstata sem comparação com o prazo, avisos e períodos distintos. Usar o caso de teste de C55 não calculável para essa mensagem.
6. Visitar Como calculamos, usar sumário, expansões e links técnicos. Repetir nos documentos municipais sem JavaScript, confirmando fontes, Ações, links de Tipo e navegação.
7. A 320, 768 e 1280 px e no zoom de 200%, conferir leitura e contraste dos controles com gradiente, símbolos, foco e classes, e distinguir as texturas nos dois temas. Registrar os problemas e corrigir antes do aceite.

Aparelho físico e Safari também ficam sem registro: anotar aparelho, sistema e navegador ao repetir. Nenhum teste automatizado substitui a verificação dos anúncios com leitor de tela.
