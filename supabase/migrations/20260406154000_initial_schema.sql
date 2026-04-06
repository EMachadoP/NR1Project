create extension if not exists "pgcrypto";

create type public.user_role as enum ('admin', 'hr', 'manager');
create type public.campaign_status as enum ('draft', 'scheduled', 'active', 'closed', 'archived');
create type public.questionnaire_status as enum ('draft', 'published', 'archived');
create type public.token_status as enum ('available', 'used', 'expired', 'revoked');
create type public.scoring_direction as enum ('positive', 'negative');
create type public.action_plan_status as enum ('open', 'in_progress', 'done', 'cancelled');
create type public.report_type as enum ('individual', 'campaign_analytical');

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role public.user_role not null default 'hr',
  display_name text,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.questionnaires (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  version text not null,
  status public.questionnaire_status not null default 'draft',
  created_at timestamptz not null default timezone('utc', now()),
  published_at timestamptz
);

create table if not exists public.questionnaire_sections (
  id uuid primary key default gen_random_uuid(),
  questionnaire_id uuid not null references public.questionnaires (id) on delete cascade,
  name text not null,
  order_index integer not null check (order_index >= 0)
);

create table if not exists public.questionnaire_questions (
  id uuid primary key default gen_random_uuid(),
  section_id uuid not null references public.questionnaire_sections (id) on delete cascade,
  prompt text not null,
  answer_type text not null default 'likert_1_5',
  scoring_direction public.scoring_direction,
  weight numeric(10,2) not null default 1 check (weight > 0),
  is_required boolean not null default true,
  is_active boolean not null default true,
  order_index integer not null check (order_index >= 0)
);

create table if not exists public.campaigns (
  id uuid primary key default gen_random_uuid(),
  questionnaire_id uuid not null references public.questionnaires (id),
  name text not null,
  sector text,
  unit text,
  language text not null default 'pt-BR',
  status public.campaign_status not null default 'draft',
  start_date date not null,
  end_date date not null,
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default timezone('utc', now()),
  check (end_date >= start_date)
);

create table if not exists public.campaign_tokens (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns (id) on delete cascade,
  token_hash text not null unique,
  status public.token_status not null default 'available',
  expires_at timestamptz not null,
  used_at timestamptz,
  delivery_channel text,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.survey_submissions (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns (id) on delete cascade,
  token_id uuid not null references public.campaign_tokens (id),
  mode text not null default 'anonymous' check (mode = 'anonymous'),
  observation_text text,
  receipt_code text not null unique,
  submitted_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.submission_answers (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.survey_submissions (id) on delete cascade,
  question_id uuid not null references public.questionnaire_questions (id),
  answer_raw integer not null check (answer_raw between 1 and 5),
  risk_value numeric(3,1) not null check (risk_value between 1 and 5)
);

create table if not exists public.analysis_results (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns (id) on delete cascade,
  submission_id uuid references public.survey_submissions (id) on delete cascade,
  analysis_scope text not null,
  section_summary_json jsonb not null,
  critical_items_json jsonb not null,
  classification_version text not null default 'v1',
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.generated_reports (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid references public.campaigns (id) on delete cascade,
  submission_id uuid references public.survey_submissions (id) on delete cascade,
  report_type public.report_type not null,
  template_version text not null default 'v1',
  storage_path text not null,
  generated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.action_plans (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns (id) on delete cascade,
  risk_identified text not null,
  section_name text,
  root_cause text,
  measure text not null,
  owner_name text,
  due_date date,
  status public.action_plan_status not null default 'open',
  origin text not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.action_plan_history (
  id uuid primary key default gen_random_uuid(),
  action_plan_id uuid not null references public.action_plans (id) on delete cascade,
  changed_by uuid references public.profiles (id),
  before_json jsonb,
  after_json jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.monitoring_indicators (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns (id) on delete cascade,
  period_label text not null,
  indicator_name text not null,
  previous_value numeric(12,2),
  current_value numeric(12,2) not null,
  target_value numeric(12,2),
  variation numeric(12,2),
  action_needed boolean not null default false,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles (id),
  actor_role public.user_role,
  entity_type text not null,
  entity_id uuid,
  action text not null,
  before_json jsonb,
  after_json jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists campaigns_questionnaire_id_idx on public.campaigns (questionnaire_id);
create index if not exists campaign_tokens_campaign_id_idx on public.campaign_tokens (campaign_id);
create index if not exists campaign_tokens_expires_at_idx on public.campaign_tokens (expires_at);
create index if not exists survey_submissions_campaign_id_idx on public.survey_submissions (campaign_id);
create index if not exists submission_answers_submission_id_idx on public.submission_answers (submission_id);
create index if not exists analysis_results_campaign_id_idx on public.analysis_results (campaign_id);
create index if not exists generated_reports_campaign_id_idx on public.generated_reports (campaign_id);
create index if not exists action_plans_campaign_id_idx on public.action_plans (campaign_id);
create index if not exists monitoring_indicators_campaign_id_idx on public.monitoring_indicators (campaign_id);

alter table public.profiles enable row level security;
alter table public.questionnaires enable row level security;
alter table public.questionnaire_sections enable row level security;
alter table public.questionnaire_questions enable row level security;
alter table public.campaigns enable row level security;
alter table public.campaign_tokens enable row level security;
alter table public.survey_submissions enable row level security;
alter table public.submission_answers enable row level security;
alter table public.analysis_results enable row level security;
alter table public.generated_reports enable row level security;
alter table public.action_plans enable row level security;
alter table public.action_plan_history enable row level security;
alter table public.monitoring_indicators enable row level security;
alter table public.audit_logs enable row level security;
