# Glossário — Observatório do Câncer no Brasil

**Eixo**: Um dos quatro agrupamentos temáticos do mapa: Prevenção, Detecção precoce, Acesso ao tratamento e Panorama. Cada indicador pertence a exatamente um eixo.

**Indicador**: Uma medida publicada no mapa (por exemplo, cobertura de mamografia), definida por fonte, recorte geográfico e período.

**Panorama**: O eixo que descreve o tamanho do problema: casos novos esperados (incidência estimada) e a tendência de mortalidade.

**Tendência de mortalidade**: A variação da taxa de mortalidade ao longo do tempo. É a única forma em que a mortalidade aparece no mapa; contagens absolutas de óbitos não ganham destaque.

**Mapa inicial**: O panorama do Brasil por município, com a Tendência do indicador escolhido como leitura padrão e acesso à consulta municipal completa no próprio dashboard. A cor nunca expressa posição entre municípios.

**Meu município**: A consulta de um município no próprio Mapa inicial, reunindo os quatro Eixos e os indicadores disponíveis para o município ou, quando pertinente, para sua região, UF ou capital. É a visão local completa do cuidado com o câncer, para entender e agir.

**Tendência**: A direção recente de um indicador, em uma de quatro classes: melhorando, piorando, estável (sabemos que quase não mudou) ou sem direção clara (a mudança é incerta demais para dizer). Quando nem há casos suficientes para calcular, o indicador fica como dado insuficiente, que não é uma Tendência. Aparece em todo cartão e é a cor padrão do Mapa inicial. "Melhorando" depende do indicador: para a mortalidade, é cair; para a cobertura, é subir. É sempre medida como variação percentual anual, em relação ao próprio valor do indicador. _Evitar_: pontos percentuais para expressar a Tendência. _Evitar_: "estável" para uma série que só não mostrou mudança significativa.

**Ação**: Um próximo passo concreto de prevenção, cuidado ou acesso a direitos, associado a um indicador ou oferecido num eixo sem indicador pertinente ao tipo de câncer. É orientação geral, disponível mesmo quando o dado é insuficiente, e não uma conduta individual determinada pela situação do município.

**Tipo de câncer**: O recorte por localização do câncer (por exemplo mama ou próstata) que filtra os indicadores do mapa. A visão padrão é "Todos os cânceres", e o seletor oferece mama, colo do útero, próstata, colorretal e pulmão. Quando um eixo não tem indicador para um tipo, ele mostra por que não tem.

**Referência**: O valor com que a situação de um indicador é comparada. É a meta oficial quando ela existe (por exemplo, 100% dos casos tratados em até 60 dias) e o valor do Brasil quando não existe. Nunca é um ranking entre municípios.

**Situação**: O valor do indicador no último ano consolidado, comparado à Referência. Aparece no cartão e no modo "como está hoje" do mapa. A mortalidade não tem Situação, só Tendência.

**Região imediata**: O grupo de municípios vizinhos definido pelo IBGE cujo dado substitui o de um município com poucos casos, tanto no Mapa inicial quanto no Meu município. Para o cidadão, aparece como "seu município e vizinhos". _Evitar_: "agregado" em texto para o público.

**Dado insuficiente**: O estado de um indicador quando nem o município nem a sua Região imediata têm casos suficientes para calcular a Situação e a Tendência. Não é uma classe de Tendência, e a Ação continua aparecendo.

**Fonte**: O provedor oficial de onde vem um dado (por exemplo SISCAN ou IBGE), aquele que o site identifica e que deve ser citado junto com o Observatório. Uma Fonte pode alimentar mais de um Indicador. _Evitar_: "fonte" para a unidade de processamento do pipeline, que é a `source`, sempre escrita como código.

**Contrato de dados**: O conjunto de arquivos publicados com que o site é construído, com os valores prontos para exibir. É a única ligação entre o processamento dos dados e o site.

**Versão de dados**: Uma publicação datada e imutável do Contrato de dados e dos seus dados abertos, identificada por um nome como `data-2026-11-05`. É o que se cita e se verifica.
