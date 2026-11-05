# Polimento visual e celular do Observatório

Labels: wayfinder:map

## Destination

O redesenho visual do site implementado e verificado na `main`, sem deploy: Mapa inicial, Meu município, Lista, Municípios por UF e Como calculamos, com aparência sóbria e precisa e uso confortável no celular.

## Notes

- Alinhamento com o responsável em 2026-11-05. Este mapa guarda as decisões; os tickets de implementação continuam a numeração em `.scratch/mvp-implementacao/issues/`, a partir do 40. A execução faz parte do esforço: a fase de decisões termina criando esses tickets, e o mapa só termina com eles resolvidos.
- Evolução, não nova direção: o Console horizontal (ticket 35, [handoff aprovado](../ui-ux-v1/observability-handoff.md)) continua. Sem novas opções completas de página. Primeiro recuperar o que a implementação perdeu do protótipo aprovado, depois elevar o acabamento. Protótipo de referência: branch `prototype/35-observability-dashboard`, commit `86a8d87`.
- "Profissional e bonito" significa **sóbrio e preciso**: menos bordas e caixas, tipografia e números fortes, cor reservada aos dados. Substitui o "futurista, com acentos luminosos" da [entrevista anterior](../ui-ux-v1/redesign-interview.md).
- Liberdades aprovadas: reescrever textos da interface, adicionar fonte hospedada no próprio site, criar um logo simples e ajustar os tons do mapa conferindo o contraste. Os dados, as regras, os significados das cores e as ressalvas junto do resultado não mudam. Conteúdo da Metodologia não muda, só a apresentação.
- O aviso "Em construção" é extremamente importante, nas palavras do responsável: não é recolhido nem reduzido a uma versão curta, e pode ganhar mais destaque. Esta orientação prevalece sobre a "uma linha" aceita antes para o celular. Mantém-se o critério do ticket 36 de preservar o aviso integral. A [spec do MVP, §2](../mapa-cancer-br/spec-mvp.md) limita o destaque possível: faixa fixa no topo de todas as páginas, sem botão de fechar, com o texto exato, sem vermelho e sem as cores da Tendência (o âmbar de "piorando" não pode ser usado).
- Celular, confirmado pelo responsável: a primeira tela é o mapa do Brasil, com busca compacta; o cabeçalho ganha menu hambúrguer; os seletores ficam atrás de um botão **Filtros**; o painel do município recolhido já mostra nome, resultado e classe. "Compatibilidade" significa layout e toque; desempenho está fora. Durante o trabalho, validar com emulação de toque; depois de implementado, o responsável testa em um celular real, e os tickets de implementação devem prever essa verificação final.
- Decidir com protótipos no próprio site, com dados reais, em branch descartável e por etapas: poucas telas por vez, para o aprovado e o implementado não voltarem a divergir.
- Diagnóstico inicial medido em 2026-11-05 a 390 × 844 e 1440 × 900: mapa começa em 712 px no celular e cerca de 375 px no desktop, com a legenda abaixo da dobra; painel municipal recolhido sem número e primeiro número a cerca de 1.100 px no expandido; links do menu com 22 px e seletores com 36 px e fonte de 14 px; a mensagem de status e o link "Ir para Meu município" deformam a barra de filtros ao selecionar; fonte do sistema e logo em caractere `◈`; "Sem direção clara" é a cor mais clara do mapa no tema escuro.
- Preservar o que a [spec vigente](../ui-ux-v1/spec.md) exige: acesso sem JavaScript, 320/768/1280 px, zoom de 200%, foco e teclado. Consultar `GLOSSARY.md`.
- Skills: `grilling` + `domain-modeling` nas decisões; `research` nas investigações; `prototype` nas propostas concretas; `dataviz` em cores do mapa e números.
- Tracker: Markdown local, conforme `docs/agents/issue-tracker.md`. Pesquisas são evidência, não aprovação visual; evidências ficam no branch descartável `research/ui-polimento`, sem PR e sem merge.

## Decisions so far

- [Quais padrões visuais concretos fazem um painel de dados parecer sóbrio e preciso?](issues/01-referencias-visuais.md): seis referências sustentam hipóteses por protótipo, com mapa ocupando a altura no celular, escala tipográfica curta e três fontes candidatas; a aprovação visual segue com o responsável.

## Not yet specified

- Lista, Municípios por UF e Como calculamos no novo sistema: dependem dos fundamentos visuais; a Metodologia tem 31.404 px de altura no celular e a Lista tem tabela larga.
- Divisão final dos tickets de implementação, a partir do 40, e a ordem entre eles.
- Ajuste dos testes de navegador que dependem da estrutura atual.

## Out of scope

- Deploy e publicação.
- Desempenho e tempo de carregamento do mapa: o responsável limitou a compatibilidade a layout e toque.
- Mudanças em dados, pipeline ou método.
- Conteúdo dos tickets [24](../mvp-implementacao/issues/24-metodologia-consolidada.md), [25](../mvp-implementacao/issues/25-auditoria-de-acessibilidade.md) e [26](../mvp-implementacao/issues/26-revisao-clinica-das-acoes.md).
