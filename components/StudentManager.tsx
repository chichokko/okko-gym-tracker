import React, { useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { Card, Button, Input, IconButton } from './ui';
import { Plus, Edit2, Trash2, Search, User as UserIcon } from 'lucide-react';
import * as DataService from '../services/dataService';

const StudentManager: React.FC = () => {
  const [students, setStudents] = useState<User[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [newUser, setNewUser] = useState({ firstName: '', lastName: '', email: '' });
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
      DataService.getStudents().then(setStudents);
  }, []);

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEditing) {
        const created = await DataService.createStudent(newUser);
        if (created) {
            setStudents([...students, created]);
            setShowForm(false);
            setNewUser({ firstName: '', lastName: '', email: '' });
        } else {
            alert("Error al crear alumno");
        }
    }
    // TODO: Implement Edit logic in DataService
  };

  if (showForm) {
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Nuevo Alumno</h2>
          <Button variant="ghost" onClick={() => setShowForm(false)}>Cancelar</Button>
        </div>
        <Card>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <Input 
                label="Nombre" 
                value={newUser.firstName} 
                onChange={e => setNewUser({...newUser, firstName: e.target.value})}
                required
                />
                <Input 
                label="Apellido" 
                value={newUser.lastName} 
                onChange={e => setNewUser({...newUser, lastName: e.target.value})}
                required
                />
            </div>
            <Input 
              label="Email" 
              type="email"
              value={newUser.email} 
              onChange={e => setNewUser({...newUser, email: e.target.value})}
              required
            />
            <div className="flex gap-3 pt-4">
              <Button type="submit" fullWidth>Crear Alumno</Button>
            </div>
          </form>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Alumnos</h1>
          <p className="text-slate-500 dark:text-slate-400">Gestiona a tus deportistas ({students.length})</p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus size={20} /> Nuevo Alumno
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        <Input 
          className="pl-10" 
          placeholder="Buscar alumno..." 
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 gap-3">
        {filteredStudents.map(student => (
          <Card key={student.id} className="flex justify-between items-center group hover:border-blue-500 transition-colors">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400">
                <UserIcon size={24} />
              </div>
              <div>
                <h3 className="font-bold text-lg">{student.name}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">{student.email || 'Sin email'}</p>
              </div>
            </div>
          </Card>
        ))}
        {filteredStudents.length === 0 && (
          <div className="text-center py-10 text-slate-500 dark:text-slate-400">
            No se encontraron alumnos.
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentManager;