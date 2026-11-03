# 11: Busca e navegação do mapa até a ficha

**What to build:** o cidadão encontra o seu município pela busca ou clicando no mapa. O mapa aproxima no estado, contorna o município e abre a ficha ao lado (embaixo, no celular), e o endereço passa a apontar para o município. Referência: spec, seção 11.1.

**Blocked by:** 10 — Ficha do Meu município com o cartão do 60 dias

**Status:** resolved

- [x] A busca de município aceita nomes sem acento e com a UF para desambiguar, e funciona pelo teclado
- [x] Clicar ou buscar aproxima o mapa no estado, contorna o município e abre a ficha ao lado; no celular, embaixo
- [x] A camada da ficha da UF só é carregada quando o mapa aproxima no estado
- [x] O município fica no caminho da URL (`/municipio/<slug>/`), preservando indicador, tipo e modo na query string; abrir o link direto mostra o mesmo estado
- [x] Fechar a ficha volta ao mapa sem perder o estado

## Comments

- Implementado em `cf04410` — busca sem acentos com UF e teclado, seleção no mapa com aproximação na UF e contorno, ficha responsiva com carregamento da UF sob demanda, URL compartilhável e fechamento preservando filtros e enquadramento.
- Validação: `npm run check --prefix site` sem diagnósticos e `npm test --prefix site` com 11 testes aprovados, incluindo build e páginas estáticas. Revisão em dois eixos contra `546320e`: sem desvios funcionais; fechamento deste ticket conclui a pendência documental.
