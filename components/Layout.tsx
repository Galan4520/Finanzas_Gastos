import React from 'react';
import { LayoutDashboard, Wallet, CreditCard, Clock, Settings, PlusCircle } from 'lucide-react';

interface NavItemProps {
  id: string;
  label: string;
  icon: React.ReactNode;
  active: boolean;
  onClick: (id: string) => void;
  mobile?: boolean;
  isMain?: boolean;
}

const NavItem: React.FC<NavItemProps> = ({ id, label, icon, active, onClick, mobile, isMain }) => (
  <button
    onClick={() => onClick(id)}
    className={`flex items-center justify-center transition-all duration-300 relative group
      ${mobile 
        ? isMain 
            ? 'flex-col -mt-8 mb-1' // Floating button style for mobile
            : 'flex-col gap-1 p-2 w-full rounded-lg' 
        : 'flex-row gap-3 px-4 py-3 rounded-xl text-sm font-medium w-full'
      }
      ${active && !isMain
        ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.2)]' 
        : isMain ? '' : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'
      }`}
  >
    {isMain ? (
        <div className={`rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 p-3 shadow-lg shadow-indigo-500/40 transform transition-transform ${active ? 'scale-110 ring-4 ring-indigo-500/20' : 'group-hover:scale-105'}`}>
            {React.cloneElement(icon as React.ReactElement<any>, { size: 28, className: 'text-white' })}
        </div>
    ) : (
        React.cloneElement(icon as React.ReactElement<any>, { 
            size: mobile ? 22 : 18,
            className: active ? 'text-indigo-400' : 'text-slate-400 group-hover:text-slate-200'
        })
    )}
    <span className={`${mobile ? 'text-[10px]' : 'text-sm'} font-medium ${isMain ? 'mt-1 text-indigo-400' : ''}`}>{label}</span>
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
  
  // Simplified Navigation Logic
  const navItems = [
    { id: 'dashboard', label: 'Inicio', icon: <LayoutDashboard /> },
    { id: 'deudas', label: 'Deudas', icon: <Clock /> },
    { id: 'registrar', label: 'Nuevo', icon: <PlusCircle />, isMain: true }, // Unified Action
    { id: 'tarjetas', label: 'Tarjetas', icon: <Wallet /> },
    { id: 'config', label: 'Ajustes', icon: <Settings /> },
  ];

  return (
    <div className="min-h-screen bg-[#0B1120] text-slate-100 selection:bg-indigo-500/30">
      
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 fixed h-full border-r border-slate-800/50 bg-[#0B1120]/95 backdrop-blur-xl p-6 z-20">
        <div className="mb-8 flex items-center gap-2 px-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <span className="font-bold text-white text-lg">CF</span>
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                Finanzas+
            </h1>
        </div>
        
        <div className="space-y-2 flex-1 overflow-y-auto pr-2 custom-scrollbar">
          {navItems.map(item => (
            <NavItem key={item.id} {...item} active={activeTab === item.id} onClick={onTabChange} />
          ))}
        </div>

        {connected && (
            <div className="mt-auto pt-6 border-t border-slate-800/50">
                 <button 
                    onClick={onSync}
                    disabled={isSyncing}
                    className={`w-full py-2.5 rounded-lg font-medium text-xs uppercase tracking-wider transition-all
                        ${isSyncing ? 'bg-slate-800 text-slate-500' : 'bg-slate-800 hover:bg-indigo-600 hover:text-white text-slate-400'}`}
                >
                    {isSyncing ? 'Sincronizando...' : '↻ Sincronizar'}
                </button>
            </div>
        )}
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden p-4 flex justify-between items-center bg-[#0B1120]/80 backdrop-blur-lg sticky top-0 z-30 border-b border-slate-800/50">
        <div className="flex items-center gap-2">
             <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
                <span className="font-bold text-white">CF</span>
            </div>
            <span className="font-bold text-lg">Finanzas+</span>
        </div>
        {connected && (
             <button onClick={onSync} disabled={isSyncing} className={`p-2 rounded-full ${isSyncing ? 'animate-spin text-slate-500' : 'text-indigo-400 bg-indigo-500/10'}`}>
                 <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full" />
             </button>
        )}
      </div>

      {/* Content Area */}
      <main className="md:pl-64 pb-28 md:pb-8 p-4 md:p-8 max-w-7xl mx-auto animate-in fade-in duration-500">
        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[#0B1120]/90 backdrop-blur-xl border-t border-slate-800/50 pb-safe pt-2 px-4 z-40">
        <div className="flex justify-between items-end pb-3">
            {navItems.map(item => (
                <NavItem key={item.id} {...item} active={activeTab === item.id} onClick={onTabChange} mobile isMain={item.isMain} />
            ))}
        </div>
      </div>
    </div>
  );
};