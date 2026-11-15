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
