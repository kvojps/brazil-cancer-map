# 06: Guia do dev

**What to build:** uma pessoa que nunca viu o projeto sai do clone ao site rodando seguindo só `docs/development.md`, e sabe quando precisa (ou não) do pipeline. Referência: [spec](../spec.md), "Node" e "Canal externo e tracker".

**Blocked by:** 04 — Spec viva e ADRs

**Status:** resolved

- [x] Pré-requisitos com versões: Python 3.14, uv e Node 24 recomendado (`>=22.23.4` declarado), mais Chromium só onde é preciso
- [x] O caminho curto vem primeiro: só o site, sem pipeline, porque os JSON estão commitados
- [x] O caminho completo avisa o tamanho real em `data/` (cerca de 4 GB), a saída do build (cerca de 1 GB) e o limite de memória do Node quando importar
- [x] Testes: o que `pytest`, `mypy`, `npm run check`, `npm test`, `test:browser` e `test:a11y` cobrem, o que o CI roda e link para `site/browser-tests/README.md`
- [x] Arquitetura: a fronteira `pipeline/` ↔ `site/` pelo Contrato de dados, o protocolo `Source` e como adicionar uma `source`
- [x] O deploy (Cloudflare Workers) sai do README e entra aqui
- [x] Seção "Contribuir": idioma, glossário, tracker, GitHub Issues como canal externo, licenças por parte alterada, sem CLA
- [x] O guia foi seguido do zero em clone limpo, com os comandos executados, e o que falhou foi corrigido no texto

## Comments


### Resultado (06/11/2026)

Criado `docs/development.md`, com caminho curto do site antes do pipeline,
testes e CI, arquitetura, protocolo `Source`, deploy e contribuição. O README
passa a apontar para o guia no lugar dos comandos de publicação.

Verificação em clone local limpo, sem estado ou dependências herdados: instalação
dos dois projetos Node e do ambiente Python, lista do CLI, servidor dev com HTTP
200, tipos do site sem diagnósticos, mypy em 48 arquivos, 173 testes Python,
87 testes Node, 84 testes de acessibilidade e build estático de 5.574 páginas. O guia registra versões,
limites e as correções descobertas na execução: servidores em segundo plano,
portas escolhidas pelo Astro e build interno de `npm test`. Não foram executados
carga completa das Fontes, deploy ou a suíte completa de navegador.

Revisão em dois eixos pela skill `code-review`, base `cc96bf7`: Standards sem
achados; Spec sem lacunas bloqueantes. TDD não se aplica à mudança documental.

Resolvido pelo commit `docs: add developer guide`.
