alter table public.questionnaire_questions
  add column if not exists hazard_code integer,
  add column if not exists source_reference text,
  add column if not exists severity_score integer,
  add column if not exists severity_label text,
  add column if not exists circumstances_text text,
  add column if not exists outcomes_text text,
  add column if not exists recommended_actions_text text,
  add column if not exists monitoring_guidance_text text;

create index if not exists questionnaire_questions_hazard_code_idx on public.questionnaire_questions (hazard_code);
create index if not exists questionnaire_questions_source_reference_idx on public.questionnaire_questions (source_reference);

comment on column public.questionnaire_questions.hazard_code is
  'Stable code from the technical psychosocial hazard catalog.';

comment on column public.questionnaire_questions.source_reference is
  'Catalog provenance for the question, e.g. Safe2Mind or COPSOQ-II.';

comment on column public.questionnaire_questions.severity_score is
  'Technical severity score from the source catalog.';

comment on column public.questionnaire_questions.severity_label is
  'Technical severity label and impact summary from the source catalog.';

comment on column public.questionnaire_questions.circumstances_text is
  'Catalog description of sources and circumstances associated with the hazard.';

comment on column public.questionnaire_questions.outcomes_text is
  'Catalog description of potential health outcomes associated with the hazard.';

comment on column public.questionnaire_questions.recommended_actions_text is
  'Catalog recommendations for organizational response and mitigation.';

comment on column public.questionnaire_questions.monitoring_guidance_text is
  'Catalog guidance for monitoring and follow-up after mitigation actions.';
