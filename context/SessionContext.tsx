import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { Session } from "@supabase/supabase-js";
import { Loader2 } from "lucide-react";

interface SessionContextType {
    session: Session | null;
}

const SessionContext = createContext<SessionContextType>({
    session: null,
});

export const useSession = () => {
    const context = useContext(SessionContext);
    if (!context) {
        throw new Error("useSession must be used within a SessionProvider");
    }
    return context;
};

type Props = { children: React.ReactNode };

export const SessionProvider = ({ children }: Props) => {
    const [session, setSession] = useState<Session | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // onAuthStateChange is the ONLY source of truth for session.
        // It fires immediately with the current session (or null), eliminating the need for getSession().
        const authStateListener = supabase.auth.onAuthStateChange(
            async (event, session) => {
                console.log("Auth event:", event);
                setSession(session);
                setIsLoading(false);
            }
        );

        return () => {
            authStateListener.data.subscription.unsubscribe();
        };
    }, []);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex items-center justify-center">
                <Loader2 className="animate-spin text-slate-900 dark:text-white" size={32} />
            </div>
        );
    }

    return (
        <SessionContext.Provider value={{ session }}>
            {children}
        </SessionContext.Provider>
    );
};
