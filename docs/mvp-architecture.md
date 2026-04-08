# NR-1 Survey & Risk Manager - Arquitetura Inicial do MVP

## 1. Arquitetura Inicial

### Princípios obrigatórios
- `03_SOURCE_OF_TRUTH.md` é a referência máxima.
- anonimato é padrão no MVP
- cálculo de risco acontece exclusivamente no backend
- geração de relatórios acontece exclusivamente server-side
- regras de classificação ficam centralizadas em um único módulo de domínio
- MVP full-stack sem microservices

### Stack base
- frontend: Next.js App Router + React + TypeScript + Tailwind
- backend: Route Handlers / Server Actions / server-only modules
- banco: Supabase Postgres
- auth RH/Admin: Supabase Auth
- storage: Supabase Storage
- deploy: Vercel
- validação: Zod
- IA: provider acessado somente por endpoint seguro no backend

### Visão de camadas
1. `app`:
   - portal RH/Admin
   - PWA do respondente
2. `features`:
   - fluxos por domínio sem acoplamento excessivo
3. `lib/domain`:
   - motor de risco
   - classificação
   - políticas de anonimato
   - montagem de payloads auditáveis
4. `lib/server`:
   - acesso ao Supabase
   - serviços server-side
   - geração de PDF
   - integração IA
5. `supabase`:
   - schema
   - policies
   - seeds
   - storage conventions

### Módulos do MVP
- `auth`: autenticação RH/Admin e RBAC mínimo
- `campaigns`: criação, publicação e acompanhamento de campanhas
- `questionnaires`: versionamento, seções, perguntas e publicação
- `tokens`: geração, expiração, single-use e QR
- `respondent-survey`: fluxo anônimo de preenchimento via PWA
- `risk-engine`: normalização por pergunta, média por seção, classificação e itens críticos
- `analytics`: consolidação por campanha
- `reports`: relatório individual e relatório analítico
- `action-plans`: plano de ação editável com histórico
- `indicators`: registro e cálculo de indicadores
- `ai-recommendations`: recomendações estruturadas com guardrails
- `audit`: trilha de auditoria para eventos administrativos

### Decisões de fronteira
- frontend nunca calcula risco oficial
- frontend pode mostrar pré-estado de progresso, mas não classificação final
- tokens e submissões anônimas usam rotas públicas dedicadas
- toda escrita crítica passa por validação Zod e serviço server-side
- filtros analíticos devem respeitar limiares de anonimato
- perguntas opcionais sem resposta são excluídas do cálculo oficial da média da seção
- `weight` participa da média ponderada oficial do MVP; ausência de peso implica valor `1`

## 2. Estrutura Inicial de Pastas

```text
src/
  app/
    (public)/
      responder/[token]/
      obrigado/[receiptCode]/
    (portal)/
      campanhas/
      questionarios/
      relatorios/
      plano-de-acao/
      indicadores/
      configuracoes/
    api/
      public/
        tokens/[token]/validate/route.ts
        submissions/route.ts
      admin/
        campaigns/route.ts
        campaigns/[id]/route.ts
        campaigns/[id]/tokens/route.ts
        campaigns/[id]/analytics/route.ts
        campaigns/[id]/report/route.ts
        questionnaires/route.ts
        questionnaires/[id]/route.ts
        questionnaires/[id]/publish/route.ts
        action-plans/route.ts
        action-plans/[id]/route.ts
        indicators/route.ts
        reports/[id]/download/route.ts
        ai/recommendations/route.ts
  components/
    ui/
    survey/
    portal/
    reports/
  features/
    campaigns/
    questionnaires/
    tokens/
    respondent-survey/
    analytics/
    reports/
    action-plans/
    indicators/
  lib/
    auth/
    validation/
    domain/
      risk/
      classification/
      anonymity/
      reports/
    server/
      supabase/
      repositories/
      services/
      pdf/
      ai/
      audit/
    utils/
  types/
  styles/
supabase/
  migrations/
  seeds/
  policies/
  functions/
docs/
  mvp-architecture.md
```

### Convenções estruturais
- telas do produto em português
- código em inglês técnico
- tabelas em `snake_case`
- regras de domínio críticas em `src/lib/domain`
- integração externa apenas em `src/lib/server`
- relatórios com templates versionados

## 3. Modelo de Dados Resumido

### Entidades principais

#### `questionnaires`
- versão publicável do questionário
- campos mínimos: `id`, `name`, `version`, `status`, `created_at`, `published_at`

#### `questionnaire_sections`
- seções ordenadas do questionário
- relação: `questionnaire_sections.questionnaire_id -> questionnaires.id`

#### `questionnaire_questions`
- perguntas ordenadas por seção
- relação: `questionnaire_questions.section_id -> questionnaire_sections.id`
- campos críticos:
  - `prompt`
  - `answer_type`
  - `scoring_direction`
  - `weight`
  - `is_required`
  - `is_active`

#### `campaigns`
- instância operacional de coleta
- relação: `campaigns.questionnaire_id -> questionnaires.id`
- campos mínimos:
  - `name`
  - `sector`
  - `unit`
  - `language`
  - `status`
  - `start_date`
  - `end_date`
  - `created_by`

