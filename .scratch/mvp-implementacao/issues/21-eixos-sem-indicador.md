# 21: Eixos sem indicador e Ações por tipo

**What to build:** nenhum eixo da ficha fica vazio. Quando o tipo de câncer não tem indicador num eixo, a ficha explica por que e oferece a Ação alternativa. Referência: spec, seções 5 e 10.3.

**Blocked by:** 10 — Ficha do Meu município com o cartão do 60 dias

**Status:** resolved

- [x] Detecção precoce de próstata e pulmão: "Conheça os sinais e saiba quando procurar avaliação", com link oficial do tipo
- [x] Detecção precoce de colorretal: "Conheça os sinais e pergunte na UBS sobre a indicação e a disponibilidade de exames de rastreamento"; o FIT só nos detalhes, sem prometer oferta local
- [x] Prevenção de mama, próstata e colorretal: fatores de risco, explicando que reduzir riscos não garante evitar o câncer
- [x] Em "Todos", as orientações ficam organizadas por tipo, sem uma recomendação única de exame
- [x] Cada eixo sem indicador mostra a justificativa (por exemplo, sem rastreamento organizado com indicador aberto)
- [x] Todo o conteúdo entra no registro de Ações com os campos de revisão da seção 10.4


## Comments

Implementado no commit `feat: add cancer-specific actions for axes without indicators` (este commit). A ficha mostra justificativas e Ações de detecção precoce e prevenção por tipo, inclusive em Todos, e mantém a orientação aprovada de tabagismo enquanto o indicador não está disponível. O registro contém fontes oficiais, data de conferência, público, critérios, exceções e campos de revisão. Os detalhes clínicos, incluindo o FIT, ficam condicionados à revisão profissional; não há promessa de oferta local.

Validação: `npm run check --prefix site` sem erros ou avisos; 22 testes do site passaram, incluindo o build estático. Conferência da ficha gerada confirmou conteúdo nos dois eixos para as seis seleções e o bloqueio dos detalhes clínicos sem revisão. A primeira execução da suíte foi bloqueada pelo sandbox (EPERM ao iniciar o build); a reexecução autorizada passou.

Revisão pela skill `code-review`: padrões — nenhuma violação, um apontamento leve de duplicação nos dois blocos de renderização, mantidos locais por serem pequenos; spec — nenhum achado. A revisão profissional dos textos permanece requisito antes da publicação.
