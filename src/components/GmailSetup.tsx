import React from 'react';
import { Mail, Shield, Key, Copy, CheckCircle2, ExternalLink, ChevronRight, ChevronLeft, Settings } from 'lucide-react';
import { supabase } from '../lib/supabase';

const STEPS = [
  {
    icon: Mail,
    title: '¿Para qué es esto?',
    description: 'Lumina necesita tu Gmail para enviar confirmaciones y recordatorios a tus pacientes.',
    detail: 'Vamos a crear una "Contraseña de Aplicación" — es diferente a tu contraseña normal y solo la usa Lumina. Podés revocarla cuando quieras sin cambiar tu contraseña real.',
    action: null,
    tip: null,
  },
  {
    icon: Shield,
    title: 'Activá la verificación en 2 pasos',
    description: 'Google requiere tener activada la verificación en 2 pasos para crear contraseñas de aplicación.',
    detail: 'Si ya la tenés activada, pasá al siguiente paso. Si no, hacé clic en el botón de abajo y seguí las instrucciones de Google.',
    action: {
      label: 'Ir a Seguridad → Verificación en 2 pasos',
      url: 'https://myaccount.google.com/signinoptions/two-step-verification',
    },
    tip: 'Ya lo tengo activado →',
  },
  {
    icon: Key,
    title: 'Creá tu Contraseña de Aplicación',
    description: 'En la página que se abre, Google te va a generar una contraseña especial para Lumina.',
    detail: null,
    action: {
      label: 'Ir a Contraseñas de Aplicación',
      url: 'https://myaccount.google.com/apppasswords',
    },
    tip: null,
    instructions: [
      'En "Nombre", escribí "Lumina Turnero"',
      'Hacé clic en Crear',
      'Google te muestra una contraseña de 16 letras',
      'Copiala (con o sin espacios, funciona igual)',
    ],
  },
  {
    icon: Copy,
    title: 'Copiá la contraseña generada',
    description: 'Google te muestra una ventana con la contraseña. Se ve así:',
    detail: 'Guardala en algún lugar seguro si querés, aunque siempre podés crear una nueva desde el mismo lugar.',
    action: null,
    tip: null,
    preview: 'abcd efgh ijkl mnop',
  },
];

interface Props {
  onComplete: () => void;
}

export const GmailSetup: React.FC<Props> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = React.useState(0);
  const [gmail, setGmail] = React.useState('');
  const [appPassword, setAppPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [done, setDone] = React.useState(false);

  const totalSteps = STEPS.length + 1;
  const isFormStep = currentStep === STEPS.length;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { error: dbError } = await supabase
        .from('settings')
        .upsert([
          { key: 'gmail_user', value: gmail.trim() },
          { key: 'gmail_app_password', value: appPassword.replace(/\s/g, '') },
        ]);
      if (dbError) throw dbError;
      setDone(true);
    } catch (err) {
      setError('No se pudo guardar. Verificá que la tabla settings existe en Supabase.');
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 size={32} />
        </div>
        <h3 className="text-xl font-bold mb-2">¡Listo!</h3>
        <p className="text-slate-500 text-sm mb-1">Los emails se van a enviar desde:</p>
        <p className="font-mono text-primary font-semibold mb-6">{gmail}</p>
        <button
          onClick={onComplete}
          className="px-6 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary-hover transition-colors"
        >
          Volver al panel
        </button>
      </div>
    );
  }

  // Progress bar
  const ProgressBar = () => (
    <div className="flex gap-1.5 mb-8">
      {Array.from({ length: totalSteps }).map((_, i) => (
        <div
          key={i}
          className={`h-1 flex-1 rounded-full transition-all duration-300 ${
            i < currentStep ? 'bg-primary' : i === currentStep ? 'bg-primary/50' : 'bg-slate-100'
          }`}
        />
      ))}
    </div>
  );

  if (isFormStep) {
    return (
      <div>
        <ProgressBar />
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Settings size={28} />
          </div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Paso {currentStep + 1} de {totalSteps}</p>
          <h3 className="text-xl font-bold text-slate-900 mb-1">Ingresá tus datos</h3>
          <p className="text-slate-500 text-sm">Pegá acá lo que copiaste de Google.</p>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Tu dirección de Gmail
            </label>
            <input
              type="email"
              required
              placeholder="tumail@gmail.com"
              value={gmail}
              onChange={e => setGmail(e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:outline-none text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Contraseña de Aplicación (16 letras)
            </label>
            <input
              type="password"
              required
              placeholder="abcdefghijklmnop"
              value={appPassword}
              onChange={e => setAppPassword(e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:outline-none font-mono text-sm tracking-widest"
            />
            <p className="text-xs text-slate-400 mt-1">Con o sin espacios, funciona igual.</p>
          </div>

          {error && (
            <p className="text-sm text-red-500 bg-red-50 px-4 py-2 rounded-lg">{error}</p>
          )}

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={() => setCurrentStep(s => s - 1)}
              className="px-4 py-2.5 border border-slate-200 rounded-xl text-sm hover:bg-slate-50 flex items-center gap-1 transition-colors"
            >
              <ChevronLeft size={16} /> Atrás
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary-hover disabled:bg-slate-300 transition-colors"
            >
              {loading ? 'Guardando...' : 'Guardar configuración'}
            </button>
          </div>
        </form>
      </div>
    );
  }

  const step = STEPS[currentStep];
  const Icon = step.icon;

  return (
    <div>
      <ProgressBar />

      <div className="text-center mb-6">
        <div className="w-14 h-14 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Icon size={28} />
        </div>
        <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">
          Paso {currentStep + 1} de {totalSteps}
        </p>
        <h3 className="text-xl font-bold text-slate-900 mb-3">{step.title}</h3>
        <p className="text-slate-600 text-sm leading-relaxed">{step.description}</p>
      </div>

      {'preview' in step && step.preview && (
        <div className="bg-slate-900 text-green-400 font-mono text-lg tracking-[0.3em] text-center py-4 px-6 rounded-xl mb-4">
          {step.preview}
        </div>
      )}

      {'instructions' in step && step.instructions && (
        <ol className="space-y-2 mb-5">
          {(step.instructions as string[]).map((item, i) => (
            <li key={i} className="flex items-start gap-3 text-sm text-slate-600">
              <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                {i + 1}
              </span>
              {item}
            </li>
          ))}
        </ol>
      )}

      {step.detail && (
        <p className="text-xs text-slate-400 leading-relaxed text-center mb-5">{step.detail}</p>
      )}

      {step.action && (
        <a
          href={step.action.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full py-2.5 border-2 border-primary text-primary rounded-xl text-sm font-semibold hover:bg-primary/5 transition-colors mb-3"
        >
          {step.action.label} <ExternalLink size={14} />
        </a>
      )}

      <div className="flex gap-2 mt-2">
        {currentStep > 0 && (
          <button
            onClick={() => setCurrentStep(s => s - 1)}
            className="px-4 py-2.5 border border-slate-200 rounded-xl text-sm hover:bg-slate-50 flex items-center gap-1 transition-colors"
          >
            <ChevronLeft size={16} /> Atrás
          </button>
        )}
        <button
          onClick={() => setCurrentStep(s => s + 1)}
          className="flex-1 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary-hover flex items-center justify-center gap-1 transition-colors"
        >
          {currentStep === STEPS.length - 1 ? 'Ingresar mis datos' : step.tip ?? 'Siguiente'}
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
};
