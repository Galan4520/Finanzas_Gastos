import React, { useState, useEffect, useCallback } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { UnifiedEntryForm } from './components/forms/UnifiedEntryForm';
import { CardForm } from './components/forms/CardForm';
import { PaymentForm } from './components/forms/PaymentForm';
import { WelcomeScreen } from './components/WelcomeScreen';
import { CreditCard, PendingExpense, Transaction } from './types';
import { formatCurrency } from './utils/format';
import { fetchData } from './services/googleSheetService';
import { Toast, ToastType } from './components/ui/Toast';
import { useTheme } from './contexts/ThemeContext';
import { themes } from './themes';

function App() {
  const { currentTheme, theme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState('dashboard');
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
  const [history, setHistory] = useState<Transaction[]>([]); // New history state

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
        return <Dashboard cards={cards} pendingExpenses={pendingExpenses} history={history} />;
      
      case 'registrar': // Unified Entry
        return <UnifiedEntryForm scriptUrl={scriptUrl} pin={pin} cards={cards} onAddPending={handleAddPending} onSuccess={handleSync} {...commonProps} />;

      case 'tarjetas':
        return <CardForm scriptUrl={scriptUrl} pin={pin} onAddCard={handleAddCard} existingCards={cards} {...commonProps} />;
      
      case 'deudas': // Previous 'pendientes' tab, but specifically for debt management
        return (
          <div className="space-y-6">
             <div className="flex justify-between items-center">
                 <h2 className="text-2xl font-bold text-slate-100">Estado de Deudas</h2>
                 <button onClick={() => setActiveTab('pagar-form')} className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-lg shadow-emerald-500/20 transition-all">
                    Realizar Pago
                 </button>
             </div>
             
             {/* List of debts */}
             <div className="space-y-3">
                {pendingExpenses.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 border border-slate-700 border-dashed rounded-2xl">No hay deudas activas.</div>
                ) : (
                    pendingExpenses.map(p => {
                        const monto = Number(p.monto);
                        const cuotas = Number(p.num_cuotas);
                        const pagado = Number(p.cuotas_pagadas) * (monto/cuotas);
                        const restante = monto - pagado;
                        
                        return (
                             <div key={p.id} className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/50 flex flex-col md:flex-row justify-between items-center gap-4">
                                <div className="flex-1 w-full md:w-auto">
                                    <div className="flex items-center gap-2 mb-1">
                                      <h3 className="font-bold text-indigo-400">{p.tarjeta}</h3>
                                      {p.estado === 'Pagado' && <span className="bg-emerald-500/20 text-emerald-400 text-[10px] px-2 py-0.5 rounded font-bold">PAGADO</span>}
                                    </div>
                                    <p className="text-slate-200 font-medium">{p.descripcion}</p>
                                    <p className="text-xs text-slate-500 mt-1">Vence: {p.fecha_pago}</p>
                                </div>
                                <div className="text-right w-full md:w-auto flex justify-between md:block">
                                    <p className="text-xs text-slate-500">Por pagar</p>
                                    <p className="text-xl font-mono font-bold text-white">{formatCurrency(restante)}</p>
                                </div>
                            </div>
                        );
                    })
                )}
             </div>
          </div>
        );

      case 'pagar-form': // Hidden tab for paying
        return (
            <div>
                <button onClick={() => setActiveTab('deudas')} className="mb-4 text-slate-400 hover:text-white text-sm flex items-center gap-1">← Volver a Deudas</button>
                <PaymentForm scriptUrl={scriptUrl} pin={pin} pendingExpenses={pendingExpenses} onUpdateExpense={handleUpdateExpense} {...commonProps} />
            </div>
        );

      case 'config':
        return (
          <div className={`${theme.colors.bgCard} p-8 rounded-2xl ${theme.colors.border} border shadow-lg max-w-2xl mx-auto`}>
            <h2 className={`text-2xl font-bold mb-6 ${theme.colors.textPrimary}`}>⚙️ Configuración</h2>

            {/* Theme Selector */}
            <div className="mb-6 space-y-3">
                <label className={`block text-sm font-bold ${theme.colors.textPrimary} uppercase tracking-wider`}>Tema de la Aplicación</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {Object.values(themes).map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setTheme(t.id)}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        currentTheme === t.id
                          ? `${t.colors.border} ${t.colors.primaryLight} border-current`
                          : `${theme.colors.border} ${theme.colors.bgCard} hover:${theme.colors.bgCardHover}`
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-lg ${t.colors.gradientPrimary} shadow-md`}></div>
                        <div className="text-left">
                          <p className={`font-bold ${currentTheme === t.id ? theme.colors.textPrimary : theme.colors.textSecondary}`}>
                            {t.name}
                          </p>
                          <p className={`text-xs ${theme.colors.textMuted}`}>
                            {t.id === 'light-premium' ? 'Verde esmeralda' : 'Azul corporativo'}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
            </div>

            <div className={`pt-6 border-t ${theme.colors.border}`}></div>

            {/* Google Script URL */}
            <div className="mt-6 space-y-3">
                <label className={`block text-sm font-bold ${theme.colors.textPrimary} uppercase tracking-wider`}>URL del Google Apps Script</label>
                <div className="flex flex-col md:flex-row gap-2">
                  <input
                      type="text"
                      value={scriptUrl}
                      readOnly
                      placeholder="https://script.google.com/..."
                      className={`flex-1 ${theme.colors.bgSecondary} ${theme.colors.border} border rounded-lg px-4 py-3 ${theme.colors.textPrimary} font-mono text-sm focus:ring-2 focus:ring-current outline-none transition-all`}
                  />
                  <button
                    onClick={handleSync}
                    className={`px-6 py-3 ${theme.colors.primary} ${theme.colors.primaryHover} rounded-lg text-white font-bold transition-all shadow-lg`}
                  >
                    Probar
                  </button>
                </div>
                <p className={`text-xs ${theme.colors.textMuted}`}>
                  Para cambiar la URL o PIN, reinicia la aplicación
                </p>
            </div>

            {/* PIN Display */}
            <div className="mt-6 space-y-3">
                <label className={`block text-sm font-bold ${theme.colors.textPrimary} uppercase tracking-wider`}>PIN de Seguridad</label>
                <div className="flex items-center gap-3">
                  <div className={`flex-1 ${theme.colors.bgSecondary} ${theme.colors.border} border rounded-lg px-4 py-3 ${theme.colors.textPrimary} font-mono text-sm`}>
                    {'•'.repeat(pin.length)}
                  </div>
                  <span className={`text-xs ${theme.colors.textMuted}`}>
                    {pin.length} dígitos
                  </span>
                </div>
                <p className={`text-xs ${theme.colors.textMuted}`}>
                  Para cambiar el PIN, actualiza la celda A2 en la hoja "Config" de tu Google Sheet
                </p>
            </div>

            <div className={`pt-6 mt-6 border-t ${theme.colors.border}`}>
                <button
                    onClick={() => {
                        if(confirm("¿Borrar caché local y reiniciar?")) {
                            localStorage.clear();
                            window.location.reload();
                        }
                    }}
                    className={`${theme.colors.danger} hover:bg-rose-700 text-white text-sm px-4 py-2 rounded-lg transition-colors`}
                >
                    ⚠️ Reiniciar aplicación
                </button>
            </div>
          </div>
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