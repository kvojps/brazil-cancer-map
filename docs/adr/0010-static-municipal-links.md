# Links municipais estáticos em `/municipio/<código>-<nome>/`

O cidadão chega pela busca e pelo link compartilhado, e a consulta precisa funcionar sem JavaScript, mesmo depois que o Console horizontal eliminou a tela municipal separada. Decidimos em 04/11/2026 que **`/municipio/<código>-<nome>/` é o documento estático do próprio dashboard com o município selecionado**: um HTML pré-gerado por município, com os quatro Eixos, os seis Tipos de câncer, as Ações, as ressalvas e as fontes já no documento. A seleção feita no navegador usa o mesmo caminho. Em 05/11/2026, o índice por UF foi para a página `/municipios/`, com item na navegação principal, entre "Mapa" e "Como calculamos".

Regras vigentes: [spec, seções 11.1 e 13](../spec.md#111-mapa-inicial).

## Alternativas consideradas

- **Seleção só por query string (`?municipio=`):** descartada. Num servidor estático, a query string não seleciona conteúdo, então a consulta não existiria sem JavaScript. O parâmetro fica só como compatibilidade, convertido com JavaScript.
- **Nova rota canônica, com redirect:** descartada. Exigiria redirects HTTP no provedor, ou o mesmo HTML nas duas rotas. Redirect só por JavaScript não atende ao requisito. Reaproveitar o caminho existente dispensa redirects e novas rotas.
- **Tela municipal separada, com ficha e navegação próprias:** descartada pela aprovação do Console horizontal, em que a consulta acontece no dashboard.
- **Índice nacional repetido em cada documento:** descartado. Levaria a saída a cerca de 4,1 GiB. **Índice na página inicial:** foi a primeira versão, substituída para reduzir o volume dela e não interferir na área do mapa.

## Evidências

- Em 06/11/2026, os 5.571 documentos municipais somam 893.552.632 bytes dos 999.530.479 da saída estática. O excesso principal vem do HTML com seis Tipos, cartões, fontes, séries e Ações. Malha e JSON não se repetem por município.
- Selecionar Recife acrescenta 295.403 bytes gzip à primeira visita, entre o documento municipal e o perfil de PE.
- Os 5.635 arquivos ficam abaixo do limite de 20.000 da hospedagem. A prévia estática local entrega os documentos sem redirect por JavaScript. A configuração remota do provedor não foi verificada.

## Consequências

- **Estas são URLs públicas:** links compartilhados dependem delas, e mudá-las exigiria manter as antigas com redirect HTTP ou o mesmo HTML.
- O formato pesa na saída e responde pela maior parte da [dívida de tamanho](../spec.md#17-pendências). Uma redução futura, por exemplo com páginas compartilhadas para séries e explicações, precisa manter estes caminhos, os resultados locais dos seis Tipos e a leitura sem JavaScript.
- `/municipios/?municipio=<código>` carrega a seleção para o retorno, e a âncora antiga da inicial continua levando ao acesso à nova página.
- Sem JavaScript, o Mapa/Lista não existe. O caminho é o índice por UF e os links municipais.
