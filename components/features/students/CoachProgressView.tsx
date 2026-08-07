import React, { useState } from 'react';
import { User } from '../../../types';
import { EmptyState, Card, ModernSelect, ModernSelectOption } from '../../ui';
import { Users, LayoutDashboard, History } from 'lucide-react';
import { useGymData } from '../../../context/GymContext';
import StudentDashboard from './StudentDashboard';
import SessionHistory from '../sessions/SessionHistory';

interface CoachProgressViewProps {
    user: User;
}

const CoachProgressView: React.FC<CoachProgressViewProps> = ({ user }) => {
    const { students, isLoading } = useGymData();
    const [selected, setSelected] = useState<User>(user);
    const [viewMode, setViewMode] = useState<'dashboard' | 'historial'>('dashboard');

    const options = [user, ...students];

    const avatarFor = (option: User, isSelf: boolean) => (
        <div
            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                isSelf ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-slate-700 text-gray-500 dark:text-gray-300'
            }`}
        >
            {isSelf ? 'Yo' : (option.firstName?.[0] || 'A')}
        </div>
    );

    const selectOptions: ModernSelectOption[] = options.map(option => ({
        value: option.id,
        label: option === user ? 'Yo' : `${option.firstName || ''} ${option.lastName || ''}`,
        leading: avatarFor(option, option === user)
    }));

    if (!isLoading && students.length === 0) {
        return (
            <div className="space-y-6 animate-in fade-in">
                <EmptyState
                    icon={Users}
                    message="Aún no tienes alumnos vinculados. Vincula alumnos desde la pestaña Alumnos para ver su progreso."
                />
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in pb-20">
            {/* Student Selector */}
            <Card className="p-4 sticky top-0 z-30 bg-white dark:bg-slate-900">
                <ModernSelect
                    value={selected.id}
                    options={selectOptions}
                    onChange={id => {
                        const option = options.find(o => o.id === id);
                        if (option) setSelected(option);
                    }}
                />

                {/* View Toggle */}
                <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg mt-4 self-start w-fit">
                    <button
                        onClick={() => setViewMode('dashboard')}
                        className={`flex items-center gap-2 px-4 py-1.5 text-xs font-bold rounded-md transition-colors ${viewMode === 'dashboard' ? 'bg-white dark:bg-slate-700 shadow text-blue-600' : 'text-slate-500'}`}
                    >
                        <LayoutDashboard size={14} /> Dashboard
                    </button>
                    <button
                        onClick={() => setViewMode('historial')}
                        className={`flex items-center gap-2 px-4 py-1.5 text-xs font-bold rounded-md transition-colors ${viewMode === 'historial' ? 'bg-white dark:bg-slate-700 shadow text-blue-600' : 'text-slate-500'}`}
                    >
                        <History size={14} /> Historial
                    </button>
                </div>
            </Card>

            {/* Selected Student View (same as student's own view) */}
            {viewMode === 'dashboard' ? (
                <StudentDashboard user={selected} key={selected.id} />
            ) : (
                <SessionHistory studentId={selected.id} key={selected.id} />
            )}
        </div>
    );
};

export default CoachProgressView;
