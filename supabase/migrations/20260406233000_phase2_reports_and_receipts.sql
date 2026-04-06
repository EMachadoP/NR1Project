do $$
begin
  if not exists (
    select 1 from pg_type where typname = 'generated_report_status'
  ) then
    create type public.generated_report_status as enum ('pending', 'done', 'failed');
  end if;
end
$$;

alter table public.generated_reports
  add column if not exists status public.generated_report_status not null default 'pending',
  add column if not exists error_message text,
  add column if not exists requested_at timestamptz not null default timezone('utc', now()),
  add column if not exists source_analysis_id uuid references public.analysis_results (id) on delete set null,
  add column if not exists payload_json jsonb not null default '{}'::jsonb,
  add column if not exists updated_at timestamptz not null default timezone('utc', now());

alter table public.generated_reports
  alter column storage_path drop not null,
  alter column generated_at drop not null,
  alter column generated_at drop default;

update public.generated_reports
set status = case
      when storage_path is not null and generated_at is not null then 'done'::public.generated_report_status
      when error_message is not null then 'failed'::public.generated_report_status
      else 'pending'::public.generated_report_status
    end,
    requested_at = coalesce(requested_at, generated_at, timezone('utc', now())),
    updated_at = coalesce(updated_at, timezone('utc', now()));

alter table public.survey_submissions
  add column if not exists receipt_expires_at timestamptz not null default (timezone('utc', now()) + interval '30 days');

create index if not exists generated_reports_status_idx on public.generated_reports (status);
create index if not exists generated_reports_submission_id_idx on public.generated_reports (submission_id);
create index if not exists generated_reports_requested_at_idx on public.generated_reports (requested_at desc);
create index if not exists survey_submissions_receipt_code_idx on public.survey_submissions (receipt_code);
create index if not exists survey_submissions_receipt_expires_at_idx on public.survey_submissions (receipt_expires_at);
