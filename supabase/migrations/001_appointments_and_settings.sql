-- Esquema base de Lumina. Aplicar primero en un proyecto nuevo.

create table appointments (
  id uuid primary key default gen_random_uuid(),
  name text,
  email text,
  phone text,
  notes text,
  date date not null,
  time time not null,
  status text not null default 'available'
    check (status in ('available','booked','cancelled','completed')),
  reminder_24h_sent boolean not null default false,
  reminder_2h_sent  boolean not null default false,
  created_at timestamptz default now(),
  constraint unique_slot unique (date, time)
);

alter table appointments enable row level security;

-- El calendario publico necesita ver los booked para marcar los dias llenos.
create policy "anon_read_slots" on appointments
  for select to anon
  using (status in ('available','booked'));

create policy "anon_book_slot" on appointments
  for update to anon
  using (status = 'available')
  with check (status = 'booked');

create policy "anon_cancel_slot" on appointments
  for update to anon
  using (status = 'booked')
  with check (status = 'available');

create policy "authenticated_full_access_appointments" on appointments
  for all to authenticated
  using (true)
  with check (true);

revoke all on appointments from anon;
grant select, update on appointments to anon;
grant all on appointments to authenticated;

-- Configuracion key/value que escribe la profesional desde el panel:
-- gmail_user, gmail_app_password, profile_photo.
create table settings (
  key text primary key,
  value text not null,
  updated_at timestamptz default now()
);

alter table settings enable row level security;

create policy "anon_read_profile_photo" on settings
  for select to anon
  using (key = 'profile_photo');

create policy "authenticated_full_access_settings" on settings
  for all to authenticated
  using (true)
  with check (true);

revoke all on settings from anon;
grant select on settings to anon;
grant all on settings to authenticated;
