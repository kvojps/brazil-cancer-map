# 08: Guia do pesquisador

**What to build:** quem quer usar ou conferir os números baixa os dados, entende os arquivos e sabe exatamente até onde a reprodução é garantida, seguindo só `docs/reproducibility.md`. Referência: [spec](../spec.md), "Públicos", "Níveis de reprodução", "Lacunas conhecidas" e "Citação".

**Blocked by:** 01 — Provar a reprodução; 03 — Corrigir o material público; 05 — Referências e evidências

**Status:** resolved

- [x] A primeira seção serve quem só quer os dados: onde baixar, qual arquivo traz qual Indicador, sem exigir Python
- [x] O formato dos arquivos migra do README: colunas `file`, `path`, `value`, `source`, `period`, `conditions` e `citation`, e como ler o `manifest.json`
- [x] Os três níveis estão descritos, com os comandos e o resultado por `source` do ticket 01
- [x] As lacunas da Release atual aparecem como são: sem estado e com `-dirty`, e o nível 2 "disponível a partir da próxima Release"
- [x] Há um mapa das validações: o que cada arquivo de `pipeline/references/` confere e com que tolerância
- [x] O guia aponta para `/metodologia/` em fórmulas e ressalvas, sem repetir método, e para as evidências em `docs/data/`
- [x] Como citar: modelo do Observatório com a Versão de dados e link para os modelos por Fonte
- [x] Como reportar erro nos dados: GitHub Issues
- [x] Os comandos do nível 1 foram seguidos a partir do guia

## Comments


### Conclusão (06/11/2026)

Resolvido pelo commit `docs: add researcher reproducibility guide` (este commit).

Criado `docs/reproducibility.md`, com acesso direto aos dados, tabela de arquivos e colunas, manifesto, níveis de reprodução, resultados por `source`, lacunas da Release atual, mapa das referências, evidências, citação e canal de erros. A descrição das colunas no README foi substituída por link para o guia.

O primeiro bloco Bash foi extraído do guia e executado integralmente na raiz do repositório: download em pasta temporária vazia, restauração de Parquet e CSV, duas saídas `48 files, 0 differ` e nenhuma diferença entre os formatos. Não foram baixados insumos das Fontes nem alterados os JSON publicados. A prova do nível 2 foi documentada a partir do ticket 01; não foi repetida aqui e continua sem estado na Release pública.

Revisão com a skill `code-review`, em dois agentes independentes sobre a base `ce7d205`: Spec sem achados; Standards apontou duplicação dos limites já presentes no guia de Fontes. Os números foram mantidos porque este ticket exige explicitamente as tolerâncias por arquivo; o texto aponta para a referência operacional em `data-sources.md`. Nenhum problema restante de implementação identificado.

Verificação final: `uv run mypy` aprovado em 48 arquivos; `npm run check --prefix site` sem erros, avisos ou hints; `uv run pytest` com 173 aprovados e 274 avisos de separação perfeita do statsmodels; `npm test --prefix site` com 87 aprovados (inclui build). A suíte do site foi repetida fora do sandbox após `spawnSync npm EPERM`; uv e download também exigiram acesso fora do sandbox. Links Markdown locais e `git diff --check` aprovados. Suíte de navegador não executada nesta mudança documental. TDD não aplicado por se tratar apenas de documentação; a verificação funcional foi a execução do guia.
