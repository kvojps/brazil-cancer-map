# 06: Guia do dev

**What to build:** uma pessoa que nunca viu o projeto sai do clone ao site rodando seguindo só `docs/development.md`, e sabe quando precisa (ou não) do pipeline. Referência: [spec](../spec.md), "Node" e "Canal externo e tracker".

**Blocked by:** 04 — Spec viva e ADRs

**Status:** ready-for-agent

- [ ] Pré-requisitos com versões: Python 3.14, uv e Node 24 recomendado (`>=22.23.4` declarado), mais Chromium só onde é preciso
- [ ] O caminho curto vem primeiro: só o site, sem pipeline, porque os JSON estão commitados
- [ ] O caminho completo avisa o tamanho real em `data/` (cerca de 4 GB), a saída do build (cerca de 1 GB) e o limite de memória do Node quando importar
- [ ] Testes: o que `pytest`, `mypy`, `npm run check`, `npm test`, `test:browser` e `test:a11y` cobrem, o que o CI roda e link para `site/browser-tests/README.md`
- [ ] Arquitetura: a fronteira `pipeline/` ↔ `site/` pelo Contrato de dados, o protocolo `Source` e como adicionar uma `source`
- [ ] O deploy (Cloudflare Workers) sai do README e entra aqui
- [ ] Seção "Contribuir": idioma, glossário, tracker, GitHub Issues como canal externo, licenças por parte alterada, sem CLA
- [ ] O guia foi seguido do zero em clone limpo, com os comandos executados, e o que falhou foi corrigido no texto

## Comments
