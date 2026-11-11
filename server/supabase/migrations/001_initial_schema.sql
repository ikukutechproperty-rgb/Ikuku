create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  role text not null default 'user' check (role in ('user', 'admin')),
  status text not null default 'active' check (status in ('active', 'suspended')),
  created_at timestamptz not null default now()
);

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null check (type in ('deposit', 'withdrawal')),
  amount numeric(14, 2) not null check (amount > 0 and amount <= 1000000),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.investments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  plan_name text not null,
  amount numeric(14, 2) not null check (amount > 0 and amount <= 1000000),
  status text not null default 'active' check (status in ('active', 'completed', 'cancelled')),
  created_at timestamptz not null default now()
);

create index if not exists transactions_user_created_idx on public.transactions(user_id, created_at desc);
create index if not exists transactions_status_idx on public.transactions(status);
create index if not exists investments_user_status_idx on public.investments(user_id, status);

create or replace function public.create_profile_for_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, nullif(new.raw_user_meta_data ->> 'display_name', ''));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.create_profile_for_new_user();

alter table public.profiles enable row level security;
alter table public.transactions enable row level security;
alter table public.investments enable row level security;

drop policy if exists "Users can view their own profile" on public.profiles;
create policy "Users can view their own profile"
  on public.profiles for select to authenticated
  using (auth.uid() = id);

drop policy if exists "Users can view their own transactions" on public.transactions;
create policy "Users can view their own transactions"
  on public.transactions for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can view their own investments" on public.investments;
create policy "Users can view their own investments"
  on public.investments for select to authenticated
  using (auth.uid() = user_id);

revoke insert, update, delete on public.profiles from anon, authenticated;
revoke insert, update, delete on public.transactions from anon, authenticated;
revoke insert, update, delete on public.investments from anon, authenticated;
grant select on public.profiles, public.transactions, public.investments to authenticated;
