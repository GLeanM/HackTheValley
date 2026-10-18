-- Travel segments recorded by the in-app trip tracker. CO₂ is an expected value
-- computed on the client from speed tier × emission factor (src/services/carbon).
-- Safe to re-run.
create table if not exists public.trips (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  created_at timestamptz not null default now(),
  started_at timestamptz not null,
  ended_at timestamptz not null,
  mode text not null check (mode in ('walk', 'vehicle', 'rail', 'flight')),
  distance_m real not null check (distance_m >= 0),
  co2_g real not null check (co2_g >= 0)
);

create index if not exists trips_user_started_idx
  on public.trips (user_id, started_at desc);

alter table public.trips enable row level security;

drop policy if exists "trips_select_own" on public.trips;
create policy "trips_select_own" on public.trips
  for select using (auth.uid() = user_id);
drop policy if exists "trips_insert_own" on public.trips;
create policy "trips_insert_own" on public.trips
  for insert with check (auth.uid() = user_id);
drop policy if exists "trips_delete_own" on public.trips;
create policy "trips_delete_own" on public.trips
  for delete using (auth.uid() = user_id);
