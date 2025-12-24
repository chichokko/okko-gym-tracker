import React, { useState } from 'react';
import { User } from '../../../types';
import { Card, Button, Input, PageHeader, DataTable, Column, Modal, LoadingOverlay, MobileCardList } from '../../ui';
import { Plus, Search, User as UserIcon } from 'lucide-react';
import * as DataService from '../../../services/dataService';
import { useGymData } from '../../../context/GymContext';
import { toast } from '../../ui';

const StudentManager: React.FC = () => {
  const { students, refreshStudents, isLoading } = useGymData();
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [newUser, setNewUser] = useState({ firstName: '', lastName: '', email: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredStudents = students.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const created = await DataService.createStudent(newUser);
    if (created) {
      toast.success('Alumno creado correctamente');
      await refreshStudents(); // Update global state
      setShowForm(false);
      setNewUser({ firstName: '', lastName: '', email: '' });
    } else {
      toast.error('Error al crear alumno');
    }
    setIsSubmitting(false);
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
      header: 'Rol',
      key: 'role',
      render: () => <span className="text-xs uppercase font-bold text-slate-400">Alumno</span>
    }
  ];

  if (isLoading && students.length === 0) return <LoadingOverlay message="Cargando alumnos..." />;

  return (
    <div className="space-y-6 animate-in fade-in">
      <PageHeader
        title="Alumnos"
        subtitle={`Gestiona a tus deportistas (${students.length})`}
        action={
          <Button onClick={() => setShowForm(true)}>
            <Plus size={20} /> Nuevo Alumno
          </Button>
        }
      />

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
        />
      </div>

      <div className="block md:hidden">
        <MobileCardList<User>
          data={filteredStudents}
          keyExtractor={(user) => user.id}
          titleField={(user) => user.name}
          subtitleField={(user) => user.email}
          metaFields={[
            { key: 'role', render: () => <span className="text-xs font-bold text-slate-400 uppercase">Alumno</span> }
          ]}
          emptyMessage="No se encontraron alumnos."
        // TODO: Add actions when Edit/Delete is implemented
        />
      </div>

      {/* Modal de Creación */}
      <Modal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        title="Nuevo Alumno"
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
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
            <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>Cancelar</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Guardando...' : 'Crear Alumno'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default StudentManager;