-- Promote internal user to administrator role in the portal.
-- Apply after the auth user and corresponding public.profiles row already exist.

update public.profiles
set
  role = 'admin',
  updated_at = timezone('utc', now())
where id = '2587b874-ade7-4f01-81a5-935aa008abed';

-- Optional verification query
select id, role, display_name
from public.profiles
where id = '2587b874-ade7-4f01-81a5-935aa008abed';
