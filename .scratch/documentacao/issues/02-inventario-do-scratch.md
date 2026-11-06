# 02: Inventário do `.scratch`

**What to build:** o responsável pode apagar os esforços concluídos com segurança, porque cada arquivo do `.scratch` tem um destino conhecido. Decisões que só existem em comentários de tickets, como os 5.571 municípios, são encontradas antes de sumirem. Referência: [spec](../spec.md), "Regras", item 5.

**Blocked by:** None (can start immediately)

**Status:** resolved

- [x] Todos os arquivos versionados de `mapa-cancer-br`, `mvp-implementacao`, `ui-polimento` e `ui-ux-v1` foram lidos, inclusive as seções `## Comments`
- [x] `.scratch/documentacao/inventario.md` traz uma tabela com uma linha por arquivo ou grupo homogêneo: destino em `docs/` (e qual) ou "só na tag", com o motivo
- [x] A tabela lista as decisões encontradas fora da spec e dos tickets de decisão, cada uma com o destino
- [x] Divergências entre spec, tickets, código e site entram na tabela, com o que vale hoje
- [x] Evidências que sustentam o método estão identificadas: tabelas por UF, medições do Painel, conferência do SIM com o Atlas, validação do C55
- [x] Candidatos a ADR além dos seis da spec são levados ao responsável antes de serem criados
- [x] Referências ao `.scratch` fora dele (arquivo e linha) estão listadas para o ticket 10

## Comments

### Resultado (06/11/2026)

O [inventário](../inventario.md) cobre os 154 arquivos, com 41 decisões fora da spec, 31 divergências e 14 grupos de evidência. Um script conferiu que cada arquivo aparece em uma única linha, e que cada referência com caminho `.scratch` fora dele está listada na linha certa. Ele não foi guardado.

Respostas do responsável, registradas no inventário: quatro ADRs a mais, quarta dívida na §17, taxa de mortalidade mantida no painel, e a declaração de que o ticket de implementação 46 aconteceu, sem detalhes do aparelho. Por isso a [spec](../spec.md) e o [ticket 04](04-spec-viva-e-adrs.md) foram ajustados.

**Pontos que merecem atenção do responsável:**

- O commit `31378f8` marcou como resolvidos os tickets de implementação 18, 25, 26, 44 e 46, mas o repositório não traz evidência da revisão clínica, da sessão com leitor de tela nem da medição anual. O inventário trata as três como não feitas (V14 a V16). O ticket 46 fica como declarado pelo responsável (V17).
- Nove branches `prototype/*` citadas nos tickets só existem nesta máquina, e a tag não as preserva.

Sem código alterado: não se aplicam TDD nem as suítes de teste.

Resolvido pelo commit `docs: inventory scratch files before archiving`.
