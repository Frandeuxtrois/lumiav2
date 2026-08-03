import React from 'react';
import { Upload, CheckCircle2, UserCircle2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Props {
  onComplete: () => void;
}

export const PhotoUpload: React.FC<Props> = ({ onComplete }) => {
  const [currentPhoto, setCurrentPhoto] = React.useState<string | null>(null);
  const [preview, setPreview] = React.useState<string | null>(null);
  const [file, setFile] = React.useState<File | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [done, setDone] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    supabase.from('settings').select('value').eq('key', 'profile_photo').maybeSingle()
      .then(({ data }) => { if (data) setCurrentPhoto(data.value); });
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith('image/')) { setError('Solo se permiten imágenes.'); return; }
    if (f.size > 5 * 1024 * 1024) { setError('La imagen no puede superar 5 MB.'); return; }
    setError('');
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setError('');
    try {
      const ext = file.name.split('.').pop() ?? 'jpg';
      const path = `photo.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('profile')
        .upload(path, file, { upsert: true, contentType: file.type });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('profile').getPublicUrl(path);

      const { error: dbError } = await supabase
        .from('settings')
        .upsert({ key: 'profile_photo', value: publicUrl });

      if (dbError) throw dbError;
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al subir la foto.');
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="text-center py-6">
        <div className="w-16 h-16 bg-accent/10 text-accent rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 size={32} />
        </div>
        <h3 className="text-xl font-bold mb-2">¡Foto actualizada!</h3>
        <p className="text-muted text-sm mb-6">Ya se muestra en la página de reservas.</p>
        <button onClick={onComplete} className="px-6 py-2.5 bg-primary text-white rounded-awd text-sm font-semibold hover:bg-primary-hover transition-colors">
          Volver al panel
        </button>
      </div>
    );
  }

  const displayPhoto = preview ?? currentPhoto;

  return (
    <div className="space-y-5">
      {/* Preview */}
      <div className="flex flex-col items-center gap-4">
        <div className="w-32 h-32 rounded-full overflow-hidden bg-elevated flex items-center justify-center border-2 border-line">
          {displayPhoto
            ? <img src={displayPhoto} alt="Foto de perfil" className="w-full h-full object-cover" />
            : <UserCircle2 size={64} className="text-muted" />
          }
        </div>
        <p className="text-xs text-muted">
          {currentPhoto && !preview ? 'Foto actual' : preview ? 'Vista previa' : 'Sin foto cargada'}
        </p>
      </div>

      {/* File picker */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
      <button
        onClick={() => inputRef.current?.click()}
        className="w-full flex items-center justify-center gap-2 py-2.5 border-2 border-dashed border-line rounded-awd text-sm text-muted hover:border-primary/40 hover:text-primary transition-colors"
      >
        <Upload size={16} />
        {file ? file.name : 'Elegir foto'}
      </button>

      <p className="text-xs text-muted text-center">JPG, PNG o WebP · Máximo 5 MB</p>

      {error && <p className="text-sm text-danger bg-danger/10 px-4 py-2 rounded-awd">{error}</p>}

      <div className="flex gap-2">
        <button onClick={onComplete} className="px-4 py-2.5 border border-line rounded-awd text-sm hover:bg-elevated transition-colors">
          Cancelar
        </button>
        <button
          onClick={handleUpload}
          disabled={!file || loading}
          className="flex-1 py-2.5 bg-primary text-white rounded-awd text-sm font-semibold hover:bg-primary-hover disabled:bg-line transition-colors"
        >
          {loading ? 'Subiendo...' : 'Guardar foto'}
        </button>
      </div>
    </div>
  );
};
