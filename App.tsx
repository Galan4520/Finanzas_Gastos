import React, { useState, useEffect, useCallback } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { UnifiedEntryForm } from './components/forms/UnifiedEntryForm';
import { CardForm } from './components/forms/CardForm';
import { PaymentForm } from './components/forms/PaymentForm';
import { CreditCard, PendingExpense, Transaction } from './types';
import { formatCurrency } from './utils/format';
import { fetchData } from './services/googleSheetService';
import { Toast, ToastType } from './components/ui/Toast';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [scriptUrl, setScriptUrl] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  
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
    if (!scriptUrl) return;
    setIsSyncing(true);
    try {
      const data = await fetchData(scriptUrl);
      
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
  }, [scriptUrl]);

  // Load Data on Mount
  useEffect(() => {
    const storedUrl = localStorage.getItem('scriptUrl');
    if (storedUrl) setScriptUrl(storedUrl);

    const storedCards = localStorage.getItem('cards');
    if (storedCards) setCards(JSON.parse(storedCards));

    const storedPending = localStorage.getItem('pendientes');
    if (storedPending) setPendingExpenses(JSON.parse(storedPending));

    const storedHistory = localStorage.getItem('history');
    if (storedHistory) setHistory(JSON.parse(storedHistory));
  }, []);

  // Auto-sync
  useEffect(() => {
    if (scriptUrl && cards.length === 0) {
      handleSync();
    }
  }, [scriptUrl, handleSync, cards.length]);

  const saveUrl = (url: string) => {
    setScriptUrl(url);
    localStorage.setItem('scriptUrl', url);
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
        return <UnifiedEntryForm scriptUrl={scriptUrl} cards={cards} onAddPending={handleAddPending} onSuccess={handleSync} {...commonProps} />;
      
      case 'tarjetas':
        return <CardForm scriptUrl={scriptUrl} onAddCard={handleAddCard} existingCards={cards} {...commonProps} />;
      
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
                <PaymentForm scriptUrl={scriptUrl} pendingExpenses={pendingExpenses} onUpdateExpense={handleUpdateExpense} {...commonProps} />
            </div>
        );

      case 'config':
        return (
          <div className="bg-slate-800/50 p-8 rounded-2xl border border-slate-700 max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold mb-6 text-slate-100">⚙️ Configuración</h2>
            <div className="mb-6 space-y-2">
                <label className="block text-sm font-medium text-indigo-400 uppercase tracking-wider">URL del Google Apps Script</label>
                <div className="flex flex-col md:flex-row gap-2">
                  <input 
                      type="text" 
                      value={scriptUrl} 
                      onChange={(e) => saveUrl(e.target.value)}
                      placeholder="https://script.google.com/..."
                      className="flex-1 bg-slate-900/80 border border-slate-600 rounded-lg px-4 py-3 text-slate-200 font-mono text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  />
                  <button onClick={handleSync} className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-white font-bold transition-all shadow-lg shadow-indigo-600/20">
                    Probar
                  </button>
                </div>
            </div>
            
            <div className="pt-6 border-t border-slate-700">
                <button 
                    onClick={() => {
                        if(confirm("¿Borrar caché local y reiniciar?")) {
                            localStorage.clear();
                            window.location.reload();
                        }
                    }}
                    className="text-red-400 text-sm hover:text-red-300 hover:underline"
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