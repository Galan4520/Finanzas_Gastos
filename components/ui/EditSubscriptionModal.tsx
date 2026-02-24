import React, { useState, useEffect } from 'react';
import { PendingExpense, CreditCard } from '../../types';
import { useTheme } from '../../contexts/ThemeContext';
import { X, Save, Calendar, DollarSign, CreditCard as CardIcon, Edit } from 'lucide-react';
import { formatCurrency } from '../../utils/format';

interface EditSubscriptionModalProps {
    isOpen: boolean;
    subscription: PendingExpense | null;
    cards: CreditCard[];
    onSave: (updated: PendingExpense) => void;
    onClose: () => void;
}

export const EditSubscriptionModal: React.FC<EditSubscriptionModalProps> = ({
    isOpen,
    subscription,
    cards,
    onSave,
    onClose
}) => {
    const { theme } = useTheme();
    const [formData, setFormData] = useState({
        descripcion: '',
        monto: '',
        tarjeta: '',
        categoria: '',
        fecha_pago: '',
        notas: ''
    });

    useEffect(() => {
        if (subscription) {
            setFormData({
                descripcion: subscription.descripcion,
                monto: subscription.monto.toString(),
                tarjeta: subscription.tarjeta,
                categoria: subscription.categoria,
                fecha_pago: subscription.fecha_pago,
                notas: subscription.notas || ''
            });
        }
    }, [subscription]);

    if (!isOpen || !subscription) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({
            ...subscription,
            descripcion: formData.descripcion,
            monto: parseFloat(formData.monto),
            tarjeta: formData.tarjeta,
            categoria: formData.categoria,
            fecha_pago: formData.fecha_pago,
            notas: formData.notas
        });
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className={`relative ${theme.colors.bgCard} rounded-2xl shadow-2xl max-w-lg w-full p-6 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto`}>
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <h3 className={`text-xl font-bold ${theme.colors.textPrimary} flex items-center gap-2`}>
                        <Edit size={20} />
                        Editar Suscripción
                    </h3>
                    <button
                        onClick={onClose}
                        className={`p-2 rounded-lg ${theme.colors.bgSecondary} hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors`}
                    >
                        <X size={20} className={theme.colors.textMuted} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Descripción */}
                    <div>
                        <label className={`block text-sm font-medium ${theme.colors.textSecondary} mb-1`}>
                            Nombre de la suscripción
                        </label>
                        <input
                            type="text"
                            value={formData.descripcion}
                            onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                            className={`w-full ${theme.colors.bgSecondary} border ${theme.colors.border} rounded-xl px-4 py-3 ${theme.colors.textPrimary} focus:ring-2 focus:ring-purple-500`}
                            required
                        />
                    </div>

                    {/* Monto */}
                    <div>
                        <label className={`block text-sm font-medium ${theme.colors.textSecondary} mb-1`}>
                            <DollarSign size={14} className="inline mr-1" />
                            Monto mensual
                        </label>
                        <div className="relative">
                            <span className={`absolute left-4 top-3.5 ${theme.colors.textMuted}`}>S/</span>
                            <input
                                type="number"
                                step="0.01"
                                max="99999999"
                                value={formData.monto}
                                onChange={(e) => setFormData({ ...formData, monto: e.target.value })}
                                className={`w-full ${theme.colors.bgSecondary} border ${theme.colors.border} rounded-xl pl-10 pr-4 py-3 ${theme.colors.textPrimary} font-mono focus:ring-2 focus:ring-purple-500`}
                                required
                            />
                        </div>
                    </div>

                    {/* Tarjeta */}
                    <div>
                        <label className={`block text-sm font-medium ${theme.colors.textSecondary} mb-1`}>
                            <CardIcon size={14} className="inline mr-1" />
                            Tarjeta asociada
                        </label>
                        <select
                            value={formData.tarjeta}
                            onChange={(e) => setFormData({ ...formData, tarjeta: e.target.value })}
                            className={`w-full ${theme.colors.bgSecondary} border ${theme.colors.border} rounded-xl px-4 py-3 ${theme.colors.textPrimary} focus:ring-2 focus:ring-purple-500`}
                            required
                        >
                            <option value="">Seleccionar tarjeta...</option>
                            {cards.map(c => (
                                <option key={`${c.alias}-${c.banco}`} value={c.alias}>
                                    {c.alias} ({c.banco})
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Fecha de pago */}
                    <div>
                        <label className={`block text-sm font-medium ${theme.colors.textSecondary} mb-1`}>
                            <Calendar size={14} className="inline mr-1" />
                            Próxima fecha de cobro
                        </label>
                        <input
                            type="date"
                            value={formData.fecha_pago}
                            onChange={(e) => setFormData({ ...formData, fecha_pago: e.target.value })}
                            className={`w-full ${theme.colors.bgSecondary} border ${theme.colors.border} rounded-xl px-4 py-3 ${theme.colors.textPrimary} focus:ring-2 focus:ring-purple-500`}
                            required
                        />
                    </div>

                    {/* Notas */}
                    <div>
                        <label className={`block text-sm font-medium ${theme.colors.textSecondary} mb-1`}>
                            Notas (opcional)
                        </label>
                        <textarea
                            value={formData.notas}
                            onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                            className={`w-full ${theme.colors.bgSecondary} border ${theme.colors.border} rounded-xl px-4 py-3 ${theme.colors.textPrimary} focus:ring-2 focus:ring-purple-500 resize-none`}
                            rows={2}
                            placeholder="Notas adicionales..."
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className={`flex-1 px-4 py-3 rounded-xl font-semibold ${theme.colors.bgSecondary} ${theme.colors.textPrimary} hover:opacity-80 transition-all`}
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-4 py-3 rounded-xl font-semibold text-white bg-purple-500 hover:bg-purple-600 transition-all shadow-lg flex items-center justify-center gap-2"
                        >
                            <Save size={18} />
                            Guardar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
