import React, { useState } from 'react';
import { CreditCard as CreditCardIcon, Wallet, CheckCircle, ChevronRight, ChevronLeft, Plus, X, Landmark, PiggyBank, DollarSign, Loader2, Calendar, TrendingUp, Target, BarChart3, Users, Sparkles } from 'lucide-react';
import { BANCOS } from '../types';
import { sendToSheet } from '../services/googleSheetService';
import { generateId, getLocalISOString } from '../utils/format';

interface OnboardingWizardProps {
  scriptUrl: string;
  pin: string;
  onComplete: () => void;
}

interface CardEntry {
  banco: string;
  tipo_cuenta: 'credito' | 'debito';
  alias: string;
  limite: number;
  dia_cierre: number;
  dia_pago: number;
  tea: number | null;
}

const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

// ─── Llama Mascot SVG ─────────────────────────────────────────────
const LlamaMascot = ({ size = 80, className = '' }: { size?: number; className?: string }) => (
  <svg viewBox="0 0 120 200" width={size} height={size * (200/120)} className={className} aria-label="Llama mascota">
    <ellipse cx="60" cy="170" rx="42" ry="30" fill="#F5E6D3" />
    <path d="M30,162 Q38,155 34,166" stroke="#E8D5BC" strokeWidth="2" fill="none" strokeLinecap="round" />
    <path d="M45,158 Q52,151 48,162" stroke="#E8D5BC" strokeWidth="2" fill="none" strokeLinecap="round" />
    <path d="M62,160 Q70,153 66,164" stroke="#E8D5BC" strokeWidth="2" fill="none" strokeLinecap="round" />
    <path d="M78,163 Q84,156 80,167" stroke="#E8D5BC" strokeWidth="2" fill="none" strokeLinecap="round" />
    <path d="M38,172 Q45,167 42,176" stroke="#E8D5BC" strokeWidth="2" fill="none" strokeLinecap="round" />
    <path d="M55,170 Q62,165 58,174" stroke="#E8D5BC" strokeWidth="2" fill="none" strokeLinecap="round" />
    <path d="M72,172 Q78,167 75,176" stroke="#E8D5BC" strokeWidth="2" fill="none" strokeLinecap="round" />
    <path d="M48,142 Q46,110 48,85 Q50,78 60,78 Q70,78 72,85 Q74,110 72,142 Z" fill="#F5E6D3" />
    <path d="M52,130 Q56,125 54,134" stroke="#E8D5BC" strokeWidth="1.5" fill="none" strokeLinecap="round" />
    <path d="M62,120 Q66,115 64,124" stroke="#E8D5BC" strokeWidth="1.5" fill="none" strokeLinecap="round" />
    <path d="M54,108 Q58,103 56,112" stroke="#E8D5BC" strokeWidth="1.5" fill="none" strokeLinecap="round" />
    <ellipse cx="60" cy="60" rx="24" ry="28" fill="#F5E6D3" />
    <ellipse cx="60" cy="34" rx="18" ry="8" fill="#F5E6D3" />
    <path d="M42,36 Q34,14 30,4 Q28,0 32,2 Q40,8 46,30 Z" fill="#F5E6D3" />
    <path d="M43,34 Q36,16 33,7 Q37,12 44,32 Z" fill="#EDACA0" />
    <path d="M78,36 Q86,14 90,4 Q92,0 88,2 Q80,8 74,30 Z" fill="#F5E6D3" />
    <path d="M77,34 Q84,16 87,7 Q83,12 76,32 Z" fill="#EDACA0" />
    <circle cx="50" cy="54" r="4.5" fill="#1a1a1a" />
    <circle cx="70" cy="54" r="4.5" fill="#1a1a1a" />
    <circle cx="52" cy="52" r="1.8" fill="white" />
    <circle cx="72" cy="52" r="1.8" fill="white" />
    <path d="M56,66 L60,72 L64,66" fill="#2a2a2a" stroke="#2a2a2a" strokeWidth="1" strokeLinejoin="round" />
    <path d="M53,76 Q60,82 67,76" stroke="#2a2a2a" strokeWidth="1.8" fill="none" strokeLinecap="round" />
    <ellipse cx="42" cy="64" rx="5" ry="3" fill="#F0B8A8" opacity="0.5" />
    <ellipse cx="78" cy="64" rx="5" ry="3" fill="#F0B8A8" opacity="0.5" />
  </svg>
);

