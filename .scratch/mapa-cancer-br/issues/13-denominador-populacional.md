# Qual a série e o formato da estimativa populacional do MS/SVS por município, sexo e idade?

Type: research
Status: resolved
Assignee: Kvojps (claude session 2026-11-02)
Blocked by:

## Question

[Qual stack e pipeline de dados usar?](07-stack-e-pipeline.md) escolheu como denominador a estimativa populacional do Ministério da Saúde/SVS, a mesma que o TabNet usa. Confirmar:
- quais anos existem (cobrindo 2014–2025 ou mais) e se há quebra de método entre edições (por exemplo, a revisão pós-Censo 2022);
- a granularidade: município × sexo × faixa etária (quinquenal? idade simples?), com faixas que permitam 9–14 anos (HPV), 25–64 (citopatológico), 50–69 (mamografia) e padronização por idade;
- a forma de acesso (FTP DATASUS, TabNet, download do MS/SVS) e o formato;
- qual denominador o INCA e o MS usam oficialmente para a razão de mamografias e citopatológicos e para a cobertura vacinal de HPV (população estimada ou SINASC, por exemplo);
- a licença e a frequência de atualização.

## Answer

Pesquisa concluída em 2026-11-02. Os detalhes e as fontes estão em [research/13-denominador-populacional.md](../research/13-denominador-populacional.md).

- **Onde está:** `ftp://ftp.datasus.gov.br/dissemin/publicos/IBGE/POPSVS/POPSBR00.zip` … `POPSBR25.zip`, um ZIP com DBF por ano (~3,4 MB), cobrindo **2000–2025**. Ainda não existe o arquivo de 2026.
- **Granularidade:** município (7 dígitos, cortar para 6) × sexo × **idade simples 0–79 e 80+**. Dá para montar qualquer faixa (9–14, 25–64, 50–69, quinquenal). Em 2025 os nomes das colunas estão em minúsculas, e há um município novo (5101837).
- **Quebra de método:** não há. A série 2000–2024 inteira foi refeita em 07/01/2025 pelo método Ripsa pós-Censo 2022 (NT Ripsa 01/2025), e a versão antiga saiu do FTP. Por isso, números oficiais publicados antes de 2025 **não vão bater** com o pipeline (a estimativa antiga superestimava em ~5,8%). Isso precisa entrar na etapa de validação.
- **Licença e atualização:** dado aberto (Decreto 8.777/2016), atualizado uma vez por ano depois da estimativa do IBGE de agosto.
- **Denominador oficial por indicador:**
  - Mamografia: mulheres de 50–69 anos ÷ 2 (fichas técnicas do INCA).
  - Citopatológico: mulheres de 25–64 anos ÷ 3 (fichas técnicas do INCA).
  - **HPV: o PNI usa o Censo 2022, 9–14 anos por sexo, fixo para todos os anos** (NT 16/2025-DPNI, tabela SIDRA 9514), e não a estimativa do MS.
  - Mortalidade: estimativa do MS por sexo e faixa quinquenal até 80+, com a população padrão mundial agrupada em 80+.
  - % em até 60 dias: não usa denominador.
- **Ano sem arquivo de população:** usar o do ano anterior e marcar como provisório.
