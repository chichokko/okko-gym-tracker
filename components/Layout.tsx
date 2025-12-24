import React, { useState } from 'react';
import { UserRole, User } from '../types';
import {
  PlayCircle,
  Users,
  Dumbbell,
  ClipboardList,
  Activity,
  LayoutDashboard,
  History
} from 'lucide-react';
import { Sidebar, MobileHeader, MobileMenu, BottomNav } from './layout/index';

interface LayoutProps {
  children: React.ReactNode;
  user: User;
  onLogout: () => void;
  isDarkMode: boolean;
  toggleTheme: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, user, onLogout, isDarkMode, toggleTheme }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isCoach = user.role === UserRole.COACH;

  // Full navigation items (for sidebar and mobile menu)
  const allNavItems = isCoach
    ? [
      { label: 'Sesión Actual', icon: PlayCircle, path: '/logger' },
      { label: 'Alumnos', icon: Users, path: '/alumnos' },
      { label: 'Historial', icon: History, path: '/historial' },
      { label: 'Rutinas', icon: ClipboardList, path: '/rutinas' },
      { label: 'Ejercicios', icon: Dumbbell, path: '/ejercicios' },
    ]
    : [
      { label: 'Mi Progreso', icon: Activity, path: '/' },
      { label: 'Historial', icon: History, path: '/historial' },
    ];

  // Bottom nav items (only 3 key items for mobile)
  const bottomNavItems = isCoach
    ? [
      { label: 'Sesión', icon: PlayCircle, path: '/logger' },
      { label: 'Alumnos', icon: Users, path: '/alumnos' },
      { label: 'Historial', icon: History, path: '/historial' },
    ]
    : [
      { label: 'Progreso', icon: Activity, path: '/' },
      { label: 'Historial', icon: History, path: '/historial' },
    ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex flex-col lg:flex-row font-sans text-slate-900 dark:text-slate-100 transition-colors duration-200">
      {/* Desktop Sidebar */}
      <Sidebar
        user={user}
        navItems={allNavItems}
        onLogout={onLogout}
        isDarkMode={isDarkMode}
        toggleTheme={toggleTheme}
      />

      {/* Mobile Header */}
      <MobileHeader
        isDarkMode={isDarkMode}
        toggleTheme={toggleTheme}
        onMenuOpen={() => setIsMobileMenuOpen(true)}
      />

      {/* Mobile Menu Overlay */}
      <MobileMenu
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        navItems={allNavItems}
        onLogout={onLogout}
      />

      {/* Main Content */}
      <main className="flex-1 p-4 lg:p-8 overflow-y-auto h-auto min-h-[calc(100vh-80px)] lg:min-h-screen pb-24 lg:pb-8">
        <div className="max-w-4xl mx-auto">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <BottomNav
        items={bottomNavItems}
        onMoreClick={() => setIsMobileMenuOpen(true)}
      />
    </div>
  );
};

export default Layout;