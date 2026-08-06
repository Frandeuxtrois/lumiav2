import React from 'react';
import { UserCircle2, Clock, Info } from 'lucide-react';
import { usePublicProfile } from '../lib/usePublicProfile';

// Los campos largos se cargan como texto libre y se respetan los saltos de linea:
// "Lun a Vie 9 a 18" y "Sabados 9 a 13" tienen que quedar en renglones distintos.
const Bloque: React.FC<{ icon: React.ReactNode; titulo: string; texto: string }> = ({ icon, titulo, texto }) => (
  <div className="flex-1 min-w-52">
    <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-muted mb-1">
      {icon} {titulo}
    </p>
    <p className="text-sm text-ink whitespace-pre-line leading-relaxed">{texto}</p>
  </div>
);

export const ProfileCard: React.FC = () => {
  const { name, description, hours, notes, photo } = usePublicProfile();
  const hayDetalle = !!hours || !!notes;

  return (
    <div className="bg-surface rounded-awd border border-line shadow-sm px-6 py-5 mb-6">
      <div className="flex items-center gap-5">
        <div className="w-16 h-16 rounded-full overflow-hidden bg-elevated flex items-center justify-center border border-line shrink-0">
          {photo
            ? <img src={photo} alt={name} className="w-full h-full object-cover" />
            : <UserCircle2 size={40} className="text-muted" />
          }
        </div>
        <div>
          <h2 className="text-lg font-bold text-ink leading-tight">{name}</h2>
          {description
            ? <p className="text-sm text-muted mt-1 whitespace-pre-line leading-relaxed">{description}</p>
            : <>
                <p className="text-sm text-primary font-medium">Turnos online</p>
                <p className="text-xs text-muted mt-0.5">Elegí el día y horario que te quede mejor</p>
              </>
          }
        </div>
      </div>

      {hayDetalle && (
        <div className="flex flex-wrap gap-6 mt-5 pt-5 border-t border-line">
          {hours && <Bloque icon={<Clock size={11} />} titulo="Horarios de atención" texto={hours} />}
          {notes && <Bloque icon={<Info size={11} />} titulo="A tener en cuenta" texto={notes} />}
        </div>
      )}
    </div>
  );
};
