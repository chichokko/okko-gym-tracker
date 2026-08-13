import React from 'react';
import {
    ExerciseStats, StudentStats, StrengthGain, ComparisonSeries, ComparisonPoint, OkkoScore, formatPct, toFlatComparison
} from '../../../utils/gymMetrics';
import {
    AreaChart, Area, LineChart, Line, ScatterChart, Scatter,
    XAxis, YAxis, ZAxis, CartesianGrid
} from 'recharts';

interface ProgressExportCardProps {
    studentName: string;
    coachName?: string;
    stats: StudentStats | null;
    series: ComparisonSeries[];
    comparisonData: ComparisonPoint[];
    okkoScore: OkkoScore | null;
    planDays: number | null;
    strengthGain?: StrengthGain;
    strengthWindowLabel?: string;
    generatedAt?: Date;
}

const CHART_WIDTH = 968;
const CHART_HEIGHT = 300;

const FONT = `'Archivo', sans-serif`;

const FONT_CSS = `
@font-face {
    font-family: 'Archivo';
    font-style: normal;
    font-weight: 100 900;
    font-display: swap;
    src: url(https://fonts.gstatic.com/s/archivo/v24/KFO7CnqFr9u3Bj94nArxLIB_C-7G.woff2) format('woff2'),
         url(https://fonts.gstatic.com/s/archivo/v24/KFO7CnqFr9u3Bj94nArxLIB_A-7G.woff2) format('woff2'),
         url(https://fonts.gstatic.com/s/archivo/v24/KFO7CnqFr9u3Bj94nArxLIB_B-7G.woff2) format('woff2');
}
`;

const OkkoLogoLight: React.FC<{ width?: number }> = ({ width = 200 }) => (
    <svg width={width} viewBox="19.802 364.356 960.396 269.307" xmlns="http://www.w3.org/2000/svg">
        <g transform="matrix(1, 0, 0, 1, -103.224945, 102.505997)">
            <path d="M 531.575 302.144 C 530.575 301.444 531.075 299.944 532.275 299.944 L 598.775 299.944 C 608.975 299.944 618.975 303.144 627.175 309.144 L 716.975 374.344 L 716.975 314.344 C 716.975 306.344 723.475 299.944 731.375 299.944 L 767.575 299.944 C 768.275 299.944 768.775 300.544 768.775 301.144 L 768.775 493.844 C 768.775 494.544 768.175 495.044 767.575 495.044 L 731.375 495.044 C 723.375 495.044 716.975 488.544 716.975 480.644 L 716.975 420.444 L 627.275 485.744 C 618.975 491.744 608.975 495.044 598.775 495.044 L 532.275 495.044 C 531.075 495.044 530.575 493.544 531.575 492.844 L 657.675 399.444 C 658.975 398.444 658.975 396.544 657.675 395.544 L 531.575 302.144 Z" fill="#155EFB" />
            <path d="M 397.475 299.844 L 463.975 299.844 C 474.175 299.844 484.075 303.144 492.375 309.144 L 607.475 393.744 C 609.975 395.544 609.975 399.344 607.475 401.144 L 492.375 485.744 C 484.175 491.744 474.175 495.044 463.975 495.044 L 397.475 495.044 C 396.275 495.044 395.775 493.544 396.775 492.844 L 523.075 399.144 C 524.175 398.344 524.175 396.744 523.075 395.844 L 396.775 302.144 C 395.775 301.344 396.275 299.844 397.475 299.844 Z" fill="#FFFFFF" />
            <path d="M 270.475 296.844 L 310.175 296.844 C 378.175 296.844 419.975 335.544 419.975 398.744 C 419.975 461.244 379.375 498.144 310.175 498.144 L 270.475 498.144 C 203.675 498.144 163.675 460.944 163.675 398.744 C 163.675 335.544 204.275 296.844 270.475 296.844 Z M 271.675 446.244 L 310.075 446.244 C 342.375 446.244 364.975 432.844 364.975 398.344 C 364.975 364.144 342.375 348.644 310.075 348.644 L 271.675 348.644 C 238.075 348.644 218.575 366.644 218.575 398.344 C 218.575 429.144 237.275 446.244 271.675 446.244 Z" fill="#155EFB" />
            <path d="M 893.275 296.844 L 932.975 296.844 C 1000.98 296.844 1042.78 335.544 1042.78 398.744 C 1042.78 461.244 1002.17 498.144 932.975 498.144 L 893.275 498.144 C 826.475 498.144 786.475 460.944 786.475 398.744 C 786.575 335.544 827.075 296.844 893.275 296.844 Z M 894.475 446.244 L 932.875 446.244 C 965.175 446.244 987.775 432.844 987.775 398.344 C 987.775 364.144 965.175 348.644 932.875 348.644 L 894.475 348.644 C 860.975 348.644 841.375 366.644 841.375 398.344 C 841.475 429.144 860.075 446.244 894.475 446.244 Z" fill="#FFFFFF" />
        </g>
    </svg>
);

