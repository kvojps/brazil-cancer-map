# Evidências da verificação #51

Contexto, revisão, comandos, matriz e interpretação:
[relatório integrado](../mobile-navigation-integrated.md).

| Arquivo | Conteúdo e limite |
| --- | --- |
| `check.log`, `build.log`, `node.log` | Tipos, build explícito e suíte Node final (inclui outro build sequencial). |
| `browser.log` | Suíte completa: 401 aprovações e uma falha na preparação das referências geográficas. |
| `mesh-isolated.log` | Uma repetição isolada aprovada; não apaga a falha do conjunto nem comprova sua causa. |
| `axe-summary.json` | Resumo dos 24 relatórios axe: ambiente, URL, data, violações e IDs/alvos inconclusivos. Os relatórios completos de 79 MiB ficam locais em `/tmp/51-a11y`, regeneráveis pelo comando documentado. |
| `search-attempts.json`, `canvas-attempts.json` | Séries finais, registros por tentativa e três cenários; métricas públicas de foco/geometria/rolagem/URL e respostas municipais. |
| `preparation-attempts.json`, `preparation-directory.png` | Primeira execução inválida por saída em reconstrução: duas falhas e 38 aprovações. A imagem mostra a listagem de diretório recebida na primeira falha. |
| `canvas-preparation-attempts.json` | 40 percursos aprovados, mas cache municipal não assegurado em toda a série: 11 de 20 tentativas quentes buscaram novos recursos. Não entra no denominador final. |
| `search-preparation-attempts.json` | 40 percursos aprovados antes das asserções finais explícitas de filtros fechados/cache. Não entra no denominador final. |

`warm` significa dados preparados na mesma visita; conferir respostas registradas
para comprovar a reutilização. Não equivale a cache de disco nem à rede publicada.
Campos e nomes dos cenários são saída técnica do roteiro em inglês; a análise
em português fica no relatório. Capturas de falhas novas são geradas pelo roteiro.
