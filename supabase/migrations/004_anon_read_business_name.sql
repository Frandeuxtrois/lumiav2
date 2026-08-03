-- El header publico y la tarjeta de presentacion muestran el nombre del negocio,
-- que vive en settings.business_name. Anon necesita poder leer esa clave.
--
-- Es una lista blanca explicita y NO `using (true)`: con `true` cualquier
-- visitante podria leer gmail_app_password desde el navegador.

drop policy "anon_read_profile_photo" on settings;

create policy "anon_read_public_settings" on settings
  for select to anon
  using (key in ('profile_photo', 'business_name'));

-- Valor inicial por instancia (o cargarlo desde el panel):
--   insert into settings (key, value) values ('business_name', 'Nombre del negocio')
--   on conflict (key) do update set value = excluded.value, updated_at = now();
