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
  <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
    <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
      <div className="flex flex-col items-center text-center mb-5">
        <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-4 ${warning ? 'bg-amber-50 text-amber-500' : 'bg-red-50 text-red-500'}`}>
          {warning ? <AlertTriangle size={28} /> : <Trash2 size={28} />}
        </div>
        <h3 className="text-lg font-bold text-slate-900 mb-1">{title}</h3>
        <p className="text-sm text-slate-500">{message}</p>
        {warning && (
          <div className="mt-3 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 text-sm text-amber-700 text-left w-full">
            <strong>Atención:</strong> {warning}
          </div>
        )}
      </div>
      <div className="flex gap-2">
        <button
          onClick={onCancel}
          className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors"
        >
          Cancelar
        </button>
        <button
          onClick={onConfirm}
          className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-colors ${warning ? 'bg-amber-500 hover:bg-amber-600' : 'bg-red-500 hover:bg-red-600'}`}
        >
          {confirmLabel}
        </button>
      </div>
    </div>
  </div>
);
