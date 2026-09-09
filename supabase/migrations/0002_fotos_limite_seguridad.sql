-- juntos · v2 · fotos en Storage, límite de preguntas a la IA, avisos de seguridad del linter

-- 1) Fotos: bucket privado. Ruta: <workspace_id>/<archivo>.jpg. Solo los miembros del espacio leen/escriben.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  values ('fotos', 'fotos', false, 2097152, array['image/jpeg','image/png','image/webp'])
  on conflict (id) do nothing;

create policy fotos_select on storage.objects for select to authenticated
  using (bucket_id = 'fotos' and public.is_member(((storage.foldername(name))[1])::uuid));
create policy fotos_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'fotos' and public.is_member(((storage.foldername(name))[1])::uuid));
create policy fotos_update on storage.objects for update to authenticated
  using (bucket_id = 'fotos' and public.is_member(((storage.foldername(name))[1])::uuid));
create policy fotos_delete on storage.objects for delete to authenticated
  using (bucket_id = 'fotos' and public.is_member(((storage.foldername(name))[1])::uuid));

-- 2) Límite de preguntas a la IA por persona y día. La API llama a ai_tick() con el JWT del usuario.
create table if not exists public.ai_usage (
  user_id uuid not null references auth.users(id) on delete cascade,
  day     date not null default current_date,
  n       int  not null default 0,
  primary key (user_id, day)
);
alter table public.ai_usage enable row level security;
-- sin policies: solo se toca desde la función

create or replace function public.ai_tick(p_limit int default 40)
returns int language plpgsql security definer set search_path = public as $$
declare c int;
begin
  if auth.uid() is null then raise exception 'No autenticado'; end if;
  insert into public.ai_usage (user_id, day, n) values (auth.uid(), current_date, 1)
    on conflict (user_id, day) do update set n = public.ai_usage.n + 1
    returning n into c;
  return c;  -- la API compara con p_limit; se devuelve el contador para poder avisar
end $$;
revoke all on function public.ai_tick(int) from public, anon;
grant execute on function public.ai_tick(int) to authenticated;

-- 3) Linter: search_path fijo y sin ejecución anónima de las funciones security definer
create or replace function public.set_updated_at() returns trigger
language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end $$;

create or replace function public.gen_invite_code() returns text
language plpgsql set search_path = public as $$
declare a text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; s text := ''; i int;
begin
  for i in 1..6 loop s := s || substr(a, 1 + floor(random()*length(a))::int, 1); end loop;
  return s;
end $$;

revoke execute on function public.create_workspace(jsonb, text) from public, anon;
revoke execute on function public.join_workspace(text, text) from public, anon;
revoke execute on function public.leave_workspace(uuid) from public, anon;
revoke execute on function public.is_member(uuid) from public, anon;
revoke execute on function public.gen_invite_code() from public, anon;

-- 4) El código de invitación no se cambia desde el cliente
create or replace function public.protect_invite_code() returns trigger
language plpgsql set search_path = public as $$
begin
  if new.invite_code is distinct from old.invite_code then new.invite_code := old.invite_code; end if;
  return new;
end $$;
drop trigger if exists workspaces_protect_code on public.workspaces;
create trigger workspaces_protect_code before update on public.workspaces for each row execute function public.protect_invite_code();
