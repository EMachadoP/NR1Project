create table if not exists public.risk_inventory_versions (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  version_number integer not null,
  status text not null check (status in ('draft', 'published', 'archived')),
  title text,
  summary_note text,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default timezone('utc', now()),
  updated_by uuid references public.profiles(id),
  updated_at timestamptz not null default timezone('utc', now()),
  published_by uuid references public.profiles(id),
  published_at timestamptz,
  approved_by uuid references public.profiles(id),
  approved_at timestamptz,
  approval_note text,
  supersedes_version_id uuid references public.risk_inventory_versions(id),
  archived_at timestamptz,
  archived_reason text
);

create unique index if not exists risk_inventory_versions_campaign_version_number_idx
  on public.risk_inventory_versions (campaign_id, version_number);

create unique index if not exists risk_inventory_versions_one_published_idx
  on public.risk_inventory_versions (campaign_id)
  where status = 'published';

create unique index if not exists risk_inventory_versions_one_draft_idx
  on public.risk_inventory_versions (campaign_id)
  where status = 'draft';

alter table public.risk_inventory_items
  add column if not exists risk_inventory_version_id uuid,
  add column if not exists origin_item_id uuid;

do $$
begin
  if exists (
    select 1
    from public.risk_inventory_items
    where campaign_id is null
  ) then
    raise exception
      'Cannot migrate risk_inventory_items with null campaign_id. Assign or remove orphan rows before applying versioning.';
  end if;

  if exists (
    select 1
    from public.risk_inventory_items
    where campaign_id is not null
      and created_by is null
      and updated_by is null
  ) and not exists (
    select 1
    from public.profiles
  ) then
    raise exception
      'Cannot migrate risk inventory versions because fallback ownership is required but no profiles exist.';
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'risk_inventory_versions_campaign_id_id_key'
      and conrelid = 'public.risk_inventory_versions'::regclass
  ) then
    alter table public.risk_inventory_versions
      add constraint risk_inventory_versions_campaign_id_id_key unique (campaign_id, id);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'risk_inventory_items_campaign_version_fk'
      and conrelid = 'public.risk_inventory_items'::regclass
  ) then
    alter table public.risk_inventory_items
      add constraint risk_inventory_items_campaign_version_fk
      foreign key (campaign_id, risk_inventory_version_id)
      references public.risk_inventory_versions (campaign_id, id)
      on delete restrict;
  end if;
end
$$;

create index if not exists risk_inventory_items_version_id_idx
  on public.risk_inventory_items (risk_inventory_version_id);

create index if not exists risk_inventory_items_origin_item_id_idx
  on public.risk_inventory_items (origin_item_id);

insert into public.risk_inventory_versions (
  campaign_id,
  version_number,
  status,
  title,
  created_by,
  created_at,
  updated_by,
  updated_at,
  published_by,
  published_at,
  approved_by,
  approved_at,
  approval_note
)
select
  items.campaign_id,
  1,
  'published',
  'Versao inicial migrada da Fase 1',
  coalesce(min(items.created_by), min(items.updated_by), fallback_profile.profile_id),
  min(items.created_at),
  coalesce(max(items.updated_by), max(items.created_by), fallback_profile.profile_id),
  max(items.updated_at),
  coalesce(max(items.updated_by), max(items.created_by), fallback_profile.profile_id),
  max(items.updated_at),
  coalesce(max(items.updated_by), max(items.created_by), fallback_profile.profile_id),
  max(items.updated_at),
  'Migracao automatica da Fase 1'
from public.risk_inventory_items items
cross join lateral (
  select id as profile_id
  from public.profiles
  order by (role = 'admin') desc, created_at asc, id asc
  limit 1
) as fallback_profile
where items.campaign_id is not null
group by items.campaign_id, fallback_profile.profile_id;

update public.risk_inventory_items items
set
  risk_inventory_version_id = versions.id,
  origin_item_id = items.id
from public.risk_inventory_versions versions
where versions.campaign_id = items.campaign_id
  and versions.version_number = 1
  and items.risk_inventory_version_id is null;

alter table public.risk_inventory_items
  alter column risk_inventory_version_id set not null;

create or replace function public.publish_risk_inventory_version(
  p_version_id uuid,
  p_actor_id uuid,
  p_approval_note text default null
)
returns public.risk_inventory_versions
language plpgsql
as $$
declare
  v_now timestamptz := timezone('utc', now());
  v_target public.risk_inventory_versions%rowtype;
  v_previous_published public.risk_inventory_versions%rowtype;
  v_published public.risk_inventory_versions%rowtype;
begin
  select *
  into v_target
  from public.risk_inventory_versions
  where id = p_version_id
  for update;

  if not found then
    raise exception 'NOT_FOUND'
      using errcode = 'P0001',
            detail = format('risk_inventory_version %s was not found', p_version_id);
  end if;

  if v_target.status <> 'draft' then
    raise exception 'VERSION_NOT_DRAFT'
      using errcode = 'P0001',
            detail = format(
              'risk_inventory_version %s must be draft to publish, current status is %s',
              p_version_id,
              v_target.status
            );
  end if;

  select *
  into v_previous_published
  from public.risk_inventory_versions
  where campaign_id = v_target.campaign_id
    and status = 'published'
  for update;

  if found then
    update public.risk_inventory_versions
    set
      status = 'archived',
      archived_at = v_now,
      archived_reason = 'superseded_by_new_publication',
      updated_by = p_actor_id,
      updated_at = v_now
    where id = v_previous_published.id;
  end if;

  update public.risk_inventory_versions
  set
    status = 'published',
    published_by = p_actor_id,
    published_at = v_now,
    approved_by = p_actor_id,
    approved_at = v_now,
    approval_note = p_approval_note,
    supersedes_version_id = v_previous_published.id,
    archived_at = null,
    archived_reason = null,
    updated_by = p_actor_id,
    updated_at = v_now
  where id = v_target.id
  returning *
  into v_published;

  return v_published;
end;
$$;
