# 08: Guia do pesquisador

**What to build:** quem quer usar ou conferir os números baixa os dados, entende os arquivos e sabe exatamente até onde a reprodução é garantida, seguindo só `docs/reproducibility.md`. Referência: [spec](../spec.md), "Públicos", "Níveis de reprodução", "Lacunas conhecidas" e "Citação".

**Blocked by:** 01 — Provar a reprodução; 03 — Corrigir o material público; 05 — Referências e evidências

**Status:** ready-for-agent

- [ ] A primeira seção serve quem só quer os dados: onde baixar, qual arquivo traz qual Indicador, sem exigir Python
- [ ] O formato dos arquivos migra do README: colunas `file`, `path`, `value`, `source`, `period`, `conditions` e `citation`, e como ler o `manifest.json`
- [ ] Os três níveis estão descritos, com os comandos e o resultado por `source` do ticket 01
- [ ] As lacunas da Release atual aparecem como são: sem estado e com `-dirty`, e o nível 2 "disponível a partir da próxima Release"
- [ ] Há um mapa das validações: o que cada arquivo de `pipeline/references/` confere e com que tolerância
- [ ] O guia aponta para `/metodologia/` em fórmulas e ressalvas, sem repetir método, e para as evidências em `docs/data/`
- [ ] Como citar: modelo do Observatório com a Versão de dados e link para os modelos por Fonte
- [ ] Como reportar erro nos dados: GitHub Issues
- [ ] Os comandos do nível 1 foram seguidos a partir do guia

## Comments
