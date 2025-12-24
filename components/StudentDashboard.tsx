import React from 'react';
import { Card, Button, Badge } from './ui';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, AreaChart, Area } from 'recharts';
import { TrendingUp, Calendar, Trophy, Zap } from 'lucide-react';
import { Session, User } from '../types';

// Mock History Data
const DATA_SQUAT = [
  { date: '1 Oct', rm: 100, vol: 2000 },
  { date: '8 Oct', rm: 105, vol: 2200 },
  { date: '15 Oct', rm: 102, vol: 2100 },
  { date: '22 Oct', rm: 110, vol: 2400 },
  { date: '29 Oct', rm: 115, vol: 2600 },
];

const DATA_BENCH = [
  { date: '1 Oct', rm: 80, vol: 1500 },
  { date: '8 Oct', rm: 82, vol: 1600 },
  { date: '15 Oct', rm: 85, vol: 1800 },
  { date: '22 Oct', rm: 85, vol: 1800 },
  { date: '29 Oct', rm: 87.5, vol: 1900 },
];

const LAST_SESSION: Session = {
  id: '123',
  studentId: 's1',
  coachId: 'c1',
  date: new Date(),
  active: false, // Updated to new interface
  exercises: [
    {
      id: 'e1',
      exercise: { id: '1', name: 'Sentadilla', muscleGroup: 'Pierna', defaultRestSeconds: 180 },
      sets: [{ id: 's1', weight: 100, reps: 5, rpe: 8, completedAt: new Date() }, { id: 's2', weight: 105, reps: 5, rpe: 9, completedAt: new Date() }]
    },
    {
      id: 'e2',
      exercise: { id: '2', name: 'Press Banca', muscleGroup: 'Pecho', defaultRestSeconds: 120 },
      sets: [{ id: 's3', weight: 80, reps: 8, rpe: 7, completedAt: new Date() }, { id: 's4', weight: 80, reps: 8, rpe: 8, completedAt: new Date() }]
    }
  ]
}

const StudentDashboard: React.FC<{ user: User }> = ({ user }) => {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Hola, {user.name}</h1>
        <p className="text-slate-500 dark:text-slate-400">Resumen de tu progreso.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 flex flex-col gap-1">
          <span className="text-xs text-gray-400 uppercase font-bold">Sesiones</span>
          <span className="text-2xl font-bold text-slate-900 dark:text-white">12</span>
          <span className="text-xs text-green-500 flex items-center gap-1"><TrendingUp size={12} /> +2 esta sem.</span>
        </Card>
        <Card className="p-4 flex flex-col gap-1">
          <span className="text-xs text-gray-400 uppercase font-bold">Volumen</span>
          <span className="text-2xl font-bold text-slate-900 dark:text-white">42t</span>
          <span className="text-xs text-green-500 flex items-center gap-1"><TrendingUp size={12} /> +5% vs prom.</span>
        </Card>

      </div>

      {/* Charts Section */}
      <div className="space-y-6">
        <h3 className="text-xl font-bold flex items-center gap-2">
          <TrendingUp size={20} /> Historial 1RM Estimado
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-6">
            <div className="flex justify-between mb-6">
              <h4 className="font-bold">Sentadilla</h4>
              <Badge>Pierna</Badge>
            </div>
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={DATA_SQUAT}>
                  <defs>
                    <linearGradient id="colorRmSquat" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.5} />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                  <YAxis hide domain={['dataMin - 10', 'dataMax + 10']} />
                  <Tooltip
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', backgroundColor: 'var(--tw-prose-body)' }}
                    itemStyle={{ color: '#0f172a', fontWeight: 'bold' }}
                  />
                  <Area type="monotone" dataKey="rm" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorRmSquat)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex justify-between mb-6">
              <h4 className="font-bold">Press Banca</h4>
              <Badge color="bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400">Empuje</Badge>
            </div>
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={DATA_BENCH}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.5} />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                  <YAxis hide domain={['dataMin - 5', 'dataMax + 5']} />
                  <Tooltip
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    itemStyle={{ color: '#0f172a', fontWeight: 'bold' }}
                  />
                  <Line type="monotone" dataKey="rm" stroke="#f97316" strokeWidth={3} dot={{ r: 4, fill: '#f97316', strokeWidth: 0 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      </div>

      <div className="pb-10">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><Calendar size={20} /> Actividad Reciente</h3>
        <div className="space-y-3">
          {[1, 2, 3].map((_, i) => (
            <Card key={i} className="flex items-center gap-4 p-4">
              <div className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-slate-800 flex items-center justify-center text-gray-500 dark:text-gray-400">
                <Zap size={20} />
              </div>
              <div>
                <h5 className="font-bold text-slate-900 dark:text-white">Hipertrofia Pierna</h5>
                <p className="text-sm text-slate-500 dark:text-slate-400">Octubre {30 - i * 2} • Completado</p>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;