import React from 'react';
import {
  X, CalendarDays, Mail, Lock, Image, CheckCircle2, Trash2, CalendarRange,
  HelpCircle, Users, XCircle, Bell, Ban, CalendarClock, Moon, MessageSquare,
  AlertTriangle, MousePointerClick,
} from 'lucide-react';
import { STATUS_META } from '../lib/statusMeta';
import { AppointmentStatus } from '../types';
import { cn } from '../lib/utils';

interface Props {
  onClose: () => void;
}

const Section: React.FC<{ icon: React.ReactNode; title: string; children: React.ReactNode }> = ({ icon, title, children }) => (
  <div className="border border-line rounded-awd overflow-hidden">
    <div className="flex items-center gap-3 bg-elevated px-5 py-4 border-b border-line">
      <div className="w-8 h-8 rounded-awd bg-primary/10 text-primary flex items-center justify-center shrink-0">
        {icon}
      </div>
      <h3 className="font-bold text-ink">{title}</h3>
    </div>
    <div className="px-5 py-4 space-y-2 text-sm text-muted">
      {children}
    </div>
  </div>
);

const Step: React.FC<{ n: number; children: React.ReactNode }> = ({ n, children }) => (
  <div className="flex items-start gap-3">
    <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{n}</span>
    <span>{children}</span>
  </div>
);

const Card: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="bg-elevated rounded-awd p-3">
    <p className="font-semibold text-ink mb-1">{title}</p>
    <p className="text-muted">{children}</p>
  </div>
);

const Nota: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="flex items-start gap-2 bg-warning/10 border border-warning/25 rounded-awd p-3 mt-2 text-xs text-warning">
    <AlertTriangle size={13} className="shrink-0 mt-0.5" />
    <span>{children}</span>
  </div>
);

// El chip repite icono + palabra: el estado se entiende sin depender del color.
const EstadoFila: React.FC<{ estado: AppointmentStatus; desc: string }> = ({ estado, desc }) => {
  const { label, Icon, chip } = STATUS_META[estado];
  return (
    <div className="flex items-start gap-3">
      <span className={cn('px-2 py-0.5 rounded border text-[10px] font-bold uppercase flex items-center gap-1 shrink-0', chip)}>
        <Icon size={11} /> {label}
      </span>
      <span className="text-muted">{desc}</span>
    </div>
  );
};

