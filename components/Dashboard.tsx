import React, { useMemo } from 'react';
import { CreditCard, PendingExpense, Transaction } from '../types';
import { formatCurrency } from '../utils/format';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { ArrowUpRight, ArrowDownRight, Wallet, CreditCard as CreditIcon } from 'lucide-react';

interface DashboardProps {
  cards: CreditCard[];
  pendingExpenses: PendingExpense[];
  history: Transaction[]; // New prop for Income/Expense history
}

export const Dashboard: React.FC<DashboardProps> = ({ cards, pendingExpenses, history }) => {
  
  const currentStats = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // 1. Monthly Cash Flow (From History)
    let ingresosMes = 0;
    let gastosMes = 0; // Cash expenses only

    if (history) {
        history.forEach(t => {
            const d = new Date(t.fecha);
            // Fix timezone issue by checking raw string if needed, but simplified here
            if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
                if (t.tipo === 'Ingresos') ingresosMes += Number(t.monto);
                if (t.tipo === 'Gastos') gastosMes += Number(t.monto);
            }
        });
    }

    // 2. Credit Card Usage
    let deudaTotal = 0;
    let limiteTotal = 0;
    
    cards.forEach(c => limiteTotal += Number(c.limite));
    
    pendingExpenses.forEach(p => {
        const total = Number(p.monto);
        const cuotaVal = total / Number(p.num_cuotas);
        const pagado = cuotaVal * Number(p.cuotas_pagadas);
        deudaTotal += (total - pagado);
    });

    const disponible = Math.max(0, limiteTotal - deudaTotal);
    const usoCredito = limiteTotal > 0 ? (deudaTotal / limiteTotal) * 100 : 0;

    return { ingresosMes, gastosMes, deudaTotal, disponible, usoCredito, limiteTotal };
  }, [cards, pendingExpenses, history]);

  // Chart Data
  const barData = [
    { name: 'Ingresos', amount: currentStats.ingresosMes, color: '#10b981' },
    { name: 'Gastos (Efec)', amount: currentStats.gastosMes, color: '#f43f5e' },
  ];

  const recentTransactions = [
    ...(history || []).map(h => ({ ...h, isCredit: false })),
    ...pendingExpenses.map(p => ({ 
        fecha: p.fecha_gasto, 
        categoria: p.categoria, 
        descripcion: p.descripcion, 
        monto: p.monto, 
        tipo: 'Gasto Tarjeta',
        isCredit: true,
        timestamp: p.timestamp 
    }))
  ].sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
   .slice(0, 5);

  return (
    <div className="space-y-6">
      
      {/* Welcome & Month Context */}
      <div className="flex justify-between items-end mb-2">
        <div>
            <h2 className="text-2xl font-bold text-white">Resumen Mensual</h2>
            <p className="text-slate-400 text-sm">Panorama financiero de {new Date().toLocaleString('es-ES', { month: 'long' })}</p>
        </div>
      </div>

      {/* Hero Stats: Cash Flow vs Credit */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Cash Flow Card */}
        <div className="bg-slate-800/40 backdrop-blur-md p-6 rounded-3xl border border-slate-700/50 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5 text-emerald-500">
                <Wallet size={120} />
            </div>
            <h3 className="text-slate-400 font-bold uppercase text-xs tracking-wider mb-4">Flujo de Efectivo (Mes)</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <div className="flex items-center gap-1 text-emerald-400 mb-1">
                        <ArrowUpRight size={16} /> <span className="text-xs font-bold">Ingresos</span>
                    </div>
                    <p className="text-2xl font-mono font-bold text-white">{formatCurrency(currentStats.ingresosMes)}</p>
                </div>
                <div>
                    <div className="flex items-center gap-1 text-rose-400 mb-1">
                        <ArrowDownRight size={16} /> <span className="text-xs font-bold">Gastos</span>
                    </div>
                    <p className="text-2xl font-mono font-bold text-white">{formatCurrency(currentStats.gastosMes)}</p>
                </div>
            </div>

            <div className="mt-6 h-24">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barData} layout="vertical" barSize={12}>
                        <XAxis type="number" hide />
                        <YAxis dataKey="name" type="category" width={80} tick={{fill: '#94a3b8', fontSize: 10}} axisLine={false} tickLine={false}/>
                        <Tooltip cursor={{fill: 'transparent'}} contentStyle={{backgroundColor: '#1e293b', borderRadius: '8px', border: 'none'}} itemStyle={{color: '#fff'}} formatter={(val) => formatCurrency(Number(val))}/>
                        <Bar dataKey="amount" radius={[0, 4, 4, 0]}>
                            {barData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>

        {/* Credit Card Health */}
        <div className="bg-slate-800/40 backdrop-blur-md p-6 rounded-3xl border border-slate-700/50 shadow-xl relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-5 text-indigo-500">
                <CreditIcon size={120} />
            </div>
            <h3 className="text-slate-400 font-bold uppercase text-xs tracking-wider mb-4">Salud Crediticia</h3>
            
            <div className="mb-4">
                <p className="text-xs text-slate-500 mb-1">Deuda Total Tarjetas</p>
                <p className="text-3xl font-mono font-bold text-white">{formatCurrency(currentStats.deudaTotal)}</p>
            </div>

            <div className="space-y-3">
                <div>
                    <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-400">Uso de Línea</span>
                        <span className="text-indigo-300 font-bold">{currentStats.usoCredito.toFixed(1)}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                        <div 
                            className={`h-full rounded-full transition-all duration-1000 ${currentStats.usoCredito > 70 ? 'bg-rose-500' : 'bg-indigo-500'}`} 
                            style={{width: `${currentStats.usoCredito}%`}}
                        />
                    </div>
                </div>
                
                <div className="flex justify-between items-center pt-2 border-t border-white/5">
                    <span className="text-xs text-slate-500">Disponible para compras</span>
                    <span className="text-sm font-mono font-bold text-emerald-400">{formatCurrency(currentStats.disponible)}</span>
                </div>
            </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-slate-800/40 backdrop-blur-md rounded-3xl border border-slate-700/50 shadow-xl overflow-hidden">
         <div className="p-6 border-b border-slate-700/50">
            <h3 className="font-bold text-white">Últimos Movimientos</h3>
         </div>
         <div className="divide-y divide-slate-700/50">
            {recentTransactions.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-sm">No hay actividad reciente.</div>
            ) : (
                recentTransactions.map((t: any, idx) => (
                    <div key={idx} className="p-4 flex items-center justify-between hover:bg-slate-700/30 transition-colors">
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg
                                ${t.tipo === 'Ingresos' ? 'bg-emerald-500/20 text-emerald-400' : 
                                  t.isCredit ? 'bg-indigo-500/20 text-indigo-400' : 'bg-rose-500/20 text-rose-400'}`}>
                                {t.tipo === 'Ingresos' ? '💰' : t.isCredit ? '💳' : '💸'}
                            </div>
                            <div>
                                <p className="font-medium text-slate-200 text-sm">{t.descripcion}</p>
                                <p className="text-xs text-slate-500">{t.fecha} • {t.categoria}</p>
                            </div>
                        </div>
                        <span className={`font-mono font-bold text-sm ${t.tipo === 'Ingresos' ? 'text-emerald-400' : 'text-slate-200'}`}>
                            {t.tipo === 'Ingresos' ? '+' : '-'}{formatCurrency(Number(t.monto))}
                        </span>
                    </div>
                ))
            )}
         </div>
      </div>

    </div>
  );
};