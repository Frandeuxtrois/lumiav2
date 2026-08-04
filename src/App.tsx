import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { User } from '@supabase/supabase-js';
import { supabase, supabaseReady } from './lib/supabase';
import { Layout } from './components/Layout';
import { Calendar } from './components/Calendar';
import { SlotSelector } from './components/SlotSelector';
import { BookingForm, BookingFormData } from './components/BookingForm';
import { Auth } from './components/Auth';
import { AdminDashboard } from './components/AdminDashboard';
import { appointmentService, emailService, SlotTakenError } from './services/api';
import { Appointment } from './types';
import { format } from 'date-fns';
import { CheckCircle2, Info, AlertTriangle } from 'lucide-react';
import { CancelAppointment } from './components/CancelAppointment';
import { ProfileCard } from './components/ProfileCard';
import { motion, AnimatePresence } from 'motion/react';

const ClientBooking: React.FC = () => {
  const [selectedDate, setSelectedDate] = React.useState(new Date());
  const [availableSlots, setAvailableSlots] = React.useState<Appointment[]>([]);
  const [selectedSlotId, setSelectedSlotId] = React.useState<string | null>(null);
  const [loadingSlots, setLoadingSlots] = React.useState(true);
  const [step, setStep] = React.useState(1);
  const [bookingLoading, setBookingLoading] = React.useState(false);
  const [calendarRefresh, setCalendarRefresh] = React.useState(0);
  const [bookedSlot, setBookedSlot] = React.useState<{ date: string; time: string; name: string } | null>(null);
  const [emailWarning, setEmailWarning] = React.useState<string | null>(null);
  const [bookingError, setBookingError] = React.useState<string | null>(null);

  const fetchSlots = React.useCallback(async () => {
    setLoadingSlots(true);
    try {
      const slots = await appointmentService.getAvailableSlots(format(selectedDate, 'yyyy-MM-dd'));
      setAvailableSlots(slots);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingSlots(false);
    }
  }, [selectedDate]);

  React.useEffect(() => { fetchSlots(); }, [fetchSlots]);

  const handleBook = async (data: BookingFormData) => {
    if (!selectedSlotId) return;
    setBookingLoading(true);
    setBookingError(null);
    try {
      const slot = availableSlots.find(s => s.id === selectedSlotId)!;
      await appointmentService.bookAppointment(selectedSlotId, data);
      const email = await emailService.sendConfirmation({
        to: data.email,
        name: data.name,
        date: slot.date,
        time: slot.time,
        appointmentId: selectedSlotId,
        phone: data.phone,
        notes: data.notes,
      });
      setEmailWarning(email.ok ? null : (email.message ?? 'No pudimos enviar el email de confirmación.'));
      setBookedSlot({ date: slot.date, time: slot.time, name: data.name });
      setStep(3);
      setCalendarRefresh(r => r + 1);
    } catch (err) {
      if (err instanceof SlotTakenError) {
        setBookingError('Ese horario acaba de ser tomado por otra persona. Elegí otro de la lista.');
        setSelectedSlotId(null);
        setStep(1);
        setCalendarRefresh(r => r + 1);
        await fetchSlots();
      } else {
        setBookingError(err instanceof Error ? err.message : 'No pudimos completar la reserva. Intentá de nuevo.');
      }
    } finally {
      setBookingLoading(false);
    }
  };

  if (step === 3) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md mx-auto text-center bg-surface p-8 rounded-awd border border-line shadow-sm"
      >
        <div className="w-16 h-16 bg-accent/10 text-accent rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 size={32} />
        </div>
        <h2 className="text-2xl font-bold mb-2">¡Reserva Exitosa!</h2>
        {emailWarning ? (
          <div className="flex items-start gap-3 text-left bg-warning/10 border border-warning/30 rounded-awd p-4 mb-6">
            <AlertTriangle size={20} className="text-warning shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-ink">Tu turno quedó reservado, pero no pudimos enviarte el email.</p>
              <p className="text-xs text-muted mt-1">Anotá la fecha y hora de abajo. Detalle técnico: {emailWarning}</p>
            </div>
          </div>
        ) : (
          <p className="text-muted mb-6">Te enviamos los detalles a tu email junto con el archivo para agregar el turno a tu calendario.</p>
        )}
        {bookedSlot && (
          <div className="bg-elevated rounded-awd p-4 mb-6 text-left space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted">Cliente</span>
              <span className="font-medium text-ink">{bookedSlot.name}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted">Fecha</span>
              <span className="font-medium text-ink capitalize">
                {new Date(bookedSlot.date + 'T12:00:00').toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted">Hora</span>
              <span className="font-medium text-ink">{bookedSlot.time.slice(0, 5)}</span>
            </div>
          </div>
        )}
        <button
          onClick={() => { setStep(1); setSelectedSlotId(null); setBookedSlot(null); setEmailWarning(null); fetchSlots(); }}
          className="w-full py-3 bg-primary text-on-accent rounded-awd font-medium hover:bg-primary-hover transition-colors"
        >
          Volver al Inicio
        </button>
      </motion.div>
    );
  }

  return (
    <div>
    <ProfileCard />
    {bookingError && (
      <div className="flex items-start gap-3 bg-warning/10 border border-warning/30 rounded-awd p-4 mb-6">
        <AlertTriangle size={20} className="text-warning shrink-0 mt-0.5" />
        <p className="text-sm font-medium text-ink">{bookingError}</p>
      </div>
    )}
    <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
      <div className="md:col-span-5 flex flex-col gap-6">
        <div className="bg-surface rounded-awd shadow-sm border border-line p-6">
          <h2 className="text-lg font-semibold mb-1">Paso 1: Fecha y Hora</h2>
          <p className="text-xs text-muted mb-6">Selecciona el momento ideal para tu turno.</p>
          
          <Calendar
            selectedDate={selectedDate}
            onDateSelect={(date) => { setSelectedDate(date); setSelectedSlotId(null); setBookingError(null); }}
            refreshTrigger={calendarRefresh}
          />

          <div className="mt-8">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted mb-3">Horarios Disponibles</p>
            <SlotSelector 
              slots={availableSlots} 
              selectedSlotId={selectedSlotId} 
              onSlotSelect={setSelectedSlotId}
              loading={loadingSlots}
            />
          </div>

          <button 
            disabled={!selectedSlotId}
            onClick={() => setStep(2)}
            className="w-full bg-primary text-on-accent font-medium py-3 rounded-awd shadow-lg shadow-awd hover:bg-primary-hover disabled:bg-line disabled:shadow-none transition-all mt-8"
          >
            Continuar Reserva
          </button>
        </div>
      </div>

      <div className="md:col-span-7">
        <AnimatePresence mode="wait">
          {step === 1 ? (
            <motion.div 
              key="info"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="bg-surface rounded-awd shadow-sm border border-line p-8 text-center"
            >
              <div className="w-12 h-12 bg-elevated text-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Info size={24} />
              </div>
              <h3 className="font-semibold text-ink">Selecciona un horario para continuar</h3>
              <p className="text-sm text-muted mt-2">Una vez elegido el horario, habilitaremos el formulario de contacto.</p>
            </motion.div>
          ) : (
            <motion.div 
              key="form"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-surface rounded-awd shadow-sm border border-line p-8"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-semibold">Paso 2: Tus Datos</h2>
                  <p className="text-xs text-muted mt-1">Completa la información para finalizar.</p>
                </div>
                <button onClick={() => setStep(1)} className="text-xs text-primary font-bold uppercase underline">Cambiar fecha</button>
              </div>
              <BookingForm onSubmit={handleBook} loading={bookingLoading} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
    </div>
  );
};

export default function App() {
  const [user, setUser] = React.useState<User | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!supabaseReady) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) return null;

  return (
    <BrowserRouter>
      <Layout user={user}>
        <Routes>
          <Route path="/" element={<ClientBooking />} />
          <Route path="/login" element={user ? <Navigate to="/admin" /> : <Auth />} />
          <Route path="/admin" element={(user || !supabaseReady) ? <AdminDashboard /> : <Navigate to="/login" />} />
          <Route path="/cancelar" element={<CancelAppointment />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
