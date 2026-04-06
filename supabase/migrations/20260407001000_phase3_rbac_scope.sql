alter table public.profiles
  add column if not exists sector text,
  add column if not exists unit text;

create index if not exists profiles_role_idx on public.profiles (role);
create index if not exists profiles_sector_idx on public.profiles (sector);
create index if not exists profiles_unit_idx on public.profiles (unit);

comment on column public.profiles.sector is
  'Manager scope. When role = manager, campaign access may be restricted by matching sector.';

comment on column public.profiles.unit is
  'Manager scope. When role = manager, campaign access may be restricted by matching unit.';
