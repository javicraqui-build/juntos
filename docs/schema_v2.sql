-- ============================================================
-- juntos — esquema relacional (Postgres / Supabase)
-- "El embarazo, juntos."
-- Un embarazo = un espacio compartido. Ambos miembros de la pareja
-- son miembros del mismo pregnancy_id y ven/escriben lo mismo.
-- ============================================================

create extension if not exists pgcrypto;

-- ---------- Tipos ----------
create type member_role       as enum ('mother', 'partner');
create type pregnancy_type    as enum ('single', 'twins', 'unknown');
create type pregnancy_status  as enum ('active', 'born', 'ended');
create type test_status       as enum ('pending', 'normal', 'review', 'follow_up');
create type symptom_level     as enum ('none', 'mild', 'moderate', 'intense');
create type task_status       as enum ('pending', 'in_progress', 'done');
create type task_owner        as enum ('mother', 'partner', 'both');
create type vote_value        as enum ('like', 'favorite', 'dislike');
create type event_kind        as enum ('medical', 'emotional', 'custom');

-- ---------- Usuarios ----------
create table users (
  id           uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  email        text,
  created_at   timestamptz not null default now()
);

-- ---------- Embarazos ----------
create table pregnancies (
  id                    uuid primary key default gen_random_uuid(),
  last_menstrual_period date,                       -- FUM
  estimated_due_date    date generated always as (last_menstrual_period + 280) stored,
  ultrasound_due_date   date,                       -- FPP ajustada por ecografía (manda si existe)
  conception_estimate   date generated always as (last_menstrual_period + 14) stored,
  maternal_age          smallint check (maternal_age between 12 and 65),
  country               char(2) not null default 'ES',
  pregnancy_type        pregnancy_type not null default 'single',
  first_pregnancy       boolean,
  status                pregnancy_status not null default 'active',
  invite_code           text unique not null default upper(substr(encode(gen_random_bytes(6), 'base32'), 1, 6)),
  created_by            uuid references users(id),
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

-- FPP efectiva: la ecográfica si existe, si no la de FUM
create or replace function effective_due_date(p pregnancies) returns date
language sql immutable as $$ select coalesce(p.ultrasound_due_date, p.estimated_due_date) $$;

-- Edad gestacional en días para una fecha (recalcula automáticamente si cambia la FPP)
create or replace function gestational_days(p_pregnancy uuid, p_date date default current_date) returns int
language sql stable as $$
  select (p_date - (effective_due_date(p) - 280)) from pregnancies p where p.id = p_pregnancy
$$;

create table pregnancy_members (
  pregnancy_id uuid not null references pregnancies(id) on delete cascade,
  user_id      uuid not null references users(id) on delete cascade,
  role         member_role not null,
  joined_at    timestamptz not null default now(),
  primary key (pregnancy_id, user_id),
  unique (pregnancy_id, role)                        -- una madre y una pareja por embarazo
);

-- ---------- Salud ----------
create table appointments (
  id            uuid primary key default gen_random_uuid(),
  pregnancy_id  uuid not null references pregnancies(id) on delete cascade,
  title         text not null,
  doctor        text,
  specialty     text,
  clinic        text,
  location      text,
  scheduled_at  timestamptz not null,
  notes         text,
  questions     text[] not null default '{}',       -- preguntas para hacer
  done          boolean not null default false,
  created_by    uuid references users(id),
  created_at    timestamptz not null default now()
);

create table medical_tests (
  id               uuid primary key default gen_random_uuid(),
  pregnancy_id     uuid not null references pregnancies(id) on delete cascade,
  name             text not null,                    -- beta hCG, NIPT, glucosa…
  kind             text not null,                    -- blood, urine, genetic, glucose, blood_pressure, screening, ultrasound, other
  test_date        date,
  gestational_days int,                              -- se rellena por trigger si es null
  status           test_status not null default 'pending',
  interpretation   text,                             -- explicación sencilla
  doctor_notes     text,
  created_by       uuid references users(id),
  created_at       timestamptz not null default now()
);

create table test_results (
  id              uuid primary key default gen_random_uuid(),
  test_id         uuid not null references medical_tests(id) on delete cascade,
  label           text not null,                     -- p. ej. "hCG", "TN", "Trisomía 21"
  value           text not null,
  unit            text,
  reference_range text,
  flag            text                               -- normal | low | high | comment
);

create table ultrasounds (
  id               uuid primary key default gen_random_uuid(),
  pregnancy_id     uuid not null references pregnancies(id) on delete cascade,
  scan_date        date not null,
  gestational_days int,
  crl_mm           numeric(5,1),
  fetal_heart_rate smallint,
  comments         text,
  doctor           text,
  clinic           text,
  created_by       uuid references users(id),
  created_at       timestamptz not null default now()
);

create table symptoms (
  id           uuid primary key default gen_random_uuid(),
  pregnancy_id uuid not null references pregnancies(id) on delete cascade,
  log_date     date not null default current_date,
  nausea       symptom_level not null default 'none',
  fatigue      symptom_level not null default 'none',
  breast_pain  symptom_level not null default 'none',
  headache     symptom_level not null default 'none',
  cramps       symptom_level not null default 'none',
  low_mood     symptom_level not null default 'none',
  sleep_issues symptom_level not null default 'none',
  appetite     symptom_level not null default 'none',
  dizziness    symptom_level not null default 'none',
  other        text,
  unique (pregnancy_id, log_date)
);

-- ---------- Evolución ----------
create table timeline_events (
  id               uuid primary key default gen_random_uuid(),
  pregnancy_id     uuid not null references pregnancies(id) on delete cascade,
  key              text,                             -- 'positive_test', 'first_ultrasound', 'nipt'… null si es custom
  kind             event_kind not null default 'custom',
  title            text not null,
  description      text,
  event_date       date,                             -- real si ya ocurrió
  target_week      smallint,                         -- semana típica (para recalcular fecha estimada)
  target_day       smallint default 0,
  done             boolean not null default false,
  notes            text,
  created_by       uuid references users(id),
  created_at       timestamptz not null default now(),
  unique (pregnancy_id, key)
);

-- Fecha estimada de un hito futuro (se recalcula sola si cambia la FPP)
create or replace function timeline_estimated_date(e timeline_events) returns date
language sql stable as $$
  select case when e.event_date is not null then e.event_date
              else (effective_due_date(p) - 280) + e.target_week * 7 + coalesce(e.target_day, 0) end
  from pregnancies p where p.id = e.pregnancy_id
$$;

-- ---------- Nosotros ----------
create table memories (
  id               uuid primary key default gen_random_uuid(),
  pregnancy_id     uuid not null references pregnancies(id) on delete cascade,
  title            text not null,
  body             text,
  memory_date      date not null default current_date,
  gestational_days int,
  author_id        uuid references users(id),
  timeline_event_id uuid references timeline_events(id) on delete set null,
  created_at       timestamptz not null default now()
);

create table baby_names (
  id           uuid primary key default gen_random_uuid(),
  pregnancy_id uuid not null references pregnancies(id) on delete cascade,
  name         text not null,
  meaning      text,
  origin       text,
  notes        text,
  added_by     uuid references users(id),
  created_at   timestamptz not null default now(),
  unique (pregnancy_id, name)
);

create table baby_name_votes (
  name_id    uuid not null references baby_names(id) on delete cascade,
  user_id    uuid not null references users(id) on delete cascade,
  vote       vote_value not null,
  voted_at   timestamptz not null default now(),
  primary key (name_id, user_id)
);

-- "Los dos aman este nombre": vista de coincidencias
create view baby_name_matches as
select n.pregnancy_id, n.id as name_id, n.name
from baby_names n
join baby_name_votes v1 on v1.name_id = n.id and v1.vote <> 'dislike'
join baby_name_votes v2 on v2.name_id = n.id and v2.vote <> 'dislike' and v2.user_id <> v1.user_id
group by n.pregnancy_id, n.id, n.name;

create table tasks (
  id           uuid primary key default gen_random_uuid(),
  pregnancy_id uuid not null references pregnancies(id) on delete cascade,
  title        text not null,
  owner        task_owner not null default 'both',
  due_date     date,
  status       task_status not null default 'pending',
  notes        text,
  created_by   uuid references users(id),
  created_at   timestamptz not null default now()
);

create table family_members (
  id           uuid primary key default gen_random_uuid(),
  pregnancy_id uuid not null references pregnancies(id) on delete cascade,
  name         text not null,
  group_name   text not null,                        -- abuelos, bisabuelos, hermanos, sobrinos, primos, amigos, trabajo, otros
  created_at   timestamptz not null default now()
);

create table family_announcements (
  id               uuid primary key default gen_random_uuid(),
  family_member_id uuid not null references family_members(id) on delete cascade,
  told_on          date,
  how              text,
  reaction         text,
  memory_id        uuid references memories(id) on delete set null,
  unique (family_member_id)
);

-- ---------- IA, documentos, notificaciones ----------
create table ai_conversations (
  id           uuid primary key default gen_random_uuid(),
  pregnancy_id uuid not null references pregnancies(id) on delete cascade,
  user_id      uuid references users(id),            -- quién pregunta (rol relevante para la respuesta)
  role         text not null check (role in ('user', 'assistant')),
  content      text not null,
  urgent_flag  text,                                 -- señal de alarma detectada, si la hubo
  context      jsonb,                                -- snapshot del contexto usado (semana, citas…)
  created_at   timestamptz not null default now()
);

create table documents (
  id           uuid primary key default gen_random_uuid(),
  pregnancy_id uuid not null references pregnancies(id) on delete cascade,
  storage_path text not null,                        -- bucket privado en Supabase Storage
  mime_type    text,
  kind         text,                                 -- photo | audio | pdf
  -- polimórfico: a qué pertenece
  entity_type  text not null,                        -- memory | ultrasound | medical_test | timeline_event | appointment
  entity_id    uuid not null,
  uploaded_by  uuid references users(id),
  created_at   timestamptz not null default now()
);
create index on documents (entity_type, entity_id);

create table notifications (
  id           uuid primary key default gen_random_uuid(),
  pregnancy_id uuid not null references pregnancies(id) on delete cascade,
  user_id      uuid references users(id),            -- null = ambos
  kind         text not null,                        -- week_start, milestone_countdown, appointment_tomorrow, talk_topic, trimester
  title        text not null,
  body         text,
  send_at      timestamptz not null,
  sent_at      timestamptz,
  read_at      timestamptz,
  dedupe_key   text,                                 -- evita spam: una por (embarazo, tipo, semana)
  unique (pregnancy_id, dedupe_key)
);

-- Contenido semanal (global, no por embarazo)
create table weekly_content (
  week              smallint primary key check (week between 1 and 42),
  baby              text[] not null,                 -- qué está pasando con el bebé
  length_cm         numeric(4,1),
  weight_g          int,
  size_comparison   text not null,                   -- "una fresa"
  for_her           text not null,
  for_partner       text not null,
  medical_milestones text,
  talk_topics       text[] not null default '{}',
  locale            text not null default 'es'
);

-- ---------- Triggers de utilidad ----------
create or replace function set_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;
create trigger pregnancies_updated before update on pregnancies for each row execute function set_updated_at();

-- Rellena gestational_days si viene vacío
create or replace function fill_gestational_days() returns trigger language plpgsql as $$
declare d date;
begin
  d := coalesce(
        case tg_table_name when 'medical_tests' then new.test_date when 'ultrasounds' then new.scan_date when 'memories' then new.memory_date end,
        current_date);
  if new.gestational_days is null then new.gestational_days := gestational_days(new.pregnancy_id, d); end if;
  return new;
end $$;
create trigger medical_tests_ga before insert or update on medical_tests for each row execute function fill_gestational_days();
create trigger ultrasounds_ga   before insert or update on ultrasounds   for each row execute function fill_gestational_days();
create trigger memories_ga      before insert or update on memories      for each row execute function fill_gestational_days();

-- Al crear un embarazo, siembra los hitos por defecto
create or replace function seed_timeline() returns trigger language plpgsql as $$
begin
  insert into timeline_events (pregnancy_id, key, kind, title, description, target_week, target_day) values
   (new.id,'positive_test','emotional','Test de embarazo positivo','El día que lo supimos.',4,3),
   (new.id,'first_visit','medical','Primera consulta prenatal','Historia clínica, analítica inicial y planificación del seguimiento.',7,0),
   (new.id,'first_ultrasound','medical','Primera ecografía','Primera imagen. Se mide el embrión y se confirma la fecha probable de parto.',8,0),
   (new.id,'intrauterine','medical','Embarazo intrauterino confirmado','El embrión está bien ubicado en el útero.',8,0),
   (new.id,'heartbeat','emotional','Actividad cardíaca detectada','El corazón ya late.',8,0),
   (new.id,'nipt','medical','NIPT','Test prenatal no invasivo.',10,0),
   (new.id,'ultrasound_12','medical','Ecografía del primer trimestre','Translucencia nucal y anatomía temprana.',12,0),
   (new.id,'sex_reveal','emotional','Descubrimos el sexo','Si quieren saberlo.',16,0),
   (new.id,'first_movements','emotional','Primeros movimientos','Como burbujas o mariposas.',19,0),
   (new.id,'ultrasound_20','medical','Ecografía morfológica','Revisión detallada de órganos, placenta y crecimiento.',20,0),
   (new.id,'partner_kick','emotional','Pareja sintió la primera patada','La primera vez que lo sentimos los dos.',23,0),
   (new.id,'third_trimester','medical','Inicio del tercer trimestre','Última etapa.',28,0),
   (new.id,'hospital_bag','custom','Preparación del bolso','Listo en la puerta.',34,0),
   (new.id,'full_term','medical','Embarazo a término','Desde ahora puede nacer en cualquier momento.',37,0),
   (new.id,'due_date','medical','Fecha probable de parto','Una referencia, no una cita.',40,0),
   (new.id,'birth','emotional','Nacimiento','El primer capítulo de la historia de después.',40,0);
  return new;
end $$;
create trigger pregnancies_seed after insert on pregnancies for each row execute function seed_timeline();

-- ---------- Seguridad (RLS): solo los miembros del embarazo ----------
create or replace function is_member(p uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from pregnancy_members m where m.pregnancy_id = p and m.user_id = auth.uid())
$$;

alter table users enable row level security;
create policy users_self on users for all using (id = auth.uid()) with check (id = auth.uid());

alter table pregnancies enable row level security;
create policy preg_members on pregnancies for select using (is_member(id));
create policy preg_update  on pregnancies for update using (is_member(id));
create policy preg_insert  on pregnancies for insert with check (auth.uid() is not null);

alter table pregnancy_members enable row level security;
create policy pm_select on pregnancy_members for select using (is_member(pregnancy_id));
create policy pm_insert on pregnancy_members for insert with check (user_id = auth.uid());
create policy pm_delete on pregnancy_members for delete using (user_id = auth.uid());

-- Unirse con código de invitación (RPC): evita exponer pregnancies a no miembros
create or replace function join_pregnancy(p_code text, p_role member_role) returns uuid
language plpgsql security definer set search_path = public as $$
declare pid uuid;
begin
  select id into pid from pregnancies where invite_code = upper(p_code) and status = 'active';
  if pid is null then raise exception 'Código no válido'; end if;
  insert into pregnancy_members (pregnancy_id, user_id, role) values (pid, auth.uid(), p_role);
  return pid;
end $$;

-- Política genérica para todas las tablas con pregnancy_id
do $$
declare t text;
begin
  foreach t in array array['appointments','medical_tests','ultrasounds','symptoms','timeline_events','memories','baby_names','tasks','family_members','ai_conversations','documents','notifications'] loop
    execute format('alter table %I enable row level security', t);
    execute format('create policy %I_members on %I for all using (is_member(pregnancy_id)) with check (is_member(pregnancy_id))', t, t);
  end loop;
end $$;

alter table test_results enable row level security;
create policy tr_members on test_results for all
  using (exists (select 1 from medical_tests mt where mt.id = test_id and is_member(mt.pregnancy_id)))
  with check (exists (select 1 from medical_tests mt where mt.id = test_id and is_member(mt.pregnancy_id)));

alter table baby_name_votes enable row level security;
create policy bnv_select on baby_name_votes for select using (exists (select 1 from baby_names n where n.id = name_id and is_member(n.pregnancy_id)));
create policy bnv_own    on baby_name_votes for all using (user_id = auth.uid()) with check (user_id = auth.uid() and exists (select 1 from baby_names n where n.id = name_id and is_member(n.pregnancy_id)));

alter table family_announcements enable row level security;
create policy fa_members on family_announcements for all
  using (exists (select 1 from family_members f where f.id = family_member_id and is_member(f.pregnancy_id)))
  with check (exists (select 1 from family_members f where f.id = family_member_id and is_member(f.pregnancy_id)));

alter table weekly_content enable row level security;
create policy wc_read on weekly_content for select using (true);

-- ---------- Índices ----------
create index on appointments (pregnancy_id, scheduled_at);
create index on medical_tests (pregnancy_id, test_date);
create index on symptoms (pregnancy_id, log_date desc);
create index on memories (pregnancy_id, memory_date desc);
create index on tasks (pregnancy_id, status, due_date);
create index on notifications (pregnancy_id, send_at) where sent_at is null;
create index on ai_conversations (pregnancy_id, created_at);
