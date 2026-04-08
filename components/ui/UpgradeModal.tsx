import React from 'react';
import { X } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

interface UpgradeModalProps {
  isOpen: boolean;
  feature: string;
  description?: string;
  onClose: () => void;
}

export const UpgradeModal: React.FC<UpgradeModalProps> = ({
  isOpen,
  feature,
  description,
  onClose,
}) => {
  const { theme } = useTheme();

  if (!isOpen) return null;

  const defaultDesc: Record<string, string> = {
    'Escaneo de boletas': 'Fotografía tus recibos y la IA los registra automáticamente.',
    'Entrada por voz': 'Registra gastos hablando en castellano.',
    'Metas de ahorro': 'Crea objetivos y visualiza tu progreso con gráficos.',
    'Reportes avanzados': 'Tendencias, comparativas y análisis detallados.',
    'Cuentas ilimitadas': 'Agrega todas las tarjetas y cuentas que necesites.',
    'Historial completo': 'Accede a todo tu historial sin límite de meses.',
  };

  const desc = description ?? defaultDesc[feature] ?? 'Disponible en el plan Pro.';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className={`relative ${theme.colors.bgCard} rounded-2xl shadow-2xl max-w-sm w-full p-6 animate-in fade-in zoom-in-95`}>

        {/* Close */}
        <button
          onClick={onClose}
          className={`absolute top-4 right-4 ${theme.colors.textMuted} hover:opacity-70 transition-opacity`}
        >
          <X size={18} />
        </button>

        {/* Mascota */}
        <div className="flex justify-center mb-4">
          <div
            className="w-24 h-24 rounded-full overflow-hidden border-2 border-[#00a750]/40 shadow-lg shadow-[#00a750]/20 bg-white"
            style={{ animation: 'yn-bounce 1.4s ease-in-out infinite' }}
          >
            <img
              src="/logos/Mascota_Yunai.svg"
              alt="Yunai"
              className="w-full h-full object-cover object-top"
            />
          </div>
          <style>{`
            @keyframes yn-bounce {
              0%, 100% { transform: translateY(0); }
              50% { transform: translateY(-8px); }
            }
          `}</style>
        </div>

        {/* Texto */}
        <h3 className={`text-xl font-bold ${theme.colors.textPrimary} text-center mb-2`}>
          {feature}
        </h3>
        <p className={`text-sm ${theme.colors.textMuted} text-center mb-1`}>
          Esta función es exclusiva del
        </p>
        <p className="text-center font-bold text-[#00a750] mb-4">Plan Pro</p>

        <p className={`text-sm ${theme.colors.textMuted} text-center mb-6`}>
          {desc}
        </p>

        {/* Botones */}
        <a
          href="https://yunaipe.com/planes/"
          target="_blank"
          rel="noreferrer"
          className="block w-full py-3 rounded-xl font-bold text-white text-center bg-[#00a750] hover:bg-[#008f44] transition-colors shadow-lg mb-3"
        >
          Ver planes
        </a>
        <button
          onClick={onClose}
          className={`block w-full py-3 rounded-xl font-semibold text-center ${theme.colors.bgSecondary} ${theme.colors.textPrimary} hover:opacity-80 transition-opacity`}
        >
          Ahora no
        </button>
      </div>
    </div>
  );
};
