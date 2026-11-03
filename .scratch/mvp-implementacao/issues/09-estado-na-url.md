# 09: Estado na URL e combinações inexistentes

**What to build:** o estado do mapa pode ser compartilhado por link. Indicador, tipo e modo ficam na query string, omitindo os valores padrão; nada é lembrado entre visitas. Combinações que não existem nunca deixam o mapa num estado quebrado. Referência: spec, seção 11.1.

**Blocked by:** 07 — Seletor de Tipo de câncer; 08 — Situação e modo "como está hoje"

**Status:** resolved

- [x] Sem parâmetros, o site abre no estado inicial (até 60 dias × Todos × Tendência)
- [x] Mudar indicador, tipo ou modo atualiza a query string, omitindo os padrões
- [x] Um link inválido é corrigido em silêncio, campo a campo (valor desconhecido → padrão; modo impossível → o modo que o indicador tem), e a URL é reescrita para o estado mostrado
- [x] Ao trocar para um tipo sem o indicador atual, o mapa volta para o até 60 dias com um aviso de uma linha
- [x] O seletor mostra desabilitados, com o motivo, os indicadores que não se aplicam ao tipo
- [x] A lógica de normalização do estado tem testes; a tabela de quais indicadores existem por tipo vem de um só lugar e cresce conforme os indicadores entram


## Comments

Implementado em 2026-11-03 no commit `feat: persist map selection in URL` (este commit).

- Estado normalizado a partir de `indicador`, `tipo` e `modo`; os identificadores de indicador e tipo seguem o contrato em inglês e `modo=hoje` seleciona Situação. Exemplo: `?tipo=breast&modo=hoje`. Valores padrão são omitidos, campos inválidos são corrigidos sem aviso e nenhum estado é persistido fora da URL.
- Disponibilidade por indicador × tipo × modo centralizada em `INDICATORS`, usada pela normalização e pelos controles. Trocas incompatíveis retornam ao até 60 dias com aviso; opções indisponíveis explicam o motivo. Somente o indicador já publicado é oferecido. Catálogos de teste cobrem mamografia, mortalidade e HPV sem publicar esses indicadores antes dos respectivos tickets.
- A seleção só é confirmada na URL após carregar a camada; falhas restauram os controles para a última seleção exibida. Respostas antigas não sobrescrevem a seleção mais recente.
- Validação: 4 testes do site, 97 testes do pipeline, Astro check e mypy passando; build concluído com o aviso existente de tamanho do bundle. Sem verificação interativa em navegador.
- Revisão pela skill `code-review`: nenhum desvio da spec ou violação de padrão. A duplicação apontada na apresentação das opções foi removida.
