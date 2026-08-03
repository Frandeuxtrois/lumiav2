import { CircleDot, User, CheckCheck, XCircle, Ban, LucideIcon } from 'lucide-react';
import { AppointmentStatus } from '../types';

// Cada estado se distingue por icono + palabra + forma del borde, no solo por color:
// asi la informacion sobrevive aunque el tono no se perciba.
export const STATUS_META: Record<AppointmentStatus, { label: string; Icon: LucideIcon; chip: string }> = {
  available: {
    label: 'Disponible',
    Icon: CircleDot,
    chip: 'bg-accent/10 text-accent border-accent/40 border-solid',
  },
  booked: {
    label: 'Reservado',
    Icon: User,
    chip: 'bg-info/10 text-info border-info/40 border-solid',
  },
  completed: {
    label: 'Completado',
    Icon: CheckCheck,
    chip: 'bg-elevated text-muted border-line border-solid',
  },
  cancelled: {
    label: 'Cancelado',
    Icon: XCircle,
    chip: 'bg-danger/10 text-danger border-danger/40 border-dashed',
  },
  blocked: {
    label: 'Bloqueado',
    Icon: Ban,
    chip: 'bg-elevated text-muted border-muted/40 border-dashed',
  },
};
