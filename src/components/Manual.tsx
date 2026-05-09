import React from 'react';
import { X, CalendarDays, Mail, Lock, Image, Clock, CheckCircle2, Trash2, CalendarRange, HelpCircle, Users, XCircle, Bell } from 'lucide-react';

interface Props {
  onClose: () => void;
}

const Section: React.FC<{ icon: React.ReactNode; title: string; children: React.ReactNode }> = ({ icon, title, children }) => (
  <div className="border border-border-gray rounded-2xl overflow-hidden">
    <div className="flex items-center gap-3 bg-slate-50 px-5 py-4 border-b border-border-gray">
      <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
        {icon}
      </div>
      <h3 className="font-bold text-slate-800">{title}</h3>
    </div>
    <div className="px-5 py-4 space-y-2 text-sm text-slate-600">
      {children}
    </div>
  </div>
);

const Step: React.FC<{ n: number; text: string }> = ({ n, text }) => (
  <div className="flex items-start gap-3">
    <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{n}</span>
    <span>{text}</span>
  </div>
);

const Tag: React.FC<{ color: string; label: string; desc: string }> = ({ color, label, desc }) => (
  <div className="flex items-center gap-3">
    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${color}`}>{label}</span>
    <span className="text-slate-500">{desc}</span>
  </div>
);

export const Manual: React.FC<Props> = ({ onClose }) => (
  <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-border-gray shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <HelpCircle size={20} />
          </div>
          <div>
            <h2 className="text-lg font-bold">Manual de uso</h2>
            <p className="text-xs text-slate-400">Guía completa del sistema de turnos</p>
          </div>
        </div>
        <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
          <X size={18} />
        </button>
      </div>

      {/* Content */}
      <div className="overflow-y-auto p-6 space-y-4">

        <Section icon={<Users size={16} />} title="Experiencia del paciente">
          <p className="text-slate-500">Lo que ve y recibe un paciente al reservar un turno:</p>
          <div className="bg-slate-50 rounded-xl p-3 space-y-1.5 mt-1">
            <p>📅 Ve un <strong>calendario</strong> con los días en verde (con turnos disponibles) y en rojo (sin disponibilidad).</p>
            <p>🕐 Elige un <strong>horario</strong> del día seleccionado. Los turnos ya tomados aparecen tachados y no son seleccionables.</p>
            <p>📝 Completa sus <strong>datos</strong>: nombre, email, teléfono y notas opcionales.</p>
            <p>✅ Confirma y ve una <strong>pantalla de éxito</strong> con los detalles del turno.</p>
            <p>📧 Recibe un <strong>email de confirmación</strong> con botón para agregar a Google Calendar y archivo .ics para Apple/Outlook.</p>
          </div>
        </Section>

        <Section icon={<CalendarDays size={16} />} title="Crear horarios disponibles">
          <p className="text-slate-500 mb-3">Hacé clic en <strong>"Nuevo Horario"</strong>. Tenés tres modos:</p>
          <div className="space-y-2">
            <div className="bg-slate-50 rounded-xl p-3">
              <p className="font-semibold mb-1">Individual</p>
              <p className="text-slate-500">Una fecha y una hora. Crea un solo turno.</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-3">
              <p className="font-semibold mb-1">Rango</p>
              <p className="text-slate-500">Una fecha con horario desde/hasta y duración de sesión (30/45/60/90 min). Genera todos los turnos del día automáticamente con preview antes de confirmar.</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-3">
              <p className="font-semibold mb-1">Período</p>
              <p className="text-slate-500">Días de la semana + rango de fechas + horario. Ideal para cargar semanas enteras. Muestra el total de turnos a crear antes de confirmar.</p>
            </div>
          </div>
          <p className="text-slate-400 text-xs mt-2">No se pueden crear dos turnos en la misma fecha y hora. Los duplicados se omiten automáticamente.</p>
        </Section>

        <Section icon={<CalendarRange size={16} />} title="Vistas del panel">
          <div className="space-y-2">
            <div className="bg-slate-50 rounded-xl p-3">
              <p className="font-semibold mb-1">Vista Día</p>
              <p className="text-slate-500">Todos los turnos de una fecha en tabla. Usá el selector de fecha para navegar día a día.</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-3">
              <p className="font-semibold mb-1">Vista Semana</p>
              <p className="text-slate-500">Los 7 días de la semana en una grilla. Navegá entre semanas con las flechas. Ideal para tener una visión general de la agenda.</p>
            </div>
          </div>
        </Section>

        <Section icon={<CheckCircle2 size={16} />} title="Estados de los turnos">
          <div className="space-y-2">
            <Tag color="bg-green-50 text-green-600" label="Disponible" desc="El horario está libre y puede ser reservado." />
            <Tag color="bg-blue-50 text-blue-600" label="Reservado" desc="Un paciente tomó el turno." />
            <Tag color="bg-slate-100 text-slate-400" label="Completado" desc="La sesión se realizó. Lo marcás vos para llevar registro." />
            <Tag color="bg-red-50 text-red-500" label="Cancelado" desc="Cancelado por el paciente o por vos." />
          </div>
          <div className="mt-3 space-y-1.5">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Acciones:</p>
            <div className="flex items-center gap-2"><CheckCircle2 size={14} className="text-green-500 shrink-0" /><span>Marcar como completado (solo turnos reservados)</span></div>
            <div className="flex items-center gap-2"><Trash2 size={14} className="text-red-400 shrink-0" /><span>Eliminar turno. Si está reservado, el paciente recibe email automáticamente.</span></div>
          </div>
        </Section>

        <Section icon={<XCircle size={16} />} title="Cancelación de turnos">
          <div className="space-y-3">
            <div className="bg-slate-50 rounded-xl p-3">
              <p className="font-semibold mb-1">El paciente cancela</p>
              <p className="text-slate-500">Desde el link de cancelación que viene en el email de confirmación. Solo puede cancelar con más de 48 horas de anticipación. Vos recibís un email avisándote con el .ics para eliminar el evento de tu calendario.</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-3">
              <p className="font-semibold mb-1">Vos cancelás desde el panel</p>
              <p className="text-slate-500">Eliminás el turno reservado desde la tabla. El sistema le envía automáticamente un email al paciente notificándole la cancelación con el .ics para que pueda eliminar el evento de su calendario.</p>
            </div>
          </div>
        </Section>

        <Section icon={<Bell size={16} />} title="Recordatorios automáticos">
          <p className="text-slate-500">El sistema envía recordatorios automáticos a los pacientes con turno reservado:</p>
          <div className="space-y-2 mt-2">
            <div className="flex items-center gap-3 bg-slate-50 rounded-xl p-3">
              <span className="text-lg">⏰</span>
              <div><p className="font-semibold">24 horas antes</p><p className="text-slate-500">Email con recordatorio y link de cancelación.</p></div>
            </div>
            <div className="flex items-center gap-3 bg-slate-50 rounded-xl p-3">
              <span className="text-lg">⏰</span>
              <div><p className="font-semibold">2 horas antes</p><p className="text-slate-500">Segundo recordatorio el mismo día del turno.</p></div>
            </div>
          </div>
          <p className="text-slate-400 text-xs mt-2">Los recordatorios corren automáticamente cada 30 minutos. No necesitás hacer nada.</p>
        </Section>

        <Section icon={<Mail size={16} />} title="Configurar Email (Gmail)">
          <p className="text-slate-500 mb-2">Necesitás conectar tu Gmail para que el sistema pueda enviar emails:</p>
          <Step n={1} text='Hacé clic en "Configurar Email" en el panel lateral.' />
          <Step n={2} text="Seguí el wizard: activar verificación en 2 pasos en Google y crear una Contraseña de Aplicación." />
          <Step n={3} text="Ingresá tu Gmail y la contraseña de 16 letras que generó Google." />
          <Step n={4} text="Guardá. Los emails empiezan a salir desde tu cuenta inmediatamente." />
          <p className="text-slate-400 text-xs mt-2">La Contraseña de Aplicación es distinta a tu contraseña de Gmail. Podés revocarla desde tu cuenta Google sin cambiar tu contraseña real.</p>
        </Section>

        <Section icon={<Image size={16} />} title="Foto de perfil">
          <p className="text-slate-500 mb-2">Tu foto aparece en la página de reservas para que los pacientes te identifiquen.</p>
          <Step n={1} text='Hacé clic en "Foto de Perfil" en el panel lateral.' />
          <Step n={2} text="Elegí una imagen desde tu dispositivo (JPG, PNG o WebP, hasta 5 MB)." />
          <Step n={3} text="Guardá. La foto se actualiza en la página de reservas de inmediato." />
        </Section>

        <Section icon={<Lock size={16} />} title="Cambiar contraseña">
          <Step n={1} text='Hacé clic en "Cambiar Contraseña" en el panel lateral.' />
          <Step n={2} text="Ingresá tu contraseña actual para confirmar tu identidad." />
          <Step n={3} text="Escribí la nueva contraseña (mínimo 6 caracteres) y confirmala." />
          <Step n={4} text="Guardá. La próxima vez que inicies sesión usá la nueva contraseña." />
        </Section>

      </div>
    </div>
  </div>
);
