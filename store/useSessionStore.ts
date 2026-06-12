import { create } from 'zustand';
import { persist, StateStorage, createJSONStorage } from 'zustand/middleware';
import { get, set, del } from 'idb-keyval';
import { ActiveSession } from '../components/features/sessions/types';

// Custom storage adapter for idb-keyval
const idbStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    return (await get(name)) || null;
  },
  setItem: async (name: string, value: string): Promise<void> => {
    await set(name, value);
  },
  removeItem: async (name: string): Promise<void> => {
    await del(name);
  },
};

interface SessionState {
  activeSessions: Record<string, ActiveSession>;
  startSession: (studentId: string, session: ActiveSession) => void;
  updateSession: (studentId: string, updater: (s: ActiveSession) => ActiveSession) => void;
  finishSession: (studentId: string) => ActiveSession | null;
  cancelSession: (studentId: string) => void;
  clearAll: () => void;
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set, get) => ({
      activeSessions: {},
      
      startSession: (studentId, session) => set((state) => ({
        activeSessions: { ...state.activeSessions, [studentId]: session }
      })),
      
      updateSession: (studentId, updater) => set((state) => {
        const existing = state.activeSessions[studentId];
        if (!existing) return state;
        return {
          activeSessions: {
            ...state.activeSessions,
            [studentId]: updater(existing)
          }
        };
      }),
      
      finishSession: (studentId) => {
        const session = get().activeSessions[studentId];
        if (session) {
          set((state) => {
            const copy = { ...state.activeSessions };
            delete copy[studentId];
            return { activeSessions: copy };
          });
          return session;
        }
        return null;
      },
      
      cancelSession: (studentId) => {
        set((state) => {
          const copy = { ...state.activeSessions };
          delete copy[studentId];
          return { activeSessions: copy };
        });
      },
      
      clearAll: () => set({ activeSessions: {} })
    }),
    {
      name: 'okko-sessions-storage',
      storage: createJSONStorage(() => idbStorage),
    }
  )
);
