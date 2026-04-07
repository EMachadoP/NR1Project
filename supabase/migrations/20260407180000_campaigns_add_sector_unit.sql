-- Align production schema with application code.
-- The production database was bootstrapped with an older schema; this migration
-- adds every column that the application layer references but that was absent.

-- campaigns
alter table public.campaigns
  add column if not exists sector   text,
  add column if not exists unit     text,
  add column if not exists language text not null default 'pt-BR';

-- profiles
alter table public.profiles
  add column if not exists display_name text,
  add column if not exists sector       text,
  add column if not exists unit         text;

-- questionnaires
alter table public.questionnaires
  add column if not exists name         text,
  add column if not exists version      text not null default 'v1',
  add column if not exists published_at timestamptz;

-- questionnaire_sections
alter table public.questionnaire_sections
  add column if not exists name text;

-- questionnaire_questions
alter table public.questionnaire_questions
  add column if not exists prompt             text,
  add column if not exists answer_type        text,
  add column if not exists scoring_direction  text,
  add column if not exists weight             numeric default 1,
  add column if not exists is_required        boolean default true,
  add column if not exists is_active          boolean default true,
  add column if not exists severity_score     numeric,
  add column if not exists severity_label     text,
  add column if not exists circumstances_text text,
  add column if not exists outcomes_text      text;

-- campaign_tokens
alter table public.campaign_tokens
  add column if not exists token_hash text,
  add column if not exists status     text not null default 'available',
  add column if not exists used_at    timestamptz;

-- survey_submissions
alter table public.survey_submissions
  add column if not exists receipt_code       text,
  add column if not exists receipt_expires_at timestamptz,
  add column if not exists observation_text   text;

-- submission_answers
alter table public.submission_answers
  add column if not exists answer_raw  numeric,
  add column if not exists risk_value  numeric;

-- generated_reports
alter table public.generated_reports
  add column if not exists submission_id    uuid,
  add column if not exists template_version text,
  add column if not exists payload_json     jsonb,
  add column if not exists storage_path     text,
  add column if not exists error_message    text;
