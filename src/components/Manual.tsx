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
            <p className="text-xs text-slate-400">Todo lo que necesitás saber para usar el sistema</p>
          </div>
        </div>
        <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
          <X size={18} />
        </button>
      </div>

      {/* Content */}
      <div className="overflow-y-auto p-6 space-y-4">

        <Section icon={<Users size={16} />} title="¿Qué ve y vive tu paciente?">
          <p className="text-slate-500 mb-2">Cuando un paciente entra a tu página de turnos, esto es lo que pasa paso a paso:</p>
          <div className="bg-slate-50 rounded-xl p-4 space-y-2">
            <p>📅 Ve un <strong>calendario</strong> donde los días en <strong>verde</strong> tienen turnos disponibles y los que están en <strong>rojo</strong> están completos.</p>
            <p>🕐 Elige el <strong>día y horario</strong> que le queda cómodo. Los turnos ya tomados aparecen tachados y no se pueden seleccionar.</p>
            <p>📝 Completa sus datos: nombre, email, teléfono y una nota opcional.</p>
            <p>✅ Confirma la reserva y ve una pantalla que le muestra el resumen del turno.</p>
            <p>📧 En pocos minutos recibe un <strong>email de confirmación</strong> con la fecha, hora y un botón para agregar el turno directo a su Google Calendar con un solo clic.</p>
          </div>
        </Section>

        <Section icon={<CalendarDays size={16} />} title="Crear horarios disponibles">
          <p className="text-slate-500 mb-3">Hacé clic en el botón <strong>"Nuevo Horario"</strong> (arriba a la derecha). Podés elegir entre tres formas de cargar:</p>
          <div className="space-y-2">
            <div className="bg-slate-50 rounded-xl p-3">
              <p className="font-semibold mb-1">Individual — para casos puntuales</p>
              <p className="text-slate-500">Elegís una fecha y un horario específico. Te crea ese único turno disponible.</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-3">
              <p className="font-semibold mb-1">Rango — para un día completo</p>
              <p className="text-slate-500">Elegís una fecha, el horario de inicio, el horario de cierre y cuánto dura cada sesión (30, 45, 60 o 90 minutos). El sistema crea todos los turnos del día solo. Antes de confirmar te muestra cuántos va a crear.</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-3">
              <p className="font-semibold mb-1">Período — para varias semanas de una vez</p>
              <p className="text-slate-500">Elegís qué días de la semana trabajás, el rango de fechas (por ejemplo, todo el mes de junio) y el horario. El sistema carga todos los turnos de golpe.</p>
            </div>
          </div>
          <p className="text-slate-400 text-xs mt-2">Si intentás cargar un horario que ya existe, el sistema lo saltea sin que tengas que hacer nada.</p>
        </Section>

        <Section icon={<CalendarRange size={16} />} title="Dos formas de ver tu agenda">
          <div className="space-y-2">
            <div className="bg-slate-50 rounded-xl p-3">
              <p className="font-semibold mb-1">Vista Día</p>
              <p className="text-slate-500">Ves todos los turnos de un día específico en una lista. Usá el selector de fecha para ir al día que quieras.</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-3">
              <p className="font-semibold mb-1">Vista Semana</p>
              <p className="text-slate-500">Ves los 7 días de la semana de un vistazo. Ideal para planificar o ver cómo quedó cargada la semana. Navegás con las flechas para ir a la semana anterior o siguiente.</p>
            </div>
          </div>
        </Section>

        <Section icon={<CheckCircle2 size={16} />} title="Estados de los turnos — ¿qué significa cada color?">
          <div className="space-y-2">
            <Tag color="bg-green-50 text-green-600" label="Disponible" desc="El horario está libre. Los pacientes lo pueden ver y reservar." />
            <Tag color="bg-blue-50 text-blue-600" label="Reservado" desc="Un paciente tomó ese turno y el sistema ya le envió el email de confirmación." />
            <Tag color="bg-slate-100 text-slate-400" label="Completado" desc="La sesión se realizó. Lo marcás vos para llevar registro de las consultas." />
            <Tag color="bg-red-50 text-red-500" label="Cancelado" desc="El turno fue cancelado, ya sea por el paciente o por vos." />
          </div>
          <div className="mt-3 space-y-1.5">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Qué podés hacer con cada turno:</p>
            <div className="flex items-center gap-2"><CheckCircle2 size={14} className="text-green-500 shrink-0" /><span>Marcar como completado (solo aparece en turnos reservados)</span></div>
            <div className="flex items-center gap-2"><Trash2 size={14} className="text-red-400 shrink-0" /><span>Eliminar el turno. Si había un paciente, le llega un email avisándole automáticamente.</span></div>
          </div>
        </Section>

        <Section icon={<XCircle size={16} />} title="Cancelación de turnos">
          <div className="space-y-3">
            <div className="bg-slate-50 rounded-xl p-3">
              <p className="font-semibold mb-1">Si cancela el paciente</p>
              <p className="text-slate-500">En el email que recibe el paciente hay un botón rojo "Cancelar turno". Si lo usa con más de 48 horas de anticipación, el turno queda libre automáticamente y <strong>vos recibís un email avisándote</strong>. Si intenta cancelar con menos de 48 horas, el sistema se lo impide.</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-3">
              <p className="font-semibold mb-1">Si cancelás vos desde el panel</p>
              <p className="text-slate-500">Eliminás el turno reservado desde la tabla. Antes de confirmar, el sistema te avisa. Si confirmás, <strong>el paciente recibe un email automáticamente</strong> notificándole que su turno fue cancelado.</p>
            </div>
          </div>
        </Section>

        <Section icon={<Bell size={16} />} title="Recordatorios automáticos — no tenés que hacer nada">
          <p className="text-slate-500 mb-3">El sistema recuerda a los pacientes sus turnos de forma automática. Vos no intervenís para nada:</p>
          <div className="space-y-2">
            <div className="flex items-center gap-3 bg-slate-50 rounded-xl p-3">
              <span className="text-2xl">⏰</span>
              <div>
                <p className="font-semibold">El día anterior</p>
                <p className="text-slate-500">El paciente recibe un email recordándole el turno del día siguiente, con la opción de cancelar si lo necesita.</p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-slate-50 rounded-xl p-3">
              <span className="text-2xl">⏰</span>
              <div>
                <p className="font-semibold">Dos horas antes</p>
                <p className="text-slate-500">Un segundo recordatorio el mismo día para que no se olvide.</p>
              </div>
            </div>
          </div>
        </Section>

        <Section icon={<Mail size={16} />} title="Conectar tu Gmail para enviar emails">
          <p className="text-slate-500 mb-3">El sistema necesita conectarse a tu Gmail para poder enviar los emails de confirmación y recordatorios. Lo hacés una sola vez:</p>
          <Step n={1} text='Hacé clic en "Configurar Email" en el panel lateral.' />
          <Step n={2} text='El sistema te guía paso a paso. Básicamente tenés que entrar a tu cuenta de Google y crear una "contraseña especial solo para esta app" — Google la genera automáticamente, no tenés que inventar nada.' />
          <Step n={3} text="Copiás esa contraseña (son 16 letras) y la pegás en el formulario junto con tu email." />
          <Step n={4} text="Guardás y listo. A partir de ahora los emails salen desde tu cuenta." />
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 mt-2 text-amber-700 text-xs">
            <strong>Tranquila:</strong> esta contraseña especial no es tu contraseña de Gmail. No le da acceso a nadie a tu cuenta. Si en algún momento querés desconectarla, podés hacerlo desde tu cuenta de Google.
          </div>
        </Section>

        <Section icon={<Image size={16} />} title="Tu foto de perfil">
          <p className="text-slate-500 mb-2">Tu foto aparece en la página donde los pacientes reservan, para que sepan con quién están hablando.</p>
          <Step n={1} text='Hacé clic en "Foto de Perfil" en el panel lateral.' />
          <Step n={2} text="Elegí una foto desde tu celular o computadora. Puede ser JPG o PNG, hasta 5 MB." />
          <Step n={3} text="Guardá. La foto se actualiza en segundos." />
        </Section>

        <Section icon={<Lock size={16} />} title="Cambiar tu contraseña de acceso">
          <p className="text-slate-500 mb-2">Si querés cambiar la contraseña con la que entrás al panel:</p>
          <Step n={1} text='Hacé clic en "Cambiar Contraseña" en el panel lateral.' />
          <Step n={2} text="Ingresá tu contraseña actual (para confirmar que sos vos)." />
          <Step n={3} text="Escribí la nueva contraseña dos veces para confirmarla. Tiene que tener al menos 6 caracteres." />
          <Step n={4} text="Guardá. La próxima vez que entres usá la nueva contraseña." />
        </Section>

      </div>
    </div>
  </div>
);
