# 22: Dados abertos na GitHub Release

**What to build:** qualquer pessoa pode baixar os agregados completos do observatório. Cada versão dos dados vira uma GitHub Release com Parquet e CSV, e o site linka o download. Os arquivos permitem reconstruir o site sem rodar o pipeline. Referência: spec, seções 2 e 15.

**Blocked by:** 04 — Até 60 dias × Todos pinta o mapa em Tendência

**Status:** resolved

- [x] O passo de exportar gera Parquet e CSV completos de cada indicador publicado
- [x] Cada arquivo identifica a fonte, o período e as condições de reutilização, e lembra que quem citar o observatório deve citar as fontes originais
- [x] Um comando publica os arquivos como assets de uma Release versionada (< 2 GiB por arquivo)
- [x] O site tem uma página ou seção de download com links para a Release atual e as condições de cada fonte
- [x] Um teste mostra que é possível regenerar os JSON do site a partir dos arquivos da Release


## Comments

- `98c4ee0` — exportação completa por indicador em CSV e Parquet, com fonte, período, condições e citação; comandos de publicação versionada e reconstrução; links e documentação de downloads. O teste reconstrói todos os JSON e a malha publicados a partir de cada formato, sem insumos brutos ou recálculo.
- Commit de conclusão `test: avoid oversized fixtures and close open data ticket` (este commit): teste do limite usa dois bytes e limite reduzido, preservando a verificação da fronteira sem consumir cota lógica de 2 GiB. Revisões independentes de padrões e spec concluídas; a única pendência apontada foi este fechamento do ticket.
- Publicação real não executada: o comando está implementado e testado com o transporte GitHub simulado. A primeira Release depende de execução pelo mantenedor autenticado.
- Validação final: 167 testes Python e 87 testes do site passaram, incluindo build estático; mypy e Astro check sem erros. Temporários das suítes direcionados ao disco do repositório devido à cota de /tmp.
