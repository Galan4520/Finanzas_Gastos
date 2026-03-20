import React, { useEffect } from 'react';
import { CheckCircle, AlertCircle, X } from 'lucide-react';

export type ToastType = 'success' | 'error';

interface ToastProps {
  message: string;
  type: ToastType;
  isVisible: boolean;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, type, isVisible, onClose }) => {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  return (
    <div className={`fixed bottom-20 left-1/2 transform -translate-x-1/2 md:bottom-10 md:right-10 md:left-auto md:translate-x-0 z-50 flex items-center gap-3 px-6 py-4 rounded-xl shadow-2xl transition-all duration-300 animate-in slide-in-from-bottom-5 ${
      type === 'success' ? 'bg-yn-primary-500/15 border border-yn-primary-500/40 text-yn-neutral-900' : 'bg-yn-error-500/15 border border-yn-error-500/40 text-yn-neutral-900'
    } backdrop-blur-md`}>
      {type === 'success' ? <CheckCircle size={20} className="text-yn-primary-500" /> : <AlertCircle size={20} className="text-yn-error-500" />}
      <span className="font-medium text-sm">{message}</span>
      <button onClick={onClose} className="ml-4 opacity-70 hover:opacity-100">
        <X size={16} />
      </button>
    </div>
  );
};
