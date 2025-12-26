import { CompletedSession } from '../services/dataService';

export interface ExerciseStats {
    date: string; // ISO date string
    rawDate: Date;
    rm: number;
    volume: number;
    maxWeight: number;
    rpe: number;
}

export interface StudentStats {
    totalSessions: number;
    totalVolume: number;
    streakCurrent: number;
    sessionsThisWeek: number;
    lastSessionDate: Date | null;
}

// Epley Formula: 1RM = Weight * (1 + Reps/30)
export const calculate1RM = (weight: number, reps: number): number => {
    if (reps === 1) return weight;
    if (reps === 0) return 0;
    return Math.round(weight * (1 + reps / 30));
};

export const processStats = (sessions: CompletedSession[]): StudentStats => {
    if (sessions.length === 0) {
        return {
            totalSessions: 0,
            totalVolume: 0,
            streakCurrent: 0,
            sessionsThisWeek: 0,
            lastSessionDate: null
        };
    }

    // Sort by Date Descending
    const sorted = [...sessions].sort((a, b) => b.date.getTime() - a.date.getTime());

    const totalVolume = sorted.reduce((sum, s) => sum + s.totalVolume, 0);

    // Sessions this week calculation
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay()); // Sunday
    startOfWeek.setHours(0, 0, 0, 0);

    const sessionsThisWeek = sorted.filter(s => s.date >= startOfWeek).length;

    return {
        totalSessions: sorted.length,
        totalVolume,
        streakCurrent: calculateStreak(sorted),
        sessionsThisWeek,
        lastSessionDate: sorted[0].date
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
                volume: dayVolume,
                maxWeight,
                rpe: setCount > 0 ? parseFloat((avgRpe / setCount).toFixed(1)) : 0
            });
        }
    });

    return stats;
};

const calculateStreak = (sortedSessions: CompletedSession[]): number => {
    // Basic streak: consecutive weeks? consecutive days?
    // Let's do simple: Number of weeks with at least 1 session in the last X weeks
    // Or just "Sessions in last 7 days"? 
    // Let's return "Active Weeks Streak" (weeks with activity walking backwards)
    // This is a bit complex for MVP. Let's return just 0 for now or a simpler metric later.
    return 0;
};

export const getTopExercises = (sessions: CompletedSession[]): string[] => {
    const counts = new Map<string, number>();
    sessions.forEach(s => {
        s.exercises.forEach(e => {
            counts.set(e.name, (counts.get(e.name) || 0) + 1);
        });
    });

    // Sort by frequency
    return Array.from(counts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5) // Top 5
        .map(e => e[0]);
};
