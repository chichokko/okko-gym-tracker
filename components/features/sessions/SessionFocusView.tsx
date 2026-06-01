import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Exercise, SessionExercise, SetLog } from '../../../types';
import { Card, Button, Badge, IconButton, Modal, Input, toast } from '../../ui';
import { Plus, ArrowLeft, PauseCircle, PlayCircle, RotateCcw, X, Search, Loader2 } from 'lucide-react';
import { ActiveSession, formatTime, generateId } from './types';
import * as DataService from '../../../services/dataService';
import { useGymData } from '../../../context/GymContext';

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
    // Exercise picker state
    const { refreshExercises } = useGymData();

    const [exercisePickerOpen, setExercisePickerOpen] = useState(false);
    const [exSearchTerm, setExSearchTerm] = useState('');
    const [isCreatingExercise, setIsCreatingExercise] = useState(false);
    const [newExName, setNewExName] = useState('');
    const [newExMuscle, setNewExMuscle] = useState('');
    const [newExAccessory, setNewExAccessory] = useState('');
    const exPickerContainerRef = useRef<HTMLDivElement>(null);

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

    const filteredExercises = useMemo(() => {
        if (!exSearchTerm) return availableExercises;
        const q = exSearchTerm.toLowerCase();
        return availableExercises.filter(e =>
            e.name.toLowerCase().includes(q) ||
            e.muscleGroup.toLowerCase().includes(q) ||
            (e.accessory && e.accessory.toLowerCase().includes(q))
        );
    }, [availableExercises, exSearchTerm]);

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

    const handleCreateExercise = async () => {
        if (!newExName.trim() || !newExMuscle.trim()) {
            toast.error('Nombre y grupo muscular son obligatorios');
            return;
        }
        setIsCreatingExercise(true);
        const success = await DataService.saveExercise({
            name: newExName.trim(),
            muscleGroup: newExMuscle.trim(),
            accessory: newExAccessory.trim() || undefined
        });
        if (success) {
            toast.success('Ejercicio creado');
            setNewExName('');
            setNewExMuscle('');
            setNewExAccessory('');
            await refreshExercises();
        } else {
            toast.error('Error al crear ejercicio');
        }
        setIsCreatingExercise(false);
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
                        <RotateCcw size={14} className={`mr-2 ${isLoading ? 'animate-spin' : ''}`} /> Sincronizar
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
                                    className="p-1 rounded hover:bg-red-50 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
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

            {/* Exercise Picker Modal */}
            <Modal
                isOpen={exercisePickerOpen}
                onClose={() => { setExercisePickerOpen(false); setExSearchTerm(''); }}
                title="Agregar Ejercicio"
                size="lg"
            >
                <div className="space-y-4">
                    <Input
                        placeholder="Buscar por nombre, grupo muscular o accesorio..."
                        value={exSearchTerm}
                        onChange={e => setExSearchTerm(e.target.value)}
                    />

                    <div className="max-h-48 overflow-y-auto space-y-1 border border-slate-200 dark:border-slate-700 rounded-lg">
                        {filteredExercises.length === 0 ? (
                            <p className="p-4 text-center text-slate-500 text-sm">No se encontraron ejercicios</p>
                        ) : (
                            filteredExercises.map(e => (
                                <button
                                    key={e.id}
                                    type="button"
                                    onClick={() => { handleAddExercise(e); setExercisePickerOpen(false); setExSearchTerm(''); }}
                                    className="w-full text-left px-4 py-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border-b border-slate-100 dark:border-slate-800 last:border-0"
                                >
                                    <div>
                                        <span className="font-medium text-sm">{e.name}</span>
                                        <span className="text-xs text-slate-500 ml-2">{e.muscleGroup}</span>
                                    </div>
                                    {e.accessory && (
                                        <Badge color="bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                                            {e.accessory}
                                        </Badge>
                                    )}
                                </button>
                            ))
                        )}
                    </div>

                    <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
                        <h4 className="text-sm font-semibold mb-3">Crear nuevo ejercicio</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                            <Input
                                placeholder="Nombre"
                                value={newExName}
                                onChange={e => setNewExName(e.target.value)}
                            />
                            <Input
                                placeholder="Grupo muscular"
                                value={newExMuscle}
                                onChange={e => setNewExMuscle(e.target.value)}
                            />
                            <Input
                                placeholder="Accesorio (opcional)"
                                value={newExAccessory}
                                onChange={e => setNewExAccessory(e.target.value)}
                            />
                        </div>
                        <Button
                            type="button"
                            size="sm"
                            onClick={handleCreateExercise}
                            disabled={isCreatingExercise}
                        >
                            {isCreatingExercise ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                            Crear
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default SessionFocusView;
