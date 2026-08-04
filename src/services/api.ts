import { supabase } from '../lib/supabase';
import { Appointment, AppointmentStatus } from '../types';

export interface EmailResult {
  ok: boolean;
  message?: string;
}

// Un UPDATE que no matchea ninguna fila no es un error para Postgres: devuelve
// `error: null`. Sin pedir las filas de vuelta, una reserva perdida se ve igual
// que una exitosa. Estos errores distinguen ese caso del fallo genérico.
export class SlotTakenError extends Error {
  constructor(message = 'Ese horario ya fue tomado.') {
    super(message);
    this.name = 'SlotTakenError';
  }
}

export class StaleWriteError extends Error {
  constructor(message = 'El turno ya no está en el estado esperado.') {
    super(message);
    this.name = 'StaleWriteError';
  }
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
  sendConfirmation(params: { to: string; name: string; date: string; time: string; appointmentId: string; phone?: string; notes?: string }): Promise<EmailResult> {
    return invokeEmail('send-confirmation', params);
  },

  sendCancellation(params: { name: string; email: string; date: string; time: string; appointmentId: string; cancelledBy: 'client' | 'owner' }): Promise<EmailResult> {
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

  async bookAppointment(id: string, clientData: { name: string; email: string; phone?: string; notes?: string }) {
    const { data, error } = await supabase
      .from('appointments')
      .update({ ...clientData, status: 'booked' })
      .eq('id', id)
      .eq('status', 'available')
      .select('id');

    if (error) throw error;
    if (!data || data.length !== 1) throw new SlotTakenError();
  },

  async updateAppointmentStatus(id: string, status: AppointmentStatus) {
    const { data, error } = await supabase
      .from('appointments')
      .update({ status })
      .eq('id', id)
      .select('id');

    if (error) throw error;
    if (!data || data.length !== 1) throw new StaleWriteError('No se pudo actualizar el turno: puede que ya no exista.');
  },

  async deleteAppointment(id: string) {
    const { data, error } = await supabase
      .from('appointments')
      .delete()
      .eq('id', id)
      .select('id');

    if (error) throw error;
    if (!data || data.length !== 1) throw new StaleWriteError('No se pudo eliminar el turno: puede que ya no exista.');
  },

  // Reprogramar: toma primero el horario nuevo y recien despues libera el viejo.
  // En ese orden, si el nuevo ya fue tomado por otro, el cliente conserva el que tenia.
  async rescheduleAppointment(oldId: string, newSlotId: string) {
    const { data: original, error: readError } = await supabase
      .from('appointments')
      .select('name, email, phone, notes')
      .eq('id', oldId)
      .eq('status', 'booked')
      .maybeSingle();

    if (readError) throw readError;
    if (!original) throw new StaleWriteError('El turno original ya no figura como reservado.');

    const { data: tomado, error: bookError } = await supabase
      .from('appointments')
      .update({ ...original, status: 'booked' })
      .eq('id', newSlotId)
      .eq('status', 'available')
      .select('id');

    if (bookError) throw bookError;
    if (!tomado || tomado.length !== 1) throw new SlotTakenError();

    const { error: freeError } = await supabase
      .from('appointments')
      .update({ status: 'available', name: null, email: null, phone: null, notes: null })
      .eq('id', oldId)
      .eq('status', 'booked');

    // Si esto fallara quedarian dos turnos a nombre del cliente. Es preferible a
    // perderle el turno, y queda visible en el panel para resolver a mano.
    if (freeError) {
      console.error('[reschedule] no se pudo liberar el turno original', freeError);
    }
  },

  async cancelBookedSlot(id: string) {
    const { data, error } = await supabase
      .from('appointments')
      .update({ status: 'available', name: null, email: null, phone: null, notes: null })
      .eq('id', id)
      .eq('status', 'booked')
      .select('id');

    if (error) throw error;
    if (!data || data.length !== 1) throw new StaleWriteError('El turno ya no figura como reservado.');
  },

  // Bloquear no borra los slots: los saca de circulacion y se pueden devolver.
  // Solo toca los libres — un turno ya reservado se cancela a mano y avisa al cliente.
  async blockDays(dates: string[]) {
    if (dates.length === 0) return 0;
    const { data, error } = await supabase
      .from('appointments')
      .update({ status: 'blocked' })
      .in('date', dates)
      .eq('status', 'available')
      .select('id');

    if (error) throw error;
    return data?.length ?? 0;
  },

  async unblockDays(dates: string[]) {
    if (dates.length === 0) return 0;
    const { data, error } = await supabase
      .from('appointments')
      .update({ status: 'available' })
      .in('date', dates)
      .eq('status', 'blocked')
      .select('id');

    if (error) throw error;
    return data?.length ?? 0;
  },

  // Igual que blockDays pero por rango continuo: evita mandar una lista de 200
  // fechas cuando el titular se toma dos meses.
  async blockRange(from: string, to: string) {
    const { data, error } = await supabase
      .from('appointments')
      .update({ status: 'blocked' })
      .gte('date', from)
      .lte('date', to)
      .eq('status', 'available')
      .select('id');

    if (error) throw error;
    return data?.length ?? 0;
  },

  async unblockRange(from: string, to: string) {
    const { data, error } = await supabase
      .from('appointments')
      .update({ status: 'available' })
      .gte('date', from)
      .lte('date', to)
      .eq('status', 'blocked')
      .select('id');

    if (error) throw error;
    return data?.length ?? 0;
  },

  async createSlot(slot: Partial<Appointment>) {
    const { data, error } = await supabase
      .from('appointments')
      .insert([{ ...slot, status: 'available' }])
      .select('id');

    if (error) {
      if (error.code === '23505') throw new Error('DUPLICATE');
      throw error;
    }
    if (!data || data.length !== 1) throw new StaleWriteError('El horario no se pudo crear.');
  },
};
