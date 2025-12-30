import React from 'react';
import { ResponsiveContainer } from 'recharts';
import { ErrorBoundary } from '../../ui/ErrorBoundary';

interface SafeChartProps {
    children: React.ReactElement;
    height?: number | string;
}

export const SafeChart: React.FC<SafeChartProps> = ({ children, height = 300 }) => {
    return (
        <ErrorBoundary name="Gráfico de Progreso">
            <div style={{ width: '100%', height: height, minHeight: '300px' }}>
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} debounce={300}>
                    {children}
                </ResponsiveContainer>
            </div>
        </ErrorBoundary>
    );
};
