create table if not exists public.risk_inventory_items (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid references public.campaigns (id) on delete cascade,
  sector text,
  unit text,
  hazard_code integer,
  title text not null,
  description text not null,
  existing_controls text,
  responsible_name text,
  status text not null default 'open' check (status in ('open', 'monitoring', 'mitigating', 'closed')),
  probability integer not null check (probability between 1 and 5),
  severity integer not null check (severity between 1 and 5),
  nro integer not null check (nro = probability * severity),
  risk_classification text not null check (risk_classification in ('Baixo', 'Medio', 'Alto', 'Critico')),
  created_by uuid references public.profiles (id) on delete set null,
  updated_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  check (hazard_code is null or hazard_code > 0)
);

create table if not exists public.risk_inventory_history (
  id uuid primary key default gen_random_uuid(),
  risk_inventory_item_id uuid references public.risk_inventory_items (id) on delete set null,
  changed_by uuid references public.profiles (id) on delete set null,
  change_reason text,
  before_json jsonb,
  after_json jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists risk_inventory_items_campaign_id_idx on public.risk_inventory_items (campaign_id);
create index if not exists risk_inventory_items_sector_idx on public.risk_inventory_items (sector);
create index if not exists risk_inventory_items_unit_idx on public.risk_inventory_items (unit);
create index if not exists risk_inventory_items_sector_unit_idx on public.risk_inventory_items (sector, unit);
create index if not exists risk_inventory_items_risk_classification_idx on public.risk_inventory_items (risk_classification);
create index if not exists risk_inventory_items_status_idx on public.risk_inventory_items (status);
create index if not exists risk_inventory_history_item_id_idx on public.risk_inventory_history (risk_inventory_item_id);
create index if not exists risk_inventory_history_changed_by_idx on public.risk_inventory_history (changed_by);
create index if not exists risk_inventory_history_created_at_idx on public.risk_inventory_history (created_at desc);

alter table public.risk_inventory_items enable row level security;
alter table public.risk_inventory_history enable row level security;

comment on table public.risk_inventory_items is
  'NR-01 Phase 1 risk inventory. NRO is calculated as probability times severity.';

comment on table public.risk_inventory_history is
  'Audit trail for risk inventory item changes, including NRO-relevant updates.';

comment on column public.risk_inventory_items.status is
  'Operational state of the risk item. Allowed values: open, monitoring, mitigating, closed.';

comment on column public.risk_inventory_items.probability is
  'NR-01 probability score on a 1-5 scale, editable by authorized users.';

comment on column public.risk_inventory_items.severity is
  'NR-01 severity score on a 1-5 scale, editable by admins in Phase 1.';

comment on column public.risk_inventory_items.nro is
  'NRO = probability x severity. Stored for direct filtering and reporting.';

comment on column public.risk_inventory_items.risk_classification is
  'Classification derived from NRO: Baixo, Medio, Alto, or Critico.';

comment on column public.risk_inventory_items.campaign_id is
  'Optional campaign link for risk inventories scoped to a specific campaign.';

comment on column public.risk_inventory_items.sector is
  'Operational sector used to scope and filter risk inventory items.';

comment on column public.risk_inventory_items.unit is
  'Operational unit used to scope and filter risk inventory items.';

comment on column public.risk_inventory_history.risk_inventory_item_id is
  'Optional live link to the inventory item. Delete events preserve history even after the source row is removed.';

comment on column public.risk_inventory_history.before_json is
  'Snapshot before the change, used to reconstruct inventory history.';

comment on column public.risk_inventory_history.after_json is
  'Snapshot after the change, used to reconstruct inventory history.';
