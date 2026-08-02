import { supabase } from '../lib/supabase';
import { Appointment, AppointmentStatus } from '../types';

export interface EmailResult {
  ok: boolean;
  message?: string;
}

// functions.invoke no lanza en HTTP 500: devuelve el fallo en `error`, por eso
// un try/catch acá no atrapa nada y los emails caídos pasaban desapercibidos.
const invokeEmail = async (fn: string, body: Record<string, unknown>): Promise<EmailResult> => {
  const { error } = await supabase.functions.invoke(fn, { body });
  if (!error) return { ok: true };

  let detail = error.message;
  const context = (error as { context?: { json?: () => Promise<{ error?: string }> } }).context;
  if (context?.json) {
    try {
      const payload = await context.json();
      if (payload?.error) detail = payload.error;
    } catch {
      // el cuerpo no era JSON; nos quedamos con error.message
    }
  }

  console.error(`[email] ${fn} falló: ${detail}`);
  return { ok: false, message: detail };
};

export const emailService = {
  sendConfirmation(params: { to: string; name: string; date: string; time: string; appointmentId: string }): Promise<EmailResult> {
    return invokeEmail('send-confirmation', params);
  },

  sendCancellation(params: { name: string; email: string; date: string; time: string; appointmentId: string; cancelledBy: 'patient' | 'therapist' }): Promise<EmailResult> {
    return invokeEmail('send-cancellation', params);
  },
};

export const appointmentService = {
  async getAvailableSlots(date: string) {
    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .eq('date', date)
      .in('status', ['available', 'booked'])
      .order('time', { ascending: true });

    if (error) throw error;
    return data as Appointment[];
  },

  async getAllAppointments(startDate?: string, endDate?: string) {
    let query = supabase
      .from('appointments')
      .select('*')
      .order('date', { ascending: true })
      .order('time', { ascending: true });

    if (startDate) query = query.gte('date', startDate);
    if (endDate) query = query.lte('date', endDate);

    const { data, error } = await query;
    if (error) throw error;
    return data as Appointment[];
  },

  async bookAppointment(id: string, patientData: { name: string; email: string; phone?: string; notes?: string }) {
    const { error } = await supabase
      .from('appointments')
      .update({ ...patientData, status: 'booked' })
      .eq('id', id)
      .eq('status', 'available');

    if (error) throw error;
  },

  async updateAppointmentStatus(id: string, status: AppointmentStatus) {
    const { error } = await supabase
      .from('appointments')
      .update({ status })
      .eq('id', id);

    if (error) throw error;
  },

  async deleteAppointment(id: string) {
    const { error } = await supabase
      .from('appointments')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async createSlot(slot: Partial<Appointment>) {
    const { error } = await supabase
      .from('appointments')
      .insert([{ ...slot, status: 'available' }]);

    if (error) {
      if (error.code === '23505') throw new Error('DUPLICATE');
      throw error;
    }
  },
};
