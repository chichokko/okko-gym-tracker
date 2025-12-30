// @ts-nocheck
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Card } from './card';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
    name?: string;
}

interface State {
    hasError: boolean;
    error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        // @ts-ignore
        this.state = { hasError: false };
    }

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error(`Uncaught error in ${this.props.name || 'component'}:`, error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            if (this.props.fallback) return this.props.fallback;

            return (
                <Card className="p-6 bg-red-50 border-red-200">
                    <h3 className="text-red-800 font-bold mb-2">Algo salió mal</h3>
                    <p className="text-red-600 text-sm mb-4">
                        No se pudo cargar {this.props.name || 'este componente'}.
                    </p>
                    <button
                        onClick={() => this.setState({ hasError: false })}
                        className="px-4 py-2 bg-red-100 text-red-700 rounded-lg text-sm font-medium hover:bg-red-200"
                    >
                        Reintentar
                    </button>
                </Card>
            );
        }

        return this.props.children;
    }
}