const ChartBlock: React.FC<{ title: string; color: string; legend?: Array<{ name: string; color: string }>; children: React.ReactNode }> = ({ title, legend, children }) => (
    <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 26, fontWeight: 700, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 12, color: '#0f172a' }}>
            {title}
        </div>
        {legend && (
            <div style={{ display: 'flex', gap: 24, marginBottom: 12, flexWrap: 'wrap' }}>
                {legend.map(l => (
                    <span key={l.name} style={{ fontSize: 18, color: '#64748b', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ width: 14, height: 14, borderRadius: 4, backgroundColor: l.color, display: 'inline-block' }} />
                        {l.name}
                    </span>
                ))}
            </div>
        )}
        <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 16, padding: '14px 8px' }}>
            {children}
        </div>
    </div>
);

const rpeScatterData = (series: ComparisonSeries, comparisonData: ComparisonPoint[]) =>
    comparisonData
        .filter(p => p[series.key] && (p[series.key] as ExerciseStats).rpe > 0)
        .map(p => ({ date: p.date, rpe: (p[series.key] as ExerciseStats).rpe }));

export const ProgressExportCard = React.forwardRef<HTMLDivElement, ProgressExportCardProps>(
    ({ studentName, coachName, stats, series, comparisonData, okkoScore, planDays, strengthGain, strengthWindowLabel = '4v4', generatedAt = new Date() }, ref) => {
        const hasRpe = series.some(s => s.data.some(d => d.rpe > 0));
        const multi = series.length > 1;
        const streakWeeks = stats?.streakCurrent ?? 0;
        const gainLabel = strengthGain?.hasData ? formatPct(strengthGain.pct ?? 0) : '—';
        const scoreValue = okkoScore?.score ?? null;
        const windowLabel = strengthWindowLabel === 'custom'
            ? 'Rango personalizado'
            : strengthWindowLabel === '2v2'
                ? '2 sem vs 2 previas'
                : strengthWindowLabel === '8v8'
                    ? '8 sem vs 8 previas'
                    : '4 sem vs 4 previas';

        const statCells: Array<{ label: string; value: string; sub?: string; color: string }> = [
            { label: 'Entrenos Esta Semana', value: `${stats?.sessionsThisWeek ?? 0}${planDays ? ` / ${planDays}` : ''}`, sub: `vs ${stats?.sessionsLastWeek ?? 0} la semana pasada`, color: '#3b82f6' },
            { label: 'Racha', value: `${streakWeeks} ${streakWeeks === 1 ? 'semana' : 'semanas'}`, sub: `Tu mejor: ${stats?.streakBest ?? 0}`, color: '#f97316' },
            { label: 'OKKO Score', value: scoreValue !== null ? `${scoreValue} / 100` : '—', sub: okkoScore?.zone?.label ?? 'Necesita más historial', color: okkoScore?.zone?.color ?? '#94a3b8' },
            { label: `Ganancia de Fuerza (${strengthWindowLabel})`, value: gainLabel, sub: strengthGain?.hasData ? windowLabel : 'Necesita más historial', color: '#a855f7' }
        ];

        const legend = multi ? series.map(s => ({ name: s.name, color: s.color })) : undefined;

        const singleChart = (mode: '1rm' | 'volume') => {
            const s = series[0];
            const data = s.data;
            return (
                <ChartBlock title={`${mode === '1rm' ? '1RM Estimado' : 'Volumen'} — ${s.name}`} color={mode === '1rm' ? '#3b82f6' : '#22c55e'}>
                    {mode === '1rm' ? (
                        <AreaChart width={CHART_WIDTH} height={CHART_HEIGHT} data={data} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
                            <defs>
                                <linearGradient id="exportRm" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.35} />
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                            <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fontSize: 16, fill: '#94a3b8' }} />
                            <YAxis hide domain={['dataMin - 5', 'dataMax + 5']} />
                            <Area type="monotone" dataKey="rm" stroke="#3b82f6" strokeWidth={4} fill="url(#exportRm)" isAnimationActive={false} />
                        </AreaChart>
                    ) : (
                        <LineChart width={CHART_WIDTH} height={CHART_HEIGHT} data={data} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                            <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fontSize: 16, fill: '#94a3b8' }} />
                            <YAxis hide />
                            <Line type="monotone" dataKey="volume" stroke="#22c55e" strokeWidth={4} dot={{ r: 5, fill: '#22c55e', strokeWidth: 0 }} isAnimationActive={false} />
                        </LineChart>
                    )}
                </ChartBlock>
            );
        };

        const multiChart = (mode: '1rm' | 'volume') => {
            const field = mode === '1rm' ? 'rm' : 'volume';
            const flat = toFlatComparison(comparisonData, series, field);
            const tickInterval = Math.max(1, Math.ceil(flat.length / 8));
            return (
                <ChartBlock title={`${mode === '1rm' ? '1RM Estimado' : 'Volumen'} — Comparación`} color={mode === '1rm' ? '#3b82f6' : '#22c55e'} legend={legend}>
                    <LineChart width={CHART_WIDTH} height={CHART_HEIGHT} data={flat} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="date" interval={tickInterval} tickLine={false} axisLine={false} tick={{ fontSize: 16, fill: '#94a3b8' }} />
                        <YAxis hide />
                        {series.map(s => (
                            <Line
                                key={s.key}
                                type="monotone"
                                connectNulls
                                dataKey={s.key}
                                stroke={s.color}
                                strokeWidth={4}
                                dot={{ r: 5, fill: s.color, strokeWidth: 0 }}
                                name={s.name}
                                isAnimationActive={false}
                            />
                        ))}
                    </LineChart>
                </ChartBlock>
            );
        };

        const rpeFlat = toFlatComparison(comparisonData, series, 'rpe');
        const rpeTickInterval = Math.max(1, Math.ceil(rpeFlat.length / 8));

        const rpeChart = (
            <ChartBlock title={`RPE — ${multi ? 'Comparación' : series[0].name}`} color="#f97316" legend={multi ? legend : undefined}>
                <ScatterChart
                    width={CHART_WIDTH}
                    height={CHART_HEIGHT}
                    data={multi ? rpeFlat : undefined}
                    margin={{ top: 8, right: 8, left: 8, bottom: 0 }}
                >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="date" type="category" interval={rpeTickInterval} tickLine={false} axisLine={false} tick={{ fontSize: 16, fill: '#94a3b8' }} allowDuplicatedCategory={false} />
                    {multi && series.map(s => (
                        <YAxis key={s.key} yAxisId={s.key} type="number" dataKey={s.key} domain={[0, 10]} hide />
                    ))}
                    <ZAxis type="number" range={[100, 300]} />
                    {multi
                        ? series.map(s => (
                            <Scatter key={s.name} name={s.name} yAxisId={s.key} dataKey={s.key} fill={s.color} shape="circle" isAnimationActive={false} />
                        ))
                        : <Scatter name={series[0].name} data={rpeScatterData(series[0], comparisonData)} fill="#f97316" shape="circle" isAnimationActive={false} />}
                </ScatterChart>
            </ChartBlock>
        );

        return (
            <div
                ref={ref}
                style={{
                    position: 'fixed',
                    top: 0,
                    left: -9999,
                    width: 1080,
                    height: 1920,
                    backgroundColor: '#f8fafc',
                    color: '#0f172a',
                    overflow: 'hidden',
                    pointerEvents: 'none',
                    fontFamily: FONT
                }}
            >
                <style dangerouslySetInnerHTML={{ __html: FONT_CSS }} />

                {/* Header (dark, compact) */}
                <div style={{ backgroundColor: '#0f172a', padding: '32px 48px 24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                            <OkkoLogoLight width={180} />
                            <div style={{ fontSize: 28, fontWeight: 450, color: '#ffffff' }}>{studentName}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: 18, color: '#94a3b8' }}>
                                {generatedAt.toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}
                            </div>
                            {coachName && (
                                <div style={{ fontSize: 18, fontWeight: 450, color: '#94a3b8', marginTop: 4 }}>Coach: {coachName}</div>
                            )}
                        </div>
                    </div>
                </div>
                {/* Curved bottom edge */}
                <svg viewBox="0 0 1080 50" preserveAspectRatio="none" style={{ display: 'block', width: '100%', height: 50 }}>
                    <path d="M0 0 L1080 0 L1080 20 C810 50, 270 50, 0 20 Z" fill="#0f172a" />
                </svg>

                {/* Content (light) */}
                <div style={{ padding: '24px 48px 48px' }}>
                    {/* Stats */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 28 }}>
                        {statCells.map(s => (
                            <div
                                key={s.label}
                                style={{
                                    backgroundColor: '#ffffff',
                                    borderRadius: 14,
                                    padding: '16px 20px',
                                    border: '1px solid #e2e8f0',
                                    borderTop: `5px solid ${s.color}`,
                                    boxShadow: '0 1px 3px rgba(15, 23, 42, 0.06)'
                                }}
                            >
                                <div style={{ fontSize: 16, color: '#64748b', textTransform: 'uppercase', fontWeight: 700, letterSpacing: 1 }}>
                                    {s.label}
                                </div>
                                <div style={{ fontSize: 18, fontWeight: 600, color: '#0f172a' }}>{s.value}</div>
                                {s.sub && <div style={{ fontSize: 15, color: '#94a3b8', marginTop: 2 }}>{s.sub}</div>}
                            </div>
                        ))}
                    </div>

                    {/* Charts */}
                    {series.length > 0 && (
                        <>
                            {multi ? multiChart('1rm') : singleChart('1rm')}
                            {multi ? multiChart('volume') : singleChart('volume')}
                            {hasRpe && rpeChart}
                        </>
                    )}
                </div>
            </div>
        );
    }
);

ProgressExportCard.displayName = 'ProgressExportCard';
