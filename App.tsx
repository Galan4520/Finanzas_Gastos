import React, { useState, useEffect, useCallback } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { UnifiedEntryForm } from './components/forms/UnifiedEntryForm';
import { CardForm } from './components/forms/CardForm';
import { PaymentForm } from './components/forms/PaymentForm';
import { WelcomeScreen } from './components/WelcomeScreen';
import { GoalsView } from './components/GoalsView';
import { SettingsView } from './components/SettingsView';
import { ReportsView } from './components/ReportsView';
import { CreditCard, PendingExpense, Transaction, SavingsGoalConfig } from './types';
import { formatCurrency, formatDate } from './utils/format';
import { fetchData } from './services/googleSheetService';
import { Toast, ToastType } from './components/ui/Toast';
import { useTheme } from './contexts/ThemeContext';
import { themes } from './themes';

function App() {
  const { currentTheme, theme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [debtSubTab, setDebtSubTab] = useState<'deudas' | 'suscripciones'>('deudas');
  const [scriptUrl, setScriptUrl] = useState('');
  const [pin, setPin] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  
  // Toast State
  const [toast, setToast] = useState<{ msg: string; type: ToastType; visible: boolean }>({
    msg: '',
    type: 'success',
    visible: false
  });

  const showToast = (msg: string, type: ToastType = 'success') => {
    setToast({ msg, type, visible: true });
  };

  const hideToast = () => {
    setToast(prev => ({ ...prev, visible: false }));
  };
  
  // Data State
  const [cards, setCards] = useState<CreditCard[]>([]);
  const [pendingExpenses, setPendingExpenses] = useState<PendingExpense[]>([]);
  const [history, setHistory] = useState<Transaction[]>([]);
  const [savingsGoal, setSavingsGoal] = useState<SavingsGoalConfig | null>(null);

  // Helpers to persist state
  const saveCards = (newCards: CreditCard[]) => {
    setCards(newCards);
    localStorage.setItem('cards', JSON.stringify(newCards));
  };

  const savePending = (newPending: PendingExpense[]) => {
    setPendingExpenses(newPending);
    localStorage.setItem('pendientes', JSON.stringify(newPending));
  };

  const saveHistory = (newHistory: Transaction[]) => {
    setHistory(newHistory);
    localStorage.setItem('history', JSON.stringify(newHistory));
  };

  const saveSavingsGoal = (newGoal: SavingsGoalConfig) => {
    setSavingsGoal(newGoal);
    localStorage.setItem('savingsGoal', JSON.stringify(newGoal));
    showToast('Meta de ahorro actualizada', 'success');
  };

  // Sync Logic
  const handleSync = useCallback(async () => {
    if (!scriptUrl || !pin) return;
    setIsSyncing(true);
    try {
      const data = await fetchData(scriptUrl, pin);

      // Verificar si hay error de PIN
      if (data.error) {
        showToast("❌ " + data.error, 'error');
        return;
      }

      // Cards
      if (data.cards && Array.isArray(data.cards)) {
        const cleanCards = data.cards.map((c: any) => ({
          ...c,
          limite: parseFloat(c.limite) || 0,
          dia_cierre: parseInt(c.dia_cierre) || 1,
          dia_pago: parseInt(c.dia_pago) || 1
        }));
        saveCards(cleanCards);
      }

      // Pending Expenses
      if (data.pending && Array.isArray(data.pending)) {
        const cleanPending = data.pending.map((p: any) => ({
          ...p,
          monto: parseFloat(p.monto) || 0,
          num_cuotas: parseInt(p.num_cuotas) || 1,
          cuotas_pagadas: parseInt(p.cuotas_pagadas) || 0
        }));
        savePending(cleanPending);
      }

      // History
      if (data.history && Array.isArray(data.history)) {
        saveHistory(data.history);
      }

      showToast("Sincronización completada", 'success');
    } catch (error) {
      console.error(error);
      showToast("Error al sincronizar", 'error');
    } finally {
      setIsSyncing(false);
    }
  }, [scriptUrl, pin]);

  // Load Data on Mount
  useEffect(() => {
    const storedUrl = localStorage.getItem('scriptUrl');
    const storedPin = localStorage.getItem('pin');

    if (storedUrl && storedPin) {
      setScriptUrl(storedUrl);
      setPin(storedPin);
      setShowWelcome(false);
    }

    try {
      const storedCards = localStorage.getItem('cards');
      if (storedCards) setCards(JSON.parse(storedCards));

      const storedPending = localStorage.getItem('pendientes');
      if (storedPending) setPendingExpenses(JSON.parse(storedPending));

      const storedHistory = localStorage.getItem('history');
      if (storedHistory) setHistory(JSON.parse(storedHistory));

      const storedGoal = localStorage.getItem('savingsGoal');
      if (storedGoal) setSavingsGoal(JSON.parse(storedGoal));
    } catch (error) {
      console.error('Error loading data from localStorage:', error);
    }
  }, []);

  // Auto-sync
  useEffect(() => {
    if (scriptUrl && cards.length === 0) {
      handleSync();
    }
  }, [scriptUrl, handleSync, cards.length]);

  const saveUrl = async (url: string, userPin: string) => {
    setScriptUrl(url);
    setPin(userPin);
    setIsSyncing(true);

    try {
      // Validar la URL y PIN primero intentando sincronizar
      const data = await fetchData(url, userPin);

      // Verificar si hay error (PIN inválido)
      if (data.error) {
        localStorage.removeItem('scriptUrl');
        localStorage.removeItem('pin');
        setScriptUrl('');
        setPin('');
        showToast("❌ " + data.error, 'error');
        throw new Error(data.error);
      }

      // Si llegamos aquí, la URL y PIN son válidos
      localStorage.setItem('scriptUrl', url);
      localStorage.setItem('pin', userPin);

      // Procesar datos
      if (data.cards && Array.isArray(data.cards)) {
        const cleanCards = data.cards.map((c: any) => ({
          ...c,
          limite: parseFloat(c.limite) || 0,
          dia_cierre: parseInt(c.dia_cierre) || 1,
          dia_pago: parseInt(c.dia_pago) || 1
        }));
        saveCards(cleanCards);
      }

      if (data.pending && Array.isArray(data.pending)) {
        const cleanPending = data.pending.map((p: any) => ({
          ...p,
          monto: parseFloat(p.monto) || 0,
          num_cuotas: parseInt(p.num_cuotas) || 1,
          cuotas_pagadas: parseInt(p.cuotas_pagadas) || 0
        }));
        savePending(cleanPending);
      }

      if (data.history && Array.isArray(data.history)) {
        saveHistory(data.history);
      }

      // Conexión exitosa - ocultar welcome y mostrar éxito
      setShowWelcome(false);
      showToast("✅ Conexión exitosa - Bienvenido!", 'success');
    } catch (error) {
      console.error("Error validating URL/PIN:", error);
      // NO guardar la URL/PIN ni ocultar el welcome
      localStorage.removeItem('scriptUrl');
      localStorage.removeItem('pin');
      setScriptUrl('');
      setPin('');
      showToast("❌ Error: No se pudo conectar. Verifica la URL y el PIN.", 'error');
      throw error; // Re-throw para que WelcomeScreen lo maneje
    } finally {
      setIsSyncing(false);
    }
  };

  // Update handlers
  const handleAddCard = (newCard: CreditCard) => saveCards([...cards, newCard]);
  const handleAddPending = (newExpense: PendingExpense) => savePending([...pendingExpenses, newExpense]);
  const handleUpdateExpense = (updatedExpense: PendingExpense) => {
    const updated = pendingExpenses.map(p => p.id === updatedExpense.id ? updatedExpense : p);
    savePending(updated);
  };

  const renderContent = () => {
    const commonProps = { notify: showToast };

    switch (activeTab) {
      case 'dashboard':
        return <Dashboard cards={cards} pendingExpenses={pendingExpenses} history={history} savingsGoal={savingsGoal} />;

      case 'registrar': // Unified Entry
        return <UnifiedEntryForm scriptUrl={scriptUrl} pin={pin} cards={cards} onAddPending={handleAddPending} onSuccess={handleSync} {...commonProps} />;

      case 'metas': // Savings Goals
        return <GoalsView history={history} savingsGoal={savingsGoal} onSaveGoal={saveSavingsGoal} />;
      
      case 'deudas': // Previous 'pendientes' tab, but specifically for debt management
        // Filter data based on subtab
        const deudasData = pendingExpenses.filter(p => !p.tipo || p.tipo === 'deuda');
        const suscripcionesData = pendingExpenses.filter(p => p.tipo === 'suscripcion');
        const currentData = debtSubTab === 'deudas' ? deudasData : suscripcionesData;

        return (
          <div className="space-y-6">
             <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                 <h2 className={`text-2xl font-bold ${theme.colors.textPrimary}`}>
                   {debtSubTab === 'deudas' ? 'Estado de Deudas' : 'Mis Suscripciones'}
                 </h2>
                 <button onClick={() => setActiveTab('pagar-form')} className={`${theme.colors.primary} hover:${theme.colors.primaryHover} text-white px-4 py-2 rounded-lg text-sm font-bold shadow-lg transition-all`}>
                    Realizar Pago
                 </button>
             </div>

             {/* Tabs */}
             <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setDebtSubTab('deudas')}
                  className={`px-4 py-2 font-semibold text-sm transition-all ${
                    debtSubTab === 'deudas'
                      ? `${theme.colors.textPrimary} border-b-2 border-teal-500`
                      : `${theme.colors.textMuted} hover:${theme.colors.textSecondary}`
                  }`}
                >
                  💳 Deudas a Cuotas ({deudasData.length})
                </button>
                <button
                  onClick={() => setDebtSubTab('suscripciones')}
                  className={`px-4 py-2 font-semibold text-sm transition-all ${
                    debtSubTab === 'suscripciones'
                      ? `${theme.colors.textPrimary} border-b-2 border-purple-500`
                      : `${theme.colors.textMuted} hover:${theme.colors.textSecondary}`
                  }`}
                >
                  🔄 Suscripciones ({suscripcionesData.length})
                </button>
             </div>

             {/* List of debts or subscriptions */}
             <div className="space-y-4">
                {currentData.length === 0 ? (
                    <div className={`p-8 text-center ${theme.colors.textMuted} border ${theme.colors.border} border-dashed rounded-2xl`}>
                      {debtSubTab === 'deudas' ? 'No hay deudas activas.' : 'No hay suscripciones activas.'}
                    </div>
                ) : debtSubTab === 'deudas' ? (
                    // DEUDAS VIEW
                    currentData.map(p => {
                        const monto = Number(p.monto);
                        const cuotas = Number(p.num_cuotas);
                        const pagado = Number(p.cuotas_pagadas) * (monto/cuotas);
                        const restante = monto - pagado;
                        const porcentajePagado = (pagado / monto) * 100;

                        // Calculate days until payment
                        const fechaVencimiento = new Date(p.fecha_pago);
                        const hoy = new Date();
                        const diffTime = fechaVencimiento.getTime() - hoy.getTime();
                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                        // Determine urgency color
                        const getUrgencyColor = (days: number) => {
                          if (days < 0) return 'text-red-500';
                          if (days <= 3) return 'text-orange-500';
                          if (days <= 7) return 'text-yellow-500';
                          return theme.colors.textMuted;
                        };

                        const getUrgencyBg = (days: number) => {
                          if (days < 0) return 'bg-red-500/10 border-red-500/20';
                          if (days <= 3) return 'bg-orange-500/10 border-orange-500/20';
                          if (days <= 7) return 'bg-yellow-500/10 border-yellow-500/20';
                          return '';
                        };

                        return (
                             <div key={p.id} className={`${theme.colors.bgCard} p-5 rounded-xl border ${theme.colors.border} ${getUrgencyBg(diffDays)} transition-all hover:shadow-lg`}>
                                {/* Header with Card Badge and Amount */}
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-2">
                                        <span className="bg-gradient-to-r from-teal-500 to-emerald-500 text-white text-xs px-3 py-1 rounded-md font-bold shadow-sm">{p.tarjeta}</span>
                                        {p.estado === 'Pagado' && <span className="bg-emerald-500/20 text-emerald-400 text-[10px] px-2 py-0.5 rounded font-bold">PAGADO</span>}
                                      </div>
                                      <h3 className={`${theme.colors.textPrimary} font-semibold text-lg`}>{p.descripcion}</h3>
                                    </div>
                                    <div className="text-right">
                                        <p className={`text-xs ${theme.colors.textMuted} mb-1`}>Por pagar</p>
                                        <p className={`text-2xl font-mono font-bold ${theme.colors.textPrimary}`}>{formatCurrency(restante)}</p>
                                    </div>
                                </div>

                                {/* Progress Bar */}
                                <div className="mb-3">
                                  <div className="flex justify-between items-center mb-1.5">
                                    <span className={`text-xs ${theme.colors.textMuted}`}>Progreso de pago</span>
                                    <span className={`text-xs font-semibold ${theme.colors.textSecondary}`}>{p.cuotas_pagadas}/{p.num_cuotas} cuotas</span>
                                  </div>
                                  <div className={`w-full h-2.5 rounded-full overflow-hidden ${theme.colors.bgSecondary}`}>
                                    <div
                                      className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 transition-all duration-500 rounded-full"
                                      style={{ width: `${porcentajePagado}%` }}
                                    />
                                  </div>
                                  <div className="flex justify-between items-center mt-1.5">
                                    <span className={`text-xs ${theme.colors.textMuted}`}>
                                      {formatCurrency(pagado)} pagado
                                    </span>
                                    <span className={`text-xs font-medium ${theme.colors.textSecondary}`}>
                                      {porcentajePagado.toFixed(1)}%
                                    </span>
                                  </div>
                                </div>

                                {/* Footer with Date and Days Remaining */}
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pt-3 border-t border-gray-200 dark:border-gray-700">
                                  <div className="flex items-center gap-2">
                                    <svg className={`w-4 h-4 ${theme.colors.textMuted}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    <span className={`text-sm ${theme.colors.textSecondary}`}>
                                      Vence: <span className="font-semibold">{formatDate(p.fecha_pago)}</span>
                                    </span>
                                  </div>
                                  <span className={`text-sm font-bold ${getUrgencyColor(diffDays)}`}>
                                    {diffDays < 0
                                      ? `¡Vencida hace ${Math.abs(diffDays)} días!`
                                      : diffDays === 0
                                        ? '¡Vence hoy!'
                                        : `${diffDays} ${diffDays === 1 ? 'día' : 'días'} restantes`
                                    }
                                  </span>
                                </div>
                            </div>
                        );
                    })
                ) : (
                    // SUSCRIPCIONES VIEW
                    currentData.map(p => {
                        const monto = Number(p.monto);

                        // Calculate days until next payment
                        const fechaVencimiento = new Date(p.fecha_pago);
                        const hoy = new Date();
                        const diffTime = fechaVencimiento.getTime() - hoy.getTime();
                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                        // Determine urgency color for subscriptions
                        const getUrgencyColor = (days: number) => {
                          if (days < 0) return 'text-red-500';
                          if (days <= 3) return 'text-orange-500';
                          if (days <= 7) return 'text-yellow-500';
                          return theme.colors.textMuted;
                        };

                        const getUrgencyBg = (days: number) => {
                          if (days < 0) return 'bg-red-500/10 border-red-500/20';
                          if (days <= 3) return 'bg-orange-500/10 border-orange-500/20';
                          if (days <= 7) return 'bg-yellow-500/10 border-yellow-500/20';
                          return '';
                        };

                        return (
                             <div key={p.id} className={`${theme.colors.bgCard} p-5 rounded-xl border ${theme.colors.border} ${getUrgencyBg(diffDays)} transition-all hover:shadow-lg`}>
                                {/* Header with Card Badge and Amount */}
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-2">
                                        <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs px-3 py-1 rounded-md font-bold shadow-sm">{p.tarjeta}</span>
                                        <span className="bg-purple-500/20 text-purple-400 text-[10px] px-2 py-0.5 rounded font-bold">RECURRENTE</span>
                                      </div>
                                      <h3 className={`${theme.colors.textPrimary} font-semibold text-lg`}>{p.descripcion}</h3>
                                      <p className={`text-xs ${theme.colors.textMuted} mt-1`}>{p.categoria}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className={`text-xs ${theme.colors.textMuted} mb-1`}>Costo mensual</p>
                                        <p className={`text-2xl font-mono font-bold ${theme.colors.textPrimary}`}>{formatCurrency(monto)}</p>
                                    </div>
                                </div>

                                {/* Subscription Info */}
                                <div className="grid grid-cols-2 gap-3 mb-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                  <div>
                                    <p className={`text-xs ${theme.colors.textMuted} mb-1`}>Fecha de cargo</p>
                                    <p className={`text-sm font-semibold ${theme.colors.textSecondary}`}>{formatDate(p.fecha_pago)}</p>
                                  </div>
                                  <div className="text-right">
                                    <p className={`text-xs ${theme.colors.textMuted} mb-1`}>Costo anual estimado</p>
                                    <p className={`text-sm font-semibold ${theme.colors.textSecondary}`}>{formatCurrency(monto * 12)}</p>
                                  </div>
                                </div>

                                {/* Footer with Days Remaining */}
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pt-3 border-t border-gray-200 dark:border-gray-700">
                                  <div className="flex items-center gap-2">
                                    <svg className={`w-4 h-4 ${theme.colors.textMuted}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                    <span className={`text-sm ${theme.colors.textSecondary}`}>
                                      Próximo cargo: <span className="font-semibold">{formatDate(p.fecha_pago)}</span>
                                    </span>
                                  </div>
                                  <span className={`text-sm font-bold ${getUrgencyColor(diffDays)}`}>
                                    {diffDays < 0
                                      ? `¡Cobrado hace ${Math.abs(diffDays)} días!`
                                      : diffDays === 0
                                        ? '¡Se cobra hoy!'
                                        : `${diffDays} ${diffDays === 1 ? 'día' : 'días'} restantes`
                                    }
                                  </span>
                                </div>
                            </div>
                        );
                    })
                )}
             </div>

             {/* Summary Footer */}
             {currentData.length > 0 && (
               <div className={`${theme.colors.bgCard} p-4 rounded-xl border ${theme.colors.border}`}>
                 <div className="flex justify-between items-center">
                   <span className={`text-sm font-semibold ${theme.colors.textSecondary}`}>
                     {debtSubTab === 'deudas' ? 'Total pendiente:' : 'Total mensual:'}
                   </span>
                   <span className={`text-xl font-mono font-bold ${theme.colors.textPrimary}`}>
                     {formatCurrency(
                       currentData.reduce((sum, p) => {
                         if (debtSubTab === 'deudas') {
                           const monto = Number(p.monto);
                           const cuotas = Number(p.num_cuotas);
                           const pagado = Number(p.cuotas_pagadas) * (monto/cuotas);
                           return sum + (monto - pagado);
                         } else {
                           return sum + Number(p.monto);
                         }
                       }, 0)
                     )}
                   </span>
                 </div>
               </div>
             )}
          </div>
        );

      case 'pagar-form': // Hidden tab for paying
        return (
            <div>
                <button onClick={() => setActiveTab('deudas')} className={`mb-4 ${theme.colors.textMuted} hover:${theme.colors.textPrimary} text-sm flex items-center gap-1 transition-colors`}>← Volver a Deudas</button>
                <PaymentForm scriptUrl={scriptUrl} pin={pin} pendingExpenses={pendingExpenses} onUpdateExpense={handleUpdateExpense} {...commonProps} />
            </div>
        );

      case 'config':
        return (
          <SettingsView
            scriptUrl={scriptUrl}
            pin={pin}
            cards={cards}
            savingsGoal={savingsGoal}
            currentTheme={currentTheme}
            onAddCard={handleAddCard}
            onSaveGoal={saveSavingsGoal}
            onSetTheme={setTheme}
            onSync={handleSync}
            notify={showToast}
          />
        );

      default:
        return null;
    }
  };

  // Show welcome screen if no URL configured
  if (showWelcome) {
    return (
      <>
        <WelcomeScreen onUrlSubmit={saveUrl} isSyncing={isSyncing} />
        <Toast message={toast.msg} type={toast.type} isVisible={toast.visible} onClose={hideToast} />
      </>
    );
  }

  return (
    <>
      <Layout activeTab={activeTab} onTabChange={setActiveTab} connected={!!scriptUrl} onSync={handleSync} isSyncing={isSyncing}>
        {renderContent()}
      </Layout>
      <Toast message={toast.msg} type={toast.type} isVisible={toast.visible} onClose={hideToast} />
    </>
  );
}

export default App;