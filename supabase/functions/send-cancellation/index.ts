// @ts-nocheck
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { name, email, date, time } = await req.json();

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

    const nodemailer = await import('npm:nodemailer');
    const transporter = nodemailer.default.createTransport({
      service: 'gmail',
      auth: { user: GMAIL_USER, pass: GMAIL_PASS },
    });

    await Promise.all([
      // Aviso a la terapeuta
      transporter.sendMail({
        from: `"Samanta Vargas" <${GMAIL_USER}>`,
        to: THERAPIST_EMAIL,
        subject: `Turno cancelado: ${name} — ${date} ${time}`,
        html: `
          <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
            <h2 style="color: #1a1a1a;">Turno cancelado</h2>
            <p>Un paciente canceló su turno.</p>
            <div style="background: #f9f9f9; border-radius: 8px; padding: 16px; margin: 24px 0;">
              <p style="margin: 0;"><strong>Paciente:</strong> ${name}</p>
              <p style="margin: 8px 0 0;"><strong>Email:</strong> ${email}</p>
              <p style="margin: 8px 0 0;"><strong>Fecha:</strong> ${date}</p>
              <p style="margin: 8px 0 0;"><strong>Hora:</strong> ${time}</p>
            </div>
            <p style="color: #666; font-size: 14px;">El horario quedó disponible nuevamente.</p>
          </div>
        `,
      }),
      // Confirmación al paciente
      transporter.sendMail({
        from: `"Samanta Vargas" <${GMAIL_USER}>`,
        to: email,
        subject: `Tu turno fue cancelado — ${date} ${time}`,
        html: `
          <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
            <h2 style="color: #1a1a1a;">Turno cancelado</h2>
            <p>Hola <strong>${name}</strong>, tu turno fue cancelado exitosamente.</p>
            <div style="background: #f9f9f9; border-radius: 8px; padding: 16px; margin: 24px 0;">
              <p style="margin: 0;"><strong>Fecha:</strong> ${date}</p>
              <p style="margin: 8px 0 0;"><strong>Hora:</strong> ${time}</p>
            </div>
            <p style="color: #666; font-size: 14px;">Si querés reservar otro turno, podés hacerlo desde la página de turnos.</p>
          </div>
        `,
      }),
    ]);

    return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (err) {
    console.error('send-cancellation error:', String(err));
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: corsHeaders });
  }
});
