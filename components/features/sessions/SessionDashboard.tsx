import React, { useMemo } from 'react';
import { Card, Button, PageHeader, EmptyState, LoadingOverlay, PaginationBar, FloatingActionButton } from '../../ui';
import { TypewriterText } from '../../ui/animations';
import { Plus, Users, X } from 'lucide-react';
import { ActiveSession } from './types';
import { usePagination } from '../../../hooks/usePagination';

const PAGE_SIZE = 6;

interface SessionDashboardProps {
    activeSessions: ActiveSession[];
    isLoading: boolean;
    onStartNew: () => void;
    onSelectSession: (sessionId: string) => void;
    onDiscardSession: (sessionId: string) => void;
}

const SessionDashboard: React.FC<SessionDashboardProps> = ({
    activeSessions,
    isLoading,
    onStartNew,
    onSelectSession,
    onDiscardSession,
}) => {
    const {
        paginatedData: paginatedSessions,
        currentPage,
        totalPages,
        startEntry,
        endEntry,
        setCurrentPage,
        totalEntries
    } = usePagination<ActiveSession>(activeSessions, PAGE_SIZE);

    if (isLoading) {
        return <LoadingOverlay message="Cargando sesiones..." />;
    }

    return (
        <div className="space-y-6 animate-in fade-in pb-20">
            <PageHeader
                title={<TypewriterText text="Sala de Musculación" />}
                subtitle={`${activeSessions.length} ${activeSessions.length === 1 ? 'Alumno' : 'Alumnos'} entrenando ahora`}
                action={
                    <Button onClick={onStartNew} className="hidden md:inline-flex">
                        <Plus size={20} /> Iniciar
                    </Button>
                }
            />

            {activeSessions.length === 0 ? (
                <EmptyState
                    icon={Users}
                    message="No hay alumnos entrenando actualmente."
                    action={
                        <Button onClick={onStartNew} className="hidden md:inline-flex">
                            <Plus size={18} /> Iniciar Sesión
                        </Button>
                    }
                />
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {paginatedSessions.map(session => {
                        const totalSets = session.exercises.reduce((acc, ex) => acc + ex.sets.length, 0);
                        const setsStarted = session.exercises
                            .flatMap(e => e.sets)
                            .filter(s => s.weight > 0 || s.reps > 0).length;

                        return (
                            <Card
                                key={session.internalId}
                                className="relative overflow-hidden"
                            >
                                <div className="absolute top-0 left-0 w-1 h-full bg-blue-500" />
                                <div className="pl-3">
                                    <div className="cursor-pointer" onClick={() => onSelectSession(session.internalId)}>
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-600 dark:text-slate-300">
                                                {session.student.name[0]}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-lg leading-tight">{session.student.name}</h3>
                                                <p className="text-xs text-slate-500">{session.routineName}</p>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse mb-1" />
                                            <span className="text-[10px] text-slate-400">En curso</span>
                                        </div>
                                    </div>

                                    <div className="mt-4 pt-4 border-t border-gray-100 dark:border-slate-800 flex justify-between text-sm text-slate-500 dark:text-slate-400">
                                        <span>{session.exercises.length} Ejercicios</span>
                                        <span>{setsStarted} / {totalSets} Series iniciadas</span>
                                    </div>
                                </div>
                                <div className="mt-3 pt-3 border-t border-gray-100 dark:border-slate-800">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); onDiscardSession(session.internalId); }}
                                        className="w-full py-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 text-sm font-medium transition-colors"
                                    >
                                        Cancelar Sesión
                                    </button>
                                </div>
                            </div>
                            </Card>
                        );
                    })}
                    <div className="md:col-span-2">
                        <PaginationBar
                            currentPage={currentPage}
                            totalPages={totalPages}
                            startEntry={startEntry}
                            endEntry={endEntry}
                            totalEntries={totalEntries}
                            onPageChange={setCurrentPage}
                        />
                    </div>
                </div>
            )}
            <FloatingActionButton
                onClick={onStartNew}
                icon={<Plus size={24} />}
                label="Iniciar sesión"
            />
        </div>
    );
};

export default SessionDashboard;
