# Tempo de seleção municipal no celular

Investigação em 14/11/2026, a partir de `f3bf9d0`, motivada por engasgos ao tocar
em municípios no site publicado. O responsável informou que arraste e zoom
funcionavam bem e que a pausa persistia ao voltar a um município já consultado.
O escopo acordado foi reduzir o tempo entre a seleção e a apresentação das
informações, mantendo o conteúdo da consulta.

## Reprodução e causas

Chromium local, viewport de 390 × 844, toque habilitado, CPU reduzida em quatro
vezes e WebGL por SwiftShader. O cenário alterna Recife e Olinda seis vezes;
as últimas quatro consultas reutilizam os dados carregados. O evento
`municipality-map-select` aciona o mesmo caminho usado pelo mapa, sem simular o
reconhecimento físico do toque. Não houve emulação de rede móvel.

O perfil de CPU e intervenções isoladas confirmaram dois custos:

- A navegação compartilhada varria todos os links a cada alteração no DOM e
  em cada mudança de URL. O teste de regressão registrou 16.713 escritas de
  `href` na tabela em uma seleção, mesmo sem alteração dos filtros.
- As 5.571 linhas da Lista permaneciam no documento enquanto ela estava oculta.
  Mesmo depois de eliminar as reescritas, o maior callback síncrono em consultas
  repetidas foi de 427,5 ms. Retirar apenas essas linhas no experimento reduziu
  o máximo para 60,9 ms. Limitar seletores CSS a caminhos mais curtos ajudou,
  mas ainda deixou o máximo em 270,2 ms; essa alternativa não foi aplicada.

A lentidão local se reproduzia com dados em cache. Portanto, o download não
explica sozinho o problema. O custo do documento continuava ocorrendo a cada
seleção; a simulação com CPU reduzida tornou esse custo observável.

## Correção

A navegação guarda o contexto já aplicado aos links. Destinos municipais fixos
só são recalculados quando mudam os parâmetros relevantes; inserir um painel
processa apenas os links inseridos. Links de retorno continuam acompanhando a
seleção atual. A aplicação do tema evita escrever novamente o mesmo atributo.

A Lista cria suas linhas quando é exibida e as remove ao voltar ao Mapa.
Mantém os dados carregados, o filtro de UF e os códigos das linhas expandidas,
restaurando a apresentação quando reaberta. Nenhum município ou informação da
consulta foi eliminado. As páginas estáticas continuam disponíveis sem JavaScript.

## Medições

Comparação pelo mesmo harness local, em execuções sem outro navegador de teste
concorrente. Tempos em milissegundos:

| Cenário | Antes | Depois |
| --- | ---: | ---: |
| Primeira seleção: callback síncrono | 687 | 53 |
| Primeira seleção: perfil inserido no DOM | 1.892 | 435 |
| Consultas repetidas: callback síncrono | 611–729 | 19–49 |
| Consultas repetidas: perfil inserido no DOM | 1.518–1.644 | 87–124 |

A inserção no DOM não é o instante exato de apresentação na tela. O harness
também espera dois frames depois da inserção; no resultado final, esse tempo
total foi de 104–317 ms nas consultas repetidas, sujeito ao WebGL em software.
O script versionado confirmou o resultado em execução separada: máximo síncrono
de 37,2 ms e perfil inserido em 106–147 ms nas consultas repetidas.

O baseline usou a inicial, as duas páginas municipais e os assets recém-gerados;
aquele build terminou com erro na geração do índice. Os builds posteriores da
correção concluíram integralmente. Essas medições não são uma auditoria da
hospedagem, nem uma medição física do aparelho informado pelo responsável.

## Reprodução e verificações

Depois de instalar as dependências e gerar o site, sem outro teste de navegador
em paralelo:

```sh
npm run build --prefix site
node site/scripts/measure-selection.mjs
```

O script versionado conserva o cenário e falha se o maior callback síncrono das
consultas repetidas atingir 200 ms. Trata-se de uma guarda de diagnóstico local,
não de uma meta contratual para qualquer aparelho. Parâmetros e limites estão
no [guia de desenvolvimento](../development.md).

O teste `site/browser-tests/municipality-selection.test.mjs` falhou antes das
correções e verifica tanto a ausência de reescritas desnecessárias quanto a
remoção das linhas ocultas, a restauração do filtro e das linhas expandidas e o
contexto dos links de retorno e dos links inseridos.

Verificações aprovadas:

- Tipos sem erros e 87 testes do site, incluindo build completo.
- A nova regressão de seleção municipal.
- 164 testes de navegador nos arquivos `accessibility`, `integrated-profile`,
  `list`, `map-alternatives`, `map-state-accessibility` e `municipal-panel`.
  A auditoria axe não encontrou violações; continuam os limites da revisão
  automatizada, que não substitui avaliação humana com leitor de tela.
- As duas execuções isoladas da medição final passaram na guarda de 200 ms.

A confirmação no celular físico e no site publicado depende da publicação da
correção e permanece pendente.
