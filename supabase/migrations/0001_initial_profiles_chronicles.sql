create extension if not exists "pgcrypto";

create type public.chronicle_status as enum (
  'draft',
  'active',
  'completed',
  'archived'
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.chronicles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  vampire_name text,
  status public.chronicle_status not null default 'draft',
  current_prompt_number integer not null default 1,
  current_prompt_encounter integer not null default 1,
  current_session_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_played_at timestamptz
);

create index chronicles_user_id_updated_at_idx
  on public.chronicles (user_id, updated_at desc);

create trigger set_profiles_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

create trigger set_chronicles_updated_at
before update on public.chronicles
for each row
execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.chronicles enable row level security;

create policy "profiles are readable by their owner"
on public.profiles
for select
using (auth.uid() = id);

create policy "profiles are insertable by their owner"
on public.profiles
for insert
with check (auth.uid() = id);

create policy "profiles are updatable by their owner"
on public.profiles
for update
using (auth.uid() = id)
with check (auth.uid() = id);

create policy "chronicles are readable by their owner"
on public.chronicles
for select
using (auth.uid() = user_id);

create policy "chronicles are insertable by their owner"
on public.chronicles
for insert
with check (auth.uid() = user_id);

create policy "chronicles are updatable by their owner"
on public.chronicles
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "chronicles are deletable by their owner"
on public.chronicles
for delete
using (auth.uid() = user_id);
