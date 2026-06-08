import React, { useState, useEffect } from 'react';
import { Planificacion, User, UserRole } from '../../../types';
import { Card, Button, PageHeader, EmptyState, LoadingOverlay, Badge, PaginationBar } from '../../ui';
import { Plus, CalendarDays, ChevronRight, Download, Eye } from 'lucide-react';
import * as DataService from '../../../services/dataService';
import PlanificacionBuilder from './PlanificacionBuilder';
import { useSession } from '../../../context/SessionContext';
import { usePagination } from '../../../hooks/usePagination';

const PAGE_SIZE = 5;

interface PlanificacionManagerProps {
  user: User;
}

const PlanificacionManager: React.FC<PlanificacionManagerProps> = ({ user }) => {
  const { session } = useSession();
  const [planes, setPlanes] = useState<Planificacion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewingPlan, setViewingPlan] = useState<Planificacion | null>(null);
  const [editingPlan, setEditingPlan] = useState<Planificacion | null>(null);

  const isStudent = user.role === UserRole.STUDENT;

  const fetchPlanes = async () => {
    setIsLoading(true);
    const data = await DataService.getPlanificaciones(isStudent);
    setPlanes(data);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchPlanes();
  }, []);

  const handleCreateNew = () => {
    setEditingPlan({
      id: '',
      name: '',
      creatorId: session?.user?.id || '',
      type: 'Mesociclo',
      days: []
    });
  };

  const handleCloseBuilder = (needsRefresh: boolean) => {
    setEditingPlan(null);
    if (needsRefresh) {
      fetchPlanes();
    }
  };

  const handleViewPlan = (plan: Planificacion) => {
    setViewingPlan(plan);
  };

  const handleEditPlan = (plan: Planificacion) => {
    setEditingPlan(plan);
  };

  const {
    paginatedData: paginatedPlanes,
    currentPage,
    totalPages,
    startEntry,
    endEntry,
    setCurrentPage,
    totalEntries
  } = usePagination<Planificacion>(planes, PAGE_SIZE);

  if (isLoading) return <LoadingOverlay message="Cargando planificaciones..." />;

  if (editingPlan) {
    return <PlanificacionBuilder initialPlan={editingPlan} onClose={handleCloseBuilder} />;
  }

  if (viewingPlan) {
    return (
      <PlanificacionBuilder
        initialPlan={viewingPlan}
        onClose={() => { setViewingPlan(null); fetchPlanes(); }}
        readOnly
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Planificación"
        subtitle={isStudent ? 'Planificaciones asignadas a ti' : 'Gestiona los macro y mesociclos de tus alumnos'}
        action={!isStudent && (
          <Button onClick={handleCreateNew}>
            <Plus size={20} /> Crear Plan
          </Button>
        )}
      />

      {planes.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          message={isStudent ? 'No tienes planificaciones asignadas.' : 'No hay planificaciones creadas.'}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {paginatedPlanes.map(plan => (
            <Card
              key={plan.id}
              className="flex flex-col md:flex-row justify-between hover:border-blue-500 transition-colors cursor-pointer group"
              onClick={() => isStudent ? handleViewPlan(plan) : handleEditPlan(plan)}
            >
              <div className="flex-1">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex gap-2 items-center">
                      <h3 className="font-bold text-xl">{plan.name}</h3>
                      {plan.activo && <Badge color="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">Activa</Badge>}
                    </div>
                    <Badge variant="primary">{plan.type}</Badge>
                  </div>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">
                  {plan.description || 'Sin descripción'}
                </p>
                
                <div className="flex gap-4 mt-4">
                  <div className="text-sm">
                    <span className="text-slate-400">Duración:</span> <span className="font-medium">{plan.duration || 'N/A'}</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-slate-400">Días de entreno:</span> <span className="font-medium">{plan.days?.length || 0}</span>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 md:mt-0 md:ml-4 pt-4 md:pt-0 border-t md:border-t-0 md:border-l border-gray-100 dark:border-slate-800 flex justify-end md:justify-center items-center md:pl-4 text-blue-500 font-medium text-sm gap-1 group-hover:gap-2 transition-all">
                {isStudent ? 'Ver' : 'Editar'} <Eye size={16} />
              </div>
            </Card>
          ))}
          <PaginationBar
            currentPage={currentPage}
            totalPages={totalPages}
            startEntry={startEntry}
            endEntry={endEntry}
            totalEntries={totalEntries}
            onPageChange={setCurrentPage}
          />
        </div>
      )}
    </div>
  );
};

export default PlanificacionManager;
