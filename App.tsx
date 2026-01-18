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
import { AssetsView } from './components/AssetsView';
import { CreditCard, PendingExpense, Transaction, SavingsGoalConfig, UserProfile, RealEstateInvestment, RealEstateProperty } from './types';
import { formatCurrency, formatDate } from './utils/format';
import { fetchData, sendToSheet, updateInSheet, deleteFromSheet, saveProfile, fetchProperties } from './services/googleSheetService';
import { ProfileSetupModal } from './components/ui/ProfileSetupModal';
import { Toast, ToastType } from './components/ui/Toast';
import { useTheme } from './contexts/ThemeContext';
import { themes } from './themes';
import { EditSubscriptionModal } from './components/ui/EditSubscriptionModal';
import { EditCardModal } from './components/ui/EditCardModal';
import { ConfirmDialog } from './components/ui/ConfirmDialog';
import { Pencil, Trash2, CreditCard as CreditCardIcon } from 'lucide-react';
import { PUBLIC_PROPERTIES_SCRIPT_URL } from './config';
import { useVersionCheck } from './hooks/useVersionCheck';

function App() {
  const { currentTheme, theme, setTheme } = useTheme();
  const { currentVersion, isNewVersion } = useVersionCheck();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [debtSubTab, setDebtSubTab] = useState<'deudas' | 'suscripciones'>('deudas');
  const [scriptUrl, setScriptUrl] = useState('');
  const [pin, setPin] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);

  // Profile State
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [showProfileSetup, setShowProfileSetup] = useState(false);

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
  const [realEstateInvestments, setRealEstateInvestments] = useState<RealEstateInvestment[]>([]);
  const [availableProperties, setAvailableProperties] = useState<RealEstateProperty[]>([]);

  // Modal States
  const [editingSubscription, setEditingSubscription] = useState<PendingExpense | null>(null);
  const [editingCard, setEditingCard] = useState<CreditCard | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'subscription' | 'card'; item: PendingExpense | CreditCard } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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

  const saveRealEstateInvestments = (newInvestments: RealEstateInvestment[]) => {
    setRealEstateInvestments(newInvestments);
    localStorage.setItem('realEstateInvestments', JSON.stringify(newInvestments));
  };

  const handleAddRealEstateInvestment = (investment: RealEstateInvestment) => {
    const updated = [...realEstateInvestments, investment];
    saveRealEstateInvestments(updated);
    showToast('Propiedad agregada correctamente', 'success');
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
          cuotas_pagadas: parseFloat(p.cuotas_pagadas) || 0 // Cambiado a parseFloat para permitir valores decimales
        }));
        savePending(cleanPending);
      }

      // History
      if (data.history && Array.isArray(data.history)) {
        saveHistory(data.history);
      }

      // Available Properties (Real Estate Catalog)
      // Fetch from public properties catalog (shared by all users)
      if (PUBLIC_PROPERTIES_SCRIPT_URL) {
        try {
          const properties = await fetchProperties(PUBLIC_PROPERTIES_SCRIPT_URL);
          const cleanProperties = properties.map((p: any) => ({
            ...p,
            precio: parseFloat(p.precio) || 0,
            area_m2: p.area_m2 ? parseFloat(p.area_m2) : undefined,
            dormitorios: p.dormitorios ? parseInt(p.dormitorios) : undefined,
            banos: p.banos ? parseFloat(p.banos) : undefined
          }));
          setAvailableProperties(cleanProperties);
          localStorage.setItem('availableProperties', JSON.stringify(cleanProperties));
        } catch (error) {
          console.error('Error fetching properties from public catalog:', error);
        }
      } else if (data.availableProperties && Array.isArray(data.availableProperties)) {
        // Fallback: check if main sheet includes properties data
        const cleanProperties = data.availableProperties.map((p: any) => ({
          ...p,
          precio: parseFloat(p.precio) || 0,
          area_m2: p.area_m2 ? parseFloat(p.area_m2) : undefined,
          dormitorios: p.dormitorios ? parseInt(p.dormitorios) : undefined,
          banos: p.banos ? parseFloat(p.banos) : undefined
        }));
        setAvailableProperties(cleanProperties);
        localStorage.setItem('availableProperties', JSON.stringify(cleanProperties));
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

      const storedInvestments = localStorage.getItem('realEstateInvestments');
      if (storedInvestments) setRealEstateInvestments(JSON.parse(storedInvestments));

      // Load available properties from localStorage (will be synced from Google Sheets)
      const storedProperties = localStorage.getItem('availableProperties');
      if (storedProperties) {
        setAvailableProperties(JSON.parse(storedProperties));
      } else if (!storedUrl || !storedPin) {
        // Only use sample data if not connected to Google Sheets yet
        const sampleProperties: RealEstateProperty[] = [
          {
            id: 'PROP001',
            titulo: 'Departamento Moderno en San Isidro',
            tipo: 'Departamento',
            zona: 'San Isidro',
            precio: 280000,
            area_m2: 85,
            dormitorios: 2,
            banos: 2,
            descripcion: 'Moderno departamento en zona residencial, cerca al golf y centros comerciales.',
            timestamp: new Date().toISOString()
          },
          {
            id: 'PROP002',
            titulo: 'Casa con Jardín en Surco',
            tipo: 'Casa',
            zona: 'Santiago de Surco',
            precio: 450000,
            area_m2: 180,
            dormitorios: 4,
            banos: 3,
            descripcion: 'Amplia casa con jardín, cochera para 2 autos y terraza.',
            timestamp: new Date().toISOString()
          },
          {
            id: 'PROP003',
            titulo: 'Terreno en Pachacamac',
            tipo: 'Terreno',
            zona: 'Pachacamac',
            precio: 120000,
            area_m2: 500,
            descripcion: 'Terreno plano ideal para proyecto residencial o casa de campo.',
            timestamp: new Date().toISOString()
          },
          {
            id: 'PROP004',
            titulo: 'Loft en Miraflores',
            tipo: 'Departamento',
            zona: 'Miraflores',
            precio: 320000,
            area_m2: 65,
            dormitorios: 1,
            banos: 1,
            descripcion: 'Moderno loft cerca al malecón, perfecto para inversionistas.',
            timestamp: new Date().toISOString()
          },
          {
            id: 'PROP005',
            titulo: 'Local Comercial en La Molina',
            tipo: 'Local Comercial',
            zona: 'La Molina',
            precio: 180000,
            area_m2: 45,
            descripcion: 'Local en zona comercial de alto tránsito, ideal para negocio.',
            timestamp: new Date().toISOString()
          },
          {
            id: 'PROP006',
            titulo: 'Departamento Vista al Mar - Barranco',
            tipo: 'Departamento',
            zona: 'Barranco',
            precio: 380000,
            area_m2: 95,
            dormitorios: 3,
            banos: 2,
            descripcion: 'Departamento con vista al mar, balcón amplio y acabados premium.',
            timestamp: new Date().toISOString()
          }
        ];
        setAvailableProperties(sampleProperties);
        localStorage.setItem('availableProperties', JSON.stringify(sampleProperties));
      }

      // Load profile from localStorage
      const storedProfile = localStorage.getItem('profile');
      if (storedProfile) setProfile(JSON.parse(storedProfile));
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

      // Check if profile exists
      if (data.profile) {
        setProfile(data.profile);
        localStorage.setItem('profile', JSON.stringify(data.profile));
      } else {
        // Show profile setup modal for new users
        setShowProfileSetup(true);
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

  // Edit/Delete handlers for Subscriptions
  const handleEditSubscription = async (updated: PendingExpense) => {
    try {
      const updatedList = pendingExpenses.map(p => p.id === updated.id ? updated : p);
      savePending(updatedList);
      await updateInSheet(scriptUrl, pin, updated, 'Gastos_Pendientes');
      showToast('Suscripción actualizada', 'success');
    } catch (error) {
      showToast('Error al actualizar', 'error');
    }
  };

  const handleDeleteSubscription = async (subscription: PendingExpense) => {
    // Close dialog and show loading
    setDeleteTarget(null);
    setIsDeleting(true);

    try {
      const filtered = pendingExpenses.filter(p => p.id !== subscription.id);
      savePending(filtered);
      await deleteFromSheet(scriptUrl, pin, subscription.id, 'Gastos_Pendientes');
      showToast('Suscripción eliminada', 'success');
    } catch (error) {
      showToast('Error al eliminar', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle subscription payment - registers to Gastos and renews date
  const [isPayingSubscription, setIsPayingSubscription] = useState(false);

  const handlePaySubscription = async (subscription: PendingExpense) => {
    setIsPayingSubscription(true);

    try {
      // 1. Create a Gasto entry for the history
      const gastoEntry = {
        fecha: new Date().toISOString().split('T')[0],
        categoria: subscription.categoria,
        descripcion: `${subscription.descripcion} (Suscripción)`,
        monto: subscription.monto,
        notas: `Pago de suscripción mensual - ${subscription.tarjeta}`,
        timestamp: new Date().toISOString()
      };

      // Send to Gastos sheet
      await sendToSheet(scriptUrl, pin, gastoEntry, 'Gastos');

      // Add to local history
      saveHistory([...history, { ...gastoEntry, tipo: 'Gastos' } as Transaction]);

      // 2. Update subscription date to next month
      const currentDate = new Date(subscription.fecha_pago);
      const nextMonth = new Date(currentDate);
      nextMonth.setMonth(nextMonth.getMonth() + 1);

      const updatedSubscription: PendingExpense = {
        ...subscription,
        fecha_pago: nextMonth.toISOString().split('T')[0],
        fecha_cierre: nextMonth.toISOString().split('T')[0]
      };

      // Update locally
      const updatedList = pendingExpenses.map(p =>
        p.id === subscription.id ? updatedSubscription : p
      );
      savePending(updatedList);

      // Update in sheet
      await updateInSheet(scriptUrl, pin, updatedSubscription, 'Gastos_Pendientes');

      showToast(`✅ Pago de ${subscription.descripcion} registrado. Próximo cobro: ${formatDate(updatedSubscription.fecha_pago)}`, 'success');
    } catch (error) {
      console.error('Error paying subscription:', error);
      showToast('Error al registrar el pago', 'error');
    } finally {
      setIsPayingSubscription(false);
    }
  };

  // Edit/Delete handlers for Cards
  const handleEditCard = async (updated: CreditCard, originalAlias: string): Promise<void> => {
    try {
      // Use originalAlias to find the card, not updated.alias (which may have changed)
      const updatedList = cards.map(c => c.alias === originalAlias ? updated : c);
      saveCards(updatedList);

      // For the sheet update, we need to send the original alias so it can find the row
      const dataToSend = { ...updated, originalAlias };
      await updateInSheet(scriptUrl, pin, dataToSend, 'Tarjetas');
      showToast('Tarjeta actualizada', 'success');
    } catch (error) {
      showToast('Error al actualizar tarjeta', 'error');
      throw error; // Re-throw for modal to catch
    }
  };

  const handleDeleteCard = async (card: CreditCard) => {
    // Close dialog and show loading
    setDeleteTarget(null);
    setIsDeleting(true);

    try {
      const filtered = cards.filter(c => c.alias !== card.alias);
      saveCards(filtered);
      await deleteFromSheet(scriptUrl, pin, card.alias, 'Tarjetas');
      showToast('Tarjeta eliminada', 'success');
    } catch (error) {
      showToast('Error al eliminar tarjeta', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    if (deleteTarget.type === 'subscription') {
      handleDeleteSubscription(deleteTarget.item as PendingExpense);
    } else {
      handleDeleteCard(deleteTarget.item as CreditCard);
    }
  };

  const renderContent = () => {
    const handleAddToHistory = (transaction: Transaction) => {
      saveHistory([...history, transaction]);
    };

    const commonProps = { notify: showToast };

    switch (activeTab) {
      case 'dashboard':
        return <Dashboard cards={cards} pendingExpenses={pendingExpenses} history={history} savingsGoal={savingsGoal} realEstateInvestments={realEstateInvestments} />;

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
                className={`px-4 py-2 font-semibold text-sm transition-all ${debtSubTab === 'deudas'
                  ? `${theme.colors.textPrimary} border-b-2 border-teal-500`
                  : `${theme.colors.textMuted} hover:${theme.colors.textSecondary}`
                  }`}
              >
                <CreditCardIcon size={16} className="inline-block mr-1" />
                Deudas a Cuotas ({deudasData.length})
              </button>
              <button
                onClick={() => setDebtSubTab('suscripciones')}
                className={`px-4 py-2 font-semibold text-sm transition-all ${debtSubTab === 'suscripciones'
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
                  const pagado = Number(p.cuotas_pagadas) * (monto / cuotas);
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
                          <span className={`text-xs font-semibold ${theme.colors.textSecondary}`}>
                            {Number(p.cuotas_pagadas) % 1 === 0 ? p.cuotas_pagadas : p.cuotas_pagadas.toFixed(2)}/{p.num_cuotas} cuotas
                          </span>
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

                      {/* Footer with Days Remaining and Actions */}
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pt-3 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-2">
                          <svg className={`w-4 h-4 ${theme.colors.textMuted}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          <span className={`text-sm ${theme.colors.textSecondary}`}>
                            Próximo cargo: <span className="font-semibold">{formatDate(p.fecha_pago)}</span>
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`text-sm font-bold ${getUrgencyColor(diffDays)}`}>
                            {diffDays < 0
                              ? `¡Cobrado hace ${Math.abs(diffDays)} días!`
                              : diffDays === 0
                                ? '¡Se cobra hoy!'
                                : `${diffDays} ${diffDays === 1 ? 'día' : 'días'} restantes`
                            }
                          </span>
                          {/* Pay and Edit/Delete Buttons */}
                          <div className="flex gap-2">
                            <button
                              onClick={() => handlePaySubscription(p)}
                              disabled={isPayingSubscription}
                              className="px-3 py-1.5 rounded-lg bg-green-500 hover:bg-green-600 text-white text-xs font-bold transition-colors flex items-center gap-1 shadow-sm"
                              title="Registrar pago"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              Ya lo pagué
                            </button>
                            <button
                              onClick={() => setEditingSubscription(p)}
                              className={`p-2 rounded-lg ${theme.colors.bgSecondary} hover:bg-purple-500/20 transition-colors`}
                              title="Editar"
                            >
                              <Pencil size={14} className="text-purple-400" />
                            </button>
                            <button
                              onClick={() => setDeleteTarget({ type: 'subscription', item: p })}
                              className={`p-2 rounded-lg ${theme.colors.bgSecondary} hover:bg-red-500/20 transition-colors`}
                              title="Eliminar"
                            >
                              <Trash2 size={14} className="text-red-400" />
                            </button>
                          </div>
                        </div>
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
                          const pagado = Number(p.cuotas_pagadas) * (monto / cuotas);
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
            <PaymentForm scriptUrl={scriptUrl} pin={pin} pendingExpenses={pendingExpenses} onUpdateExpense={handleUpdateExpense} onAddToHistory={handleAddToHistory} {...commonProps} />
          </div>
        );

      case 'activos':
        return (
          <AssetsView
            realEstateInvestments={realEstateInvestments}
            availableProperties={availableProperties}
            onAddProperty={handleAddRealEstateInvestment}
            {...commonProps}
          />
        );

      case 'config':
        return (
          <SettingsView
            scriptUrl={scriptUrl}
            pin={pin}
            cards={cards}
            savingsGoal={savingsGoal}
            currentTheme={currentTheme}
            profile={profile}
            onAddCard={handleAddCard}
            onEditCard={(card) => setEditingCard(card)}
            onDeleteCard={(card) => setDeleteTarget({ type: 'card', item: card })}
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
      <Layout
        activeTab={activeTab}
        onTabChange={setActiveTab}
        connected={!!scriptUrl}
        onSync={handleSync}
        isSyncing={isSyncing}
        profile={profile}
      >
        {renderContent()}
      </Layout>
      <Toast message={toast.msg} type={toast.type} isVisible={toast.visible} onClose={hideToast} />

      {/* Edit Subscription Modal */}
      <EditSubscriptionModal
        isOpen={!!editingSubscription}
        subscription={editingSubscription}
        cards={cards}
        onSave={handleEditSubscription}
        onClose={() => setEditingSubscription(null)}
      />

      {/* Edit Card Modal */}
      <EditCardModal
        isOpen={!!editingCard}
        card={editingCard}
        onSave={handleEditCard}
        onClose={() => setEditingCard(null)}
      />

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        title={deleteTarget?.type === 'subscription' ? '¿Eliminar suscripción?' : '¿Eliminar tarjeta?'}
        message={deleteTarget?.type === 'subscription'
          ? `Se eliminará "${(deleteTarget?.item as PendingExpense)?.descripcion}" permanentemente.`
          : `Se eliminará la tarjeta "${(deleteTarget?.item as CreditCard)?.alias}" permanentemente.`
        }
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="danger"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      {/* Loading Overlay for Delete */}
      {isDeleting && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className={`${theme.colors.bgCard} p-6 rounded-2xl shadow-2xl flex flex-col items-center gap-4`}>
            <div className="w-12 h-12 border-4 border-t-emerald-500 border-r-emerald-500 border-b-transparent border-l-transparent rounded-full animate-spin"></div>
            <p className={`${theme.colors.textPrimary} font-semibold`}>Eliminando...</p>
          </div>
        </div>
      )}

      {/* Loading Overlay for Subscription Payment */}
      {isPayingSubscription && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className={`${theme.colors.bgCard} p-8 rounded-2xl shadow-2xl flex flex-col items-center gap-4 border ${theme.colors.border}`}>
            <div className="w-16 h-16 border-4 border-t-green-500 border-r-green-500 border-b-transparent border-l-transparent rounded-full animate-spin"></div>
            <p className={`${theme.colors.textPrimary} font-semibold text-lg`}>Registrando pago...</p>
            <p className={`${theme.colors.textMuted} text-sm`}>Actualizando suscripción para el próximo mes</p>
          </div>
        </div>
      )}

      {/* Profile Setup Modal */}
      <ProfileSetupModal
        isOpen={showProfileSetup}
        onSave={async (avatarId, nombre) => {
          await saveProfile(scriptUrl, pin, avatarId, nombre);
          const newProfile = { avatar_id: avatarId, nombre };
          setProfile(newProfile);
          localStorage.setItem('profile', JSON.stringify(newProfile));
          setShowProfileSetup(false);
          showToast(`¡Bienvenido, ${nombre}!`, 'success');
        }}
      />
    </>
  );
}

export default App;