# 17: Redistribuição do C55 no colo do útero

**What to build:** a mortalidade do colo do útero passa a incluir a parte estimada dos registros C55 (útero sem localização definida), e o cartão avisa que a estimativa foi ajustada. Referência: spec, seção 6.2.

**Blocked by:** 16 — Tendência da mortalidade (SIM)

**Status:** resolved

- [x] Na limpeza, a proporção C53/(C53+C54) da UF de residência × ano × faixa etária é aplicada aos C55 do município, preservando valores fracionários; o C54 recebe o restante
- [x] O total de "Todos" não muda
- [x] Se C53+C54 = 0 na UF, usa a proporção nacional do mesmo ano e idade; se nem ela puder ser calculada, o resultado fica sinalizado como "ajuste não calculável"
- [x] O cartão do colo traz a nota "Estimativa ajustada para registros sem localização definida; pode diferir do INCA."
- [x] A execução valida a série ajustada completa e registra o resultado; a metodologia não apresenta o efeito sobre a classe da Tendência como comprovado
- [x] Testes cobrem o caso normal, o fallback nacional e o "ajuste não calculável"

## Comments

### Implementação — 2026-11-04

A limpeza preserva o C53 original para a comparação com o Atlas e aplica o ajuste por UF de residência × ano × faixa etária, usando só registros femininos. A parte de C54 fica registrada na auditoria, sem alterar “Todos”. O Parquet conserva as contagens originais e a marca de ajuste calculável; as alocações ficam em `data/clean/sim/c55-adjustment.json`.

Uma célula com C55 sem proporção estadual nem nacional gera “ajuste não calculável”: o ano afetado fica sem taxa, e a Tendência só é bloqueada quando a falha pertence à sua janela de anos consolidados. O aviso acompanha município, Região imediata e contexto nacional. A idade ignorada fica em célula separada, sem entrar na padronização. O cartão mantém a nota aprovada e a metodologia explica o ajuste, os fallbacks e os limites da validação.

Revisão em dois eixos desde `7f8c929`: Standards — sem pendências; Spec — sem pendências após corrigir o bloqueio indevido por anos fora da janela. A redistribuição permanece na limpeza por determinação expressa deste ticket e da seção 14 da spec, que especificam essa exceção à regra geral de concentrar a estatística em `compute`.

Verificações do código: 142 testes Python passaram (274 avisos de previsão perfeita nas séries sintéticas); mypy sem erros; 20 testes do site passaram, incluindo build; Astro check sem erros, avisos ou hints. Os testes novos cobrem frações, conservação, fallback nacional, ajuste não calculável, validação completa e falhas fora da janela (2014 ou 2024 provisório).

Commits:

- `2d2ba2d` — `feat: redistribute unspecified uterine mortality by state and age`.
- `ddbacb4` — `fix: preserve mortality trends when C55 gaps fall outside the model window`.

### Validação e publicação completas — 2026-11-04

Os onze DBC locais de 2014–2024 foram relidos porque os Parquet da carga anterior não conservavam C54 e C55 separados. Limpeza, cálculo, validação e exportação terminaram com sucesso. Publicados o mapa do colo, as fichas das 27 UFs e o manifesto com versão `0.1.0+ddbacb4`; a Tendência usa 2015–2024.

O relatório versionado está em `pipeline/references/sim-c55-validation.json`: **64.304 células**, **67.188 pontos de série**, **36 fallbacks nacionais** e **5 células sem proporção calculável**. Elas correspondem a um C55 cada: Mossoró e São Paulo, 10–14 anos em 2015; Rio de Janeiro, idade ignorada em 2020; Ubiratã, 10–14 em 2021; Macapá, 15–19 em 2023. Esses casos ficam sinalizados, sem inventar proporção, e afetam também os territórios que os incluem. O contexto nacional fica com “ajuste não calculável”, sem classe de Tendência. O sucesso da conferência de integridade não significa ajuste calculável em todas as células.

A amostra original de C53 em 2022 manteve contagens exatas e taxas dentro de ±3% do Atlas, sem mudar referências ou tolerâncias. A auditoria também confirmou igualdade dos demais tipos de mortalidade e dos outros indicadores com a publicação anterior, além da concordância entre mapa e ficha nos 5.571 municípios. A metodologia registra os resultados e não atribui à pesquisa inicial comprovação de efeito na classe da Tendência.

Após a exportação real, os 20 testes do site passaram novamente (incluindo build), e o Astro check permaneceu sem erros, avisos ou hints. As cinco fichas afetadas foram inspecionadas no HTML gerado e exibem o aviso e a nota obrigatória.

Commit final, que inclui esta resolução e os JSON: `feat: publish validated C55-adjusted mortality series`.
