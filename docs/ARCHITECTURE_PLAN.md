# Plano de Adequação Arquitetural - NR-1 Survey & Risk Manager

## Visão Geral das Modificações Necessárias

Este documento traduz a GAP Analysis em **ações técnicas concretas**, organizadas por camada da arquitetura, com justificativa de mercado para cada decisão.

---

## CAMADA 1: DADOS E SCHEMA

### 1.1 Novas Tabelas Necessárias

```sql
-- OUVIDORIA / CANAL DE DENÚNCIAS
create table public.whistleblower_reports (
  id uuid primary key default gen_random_uuid(),
  report_hash text not null unique,        -- SHA-256 do conteúdo original
  category text not null,                   -- harassment, discrimination, safety, other
  description_hash text not null,           -- Conteúdo criptografado (nunca texto puro)
  sector text,
  unit text,
  status text not null default 'open',      -- open, investigating, resolved, dismissed
  created_at timestamptz not null default timezone('utc', now()),
  resolved_at timestamptz,
  resolved_by uuid references public.profiles (id)
);

-- TREINAMENTOS
create table public.trainings (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  type text not null,                       -- mandatory, optional, nr_specific
  nr_reference text,                        -- ex: "NR-1", "NR-5"
  modality text not null,                   -- presencial, ead
  min_load_hours integer not null default 8,
  validity_months integer,                  -- null = sem expiração
  created_at timestamptz not null default timezone('utc', now())
);

create table public.training_sessions (
  id uuid primary key default gen_random_uuid(),
  training_id uuid not null references public.trainings (id),
  start_date timestamptz not null,
  end_date timestamptz not null,
  location text,
  instructor_name text,
  max_participants integer,
  status text not null default 'scheduled'  -- scheduled, ongoing, completed, cancelled
);

create table public.training_enrollments (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.training_sessions (id),
  user_id uuid not null references public.profiles (id),
  status text not null default 'enrolled',  -- enrolled, attended, absent, cancelled
  certificate_issued boolean not null default false,
  certificate_path text,
  enrolled_at timestamptz not null default timezone('utc', now()),
  completed_at timestamptz
);

-- NOTIFICAÇÕES
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles (id),
  type text not null,                       -- risk_alert, training_expiry, action_due, harassment_detected
  title text not null,
  body text,
  entity_type text,
  entity_id uuid,
  is_read boolean not null default false,
  created_at timestamptz not null default timezone('utc', now())
);

-- CONFORMIDADE NR-1
create table public.compliance_records (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null,                -- campaign, training, action_plan, whistleblower
  entity_id uuid not null,
  compliance_status text not null,          -- compliant, partial, non_compliant
  nr_items text[] not null,                 -- ex: ['NR-1.5.3.1', 'NR-1.5.3.2']
  last_reviewed_at timestamptz,
  reviewed_by uuid references public.profiles (id),
  next_review_due date,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

-- ENVIO ESOCIAL
create table public.esocial_submissions (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,                 -- S-2240
  event_xml xml not null,
  status text not null default 'pending',   -- pending, sent, processed, error, rectified
  sent_at timestamptz,
  processed_at timestamptz,
  receipt_number text,
  error_message text,
  campaign_id uuid references public.campaigns (id),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);
```

### 1.2 Alterações nas Tabelas Existentes

```sql
-- Adicionar colunas de mapeamento COPSOQ-III nas seções
alter table public.questionnaire_sections
  add column if not exists copsoq_factor text,     -- 13 fatores do MTE
  add column if not exists copsoq_dimension text;  -- Demandas, Influência, Desenvolvimento, etc.

-- Adicionar colunas de evidência de impacto nos planos de ação
alter table public.action_plans
  add column if not exists impact_evidence text,   -- Descrição do resultado após ação
  add column if not exists impact_metric numeric(12,2), -- Métrica antes/depois
  add column if not exists completed_at timestamptz;

-- Adicionar retenção de dados
alter table public.audit_logs
  add column if not exists retention_until date default (timezone('utc', now()) + interval '20 years');

-- Índices para novas colunas
create index if not exists questionnaire_sections_copsoq_factor_idx 
  on public.questionnaire_sections (copsoq_factor);
create index if not exists action_plans_status_idx 
  on public.action_plans (status);
create index if not exists action_plans_due_date_idx 
  on public.action_plans (due_date) where due_date is not null;
create index if not exists notifications_user_unread_idx 
  on public.notifications (user_id, is_read) where is_read = false;
create index if not exists esocial_submissions_status_idx 
  on public.esocial_submissions (status);
create index if not exists training_enrollments_user_status_idx 
  on public.training_enrollments (user_id, status);
```

