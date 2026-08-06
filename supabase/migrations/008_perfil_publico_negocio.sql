-- La tarjeta de presentacion pasa a mostrar descripcion, horarios de atencion y
-- notas del negocio, todo editable desde el panel. Anon necesita leer esas claves.
--
-- Sigue siendo una lista blanca explicita y NO `using (true)`: con `true`
-- cualquier visitante podria leer gmail_app_password desde el navegador.
-- Al agregar una clave publica nueva, sumarla aca; lo que no este listado
-- queda invisible para anon por defecto, que es el comportamiento que queremos.

drop policy "anon_read_public_settings" on settings;

create policy "anon_read_public_settings" on settings
  for select to anon
  using (key in (
    'profile_photo',
    'business_name',
    'business_description',
    'business_hours',
    'business_notes'
  ));
