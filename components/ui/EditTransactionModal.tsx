import React, { useState, useEffect } from 'react';
import { Transaction, CATEGORIAS_GASTOS, CATEGORIAS_INGRESOS } from '../../types';
import { useTheme } from '../../contexts/ThemeContext';
import { X, Save, Edit, DollarSign, Calendar } from 'lucide-react';

interface EditTransactionModalProps {
    isOpen: boolean;
    transaction: Transaction | null;
    onSave: (updated: Transaction, originalTimestamp: string) => void;
    onClose: () => void;
}

export const EditTransactionModal: React.FC<EditTransactionModalProps> = ({
    isOpen,
    transaction,
    onSave,
    onClose
}) => {
    const { theme } = useTheme();
    const [formData, setFormData] = useState({
        fecha: '',
        categoria: '',
        descripcion: '',
        monto: '',
        notas: ''
    });

    useEffect(() => {
        if (transaction) {
            setFormData({
                fecha: new Date().toISOString().split('T')[0],
                categoria: transaction.categoria,
                descripcion: transaction.descripcion,
                monto: transaction.monto.toString(),
                notas: transaction.notas || ''
            });
        }
    }, [transaction]);

    if (!isOpen || !transaction) return null;

    const categorias = transaction.tipo === 'Ingresos' ? CATEGORIAS_INGRESOS : CATEGORIAS_GASTOS;
    const accentColor = transaction.tipo === 'Ingresos' ? 'emerald' : 'blue';

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({
            ...transaction,
            fecha: formData.fecha,
            categoria: formData.categoria,
            descripcion: formData.descripcion,
            monto: parseFloat(formData.monto),
            notas: formData.notas
        }, transaction.timestamp);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            <div className={`relative ${theme.colors.bgCard} rounded-2xl shadow-2xl max-w-lg w-full p-6 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto`}>
                <div className="flex items-center justify-between mb-6">
                    <h3 className={`text-xl font-bold ${theme.colors.textPrimary} flex items-center gap-2`}>
                        <Edit size={20} />
                        Editar {transaction.tipo === 'Ingresos' ? 'Ingreso' : 'Gasto'}
                    </h3>
                    <button
                        onClick={onClose}
                        className={`p-2 rounded-lg ${theme.colors.bgSecondary} hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors`}
                    >
                        <X size={20} className={theme.colors.textMuted} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className={`block text-sm font-medium ${theme.colors.textSecondary} mb-1`}>
                            Descripción
                        </label>
                        <input
                            type="text"
                            value={formData.descripcion}
                            onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                            className={`w-full ${theme.colors.bgSecondary} border ${theme.colors.border} rounded-xl px-4 py-3 ${theme.colors.textPrimary} focus:ring-2 focus:ring-${accentColor}-500`}
                            required
                        />
                    </div>

                    <div>
                        <label className={`block text-sm font-medium ${theme.colors.textSecondary} mb-1`}>
                            <DollarSign size={14} className="inline mr-1" />
                            Monto
                        </label>
                        <div className="relative">
                            <span className={`absolute left-4 top-3.5 ${theme.colors.textMuted}`}>S/</span>
                            <input
                                type="number"
                                step="0.01"
                                value={formData.monto}
                                onChange={(e) => setFormData({ ...formData, monto: e.target.value })}
                                className={`w-full ${theme.colors.bgSecondary} border ${theme.colors.border} rounded-xl pl-10 pr-4 py-3 ${theme.colors.textPrimary} font-mono focus:ring-2 focus:ring-${accentColor}-500`}
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className={`block text-sm font-medium ${theme.colors.textSecondary} mb-1`}>
                            Categoría
                        </label>
                        <select
                            value={formData.categoria}
                            onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                            className={`w-full ${theme.colors.bgSecondary} border ${theme.colors.border} rounded-xl px-4 py-3 ${theme.colors.textPrimary} focus:ring-2 focus:ring-${accentColor}-500`}
                            required
                        >
                            <option value="">Seleccionar categoría...</option>
                            {categorias.map(c => (
                                <option key={c} value={c}>{c}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className={`block text-sm font-medium ${theme.colors.textSecondary} mb-1`}>
                            <Calendar size={14} className="inline mr-1" />
                            Fecha
                        </label>
                        <input
                            type="date"
                            value={formData.fecha}
                            onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                            className={`w-full ${theme.colors.bgSecondary} border ${theme.colors.border} rounded-xl px-4 py-3 ${theme.colors.textPrimary} focus:ring-2 focus:ring-${accentColor}-500`}
                            required
                        />
                    </div>

                    <div>
                        <label className={`block text-sm font-medium ${theme.colors.textSecondary} mb-1`}>
                            Notas (opcional)
                        </label>
                        <textarea
                            value={formData.notas}
                            onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                            className={`w-full ${theme.colors.bgSecondary} border ${theme.colors.border} rounded-xl px-4 py-3 ${theme.colors.textPrimary} focus:ring-2 focus:ring-${accentColor}-500 resize-none`}
                            rows={2}
                            placeholder="Notas adicionales..."
                        />
                    </div>

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
                            className={`flex-1 px-4 py-3 rounded-xl font-semibold text-white bg-${accentColor}-500 hover:bg-${accentColor}-600 transition-all shadow-lg flex items-center justify-center gap-2`}
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
