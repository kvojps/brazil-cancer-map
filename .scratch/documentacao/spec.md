# Spec — Documentação por público

Registro das decisões tomadas em 06/11/2026 na sessão de `/grill-with-docs`. Este esforço troca o README único por um hub com guias por público e tira do `.scratch` o que o repositório precisa manter, para que os esforços concluídos possam ser apagados. Os tickets estão em `issues/`.

## Problema

O `README.md` tem 270 linhas sem separação por público: mistura setup, detalhes de método, operação e formato dos dados abertos. Partes do que o repositório precisa saber moram só no `.scratch`, que é apagado ao fim de cada esforço.

## Estrutura final

```
README.md                 hub com menos de 80 linhas
docs/
  development.md          dev: setup do zero, testes, deploy, contribuição
  data-update.md          mantenedor: atualização, revisão e publicação
  reproducibility.md      pesquisador: dados abertos, níveis de verificação, formato, citação
  data-sources.md         referência por fonte: insumos, pré-requisitos, validações, calendário
  spec.md                 spec viva, com a numeração de seções atual
  ui-contract.md          decisões de UI que os testes usam como contrato
  adr/                    decisões difíceis de reverter
  data/                   registros atuais e evidências do método
  validation/             auditoria de acessibilidade
site/browser-tests/README.md   continua, linkado do development.md
```

Os nomes de arquivo ficam em inglês e o conteúdo em português (`AGENTS.md`).

## Regras

1. **Nada fora do `.scratch` cita o `.scratch`.** Só arquivos do próprio `.scratch` citam uns aos outros. Nenhum documento aponta para a tag de arquivo: spec e ADRs trazem a justificativa no próprio texto, e as evidências necessárias são copiadas, não linkadas.
2. **Única exceção à regra 1:** `AGENTS.md` e `docs/agents/` podem nomear a convenção do tracker (a pasta `.scratch/<esforço>/`), nunca o caminho de um esforço ou arquivo específico.
3. **Os guias não repetem método.** Fórmulas, classes de Tendência, Referências e ressalvas ficam só em `/metodologia/`, e conceitos só no `GLOSSARY.md`. Limiares operacionais, como as faixas de validação do POPSVS, ficam em `data-sources.md`. O que hoje está só no README e é método vai para a metodologia.
4. **Só se documenta como garantido o que foi executado.** O que veio da leitura do código é marcado como tal.
5. **Critério do que migra:** entra em `docs/` o que um leitor futuro precisa para operar, verificar ou entender uma decisão vigente. O resto fica só na tag `archive/scratch`.
6. **Vocabulário:** **Fonte** é o provedor oficial; `source`, em código, é a unidade do pipeline. Ver `GLOSSARY.md`.

## Decisões por tema

### Públicos

- Organização por público, sem `pipeline/README.md` nem `site/README.md`.
- Quem só quer os dados é a primeira seção do `reproducibility.md`, com link direto no README raiz. O README mantém a seção "Dados abertos", preservando a âncora `#dados-abertos`.

### Níveis de reprodução

1. **Verificar:** baixar a Release e reconstruir os JSON idênticos, sem recalcular.
2. **Recalcular:** a partir do estado limpo daquela versão, refazer `compute`, `validate` e `export`.
3. **Refazer da origem:** baixar as fontes hoje e rodar tudo. Os resultados podem diferir, porque as fontes regravam dados, e a comparação passa a ser com as referências oficiais.

Só os níveis 1 e 2 prometem igualdade, e o nível 2 só no que o ticket 01 comprovar, por fonte.

### Lacunas conhecidas

- A Release `data-2026-11-05` tem 18 assets CSV/Parquet e nenhum `state-*.tar.gz`, então o nível 2 e a retomada não funcionam com ela.
- O manifesto publicado traz `pipeline_version: 0.1.0+df740cd-dirty`.
- Os guias descrevem essa situação real, com o nível 2 "disponível a partir da próxima Release". O ticket 11 resolve.
- `update` sempre roda `download`, e `run --step compute` usa caminhos fixos. O caminho do nível 2 é, num clone novo: `restore-state --output data/clean`, depois `run --step compute`, `validate` e `export`, comparando com `git diff`. O `pipeline_version` muda de qualquer forma.
- Se o ticket 01 mostrar diferença nos números, ela é registrada no ticket 11. O pipeline não é corrigido neste esforço.

