-- Roles
create type public.app_role as enum ('admin', 'user');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  created_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create policy "own profile select" on public.profiles for select to authenticated using (auth.uid() = id);
create policy "own profile update" on public.profiles for update to authenticated using (auth.uid() = id);
create policy "own profile insert" on public.profiles for insert to authenticated with check (auth.uid() = id);

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;
create policy "own roles select" on public.user_roles for select to authenticated using (auth.uid() = user_id);

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

-- Subscriptions (manual activation for now)
create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_id text not null,
  tracks_limit integer not null,
  status text not null default 'active',
  started_at timestamptz not null default now(),
  expires_at timestamptz
);
grant select on public.subscriptions to authenticated;
grant all on public.subscriptions to service_role;
alter table public.subscriptions enable row level security;
create policy "own subscription select" on public.subscriptions for select to authenticated using (auth.uid() = user_id);
create policy "admin subscription all" on public.subscriptions for all to authenticated using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

-- Usage log (one row per masterização)
create table public.track_usages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  file_name text,
  goal_id text,
  created_at timestamptz not null default now()
);
grant select, insert on public.track_usages to authenticated;
grant all on public.track_usages to service_role;
alter table public.track_usages enable row level security;
create policy "own usage select" on public.track_usages for select to authenticated using (auth.uid() = user_id);
create policy "own usage insert" on public.track_usages for insert to authenticated with check (auth.uid() = user_id);
create policy "admin usage select" on public.track_usages for select to authenticated using (public.has_role(auth.uid(), 'admin'));

-- Plan requests (painel de solicitações)
create table public.plan_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  email text not null,
  plan_id text not null,
  plan_name text not null,
  price numeric(10,2) not null,
  status text not null default 'pendente',
  note text,
  created_at timestamptz not null default now()
);
grant select, insert on public.plan_requests to authenticated;
grant all on public.plan_requests to service_role;
alter table public.plan_requests enable row level security;
create policy "own request select" on public.plan_requests for select to authenticated using (auth.uid() = user_id);
create policy "own request insert" on public.plan_requests for insert to authenticated with check (auth.uid() = user_id);
create policy "admin request select" on public.plan_requests for select to authenticated using (public.has_role(auth.uid(), 'admin'));
create policy "admin request update" on public.plan_requests for update to authenticated using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

-- Perfil automático + admin para o dono
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data ->> 'full_name')
  on conflict (id) do nothing;

  insert into public.user_roles (user_id, role)
  values (new.id, case when lower(new.email) = 'ronaldolacerdadasilva@gmail.com' then 'admin'::public.app_role else 'user'::public.app_role end)
  on conflict (user_id, role) do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();
