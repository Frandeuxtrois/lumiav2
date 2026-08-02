# Lumina — Turnero

SPA de reservas online para profesionales independientes. El paciente elige fecha y horario, deja sus datos y recibe confirmación por email con archivo de calendario adjunto. La profesional gestiona todo desde un panel privado.

El sistema envía tres tipos de email de forma automática: confirmación al reservar, cancelación (en ambas direcciones) y recordatorios a 24 y 2 horas del turno.

---

## Índice

1. [Stack](#stack)
2. [Estructura](#estructura)
3. [Base de datos](#base-de-datos)
4. [Storage](#storage)
5. [Variables y secrets](#variables-y-secrets)
6. [Edge Functions](#edge-functions)
7. [Cron de recordatorios](#cron-de-recordatorios)
8. [Flujo del paciente](#flujo-del-paciente)
9. [Flujo del administrador](#flujo-del-administrador)
10. [Levantar una instancia nueva](#levantar-una-instancia-nueva)
11. [Personalizar por cliente](#personalizar-por-cliente)

---

## Stack

| Capa | Tecnología |
|---|---|
| UI | React 19 + TypeScript + Vite 6 |
| Estilos | Tailwind CSS 4 |
| Routing | React Router DOM v7 |
| Animaciones | Motion v12 |
| Iconos | lucide-react |
| Backend / DB | Supabase (PostgreSQL + Auth + Storage + Edge Functions) |
| Emails | Gmail SMTP vía nodemailer, con adjuntos `.ics` |
| Recordatorios | pg_cron + pg_net |
| Deploy | Vercel (frontend) + Supabase (backend) |

El estado del servidor se maneja con llamadas directas al SDK de Supabase y `useState`. No hay capa de cache tipo TanStack Query.

---

## Estructura

```
/
├── src/
│   ├── App.tsx                   # Routing, sesión y flujo de reserva del paciente
│   ├── main.tsx                  # Entry point
│   ├── types.ts                  # Appointment, AppointmentStatus
│   ├── index.css                 # Variables de tema (colores, fuente)
│   ├── lib/
│   │   ├── supabase.ts           # Cliente singleton + flag supabaseReady
│   │   └── utils.ts              # formatTime(), formatDate(), cn()
│   ├── services/
│   │   └── api.ts                # appointmentService + emailService
│   └── components/
│       ├── Layout.tsx            # Navbar con reloj + footer
│       ├── Auth.tsx              # Login
│       ├── Calendar.tsx          # Calendario mensual
│       ├── SlotSelector.tsx      # Grid de horarios
│       ├── BookingForm.tsx       # Datos del paciente
│       ├── CancelAppointment.tsx # Cancelación por link (/cancelar?id=)
│       ├── ProfileCard.tsx       # Tarjeta de presentación
│       ├── AdminDashboard.tsx    # Panel: vista día y semana
│       ├── WeekView.tsx          # Vista semanal del panel
│       ├── CreateSlotsModal.tsx  # Alta de horarios (3 modos)
│       ├── GmailSetup.tsx        # Wizard de conexión con Gmail
│       ├── ChangePassword.tsx    # Cambio de contraseña
│       ├── PhotoUpload.tsx       # Foto de perfil
│       ├── ConfirmModal.tsx      # Confirmación de acciones destructivas
│       └── Manual.tsx            # Manual de uso dentro de la app
├── supabase/
│   ├── functions/
│   │   ├── send-confirmation/    # Email al reservar
│   │   ├── send-cancellation/    # Email al cancelar
│   │   └── send-reminders/       # Recordatorios 24h y 2h (lo dispara el cron)
│   └── migrations/
│       ├── 001_appointments_and_settings.sql
│       ├── 002_profile_storage_bucket.sql
│       └── 003_cron_send_reminders.sql
├── .env                          # Local, ignorado por git
├── vercel.json                   # Rewrites SPA
└── vite.config.ts
```

### Componentes

**`Calendar.tsx`** — Calendario mensual navegable. Desactiva fechas pasadas y días sin cupo. `date-fns` con locale español.

**`SlotSelector.tsx`** — Horarios de la fecha elegida. Los ocupados se muestran deshabilitados.

**`CancelAppointment.tsx`** — Página del link de cancelación. Valida el límite de horas (`CANCEL_HOURS_LIMIT`, default 48). Al cancelar devuelve el slot a `available` y borra los datos del paciente.

**`AdminDashboard.tsx`** — Vista día (lista filtrable) y vista semana. Marcar completado, eliminar, y accesos a los modales de configuración.

**`CreateSlotsModal.tsx`** — Tres modos:
- **Individual:** una fecha y una hora
- **Rango:** una fecha, horario desde/hasta y duración (30/45/60/90 min), con preview
- **Período:** días de la semana + rango de fechas + horario + duración, en bloque

**`GmailSetup.tsx`** — Wizard de 5 pasos para obtener una Contraseña de Aplicación de Google y guardarla en `settings`.

**`Manual.tsx`** — Manual de uso accesible desde el panel.

---

## Base de datos

### `appointments`

Cada fila es un slot horario. Los datos del paciente viven en la misma fila y quedan en `null` cuando el slot está libre.

| Campo | Tipo | Notas |
|---|---|---|
| `id` | UUID | PK |
| `date` | DATE | `YYYY-MM-DD` |
| `time` | TIME | `HH:MM` |
| `status` | TEXT | `available` / `booked` / `completed` / `cancelled` |
| `name`, `email`, `phone`, `notes` | TEXT | Datos del paciente, null si libre |
| `reminder_24h_sent` | BOOLEAN | Evita reenviar el recordatorio de 24h |
| `reminder_2h_sent` | BOOLEAN | Ídem para el de 2h |
| `created_at` | TIMESTAMPTZ | Auto |

**`unique_slot UNIQUE (date, time)`** — impide dos turnos en el mismo momento. `api.ts` detecta el error `23505` para avisar de duplicados al crear horarios en bloque.

### `settings`

Configuración key/value que escribe la profesional desde el panel.

| key | Contenido |
|---|---|
| `gmail_user` | Email de Gmail |
| `gmail_app_password` | Contraseña de aplicación de 16 caracteres |
| `profile_photo` | URL pública de la foto |

### RLS

El calendario público necesita ver los turnos ocupados para marcar los días llenos, por eso anon lee tanto `available` como `booked` — pero nunca los datos personales de otro paciente más allá de lo que expone la fila.

| Tabla | Policy | Rol | Operación |
|---|---|---|---|
| appointments | `anon_read_slots` | anon | SELECT `status in ('available','booked')` |
| appointments | `anon_book_slot` | anon | UPDATE `available` → `booked` |
| appointments | `anon_cancel_slot` | anon | UPDATE `booked` → `available` |
| appointments | `authenticated_full_access_appointments` | authenticated | ALL |
| settings | `anon_read_profile_photo` | anon | SELECT solo `key = 'profile_photo'` |
| settings | `authenticated_full_access_settings` | authenticated | ALL |
| storage.objects | `anon_read_profile_objects` | anon | SELECT bucket `profile` |
| storage.objects | `authenticated_manage_profile_photo` | authenticated | ALL bucket `profile` |

Todo esto está en `001` y `002`. No editar a mano desde el dashboard: si cambia, actualizar la migración.

---

## Storage

Bucket **`profile`**, público. Guarda `photo.{ext}` sobreescribiendo siempre (`upsert: true`). La URL pública se persiste en `settings.profile_photo`.

---

## Variables y secrets

### Front (`.env` local y Vercel)

```env
VITE_SUPABASE_URL=https://<PROJECT_REF>.supabase.co
VITE_SUPABASE_ANON_KEY=<ANON_KEY>
```

Son las únicas dos que lee el código. Se obtienen en Supabase → Settings → API Keys.

### Edge Function Secrets (Supabase → Edge Functions → Secrets)

| Secret | Usado por | Obligatorio |
|---|---|---|
| `APP_URL` | send-confirmation, send-reminders | Sí en producción. Sin esto los links de cancelación apuntan a `http://localhost:3000` y las funciones lo loguean como error |
| `THERAPIST_EMAIL` | send-confirmation, send-cancellation | No. Si falta usa el `gmail_user` de `settings` |

`SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` los inyecta Supabase automáticamente.

> La service_role key no va en ningún archivo del repo. Para el cron se guarda en Supabase Vault.

---

## Edge Functions

Las tres leen las credenciales de Gmail desde `settings` usando la service_role key, por lo que saltean RLS. Si `settings` no tiene `gmail_user` y `gmail_app_password`, devuelven **500** y no se envía nada. El front muestra ese fallo en pantalla, pero **la reserva se guarda igual**: el email es best-effort.

| Función | Se dispara | Envía |
|---|---|---|
| `send-confirmation` | Al confirmar una reserva | Email al paciente (link de cancelar + botón de Google Calendar + `.ics`) y aviso a la profesional |
| `send-cancellation` | Al cancelar, desde el link o desde el panel | Notifica a la contraparte con un `.ics` `METHOD:CANCEL` que borra el evento del calendario |
| `send-reminders` | Cron cada 30 min | Recordatorio a los turnos que caen en la ventana de 24h o 2h, y marca el flag para no repetir |

Los `.ics` usan `UID:<appointmentId>@lumina`. El UID debe coincidir entre confirmación y cancelación, si no el evento no se borra del calendario del paciente.

Para actualizar una función: Supabase → Edge Functions → seleccionar → pegar el contenido del archivo → Deploy.

---

## Cron de recordatorios

`send-reminders` corre cada 30 minutos vía `pg_cron`, que hace un `net.http_post` a la función.

La service_role key que necesita el header `Authorization` se guarda en **Supabase Vault** y el job la lee en tiempo de ejecución. Ver `003_cron_send_reminders.sql`.

```sql
-- Ver el job
select jobname, schedule, active from cron.job;

-- Ver las últimas corridas
select * from cron.job_run_details order by start_time desc limit 10;
```

La ventana de envío es `> 23h y <= 25h` para el de 24 horas y `> 1h y <= 3h` para el de 2. Con el cron cada 30 minutos, cada turno cae en la ventana varias veces, y lo que evita el reenvío son los flags `reminder_*_sent`.

Las fechas se interpretan en `America/Argentina/Buenos_Aires` (UTC-3, hardcodeado).

---

## Flujo del paciente

```
/ (home)
├── Tarjeta de presentación (foto, nombre)
├── Elige fecha → horario → completa sus datos
└── Confirma
    ├── Slot pasa a "booked"
    ├── Email al paciente con .ics y link de cancelación
    └── Aviso a la profesional
        └── Si el email falla, la reserva igual queda hecha y se avisa en pantalla

/cancelar?id=xxx
├── Valida que falten más de 48 hs
└── Cancela → slot vuelve a "available", se borran los datos, se notifica
```

## Flujo del administrador

```
/login → /admin

/admin
├── Vista día (lista filtrable) o vista semana
├── Marcar completado / eliminar (si estaba reservado, notifica al paciente)
├── "Nuevo Horario"      → individual / rango / período
├── "Foto de Perfil"     → sube a Storage
├── "Configurar Email"   → wizard de Gmail
├── "Cambiar Contraseña"
└── "Manual de Uso"
```

---

## Levantar una instancia nueva

### 1. Supabase

1. Crear proyecto nuevo (región `sa-east-1` para Argentina).
2. SQL Editor → correr `001_appointments_and_settings.sql`.
3. SQL Editor → correr `002_profile_storage_bucket.sql`.
4. Authentication → Users → Add user: crear la cuenta de la profesional con su contraseña.
5. **Authentication → Providers → Email → desactivar "Enable email signup".** Sin esto cualquiera puede registrarse y entrar al panel, porque el panel solo verifica que haya sesión iniciada.
6. Edge Functions → deployar `send-confirmation`, `send-cancellation` y `send-reminders` con `verify_jwt` activado.
7. Edge Functions → Secrets → cargar `APP_URL` (y `THERAPIST_EMAIL` si aplica).
8. SQL Editor → correr `003_cron_send_reminders.sql` reemplazando la key y el project ref. No commitear el archivo editado.

### 2. Vercel

1. Crear proyecto y conectar el repositorio.
2. Settings → Environment Variables: `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`.
3. Deploy. El `vercel.json` ya trae los rewrites para que `/cancelar` y `/admin` no den 404 al refrescar.
4. Volver a Supabase y cargar el `APP_URL` definitivo con el dominio de Vercel.

### 3. La profesional, desde el panel

- Subir su foto
- Completar el wizard "Configurar Email" (sin esto no sale ningún mail)
- Cargar sus horarios

### Actualizaciones

- **Frontend:** push al repo → Vercel redeploya solo
- **Edge Functions:** hay que deployarlas a mano, no van con el push

---

## Personalizar por cliente

| Qué | Dónde |
|---|---|
| Título de la pestaña | `index.html` |
| Nombre en la navbar | `src/components/Layout.tsx` |
| Nombre y especialidad | `src/components/ProfileCard.tsx` |
| Colores | `src/index.css` → `--color-primary`, `--color-primary-hover` |
| Horas mínimas para cancelar | `src/components/CancelAppointment.tsx` → `CANCEL_HOURS_LIMIT` |
| Textos y asuntos de los emails | `supabase/functions/*/index.ts` |
| Nombre del remitente y del evento | `supabase/functions/*/index.ts` → `from:`, `SUMMARY:`, `ORGANIZER:` |
| Zona horaria | `supabase/functions/send-reminders/index.ts` y los `.ics` |

### Checklist

```
[ ] Proyecto Supabase creado
[ ] 001 y 002 ejecutados
[ ] Usuario admin creado
[ ] Signup público desactivado
[ ] 3 Edge Functions deployadas
[ ] Secret APP_URL cargado
[ ] 003 ejecutado (Vault + cron)
[ ] Proyecto Vercel con las 2 variables
[ ] APP_URL actualizado con el dominio final
[ ] Textos e identidad personalizados
[ ] Foto y Gmail cargados desde el panel
[ ] Prueba end-to-end: reserva, .ics, cancelación y recordatorios
```
