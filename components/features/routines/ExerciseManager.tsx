import React, { useState } from 'react';
import { Exercise } from '../../../types';
import { Button, Input, IconButton, Select, Badge, PageHeader, EmptyState, LoadingOverlay, MobileCardList, PaginationBar, Modal, FloatingActionButton } from '../../ui';
import { Plus, Edit2, Trash2, Search, Dumbbell, Save, Loader2, Video } from 'lucide-react';
import * as DataService from '../../../services/dataService';
import { useGymData } from '../../../context/GymContext';
import { toast } from '../../ui';
import { usePagination } from '../../../hooks/usePagination';
import { MUSCLE_GROUPS, ACCESSORIES } from '../../../constants/exercise';

const PAGE_SIZE = 10;

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

    const {
        paginatedData: paginatedExercises,
        currentPage,
        totalPages,
        startEntry,
        endEntry,
        setCurrentPage,
        totalEntries
    } = usePagination<Exercise>(filteredExercises, PAGE_SIZE);

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
        const saved = await DataService.saveExercise({
            ...currentExercise,
            accessory: currentExercise.accessory || undefined
        });

        if (saved) {
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
                    <Button onClick={() => setIsEditing(true)} className="hidden md:inline-flex">
                        <Plus size={20} /> Nuevo Ejercicio
                    </Button>
                }
            />

            {/* Create/Edit Modal */}
            <Modal isOpen={isEditing} onClose={handleCancel} title={currentExercise.id ? 'Editar Ejercicio' : 'Crear Nuevo Ejercicio'}>
                <form onSubmit={handleSave} className="space-y-4">
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
                    <Select
                        label="Accesorio / Variante"
                        value={currentExercise.accessory || ''}
                        onChange={e => setCurrentExercise({ ...currentExercise, accessory: e.target.value })}
                    >
                        <option value="">Ninguno</option>
                        {ACCESSORIES.map(a => <option key={a} value={a}>{a}</option>)}
                    </Select>
                    <Input
                        label="Video URL (YouTube)"
                        value={currentExercise.videoUrl || ''}
                        onChange={e => setCurrentExercise({ ...currentExercise, videoUrl: e.target.value })}
                        placeholder="https://youtube.com/..."
                        icon={Video}
                    />
                    <div className="flex justify-end gap-2 pt-2">
                        <Button type="button" variant="ghost" onClick={handleCancel} disabled={isSaving}>Cancelar</Button>
                        <Button type="submit" disabled={isSaving}>
                            {isSaving ? <Loader2 className="animate-spin" /> : <Save size={18} />}
                            <span className="ml-2">Guardar</span>
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Search Bar */}
            <div className="relative max-w-sm">
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
                <>
                    {/* Desktop View */}
                    <div className="hidden md:block bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">
                                        <th className="p-4 font-bold rounded-tl-lg">Nombre</th>
                                        <th className="p-4 font-bold">Grupo Muscular</th>
                                        <th className="p-4 font-bold">Accesorio</th>
                                        <th className="p-4 font-bold text-center">Video</th>
                                        <th className="p-4 font-bold text-right rounded-tr-lg">Acciones</th>
                                    </tr>
                                </thead >
                                <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                                    {paginatedExercises.map((ex) => (
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
                                            <td className="p-4">
                                                {ex.accessory && (
                                                    <Badge color="bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-300 border border-orange-200 dark:border-orange-800">
                                                        {ex.accessory}
                                                    </Badge>
                                                )}
                                            </td>
                                            <td className="p-4 text-center">
                                                {ex.videoUrl && (
                                                    <a
                                                        href={ex.videoUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                                                        title="Ver Video"
                                                    >
                                                        <Video size={16} />
                                                    </a>
                                                )}
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
                        <PaginationBar
                            currentPage={currentPage}
                            totalPages={totalPages}
                            startEntry={startEntry}
                            endEntry={endEntry}
                            totalEntries={totalEntries}
                            onPageChange={setCurrentPage}
                        />
                    </div>

                    {/* Mobile View */}
                    <div className="block md:hidden">
                        <MobileCardList<Exercise>
                            data={paginatedExercises}
                            keyExtractor={(ex) => ex.id}
                            titleField={(ex) => ex.name}
                            subtitleField={(ex) => `${ex.muscleGroup} ${ex.accessory ? `\u2022 ${ex.accessory}` : ''}`}
                            getActions={(ex) => [
                                ...(ex.videoUrl ? [{ label: 'Ver Video', icon: Video, onClick: () => window.open(ex.videoUrl, '_blank') }] : []),
                                { label: 'Editar', icon: Edit2, onClick: () => handleEdit(ex) },
                                { label: 'Eliminar', icon: Trash2, onClick: () => handleDelete(ex.id), variant: 'danger' }
                            ]}
                            getSwipeActions={(ex) => ({
                                right: { label: 'Editar', icon: <Edit2 size={16} />, onClick: () => handleEdit(ex), color: '#3b82f6' },
                                left: { label: 'Eliminar', icon: <Trash2 size={16} />, onClick: () => handleDelete(ex.id), color: '#ef4444' }
                            })}
                            emptyMessage="No se encontraron ejercicios."
                        />
                        <div className="mt-4">
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
                </>
            )}

            <FloatingActionButton
                onClick={() => setIsEditing(true)}
                icon={<Plus size={24} />}
                label="Nuevo ejercicio"
            />
        </div >
    );
};

export default ExerciseManager;