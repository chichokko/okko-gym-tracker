import React, { useState } from 'react';
import { Exercise } from '../../../types';
import { Card, Button, Input, IconButton, Select, Badge, PageHeader, EmptyState, LoadingOverlay, MobileCardList } from '../../ui';
import { Plus, Edit2, Trash2, Search, Dumbbell, Save, X, Loader2 } from 'lucide-react';
import * as DataService from '../../../services/dataService';
import { useGymData } from '../../../context/GymContext';
import { toast } from '../../ui';

const MUSCLE_GROUPS = [
    "Pierna", "Pecho", "Espalda", "Hombro", "Bíceps", "Tríceps", "Abdominales", "Cardio", "Full Body", "Otro"
];

const ExerciseManager: React.FC = () => {
    const { exercises, isLoading, refreshExercises, refreshRoutines } = useGymData();
    const [searchTerm, setSearchTerm] = useState('');

    // Form State
    const [isEditing, setIsEditing] = useState(false);
    const [currentExercise, setCurrentExercise] = useState<Partial<Exercise>>({ name: '', muscleGroup: 'Otro' });
    const [isSaving, setIsSaving] = useState(false);

    const filteredExercises = exercises.filter(ex =>
        ex.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ex.muscleGroup.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleEdit = (ex: Exercise) => {
        setCurrentExercise(ex);
        setIsEditing(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (id: string) => {
        // Optimistic delete could be risky if validation fails on server, but good for UI. 
        // For now, standard way.
        toast.promise(
            async () => {
                const success = await DataService.deleteExercise(id);
                if (!success) throw new Error("Error al eliminar");
                await Promise.all([refreshExercises(), refreshRoutines()]); // Refresh routines too as they might depend on this
            },
            {
                loading: 'Eliminando ejercicio...',
                success: 'Ejercicio eliminado',
                error: 'No se pudo eliminar el ejercicio'
            }
        );
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentExercise.name) return;

        setIsSaving(true);
        const success = await DataService.saveExercise(currentExercise);

        if (success) {
            await refreshExercises();
            toast.success("Ejercicio guardado");
            setIsEditing(false);
            setCurrentExercise({ name: '', muscleGroup: 'Otro' });
        } else {
            toast.error("Error al guardar el ejercicio");
        }
        setIsSaving(false);
    };

    const handleCancel = () => {
        setIsEditing(false);
        setCurrentExercise({ name: '', muscleGroup: 'Otro' });
    };

    if (isLoading && exercises.length === 0) return <LoadingOverlay message="Cargando ejercicios..." />;

    return (
        <div className="space-y-6 animate-in fade-in pb-20">
            <PageHeader
                title="Ejercicios"
                subtitle={`Biblioteca de movimientos (${exercises.length})`}
                action={
                    !isEditing && (
                        <Button onClick={() => setIsEditing(true)}>
                            <Plus size={20} /> Nuevo Ejercicio
                        </Button>
                    )
                }
            />

            {/* Form Area using helper components */}
            {isEditing && (
                <Card className="border-2 border-blue-500/20 shadow-lg mb-6">
                    <form onSubmit={handleSave} className="space-y-4">
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="font-bold text-lg">{currentExercise.id ? 'Editar Ejercicio' : 'Crear Nuevo Ejercicio'}</h3>
                            <IconButton onClick={handleCancel} type="button"><X size={20} /></IconButton>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input
                                label="Nombre del Ejercicio"
                                value={currentExercise.name}
                                onChange={e => setCurrentExercise({ ...currentExercise, name: e.target.value })}
                                placeholder="Ej: Press de Banca"
                                required
                                autoFocus
                            />
                            <Select
                                label="Grupo Muscular"
                                value={currentExercise.muscleGroup}
                                onChange={e => setCurrentExercise({ ...currentExercise, muscleGroup: e.target.value })}
                            >
                                {MUSCLE_GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
                            </Select>
                        </div>
                        <div className="flex justify-end gap-2 pt-2">
                            <Button type="button" variant="ghost" onClick={handleCancel} disabled={isSaving}>Cancelar</Button>
                            <Button type="submit" disabled={isSaving}>
                                {isSaving ? <Loader2 className="animate-spin" /> : <Save size={18} />}
                                <span className="ml-2">Guardar</span>
                            </Button>
                        </div>
                    </form>
                </Card>
            )}

            {/* Search Bar */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <Input
                    className="pl-10"
                    placeholder="Buscar por nombre o grupo muscular..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
            </div>

            {filteredExercises.length === 0 ? (
                <EmptyState icon={Dumbbell} message="No se encontraron ejercicios." />
            ) : (
                <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800 overflow-hidden">
                    <div className="overflow-x-auto">
                        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800 overflow-hidden">
                            {/* Desktop View */}
                            <div className="hidden md:block overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-gray-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">
                                            <th className="p-4 font-bold rounded-tl-lg">Nombre</th>
                                            <th className="p-4 font-bold">Grupo Muscular</th>
                                            <th className="p-4 font-bold text-right rounded-tr-lg">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                                        {filteredExercises.map((ex) => (
                                            <tr key={ex.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/30 transition-colors group">
                                                <td className="p-4 font-medium text-slate-900 dark:text-white flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                                                        <Dumbbell size={16} />
                                                    </div>
                                                    {ex.name}
                                                </td>
                                                <td className="p-4">
                                                    <Badge color="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                                                        {ex.muscleGroup}
                                                    </Badge>
                                                </td>
                                                <td className="p-4 text-right">
                                                    <div className="flex justify-end gap-2 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                                        <IconButton onClick={() => handleEdit(ex)} className="hover:text-blue-500">
                                                            <Edit2 size={18} />
                                                        </IconButton>
                                                        <IconButton onClick={() => handleDelete(ex.id)} className="hover:text-red-500">
                                                            <Trash2 size={18} />
                                                        </IconButton>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Mobile View */}
                            <div className="block md:hidden">
                                <MobileCardList<Exercise>
                                    data={filteredExercises}
                                    keyExtractor={(ex) => ex.id}
                                    titleField={(ex) => ex.name}
                                    subtitleField={(ex) => ex.muscleGroup}
                                    getActions={(ex) => [
                                        { label: 'Editar', icon: Edit2, onClick: () => handleEdit(ex) },
                                        { label: 'Eliminar', icon: Trash2, onClick: () => handleDelete(ex.id), variant: 'danger' }
                                    ]}
                                    emptyMessage="No se encontraron ejercicios."
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ExerciseManager;