# Backlog Tecnico Executavel — MVP Atual

## Referencias obrigatorias
1. `03_SOURCE_OF_TRUTH.md`
2. `02_SDD.md`
3. `01_PRD.md`
4. Revisao tecnica do Claude AI

## Criterio de priorizacao usado
- `ALTA`: bloqueia deploy seguro do MVP ou conflita com regra fixa do Source of Truth
- `MEDIA`: nao bloqueia build inicial, mas precisa entrar antes de escalar uso real
- `BAIXA`: hardening posterior sem comprometer o MVP funcional imediato

## 1. Correções de ALTA prioridade

### A1. Enforcar escala valida de resposta no backend e banco
- Impacto tecnico: elimina calculo silenciosamente invalido e protege a classificacao oficial
- Alterar:
  - `supabase/migrations/*`
  - `src/lib/validation/submission.ts`
  - `src/lib/domain/risk/engine.ts`
  - testes em `src/lib/domain/risk/*.test.ts`
- Acao:
  - garantir `answer_raw BETWEEN 1 AND 5`
  - rejeitar payload fora da escala antes da persistencia

### A2. Definir e implementar tratamento de perguntas opcionais sem resposta
- Impacto tecnico: remove ambiguidade do motor de risco e garante reproducibilidade
- Alterar:
  - `03_SOURCE_OF_TRUTH.md`
  - `docs/mvp-architecture.md`
  - `src/lib/domain/risk/engine.ts`
  - `src/lib/domain/risk/*.test.ts`
- Acao:
  - registrar regra oficial: pergunta opcional sem resposta e excluida da media da secao

### A3. Blindar `observation_text` contra quebra de anonimato e exclusao da IA
- Impacto tecnico: reduz risco de PII em modo anonimo e bloqueia injection indireta no LLM
- Alterar:
  - `src/components/survey/respondent-survey-form.tsx`
  - `src/lib/server/services/submission-service.ts`
  - `src/lib/validation/ai-recommendations.ts`
  - `docs/ai-recommendations-module.md`
  - `docs/reporting-module.md`
- Acao:
  - mostrar aviso explicito ao respondente
  - nunca incluir `observation_text` no payload da IA
  - revisar se entra integralmente no relatorio individual ou passa por redacao

### A4. Padronizar token como `token_hash` e nunca texto puro
- Impacto tecnico: protege integridade do fluxo anonimo em caso de exposicao do banco
- Alterar:
  - `02_SDD.md`
  - migrations/schema Supabase
  - `src/lib/server/crypto.ts`
  - `src/lib/server/repositories/respondent-repository.ts`
  - servicos de emissao de token
- Acao:
  - documentar `token_hash` como semantica oficial
  - garantir hash no lookup e armazenamento

### A5. Implementar limiar minimo de anonimato nas consultas analiticas
- Impacto tecnico: bloqueia reidentificacao por grupos pequenos no dashboard RH/Gestor
- Alterar:
  - `03_SOURCE_OF_TRUTH.md`
  - `supabase/policies/README.md`
  - `src/lib/server/repositories/analytics-repository.ts`
  - `src/lib/server/services/dashboard-service.ts`
  - telas do portal RH/Gestor
- Acao:
  - definir k-anonimidade minima no backend
  - bloquear consolidado quando grupo filtrado < k

### A6. Desacoplar geracao de relatorio individual da submissao
- Impacto tecnico: evita falha de envio por erro de PDF/storage e alinha com operacao resiliente
- Alterar:
  - `src/lib/server/services/submission-service.ts`
  - `src/lib/server/services/report-service.ts`
  - schema `generated_reports`
  - fluxo de confirmacao do respondente
- Acao:
  - submissao conclui primeiro
  - relatorio entra em geracao assíncrona ou estado `pending`

### A7. Adicionar status e erro em `generated_reports`
- Impacto tecnico: habilita diagnostico, reprocessamento e observabilidade operacional
- Alterar:
  - migrations/schema Supabase
  - `src/lib/server/repositories/reports-repository.ts`
  - `src/lib/server/services/report-service.ts`
  - `docs/reporting-module.md`
- Acao:
  - adicionar `status` e `error_message`
  - persistir transicoes `pending/done/failed`

