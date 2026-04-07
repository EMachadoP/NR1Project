# Plano de Execução Fase a Fase — NR-1 Survey & Risk Manager

> Cada fase tem: **objetivo claro**, **passo-a-passo técnico**, **critérios de aceite** e **riscos**.
> Ordem de execução é **obrigatória** — fases subsequentes dependem das anteriores.

---

# FASE 1: Sair do Stub — Sistema Funcional (2-3 semanas)

**Objetivo:** Tornar o sistema **utilizável de ponta a ponta**. Um usuário admin deve conseguir criar um questionário, criar uma campanha, gerar tokens e coletar respostas — tudo via UI e API reais.

---

## FASE 1.1 — Repositórios e Serviços Base

**O que fazer:** Criar a camada de dados que os endpoints stub precisam.

### Passo 1.1.1 — Criar `questionnaire-repository.ts`

**Arquivo novo:** `src/lib/server/repositories/questionnaire-repository.ts`

**Funções necessárias:**

```typescript
// Lista todos os questionários (com filtro opcional de status)
export async function listQuestionnaires(status?: QuestionnaireStatus)

// Busca questionário completo com seções e perguntas aninhadas
export async function getQuestionnaireWithDetails(id: string)

// Cria questionário draft (sem seções ainda)
export async function createQuestionnaire(input: { name: string; version: string })

// Adiciona uma seção ao questionário
export async function addSection(questionnaireId: string, input: { name: string; orderIndex: number })

// Adiciona pergunta a uma seção
export async function addQuestion(sectionId: string, input: { prompt: string; answerType: string; scoringDirection: string; weight?: number; isRequired?: boolean; orderIndex: number })

// Atualiza questionário draft (nome, versão)
export async function updateQuestionnaire(id: string, input: Partial<{ name: string; version: string }>)

// Publica questionário (muda status + seta published_at)
export async function publishQuestionnaire(id: string)

// Deleta questionário (apenas draft)
export async function deleteQuestionnaire(id: string)
```

**Tabelas envolvidas:** `questionnaires`, `questionnaire_sections`, `questionnaire_questions`

**Regras de negócio:**
- Só pode deletar questionário em `draft`
- Só pode publicar se **todas** as perguntas ativas tiverem `scoring_direction` preenchido
- Ao publicar: `status = 'published'`, `published_at = now()`
- Usar `createAdminSupabaseClient()` (service_role, bypass RLS)

---

### Passo 1.1.2 — Criar `questionnaire-service.ts`

**Arquivo novo:** `src/lib/server/services/questionnaire-service.ts`

**Funções:**

```typescript
// Valida input com questionnaireDraftSchema (Zod)
// Cria questionário + seções + perguntas em transação lógica
export async function createQuestionnaireService(
  input: z.infer<typeof questionnaireDraftSchema>,
  actor: PortalSession
)

// Lista com filtro de status
export async function listQuestionnairesService(actor: PortalSession, status?: QuestionnaireStatus)

// Busca detalhes completos
export async function getQuestionnaireDetailsService(id: string, actor: PortalSession)

// Atualiza (apenas draft)
export async function updateQuestionnaireService(
  id: string,
  input: Partial<...>,
  actor: PortalSession
)

// Publica — valida scoring_direction de todas as perguntas ativas
export async function publishQuestionnaireService(id: string, actor: PortalSession)
// → Se alguma pergunta ativa SEM scoring_direction → throw erro "Todas as perguntas ativas devem ter scoring_direction definido"
// → Audit log: { entityType: 'questionnaire', entityId: id, action: 'publish' }
```

---

### Passo 1.1.3 — Criar `campaign-token-service.ts`

**Arquivo novo:** `src/lib/server/services/campaign-token-service.ts`

**Funções:**

```typescript
// Gera N tokens para uma campanha
export async function generateCampaignTokens(
  campaignId: string,
  quantity: number,            // ex: 50, 100, 500
  expiresDays: number,         // ex: 30 dias
  actor: PortalSession
)
// → Gera UUID v4 como token bruto
// → Hash SHA-256 com hashAnonymousToken()
// → Insere em campaign_tokens com status = 'available'
// → Retorna array de tokens brutos (única vez — nunca mais serão visíveis)

// Marca token como usado
export async function markTokenAsUsed(tokenId: string)

// Busca token por hash (já existe em respondent-repository.ts: findActiveTokenBundle)
```

---

### Passo 1.1.4 — Adicionar `updateCampaign` ao campaigns-repository

**Arquivo existente:** `src/lib/server/repositories/campaigns-repository.ts`

**Adicionar:**

```typescript
export async function updateCampaign(
  id: string,
  input: Partial<{
    name: string;
    sector: string;
    unit: string;
    status: CampaignStatus;
    start_date: string;
    end_date: string;
  }>
)
// → Valida end_date >= start_date
// → Retorna dados atualizados

export async function generateCampaignTokenBundle(
  campaignId: string,
  quantity: number,
  expiresAt: Date
)
// → Gera N tokens em batch dentro do banco
// → Retorna tokens brutos (array de strings)
```

---

### Critérios de Aceite — Fase 1.1

- [ ] `questionnaire-repository.ts` existe com 8+ funções
- [ ] `questionnaire-service.ts` existe com 5+ funções
- [ ] `campaign-token-service.ts` existe com 2+ funções
- [ ] `campaigns-repository.ts` tem `updateCampaign()` e `generateCampaignTokenBundle()`
- [ ] Todos os novos arquivos têm testes unitários
- [ ] `npm run typecheck` passa sem erros
- [ ] `npm test` passa com todos os testes novos

---

## FASE 1.2 — Implementar Endpoints Stubs

**O que fazer:** Substituir os retornos placeholder pelos serviços reais criados na Fase 1.1.

### Passo 1.2.1 — Questionários API

**Arquivo:** `src/app/api/admin/questionnaires/route.ts`

**GET — Substituir:**
```typescript
// DE (stub):
return NextResponse.json({ items: [], message: "List questionnaires." });

// PARA (real):
const actor = await requirePortalApiSession(["admin", "hr"]);
const questionnaires = await listQuestionnairesService(actor);
return NextResponse.json({ items: questionnaires });
```

**POST — Substituir:**
```typescript
// DE (stub):
return NextResponse.json({ message: "Create questionnaire draft." }, { status: 201 });

// PARA (real):
const actor = await requirePortalApiSession(["admin", "hr"]);
const body = await request.json();
const validated = questionnaireDraftSchema.parse(body);
const created = await createQuestionnaireService(validated, actor);
return NextResponse.json(created, { status: 201 });
```

---

**Arquivo:** `src/app/api/admin/questionnaires/[id]/route.ts`

**GET — Substituir:**
```typescript
// DE (stub):
return NextResponse.json({ id, message: "Fetch questionnaire detail." });

// PARA (real):
const actor = await requirePortalApiSession(["admin", "hr"]);
const { id } = await context.params;
const questionnaire = await getQuestionnaireDetailsService(id, actor);
if (!questionnaire) return new NextResponse("Not Found", { status: 404 });
return NextResponse.json(questionnaire);
```

