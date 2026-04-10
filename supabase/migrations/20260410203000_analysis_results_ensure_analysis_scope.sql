alter table public.analysis_results
  add column if not exists submission_id uuid references public.survey_submissions (id) on delete cascade,
  add column if not exists section_summary_json jsonb not null default '[]'::jsonb,
  add column if not exists critical_items_json jsonb not null default '[]'::jsonb,
  add column if not exists classification_version text not null default 'v1',
  add column if not exists ai_recommendations_json jsonb,
  add column if not exists fallback_used boolean,
  add column if not exists prompt_version text,
  add column if not exists ai_generated_at timestamptz;

alter table public.analysis_results
  add column if not exists analysis_scope text;

update public.analysis_results
set analysis_scope = coalesce(analysis_scope, case when submission_id is null then 'campaign' else 'submission' end)
where analysis_scope is null;

alter table public.analysis_results
  alter column analysis_scope set default 'campaign',
  alter column analysis_scope set not null;

notify pgrst, 'reload schema';
