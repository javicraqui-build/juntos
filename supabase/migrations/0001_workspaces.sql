-- juntos · v1 · espacio compartido de la pareja como documento JSON
-- (el esquema normalizado vive en docs/schema_v2.sql como destino de migración)

create extension if not exists pgcrypto;

create table public.workspaces (
  id          uuid primary key default gen_random_uuid(),
  invite_code text not null unique,
  data        jsonb not null default '{}'::jsonb,
  created_by  uuid references auth.users(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table public.workspace_members (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id      uuid not null references auth.users(id) on delete cascade,
  role         text not null check (role in ('mother','partner')),
  joined_at    timestamptz not null default now(),
  primary key (workspace_id, user_id)
);
create index on public.workspace_members (user_id);

create or replace function public.set_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;
create trigger workspaces_updated before update on public.workspaces for each row execute function public.set_updated_at();

create or replace function public.is_member(ws uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.workspace_members m where m.workspace_id = ws and m.user_id = auth.uid())
$$;

alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;

create policy ws_select on public.workspaces for select to authenticated using (public.is_member(id));
create policy ws_update on public.workspaces for update to authenticated using (public.is_member(id)) with check (public.is_member(id));
create policy wm_select on public.workspace_members for select to authenticated using (public.is_member(workspace_id));
create policy wm_update_self on public.workspace_members for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy wm_delete_self on public.workspace_members for delete to authenticated using (user_id = auth.uid());

-- Código de invitación legible (sin 0/O/1/I)
create or replace function public.gen_invite_code() returns text language plpgsql as $$
declare a text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; s text := ''; i int;
begin
  for i in 1..6 loop s := s || substr(a, 1 + floor(random()*length(a))::int, 1); end loop;
  return s;
end $$;

-- Crear el espacio (una sola llamada: workspace + membresía)
create or replace function public.create_workspace(p_data jsonb, p_role text)
returns public.workspaces language plpgsql security definer set search_path = public as $$
declare w public.workspaces; code text;
begin
  if auth.uid() is null then raise exception 'No autenticado'; end if;
  if p_role not in ('mother','partner') then raise exception 'Rol no válido'; end if;
  loop
    code := public.gen_invite_code();
    exit when not exists (select 1 from public.workspaces where invite_code = code);
  end loop;
  insert into public.workspaces (invite_code, data, created_by)
    values (code, jsonb_set(coalesce(p_data,'{}'::jsonb), '{pregnancy,inviteCode}', to_jsonb(code), true), auth.uid())
    returning * into w;
  insert into public.workspace_members (workspace_id, user_id, role) values (w.id, auth.uid(), p_role);
  return w;
end $$;

-- Unirse con código
create or replace function public.join_workspace(p_code text, p_role text)
returns public.workspaces language plpgsql security definer set search_path = public as $$
declare w public.workspaces; n int;
begin
  if auth.uid() is null then raise exception 'No autenticado'; end if;
  if p_role not in ('mother','partner') then raise exception 'Rol no válido'; end if;
  select * into w from public.workspaces where invite_code = upper(trim(p_code));
  if w.id is null then raise exception 'Código no válido'; end if;
  select count(*) into n from public.workspace_members where workspace_id = w.id and user_id <> auth.uid();
  if n >= 2 then raise exception 'Este espacio ya tiene dos personas'; end if;
  insert into public.workspace_members (workspace_id, user_id, role) values (w.id, auth.uid(), p_role)
    on conflict (workspace_id, user_id) do update set role = excluded.role;
  return w;
end $$;

-- Salir del espacio (si queda vacío, se borra)
create or replace function public.leave_workspace(p_ws uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  delete from public.workspace_members where workspace_id = p_ws and user_id = auth.uid();
  delete from public.workspaces w where w.id = p_ws and not exists (select 1 from public.workspace_members m where m.workspace_id = w.id);
end $$;

grant execute on function public.create_workspace(jsonb, text) to authenticated;
grant execute on function public.join_workspace(text, text) to authenticated;
grant execute on function public.leave_workspace(uuid) to authenticated;
grant execute on function public.is_member(uuid) to authenticated;

-- Realtime para que la pareja vea los cambios al instante (RLS se respeta)
alter publication supabase_realtime add table public.workspaces;
