import React, { useState } from 'react';
import { User } from '../../../types';
import { PageHeader, DataTable, Column, Modal, Input, Button, Badge, toast, MobileCardList } from '../../ui';
import { Search, User as UserIcon, Plus, Edit2, Save, X, Loader2 } from 'lucide-react';
import * as DataService from '../../../services/dataService';
import { useGymData } from '../../../context/GymContext';
import SessionHistory from '../../features/sessions/SessionHistory';

type Tab = 'alumnos' | 'historial';

const AlumnosWithHistory: React.FC = () => {
  const { students, refreshStudents, isLoading } = useGymData();
  const [activeTab, setActiveTab] = useState<Tab>('alumnos');
  const [searchTerm, setSearchTerm] = useState('');

  // New student form
  const [showNewForm, setShowNewForm] = useState(false);
  const [newUser, setNewUser] = useState({ firstName: '', lastName: '', email: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit student state
  const [editingStudent, setEditingStudent] = useState<User | null>(null);
  const [editForm, setEditForm] = useState({ firstName: '', lastName: '', email: '', activo: true });
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const filteredStudents = students.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleNewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const created = await DataService.createStudent(newUser);
    if (created) {
      toast.success('Alumno creado correctamente');
      await refreshStudents();
      setShowNewForm(false);
      setNewUser({ firstName: '', lastName: '', email: '' });
    } else {
      toast.error('Error al crear alumno');
    }
    setIsSubmitting(false);
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
      render: (user) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500">
            {user.name[0]}
          </div>
          <span className="font-medium">{user.name}</span>
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
      render: (user) => (
        <Badge color={user.activo !== false
          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
          : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
        }>
          {user.activo !== false ? 'Activo' : 'Inactivo'}
        </Badge>
      )
    }
  ];

  return (
    <div className="space-y-6 animate-in fade-in pb-20">
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
                <Button onClick={() => setShowNewForm(true)}>
                  <Plus size={20} /> Nuevo Alumno
                </Button>
              }
            />
          </div>

          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <Input
              className="pl-10"
              placeholder="Buscar alumno..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="hidden md:block">
            <DataTable
              columns={columns}
              data={filteredStudents}
              keyExtractor={(user) => user.id}
              emptyMessage="No se encontraron alumnos."
              renderActions={(user) => (
                <button
                  onClick={() => handleEditClick(user)}
                  className="p-2 rounded hover:bg-blue-50 text-slate-400 hover:text-blue-500 transition-colors"
                  title="Editar alumno"
                >
                  <Edit2 size={16} />
                </button>
              )}
            />
          </div>

          <div className="block md:hidden">
            <MobileCardList<User>
              data={filteredStudents}
              keyExtractor={(user) => user.id}
              titleField={(user) => user.name}
              subtitleField={(user) => user.email}
              metaFields={[
                {
                  key: 'activo',
                  render: (user) => (
                    <Badge color={user.activo !== false
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                    }>
                      {user.activo !== false ? 'Activo' : 'Inactivo'}
                    </Badge>
                  )
                }
              ]}
              getActions={(user) => [
                { label: 'Editar', icon: Edit2, onClick: () => handleEditClick(user) }
              ]}
              emptyMessage="No se encontraron alumnos."
            />
          </div>

          {/* New Student Modal */}
          <Modal
            isOpen={showNewForm}
            onClose={() => setShowNewForm(false)}
            title="Nuevo Alumno"
            size="md"
          >
            <form onSubmit={handleNewSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Nombre"
                  value={newUser.firstName}
                  onChange={e => setNewUser({ ...newUser, firstName: e.target.value })}
                  required
                />
                <Input
                  label="Apellido"
                  value={newUser.lastName}
                  onChange={e => setNewUser({ ...newUser, lastName: e.target.value })}
                  required
                />
              </div>
              <Input
                label="Email"
                type="email"
                value={newUser.email}
                onChange={e => setNewUser({ ...newUser, email: e.target.value })}
                required
              />
              <div className="flex gap-3 pt-4 justify-end">
                <Button type="button" variant="ghost" onClick={() => setShowNewForm(false)}>Cancelar</Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Guardando...' : 'Crear Alumno'}
                </Button>
              </div>
            </form>
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