// ─── Speech Bubble ─────────────────────────────────────────────────
const LlamaTip = ({ children }: { children: React.ReactNode }) => (
  <div className="flex items-start gap-3">
    <div className="flex-shrink-0 mt-1">
      <LlamaMascot size={36} />
    </div>
    <div className="relative bg-gradient-to-br from-amber-50 to-orange-50 text-amber-900 rounded-2xl rounded-tl-sm px-4 py-3 text-xs leading-relaxed shadow-sm border border-amber-200/60">
      {children}
    </div>
  </div>
);

// ─── Date Helpers ──────────────────────────────────────────────────
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

function formatDateShort(date: Date): string {
  return `${date.getDate()} de ${MESES[date.getMonth()]}`;
}

function formatDateISO(date: Date): string {
  return date.toISOString().split('T')[0];
}

function calcPaymentDates(card: CardEntry, when: 'este_mes' | 'proximo_mes') {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  if (when === 'este_mes') {
    // Deuda ya facturada → pago es el día_pago que viene
    const pagoDate = new Date(year, month, card.dia_pago);
    if (pagoDate <= now) pagoDate.setMonth(pagoDate.getMonth() + 1);
    const cierreDate = new Date(pagoDate.getFullYear(), pagoDate.getMonth() - 1, card.dia_cierre);
    return { fecha_cierre: formatDateISO(cierreDate), fecha_pago: formatDateISO(pagoDate), pagoLabel: formatDateShort(pagoDate) };
  } else {
    // Compras recientes → próximo cierre, pago del mes siguiente
    const cierreDate = new Date(year, month, card.dia_cierre);
    if (cierreDate <= now) cierreDate.setMonth(cierreDate.getMonth() + 1);
    const pagoDate = new Date(cierreDate.getFullYear(), cierreDate.getMonth() + 1, card.dia_pago);
    return { fecha_cierre: formatDateISO(cierreDate), fecha_pago: formatDateISO(pagoDate), pagoLabel: formatDateShort(pagoDate) };
  }
}

