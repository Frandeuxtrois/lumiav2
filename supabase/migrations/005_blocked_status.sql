-- Estado 'blocked' para feriados, vacaciones y recesos.
-- Los slots bloqueados siguen existiendo (se pueden desbloquear) pero la policy
-- anon_read_slots solo expone available/booked, asi que el publico no los ve.
alter table appointments drop constraint appointments_status_check;

alter table appointments add constraint appointments_status_check
  check (status in ('available', 'booked', 'cancelled', 'completed', 'blocked'));
