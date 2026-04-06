alter table public.analysis_results
  add column if not exists ai_recommendations_json jsonb,
  add column if not exists fallback_used boolean,
  add column if not exists prompt_version text,
  add column if not exists ai_generated_at timestamptz;

create index if not exists analysis_results_prompt_version_idx on public.analysis_results (prompt_version);
create index if not exists analysis_results_fallback_used_idx on public.analysis_results (fallback_used);
