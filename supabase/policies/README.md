# Supabase Policies

Diretrizes para a primeira rodada de RLS:

- `profiles`: acesso autenticado ao proprio perfil
- `questionnaires`, `campaigns`, `analysis_results`, `generated_reports`, `action_plans`, `monitoring_indicators`:
  - leitura para `admin`, `hr`, `manager`
  - escrita para `admin` e `hr`
- `campaign_tokens`, `survey_submissions`, `submission_answers`:
  - nenhum acesso direto do cliente anonimo
  - uso apenas via rotas server-side
- `audit_logs` e `action_plan_history`:
  - leitura administrativa
  - escrita apenas server-side

Diretrizes adicionais da Fase 1:

- tokens anonimos devem ser persistidos e consultados apenas por `token_hash`
- consultas analiticas consolidadas devem aplicar limiar minimo de anonimato no backend antes da exposicao ao portal
- o limiar minimo atual do MVP e `5` respostas por agrupamento consolidado
- quando `response_count < 5`, o backend deve bloquear a exibicao consolidada e retornar motivo explicito
- regras de anonimato nao devem depender apenas do frontend

Diretrizes adicionais da Fase 3:

- o backend e a fonte de verdade de RBAC; esconder botoes no frontend nao substitui guardas server-side
- `profiles.role` define o papel efetivo do usuario autenticado
- `audit_logs.actor_role` deve ser derivado exclusivamente da sessao validada no servidor
- `profiles.sector` e `profiles.unit` definem o escopo do Gestor quando preenchidos
- Gestor so pode ler campanhas, analytics, planos, indicadores e relatorios analiticos do proprio setor/unidade
- Gestor nunca pode acessar relatorio individual
- operacoes de escrita administrativa continuam restritas a `admin` e `hr`

Matriz operacional resumida:

- `GET /api/admin/campaigns`: `admin`, `hr`, `manager` com escopo por setor/unidade para Gestor
- `GET /api/admin/campaigns/[id]/analytics`: `admin`, `hr`, `manager` com escopo por setor/unidade para Gestor
- `POST /api/admin/campaigns/[id]/report`: `admin`, `hr`, `manager` com escopo por setor/unidade para Gestor
- `GET /api/admin/reports/[id]/download`: `admin`, `hr`; `manager` apenas se o relatorio for analitico e estiver dentro do proprio escopo
- CRUD de `questionnaires`, emissao de `tokens`, escrita em `action_plans`, escrita em `monitoring_indicators`, endpoint de IA: apenas `admin` e `hr`

Nao expor queries publicas diretas para o fluxo anonimo.