---

## CAMADA 2: BACKEND - SERVIÇOS NOVOS

### 2.1 Motor de Notificações

```
src/lib/server/services/
├── notification-service.ts       ← NOVO
│   ├── createNotification()      → Cria notificação para usuário
│   ├── listUserNotifications()   → Lista não lidas
│   ├── markAsRead()              → Marca como lida
│   ├── checkActionPlanDueDates() → Cron: alerta 7 dias antes do vencimento
│   ├── checkTrainingExpiries()   → Cron: alerta certificados a expirar
│   └── alertCriticalRisk()       → Trigger: notifica RH/SESMT quando risco >= 4
```

### 2.2 Módulo de Treinamentos

```
src/lib/server/services/
├── training-service.ts           ← NOVO
│   ├── listTrainings()           → Lista com filtros
│   ├── createTraining()          → Cria treinamento
│   ├── createSession()           → Agenda sessão
│   ├── enrollUser()              → Matricula usuário
│   ├── markAttendance()          → Registra presença
│   ├── issueCertificate()        → Gera certificado HTML/PDF
│   └── getExpiringCertificates() → Lista certificados a expirar (30 dias)
```

### 2.3 Ouvidoria / Canal de Denúncias

```
src/lib/server/services/
├── whistleblower-service.ts      ← NOVO
│   ├── submitAnonymousReport()   → Recebe texto, hash + criptografa, persiste
│   ├── listReports()             → Lista filtrada por escopo (RLS)
│   ├── updateReportStatus()      → open → investigating → resolved
│   ├── assignInvestigator()      → Atribui investigador
│   └── detectHarassmentNLP()     → NOVO: analisa observation_text com keywords + padrões
```

### 2.4 Integração eSocial

```
src/lib/server/services/
├── esocial-service.ts            ← NOVO
│   ├── generateS2240Xml()        → Monta XML do evento S-2240 com dados do inventário
│   ├── signWithCertificate()     → Assina com certificado A1/A3
│   ├── sendToESocial()           → POST para API do eSocial
│   ├── checkProcessingStatus()   → Poll: verifica se foi processado
│   ├── rectifySubmission()       → Gera retificação
│   └── listSubmissions()         → Lista com filtros de status
```

### 2.5 NLP - Detecção de Assédio

```
src/lib/server/
├── nlp/
│   ├── harassment-detector.ts    ← NOVO
│   │   ├── analyzeText()         → Analisa texto aberto com keywords + regex
│   │   ├── detectHarassmentPatterns()  → Padrões de assédio moral/sexual
│   │   ├── detectPII()           → Detecta dados pessoais (já existe em anonymity policy)
│   │   └── classifySeverity()    → low, medium, high, critical
│   └── harassment-keywords.ts    ← NOVO
│       └── PT_BR_HARASSMENT_KEYWORDS  → Lista de termos em português
```

### 2.6 Motor de Conformidade NR-1

```
src/lib/server/services/
├── compliance-service.ts         ← NOVO
│   ├── calculateComplianceScore() → Score 0-100 de conformidade NR-1
│   ├── getComplianceDashboard()   → Dashboard para diretoria
│   ├── checkItem1533Compliance()  → Verifica participação dos trabalhadores
│   ├── generateMTEExport()        → PDF formatado para fiscalização
│   └── getNonCompliantItems()     → Lista itens fora de conformidade
```

---

## CAMADA 3: BACKEND - REPOSITÓRIOS NOVOS

```
src/lib/server/repositories/
├── training-repository.ts        ← NOVO
├── notification-repository.ts     ← NOVO
├── whistleblower-repository.ts    ← NOVO
├── esocial-repository.ts          ← NOVO
├── compliance-repository.ts       ← NOVO
└── campaigns-repository.ts        ← EXISTENTE (adicionar: updateCampaign())
```

