# 14: Mamografia (SISCAN)

**What to build:** o mapa e a ficha ganham a razão de mamografias de rastreamento em mulheres de 50–69, no eixo Detecção precoce, para mama e Todos. Referência: spec, seções 4, 5, 6.1, 7, 9, 10 e 11.

**Blocked by:** 10 — Ficha do Meu município com o cartão do 60 dias; 13 — Denominador POPSVS no pipeline

**Status:** ready-for-agent

- [x] O pipeline baixa o SISCAN e processa os CSVs um arquivo por vez, em fluxo, pelo DuckDB, apagando o bruto
- [x] A razão é exames de rastreamento ÷ (mulheres de 50–69 ÷ 2), 2016–2025, por município de residência
- [x] Tendência por quasi-Poisson com offset de população; mínimo e cascata contam o numerador
- [x] Referência = razão 1 ("meta"), com as 3 faixas de Situação e a nota de valor acima do esperado
- [ ] O indicador pinta o mapa nos dois modos, para mama e Todos, e entra no seletor e na tabela de combinações válidas
- [x] O cartão da ficha explica 50–69 vs 50–74 (NT 626/2025) e traz a Ação aprovada da mamografia
- [x] A validação confere a faixa plausível e a presença dos municípios; se falhar, o SISCAN não é publicado
- [x] A metodologia ganha a seção da mamografia

## Comments

### 2026-11-03 — implementação concluída; carga inicial parcial

Por solicitação do responsável, a carga desta sessão deve parar assim que 2019
terminar. O ticket **continua aberto**: os critérios marcados registram código
implementado e testado, não uma publicação completa da série real 2016–2025.

**Resolvido no código:**

- Fonte `siscan` registrada no CLI; download, redução anual pelo DuckDB, remoção
  do CSV após sucesso e cache dos agregados por tamanho/data remotos.
- Cabeçalho real conferido no FTP e código `CO_IND_CLINICA=02` confirmado em
  `INDICLINIC.CNV`, no `TAB_SISCAN.rar` oficial. Sexo F, idades inclusivas 50–69,
  ano de competência e município de residência; variantes PACNT não entram.
- Razão, Tendência, mínimo por numerador, cascata, série compartilhada por região,
  contexto estadual, Referência 1 e faixas de Situação implementados. Consulta
  populacional em lote centralizada em `Population.get_many`, preservando a
  regra de fallback apenas quando falta o ano inteiro e a história municipal.
- Nota para razão acima de 2 e bloqueio fora de 0–10: limites operacionais
  explícitos na metodologia, sem cortar valores. Exportação isolada também
  valida e preserva os indicadores de outras fontes nos arquivos das fichas.
- Seletor, combinações válidas de mama/Todos nos dois modos, formatação de razão,
  tabela, tooltip e troca de legenda preparados para os JSONs do SISCAN.
- Cartão com barra contra a meta, série, origem e Ação curta aprovada; nota
  obrigatória de 50–69 versus 50–74 e metodologia implementadas. Detalhes
  clínicos novos ficam ocultos enquanto a revisão profissional não for registrada.

**Estado dos dados locais:**

- POPSVS real de 2016–2025 baixado, limpo e validado nesta sessão em
  `data/clean/popsvs/population.parquet`.
- Agregados SISCAN de **2016–2019 concluídos**. Interrupção automática após a
  limpeza de 2019; nenhum ano posterior processado e diretório bruto vazio.
  Contagens dos exames filtrados, antes de excluir residências fora da malha:
  2016 = 1.334.415; 2017 = 1.686.704; 2018 = 1.778.484; 2019 = 1.933.952.
  A transferência de 2019 levou 1.087 segundos, com quatro trechos do mesmo
  CSV em paralelo e retomadas por trecho na carga local desta sessão.
- Agregados e metadados ficam em `data/clean/siscan/exams/<ano>.parquet` e
  `<ano>.json`; são locais, ignorados pelo Git. CSVs concluídos são removidos.
- Nenhum JSON real de mamografia foi exportado. A presença da opção no seletor
  **ainda não entrega uma camada carregável**, por isso o critério do mapa segue
  desmarcado. As fichas mostram a indisponibilidade dos dados de mamografia.

**Falta para fechar o ticket:**

- [ ] Baixar e reduzir os anos reais 2020–2025, reaproveitando os agregados anteriores.
- [ ] Calcular a série real completa 2016–2025 e passar pela validação de razões,
  séries e cobertura dos 5.571 municípios da malha IBGE 2025 publicada no projeto.
- [ ] Exportar e commitar `map/mammography/{all,breast}.json`, os acréscimos em
  `profiles/<UF>.json` e a entrada do SISCAN no `manifest.json`.
- [ ] Conferir o mapa nos dois modos e a ficha com os dados reais; executar o
  teste de página da mamografia, explicitamente pendente enquanto não houver
  entrada no manifesto, e concluir a revisão dos arquivos de dados.
- [ ] Marcar o critério restante, mudar o status para `resolved` e registrar o
  commit final no mesmo commit da última mudança.

Retomada, com os diretórios locais preservados:

```sh
uv run python -m pipeline run --source siscan
uv run pytest
uv run mypy
npm run check --prefix site
npm run test --prefix site
```

O primeiro comando pula os anos cujos agregados tenham tamanho/data iguais aos
do FTP, baixa o restante, calcula, valida e exporta. Em outra máquina, será
necessário reconstruir também a malha e o POPSVS local. A transferência do FTP
foi lenta e instável; a retomada deve reservar tempo para a carga inicial.

**Verificação e revisão:** 120 testes Python passaram; mypy e Astro check sem
erros. A suíte completa do site passou com **13 testes e 1 pendente explícito**
(página da mamografia com dados reais); o build estático também passou.
Os nove testes do SISCAN cobrem filtros, denominador e offset, cascata,
cache, falhas sem publicação, valor acima do esperado, ano provisório, recorte
populacional incompleto e município novo. Revisão em dois agentes desde
`21da783`: Standards e Spec sem achados remanescentes após as correções.
A conferência da NT 626/2025 não substitui a revisão clínica pendente, necessária
antes de disponibilizar os detalhes clínicos novos ao público.

Commits desta entrega parcial:

- `eebba66` — `feat: add SISCAN mammography screening indicator`.
- `5a972f8` — `fix: address mammography review findings`.
- `b520bb5` — `test: cover mammography history and published pages`.
- Commit deste registro — `chore: record mammography progress and remaining data load`.
