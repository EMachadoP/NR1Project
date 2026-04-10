-- Create the 'reports' storage bucket used to persist generated HTML report artifacts.
-- The bucket is private (not public) — access is controlled via signed URLs issued server-side.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'reports',
  'reports',
  false,
  5242880, -- 5 MB per file
  array['text/html']
)
on conflict (id) do nothing;

-- Allow the service role (used by the admin client) to read/write to the bucket.
-- Anon and authenticated users never access this bucket directly.
create policy "service_role_reports_all"
  on storage.objects
  for all
  to service_role
  using (bucket_id = 'reports')
  with check (bucket_id = 'reports');
