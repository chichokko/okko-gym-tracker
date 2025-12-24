import React, { useState, useEffect } from 'react';
import { Routine, Exercise } from '../types';
import { Card, Button, Input, IconButton, Select, Badge } from './ui';
import { Plus, Edit2, Trash2, ChevronRight, Save, Loader2 } from 'lucide-react';
import * as DataService from '../services/dataService';

const RoutineManager: React.FC = () => {
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [editingRoutine, setEditingRoutine] = useState<Routine | null>(null);

  useEffect(() => {
      const loadData = async () => {
        setIsLoading(true);
        const [r, e] = await Promise.all([
            DataService.getRoutines(),
            DataService.getExercises()
        ]);
        setRoutines(r);
        setExercises(e);
        setIsLoading(false);
      };
      loadData();
  }, []);

  const handleSaveRoutine = async () => {
      if (!editingRoutine) return;
      if (!editingRoutine.name.trim()) {
          alert("Por favor, ingresa un nombre para la rutina.");
          return;
      }

      setIsSaving(true);
      const success = await DataService.saveRoutine(editingRoutine);
      setIsSaving(false);

      if (success) {
          // Recargar rutinas para ver los cambios reflejados
          const updatedRoutines = await DataService.getRoutines();
          setRoutines(updatedRoutines);
          setEditingRoutine(null);
      } else {
          alert("Error al guardar la rutina. Inténtalo de nuevo.");
      }
  };

  const addExerciseToRoutine = () => {
    if (!editingRoutine) return;
    
    // Default to the first available exercise, or a placeholder if none exist
    const defaultExerciseId = exercises.length > 0 ? exercises[0].id : '';

    if (!defaultExerciseId) {
        alert("No hay ejercicios disponibles en la base de datos.");
        return;
    }

    setEditingRoutine({
      ...editingRoutine,
      exercises: [...editingRoutine.exercises, { 
          exerciseId: defaultExerciseId, 
          sets: 3, 
          reps: '10', 
          restSeconds: 120 // Default interno, no se muestra en UI
      }]
    });
  };

  const updateExerciseLine = (index: number, field: string, value: any) => {
    if (!editingRoutine) return;
    const newExercises = [...editingRoutine.exercises];
    newExercises[index] = { ...newExercises[index], [field]: value };
    setEditingRoutine({ ...editingRoutine, exercises: newExercises });
  };

  const removeExerciseLine = (index: number) => {
      if (!editingRoutine) return;
      const newExercises = editingRoutine.exercises.filter((_, i) => i !== index);
      setEditingRoutine({ ...editingRoutine, exercises: newExercises });
  };

  if (editingRoutine) {
    return (
      <div className="space-y-6 animate-in fade-in">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">{editingRoutine.id ? 'Editar Rutina' : 'Nueva Rutina'}</h2>
          <Button variant="ghost" onClick={() => setEditingRoutine(null)} disabled={isSaving}>Cancelar</Button>
        </div>

        <Card className="space-y-4">
          <Input 
            label="Nombre de la Rutina" 
            value={editingRoutine.name} 
            onChange={e => setEditingRoutine({...editingRoutine, name: e.target.value})}
            placeholder="Ej: Full Body Lunes"
          />
          <Input 
            label="Descripción" 
            value={editingRoutine.description || ''} 
            onChange={e => setEditingRoutine({...editingRoutine, description: e.target.value})}
            placeholder="Objetivo principal, duración estimada..."
          />
        </Card>

        <div className="space-y-4">
            <h3 className="font-bold text-lg">Ejercicios ({editingRoutine.exercises.length})</h3>
            
            {editingRoutine.exercises.map((ex, idx) => (
                <Card key={idx} className="relative p-4 gap-4 grid grid-cols-1 md:grid-cols-12 items-end bg-slate-50 dark:bg-slate-900/50">
                    <div className="md:col-span-1 flex items-center justify-center pb-3 md:pb-0">
                        <span className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-500">{idx + 1}</span>
                    </div>
                    <div className="md:col-span-6">
                        <Select 
                            label="Ejercicio" 
                            value={ex.exerciseId} 
                            onChange={e => updateExerciseLine(idx, 'exerciseId', e.target.value)}
                        >
                            {exercises.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                        </Select>
                    </div>
                    <div className="md:col-span-2">
                        <Input 
                            label="Series" 
                            type="number" 
                            value={ex.sets} 
                            onChange={e => updateExerciseLine(idx, 'sets', parseInt(e.target.value))} 
                        />
                    </div>
                    <div className="md:col-span-2">
                        <Input 
                            label="Reps" 
                            value={ex.reps} 
                            onChange={e => updateExerciseLine(idx, 'reps', e.target.value)} 
                            placeholder="Ej: 8-12"
                        />
                    </div>
                    {/* Columna de descanso eliminada de la UI */}
                    <div className="md:col-span-1 flex justify-center pb-2">
                        <IconButton onClick={() => removeExerciseLine(idx)} className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20">
                            <Trash2 size={18} />
                        </IconButton>
                    </div>
                </Card>
            ))}

            <Button variant="secondary" onClick={addExerciseToRoutine} fullWidth className="border-2 border-dashed border-gray-300 dark:border-slate-700">
                <Plus size={18} /> Añadir Ejercicio
            </Button>
        </div>

        <div className="pt-4 pb-8">
            <Button onClick={handleSaveRoutine} fullWidth variant="primary" disabled={isSaving}>
                {isSaving ? <Loader2 className="animate-spin" /> : <Save size={18} />}
                <span className="ml-2">{isSaving ? 'Guardando...' : 'Guardar Rutina'}</span>
            </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Rutinas</h1>
          <p className="text-slate-500 dark:text-slate-400">Plantillas de entrenamiento</p>
        </div>
        <Button onClick={() => setEditingRoutine({ id: '', name: '', exercises: [] })}>
          <Plus size={20} /> Nueva
        </Button>
      </div>

      {isLoading ? (
          <div className="flex justify-center py-20">
              <Loader2 className="animate-spin text-blue-500" size={32} />
          </div>
      ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {routines.map(routine => (
              <Card key={routine.id} className="flex flex-col justify-between hover:border-blue-500 transition-colors cursor-pointer group" onClick={() => setEditingRoutine(routine)}>
                <div>
                    <div className="flex justify-between items-start mb-2">
                        <h3 className="font-bold text-xl">{routine.name}</h3>
                        <Badge>{routine.exercises.length} Ejercicios</Badge>
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 line-clamp-2">{routine.description || 'Sin descripción'}</p>
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
                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-slate-800 flex justify-end text-blue-500 font-medium text-sm items-center gap-1 group-hover:gap-2 transition-all">
                    Editar <ChevronRight size={16} />
                </div>
              </Card>
            ))}
            
            {routines.length === 0 && (
                <div className="col-span-full py-12 text-center text-slate-500 border-2 border-dashed border-gray-200 dark:border-slate-800 rounded-xl">
                    <p>No tienes rutinas creadas.</p>
                    <Button variant="ghost" onClick={() => setEditingRoutine({ id: '', name: '', exercises: [] })} className="mt-2 text-blue-500">
                        Crear la primera
                    </Button>
                </div>
            )}
          </div>
      )}
    </div>
  );
};

export default RoutineManager;