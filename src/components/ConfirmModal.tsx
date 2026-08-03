import React from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';

interface Props {
  title: string;
  message: string;
  warning?: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<Props> = ({
  title,
  message,
  warning,
  confirmLabel = 'Eliminar',
  onConfirm,
  onCancel,
}) => (
  <div className="fixed inset-0 bg-ink/40 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
    <div className="bg-surface glass rounded-awd p-6 w-full max-w-sm shadow-awd">
      <div className="flex flex-col items-center text-center mb-5">
        <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-4 ${warning ? 'bg-warning/10 text-warning' : 'bg-danger/10 text-danger'}`}>
          {warning ? <AlertTriangle size={28} /> : <Trash2 size={28} />}
        </div>
        <h3 className="text-lg font-bold text-ink mb-1">{title}</h3>
        <p className="text-sm text-muted">{message}</p>
        {warning && (
          <div className="mt-3 bg-warning/10 border border-warning/25 rounded-awd px-4 py-3 text-sm text-warning text-left w-full">
            <strong>Atención:</strong> {warning}
          </div>
        )}
      </div>
      <div className="flex gap-2">
        <button
          onClick={onCancel}
          className="flex-1 px-4 py-2.5 border border-line rounded-awd text-sm font-medium hover:bg-elevated transition-colors"
        >
          Cancelar
        </button>
        {/* Destructivo: contorno + icono, nunca relleno solido — no debe competir
            con el boton primario ni depender de distinguir el tono. */}
        <button
          onClick={onConfirm}
          className={`flex-1 px-4 py-2.5 flex items-center justify-center gap-2 rounded-awd text-sm font-semibold bg-transparent border transition-colors duration-300 ${
            warning
              ? 'border-warning text-warning hover:bg-warning/10'
              : 'border-danger text-danger hover:bg-danger/10'
          }`}
        >
          {warning ? <AlertTriangle size={15} /> : <Trash2 size={15} />}
          {confirmLabel}
        </button>
      </div>
    </div>
  </div>
);
