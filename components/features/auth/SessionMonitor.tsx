import React, { useEffect } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { toast } from '../../ui';

interface SessionMonitorProps {
    onLogout: () => void;
}

const SessionMonitor: React.FC<SessionMonitorProps> = ({ onLogout }) => {
    useEffect(() => {
        const checkSession = async () => {
            const { data: { session }, error } = await supabase.auth.getSession();

            if (error || !session) {
                // Session is dead
                console.warn("Session check failed or expired", error);
                // Don't auto-logout immediately on network error, but if no session strictly...
                if (!session) onLogout();
                return;
            }

            // Check expiry
            if (session.expires_at) {
                const expiresAt = session.expires_at * 1000; // JWT is in seconds
                const now = Date.now();
                const timeLeft = expiresAt - now;

                // Debug log (remove in prod if annoying)
                // console.log(`Session validity: ${(timeLeft / 60000).toFixed(1)} mins`);

                if (timeLeft < 0) {
                    // Expired
                    toast.error("Sesión expirada");
                    onLogout();
                } else if (timeLeft < 5 * 60 * 1000 && timeLeft > 4.5 * 60 * 1000) {
                    // Less than 5 mins (warn once in this window)
                    toast.warning("Tu sesión está por expirar. Guarda tu progreso.");
                }
            }
        };

        const interval = setInterval(checkSession, 60 * 1000); // Check every minute
        checkSession(); // Initial check

        return () => clearInterval(interval);
    }, [onLogout]);

    return null; // Invisible component
};

export default SessionMonitor;