---

## CAMADA 4: BACKEND - ENDPOINTS NOVOS

```
src/app/api/
├── admin/
│   ├── trainings/                 ← NOVO
│   │   ├── route.ts               → GET (lista), POST (cria)
│   │   └── [id]/
│   │       ├── route.ts           → GET (detalhe), PATCH (atualiza)
│   │       └── sessions/
│   │           ├── route.ts       → POST (cria sessão)
│   │           └── [sessionId]/
│   │               ├── route.ts   → GET, PATCH
│   │               └── enrollments/
│   │                   ├── route.ts       → POST (matricula)
│   │                   └── [enrollmentId]/
│   │                       └── route.ts   → PATCH (presença, certificado)
│   ├── notifications/             ← NOVO
│   │   └── route.ts               → GET (lista do usuário)
│   ├── notifications/[id]/
│   │   └── route.ts               → PATCH (marca como lida)
│   ├── whistleblower/             ← NOVO
│   │   ├── route.ts               → GET (lista), POST (cria anônimo)
│   │   └── [id]/
│   │       └── route.ts           → GET (detalhe), PATCH (atualiza status)
│   ├── esocial/                   ← NOVO
│   │   ├── route.ts               → GET (lista submissions)
│   │   └── [id]/
│   │       ├── route.ts           → GET (detalhe), POST (retifica)
│   │       └── send/
│   │           └── route.ts       → POST (envia para eSocial)
│   └── compliance/                ← NOVO
│       ├── route.ts               → GET (dashboard de conformidade)
│       └── export/
│           └── route.ts           → POST (gera PDF para MTE)
└── public/
    └── whistleblower/             ← NOVO (sem autenticação)
        └── route.ts               → POST (denúncia anônima)
```

---

## CAMADA 5: FRONTEND - PÁGINAS NOVAS

```
src/app/
├── ouvidoria/                     ← NOVO
│   ├── page.tsx                   → Lista de denúncias (admin/hr)
│   └── nova/
│       └── page.tsx               → Formulário anônimo de denúncia
├── treinamentos/                  ← NOVO
│   ├── page.tsx                   → Lista de treinamentos
│   ├── [id]/
│   │   └── page.tsx               → Detalhe + sessões + matrículas
│   └── certificado/[enrollmentId]/
│       └── page.tsx               → Visualização do certificado
├── conformidade/                  ← NOVO
│   └── page.tsx                   → Dashboard de conformidade NR-1
└── notificacoes/                  ← NOVO
    └── page.tsx                   → Central de notificações do usuário
```

---

## CAMADA 6: FRONTEND - COMPONENTES NOVOS

```
src/components/
├── portal/
│   ├── notifications-bell.tsx     ← NOVO
│   ├── compliance-score-card.tsx  ← NOVO
│   └── training-list.tsx          ← NOVO
├── training/
│   ├── training-card.tsx          ← NOVO
│   ├── session-manager.tsx        ← NOVO
│   ├── enrollment-manager.tsx     ← NOVO
│   └── certificate-viewer.tsx     ← NOVO
├── whistleblower/
│   ├── anonymous-report-form.tsx  ← NOVO
│   └── report-list.tsx            ← NOVO
└── survey/
    └── respondent-survey-form.tsx ← EXISTENTE (melhorar: adicionar COPSOQ-III)
```

---

## CAMADA 7: VALIDAÇÕES ZOD - NOVOS SCHEMAS

```
src/lib/validation/
├── training.ts                    ← NOVO
│   ├── trainingSchema             → title, description, type, nrReference, modality, minLoadHours, validityMonths
│   └── enrollmentSchema           → sessionId, userId
├── whistleblower.ts               ← NOVO
│   └── whistleblowerReportSchema  → category, description (max 4000), sector, unit
├── notification.ts                ← NOVO
│   └── notificationPatchSchema    → isRead
├── esocial.ts                     ← NOVO
│   └── s2240Schema                → campaignId, environmentalAgents, riskFactors
└── compliance.ts                  ← NOVO
    └── complianceExportSchema     → campaignIds, format (pdf/xlsx), nrItems[]
```

---

## CAMADA 8: MODIFICAÇÕES EM ARQUIVOS EXISTENTES

