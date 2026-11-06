# Cascata município → Região imediata → Dado insuficiente

A maioria dos municípios não tem casos suficientes para uma Tendência própria, mas o site promete um dado para o município de cada pessoa. Decidimos em 02/11/2026 aplicar uma cascata, por indicador × tipo: o município usa o próprio dado se tiver média de pelo menos 20 por ano na janela; senão, usa o da sua **Região imediata** do IBGE, se ela passar do mínimo; senão, fica como **Dado insuficiente**. Nunca se sobe para a UF. A mesma origem vale para a Tendência e para a Situação, no mapa e no Meu município, para que uma pessoa nunca veja uma cor de um lugar e um número de outro.

Regras vigentes: [spec, seção 8](../spec.md#8-municípios-pequenos).

## Alternativas consideradas

- **Só suprimir abaixo de um limiar, como CDC e NCI (16 casos):** descartada. Deixaria muito do mapa sem dado: no 60 dias × Todos, só 1.225 dos 5.571 municípios passam do mínimo por conta própria.
- **Suavização bayesiana empírica ou espacial:** descartada, porque é difícil de explicar ao cidadão. A versão empírica também não dá intervalo de confiança direto, então não serve sozinha para classificar a Tendência com incerteza.
- **Subir para a UF:** descartada. A cascata para na Região imediata, e a UF aparece só como contexto ("no seu estado") no caso de Dado insuficiente.
- **Somar anos no próprio município:** não adotada para a Tendência. Períodos sem sobreposição reduzem uma série de 11 anos a 3 ou 4 pontos, e médias móveis não podem entrar num teste de tendência.
- **Região de Saúde no lugar da Região imediata:** levantada como opção, porque o SUS organiza por ela a referência para o tratamento, mas não adotada. A decisão ficou com a Região imediata (510 regiões, divisão de 2017, ainda vigente na malha de 2025), que já vem com código na malha. As CIB revisam a composição das Regiões de Saúde, e o efeito disso numa série de 10 anos não foi medido.

## Evidências

- O mínimo de 20 é o limite de "instável" do CDC WONDER.
- Com 20 eventos por ano em 10 anos, a margem da variação anual fica em ±5% ao ano, em conta aproximada do projeto, sem sobredispersão, enquanto a mortalidade por câncer muda de 1% a 2% ao ano. A maioria dos municípios não tem tendência própria detectável.
- Na medição de qualidade, só 10–11% dos municípios somam 20 casos ou mais em 5 anos no pulmão e no estômago, e só o "Todos" (93%) funciona município a município sem agregar.

Origem do dado na extração de 17/10/2026, janela 2015–2024:

| Indicador × Tipo | Município | Região imediata | Dado insuficiente |
|---|---:|---:|---:|
| 60 dias × Todos, contando quimio e radio | 1.225 | 4.273 | 73 |
| 60 dias × Todos, contando todos os casos | 2.073 | 3.461 | 37 |

Os 73 municípios ficam em 16 Regiões imediatas do Norte e de partes do Nordeste e do Centro-Oeste. Na mamografia × Todos, são 4.923 pelo próprio dado, 643 pela região e 5 com Dado insuficiente, porque o mínimo conta exames.

## Consequências

- O mapa mostra muitos municípios com a cor da região. O tooltip e o painel dizem isso em "Seu município e vizinhos", e "agregado" não aparece em texto para o público.
- A região soma todos os seus municípios, inclusive os que têm dado próprio, então o dado regional inclui os municípios grandes.
- No Dado insuficiente, a camada não publica valor nem % sem informação, porque uma porcentagem de poucos casos revelaria a contagem bruta.
- Um recorte de denominador muda a distribuição inteira, como mostra a tabela. Mudar o mínimo reclassifica o mapa.
