# 09: Estado na URL e combinações inexistentes

**What to build:** o estado do mapa pode ser compartilhado por link. Indicador, tipo e modo ficam na query string, omitindo os valores padrão; nada é lembrado entre visitas. Combinações que não existem nunca deixam o mapa num estado quebrado. Referência: spec, seção 11.1.

**Blocked by:** 07 — Seletor de Tipo de câncer; 08 — Situação e modo "como está hoje"

**Status:** ready-for-agent

- [ ] Sem parâmetros, o site abre no estado inicial (até 60 dias × Todos × Tendência)
- [ ] Mudar indicador, tipo ou modo atualiza a query string, omitindo os padrões
- [ ] Um link inválido é corrigido em silêncio, campo a campo (valor desconhecido → padrão; modo impossível → o modo que o indicador tem), e a URL é reescrita para o estado mostrado
- [ ] Ao trocar para um tipo sem o indicador atual, o mapa volta para o até 60 dias com um aviso de uma linha
- [ ] O seletor mostra desabilitados, com o motivo, os indicadores que não se aplicam ao tipo
- [ ] A lógica de normalização do estado tem testes; a tabela de quais indicadores existem por tipo vem de um só lugar e cresce conforme os indicadores entram
