import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, Routine, Exercise } from '../types';
import * as DataService from '../services/dataService';
import { toast } from '../components/ui';

interface GymContextType {
    students: User[];
    routines: Routine[];
    exercises: Exercise[];
    isLoading: boolean;
    refreshData: () => Promise<void>;
    refreshStudents: () => Promise<void>;
    refreshRoutines: () => Promise<void>;
    refreshExercises: () => Promise<void>;
}

const GymContext = createContext<GymContextType | undefined>(undefined);

export const useGymData = () => {
    const context = useContext(GymContext);
    if (!context) {
        throw new Error('useGymData must be used within a GymProvider');
    }
    return context;
};

export const GymProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [students, setStudents] = useState<User[]>([]);
    const [routines, setRoutines] = useState<Routine[]>([]);
    const [exercises, setExercises] = useState<Exercise[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const refreshStudents = useCallback(async () => {
        try {
            const data = await DataService.getStudents();
            setStudents(data);
        } catch (error) {
            console.error('Error fetching students:', error);
            toast.error('Error al actualizar alumnos');
        }
    }, []);

    const refreshRoutines = useCallback(async () => {
        try {
            const data = await DataService.getRoutines();
            setRoutines(data);
        } catch (error) {
            console.error('Error fetching routines:', error);
            toast.error('Error al actualizar rutinas');
        }
    }, []);

    const refreshExercises = useCallback(async () => {
        try {
            const data = await DataService.getExercises();
            setExercises(data);
        } catch (error) {
            console.error('Error fetching exercises:', error);
            toast.error('Error al actualizar ejercicios');
        }
    }, []);

    const refreshData = useCallback(async () => {
        setIsLoading(true);
        try {
            await Promise.all([
                refreshStudents(),
                refreshRoutines(),
                refreshExercises()
            ]);
        } catch (error) {
            console.error('Error refreshing global data:', error);
            toast.error('Error cargando datos iniciales');
        } finally {
            setIsLoading(false);
        }
    }, [refreshStudents, refreshRoutines, refreshExercises]);

    // Initial load
    useEffect(() => {
        refreshData();
    }, [refreshData]);

    return (
        <GymContext.Provider value={{
            students,
            routines,
            exercises,
            isLoading,
            refreshData,
            refreshStudents,
            refreshRoutines,
            refreshExercises
        }}>
            {children}
        </GymContext.Provider>
    );
};
