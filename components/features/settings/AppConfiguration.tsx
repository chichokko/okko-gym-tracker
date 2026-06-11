import React, { useState, useRef } from 'react';
import { User, AppConfig } from '../../../types';
import { Card, Input, Button, toast, Select } from '../../ui';
import { updateUserConfig } from '../../../services/dataService';
import { uploadImage } from '../../../services/storageService';
import { Save, Settings2, Loader2, Weight, Upload, Trash2, Image as ImageIcon } from 'lucide-react';

interface AppConfigurationProps {
  user: User;
  onConfigUpdate: () => void;
}

const AppConfiguration: React.FC<AppConfigurationProps> = ({ user, onConfigUpdate }) => {
  const defaultConfig: AppConfig = { unit: 'kg', smallBrickWeight: 5, largeBrickWeight: 7.5 };
  const currentConfig = user.config || defaultConfig;

  const [unit, setUnit] = useState<'kg' | 'lbs'>(currentConfig.unit);
  const [smallBrick, setSmallBrick] = useState(currentConfig.smallBrickWeight.toString());
  const [largeBrick, setLargeBrick] = useState(currentConfig.largeBrickWeight.toString());
  const [logoUrl, setLogoUrl] = useState(currentConfig.logoUrl || '');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState(currentConfig.logoUrl || '');
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    const newConfig: AppConfig = {
      ...(user.config || defaultConfig),
      unit,
      smallBrickWeight: parseFloat(smallBrick) || defaultConfig.smallBrickWeight,
      largeBrickWeight: parseFloat(largeBrick) || defaultConfig.largeBrickWeight,
    };

    if (logoFile) {
      setIsUploadingLogo(true);
      const url = await uploadImage('Logos', logoFile);
      setIsUploadingLogo(false);
      if (url) {
        newConfig.logoUrl = url;
        setLogoUrl(url);
        setLogoPreview(url);
        setLogoFile(null);
      } else {
        toast.error('Error al subir el logo');
        setIsSaving(false);
        return;
      }
    } else {
      newConfig.logoUrl = logoUrl || undefined;
    }

    const success = await updateUserConfig(user.id, newConfig);
    if (success) {
      toast.success('Configuración guardada correctamente');
      onConfigUpdate();
    } else {
      toast.error('Error al guardar la configuración');
    }
    setIsSaving(false);
  };

  const handleLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Solo se permiten imágenes');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('La imagen no debe superar los 5MB');
      return;
    }

    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
    if (logoInputRef.current) logoInputRef.current.value = '';
  };

  const handleRemoveLogo = () => {
    setLogoFile(null);
    setLogoPreview('');
    setLogoUrl('');
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg">
            <Settings2 size={24} />
          </div>
          <div>
            <h2 className="text-lg font-bold">Preferencias Generales</h2>
            <p className="text-sm text-slate-500">Ajusta cómo se muestran y calculan los datos</p>
          </div>
        </div>

        <form onSubmit={handleSaveConfig} className="space-y-6">
          <div className="space-y-4">
            <Select
              label="Unidad de Medida"
              value={unit}
              onChange={(e) => setUnit(e.target.value as 'kg' | 'lbs')}
            >
              <option value="kg">Kilogramos (kg)</option>
              <option value="lbs">Libras (lbs)</option>
            </Select>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl space-y-4">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <Weight size={16} className="text-slate-500" />
                Configuración de Máquinas de Polea (Ladrillos)
              </h3>
              <p className="text-xs text-slate-500 mb-2">
                Define el peso de los ladrillos para facilitar el registro en máquinas.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label={`Peso Ladrillo Pequeño (${unit})`}
                  type="number"
                  step="0.1"
                  min="0"
                  value={smallBrick}
                  onChange={(e) => setSmallBrick(e.target.value)}
                  required
                />
                <Input
                  label={`Peso Ladrillo Grande (${unit})`}
                  type="number"
                  step="0.1"
                  min="0"
                  value={largeBrick}
                  onChange={(e) => setLargeBrick(e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl space-y-4">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <ImageIcon size={16} className="text-slate-500" />
              Logo del Gimnasio
            </h3>
            <p className="text-xs text-slate-500">
              Este logo aparecerá en los PDFs y reportes generados.
            </p>
            <div className="flex items-start gap-4">
              {logoPreview ? (
                <div className="relative w-20 h-20 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 flex-shrink-0 bg-white">
                  <img src={logoPreview} alt="Logo" className="w-full h-full object-contain" />
                </div>
              ) : (
                <div className="w-20 h-20 rounded-lg bg-white dark:bg-slate-800 flex items-center justify-center flex-shrink-0 border-2 border-dashed border-slate-300 dark:border-slate-600">
                  <ImageIcon size={24} className="text-slate-400" />
                </div>
              )}
              <div className="flex flex-col gap-2">
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleLogoSelect}
                />
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => logoInputRef.current?.click()}
                  disabled={isUploadingLogo}
                >
                  {isUploadingLogo ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
                  {logoPreview ? 'Cambiar logo' : 'Seleccionar logo'}
                </Button>
                {logoPreview && (
                  <Button type="button" variant="ghost" onClick={handleRemoveLogo}>
                    <Trash2 size={18} />
                    Eliminar logo
                  </Button>
                )}
                {logoFile && (
                  <p className="text-xs text-slate-500 truncate max-w-48">{logoFile.name}</p>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button type="submit" disabled={isSaving}>
              {isSaving ? <Loader2 className="animate-spin" /> : <Save size={18} />}
              <span className="ml-2">Guardar Configuración</span>
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default AppConfiguration;
