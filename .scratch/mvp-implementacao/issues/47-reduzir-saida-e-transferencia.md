# 47: Reduzir a saída estática e a transferência inicial

**What to build:** reduzir o tamanho do site sem perder a leitura dos documentos municipais sem JavaScript, os seis Tipos de câncer, as séries e fontes, as Ações ou as alternativas ao mapa. A arquitetura proposta deve respeitar a separação entre pipeline e site e o contrato de dados; qualquer mudança de contrato exige decisão documentada antes da implementação. Referências: spec MVP, seções 2, 13 e 15; auditoria do ticket 25.

**Status:** needs-triage

**Prioridade:** pós-V1; não bloqueia o lançamento da V1 por orçamento de tamanho ou transferência, conforme decisão de 06/11/2026 abaixo. Os critérios continuam pendentes.

- [ ] Investigar e reduzir a repetição de conteúdo nos HTMLs municipais e o volume dos perfis JSON, com proposta concreta e análise do comportamento sem JavaScript
- [ ] Saída estática completa abaixo de 30 MB, medida pela soma dos bytes de todos os arquivos gerados
- [ ] Primeira visita com cache vazio e transferência comprimida em torno de 1,3 MB, com cenário e recursos registrados
- [ ] Verificar carregamento de detalhes sob demanda, navegação, alternativas ao mapa, dados, ressalvas, Ações e fontes após a redução
- [ ] Registrar limites da medição local e conferir a compressão na hospedagem antes do lançamento

## Comments

### Achado da auditoria — 06/11/2026

A medição reproduzível do ticket 25 está em [validation-25.md](../../ui-ux-v1/validation-25.md) e nos JSONs associados. O build corrigido tem 999.530.479 bytes: 893.552.632 nos documentos municipais e 81.654.299 nos perfis por UF. Os perfis sozinhos já excedem 30 MB; reduzir apenas assets ou HTML não basta. A primeira visita com HTTP gzip local transfere cerca de 1,37 MB de corpos comprimidos.

Decisão explícita do responsável nesta sessão: **“Manter metas e bloquear lançamento até reduzir”**. Não há aprovação do excesso nem autorização implícita para retirar conteúdo ou enfraquecer a alternativa sem JavaScript. Este ticket acompanha a correção; o ticket 25 mantém a revisão humana de acessibilidade pendente.

### Decisão posterior — adiar a otimização para depois da V1 — 06/11/2026

O responsável decidiu que esta redução não precisa ser implementada agora para a V1 e pediu o registro dessa decisão no repositório. **Esta decisão substitui o bloqueio anterior por orçamento:** a saída de 999.530.479 bytes e a transferência inicial local de 1.369.414 bytes gzip ficam aceitas como dívida conhecida para a V1. As metas de menos de 30 MB e cerca de 1,3 MB permanecem como objetivos deste ticket para depois da V1, sem afirmar que foram cumpridas.

O ticket permanece aberto, sem critérios marcados como concluídos. A decisão não dispensa acessibilidade, validação dos dados ou verificação da hospedagem e não autoriza o lançamento por si só. As limitações da medição local e as demais pendências do ticket 25 continuam valendo.

Na discussão de uma solução futura, o responsável aceitou páginas compartilhadas para séries, explicações e Ações completas, acessíveis por links na ficha municipal, preservando resultados e avisos locais dos seis Tipos de câncer e a leitura sem JavaScript. Isso é uma direção aceita para investigação, sem arquitetura final validada nem alteração do contrato de dados. Nenhuma implementação foi autorizada nesta etapa.
