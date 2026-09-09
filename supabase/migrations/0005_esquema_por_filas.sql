-- juntos · v5 · el espacio deja de ser un único documento JSON.
-- Cada cita, análisis, ecografía, síntoma, recuerdo, nombre, familiar, tarea e hito es una fila propia
-- (tabla entries), y los datos del embarazo van en workspaces.pregnancy. Así:
--   · dos personas editando a la vez no se pisan (el conflicto queda acotado a una fila),
--   · el realtime manda solo la fila que cambió,
--   · se puede consultar por tipo y fecha (avisos, series).
-- workspaces.data se conserva como copia histórica y deja de escribirse.

alter table public.workspaces add column if not exists pregnancy jsonb not null default '{}'::jsonb;
alter table public.workspaces add column if not exists demo boolean not null default false;

create table if not exists public.entries (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  collection   text not null check (collection in ('appointments','tests','ultrasounds','symptoms','memories','names','family','tasks','customMilestones','milestones')),
  id           text not null,
  data         jsonb not null default '{}'::jsonb,
  -- fecha del ítem (cita, análisis, síntoma, recuerdo, hito…) para consultas y avisos
  date         date generated always as (nullif(left(data->>'date', 10), '')::date) stored,
  updated_by   uuid,
  updated_at   timestamptz not null default now(),
  primary key (workspace_id, collection, id)
);
create index if not exists entries_ws_col_date on public.entries (workspace_id, collection, date);
alter table public.entries enable row level security;
create policy entries_select on public.entries for select to authenticated using (public.is_member(workspace_id));
create policy entries_insert on public.entries for insert to authenticated with check (public.is_member(workspace_id));
create policy entries_update on public.entries for update to authenticated using (public.is_member(workspace_id)) with check (public.is_member(workspace_id));
create policy entries_delete on public.entries for delete to authenticated using (public.is_member(workspace_id));

create or replace function public.entries_touch() returns trigger
language plpgsql set search_path = public as $$
begin new.updated_at = now(); new.updated_by = auth.uid(); return new; end $$;
drop trigger if exists entries_touch on public.entries;
create trigger entries_touch before insert or update on public.entries for each row execute function public.entries_touch();

-- Realtime por fila (RLS se respeta). Para los DELETE hace falta que el PK viaje en el evento.
alter table public.entries replica identity full;
alter publication supabase_realtime add table public.entries;

-- Descomponer un documento v1 en filas (idempotente: upsert)
create or replace function public.explode_doc(p_ws uuid, p_doc jsonb) returns int
language plpgsql security definer set search_path = public as $$
declare c text; it jsonb; k text; n int := 0;
begin
  update public.workspaces set pregnancy = coalesce(p_doc->'pregnancy', '{}'::jsonb), demo = coalesce((p_doc->>'demo')::boolean, false) where id = p_ws;
  foreach c in array array['appointments','tests','ultrasounds','symptoms','memories','names','family','tasks','customMilestones'] loop
    for it in select * from jsonb_array_elements(coalesce(p_doc->c, '[]'::jsonb)) loop
      if it->>'id' is null then continue; end if;
      insert into public.entries (workspace_id, collection, id, data) values (p_ws, c, it->>'id', it - 'id')
        on conflict (workspace_id, collection, id) do update set data = excluded.data;
      n := n + 1;
    end loop;
  end loop;
  for k, it in select * from jsonb_each(coalesce(p_doc->'milestones', '{}'::jsonb)) loop
    if it is null or jsonb_typeof(it) <> 'object' then continue; end if;
    insert into public.entries (workspace_id, collection, id, data) values (p_ws, 'milestones', k, it)
      on conflict (workspace_id, collection, id) do update set data = excluded.data;
    n := n + 1;
  end loop;
  return n;
end $$;
revoke all on function public.explode_doc(uuid, jsonb) from public, anon, authenticated;

-- Migrar lo que ya existe
do $$ declare w record; begin
  for w in select id, data from public.workspaces where data ? 'pregnancy' loop perform public.explode_doc(w.id, w.data); end loop;
end $$;

-- Crear el espacio: ahora escribe pregnancy + filas
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
  insert into public.workspaces (invite_code, data, created_by) values (code, '{}'::jsonb, auth.uid()) returning * into w;
  insert into public.workspace_members (workspace_id, user_id, role) values (w.id, auth.uid(), p_role);
  perform public.explode_doc(w.id, jsonb_set(coalesce(p_data,'{}'::jsonb), '{pregnancy,inviteCode}', to_jsonb(code), true));
  select * into w from public.workspaces where id = w.id;
  return w;
end $$;

-- Reemplazar todo el contenido del espacio (para "cargar ejemplo" u otros reinicios)
create or replace function public.replace_workspace(p_ws uuid, p_data jsonb) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_member(p_ws) then raise exception 'Sin acceso'; end if;
  delete from public.entries where workspace_id = p_ws;
  perform public.explode_doc(p_ws, p_data);
end $$;
revoke all on function public.replace_workspace(uuid, jsonb) from public, anon;
grant execute on function public.replace_workspace(uuid, jsonb) to authenticated;

-- Suscripciones push (una fila por navegador/dispositivo)
create table if not exists public.push_subs (
  endpoint     text primary key,
  user_id      uuid not null references auth.users(id) on delete cascade,
  workspace_id uuid references public.workspaces(id) on delete cascade,
  keys         jsonb not null,
  ua           text,
  created_at   timestamptz not null default now(),
  last_ok_at   timestamptz
);
create index if not exists push_subs_user on public.push_subs (user_id);
alter table public.push_subs enable row level security;
create policy push_subs_own on public.push_subs for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Registro de avisos enviados (para no repetir el mismo aviso el mismo día)
create table if not exists public.push_log (
  user_id uuid not null references auth.users(id) on delete cascade,
  key     text not null,
  sent_at timestamptz not null default now(),
  primary key (user_id, key)
);
alter table public.push_log enable row level security;
