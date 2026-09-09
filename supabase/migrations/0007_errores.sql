-- juntos · v7 · registro propio de errores (front y funciones). El cron avisa al admin si hay nuevos.
create table if not exists public.app_errors (
  id         bigserial primary key,
  at         timestamptz not null default now(),
  origen     text not null,             -- 'web' | 'api/preguntar' | 'api/notificar'
  mensaje    text not null,
  detalle    text,                      -- stack o contexto (recortado)
  url        text,
  ua         text,
  user_id    uuid,
  version    text
);
create index if not exists app_errors_at on public.app_errors (at desc);
alter table public.app_errors enable row level security;
-- cualquier usuario autenticado puede registrar su propio error; nadie lee desde el cliente
create policy app_errors_insert on public.app_errors for insert to authenticated with check (user_id is null or user_id = auth.uid());

-- Vista previa de una invitación (para la pantalla de bienvenida antes de crear la cuenta).
-- Solo devuelve nombres, fechas del embarazo y cuántas personas hay; el código es el secreto.
create or replace function public.invite_preview(p_code text) returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'mother', w.pregnancy->'names'->>'mother', 'partner', w.pregnancy->'names'->>'partner',
    'lmp', w.pregnancy->>'lmp', 'edd', w.pregnancy->>'eddOverride', 'country', w.pregnancy->>'country',
    'members', (select count(*) from public.workspace_members m where m.workspace_id = w.id))
  from public.workspaces w where w.invite_code = upper(trim(p_code)) limit 1
$$;
revoke all on function public.invite_preview(text) from public;
grant execute on function public.invite_preview(text) to anon, authenticated;
