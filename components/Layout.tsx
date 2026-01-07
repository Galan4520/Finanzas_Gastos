import React from 'react';
import { LayoutDashboard, Wallet, CreditCard, Clock, Settings, PlusCircle } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { getTextColor } from '../themes';

interface NavItemProps {
  id: string;
  label: string;
  icon: React.ReactNode;
  active: boolean;
  onClick: (id: string) => void;
  mobile?: boolean;
  isMain?: boolean;
  theme: any;
  textColors: any;
}

const NavItem: React.FC<NavItemProps> = ({ id, label, icon, active, onClick, mobile, isMain, theme, textColors }) => (
  <button
    onClick={() => onClick(id)}
    className={`flex items-center justify-center transition-all duration-300 relative group
      ${mobile
        ? isMain
            ? 'flex-col -mt-8 mb-1'
            : 'flex-col gap-1 p-2 w-full rounded-lg'
        : 'flex-row gap-3 px-4 py-3 rounded-xl text-sm font-medium w-full'
      }
      ${active && !isMain
        ? `${theme.colors.primaryLight} ${textColors.primary} border ${theme.colors.border}`
        : isMain ? '' : `${theme.colors.textMuted} hover:${theme.colors.textPrimary} hover:${theme.colors.bgCardHover}`
      }`}
  >
    {isMain ? (
        <div className={`rounded-full ${theme.colors.gradientPrimary} p-3 shadow-lg transform transition-transform ${active ? 'scale-110' : 'group-hover:scale-105'}`}>
            {React.cloneElement(icon as React.ReactElement<any>, { size: 28, className: 'text-white' })}
        </div>
    ) : (
        React.cloneElement(icon as React.ReactElement<any>, {
            size: mobile ? 22 : 18,
            className: active ? textColors.primary : `${theme.colors.textMuted} group-hover:${theme.colors.textPrimary}`
        })
    )}
    <span className={`${mobile ? 'text-[10px]' : 'text-sm'} font-medium ${isMain ? `mt-1 ${textColors.primary}` : ''}`}>{label}</span>
  </button>
);

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
  connected: boolean;
  onSync: () => void;
  isSyncing: boolean;
}

export const Layout: React.FC<LayoutProps> = ({ children, activeTab, onTabChange, connected, onSync, isSyncing }) => {
  const { theme, currentTheme } = useTheme();
  const textColors = getTextColor(currentTheme);

  // Simplified Navigation Logic
  const navItems = [
    { id: 'dashboard', label: 'Inicio', icon: <LayoutDashboard /> },
    { id: 'deudas', label: 'Deudas', icon: <Clock /> },
    { id: 'registrar', label: 'Nuevo', icon: <PlusCircle />, isMain: true }, // Unified Action
    { id: 'tarjetas', label: 'Tarjetas', icon: <Wallet /> },
    { id: 'config', label: 'Ajustes', icon: <Settings /> },
  ];

  return (
    <div className={`min-h-screen ${theme.colors.bgSecondary} ${theme.colors.textPrimary}`}>
      
      {/* Desktop Sidebar */}
      <aside className={`hidden md:flex flex-col w-64 fixed h-full ${theme.colors.border} border-r ${theme.colors.bgCard} backdrop-blur-xl p-6 z-20`}>
        <div className="mb-8 flex items-center gap-2 px-2">
            <div className={`w-8 h-8 rounded-lg ${theme.colors.gradientPrimary} flex items-center justify-center shadow-lg`}>
                <span className="font-bold text-white text-lg">CF</span>
            </div>
            <h1 className={`text-xl font-bold ${theme.colors.textPrimary}`}>
                Finanzas+
            </h1>
        </div>

        <div className="space-y-2 flex-1 overflow-y-auto pr-2 custom-scrollbar">
          {navItems.map(item => (
            <NavItem key={item.id} {...item} active={activeTab === item.id} onClick={onTabChange} theme={theme} textColors={textColors} />
          ))}
        </div>

        {connected && (
            <div className={`mt-auto pt-6 border-t ${theme.colors.border}`}>
                 <button
                    onClick={onSync}
                    disabled={isSyncing}
                    className={`w-full py-2.5 rounded-lg font-medium text-xs uppercase tracking-wider transition-all ${
                        isSyncing
                          ? `${theme.colors.bgSecondary} ${theme.colors.textMuted}`
                          : `${theme.colors.bgSecondary} ${theme.colors.primary} hover:text-white ${theme.colors.textSecondary}`
                    }`}
                >
                    {isSyncing ? 'Sincronizando...' : '↻ Sincronizar'}
                </button>
            </div>
        )}
      </aside>

      {/* Mobile Header */}
      <div className={`md:hidden p-4 flex justify-between items-center ${theme.colors.bgCard} backdrop-blur-lg sticky top-0 z-30 border-b ${theme.colors.border}`}>
        <div className="flex items-center gap-2">
             <div className={`w-8 h-8 rounded-lg ${theme.colors.gradientPrimary} flex items-center justify-center`}>
                <span className="font-bold text-white">CF</span>
            </div>
            <span className="font-bold text-lg">Finanzas+</span>
        </div>
        {connected && (
             <button onClick={onSync} disabled={isSyncing} className={`p-2 rounded-full ${isSyncing ? `animate-spin ${theme.colors.textMuted}` : `${textColors.primary} ${theme.colors.primaryLight}`}`}>
                 <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full" />
             </button>
        )}
      </div>

      {/* Content Area */}
      <main className="md:pl-64 pb-28 md:pb-8 p-4 md:p-8 max-w-7xl mx-auto animate-in fade-in duration-500">
        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      <div className={`md:hidden fixed bottom-0 left-0 right-0 ${theme.colors.bgCard} backdrop-blur-xl border-t ${theme.colors.border} pb-safe pt-2 px-4 z-40`}>
        <div className="flex justify-between items-end pb-3">
            {navItems.map(item => (
                <NavItem key={item.id} {...item} active={activeTab === item.id} onClick={onTabChange} mobile isMain={item.isMain} theme={theme} textColors={textColors} />
            ))}
        </div>
      </div>
    </div>
  );
};