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

-- monitoring_indicators
alter table public.monitoring_indicators
  add column if not exists period_label    text,
  add column if not exists previous_value  numeric,
  add column if not exists current_value   numeric,
  add column if not exists variation       numeric,
  add column if not exists action_needed   boolean default false;

-- audit_logs
alter table public.audit_logs
  add column if not exists actor_id    uuid,
  add column if not exists actor_role  text,
  add column if not exists entity_type text,
  add column if not exists entity_id   uuid,
  add column if not exists before_json jsonb,
  add column if not exists after_json  jsonb;

-- action_plans
alter table public.action_plans
  add column if not exists risk_identified text,
  add column if not exists section_name    text,
  add column if not exists root_cause      text,
  add column if not exists measure         text,
  add column if not exists owner_name      text,
  add column if not exists origin          text;

-- allow legacy title/question_text/etc columns to be null
-- (production DB was created with older schema using different column names)
alter table public.questionnaires             alter column title          drop not null;
alter table public.questionnaire_sections     alter column title          drop not null;
alter table public.questionnaire_questions    alter column question_text  drop not null;
alter table public.questionnaire_questions    alter column question_type  drop not null;

-- generated_reports (dates)
alter table public.generated_reports
  add column if not exists requested_at timestamptz default now(),
  add column if not exists generated_at  timestamptz;

-- analysis_results
alter table public.analysis_results
  add column if not exists section_summary_json jsonb,
  add column if not exists critical_items_json  jsonb;

-- force PostgREST to reload schema cache so new columns are immediately visible
notify pgrst, 'reload schema';
