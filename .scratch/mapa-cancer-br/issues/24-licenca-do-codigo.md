# Qual licença expressa a abertura aprovada para o código?

Type: grilling
Status: resolved
Assignee: Kvojps (Claude session 2026-11-02)
Blocked by: 22

## Question

Escolher a licença concreta do código que expresse a política aprovada em [Qual o nome, o domínio e a licença do projeto?](22-nome-dominio-licenca.md): código público, reutilizável e versões modificadas distribuídas também abertas. Esclarecer com o responsável se a exigência deve alcançar também modificações oferecidas como serviço na rede e registrar o identificador e a versão da licença escolhida. Consultar os textos oficiais antes de apresentar as opções. A licença do código não substitui as condições de reutilização das fontes de dados.

## Answer

Decisão confirmada com o responsável pelo projeto em 2026-11-02, depois de consultar os textos oficiais: o texto da AGPL-3.0-or-later na SPDX (seções 0, 2, 13 e 14) e o FAQ da GPL na gnu.org (`#UnreleasedMods`, `#UnreleasedModsAGPL`, `#GPLOutput`, `#WhatCaseIsOutputGPL`, `#VersionThreeOrLater`).

- **Código: `AGPL-3.0-or-later`.** A exigência alcança também versões modificadas oferecidas como serviço na rede. Motivo: a GPL já obriga a abrir o JavaScript enviado ao navegador, mas um fork que monta as páginas no servidor (o Astro faz isso com pouca mudança) poderia ficar fechado. A seção 13 da AGPL fecha essa brecha. A obrigação só existe para versões **modificadas**: rodar o código original não gera nenhum dever. Custo aceito: algumas organizações evitam código AGPL por regra interna.
- **"Ou posterior".** Quem reutiliza pode seguir a versão 3 ou uma versão futura da AGPL publicada pela FSF. O uso pela versão 3 continua sempre garantido.
- **Textos do projeto: CC BY-SA 4.0**, com atribuição ao Observatório do Câncer no Brasil. Vale para as Ações, a metodologia pública, as notas e ressalvas e o glossário. Uma obra GPLv3 pode incorporar textos em CC BY-SA 4.0 (o caminho só funciona nesse sentido).
- **Dados:** nada muda em relação a [Qual o nome, o domínio e a licença do projeto?](22-nome-dominio-licenca.md). Os dados de terceiros seguem as condições de cada fonte. Os arquivos que o pipeline gera não são cobertos pela licença do código (FAQ `#GPLOutput`; AGPL, seção 2).
- **Contribuições:** cada contribuição entra sob a licença da parte que ela altera (AGPL para o código, CC BY-SA para os textos), **sem CLA**. Como não há CLA, o projeto não poderá relicenciar o código mais tarde sem a concordância dos contribuidores. A cláusula "ou posterior" é o que permite atualizar a versão da licença.
- **Dependências:** MapLibre GL JS (BSD-3-Clause), Astro e DuckDB (MIT) têm licenças permissivas e podem entrar num projeto AGPL. A malha do IBGE é dado e segue as condições da fonte.

Não é parecer jurídico. A spec deve exigir um arquivo `LICENSE` com o texto da AGPL-3.0, a declaração `AGPL-3.0-or-later` e a de CC BY-SA 4.0 para os textos no README, e um link para o código-fonte no rodapé do site (como a seção 13 exige para versões modificadas).