### Correções em material existente

- `metodologia.astro:182` manda rodar `run --source hpv --step download --year 2020`, que o CLI rejeita.
- `metodologia.astro:251` e `docs/data/hpv-benchmark.md` falam em medição de CI pendente, mas o workflow foi removido.
- `download-hpv.sh` usa o comando rejeitado e é removido.
- `[versão]` nos modelos de citação da metodologia passa a significar a **Versão de dados** (`data-2026-11-05`).

### Spec viva

`docs/spec.md` substitui a spec do MVP e mantém a numeração das seções, para as menções "spec, section N" no código continuarem válidas. As divergências são corrigidas no próprio texto:

- atualização manual no lugar de Actions agendado;
- hospedagem em Cloudflare Workers no lugar de Pages;
- 5.571 municípios no lugar de 5.570: Boa Esperança do Norte (MT, 510183) foi instalado em 2025.

Citações de ticket saem, trocadas por link para ADR quando houver. O `AGENTS.md` passa a dizer que, em divergência, vale o ADR mais recente.

A §17 registra as dívidas conhecidas, com números e decisões já tomadas:

- redução de tamanho: 999.530.479 bytes de saída e 1.369.414 bytes gzip na primeira visita local, contra as metas de 30 MB e cerca de 1,3 MB, com a direção aceita de páginas compartilhadas;
- sessão humana de acessibilidade;
- revisão clínica das Ações: o código registra `reviewer: null`, e o site a trata como pendente. `reviewer` não é preenchido sem nome, data e versão reais.

### ADRs

Seis, e outros só com aviso antes de criar:

1. Site estático com JSON commitados, sem backend.
2. Tendência em variação percentual relativa, com faixa de ±1% em todos os indicadores.
3. Valor, Situação e Tendência dos 60 dias usando só quimio e radio.
4. HPV com agregados oficiais do Ministério, e microdados só como auditoria.
5. Denominadores: POPSVS revisto, e Censo 2022 fixo no HPV.
6. Atualização manual local no lugar do agendamento em Actions.

### README raiz

Nesta ordem: nome, subtítulo e link do site; aviso "em construção", que sai junto com a faixa do site; o que é, com os quatro Eixos, o diferencial e "não é orientação médica individual"; diagrama `fontes → pipeline → Contrato de dados → site`; tabela "por onde começar"; "Dados abertos", com a última Release e como citar; licenças.

### Citação

O README e o `reproducibility.md` trazem só o modelo de citação do Observatório, com link para os modelos por Fonte em `/metodologia/#reutilizacao-e-citacao`. Sem `CITATION.cff` nem DOI por enquanto.

### Node

O guia recomenda Node 24, usado no CI e no deploy, e cita `>=22.23.4` como mínimo declarado. A configuração não muda.

### Canal externo e tracker

- GitHub Issues é o canal para quem está de fora, citado no README e nos guias. O que precisar de trabalho vira ticket no `.scratch`.
- `development.md` tem a seção "Contribuir", com as licenças por parte alterada e sem CLA. Sem `CONTRIBUTING.md` nem templates de issue.
- O `.scratch` continua sendo o tracker. Cada esforço é excluído ao terminar, depois de registrar suas decisões no repositório.
- O `AGENTS.md` ganha duas regras: mudança em comando do CLI, fluxo de atualização ou pré-requisito atualiza o guia no mesmo commit; e o ciclo de vida do tracker.

## Limites deste esforço

O agente não faz:

- rodar `release`, fazer push ou criar issues;
- apagar o `.scratch` ou mexer nos tickets dos esforços anteriores;
- preencher `reviewer`;
- corrigir o pipeline ou refatorar código: no código só mudam comentários;
- rodar a carga completa das fontes.

## Entrega

Commits locais na `main`, um por ticket. O push é do responsável, que também cria a tag `archive/scratch` e apaga os esforços depois de conferir a tabela do ticket 02.

## Comments