### A8. Enforcar RBAC real no backend por endpoint
- Impacto tecnico: remove dependencia de controle apenas visual e fecha superficie administrativa
- Alterar:
  - `src/lib/auth/session.ts`
  - rotas em `src/app/api/admin/**`
  - `supabase/policies/README.md`
  - docs de arquitetura
- Acao:
  - definir role minima por endpoint
  - validar `admin`, `hr`, `manager` no servidor

### A9. Validar guardrails da IA na resposta, nao so no prompt
- Impacto tecnico: evita JSON estruturalmente valido mas semanticamente proibido
- Alterar:
  - `src/lib/server/ai/recommendations.ts`
  - `src/lib/server/ai/fallback.ts`
  - `docs/ai-recommendations-module.md`
  - `audit_logs`
- Acao:
  - pos-validacao de conteudo proibido
  - se violar guardrail, usar fallback e registrar evento de seguranca

### A10. Proibir explicitamente `observation_text` no contrato de IA
- Impacto tecnico: fecha vetor de prompt injection e vazamento por campo livre
- Alterar:
  - `src/lib/validation/ai-recommendations.ts`
  - `docs/ai-recommendations-module.md`
  - codigo de montagem do payload analitico
- Acao:
  - documentar e garantir por schema/codigo que esse campo nao entra na IA

## 2. Correções de MEDIA prioridade

### M1. Fixar operadores das faixas de classificacao e cobrir boundaries
- Impacto tecnico: elimina ambiguidade de fronteira na reproducao do risco
- Alterar:
  - `03_SOURCE_OF_TRUTH.md`
  - `src/lib/domain/risk/engine.ts`
  - testes de contrato

### M2. Definir semantica oficial de `weight` no MVP
- Impacto tecnico: remove campo morto ou expectativa enganosa do questionario
- Alterar:
  - `03_SOURCE_OF_TRUTH.md`
  - `02_SDD.md`
  - schema/questionarios
  - `src/lib/domain/risk/engine.ts`
- Acao:
  - ou remover/ignorar oficialmente no MVP
  - ou implementar ponderacao e testar

### M3. Documentar diferenca entre item critico e classificacao de secao
- Impacto tecnico: reduz interpretacao errada do dashboard e do relatorio analitico
- Alterar:
  - `03_SOURCE_OF_TRUTH.md`
  - `docs/mvp-architecture.md`
  - `docs/reporting-module.md`

### M4. Trocar URL publica de confirmacao para `receipt_code`
- Impacto tecnico: reduz correlacao entre UUID interno e envio anonimo
- Alterar:
  - rotas `src/app/obrigado/*`
  - `submission-service.ts`
  - schema e repositorios de consulta por recibo

### M5. Restringir relatorio individual a RH/Admin
- Impacto tecnico: evita correlacao entre recibo e identidade por Gestor
- Alterar:
  - `src/app/api/admin/reports/[id]/download/route.ts`
  - RLS/RBAC
  - docs de acesso por perfil

### M6. Gerar relatorio analitico a partir de snapshot fechado
- Impacto tecnico: garante consistencia entre consolidado, recomendacao e artefato final
- Alterar:
  - `analysis_results`
  - `report-service.ts`
  - `reports-repository.ts`
  - fluxo de IA

### M7. Proteger recibo publico por `receipt_code` opaco e expiracao
- Impacto tecnico: reduz exposicao de participacao anonima
- Alterar:
  - rotas publicas de confirmacao
  - schema/consulta de recibo
  - docs de anonimato

### M8. Definir escopo de Gestor por setor/unidade
- Impacto tecnico: limita leitura consolidada ao escopo correto
- Alterar:
  - `03_SOURCE_OF_TRUTH.md`
  - `supabase/policies/README.md`
  - filtros backend de campanha

### M9. Garantir `actor_role` derivado de sessao validada
- Impacto tecnico: fortalece confiabilidade da trilha de auditoria
- Alterar:
  - `src/lib/auth/session.ts`
  - servicos de audit log
  - rotas administrativas

### M10. Sanitizar ou restringir `companyRules`
- Impacto tecnico: evita bypass dos guardrails por payload administrativo
- Alterar:
  - `src/lib/validation/ai-recommendations.ts`
  - camada de configuracao
  - docs de IA

### M11. Persistir e sinalizar `fallbackUsed`
- Impacto tecnico: evita tomada de decisao sem transparencia sobre indisponibilidade da IA
- Alterar:
  - schema `analysis_results`
  - `src/lib/server/ai/recommendations.ts`
  - `report-service.ts`
  - portal RH

