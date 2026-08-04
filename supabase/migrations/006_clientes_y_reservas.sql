-- Separa la persona (clientes) y el hecho de haber reservado (reservas) de la
-- grilla de horarios (appointments). Hasta ahora los tres eran la misma fila, y
-- al cancelar se borraban los datos porque el slot se reciclaba.

create table clientes (
  id         uuid primary key default gen_random_uuid(),
  nombre     text not null,
  email      text not null,
  telefono   text,
  notas      text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint clientes_email_unico unique (email)
);

create table reservas (
  id             uuid primary key default gen_random_uuid(),
  cliente_id     uuid not null references clientes(id) on delete cascade,
  appointment_id uuid references appointments(id) on delete set null,
  fecha          date not null,
  hora           time not null,
  comentario     text,
  estado         text not null default 'confirmada'
    check (estado in ('confirmada','cancelada_cliente','cancelada_negocio','completada','ausente')),
  created_at     timestamptz default now(),
  updated_at     timestamptz default now()
);

create index reservas_cliente_idx on reservas (cliente_id, fecha desc);
create index reservas_appointment_idx on reservas (appointment_id);

alter table clientes enable row level security;
alter table reservas enable row level security;

-- Datos personales acumulados: solo el titular logueado los ve. anon no toca nada,
-- el registro lo hace el trigger con security definer.
create policy "authenticated_full_access_clientes" on clientes
  for all to authenticated using (true) with check (true);

create policy "authenticated_full_access_reservas" on reservas
  for all to authenticated using (true) with check (true);

revoke all on clientes from anon;
revoke all on reservas from anon;
grant all on clientes to authenticated;
grant all on reservas to authenticated;