**PATCH — Substituir:**
```typescript
// DE (stub):
return NextResponse.json({ id, message: "Update questionnaire draft." });

// PARA (real):
const actor = await requirePortalApiSession(["admin", "hr"]);
const { id } = await context.params;
const body = await request.json();
const updated = await updateQuestionnaireService(id, body, actor);
return NextResponse.json(updated);
```

---

**Arquivo:** `src/app/api/admin/questionnaires/[id]/publish/route.ts`

**POST — Substituir:**
```typescript
// DE (stub):
return NextResponse.json({ id, message: "Publish questionnaire only after..." });

// PARA (real):
const actor = await requirePortalApiSession(["admin", "hr"]);
const { id } = await context.params;
const published = await publishQuestionnaireService(id, actor);
return NextResponse.json(published);
```

---

### Passo 1.2.2 — Campanhas API

**Arquivo:** `src/app/api/admin/campaigns/[id]/route.ts`

**GET — Substituir:**
```typescript
// DE (stub):
return NextResponse.json({ id, message: "Fetch campaign detail." });

// PARA (real):
const actor = await requirePortalApiSession(["admin", "hr", "manager"]);
const { id } = await context.params;
const campaign = await getCampaign(id);
if (!campaign) return new NextResponse("Not Found", { status: 404 });
assertCampaignScope(actor, campaign);
return NextResponse.json(campaign);
```

**PATCH — Substituir:**
```typescript
// DE (stub):
return NextResponse.json({ id, message: "Update campaign detail." });

// PARA (real):
const actor = await requirePortalApiSession(["admin", "hr"]);
const { id } = await context.params;
const body = await request.json();
const validated = campaignCreateSchema.partial().parse(body);
const updated = await updateCampaign(id, validated);
return NextResponse.json(updated);
```

---

**Arquivo:** `src/app/api/admin/campaigns/[id]/tokens/route.ts`

**POST — Substituir:**
```typescript
// DE (stub):
return NextResponse.json({ campaignId: id, message: "Generate token batch..." }, { status: 201 });

// PARA (real):
const actor = await requirePortalApiSession(["admin", "hr"]);
const { id } = await context.params;
const body = await request.json();
const { quantity, expiresDays } = body;
const tokens = await generateCampaignTokens(id, quantity, expiresDays, actor);
return NextResponse.json({ campaignId: id, tokens, count: tokens.length }, { status: 201 });
```

---

### Critérios de Aceite — Fase 1.2

- [ ] `GET /api/admin/questionnaires` retorna lista real do banco
- [ ] `POST /api/admin/questionnaires` cria questionário com seções e perguntas
- [ ] `GET /api/admin/questionnaires/[id]` retorna detalhes completos
- [ ] `PATCH /api/admin/questionnaires/[id]` atualiza questionário draft
- [ ] `POST /api/admin/questionnaires/[id]/publish` publica com validação de scoring_direction
- [ ] `GET /api/admin/campaigns/[id]` retorna dados reais da campanha
- [ ] `PATCH /api/admin/campaigns/[id]` atualiza campanha
- [ ] `POST /api/admin/campaigns/[id]/tokens` gera tokens reais com hashes
- [ ] Todos os endpoints retornam 401/403/404 corretamente
- [ ] `npm run build` passa sem erros

---

## FASE 1.3 — UI de Questionários

**O que fazer:** Transformar a página placeholder `/questionarios` em UI funcional de CRUD.

### Passo 1.3.1 — Criar `QuestionnairesManager` (client component)

**Arquivo novo:** `src/components/portal/questionnaires-manager.tsx`

**Funcionalidades:**
- Lista questionários com status (badge colorido: draft=cinza, published=verde, archived=preto)
- Botão "Novo Questionário" → abre modal/form
- Formulário com:
  - Campo nome, versão
  - Seção dinâmica (adicionar/remover seções)
  - Perguntas dinâmicas por seção (adicionar/remover perguntas)
  - Cada pergunta: prompt, answer_type (dropdown), scoring_direction (dropdown positive/negative), weight (number), is_required (checkbox), order_index
- Botão "Publicar" → confirma → chama `POST /api/admin/questionnaires/[id]/publish`
- Botão "Excluir" → apenas se status = draft

---

### Passo 1.3.2 — Atualizar `/questionarios/page.tsx`

**Arquivo existente:** `src/app/questionarios/page.tsx`

**Substituir:**
```typescript
// DE (placeholder):
// Apenas PageShell com descrição

// PARA (real):
const session = await requirePortalSession(["admin", "hr"]);
const questionnaires = await listQuestionnairesService(session);

return (
  <PortalShell session={session} title="Questionários" ...>
    <QuestionnairesManager initialData={questionnaires} />
  </PortalShell>
);
```

---

### Critérios de Aceite — Fase 1.3

- [ ] `/questionarios` lista questionários reais
- [ ] Criar questionário com 2+ seções e 3+ perguntas funciona
- [ ] Publicar questionário valida scoring_direction
- [ ] Excluir questionário draft funciona
- [ ] UI responsiva e sem erros de TypeScript
- [ ] `npm run build` passa

---

## FASE 1.4 — UI de Geração de Tokens

**O que fazer:** Adicionar botão na página de detalhe de campanha para gerar tokens.

### Passo 1.4.1 — Atualizar `/campanhas/[id]/page.tsx`

**Arquivo existente:** `src/app/campanhas/[id]/page.tsx`

**Adicionar:**
- Seção "Tokens de Acesso" no dashboard
- Botão "Gerar Tokens" → modal com:
  - Campo quantidade (ex: 50, 100, 200, custom)
  - Campo expiração em dias (ex: 30, 60, 90)
  - Botão "Gerar" → chama `POST /api/admin/campaigns/[id]/tokens`
  - Exibe resultado: lista de tokens brutos com botão "Copiar todos" (CSV)
  - Aviso: "Estes tokens só aparecem uma vez. Salve-os imediatamente."

---

### Critérios de Aceite — Fase 1.4

- [ ] Botão "Gerar Tokens" aparece no dashboard de campanha
- [ ] Modal de geração funciona com validação
- [ ] Tokens são exibidos uma única vez após geração
- [ ] Tokens gerados funcionam em `/responder/[token]`
- [ ] `npm run build` passa

---

## FASE 1.5 — Seed Data COPSOQ-III

**O que fazer:** Criar questionário científico validado como padrão do sistema.

### Passo 1.5.1 — Criar seed SQL com COPSOQ-III adaptado à NR-1

**Arquivo novo:** `supabase/seeds/copsoq-iii-nr1-seed.sql`

**Conteúdo:**
- 1 questionário: "Pesquisa Psicossocial NR-1 (COPSOQ-III Adaptado)"
- 13 seções = 13 fatores do MTE (ver lista abaixo)
- ~65 perguntas (5 por fator em média)
- Cada pergunta com:
  - `scoring_direction` (positive ou negative)
  - `weight` = 1.0
  - `hazard_code` = fator correspondente (F1, F2, ... F13)
  - `answer_type` = 'likert_1_5'

**13 Fatores e suas seções:**

