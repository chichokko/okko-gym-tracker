import React, { useState, useEffect } from 'react';
import { User } from '../../../types';
import { PageHeader, DataTable, Column, Modal, Input, Button, Badge, toast, MobileCardList } from '../../ui';
import { Search, Plus, Edit2, Save, X, Loader2, Link2, Unlink } from 'lucide-react';
import * as DataService from '../../../services/dataService';
import { useGymData } from '../../../context/GymContext';
import SessionHistory from '../../features/sessions/SessionHistory';

type Tab = 'alumnos' | 'historial';

interface Props {
  user: User;
}

const AlumnosWithHistory: React.FC<Props> = ({ user }) => {
  const { students, refreshStudents, isLoading } = useGymData();
  const [activeTab, setActiveTab] = useState<Tab>('alumnos');
  const [searchTerm, setSearchTerm] = useState('');

  // Linking students state
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [unlinkedStudents, setUnlinkedStudents] = useState<User[]>([]);
  const [isLinking, setIsLinking] = useState(false);
  const [linkSearchTerm, setLinkSearchTerm] = useState('');

  // Edit student state
  const [editingStudent, setEditingStudent] = useState<User | null>(null);
  const [editForm, setEditForm] = useState({ firstName: '', lastName: '', email: '', activo: true });
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const filteredStudents = students.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredUnlinked = unlinkedStudents.filter(s => 
    s.name.toLowerCase().includes(linkSearchTerm.toLowerCase()) || 
    (s.email && s.email.toLowerCase().includes(linkSearchTerm.toLowerCase()))
  );

  const loadUnlinkedStudents = async () => {
    const list = await DataService.getUnlinkedStudents();
    setUnlinkedStudents(list);
  };

  useEffect(() => {
    if (showLinkModal) {
      loadUnlinkedStudents();
    }
  }, [showLinkModal]);

  const handleLinkStudent = async (studentId: string) => {
    setIsLinking(true);
    const ok = await DataService.linkStudentToCoach(studentId);
    if (ok) {
      toast.success('Alumno vinculado correctamente');
      await refreshStudents();
      await loadUnlinkedStudents();
    } else {
      toast.error('Error al vincular alumno');
    }
    setIsLinking(false);
  };

  const handleUnlinkStudent = async (studentId: string) => {
    if (!window.confirm("¿Estás seguro de que quieres desvincular a este alumno?")) return;
    
    const ok = await DataService.unlinkStudent(studentId);
    if (ok) {
      toast.success('Alumno desvinculado');
      await refreshStudents();
    } else {
      toast.error('Error al desvincular alumno');
    }
  };

  const handleEditClick = (student: User) => {
    const [firstName = '', lastName = ''] = student.name.split(' ');
    setEditingStudent(student);
    setEditForm({
      firstName: student.firstName || firstName,
      lastName: student.lastName || lastName,
      email: student.email || '',
      activo: student.activo !== false,
    });
  };

  const handleSaveEdit = async () => {
    if (!editingStudent) return;
    setIsSavingEdit(true);
    const ok = await DataService.updateStudent(editingStudent.id, { ...editForm });
    if (ok) {
      toast.success('Alumno actualizado');
      await refreshStudents();
      setEditingStudent(null);
    } else {
      toast.error('Error al actualizar alumno');
    }
    setIsSavingEdit(false);
  };

  const columns: Column<User>[] = [
    {
      header: 'Nombre',
      key: 'name',
      render: (u) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500">
            {u.name[0]}
          </div>
          <span className="font-medium">{u.name}</span>
        </div>
      )
    },
    {
      header: 'Email',
      key: 'email',
      className: 'hidden sm:table-cell'
    },
    {
      header: 'Estado',
      key: 'activo',
      render: (u) => (
        <Badge color={u.activo !== false
          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
          : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
        }>
          {u.activo !== false ? 'Activo' : 'Inactivo'}
        </Badge>
      )
    }
  ];

  return (
    <div className="space-y-6 animate-in fade-in pb-20">
      {/* Alert for Coach Code */}
      {user.coachCode && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-blue-800 dark:text-blue-300 font-semibold">Código de Entrenador</h3>
              <p className="text-sm text-blue-600 dark:text-blue-400">Comparte este código con tus alumnos para que se vinculen automáticamente al registrarse.</p>
            </div>
            <div className="bg-white dark:bg-slate-900 px-4 py-2 rounded-md font-mono font-bold text-lg border border-blue-100 dark:border-blue-800 text-center">
              {user.coachCode}
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-lg w-full max-w-md mx-auto sm:mx-0">
        <button
          onClick={() => setActiveTab('alumnos')}
          className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-all ${
            activeTab === 'alumnos'
              ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
              : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          Alumnos
        </button>
        <button
          onClick={() => setActiveTab('historial')}
          className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-all ${
            activeTab === 'historial'
              ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
              : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          Historial de Entrenos
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'alumnos' ? (
        <>
          <div className="space-y-6">
            <PageHeader
              title="Alumnos"
              subtitle={'Gestiona información de tus alumnos'}
              action={
                <Button onClick={() => setShowLinkModal(true)} size="sm" className="sm:h-12 sm:px-6 sm:text-base">
                  <Link2 size={20} /> Vincular Alumno
                </Button>
              }
            />
          </div>

          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <Input
              className="pl-10"
              placeholder="Buscar alumno vinculado..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="hidden md:block">
            <DataTable
              columns={columns}
              data={filteredStudents}
              keyExtractor={(u) => u.id}
              emptyMessage="No se encontraron alumnos."
              renderActions={(u) => (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEditClick(u)}
                    className="p-2 rounded hover:bg-blue-50 text-slate-400 hover:text-blue-500 transition-colors"
                    title="Editar alumno"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => handleUnlinkStudent(u.id)}
                    className="p-2 rounded hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
                    title="Desvincular"
                  >
                    <Unlink size={16} />
                  </button>
                </div>
              )}
            />
          </div>

          <div className="block md:hidden">
            <MobileCardList<User>
              data={filteredStudents}
              keyExtractor={(u) => u.id}
              titleField={(u) => u.name}
              subtitleField={(u) => u.email}
              metaFields={[
                {
                  key: 'activo',
                  render: (u) => (
                    <Badge color={u.activo !== false
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                    }>
                      {u.activo !== false ? 'Activo' : 'Inactivo'}
                    </Badge>
                  )
                }
              ]}
              getActions={(u) => [
                { label: 'Editar', icon: Edit2, onClick: () => handleEditClick(u) },
                { label: 'Desvincular', icon: Unlink, onClick: () => handleUnlinkStudent(u.id) }
              ]}
              getSwipeActions={(u) => ({
                left: { label: 'Editar', icon: <Edit2 size={16} />, onClick: () => handleEditClick(u), color: '#3b82f6' },
                right: { label: 'Desvincular', icon: <Unlink size={16} />, onClick: () => handleUnlinkStudent(u.id), color: '#ef4444' }
              })}
              emptyMessage="No se encontraron alumnos."
            />
          </div>

          {/* Link Student Modal */}
          <Modal
            isOpen={showLinkModal}
            onClose={() => setShowLinkModal(false)}
            title="Vincular Alumno"
            size="md"
          >
            <div className="space-y-4">
              <p className="text-sm text-slate-500">
                Selecciona a un alumno registrado que aún no tenga un entrenador asignado.
              </p>
              
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <Input
                  className="pl-10"
                  placeholder="Buscar por nombre o email..."
                  value={linkSearchTerm}
                  onChange={e => setLinkSearchTerm(e.target.value)}
                />
              </div>

              <div className="max-h-64 overflow-y-auto space-y-2 pr-2">
                {filteredUnlinked.length === 0 ? (
                  <div className="text-center p-4 text-slate-500 text-sm">
                    No hay alumnos huérfanos disponibles que coincidan con tu búsqueda.
                  </div>
                ) : (
                  filteredUnlinked.map(u => (
                    <div key={u.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-gray-100 dark:border-slate-700">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold">
                          {u.name[0]}
                        </div>
                        <div>
                          <p className="font-semibold text-sm">{u.name}</p>
                          <p className="text-xs text-slate-500">{u.email}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleLinkStudent(u.id)}
                        disabled={isLinking}
                        className="h-8 px-3 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-50 transition-colors flex items-center gap-1"
                      >
                        {isLinking ? <Loader2 className="w-3 h-3 animate-spin" /> : <Link2 size={14} />}
                      </button>
                    </div>
                  ))
                )}
              </div>
              
              <div className="pt-4 text-right border-t border-gray-100 dark:border-slate-800">
                <Button variant="ghost" onClick={() => setShowLinkModal(false)}>Cerrar</Button>
              </div>
            </div>
          </Modal>

          {/* Edit Student Modal */}
          <Modal
            isOpen={!!editingStudent}
            onClose={() => setEditingStudent(null)}
            title={editingStudent ? `Editar: ${editingStudent.name}` : ''}
            size="md"
          >
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Nombre"
                  value={editForm.firstName}
                  onChange={e => setEditForm({ ...editForm, firstName: e.target.value })}
                />
                <Input
                  label="Apellido"
                  value={editForm.lastName}
                  onChange={e => setEditForm({ ...editForm, lastName: e.target.value })}
                />
              </div>
              <Input
                label="Email"
                type="email"
                value={editForm.email}
                onChange={e => setEditForm({ ...editForm, email: e.target.value })}
              />
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <p className="text-sm font-medium">Activo</p>
                  <p className="text-xs text-slate-500">Desmarca para desactivar el acceso del alumno</p>
                </div>
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={editForm.activo}
                    onChange={(e) => setEditForm({ ...editForm, activo: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-100 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-green-500"></div>
                </div>
              </label>
              <div className="flex gap-3 pt-4 justify-end">
                <Button type="button" variant="ghost" onClick={() => setEditingStudent(null)}>Cancelar</Button>
                <Button onClick={handleSaveEdit} disabled={isSavingEdit}>
                  {isSavingEdit ? <Loader2 className="animate-spin" /> : <Save size={18} />}
                  <span className="ml-2">Guardar</span>
                </Button>
              </div>
            </div>
          </Modal>
        </>
      ) : (
        <SessionHistory />
      )}
    </div>
  );
};

export default AlumnosWithHistory;
