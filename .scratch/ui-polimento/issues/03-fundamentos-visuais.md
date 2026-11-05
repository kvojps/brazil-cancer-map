# Quais fundamentos visuais expressam "sóbrio e preciso" nos dois temas?

Labels: wayfinder:prototype
Type: prototype
**Status:** resolved
Assignee: Kvojps
Parent: ../map.md
Blocked by: 01

## Question

Definir, em protótipo com dados reais e nos temas claro e escuro: fonte hospedada no próprio site, escala tipográfica, logo simples, cores de superfície, espaçamento, e o estilo de botões, seletores, links e itens da legenda.

Rever os tons do mapa para que "Sem direção clara" não chame mais atenção que melhorando e piorando, preservando os significados e conferindo o contraste das cores e texturas.

## Answer

O responsável aceitou a recomendação: **sistema B, Neutro, tons 2 e marca da silhueta**, com as três mudanças de regra no tema escuro.

- **Fonte:** Inter variável, hospedada no próprio site, com algarismos tabulares (`tnum`). Títulos e corpo na mesma família, com peso 600 em títulos e números e 500 em rótulos e controles.
- **Escala e espaço:** 12, 14, 16, 20, 24 e 32 px, com 12 px como piso. Espaçamento em múltiplos de 4 px.
- **Marca:** silhueta do Brasil derivada da malha real, monocromática e na cor do texto. Substitui o `◈`.
- **Superfícies:**

| Token | Claro | Escuro |
|---|---|---|
| Página | `#f5f5f5` | `#0a0a0a` |
| Superfície | `#fff` | `#1a1a1a` |
| Suave (fundo dos controles) | `#efefef` | `#2a2a2a` |
| Borda | `#d4d4d4` | `#333` |
| Texto | `#171717` | `#f5f5f5` |
| Texto de apoio | `#525252` | `#a3a3a3` |
| Link e foco | `#1a56b0` | `#8ab4f8` |
| Faixa do aviso (fundo / texto) | `#171717` / `#fafafa` | `#f5f5f5` / `#171717` |
| Contorno de seleção | `#000` | `#fff` |

- **Controles:** preenchidos com o tom suave e sem borda, raio de 8 px, 40 px no desktop e 44 px no celular. O estado ativo inverte texto e superfície. Cartões flutuantes têm raio de 12 px e sombra suave, sem borda. Links são sublinhados com filete de 1 px.
- **Tons do mapa:**

| Classe | Claro | Escuro |
|---|---|---|
| Melhorando | `#0f6e6b` | `#35bdb6` |
| Piorando | `#d68f10` | `#e3a42c` |
| Estável | `#9aa0a9` | `#79818c` |
| Sem direção clara | `#d9dde2` | `#38414b` |
| Dado insuficiente, com pontos `#8a9099` | `#f3f2ec` | `#1e242b` |
| Hachura da faixa C | `rgba(31,41,51,.55)` | `rgba(230,237,243,.42)` |
| Fundo do mapa | `#f6f7f9` | `#12171d` |
| Contorno dos municípios | `#fff` | `#12171d` |
| Situação: Alcançou | `#54278f` | `#b9a3f2` |
| Situação: Perto | `#9e9ac8` | `#7a68b4` |
| Situação: Longe | `#dadaeb` | `#3d3760` |

**Por que os tons mudaram:** "Sem direção clara" é a classe de 3.754 dos 5.571 municípios (67%) no estado inicial e dominava o tema escuro. Na paleta anterior, "Melhorando" e "Estável" tinham ΔE 1,5 com protanopia. Agora têm 19,1 no claro e 16,3 no escuro, contra a meta de pelo menos 8.

**Regras alteradas, com aval do responsável:** só no tema escuro, "Sem direção clara" deixa de ser cinza claro, "Dado insuficiente" deixa de ser quase branco e mantém os pontos, e a Situação fica mais clara quanto mais perto da Referência. Os significados, as classes e as texturas não mudam. Esta decisão prevalece nesses pontos sobre os tickets [12](../../mapa-cancer-br/issues/12-tendencia-e-municipios-pequenos.md) e [18](../../mapa-cancer-br/issues/18-referencia-de-cada-indicador.md), e a [spec do MVP](../../mapa-cancer-br/spec-mvp.md) e a [spec vigente](../../ui-ux-v1/spec.md) foram ajustadas.

Custos aceitos dos tons, no tema claro:

- "Sem direção clara" fica a 1,3:1 do fundo, e o contorno do país perde força.
- "Dado insuficiente" depende dos pontos: ΔE de 6,4 a 6,8 contra "Sem direção clara" e 1,05:1 contra o fundo.
- "Piorando" fica a 2,5:1 do fundo, abaixo de 3:1. A legenda e a lista compensam.

Pendências para a implementação:

- **`≥`:** falta no subconjunto `latin` da Inter e hoje vem de uma fonte de reserva. Gerar subconjunto próprio com o `≥`, o que a licença da Inter permite por não ter nome reservado, e publicar o `OFL.txt`.
- **Sem JavaScript:** o tema precisa funcionar também pela preferência do sistema, o que o protótipo não fez.
- **Cores fixas:** `TREND_COLORS`, `STATUS_COLORS`, pontos e hachura passam a depender do tema, nos cartões e nos testes que as usam.
- **Não verificado:** 320 px, zoom de 200%, aparelho real e, no sistema escolhido, a Lista e a Metodologia. O contorno de seleção junto da faixa do aviso segue para o ticket do painel.

Protótipo: branch descartável local `prototype/ui-polimento-fundamentos`, commit `0b0ff2c`; `npm run dev` em `site/`, com `?fund=B&mapa=2`, e a folha em `/prototipo-fundamentos/`. O código é só referência e deve ser reescrito na implementação.

## Comments

### Protótipo — 2026-11-05

Aguardando o julgamento do responsável. Branch descartável local `prototype/ui-polimento-fundamentos`, a partir de `prototype/ui-polimento-celular`; `npm run dev` em `site/`, com `?fund=A|B|C` e `?mapa=0|1|2`, e a folha em `/prototipo-fundamentos/`.

### Resolução — 2026-11-05

O responsável aceitou a recomendação: "Concordo com a sua recomendação". Sem alteração no código do produto.
