# Validação da consulta municipal integrada — ticket 37

## Implementação e fronteira

A consulta reutiliza `MunicipalityProfile` e seus cartões Astro como renderizador editorial único. Seleções por mapa/busca/URL carregam o perfil JSON da UF e o HTML municipal sob demanda, com cache em memória e invalidação de falhas. Do documento municipal, guarda-se apenas `.profile`; scripts do documento recebido não são executados. O JSON determina a disponibilidade do indicador no resumo; séries, Ações, fontes e ressalvas permanecem nos cartões gerados a partir dos mesmos perfis publicados. Nenhuma estatística é recalculada no cliente.

Os documentos `/municipio/<slug>/` agora incluem o mesmo `MapExperience`, com a consulta já no HTML. Não há redirect JavaScript. O índice nacional fica apenas na inicial, para evitar repetir milhares de links por município; os documentos selecionados oferecem link nativo ao índice. O ticket 38 ainda deve concluir Mapa/Lista, índice sob demanda, convenção de estado/URL e avaliação da hospedagem.

O painel recolhido informa disponibilidade e convida à expansão, sem apresentar números ou classes separados das ressalvas e Ações. Os quatro Eixos usam expansões nativas. No celular com JavaScript, o painel fica preso à parte inferior da viewport; sem JavaScript, mantém leitura no fluxo do documento. Voltar ao mapa preserva seleção e oferece reabertura; limpar remove a seleção. A busca mantém foco e o atalho ao painel/reabertura foca seu título, sem modal nem aprisionamento.

## Verificações

- `npm run check --prefix site`: zero erros, avisos ou hints, 43 arquivos.
- `npm run test --prefix site`: 37 testes passaram; inclui build de todos os documentos municipais e regressões dos cartões, períodos, origens, qualidade, Referência, Ações, séries, mortalidade/C55 e filtros.
- `SITE_URL=http://127.0.0.1:4337 node --test --test-concurrency=1 site/browser-tests/*.test.mjs`: 31 testes passaram, incluindo zoom nativo 200% das alternativas e dos documentos municipais.
- Testes de integração no navegador: seleção direta e por evento do mapa, seis Tipos, abertura do Eixo inicial, retorno/reabertura/limpeza, resposta atrasada e falha com nova tentativa. Falha de perfil não é rotulada como dado insuficiente e remove a consulta anterior.
- Estados publicados: Cruzeiro do Sul (municipal), Acrelândia (regional), Manoel Urbano (insuficiente), Açailândia (faixa C). Dois temas × 320/768/1280 px × zoom CSS 100/200%, todos os Eixos abertos, sem transbordamento horizontal global. Capturas locais em `/tmp/ticket37-<tema>-<código>.png`.
- Links estáticos dos seis Tipos sem JavaScript, âncora que prevalece sobre query anterior, navegação por teclado, ausência/falha de WebGL, filtros, C55 não calculável e matriz responsiva municipal reutilizam as regressões de navegador existentes. Zoom nativo de 200% usa a extensão local dos testes.
- TDD na fronteira de navegador confirmada pelo responsável: o teste de posição móvel falhou quando o painel ficava abaixo da viewport e passou após a correção para painel inferior fixo. A compatibilidade de âncoras também foi corrigida durante a regressão.

## Standards

Skill `code-review`, base `0690831`, agente independente. Revisão inicial: apontou o risco de duplicar regras editoriais no resumo e de reter documentos inteiros em cache, além do encerramento ainda pendente. O resumo passou a apenas anunciar disponibilidade; cache guarda `.profile`; status, critérios e commits são registrados no encerramento com as últimas correções. Reexame do agente: sem bloqueios de padrões restantes.

## Spec

Segundo agente independente, mesma base. Revisão inicial: números no resumo sem as ressalvas/Ações essenciais e classe de Tendência sem sua janela temporal. Os resultados foram removidos do resumo recolhido; os cartões completos continuam como apresentação única dos números, períodos e contexto. Reexame: ambos os achados resolvidos; painel inferior compatível com a spec, sem bloqueios restantes.

Revisão final: zero bloqueios em Standards; zero em Spec.

## Custos e limites

A saída completa continua acima da meta de 30 MB. A primeira tentativa repetia o índice nacional em cada documento e chegava a aproximadamente 4,1 GiB; essa repetição foi removida antes do encerramento. A saída final tem 763.801.491 bytes de arquivos (aproximadamente 764 MiB ocupados em disco via `du -sh`), contra aproximadamente 677 MB registrados no ticket 36: o shell compartilhado acrescenta HTML por município. Não há duplicação física de JSON ou malha por documento.

Medição local com `gzip.compress` (estimativa de compressão, não captura de transferência HTTP): documento de Recife aproximadamente 143 KB / 18 KB gzip; perfil PE aproximadamente 1,64 MB / 161 KB gzip. Na seleção inicial pela busca, ambos são requisitados; a troca de Tipo reutiliza o cache. Na entrada pelo documento municipal já renderizado, seu HTML é reutilizado. Não se declara cumprimento do orçamento global de primeira visita; avaliação de transferência e hospedagem continua nos tickets 25/38.

A carga HPV está ausente nesta cópia; mantém-se a mensagem dos cartões existentes, sem simulação publicada. Não houve alteração do pipeline, dos JSON nem de textos clínicos. Leitor de tela, contraste medido, dispositivo tátil real e revisão clínica permanecem fora desta verificação e nos respectivos requisitos de lançamento. Não houve publicação.
