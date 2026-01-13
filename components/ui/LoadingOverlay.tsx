import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';

interface LoadingOverlayProps {
  isVisible: boolean;
  message?: string;
  submessage?: string;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  isVisible,
  message = 'Guardando...',
  submessage
}) => {
  const { theme } = useTheme();

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className={`${theme.colors.bgCard} p-8 rounded-2xl shadow-2xl flex flex-col items-center gap-4 border ${theme.colors.border}`}>
        {/* Animated Spinner */}
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 border-4 border-t-emerald-500 border-r-emerald-500 border-b-transparent border-l-transparent rounded-full animate-spin"></div>
          <div className="absolute inset-2 border-4 border-t-transparent border-r-transparent border-b-teal-500 border-l-teal-500 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1s' }}></div>
        </div>

        {/* Message */}
        <p className={`${theme.colors.textPrimary} font-semibold text-lg`}>{message}</p>

        {/* Submessage */}
        {submessage && (
          <p className={`${theme.colors.textMuted} text-sm text-center max-w-xs`}>{submessage}</p>
        )}
      </div>
    </div>
  );
};
