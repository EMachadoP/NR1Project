do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.submission_answers'::regclass
      and contype = 'c'
      and (
        conname = 'submission_answers_answer_raw_range_check'
        or pg_get_constraintdef(oid) ilike '%answer_raw between 1 and 5%'
      )
  ) then
    alter table public.submission_answers
      add constraint submission_answers_answer_raw_range_check
      check (answer_raw between 1 and 5);
  end if;
end
$$;

comment on column public.campaign_tokens.token_hash is
  'Stores only the SHA-256 hash of the anonymous token. Raw tokens must never be persisted.';

comment on column public.survey_submissions.observation_text is
  'Optional anonymous note. Must not store personal identifiers and may be server-side redacted.';

