import React from 'react';
import { PendingExpense } from '../types';
import { formatCurrency, formatDate } from '../utils/format';
import { useTheme } from '../contexts/ThemeContext';
import { Clock, CheckCircle, CreditCard } from 'lucide-react';
import { isDeudaVencida, calcularSaldoPendiente } from '../utils/debtUtils';

interface DebtListProps {
    expenses: PendingExpense[];
    title?: string;
}

export const DebtList: React.FC<DebtListProps> = ({ expenses, title = 'Mis Deudas Activas' }) => {
    const { theme } = useTheme();

    // Filtrar solo deudas (no suscripciones) y que tengan saldo pendiente
    const deudas = expenses.filter(e => {
        const saldo = calcularSaldoPendiente(e);
        const esDeuda = e.tipo !== 'suscripcion';
        const tieneSaldo = saldo > 0.1;
        return esDeuda && tieneSaldo;
    });

    if (deudas.length === 0) {
        return (
            <div className={`${theme.colors.bgCard} p-6 rounded-2xl border ${theme.colors.border} text-center`}>
                <div className="w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-3">
                    <CheckCircle className="text-emerald-500" size={24} />
                </div>
                <h3 className={`font-bold ${theme.colors.textPrimary}`}>¡Estás al día!</h3>
                <p className={`text-sm ${theme.colors.textMuted}`}>No tienes deudas pendientes registradas.</p>
            </div>
        );
    }

    // Calcular total de deuda pendiente
    const totalDeuda = deudas.reduce((sum, d) => sum + calcularSaldoPendiente(d), 0);

    return (
        <div className={`${theme.colors.bgCard} p-6 rounded-2xl border ${theme.colors.border} shadow-lg`}>
            <div className="flex justify-between items-center mb-4">
                <h3 className={`text-xl font-bold ${theme.colors.textPrimary} flex items-center gap-2`}>
                    <CreditCard size={24} className="text-blue-500" />
                    {title}
                </h3>
                <div className="text-right">
                    <p className={`text-xs ${theme.colors.textMuted}`}>Total pendiente</p>
                    <p className={`font-mono font-bold text-red-400`}>{formatCurrency(totalDeuda)}</p>
                </div>
            </div>

            <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1 scrollbar-thin">
                {deudas.map(deuda => {
                    const saldo = calcularSaldoPendiente(deuda);
                    const total = Number(deuda.monto) || 0;
                    const progreso = ((total - saldo) / total) * 100;
                    const vencida = isDeudaVencida(deuda);

                    return (
                        <div key={deuda.id} className={`p-4 rounded-xl border ${vencida ? 'border-red-500/50 bg-red-500/5' : `${theme.colors.border} ${theme.colors.bgSecondary}`}`}>
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <h4 className={`font-bold ${theme.colors.textPrimary}`}>{deuda.descripcion}</h4>
                                    <p className={`text-xs ${theme.colors.textMuted} flex items-center gap-1`}>
                                        <span className="font-semibold">{deuda.tarjeta}</span> • {Math.floor(Number(deuda.cuotas_pagadas))}/{deuda.num_cuotas} cuotas
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className={`font-mono font-bold ${vencida ? 'text-red-500' : theme.colors.textPrimary}`}>
                                        {formatCurrency(saldo)}
                                    </p>
                                    <p className="text-[10px] text-gray-500">Restante</p>
                                </div>
                            </div>

                            {/* Progress Bar */}
                            <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-2">
                                <div
                                    className={`h-full ${vencida ? 'bg-red-500' : 'bg-blue-500'}`}
                                    style={{ width: `${progreso}%` }}
                                />
                            </div>

                            {/* Footer info */}
                            <div className="flex justify-between items-center text-xs">
                                <div className="flex items-center gap-1">
                                    <Clock size={12} className={vencida ? 'text-red-500' : theme.colors.textMuted} />
                                    <span className={vencida ? 'text-red-500 font-bold' : theme.colors.textMuted}>
                                        {vencida ? 'VENCIDO' : `Vence: ${formatDate(deuda.fecha_pago)}`}
                                    </span>
                                </div>
                                <span className={theme.colors.textMuted}>
                                    Total: {formatCurrency(total)}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