| # | Seção (Fator MTE) | Código | Perguntas | Direção |
|---|-------------------|--------|-----------|---------|
| 1 | Demandas Quantitativas | F1 | 5 | negative |
| 2 | Demandas Emocionais | F2 | 5 | negative |
| 3 | Influência no Trabalho | F3 | 5 | positive |
| 4 | Possibilidades de Desenvolvimento | F4 | 5 | positive |
| 5 | Significado do Trabalho | F5 | 5 | positive |
| 6 | Comprometimento e Identificação | F6 | 5 | positive |
| 7 | Justiça e Respeito | F7 | 5 | positive |
| 8 | Relações Sociais com Colegas | F8 | 5 | positive |
| 9 | Qualidade de Liderança | F9 | 5 | positive |
| 10 | Conflito Trabalho-Vida | F10 | 5 | negative |
| 11 | Sobrecarga Emocional | F11 | 5 | negative |
| 12 | Assédio Moral | F12 | 5 | negative |
| 13 | Ameaça de Violência | F13 | 5 | negative |

**Exemplo de perguntas (Fator 1 — Demandas Quantitativas):**

```sql
-- Seção
insert into public.questionnaire_sections (questionnaire_id, name, order_index, copsoq_factor, copsoq_dimension)
values ('ID_DO_QUESTIONARIO', 'Demandas Quantitativas do Trabalho', 0, 'F1', 'Demandas');

-- Perguntas
insert into public.questionnaire_questions (section_id, prompt, answer_type, scoring_direction, weight, is_required, is_active, order_index, hazard_code)
values
  ('ID_DA_SECAO', 'Com que frequência você não tem tempo suficiente para realizar suas tarefas?', 'likert_1_5', 'negative', 1.0, true, true, 0, 'F1'),
  ('ID_DA_SECAO', 'Você precisa trabalhar em ritmo acelerado?', 'likert_1_5', 'negative', 1.0, true, true, 1, 'F1'),
  ('ID_DA_SECAO', 'Você consegue fazer pausas adequadas durante o trabalho?', 'likert_1_5', 'positive', 1.0, true, true, 2, 'F1'),
  ('ID_DA_SECAO', 'A quantidade de trabalho interfere na qualidade da sua execução?', 'likert_1_5', 'negative', 1.0, true, true, 3, 'F1'),
  ('ID_DA_SECAO', 'Você consegue cumprir sua jornada sem horas extras?', 'likert_1_5', 'positive', 1.0, true, true, 4, 'F1');
```

---

### Passo 1.5.2 — Adicionar colunas COPSOQ ao schema

**Arquivo novo:** `supabase/migrations/20260408000000_copsoq_mapping.sql`

```sql
alter table public.questionnaire_sections
  add column if not exists copsoq_factor text,
  add column if not exists copsoq_dimension text;

create index if not exists questionnaire_sections_copsoq_factor_idx
  on public.questionnaire_sections (copsoq_factor);

comment on column public.questionnaire_sections.copsoq_factor is
  'COPSOQ-III factor code (F1-F13) aligned with MTE psychosocial factors.';

comment on column public.questionnaire_sections.copsoq_dimension is
  'COPSOQ-III dimension group: Demandas, Influência, Desenvolvimento, Relacionamentos, Valores, Saúde.';
```

---

### Critérios de Aceite — Fase 1.5

- [ ] Migration aplicada no Supabase
- [ ] Seed SQL cria questionário completo com 13 seções e 65 perguntas
- [ ] Todas as perguntas têm `scoring_direction` e `hazard_code`
- [ ] Questionário aparece em `/questionarios` após seed
- [ ] Pode ser publicado e usado em campanhas

---

## FASE 1.6 — Test End-to-End

**O que fazer:** Validar o fluxo completo do início ao fim.

### Cenário de Teste Completo:

1. **Admin faz login** em `/login`
2. **Cria questionário** em `/questionarios` (ou usa o seed COPSOQ-III)
3. **Publica questionário** → valida scoring_direction
4. **Cria campanha** vinculada ao questionário publicado
5. **Gera tokens** no dashboard da campanha (ex: 10 tokens, 30 dias)
6. **Copia um token** e acessa `/responder/[token]`
7. **Preenche questionário** completo + observação opcional
8. **Submete** → redireciona para `/obrigado/[receiptCode]`
9. **Admin acessa `/campanhas/[id]`** → vê dashboard com 1 resposta
10. **Repete passos 6-8** com mais 4 tokens (mínimo 5 para anonimato)
11. **Admin vê dashboard consolidado** → scores por seção, itens críticos
12. **Admin cria plano de ação** para item crítico em `/plano-de-acao`
13. **Admin gera relatório analítico** via endpoint `/api/admin/campaigns/[id]/report`
14. **Admin baixa relatório** via endpoint `/api/admin/reports/[id]/download`

---

### Critérios de Aceite — Fase 1.6

- [ ] Cenário completo funciona sem erros
- [ ] Dashboard bloqueado com <5 respostas (mostra motivo)
- [ ] Dashboard desbloqueado com >=5 respostas (mostra dados)
- [ ] `npm run build` passa
- [ ] `npm test` passa (adicionar testes de integração)
- [ ] **Sistema está FUNCIONAL e UTILIZÁVEL**

---

### 🏁 Entregável da Fase 1

> **Um usuário admin consegue:**
> - Criar e publicar questionários com metodologia COPSOQ-III
> - Criar campanhas vinculadas
> - Gerar tokens de acesso
> - Coletar respostas anônimas
> - Ver dashboards com análise de risco
> - Criar planos de ação
> - Gerar e baixar relatórios
>
> **O sistema está pronto para uso interno** (ainda sem conformidade legal completa).

---

# FASE 2: Conformidade Legal (3-4 semanas)

**Objetivo:** Cumprir as exigências legais da NR-1 atualizada (Portaria MTE nº 1.419/2024). Sem esta fase, o sistema não sobrevive a uma fiscalização.

---

## FASE 2.1 — Schema Novas Tabelas

**O que fazer:** Criar as tabelas de ouvidoria, treinamentos, notificações e conformidade.

### Passo 2.1.1 — Migration: Novas Tabelas

**Arquivo novo:** `supabase/migrations/20260409000000_phase5_compliance_tables.sql`

