import React from 'react';

interface BookingFormProps {
  onSubmit: (data: BookingFormData) => void;
  loading: boolean;
}

export interface BookingFormData {
  name: string;
  email: string;
  phone: string;
  notes: string;
}

export const BookingForm: React.FC<BookingFormProps> = ({ onSubmit, loading }) => {
  const [formData, setFormData] = React.useState<BookingFormData>({
    name: '',
    email: '',
    phone: '',
    notes: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1">Nombre Completo *</label>
        <input
          required
          name="name"
          type="text"
          value={formData.name}
          onChange={handleChange}
          placeholder="Escribe tu nombre"
          className="w-full px-4 py-2 border border-line rounded-awd focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1">Email *</label>
          <input
            required
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="tu@email.com"
            className="w-full px-4 py-2 border border-line rounded-awd focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1">Teléfono</label>
          <input
            name="phone"
            type="tel"
            value={formData.phone}
            onChange={handleChange}
            placeholder="+54 9..."
            className="w-full px-4 py-2 border border-line rounded-awd focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
          />
        </div>
      </div>
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1">Motivo / Notas</label>
        <textarea
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          rows={3}
          placeholder="Algo que quieras comentarme..."
          className="w-full px-4 py-2 border border-line rounded-awd focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-primary text-on-accent font-medium py-3 rounded-awd shadow-lg shadow-awd hover:bg-primary-hover disabled:bg-line disabled:shadow-none transition-all mt-4"
      >
        {loading ? 'Procesando...' : 'Confirmar Reserva'}
      </button>
    </form>
  );
};
