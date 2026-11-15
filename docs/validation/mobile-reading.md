# Leitura mobile — issue #30

Verificação local em 15/11/2026, no Chrome for Testing 156.0.8078.4 (Playwright 1.64.1), Linux. A entrega
altera somente o site e sua documentação: preserva os JSON publicados, cálculos,
URLs municipais estáticas e consulta integrada ao dashboard.

## Regras de adaptação

O [contrato de interface](../ui-contract.md) registra a decisão de composição:
fluxo abaixo de 300 px de largura, abaixo de 520 px de altura visual ou quando
aviso, cabeçalho, resumo recolhido, alturas reais dos controles e ressalvas, maior altura da legenda/controles inferiores e 32 px de espaçamento deixarem
menos de 160 px para explorar o mapa. A última medida de resumo flutuante é
conservada durante o fluxo, evitando oscilação ao mostrar os detalhes completos.
Não é um limite percentual nem uma redução de conteúdo. Filtros, busca, legenda,
Mapa/Lista, ressalvas e painel entram na página com rolagem.

Os gráficos adaptam apenas apresentação e coordenadas horizontais, com rótulos
de 16 px, altura de 200 px e largura mínima de 240 px. Abaixo da largura mínima,
rolam localmente; sem JavaScript, a apresentação original de 570 px também rola
localmente. A tabela permanece disponível. Rotação não chama enquadramento de
chegada: só revela seleção encoberta, preservando o zoom.

## Evidências

- `mobile-reading.test.mjs`: primeiro registrou a falha de resumo longo ainda
  fixo; após a adaptação e a revisão, os 15 testes focados passaram. Cobrem os dois temas,
  rótulos renderizados, ausência de corte de eixos, tabela, origem regional e
  ressalva de Alcântara, busca, última linha da Lista e ações do painel em
  320 × 568, 390 × 844, 568 × 320, 844 × 390 e 390 × 360, nos dois temas. Também verificam foco durante a redução de altura da busca e ressalva longa da próstata sem seleção.
- `map-touch.test.mjs`, teste de rotação: passou no percurso com Recife,
  filtro de mama e tema escuro, zoom aumentado pelo controle público, giro
  390 × 844 → 844 × 390 → 390 × 844 e comparação da geografia por tooltip.
  Confere seleção e URL preservadas, sem acessar instância interna do mapa.
- `npm run check --prefix site`: 82 arquivos, sem erros, avisos ou sugestões.
- `npm run build --prefix site`: 5.574 páginas.
- `npm test --prefix site`: 88 testes passaram.

Comandos da verificação final (servidor HTTP local sobre `site/dist`, porta 4331):

```sh
npm run check --prefix site
npm test --prefix site
SITE_URL=http://127.0.0.1:4331 CHROMIUM_PATH=/caminho/para/chromium node --test --test-concurrency=3 site/browser-tests/*.test.mjs
```

A execução completa sobre o build final verificou 348 testes em 343,67 s:
347 passaram e um teste antigo ainda esperava o botão “Ver mapa” após a ressalva
longa da próstata exigir fluxo. Foi alterada somente essa expectativa, conferindo
os seletores no fluxo, a ressalva abaixo deles e a troca para mortalidade. A
repetição de todo `phone-first-screen.test.mjs` passou nos 43 testes, em 34,66 s.
Assim, todos os 348 casos foram verificados, combinando a execução completa e a
repetição do arquivo corrigido; não se declara uma execução única com 348 aprovações.

A suíte inclui ampliação nativa de 200%, desktop, ambos os temas, ausência de
JavaScript, falha do mapa, coerência dos indicadores e auditoria axe. O axe não
encontrou violações, mas registrou verificações inconclusivas que dependem de
revisão humana. Os testes antigos de folha fixa em 320 × 568 foram atualizados
para exigir fluxo quando resumo ou ressalvas ocupam o espaço necessário ao mapa;
os testes específicos da folha continuam em 390 × 844. Após os ajustes de código,
`check` permaneceu sem diagnósticos e a repetição de `npm test` passou nos 88 testes
(com novo build). A última alteração foi somente no teste da primeira tela e
neste registro.

```sh
SITE_URL=http://127.0.0.1:4331 CHROMIUM_PATH=/caminho/para/chromium node --test site/browser-tests/phone-first-screen.test.mjs
```

## Limites

A altura de 390 × 360 aproxima a área útil com teclado aberto. As dimensões da
janela, toque e rotação são emulados; não comprovam teclado virtual real,
barras móveis do navegador, GPU ou comportamento de Safari/Firefox. Não houve
verificação em aparelho físico, leitor de tela, deploy ou nova carga das Fontes.
A validação física e conjunta da especificação #26 permanece separada e pendente.

## Revisão

A revisão por agentes separados de padrões e spec identificou uma heurística
nos gráficos (coordenadas usadas para reconhecer anotações), a omissão de
ressalvas sem seleção na decisão de fluxo e a antiga limitação tipográfica ainda
registrada no contrato. Os cartões agora identificam anotações e anos finais
explicitamente; a medição inclui controles, ressalvas e superfícies inferiores;
e o contrato foi corrigido. A segunda revisão dos dois eixos não encontrou
pendências. O novo teste da ressalva sem seleção registrou a falha no build
anterior e passou no código corrigido.
