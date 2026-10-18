create table if not exists public.history (
  id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  created_at timestamptz not null default now(),
  category text not null,
  text text not null default '',
  image_uri text,
  response jsonb not null
);

create index if not exists history_user_created_idx
  on public.history (user_id, created_at desc);

alter table public.history enable row level security;

create policy "history_select_own" on public.history
  for select using (auth.uid() = user_id);
create policy "history_insert_own" on public.history
  for insert with check (auth.uid() = user_id);
create policy "history_delete_own" on public.history
  for delete using (auth.uid() = user_id);
