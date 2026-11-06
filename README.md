# Observatório do Câncer no Brasil

Dados sobre o câncer no seu município, para entender e agir.

**Site:** <https://brazil-cancer-map.kvojps.workers.dev>

> **Em construção.** Este site ainda está sendo desenvolvido e os números não passaram por uma validação completa: podem conter erros e mudar.

## O que é

Um mapa dos 5.571 municípios brasileiros que reúne quatro Eixos: **Prevenção, Detecção precoce, Acesso ao tratamento e Panorama**. Liga cada Indicador a uma Ação concreta e permite entender a Situação e a Tendência no seu município, com as limitações dos dados à vista. É informação e orientação geral; **não é orientação médica individual**.

```text
Fontes → pipeline → Contrato de dados → site
```

O pipeline calcula e valida; o site estático exibe os JSON prontos em `site/public/dados/`.

## Por onde começar

| Quero… | Onde ir |
|---|---|
| Rodar o projeto, testar ou contribuir | [Guia de desenvolvimento](docs/development.md) |
| Atualizar, revisar e publicar dados | [Guia do mantenedor](docs/data-update.md) |
| Baixar, verificar ou reproduzir os números | [Guia do pesquisador](docs/reproducibility.md) |
| Entender cálculos, Fontes e limitações | [Metodologia](https://brazil-cancer-map.kvojps.workers.dev/metodologia/) |

Para relatar erros ou propor mudanças, abra uma [GitHub Issue](https://github.com/kvojps/brazil-cancer-map/issues).

## Dados abertos

[Baixar a última Release](https://github.com/kvojps/brazil-cancer-map/releases/latest), em CSV ou Parquet, sem precisar rodar o pipeline. Veja os [arquivos e níveis de reprodução](docs/reproducibility.md), incluindo os limites da versão publicada.

Como citar o Observatório (substitua a Versão de dados pela que utilizou):

> Observatório do Câncer no Brasil. Dados abertos, Versão de dados `data-2026-11-05`. Disponível em: https://github.com/kvojps/brazil-cancer-map/releases/tag/data-2026-11-05. Acesso em: [data de acesso].

Cite também as Fontes originais, conforme os [modelos por Fonte e condições de reutilização](https://brazil-cancer-map.kvojps.workers.dev/metodologia/#reutilizacao-e-citacao).

## Licenças

- **Código:** [AGPL-3.0-or-later](LICENSE).
- **Textos do projeto** (Ações, metodologia, notas, ressalvas e glossário): [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/deed.pt-br), com atribuição ao Observatório do Câncer no Brasil.
- **Dados:** os dados de terceiros seguem as condições de cada Fonte; os arquivos gerados pelo pipeline não são cobertos pela licença do código. A metodologia e cada arquivo exportado identificam Fonte, período e condições de reutilização. Cite o Observatório e as Fontes originais.

Contribuições entram sob a licença da parte alterada, sem CLA.
