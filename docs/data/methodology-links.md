# Conferência dos links da metodologia

> Leitura curta. A [versão completa](https://github.com/kvojps/brazil-cancer-map/blob/11fd03c47e1ce09b9a2ccb873ccc75da1ccb304f/docs/data/methodology-links.md), com a cobertura editorial dos nove itens da spec em cada Indicador, está no commit `11fd03c`.

Sustenta a conferência dos links oficiais citada na página [Como calculamos](https://brazil-cancer-map.kvojps.workers.dev/metodologia/).

**Data:** 05/11/2026.

## Resultado

**Dos 26 endereços oficiais, 23 abriram na consulta direta.** A ficha de mamografia do INCA de 2014 deu 404 e foi substituída na página pelo registro Ninho/INCA 17330 da mesma ficha. A página de malhas do IBGE deu 403 na consulta direta. A licença CC BY-SA 4.0 deu 403 na consulta direta, mas abriu pelo navegador de pesquisa. O painel HPV e sua nota técnica redirecionam para o InfoMS; os endereços oficiais estáveis foram mantidos, sem os parâmetros temporários de sessão.

| Endereço consultado | Resultado |
| --- | --- |
| https://datasus.saude.gov.br/informacoes-de-saude-tabnet/ | 200 |
| ftp://ftp.datasus.gov.br/dissemin/publicos/painel_oncologia/ | FTP OK |
| ftp://ftp.datasus.gov.br/dissemin/publicos/painel_oncologia/Doc/ | FTP OK |
| ftp://ftp.datasus.gov.br/dissemin/publicos/CNES/200508_/Dados/ | FTP OK |
| ftp://ftp.datasus.gov.br/dissemin/publicos/CNES/200508_/Auxiliar/TAB_CNES.zip | FTP OK |
| https://www.gov.br/inca/pt-br/assuntos/cancer/tratamento/onde-tratar-pelo-sus | 200 |
| https://www.gov.br/inca/pt-br/acesso-a-informacao/perguntas-frequentes/atendimento-no-inca/ | 200 |
| ftp://ftp.datasus.gov.br/dissemin/publicos/SISCAN/SISCAN/ | FTP OK |
| ftp://ftp.datasus.gov.br/dissemin/publicos/SISCAN/TAB_SISCAN.rar | FTP OK |
| https://www.inca.gov.br/sites/ufu.sti.inca.local/files/media/document/ficha-tecnica-indicadores-mama-2014.pdf | HTTP Error 404: Not Found; substituído na página pelo registro oficial Ninho/INCA 17330 da mesma ficha de 2014 |
| https://www.gov.br/saude/pt-br/centrais-de-conteudo/publicacoes/notas-tecnicas/2025/nota-tecnica-no-626-2025-cgcan-decan-saes-ms.pdf/view | 200 |
| https://ninho.inca.gov.br/jspui/handle/123456789/11663 | 200 |
| https://www.gov.br/inca/pt-br/assuntos/gestor-e-profissional-de-saude/controle-do-cancer-do-colo-do-utero/acoes/deteccao-precoce | 200 |
| ftp://ftp.datasus.gov.br/dissemin/publicos/SIM/CID10/DORES/ | FTP OK |
| https://rbc.inca.gov.br/index.php/revista/article/download/4836/3815/42605 | 200 |
| https://linhasdecuidado.saude.gov.br/portal/cancer-de-mama/sou-gestor/ | 200 |
| https://www.gov.br/saude/pt-br/vacinacao/paineis-de-vacinacao/hpv | 200; redirecionamento para https://infoms.saude.gov.br/extensions/SEIDIGI_DEMAS_VACINACAO_HPV/SEIDIGI_DEMAS_VACINACAO_HPV.html (parâmetro temporário de sessão omitido) |
| https://infoms.saude.gov.br/content/Default/SEI_0045605478_Nota_Tecnica_16.pdf | 200; redirecionamento para https://infoms.saude.gov.br/content/Default/SEI_0045605478_Nota_Tecnica_16.pdf (parâmetro temporário de sessão omitido) |
| https://sidra.ibge.gov.br/tabela/9514 | 200 |
| https://svs.aids.gov.br/daent/cgdnt/vigitel/ | 200 |
| https://svs.aids.gov.br/daent/cgdnt/vigitel/orientacoes-vigitel-2006-2024.pdf | 200 |
| https://www.gov.br/inca/pt-br/assuntos/cancer/numeros/estimativa/estado-capital/brasil | 200 |
| https://ninho.inca.gov.br/jspui/handle/123456789/17330 | 200 |
| https://www.ibge.gov.br/geociencias/organizacao-do-territorio/malhas-territoriais.html | HTTP Error 403: Forbidden |
| ftp://ftp.datasus.gov.br/dissemin/publicos/IBGE/POPSVS/ | FTP OK |
| https://creativecommons.org/licenses/by-sa/4.0/deed.pt-br | HTTP 403 na consulta direta; conteúdo confirmado pelo navegador de pesquisa (título e condições CC BY-SA 4.0). |

Os links do projeto (código, README e Releases) também abriram. `/releases/latest` apontava para `data-2026-11-05` na data da conferência.

## Método

HTTP por GET com leitura inicial do corpo e FTP por abertura e leitura inicial. Portal DATASUS, Vigitel, Estimativa INCA e ficha de mamografia também foram abertos pelo navegador de pesquisa. O resultado verifica o acesso ao endereço, sem validar clinicamente o conteúdo. Uma falha de acesso não comprova que a fonte deixou de existir.
