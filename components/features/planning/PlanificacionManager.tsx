import React, { useState, useEffect } from 'react';
import { Planificacion } from '../../../types';
import { Card, Button, PageHeader, EmptyState, LoadingOverlay, Badge } from '../../ui';
import { Plus, CalendarDays, ChevronRight, Download, User } from 'lucide-react';
import * as DataService from '../../../services/dataService';
import PlanificacionBuilder from './PlanificacionBuilder';
import { useSession } from '../../../context/SessionContext';

const PlanificacionManager: React.FC = () => {
  const { session } = useSession();
  const [planes, setPlanes] = useState<Planificacion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingPlan, setEditingPlan] = useState<Planificacion | null>(null);

  const fetchPlanes = async () => {
    setIsLoading(true);
    const data = await DataService.getPlanificaciones();
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

  if (isLoading) return <LoadingOverlay message="Cargando planificaciones..." />;

  if (editingPlan) {
    return <PlanificacionBuilder initialPlan={editingPlan} onClose={handleCloseBuilder} />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Planificación"
        subtitle="Gestiona los macro y mesociclos de tus alumnos"
        action={
          <Button onClick={handleCreateNew}>
            <Plus size={20} /> Crear Plan
          </Button>
        }
      />

      {planes.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          message="No hay planificaciones creadas."
          action={
            <Button variant="ghost" onClick={handleCreateNew} className="text-blue-500">
              Comenzar a planificar
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {planes.map(plan => (
            <Card key={plan.id} className="flex flex-col md:flex-row justify-between hover:border-blue-500 transition-colors cursor-pointer group" onClick={() => setEditingPlan(plan)}>
              <div className="flex-1">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-xl">{plan.name}</h3>
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
                Ver Detalles <ChevronRight size={16} />
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default PlanificacionManager;