### M12. Persistir versao do prompt
- Impacto tecnico: garante auditabilidade e reproducao das recomendacoes
- Alterar:
  - schema `analysis_results`
  - `src/lib/server/ai/system-prompt.ts`
  - `src/lib/server/ai/recommendations.ts`

## 3. Correções de BAIXA prioridade

### B1. Definir TTL oficial de links assinados
- Impacto tecnico: melhora equilibrio entre seguranca e usabilidade
- Alterar:
  - `docs/reporting-module.md`
  - `src/lib/server/pdf/report-storage.ts`
  - endpoint de download/regeneracao

### B2. Rate limiting no endpoint de IA
- Impacto tecnico: controla custo e abuso interno
- Alterar:
  - `src/app/api/admin/ai/recommendations/route.ts`
  - middleware ou camada server-side de limite por usuario
  - `audit_logs`

## 4. Ordem exata de implementacao

### Fase 1 — Bloqueios de integridade e anonimato
1. A1 — escala valida de resposta
2. A2 — perguntas opcionais fora do calculo
3. A4 — `token_hash` oficial
4. A3 — blindagem de `observation_text`
5. A10 — exclusao explicita de `observation_text` da IA
6. A5 — k-anonimidade minima no backend

### Fase 2 — Bloqueios operacionais de producao
7. A7 — status em `generated_reports`
8. A6 — desacoplar geracao de relatorio da submissao
9. M6 — snapshot fechado para relatorio analitico
10. M4 — URL de confirmacao com `receipt_code`
11. M7 — recibo publico opaco com expiracao

### Fase 3 — Hardening de acesso e auditoria
12. A8 — RBAC real por endpoint
13. M5 — restringir relatorio individual a RH/Admin
14. M8 — escopo de Gestor por setor/unidade
15. M9 — `actor_role` vindo da sessao validada

### Fase 4 — Confiabilidade da IA
16. A9 — validacao semantica da resposta da IA
17. M10 — sanitizacao/restricao de `companyRules`
18. M11 — persistir e sinalizar fallback
19. M12 — persistir versao do prompt

### Fase 5 — Consistencia de dominio e acabamento
20. M1 — boundaries da classificacao
21. M2 — definir semantica de `weight`
22. M3 — diferenca entre item critico e classificacao de secao
23. B1 — TTL de links assinados
24. B2 — rate limiting da IA

## 5. Checklist de pronto para deploy
- [ ] Banco rejeita `answer_raw` fora de 1..5
- [ ] Risk engine ignora perguntas opcionais sem resposta de forma documentada e testada
- [ ] Tokens sao armazenados e buscados apenas por `token_hash`
- [ ] Fluxo anonimo nao envia `observation_text` para IA
- [ ] Dashboard bloqueia agrupamentos abaixo do limiar minimo de anonimato
- [ ] Submissao responde mesmo se o relatorio estiver pendente de geracao
- [ ] `generated_reports` possui `status` e `error_message`
- [ ] Relatorio analitico usa snapshot consistente do momento da analise
- [ ] URLs publicas nao expõem `submissionId` interno
- [ ] Relatorio individual nao e acessivel por Gestor
- [ ] Todos os endpoints administrativos validam role no backend
- [ ] Escopo do Gestor esta limitado por setor/unidade
- [ ] `audit_logs.actor_role` deriva da sessao autenticada
- [ ] IA valida JSON e tambem conteudo proibido
- [ ] `companyRules` nao aceitam texto livre perigoso
- [ ] `fallbackUsed` fica persistido e visivel ao RH
- [ ] `prompt_version` fica persistido na analise
- [ ] TTL de signed URL esta definido e documentado
- [ ] Endpoint de IA possui controle de uso
- [ ] Documentacao oficial atualizada antes do codigo contraditorio entrar em producao

## 6. Observacao de alinhamento com o Source of Truth
Itens que sobem de prioridade por regra fixa do projeto:
- qualquer correcao ligada a anonimato
- qualquer correcao ligada a calculo de risco no backend
- qualquer correcao ligada a relatorios auditaveis server-side
- qualquer correcao ligada a RBAC e trilha de auditoria
- qualquer correcao ligada a guardrails de IA
