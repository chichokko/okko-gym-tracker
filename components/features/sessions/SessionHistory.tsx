import React, { useState, useEffect } from 'react';
import { Eye, Calendar, Dumbbell, TrendingUp } from 'lucide-react';
import {
    PageHeader,
    SearchInput,
    DataTable,
    Column,
    Modal,
    Badge,
    Card,
    IconButton,
    LoadingOverlay,
    EmptyState,
    MobileCardList
} from '../../ui';
import * as DataService from '../../../services/dataService';
import type { CompletedSession } from '../../../services/dataService';

interface SessionHistoryProps {
    studentId?: string; // If provided, filters by specific student (Student View). If null, shows all (Coach View)
}

const SessionHistory: React.FC<SessionHistoryProps> = ({ studentId }) => {
    const [sessions, setSessions] = useState<CompletedSession[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedSession, setSelectedSession] = useState<CompletedSession | null>(null);

    useEffect(() => {
        loadSessions();
    }, [studentId]); // Reload if ID changes

    const loadSessions = async () => {
        setIsLoading(true);
        try {
            const data = await DataService.getCompletedSessions(studentId);
            setSessions(data);
        } catch (error) {
            console.error("Error loading session history:", error);
            // toast.error("Error al cargar historial"); // Optional: avoid spamming toast on mount if frequent
        } finally {
            setIsLoading(false);
        }
    };

    const filteredSessions = sessions.filter(s =>
        s.studentName.toLowerCase().includes(searchTerm.toLowerCase())
    );

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
                subtitle={`${sessions.length} sesiones completadas`}
            />

            <SearchInput
                value={searchTerm}
                onValueChange={setSearchTerm}
                placeholder="Buscar por nombre de alumno..."
            />

            {isLoading ? (
                <LoadingOverlay message="Cargando historial..." />
            ) : filteredSessions.length === 0 ? (
                <EmptyState
                    icon={Dumbbell}
                    message="No hay sesiones completadas todavía."
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
                        {/* Stats Summary */}
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

                        {/* Exercises Breakdown */}
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
