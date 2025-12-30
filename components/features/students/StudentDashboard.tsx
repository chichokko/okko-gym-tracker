import React, { useState, useEffect } from 'react';
import { User } from '../../../types';
import { Card, Badge, LoadingOverlay, EmptyState, Select } from '../../ui';
import { Calendar, TrendingUp, Dumbbell, Activity, Trophy } from 'lucide-react';
import * as DataService from '../../../services/dataService';
import { processStats, getExerciseProgress, getTopExercises, StudentStats } from '../../../utils/gymMetrics';
import { SafeChart } from './SafeChart';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  LineChart, Line, ScatterChart, Scatter, ZAxis
} from 'recharts';

const StudentDashboard: React.FC<{ user: User }> = ({ user }) => {
  const [sessions, setSessions] = useState<DataService.CompletedSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<StudentStats | null>(null);

  // Chart State
  const [selectedExercise, setSelectedExercise] = useState<string>('');
  const [exerciseOptions, setExerciseOptions] = useState<string[]>([]);
  const [chartMode, setChartMode] = useState<'1rm' | 'volume' | 'rpe'>('1rm');

  useEffect(() => {
    loadData();
  }, [user.id]);

  const loadData = async () => {
    setLoading(true);
    // Use user.email to find the persona ID if needed, but dataService.getCompletedSessions 
    // usually takes a Persona ID (studentId). Assuming user.id maps to AUTH id, 
    // and dataService expects STUDENT ID (Persona ID).
    // However, in our context, we might only have the AUTH ID. 
    // Ideally we should resolve the Persona ID first. 
    // BUT, getCompletedSessions implementation uses 'alumno_id' column.
    // If user.role is STUDENT, user.id MIGHT be the Auth ID, not Persona ID.
    // Let's assume for now user.id passed here *is* the correct ID or compatible.
    // *Correction*: In App.tsx login, we set User. If that User object comes from `persona` table, it has the correct ID.
    // DataService.getStudents maps Persona ID to User.id. So user.id IS Persona ID. Correct.

    const data = await DataService.getCompletedSessions(user.id);
    setSessions(data);

    const calculatedStats = processStats(data);
    setStats(calculatedStats);

    const topExercises = getTopExercises(data);
    setExerciseOptions(topExercises);
    if (topExercises.length > 0) setSelectedExercise(topExercises[0]);

    setLoading(false);
  };

  if (loading) return <LoadingOverlay message="Cargando tu progreso..." />;

  if (sessions.length === 0) {
    return (
      <div className="space-y-8 animate-in fade-in">
        <div>
          <h1 className="text-3xl font-bold mb-2">Hola, {user.name}</h1>
          <p className="text-slate-500">Bienvenido a OKKO Tracker.</p>
        </div>
        <EmptyState
          icon={Dumbbell}
          message="Aún no tienes sesiones registradas."
          action={<span className="text-sm text-slate-400">Pide a tu entrenador que registre tu primera sesión.</span>}
        />
      </div>
    );
  }

  // Prepare Chart Data
  const chartData = selectedExercise ? getExerciseProgress(sessions, selectedExercise) : [];

  return (
    <div className="space-y-8 animate-in fade-in pb-20">
      <div>
        <h1 className="text-3xl font-bold mb-2">Hola, {user.name}</h1>
        <p className="text-slate-500 dark:text-slate-400">Aquí tienes el resumen de tu rendimiento.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 flex flex-col gap-1 border-t-4 border-t-blue-500">
          <span className="text-xs text-gray-400 uppercase font-bold">Sesiones Totales</span>
          <span className="text-2xl font-bold text-slate-900 dark:text-white">{stats?.totalSessions || 0}</span>
          <div className="flex items-center text-xs text-slate-500 gap-1">
            <Trophy size={12} className="text-yellow-500" /> Histórico
          </div>
        </Card>
        <Card className="p-4 flex flex-col gap-1 border-t-4 border-t-green-500">
          <span className="text-xs text-gray-400 uppercase font-bold">Volumen Total</span>
          <span className="text-2xl font-bold text-slate-900 dark:text-white">{(stats?.totalVolume || 0).toLocaleString()} kg</span>
          <div className="flex items-center text-xs text-slate-500 gap-1">
            <Activity size={12} className="text-green-500" /> Carga Acumulada
          </div>
        </Card>
        <Card className="p-4 flex flex-col gap-1 border-t-4 border-t-orange-500">
          <span className="text-xs text-gray-400 uppercase font-bold">Esta Semana</span>
          <span className="text-2xl font-bold text-slate-900 dark:text-white">{stats?.sessionsThisWeek || 0}</span>
          <div className="flex items-center text-xs text-slate-500 gap-1">
            <Calendar size={12} className="text-orange-500" /> Últimos 7 días
          </div>
        </Card>
        <Card className="p-4 flex flex-col gap-1 md:hidden border-t-4 border-t-purple-500">
          {/* Mobile Only 4th Card placeholder or similar */}
          <span className="text-xs text-gray-400 uppercase font-bold">Racha</span>
          <span className="text-2xl font-bold text-slate-900 dark:text-white">🔥</span>
        </Card>
      </div>

      {/* Main Chart Section */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <TrendingUp size={20} /> Progreso por Ejercicio
          </h3>

          <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
            <div className="w-full md:w-64">
              <Select
                value={selectedExercise}
                onChange={(e) => setSelectedExercise(e.target.value)}
                label="" // No label to save space
              >
                {exerciseOptions.map(ex => <option key={ex} value={ex}>{ex}</option>)}
              </Select>
            </div>

            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg self-start">
              <button
                onClick={() => setChartMode('1rm')}
                className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${chartMode === '1rm' ? 'bg-white dark:bg-slate-700 shadow text-blue-600' : 'text-slate-500'}`}
              >
                1RM Estimado
              </button>
              <button
                onClick={() => setChartMode('volume')}
                className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${chartMode === 'volume' ? 'bg-white dark:bg-slate-700 shadow text-green-600' : 'text-slate-500'}`}
              >
                Volumen
              </button>
              <button
                onClick={() => setChartMode('rpe')}
                className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${chartMode === 'rpe' ? 'bg-white dark:bg-slate-700 shadow text-orange-600' : 'text-slate-500'}`}
              >
                RPE
              </button>
            </div>
          </div>
        </div>

        <Card className="p-4 md:p-6">
          <SafeChart height={300}>
            {chartMode === '1rm' ? (
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorRm" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.3} />
                <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                <YAxis hide domain={['dataMin - 5', 'dataMax + 5']} />
                <Tooltip
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  labelStyle={{ color: '#64748b', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="rm" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorRm)" name="1RM Estimado (kg)" />
              </AreaChart>
            ) : chartMode === 'volume' ? (
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.3} />
                <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                <YAxis hide />
                <Tooltip
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  labelStyle={{ color: '#64748b', fontSize: '12px' }}
                />
                <Line type="monotone" dataKey="volume" stroke="#22c55e" strokeWidth={3} dot={{ r: 4, fill: '#22c55e' }} name="Volumen Total (kg)" />
              </LineChart>
            ) : (
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.3} />
                <XAxis dataKey="date" type="category" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} allowDuplicatedCategory={false} />
                <YAxis type="number" dataKey="rpe" name="RPE" unit="" domain={[0, 10]} hide />
                <ZAxis type="number" range={[100, 300]} />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ borderRadius: '8px', border: 'none' }} />
                <Scatter name="RPE" data={chartData} fill="#f97316" shape="circle" />
              </ScatterChart>
            )}
          </SafeChart>
        </Card>
      </div>

      {/* Heatmap / Activity Calendar */}
      <div>
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Calendar size={20} /> Constancia
        </h3>
        <Card className="p-6">
          <p className="text-sm text-slate-500 mb-4">Días de entrenamiento (Últimos 3 meses)</p>
          {/* Simple Grid Heatmap */}
          <div className="flex flex-wrap gap-1">
            {Array.from({ length: 90 }).map((_, i) => {
              // Calculate date based on offset from today (90 days ago to today)
              const d = new Date();
              d.setDate(d.getDate() - (89 - i)); // 89 days ago ... to 0 days ago (today)

              // Format as YYYY-MM-DD using local time components to avoid UTC shift
              const year = d.getFullYear();
              const month = String(d.getMonth() + 1).padStart(2, '0');
              const day = String(d.getDate()).padStart(2, '0');
              const dateStr = `${year}-${month}-${day}`;

              // Check if any session exists on this date (comparing vs session local date string)
              const hasSession = sessions.some(s => {
                const sDate = new Date(s.date);
                const sYear = sDate.getFullYear();
                const sMonth = String(sDate.getMonth() + 1).padStart(2, '0');
                const sDay = String(sDate.getDate()).padStart(2, '0');
                const sDateStr = `${sYear}-${sMonth}-${sDay}`;
                return sDateStr === dateStr;
              });

              return (
                <div
                  key={i}
                  title={dateStr}
                  className={`w-3 h-3 rounded-sm ${hasSession ? 'bg-blue-500' : 'bg-gray-100 dark:bg-slate-800'}`}
                />
              );
            })}
          </div>
          <div className="flex justify-end gap-2 items-center mt-2 text-xs text-slate-400">
            <span>Menos</span>
            <div className="w-3 h-3 bg-gray-100 dark:bg-slate-800 rounded-sm"></div>
            <div className="w-3 h-3 bg-blue-500 rounded-sm"></div>
            <span>Más</span>
          </div>
        </Card>
      </div>

      {/* Recent Activity List */}
      <div>
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">Últimas Sesiones</h3>
        <div className="space-y-3">
          {sessions.slice(0, 5).map((session) => (
            <Card key={session.id} className="flex items-center gap-4 p-4 hover:border-blue-500 transition-colors">
              <div className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-slate-800 flex items-center justify-center text-gray-500 dark:text-gray-400 font-bold text-xs uppercase">
                {session.date.toLocaleDateString('es-CL', { weekday: 'short' })}
              </div>
              <div>
                <h5 className="font-bold text-slate-900 dark:text-white capitalize">
                  {session.date.toLocaleDateString('es-CL', { day: 'numeric', month: 'long' })}
                </h5>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {session.exerciseCount} Ejercicios • {session.totalVolume.toLocaleString()} kg
                </p>
              </div>
              <div className="ml-auto">
                <Badge color='bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'>Completado</Badge>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;