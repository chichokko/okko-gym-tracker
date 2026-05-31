import React, { useState, useRef } from 'react';
import { User, UserRole } from '../../../types';
import { Card, Input, Button, toast } from '../../ui';
import { updateUserProfile } from '../../../services/dataService';
import { updateUserEmail, updateUserPassword } from '../../../services/authService';
import { uploadImage } from '../../../services/storageService';
import { Save, Lock, Mail, User as UserIcon, Upload, Trash2, Loader2 } from 'lucide-react';

interface ProfileSettingsProps {
  user: User;
  onProfileUpdate: () => void;
}

const ProfileSettings: React.FC<ProfileSettingsProps> = ({ user, onProfileUpdate }) => {
  const [firstName, setFirstName] = useState(user.firstName || user.name.split(' ')[0] || '');
  const [lastName, setLastName] = useState(user.lastName || user.name.split(' ').slice(1).join(' ') || '');
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl || '');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState(user.avatarUrl || '');
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [email, setEmail] = useState(user.email || '');
  const [password, setPassword] = useState('');
  
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingEmail, setIsSavingEmail] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);

    let finalAvatarUrl = avatarUrl;

    if (avatarFile) {
      setIsUploadingAvatar(true);
      const url = await uploadImage('Avatares', avatarFile);
      setIsUploadingAvatar(false);
      if (url) {
        finalAvatarUrl = url;
        setAvatarUrl(url);
        setAvatarPreview(url);
        setAvatarFile(null);
      } else {
        toast.error('Error al subir la imagen');
        setIsSavingProfile(false);
        return;
      }
    }

    const success = await updateUserProfile(user.id, { firstName, lastName, avatarUrl: finalAvatarUrl });
    if (success) {
      toast.success('Perfil actualizado correctamente');
      onProfileUpdate();
    } else {
      toast.error('Error al actualizar el perfil');
    }
    setIsSavingProfile(false);
  };

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
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

    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemoveAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview('');
    setAvatarUrl('');
  };

  const handleSaveEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (email === user.email) return;
    
    setIsSavingEmail(true);
    const { error } = await updateUserEmail(email);
    if (error) {
      toast.error(`Error al actualizar email: ${error}`);
    } else {
      toast.success('Email actualizado. Revisa tu bandeja de entrada para confirmar.');
    }
    setIsSavingEmail(false);
  };

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || password.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setIsSavingPassword(true);
    const { error } = await updateUserPassword(password);
    if (error) {
      toast.error(`Error al actualizar contraseña: ${error}`);
    } else {
      toast.success('Contraseña actualizada correctamente');
      setPassword('');
    }
    setIsSavingPassword(false);
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
            <UserIcon size={24} />
          </div>
          <div>
            <h2 className="text-lg font-bold">Datos Personales</h2>
            <p className="text-sm text-slate-500">Actualiza tu nombre e imagen de perfil</p>
          </div>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Nombre"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
            />
            <Input
              label="Apellido"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
            />
          </div>
          
          {user.role === UserRole.COACH && (
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Avatar / Logo
              </label>
              <div className="flex items-start gap-4">
                {avatarPreview ? (
                  <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-slate-200 dark:border-slate-700 flex-shrink-0">
                    <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0 border-2 border-dashed border-slate-300 dark:border-slate-600">
                    <UserIcon size={24} className="text-slate-400" />
                  </div>
                )}
                <div className="flex flex-col gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarSelect}
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingAvatar}
                  >
                    {isUploadingAvatar ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
                    {avatarPreview ? 'Cambiar imagen' : 'Seleccionar imagen'}
                  </Button>
                  {avatarPreview && (
                    <Button type="button" variant="ghost" onClick={handleRemoveAvatar}>
                      <Trash2 size={18} />
                      Eliminar imagen
                    </Button>
                  )}
                  {avatarFile && (
                    <p className="text-xs text-slate-500 truncate max-w-48">{avatarFile.name}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <Button type="submit" disabled={isSavingProfile}>
              {isSavingProfile ? <Loader2 className="animate-spin" /> : <Save size={18} />}
              <span className="ml-2">Guardar Perfil</span>
            </Button>
          </div>
        </form>
      </Card>

      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg">
            <Mail size={24} />
          </div>
          <div>
            <h2 className="text-lg font-bold">Correo Electrónico</h2>
            <p className="text-sm text-slate-500">Cambia tu dirección de acceso</p>
          </div>
        </div>

        <form onSubmit={handleSaveEmail} className="space-y-4">
          <Input
            label="Nuevo Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <div className="flex justify-end">
            <Button type="submit" disabled={isSavingEmail || email === user.email}>
              {isSavingEmail ? <Loader2 className="animate-spin" /> : <Save size={18} />}
              <span className="ml-2">Actualizar Email</span>
            </Button>
          </div>
        </form>
      </Card>

      <Card className="p-6 border-red-200 dark:border-red-900/50">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg">
            <Lock size={24} />
          </div>
          <div>
            <h2 className="text-lg font-bold">Contraseña</h2>
            <p className="text-sm text-slate-500">Establece una nueva contraseña</p>
          </div>
        </div>

        <form onSubmit={handleSavePassword} className="space-y-4">
          <Input
            label="Nueva Contraseña"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mínimo 6 caracteres"
            required
          />
          <div className="flex justify-end">
            <Button type="submit" variant="danger" disabled={isSavingPassword || password.length < 6}>
              {isSavingPassword ? <Loader2 className="animate-spin" /> : <Save size={18} />}
              <span className="ml-2">Cambiar Contraseña</span>
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default ProfileSettings;
