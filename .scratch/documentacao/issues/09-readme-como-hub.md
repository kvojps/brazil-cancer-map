# 09: README como hub

**What to build:** quem chega ao repositório entende o projeto em um minuto, vê que os números ainda não passaram por validação completa e encontra o guia certo para o que quer fazer. Referência: [spec](../spec.md), "README raiz" e "Citação".

**Blocked by:** 06 — Guia do dev; 07 — Guia do mantenedor; 08 — Guia do pesquisador

**Status:** resolved

- [x] O README tem menos de 80 linhas, com as seções na ordem da spec
- [x] O aviso "em construção" mantém o sentido do texto da faixa do site
- [x] O texto deixa claro que não é orientação médica individual
- [x] A tabela "por onde começar" leva aos três guias e à metodologia
- [x] A âncora `#dados-abertos` continua existindo, e a metodologia passa a apontar para `docs/reproducibility.md` onde hoje diz "README"
- [x] As licenças da spec §2 estão presentes
- [x] Todo o conteúdo removido do README foi conferido: tem destino em guia, referência ou metodologia
- [x] Todos os links relativos dos novos documentos resolvem

## Comments


### Conclusão (06/11/2026)

Resolvido pelo commit `docs: turn README into documentation hub` (este commit).

README reorganizado em 46 linhas na ordem da spec, com aviso igual ao da faixa,
quatro Eixos, orientação geral, diagrama do Contrato de dados, caminhos por público,
Dados abertos, citação e licenças. A âncora `#dados-abertos` foi preservada.
As duas menções da metodologia ao README passam ao guia do pesquisador;
o benchmark HPV aponta ao guia do mantenedor.

Conferência do conteúdo removido: setup, estrutura e testes estão em
`docs/development.md`; atualização, publicação e auditoria em `docs/data-update.md`;
arquivos e restauração em `docs/reproducibility.md`; insumos, cache, validações
e referências em `docs/data-sources.md`; fórmulas e ressalvas na metodologia.
Foram preservados nesta mudança os detalhes da API populacional na referência
por Fonte e a opção `--repository` e o limite de assets no guia do mantenedor.

Revisão pela skill `code-review`, em dois agentes independentes, base
`8410757`: Standards sem achados; Spec identificou a falta da opção
`--repository`, corrigida antes do commit. TDD não aplicado por ser mudança
documental, sem comportamento novo.

Verificação: 119 links relativos de arquivos no README e em `docs/` resolvem;
README com menos de 80 linhas; `git diff --check` aprovado. `uv run mypy`:
48 arquivos sem problemas; Astro check: 71 arquivos sem erros, avisos ou hints;
`uv run pytest`: 173 aprovados, com 274 avisos de separação perfeita;
`npm test --prefix site`: 87 aprovados, incluindo build. A suíte do site foi
repetida fora do sandbox após `spawnSync npm EPERM`; uv exigiu acesso ao cache
fora do sandbox. Suíte de navegador não executada nesta mudança documental.
