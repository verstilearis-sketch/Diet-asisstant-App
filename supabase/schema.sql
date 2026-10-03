-- ═══════════════════════════════════════════════════════════════════
-- DietAI database schema — Supabase
-- Run this once: Supabase Dashboard → SQL Editor → New query → paste → Run.
-- Safe to re-run: every statement is idempotent.
-- ═══════════════════════════════════════════════════════════════════

-- ── profiles: one row per user, auto-created on signup ──────────────
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  name text not null default '',
  created_at timestamptz not null default now()
);

-- ── plans: diet plans (profile + plan stored as JSON) ───────────────
create table if not exists public.plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  profile jsonb not null,
  plan jsonb not null,
  created_at timestamptz not null default now()
);
create index if not exists plans_user_id_created_idx
  on public.plans (user_id, created_at desc);

-- ── daily_logs: one row per user per day ────────────────────────────
create table if not exists public.daily_logs (
  user_id uuid not null references auth.users(id) on delete cascade,
  date text not null,
  log jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, date)
);

-- ── Auto-create the profile row whenever a user signs up ────────────
-- The display name is taken from the signup metadata.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'name', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── Row Level Security: users only ever touch their own rows ────────
alter table public.profiles enable row level security;
alter table public.plans enable row level security;
alter table public.daily_logs enable row level security;

drop policy if exists "Users manage own profile" on public.profiles;
create policy "Users manage own profile" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "Users manage own plans" on public.plans;
create policy "Users manage own plans" on public.plans
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users manage own logs" on public.daily_logs;
create policy "Users manage own logs" on public.daily_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