### 8.1 Questionários (sair do stub)

**Arquivos afetados:**
- `src/app/api/admin/questionnaires/route.ts` → Implementar GET e POST reais
- `src/app/api/admin/questionnaires/[id]/route.ts` → Implementar GET e PATCH reais
- `src/app/api/admin/questionnaires/[id]/publish/route.ts` → Implementar POST real
- `src/lib/server/services/questionnaire-service.ts` → NOVO arquivo
- `src/lib/server/repositories/questionnaire-repository.ts` → NOVO arquivo

### 8.2 Campanhas (sair do stub)

**Arquivos afetados:**
- `src/app/api/admin/campaigns/[id]/route.ts` → Implementar GET e PATCH reais
- `src/app/api/admin/campaigns/[id]/tokens/route.ts` → Implementar POST real
- `src/lib/server/repositories/campaigns-repository.ts` → Adicionar `updateCampaign()`, `generateTokens()`

### 8.3 Motor de Risco (adaptar para COPSOQ-III)

**Arquivos afetados:**
- `src/lib/domain/risk/engine.ts` → Adicionar mapeamento de fator COPSOQ
- `src/lib/domain/risk/copsoq-iii-mapping.ts` → NOVO arquivo com 13 fatores

### 8.4 Submissão (adicionar NLP)

**Arquivos afetados:**
- `src/lib/server/services/submission-service.ts` → Adicionar chamada ao NLP em `observationText`

### 8.5 Sidebar (atualizar navegação)

**Arquivos afetados:**
- `src/components/portal/portal-shell.tsx` → Adicionar links: Ouvidoria, Treinamentos, Conformidade, Notificações

---

## CAMADA 9: VARIÁVEIS DE AMBIENTE - NOVAS

```env
# Novas variáveis necessárias
ESOCIAL_CERTIFICATE_PATH=/path/to/certificate.pfx     ← Caminho do cert. digital A1
ESOCIAL_CERTIFICATE_PASSWORD=*****                       ← Senha do certificado
ESOCIAL_API_URL=https://webservices.esocial.gov.br       ← URL da API do eSocial
ESOCIAL_ENVIRONMENT=production                           ← production ou sandbox

SMTP_HOST=smtp.example.com                               ← Para notificações por email
SMTP_PORT=587
SMTP_USER=notifications@seudominio.com
SMTP_PASSWORD=*****
SMTP_FROM=NR-1 System <notifications@seudominio.com>

WHATSAPP_API_URL=https://api.zapier.com/...              ← Para convites via WhatsApp (opcional)
WHATSAPP_API_KEY=*****

NLP_HARASSMENT_ENABLED=true                              ← Habilitar detecção de assédio
NLP_MODEL=keyword_v1                                     ← Modelo: keyword ou ML futuro

DATA_RETENTION_YEARS=20                                  ← Retenção de dados legais
```

---

## CAMADA 10: CRON JOBS / AGENDAMENTO

```
src/lib/server/cron/
├── check-action-plan-due-dates.ts    ← Roda diariamente, alerta 7 dias antes
├── check-training-expiries.ts        ← Roda semanalmente, alerta 30 dias antes
├── esocial-pending-submissions.ts    ← Roda a cada hora, envia pendentes
├── weekly-risk-monitor.ts            ← Roda semanalmente, dispara pesquisa contínua
└── data-retention-cleanup.ts         ← Roda mensalmente, limpa dados expirados
```

**Nota:** No Vercel, usar **Vercel Cron Jobs** ou **GitHub Actions scheduled workflows**.

---

## CAMADA 11: SEED DATA - QUESTIONÁRIO COPSOQ-III

```
supabase/seeds/
└── copsoq-iii-nr1-seed.sql           ← NOVO
    └── 13 fatores × ~5 perguntas = ~65 perguntas completas
        Mapeadas para os 13 fatores do MTE:
        1. Demandas do trabalho (quantitativas)
        2. Demandas do trabalho (emocionais)
        3. Influência no trabalho
        4. Possibilidades de desenvolvimento
        5. Significado do trabalho
        6. Comprometimento e identificação
        7. Justiça e respeito
        8. Relações sociais com colegas
        9. Qualidade de liderança
        10. Conflito trabalho-vida
        11. Sobrecarga emocional
        12. Assédio moral
        13. Ameaça de violência
```

