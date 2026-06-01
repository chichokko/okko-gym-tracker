import React, { useState } from 'react';
import { User, UserRole } from '../../../types';
import { PageHeader } from '../../ui';
import ProfileSettings from './ProfileSettings';
import AppConfiguration from './AppConfiguration';

interface SettingsViewProps {
  user: User;
}

const SettingsView: React.FC<SettingsViewProps> = ({ user }) => {
  const isStudent = user.role === UserRole.STUDENT;
  const [activeTab, setActiveTab] = useState<'profile' | 'config'>('profile');

  const handleUpdate = () => {
    window.location.reload();
  };

  return (
    <div className="space-y-6 animate-in fade-in pb-20">
      <PageHeader
        title="Configuración"
        subtitle={isStudent ? 'Gestiona tu perfil' : 'Gestiona tu perfil y preferencias'}
      />

      {!isStudent && (
        <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-lg w-full max-w-md mx-auto sm:mx-0">
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-all ${
              activeTab === 'profile'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            Perfil
          </button>
          <button
            onClick={() => setActiveTab('config')}
            className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-all ${
              activeTab === 'config'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            Preferencias
          </button>
        </div>
      )}

      <div className="mt-6">
        {isStudent || activeTab === 'profile' ? (
          <ProfileSettings user={user} onProfileUpdate={handleUpdate} />
        ) : (
          <AppConfiguration user={user} onConfigUpdate={handleUpdate} />
        )}
      </div>
    </div>
  );
};

export default SettingsView;
