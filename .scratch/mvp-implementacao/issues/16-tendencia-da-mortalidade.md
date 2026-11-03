# 16: Tendência da mortalidade (SIM)

**What to build:** o eixo Panorama ganha a Tendência da mortalidade padronizada por idade, para Todos e os 5 tipos. Ela pinta o mapa só em modo Tendência e não tem Situação. Referência: spec, seções 4, 5, 6.2, 7, 10 e 11.

**Blocked by:** 10 — Ficha do Meu município com o cartão do 60 dias; 13 — Denominador POPSVS no pipeline

**Status:** ready-for-agent

- [ ] O pipeline baixa os `DOBR<ano>.dbc` de 2014–2024 (sem os preliminares) e usa residência e causa básica
- [ ] "Todos" é C00–C97 sem C44; mama C50 (mulheres), colo C53, próstata C61, pulmão C33–C34, colorretal C18–C21 (o ajuste do C55 vem no ticket 17)
- [ ] Padronização direta pela população mundial de Segi/Doll, faixas quinquenais de 0–4 a 75–79 e 80+
- [ ] Tendência por quasi-Poisson com offset; mínimo e cascata contam os óbitos
- [ ] O indicador pinta o mapa só em modo Tendência; o seletor não oferece "como está hoje" para ele
- [ ] O cartão não tem Situação, mostra a Tendência do Brasil como contexto e as metas de mama (−10%) e colo (−20%, 30–69) só como texto; a Ação aprovada da mortalidade remete aos caminhos de prevenção e cuidado do tipo
- [ ] A validação compara contagens exatas e taxas (±3%) com o Atlas do INCA, considerando o POPSVS revisto; se falhar, o SIM não é publicado
- [ ] A metodologia ganha a seção da mortalidade, com os pesos e a fórmula, e as limitações C26, R00–R99 e C76–C80
