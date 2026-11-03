# 17: Redistribuição do C55 no colo do útero

**What to build:** a mortalidade do colo do útero passa a incluir a parte estimada dos registros C55 (útero sem localização definida), e o cartão avisa que a estimativa foi ajustada. Referência: spec, seção 6.2.

**Blocked by:** 16 — Tendência da mortalidade (SIM)

**Status:** ready-for-agent

- [ ] Na limpeza, a proporção C53/(C53+C54) da UF de residência × ano × faixa etária é aplicada aos C55 do município, preservando valores fracionários; o C54 recebe o restante
- [ ] O total de "Todos" não muda
- [ ] Se C53+C54 = 0 na UF, usa a proporção nacional do mesmo ano e idade; se nem ela puder ser calculada, o resultado fica sinalizado como "ajuste não calculável"
- [ ] O cartão do colo traz a nota "Estimativa ajustada para registros sem localização definida; pode diferir do INCA."
- [ ] A execução valida a série ajustada completa e registra o resultado; a metodologia não apresenta o efeito sobre a classe da Tendência como comprovado
- [ ] Testes cobrem o caso normal, o fallback nacional e o "ajuste não calculável"
