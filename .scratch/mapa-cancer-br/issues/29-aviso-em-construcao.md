# O site deve avisar que ainda está em construção?

Type: grilling
Status: resolved
Assignee: Kvojps (Claude session 2026-11-03, ticket 29)
Blocked by: 23

## Question

O site já está no ar (ticket de implementação 03), mas os requisitos antes de publicar da seção 17 de [spec-mvp.md](../spec-mvp.md) seguem abertos: revisão clínica das Ações, validação da série ajustada pelo C55, reconferência das fontes e dos links oficiais. Quem visita hoje vê números que ainda não passaram por uma validação rigorosa. Decidir:
- se o site mostra um aviso de que está em construção;
- quando o aviso sai;
- a forma e o texto do aviso.

Ao resolver, atualizar a seção 2 de [spec-mvp.md](../spec-mvp.md).

## Answer

Decidido em 2026-11-03 com o responsável pelo projeto.

**O site mostra um aviso de que está em construção.** O tom segue a seção 1 (esperança com honestidade): o aviso diz o que falta, sem prometer nada.

**Texto:** "**Em construção.** Este site ainda está sendo desenvolvido e os números não passaram por uma validação completa: podem conter erros e mudar." O texto é genérico e não lista o que falta validar, para não precisar mudar a cada item resolvido. Ele evita "provisório" e "preliminar", que na spec querem dizer os anos recentes do dado (seção 6.4). Também não diz "não use estes dados para decisões", para não afastar o público.

**Forma:** uma faixa fixa no topo de todas as páginas, que não pode ser fechada. Como o site não lembra nada entre visitas (seção 11.1), um botão de fechar faria a faixa voltar a cada visita. A faixa é texto, e não só cor. Ela não usa as cores da Tendência nem vermelho, para não ser lida como uma classe do mapa.

**Quando sai:** por decisão manual do responsável pelo projeto. A spec não amarra a saída aos requisitos da seção 17.

**Fora desta decisão:** os arquivos de dados abertos (seção 3 e ticket de implementação 22) não levam o aviso.
