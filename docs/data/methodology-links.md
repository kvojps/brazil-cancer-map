# Conferência dos links da metodologia

Data da conferência: **05/11/2026**. Escopo: links oficiais externos da página Como calculamos, incluindo arquivos FTP, documentos e páginas das fontes.

Consulta HTTP por GET com leitura inicial do corpo; FTP por abertura e leitura inicial. O resultado verifica acesso ao endereço, não valida clinicamente o conteúdo nem substitui a validação estatística. Consultas ao portal DATASUS, Vigitel, INCA Estimativa e ficha de mamografia também foram abertas pelo navegador de pesquisa.

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

O painel HPV e sua nota técnica redirecionam para o InfoMS. O portal HPV retornou 403 no navegador de pesquisa, mas abriu com HTTP 200 na consulta direta. Mantidos os endereços oficiais estáveis, sem os parâmetros temporários de sessão.

Os links do projeto (código, README e Releases) também abriram com HTTP 200. `/releases/latest` apontou para `data-2026-11-05`. Os links deste próprio documento e do histórico de commits são referências ao repositório, não fontes estatísticas.

## Cobertura editorial dos nove itens da spec

Os itens 1–8 estão nas seções próprias de cada indicador; versões, agregados e revisões (item 9) têm também seção transversal explicitamente aplicável aos oito indicadores e contextos. Fontes e extrações são apresentadas a partir do manifesto atual.

- Tratamento: nove itens na lista numerada, mais condições e citação.
- CNES: fonte/competência/universo; habilitações/limpeza; fórmula de distância; ausência de taxa, janela de Tendência, mínimo e substituição regional; validação/limites; reprodução e histórico.
- Mamografia e citopatológico: fontes/recortes; limpeza; fórmula/POPSVS; janela e congelamento; Tendência, mínimo e Situação; limites/validação; reprodução e histórico.
- Mortalidade: fontes/recortes/limpeza; C55 e fallbacks; pesos Segi; janela/modelo/incerteza; mínimo e região; ausência de Situação; validações; reprodução e histórico.
- HPV: fonte/coortes/extração no quadro transversal; limpeza/deduplicação; fórmula/Censo; dose única/provisórios; Situação/ausência de Tendência; mínimo/região; limites/validação; reprodução e histórico.
- Tabagismo: fonte/extração/recortes; fórmula ponderada; ausências; desenho/IC; janela e lacuna 2022; classes e Situação invertida; ausência de mínimo municipal/região/faixas; validação, reprodução e revisão dos pesos.
- INCA: edição/extração/recortes; transcrição e ausência de cálculo de taxa/pesos/denominador; ausência de série, Tendência, Situação e mínimo/região/faixas; validação/limites; reprodução e histórico.

As medições de duração e disco da auditoria de microdados do HPV ficam como registro histórico em `docs/data/hpv-benchmark.md`. Sem workflow de microdados, não há medição pendente.