#### `campaign_tokens`
- acesso anônimo single-use
- relação: `campaign_tokens.campaign_id -> campaigns.id`
- campos mínimos:
  - `token_hash`
  - `status`
  - `expires_at`
  - `used_at`
  - `delivery_channel`

#### `survey_submissions`
- cabeçalho de resposta anônima
- relações:
  - `survey_submissions.campaign_id -> campaigns.id`
  - `survey_submissions.token_id -> campaign_tokens.id`
- campos mínimos:
  - `mode` sempre `anonymous` no MVP
  - `observation_text`
  - `submitted_at`
  - `receipt_code`

#### `submission_answers`
- respostas por pergunta
- relações:
  - `submission_answers.submission_id -> survey_submissions.id`
  - `submission_answers.question_id -> questionnaire_questions.id`
- campos críticos:
  - `answer_raw`
  - `risk_value`

#### `analysis_results`
- snapshot analítico auditável
- pode existir para resposta individual e consolidado de campanha
- campos:
  - `campaign_id`
  - `submission_id` nullable
  - `analysis_scope`
  - `section_summary_json`
  - `critical_items_json`
  - `classification_version`

#### `generated_reports`
- metadados dos relatórios gerados server-side
- relações:
  - `generated_reports.campaign_id -> campaigns.id`
  - `generated_reports.submission_id -> survey_submissions.id` nullable
- campos:
  - `report_type`
  - `template_version`
  - `status`
  - `error_message`
  - `payload_json`
  - `storage_path`
  - `requested_at`
  - `generated_at`

#### `action_plans`
- ações editáveis por RH
- relação: `action_plans.campaign_id -> campaigns.id`
- campos:
  - `risk_identified`
  - `section_name`
  - `root_cause`
  - `measure`
  - `owner_name`
  - `due_date`
  - `status`
  - `origin`

#### `action_plan_history`
- trilha de mudanças do plano de ação
- relação: `action_plan_history.action_plan_id -> action_plans.id`

#### `monitoring_indicators`
- indicadores por campanha e período
- relação: `monitoring_indicators.campaign_id -> campaigns.id`

#### `audit_logs`
- eventos administrativos rastreáveis
- não registrar PII do respondente anônimo

### Relacionamentos centrais
- `questionnaires 1:N questionnaire_sections`
- `questionnaire_sections 1:N questionnaire_questions`
- `questionnaires 1:N campaigns`
- `campaigns 1:N campaign_tokens`
- `campaigns 1:N survey_submissions`
- `survey_submissions 1:N submission_answers`
- `campaigns 1:N analysis_results`
- `campaigns 1:N action_plans`
- `action_plans 1:N action_plan_history`
- `campaigns 1:N monitoring_indicators`

### Regras de dados críticas
- bloquear publicação de questionário sem `scoring_direction` em todas as perguntas ativas
- não armazenar nome, CPF, telefone ou matrícula em fluxo anônimo
- armazenar token como hash, não em texto puro
- invalidar token na mesma transação da submissão final
- salvar `risk_value` por item para auditabilidade
- versionar regra de classificação e template de relatório
- `submission_answers.answer_raw` deve respeitar a escala inteira de `1..5`
- `observation_text` é opcional, mas deve ser tratado como texto anônimo e pode sofrer redação server-side
- `questionnaire_questions.weight` define ponderação oficial na média da seção; quando ausente, assume `1`

## 4. Lista de Rotas e Ações

### Rotas de tela
- `/responder/[token]`: fluxo PWA anônimo
- `/obrigado/[receiptCode]`: confirmacao publica por recibo opaco com expiracao
- `/campanhas`: listagem e gestão
- `/campanhas/[id]`: detalhes, adesão e consolidados
- `/campanhas/[id]/relatorio`: visão analítica
- `/questionarios`: listagem
- `/questionarios/novo`: criação
- `/questionarios/[id]`: edição e publicação
- `/plano-de-acao`: listagem
- `/plano-de-acao/[campaignId]`: gestão por campanha
- `/indicadores`: listagem e lançamento

### Endpoints públicos
- `GET /api/public/tokens/[token]/validate`
  - valida expiração, status e campanha
- `POST /api/public/submissions`
  - recebe payload completo da resposta
  - valida token
  - calcula risco no backend
  - persiste submissão
  - marca token como usado
  - dispara geração do relatório individual
  - rejeita respostas fora da escala `1..5`
  - permite perguntas opcionais em branco

