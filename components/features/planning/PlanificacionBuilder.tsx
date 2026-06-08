import React, { useState, useEffect, useMemo } from 'react';
import { Planificacion, Routine, RoutineExercise, Exercise } from '../../../types';
import { Card, Button, Input, IconButton, Select, PageHeader, toast, Badge, Modal } from '../../ui';
import { Save, Plus, Trash2, ArrowLeft, Loader2, Download, Edit2, Search, GripVertical, ArrowUp, ArrowDown, ListOrdered } from 'lucide-react';
import * as DataService from '../../../services/dataService';
import { useGymData } from '../../../context/GymContext';
import generatePDF from './PlanificacionPDF';

const MUSCLE_GROUPS = [
    "Pierna", "Pecho", "Espalda", "Hombro", "Bíceps", "Tríceps", "Abdominales", "Cardio", "Full Body", "Otro"
];

const ACCESSORIES = [
    "Barra Olímpica", "Cuerda", "Mancuernas", "Máquina", "Polea"
];

interface PlanificacionBuilderProps {
  initialPlan: Planificacion;
  onClose: (needsRefresh: boolean) => void;
  readOnly?: boolean;
}

const PlanificacionBuilder: React.FC<PlanificacionBuilderProps> = ({ initialPlan, onClose, readOnly = false }) => {
  const { exercises, students, refreshExercises } = useGymData();
  const [plan, setPlan] = useState<Planificacion>(initialPlan);
  const [isSavingHeader, setIsSavingHeader] = useState(false);
  const [needsRefresh, setNeedsRefresh] = useState(false);
  
  // State for the Day/Routine being actively edited
  const [editingDay, setEditingDay] = useState<Routine | null>(null);
  const [isSavingDay, setIsSavingDay] = useState(false);

  // Existing active plan warning
  const [existingActivePlan, setExistingActivePlan] = useState<{ id: string; name: string } | null>(null);

  // When student changes, check if they already have an active plan
  useEffect(() => {
    if (!plan.studentId) {
      setExistingActivePlan(null);
      return;
    }
    if (plan.activo) {
      setExistingActivePlan(null);
      return;
    }
    DataService.getStudentActivePlan(plan.studentId).then(setExistingActivePlan);
  }, [plan.studentId, plan.activo]);

  // Reorder modal state
  const [reorderOpen, setReorderOpen] = useState(false);

  // Drag-and-drop state
  const [dragIdx, setDragIdx] = useState<number | null>(null);

  // State for exercise picker modal
  const [exercisePickerOpen, setExercisePickerOpen] = useState(false);
  const [pickerTargetIdx, setPickerTargetIdx] = useState<number | null>(null);
  const [exSearchTerm, setExSearchTerm] = useState('');
  const [isCreatingExercise, setIsCreatingExercise] = useState(false);
  const [newExName, setNewExName] = useState('');
  const [newExMuscle, setNewExMuscle] = useState('');
  const [newExAccessory, setNewExAccessory] = useState('');

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
      name: '',
      description: '',
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
  
  const filteredExercises = useMemo(() => {
    if (!exSearchTerm) return exercises;
    const q = exSearchTerm.toLowerCase();
    return exercises.filter(e =>
      e.name.toLowerCase().includes(q) ||
      e.muscleGroup.toLowerCase().includes(q) ||
      (e.accessory && e.accessory.toLowerCase().includes(q))
    );
  }, [exercises, exSearchTerm]);

  const handleSelectExercise = (exerciseId: string) => {
    if (pickerTargetIdx !== null) {
      updateExerciseLine(pickerTargetIdx, 'exerciseId', exerciseId);
    }
    setExercisePickerOpen(false);
    setPickerTargetIdx(null);
    setExSearchTerm('');
  };

  const handleCreateExercise = async () => {
    if (!newExName.trim() || !newExMuscle.trim()) {
      toast.error('Nombre y grupo muscular son obligatorios');
      return;
    }
    setIsCreatingExercise(true);
    const saved = await DataService.saveExercise({
      name: newExName.trim(),
      muscleGroup: newExMuscle.trim(),
      accessory: newExAccessory.trim() || undefined
    });
    if (saved) {
      toast.success('Ejercicio creado');
      setNewExName('');
      setNewExMuscle('');
      setNewExAccessory('');
      await refreshExercises();
      handleSelectExercise(saved.id);
    } else {
      toast.error('Error al crear ejercicio');
    }
    setIsCreatingExercise(false);
  };

  const handleExportPDF = async () => {
     generatePDF(plan, exercises, students);
  };

  const handleMoveDay = async (idx: number, direction: -1 | 1) => {
    const newIdx = idx + direction;
    if (newIdx < 0 || newIdx >= plan.days.length) return;

    const days = [...plan.days];
    const [moved] = days.splice(idx, 1);
    days.splice(newIdx, 0, moved);

    const updatedDays = days.map((d, i) => ({ ...d, orden: i + 1 }));
    setPlan({ ...plan, days: updatedDays });

    // Save new orden in DB
    for (const d of updatedDays) {
      await DataService.updateRoutineOrden(d.id, d.orden!);
    }
    setNeedsRefresh(true);
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
            disabled={readOnly}
          />
          <Select
            label="Tipo"
            value={plan.type}
            onChange={e => setPlan({ ...plan, type: e.target.value })}
            disabled={readOnly}
          >
            <option value="Microciclo">Microciclo</option>
            <option value="Mesociclo">Mesociclo</option>
            <option value="Macrociclo">Macrociclo</option>
          </Select>
          <Input
            label="Duración (Ej: 4 semanas)"
            value={plan.duration || ''}
            onChange={e => setPlan({ ...plan, duration: e.target.value })}
            disabled={readOnly}
          />
          <Select
            label="Alumno Asignado (Opcional)"
            value={plan.studentId || ''}
            onChange={e => setPlan({ ...plan, studentId: e.target.value })}
            disabled={readOnly}
          >
            <option value="">-- Ninguno (Plantilla) --</option>
            {students.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </Select>

           {existingActivePlan && (
             <div className="md:col-span-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-sm">
               <p className="font-medium text-amber-800 dark:text-amber-300">
                 ⚠ Este alumno ya tiene una planificación activa: <strong>{existingActivePlan.name}</strong>
               </p>
               <p className="text-amber-700 dark:text-amber-400 mt-1">
                 Al activar esta planificación, la anterior se desactivará automáticamente.
               </p>
             </div>
           )}

           <div className="md:col-span-2">
              <Input
                label="Descripción / Objetivos"
                value={plan.description || ''}
                onChange={e => setPlan({ ...plan, description: e.target.value })}
                disabled={readOnly}
              />
           </div>
           
           {!readOnly && plan.studentId && (
             <div className="md:col-span-2 flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
               <label className="relative inline-flex items-center cursor-pointer">
                 <input
                   type="checkbox"
                   className="sr-only peer"
                   checked={plan.activo || false}
                   onChange={async (e) => {
                     const checked = e.target.checked;
                     if (checked) {
                       const ok = await DataService.setActivePlanificacion(plan.id, plan.studentId!);
                       if (ok) {
                         setPlan({ ...plan, activo: true });
                         setNeedsRefresh(true);
                         toast.success('Planificación activada');
                       } else {
                         toast.error('Error al activar planificación');
                       }
                     } else {
                       const updated = await DataService.savePlanificacion({ ...plan, activo: false });
                       if (updated) {
                         setPlan({ ...plan, activo: false });
                         setNeedsRefresh(true);
                         toast.success('Planificación desactivada');
                       } else {
                         toast.error('Error al desactivar planificación');
                       }
                     }
                   }}
                 />
                 <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-slate-600 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
               </label>
               <div>
                 <span className="text-sm font-medium">Planificación activa</span>
                 <p className="text-xs text-slate-500">Las rutinas de esta planificación aparecerán al crear una sesión</p>
               </div>
             </div>
           )}
        </div>
        
        {!readOnly && (
          <div className="mt-4 flex justify-end">
            <Button onClick={handleSaveHeader} disabled={isSavingHeader}>
               {isSavingHeader ? <Loader2 className="animate-spin" /> : <Save size={18} />}
               <span className="ml-2">{plan.id ? 'Actualizar Cabecera' : 'Guardar y Continuar'}</span>
            </Button>
          </div>
        )}
      </Card>

      {/* DAYS / ROUTINES MANAGER */}
      {plan.id && !editingDay && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold">Días de Entrenamiento</h2>
            {!readOnly && plan.days.length > 0 && (
              <Button variant="secondary" size="sm" onClick={() => setReorderOpen(true)}>
                <ListOrdered size={16} /> Modificar orden
              </Button>
            )}
          </div>
          
          {plan.days.length === 0 ? (
            <div className="p-8 text-center text-slate-500 bg-white dark:bg-slate-900 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
              Aún no hay días configurados.
            </div>
          ) : (
            <div className="grid gap-3">
              {plan.days.map((dayLine, i) => (
                 <Card key={dayLine.id} className="p-4 flex justify-between items-center">
                    <div>
                      <h4 className="font-bold">Día {dayLine.orden || i + 1}: {dayLine.routine?.name || 'Sin nombre'}</h4>
                      <p className="text-sm text-slate-500">{dayLine.routine?.exercises?.length || 0} ejercicios</p>
                    </div>
                    {!readOnly && (
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleEditDay(dayLine)}>
                          <Edit2 size={14} className="mr-1" /> Editar
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteDay(dayLine)} className="text-red-500 hover:text-red-700">
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    )}
                 </Card>
              ))}
            </div>
          )}

          {!readOnly && (
            <Button variant="secondary" fullWidth className="border-dashed" onClick={handleAddNewDay}>
              <Plus size={16} /> Añadir Día
            </Button>
          )}
        </div>
      )}

      {/* DAY / ROUTINE EDITOR OVERLAY */}
      {!readOnly && editingDay && (
        <Card className="p-0 overflow-hidden border-blue-200 dark:border-blue-900 shadow-lg">
          <div className="bg-slate-50 dark:bg-slate-800/50 p-4 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center">
             <h3 className="font-bold text-lg">Configurar {editingDay.name || 'Día'}</h3>
             <Button variant="ghost" size="sm" onClick={() => setEditingDay(null)}>Cancelar</Button>
          </div>
          
          <div className="p-6 space-y-6">
            <Input
              label="Nombre del Día"
              value={editingDay.name}
              onChange={e => setEditingDay({ ...editingDay, name: e.target.value })}
              placeholder="Ej: Pierna Pesado"
            />
            
            <Input
              label="Descripción (Opcional)"
              value={editingDay.description || ''}
              onChange={e => setEditingDay({ ...editingDay, description: e.target.value })}
              placeholder="Enfoque del día, notas generales..."
            />
            
            <div className="space-y-4">
              <h4 className="font-semibold">Ejercicios</h4>
              {editingDay.exercises.map((ex, idx) => (
                <div
                  key={idx}
                  draggable
                  onDragStart={(e) => { setDragIdx(idx); e.dataTransfer.effectAllowed = 'move'; }}
                  onDragOver={(e) => { if (dragIdx !== null && dragIdx !== idx) { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; } }}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (dragIdx === null || dragIdx === idx) { setDragIdx(null); return; }
                    const newExercises = [...editingDay.exercises];
                    const [removed] = newExercises.splice(dragIdx, 1);
                    newExercises.splice(idx, 0, removed);
                    setEditingDay({ ...editingDay, exercises: newExercises });
                    setDragIdx(null);
                  }}
                  onDragEnd={() => setDragIdx(null)}
                  className={`p-4 rounded-lg border grid gap-4 grid-cols-1 md:grid-cols-12 relative transition-shadow ${dragIdx === idx ? 'opacity-50 shadow-inner' : ''} ${dragIdx !== null && dragIdx !== idx ? 'cursor-grab' : ''} bg-slate-50 dark:bg-slate-900/30 border-slate-200 dark:border-slate-700`}
                >
                   <div className="md:col-span-12 flex justify-between items-center">
                     <div className="flex items-center gap-2">
                       <GripVertical size={16} className="text-slate-400 cursor-grab" />
                       <span className="font-bold text-slate-500">#{idx + 1}</span>
                     </div>
                     <IconButton onClick={() => removeExerciseLine(idx)} className="text-red-500 h-6 w-6 p-0 hover:bg-transparent">
                       <Trash2 size={16} />
                     </IconButton>
                   </div>
                   
                   <div className="md:col-span-12">
                      <div className="flex flex-col gap-1 w-full">
                        <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Ejercicio</label>
                        <button
                          type="button"
                          onClick={() => { setPickerTargetIdx(idx); setExercisePickerOpen(true); }}
                          className="h-12 px-4 rounded-lg bg-gray-50 border border-gray-200 text-left text-slate-900 hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all dark:bg-slate-800 dark:border-slate-700 dark:text-white dark:focus:border-blue-500 dark:focus:ring-blue-900 flex items-center gap-2"
                        >
                          <Search size={16} className="text-slate-400 flex-shrink-0" />
                          <span className={ex.exerciseId ? '' : 'text-slate-400'}>
                            {exercises.find(e => e.id === ex.exerciseId)?.name || 'Seleccionar ejercicio...'}
                          </span>
                        </button>
                      </div>
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

      {/* REORDER MODAL */}
      <Modal
        isOpen={reorderOpen}
        onClose={() => setReorderOpen(false)}
        title="Modificar orden de días"
        size="md"
      >
        <div className="space-y-2">
          {[...plan.days].sort((a, b) => (a.orden || 0) - (b.orden || 0)).map((dayLine, idx) => (
            <div
              key={dayLine.id}
              className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700"
            >
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 flex items-center justify-center text-xs font-bold">
                  {dayLine.orden || idx + 1}
                </span>
                <span className="font-medium">{dayLine.routine?.name || 'Sin nombre'}</span>
              </div>
              <div className="flex gap-1">
                <IconButton
                  size="sm"
                  disabled={idx === 0}
                  onClick={() => handleMoveDay(idx, -1)}
                  className="disabled:opacity-30"
                >
                  <ArrowUp size={16} />
                </IconButton>
                <IconButton
                  size="sm"
                  disabled={idx === plan.days.length - 1}
                  onClick={() => handleMoveDay(idx, 1)}
                  className="disabled:opacity-30"
                >
                  <ArrowDown size={16} />
                </IconButton>
              </div>
            </div>
          ))}
        </div>
      </Modal>

      {/* EXERCISE PICKER MODAL */}
      <Modal
        isOpen={exercisePickerOpen}
        onClose={() => { setExercisePickerOpen(false); setPickerTargetIdx(null); setExSearchTerm(''); }}
        title="Seleccionar Ejercicio"
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
              filteredExercises.map(e => {
                const selected = pickerTargetIdx !== null && editingDay?.exercises[pickerTargetIdx]?.exerciseId === e.id;
                return (
                  <button
                    key={e.id}
                    type="button"
                    onClick={() => handleSelectExercise(e.id)}
                    className={`w-full text-left px-4 py-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border-b border-slate-100 dark:border-slate-800 last:border-0 ${
                      selected ? 'bg-blue-50 dark:bg-blue-900/20 ring-1 ring-blue-300' : ''
                    }`}
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
                );
              })
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
              <Select
                placeholder="Grupo muscular"
                value={newExMuscle}
                onChange={e => setNewExMuscle(e.target.value)}
              >
                <option value="">Seleccionar...</option>
                {MUSCLE_GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
              </Select>
              <Select
                placeholder="Accesorio (opcional)"
                value={newExAccessory}
                onChange={e => setNewExAccessory(e.target.value)}
              >
                <option value="">Ninguno</option>
                {ACCESSORIES.map(a => <option key={a} value={a}>{a}</option>)}
              </Select>
            </div>
            <Button
              type="button"
              size="sm"
              onClick={handleCreateExercise}
              disabled={isCreatingExercise}
            >
              {isCreatingExercise ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
              Crear y seleccionar
            </Button>
          </div>
        </div>
      </Modal>

    </div>
  );
};

export default PlanificacionBuilder;