```sql
-- OUVIDORIA / CANAL DE DENÚNCIAS
create table public.whistleblower_reports (
  id uuid primary key default gen_random_uuid(),
  report_hash text not null unique,
  category text not null check (category in ('harassment_moral', 'harassment_sexual', 'discrimination', 'safety', 'other')),
  description_hash text not null,
  sector text,
  unit text,
  status text not null default 'open' check (status in ('open', 'investigating', 'resolved', 'dismissed')),
  created_at timestamptz not null default timezone('utc', now()),
  resolved_at timestamptz,
  resolved_by uuid references public.profiles (id)
);

-- TREINAMENTOS
create table public.trainings (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  type text not null check (type in ('mandatory', 'optional', 'nr_specific')),
  nr_reference text,
  modality text not null check (modality in ('presencial', 'ead')),
  min_load_hours integer not null default 8,
  validity_months integer,
  created_at timestamptz not null default timezone('utc', now())
);

create table public.training_sessions (
  id uuid primary key default gen_random_uuid(),
  training_id uuid not null references public.trainings (id) on delete cascade,
  start_date timestamptz not null,
  end_date timestamptz not null,
  location text,
  instructor_name text,
  max_participants integer,
  status text not null default 'scheduled' check (status in ('scheduled', 'ongoing', 'completed', 'cancelled'))
);

create table public.training_enrollments (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.training_sessions (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  status text not null default 'enrolled' check (status in ('enrolled', 'attended', 'absent', 'cancelled')),
  certificate_issued boolean not null default false,
  certificate_path text,
  enrolled_at timestamptz not null default timezone('utc', now()),
  completed_at timestamptz
);

-- NOTIFICAÇÕES
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles (id),
  type text not null,
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
  entity_type text not null,
  entity_id uuid not null,
  compliance_status text not null check (compliance_status in ('compliant', 'partial', 'non_compliant')),
  nr_items text[] not null,
  last_reviewed_at timestamptz,
  reviewed_by uuid references public.profiles (id),
  next_review_due date,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

-- Retenção de 20 anos no audit log
alter table public.audit_logs
  add column if not exists retention_until date default (timezone('utc', now()) + interval '20 years');

-- Evidência de impacto nos planos de ação
alter table public.action_plans
  add column if not exists impact_evidence text,
  add column if not exists impact_metric numeric(12,2),
  add column if not exists completed_at timestamptz;

-- Índices
create index if not exists whistleblower_reports_status_idx on public.whistleblower_reports (status);
create index if not exists training_enrollments_user_status_idx on public.training_enrollments (user_id, status);
create index if not exists notifications_user_unread_idx on public.notifications (user_id, is_read) where is_read = false;
create index if not exists compliance_records_entity_idx on public.compliance_records (entity_type, entity_id);

-- RLS em todas as tabelas novas
alter table public.whistleblower_reports enable row level security;
alter table public.trainings enable row level security;
alter table public.training_sessions enable row level security;
alter table public.training_enrollments enable row level security;
alter table public.notifications enable row level security;
alter table public.compliance_records enable row level security;
```

---

### Critérios de Aceite — Fase 2.1

- [ ] Migration aplicada no Supabase sem erros
- [ ] Todas as 6 tabelas novas existem
- [ ] RLS habilitado em todas
- [ ] Índices criados
- [ ] `select table_name from information_schema.tables where table_schema = 'public'` retorna as novas tabelas

---

## FASE 2.2 — Canal de Denúncias (Ouvidoria)

**O que fazer:** Permitir que qualquer pessoa (autenticada ou não) envie denúncias anônimas.

### Passo 2.2.1 — Criar `whistleblower-service.ts`

**Arquivo novo:** `src/lib/server/services/whistleblower-service.ts`

```typescript
import { hashAnonymousToken } from "@/lib/server/crypto";

export async function submitWhistleblowerReport(input: {
  category: 'harassment_moral' | 'harassment_sexual' | 'discrimination' | 'safety' | 'other';
  description: string;
  sector?: string;
  unit?: string;
}) {
  // 1. Validar com whistleblowerReportSchema (Zod)
  // 2. Hash do description: SHA-256 (nunca salvar texto puro)
  // 3. Gerar report_hash: SHA-256 de UUID aleatório (para consulta futura opcional)
  // 4. Inserir em whistleblower_reports
  // 5. Se categoria = harassment_moral ou harassment_sexual:
  //    → Criar notificação para admin/hr
  //    → Chamar detectHarassmentNLP() para análise
  // 6. Audit log (sem dados pessoais)
  // 7. Retornar { reportHash, status }
}

export async function listWhistleblowerReports(actor: PortalSession) {
  // Apenas admin e hr
  // Filtrar por escopo (manager vê apenas setor/unidade)
}

export async function updateReportStatus(
  reportId: string,
  status: 'investigating' | 'resolved' | 'dismissed',
  actor: PortalSession
) {
  // Atualizar status
  // Se resolved: set resolved_at + resolved_by
  // Audit log
}
```

---

### Passo 2.2.2 — Criar endpoint público

**Arquivo novo:** `src/app/api/public/whistleblower/route.ts`

```typescript
export async function POST(request: Request) {
  // SEM autenticação — qualquer pessoa pode enviar
  const body = await request.json();
  const validated = whistleblowerReportSchema.parse(body);
  const result = await submitWhistleblowerReport(validated);
  return NextResponse.json(result, { status: 201 });
}
```

---

### Passo 2.2.3 — Criar endpoint admin

**Arquivo novo:** `src/app/api/admin/whistleblower/route.ts`

```typescript
export async function GET() {
  const actor = await requirePortalApiSession(["admin", "hr"]);
  const reports = await listWhistleblowerReports(actor);
  return NextResponse.json({ items: reports });
}
```

**Arquivo novo:** `src/app/api/admin/whistleblower/[id]/route.ts`

```typescript
export async function PATCH(request: Request, context: RouteContext) {
  const actor = await requirePortalApiSession(["admin", "hr"]);
  const { id } = await context.params;
  const body = await request.json();
  const updated = await updateReportStatus(id, body.status, actor);
  return NextResponse.json(updated);
}
```

---

### Passo 2.2.4 — Criar páginas de ouvidoria

**Arquivo novo:** `src/app/ouvidoria/nova/page.tsx`

```typescript
// Página PÚBLICA — sem requirePortalSession
// Formulário anônimo com:
// - Categoria (dropdown: assédio moral, assédio sexual, discriminação, segurança, outro)
// - Descrição (textarea max 4000 chars)
// - Setor (opcional)
// - Unidade (opcional)
// - Aviso: "Esta denúncia é anônima. Não inclua dados pessoais."
// - Submit → POST /api/public/whistleblower
// - Sucesso → exibe hash da denúncia + instruções
```

**Arquivo novo:** `src/app/ouvidoria/page.tsx`

```typescript
// Página ADMIN/HR — lista de denúncias
// requirePortalSession(["admin", "hr"])
// Tabela com: categoria, status, data, setor
// Clique → modal para atualizar status
```

---

### Passo 2.2.5 — Adicionar link na sidebar

**Arquivo:** `src/components/portal/portal-shell.tsx`

**Adicionar link:**
```typescript
{ href: "/ouvidoria", label: "Ouvidoria" }
```

---

### Critérios de Aceite — Fase 2.2

- [ ] Qualquer pessoa acessa `/ouvidoria/nova` sem login
- [ ] Denúncia anônima é salva com hash (texto puro NÃO persistido)
- [ ] Admin/hr vê lista em `/ouvidoria`
- [ ] Admin/hr atualiza status (open → investigating → resolved)
- [ ] Denúncias de assédio geram notificação automática
- [ ] `npm run build` passa

---

## FASE 2.3 — Módulo de Treinamentos

**O que fazer:** CRUD completo de treinamentos, sessões, matrículas e certificados.

### Passo 2.3.1 — Serviços

**Arquivo novo:** `src/lib/server/services/training-service.ts`

