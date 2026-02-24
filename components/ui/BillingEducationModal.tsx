import React, { useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { X, Calendar, CreditCard, TrendingUp, AlertTriangle, CheckCircle2, BookOpen, Lightbulb, Target, Scale, Clock, Percent, Layers, ShieldAlert, ArrowRight } from 'lucide-react';

interface BillingEducationModalProps {
    isOpen: boolean;
    onClose: () => void;
}

type Section = 'ciclo' | 'glosario' | 'trampa' | 'tips';

const sections = [
    { id: 'ciclo' as Section, label: 'Ciclo', icon: Clock },
    { id: 'glosario' as Section, label: 'Glosario', icon: BookOpen },
    { id: 'trampa' as Section, label: 'Alerta', icon: ShieldAlert },
    { id: 'tips' as Section, label: 'Tips', icon: Lightbulb },
];

export const BillingEducationModal: React.FC<BillingEducationModalProps> = ({ isOpen, onClose }) => {
    const { theme } = useTheme();
    const [activeSection, setActiveSection] = useState<Section>('ciclo');

    if (!isOpen) return null;

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
                                <BookOpen className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white">¿Cómo funciona la facturación?</h2>
                                <p className="text-white/80 text-sm mt-0.5">Entiende tu tarjeta de crédito</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 rounded-xl bg-white/20 hover:bg-white/30 text-white transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Section Tabs */}
                <div className={`flex gap-1 p-3 border-b ${theme.colors.border} ${theme.colors.bgSecondary}`}>
                    {sections.map((section) => {
                        const Icon = section.icon;
                        return (
                            <button
                                key={section.id}
                                onClick={() => setActiveSection(section.id)}
                                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-sm font-bold transition-all duration-200 ${
                                    activeSection === section.id
                                        ? 'bg-teal-500 text-white shadow-lg scale-[1.02]'
                                        : `${theme.colors.textMuted} ${theme.colors.bgCard} hover:scale-[1.01]`
                                }`}
                            >
                                <Icon className="w-4 h-4" />
                                <span className="hidden sm:inline">{section.label}</span>
                            </button>
                        );
                    })}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {activeSection === 'ciclo' && <CicloSection />}
                    {activeSection === 'glosario' && <GlosarioSection />}
                    {activeSection === 'trampa' && <TrampaSection />}
                    {activeSection === 'tips' && <TipsSection />}
                </div>
            </div>
        </div>
    );
};

// --- Section Components ---

const CicloSection: React.FC = () => {
    const { theme } = useTheme();
    return (
        <div className="space-y-6">
            <div>
                <h3 className={`text-lg font-bold ${theme.colors.textPrimary} mb-2`}>El ciclo de facturación</h3>
                <p className={`text-sm ${theme.colors.textSecondary}`}>
                    Cada tarjeta de crédito tiene un ciclo mensual. Entender estas fechas es clave para evitar pagar intereses.
                </p>
            </div>

            {/* Visual Timeline */}
            <div className={`p-5 rounded-2xl ${theme.colors.bgSecondary} border ${theme.colors.border}`}>
                <div className="relative">
                    {/* Timeline bar */}
                    <div className="flex items-center gap-0 mb-6">
                        <div className="flex-1 h-2.5 bg-teal-500 rounded-l-full"></div>
                        <div className="w-5 h-5 rounded-full bg-teal-500 border-2 border-teal-300 z-10 flex-shrink-0 shadow-lg shadow-teal-500/40"></div>
                        <div className="flex-1 h-2.5 bg-teal-400"></div>
                        <div className="w-5 h-5 rounded-full bg-teal-400 border-2 border-teal-200 z-10 flex-shrink-0 shadow-lg shadow-teal-400/40"></div>
                        <div className="flex-1 h-2.5 bg-red-400/40 rounded-r-full"></div>
                    </div>

                    {/* Labels */}
                    <div className="flex items-start">
                        <div className="flex-1 text-center pr-2">
                            <div className="inline-flex items-center gap-1 mb-1">
                                <CreditCard className="w-3.5 h-3.5 text-teal-400" />
                                <p className="text-teal-400 font-bold text-sm">Periodo de compras</p>
                            </div>
                            <p className={`text-xs ${theme.colors.textMuted}`}>~30 días</p>
                            <p className={`text-xs ${theme.colors.textMuted}`}>Tus compras se acumulan aquí</p>
                        </div>
                        <div className="w-5 flex-shrink-0"></div>
                        <div className="flex-1 text-center px-1">
                            <div className="inline-flex items-center gap-1 mb-1">
                                <Calendar className="w-3.5 h-3.5 text-teal-300" />
                                <p className="text-teal-300 font-bold text-sm">Periodo de gracia</p>
                            </div>
                            <p className={`text-xs ${theme.colors.textMuted}`}>~20 días</p>
                            <p className={`text-xs ${theme.colors.textMuted}`}>Paga aquí sin intereses</p>
                        </div>
                        <div className="w-5 flex-shrink-0"></div>
                        <div className="flex-1 text-center pl-2">
                            <div className="inline-flex items-center gap-1 mb-1">
                                <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                                <p className="text-red-400 font-bold text-sm">Intereses</p>
                            </div>
                            <p className={`text-xs ${theme.colors.textMuted}`}>Si no pagas</p>
                            <p className={`text-xs ${theme.colors.textMuted}`}>Te cobran sobre el saldo</p>
                        </div>
                    </div>

                    {/* Date markers */}
                    <div className="flex mt-4">
                        <div className="flex-1"></div>
                        <div className="px-3 py-1.5 rounded-lg bg-teal-500/20 border border-teal-500/30">
                            <p className="text-teal-400 text-xs font-bold">Fecha Cierre</p>
                        </div>
                        <div className="flex-1"></div>
                        <div className="px-3 py-1.5 rounded-lg bg-teal-400/20 border border-teal-400/30">
                            <p className="text-teal-300 text-xs font-bold">Fecha Pago</p>
                        </div>
                        <div className="flex-1"></div>
                    </div>
                </div>
            </div>

            {/* How it works */}
            <div className="space-y-3">
                <h4 className={`text-sm font-bold ${theme.colors.textPrimary} flex items-center gap-2`}>
                    <ArrowRight className="w-4 h-4 text-teal-400" />
                    Cómo funciona:
                </h4>
                {[
                    { step: '1', text: 'Compras durante ~30 días (periodo de compras)', icon: <CreditCard className="w-4 h-4" /> },
                    { step: '2', text: 'El banco cierra tu cuenta y te dice cuánto debes (fecha de cierre)', icon: <Calendar className="w-4 h-4" /> },
                    { step: '3', text: 'Tienes ~20 días para pagar sin intereses (periodo de gracia)', icon: <Clock className="w-4 h-4" /> },
                    { step: '4', text: 'Si no pagas el total, te cobran intereses sobre lo que quede', icon: <AlertTriangle className="w-4 h-4" /> },
                ].map((item) => (
                    <div key={item.step} className={`flex items-start gap-3 p-3 rounded-xl ${theme.colors.bgSecondary} border ${theme.colors.border}`}>
                        <div className="w-6 h-6 rounded-full bg-teal-500/20 text-teal-400 text-xs font-bold flex items-center justify-center flex-shrink-0">{item.step}</div>
                        <div className="flex items-start gap-2 flex-1">
                            <span className="text-teal-400 mt-0.5 flex-shrink-0">{item.icon}</span>
                            <p className={`text-sm ${theme.colors.textSecondary}`}>{item.text}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const GlosarioSection: React.FC = () => {
    const { theme } = useTheme();

    const terms = [
        {
            title: 'Consumido vs Disponible',
            icon: <Scale className="w-5 h-5" />,
            content: (
                <div className="space-y-3">
                    <p className={`text-sm ${theme.colors.textSecondary}`}>
                        Tu límite de crédito se divide en dos partes:
                    </p>
                    <div className="w-full rounded-full h-4 bg-gray-700/50 overflow-hidden flex">
                        <div className="h-full bg-teal-600 rounded-l-full" style={{ width: '40%' }}></div>
                        <div className="h-full bg-teal-300 rounded-r-full" style={{ width: '60%' }}></div>
                    </div>
                    <div className="flex justify-between text-xs">
                        <span className="text-teal-500 font-semibold">Consumido (40%)</span>
                        <span className="text-teal-300 font-semibold">Disponible (60%)</span>
                    </div>
                    <p className={`text-xs ${theme.colors.textMuted}`}>
                        Si tu límite es S/. 5,000 y gastaste S/. 2,000, tu disponible es S/. 3,000.
                    </p>
                </div>
            ),
        },
        {
            title: 'Fecha de Cierre vs Fecha de Pago',
            icon: <Calendar className="w-5 h-5" />,
            content: (
                <div className="space-y-3">
                    <div className="flex items-start gap-2">
                        <Calendar className="w-4 h-4 text-teal-400 flex-shrink-0 mt-0.5" />
                        <p className={`text-sm ${theme.colors.textSecondary}`}>
                            <span className="font-semibold text-teal-400">Fecha de cierre:</span> El día que el banco "corta" y suma todas tus compras del mes.
                        </p>
                    </div>
                    <div className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-teal-400 flex-shrink-0 mt-0.5" />
                        <p className={`text-sm ${theme.colors.textSecondary}`}>
                            <span className="font-semibold text-teal-400">Fecha de pago:</span> Último día para pagar sin que te cobren intereses. Generalmente 15-25 días después del cierre.
                        </p>
                    </div>
                </div>
            ),
        },
        {
            title: 'TEA (Tasa Efectiva Anual)',
            icon: <Percent className="w-5 h-5" />,
            content: (
                <div className="space-y-2">
                    <p className={`text-sm ${theme.colors.textSecondary}`}>
                        Es el porcentaje de interés que te cobran al año. En Perú puede ir de 20% a 100%+ dependiendo de la tarjeta.
                    </p>
                    <div className={`p-2.5 rounded-lg ${theme.colors.bgSecondary} border ${theme.colors.border}`}>
                        <p className={`text-xs ${theme.colors.textMuted}`}>
                            Ejemplo: TEA de 60% significa que si debes S/. 1,000 por un año sin pagar, terminarías debiendo ~S/. 1,600.
                        </p>
                    </div>
                    <p className={`text-xs ${theme.colors.textMuted}`}>
                        Para comparar tarjetas, mira la <span className="font-semibold text-teal-400">TCEA</span> (incluye seguros, comisiones, etc.).
                    </p>
                </div>
            ),
        },
        {
            title: 'Cuotas',
            icon: <Layers className="w-5 h-5" />,
            content: (
                <div className="space-y-2">
                    <p className={`text-sm ${theme.colors.textSecondary}`}>
                        Cuando compras en cuotas, divides el pago en partes mensuales. Cada cuota aparece en tu estado de cuenta.
                    </p>
                    <div className={`p-2.5 rounded-lg ${theme.colors.bgSecondary} border ${theme.colors.border}`}>
                        <p className={`text-xs ${theme.colors.textMuted}`}>
                            Ejemplo: Compras un celular de S/. 1,200 en 12 cuotas = S/. 100/mes (+ intereses si aplica).
                        </p>
                    </div>
                    <p className={`text-xs ${theme.colors.textMuted}`}>
                        Hay cuotas <span className="text-teal-400 font-semibold">sin intereses</span> (tiendas afiliadas) y <span className="text-teal-400 font-semibold">con intereses</span> (la mayoría).
                    </p>
                </div>
            ),
        },
    ];

    return (
        <div className="space-y-4">
            <div>
                <h3 className={`text-lg font-bold ${theme.colors.textPrimary} mb-2`}>Glosario financiero</h3>
                <p className={`text-sm ${theme.colors.textSecondary} mb-4`}>
                    Los términos más importantes que debes conocer sobre tu tarjeta.
                </p>
            </div>
            {terms.map((term, i) => (
                <div key={i} className={`p-4 rounded-xl bg-teal-500/5 border ${theme.colors.border}`}>
                    <div className="flex items-center gap-2 mb-3 text-teal-400">
                        {term.icon}
                        <h4 className="font-bold text-sm">{term.title}</h4>
                    </div>
                    {term.content}
                </div>
            ))}
        </div>
    );
};

const TrampaSection: React.FC = () => {
    const { theme } = useTheme();
    return (
        <div className="space-y-6">
            <div>
                <h3 className={`text-lg font-bold ${theme.colors.textPrimary} mb-2`}>La trampa del pago mínimo</h3>
                <p className={`text-sm ${theme.colors.textSecondary}`}>
                    El pago mínimo parece conveniente, pero es la forma más cara de pagar tu tarjeta.
                </p>
            </div>

            {/* Warning Box */}
            <div className="p-5 rounded-2xl bg-red-500/10 border-2 border-red-500/30">
                <div className="flex items-center gap-2 mb-4">
                    <AlertTriangle className="w-6 h-6 text-red-400" />
                    <h4 className="text-red-400 font-bold text-lg">Ejemplo real</h4>
                </div>

                <div className="space-y-4">
                    <div className={`p-4 rounded-xl ${theme.colors.bgSecondary} border ${theme.colors.border}`}>
                        <p className={`text-sm ${theme.colors.textSecondary} mb-2`}>Si gastas:</p>
                        <p className={`text-2xl font-mono font-bold ${theme.colors.textPrimary}`}>S/. 1,000</p>
                        <p className={`text-xs ${theme.colors.textMuted} mt-1`}>Y solo pagas el mínimo cada mes...</p>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                        <div className={`p-3 rounded-xl ${theme.colors.bgSecondary} border ${theme.colors.border} text-center`}>
                            <TrendingUp className="w-5 h-5 text-red-400 mx-auto mb-1" />
                            <p className={`text-xs ${theme.colors.textMuted} mb-1`}>Terminas pagando</p>
                            <p className="text-lg font-mono font-bold text-red-400">S/. 1,792</p>
                        </div>
                        <div className={`p-3 rounded-xl ${theme.colors.bgSecondary} border ${theme.colors.border} text-center`}>
                            <Target className="w-5 h-5 text-red-400 mx-auto mb-1" />
                            <p className={`text-xs ${theme.colors.textMuted} mb-1`}>Solo en intereses</p>
                            <p className="text-lg font-mono font-bold text-red-400">S/. 792</p>
                        </div>
                        <div className={`p-3 rounded-xl ${theme.colors.bgSecondary} border ${theme.colors.border} text-center`}>
                            <Clock className="w-5 h-5 text-red-400 mx-auto mb-1" />
                            <p className={`text-xs ${theme.colors.textMuted} mb-1`}>Demoras en pagar</p>
                            <p className="text-lg font-mono font-bold text-red-400">33 meses</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Comparison */}
            <div className="space-y-3">
                <h4 className={`text-sm font-bold ${theme.colors.textPrimary}`}>¿Qué debiste hacer en su lugar?</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className={`p-4 rounded-xl bg-red-500/10 border border-red-500/20`}>
                        <div className="flex items-center gap-2 mb-2">
                            <X className="w-4 h-4 text-red-400" />
                            <p className="text-red-400 font-bold text-sm">Pago mínimo (~5%)</p>
                        </div>
                        <p className={`text-xs ${theme.colors.textSecondary}`}>Solo pagas ~S/. 50/mes. Parece poco pero el resto genera intereses compuestos.</p>
                    </div>
                    <div className={`p-4 rounded-xl bg-teal-500/10 border border-teal-500/20`}>
                        <div className="flex items-center gap-2 mb-2">
                            <CheckCircle2 className="w-4 h-4 text-teal-400" />
                            <p className="text-teal-400 font-bold text-sm">Pago del mes (100%)</p>
                        </div>
                        <p className={`text-xs ${theme.colors.textSecondary}`}>Pagas los S/. 1,000 completos. Cero intereses. Tu crédito mejora.</p>
                    </div>
                </div>
            </div>

            <div className={`flex items-start gap-3 p-4 rounded-xl bg-teal-500/10 border border-teal-500/30`}>
                <CheckCircle2 className="w-5 h-5 text-teal-400 flex-shrink-0 mt-0.5" />
                <p className={`text-sm ${theme.colors.textSecondary}`}>
                    <span className="font-bold text-teal-400">Regla de oro:</span> Siempre paga el "Pago del Mes" completo. Si no puedes, paga lo máximo posible — pero nunca solo el mínimo.
                </p>
            </div>
        </div>
    );
};

const TipsSection: React.FC = () => {
    const { theme } = useTheme();

    const tips = [
        { num: 1, title: 'Paga el monto completo', description: 'Siempre paga el "Pago del Mes" completo, no el mínimo. Si no puedes, paga lo máximo que puedas.', icon: <CheckCircle2 className="w-5 h-5" /> },
        { num: 2, title: 'Conoce tus 2 fechas clave', description: 'Fecha de cierre (cuando cortan) y fecha de pago (cuando debes pagar). Anotarlas en el calendario.', icon: <Calendar className="w-5 h-5" /> },
        { num: 3, title: 'Revisa Consumido vs Disponible', description: 'Abre tu app del banco regularmente. Si tu consumido supera el 30% del límite, ve con cuidado.', icon: <Scale className="w-5 h-5" /> },
        { num: 4, title: 'Las cuotas te comprometen', description: 'Cada cuota que tomas se suma a tu pago mensual. Antes de comprar en cuotas, suma cuánto ya tienes comprometido.', icon: <Layers className="w-5 h-5" /> },
        { num: 5, title: 'Compara con la TCEA', description: 'Si comparas tarjetas, mira la TCEA (no solo la TEA). Incluye seguros, comisiones y todo el costo real.', icon: <Percent className="w-5 h-5" /> },
    ];

    return (
        <div className="space-y-4">
            <div>
                <h3 className={`text-lg font-bold ${theme.colors.textPrimary} mb-2`}>5 Tips prácticos</h3>
                <p className={`text-sm ${theme.colors.textSecondary} mb-4`}>
                    Sigue estas reglas básicas para mantener tus finanzas saludables.
                </p>
            </div>
            {tips.map((tip) => (
                <div key={tip.num} className={`p-4 rounded-xl bg-teal-500/5 border ${theme.colors.border}`}>
                    <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-xl bg-teal-500/20 text-teal-400 text-sm font-bold flex items-center justify-center flex-shrink-0">
                            {tip.num}
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-teal-400">{tip.icon}</span>
                                <p className="font-bold text-sm text-teal-400">{tip.title}</p>
                            </div>
                            <p className={`text-sm ${theme.colors.textSecondary}`}>{tip.description}</p>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};
