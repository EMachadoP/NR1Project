-- Ensure the 'mode' column exists on survey_submissions.
-- This column was defined in the initial schema but may be absent in databases
-- provisioned through alternative paths.
alter table public.survey_submissions
  add column if not exists mode text not null default 'anonymous'
    check (mode = 'anonymous');