```typescript
export async function listTrainingsService(actor: PortalSession)
export async function createTrainingService(input: z.infer<typeof trainingSchema>, actor: PortalSession)
export async function createTrainingSessionService(trainingId: string, input: {...}, actor: PortalSession)
export async function enrollUserService(sessionId: string, userId: string, actor: PortalSession)
export async function markAttendanceService(enrollmentId: string, status: 'attended' | 'absent', actor: PortalSession)
export async function issueCertificateService(enrollmentId: string, actor: PortalSession)
export async function getExpiringCertificatesService(daysAhead: number)
```

### Passo 2.3.2 — Repositórios

**Arquivo novo:** `src/lib/server/repositories/training-repository.ts`

```typescript
export async function listTrainings()
export async function createTraining(input)
export async function getTrainingWithDetails(id)
export async function createSession(trainingId, input)
export async function enrollUser(sessionId, userId)
export async function updateEnrollmentStatus(enrollmentId, status)
export async function issueCertificate(enrollmentId, certificatePath)
export async function getExpiringCertificates(daysAhead)
```

### Passo 2.3.3 — Endpoints

```
POST   /api/admin/trainings              → Cria treinamento
GET    /api/admin/trainings              → Lista
GET    /api/admin/trainings/[id]         → Detalhe
PATCH  /api/admin/trainings/[id]         → Atualiza
POST   /api/admin/trainings/[id]/sessions          → Cria sessão
PATCH  /api/admin/trainings/sessions/[sid]/enroll  → Matricula
PATCH  /api/admin/trainings/enrollments/[eid]       → Atualiza presença
GET    /api/admin/trainings/enrollments/[eid]/cert  → Certificado
```

### Passo 2.3.4 — Páginas

```
/treinamentos/                    → Lista de treinamentos (admin/hr)
/treinamentos/[id]/               → Detalhe + sessões + matrículas
/treinamentos/certificado/[eid]/  → Certificado HTML para impressão
```

### Passo 2.3.5 — Validação Zod

**Arquivo novo:** `src/lib/validation/training.ts`

```typescript
export const trainingSchema = z.object({
  title: z.string().min(3),
  description: z.string().max(2000).optional(),
  type: z.enum(['mandatory', 'optional', 'nr_specific']),
  nrReference: z.string().optional(),
  modality: z.enum(['presencial', 'ead']),
  minLoadHours: z.number().int().min(1).default(8),
  validityMonths: z.number().int().min(1).nullable().optional()
});

export const trainingSessionSchema = z.object({
  startDate: z.string(),
  endDate: z.string(),
  location: z.string().optional(),
  instructorName: z.string().max(200).optional(),
  maxParticipants: z.number().int().min(1).optional()
});
```

---

### Critérios de Aceite — Fase 2.3

- [ ] CRUD de treinamentos funciona via UI e API
- [ ] Agendar sessão com data, local e instrutor
- [ ] Matricular usuários em sessão
- [ ] Marcar presença
- [ ] Gerar certificado HTML com dados do treinamento
- [ ] Alerta de certificados a expirar (30 dias)
- [ ] `npm run build` passa

---

## FASE 2.4 — Sistema de Notificações

**O que fazer:** Notificar usuários sobre eventos importantes.

### Passo 2.4.1 — Serviço de Notificações

**Arquivo novo:** `src/lib/server/services/notification-service.ts`

```typescript
export async function createNotification(input: {
  userId: string;
  type: 'risk_alert' | 'training_expiry' | 'action_due' | 'harassment_detected' | 'report_ready';
  title: string;
  body?: string;
  entityType?: string;
  entityId?: string;
})

export async function listUserNotifications(userId: string)

export async function markNotificationAsRead(notificationId: string, userId: string)

// Funções de trigger automático
export async function alertCriticalRisk(campaignId: string, sectionId: string, riskLevel: string)
// → Cria notificação para admin/hr/manager do setor

export async function alertActionPlanDue(actionPlanId: string, daysRemaining: number)
// → Quando daysRemaining <= 7, notifica responsável

export async function alertTrainingExpiring(enrollmentId: string, daysRemaining: number)
// → Quando daysRemaining <= 30, notifica usuário
```

### Passo 2.4.2 — Endpoints

```
GET    /api/admin/notifications          → Lista notificações do usuário logado
PATCH  /api/admin/notifications/[id]     → Marca como lida
```

### Passo 2.4.3 — Páginas e Componentes

```
/notificacoes/                           → Central de notificações
src/components/portal/notifications-bell.tsx  → Sino com contador de não lidas
```

### Passo 2.4.4 — Integração com fluxos existentes

**Modificar:**
- `submitAnonymousResponse()` → notificar quando relatório individual estiver pronto
- `alertCriticalRisk()` → chamado quando risco >= 4 no motor de risco
- `whistleblower-service.ts` → notificar admin/hr quando denúncia de assédio

---

### Critérios de Aceite — Fase 2.4

- [ ] Notificações são criadas automaticamente em eventos críticos
- [ ] Usuário vê lista de notificações não lidas
- [ ] Sino na sidebar mostra contador
- [ ] Marcar como lida funciona
- [ ] `npm run build` passa

---

## FASE 2.5 — Alertas de Risco Crítico

**O que fazer:** Detectar automaticamente quando um fator psicossocial atinge nível crítico.

### Passo 2.5.1 — Integrar com motor de risco existente

**Arquivo existente para modificar:** `src/lib/server/services/submission-service.ts`

**Adicionar após recalcular consolidado:**

```typescript
// Após: await upsertCampaignAnalysisAiMetadata(...)

// NOVO: Verificar se algum fator atingiu nível crítico
const summary = await getCampaignDashboardSummary(campaignId);
for (const section of summary.sections ?? []) {
  if (section.risk_classification === 'CRITICO' || section.risk_classification === 'ALTO') {
    await alertCriticalRisk(campaignId, section.section_id, section.risk_classification);
  }
}
```

---

### Passo 2.5.2 — NLP para detecção de assédio

**Arquivo novo:** `src/lib/server/nlp/harassment-detector.ts`

```typescript
const HARASSMENT_KEYWORDS_PT = [
  // Assédio moral
  'humilhou', 'humilhado', 'vergonha', 'ridiculariz', 'gritou', 'gritando',
  'ameaç', 'intimidou', 'coagiu', 'coação', 'assédio moral', 'persegui',
  'discrimin', 'preconceito', 'exclui', 'isolou', 'ignorou', 'sabotou',
  // Assédio sexual
  'toque', 'tocou', 'encostou', 'cantada', 'assedio sexual', 'proposta',
  'insinuou', 'investida', 'constrangimento sexual', 'insinuação',
  // Indicadores gerais
  'medo', 'ameaçado', 'pressionado', 'obrigado', 'coagido', 'não aguento',
  'quero sair', 'não suporto', 'chorando', 'deprimido'
];

export function analyzeTextForHarassment(text: string): {
  detected: boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
  keywords: string[];
  category: 'harassment_moral' | 'harassment_sexual' | 'other';
} {
  const lowerText = text.toLowerCase();
  const foundKeywords = HARASSMENT_KEYWORDS_PT.filter(kw => lowerText.includes(kw));

  if (foundKeywords.length === 0) {
    return { detected: false, severity: 'low', keywords: [], category: 'other' };
  }

  // Classificar categoria
  const sexualKeywords = foundKeywords.filter(kw => ['toque', 'cantada', 'assedio sexual', 'insinuou', 'constrangimento sexual'].some(k => kw.includes(k)));
  const moralKeywords = foundKeywords.filter(kw => !sexualKeywords.some(sk => kw.includes(sk)));

  const category = sexualKeywords.length > 0 ? 'harassment_sexual' : 'harassment_moral';

  // Classificar severidade
  let severity: 'low' | 'medium' | 'high' | 'critical' = 'low';
  if (foundKeywords.length >= 4) severity = 'critical';
  else if (foundKeywords.length >= 3) severity = 'high';
  else if (foundKeywords.length >= 2) severity = 'medium';
  else severity = 'low';

  return { detected: true, severity, keywords: foundKeywords, category };
}
```

