-- juntos · v3 · conversación con el asistente privada por persona (no va en el documento compartido)
create table if not exists public.ai_chats (
  user_id      uuid primary key references auth.users(id) on delete cascade,
  workspace_id uuid references public.workspaces(id) on delete cascade,
  messages     jsonb not null default '[]'::jsonb,
  updated_at   timestamptz not null default now()
);
alter table public.ai_chats enable row level security;
create policy ai_chats_own on public.ai_chats for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create trigger ai_chats_updated before update on public.ai_chats for each row execute function public.set_updated_at();
