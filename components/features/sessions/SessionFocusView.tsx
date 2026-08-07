import React, { useState, useEffect, useCallback } from 'react';
import { Exercise, SessionExercise, SetLog } from '../../../types';
import { Button, Badge, IconButton, ExercisePickerModal, Drawer, Modal, LoadingSpinner } from '../../ui';
import { Plus, ArrowLeft, PauseCircle, PlayCircle, RotateCcw, X, ClipboardClock } from 'lucide-react';
import { ActiveSession, formatTime, generateId } from './types';
import { getLastSessionExerciseLogs, PreviousExerciseLog } from '../../../services/dataService';

import { useConfirm } from '../../../hooks/useConfirm';
import { ConfirmDialog } from '../../ui/animations';
import confetti from 'canvas-confetti';

interface SessionFocusViewProps {
    session: ActiveSession;
    availableExercises: Exercise[];
    isLoading: boolean;
    onBack: () => void;
    onFinishSession: () => void;
    onUpdateSession: (updater: (s: ActiveSession) => ActiveSession) => void;
}

const SessionFocusView: React.FC<SessionFocusViewProps> = ({
    session,
    availableExercises,
    isLoading,
    onBack,
    onFinishSession,
    onUpdateSession,
}) => {
    const [exercisePickerOpen, setExercisePickerOpen] = useState(false);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [previaOpen, setPreviaOpen] = useState(false);
    const [previaLoading, setPreviaLoading] = useState(false);
    const [previaData, setPreviaData] = useState<PreviousExerciseLog | null>(null);

    const finishConfirm = useConfirm();

    const handleFinishClick = useCallback(async () => {
        const ok = await finishConfirm.confirm({ message: `¿Terminar entrenamiento de ${session.student.name}?`, confirmLabel: 'Finalizar', variant: 'danger' });
        if (!ok) return;
        confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
        });
        setTimeout(() => onFinishSession(), 500);
    }, [session.student.name, onFinishSession]);

    // Timer state
    const [globalTimer, setGlobalTimer] = useState(0);
    const [isTimerRunning, setIsTimerRunning] = useState(false);

    useEffect(() => {
        let interval: any;
        if (isTimerRunning) {
            interval = setInterval(() => setGlobalTimer(prev => prev + 1), 1000);
        }
        return () => clearInterval(interval);
    }, [isTimerRunning]);

    const toggleTimer = () => setIsTimerRunning(!isTimerRunning);
    const resetTimer = () => {
        setIsTimerRunning(false);
        setGlobalTimer(0);
    };

    const activeExercise = session.exercises.find(e => e.id === session.activeExerciseId);

    const openPrevia = useCallback(async () => {
        if (!activeExercise) return;
        setPreviaOpen(true);
        setPreviaLoading(true);
        setPreviaData(null);
        const data = await getLastSessionExerciseLogs(session.student.id, activeExercise.exercise.id);
        setPreviaData(data);
        setPreviaLoading(false);
    }, [activeExercise, session.student.id]);


    const handleDeleteExercise = (exId: string) => {
        onUpdateSession(s => ({
            ...s,
            exercises: s.exercises.filter(ex => ex.id !== exId),
            activeExerciseId: s.activeExerciseId === exId
                ? (s.exercises.find(ex => ex.id !== exId)?.id || null)
                : s.activeExerciseId
        }));
    };

    const handleAddExercise = (exBase: Exercise) => {
        const newEx: SessionExercise = {
            id: generateId(),
            exercise: exBase,
            sets: []
        };
        onUpdateSession(s => ({
            ...s,
            exercises: [...s.exercises, newEx],
            activeExerciseId: newEx.id
        }));
        setDrawerOpen(true);
    };

    const handleAddSet = (weight = 0, reps = 0, rpe = 0) => {
        if (!activeExercise) return;
        const newSet: SetLog = {
            id: generateId(),
            weight, reps, rpe,
            completedAt: new Date()
        };
        onUpdateSession(s => ({
            ...s,
            exercises: s.exercises.map(ex =>
                ex.id === activeExercise.id ? { ...ex, sets: [...ex.sets, newSet] } : ex
            )
        }));
    };

    const handleUpdateSet = (setId: string, field: keyof SetLog, val: number) => {
        onUpdateSession(s => ({
            ...s,
            exercises: s.exercises.map(ex => ({
                ...ex,
                sets: ex.sets.map(set => set.id === setId ? { ...set, [field]: val } : set)
            }))
        }));
    };

    const handleDeleteSet = (setId: string) => {
        if (!activeExercise) return;
        onUpdateSession(s => ({
            ...s,
            exercises: s.exercises.map(ex =>
                ex.id === activeExercise.id
                    ? { ...ex, sets: ex.sets.filter(set => set.id !== setId) }
                    : ex
            )
        }));
    };


    const setActiveExercise = (exId: string) => {
        onUpdateSession(s => ({ ...s, activeExerciseId: exId }));
    };

    return (
        <div className="h-full flex flex-col animate-in slide-in-from-right-5 pb-20">
            {/* Header */}
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                    <IconButton onClick={onBack}><ArrowLeft /></IconButton>
                    <div>
                        <h2 className="font-bold text-lg leading-none">{session.student.name}</h2>
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-500">{session.routineName}</span>
                            {isLoading && <span className="text-xs text-blue-500 animate-pulse">Guardando...</span>}
                        </div>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="danger" className="h-9 px-3 text-xs" onClick={handleFinishClick} disabled={isLoading}>
                        Terminar
                    </Button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 flex flex-col md:flex-row gap-6 overflow-hidden">
                {/* Exercise List */}
                <div className="md:w-2/5 xl:w-1/3 overflow-y-auto no-scrollbar space-y-2 pb-20 md:pb-0">
                    {session.exercises.map(ex => (
                        <div
                            key={ex.id}
                            onClick={() => { setActiveExercise(ex.id); setDrawerOpen(true); }}
                            className={`p-3 rounded-lg cursor-pointer border flex justify-between items-center group ${session.activeExerciseId === ex.id
                                ? 'bg-white dark:bg-slate-800 border-blue-500 shadow-sm'
                                : 'border-transparent hover:bg-white dark:hover:bg-slate-800'
                                }`}
                        >
                            <div className="flex-1 min-w-0">
                                <div className="font-bold text-sm truncate">{ex.exercise.name}</div>
                                <div className="text-xs text-slate-500">
                                    {ex.sets.filter(s => s.weight > 0 || s.reps > 0).length} / {ex.sets.length} series
                                </div>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                                {session.activeExerciseId === ex.id && <div className="w-2 h-2 rounded-full bg-blue-500" />}
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleDeleteExercise(ex.id); }}
                                    className="p-1 rounded hover:bg-red-50 text-slate-400 hover:text-red-600"
                                    title="Eliminar ejercicio"
                                >
                                    <X size={14} />
                                </button>
                            </div>
                        </div>
                    ))}

                    {/* Add Exercise */}
                    <div className="mt-4 pt-4 border-t border-gray-100 dark:border-slate-800">
                        <Badge color="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 mb-2">nuevo ejercicio</Badge>
                        <Button
                            variant="secondary"
                            fullWidth
                            onClick={() => setExercisePickerOpen(true)}
                        >
                            <Plus size={16} /> Agregar
                        </Button>
                    </div>
                </div>

                {/* Hint Panel (desktop, no active exercise) */}
                {!activeExercise && (
                    <div className="hidden md:flex md:w-3/5 xl:w-2/3 flex-col items-center justify-center text-slate-400 p-8 text-center bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800">
                        <p>Selecciona un ejercicio de la izquierda o añade uno nuevo para registrar tus series.</p>
                    </div>
                )}
            </div>

            {/* Set Logger Drawer */}
            <Drawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} title={activeExercise?.exercise.name || 'Nuevo ejercicio'}>
                {activeExercise && (
                    <>
                        {/* Exercise Header + Timer */}
                        <div className="flex items-center justify-between gap-3 mb-4">
                            <div>
                                {activeExercise.notes && (
                                    <Badge color="bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-300 border border-blue-100 dark:border-blue-900">
                                        {activeExercise.notes}
                                    </Badge>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={openPrevia}
                                    title="Previa"
                                    className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors"
                                >
                                    <ClipboardClock size={20} />
                                </button>
                                <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 p-1.5 rounded-lg border border-gray-200 dark:border-slate-700 shadow-sm">
                                <div className={`font-mono font-bold text-lg w-16 text-center ${isTimerRunning ? 'text-blue-500' : 'text-slate-600 dark:text-slate-300'}`}>
                                    {formatTime(globalTimer)}
                                </div>
                                <div className="flex gap-1">
                                    <button onClick={toggleTimer} className={`p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${isTimerRunning ? 'text-blue-500' : 'text-slate-500'}`}>
                                        {isTimerRunning ? <PauseCircle size={20} /> : <PlayCircle size={20} />}
                                    </button>
                                    <button onClick={resetTimer} className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-red-500 transition-colors">
                                        <RotateCcw size={18} />
                                    </button>
                                </div>
                                </div>
                            </div>
                        </div>

                        {/* Sets Grid */}
                        <div className="space-y-2 mb-4">
                            <div className="grid grid-cols-10 gap-2 px-2 text-xs font-bold text-slate-400 uppercase">
                                <div className="col-span-1 text-center">#</div>
                                <div className="col-span-3 text-center">KG</div>
                                <div className="col-span-3 text-center">Reps</div>
                                <div className="col-span-2 text-center">RPE</div>
                            </div>
                            {activeExercise.sets.map((set, idx) => (
                                <div key={set.id} className="grid grid-cols-10 gap-2 items-center animate-in slide-in-from-left-2 fade-in duration-300">
                                    <div className="col-span-1 text-center font-bold text-slate-500">{idx + 1}</div>
                                    <div className="col-span-3">
                                        <input
                                            type="number"
                                            className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded text-center font-bold py-2 focus:ring-2 ring-blue-500"
                                            value={set.weight || ''}
                                            onChange={e => handleUpdateSet(set.id, 'weight', Number(e.target.value))}
                                            placeholder="-"
                                        />
                                    </div>
                                    <div className="col-span-3">
                                        <input
                                            type="number"
                                            className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded text-center font-bold py-2 focus:ring-2 ring-blue-500"
                                            value={set.reps || ''}
                                            onChange={e => handleUpdateSet(set.id, 'reps', Number(e.target.value))}
                                            placeholder="-"
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <input
                                            type="number"
                                            min={1}
                                            max={10}
                                            step={1}
                                            className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded text-center font-medium py-2 text-sm"
                                            value={set.rpe || ''}
                                            onChange={e => {
                                                const val = Number(e.target.value);
                                                if (val >= 0 && val <= 10) handleUpdateSet(set.id, 'rpe', val);
                                            }}
                                            placeholder="-"
                                        />
                                    </div>
                                    <div className="col-span-1 flex justify-center">
                                        <button className="text-slate-300 hover:text-red-500" onClick={() => handleDeleteSet(set.id)}>
                                            <X size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Add Set Button */}
                        <div className="sticky bottom-0 bg-white dark:bg-slate-900 pt-2">
                            <Button
                                fullWidth
                                onClick={() => {
                                    const lastSet = activeExercise.sets[activeExercise.sets.length - 1];
                                    handleAddSet(lastSet?.weight, lastSet?.reps, 8);
                                }}
                            >
                                <Plus size={18} /> Añadir Serie
                            </Button>
                        </div>
                    </>
                )}
            </Drawer>

            <ExercisePickerModal
                isOpen={exercisePickerOpen}
                onClose={() => setExercisePickerOpen(false)}
                onSelect={(exercise) => { handleAddExercise(exercise); setExercisePickerOpen(false); }}
            />

            {/* Previa Modal: últimos registros del ejercicio en la última sesión */}
            <Modal
                isOpen={previaOpen}
                onClose={() => setPreviaOpen(false)}
                title={activeExercise?.exercise.name || 'Previa'}
            >
                {previaLoading ? (
                    <div className="flex justify-center py-8">
                        <LoadingSpinner />
                    </div>
                ) : !previaData || previaData.sets.length === 0 ? (
                    <p className="text-slate-500 dark:text-slate-400 text-center py-8">
                        Sin registros previos de este ejercicio.
                    </p>
                ) : (
                    <>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                            Última sesión: <strong className="text-slate-900 dark:text-white">{previaData.date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })}</strong>
                        </p>
                        <div className="space-y-2">
                            {previaData.sets.map(set => (
                                <div key={set.nroSerie} className="flex items-center justify-between gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                                    <span className="font-bold text-slate-500 dark:text-slate-400 w-6 text-center">{set.nroSerie}</span>
                                    <span className="font-bold text-slate-900 dark:text-white flex-1">
                                        {set.weight} kg × {set.reps}
                                    </span>
                                    {set.rpe > 0 && (
                                        <Badge color="bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-300 border border-blue-100 dark:border-blue-900">
                                            {set.rpe} RPE
                                        </Badge>
                                    )}
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </Modal>

            <ConfirmDialog {...finishConfirm.getDialogProps()} />
        </div>
    );
};

export default SessionFocusView;