export const OnboardingWizard: React.FC<OnboardingWizardProps> = ({ scriptUrl, pin, onComplete }) => {
  const [step, setStep] = useState(0);
  const [cards, setCards] = useState<CardEntry[]>([]);
  const [billetera, setBilletera] = useState('');
  const [balances, setBalances] = useState<Record<string, string>>({});
  const [debts, setDebts] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitProgress, setSubmitProgress] = useState('');

  // When is the debt due: this month or next month
  const [debtTiming, setDebtTiming] = useState<Record<string, 'este_mes' | 'proximo_mes'>>({});

  // Card form state
  const [cardForm, setCardForm] = useState({
    banco: '',
    tipo_cuenta: 'debito' as 'credito' | 'debito',
    alias: '',
    limite: '',
    dia_cierre: '',
    dia_pago: '',
    tea: ''
  });
  const [showCardForm, setShowCardForm] = useState(false);

  const today = new Date().toISOString().split('T')[0];

  // ─── Card Form Logic ──────────────────────────────────────────────
  const resetCardForm = () => {
    setCardForm({ banco: '', tipo_cuenta: 'debito', alias: '', limite: '', dia_cierre: '', dia_pago: '', tea: '' });
  };

  const addCard = () => {
    if (!cardForm.banco || !cardForm.alias) return;
    const newCard: CardEntry = {
      banco: cardForm.banco,
      tipo_cuenta: cardForm.tipo_cuenta,
      alias: cardForm.alias,
      limite: cardForm.tipo_cuenta === 'credito' ? (Number(cardForm.limite) || 0) : 0,
      dia_cierre: cardForm.tipo_cuenta === 'credito' ? (Number(cardForm.dia_cierre) || 1) : 0,
      dia_pago: cardForm.tipo_cuenta === 'credito' ? (Number(cardForm.dia_pago) || 1) : 0,
      tea: cardForm.tipo_cuenta === 'credito' && cardForm.tea ? Number(cardForm.tea) : null
    };
    setCards([...cards, newCard]);
    if (newCard.tipo_cuenta === 'credito') {
      setDebtTiming(prev => ({ ...prev, [newCard.alias]: 'este_mes' }));
    }
    resetCardForm();
    setShowCardForm(false);
  };

  const removeCard = (index: number) => {
    const removed = cards[index];
    setCards(cards.filter((_, i) => i !== index));
    const newBalances = { ...balances };
    delete newBalances[removed.alias];
    setBalances(newBalances);
    const newDebts = { ...debts };
    delete newDebts[removed.alias];
    setDebts(newDebts);
    const newTiming = { ...debtTiming };
    delete newTiming[removed.alias];
    setDebtTiming(newTiming);
  };

  // ─── Submit Logic ─────────────────────────────────────────────────
  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      // 1. Create cards
      for (let i = 0; i < cards.length; i++) {
        const card = cards[i];
        setSubmitProgress(`Creando tarjeta ${i + 1} de ${cards.length}...`);
        await sendToSheet(scriptUrl, pin, {
          banco: card.banco,
          tipo_tarjeta: card.tipo_cuenta === 'credito' ? 'Credito' : 'Debito',
          alias: card.alias,
          url_imagen: '',
          dia_cierre: card.dia_cierre,
          dia_pago: card.dia_pago,
          limite: card.limite,
          tea: card.tea ?? '',
          tipo_cuenta: card.tipo_cuenta,
          timestamp: getLocalISOString()
        }, 'Tarjetas');
        await delay(500);
      }

      // 2. Billetera initial balance
      const billeteraAmount = Number(billetera) || 0;
      if (billeteraAmount > 0) {
        setSubmitProgress('Registrando saldo de Billetera...');
        await sendToSheet(scriptUrl, pin, {
          fecha: today,
          categoria: 'Saldo Inicial',
          descripcion: 'Saldo inicial - Billetera',
          monto: billeteraAmount,
          notas: 'Configurado en onboarding',
          cuenta: 'Billetera',
          timestamp: getLocalISOString()
        }, 'Ingresos');
        await delay(500);
      }

      // 3. Debit card balances
      for (const card of cards.filter(c => c.tipo_cuenta === 'debito')) {
        const amount = Number(balances[card.alias]) || 0;
        if (amount > 0) {
          setSubmitProgress(`Registrando saldo de ${card.alias}...`);
          await sendToSheet(scriptUrl, pin, {
            fecha: today,
            categoria: 'Saldo Inicial',
            descripcion: `Saldo inicial - ${card.alias}`,
            monto: amount,
            notas: 'Configurado en onboarding',
            cuenta: card.alias,
            timestamp: getLocalISOString()
          }, 'Ingresos');
          await delay(500);
        }
      }

      // 4. Credit card debts — with calculated payment dates
      for (const card of cards.filter(c => c.tipo_cuenta === 'credito')) {
        const amount = Number(debts[card.alias]) || 0;
        if (amount > 0) {
          const when = debtTiming[card.alias] || 'este_mes';
          const { fecha_cierre, fecha_pago } = calcPaymentDates(card, when);
          setSubmitProgress(`Registrando deuda de ${card.alias}...`);
          await sendToSheet(scriptUrl, pin, {
            id: generateId(),
            fecha_gasto: today,
            tarjeta: card.alias,
            categoria: 'Deuda Existente',
            descripcion: when === 'este_mes'
              ? `Deuda del periodo - ${card.alias}`
              : `Compras recientes - ${card.alias}`,
            monto: amount,
            fecha_cierre,
            fecha_pago,
            estado: 'Pendiente',
            num_cuotas: 1,
            cuotas_pagadas: 0,
            monto_pagado_total: 0,
            tipo_gasto: 'deuda',
            notas: `Configurado en onboarding (${when === 'este_mes' ? 'periodo actual' : 'proximo periodo'})`,
            timestamp: getLocalISOString()
          }, 'Gastos_Pendientes');
          await delay(500);
        }
      }

      setSubmitProgress('Sincronizando datos...');
      await delay(2000);
      onComplete();
    } catch (error) {
      console.error('Error en onboarding:', error);
      setSubmitProgress('Error al guardar. Intenta de nuevo.');
      setIsSubmitting(false);
    }
  };

  const debitCards = cards.filter(c => c.tipo_cuenta === 'debito');
  const creditCards = cards.filter(c => c.tipo_cuenta === 'credito');

  // ─── Benefits Data ──────────────────────────────────────────────
  const benefits = [
    { icon: <Wallet size={20} />, color: 'emerald', title: 'Control total de dinero', desc: 'Registra gastos e ingresos al instante desde cualquier cuenta' },
    { icon: <CreditCardIcon size={20} />, color: 'sky', title: 'Tarjetas sincronizadas', desc: 'Maneja tarjetas de debito y credito con fechas de corte y pago' },
    { icon: <TrendingUp size={20} />, color: 'violet', title: 'Deudas bajo control', desc: 'Visualiza y paga deudas pendientes, nunca pierdas una fecha' },
    { icon: <Target size={20} />, color: 'amber', title: 'Metas de ahorro', desc: 'Crea metas, aporta desde cualquier cuenta y mide tu progreso' },
    { icon: <BarChart3 size={20} />, color: 'rose', title: 'Reportes inteligentes', desc: 'Graficos y analisis para entender a donde va tu dinero' },
    { icon: <Users size={20} />, color: 'teal', title: 'Plan familiar', desc: 'Conecta con tu pareja o familia y manejen sus finanzas juntos' },
  ];

  const colorMap: Record<string, { bg: string; text: string; border: string }> = {
    emerald: { bg: 'bg-emerald-500/15', text: 'text-emerald-400', border: 'border-emerald-500/20' },
    sky: { bg: 'bg-sky-500/15', text: 'text-sky-400', border: 'border-sky-500/20' },
    violet: { bg: 'bg-violet-500/15', text: 'text-violet-400', border: 'border-violet-500/20' },
    amber: { bg: 'bg-amber-500/15', text: 'text-amber-400', border: 'border-amber-500/20' },
    rose: { bg: 'bg-rose-500/15', text: 'text-rose-400', border: 'border-rose-500/20' },
    teal: { bg: 'bg-teal-500/15', text: 'text-teal-400', border: 'border-teal-500/20' },
  };

  // ─── Step Content ─────────────────────────────────────────────────
  const renderStep = () => {
    switch (step) {
      // ═══════════════ PASO 0: BIENVENIDA ═══════════════
      case 0:
        return (
          <div className="space-y-5">
            {/* Llama hero */}
            <div className="flex flex-col items-center text-center pt-2 pb-1">
              <LlamaMascot size={72} />
              <h2 className="text-xl font-bold text-white mt-3">Hola! Soy tu asistente financiero</h2>
              <p className="text-white/50 text-sm mt-1.5 max-w-xs">
                Configura tu cuenta para aprovechar todos los beneficios de la app
              </p>
            </div>

            {/* Benefits grid — 2 cols on desktop */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {benefits.map((b, i) => {
                const colors = colorMap[b.color];
                return (
                  <div key={i} className={`flex items-start gap-3 p-3.5 rounded-xl ${colors.bg} border ${colors.border} transition-all hover:scale-[1.02]`}>
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${colors.bg} ${colors.text}`}>
                      {b.icon}
                    </div>
                    <div className="min-w-0">
                      <p className="text-white text-sm font-semibold">{b.title}</p>
                      <p className="text-white/45 text-xs leading-relaxed">{b.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Unlock message */}
            <div className="flex items-center gap-2 justify-center pt-1">
              <Sparkles size={14} className="text-amber-400" />
              <p className="text-amber-300/80 text-xs font-medium">Completa la configuracion para desbloquear todo</p>
              <Sparkles size={14} className="text-amber-400" />
            </div>
          </div>
        );

      // ═══════════════ PASO 1: TARJETAS ═══════════════
      case 1:
        return (
          <div className="space-y-4">
            <LlamaTip>
              Agrega tus tarjetas de <strong>debito y credito</strong> para empezar a llevar el control.
              {cards.length === 0 && <> Si no tienes tarjetas, puedes saltar este paso.</>}
            </LlamaTip>

            {/* Cards added */}
            {cards.length > 0 && (
              <div className="space-y-2">
                {cards.map((card, i) => (
                  <div key={i} className="flex items-center justify-between bg-white/5 rounded-xl p-3 border border-white/10">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${card.tipo_cuenta === 'credito' ? 'bg-violet-500/20 text-violet-400' : 'bg-sky-500/20 text-sky-400'}`}>
                        <CreditCardIcon size={16} />
                      </div>
                      <div>
                        <p className="text-white text-sm font-medium">{card.alias}</p>
                        <p className="text-white/50 text-xs">{card.banco} · {card.tipo_cuenta === 'credito' ? 'Credito' : 'Debito'}</p>
                      </div>
                    </div>
                    <button onClick={() => removeCard(i)} className="text-white/30 hover:text-rose-400 transition-colors p-1.5 rounded-lg hover:bg-rose-500/10">
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add card form */}
            {showCardForm ? (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3">
                {/* Type toggle */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setCardForm({ ...cardForm, tipo_cuenta: 'debito' })}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${cardForm.tipo_cuenta === 'debito' ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/30' : 'bg-white/5 text-white/50 hover:text-white/80'}`}
                  >
                    Debito
                  </button>
                  <button
                    onClick={() => setCardForm({ ...cardForm, tipo_cuenta: 'credito' })}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${cardForm.tipo_cuenta === 'credito' ? 'bg-violet-500 text-white shadow-lg shadow-violet-500/30' : 'bg-white/5 text-white/50 hover:text-white/80'}`}
                  >
                    Credito
                  </button>
                </div>

                {/* Bank */}
                <select
                  value={cardForm.banco}
                  onChange={e => setCardForm({ ...cardForm, banco: e.target.value })}
                  className="w-full bg-slate-800 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:ring-2 focus:ring-emerald-400/50 focus:border-transparent [&>option]:bg-slate-800 [&>option]:text-white"
                >
                  <option value="">Selecciona banco</option>
                  {BANCOS.map(b => <option key={b} value={b}>{b}</option>)}
                </select>

                {/* Alias */}
                <input
                  type="text"
                  value={cardForm.alias}
                  onChange={e => setCardForm({ ...cardForm, alias: e.target.value })}
                  placeholder="Nombre de la tarjeta (ej: Visa BCP)"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm placeholder-white/30 focus:ring-2 focus:ring-emerald-400/50 focus:border-transparent"
                />

                {/* Limit — ONLY for credit cards (Fix 1) */}
                {cardForm.tipo_cuenta === 'credito' && (
                  <>
                    <input
                      type="number"
                      value={cardForm.limite}
                      onChange={e => setCardForm({ ...cardForm, limite: e.target.value })}
                      placeholder="Limite de credito (S/.)"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm placeholder-white/30 focus:ring-2 focus:ring-emerald-400/50 focus:border-transparent"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="number"
                        value={cardForm.dia_cierre}
                        onChange={e => setCardForm({ ...cardForm, dia_cierre: e.target.value })}
                        placeholder="Dia de cierre"
                        min="1" max="31"
                        className="bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm placeholder-white/30 focus:ring-2 focus:ring-emerald-400/50 focus:border-transparent"
                      />
                      <input
                        type="number"
                        value={cardForm.dia_pago}
                        onChange={e => setCardForm({ ...cardForm, dia_pago: e.target.value })}
                        placeholder="Dia de pago"
                        min="1" max="31"
                        className="bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm placeholder-white/30 focus:ring-2 focus:ring-emerald-400/50 focus:border-transparent"
                      />
                    </div>
                  </>
                )}

                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => { resetCardForm(); setShowCardForm(false); }}
                    className="flex-1 bg-white/5 hover:bg-white/10 text-white/70 py-2.5 rounded-xl text-sm transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={addCard}
                    disabled={!cardForm.banco || !cardForm.alias}
                    className="flex-1 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-30 disabled:cursor-not-allowed text-white py-2.5 rounded-xl text-sm font-semibold transition-all shadow-lg shadow-emerald-500/25"
                  >
                    Agregar
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowCardForm(true)}
                className="w-full flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border-2 border-dashed border-white/15 hover:border-emerald-400/50 text-white/50 hover:text-emerald-400 rounded-2xl py-4 transition-all"
              >
                <Plus size={18} />
                Agregar tarjeta
              </button>
            )}

            {cards.length === 0 && (
              <p className="text-white/30 text-xs text-center">Puedes agregar tarjetas despues si prefieres</p>
            )}
          </div>
        );

      // ═══════════════ PASO 2: SALDOS ═══════════════
      case 2:
        return (
          <div className="space-y-5">
            <LlamaTip>
              Ingresa cuanto dinero tienes <strong>hoy</strong> en cada cuenta.
              {' '}Si no sabes algo, dejalo en 0.
            </LlamaTip>

            {/* Billetera */}
            <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 rounded-2xl p-4 border border-emerald-500/20">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                  <Wallet size={20} className="text-emerald-400" />
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">Billetera (Efectivo)</p>
                  <p className="text-emerald-300/60 text-xs">Dinero fisico que tienes ahora mismo</p>
                </div>
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-400/60 text-sm font-medium">S/.</span>
                <input
                  type="number"
                  value={billetera}
                  onChange={e => setBilletera(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-black/20 border border-emerald-500/20 rounded-xl pl-10 pr-3 py-3 text-white text-sm placeholder-white/20 focus:ring-2 focus:ring-emerald-400/50 focus:border-transparent"
                />
              </div>
            </div>

            {/* Debit card balances */}
            {debitCards.length > 0 && (
              <div>
                <h4 className="text-sky-400 text-xs font-bold uppercase tracking-wider mb-1.5 flex items-center gap-2">
                  <Landmark size={14} />
                  Tarjetas de Debito
                </h4>
                <p className="text-white/40 text-xs mb-3">Abre tu app del banco y busca "Saldo disponible"</p>
                <div className="space-y-3">
                  {debitCards.map(card => (
                    <div key={card.alias} className="bg-gradient-to-br from-sky-500/10 to-sky-600/5 rounded-2xl p-4 border border-sky-500/20">
                      <p className="text-white text-sm font-semibold mb-2">{card.alias} <span className="text-white/30 text-xs font-normal">({card.banco})</span></p>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sky-400/60 text-sm font-medium">S/.</span>
                        <input
                          type="number"
                          value={balances[card.alias] || ''}
                          onChange={e => setBalances({ ...balances, [card.alias]: e.target.value })}
                          placeholder="0.00"
                          className="w-full bg-black/20 border border-sky-500/20 rounded-xl pl-10 pr-3 py-3 text-white text-sm placeholder-white/20 focus:ring-2 focus:ring-sky-400/50 focus:border-transparent"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Credit card debts — simplified with timing */}
            {creditCards.length > 0 && (
              <div>
                <h4 className="text-violet-400 text-xs font-bold uppercase tracking-wider mb-1.5 flex items-center gap-2">
                  <CreditCardIcon size={14} />
                  Deuda en Tarjetas de Credito
                </h4>

                {/* Llama guide */}
                <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/5 border border-amber-400/20 rounded-2xl p-3 mb-4">
                  <div className="flex gap-3">
                    <div className="flex-shrink-0">
                      <LlamaMascot size={44} />
                    </div>
                    <div className="text-xs leading-relaxed">
                      <p className="text-amber-200 font-semibold mb-1">Abre tu app del banco y busca:</p>
                      <p className="text-amber-200/80">
                        Donde dice <strong className="text-amber-100">"Consumido"</strong>,{' '}
                        <strong className="text-amber-100">"Deuda total"</strong> o{' '}
                        <strong className="text-amber-100">"Total a pagar del periodo"</strong>.
                      </p>
                      <p className="text-red-300/80 mt-1.5 font-medium">
                        ⚠ NO pongas el "pago minimo" — ese NO es tu deuda real.
                      </p>
                      <p className="text-amber-300/60 mt-1">Si no tienes deuda, dejalo en 0.</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  {creditCards.map(card => {
                    const when = debtTiming[card.alias] || 'este_mes';
                    const esteMesDates = calcPaymentDates(card, 'este_mes');
                    const proximoDates = calcPaymentDates(card, 'proximo_mes');

                    return (
                      <div key={card.alias} className="bg-gradient-to-br from-violet-500/10 to-purple-600/5 rounded-2xl border border-violet-500/20 overflow-hidden">
                        {/* Card header */}
                        <div className="px-4 pt-4 pb-2">
                          <p className="text-white text-sm font-semibold">{card.alias} <span className="text-white/30 text-xs font-normal">({card.banco})</span></p>
                          <p className="text-violet-300/50 text-xs">Limite: S/. {card.limite.toLocaleString()}</p>
                        </div>

                        {/* Debt amount */}
                        <div className="px-4 pb-3">
                          <label className="text-violet-300/70 text-xs mb-1.5 block">
                            Deuda total / Consumido (S/.)
                          </label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-violet-400/60 text-sm font-medium">S/.</span>
                            <input
                              type="number"
                              value={debts[card.alias] || ''}
                              onChange={e => setDebts({ ...debts, [card.alias]: e.target.value })}
                              placeholder="0.00"
                              className="w-full bg-black/20 border border-violet-500/20 rounded-xl pl-10 pr-3 py-3 text-white text-sm placeholder-white/20 focus:ring-2 focus:ring-violet-400/50 focus:border-transparent"
                            />
                          </div>
                        </div>

                        {/* Timing radio — only show if debt > 0 */}
                        {Number(debts[card.alias]) > 0 && (
                          <div className="px-4 pb-4">
                            <div className="flex items-center gap-1.5 mb-2">
                              <Calendar size={12} className="text-violet-400/60" />
                              <span className="text-violet-300/60 text-xs">Cuando lo tienes que pagar?</span>
                            </div>
                            <div className="space-y-2">
                              <label
                                className={`flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-all ${
                                  when === 'este_mes'
                                    ? 'bg-violet-500/15 border border-violet-400/30'
                                    : 'bg-black/10 border border-transparent hover:border-white/10'
                                }`}
                              >
                                <input
                                  type="radio"
                                  name={`timing-${card.alias}`}
                                  checked={when === 'este_mes'}
                                  onChange={() => setDebtTiming({ ...debtTiming, [card.alias]: 'este_mes' })}
                                  className="accent-violet-500"
                                />
                                <div>
                                  <p className={`text-xs font-medium ${when === 'este_mes' ? 'text-violet-200' : 'text-white/50'}`}>
                                    Este mes — antes del {esteMesDates.pagoLabel}
                                  </p>
                                  <p className="text-white/30 text-[10px]">Ya aparece en mi estado de cuenta como "consumido"</p>
                                </div>
                              </label>
                              <label
                                className={`flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-all ${
                                  when === 'proximo_mes'
                                    ? 'bg-violet-500/15 border border-violet-400/30'
                                    : 'bg-black/10 border border-transparent hover:border-white/10'
                                }`}
                              >
                                <input
                                  type="radio"
                                  name={`timing-${card.alias}`}
                                  checked={when === 'proximo_mes'}
                                  onChange={() => setDebtTiming({ ...debtTiming, [card.alias]: 'proximo_mes' })}
                                  className="accent-violet-500"
                                />
                                <div>
                                  <p className={`text-xs font-medium ${when === 'proximo_mes' ? 'text-violet-200' : 'text-white/50'}`}>
                                    El proximo mes — antes del {proximoDates.pagoLabel}
                                  </p>
                                  <p className="text-white/30 text-[10px]">Son compras recientes que aun no aparecen en mi estado de cuenta</p>
                                </div>
                              </label>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {cards.length === 0 && (
              <div className="bg-white/5 rounded-2xl p-4 text-center border border-white/10">
                <Wallet size={24} className="text-white/20 mx-auto mb-2" />
                <p className="text-white/40 text-sm">Solo tienes Billetera. Puedes agregar tarjetas despues.</p>
              </div>
            )}
          </div>
        );

      // ═══════════════ PASO 3: RESUMEN ═══════════════
      case 3:
        return (
          <div className="space-y-4">
            {isSubmitting ? (
              <div className="bg-white/5 rounded-2xl p-8 text-center border border-white/10">
                <Loader2 size={40} className="text-emerald-400 animate-spin mx-auto mb-4" />
                <p className="text-white font-semibold mb-1">Configurando tu cuenta...</p>
                <p className="text-white/50 text-sm">{submitProgress}</p>
              </div>
            ) : (
              <>
                <LlamaTip>
                  Todo listo! Revisa que este correcto y dale <strong>Comenzar</strong>.
                </LlamaTip>

                {/* Cards summary */}
                {cards.length > 0 && (
                  <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                    <h4 className="text-emerald-400 text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-2">
                      <CreditCardIcon size={14} />
                      {cards.length} tarjeta{cards.length > 1 ? 's' : ''}
                    </h4>
                    <div className="space-y-2">
                      {cards.map((card, i) => (
                        <div key={i} className="flex items-center justify-between text-sm">
                          <span className="text-white/70">{card.alias} <span className="text-white/30">({card.banco})</span></span>
                          <span className={card.tipo_cuenta === 'credito' ? 'text-violet-400 text-xs font-medium' : 'text-sky-400 text-xs font-medium'}>
                            {card.tipo_cuenta === 'credito' ? 'Credito' : 'Debito'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Balances summary */}
                <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                  <h4 className="text-emerald-400 text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-2">
                    <PiggyBank size={14} />
                    Saldos iniciales
                  </h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-white/70">Billetera</span>
                      <span className="text-emerald-400 font-semibold">S/. {Number(billetera || 0).toFixed(2)}</span>
                    </div>
                    {debitCards.map(card => (
                      <div key={card.alias} className="flex items-center justify-between text-sm">
                        <span className="text-white/70">{card.alias}</span>
                        <span className="text-sky-400 font-semibold">S/. {Number(balances[card.alias] || 0).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Debts summary — with payment dates */}
                {creditCards.length > 0 && (
                  <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                    <h4 className="text-rose-400 text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-2">
                      <DollarSign size={14} />
                      Deudas
                    </h4>
                    <div className="space-y-3">
                      {creditCards.map(card => {
                        const debtAmount = Number(debts[card.alias]) || 0;
                        const when = debtTiming[card.alias] || 'este_mes';
                        const { pagoLabel } = calcPaymentDates(card, when);
                        return (
                          <div key={card.alias}>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-white/70">{card.alias}</span>
                              <span className={`font-semibold ${debtAmount > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                                S/. {debtAmount.toFixed(2)}
                              </span>
                            </div>
                            {debtAmount > 0 && (
                              <p className="text-white/30 text-xs mt-0.5 flex items-center gap-1">
                                <Calendar size={10} />
                                Pagar antes del {pagoLabel}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {cards.length === 0 && Number(billetera || 0) === 0 && (
                  <div className="bg-amber-500/10 border border-amber-400/20 rounded-2xl p-4">
                    <p className="text-amber-200 text-sm">No agregaste tarjetas ni saldos. Puedes configurar todo despues desde el menu.</p>
                  </div>
                )}
              </>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  const stepTitles = [
    { icon: <Sparkles size={22} />, title: 'Bienvenido', subtitle: 'Conoce lo que puedes hacer' },
    { icon: <CreditCardIcon size={22} />, title: 'Agrega tus Tarjetas', subtitle: 'Debito y credito' },
    { icon: <Wallet size={22} />, title: 'Tus Saldos Actuales', subtitle: 'Cuanto dinero tienes hoy' },
    { icon: <CheckCircle size={22} />, title: 'Resumen', subtitle: 'Confirma y comienza' }
  ];

  const currentStepData = stepTitles[step];

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className={`w-full my-4 ${step === 0 ? 'max-w-3xl' : 'max-w-2xl'} transition-all duration-300`}>
        <div className="bg-white/[0.06] backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl overflow-hidden">

          {/* Header with Llama */}
          <div className="bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 p-5 relative overflow-hidden">
            <div className="absolute right-3 -bottom-2 opacity-30">
              <LlamaMascot size={60} />
            </div>
            <p className="text-emerald-50/80 text-xs font-medium mb-0.5">
              {step === 0 ? 'Finanzas Gastos' : 'Configuracion inicial'}
            </p>
            <h1 className="text-xl font-bold text-white">
              {step === 0 ? 'Tu dinero, bajo control' : 'Preparemos tus finanzas'}
            </h1>
            {step > 0 && <p className="text-emerald-100/80 text-sm mt-1">Paso {step} de 3</p>}
          </div>

          {/* Step Indicators — hidden on welcome step */}
          {step > 0 && (
            <div className="px-6 pt-4 pb-2">
              <div className="flex items-center justify-center gap-2">
                {[1, 2, 3].map(i => (
                  <React.Fragment key={i}>
                    <button
                      onClick={() => !isSubmitting && i <= step && setStep(i)}
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                        i < step ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' :
                        i === step ? 'bg-emerald-500 text-white scale-110 shadow-xl shadow-emerald-500/40' :
                        'bg-white/10 text-white/30'
                      }`}
                    >
                      {i < step ? <CheckCircle size={14} /> : i}
                    </button>
                    {i < 3 && (
                      <div className={`w-8 h-0.5 rounded-full ${i < step ? 'bg-emerald-500' : 'bg-white/10'} transition-colors`} />
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>
          )}

          {/* Step Title — hidden on welcome step (it has its own header) */}
          {step > 0 && (
            <div className="px-6 pt-2 pb-1">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-500/15 rounded-xl flex items-center justify-center text-emerald-400">
                  {currentStepData.icon}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">{currentStepData.title}</h2>
                  <p className="text-white/40 text-xs">{currentStepData.subtitle}</p>
                </div>
              </div>
            </div>
          )}

          {/* Step Content */}
          <div className="p-6 max-h-[55vh] overflow-y-auto">
            {renderStep()}
          </div>

          {/* Navigation */}
          {!isSubmitting && (
            <div className="bg-black/20 p-4 flex justify-between items-center border-t border-white/5">
              {step === 0 ? (
                /* Welcome step: Omitir / Iniciar */
                <>
                  <button
                    onClick={onComplete}
                    className="text-white/40 hover:text-white/70 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
                  >
                    Omitir
                  </button>
                  <button
                    onClick={() => setStep(1)}
                    className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white px-6 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg shadow-emerald-500/30"
                  >
                    Iniciar configuracion
                    <ChevronRight size={16} />
                  </button>
                </>
              ) : (
                /* Steps 1-3: normal navigation */
                <>
                  <div>
                    <button
                      onClick={() => setStep(step - 1)}
                      className="flex items-center gap-1 bg-white/10 hover:bg-white/15 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
                    >
                      <ChevronLeft size={16} />
                      Anterior
                    </button>
                  </div>
                  <div>
                    {step < 3 ? (
                      <button
                        onClick={() => setStep(step + 1)}
                        className="flex items-center gap-1 bg-emerald-500 hover:bg-emerald-400 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg shadow-emerald-500/30"
                      >
                        {step === 1 && cards.length === 0 ? 'Saltar' : 'Siguiente'}
                        <ChevronRight size={16} />
                      </button>
                    ) : (
                      <button
                        onClick={handleSubmit}
                        className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white px-6 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg shadow-emerald-500/30"
                      >
                        Comenzar
                        <ChevronRight size={16} />
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
