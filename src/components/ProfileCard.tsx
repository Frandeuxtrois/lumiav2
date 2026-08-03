import React from 'react';
import { supabase } from '../lib/supabase';
import { UserCircle2 } from 'lucide-react';
import { useBusinessName } from '../lib/useBusinessName';

export const ProfileCard: React.FC = () => {
  const [photoUrl, setPhotoUrl] = React.useState<string | null>(null);
  const businessName = useBusinessName();

  React.useEffect(() => {
    supabase.from('settings').select('value').eq('key', 'profile_photo').maybeSingle()
      .then(({ data }) => { if (data) setPhotoUrl(data.value); });
  }, []);

  return (
    <div className="flex items-center gap-5 bg-surface rounded-awd border border-line shadow-sm px-6 py-5 mb-6">
      <div className="w-16 h-16 rounded-full overflow-hidden bg-elevated flex items-center justify-center border border-line shrink-0">
        {photoUrl
          ? <img src={photoUrl} alt={businessName} className="w-full h-full object-cover" />
          : <UserCircle2 size={40} className="text-muted" />
        }
      </div>
      <div>
        <h2 className="text-lg font-bold text-ink leading-tight">{businessName}</h2>
        <p className="text-sm text-primary font-medium">Turnos online</p>
        <p className="text-xs text-muted mt-0.5">Elegí el día y horario que te quede mejor</p>
      </div>
    </div>
  );
};
