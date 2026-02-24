import React, { useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { X, Lightbulb, AlertTriangle, Smartphone, Hash, Wallet, CalendarClock, ShieldCheck, CircleDollarSign, ArrowRight } from 'lucide-react';

interface BankGuideModalProps {
    isOpen: boolean;
    onClose: () => void;
}

// Bank logo image paths (real logos from /public/logos/)
const bankLogoSrc: Record<string, string> = {
    bcp: '/logos/bcp.png',
    interbank: '/logos/interbank.jpg',
    bbva: '/logos/bbva.png',
    scotiabank: '/logos/scotiabank.png',
};

const BankLogo: React.FC<{ bankId: string; size?: number; className?: string }> = ({ bankId, size = 36, className = '' }) => (
    <img
        src={bankLogoSrc[bankId]}
        alt={bankId}
        width={size}
        height={size}
        className={`rounded-lg object-cover ${className}`}
    />
);

const banks = [
    { id: 'bcp', name: 'BCP', color: '#0033A1' },
    { id: 'interbank', name: 'Interbank', color: '#00843D' },
    { id: 'bbva', name: 'BBVA', color: '#004481' },
    { id: 'scotiabank', name: 'Scotiabank', color: '#EC111A' },
] as const;

type BankId = typeof banks[number]['id'];

export const BankGuideModal: React.FC<BankGuideModalProps> = ({ isOpen, onClose }) => {
    const { theme } = useTheme();
    const [activeBank, setActiveBank] = useState<BankId>('bcp');

    if (!isOpen) return null;

    const bankData: Record<BankId, {
        appName: string;
        altChannel: string;
        steps: string[];
        fields: { icon: React.ReactNode; label: string; desc: string }[];
        tip: string;
        extra?: string;
    }> = {
        bcp: {
            appName: 'Banca Móvil BCP',
            altChannel: 'viabcp.com',
            steps: ['Abre la app y ve a Tarjetas', 'Toca tu tarjeta de crédito', 'Selecciona "Ver detalle"'],
            fields: [
                { icon: <Wallet className="w-4 h-4" />, label: 'Consumido', desc: 'Lo que has gastado este mes' },
                { icon: <CircleDollarSign className="w-4 h-4" />, label: 'Disponible', desc: 'Lo que te queda por gastar' },
                { icon: <CalendarClock className="w-4 h-4" />, label: 'Fecha de cierre', desc: 'Día que cortan tu estado de cuenta' },
                { icon: <ShieldCheck className="w-4 h-4" />, label: 'Fecha de pago', desc: 'Último día para pagar sin intereses' },
            ],
            tip: 'En "Más" → "Pagar en cuotas" puedes convertir compras grandes a cuotas mensuales.',
        },
        interbank: {
            appName: 'Interbank App',
            altChannel: 'WhatsApp: 993 119 000',
            steps: ['Abre la app y selecciona tu tarjeta', 'Ve a "Estado de cuenta"', 'Revisa el resumen con todos tus datos'],
            fields: [
                { icon: <Hash className="w-4 h-4" />, label: 'Línea de crédito', desc: 'Tu límite total aprobado' },
                { icon: <CircleDollarSign className="w-4 h-4" />, label: 'Disponible', desc: 'Lo que puedes gastar aún' },
                { icon: <Wallet className="w-4 h-4" />, label: 'Deuda total', desc: 'Todo lo que debes actualmente' },
                { icon: <CalendarClock className="w-4 h-4" />, label: 'Pago mensual', desc: 'Lo que debes pagar este mes' },
            ],
            tip: 'Interbank muestra proyección de cuotas para los próximos 4 meses. Muy útil para planificar.',
            extra: 'Si tu fecha de cierre cae en feriado, se adelanta. Si tu fecha de pago cae en feriado, se atrasa (a tu favor).',
        },
        bbva: {
            appName: 'App BBVA Perú',
            altChannel: 'bbva.pe',
            steps: ['Abre la app y selecciona tu tarjeta', 'Ve a "Movimientos" o "Estado de Cuenta"', 'Revisa las fechas y montos'],
            fields: [
                { icon: <Wallet className="w-4 h-4" />, label: 'Consumido', desc: 'Gastos del periodo actual' },
                { icon: <CircleDollarSign className="w-4 h-4" />, label: 'Disponible', desc: 'Crédito restante' },
                { icon: <CalendarClock className="w-4 h-4" />, label: 'Fecha de cierre', desc: 'Día 10 o día 20 del mes' },
                { icon: <ShieldCheck className="w-4 h-4" />, label: 'Fecha de pago', desc: 'Día 5 (cierre=10) o día 16 (cierre=20)' },
            ],
            tip: '"Pásalo a Cuotas" te permite convertir compras grandes en pagos mensuales desde la app.',
            extra: 'BBVA solo tiene 2 ciclos posibles: cierre día 10 (pago día 5) o cierre día 20 (pago día 16). Revisa cuál es el tuyo.',
        },
        scotiabank: {
            appName: 'App Scotiabank',
            altChannel: 'scotiabank.com.pe',
            steps: ['Abre la app y selecciona tu tarjeta', 'Ve a "Estado de cuenta"', 'Revisa las 6 secciones del estado'],
            fields: [
                { icon: <CalendarClock className="w-4 h-4" />, label: 'Sec. 1 — Fechas y montos', desc: 'Cierre, pago, deuda total' },
                { icon: <Hash className="w-4 h-4" />, label: 'Sec. 2 — Línea y TEA', desc: 'Tu límite y tasa de interés' },
                { icon: <Wallet className="w-4 h-4" />, label: 'Sec. 4 — Cuotas vigentes', desc: 'Compras en cuotas activas' },
                { icon: <CircleDollarSign className="w-4 h-4" />, label: 'Sec. 6 — Movimientos', desc: 'Todas tus compras del periodo' },
            ],
            tip: 'Las cuotas aparecen como "Cuota 3/12" en tus movimientos. Así sabes cuántas te faltan.',
        },
    };

    const data = bankData[activeBank];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
            <div
                className={`${theme.colors.bgCard} w-full max-w-2xl max-h-[90vh] rounded-2xl shadow-2xl border ${theme.colors.border} overflow-hidden flex flex-col`}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="relative bg-gradient-to-r from-teal-600 to-teal-500 px-6 py-5">
                    <div className="relative flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                                <Smartphone className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white">¿Dónde encuentro mis datos?</h2>
                                <p className="text-white/80 text-sm mt-0.5">Guía paso a paso por banco</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 rounded-xl bg-white/20 hover:bg-white/30 text-white transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Bank Tabs with Logos */}
                <div className={`flex gap-2 p-3 border-b ${theme.colors.border} ${theme.colors.bgSecondary}`}>
                    {banks.map((bank) => {
                        const isActive = activeBank === bank.id;
                        return (
                            <button
                                key={bank.id}
                                onClick={() => setActiveBank(bank.id)}
                                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-2 rounded-xl text-sm font-bold transition-all duration-200 ${
                                    isActive
                                        ? 'text-white shadow-lg scale-[1.02]'
                                        : `${theme.colors.textMuted} ${theme.colors.bgCard} hover:scale-[1.01]`
                                }`}
                                style={isActive ? { backgroundColor: bank.color } : undefined}
                            >
                                <BankLogo bankId={bank.id} size={24} />
                                <span className="hidden sm:inline">{bank.name}</span>
                            </button>
                        );
                    })}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-5">
                    {/* Bank header */}
                    <div className="flex items-center gap-3">
                        <BankLogo bankId={activeBank} size={44} className="shadow-md" />
                        <div>
                            <p className={`font-bold text-lg ${theme.colors.textPrimary}`}>{data.appName}</p>
                            <p className={`text-xs ${theme.colors.textMuted}`}>{data.altChannel}</p>
                        </div>
                    </div>

                    {/* Steps */}
                    <div className={`p-4 rounded-xl ${theme.colors.bgSecondary} border ${theme.colors.border}`}>
                        <p className={`text-sm font-semibold mb-3 ${theme.colors.textPrimary} flex items-center gap-2`}>
                            <ArrowRight className="w-4 h-4 text-teal-400" />
                            Pasos para encontrar tus datos:
                        </p>
                        <div className="space-y-3">
                            {data.steps.map((step, i) => (
                                <div key={i} className="flex items-start gap-3">
                                    <div className="w-6 h-6 rounded-full bg-teal-500/20 text-teal-400 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</div>
                                    <p className={`text-sm ${theme.colors.textSecondary}`}>{step}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Data fields */}
                    <p className={`text-sm font-semibold ${theme.colors.textPrimary}`}>Busca estos datos:</p>
                    <div className="grid grid-cols-2 gap-3">
                        {data.fields.map((field, i) => (
                            <div key={i} className={`p-3 rounded-xl bg-teal-500/5 border ${theme.colors.border}`}>
                                <div className="flex items-center gap-2 mb-1 text-teal-400">
                                    {field.icon}
                                    <p className="text-sm font-bold">{field.label}</p>
                                </div>
                                <p className={`text-xs ${theme.colors.textMuted}`}>{field.desc}</p>
                            </div>
                        ))}
                    </div>

                    {/* Extra info (bank-specific) */}
                    {data.extra && (
                        <div className={`flex items-start gap-3 p-3 rounded-xl ${theme.colors.bgSecondary} border ${theme.colors.border}`}>
                            <AlertTriangle className="w-4 h-4 text-teal-400 flex-shrink-0 mt-0.5" />
                            <p className={`text-sm ${theme.colors.textSecondary}`}>{data.extra}</p>
                        </div>
                    )}

                    {/* Tip */}
                    <div className={`flex items-start gap-3 p-3 rounded-xl bg-teal-500/10 border border-teal-500/30`}>
                        <Lightbulb className="w-4 h-4 text-teal-400 flex-shrink-0 mt-0.5" />
                        <p className={`text-sm ${theme.colors.textSecondary}`}>
                            <span className="font-semibold text-teal-400">Tip: </span>{data.tip}
                        </p>
                    </div>
                </div>

                {/* Footer Warning */}
                <div className={`px-6 py-4 border-t ${theme.colors.border} ${theme.colors.bgSecondary}`}>
                    <div className="flex items-start gap-3 p-3 rounded-xl bg-red-500/10 border border-red-500/30">
                        <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="text-red-400 font-semibold text-sm">Importante</p>
                            <p className={`text-xs ${theme.colors.textSecondary} mt-1`}>
                                NO uses el "pago mínimo" como tu deuda — es solo ~5% del total. Siempre registra el monto total.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
