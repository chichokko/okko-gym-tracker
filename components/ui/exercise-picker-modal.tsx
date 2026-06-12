import React, { useState, useMemo } from 'react';
import { Modal } from './modal';
import { Input } from './input';
import { Button } from './button';
import { Select } from './select';
import { Badge } from './badge';
import { toast } from './toast';
import { Search, Plus, Loader2 } from 'lucide-react';
import { Exercise } from '../../types';
import * as DataService from '../../services/dataService';
import { useGymData } from '../../context/GymContext';
import { MUSCLE_GROUPS, ACCESSORIES } from '../../constants/exercise';

interface ExercisePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (exercise: Exercise) => void;
}

export const ExercisePickerModal: React.FC<ExercisePickerModalProps> = ({
  isOpen,
  onClose,
  onSelect,
}) => {
  const { exercises, refreshExercises } = useGymData();

  const [searchTerm, setSearchTerm] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newMuscle, setNewMuscle] = useState('');
  const [newAccessory, setNewAccessory] = useState('');

  const filtered = useMemo(() => {
    if (!searchTerm) return exercises;
    const q = searchTerm.toLowerCase();
    return exercises.filter(e =>
      e.name.toLowerCase().includes(q) ||
      e.muscleGroup.toLowerCase().includes(q) ||
      (e.accessory && e.accessory.toLowerCase().includes(q))
    );
  }, [exercises, searchTerm]);

  const handleCreate = async () => {
    if (!newName.trim() || !newMuscle.trim()) {
      toast.error('Nombre y grupo muscular son obligatorios');
      return;
    }
    setIsCreating(true);
    const saved = await DataService.saveExercise({
      name: newName.trim(),
      muscleGroup: newMuscle.trim(),
      accessory: newAccessory.trim() || undefined,
    });
    if (saved) {
      toast.success('Ejercicio creado');
      setNewName('');
      setNewMuscle('');
      setNewAccessory('');
      setSearchTerm('');
      await refreshExercises();
      onSelect(saved);
      onClose();
    } else {
      toast.error('Error al crear ejercicio');
    }
    setIsCreating(false);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Seleccionar Ejercicio" size="lg">
      <div className="space-y-4">
        <Input
          placeholder="Buscar por nombre, grupo muscular o accesorio..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          icon={Search}
        />

        <div className="max-h-48 overflow-y-auto space-y-1 border border-slate-200 dark:border-slate-700 rounded-lg">
          {filtered.length === 0 ? (
            <p className="p-4 text-center text-slate-500 text-sm">No se encontraron ejercicios</p>
          ) : (
            filtered.map(e => (
              <button
                key={e.id}
                type="button"
                onClick={() => { onSelect(e); onClose(); }}
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
              value={newName}
              onChange={e => setNewName(e.target.value)}
            />
            <Select
              placeholder="Grupo muscular"
              value={newMuscle}
              onChange={e => setNewMuscle(e.target.value)}
            >
              <option value="">Seleccionar...</option>
              {MUSCLE_GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
            </Select>
            <Select
              placeholder="Accesorio (opcional)"
              value={newAccessory}
              onChange={e => setNewAccessory(e.target.value)}
            >
              <option value="">Ninguno</option>
              {ACCESSORIES.map(a => <option key={a} value={a}>{a}</option>)}
            </Select>
          </div>
          <Button
            type="button"
            size="sm"
            onClick={handleCreate}
            disabled={isCreating}
          >
            {isCreating ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
            Crear y seleccionar
          </Button>
        </div>
      </div>
    </Modal>
  );
};
