-- The remote table had a legacy 'analysis_type' column with NOT NULL and no default.
-- The application never sets this column; 'analysis_scope' is the authoritative field.
-- Strategy: back-fill existing rows, set a default, then keep the column inert.
-- Dropping is intentionally avoided to prevent issues with existing policies/indexes.

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name   = 'analysis_results'
      and column_name  = 'analysis_type'
  ) then
    -- Back-fill any NULL rows using analysis_scope as the source of truth
    update public.analysis_results
      set analysis_type = coalesce(analysis_type, analysis_scope)
      where analysis_type is null;

    -- Set a default so future inserts that omit the column won't violate NOT NULL
    alter table public.analysis_results
      alter column analysis_type set default 'submission';
  end if;
end
$$;

notify pgrst, 'reload schema';
