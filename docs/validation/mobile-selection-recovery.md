# Seleção municipal e recuperação da composição mobile — #32

## Reprodução e diagnóstico

Verificação local em 15/11/2026, a partir do commit
`399a2e7b4abd10c7a74e2ffe9ce7b7ed50b220fb`, com build estático servido em
`http://127.0.0.1:4322/`, Chromium do Playwright 1.64.1, em Linux.
Viewport, toque e redução de altura foram emulados. O responsável informou Chrome no Redmi C65 e a URL de produção
(`https://brazil-cancer-map.kvojps.workers.dev/`). Não foram informados sistema,
versão do navegador/site, dimensões úteis, município/recorte, barras ou teclado
da sessão relatada. A URL de produção não foi usada nos testes desta entrega.
Não se afirma que esta seja a reprodução exata daquela sessão física.

A partir da inicial, sem seleção e com Filtros fechados, no recorte padrão
(até 60 dias × Todos os cânceres × Tendência), um toque efetivo no canvas a
390 × 664 e 390 × 568 produziu o percurso filtros → mapa → detalhes.
A folha de Filtros permaneceu fechada (`:popover-open` falso), `scrollY`
permaneceu zero e o elemento ativo foi o canvas, sem foco no nome municipal
ou nos filtros. A mudança foi de composição: controles permanentes no início
da página e consulta completa depois do mapa. O município foi determinado
pelo ponto tocado na malha; este ensaio exploratório não fixou seu nome.
A 390 × 740 e 390 × 844, o mesmo procedimento manteve o resumo flutuante.
O resumo regional observado a 390 × 664 deixou menos de 160 px úteis,
portanto esse caso, por si só, não justifica remover o fluxo.

Uma reprodução determinística identificou uma falha distinta na recuperação
do espaço: abrir Recife a 390 × 844, reduzir para 390 × 740, depois para
390 × 390 e voltar a 390 × 740. Na primeira passagem a 740, o resumo
recolhido tinha 323,125 px e era fixo; depois da redução, continuava estático,
com a consulta completa de 3.252,375 px. A recuperação deveria recolhê-lo.
O cabeçalho flutuante tinha 44 px; o cabeçalho em fluxo, 128 px. O código
subtraía este último ao avaliar se poderia voltar a flutuar, além de conservar
medidas antigas do resumo e controles. A decisão dependia do percurso anterior.

O teste público de regressão usa Recife × mama × Tendência × tema escuro,
com Filtros fechados, 390 × 740 → 390 × 390 → 390 × 740. Falhou antes da
correção por não recuperar a posição fixa e passou depois. Usa toque emulado
no canvas após a recuperação, observa filtros, foco, rolagem e resumo, abre os
detalhes deliberadamente e compara os rótulos geográficos nos mesmos pontos
ao retornar. A redução da janela aproxima perda de área útil; não abre teclado
virtual nem reproduz barras móveis reais.

## Correção

`mountMobileLayout` mede a composição flutuante candidata com o resumo
recolhido, inclusive quando a composição vigente está em fluxo. Restaura os
atributos sincronamente antes da pintura e só comunica a mudança definitiva.
A observação de mutações do painel é suspensa durante a própria medição,
evita realimentação e volta a acompanhar o conteúdo. O limiar de 160 px,
os 32 px de espaçamento, os pisos de largura/altura e as ressalvas integrais
permanecem como definidos no contrato.

A recuperação passa a considerar o resumo atual, sem guardar a altura de
outra seleção. Os detalhes abertos são medidos como resumo apenas para decidir
a composição; seu estado visível é restaurado. A navegação continua a controlar
expansão, histórico e seleção.

A revisão identificou que a medição temporária também poderia limitar a
rolagem ao recolher os detalhes ou retirar a consulta do fluxo. Dois testes
públicos reproduziram a perda de posição: painel aberto e rolado a 390 × 844
e página em fluxo rolada a 390 × 568, seguidos de aumento de 1 px de altura.
Ambos falharam antes do ajuste (no painel, de 609 px para zero). A medição
agora conserva e restaura a rolagem da página e do painel antes de notificar
a composição definitiva.

## Verificações

```sh
npm run check --prefix site
npm test --prefix site
npm run preview --prefix site -- --host 127.0.0.1 --port 4322
SITE_URL=http://127.0.0.1:4322 CHROMIUM_PATH=/caminho/para/chromium node --test --test-concurrency=3 site/browser-tests/*.test.mjs
```

`check` passou sem diagnósticos em 82 arquivos. `npm test` passou nos 88
casos e gerou 5.574 páginas. Os dois novos testes de posição de leitura
passaram isoladamente depois da correção. A primeira execução completa de
navegador foi interrompida para incorporar a correção de rolagem identificada
na revisão; não é contabilizada como aprovação da suíte. A execução completa
final passou nos **351 testes**, sem falhas ou casos ignorados, em 310,85 s.
Inclui telas estreitas/baixas, horizontal, ressalvas longas, rotação, temas,
zoom nativo, desktop, ausência de JavaScript/mapa e auditoria axe. O axe
não encontrou violações e registrou verificações inconclusivas que exigem
revisão humana. Não se afirma validação por leitor de tela.

A revisão de padrões não encontrou violações documentadas nem smells
relevantes. A revisão da spec identificou a perda de posição durante a medição;
foi reproduzida, corrigida e recebeu os dois testes públicos. A revisão do
ajuste não identificou novos problemas. O atendimento integral do relato
original permanece pendente da conferência do responsável.

## Limites e acompanhamento

A falha de recuperação está reproduzida e corrigida na emulação. A hipótese de
que explique o relato original continua pendente de nova conferência pelo
responsável com o cenário original. Não houve aparelho físico, Safari,
Firefox, leitor de tela, publicação ou deploy. A correção local não altera a
versão atualmente publicada.

Os resultados devem ser referenciados na #31 antes de reavaliar a validação
integrada. A #26 não é encerrada automaticamente. A #32 permanece aberta
até a conferência do cenário relatado; os resultados automatizados não
substituem esse retorno.
