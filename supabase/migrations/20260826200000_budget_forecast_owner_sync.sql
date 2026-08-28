-- Budget Forecast: owner-only cloud sync.
--
-- This project is shared by several unrelated applications, so every object
-- here is prefixed `budget_forecast_` and nothing pre-existing is modified.
--
-- Security model: the web app is a static Expo export with no server, so the
-- database is the only real authorization boundary. Policies are scoped to one
-- specific owner (by auth.uid() AND the verified JWT email), not merely to
-- "authenticated", because this project has other registered users.

create table if not exists public.budget_forecast_budgets (
  user_id uuid primary key references auth.users (id) on delete cascade,
  state jsonb not null,
  updated_at timestamptz not null default now()
);

comment on table public.budget_forecast_budgets is
  'Budget Forecast app: one budget document per owner. Owner-only RLS.';

alter table public.budget_forecast_budgets enable row level security;
-- Ensure the policies apply to the table owner too.
alter table public.budget_forecast_budgets force row level security;

-- The owner's email is fixed for this single-user application.
create or replace function public.budget_forecast_is_owner()
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select
    auth.uid() is not null
    and lower(coalesce(auth.jwt() ->> 'email', '')) = 'jasong409@pm.me'
$$;

comment on function public.budget_forecast_is_owner() is
  'Budget Forecast app: true only for the single approved owner identity.';

drop policy if exists budget_forecast_owner_select on public.budget_forecast_budgets;
create policy budget_forecast_owner_select
  on public.budget_forecast_budgets
  for select
  to authenticated
  using (user_id = (select auth.uid()) and public.budget_forecast_is_owner());

drop policy if exists budget_forecast_owner_insert on public.budget_forecast_budgets;
create policy budget_forecast_owner_insert
  on public.budget_forecast_budgets
  for insert
  to authenticated
  with check (user_id = (select auth.uid()) and public.budget_forecast_is_owner());

drop policy if exists budget_forecast_owner_update on public.budget_forecast_budgets;
create policy budget_forecast_owner_update
  on public.budget_forecast_budgets
  for update
  to authenticated
  using (user_id = (select auth.uid()) and public.budget_forecast_is_owner())
  with check (user_id = (select auth.uid()) and public.budget_forecast_is_owner());

drop policy if exists budget_forecast_owner_delete on public.budget_forecast_budgets;
create policy budget_forecast_owner_delete
  on public.budget_forecast_budgets
  for delete
  to authenticated
  using (user_id = (select auth.uid()) and public.budget_forecast_is_owner());

-- Anonymous visitors use demo mode only; they must never reach this table.
revoke all on public.budget_forecast_budgets from anon;
revoke all on public.budget_forecast_budgets from public;
grant select, insert, update, delete on public.budget_forecast_budgets to authenticated;

-- Keep updated_at honest regardless of what the client sends.
create or replace function public.budget_forecast_touch_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists budget_forecast_set_updated_at on public.budget_forecast_budgets;
create trigger budget_forecast_set_updated_at
  before insert or update on public.budget_forecast_budgets
  for each row
  execute function public.budget_forecast_touch_updated_at();
