import React, { useState, useEffect, useCallback } from 'react';
import { Eye, Calendar, Dumbbell, Search, RotateCcw } from 'lucide-react';
import {
    PageHeader,
    DataTable,
    Column,
    Modal,
    Badge,
    Card,
    IconButton,
    LoadingOverlay,
    EmptyState,
    MobileCardList,
    Button,
    Select,
    Input,
    toast
} from '../../ui';
import * as DataService from '../../../services/dataService';
import type { CompletedSession } from '../../../services/dataService';
import { useGymData } from '../../../context/GymContext';

interface SessionHistoryProps {
    studentId?: string;
}

const SessionHistory: React.FC<SessionHistoryProps> = ({ studentId }) => {
    const { students } = useGymData();
    const [selectedStudentId, setSelectedStudentId] = useState(studentId || '');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [sessions, setSessions] = useState<CompletedSession[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const [selectedSession, setSelectedSession] = useState<CompletedSession | null>(null);

    useEffect(() => {
        if (studentId) {
            setSelectedStudentId(studentId);
            handleSearch();
        }
    }, [studentId]);

    const handleSearch = useCallback(async () => {
        setIsLoading(true);
        setHasSearched(true);
        try {
            const data = await DataService.getCompletedSessions(selectedStudentId || undefined);

            let filtered = data;
            if (dateFrom) {
                const from = new Date(dateFrom);
                from.setHours(0, 0, 0, 0);
                filtered = filtered.filter(s => new Date(s.date) >= from);
            }
            if (dateTo) {
                const to = new Date(dateTo);
                to.setHours(23, 59, 59, 999);
                filtered = filtered.filter(s => new Date(s.date) <= to);
            }

            setSessions(filtered);
        } catch (error) {
            console.error("Error loading session history:", error);
            toast.error("Error al cargar historial");
        } finally {
            setIsLoading(false);
        }
    }, [selectedStudentId, dateFrom, dateTo]);

    const handleClear = () => {
        setDateFrom('');
        setDateTo('');
        if (!studentId) setSelectedStudentId('');
        setSessions([]);
        setHasSearched(false);
    };

    const filteredSessions = sessions;

    const formatDate = (date: Date) => {
        return new Intl.DateTimeFormat('es-CL', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    };

    const columns: Column<CompletedSession>[] = [
        {
            key: 'date',
            header: 'Fecha',
            render: (session) => (
                <div className="flex items-center gap-2">
                    <Calendar size={16} className="text-slate-400" />
                    <span className="font-medium">{formatDate(session.date)}</span>
                </div>
            )
        },
        {
            key: 'studentName',
            header: 'Alumno',
            render: (session) => (
                <span className="font-bold text-slate-900 dark:text-white">
                    {session.studentName}
                </span>
            )
        },
        {
            key: 'exerciseCount',
            header: 'Ejercicios',
            render: (session) => (
                <Badge>{session.exerciseCount} ejercicios</Badge>
            )
        },
        {
            key: 'totalVolume',
            header: 'Volumen Total',
            render: (session) => (
                <span className="font-mono text-sm">
                    {session.totalVolume.toLocaleString()} kg
                </span>
            )
        }
    ];

    return (
        <div className="space-y-6 animate-in fade-in">
            <PageHeader
                title="Historial de Entrenos"
                subtitle={hasSearched ? `${sessions.length} sesiones encontradas` : 'Filtra y busca sesiones'}
            />

            {/* FILTERS */}
            <Card className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    {!studentId && (
                        <Select
                            label="Alumno"
                            value={selectedStudentId}
                            onChange={e => setSelectedStudentId(e.target.value)}
                        >
                            <option value="">-- Todos los alumnos --</option>
                            {students.map(s => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                        </Select>
                    )}
                    <Input
                        label="Desde"
                        type="date"
                        value={dateFrom}
                        onChange={e => setDateFrom(e.target.value)}
                    />
                    <Input
                        label="Hasta"
                        type="date"
                        value={dateTo}
                        onChange={e => setDateTo(e.target.value)}
                    />
                    <div className="flex gap-2">
                        <Button onClick={handleSearch} disabled={isLoading}>
                            <Search size={18} />
                            Buscar
                        </Button>
                        <Button variant="ghost" onClick={handleClear}>
                            <RotateCcw size={18} />
                        </Button>
                    </div>
                </div>
            </Card>

            {/* RESULTS */}
            {isLoading ? (
                <LoadingOverlay message="Buscando sesiones..." />
            ) : !hasSearched ? (
                <EmptyState
                    icon={Search}
                    message="Selecciona un alumno y rango de fechas para buscar."
                />
            ) : filteredSessions.length === 0 ? (
                <EmptyState
                    icon={Dumbbell}
                    message="No se encontraron sesiones con esos filtros."
                />
            ) : (
                <>
                    <div className="hidden md:block">
                        <DataTable
                            columns={columns}
                            data={filteredSessions}
                            keyExtractor={(s) => s.id}
                            emptyMessage="No se encontraron sesiones."
                            renderActions={(session) => (
                                <IconButton
                                    onClick={() => setSelectedSession(session)}
                                    className="hover:text-blue-500"
                                >
                                    <Eye size={18} />
                                </IconButton>
                            )}
                        />
                    </div>
                    <div className="block md:hidden">
                        <MobileCardList<CompletedSession>
                            data={filteredSessions}
                            keyExtractor={(s) => s.id}
                            titleField={(s) => s.studentName}
                            subtitleField={(s) => formatDate(s.date)}
                            metaFields={[
                                {
                                    key: 'stats',
                                    render: (s) => (
                                        <div className="flex justify-between items-center text-xs">
                                            <span>{s.exerciseCount} Ejercicios</span>
                                            <Badge color="bg-blue-100 text-blue-700">{s.totalVolume.toLocaleString()} Kg</Badge>
                                        </div>
                                    )
                                }
                            ]}
                            getSwipeActions={(s) => ({
                                right: { label: 'Ver', icon: <Eye size={16} />, onClick: () => setSelectedSession(s), color: '#3b82f6' }
                            })}
                            emptyMessage="No se encontraron sesiones."
                            onCardClick={(s) => setSelectedSession(s)}
                        />
                    </div>
                </>
            )}

            {/* Session Detail Modal */}
            <Modal
                isOpen={!!selectedSession}
                onClose={() => setSelectedSession(null)}
                title={selectedSession ? `Resumen - ${selectedSession.studentName}` : ''}
                size="lg"
            >
                {selectedSession && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-3 gap-3">
                            <Card className="text-center p-3">
                                <div className="text-2xl font-bold text-blue-500">{selectedSession.exerciseCount}</div>
                                <div className="text-xs text-slate-500">Ejercicios</div>
                            </Card>
                            <Card className="text-center p-3">
                                <div className="text-2xl font-bold text-green-500">{selectedSession.totalSets}</div>
                                <div className="text-xs text-slate-500">Series</div>
                            </Card>
                            <Card className="text-center p-3">
                                <div className="text-2xl font-bold text-orange-500">{selectedSession.totalVolume.toLocaleString()}</div>
                                <div className="text-xs text-slate-500">Kg Totales</div>
                            </Card>
                        </div>

                        <div className="space-y-3">
                            <h4 className="font-bold text-sm text-slate-500 uppercase">Detalle por Ejercicio</h4>
                            {selectedSession.exercises.map((ex, idx) => (
                                <Card key={idx} className="p-3">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="font-bold">{ex.name}</span>
                                        <Badge color="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                            {ex.sets.length} series
                                        </Badge>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2 text-xs text-slate-500 font-medium mb-1">
                                        <span>Serie</span>
                                        <span>Peso × Reps</span>
                                        <span>RPE</span>
                                    </div>
                                    {ex.sets.map((set, setIdx) => (
                                        <div key={setIdx} className="grid grid-cols-3 gap-2 text-sm py-1 border-t border-gray-100 dark:border-slate-800">
                                            <span className="text-slate-400">{setIdx + 1}</span>
                                            <span className="font-mono font-medium">{set.weight}kg × {set.reps}</span>
                                            <span className="text-slate-500">@{set.rpe}</span>
                                        </div>
                                    ))}
                                </Card>
                            ))}
                        </div>

                        <div className="text-center text-xs text-slate-400 pt-2">
                            Sesión del {formatDate(selectedSession.date)}
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default SessionHistory;