export const Manual: React.FC<Props> = ({ onClose }) => (
  <div className="fixed inset-0 bg-ink/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
    <div className="bg-surface rounded-awd shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-line shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-awd bg-primary/10 text-primary flex items-center justify-center">
            <HelpCircle size={20} />
          </div>
          <div>
            <h2 className="text-lg font-bold">Manual de uso</h2>
            <p className="text-xs text-muted">Todo lo que necesitás saber para usar el sistema</p>
          </div>
        </div>
        <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-awd hover:bg-elevated text-muted hover:text-ink transition-colors">
          <X size={18} />
        </button>
      </div>

      {/* Content */}
      <div className="overflow-y-auto p-6 space-y-4">

        <Section icon={<Users size={16} />} title="¿Qué ve y vive tu cliente?">
          <p className="mb-2">Cuando alguien entra a tu página de turnos, esto es lo que pasa paso a paso:</p>
          <div className="bg-elevated rounded-awd p-4 space-y-2">
            <p>📅 Ve un <strong className="text-ink">calendario</strong> donde los días resaltados tienen turnos disponibles. Los días sin lugar (o los que bloqueaste) aparecen apagados y no se pueden seleccionar.</p>
            <p>🕐 Elige el <strong className="text-ink">día y horario</strong> que le queda cómodo. Los turnos ya tomados aparecen deshabilitados.</p>
            <p>📝 Completa sus datos: nombre, email, teléfono y un comentario opcional.</p>
            <p>✅ Confirma y ve el resumen del turno en pantalla.</p>
            <p>📧 En pocos minutos recibe un <strong className="text-ink">email de confirmación</strong> con la fecha, la hora, un archivo para agregarlo a su calendario y un botón para reprogramar o cancelar.</p>
          </div>
          <p className="text-xs mt-2">Si dos personas intentan reservar el mismo horario al mismo tiempo, solo una lo consigue: a la otra le avisa que ese horario ya fue tomado y le refresca la lista.</p>
        </Section>

        <Section icon={<CalendarDays size={16} />} title="Crear horarios disponibles">
          <p className="mb-3">Hacé clic en <strong className="text-ink">"Nuevo Horario"</strong> (arriba a la derecha). Hay tres formas de cargar:</p>
          <div className="space-y-2">
            <Card title="Individual — para casos puntuales">
              Elegís una fecha y un horario específico. Crea ese único turno.
            </Card>
            <Card title="Rango — para un día completo">
              Elegís la fecha, desde qué hora hasta qué hora, y cuánto dura cada turno (30, 45, 60 o 90 minutos). Crea todos los turnos del día solo. Antes de confirmar te muestra cuántos va a crear.
            </Card>
            <Card title="Período — para varias semanas de una vez">
              Elegís qué días de la semana trabajás, el rango de fechas (por ejemplo todo agosto) y el horario. Carga todo de golpe.
            </Card>
          </div>
          <p className="text-xs mt-2">Si intentás cargar un horario que ya existe, lo saltea sin romper nada.</p>
        </Section>

        <Section icon={<CalendarRange size={16} />} title="Las tres vistas de tu agenda">
          <div className="space-y-2">
            <Card title="Día">
              La lista de turnos de una fecha, con los datos de cada cliente y sus comentarios. Es la vista donde trabajás el día a día. Cambiás de fecha con el selector de arriba.
            </Card>
            <Card title="Semana">
              Los 7 días de un vistazo, para ver cómo viene cargada la semana. Navegás con las flechas. Desde acá también cerrás la semana entera de un botón.
            </Card>
            <Card title="Mes">
              El mes completo con el resumen de cada día (cuántos libres, cuántos reservados). Sirve para planificar y para bloquear semanas o días sueltos de una.
            </Card>
          </div>
        </Section>

        <Section icon={<Ban size={16} />} title="Bloquear días — feriados, vacaciones, días que no atendés">
          <p className="mb-3">Bloquear <strong className="text-ink">no borra</strong> los horarios: los saca de circulación para que nadie pueda reservarlos, y los podés devolver cuando quieras.</p>
          <p className="mb-2 font-semibold text-ink">La forma principal: el botón "Bloquear período"</p>
          <p className="mb-3">Está arriba a la derecha, al lado de "Nuevo Horario", y sirve en cualquier vista. Se abre una ventanita donde ponés <strong className="text-ink">desde qué día hasta qué día</strong> no atendés. Te sirve para cualquier tramo: te vas un lunes 14 y volvés un jueves 24, ponés esas dos fechas y listo.</p>
          <p className="mb-3">Arriba tenés cuatro atajos que te llenan las fechas solos: <strong className="text-ink">Este día</strong>, <strong className="text-ink">Esta semana</strong>, <strong className="text-ink">Este mes</strong> y el mes que viene por su nombre. Después podés retocar las fechas a mano si no cierra justo.</p>
          <p className="mb-3">Antes de confirmar te muestra cuántos días agarra, cuántos horarios libres va a bloquear y cuántos ya estaban bloqueados. El botón <strong className="text-ink">"Abrir"</strong> hace lo contrario: devuelve a disponibles todo lo que estaba bloqueado en ese período.</p>

          <p className="mb-2 mt-4 font-semibold text-ink">Atajos si ya estás mirando la agenda</p>
          <div className="space-y-2">
            <Card title="Una semana entera">
              En la vista <strong className="text-ink">Semana</strong>, arriba de la grilla, tocás "Bloquear semana". Cierra los siete días que estás viendo. Para volver atrás, "Abrir semana".
            </Card>
            <Card title="Semanas o días sueltos, a dedo">
              En la vista <strong className="text-ink">Mes</strong>, cada fila tiene a la izquierda un botón vertical que dice "Semana" para seleccionarla completa, y podés hacer clic en días sueltos. Abajo aparece una barra con cuántos elegiste y los botones "Bloquear" y "Abrir".
            </Card>
          </div>
          <div className="mt-3 space-y-1.5">
            <p className="text-xs font-semibold uppercase tracking-wider mb-1">Atajos en la vista Mes:</p>
            <div className="flex items-start gap-2"><MousePointerClick size={14} className="shrink-0 mt-0.5 text-primary" /><span><strong className="text-ink">Un clic:</strong> selecciona o deselecciona ese día.</span></div>
            <div className="flex items-start gap-2"><MousePointerClick size={14} className="shrink-0 mt-0.5 text-primary" /><span><strong className="text-ink">Botón "Semana":</strong> selecciona o deselecciona los siete días de esa fila. Si la semana arranca en el mes anterior, esos días entran igual — unas vacaciones no se cortan porque cambie el mes.</span></div>
            <div className="flex items-start gap-2"><MousePointerClick size={14} className="shrink-0 mt-0.5 text-primary" /><span><strong className="text-ink">Shift + clic:</strong> selecciona todo el rango desde el último día que tocaste. Sirve para vacaciones que no arrancan un lunes.</span></div>
            <div className="flex items-start gap-2"><MousePointerClick size={14} className="shrink-0 mt-0.5 text-primary" /><span><strong className="text-ink">Doble clic:</strong> abre ese día en la vista Día.</span></div>
          </div>
          <Nota>
            Bloquear solo toca los horarios <strong>libres</strong>. Los turnos ya reservados quedan en pie a propósito: esos los cancelás uno por uno para que el cliente reciba el aviso por email. Si seleccionás días con reservas, la barra te avisa cuántas hay.
          </Nota>
        </Section>

        <Section icon={<CheckCircle2 size={16} />} title="Estados de los turnos">
          <p className="mb-3">Cada estado se distingue por su ícono y su palabra, no solo por el color:</p>
          <div className="space-y-2">
            <EstadoFila estado="available" desc="El horario está libre. Los clientes lo ven y lo pueden reservar." />
            <EstadoFila estado="booked" desc="Un cliente lo tomó y ya recibió su email de confirmación." />
            <EstadoFila estado="completed" desc="El turno se realizó. Lo marcás vos para llevar registro." />
            <EstadoFila estado="cancelled" desc="El turno fue cancelado, por el cliente o por vos." />
            <EstadoFila estado="blocked" desc="Lo sacaste de circulación (feriado, vacaciones). Nadie lo ve en la web." />
          </div>
          <div className="mt-4 space-y-1.5">
            <p className="text-xs font-semibold uppercase tracking-wider mb-1">Qué podés hacer con cada turno:</p>
            <div className="flex items-start gap-2"><CheckCircle2 size={14} className="text-accent shrink-0 mt-0.5" /><span>Marcarlo como completado (solo aparece en turnos reservados).</span></div>
            <div className="flex items-start gap-2"><Trash2 size={14} className="text-muted shrink-0 mt-0.5" /><span>Eliminarlo. Si había un cliente, le llega un email avisándole automáticamente.</span></div>
          </div>
        </Section>

        <Section icon={<MessageSquare size={16} />} title="Los comentarios del cliente">
          <p>Si al reservar escribe algo en el campo de comentarios, lo vas a ver de dos formas:</p>
          <div className="mt-2 space-y-2">
            <Card title="En el panel">
              Aparece resaltado debajo del nombre, en la vista Día. No hace falta abrir nada.
            </Card>
            <Card title="En el email que te llega a vos">
              El aviso de reserva nueva incluye el teléfono y el comentario, así lo tenés sin entrar al panel.
            </Card>
          </div>
        </Section>

        <Section icon={<CalendarClock size={16} />} title="Reprogramar y cancelar">
          <p className="mb-3">En el email que recibió, el cliente tiene un botón que lo lleva a una página donde puede elegir entre reprogramar o cancelar. Las dos opciones exigen <strong className="text-ink">más de 48 horas</strong> de anticipación; con menos, el sistema no lo deja y le pide que te contacte.</p>
          <div className="space-y-2">
            <Card title="Si reprograma">
              Elige otra fecha y otro horario de los que tengas libres. El turno viejo queda liberado y el nuevo pasa a estar reservado a su nombre. Si alguien le gana el horario nuevo mientras elige, conserva el que ya tenía y le pide que elija otro.
            </Card>
            <Card title="Si cancela él">
              El horario queda libre para otro cliente y <strong className="text-ink">a vos te llega un email avisándote</strong>.
            </Card>
            <Card title="Si cancelás vos">
              Eliminás el turno desde el panel. Te pide confirmación y después <strong className="text-ink">le llega un email al cliente</strong> avisándole, con un archivo que le borra el evento del calendario.
            </Card>
          </div>
          <Nota>
            Hoy la reprogramación <strong>no dispara un email</strong> de aviso: el cambio queda hecho y lo ves en el panel, pero ni vos ni el cliente reciben una confirmación del horario nuevo. Revisá el panel si esperabas a alguien y no aparece en su horario original.
          </Nota>
        </Section>

        <Section icon={<Bell size={16} />} title="Recordatorios automáticos — no tenés que hacer nada">
          <p className="mb-3">El sistema le recuerda el turno al cliente solo. Vos no intervenís:</p>
          <div className="space-y-2">
            <div className="flex items-center gap-3 bg-elevated rounded-awd p-3">
              <span className="text-2xl">⏰</span>
              <div>
                <p className="font-semibold text-ink">El día anterior</p>
                <p>Un email recordándole el turno del día siguiente, con la opción de reprogramar o cancelar.</p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-elevated rounded-awd p-3">
              <span className="text-2xl">⏰</span>
              <div>
                <p className="font-semibold text-ink">Dos horas antes</p>
                <p>Un segundo recordatorio el mismo día, para que no se olvide.</p>
              </div>
            </div>
          </div>
          <p className="text-xs mt-2">Cada recordatorio se manda una sola vez por turno, aunque el sistema revise la agenda varias veces por hora.</p>
        </Section>

        <Section icon={<Users size={16} />} title="Tus clientes quedan guardados">
          <p>Cada vez que alguien reserva, el sistema guarda su ficha (nombre, email, teléfono) y suma esa visita a su historial. Se agrupa por email: si la misma persona vuelve, no se duplica, se le suma la visita.</p>
          <p className="mt-2">Ese registro <strong className="text-ink">sobrevive a la cancelación</strong>. Antes, cancelar un turno borraba los datos del cliente y no quedaba rastro de que había existido; ahora la reserva queda marcada como cancelada, pero el cliente y su historial siguen ahí.</p>
          <Nota>
            La información ya se está guardando desde el primer turno, pero todavía no hay una pantalla en el panel para ver la ficha de cada cliente y su historial. Es lo próximo que se agrega.
          </Nota>
        </Section>

        <Section icon={<Mail size={16} />} title="Conectar tu Gmail para enviar emails">
          <p className="mb-3">El sistema necesita tu Gmail para mandar las confirmaciones y los recordatorios. Se hace una sola vez:</p>
          <Step n={1}>Hacé clic en <strong className="text-ink">"Configurar Email"</strong> en el panel lateral.</Step>
          <Step n={2}>Te guía paso a paso. Básicamente entrás a tu cuenta de Google y creás una "contraseña especial solo para esta app" — Google la genera sola, no tenés que inventar nada.</Step>
          <Step n={3}>Copiás esa contraseña (son 16 letras) y la pegás en el formulario junto con tu email.</Step>
          <Step n={4}>Guardás y listo. A partir de ahí los emails salen desde tu cuenta.</Step>
          <div className="bg-info/10 border border-info/25 rounded-awd p-3 mt-3 text-info text-xs">
            <strong>Tranquilo:</strong> esa contraseña especial no es la de tu Gmail y no le da acceso a nadie a tu cuenta. La podés dar de baja cuando quieras desde tu cuenta de Google.
          </div>
          <Nota>
            Sin esto configurado no sale <strong>ningún</strong> email. Las reservas se siguen guardando bien y las ves en el panel, pero el cliente no recibe nada. Si un email falla, el sistema te lo avisa en pantalla en vez de tragárselo en silencio.
          </Nota>
        </Section>

        <Section icon={<Image size={16} />} title="Tu foto de perfil">
          <p className="mb-2">Aparece en la página donde reservan tus clientes, para que sepan con quién están sacando turno.</p>
          <Step n={1}>Hacé clic en <strong className="text-ink">"Foto de Perfil"</strong> en el panel lateral.</Step>
          <Step n={2}>Elegí una imagen desde el celular o la computadora. JPG o PNG, hasta 5 MB.</Step>
          <Step n={3}>Guardá. Se actualiza en segundos.</Step>
        </Section>

        <Section icon={<Lock size={16} />} title="Cambiar tu contraseña de acceso">
          <p className="mb-2">Para cambiar la contraseña con la que entrás al panel:</p>
          <Step n={1}>Hacé clic en <strong className="text-ink">"Cambiar Contraseña"</strong> en el panel lateral.</Step>
          <Step n={2}>Ingresá la actual, para confirmar que sos vos.</Step>
          <Step n={3}>Escribí la nueva dos veces. Mínimo 6 caracteres.</Step>
          <Step n={4}>Guardá. La próxima vez entrás con la nueva.</Step>
        </Section>

        <Section icon={<Moon size={16} />} title="Modo claro y modo oscuro">
          <p>Arriba a la derecha, al lado del nombre de tu negocio, hay un botón con un sol o una luna. Cambia toda la pantalla entre claro y oscuro.</p>
          <p className="mt-2">Tu elección queda guardada en ese dispositivo: si entrás desde el celular y desde la computadora, cada uno recuerda la suya.</p>
        </Section>

        <Section icon={<XCircle size={16} />} title="Si algo sale mal">
          <div className="space-y-2">
            <Card title="Aparece un cartel de error abajo de la pantalla">
              Es a propósito: el sistema prefiere avisarte antes que hacer de cuenta que todo salió bien. Leé el mensaje, cerralo con la × y probá de nuevo.
            </Card>
            <Card title='Dice "el turno ya no está en el estado esperado"'>
              Alguien más (o vos desde otra pestaña) tocó ese turno mientras lo tenías abierto. Refrescá la página y vas a ver el estado real.
            </Card>
            <Card title="No llegan los emails">
              Casi siempre es el Gmail sin configurar o una contraseña de aplicación revocada. Volvé a pasar por "Configurar Email". Revisá también la carpeta de spam del cliente.
            </Card>
          </div>
        </Section>

      </div>
    </div>
  </div>
);
