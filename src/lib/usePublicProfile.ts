import React from 'react';
import { supabase } from './supabase';

// Lo que ve el cliente final es siempre la marca del negocio, nunca la del software.
export const BUSINESS_NAME_FALLBACK = 'Turnos';

// Las claves que la policy anon_read_public_settings deja leer sin sesion.
// Si se agrega una, hay que sumarla tambien a la migracion 008.
export const PUBLIC_SETTING_KEYS = [
  'business_name',
  'business_description',
  'business_hours',
  'business_notes',
  'profile_photo',
] as const;

export interface PublicProfile {
  name: string;
  description: string;
  hours: string;
  notes: string;
  photo: string | null;
}

const VACIO: PublicProfile = {
  name: BUSINESS_NAME_FALLBACK,
  description: '',
  hours: '',
  notes: '',
  photo: null,
};

// Cache a nivel de modulo: el perfil no cambia durante la visita y lo consumen
// varios componentes, no tiene sentido una consulta por cada uno.
let cached: PublicProfile | null = null;

export const invalidatePublicProfile = () => { cached = null; };

export const fetchPublicProfile = async (): Promise<PublicProfile> => {
  const { data } = await supabase
    .from('settings')
    .select('key, value')
    .in('key', PUBLIC_SETTING_KEYS as unknown as string[]);

  const map = new Map((data ?? []).map(r => [r.key as string, (r.value ?? '').trim()]));
  const perfil: PublicProfile = {
    name: map.get('business_name') || BUSINESS_NAME_FALLBACK,
    description: map.get('business_description') || '',
    hours: map.get('business_hours') || '',
    notes: map.get('business_notes') || '',
    photo: map.get('profile_photo') || null,
  };
  cached = perfil;
  return perfil;
};

export const usePublicProfile = (): PublicProfile => {
  const [perfil, setPerfil] = React.useState<PublicProfile>(cached ?? VACIO);

  React.useEffect(() => {
    if (cached) return;
    let vivo = true;
    fetchPublicProfile().then(p => { if (vivo) setPerfil(p); });
    return () => { vivo = false; };
  }, []);

  return perfil;
};

export const useBusinessName = (): string => usePublicProfile().name;
