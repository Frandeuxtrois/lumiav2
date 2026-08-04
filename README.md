# Turnos AWD

SPA de reservas online para profesionales y comercios independientes. El cliente elige fecha y horario, deja sus datos y recibe confirmación por email con archivo de calendario adjunto. Quien atiende gestiona todo desde un panel privado.

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
8. [Flujo del cliente](#flujo-del-cliente)
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
│   ├── App.tsx                   # Routing, sesion y flujo de reserva del cliente
│   ├── main.tsx                  # Entry point
│   ├── types.ts                  # Appointment, AppointmentStatus
│   ├── index.css                 # Design system AWD: tokens light/dark, utilidades
│   ├── lib/
│   │   ├── supabase.ts           # Cliente singleton + flag supabaseReady
│   │   ├── useTheme.ts           # Modo claro/oscuro (default dark, localStorage)
│   │   ├── useBusinessName.ts    # Lee settings.business_name con cache
│   │   ├── statusMeta.ts         # Label + icono + chip por estado
│   │   └── utils.ts              # formatTime(), formatDate(), cn()
│   ├── services/
│   │   └── api.ts                # appointmentService + emailService
│   └── components/
│       ├── Layout.tsx            # Navbar con reloj + footer
│       ├── Auth.tsx              # Login
│       ├── Calendar.tsx          # Calendario mensual
│       ├── SlotSelector.tsx      # Grid de horarios
│       ├── BookingForm.tsx       # Datos del cliente
│       ├── CancelAppointment.tsx # Cancelación por link (/cancelar?id=)
│       ├── ProfileCard.tsx       # Tarjeta de presentación
│       ├── AdminDashboard.tsx    # Panel: vistas día, semana y mes
│       ├── WeekView.tsx          # Vista semanal del panel
│       ├── MonthView.tsx         # Vista mes + selección de días y semanas
│       ├── BlockRangeModal.tsx   # Bloqueo por período desde/hasta
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
│       ├── 003_cron_send_reminders.sql
│       ├── 004_anon_read_business_name.sql
│       ├── 005_blocked_status.sql
│       ├── 006_clientes_y_reservas.sql
│       └── 007_trigger_registro_reservas.sql
├── .env                          # Local, ignorado por git
├── vercel.json                   # Rewrites SPA
└── vite.config.ts
```

### Componentes

**`Calendar.tsx`** — Calendario mensual navegable. Desactiva fechas pasadas y días sin cupo. `date-fns` con locale español.

**`SlotSelector.tsx`** — Horarios de la fecha elegida. Los ocupados se muestran deshabilitados.

**`CancelAppointment.tsx`** — Página del link del email. Ofrece **reprogramar** o **cancelar**, ambas sujetas al límite de horas (`CANCEL_HOURS_LIMIT`, default 48). Al cancelar devuelve el slot a `available` y borra los datos del cliente. Al reprogramar toma primero el horario nuevo y recién después libera el viejo, para que una carrera con otro cliente no lo deje sin turno.

**`WeekView.tsx`** — Los 7 días de la semana. Incluye "Bloquear semana" / "Abrir semana" para cerrar de una los siete días visibles (vacaciones, cierre por reforma).

**`MonthView.tsx`** — Mes completo con el resumen de cada día. La grilla arranca el lunes de la primera semana y termina el domingo de la última, así cada fila es una semana real: el botón vertical de la izquierda selecciona esa semana entera, incluidos los días que caen en el mes vecino. Además: clic para un día, shift+clic para un rango, doble clic para abrir ese día. Nunca toca turnos ya reservados: esos se cancelan a mano para que el cliente reciba el aviso.

**`AdminDashboard.tsx`** — Vistas día, semana y mes. Marcar completado, eliminar, y accesos a los modales de configuración.

**`BlockRangeModal.tsx`** — Bloqueo por período arbitrario (desde/hasta), disponible desde cualquier vista. Trae atajos para día, semana, mes actual y mes siguiente, pero el rango se edita a mano: unas vacaciones rara vez empiezan un lunes y terminan un domingo. El resumen previo se calcula sobre los `appointments` ya cargados en el panel, sin pegarle de nuevo a la base. Usa `blockRange`/`unblockRange` (`gte`/`lte`) en vez de mandar una lista de fechas.

**`CreateSlotsModal.tsx`** — Tres modos:
- **Individual:** una fecha y una hora
- **Rango:** una fecha, horario desde/hasta y duración (30/45/60/90 min), con preview
- **Período:** días de la semana + rango de fechas + horario + duración, en bloque

**`GmailSetup.tsx`** — Wizard de 5 pasos para obtener una Contraseña de Aplicación de Google y guardarla en `settings`.

**`Manual.tsx`** — Manual de uso para el titular, accesible desde el panel. Cubre las tres vistas, el bloqueo de días, los estados, reprogramación y cancelación, recordatorios, comentarios del cliente, historial, Gmail, foto, contraseña y modo claro/oscuro. Los chips de estado salen de `statusMeta.ts`, así que no se desincronizan del panel. Si se agrega una función al panel, actualizarlo acá también.

---

## Base de datos

### `appointments`

Cada fila es un slot horario. Los datos del cliente viven en la misma fila y quedan en `null` cuando el slot está libre.

| Campo | Tipo | Notas |
|---|---|---|
| `id` | UUID | PK |
| `date` | DATE | `YYYY-MM-DD` |
| `time` | TIME | `HH:MM` |
| `status` | TEXT | `available` / `booked` / `completed` / `cancelled` / `blocked` |
| `name`, `email`, `phone`, `notes` | TEXT | Datos del cliente, null si libre |
| `reminder_24h_sent` | BOOLEAN | Evita reenviar el recordatorio de 24h |
| `reminder_2h_sent` | BOOLEAN | Ídem para el de 2h |
| `created_at` | TIMESTAMPTZ | Auto |

**`unique_slot UNIQUE (date, time)`** — impide dos turnos en el mismo momento. `api.ts` detecta el error `23505` para avisar de duplicados al crear horarios en bloque.

### `settings`

Configuración key/value que se edita desde el panel.

| key | Contenido |
|---|---|
| `gmail_user` | Email de Gmail |
| `gmail_app_password` | Contraseña de aplicación de 16 caracteres |
| `profile_photo` | URL pública de la foto |
| `business_name` | Nombre del negocio. Alimenta header, pestaña, mails y `.ics`. Si falta, se usa "Turnos" |

### `clientes` y `reservas`

`appointments` es la grilla de horarios: la fila se recicla cuando el turno se libera. Por eso el cliente y su historial viven aparte — si no, cancelar borraba todo rastro de que esa persona había existido.

**`clientes`** — una fila por persona, agrupada por `email` (`clientes_email_unico`). Si el mismo email vuelve a reservar, se actualizan nombre y teléfono en vez de duplicar.

| Campo | Tipo | Notas |
|---|---|---|
| `id` | UUID | PK |
| `nombre`, `email` | TEXT | `email` único, se guarda en minúsculas y sin espacios |
| `telefono`, `notas` | TEXT | Opcionales. `notas` es para el titular, no lo escribe el cliente |
| `created_at`, `updated_at` | TIMESTAMPTZ | |

**`reservas`** — una fila por visita. `appointment_id` es `on delete set null`: si el slot se borra, la visita sigue en el historial.

| Campo | Tipo | Notas |
|---|---|---|
| `cliente_id` | UUID | FK → clientes, `on delete cascade` |
| `appointment_id` | UUID | FK → appointments, `on delete set null` |
| `fecha`, `hora` | DATE / TIME | Copiados del slot, sobreviven a su borrado |
| `comentario` | TEXT | Lo que escribió el cliente al reservar |
| `estado` | TEXT | `confirmada` / `cancelada_cliente` / `cancelada_negocio` / `completada` / `ausente` |

### Triggers de historial

`007` engancha un trigger `security definer` sobre `appointments` que mantiene las dos tablas sin que el front tenga que saber nada:

| Cambio en `appointments` | Efecto |
|---|---|
| pasa a `booked` | Alta o actualización del cliente (upsert por email) + nueva `reserva` en `confirmada` |
| `booked` → `available` | La reserva pasa a `cancelada_cliente` |
| pasa a `completed` | La reserva pasa a `completada` |

Anon no tiene ningún permiso sobre estas tablas: escribe el trigger, no el navegador. Solo el titular logueado las lee.

> Los datos ya se acumulan desde la primera reserva, pero **todavía no hay pantalla en el panel** para ver la ficha de un cliente y su historial. Es lo que queda pendiente.

### RLS

El calendario público necesita ver los turnos ocupados para marcar los días llenos, por eso anon lee tanto `available` como `booked` — pero nunca los datos personales de otro cliente más allá de lo que expone la fila.

| Tabla | Policy | Rol | Operación |
|---|---|---|---|
| appointments | `anon_read_slots` | anon | SELECT `status in ('available','booked')` |
| appointments | `anon_book_slot` | anon | UPDATE `available` → `booked` |
| appointments | `anon_cancel_slot` | anon | UPDATE `booked` → `available` |
| appointments | `authenticated_full_access_appointments` | authenticated | ALL |
| settings | `anon_read_public_settings` | anon | SELECT solo `key in ('profile_photo','business_name')` |
| settings | `authenticated_full_access_settings` | authenticated | ALL |
| storage.objects | `anon_read_profile_objects` | anon | SELECT bucket `profile` |
| storage.objects | `authenticated_manage_profile_photo` | authenticated | ALL bucket `profile` |
| clientes | `authenticated_full_access_clientes` | authenticated | ALL (anon revocado) |
| reservas | `authenticated_full_access_reservas` | authenticated | ALL (anon revocado) |

Todo esto está en `001`, `002` y `004`. El estado `blocked` lo agrega `005`; `clientes` y `reservas` con sus policies, `006`. No editar a mano desde el dashboard: si cambia, actualizar la migración.

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
| `OWNER_EMAIL` | send-confirmation, send-cancellation | No. Si falta usa el `gmail_user` de `settings` |

`SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` los inyecta Supabase automáticamente.

> La service_role key no va en ningún archivo del repo. Para el cron se guarda en Supabase Vault.

---

## Edge Functions

Las tres leen las credenciales de Gmail desde `settings` usando la service_role key, por lo que saltean RLS. Si `settings` no tiene `gmail_user` y `gmail_app_password`, devuelven **500** y no se envía nada. El front muestra ese fallo en pantalla, pero **la reserva se guarda igual**: el email es best-effort.

| Función | Se dispara | Envía |
|---|---|---|
| `send-confirmation` | Al confirmar una reserva | Email al cliente (link de cancelar + botón de Google Calendar + `.ics`) y aviso al titular |
| `send-cancellation` | Al cancelar, desde el link o desde el panel | Notifica a la contraparte con un `.ics` `METHOD:CANCEL` que borra el evento del calendario |
| `send-reminders` | Cron cada 30 min | Recordatorio a los turnos que caen en la ventana de 24h o 2h, y marca el flag para no repetir |

> **Falta:** reprogramar no dispara ningún email. El cambio queda hecho en la base y visible en el panel, pero ni el cliente ni el titular reciben confirmación del horario nuevo, y el `.ics` viejo sigue en el calendario del cliente. Requiere una función nueva o extender `send-confirmation` con un modo "reprogramado".

Los `.ics` usan `UID:<appointmentId>@turnosawd`. El UID debe coincidir entre confirmación y cancelación, si no el evento no se borra del calendario del cliente.

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

## Flujo del cliente

```
/ (home)
├── Tarjeta de presentación (foto, nombre)
├── Elige fecha → horario → completa sus datos
└── Confirma
    ├── Slot pasa a "booked"
    ├── El trigger registra al cliente y la reserva en su historial
    ├── Email al cliente con .ics y link de cancelación
    └── Aviso al titular (con teléfono y comentario)
        └── Si el email falla, la reserva igual queda hecha y se avisa en pantalla

/cancelar?id=xxx
├── Valida que falten más de 48 hs (si no, corta y le pide contactar al titular)
├── Reprogramar → elige otra fecha y horario libre
│   ├── Toma primero el nuevo, después libera el viejo
│   ├── Si perdió la carrera: conserva el original y elige otro
│   └── No dispara ningún email (pendiente)
└── Cancelar → slot vuelve a "available", se limpian los datos del slot,
    se notifica al titular y la reserva queda "cancelada_cliente"
```

## Flujo del administrador

```
/login → /admin

/admin
├── Vista día, semana o mes
├── "Bloquear período" → desde/hasta arbitrario, con atajos día/semana/mes
├── Bloquear o abrir la semana completa (vista semana)
├── Bloquear o abrir por selección: botón "Semana" por fila, clic por día,
│   shift+clic para rango, doble clic para abrir ese día (vista mes)
├── Marcar completado / eliminar (si estaba reservado, notifica al cliente)
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
2. SQL Editor → correr las migraciones en orden: `001`, `002`, `004`, `005`, `006`, `007`. (`003` va al final, ver punto 8.)
3. SQL Editor → cargar `business_name` en `settings` con el nombre del negocio.
4. Authentication → Users → Add user: crear la cuenta del titular con su contraseña.
5. **Authentication → Providers → Email → desactivar "Enable email signup".** Sin esto cualquiera puede registrarse y entrar al panel, porque el panel solo verifica que haya sesión iniciada.
6. Edge Functions → deployar `send-confirmation`, `send-cancellation` y `send-reminders` con `verify_jwt` activado.
7. Edge Functions → Secrets → cargar `APP_URL` (y `OWNER_EMAIL` si aplica).
8. SQL Editor → correr `003_cron_send_reminders.sql` reemplazando la key y el project ref. No commitear el archivo editado.

### 2. Vercel

1. Crear proyecto y conectar el repositorio.
2. Settings → Environment Variables: `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`.
3. Deploy. El `vercel.json` ya trae los rewrites para que `/cancelar` y `/admin` no den 404 al refrescar.
4. Volver a Supabase y cargar el `APP_URL` definitivo con el dominio de Vercel.

### 3. El titular, desde el panel

- Subir su foto
- Completar el wizard "Configurar Email" (sin esto no sale ningún mail)
- Cargar sus horarios

### Actualizaciones

- **Frontend:** push al repo → Vercel redeploya solo
- **Edge Functions:** hay que deployarlas a mano, no van con el push

---

## Personalizar por cliente

Lo que cambia por cliente **no se toca en el código**: el nombre del negocio sale de `settings.business_name` y alimenta la navbar, el título de la pestaña, la tarjeta de presentación, los emails y los `.ics`. Se edita desde el panel.

Lo que sí vive en el código:

| Qué | Dónde |
|---|---|
| Colores y tipografías | `src/index.css` → tokens de `:root` y `body.dark-mode` |
| Horas mínimas para cancelar o reprogramar | `src/components/CancelAppointment.tsx` → `CANCEL_HOURS_LIMIT` |
| Textos y asuntos de los emails | `supabase/functions/*/index.ts` |
| Nombre del remitente y del evento | `supabase/functions/*/index.ts` → `from:`, `SUMMARY:`, `ORGANIZER:` |
| Zona horaria | `supabase/functions/send-reminders/index.ts` y los `.ics` |

### Checklist

```
[ ] Proyecto Supabase creado
[ ] Migraciones 001, 002, 004, 005, 006 y 007 ejecutadas
[ ] business_name cargado en settings
[ ] Usuario admin creado
[ ] Signup público desactivado
[ ] 3 Edge Functions deployadas
[ ] Secret APP_URL cargado
[ ] 003 ejecutado (Vault + cron)
[ ] Proyecto Vercel con las 2 variables
[ ] APP_URL actualizado con el dominio final (sin barra al final)
[ ] Foto y Gmail cargados desde el panel
[ ] Prueba end-to-end: reserva, .ics, reprogramación, cancelación y recordatorios
[ ] Doble reserva probada con dos navegadores en el mismo horario
```
