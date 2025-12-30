import React, { useEffect, useRef } from 'react';
import { supabase, clearAuthState } from '../../../lib/supabaseClient';
import { toast } from '../../ui';

interface SessionMonitorProps {
    onLogout: () => void;
}

const SessionMonitor: React.FC<SessionMonitorProps> = ({ onLogout }) => {
    const hasWarnedRef = useRef(false);
    const isLoggingOutRef = useRef(false);

    useEffect(() => {
        // Listen for auth state changes including errors
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log('Auth event:', event);

            if (event === 'TOKEN_REFRESHED') {
                // Token was successfully refreshed
                hasWarnedRef.current = false;
            } else if (event === 'SIGNED_OUT') {
                // User signed out (either manually or due to token expiry)
                if (!isLoggingOutRef.current) {
                    isLoggingOutRef.current = true;
                    onLogout();
                }
            }
        });

        // Periodic session check
        const checkSession = async () => {
            try {
                const { data: { session }, error } = await supabase.auth.getSession();

                if (error) {
                    console.error("Session check error:", error);
                    // If it's a refresh token error, force logout and clear corrupted state
                    if (error.message?.includes('Refresh Token') ||
                        error.message?.includes('refresh_token') ||
                        error.message?.includes('Invalid')) {
                        toast.error("Sesión expirada. Por favor, inicia sesión nuevamente.");
                        clearAuthState();
                        if (!isLoggingOutRef.current) {
                            isLoggingOutRef.current = true;
                            onLogout();
                        }
                    }
                    return;
                }

                if (!session) {
                    // No session at all
                    if (!isLoggingOutRef.current) {
                        isLoggingOutRef.current = true;
                        onLogout();
                    }
                    return;
                }

                // Check expiry
                if (session.expires_at) {
                    const expiresAt = session.expires_at * 1000; // JWT is in seconds
                    const now = Date.now();
                    const timeLeft = expiresAt - now;

                    if (timeLeft < 0) {
                        // Expired
                        toast.error("Sesión expirada");
                        clearAuthState();
                        if (!isLoggingOutRef.current) {
                            isLoggingOutRef.current = true;
                            onLogout();
                        }
                    } else if (timeLeft < 5 * 60 * 1000 && !hasWarnedRef.current) {
                        // Less than 5 mins - warn once
                        hasWarnedRef.current = true;
                        toast.warning("Tu sesión está por expirar. Guarda tu progreso.");
                    }
                }
            } catch (err) {
                console.error("Session check exception:", err);
                // On any unexpected error, force logout to prevent hanging
                clearAuthState();
                if (!isLoggingOutRef.current) {
                    isLoggingOutRef.current = true;
                    onLogout();
                }
            }
        };

        const interval = setInterval(checkSession, 60 * 1000); // Check every minute
        checkSession(); // Initial check

        return () => {
            clearInterval(interval);
            subscription.unsubscribe();
        };
    }, [onLogout]);

    return null; // Invisible component
};

export default SessionMonitor;

