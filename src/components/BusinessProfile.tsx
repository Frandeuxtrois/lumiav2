import React from 'react';
import { supabase } from '../lib/supabase';
import { Store, Clock, Info, AlignLeft, Loader2 } from 'lucide-react';
import { fetchPublicProfile, invalidatePublicProfile, BUSINESS_NAME_FALLBACK } from '../lib/usePublicProfile';

interface Props {
  onComplete: () => void;
}

interface Campo {
  key: 'business_name' | 'business_description' | 'business_hours' | 'business_notes';
  label: string;
  icon: React.ReactNode;
  ayuda: string;
  placeholder: string;
  filas: number;
  max: number;
}

const CAMPOS: Campo[] = [
  {
    key: 'business_name',
    label: 'Nombre del negocio',
    icon: <Store size={13} />,
    ayuda: 'Aparece arriba de todo, en la pestaña del navegador y en los emails.',
    placeholder: 'Barbería Central',
    filas: 1,
    max: 80,
  },
  {
    key: 'business_description',
    label: 'Descripción',
    icon: <AlignLeft size={13} />,
    ayuda: 'Una o dos líneas sobre qué hacés. Va debajo del nombre.',
    placeholder: 'Cortes clásicos y arreglo de barba. Atendemos con turno previo.',
    filas: 3,
    max: 300,
  },
  {
    key: 'business_hours',
    label: 'Horarios de atención',
    icon: <Clock size={13} />,
    ayuda: 'Un renglón por día o por tramo. Es informativo: no cambia los turnos que cargás.',
    placeholder: 'Lunes a viernes de 9 a 19\nSábados de 9 a 13',
    filas: 4,
    max: 300,
  },
  {
    key: 'business_notes',
    label: 'Notas',
    icon: <Info size={13} />,
    ayuda: 'Lo que quieras aclararle al cliente antes de que reserve.',
    placeholder: 'Estacionamiento sobre la calle lateral.\nSi llegás más de 15 min tarde, el turno se reprograma.',
    filas: 4,
    max: 400,
  },
];

type Valores = Record<Campo['key'], string>;

const VACIO: Valores = {
  business_name: '',
  business_description: '',
  business_hours: '',
  business_notes: '',
};

export const BusinessProfile: React.FC<Props> = ({ onComplete }) => {
  const [valores, setValores] = React.useState<Valores>(VACIO);
  const [cargando, setCargando] = React.useState(true);
  const [guardando, setGuardando] = React.useState(false);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    supabase
      .from('settings')
      .select('key, value')
      .in('key', CAMPOS.map(c => c.key))
      .then(({ data, error: dbError }) => {
        if (dbError) setError('No se pudo leer la configuración actual.');
        const map = new Map((data ?? []).map(r => [r.key as string, r.value ?? '']));
        setValores({
          business_name: map.get('business_name') ?? '',
          business_description: map.get('business_description') ?? '',
          business_hours: map.get('business_hours') ?? '',
          business_notes: map.get('business_notes') ?? '',
        });
        setCargando(false);
      });
  }, []);

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);
    setError('');
    try {
      const filas = CAMPOS.map(c => ({ key: c.key, value: valores[c.key].trim() }));
      const { error: dbError } = await supabase.from('settings').upsert(filas);
      if (dbError) throw dbError;

      // El hook cachea el perfil por modulo: sin esto la pagina publica sigue
      // mostrando lo viejo hasta que se recargue entera.
      invalidatePublicProfile();
      await fetchPublicProfile();
      onComplete();
    } catch {
      setError('No se pudo guardar. Probá de nuevo.');
      setGuardando(false);
    }
  };

  if (cargando) {
    return (
      <div className="py-10 flex items-center justify-center text-muted text-sm gap-2">
        <Loader2 size={16} className="animate-spin" /> Cargando…
      </div>
    );
  }

  return (
    <form onSubmit={guardar} className="space-y-4">
      <p className="text-xs text-muted">
        Todo esto lo ve el cliente en la página donde saca el turno. Lo que dejes vacío no se muestra.
      </p>

      {CAMPOS.map(campo => {
        const valor = valores[campo.key];
        return (
          <label key={campo.key} className="block">
            <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-muted">
              {campo.icon} {campo.label}
            </span>
            {campo.filas === 1 ? (
              <input
                type="text"
                value={valor}
                maxLength={campo.max}
                placeholder={campo.placeholder}
                onChange={e => setValores(v => ({ ...v, [campo.key]: e.target.value }))}
                className="mt-1 w-full px-3 py-2 border border-line rounded-awd text-sm bg-surface focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            ) : (
              <textarea
                value={valor}
                rows={campo.filas}
                maxLength={campo.max}
                placeholder={campo.placeholder}
                onChange={e => setValores(v => ({ ...v, [campo.key]: e.target.value }))}
                className="mt-1 w-full px-3 py-2 border border-line rounded-awd text-sm bg-surface resize-y focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            )}
            <span className="flex justify-between gap-3 mt-1">
              <span className="text-[11px] text-muted">{campo.ayuda}</span>
              <span className="text-[11px] text-muted shrink-0 tabular-nums">{valor.length}/{campo.max}</span>
            </span>
          </label>
        );
      })}

      {!valores.business_name.trim() && (
        <p className="text-xs text-warning">
          Sin nombre cargado, la página va a decir "{BUSINESS_NAME_FALLBACK}".
        </p>
      )}

      {error && <p className="text-xs text-danger">{error}</p>}

      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={onComplete}
          className="flex-1 py-2.5 border border-line rounded-awd text-sm font-semibold text-muted hover:text-ink hover:border-muted transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={guardando}
          className="flex-1 py-2.5 bg-primary text-on-accent rounded-awd text-sm font-semibold hover:bg-primary-hover disabled:bg-line transition-colors"
        >
          {guardando ? 'Guardando…' : 'Guardar'}
        </button>
      </div>
    </form>
  );
};
