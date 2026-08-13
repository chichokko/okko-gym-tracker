import React, { useState, useEffect, useRef, useMemo } from 'react';
import { User } from '../../../types';
import { Card, Badge, LoadingOverlay, EmptyState, Modal, Input, Button, IconButton, toast } from '../../ui';
import { Calendar, TrendingUp, Dumbbell, Trophy, Search, Share2, Loader2, Flame, AlertTriangle, Info, Check, CalendarRange } from 'lucide-react';
import * as DataService from '../../../services/dataService';
import {
  processStats, getExerciseProgress, getAllPerformedExercises, getPersonalRecords, getStrengthGain, getOkkoScore,
  mergeExerciseSeries, toFlatComparison, parsePlanDurationWeeks,
  StudentStats, PersonalRecord, ComparisonSeries, PlanScoreInfo,
  STRENGTH_WINDOWS, StrengthWindowKey, formatPct
} from '../../../utils/gymMetrics';
import { SafeChart } from './SafeChart';
import { ProgressExportCard } from './ProgressExportCard';
import { toPng } from 'html-to-image';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  LineChart, Line, ScatterChart, Scatter, ZAxis
} from 'recharts';

const SERIES_COLORS = ['#3b82f6', '#22c55e', '#f97316'];
const MAX_COMPARE = 3;
const DAY_MS = 24 * 3600 * 1000;

const toDateInput = (d: Date): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

type WindowChoice = StrengthWindowKey | 'custom';

const ScoreRing: React.FC<{ score: number; color: string; size?: number }> = ({ score, color, size = 56 }) => {
  const radius = size / 2 - 5;
  const circumference = 2 * Math.PI * radius;
  const filled = (score / 100) * circumference;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="flex-shrink-0">
      <circle cx={size / 2} cy={size / 2} r={radius} strokeWidth="6" fill="none" className="stroke-slate-100 dark:stroke-slate-800" />
      <circle
        cx={size / 2} cy={size / 2} r={radius} strokeWidth="6" fill="none"
        stroke={color} strokeLinecap="round"
        strokeDasharray={`${filled} ${circumference}`}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text
        x={size / 2} y={size / 2 + 1}
        textAnchor="middle" dominantBaseline="central"
        className="fill-slate-900 dark:fill-white" fontSize={size * 0.3} fontWeight="800"
      >
        {score}
      </text>
    </svg>
  );
};

