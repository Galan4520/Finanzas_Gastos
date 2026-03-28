import React, { useState } from 'react';
import { ShieldCheck, ExternalLink, RefreshCw, LogOut } from 'lucide-react';
import { YunaiLogo } from '../ui/YunaiLogo';

interface SubscriptionRequiredScreenProps {
  email: string;
  onRefresh: () => Promise<void>;
  onLogout: () => void;
}

export const SubscriptionRequiredScreen: React.FC<SubscriptionRequiredScreenProps> = ({ email, onRefresh, onLogout }) => {
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await onRefresh();
    setRefreshing(false);
  };

  return (
    <div className="min-h-screen bg-yn-neutral-900 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm text-center">
        {/* Logo */}
        <div className="flex justify-center mb-4">
          <YunaiLogo size={60} />
        </div>

        {/* Card */}
        <div className="bg-yn-neutral-800 rounded-2xl p-6 border border-yn-neutral-700 shadow-xl">
          <div className="w-14 h-14 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShieldCheck size={28} className="text-amber-400" />
          </div>

          <h2 className="text-xl font-bold text-white mb-2">Suscripción requerida</h2>
          <p className="text-yn-neutral-400 text-sm mb-4">
            Para usar Yunai necesitas una suscripción activa. Puedes adquirirla en nuestra página web.
          </p>

          <p className="text-yn-neutral-500 text-xs mb-6">
            Sesión: <span className="text-yn-neutral-300">{email}</span>
          </p>

          {/* CTA - Go to yunaipe.com */}
          <a
            href="https://yunaipe.com"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3 rounded-xl font-bold text-white bg-yn-primary-500 hover:bg-yn-primary-700 transition-all flex items-center justify-center gap-2 mb-3"
          >
            <ExternalLink size={18} />
            Ir a yunaipe.com
          </a>

          {/* Refresh */}
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="w-full py-3 rounded-xl font-semibold text-yn-primary-500 border border-yn-primary-500/30 hover:bg-yn-primary-500/10 transition-all flex items-center justify-center gap-2"
          >
            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
            {refreshing ? 'Verificando...' : 'Ya pagué, verificar'}
          </button>

          {/* Logout */}
          <button
            onClick={onLogout}
            className="w-full mt-3 py-2 text-yn-neutral-500 hover:text-white text-sm transition-colors flex items-center justify-center gap-1"
          >
            <LogOut size={14} />
            Cerrar sesión
          </button>
        </div>
      </div>
    </div>
  );
};
