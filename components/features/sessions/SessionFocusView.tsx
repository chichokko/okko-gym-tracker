import React, { useState, useEffect } from 'react';
import { Exercise, SessionExercise, SetLog } from '../../../types';
import { Card, Button, Badge, IconButton } from '../../ui';
import { Plus, ArrowLeft, PauseCircle, PlayCircle, RotateCcw, X, Cloud } from 'lucide-react';
import { ActiveSession, formatTime, generateId } from './types';

interface SessionFocusViewProps {
    session: ActiveSession;
    availableExercises: Exercise[];
    isLoading: boolean;
    onBack: () => void;
    onSaveProgress: () => void;
    onFinishSession: () => void;
    onUpdateSession: (updater: (s: ActiveSession) => ActiveSession) => void;
}

const SessionFocusView: React.FC<SessionFocusViewProps> = ({
    session,
    availableExercises,
    isLoading,
    onBack,
    onSaveProgress,
    onFinishSession,
    onUpdateSession,
}) => {
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
                    <Button variant="secondary" className="h-9 px-3 text-xs" onClick={onSaveProgress} disabled={isLoading}>
                        <Cloud size={16} /> <span className="hidden sm:inline">Guardar</span>
                    </Button>
                    <Button variant="danger" className="h-9 px-3 text-xs" onClick={onFinishSession} disabled={isLoading}>
                        Terminar
                    </Button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 flex flex-col md:flex-row gap-6 overflow-hidden">
                {/* Exercise List */}
                <div className="md:w-1/3 overflow-y-auto no-scrollbar space-y-2 pb-20 md:pb-0">
                    {session.exercises.map(ex => (
                        <div
                            key={ex.id}
                            onClick={() => setActiveExercise(ex.id)}
                            className={`p-3 rounded-lg cursor-pointer border flex justify-between items-center ${session.activeExerciseId === ex.id
                                    ? 'bg-white dark:bg-slate-800 border-blue-500 shadow-sm'
                                    : 'border-transparent hover:bg-white dark:hover:bg-slate-800'
                                }`}
                        >
                            <div>
                                <div className="font-bold text-sm">{ex.exercise.name}</div>
                                <div className="text-xs text-slate-500">
                                    {ex.sets.filter(s => s.weight > 0 || s.reps > 0).length} / {ex.sets.length} series
                                </div>
                            </div>
                            {session.activeExerciseId === ex.id && <div className="w-2 h-2 rounded-full bg-blue-500" />}
                        </div>
                    ))}

                    {/* Add Exercise */}
                    <div className="mt-4 pt-4 border-t border-gray-100 dark:border-slate-800">
                        <p className="text-xs font-bold text-slate-400 uppercase mb-2">Añadir Ejercicio</p>
                        <div className="flex flex-wrap gap-2">
                            {availableExercises.slice(0, 5).map(ex => (
                                <button
                                    key={ex.id}
                                    onClick={() => handleAddExercise(ex)}
                                    className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full text-xs hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                                >
                                    + {ex.name}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Set Logger Panel */}
                <div className="md:w-2/3 flex flex-col bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800">
                    {activeExercise ? (
                        <>
                            {/* Exercise Header + Timer */}
                            <div className="p-4 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center bg-gray-50 dark:bg-slate-800/50 rounded-t-xl">
                                <div>
                                    <h3 className="text-xl font-bold">{activeExercise.exercise.name}</h3>
                                    {activeExercise.notes && (
                                        <Badge color="bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-300 border border-blue-100 dark:border-blue-900">
                                            {activeExercise.notes}
                                        </Badge>
                                    )}
                                </div>
                                <div className="flex items-center gap-2 bg-white dark:bg-slate-900 p-1.5 rounded-lg border border-gray-200 dark:border-slate-700 shadow-sm">
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

                            {/* Sets Grid */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-2">
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
                                                className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded text-center font-medium py-2 text-sm"
                                                value={set.rpe || ''}
                                                onChange={e => handleUpdateSet(set.id, 'rpe', Number(e.target.value))}
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
                            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 mt-auto">
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
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8 text-center">
                            <p>Selecciona un ejercicio de la izquierda o añade uno nuevo.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SessionFocusView;