---

## RESUMO DE ESFORÇO POR CAMADA

| Camada | Arquivos Novos | Arquivos Modificados | Esforço |
|--------|---------------|---------------------|---------|
| 1. Schema e Dados | 1 SQL migration | 1 SQL migration | 2-3 dias |
| 2. Serviços | 5 novos | 2 existentes | 8-10 dias |
| 3. Repositórios | 5 novos | 1 existente | 5-7 dias |
| 4. Endpoints API | ~15 novos | 5 existentes | 6-8 dias |
| 5. Páginas Frontend | 4 novas | 1 existente | 5-7 dias |
| 6. Componentes | 8 novos | 2 existentes | 6-8 dias |
| 7. Validações Zod | 5 novas | 0 | 2-3 dias |
| 8. Modificações | 0 | 6 existentes | 5-7 dias |
| 9. Infra/Env | 1 .env update | 0 | 1 dia |
| 10. Cron Jobs | 5 novos | 0 | 3-5 dias |
| 11. Seed Data | 1 SQL | 0 | 2-3 dias |
| **TOTAL** | **~49 arquivos** | **~17 arquivos** | **45-64 dias** |

---

## ARQUITETURA FINAL RECOMENDADA

```
┌─────────────────────────────────────────────────────────┐
│                  FRONTEND (Next.js 15)                   │
├─────────────────────────────────────────────────────────┤
│  Páginas: Login, Campanhas, Questionários, Responder     │
│  + NOVAS: Ouvidoria, Treinamentos, Conformidade,         │
│           Notificações, Certificados                     │
│                                                          │
│  Componentes: Portal, Survey, Indicators, ActionPlans    │
│  + NOVOS: Training, Whistleblower, Compliance,           │
│           Notifications, Certificate                     │
└───────────────────────────┬─────────────────────────────┘
                            │ Server Actions / API Routes
┌───────────────────────────▼─────────────────────────────┐
│                  BACKEND (Next.js API)                   │
├─────────────────────────────────────────────────────────┤
│  Serviços: Auth, Submission, Dashboard, Report,         │
│            Indicator, ActionPlan, AI Recommendations     │
│  + NOVOS: Notification, Training, Whistleblower,        │
│           eSocial, Compliance, NLP Harassment           │
│                                                          │
│  Repositórios: Campaigns, Analytics, Indicators,         │
│                ActionPlans, Reports                      │
│  + NOVOS: Training, Notification, Whistleblower,         │
│           eSocial, Compliance, Questionnaire            │
│                                                          │
│  Domínio: Risk Engine, Receipts, Anonymity              │
│  + NOVO: COPSOQ-III Mapping, Harassment Detection       │
└───────────────────────────┬─────────────────────────────┘
                            │ Supabase Client (service_role)
┌───────────────────────────▼─────────────────────────────┐
│              BANCO DE DADOS (Supabase)                   │
├─────────────────────────────────────────────────────────┤
│  Tabelas: profiles, campaigns, questionnaires,           │
│           submissions, analysis_results, reports,        │
│           action_plans, indicators, audit_logs           │
│  + NOVAS: whistleblower_reports, trainings,             │
│           training_sessions, training_enrollments,       │
│           notifications, compliance_records,             │
│           esocial_submissions                            │
└─────────────────────────────────────────────────────────┘
                            │ Integrações externas
┌───────────────────────────┐    ┌────────────────────────┐
│  eSocial API (S-2240)     │    │  SMTP / WhatsApp API   │
│  Cert. Digital A1/A3      │    │  OpenAI API (NLP)      │
└───────────────────────────┘    └────────────────────────┘
```

---

## PRÓXIMOS PASSOS

1. **Aprovar este plano** com o time
2. **Criar branches** por camada (ex: `feature/training-module`, `feature/esocial-integration`)
3. **Executar Fase 1** (sair do stub + COPSOQ-III) — 2-3 semanas
4. **Testar com usuários reais** antes de investir em eSocial
5. **Executar Fase 2** (conformidade legal) — 3-4 semanas
6. **Executar Fase 3** (diferenciação) — 4-6 semanas
