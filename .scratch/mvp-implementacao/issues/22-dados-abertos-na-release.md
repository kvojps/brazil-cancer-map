# 22: Dados abertos na GitHub Release

**What to build:** qualquer pessoa pode baixar os agregados completos do observatório. Cada versão dos dados vira uma GitHub Release com Parquet e CSV, e o site linka o download. Os arquivos permitem reconstruir o site sem rodar o pipeline. Referência: spec, seções 2 e 15.

**Blocked by:** 04 — Até 60 dias × Todos pinta o mapa em Tendência

**Status:** ready-for-agent

- [ ] O passo de exportar gera Parquet e CSV completos de cada indicador publicado
- [ ] Cada arquivo identifica a fonte, o período e as condições de reutilização, e lembra que quem citar o observatório deve citar as fontes originais
- [ ] Um comando publica os arquivos como assets de uma Release versionada (< 2 GiB por arquivo)
- [ ] O site tem uma página ou seção de download com links para a Release atual e as condições de cada fonte
- [ ] Um teste mostra que é possível regenerar os JSON do site a partir dos arquivos da Release
