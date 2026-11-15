# Resumo, detalhes e retorno em fluxo

Entrega da [#36](https://github.com/kvojps/brazil-cancer-map/issues/36),
conferida junto da chegada ao resultado da
[#34](https://github.com/kvojps/brazil-cancer-map/issues/34), em 15/11/2026.
As regras vigentes ficam na spec, seção 11.1, e no contrato de interface,
seção Painel Meu município.

## Comportamento

Com JavaScript, largura de celular determina a disponibilidade do resumo
recolhido; espaço útil determina somente a composição flutuante ou em fluxo.
Trocar a composição não abre os detalhes. O resumo mantém resultado, período,
origem regional e ressalvas integrais, inclusive a da próstata. Só o controle
explícito abre a consulta.

A seleção guarda a rolagem anterior na entrada municipal do histórico. O retorno
de detalhes recolhe a consulta e restaura essa posição, mantendo a seleção e
os estados existentes da Lista e do mapa. Abrir detalhes cria uma entrada;
Voltar/Avançar e o controle de retorno a reutilizam. Link com âncora começa nos
detalhes, na própria entrada de chegada; seu retorno retira a âncora e recolhe
por substituição, sem etapa artificial. O posicionamento espera a composição
final e respeita interação deliberada e seleção substituída.

Desktop continua com consulta completa. Sem JavaScript, os quatro Eixos,
resultados, Ações e links dos Tipos continuam no documento estático.

## Evidência pública de navegador

| Fronteira | Verificação |
| --- | --- |
| `mobile-details.test.mjs` | Resumo sem expansão por toque no texto, abertura por teclado, retorno, recarga, histórico entre municípios/filtros e detalhes, link municipal, âncora com Eixo visível, carga atrasada com leitura deliberada e seleção substituída. |
| Mesmo arquivo, matriz | 390 × 568/664/740/844 e 664 × 390; redução para 390 × 360 com detalhes abertos e recuperação; Lista em 568/844 com UF, linha aberta e posição anterior à seleção. |
| `map-touch.test.mjs` | Toque efetivo emulado no canvas, primeira chegada nas quatro alturas, resumo → detalhes → retorno, carga fria/quente, falha/nova tentativa, leitura deliberada e seleção rápida; seleção e câmera observadas pela geografia visível. Inclui as regressões da #34. |
| `mobile-reading.test.mjs` | Leitura e posição preservadas em fluxo e flutuante, gráficos com piso de 12 px, busca, Lista e rotação. |
| `municipal-panel.test.mjs` | Origem regional, Faixa C, ressalvas longas e integrais, zoom nativo de 200%, teclado, desktop e ausência de JavaScript. |
| Demais arquivos | Busca e superfícies temporárias, contratos publicados, alternativas do mapa, responsividade e auditorias automatizadas de acessibilidade. |

## Execução

Ambiente: Node 24.20.0 e Chromium 1248 do Playwright, com toque móvel emulado.
A regressão inicial de resumo em 390 × 568 falhou antes da implementação
(detalhes visíveis). A verificação adicional de âncora em fluxo também falhou
antes do ajuste que aguarda a composição final (Eixo aberto fora da tela).

Tipos: `npm run check --prefix site`, sem erros, avisos ou sugestões em 82
arquivos. Testes Node: `npm test --prefix site`, 88 aprovados; esse comando
constrói a saída estática. O build isolado também foi executado.

A rodada dirigida de leitura/painel teve 44 aprovações e uma falha de foco por
teclado. A repetição isolada desse cenário passou. A execução completa usa a
saída estática e inclui novamente esse cenário. Duas rodadas completas
foram interrompidas para incorporar os ajustes de âncora e recarga do histórico;
não são contabilizadas como suítes aprovadas.

A suíte completa usa a prévia estática em `http://127.0.0.1:4322`, com dois
arquivos de navegador em paralelo:

```sh
SITE_URL=http://127.0.0.1:4322 CHROMIUM_PATH=/home/kvojps/.cache/ms-playwright/chromium-1248/chrome-linux64/chrome node --test --test-concurrency=2 site/browser-tests/*.test.mjs
```

Resultado final: **370 testes aprovados, zero falhas, cancelamentos ou
testes ignorados**, em 559,05 s. O cenário de foco por teclado da rodada dirigida
e o zoom nativo de 200% passaram nessa execução. As regressões da #34 e os
18 cenários de detalhes passaram na mesma saída estática, incluindo os quatro
tamanhos de chegada, resumo → detalhes → retorno e proteção de leitura durante
a carga.

O caminho do Chromium é o desta máquina; em outra instalação, siga o guia de
desenvolvimento para localizar o executável. Os cenários incluem auditorias
axe; verificações inconclusivas continuam exigindo revisão humana.

## Revisão e limites

Revisão em dois eixos contra `3f637d7fbfe05812effbd58070ff8b238ef649db`:
Standards não encontrou violações ou smells justificáveis. Spec apontou o
posicionamento tardio de âncora sem cancelamento; o ajuste foi conferido na
segunda revisão. Uma conferência complementar identificou a âncora anterior
preservada na URL após nova seleção; o teste público falhou antes da correção
e passou depois, inclusive após recarga. A seleção explícita agora limpa a
âncora, enquanto links iniciais e restauração pelo histórico a preservam.
A regressão adicional de recarga com âncora falhou antes do ajuste que
preserva a entrada deliberada de detalhes; a chegada por âncora só inicializa
uma entrada que ainda não representa detalhes, preservando o retorno existente.

Emulação e axe não comprovam aparelho físico, teclado virtual nem leitura com
tecnologia assistiva. A conferência física continua na
[#33](https://github.com/kvojps/brazil-cancer-map/issues/33). Esta entrega não
encerra as especificações [#35](https://github.com/kvojps/brazil-cancer-map/issues/35)
e [#26](https://github.com/kvojps/brazil-cancer-map/issues/26), nem executa
merge, push ou deploy. Pipeline e Fontes oficiais não foram executados.
