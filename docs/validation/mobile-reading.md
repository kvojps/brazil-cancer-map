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
  fixo; após a adaptação, os oito testes iniciais passaram. Cobrem os dois temas,
  rótulos renderizados, ausência de corte de eixos, tabela, origem regional e
  ressalva de Alcântara, busca, última linha da Lista e ações do painel em
  320 × 568, 390 × 844, 568 × 320, 844 × 390 e 390 × 360.
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
SITE_URL=http://127.0.0.1:4331 CHROMIUM_PATH=/caminho/para/chromium node --test --test-concurrency=1 site/browser-tests/*.test.mjs
```

A suíte completa de navegador está em execução; o resultado será registrado
antes da conclusão desta entrega. Inclui os testes existentes de ampliação
nativa de 200%, desktop, ambos os temas, ausência de JavaScript, falha do mapa,
coerência dos indicadores e auditoria axe. Os testes antigos de folha fixa em
320 × 568 foram atualizados para exigir fluxo quando o resumo ocupa o espaço
necessário ao mapa; os testes específicos da folha continuam em 390 × 844.

## Limites

A altura de 390 × 360 aproxima a área útil com teclado aberto. As dimensões da
janela, toque e rotação são emulados; não comprovam teclado virtual real,
barras móveis do navegador, GPU ou comportamento de Safari/Firefox. Não houve
verificação em aparelho físico, leitor de tela, deploy ou nova carga das Fontes.
A validação física e conjunta da especificação #26 permanece separada e pendente.