**Integrar em `submission-service.ts`:**

```typescript
// Após submeter observação:
if (input.observationText) {
  const harassmentAnalysis = analyzeTextForHarassment(input.observationText);
  if (harassmentAnalysis.detected && harassmentAnalysis.severity === 'critical') {
    // Notificação imediata para RH/SESMT
    await createNotification({
      userId: getAdminUserId(), // Primeiro admin do sistema
      type: 'harassment_detected',
      title: 'Possível assédio detectado em resposta anônima',
      body: `Resposta contém ${harassmentAnalysis.keywords.length} indicadores de ${harassmentAnalysis.category}. Severidade: ${harassmentAnalysis.severity}.`,
      entityType: 'submission',
      entityId: submissionId
    });
  }
}
```

---

### Critérios de Aceite — Fase 2.5

- [ ] Quando resposta aberta contém keywords de assédio → notificação automática
- [ ] Quando risco de fator >= 4 → notificação para RH/SESMT
- [ ] Severidade classificada corretamente
- [ ] `npm test` inclui testes de NLP
- [ ] `npm run build` passa

---

## FASE 2.6 — Exportação para Fiscalização MTE

**O que fazer:** Gerar PDF formatado com os 4 grupos de documentação exigidos pela NR-1.

### Passo 2.6.1 — Serviço de Conformidade

**Arquivo novo:** `src/lib/server/services/compliance-service.ts`

```typescript
export async function calculateComplianceScore(campaignId: string): Promise<{
  overallScore: number;       // 0-100
  inventoryStatus: 'compliant' | 'partial' | 'non_compliant';
  actionPlanStatus: 'compliant' | 'partial' | 'non_compliant';
  participationStatus: 'compliant' | 'partial' | 'non_compliant';
  monitoringStatus: 'compliant' | 'partial' | 'non_compliant';
  missingItems: string[];
}>

export async function generateMTEExportPDF(campaignIds: string[]): Promise<{
  pdfPath: string;
  sections: string[];
}> {
  // Gera PDF com 4 seções:
  // 1. Inventário de Riscos (fatores, classificação, histórico)
  // 2. Plano de Ação (responsáveis, prazos, status)
  // 3. Registros de Participação (evidência de escuta dos trabalhadores)
  // 4. Registros de Monitoramento (evolução dos scores)
}
```

### Passo 2.6.2 — Endpoint de Export

```
POST   /api/admin/compliance/export    → Gera PDF para fiscalização
GET    /api/admin/compliance           → Dashboard de conformidade
```

### Passo 2.6.3 — Template PDF

**Arquivo novo:** `src/lib/pdf/mte-export-template.ts`

- HTML profissional com logo NR-1
- 4 seções obrigatórias
- Data de geração e versão do sistema
- Assinatura digital (placeholder para ICP-Brasil — Fase 3)

---

### Critérios de Aceite — Fase 2.6

- [ ] PDF contém Inventário de Riscos completo
- [ ] PDF contém Planos de Ação com responsáveis e prazos
- [ ] PDF contém evidência de participação (contagem de submissões)
- [ ] PDF contém histórico de monitoramento (scores ao longo do tempo)
- [ ] PDF é baixável e legível
- [ ] `npm run build` passa

---

### 🏁 Entregável da Fase 2

> **O sistema cumpre as exigências legais da NR-1:**
> - Canal de denúncias anônimo (item 1.5.3.3)
> - Treinamentos registrados com certificados
> - Alertas automáticos de risco
> - Detecção de assédio via NLP
> - Exportação para fiscalização MTE
> - Retenção de dados por 20 anos
>
> **O sistema está pronto para sobreviver a uma fiscalização.**

---

# FASE 3: Diferenciação Competitiva (4-6 semanas)

**Objetivo:** Competir com TeamCulture, Sólides e Indexmed. Diferenciais que vendem o produto.

---

## FASE 3.1 — Integração eSocial S-2240

**O que fazer:** Enviar automaticamente o evento S-2240 ao eSocial.

### Passo 3.1.1 — Schema eSocial

**Arquivo novo na migration:** Adicionar à Fase 2.1 ou migration separada

```sql
create table public.esocial_submissions (
  id uuid primary key default gen_random_uuid(),
  event_type text not null default 'S-2240',
  event_xml xml not null,
  status text not null default 'pending' check (status in ('pending', 'sent', 'processed', 'error', 'rectified')),
  sent_at timestamptz,
  processed_at timestamptz,
  receipt_number text,
  error_message text,
  campaign_id uuid references public.campaigns (id),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);
```

### Passo 3.1.2 — Serviço eSocial

**Arquivo novo:** `src/lib/server/services/esocial-service.ts`

```typescript
export async function generateS2240Xml(campaignId: string): Promise<string> {
  // 1. Buscar dados da campanha + analysis_results
  // 2. Mapear riscos psicossociais para formato S-2240
  // 3. Gerar XML no leiaute S-1.1 do eSocial
  // 4. Retornar XML como string
}

export async function signWithCertificate(xml: string): Promise<string> {
  // 1. Ler certificado A1 do filesystem (ESOCIAL_CERTIFICATE_PATH)
  // 2. Assinar XML com chave privada
  // 3. Retornar XML assinado
  // NOTA: Requer biblioteca como xml-crypto ou node-signpdf
}

export async function sendToESocial(signedXml: string): Promise<{
  submissionId: string;
  status: string;
  receipt?: string;
}> {
  // POST para ESOCIAL_API_URL
  // Headers: Content-Type: text/xml
  // Body: XML assinado
  // Response: protocolo de recebimento
}

export async function checkProcessingStatus(protocol: string): Promise<{
  status: 'pending' | 'processed' | 'error';
  errorMessage?: string;
}> {
  // GET para ESOCIAL_API_URL + protocol
}
```

### Passo 3.1.3 — Endpoints

```
POST   /api/admin/esocial/campaigns/[id]/send     → Envia S-2240
GET    /api/admin/esocial/submissions              → Lista envios
GET    /api/admin/esocial/submissions/[id]          → Detalhe do envio
POST   /api/admin/esocial/submissions/[id]/rectify  → Retifica
```

### Passo 3.1.4 — UI

```
/esocial/                                          → Lista de envios com status
/esocial/campaigns/[id]/send                       → Envio manual com preview do XML
```

### Passo 3.1.5 — Variáveis de Ambiente

