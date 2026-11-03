# Com que indicador, tipo e modo o Mapa inicial abre?

Type: grilling
Status: open
Blocked by: 23

## Question

[Como a experiência "meu município" deve parecer?](06-experiencia-meu-municipio.md) decidiu que o site abre no mapa pintado pela Tendência "do indicador escolhido", mas não fixou **qual** indicador nem qual tipo estão selecionados na primeira visita. O protótipo (branch `prototype/06-meu-municipio`) abria em **até 60 dias × Todos os cânceres × Tendência**. Nenhum ticket confirmou esse estado. Decidir:
- o indicador e o tipo iniciais (lembrando que, no 60 dias, a hachura da faixa C aparece já na primeira impressão);
- se a URL guarda o estado (indicador, tipo, modo, município) para o link compartilhado.

Ao resolver, atualizar a seção 11.1 de [spec-mvp.md](../spec-mvp.md).
