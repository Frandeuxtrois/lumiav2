// @ts-nocheck
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function buildCancelIcs(date: string, time: string, appointmentId: string, gmailUser: string): string {
  const [y, m, d] = date.split('-');
  const [h, min] = time.split(':');
  const dtStart = `${y}${m}${d}T${h}${min}00`;
  const endH = String(Number(h) + 1).padStart(2, '0');
  const dtEnd = `${y}${m}${d}T${endH}${min}00`;

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Samanta Vargas//Turnero//ES',
    'CALSCALE:GREGORIAN',
    'METHOD:CANCEL',
    'BEGIN:VEVENT',
    `UID:${appointmentId}@samantavargas`,
    `DTSTART;TZID=America/Argentina/Buenos_Aires:${dtStart}`,
    `DTEND;TZID=America/Argentina/Buenos_Aires:${dtEnd}`,
    'SUMMARY:Consulta psicológica — Samanta Vargas',
    'STATUS:CANCELLED',
    'SEQUENCE:1',
    `ORGANIZER;CN=Samanta Vargas:mailto:${gmailUser}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { name, email, date, time, appointmentId, cancelledBy } = await req.json();

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data: settingsRows } = await supabase
      .from('settings')
      .select('key, value')
      .in('key', ['gmail_user', 'gmail_app_password']);

    if (!settingsRows || settingsRows.length < 2) {
      return new Response(JSON.stringify({ error: 'Email no configurado.' }), { status: 500, headers: corsHeaders });
    }

    const settings = Object.fromEntries(settingsRows.map(r => [r.key, r.value]));
    const GMAIL_USER = settings['gmail_user'];
    const GMAIL_PASS = settings['gmail_app_password'];
    const THERAPIST_EMAIL = Deno.env.get('THERAPIST_EMAIL') ?? GMAIL_USER;

    const cancelIcs = buildCancelIcs(date, time, appointmentId, GMAIL_USER);
    const icsAttachment = {
      filename: 'cancelacion.ics',
      content: cancelIcs,
      contentType: 'text/calendar; method=CANCEL',
    };

    const nodemailer = await import('npm:nodemailer');
    const transporter = nodemailer.default.createTransport({
      service: 'gmail',
      auth: { user: GMAIL_USER, pass: GMAIL_PASS },
    });

    if (cancelledBy === 'patient') {
      // Paciente canceló → notificar a la terapeuta con .ics CANCEL
      await transporter.sendMail({
        from: `"Samanta Vargas" <${GMAIL_USER}>`,
        to: THERAPIST_EMAIL,
        subject: `Turno cancelado por el paciente: ${name} — ${date} ${time}`,
        html: `
          <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
            <h2 style="color: #1a1a1a;">Turno cancelado</h2>
            <p>El paciente canceló su turno.</p>
            <div style="background: #f9f9f9; border-radius: 8px; padding: 16px; margin: 24px 0;">
              <p style="margin: 0;"><strong>Paciente:</strong> ${name}</p>
              <p style="margin: 8px 0 0;"><strong>Email:</strong> ${email}</p>
              <p style="margin: 8px 0 0;"><strong>Fecha:</strong> ${date}</p>
              <p style="margin: 8px 0 0;"><strong>Hora:</strong> ${time}</p>
            </div>
            <p style="color: #666; font-size: 14px;">El horario quedó disponible nuevamente. El archivo adjunto elimina el evento de tu calendario.</p>
          </div>
        `,
        attachments: [icsAttachment],
      });
    } else {
      // Psicóloga canceló → notificar al paciente con .ics CANCEL + aviso a la terapeuta
      await Promise.all([
        transporter.sendMail({
          from: `"Samanta Vargas" <${GMAIL_USER}>`,
          to: email,
          subject: `Tu turno fue cancelado — ${date} ${time}`,
          html: `
            <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
              <h2 style="color: #1a1a1a;">Turno cancelado</h2>
              <p>Hola <strong>${name}</strong>, lamentablemente tu turno fue cancelado.</p>
              <div style="background: #f9f9f9; border-radius: 8px; padding: 16px; margin: 24px 0;">
                <p style="margin: 0;"><strong>Fecha:</strong> ${date}</p>
                <p style="margin: 8px 0 0;"><strong>Hora:</strong> ${time}</p>
              </div>
              <p style="color: #666; font-size: 14px;">El archivo adjunto elimina el evento de tu calendario automáticamente.</p>
              <p style="color: #666; font-size: 14px;">Podés reservar un nuevo turno cuando quieras.</p>
            </div>
          `,
          attachments: [icsAttachment],
        }),
        transporter.sendMail({
          from: `"Samanta Vargas" <${GMAIL_USER}>`,
          to: THERAPIST_EMAIL,
          subject: `Turno cancelado: ${name} — ${date} ${time}`,
          html: `
            <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
              <h2 style="color: #1a1a1a;">Turno cancelado</h2>
              <p>Cancelaste el turno de <strong>${name}</strong>. Se le notificó al paciente.</p>
              <div style="background: #f9f9f9; border-radius: 8px; padding: 16px; margin: 24px 0;">
                <p style="margin: 0;"><strong>Fecha:</strong> ${date}</p>
                <p style="margin: 8px 0 0;"><strong>Hora:</strong> ${time}</p>
              </div>
            </div>
          `,
          attachments: [icsAttachment],
        }),
      ]);
    }

    return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (err) {
    console.error('send-cancellation error:', String(err));
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: corsHeaders });
  }
});
