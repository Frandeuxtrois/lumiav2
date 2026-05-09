// @ts-nocheck
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Gmail credentials
    const { data: settingsRows } = await supabase
      .from('settings')
      .select('key, value')
      .in('key', ['gmail_user', 'gmail_app_password']);

    if (!settingsRows || settingsRows.length < 2) {
      return new Response(JSON.stringify({ error: 'Email no configurado.' }), { status: 500 });
    }

    const settings = Object.fromEntries(settingsRows.map(r => [r.key, r.value]));
    const GMAIL_USER = settings['gmail_user'];
    const GMAIL_PASS = settings['gmail_app_password'];
    const APP_URL = Deno.env.get('APP_URL') ?? 'https://samantavargas.vercel.app';

    const nodemailer = await import('npm:nodemailer');
    const transporter = nodemailer.default.createTransport({
      service: 'gmail',
      auth: { user: GMAIL_USER, pass: GMAIL_PASS },
    });

    // Fetch appointments that need 24h or 2h reminder
    const { data: appointments } = await supabase
      .from('appointments')
      .select('*')
      .eq('status', 'booked')
      .or('reminder_24h_sent.eq.false,reminder_2h_sent.eq.false');

    if (!appointments || appointments.length === 0) {
      return new Response(JSON.stringify({ ok: true, sent: 0 }), { status: 200 });
    }

    const now = new Date();
    let sent = 0;

    for (const apt of appointments) {
      const aptDateTime = new Date(`${apt.date}T${apt.time}-03:00`); // Argentina UTC-3
      const diffMs = aptDateTime.getTime() - now.getTime();
      const diffH = diffMs / (1000 * 60 * 60);

      const need24h = !apt.reminder_24h_sent && diffH > 23 && diffH <= 25;
      const need2h  = !apt.reminder_2h_sent  && diffH > 1  && diffH <= 3;

      if (!need24h && !need2h) continue;

      const hoursLabel = need24h ? '24 horas' : '2 horas';
      const cancelUrl = `${APP_URL}/cancelar?id=${apt.id}`;

      const html = `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
          <h2 style="color: #1a1a1a;">Recordatorio de turno</h2>
          <p>Hola <strong>${apt.name}</strong>, te recordamos que en <strong>${hoursLabel}</strong> tenés un turno con Samanta Vargas.</p>
          <div style="background: #f9f9f9; border-radius: 8px; padding: 16px; margin: 24px 0;">
            <p style="margin: 0;"><strong>Fecha:</strong> ${apt.date}</p>
            <p style="margin: 8px 0 0;"><strong>Hora:</strong> ${apt.time}</p>
          </div>
          <p style="color: #666; font-size: 14px;">
            Si necesitás cancelar, podés hacerlo hasta 48 horas antes desde el siguiente link:
          </p>
          <a href="${cancelUrl}" style="display: inline-block; background: #ef4444; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">
            Cancelar turno
          </a>
        </div>
      `;

      await transporter.sendMail({
        from: `"Samanta Vargas" <${GMAIL_USER}>`,
        to: apt.email,
        subject: `Recordatorio: tu turno es en ${hoursLabel}`,
        html,
      });

      // Mark reminder as sent
      const update = need24h
        ? { reminder_24h_sent: true }
        : { reminder_2h_sent: true };

      await supabase.from('appointments').update(update).eq('id', apt.id);
      sent++;
    }

    return new Response(JSON.stringify({ ok: true, sent }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});
