import { CompletedSession } from '../services/dataService';

export interface ExerciseStats {
    date: string; // ISO date string
    rawDate: Date;
    rm: number;
    volume: number;
    maxWeight: number;
    rpe: number;
}

export interface PersonalRecord {
    exercise: string;
    kg: number;
    date: Date;
    deltaPct: number | null;
    isNew30d: boolean;
}

export interface StrengthGainExercise {
    name: string;
    pct: number;
}

export interface StrengthGain {
    pct: number | null;
    exercises: StrengthGainExercise[];
    hasData: boolean;
}

export interface ComparisonSeries {
    key: string;
    name: string;
    color: string;
    data: ExerciseStats[];
}

export interface ComparisonPoint {
    date: string;
    rawDate: Date;
    [key: string]: string | Date | ExerciseStats | null;
}

export interface ScoreBreakdown {
    label: string;
    pts: number;
    max: number;
    color: string;
}

export interface OkkoScore {
    score: number | null;
    zone: { label: string; color: string } | null;
    breakdown: ScoreBreakdown[];
    hasData: boolean;
}

export interface PlanScoreInfo {
    days: number;
    durationWeeks: number | null;
    hasPlan: boolean;
    exercises: string[];
}

export const OKKO_ZONES = [
    { min: 80, label: 'Excelente', color: '#10b981' },
    { min: 60, label: 'Bueno', color: '#0ea5e9' },
    { min: 40, label: 'Regular', color: '#f59e0b' },
    { min: 0, label: 'Bajo', color: '#ef4444' }
] as const;

export const SCORE_COLORS = {
    consistencia: '#3b82f6',
    progreso: '#a855f7',
    carga: '#22c55e'
};

// Parses a plan duration string like "4 semanas" / "8 semanas" into weeks (or null)
export const parsePlanDurationWeeks = (duration?: string): number | null => {
    if (!duration) return null;
    const match = duration.match(/(\d+)\s*semana/i);
    if (!match) return null;
    const weeks = parseInt(match[1], 10);
    return weeks > 0 ? weeks : null;
};

export interface StudentStats {
    totalSessions: number;
    totalVolume: number;
    streakCurrent: number;
    sessionsThisWeek: number;
    lastSessionDate: Date | null;
    sessionsLastWeek: number;
    streakBest: number;
    strengthGain: StrengthGain;
}

// Comparison windows for the "Ganancia de Fuerza" KPI (weeks vs weeks)
export const STRENGTH_WINDOWS = {
    '2v2': { weeks: 2, label: 'Corta', desc: 'Detecta cambios recientes rápido, pero es sensible a variaciones puntuales.' },
    '4v4': { weeks: 4, label: 'Media', desc: 'Equilibrio entre actualidad y estabilidad. Ventana recomendada.' },
    '8v8': { weeks: 8, label: 'Larga', desc: 'Muy estable, refleja tendencias de largo plazo.' }
} as const;
export type StrengthWindowKey = keyof typeof STRENGTH_WINDOWS;

const WEEK_MS = 7 * 24 * 3600 * 1000;
const DAY_MS = 24 * 3600 * 1000;

// Epley Formula: 1RM = Weight * (1 + Reps/30)
export const calculate1RM = (weight: number, reps: number): number => {
    if (reps === 1) return weight;
    if (reps === 0) return 0;
    return Math.round(weight * (1 + reps / 30));
};

// Sunday-based start of week (matches sessionsThisWeek calculation)
const startOfWeek = (d: Date): Date => {
    const s = new Date(d);
    s.setHours(0, 0, 0, 0);
    s.setDate(s.getDate() - s.getDay());
    return s;
};

const weekIndex = (d: Date): number => Math.round(startOfWeek(d).getTime() / WEEK_MS);

// Consecutive weeks with at least 1 session, walking backwards from the most recent active week
const calculateStreak = (sortedDesc: CompletedSession[]): number => {
    if (sortedDesc.length === 0) return 0;
    const activeWeeks = new Set(sortedDesc.map(s => weekIndex(s.date)));
    let w = weekIndex(new Date());
    if (!activeWeeks.has(w)) w -= 1;
    let streak = 0;
    while (activeWeeks.has(w)) {
        streak++;
        w -= 1;
    }
    return streak;
};

// Longest historical run of consecutive active weeks
const calculateStreakBest = (sortedDesc: CompletedSession[]): number => {
    const indices = [...new Set(sortedDesc.map(s => weekIndex(s.date)))].sort((a, b) => a - b);
    let best = 0;
    let run = 0;
    let prev: number | null = null;
    indices.forEach(i => {
        run = prev !== null && i === prev + 1 ? run + 1 : 1;
        if (run > best) best = run;
        prev = i;
    });
    return best;
};

