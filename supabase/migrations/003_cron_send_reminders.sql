-- Cron que dispara send-reminders cada 30 minutos.
--
-- La service_role key NO va hardcodeada acá: se guarda en Supabase Vault y el job
-- la lee en tiempo de ejecución. Una version anterior de este archivo la tenia en
-- texto plano y termino publicada en un repo publico — no repetir.
--
-- Antes de correr esto:
--   1. Copiar la service_role key desde Settings -> API Keys (la marcada como secret).
--   2. Reemplazar PEGAR_SERVICE_ROLE_KEY_ACA abajo, ejecutar, y NO commitear el archivo editado.
--   3. Reemplazar <PROJECT_REF> por el ref del proyecto.

create extension if not exists pg_cron;
create extension if not exists pg_net;

select vault.create_secret(
  'PEGAR_SERVICE_ROLE_KEY_ACA',
  'service_role_key',
  'Usada por el cron de send-reminders'
);

select cron.schedule(
  'send-reminders',
  '*/30 * * * *',
  $$
  select net.http_post(
    url     := 'https://<PROJECT_REF>.supabase.co/functions/v1/send-reminders',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'service_role_key'),
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  )
  $$
);

-- Verificar:  select jobname, schedule, active from cron.job;
-- Desprogramar: select cron.unschedule('send-reminders');
