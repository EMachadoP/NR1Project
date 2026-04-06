# AI Recommendations Module

## Contrato final de entrada
- Arquivo: `src/lib/validation/ai-recommendations.ts`
- Schema principal: `aiRecommendationsInputSchema`
- Campos aceitos:
  - `campaign`
  - `summary`
  - `sections`
  - `criticalItems`
  - `companyRules`
  - `existingActionPlan`
- Restricoes fixas:
  - `observation_text` nao faz parte do contrato
  - o schema e `strict`, entao campos extras sao rejeitados
  - `companyRules` nao aceita texto livre; somente codigos aprovados

## Codigos aceitos em `companyRules`
- `PRIORITIZE_IMMEDIATE_ACTION_FOR_CRITICAL`
- `REQUIRE_HUMAN_VALIDATION_FOR_HIGH_RISK`
- `PROHIBIT_MEDICAL_DIAGNOSIS`
- `PROHIBIT_BLAME_ASSIGNMENT`
- `FOCUS_ON_PREVENTIVE_MEASURES`
- `USE_ACTION_PLAN_AS_OFFICIAL_TRACKING`
- `REQUIRE_PERIODIC_MONITORING`

## Contrato final de saida
- Schema principal: `aiRecommendationsOutputSchema`
- Campos principais:
  - `executiveSummary`
  - `recommendations[]`
  - `guardrailsApplied`
  - `fallbackUsed`
  - `promptVersion`

## Prompt do sistema
- Arquivo: `src/lib/server/ai/system-prompt.ts`
- Constantes:
  - `AI_RECOMMENDATIONS_SYSTEM_PROMPT`
  - `SYSTEM_PROMPT_VERSION`
- Reforca:
  - JSON puro
  - sem diagnostico medico
  - sem atribuicao de culpa
  - validacao humana obrigatoria para ALTO/CRITICO
  - prioridade imediata para CRITICO
  - obediencia aos codigos de regra da empresa no payload

## Validacao estrutural e semantica
- Validacao estrutural: Zod no input e no output
- Validacao semantica: `validateAiRecommendationsSemantics`
- Guardrails checados na resposta:
  - conteudo com diagnostico medico
  - conteudo com atribuicao de culpa
  - recomendacao para secao inexistente
  - ausencia de `requiresHumanValidation` em ALTO/CRITICO
  - ausencia de prioridade `immediate` em CRITICO

## Fallback
- Arquivo: `src/lib/server/ai/fallback.ts`
- Acionado quando:
  - chave ausente
  - erro HTTP
  - JSON invalido
  - schema invalido
  - violacao semantica dos guardrails
- O fallback gera recomendacoes deterministicas, seguras e auditaveis
- O fallback sempre devolve:
  - `fallbackUsed = true`
  - `promptVersion = SYSTEM_PROMPT_VERSION`

## Persistencia e auditoria
- Persistencia em `analysis_results`:
  - `ai_recommendations_json`
  - `fallback_used`
  - `prompt_version`
  - `ai_generated_at`
- Auditoria em `audit_logs`:
  - `ai_recommendations_generated`
  - `ai_guardrail_violation`
  - `rate_limit_exceeded`
- `actor_role` da auditoria vem da sessao validada no backend

## Rate limiting do endpoint administrativo
- Endpoint: `POST /api/admin/ai/recommendations`
- Limite oficial do MVP: `10` requisicoes por usuario autenticado a cada `1 hora`
- Quando excedido:
  - resposta `429`
  - header `Retry-After`
  - auditoria `rate_limit_exceeded`
- Quando permitido:
  - header `X-RateLimit-Remaining`

## Blindagem de anonimato
- `observation_text` nunca pode ser encaminhado ao provider de IA
- nenhum campo livre do respondente anonimo deve ser incorporado ao prompt
- o contrato da IA aceita somente estrutura analitica consolidada
- a fonte de verdade continua sendo o backend e seus snapshots de analise