export const processStats = (sessions: CompletedSession[]): StudentStats => {
    if (sessions.length === 0) {
        return {
            totalSessions: 0,
            totalVolume: 0,
            streakCurrent: 0,
            sessionsThisWeek: 0,
            lastSessionDate: null,
            sessionsLastWeek: 0,
            streakBest: 0,
            strengthGain: { pct: null, exercises: [], hasData: false }
        };
    }

    // Sort by Date Descending
    const sorted = [...sessions].sort((a, b) => b.date.getTime() - a.date.getTime());

    const totalVolume = sorted.reduce((sum, s) => sum + s.totalVolume, 0);

    // Sessions this week / last week calculation
    const now = new Date();
    const thisWeekStart = startOfWeek(now);
    const lastWeekStart = new Date(thisWeekStart.getTime() - WEEK_MS);

    const sessionsThisWeek = sorted.filter(s => s.date >= thisWeekStart).length;
    const sessionsLastWeek = sorted.filter(s => s.date >= lastWeekStart && s.date < thisWeekStart).length;

    return {
        totalSessions: sorted.length,
        totalVolume,
        streakCurrent: calculateStreak(sorted),
        sessionsThisWeek,
        lastSessionDate: sorted[0].date,
        sessionsLastWeek,
        streakBest: calculateStreakBest(sorted),
        strengthGain: getStrengthGain(sorted, STRENGTH_WINDOWS['4v4'].weeks)
    };
};

// Returns stats series for a specific exercise name
export const getExerciseProgress = (sessions: CompletedSession[], exerciseName: string): ExerciseStats[] => {
    const stats: ExerciseStats[] = [];

    // Iterate sessions chronologically (oldest to newest)
    const chrono = [...sessions].sort((a, b) => a.date.getTime() - b.date.getTime());

    chrono.forEach(session => {
        // Find if the session contains the exercise
        const exData = session.exercises.find(e => e.name === exerciseName);

        if (exData) {
            // Calculate best 1RM for this day, total volume for this exercise
            let best1RM = 0;
            let dayVolume = 0;
            let maxWeight = 0;
            let avgRpe = 0;
            let setCount = 0;

            exData.sets.forEach(set => {
                const rm = calculate1RM(set.weight, set.reps);
                if (rm > best1RM) best1RM = rm;
                if (set.weight > maxWeight) maxWeight = set.weight;

                dayVolume += set.weight * set.reps;
                if (set.rpe > 0) {
                    avgRpe += set.rpe;
                    setCount++;
                }
            });

            stats.push({
                date: session.date.toLocaleDateString('es-CL', { day: 'numeric', month: 'short' }),
                rawDate: session.date,
                rm: best1RM,
                volume: Math.ceil(dayVolume * 100) / 100,
                maxWeight,
                rpe: setCount > 0 ? parseFloat((avgRpe / setCount).toFixed(1)) : 0
            });
        }
    });

    return stats;
};

// Every time an exercise sets a new best estimated 1RM, it becomes a PR event.
// Sorted by date descending; the first record per exercise is its current best.
export const getPersonalRecords = (sessions: CompletedSession[]): PersonalRecord[] => {
    const chrono = [...sessions].sort((a, b) => a.date.getTime() - b.date.getTime());
    const bestByExercise = new Map<string, number>();
    const records: PersonalRecord[] = [];
    const cutoff30 = new Date(Date.now() - 30 * DAY_MS);

    chrono.forEach(session => {
        session.exercises.forEach(ex => {
            let best = 0;
            ex.sets.forEach(set => {
                const rm = calculate1RM(set.weight, set.reps);
                if (rm > best) best = rm;
            });
            if (best === 0) return;

            const prevBest = bestByExercise.get(ex.name) || 0;
            if (best > prevBest) {
                bestByExercise.set(ex.name, best);
                records.push({
                    exercise: ex.name,
                    kg: best,
                    date: session.date,
                    deltaPct: prevBest > 0 ? parseFloat((((best - prevBest) / prevBest) * 100).toFixed(1)) : null,
                    isNew30d: session.date >= cutoff30
                });
            }
        });
    });

    return records.sort((a, b) => b.date.getTime() - a.date.getTime());
};

