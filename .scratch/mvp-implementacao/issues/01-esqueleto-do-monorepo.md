# 01: Esqueleto do monorepo e requisitos de licença

**What to build:** o repositório passa a ter a estrutura de execução da spec: um `pipeline/` em Python, acionado por `python -m pipeline run` (que também roda uma fonte ou etapa por vez), e um `site/` em Astro com saída estática. O CI roda os testes do pipeline e o build do site. O `AGENTS.md` da execução orienta os agentes e aponta para a spec, o glossário e a estrutura. Os requisitos de licença ficam cumpridos desde o início. Referência: [spec do MVP](../../mapa-cancer-br/spec-mvp.md), seções 2, 13, 14 e 17.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [x] `python -m pipeline run` existe, lista as etapas (baixar, limpar, calcular, validar, exportar) e aceita rodar uma fonte ou etapa isolada
- [x] `pipeline/` tem uma suíte de testes que roda no CI
- [x] `site/` gera saída estática com `astro build`, e o CI roda o build
- [x] O dado bruto (`data/raw/`) e o intermediário (`data/clean/`) ficam fora do git
- [x] O `AGENTS.md` mantém a configuração de skills atual e ganha a orientação da execução: links para a spec, o `GLOSSARY.md` e a estrutura `pipeline/` + `site/`, além da regra de que o front não faz conta estatística
- [x] Arquivo `LICENSE` com o texto da AGPL-3.0; README declara `AGPL-3.0-or-later` para o código, CC BY-SA 4.0 para os textos e as condições de cada fonte para os dados
- [x] O rodapé do site tem link para o código-fonte
