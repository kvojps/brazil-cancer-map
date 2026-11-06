# Licenças: AGPL-3.0-or-later e CC BY-SA 4.0, sem CLA

O projeto quer código público e reutilizável, com versões modificadas também abertas. Decidimos em 02/11/2026 licenciar o código sob **`AGPL-3.0-or-later`** e os textos do projeto (Ações, metodologia, notas, ressalvas e glossário) sob **CC BY-SA 4.0**, com atribuição ao Observatório do Câncer no Brasil. Cada contribuição entra sob a licença da parte que altera, **sem CLA**. Os dados de terceiros seguem as condições de cada Fonte, e os arquivos que o pipeline gera não são cobertos pela licença do código.

A decisão foi tomada depois de consultar o texto da AGPL-3.0-or-later na SPDX (seções 0, 2, 13 e 14) e o FAQ da GPL na gnu.org. Não é parecer jurídico.

Regras vigentes: [spec, seção 2](../spec.md#2-identidade-licenças-e-requisitos-de-lançamento).

## Alternativas consideradas

- **GPL em vez de AGPL:** descartada. A GPL já obriga a abrir o JavaScript enviado ao navegador, mas um fork que monta as páginas no servidor, o que o Astro faz com pouca mudança, poderia ficar fechado. A seção 13 da AGPL fecha essa brecha, e a obrigação só existe para versões **modificadas**: rodar o código original não gera nenhum dever.
- **Licença permissiva, como MIT:** descartada, porque não exige que versões modificadas permaneçam abertas, e essa era a política aprovada.
- **CLA:** não adotado. Permitiria relicenciar sem consultar os contribuidores, e o custo de ficar sem ele está nas consequências.

## Evidências

- Uma obra GPLv3 pode incorporar textos em CC BY-SA 4.0, e esse caminho só funciona nesse sentido.
- MapLibre GL JS (BSD-3-Clause), Astro e DuckDB (MIT) têm licenças permissivas e podem entrar num projeto AGPL.
- O resultado de um programa AGPL não herda a licença do programa (FAQ `#GPLOutput`; AGPL, seção 2).

## Consequências

- **Sem CLA, relicenciar o código exige a concordância dos contribuidores.** A cláusula "ou posterior" é o que permite atualizar a versão da licença, e o uso pela versão 3 continua sempre garantido.
- Algumas organizações evitam código AGPL por regra interna: é um custo aceito.
- O repositório precisa do arquivo `LICENSE`, das declarações no README e do link para o código-fonte no rodapé do site.
- Quem citar o Observatório também cita as Fontes originais.
