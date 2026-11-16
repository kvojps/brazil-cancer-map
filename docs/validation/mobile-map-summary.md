# Mapa e resumo sem rolagem externa — #45

Entrega da [#45](https://github.com/kvojps/brazil-cancer-map/issues/45), parte da
[spec #44](https://github.com/kvojps/brazil-cancer-map/issues/44).

## Comportamento entregue

Na composição mobile de pelo menos 300 px de largura e 520 px de altura útil,
o tamanho do resumo não transforma a consulta em página rolável. O resumo
permanece inferior e sobreposto, com rolagem interna e tamanhos de fonte
preservados. Resultado, período, origem regional, Faixa C, ressalva de próstata,
Ver detalhes e Limpar seleção continuam disponíveis. Tocar no texto não expande.

Canvas conserva o foco da exploração e a câmera, com ajuste mínimo permitido
para revelar seleção encoberta. Busca por toque ou Enter fecha o campo e foca
o nome com `preventScroll`; link municipal sem âncora começa recolhido e
respeita o recorte. Os controles acima do resumo são medidos antes do
reenquadramento do resultado carregado. Interação deliberada cancela esse
reenquadramento tardio. Respostas anteriores continuam invalidadas por nova
seleção ou limpeza. Não há mais chegada programada por rolagem externa.

O aviso usa em todas as páginas a redação aprovada: “Em construção. Dados ainda
não validados; podem conter erros e mudar.” Documentos municipais estáticos,
desktop e páginas de leitura mantêm seus percursos.

## Verificações

Em 15/11/2026, no Linux, com Chromium emulado e build estático local.
`CHROMIUM_PATH` apontou para o Chromium instalado pelo Playwright. Comandos:

```sh
npm run check --prefix site
npm test --prefix site
SITE_URL=http://127.0.0.1:8765 node --test --test-concurrency=2 site/browser-tests/*.test.mjs
```

A rodada inicial completa usou `--test-concurrency=1`; a final usou dois
arquivos por vez. Builds foram sequenciais. A repetição do arquivo de toque
usou outro build estático com a correção de retry, em diretório separado.

- O teste de Alcântara a 320 × 568 falhou antes da implementação: painel
  `static` em vez de `fixed`. Depois passou com rolagem interna, documento
  de 568 px e texto que não expande os detalhes.
- `npm run check --prefix site`: 82 arquivos, nenhum diagnóstico.
- `npm test --prefix site`: 88 testes passaram, incluindo build dos documentos
  estáticos e consulta municipal em desenvolvimento com heap limitado.
- Primeira rodada focada: 85 de 86 testes passaram. A falha conservava a
  comparação entre ressalva no mapa e seletor no fluxo; foi adaptada para a
  superfície de filtros. Não foi falha do resultado ou da câmera.

- Rodada completa anterior à consolidação: 368 de 372 testes passaram. As
  quatro falhas foram a comparação de câmera do retry no build anterior, uma
  busca do teste com dois nomes compatíveis e duas âncoras sem JavaScript ainda
  usando a reserva do aviso longo. O retry foi corrigido; o teste agora escolhe
  o nome acessível exato; a reserva de âncoras acompanha o aviso curto.
- Repetição de `map-touch.test.mjs` no build com retry corrigido: 17 testes
  passaram, incluindo geografia, toque, foco, cache, limpeza e nova seleção.
- Build final: 5.574 páginas; `npm test --prefix site` repetido após as
  correções: 88 testes passaram. Tipos: nenhum diagnóstico nos 82 arquivos.

- Rodada completa no build consolidado: **372 testes de navegador passaram**,
  sem falhas ou testes ignorados, em 448 s. Inclui as auditorias automatizadas
  de acessibilidade, desktop, leitura, JavaScript desativado, zoom, busca,
  toque, câmera, painéis, superfícies e concorrência. As verificações
  inconclusivas do axe e a revisão humana continuam distintas desse resultado.

## Revisão

Referência fixa: `c9cc7445b8c0e638169fb3fe1c0a356ce0f8d40f`, início desta entrega.
Os eixos foram revisados por agentes independentes, conforme `code-review`.

### Standards

Nenhum achado. O diff preserva idioma, vocabulário do domínio, arquitetura
estática e separação entre apresentação e estatística documentados em
`AGENTS.md`, `GLOSSARY.md`, `docs/development.md` e ADRs 1 e 10. A documentação
distingue verificações executadas, limitações da emulação e trabalho pendente.
Nenhum smell do baseline justificou recomendação de mudança.

### Spec

A primeira revisão encontrou dois pontos, ambos corrigidos e revistos:

1. A ativação de Tentar novamente cancelava o enquadramento final e a tentativa
   no mesmo município não o rearmava. O botão agora rearma o enquadramento da
   consulta atual; interações posteriores continuam cancelando-o. A regressão
   compara a geografia visível com a chegada direta bem-sucedida: falhou antes
   (Paulista no ponto onde a referência mostrava Recife) e passou após a correção.
2. Os testes de busca por Enter e interação durante carga ainda aprovavam foco
   depois de pausa fixa de 250 ms. Todos esses marcos no arquivo de toque foram
   substituídos pela observação da composição após dois frames.

A segunda revisão confirmou ambos resolvidos, sem outros achados de Spec.
Os dois eixos também revisaram a seleção exata do teste e a reserva do aviso
curto nas âncoras sem JavaScript, sem novos achados.
Resultado: Standards 0; Spec 2 corrigidos, 0 pendentes.

## Limites e continuação

A emulação verifica canvas real, URL, geometria, foco, rolagem e dados publicados;
não comprova toque físico, dispensa efetiva do teclado, barras móveis ou GPU de
celular. A conferência Android/Chrome pertence à #52. Não houve deploy, carga de
Fontes nem mudança de pipeline, estatística, Contrato de dados ou conteúdo clínico.

A Lista com rolagem interna e contexto é a #47; comandos dos detalhes são a #46;
composição extrema (inclusive menos de 520 px de altura útil, menos de 300 px de
largura e texto ampliado) é a #50. Esses extremos ainda usam o fluxo anterior,
sem a chegada programada removida aqui. Histórico integrado e evidência conjunta
seguem nas #49 e #51. Esta entrega não conclui a spec pai #44.