```env
ESOCIAL_CERTIFICATE_PATH=/path/to/certificate.pfx
ESOCIAL_CERTIFICATE_PASSWORD=*****
ESOCIAL_API_URL=https://webservices.esocial.gov.br/servicos/EnviarLoteEventos
ESOCIAL_ENVIRONMENT=production
```

---

### Critérios de Aceite — Fase 3.1

- [ ] XML do S-2240 é gerado corretamente a partir dos dados da campanha
- [ ] XML é assinado com certificado digital
- [ ] Envio para eSocial retorna protocolo
- [ ] Status de processamento é consultado
- [ ] Retificação funciona quando há erro
- [ ] `npm run build` passa

**Nota:** Esta é a funcionalidade mais complexa do projeto. Pode exigir biblioteca externa para assinatura XML (node-forge, xml-crypto).

---

## FASE 3.2 — Certificado Digital ICP-Brasil

**O que fazer:** Assinar documentos com certificado digital para validade jurídica.

### Passo 3.2.1 — Biblioteca de Assinatura

**Dependência nova:**
```bash
npm install xml-crypto @peculiar/webcrypto
```

### Passo 3.2.2 — Serviço de Assinatura

**Arquivo novo:** `src/lib/server/security/digital-signature.ts`

```typescript
export async function signPdfWithICPBrasil(pdfPath: string, certificatePath: string, password: string): Promise<string> {
  // Assinar PDF com certificado A1
  // Retornar caminho do PDF assinado
}

export async function verifySignature(filePath: string): Promise<{ valid: boolean; signer?: string; date?: Date }> {
  // Verificar assinatura de documento
}
```

### Passo 3.2.3 — Integrar com relatórios

**Modificar:** `src/lib/server/services/report-service.ts`

- Após gerar relatório HTML → converter para PDF
- Assinar PDF com certificado digital
- Salvar `storage_path` do PDF assinado

---

### Critérios de Aceite — Fase 3.2

- [ ] Relatórios são assinados digitalmente
- [ ] Assinatura é verificável
- [ ] Documentos têm validade jurídica
- [ ] `npm run build` passa

---

## FASE 3.3 — Dashboard de Conformidade NR-1

**O que fazer:** Painel executivo com score de compliance.

### Passo 3.3.1 — Página

**Arquivo novo:** `src/app/conformidade/page.tsx`

```typescript
// Dashboard com:
// - Score geral de conformidade (0-100) com termômetro visual
// - 4 cards: Inventário, Plano de Ação, Participação, Monitoramento
// - Status de cada um: ✅ Conforme, ⚠️ Parcial, ❌ Não Conforme
// - Lista de itens pendentes de adequação
// - Gráfico de evolução do score ao longo do tempo
// - Botão "Exportar para MTE"
```

### Passo 3.3.2 — Link na sidebar

**Modificar:** `src/components/portal/portal-shell.tsx`

```typescript
{ href: "/conformidade", label: "Conformidade NR-1" }
```

---

### Critérios de Aceite — Fase 3.3

- [ ] Score calculado corretamente
- [ ] Dashboard visualmente claro
- [ ] Botão de exportação funciona
- [ ] `npm run build` passa

---

## FASE 3.4 — Coleta Contínua Semanal

**O que fazer:** Em vez de campanha única, permitir pesquisa contínua (diferencial vs. concorrência).

### Passo 3.4.1 — Modificar schema de campanhas

**Migration nova:**

```sql
alter table public.campaigns
  add column if not exists collection_mode text not null default 'one_time'
    check (collection_mode in ('one_time', 'continuous_weekly')),
  add column if not exists weekly_question_count integer check (weekly_question_count between 1 and 10),
  add column if not exists last_questionnaire_sent_at timestamptz,
  add column if not exists next_questionnaire_due_at timestamptz;
```

### Passo 3.4.2 — Cron Job Semanal

**Arquivo novo:** `src/lib/server/cron/weekly-risk-monitor.ts`

```typescript
// Executa toda segunda-feira às 9h
// Para cada campanha com collection_mode = 'continuous_weekly':
// 1. Seleciona 5-6 perguntas aleatórias do questionário
// 2. Gera tokens para colaboradores do setor
// 3. Envia convites por email
// 4. Atualiza last_questionnaire_sent_at + next_questionnaire_due_at
```

### Passo 3.4.3 — Configuração na UI

**Modificar:** Formulário de criação de campanha

- Adicionar campo "Modo de Coleta":
  - ⚪ Pontual (campanha única)
  - ⚪ Contínuo (5-6 perguntas/semana)

---

### Critérios de Aceite — Fase 3.4

- [ ] Campanha contínua envia perguntas semanais automaticamente
- [ ] Perguntas são rotacionadas (não repetir as mesmas)
- [ ] Histórico de rodadas é visível no dashboard
- [ ] `npm run build` passa

---

## FASE 3.5 — Convites Automáticos por Email

**O que fazer:** Enviar convites de pesquisa por email automaticamente.

### Passo 3.5.1 — Serviço de Email

**Arquivo novo:** `src/lib/server/services/email-service.ts`

```typescript
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD }
});

export async function sendSurveyInvitation(input: {
  to: string;
  token: string;
  campaignName: string;
  expiresDays: number;
}) {
  const surveyUrl = `${process.env.NEXT_PUBLIC_APP_URL}/responder/${input.token}`;
  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: input.to,
    subject: `Pesquisa de Clima - ${input.campaignName}`,
    html: `
      <p>Você foi convidado a participar da pesquisa <strong>${input.campaignName}</strong>.</p>
      <p><a href="${surveyUrl}">Clique aqui para responder</a></p>
      <p>Este link expira em ${input.expiresDays} dias.</p>
      <p>Sua resposta é <strong>100% anônima</strong>.</p>
    `
  });
}
```

### Passo 3.5.2 — Integrar com geração de tokens

**Modificar:** `generateCampaignTokens()`

- Após gerar tokens, se emails forem fornecidos → enviar convites

---

### Critérios de Aceite — Fase 3.5

- [ ] Email de convite é enviado ao gerar tokens
- [ ] Link do token funciona no email
- [ ] Email tem design profissional
- [ ] `npm run build` passa

---

### 🏁 Entregável da Fase 3

