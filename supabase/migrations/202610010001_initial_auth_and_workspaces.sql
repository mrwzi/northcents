create table public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  display_name text check (char_length(display_name) between 1 and 80),
  province_or_territory text check (
    province_or_territory is null or province_or_territory in
      ('AB','BC','MB','NB','NL','NS','NT','NU','ON','PE','QC','SK','YT')
  ),
  student_status text not null default 'prefer-not-to-say' check (
    student_status in ('student','not-student','prefer-not-to-say')
  ),
  employment_status text not null default 'prefer-not-to-say' check (
    employment_status in
      ('employed','self-employed','not-working','retired','prefer-not-to-say')
  ),
  income_pattern text not null default 'prefer-not-to-say' check (
    income_pattern in ('regular','irregular','none','prefer-not-to-say')
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.financial_workspaces (
  workspace_id text primary key,
  owner_id uuid not null references auth.users (id) on delete cascade,
  schema_version integer not null check (schema_version = 2),
  workspace jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id, workspace_id),
  check (workspace ->> 'id' = workspace_id),
  check ((workspace ->> 'schemaVersion')::integer = schema_version)
);

create index financial_workspaces_owner_id_idx
  on public.financial_workspaces (owner_id);

alter table public.profiles enable row level security;
alter table public.financial_workspaces enable row level security;

revoke all on table public.profiles from anon, authenticated;
revoke all on table public.financial_workspaces from anon, authenticated;
grant select, insert, update, delete on table public.profiles to authenticated;
grant select, insert, update, delete on table public.financial_workspaces to authenticated;

create policy "Users can read their own profile"
  on public.profiles for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "Users can create their own profile"
  on public.profiles for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "Users can update their own profile"
  on public.profiles for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "Users can delete their own profile"
  on public.profiles for delete to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can read their own workspaces"
  on public.financial_workspaces for select to authenticated
  using ((select auth.uid()) = owner_id);
create policy "Users can create their own workspaces"
  on public.financial_workspaces for insert to authenticated
  with check ((select auth.uid()) = owner_id);
create policy "Users can update their own workspaces"
  on public.financial_workspaces for update to authenticated
  using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);
create policy "Users can delete their own workspaces"
  on public.financial_workspaces for delete to authenticated
  using ((select auth.uid()) = owner_id);
