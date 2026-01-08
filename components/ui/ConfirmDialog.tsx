import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'warning' | 'info';
    onConfirm: () => void;
    onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
    isOpen,
    title,
    message,
    confirmText = 'Confirmar',
    cancelText = 'Cancelar',
    variant = 'danger',
    onConfirm,
    onCancel
}) => {
    const { theme } = useTheme();

    if (!isOpen) return null;

    const variantStyles = {
        danger: {
            icon: 'text-red-500',
            button: 'bg-red-500 hover:bg-red-600',
            iconBg: 'bg-red-500/10'
        },
        warning: {
            icon: 'text-amber-500',
            button: 'bg-amber-500 hover:bg-amber-600',
            iconBg: 'bg-amber-500/10'
        },
        info: {
            icon: 'text-blue-500',
            button: 'bg-blue-500 hover:bg-blue-600',
            iconBg: 'bg-blue-500/10'
        }
    };

    const styles = variantStyles[variant];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onCancel}
            />

            {/* Dialog */}
            <div className={`relative ${theme.colors.bgCard} rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in-95`}>
                {/* Icon */}
                <div className={`w-12 h-12 rounded-full ${styles.iconBg} flex items-center justify-center mx-auto mb-4`}>
                    <AlertTriangle size={24} className={styles.icon} />
                </div>

                {/* Content */}
                <h3 className={`text-xl font-bold ${theme.colors.textPrimary} text-center mb-2`}>
                    {title}
                </h3>
                <p className={`${theme.colors.textMuted} text-center mb-6`}>
                    {message}
                </p>

                {/* Actions */}
                <div className="flex gap-3">
                    <button
                        onClick={onCancel}
                        className={`flex-1 px-4 py-3 rounded-xl font-semibold ${theme.colors.bgSecondary} ${theme.colors.textPrimary} hover:opacity-80 transition-all`}
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        className={`flex-1 px-4 py-3 rounded-xl font-semibold text-white ${styles.button} transition-all shadow-lg`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};