### Endpoints administrativos
- `GET /api/admin/campaigns`
- `POST /api/admin/campaigns`
- `GET /api/admin/campaigns/[id]`
- `PATCH /api/admin/campaigns/[id]`
- `POST /api/admin/campaigns/[id]/tokens`
- `GET /api/admin/campaigns/[id]/analytics`
- `POST /api/admin/campaigns/[id]/report`
- `GET /api/admin/questionnaires`
- `POST /api/admin/questionnaires`
- `GET /api/admin/questionnaires/[id]`
- `PATCH /api/admin/questionnaires/[id]`
- `POST /api/admin/questionnaires/[id]/publish`
- `GET /api/admin/action-plans`
- `POST /api/admin/action-plans`
- `PATCH /api/admin/action-plans/[id]`
- `GET /api/admin/indicators`
- `POST /api/admin/indicators`
- `GET /api/admin/reports/[id]/download`
- `GET /api/admin/risk-inventory/versions?campaignId=...`
- `GET /api/admin/risk-inventory/versions/[versionId]`
- `POST /api/admin/risk-inventory/revisions`
- `POST /api/admin/risk-inventory/versions/[versionId]/publish`
- `GET /api/admin/risk-inventory/versions/[versionId]/export`
- `POST /api/admin/ai/recommendations`

### Ações de negócio principais
- criar rascunho de questionário
- adicionar seção e perguntas
- publicar questionário validando `scoring_direction`
- criar campanha com período e questionário
- emitir lote de tokens/QR
- validar token anônimo
- submeter questionário
- calcular risco por item e seção
- classificar risco consolidado
- detectar itens críticos
- registrar relatorio individual como pending sem bloquear a submissao
- gerar relatório analítico de campanha
- sugerir ações via IA com guardrails
- editar plano de ação com histórico
- registrar indicador e calcular variação

## 5. Backlog Técnico por Fases

### Fase 0 - Fundação
- criar projeto Next.js com App Router e Tailwind
- configurar Supabase client, server client e auth base
- definir schema inicial e migrations
- criar RBAC mínimo para Admin, RH/Segurança e Gestor
- implantar validação Zod e convenções de erro
- criar módulo único `risk-engine`

### Fase 1 - Núcleo de configuração
- CRUD de questionários, seções e perguntas
- regra de publicação com `scoring_direction` obrigatório
- CRUD de campanhas
- geração de tokens single-use e QR
- políticas de acesso e auditoria administrativa básica

### Fase 2 - Coleta anônima
- tela PWA `/responder/[token]`
- validação pública de token
- submissão anônima com transação
- cálculo oficial no backend
- persistência de `submission_answers.risk_value`
- recibo de envio sem identificação pessoal

### Fase 3 - Consolidação e relatórios
- agregações por seção e campanha
- detecção de itens críticos
- geração server-side do relatório individual
- geração server-side do relatório analítico
- armazenamento de PDF no Supabase Storage
- dashboard inicial da campanha

### Fase 4 - Ação e acompanhamento
- CRUD de plano de ação
- histórico de alterações do plano de ação
- módulo de indicadores
- exportações CSV/Excel anonimizadas
- versionamento documental do inventario com export oficial somente da revisao `published`

### Fase 5 - IA com guardrails
- endpoint seguro para recomendações estruturadas
- payload mínimo e controlado
- proibição explícita de diagnóstico médico e culpabilização
- recomendação obrigatória de validação humana para risco alto/crítico
- registro do prompt versionado e da resposta estruturada

### Fase 6 - Hardening do MVP
- limiares de anonimato em filtros analíticos
- observabilidade de jobs e geração de relatórios
- revisão de RLS e retenção
- testes de contrato das regras de risco
- testes e2e dos fluxos críticos

## 6. Riscos Técnicos e Cuidados

### Riscos principais
- quebra indireta de anonimato por filtros excessivos
- inconsistência entre cálculo exibido no frontend e cálculo oficial
- questionário publicado com metadados incompletos
- token reutilizado por falha transacional
- PDF gerado com dados sem snapshot auditável
- IA responder fora dos guardrails

### Cuidados obrigatórios
- usar limiar mínimo de amostragem em dashboards consolidados
- bloquear exibição analítica quando o agrupamento tiver menos de `5` respostas
- centralizar fórmula:
  - pergunta positiva: `risk = 6 - answer`
  - pergunta negativa: `risk = answer`
- centralizar escala com operadores exatos em décimos arredondados:
  - `1.0 <= media <= 1.5 = MUITO BAIXO`
  - `1.6 <= media <= 2.5 = BAIXO`
  - `2.6 <= media <= 3.5 = MEDIO`
  - `3.6 <= media <= 4.5 = ALTO`
  - `4.6 <= media <= 5.0 = CRITICO`
- tratar geração de submissão + invalidação de token como operação atômica
- salvar snapshots de análise e versão de template antes de gerar PDF
- limitar IA a entrada estruturada e saída JSON validada
- não expor queries analíticas diretamente ao cliente

### Decisões técnicas críticas que precisam ser preservadas
- anonimato é o padrão do MVP
- modo identificado não entra na primeira implementação
- cálculo de risco nunca sai do backend
- relatórios PDF sempre server-side
- `scoring_direction` é obrigatório para publicação
- `weight` participa da média ponderada oficial do MVP
- item crítico é regra por pergunta (`risk_value >= 4`)
- classificação de seção é regra por média ponderada da seção
- regras de classificação residem em um módulo único de domínio
- plano de ação deve ser editável com histórico
- IA é suporte à análise, não motor decisório final

