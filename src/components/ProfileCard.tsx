import React from 'react';
import { supabase } from '../lib/supabase';
import { UserCircle2 } from 'lucide-react';

export const ProfileCard: React.FC = () => {
  const [photoUrl, setPhotoUrl] = React.useState<string | null>(null);

  React.useEffect(() => {
    supabase.from('settings').select('value').eq('key', 'profile_photo').maybeSingle()
      .then(({ data }) => { if (data) setPhotoUrl(data.value); });
  }, []);

  return (
    <div className="flex items-center gap-5 bg-white rounded-2xl border border-border-gray shadow-sm px-6 py-5 mb-6">
      <div className="w-16 h-16 rounded-full overflow-hidden bg-slate-100 flex items-center justify-center border border-border-gray shrink-0">
        {photoUrl
          ? <img src={photoUrl} alt="Lumina" className="w-full h-full object-cover" />
          : <UserCircle2 size={40} className="text-slate-300" />
        }
      </div>
      <div>
        <h2 className="text-lg font-bold text-slate-900 leading-tight">Lumina</h2>
        <p className="text-sm text-primary font-medium">Psicóloga</p>
        <p className="text-xs text-slate-400 mt-0.5">Reservá tu consulta online</p>
      </div>
    </div>
  );
};