> **O sistema compete com os líderes de mercado:**
> - eSocial S-2240 integrado (diferencial #1)
> - Documentos com certificado digital ICP-Brasil
> - Dashboard de conformidade para diretoria
> - Coleta contínua semanal (diferencial vs. surveys anuais)
> - Convites automáticos por email
>
> **O sistema está pronto para venda como produto SaaS.**

---

# FASE 4: Maturidade e Escala (6-8 semanas)

**Objetivo:** Tornar o produto enterprise-ready com integrações, SDK e analytics avançado.

---

## FASE 4.1 — Correlação com Dados Operacionais

**O que fazer:** Cruzar dados de risco com absenteísmo, turnover e horas extras.

### Passo 4.1.1 — Novas Tabelas

```sql
create table public.operational_metrics (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid references public.campaigns (id),
  period_label text not null,
  absenteeism_rate numeric(5,2),     -- %
  turnover_rate numeric(5,2),        -- %
  overtime_hours numeric(10,2),      -- horas
  headcount integer,
  created_at timestamptz not null default timezone('utc', now())
);
```

### Passo 4.1.2 — Analytics Avançado

**Arquivo novo:** `src/lib/server/services/advanced-analytics-service.ts`

```typescript
export async function correlateRiskWithOperations(campaignId: string): Promise<{
  riskVsAbsenteeism: number;   // correlação de Pearson
  riskVsTurnover: number;
  riskVsOvertime: number;
  insights: string[];          // ex: "Risco alto correlaciona com horas extras (r=0.78)"
}>
```

---

## FASE 4.2 — Integrações ERP/Folha/Ponto

**O que fazer:** Webhooks e APIs para integração com sistemas externos.

### Passo 4.2.1 — Webhooks

**Arquivo novo:** `src/app/api/webhooks/survey-completed/route.ts`

```typescript
// POST recebido quando pesquisa é completada
// Notifica sistemas externos (ERP, folha)
```

### Passo 4.2.2 — SDK de Integração

**Arquivo novo:** `docs/INTEGRATION_GUIDE.md`

- Documentação de todos os endpoints públicos
- Exemplos de uso em cURL, JavaScript, Python
- Webhook signatures para segurança

---

## FASE 4.3 — Multi-tenancy

**O que fazer:** Suportar múltiplas empresas no mesmo sistema.

### Passo 4.3.1 — Schema

```sql
create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  cnpj text unique,
  plan text not null default 'free',  -- free, pro, enterprise
  created_at timestamptz not null default timezone('utc', now())
);

-- Adicionar organization_id em TODAS as tabelas existentes
alter table public.profiles add column organization_id uuid references public.organizations (id);
alter table public.campaigns add column organization_id uuid references public.organizations (id);
-- ... etc para todas as tabelas
```

---

## FASE 4.4 — Analytics Avançado com IA

**O que fazer:** IA preditiva para antecipar riscos.

- Modelo preditivo de turnover baseado em scores
- Alerta de burnout antes de atingir nível crítico
- Recomendações de ações baseadas em casos similares
- Análise de sentimento em respostas abertas (além de keywords)

---

### 🏁 Entregável da Fase 4

> **O sistema é enterprise-grade:**
> - Correlação com dados operacionais
> - APIs de integração documentadas
> - Multi-tenant (SaaS para múltiplas empresas)
> - IA preditiva e prescritiva
>
> **O sistema está no nível de Sólides/TeamCulture.**

---

# RESUMO EXECUTIVO DE TODAS AS FASES

| Fase | Duração | Arquivos Novos | Arquivos Modificados | Entregável |
|------|---------|---------------|---------------------|------------|
| **1. Sair do Stub** | 2-3 sem | ~15 | ~10 | Sistema funcional end-to-end |
| **2. Conformidade Legal** | 3-4 sem | ~30 | ~8 | Sobrevive à fiscalização MTE |
| **3. Diferenciação** | 4-6 sem | ~25 | ~10 | Compete com líderes de mercado |
| **4. Maturidade** | 6-8 sem | ~20 | ~15 | Enterprise-grade, multi-tenant |
| **TOTAL** | **15-21 sem** | **~90** | **~43** | **Produto SaaS completo** |

---

# ORDEM CRÍTICA DE EXECUÇÃO

```
FASE 1 (obrigatória para funcionar)
├── 1.1 Repositórios e Serviços Base
├── 1.2 Implementar Endpoints Stubs
├── 1.3 UI de Questionários
├── 1.4 UI de Geração de Tokens
├── 1.5 Seed Data COPSOQ-III
└── 1.6 Test End-to-End

FASE 2 (obrigatória para conformidade legal)
├── 2.1 Schema Novas Tabelas
├── 2.2 Canal de Denúncias (Ouvidoria)
├── 2.3 Módulo de Treinamentos
├── 2.4 Sistema de Notificações
├── 2.5 Alertas de Risco + NLP Assédio
└── 2.6 Exportação para Fiscalização MTE

FASE 3 (obrigatória para competir no mercado)
├── 3.1 Integração eSocial S-2240
├── 3.2 Certificado Digital ICP-Brasil
├── 3.3 Dashboard de Conformidade
├── 3.4 Coleta Contínua Semanal
└── 3.5 Convites Automáticos por Email

FASE 4 (opcional — maturidade enterprise)
├── 4.1 Correlação com Dados Operacionais
├── 4.2 Integrações ERP/Folha/Ponto
├── 4.3 Multi-tenancy
└── 4.4 IA Preditiva
```

---

# CHECKLIST POR FASE — PRONTO PARA IMPRIMIR

## Fase 1: Sair do Stub

- [ ] 1.1 — `questionnaire-repository.ts` criado com 8+ funções
- [ ] 1.1 — `questionnaire-service.ts` criado com 5+ funções
- [ ] 1.1 — `campaign-token-service.ts` criado
- [ ] 1.1 — `updateCampaign()` adicionado ao campaigns-repository
- [ ] 1.2 — GET/POST `/api/admin/questionnaires` funcionais
- [ ] 1.2 — GET/PATCH `/api/admin/questionnaires/[id]` funcionais
- [ ] 1.2 — POST `/api/admin/questionnaires/[id]/publish` funcional
- [ ] 1.2 — GET/PATCH `/api/admin/campaigns/[id]` funcionais
- [ ] 1.2 — POST `/api/admin/campaigns/[id]/tokens` funcional
- [ ] 1.3 — UI `/questionarios` com CRUD completo
- [ ] 1.4 — Geração de tokens via UI no dashboard
- [ ] 1.5 — Seed COPSOQ-III com 13 fatores e 65 perguntas
- [ ] 1.6 — Test end-to-end completo (14 passos)
- [ ] `npm run build` passa
- [ ] `npm test` passa

## Fase 2: Conformidade Legal

- [ ] 2.1 — Migration com 6 tabelas novas aplicada
- [ ] 2.2 — Ouvidoria: endpoint público + admin + UI
- [ ] 2.3 — Treinamentos: CRUD + sessões + certificados
- [ ] 2.4 — Notificações: serviço + endpoint + UI + sino
- [ ] 2.5 — NLP de assédio integrado à submissão
- [ ] 2.5 — Alertas de risco crítico automáticos
- [ ] 2.6 — Exportação PDF para MTE com 4 seções
- [ ] `npm run build` passa
- [ ] `npm test` passa

## Fase 3: Diferenciação

- [ ] 3.1 — eSocial S-2240: geração XML + envio + status
- [ ] 3.2 — Certificado digital ICP-Brasil nos relatórios
- [ ] 3.3 — Dashboard de conformidade NR-1 com score
- [ ] 3.4 — Coleta contínua semanal configurável
- [ ] 3.5 — Convites automáticos por email
- [ ] `npm run build` passa
- [ ] `npm test` passa

## Fase 4: Maturidade

- [ ] 4.1 — Correlação risco × absenteísmo/turnover/horas extras
- [ ] 4.2 — Webhooks + SDK de integração documentado
- [ ] 4.3 — Multi-tenancy com organizations
- [ ] 4.4 — IA preditiva de riscos
