import React from 'react';
import { supabase } from './supabase';

// Lo que ve el cliente final es siempre la marca del negocio, nunca la del software.
export const BUSINESS_NAME_FALLBACK = 'Turnos';

// Cache a nivel de modulo: el nombre no cambia durante la visita y se usa en
// varios componentes, no tiene sentido pedirlo una vez por cada uno.
let cached: string | null = null;

export const useBusinessName = (): string => {
  const [name, setName] = React.useState(cached ?? BUSINESS_NAME_FALLBACK);

  React.useEffect(() => {
    if (cached) return;

    supabase
      .from('settings')
      .select('value')
      .eq('key', 'business_name')
      .maybeSingle()
      .then(({ data }) => {
        const value = data?.value?.trim();
        if (value) {
          cached = value;
          setName(value);
        }
      });
  }, []);

  return name;
};
