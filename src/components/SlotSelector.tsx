import React from 'react';
import { Appointment } from '../types';
import { formatTime, cn } from '../lib/utils';

interface SlotSelectorProps {
  slots: Appointment[];
  selectedSlotId: string | null;
  onSlotSelect: (id: string) => void;
  loading: boolean;
}

export const SlotSelector: React.FC<SlotSelectorProps> = ({ slots, selectedSlotId, onSlotSelect, loading }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className="h-10 bg-elevated animate-pulse rounded" />
        ))}
      </div>
    );
  }

  if (slots.length === 0) {
    return (
      <div className="text-center py-8 border-2 border-dashed border-line rounded-awd">
        <p className="text-sm text-muted">No hay horarios disponibles para este día.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
      {slots.map((slot) => {
        const isSelected = selectedSlotId === slot.id;
        const isBooked = slot.status === 'booked';

        return (
          <button
            key={slot.id}
            onClick={() => !isBooked && onSlotSelect(slot.id)}
            disabled={isBooked}
            className={cn(
              'py-2 px-3 border rounded-awd text-sm text-center transition-all duration-300',
              isBooked && 'border-line border-dashed bg-elevated text-muted cursor-not-allowed line-through',
              !isBooked && !isSelected && 'border-line bg-surface text-ink hover:border-accent hover:text-accent lift',
              isSelected && 'border-accent bg-accent/10 font-semibold text-accent',
            )}
          >
            {formatTime(slot.time)}
            {isBooked && <span className="block text-[9px] uppercase tracking-wider mt-0.5">Reservado</span>}
          </button>
        );
      })}
    </div>
  );
};
