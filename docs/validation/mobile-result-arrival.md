# Chegada ao resultado municipal no celular — #34

Entrega da [#34](https://github.com/kvojps/brazil-cancer-map/issues/34), primeira
parte da [#35](https://github.com/kvojps/brazil-cancer-map/issues/35).
A execução foi autorizada pelo responsável com `$implement` nesta sessão.

## Comportamento

A seleção explícita pelo canvas, busca ou Lista agenda uma única chegada ao
resultado após a carga e a definição da composição. Dois frames permitem que a
medição da composição flutuante e a adaptação dos detalhes ocorram antes da
rolagem em fluxo. Em fluxo, o nome recebe foco sem rolagem própria e a página
revela o início do painel; na composição flutuante, foco e rolagem do canvas
permanecem na exploração.

Nova seleção ou limpeza invalida a chegada anterior. Roda do mouse, movimento
de toque, nova ativação ou tecla durante a carga cancela o direcionamento;
mudança na posição de rolagem também impede deslocamento tardio. O cancelamento
ocorre na captura, antes de uma eventual seleção pelo mesmo evento: Enter na
busca não cancela a chegada que ele próprio inicia. Respostas antigas continuam
sendo descartadas pela coordenação de navegação existente.

Não há mudanças estatísticas, nos JSON, nas URLs nem na regra de espaço útil.
A expansão e o retorno em fluxo continuam na entrega separada #36.

## Regressões públicas

`site/browser-tests/map-touch.test.mjs` usa toque efetivo em canvas e os controles
públicos, sem disparar eventos internos de seleção. A primeira carga foi
verificada em 390 × 568/664/740/844. Antes da correção, os cenários de 568 e
664 px deixaram o nome a 1.127,98 e 1.185,58 px do topo, respectivamente,
com scrollY=0, foco no canvas e composição em fluxo.

Após a correção, os quatro cenários passaram, exigindo nome e resultado
visíveis após a composição, Filtros fechado, foco coerente e seleção atual
no perfil e na URL. Outros cenários verificam falha/nova tentativa, cache por
busca, rolagem efetiva antes da chegada de dados, seleção substituída pela
busca e busca fria por Enter. Esta última falhou antes do ajuste de captura.

## Verificações

- `npm run check --prefix site`: 82 arquivos, zero erros, avisos ou hints.
- `npm run build --prefix site`: passou; repetido pelo teste Node dos documentos.
- `npm test --prefix site`: 88 testes aprovados, zero falhas ou ignorados.
- `SITE_URL=http://127.0.0.1:4322 CHROMIUM_PATH=/snap/bin/chromium node --test --test-concurrency=3 site/browser-tests/*.test.mjs`: 359 testes aprovados, zero falhas, cancelamentos ou ignorados, em 387,9 s. Inclui axe, sem violações; verificações inconclusivas continuam exigindo revisão humana.
- Regressões dirigidas de carga demorada e Enter: quatro aprovadas no build final.
- `git diff --check`: passou.

Revisão em dois eixos pela skill `code-review`, comparando a base `c5b09de`:
padrões sem achados; especificação apontou o cancelamento pelo próprio Enter,
corrigido com regressão pública. Nova revisão confirmou zero pendências em ambos os eixos.

## Limites

Execução local em Chromium com toque emulado, sobre build estático. A suíte
existente também confere horizontal, recuperação de altura, origens regionais,
ressalvas longas, busca, Lista, câmera, histórico, desktop, ausência de JavaScript
e acessibilidade automatizada. Emulação e axe não comprovam uso físico nem
leitor de tela. A conferência física permanece na #33; #35 e #26 não se encerram
automaticamente. Não houve merge, push ou deploy nesta entrega.
