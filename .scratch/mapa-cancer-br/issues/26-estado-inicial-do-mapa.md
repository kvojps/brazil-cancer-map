# Com que indicador, tipo e modo o Mapa inicial abre?

Type: grilling
Status: resolved
Assignee: Kvojps (Claude session 2026-11-02, ticket 26)
Blocked by: 23

## Question

[Como a experiência "meu município" deve parecer?](06-experiencia-meu-municipio.md) decidiu que o site abre no mapa pintado pela Tendência "do indicador escolhido", mas não fixou **qual** indicador nem qual tipo estão selecionados na primeira visita. O protótipo (branch `prototype/06-meu-municipio`) abria em **até 60 dias × Todos os cânceres × Tendência**. Nenhum ticket confirmou esse estado. Decidir:
- o indicador e o tipo iniciais (lembrando que, no 60 dias, a hachura da faixa C aparece já na primeira impressão);
- se a URL guarda o estado (indicador, tipo, modo, município) para o link compartilhado.

Ao resolver, atualizar a seção 11.1 de [spec-mvp.md](../spec-mvp.md).

## Answer

Decidido em 2026-11-02 com o responsável pelo projeto.

**Estado inicial (URL sem parâmetros):** **até 60 dias × Todos os cânceres × Tendência**. O indicador é o carro-chefe e o que corresponde ao posicionamento ("como está o cuidado com o câncer no seu município"). As UFs da faixa C ficam hachuradas já na primeira impressão, e isso é aceito como a ressalva honesta. "Todos os cânceres" confirma a visão padrão de [Qual é o recorte do MVP (tipos de câncer e região)?](08-recorte-do-mvp.md). O modo Tendência confirma [Como a experiência "meu município" deve parecer?](06-experiencia-meu-municipio.md).

**A URL guarda o estado:** o município fica no caminho (`/municipio/<slug>/`, a página estática que funciona sem JavaScript). Indicador, tipo e modo ficam na query string (por exemplo `?indicador=mamografia&tipo=mama&modo=hoje`), e os valores iguais ao padrão são omitidos. O link "limpo" é sempre o estado inicial.

**Nada é lembrado entre visitas:** sem parâmetros, todo mundo vê o estado inicial. Só a URL carrega o estado, e não há armazenamento no navegador.

**Troca de tipo quando o indicador não existe para ele** (por exemplo, Mamografia → Próstata): o indicador volta para o inicial (até 60 dias) e uma linha curta avisa "Mamografia não se aplica a câncer de próstata; mostrando até 60 dias". No seletor, os indicadores que não se aplicam ao tipo aparecem desabilitados, com o motivo, em vez de sumirem.

**Link com combinação inválida:** é corrigido em silêncio, campo a campo, sem página de erro. O valor desconhecido vira o padrão. O modo impossível vira o modo que o indicador tem (mortalidade → Tendência; HPV → como está hoje). O indicador que não vale para o tipo segue a regra da troca de tipo. A URL é reescrita para o estado que está sendo mostrado.
