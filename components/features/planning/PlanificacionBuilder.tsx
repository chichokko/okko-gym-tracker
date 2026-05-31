import React, { useState, useEffect } from 'react';
import { Planificacion, Routine, RoutineExercise, User } from '../../../types';
import { Card, Button, Input, IconButton, Select, PageHeader, toast, Badge } from '../../ui';
import { Save, Plus, Trash2, ArrowLeft, Loader2, Download, Printer, Edit2 } from 'lucide-react';
import * as DataService from '../../../services/dataService';
import { useGymData } from '../../../context/GymContext';
import generatePDF from './PlanificacionPDF';

interface PlanificacionBuilderProps {
  initialPlan: Planificacion;
  onClose: (needsRefresh: boolean) => void;
}

const PlanificacionBuilder: React.FC<PlanificacionBuilderProps> = ({ initialPlan, onClose }) => {
  const { exercises, students } = useGymData();
  const [plan, setPlan] = useState<Planificacion>(initialPlan);
  const [isSavingHeader, setIsSavingHeader] = useState(false);
  const [needsRefresh, setNeedsRefresh] = useState(false);
  
  // State for the Day/Routine being actively edited
  const [editingDay, setEditingDay] = useState<Routine | null>(null);
  const [isSavingDay, setIsSavingDay] = useState(false);

  // Refetch plan data to get days with full routine exercises
  const refetchPlan = async () => {
    if (!plan.id) return;
    const allPlans = await DataService.getPlanificaciones();
    const updated = allPlans.find((p: any) => p.id === plan.id);
    if (updated) {
      setPlan(updated);
    }
  };

  // 1. HEADER SAVING
  const handleSaveHeader = async () => {
    if (!plan.name.trim()) {
      toast.error('La planificación debe tener un nombre');
      return;
    }
    setIsSavingHeader(true);
    const savedPlan = await DataService.savePlanificacion(plan);
    if (savedPlan) {
      setPlan(savedPlan);
      setNeedsRefresh(true);
      toast.success('Cabecera de planificación guardada');
    } else {
      toast.error('Error al guardar planificación');
    }
    setIsSavingHeader(false);
  };

  // 2. ADD / EDIT DAY
  const handleAddNewDay = () => {
    if (!plan.id) {
      toast.error('Primero debes guardar la cabecera de la planificación');
      return;
    }
    setEditingDay({
      id: '',
      name: `Día ${plan.days.length + 1}`,
      exercises: []
    });
  };

  const handleEditDay = (dayLine: any) => {
    if (dayLine.routine) {
      setEditingDay({
        id: dayLine.routine.id,
        name: dayLine.routine.name,
        description: dayLine.routine.description,
        exercises: dayLine.routine.exercises || []
      });
    }
  };

  const handleDeleteDay = async (dayLine: any) => {
    if (!confirm('¿Estás seguro de eliminar este día de la planificación?')) return;
    const success = await DataService.removeRoutineFromPlan(dayLine.id);
    if (success) {
      toast.success('Día eliminado');
      await refetchPlan();
      setNeedsRefresh(true);
    } else {
      toast.error('Error al eliminar el día');
    }
  };

  const addExerciseToDay = () => {
    if (!editingDay) return;
    const defaultExId = exercises.length > 0 ? exercises[0].id : '';
    if (!defaultExId) {
      toast.warning('No hay ejercicios disponibles');
      return;
    }
    setEditingDay({
      ...editingDay,
      exercises: [...editingDay.exercises, {
        exerciseId: defaultExId,
        sets: 3,
        reps: '10',
        restSeconds: 120,
        rest: '90s',
        cadence: '2-0-1-0',
        observation: ''
      }]
    });
  };

  const updateExerciseLine = (index: number, field: keyof RoutineExercise, value: any) => {
    if (!editingDay) return;
    const newExercises = [...editingDay.exercises];
    newExercises[index] = { ...newExercises[index], [field]: value };
    setEditingDay({ ...editingDay, exercises: newExercises });
  };

  const removeExerciseLine = (index: number) => {
    if (!editingDay) return;
    const newExercises = editingDay.exercises.filter((_, i) => i !== index);
    setEditingDay({ ...editingDay, exercises: newExercises });
  };

  // 3. SAVE DAY (Save routine + link to plan)
  const handleSaveDay = async () => {
    if (!editingDay || !plan.id) return;
    if (!editingDay.name.trim()) {
      toast.error('El día debe tener un nombre');
      return;
    }

    setIsSavingDay(true);
    
    const isNew = !editingDay.id;
    const savedRoutine = await DataService.saveRoutine(editingDay);
    
    if (savedRoutine && savedRoutine.id) {
      if (isNew) {
        const linked = await DataService.addRoutineToPlan(plan.id, savedRoutine.id);
        if (!linked) {
          toast.error('Error al vincular el día a la planificación');
          setIsSavingDay(false);
          return;
        }
      }
      
      // Refetch from DB to get the full state with exercises
      await refetchPlan();
      setEditingDay(null);
      setNeedsRefresh(true);
      toast.success(isNew ? 'Día creado y vinculado exitosamente' : 'Día actualizado exitosamente');
    } else {
      toast.error('Error al guardar el día');
    }
    
    setIsSavingDay(false);
  };
  
  const handleExportPDF = async () => {
     generatePDF(plan, exercises, students);
  };

  return (
    <div className="space-y-6 animate-in fade-in pb-20">
      <PageHeader
        title={plan.id ? 'Editar Planificación' : 'Nueva Planificación'}
        action={
          <div className="flex gap-2">
            {plan.id && (
               <Button variant="secondary" onClick={handleExportPDF}>
                 <Download size={18} className="mr-2" /> Exportar PDF
               </Button>
            )}
            <Button variant="ghost" onClick={() => onClose(needsRefresh)}>
              <ArrowLeft size={20} /> Volver
            </Button>
          </div>
        }
      />

      {/* HEADER BUILDER */}
      <Card className="p-6">
        <h2 className="text-lg font-bold mb-4">Detalles Generales</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Nombre del Plan (Ej: Mesociclo 1 - Hipertrofia)"
            value={plan.name}
            onChange={e => setPlan({ ...plan, name: e.target.value })}
            required
          />
          <Select
            label="Tipo"
            value={plan.type}
            onChange={e => setPlan({ ...plan, type: e.target.value })}
          >
            <option value="Microciclo">Microciclo</option>
            <option value="Mesociclo">Mesociclo</option>
            <option value="Macrociclo">Macrociclo</option>
          </Select>
          <Input
            label="Duración (Ej: 4 semanas)"
            value={plan.duration || ''}
            onChange={e => setPlan({ ...plan, duration: e.target.value })}
          />
          <Select
            label="Alumno Asignado (Opcional)"
            value={plan.studentId || ''}
            onChange={e => setPlan({ ...plan, studentId: e.target.value })}
          >
            <option value="">-- Ninguno (Plantilla) --</option>
            {students.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </Select>
          <div className="md:col-span-2">
             <Input
               label="Descripción / Objetivos"
               value={plan.description || ''}
               onChange={e => setPlan({ ...plan, description: e.target.value })}
             />
          </div>
        </div>
        
        <div className="mt-4 flex justify-end">
          <Button onClick={handleSaveHeader} disabled={isSavingHeader}>
             {isSavingHeader ? <Loader2 className="animate-spin" /> : <Save size={18} />}
             <span className="ml-2">{plan.id ? 'Actualizar Cabecera' : 'Guardar y Continuar'}</span>
          </Button>
        </div>
      </Card>

      {/* DAYS / ROUTINES MANAGER */}
      {plan.id && !editingDay && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold">Días de Entrenamiento</h2>
            <Button size="sm" onClick={handleAddNewDay}>
              <Plus size={16} /> Añadir Día
            </Button>
          </div>
          
          {plan.days.length === 0 ? (
            <div className="p-8 text-center text-slate-500 bg-white dark:bg-slate-900 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
              Aún no hay días configurados. Haz clic en "Añadir Día" para comenzar.
            </div>
          ) : (
            <div className="grid gap-3">
              {plan.days.map((dayLine, i) => (
                 <Card key={dayLine.id} className="p-4 flex justify-between items-center hover:border-blue-500">
                    <div>
                      <h4 className="font-bold">Día {i+1}: {dayLine.routine?.name || 'Sin nombre'}</h4>
                      <p className="text-sm text-slate-500">{dayLine.routine?.exercises?.length || 0} ejercicios</p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleEditDay(dayLine)}>
                        <Edit2 size={14} className="mr-1" /> Editar
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteDay(dayLine)} className="text-red-500 hover:text-red-700">
                        <Trash2 size={14} />
                      </Button>
                    </div>
                 </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* DAY / ROUTINE EDITOR OVERLAY */}
      {editingDay && (
        <Card className="p-0 overflow-hidden border-blue-200 dark:border-blue-900 shadow-lg">
          <div className="bg-slate-50 dark:bg-slate-800/50 p-4 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center">
             <h3 className="font-bold text-lg">Configurar {editingDay.name || 'Día'}</h3>
             <Button variant="ghost" size="sm" onClick={() => setEditingDay(null)}>Cancelar</Button>
          </div>
          
          <div className="p-6 space-y-6">
            <Input
              label="Nombre del Día (Ej: Pierna Pesado)"
              value={editingDay.name}
              onChange={e => setEditingDay({ ...editingDay, name: e.target.value })}
            />
            
            <div className="space-y-4">
              <h4 className="font-semibold">Ejercicios</h4>
              {editingDay.exercises.map((ex, idx) => (
                <div key={idx} className="p-4 bg-slate-50 dark:bg-slate-900/30 rounded-lg border border-slate-200 dark:border-slate-700 grid gap-4 grid-cols-1 md:grid-cols-12 relative">
                   <div className="md:col-span-12 flex justify-between">
                     <span className="font-bold text-slate-500">#{idx + 1}</span>
                     <IconButton onClick={() => removeExerciseLine(idx)} className="text-red-500 h-6 w-6 p-0 hover:bg-transparent">
                       <Trash2 size={16} />
                     </IconButton>
                   </div>
                   
                   <div className="md:col-span-12">
                     <Select
                       label="Ejercicio"
                       value={ex.exerciseId}
                       onChange={e => updateExerciseLine(idx, 'exerciseId', e.target.value)}
                     >
                       {exercises.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                     </Select>
                   </div>
                   
                   <div className="md:col-span-3">
                     <Input label="Series" type="number" value={ex.sets} onChange={e => updateExerciseLine(idx, 'sets', parseInt(e.target.value))} />
                   </div>
                   <div className="md:col-span-3">
                     <Input label="Reps" value={ex.reps} onChange={e => updateExerciseLine(idx, 'reps', e.target.value)} placeholder="Ej: 8-12" />
                   </div>
                   <div className="md:col-span-3">
                     <Input label="Descanso" value={ex.rest || ''} onChange={e => updateExerciseLine(idx, 'rest', e.target.value)} placeholder="Ej: 90s" />
                   </div>
                   <div className="md:col-span-3">
                     <Input label="Cadencia" value={ex.cadence || ''} onChange={e => updateExerciseLine(idx, 'cadence', e.target.value)} placeholder="Ej: 2-0-1-0" />
                   </div>
                   <div className="md:col-span-12">
                     <Input label="Observaciones (Opcional)" value={ex.observation || ''} onChange={e => updateExerciseLine(idx, 'observation', e.target.value)} />
                   </div>
                </div>
              ))}
              
              <Button variant="secondary" onClick={addExerciseToDay} fullWidth className="border-dashed">
                <Plus size={16} /> Añadir Ejercicio
              </Button>
            </div>
            
            <div className="flex justify-end pt-4">
              <Button onClick={handleSaveDay} disabled={isSavingDay} variant="primary">
                 {isSavingDay ? <Loader2 className="animate-spin mr-2" /> : <Save size={16} className="mr-2" />}
                 Guardar Día en Plan
              </Button>
            </div>
          </div>
        </Card>
      )}

    </div>
  );
};

export default PlanificacionBuilder;
