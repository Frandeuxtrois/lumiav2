-- El registro corre en la base, no en el front: no se puede saltear ni depende
-- de que el email salga bien. security definer para que funcione con anon.

create or replace function registrar_movimiento_reserva()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cliente uuid;
begin
  -- Reserva nueva: el slot pasa a booked
  if new.status = 'booked' and old.status is distinct from 'booked' then
    insert into clientes (nombre, email, telefono)
    values (coalesce(new.name, 'Sin nombre'), lower(trim(new.email)), new.phone)
    on conflict (email) do update
      set nombre     = excluded.nombre,
          telefono   = coalesce(excluded.telefono, clientes.telefono),
          updated_at = now()
    returning id into v_cliente;

    insert into reservas (cliente_id, appointment_id, fecha, hora, comentario)
    values (v_cliente, new.id, new.date, new.time, new.notes);

  -- El slot vuelve a estar libre: lo cancelo el cliente desde su link
  elsif old.status = 'booked' and new.status = 'available' then
    update reservas
      set estado = 'cancelada_cliente', updated_at = now()
      where appointment_id = new.id and estado = 'confirmada';

  elsif new.status = 'completed' and old.status is distinct from 'completed' then
    update reservas
      set estado = 'completada', updated_at = now()
      where appointment_id = new.id and estado = 'confirmada';
  end if;

  return new;
end;
$$;

create trigger trg_registrar_movimiento_reserva
  after update on appointments
  for each row
  execute function registrar_movimiento_reserva();

-- Si el titular elimina un turno reservado, la reserva queda como cancelada por
-- el negocio en vez de perderse.
create or replace function registrar_baja_reserva()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.status = 'booked' then
    update reservas
      set estado = 'cancelada_negocio', updated_at = now()
      where appointment_id = old.id and estado = 'confirmada';
  end if;
  return old;
end;
$$;

create trigger trg_registrar_baja_reserva
  before delete on appointments
  for each row
  execute function registrar_baja_reserva();