const StudentDashboard: React.FC<{ user: User }> = ({ user }) => {
  const [sessions, setSessions] = useState<DataService.CompletedSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<StudentStats | null>(null);
  const [planInfo, setPlanInfo] = useState<PlanScoreInfo | null>(null);
  const [coachName, setCoachName] = useState<string | null>(null);

  // Chart State
  const [selectedExercises, setSelectedExercises] = useState<string[]>([]);
  const [pendingSelection, setPendingSelection] = useState<string[]>([]);
  const [exerciseOptions, setExerciseOptions] = useState<string[]>([]);
  const [chartMode, setChartMode] = useState<'1rm' | 'volume' | 'rpe'>('1rm');
  const [exercisePickerOpen, setExercisePickerOpen] = useState(false);
  const [exSearchTerm, setExSearchTerm] = useState('');
  const [exporting, setExporting] = useState(false);
  const exportCardRef = useRef<HTMLDivElement>(null);
  const [windowChoice, setWindowChoice] = useState<WindowChoice>(() => {
    const saved = localStorage.getItem('okko_strength_window');
    if (saved === 'custom') return 'custom';
    return saved === '2v2' || saved === '4v4' || saved === '8v8' ? saved : '4v4';
  });
  const [customFrom, setCustomFrom] = useState<string>(() => toDateInput(new Date(Date.now() - 56 * DAY_MS)));
  const [customTo, setCustomTo] = useState<string>(() => toDateInput(new Date()));

  const records = useMemo(() => getPersonalRecords(sessions), [sessions]);

  // Global progress window: defines the date range shown everywhere (charts, gain, score)
  const range = useMemo(() => {
    if (windowChoice === 'custom') {
      const from = customFrom ? new Date(`${customFrom}T00:00:00`) : null;
      const to = customTo ? new Date(`${customTo}T23:59:59`) : null;
      return {
        from: from && !isNaN(from.getTime()) ? from : new Date(Date.now() - 56 * DAY_MS),
        to: to && !isNaN(to.getTime()) ? to : new Date()
      };
    }
    const totalWeeks = STRENGTH_WINDOWS[windowChoice].weeks * 2;
    return { from: new Date(Date.now() - totalWeeks * 7 * DAY_MS), to: new Date() };
  }, [windowChoice, customFrom, customTo]);

  // Half-window for the strength gain comparison (N vs N)
  const gainWeeks = useMemo(() => {
    if (windowChoice === 'custom') {
      const spanDays = (range.to.getTime() - range.from.getTime()) / DAY_MS;
      return Math.max(1, Math.round(spanDays / 7 / 2));
    }
    return STRENGTH_WINDOWS[windowChoice].weeks;
  }, [windowChoice, range]);

  const strengthGain = useMemo(
    () => getStrengthGain(
      sessions,
      gainWeeks,
      planInfo && planInfo.exercises.length > 0 ? planInfo.exercises : undefined
    ),
    [sessions, gainWeeks, planInfo]
  );
  const okkoScore = useMemo(() => getOkkoScore(sessions, strengthGain, planInfo), [sessions, strengthGain, planInfo]);
  // Current best per exercise (first PR event per exercise in desc order)
  const currentPrs = useMemo(() => {
    const map = new Map<string, PersonalRecord>();
    records.forEach(r => { if (!map.has(r.exercise)) map.set(r.exercise, r); });
    return Array.from(map.values());
  }, [records]);

  // Comparison series for the chart (1-3 exercises), filtered to the global window
  const series = useMemo<ComparisonSeries[]>(
    () => selectedExercises.map((name, i) => ({
      key: String(i),
      name,
      color: SERIES_COLORS[i % SERIES_COLORS.length],
      data: getExerciseProgress(sessions, name).filter(d => d.rawDate >= range.from && d.rawDate <= range.to)
    })),
    [sessions, selectedExercises, range]
  );
  const comparisonData = useMemo(() => mergeExerciseSeries(series), [series]);
  // Flat single-array dataset for the comparison chart (one shared X axis)
  const modeData = useMemo(
    () => toFlatComparison(comparisonData, series, chartMode === '1rm' ? 'rm' : chartMode === 'volume' ? 'volume' : 'rpe'),
    [comparisonData, series, chartMode]
  );
  const xTickInterval = useMemo(() => Math.max(1, Math.ceil(modeData.length / 8)), [modeData.length]);

  const filteredExercises = !exSearchTerm
    ? exerciseOptions
    : exerciseOptions.filter(e => e.toLowerCase().includes(exSearchTerm.toLowerCase()));

  useEffect(() => {
    loadData();
  }, [user.id]);

  const loadData = async () => {
    setLoading(true);

    const [data, planDetail, allExercises, coach] = await Promise.all([
      DataService.getCompletedSessions(user.id),
      DataService.getStudentPlanDetail(user.id),
      DataService.getExercises(),
      DataService.getStudentCoachName(user.id)
    ]);
    setSessions(data);
    setStats(processStats(data));
    setCoachName(coach);

    const performed = getAllPerformedExercises(data);
    setExerciseOptions(performed);
    setSelectedExercises(prev => {
      const kept = prev.filter(e => performed.includes(e));
      return kept.length > 0 ? kept.slice(0, MAX_COMPARE) : (performed[0] ? [performed[0]] : []);
    });

    if (planDetail) {
      const nameById = new Map(allExercises.map(e => [e.id, e.name]));
      const planExerciseNames = [...new Set(
        planDetail.exerciseIds.map(id => nameById.get(id)).filter((n): n is string => Boolean(n))
      )];
      setPlanInfo({
        days: planDetail.dayCount,
        durationWeeks: parsePlanDurationWeeks(planDetail.duration),
        hasPlan: true,
        exercises: planExerciseNames
      });
    } else {
      setPlanInfo(null);
    }

    setLoading(false);
  };

  const changeWindow = (choice: WindowChoice) => {
    setWindowChoice(choice);
    localStorage.setItem('okko_strength_window', choice);
  };

  const windowInfoText = windowChoice === 'custom'
    ? `Personalizado: ${customFrom ? new Date(`${customFrom}T00:00:00`).toLocaleDateString('es-CL', { day: 'numeric', month: 'short' }) : '—'} → ${customTo ? new Date(`${customTo}T00:00:00`).toLocaleDateString('es-CL', { day: 'numeric', month: 'short' }) : '—'}`
    : `Ventana ${STRENGTH_WINDOWS[windowChoice].label.toLowerCase()} — últimas ${STRENGTH_WINDOWS[windowChoice].weeks * 2} semanas`;

  const openPicker = () => {
    setPendingSelection(selectedExercises);
    setExSearchTerm('');
    setExercisePickerOpen(true);
  };

  const closePicker = () => {
    setExercisePickerOpen(false);
    setExSearchTerm('');
  };

  const togglePending = (ex: string) => {
    setPendingSelection(prev =>
      prev.includes(ex)
        ? prev.filter(e => e !== ex)
        : prev.length >= MAX_COMPARE ? prev : [...prev, ex]
    );
  };

  const confirmSelection = () => {
    setSelectedExercises(pendingSelection);
    closePicker();
  };

  const handleExport = async () => {
    const card = exportCardRef.current;
    if (!card || exporting) return;
    setExporting(true);

    // Capture works reliably only when the node is laid out on-screen.
    // We move the card into the viewport while an opaque overlay hides it from the user.
    const originalStyle = { top: card.style.top, left: card.style.left, zIndex: card.style.zIndex };
    card.style.top = '0';
    card.style.left = '0';
    card.style.zIndex = '9999';

    try {
      await document.fonts.ready;
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));

      const FONT_CSS = `
@font-face {
    font-family: 'Archivo';
    font-style: normal;
    font-weight: 100 900;
    font-display: swap;
    src: url(https://fonts.gstatic.com/s/archivo/v24/KFO7CnqFr9u3Bj94nArxLIB_C-7G.woff2) format('woff2'),
         url(https://fonts.gstatic.com/s/archivo/v24/KFO7CnqFr9u3Bj94nArxLIB_A-7G.woff2) format('woff2'),
         url(https://fonts.gstatic.com/s/archivo/v24/KFO7CnqFr9u3Bj94nArxLIB_B-7G.woff2) format('woff2');
}`;

      const styleEl = document.createElement('style');
      styleEl.textContent = FONT_CSS;
      document.head.appendChild(styleEl);

      const options = {
        pixelRatio: 1,
        cacheBust: true,
        backgroundColor: '#f8fafc',
      };

      let dataUrl: string;
      try {
        dataUrl = await toPng(card, options);
      } catch (fontError) {
        console.warn('Export failed, retrying:', fontError);
        dataUrl = await toPng(card, { ...options, skipFonts: true });
      }

      document.head.removeChild(styleEl);
      const link = document.createElement('a');
      link.download = `progreso-${user.name.split(' ')[0].toLowerCase()}-${new Date().toISOString().slice(0, 10)}.png`;
      link.href = dataUrl;
      link.click();
      toast.success('Resumen exportado como imagen');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Error al exportar la imagen');
    } finally {
      card.style.top = originalStyle.top;
      card.style.left = originalStyle.left;
      card.style.zIndex = originalStyle.zIndex;
      setExporting(false);
    }
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

  const planDays = planInfo?.hasPlan && planInfo.days > 0 ? planInfo.days : null;

  return (
    <div className="space-y-8 animate-in fade-in pb-20">
      <div className="flex items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Hola, {user.name}</h1>
          <p className="text-slate-500 dark:text-slate-400">Aquí tienes el resumen de tu rendimiento.</p>
        </div>
        <IconButton
          onClick={handleExport}
          disabled={exporting}
          title="Exportar resumen (PNG)"
          className="border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-blue-400 dark:hover:border-blue-500 flex-shrink-0"
        >
          {exporting ? <Loader2 size={20} className="animate-spin" /> : <Share2 size={20} />}
        </IconButton>
      </div>

      {/* Global progress window */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3">
        <span className="text-xs uppercase font-bold text-gray-400 flex items-center gap-1.5">
          <CalendarRange size={14} className="text-blue-500" /> Ventana de Progreso
          <span title={windowChoice === 'custom' ? 'Rango de fechas personalizado' : STRENGTH_WINDOWS[windowChoice].desc}>
            <Info size={12} className="text-slate-400" />
          </span>
        </span>
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
          {(['2v2', '4v4', '8v8', 'custom'] as const).map(choice => (
            <button
              key={choice}
              type="button"
              title={choice === 'custom' ? 'Rango de fechas personalizado' : STRENGTH_WINDOWS[choice].desc}
              onClick={() => changeWindow(choice)}
              className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${
                windowChoice === choice
                  ? 'bg-white dark:bg-slate-700 shadow text-blue-600 dark:text-blue-400'
                  : 'text-slate-500'
              }`}
            >
              {choice === 'custom' ? 'Personalizado' : choice}
            </button>
          ))}
        </div>
        {windowChoice === 'custom' && (
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={customFrom}
              max={customTo}
              onChange={e => setCustomFrom(e.target.value)}
              className="h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-700 dark:text-slate-200 outline-none focus:border-blue-400"
            />
            <span className="text-slate-400 text-sm">→</span>
            <input
              type="date"
              value={customTo}
              min={customFrom}
              onChange={e => setCustomTo(e.target.value)}
              className="h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-700 dark:text-slate-200 outline-none focus:border-blue-400"
            />
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Entrenos esta semana (meta desde la planificación activa) */}
        <Card className="p-4 flex flex-col gap-1 border-t-4 border-t-blue-500">
          <span
            className="text-xs text-gray-400 uppercase font-bold flex items-center gap-1"
            title={planDays ? `${planDays} días según su planificación activa` : 'Sin planificación activa'}
          >
            <Calendar size={12} className="text-blue-500" /> Esta Semana
          </span>
          <span className="text-2xl font-bold text-slate-900 dark:text-white">
            {stats?.sessionsThisWeek ?? 0}
            {planDays && <span className="text-sm font-normal text-slate-400"> / {planDays}</span>}
          </span>
          {planDays ? (
            <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-blue-500 transition-all"
                style={{ width: `${Math.min(100, ((stats?.sessionsThisWeek ?? 0) / planDays) * 100)}%` }}
              />
            </div>
          ) : (
            <span className="text-xs text-slate-500 italic">Sin planificación activa</span>
          )}
          <span className="text-xs text-slate-500">vs {stats?.sessionsLastWeek ?? 0} la semana pasada</span>
        </Card>

        {/* Racha */}
        <Card className="p-4 flex flex-col gap-1 border-t-4 border-t-orange-500">
          <span className="text-xs text-gray-400 uppercase font-bold flex items-center gap-1">
            <Flame size={12} className="text-orange-500" /> Racha
          </span>
          <span className="text-2xl font-bold text-slate-900 dark:text-white">
            {stats?.streakCurrent ?? 0}
            <span className="text-sm font-normal text-slate-400"> {(stats?.streakCurrent ?? 0) === 1 ? 'semana' : 'semanas'}</span>
          </span>
          <span className="text-xs text-slate-500">
            Tu mejor: {stats?.streakBest ?? 0} {(stats?.streakBest ?? 0) === 1 ? 'semana' : 'semanas'}
          </span>
        </Card>

        {/* OKKO Score */}
        <Card
          className="p-4 flex flex-col gap-1.5 border-t-4"
          style={{ borderTopColor: okkoScore?.zone?.color ?? '#94a3b8' }}
        >
          <span className="text-xs text-gray-400 uppercase font-bold flex items-center gap-1">
            <Trophy size={12} style={{ color: okkoScore?.zone?.color ?? '#94a3b8' }} /> OKKO Score
          </span>
          {okkoScore && okkoScore.score !== null && okkoScore.zone ? (
            <>
              <div className="flex items-center gap-3">
                <ScoreRing score={okkoScore.score} color={okkoScore.zone.color} />
                <div className="flex flex-col min-w-0">
                  <span className="text-base font-bold leading-tight truncate" style={{ color: okkoScore.zone.color }}>
                    {okkoScore.zone.label}
                  </span>
                  <span className="text-[10px] text-slate-500">{okkoScore.score} de 100</span>
                </div>
              </div>
              <div className="flex flex-col gap-1">
                {okkoScore.breakdown.map(b => (
                  <div key={b.label} className="flex flex-col gap-0.5">
                    <div className="flex justify-between text-[9px] leading-none">
                      <span className="text-slate-500">{b.label}</span>
                      <span className="font-bold text-slate-400">{b.pts}/{b.max}</span>
                    </div>
                    <div className="h-0.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${Math.min(100, (b.pts / b.max) * 100)}%`, backgroundColor: b.color }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <>
              <span className="text-2xl font-bold text-slate-300 dark:text-slate-600">—</span>
              <span className="text-xs text-slate-500">Necesita más historial.</span>
            </>
          )}
        </Card>

        {/* Ganancia de fuerza */}
        <Card className="p-4 flex flex-col gap-1 border-t-4 border-t-purple-500">
          <span className="text-xs text-gray-400 uppercase font-bold flex items-center gap-1">
            <TrendingUp size={12} className="text-purple-500" /> Ganancia de Fuerza
          </span>
          {strengthGain.hasData ? (
            <>
              <span className="text-2xl font-bold text-emerald-500">{formatPct(strengthGain.pct ?? 0)}</span>
              <span className="text-xs text-slate-500 truncate">{windowInfoText}</span>
            </>
          ) : (
            <>
              <span className="text-2xl font-bold text-slate-300 dark:text-slate-600">—</span>
              <span className="text-xs text-slate-500">Necesita más historial para esta ventana.</span>
            </>
          )}
        </Card>
      </div>

      {/* Warning for short comparison window */}
      {windowChoice === '2v2' && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-700 px-4 py-3 text-sm text-amber-700 dark:text-amber-300">
          <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
          <span>
            Ventana corta (2v2 semanas): ideal para detectar cambios recientes, pero sensible a variaciones puntuales.
            Usa 4v4 para más precisión.
          </span>
        </div>
      )}

      {/* Personal Records */}
      <div>
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Trophy size={20} className="text-yellow-500" /> Récords Actuales
        </h3>
        <Card className="p-2 md:p-4">
          {currentPrs.length === 0 ? (
            <p className="p-4 text-center text-sm text-slate-500">Aún no hay récords registrados.</p>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {currentPrs.map(r => (
                <div key={r.exercise} className="flex items-center gap-3 px-3 py-3">
                  <div className="w-10 h-10 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 flex items-center justify-center flex-shrink-0">
                    <Trophy size={18} className="text-yellow-500" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h5 className="font-bold text-slate-900 dark:text-white truncate capitalize">{r.exercise}</h5>
                    <p className="text-xs text-slate-500">
                      {r.date.toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="font-bold text-lg text-slate-900 dark:text-white">{r.kg} kg</span>
                    {r.deltaPct !== null && (
                      <span className={`text-xs font-bold ${r.deltaPct >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                        {formatPct(r.deltaPct)}
                      </span>
                    )}
                    {r.isNew30d && (
                      <Badge color="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
                        NUEVO
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Main Chart Section */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <TrendingUp size={20} /> Progreso por Ejercicio
            </h3>
          </div>

          <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
            <div className="w-full md:w-72">
              <button
                type="button"
                onClick={openPicker}
                className="h-12 w-full px-4 rounded-lg bg-gray-50 border border-gray-200 text-left hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all dark:bg-slate-800 dark:border-slate-700 dark:text-white dark:focus:border-blue-500 dark:focus:ring-blue-900 flex items-center gap-2"
              >
                <Search size={16} className="text-slate-400 flex-shrink-0" />
                <span className="text-sm truncate">
                  {selectedExercises.length === 0
                    ? 'Seleccionar ejercicio...'
                    : selectedExercises.length === 1
                      ? selectedExercises[0]
                      : `${selectedExercises.join(' · ')} (${selectedExercises.length})`}
                </span>
              </button>
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

        {/* Legend for comparison mode */}
        {series.length > 1 && (
          <div className="flex flex-wrap gap-3">
            {series.map(s => (
              <span key={s.key} className="flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-300">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                {s.name}
              </span>
            ))}
          </div>
        )}

        <Card className="p-4 md:p-6">
          {series.length === 0 ? (
            <p className="p-4 text-center text-sm text-slate-500">Selecciona al menos un ejercicio.</p>
          ) : series.length === 1 ? (
            <SafeChart height={300}>
              {chartMode === '1rm' ? (
                <AreaChart data={series[0].data}>
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
                <LineChart data={series[0].data}>
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
                  <Scatter name="RPE" data={series[0].data} fill="#f97316" shape="circle" />
                </ScatterChart>
              )}
            </SafeChart>
          ) : (
            <SafeChart height={300}>
              {chartMode === '1rm' || chartMode === 'volume' ? (
                <LineChart data={modeData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.3} />
                  <XAxis dataKey="date" interval={xTickInterval} tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                  <YAxis hide />
                  <Tooltip
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    labelStyle={{ color: '#64748b', fontSize: '12px' }}
                  />
                  {series.map(s => (
                    <Line
                      key={s.key}
                      type="monotone"
                      connectNulls
                      dataKey={s.key}
                      stroke={s.color}
                      strokeWidth={3}
                      dot={{ r: 4, fill: s.color, strokeWidth: 0 }}
                      name={s.name}
                    />
                  ))}
                </LineChart>
              ) : (
                <ScatterChart data={modeData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.3} />
                  <XAxis dataKey="date" type="category" interval={xTickInterval} tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} allowDuplicatedCategory={false} />
                  {series.map(s => (
                    <YAxis key={s.key} yAxisId={s.key} type="number" dataKey={s.key} domain={[0, 10]} hide />
                  ))}
                  <ZAxis type="number" range={[100, 300]} />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ borderRadius: '8px', border: 'none' }} />
                  {series.map(s => (
                    <Scatter key={s.key} name={s.name} yAxisId={s.key} dataKey={s.key} fill={s.color} shape="circle" />
                  ))}
                </ScatterChart>
              )}
            </SafeChart>
          )}
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

      {/* Exercise Picker Modal */}
      <Modal
        isOpen={exercisePickerOpen}
        onClose={closePicker}
        title="Seleccionar Ejercicio"
        size="sm"
      >
        <div className="space-y-3">
          <Input
            placeholder="Buscar ejercicio..."
            value={exSearchTerm}
            onChange={e => setExSearchTerm(e.target.value)}
          />
          <p className="text-xs text-slate-400">Elige hasta {MAX_COMPARE} ejercicios para comparar su progreso.</p>
          <div className="max-h-60 overflow-y-auto space-y-1">
            {filteredExercises.length === 0 ? (
              <p className="p-4 text-center text-slate-500 text-sm">No se encontraron ejercicios</p>
            ) : (
              filteredExercises.map(ex => {
                const selected = pendingSelection.includes(ex);
                const atLimit = !selected && pendingSelection.length >= MAX_COMPARE;
                return (
                  <button
                    key={ex}
                    type="button"
                    disabled={atLimit}
                    onClick={() => togglePending(ex)}
                    className={`w-full flex items-center gap-3 text-left px-4 py-3 rounded-lg transition-colors border ${
                      selected
                        ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 font-medium'
                        : 'border-transparent hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    } ${atLimit ? 'opacity-40 cursor-not-allowed' : ''}`}
                  >
                    <span
                      className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                        selected ? 'bg-blue-500 border-blue-500 text-white' : 'border-slate-300 dark:border-slate-600'
                      }`}
                    >
                      {selected && <Check size={14} />}
                    </span>
                    <span className="text-sm truncate">{ex}</span>
                  </button>
                );
              })
            )}
          </div>
          <div className="flex gap-3 pt-1">
            <Button variant="secondary" className="flex-1" onClick={closePicker}>Cancelar</Button>
            <Button className="flex-1" disabled={pendingSelection.length === 0} onClick={confirmSelection}>
              Comparar ({pendingSelection.length})
            </Button>
          </div>
        </div>
      </Modal>

      {/* Off-screen export canvas */}
      <ProgressExportCard
        ref={exportCardRef}
        studentName={user.name}
        coachName={coachName ?? undefined}
        stats={stats}
        series={series}
        comparisonData={comparisonData}
        okkoScore={okkoScore}
        planDays={planDays}
        strengthGain={strengthGain}
        strengthWindowLabel={windowChoice}
      />

      {/* Export overlay: hides the capture canvas while it's moved on-screen */}
      {exporting && (
        <div className="fixed inset-0 z-[10000] bg-slate-950/90 backdrop-blur-sm flex flex-col items-center justify-center gap-4">
          <Loader2 className="animate-spin text-white" size={40} />
          <p className="text-white font-medium">Generando imagen de progreso...</p>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;
