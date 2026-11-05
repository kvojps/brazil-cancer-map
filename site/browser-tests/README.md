# Testes da inicial no navegador

Instale as dependências com `npm ci --prefix site` e inicie o site com
`npm run dev --prefix site`. Em outro terminal:

```sh
CHROMIUM_PATH=/caminho/para/chromium npm run test:browser --prefix site
```

O caminho padrão é `/snap/bin/chromium`. `SITE_URL` permite usar outro servidor,
inclusive a saída estática servida por `npm run preview --prefix site`.
Use Chromium com suporte a extensões locais para o teste de zoom nativo.

A suíte verifica a página pública: WebGL indisponível, malha pendente, falhas da
lista e da camada com nova tentativa, atualização dos links após mudar o Tipo de
câncer, acesso direto à ficha, filtro por UF, ausência de Situação e ajuste C55
não calculável. Percorre a busca por teclado e verifica a matriz de larguras
320/768/1280 px, temas claro/escuro e JavaScript ativo/desativado.

Além da simulação por CSS, a extensão local de teste `zoom-extension` usa
`chrome.tabs.setZoom` para aplicar zoom **nativo de 200%**. A suíte confirma a
redução da largura da viewport CSS e o aumento da densidade de pixels; verifica
que a rolagem horizontal fica contida na tabela. A extensão só é carregada pelo
navegador de teste e não integra o site publicado.

Esses testes não substituem uma sessão com leitor de tela nem a auditoria de
acessibilidade do lançamento (ticket 25). Os anúncios usam regiões de status e
os dados continuam expressos em texto.

A ficha municipal também é verificada em `municipality.test.mjs`: links estáticos
para os seis Tipos de câncer, âncora direta que prevalece sobre um filtro anterior,
preservação de tema e retorno, ativação de links e expansões pelo teclado e a
mesma matriz de temas/larguras/JavaScript, com expansões abertas. Inclui zoom
nativo de 200% pela extensão de teste.

Para verificar os documentos efetivamente gerados, rode `npm run build --prefix site`,
inicie `npm run preview --prefix site -- --port 4322` e use
`SITE_URL=http://127.0.0.1:4322 npm run test:browser --prefix site`.
Não execute builds simultâneos: eles compartilham o diretório de saída.

A lista agora ocupa a área do mapa. Os testes ativam “Explorar em lista” e
verificam Mapa/Lista, seleção e filtros ao usar Voltar/Avançar. A seleção
aprimorada usa o caminho estático `/municipio/<código>-<nome>/`; links antigos
com `?municipio=` são normalizados com JavaScript. A recarga desse caminho
continua entregando quatro Eixos e seis Tipos sem JavaScript. O índice por UF
fica na página `/municipios/`, com expansões nativas por UF; os testes verificam
o acesso pelos documentos municipais, recarga, tema e navegação pelo teclado.
