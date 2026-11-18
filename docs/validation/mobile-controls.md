# Controles de Meu município no celular — #55

Verificação local em 17/11/2026 da
[#55](https://github.com/kvojps/brazil-cancer-map/issues/55), vinculada à
[spec #54](https://github.com/kvojps/brazil-cancer-map/issues/54).
Contrato: [Painel Meu município](../ui-contract.md#painel-meu-município).
Base da implementação: `98fadefa037033db79f75b1c6736ffb4279b3f2f`.

## Mudança e regressão

O teste antes da correção mediu 4 px entre retorno e Menu e 2 px de
desalinhamento vertical. A apresentação mobile passa a usar distância mínima
de 8 px, sem margens individuais no retorno. O nome permanece acima dos
botões, que podem quebrar linha e alinham pelo topo. Legenda ganha separação
do seletor; todos os controles do escopo têm alvos de pelo menos 44 × 44 px.

Na inspeção visual a 200% de fonte CSS, o seletor nativo cortava o valor
selecionado, sem que `scrollWidth` detectasse o corte. Uma cópia visual,
com quebra de linha, agora dimensiona o mesmo controle nativo. Essa cópia
não recebe eventos nem entra no nome acessível; as opções, o foco e a
seleção continuam no `select`. O valor visual acompanha o estado do Tipo
de câncer, inclusive nas restaurações de histórico.

## Reprodução automatizada

Na raiz, com as dependências e Chromium descritos no
[guia de desenvolvimento](../development.md):

```sh
npm run check --prefix site
npm test --prefix site
npm run preview --prefix site -- --host 127.0.0.1 --port 4322
SITE_URL=http://127.0.0.1:4322 node --test site/tests/browser/mobile-details.test.mjs
SITE_URL=http://127.0.0.1:4322 node --test --test-concurrency=1 site/tests/browser/*.test.mjs
npm run preview --prefix site -- stop
```

`CHROMIUM_PATH` permite substituir `/snap/bin/chromium`. O build de `npm test`
terminou antes de iniciar a prévia e os testes de navegador. Nenhum build
ocorreu durante a conferência. Resultados obtidos:

- `check`: 86 arquivos, sem erros, avisos ou sugestões.
- `npm test`: 74 testes unitários e 14 de integração aprovados; inclui build.
- Arquivo `mobile-details`: 31 testes aprovados, incluindo as quatro novas
  configurações e os percursos existentes de foco, histórico, seleção,
  retorno ao Mapa/Lista, leitura interna, Menu e altura extrema nos dois temas.
- Suíte completa de navegador: 416 testes aprovados, sem falhas ou ignorados,
  em aproximadamente 19 min 23 s. Inclui as auditorias automatizadas de
  acessibilidade, desktop, zoom nativo e os percursos mobile existentes.

As novas configurações são 320 × 568 e 568 × 320 a 100%, e 320 × 568 e
568 × 160 a 200% de fonte CSS. Usam Vila Bela da Santíssima Trindade (MT),
nome municipal longo, alternando Mapa e Lista. Medem retângulos renderizados,
distância entre controles e alinhamento por linha; verificam nome acima dos
botões, ausência de transbordamento horizontal e texto selecionado integral
após trocar Tipo, além da distinção entre recolher e Limpar seleção.
Não exigem uma estrutura de layout específica de CSS ou HTML.

## Conferência visual emulada

Chromium com toque emulado, tema claro e build estático local. As capturas
mostram a consulta com `?visualizacao=lista`; os testes cobrem ambos os retornos.
Cada par registra duas posições de rolagem interna: barra e leitura.

| Configuração | Barra | Leitura | Observação |
| --- | --- | --- | --- |
| 320 × 568, 100% | [Controles](mobile-controls/narrow-controls.png) | [Seletor](mobile-controls/narrow-reading.png) | Nome em duas linhas, botões alinhados e separados; Legenda e seletor separados. |
| 568 × 320, 100% | [Controles](mobile-controls/landscape-controls.png) | [Seletor](mobile-controls/landscape-reading.png) | Nome em linha própria; leitura interna alcança Legenda e Tipo. |
| 320 × 568, 200% CSS | [Controles](mobile-controls/enlarged-controls.png) | [Seletor](mobile-controls/enlarged-reading.png) | Retorno em linha própria; Menu e limpar na linha seguinte; valor do seletor quebra sem perder letras. |
| 568 × 160, 200% CSS | [Controles](mobile-controls/extreme-controls.png) | [Seletor](mobile-controls/extreme-reading.png) | Barra e leitura têm janelas muito baixas; partes dos alvos ficam fora da janela de rolagem. Alcance por rolagem interna, sem exigir exibição simultânea de todo o alvo. |

A inspeção das capturas confirma espaçamento e alinhamento nos cenários
normais e a quebra do valor ampliado do seletor. No extremo, o nome e os
controles requerem posições diferentes da barra; a captura estática não
comprova sozinha o alcance de todos eles. Os testes existentes percorrem Menu,
busca, filtros, legenda, retorno e recuperação da altura sem cliques forçados.

A 200% e 320 px, o texto explicativo ao lado do número do resultado fica
muito estreito, comportamento anterior fora do escopo dos controles da #55.
As capturas registram essa limitação; esta entrega não redesenha o resultado.

Fonte CSS a 200% não equivale ao zoom nativo do Chrome ou à configuração de
texto do Android. Emulação não comprova toque, teclado, barras móveis,
viewport visual nem leitura com tecnologia assistiva em aparelho físico.
Nenhum aparelho físico foi usado; não houve deploy. As pendências físicas da
[#52](https://github.com/kvojps/brazil-cancer-map/issues/52) e da spec #44
continuam conforme a [matriz mobile](../mobile-validation.md).
A entrega da #55 não encerra a spec pai #54, que exige revisão conjunta.

## Revisão da entrega

A revisão independente contra a base acima foi feita nos eixos Standards e
Spec. Standards não encontrou violações documentais; sugeriu esclarecer o
nome do helper de asserção do teste, renomeado para `assertControlLayout`.
Spec não encontrou desvio concreto e destacou que as medidas novas de caixas
integrais precisam dos percursos existentes para comprovar alcance nas áreas
roláveis. As limitações estão registradas acima. Não restou achado aberto
nesses dois eixos.
