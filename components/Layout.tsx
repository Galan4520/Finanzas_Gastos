import React from 'react';
import { LayoutDashboard, Wallet, CreditCard, Clock, Settings, PlusCircle, Target, BarChart3, User, RefreshCw, Users } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { getTextColor } from '../themes';
import { UserProfile } from '../types';
import { getAvatarById } from '../avatars';
import { AvatarSvg } from './ui/AvatarSvg';

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
  profile?: UserProfile | null;
  lastSyncTime?: Date | null;
  hasFamilyPlan?: boolean;
}

export const Layout: React.FC<LayoutProps> = ({ children, activeTab, onTabChange, connected, onSync, isSyncing, profile, lastSyncTime, hasFamilyPlan }) => {
  const { theme, currentTheme } = useTheme();

  // Helper to format time relative
  const getRelativeTime = (date: Date) => {
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 60000); // minutes
    if (diff < 1) return 'Hace un momento';
    if (diff === 1) return 'Hace 1 minuto';
    if (diff < 60) return `Hace ${diff} minutos`;
    return `Hace ${Math.floor(diff / 60)} horas`;
  };

  const textColors = getTextColor(currentTheme);
  const avatar = profile ? getAvatarById(profile.avatar_id) : null;

  // Desktop sidebar: always all items
  const navItems = [
    { id: 'dashboard', label: 'Inicio', icon: <LayoutDashboard /> },
    { id: 'metas', label: 'Metas', icon: <Target /> },
    { id: 'registrar', label: 'Nuevo', icon: <PlusCircle />, isMain: true },
    { id: 'deudas', label: 'Deudas', icon: <Clock /> },
    { id: 'config', label: 'Ajustes', icon: <Settings /> },
    ...(hasFamilyPlan ? [{ id: 'familia', label: 'Familia', icon: <Users /> }] : []),
  ];

  // Mobile bottom nav: always exactly 5 slots
  // When family plan active, Familia replaces Ajustes (settings accessible via header icon)
  const mobileNavItems = hasFamilyPlan
    ? [
        { id: 'dashboard', label: 'Inicio', icon: <LayoutDashboard /> },
        { id: 'metas', label: 'Metas', icon: <Target /> },
        { id: 'registrar', label: 'Nuevo', icon: <PlusCircle />, isMain: true },
        { id: 'deudas', label: 'Deudas', icon: <Clock /> },
        { id: 'familia', label: 'Familia', icon: <Users /> },
      ]
    : [
        { id: 'dashboard', label: 'Inicio', icon: <LayoutDashboard /> },
        { id: 'metas', label: 'Metas', icon: <Target /> },
        { id: 'registrar', label: 'Nuevo', icon: <PlusCircle />, isMain: true },
        { id: 'deudas', label: 'Deudas', icon: <Clock /> },
        { id: 'config', label: 'Ajustes', icon: <Settings /> },
      ];

  return (
    <div className={`min-h-screen ${theme.colors.bgSecondary} ${theme.colors.textPrimary}`}>

      {/* Desktop Sidebar */}
      <aside className={`hidden md:flex flex-col w-64 fixed h-full ${theme.colors.border} border-r ${theme.colors.bgCard} backdrop-blur-xl p-6 z-20`}>
        <div className="mb-8 px-2">
          <div className="flex items-center gap-2 mb-6">
            <div className={`w-8 h-8 rounded-lg ${theme.colors.gradientPrimary} flex items-center justify-center shadow-lg`}>
              <span className="text-lg">🦗</span>
            </div>
            <h1 className={`text-xl font-bold ${theme.colors.textPrimary}`}>
              Yunai
            </h1>
          </div>

          {/* Profile Section - Desktop */}
          {profile && avatar && (
            <div className={`flex items-center gap-3 p-3 rounded-xl border ${theme.colors.border} ${theme.colors.bgSecondary}`}>
              <div className="relative">
                <AvatarSvg avatarId={avatar.id} size={40} className="border-2 border-white shadow-sm" />
                <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full"></div>
              </div>
              <div className="overflow-hidden">
                <p className={`text-sm font-bold ${theme.colors.textPrimary} truncate`}>{profile.nombre}</p>
                <p className={`text-xs ${theme.colors.textMuted} truncate`}>{avatar.label}</p>
              </div>
            </div>
          )}
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
              className={`w-full py-2.5 rounded-lg font-medium text-xs uppercase tracking-wider transition-all ${isSyncing
                ? `${theme.colors.bgSecondary} ${theme.colors.textMuted}`
                : `${theme.colors.bgSecondary} ${theme.colors.textSecondary} ${theme.colors.primaryHover} hover:text-white`
                }`}
            >
              {isSyncing ? 'Sincronizando...' : '↻ Sincronizar'}
            </button>
            {lastSyncTime && (
              <p className={`text-[10px] text-center mt-2 ${theme.colors.textMuted}`}>
                Actualizado: {getRelativeTime(lastSyncTime)}
              </p>
            )}
          </div>
        )}
      </aside>

      {/* Mobile Header */}
      <div className={`md:hidden p-4 flex justify-between items-center ${theme.colors.bgCard} backdrop-blur-lg sticky top-0 z-30 border-b ${theme.colors.border}`}>
        <div className="flex items-center gap-3">
          {profile && avatar ? (
            <AvatarSvg avatarId={avatar.id} size={32} className="border border-gray-200" />
          ) : (
            <div className={`w-8 h-8 rounded-lg ${theme.colors.gradientPrimary} flex items-center justify-center`}>
              <span className="text-lg">🦗</span>
            </div>
          )}
          <span className="font-bold text-lg">{profile ? `Hola, ${profile.nombre}` : 'Yunai'}</span>
        </div>
        <div className="flex items-center gap-1">
          {hasFamilyPlan && (
            <button
              onClick={() => onTabChange('config')}
              className={`p-2 rounded-full ${activeTab === 'config' ? `${textColors.primary} ${theme.colors.primaryLight}` : theme.colors.textMuted}`}
              title="Ajustes"
            >
              <Settings size={18} />
            </button>
          )}
          {connected && (
            <button onClick={onSync} disabled={isSyncing} className={`p-2 rounded-full ${isSyncing ? `${theme.colors.textMuted}` : `${textColors.primary} ${theme.colors.primaryLight}`}`}>
              <RefreshCw size={18} className={isSyncing ? 'animate-spin' : ''} />
            </button>
          )}
        </div>
      </div>

      {/* Content Area */}
      <main className="md:pl-64 pb-28 md:pb-8 p-4 md:p-8 max-w-7xl mx-auto animate-in fade-in duration-500">
        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      <div className={`md:hidden fixed bottom-0 left-0 right-0 ${theme.colors.bgCard} backdrop-blur-xl border-t ${theme.colors.border} pb-safe pt-2 px-4 z-40`}>
        <div className="flex justify-between items-end pb-3">
          {mobileNavItems.map(item => (
            <NavItem key={item.id} {...item} active={activeTab === item.id} onClick={onTabChange} mobile isMain={item.isMain} theme={theme} textColors={textColors} />
          ))}
        </div>
      </div>
    </div>
  );
};