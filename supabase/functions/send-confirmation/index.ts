// @ts-nocheck
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function buildIcs(date: string, time: string, appointmentId: string, name: string, cancelUrl: string, gmailUser: string): string {
  // date: YYYY-MM-DD, time: HH:MM
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
    'METHOD:REQUEST',
    'BEGIN:VEVENT',
    `UID:${appointmentId}@samantavargas`,
    `DTSTART;TZID=America/Argentina/Buenos_Aires:${dtStart}`,
    `DTEND;TZID=America/Argentina/Buenos_Aires:${dtEnd}`,
    'SUMMARY:Consulta psicológica — Samanta Vargas',
    `DESCRIPTION:Turno confirmado.\\nPara cancelar: ${cancelUrl}`,
    `ORGANIZER;CN=Samanta Vargas:mailto:${gmailUser}`,
    `ATTENDEE;CN=${name}:mailto:unknown`,
    'STATUS:CONFIRMED',
    'SEQUENCE:0',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { to, name, date, time, appointmentId } = await req.json();

    if (!to || !name || !date || !time || !appointmentId) {
      return new Response(JSON.stringify({ error: 'Faltan campos requeridos' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data: settingsRows, error: settingsError } = await supabase
      .from('settings')
      .select('key, value')
      .in('key', ['gmail_user', 'gmail_app_password']);

    if (settingsError || !settingsRows || settingsRows.length < 2) {
      return new Response(JSON.stringify({ error: 'Email no configurado.' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const settings = Object.fromEntries(settingsRows.map(r => [r.key, r.value]));
    const GMAIL_USER = settings['gmail_user'];
    const GMAIL_PASS = settings['gmail_app_password'];
    const THERAPIST_EMAIL = Deno.env.get('THERAPIST_EMAIL') ?? GMAIL_USER;
    const APP_URL = Deno.env.get('APP_URL') ?? 'https://samantavargas.vercel.app';

    const cancelUrl = `${APP_URL}/cancelar?id=${appointmentId}`;
    const icsContent = buildIcs(date, time, appointmentId, name, cancelUrl, GMAIL_USER);

    const patientHtml = `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #1a1a1a;">¡Turno confirmado!</h2>
        <p>Hola <strong>${name}</strong>, tu turno fue reservado exitosamente.</p>
        <div style="background: #f9f9f9; border-radius: 8px; padding: 16px; margin: 24px 0;">
          <p style="margin: 0;"><strong>Fecha:</strong> ${date}</p>
          <p style="margin: 8px 0 0;"><strong>Hora:</strong> ${time}</p>
        </div>
        <p style="color: #666; font-size: 14px;">El archivo adjunto te permite agregar el turno a tu calendario con un clic.</p>
        <p style="color: #666; font-size: 14px;">
          Si necesitás cancelar, podés hacerlo hasta 48 horas antes desde el siguiente link:
        </p>
        <a href="${cancelUrl}" style="display: inline-block; background: #ef4444; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">
          Cancelar turno
        </a>
        <p style="color: #999; font-size: 12px; margin-top: 32px;">Si no realizaste esta reserva, ignorá este email.</p>
      </div>
    `;

    const therapistHtml = `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #1a1a1a;">Nueva reserva recibida</h2>
        <p>Un paciente acaba de reservar un turno.</p>
        <div style="background: #f9f9f9; border-radius: 8px; padding: 16px; margin: 24px 0;">
          <p style="margin: 0;"><strong>Paciente:</strong> ${name}</p>
          <p style="margin: 8px 0 0;"><strong>Email:</strong> ${to}</p>
          <p style="margin: 8px 0 0;"><strong>Fecha:</strong> ${date}</p>
          <p style="margin: 8px 0 0;"><strong>Hora:</strong> ${time}</p>
        </div>
      </div>
    `;

    const nodemailer = await import('npm:nodemailer');
    const transporter = nodemailer.default.createTransport({
      service: 'gmail',
      auth: { user: GMAIL_USER, pass: GMAIL_PASS },
    });

    const icsAttachment = {
      filename: 'turno.ics',
      content: icsContent,
      contentType: 'text/calendar; method=REQUEST',
    };

    await Promise.all([
      transporter.sendMail({
        from: `"Samanta Vargas" <${GMAIL_USER}>`,
        to,
        subject: `Confirmación de turno — ${date} ${time}`,
        html: patientHtml,
        attachments: [icsAttachment],
      }),
      transporter.sendMail({
        from: `"Samanta Vargas" <${GMAIL_USER}>`,
        to: THERAPIST_EMAIL,
        subject: `Nueva reserva: ${name} — ${date} ${time}`,
        html: therapistHtml,
        attachments: [icsAttachment],
      }),
    ]);

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('send-confirmation error:', String(err));
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