// Strength gain: best estimated 1RM in the last N weeks vs the N previous weeks,
// computed on the top-3 exercises by frequency within the compared range.
// When `exerciseNames` is provided, only those exercises are considered (e.g. the student's plan).
export const getStrengthGain = (sessions: CompletedSession[], windowWeeks: number, exerciseNames?: string[]): StrengthGain => {
    const now = new Date();
    const windowMs = windowWeeks * WEEK_MS;
    const currentStart = new Date(now.getTime() - windowMs);
    const prevStart = new Date(now.getTime() - 2 * windowMs);

    const relevant = sessions.filter(s => s.date >= prevStart && s.date <= now);
    const nameFilter = exerciseNames && exerciseNames.length > 0 ? new Set(exerciseNames) : null;

    // Frequency within the compared range (optionally restricted to the plan)
    const freq = new Map<string, number>();
    relevant.forEach(s => s.exercises.forEach(e => {
        if (nameFilter && !nameFilter.has(e.name)) return;
        freq.set(e.name, (freq.get(e.name) || 0) + 1);
    }));
    const topExercises = Array.from(freq.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(e => e[0]);

    const best1RMInRange = (exName: string, from: Date, to: Date): number => {
        let best = 0;
        relevant.forEach(s => {
            if (s.date < from || s.date > to) return;
            const ex = s.exercises.find(e => e.name === exName);
            if (!ex) return;
            ex.sets.forEach(set => {
                const rm = calculate1RM(set.weight, set.reps);
                if (rm > best) best = rm;
            });
        });
        return best;
    };

    const perExercise: StrengthGainExercise[] = [];
    topExercises.forEach(name => {
        const cur = best1RMInRange(name, currentStart, now);
        const prev = best1RMInRange(name, prevStart, currentStart);
        if (cur > 0 && prev > 0) {
            perExercise.push({
                name,
                pct: parseFloat((((cur - prev) / prev) * 100).toFixed(1))
            });
        }
    });

    if (perExercise.length === 0) {
        return { pct: null, exercises: [], hasData: false };
    }

    const avg = perExercise.reduce((sum, e) => sum + e.pct, 0) / perExercise.length;
    return {
        pct: parseFloat(avg.toFixed(1)),
        exercises: perExercise,
        hasData: true
    };
};

// Display helper: "+12%", "-3.5%", "0%"
export const formatPct = (p: number): string => {
    if (p === 0) return '0%';
    const rounded = Math.abs(p) < 10 ? p.toFixed(1) : String(Math.round(p));
    return `${p > 0 ? '+' : ''}${rounded}%`;
};

// OKKO Score (0-100), anchored to the student's plan:
// - Consistencia (50): average weekly compliance vs plan days over the plan window (35)
//   + active weeks in the plan window (15). The current (incomplete) week is excluded,
//   so rest days are never counted as absences. Without a plan: consistency fallback.
// - Progreso (30): strength gain over the compared window, 0-30 linear between -5% and +5%.
//   Without data: neutral (15).
// - Carga (20): balance between this week's volume and last week's (symmetric, so planned
//   deloads and spikes are treated as balance, not absence).
export const getOkkoScore = (sessions: CompletedSession[], strengthGain: StrengthGain, plan: PlanScoreInfo | null): OkkoScore => {
    if (sessions.length === 0) {
        return { score: null, zone: null, breakdown: [], hasData: false };
    }

    const now = new Date();
    const thisWeekStart = startOfWeek(now);
    const lastWeekStart = new Date(thisWeekStart.getTime() - WEEK_MS);

    const sessionsThisWeek = sessions.filter(s => s.date >= thisWeekStart).length;

    // Plan window (complete weeks only — the current partial week is never counted)
    const planWeeks = plan?.hasPlan
        ? (plan.durationWeeks && plan.durationWeeks > 0 ? Math.min(plan.durationWeeks, 52) : 4)
        : 4;
    let completeWeeks = 0;
    let activeWeeks = 0;
    for (let w = planWeeks - 1; w >= 0; w--) {
        const weekStart = new Date(now.getTime() - w * WEEK_MS);
        if (weekStart >= thisWeekStart) continue; // skip current (incomplete) week
        completeWeeks++;
        if (sessions.some(s => s.date >= weekStart && s.date < new Date(weekStart.getTime() + WEEK_MS))) {
            activeWeeks++;
        }
    }
    const sessionsInWindow = sessions.filter(s => s.date >= new Date(now.getTime() - planWeeks * WEEK_MS) && s.date < thisWeekStart).length;

    // Consistencia (50)
    let consistencia: number;
    if (plan?.hasPlan && plan.days > 0) {
        if (completeWeeks > 0) {
            const avgPerWeek = sessionsInWindow / completeWeeks;
            consistencia = Math.min(avgPerWeek / plan.days, 1) * 35 + Math.min(activeWeeks / completeWeeks, 1) * 15;
        } else {
            // Window just started: judge by the current week so far
            consistencia = Math.min(sessionsThisWeek / plan.days, 1) * 50;
        }
    } else {
        consistencia = completeWeeks > 0
            ? Math.min(activeWeeks / completeWeeks, 1) * 50
            : (sessionsThisWeek > 0 ? 50 : 0);
    }

    // Progreso (30)
    let progreso = 15; // neutral when no comparable data
    if (strengthGain.hasData && strengthGain.pct !== null) {
        progreso = 30 * Math.min(Math.max((strengthGain.pct + 5) / 10, 0), 1);
    }

    // Carga (20): symmetric volume balance between the two last COMPLETE weeks.
    // The current (incomplete) week is never compared, so rest days don't drop it to 0.
    const volumeInWeek = (from: Date, to: Date) =>
        sessions.filter(s => s.date >= from && s.date < to).reduce((sum, s) => sum + s.totalVolume, 0);
    const lastWeekVolume = volumeInWeek(lastWeekStart, thisWeekStart);
    const prevWeekVolume = volumeInWeek(new Date(lastWeekStart.getTime() - WEEK_MS), lastWeekStart);
    let carga: number;
    if (lastWeekVolume > 0 && prevWeekVolume > 0) {
        carga = 20 * (Math.min(lastWeekVolume, prevWeekVolume) / Math.max(lastWeekVolume, prevWeekVolume));
    } else if (lastWeekVolume > 0) {
        carga = 10; // only one complete week yet: neutral
    } else {
        carga = sessionsThisWeek > 0 ? 20 : 0;
    }

    const score = Math.round(consistencia + progreso + carga);
    const zone = OKKO_ZONES.find(z => score >= z.min) ?? null;

    return {
        score,
        zone,
        breakdown: [
            { label: 'Consistencia', pts: Math.round(consistencia), max: 50, color: SCORE_COLORS.consistencia },
            { label: 'Progreso', pts: Math.round(progreso), max: 30, color: SCORE_COLORS.progreso },
            { label: 'Carga', pts: Math.round(carga), max: 20, color: SCORE_COLORS.carga }
        ],
        hasData: true
    };
};

// Merges multiple exercise series into one time series (union of dates).
// Each point holds a value object per series key (null where the exercise wasn't performed).
export const mergeExerciseSeries = (series: ComparisonSeries[]): ComparisonPoint[] => {
    const dateMap = new Map<string, Date>();
    series.forEach(s => s.data.forEach(d => {
        if (!dateMap.has(d.date)) dateMap.set(d.date, d.rawDate);
    }));

    const points: ComparisonPoint[] = Array.from(dateMap.entries())
        .sort((a, b) => a[1].getTime() - b[1].getTime())
        .map(([date, rawDate]) => {
            const point: ComparisonPoint = { date, rawDate };
            series.forEach(s => { point[s.key] = null; });
            return point;
        });

    points.forEach(p => {
        series.forEach(s => {
            const entry = s.data.find(d => d.date === p.date);
            if (entry) p[s.key] = entry;
        });
    });

    return points;
};

// Flattens merged comparison data into a single flat array where each series key
// holds the numeric value (or null) for a given date. Charts must use ONE shared
// data array with plain keys so all lines align on the same X axis.
export const toFlatComparison = (
    comparisonData: ComparisonPoint[],
    series: ComparisonSeries[],
    field: 'rm' | 'volume' | 'rpe'
): Array<{ date: string; [key: string]: string | number | null }> =>
    comparisonData.map(p => {
        const row: { date: string; [key: string]: string | number | null } = { date: p.date };
        series.forEach(s => {
            const entry = p[s.key] as ExerciseStats | null;
            if (!entry) {
                row[s.key] = null;
                return;
            }
            const value = entry[field];
            row[s.key] = field === 'rpe' && value <= 0 ? null : value;
        });
        return row;
    });

// Returns all exercises performed by the student, sorted by frequency
export const getAllPerformedExercises = (sessions: CompletedSession[]): string[] => {
    const counts = new Map<string, number>();
    sessions.forEach(s => {
        s.exercises.forEach(e => {
            counts.set(e.name, (counts.get(e.name) || 0) + 1);
        });
    });

    // Sort by frequency
    return Array.from(counts.entries())
        .sort((a, b) => b[1] - a[1]) // Most frequent first
        .map(e => e[0]);
};
