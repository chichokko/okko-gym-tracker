import React, { useState } from 'react';
import { Card, Badge, PageHeader, EmptyState, LoadingOverlay, Modal, PaginationBar } from '../../ui';
import { ClipboardList, User, Dumbbell, Clock, Repeat } from 'lucide-react';
import { useGymData } from '../../../context/GymContext';
import { Routine } from '../../../types';
import { usePagination } from '../../../hooks/usePagination';

const PAGE_SIZE = 6;

/**
 * RoutinesViewer - Readonly view of routines for Student role
 * Displays the same card layout as RoutineManager but without CRUD functionality
 */
const RoutinesViewer: React.FC = () => {
    const { routines, exercises, isLoading } = useGymData();
    const [selectedRoutine, setSelectedRoutine] = useState<Routine | null>(null);

    if (isLoading && routines.length === 0) return <LoadingOverlay message="Cargando rutinas..." />;

    const {
        paginatedData: paginatedRoutines,
        currentPage,
        totalPages,
        startEntry,
        endEntry,
        setCurrentPage,
        totalEntries
    } = usePagination<Routine>(routines, PAGE_SIZE);

    return (
        <div className="space-y-6">
            <PageHeader
                title="Rutinas"
                subtitle="Plantillas de entrenamiento disponibles"
            />

            {routines.length === 0 ? (
                <EmptyState
                    icon={ClipboardList}
                    message="No hay rutinas disponibles."
                />
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {paginatedRoutines.map(routine => (
                                <Card
                                    key={routine.id}
                                    className="flex flex-col justify-between cursor-pointer hover:border-blue-500 transition-all hover:shadow-md"
                                    onClick={() => setSelectedRoutine(routine)}
                                >
                                    <div>
                                        <div className="flex justify-between items-start mb-2">
                                            <h3 className="font-bold text-xl">{routine.name}</h3>
                                            <Badge>{routine.exercises.length} Ejercicios</Badge>
                                        </div>
                                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-2 line-clamp-2">{routine.description || 'Sin descripción'}</p>

                                        {/* Creator Info */}
                                        {routine.creatorName && (
                                            <div className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500 mb-4">
                                                <User size={12} />
                                                <span>Creado por {routine.creatorName}</span>
                                            </div>
                                        )}

                                        <div className="space-y-1 bg-gray-50 dark:bg-slate-800/50 p-3 rounded-lg">
                                            {routine.exercises.slice(0, 3).map((ex, i) => {
                                                const exName = exercises.find(e => e.id === ex.exerciseId)?.name || 'Ejercicio desconocido';
                                                return (
                                                    <div key={i} className="text-xs text-slate-600 dark:text-slate-300 flex justify-between">
                                                        <span className="truncate max-w-[60%]">• {exName}</span>
                                                        <span className="font-mono text-slate-400">{ex.sets} x {ex.reps}</span>
                                                    </div>
                                                )
                                            })}
                                            {routine.exercises.length > 3 && (
                                                <div className="text-xs text-slate-400 italic pt-1">+ {routine.exercises.length - 3} más...</div>
                                            )}
                                            {routine.exercises.length === 0 && (
                                                <div className="text-xs text-slate-400 italic">Sin ejercicios configurados</div>
                                            )}
                                        </div>
                                    </div>
                                </Card>
                            ))}
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

            {/* Routine Detail Modal */}
            <Modal
                isOpen={!!selectedRoutine}
                onClose={() => setSelectedRoutine(null)}
                title={selectedRoutine?.name || 'Detalle de Rutina'}
                size="lg"
            >
                {selectedRoutine && (
                    <div className="space-y-6">
                        {/* Header Info */}
                        <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg border border-slate-100 dark:border-slate-800">
                            <p className="text-sm text-slate-600 dark:text-slate-300 mb-3">
                                {selectedRoutine.description || 'Sin descripción disponible.'}
                            </p>

                            <div className="flex flex-wrap gap-4 text-xs font-medium text-slate-500">
                                <div className="flex items-center gap-1.5">
                                    <Dumbbell size={14} className="text-blue-500" />
                                    <span>{selectedRoutine.exercises.length} Ejercicios</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <Clock size={14} className="text-green-500" />
                                    <span>~{selectedRoutine.exercises.length * 4} min estimados</span>
                                </div>
                                {selectedRoutine.creatorName && (
                                    <div className="flex items-center gap-1.5">
                                        <User size={14} className="text-purple-500" />
                                        <span>Coach: {selectedRoutine.creatorName}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Exercises List */}
                        <div className="space-y-3">
                            <h4 className="font-bold text-sm uppercase text-slate-400">Ejercicios</h4>
                            {selectedRoutine.exercises.map((ex, index) => {
                                const exerciseDetails = exercises.find(e => e.id === ex.exerciseId);
                                return (
                                    <div key={index} className="flex gap-4 p-3 border-b border-gray-100 dark:border-slate-800 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/30 rounded-lg transition-colors">
                                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-sm">
                                            {index + 1}
                                        </div>
                                        <div className="flex-grow">
                                            <h5 className="font-bold text-slate-900 dark:text-white">
                                                {exerciseDetails?.name || 'Ejercicio desconocido'}
                                            </h5>
                                            <p className="text-xs text-slate-500">{exerciseDetails?.muscleGroup || 'General'}</p>
                                        </div>
                                        <div className="flex-shrink-0 text-right">
                                            <div className="font-mono font-bold text-lg text-slate-700 dark:text-slate-200">
                                                {ex.sets} <span className="text-xs font-sans text-slate-400">series</span>
                                            </div>
                                            <div className="text-xs text-slate-500 flex items-center justify-end gap-1">
                                                <Repeat size={12} /> {ex.reps} reps
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}

                            {selectedRoutine.exercises.length === 0 && (
                                <div className="text-center py-8 text-slate-400">
                                    No hay ejercicios configurados en esta rutina.
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default RoutinesViewer;
