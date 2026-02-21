import React, { useState, useEffect, useCallback } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { WelcomeScreen } from './components/WelcomeScreen';
import { PaymentForm } from './components/forms/PaymentForm';
import { UnifiedEntryForm } from './components/forms/UnifiedEntryForm';
import { AssetsView } from './components/AssetsView';
import { SettingsView } from './components/SettingsView';
import { GoalsView } from './components/GoalsView';
import { ReportsView } from './components/ReportsView';
import { FamiliaView } from './components/FamiliaView';
import { DebugPanel } from './components/DebugPanel';
import { ProfileSetupModal } from './components/ui/ProfileSetupModal';
import { EditSubscriptionModal } from './components/ui/EditSubscriptionModal';
import { EditTransactionModal } from './components/ui/EditTransactionModal';
import { ConfirmDialog } from './components/ui/ConfirmDialog';
import { Toast } from './components/ui/Toast';
import { useTheme } from './contexts/ThemeContext';
import { UserProfile, CreditCard, PendingExpense, Goal, Transaction, RealEstateInvestment, RealEstateProperty, NotificationConfig, FamilyConfig, FamilyMember } from './types';
import * as googleSheetService from './services/googleSheetService';
import { normalizarDeuda, isDeudaVencida } from './utils/debtUtils';

// Simple UUID generator to avoid external dependency issues
const uuidv4 = () => self.crypto.randomUUID();

// Mock data for assets conforming to RealEstateProperty interface
const MOCK_PROPERTIES: RealEstateProperty[] = [
  {
    id: 'prop-1',
    titulo: 'Departamento en Miraflores',
    descripcion: 'Hermoso departamento con vista al mar, 3 dormitorios',
    precio: 450000,
    zona: 'Miraflores', // Was ubicacion
    tipo: 'Departamento',
    area_m2: 120,
    dormitorios: 3,
    banos: 2,
    url_imagen: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&q=80',
    imagenes: ['https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&q=80'],
    timestamp: new Date().toISOString()
  },
  {
    id: 'prop-2',
    titulo: 'Casa en La Molina',
    descripcion: 'Casa amplia con jardín y piscina',
    precio: 850000,
    zona: 'La Molina', // Was ubicacion
    tipo: 'Casa',
    area_m2: 300,
    dormitorios: 4,
    banos: 4,
    url_imagen: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&q=80',
    imagenes: ['https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&q=80'],
    timestamp: new Date().toISOString()
  }
];

function App() {
  const { theme, currentTheme, setTheme } = useTheme();

  // State
  const [scriptUrl, setScriptUrl] = useState<string>(localStorage.getItem('scriptUrl') || '');
  const [pin, setPin] = useState<string>(localStorage.getItem('pin') || '');
  const [profile, setProfile] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('profile');
    return saved ? JSON.parse(saved) : null;
  });

  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSyncing, setIsSyncing] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  // Data
  const [cards, setCards] = useState<CreditCard[]>([]);
  const [pendingExpenses, setPendingExpenses] = useState<PendingExpense[]>([]);
  const [history, setHistory] = useState<Transaction[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [realEstateInvestments, setRealEstateInvestments] = useState<RealEstateInvestment[]>([]);
  const [availableProperties] = useState<RealEstateProperty[]>(MOCK_PROPERTIES);
  const [notificationConfig, setNotificationConfig] = useState<NotificationConfig | null>(null);

  // GAS version info (from doGet response)
  const [gasVersion, setGasVersion] = useState<number | null>(null);
  const [schemaVersion, setSchemaVersion] = useState<number | null>(null);

  // Custom categories (user-created)
  const [customGastosCategories, setCustomGastosCategories] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('customGastosCats') || '[]'); } catch { return []; }
  });
  const [customIngresosCategories, setCustomIngresosCategories] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('customIngresosCats') || '[]'); } catch { return []; }
  });

  // Family Plan State
  const [familyConfig, setFamilyConfig] = useState<FamilyConfig | null>(() => {
    const saved = localStorage.getItem('familyConfig');
    if (!saved) return null;
    const cfg = JSON.parse(saved) as FamilyConfig;
    // Migrate legacy format (single partner) to new members array
    if (!cfg.members && cfg.partnerUrl) {
      return { members: [{ url: cfg.partnerUrl, pin: cfg.partnerPin || '', name: cfg.partnerName || 'Pareja', avatarId: cfg.partnerAvatarId || 'avatar_1' }] };
    }
    return cfg;
  });
  type MemberData = { history: Transaction[]; goals: Goal[]; cards: CreditCard[]; profile: UserProfile | null };
  const [membersData, setMembersData] = useState<Record<string, MemberData>>({});
  const [isSyncingPartner, setIsSyncingPartner] = useState(false);

  // UI State
  const [toast, setToast] = useState({ msg: '', type: 'success' as 'success' | 'error', visible: false });
  const [showProfileSetup, setShowProfileSetup] = useState(false);
  const [editingSubscription, setEditingSubscription] = useState<PendingExpense | null>(null);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'subscription' | 'card' | 'transaction', item: PendingExpense | CreditCard | Transaction } | null>(null);

  // Derived State
  const showWelcome = !scriptUrl || !pin;
  const isNewVersion = !localStorage.getItem('app_version_5_0');

  // Helpers
  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type, visible: true });
    setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 3000);
  };

  const hideToast = () => {
    setToast(prev => ({ ...prev, visible: false }));
  };

  const saveUrl = async (url: string, newPin: string) => {
    localStorage.setItem('scriptUrl', url);
    localStorage.setItem('pin', newPin);
    setScriptUrl(url);
    setPin(newPin);
  };

  // Sync Logic
  const handleSync = useCallback(async () => {
    if (!scriptUrl || !pin) return;

    setIsSyncing(true);
    try {
      const data = await googleSheetService.fetchData(scriptUrl, pin);

      if (data) {
        // Track GAS & schema versions
        if (data.gasVersion !== undefined) setGasVersion(data.gasVersion);
        if (data.schemaVersion !== undefined) setSchemaVersion(data.schemaVersion);

        // Update state
        setCards(data.cards || []);

        // Normalize expenses using normalizarDeuda from debtUtils
        const rawExpenses = data.pending || data.pendingExpenses || [];
        console.log('🔍 [DEBUG App] Datos crudos de Google Sheets:', rawExpenses);
        console.log('🔍 [DEBUG App] Primer elemento crudo:', rawExpenses[0]);

        const normalizedExpenses = rawExpenses.map((e: any) => normalizarDeuda(e));
        console.log('🔍 [DEBUG App] Datos normalizados:', normalizedExpenses);
        console.log('🔍 [DEBUG App] Primer elemento normalizado:', normalizedExpenses[0]);

        setPendingExpenses(normalizedExpenses);

        setHistory(data.history || []);

        // Load goals from sync
        if (data.goals) {
          setGoals(data.goals.map((g: any) => ({
            id: g.id,
            nombre: g.nombre,
            monto_objetivo: Number(g.monto_objetivo) || 0,
            monto_ahorrado: Number(g.monto_ahorrado) || 0,
            notas: g.notas || '',
            estado: g.estado || 'activa',
            icono: g.icono || '',
            timestamp: g.timestamp
          })));
        }

        if (data.profile) {
          // Ensure profile has all required fields (added in types.ts)
          const profileData: UserProfile = {
            ...data.profile,
            id: data.profile.id || uuidv4(),
            // Default optional fields if missing
            preferences: data.profile.preferences || { theme: 'system', notifications: true }
          };
          setProfile(profileData);
          localStorage.setItem('profile', JSON.stringify(profileData));
        }

        // Load notification config
        if (data.notificationConfig) {
          setNotificationConfig(data.notificationConfig);
        }

        // Load custom categories from sheet
        if (data.customCategories) {
          const gc: string[] = data.customCategories.gastos || [];
          const ic: string[] = data.customCategories.ingresos || [];
          if (gc.length > 0) { setCustomGastosCategories(gc); localStorage.setItem('customGastosCats', JSON.stringify(gc)); }
          if (ic.length > 0) { setCustomIngresosCategories(ic); localStorage.setItem('customIngresosCats', JSON.stringify(ic)); }
        }

        // Load family config from sheet (persists across devices)
        if (data.familyConfig) {
          const fc: FamilyConfig = data.familyConfig;
          const hasMembers = (fc.members && fc.members.length > 0) || fc.partnerUrl;
          if (hasMembers) {
            // Migrate legacy single-partner format
            const normalized: FamilyConfig = fc.members
              ? fc
              : { members: [{ url: fc.partnerUrl!, pin: fc.partnerPin || '', name: fc.partnerName || 'Pareja', avatarId: fc.partnerAvatarId || 'avatar_1' }] };
            setFamilyConfig(normalized);
            localStorage.setItem('familyConfig', JSON.stringify(normalized));
            // Auto-fetch members data if not loaded yet
            if (Object.keys(membersData).length === 0) {
              handleFetchPartnerData(normalized);
            }
          }
        }

        // Check for version migration or missing profile
        if (isNewVersion || !data.profile) {
          localStorage.setItem('app_version_5_0', 'true');
          if (!data.profile) {
            setShowProfileSetup(true);
          }
        }

        setLastSyncTime(new Date());

        // Cache data (optional but good for offline)
        localStorage.setItem('cards', JSON.stringify(data.cards));
        localStorage.setItem('pendingExpenses', JSON.stringify(normalizedExpenses));
      }
    } catch (error) {
      console.error('Sync error:', error);
      showToast('Error al sincronizar datos', 'error');
    } finally {
      setIsSyncing(false);
      setIsInitialLoading(false);
    }
  }, [scriptUrl, pin, isNewVersion]);

  // Initial Sync
  useEffect(() => {
    if (scriptUrl && pin) {
      handleSync();
    } else {
      setIsInitialLoading(false);
    }
  }, [scriptUrl, pin, handleSync]);

  // Actions
  const handleUpdateExpense = (updatedExpense: PendingExpense) => {
    setPendingExpenses(prev => prev.map(e => e.id === updatedExpense.id ? updatedExpense : e));
  };

  const handleAddToHistory = (transaction: Transaction) => {
    setHistory(prev => [transaction, ...prev]);
  };

  // Transaction Edit (Gastos/Ingresos) - Optimistic update
  const handleEditTransaction = (updated: Transaction, originalTimestamp: string) => {
    // 1. Update UI immediately
    setHistory(prev => prev.map(t => t.timestamp === originalTimestamp ? updated : t));
    setEditingTransaction(null);
    showToast('Movimiento actualizado', 'success');

    // 2. Backend call in background (no await)
    googleSheetService.updateInSheet(scriptUrl, pin, {
      ...updated,
      timestamp_original: originalTimestamp,
      action: 'update'
    }, updated.tipo)
      .then(() => {
        // Sync silencioso para verificar consistencia
        setTimeout(() => handleSync(), 1500);
      })
      .catch((error) => {
        console.error('Error editando transacción:', error);
        showToast('Error al guardar en la nube. Sincroniza para verificar.', 'error');
      });
  };

  // Transaction Delete (Gastos/Ingresos) - Optimistic update
  const handleDeleteTransaction = (transaction: Transaction) => {
    // 1. Update UI immediately
    setHistory(prev => prev.filter(t => t.timestamp !== transaction.timestamp));
    showToast('Movimiento eliminado', 'success');

    // 2. Backend call in background (no await)
    googleSheetService.deleteFromSheet(scriptUrl, pin, transaction.timestamp, transaction.tipo)
      .then(() => {
        setTimeout(() => handleSync(), 1500);
      })
      .catch((error) => {
        console.error('Error eliminando transacción:', error);
        showToast('Error al eliminar en la nube. Sincroniza para verificar.', 'error');
      });
  };

  // Notification handlers
  const handleSaveNotificationConfig = async (config: NotificationConfig): Promise<{ success: boolean; verified: boolean }> => {
    const result = await googleSheetService.saveNotificationConfig(scriptUrl, pin, config);
    if (result.verified) {
      setNotificationConfig(config);
    }
    return result;
  };

  const handleSendTestEmail = async (): Promise<{ enviado: boolean; verified: boolean; razon?: string }> => {
    return await googleSheetService.sendTestEmail(scriptUrl, pin);
  };

  const handleSendNotifications = async (): Promise<{ enviado: boolean; verified: boolean; razon?: string }> => {
    return await googleSheetService.sendNotificationsNow(scriptUrl, pin);
  };

  const handleSetupDailyTrigger = async () => {
    await googleSheetService.setupDailyTrigger(scriptUrl, pin);
  };

  const handleAddRealEstateInvestment = (investment: RealEstateInvestment) => {
    setRealEstateInvestments(prev => [...prev, investment]);
    showToast('Propiedad agregada correctamente', 'success');
  };

  // Profile Save
  const handleProfileSave = async (avatarId: string, nombre: string) => {
    const newProfile: UserProfile = {
      id: profile?.id || uuidv4(),
      nombre,
      email: profile?.email || '',
      avatar_id: avatarId,
      preferences: profile?.preferences || { theme: 'system', notifications: true }
    };

    setProfile(newProfile);
    localStorage.setItem('profile', JSON.stringify(newProfile));
    setShowProfileSetup(false);

    if (scriptUrl && pin) {
      try {
        // Correct signature: url, pin, avatar_id, nombre
        await googleSheetService.saveProfile(scriptUrl, pin, avatarId, nombre);
        showToast('Perfil guardado correctamente', 'success');
      } catch (error) {
        console.error('Error saving profile:', error);
        showToast('Error al guardar en la nube (se guardó localmente)', 'error');
      }
    }
  };

  // Subscription Edit
  const handleEditSubscription = async (updatedSub: PendingExpense) => {
    // Here we would ideally sync to backend
    setPendingExpenses(prev => prev.map(p => p.id === updatedSub.id ? updatedSub : p));
    setEditingSubscription(null);
    showToast('Suscripción actualizada', 'success');
  };

  const handleAddCard = (card: CreditCard) => {
    setCards(prev => [...prev, card]);
  };

  const handleEditCard = (card: CreditCard) => {
    setCards(prev => prev.map(c => c.alias === card.alias ? card : c));
  };

  const addGoal = (goal: Goal) => {
    setGoals(prev => [...prev, goal]);
    showToast('Meta creada', 'success');
    // Persist to Google Sheets
    googleSheetService.createGoal(scriptUrl, pin, goal)
      .then(() => setTimeout(() => handleSync(), 1500))
      .catch(() => showToast('Error al guardar meta en la nube', 'error'));
  };

  const updateGoal = (goal: Goal) => {
    setGoals(prev => prev.map(g => g.id === goal.id ? goal : g));
    showToast('Meta actualizada', 'success');
    googleSheetService.updateGoal(scriptUrl, pin, goal)
      .then(() => setTimeout(() => handleSync(), 1500))
      .catch(() => showToast('Error al actualizar meta en la nube', 'error'));
  };

  const deleteGoal = (goalId: string) => {
    setGoals(prev => prev.filter(g => g.id !== goalId));
    showToast('Meta eliminada', 'success');
    googleSheetService.deleteGoal(scriptUrl, pin, goalId)
      .then(() => setTimeout(() => handleSync(), 1500))
      .catch(() => showToast('Error al eliminar meta en la nube', 'error'));
  };

  const contributeToGoal = (metaId: string, monto: number, cuenta?: string) => {
    const goal = goals.find(g => g.id === metaId);

    // Optimistic update goal
    setGoals(prev => prev.map(g => {
      if (g.id !== metaId) return g;
      const nuevoAhorrado = g.monto_ahorrado + monto;
      return {
        ...g,
        monto_ahorrado: nuevoAhorrado,
        estado: (g.monto_objetivo > 0 && nuevoAhorrado >= g.monto_objetivo) ? 'completada' as const : g.estado
      };
    }));

    // Optimistic update history — afecta accountBalances inmediatamente
    const ts = new Date().toISOString();
    setHistory(prev => [{
      fecha: ts.slice(0, 10),
      categoria: 'Aporte Meta',
      descripcion: `Aporte a: ${goal?.nombre || metaId}`,
      monto,
      tipo: 'Aporte_Meta' as const,
      cuenta: cuenta || 'Billetera',
      meta_id: metaId,
      timestamp: ts
    }, ...prev]);

    showToast('Aporte registrado', 'success');
    googleSheetService.contributeToGoal(scriptUrl, pin, metaId, monto, cuenta, goal?.nombre)
      .then(() => setTimeout(() => handleSync(), 1500))
      .catch(() => showToast('Error al registrar aporte en la nube', 'error'));
  };

  const romperMeta = (metaId: string, monto: number, cuenta?: string) => {
    const goal = goals.find(g => g.id === metaId);

    // Optimistic update goal
    setGoals(prev => prev.map(g => {
      if (g.id !== metaId) return g;
      return {
        ...g,
        monto_ahorrado: Math.max(0, g.monto_ahorrado - monto),
        estado: 'activa' as const
      };
    }));

    // Optimistic update history — devuelve saldo a la cuenta inmediatamente
    const ts = new Date().toISOString();
    setHistory(prev => [{
      fecha: ts.slice(0, 10),
      categoria: 'Ruptura Meta',
      descripcion: `Ruptura de: ${goal?.nombre || metaId}`,
      monto,
      tipo: 'Ruptura_Meta' as const,
      cuenta: cuenta || 'Billetera',
      meta_id: metaId,
      timestamp: ts
    }, ...prev]);

    showToast('Fondos liberados de la meta', 'success');
    googleSheetService.romperMeta(scriptUrl, pin, metaId, monto, cuenta, goal?.nombre)
      .then(() => setTimeout(() => handleSync(), 1500))
      .catch(() => showToast('Error al liberar fondos de la meta', 'error'));
  };

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;

    if (deleteTarget.type === 'subscription') {
      const item = deleteTarget.item as PendingExpense;
      setPendingExpenses(prev => prev.filter(p => p.id !== item.id));
      showToast('Suscripción eliminada', 'success');
    } else if (deleteTarget.type === 'transaction') {
      const item = deleteTarget.item as Transaction;
      handleDeleteTransaction(item);
    } else {
      const item = deleteTarget.item as CreditCard;
      setCards(prev => prev.filter(c => c.alias !== item.alias));
      showToast('Tarjeta eliminada', 'success');
    }

    // Close dialog immediately (optimistic)
    setDeleteTarget(null);
  };

  // Family Plan handlers
  const normalizeMember = (data: any) => ({
    history: data.history || [],
    goals: (data.goals || []).map((g: any) => ({
      id: g.id, nombre: g.nombre,
      monto_objetivo: Number(g.monto_objetivo) || 0,
      monto_ahorrado: Number(g.monto_ahorrado) || 0,
      notas: g.notas || '', estado: g.estado || 'activa',
      icono: g.icono || '', timestamp: g.timestamp
    })),
    cards: data.cards || [],
    profile: data.profile ? { ...data.profile, id: data.profile.id || '' } : null
  });

  const handleFetchPartnerData = async (config: FamilyConfig) => {
    const members = config.members || [];
    if (members.length === 0) return;
    setIsSyncingPartner(true);
    try {
      const results: Record<string, MemberData> = {};
      await Promise.all(members.map(async (m: FamilyMember) => {
        if (!m.url || !m.pin) return;
        try {
          const data = await googleSheetService.fetchData(m.url, m.pin);
          results[m.name] = normalizeMember(data);
        } catch {
          // ignore individual member errors
        }
      }));
      setMembersData(results);
    } catch {
      showToast('No se pudo conectar con uno o más miembros. Verifica URL y PIN.', 'error');
    } finally {
      setIsSyncingPartner(false);
    }
  };

  const handleSaveFamilyConfig = async (config: FamilyConfig) => {
    localStorage.setItem('familyConfig', JSON.stringify(config));
    setFamilyConfig(config);
    await handleFetchPartnerData(config);
    if (scriptUrl && pin) {
      googleSheetService.saveFamilyConfig(scriptUrl, pin, config).catch(() => {});
    }
  };

  const handleDisconnectPartner = () => {
    localStorage.removeItem('familyConfig');
    setFamilyConfig(null);
    setMembersData({});
    // Clear family config from GAS sheet (B5:B8) so it doesn't re-load on other devices
    if (scriptUrl && pin) {
      googleSheetService.saveFamilyConfig(scriptUrl, pin, { members: [] }).catch(() => {});
    }
  };

  // Custom category handlers
  const handleAddCustomCategory = (cat: string, tipo: 'gasto' | 'ingreso') => {
    if (tipo === 'gasto') {
      const updated = [...customGastosCategories, cat];
      setCustomGastosCategories(updated);
      localStorage.setItem('customGastosCats', JSON.stringify(updated));
      if (scriptUrl && pin) googleSheetService.saveCustomCategories(scriptUrl, pin, updated, customIngresosCategories).catch(() => {});
    } else {
      const updated = [...customIngresosCategories, cat];
      setCustomIngresosCategories(updated);
      localStorage.setItem('customIngresosCats', JSON.stringify(updated));
      if (scriptUrl && pin) googleSheetService.saveCustomCategories(scriptUrl, pin, customGastosCategories, updated).catch(() => {});
    }
  };

  const handleRemoveCustomCategory = (cat: string, tipo: 'gasto' | 'ingreso') => {
    if (tipo === 'gasto') {
      const updated = customGastosCategories.filter(c => c !== cat);
      setCustomGastosCategories(updated);
      localStorage.setItem('customGastosCats', JSON.stringify(updated));
      if (scriptUrl && pin) googleSheetService.saveCustomCategories(scriptUrl, pin, updated, customIngresosCategories).catch(() => {});
    } else {
      const updated = customIngresosCategories.filter(c => c !== cat);
      setCustomIngresosCategories(updated);
      localStorage.setItem('customIngresosCats', JSON.stringify(updated));
      if (scriptUrl && pin) googleSheetService.saveCustomCategories(scriptUrl, pin, customGastosCategories, updated).catch(() => {});
    }
  };

  // Auto-load members data on start if family config exists
  React.useEffect(() => {
    if (familyConfig && Object.keys(membersData).length === 0) {
      handleFetchPartnerData(familyConfig);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Render logic
  const renderContent = () => {
    const commonProps = { notify: showToast };

    switch (activeTab) {
      case 'dashboard':
        return (
          <Dashboard
            pendingExpenses={pendingExpenses}
            cards={cards}
            history={history}
            goals={goals}
            onEditTransaction={(t) => setEditingTransaction(t)}
            onDeleteTransaction={(t) => setDeleteTarget({ type: 'transaction', item: t })}
          />
        );

      case 'metas':
        return <GoalsView history={history} goals={goals} cards={cards} onAddGoal={addGoal} onUpdateGoal={updateGoal} onDeleteGoal={deleteGoal} onContributeToGoal={contributeToGoal} onRomperMeta={romperMeta} />;

      case 'registrar':
        return (
          <UnifiedEntryForm
            scriptUrl={scriptUrl}
            pin={pin}
            cards={cards}
            goals={goals}
            history={history}
            pendingExpenses={pendingExpenses}
            onAddPending={(newExpense) => setPendingExpenses(prev => [...prev, newExpense])}
            onSuccess={() => {
              showToast('Movimiento registrado correctamente', 'success');
              setTimeout(() => handleSync(), 1500);
            }}
            notify={showToast}
            onRomperMeta={romperMeta}
            customGastosCategories={customGastosCategories}
            customIngresosCategories={customIngresosCategories}
            onAddCustomCategory={handleAddCustomCategory}
            onRemoveCustomCategory={handleRemoveCustomCategory}
          />
        );

      case 'deudas': {
        const deudasActivas = pendingExpenses.filter(p => p.tipo !== 'suscripcion' && p.estado === 'Pendiente');
        const suscripcionesActivas = pendingExpenses.filter(p => p.tipo === 'suscripcion');
        const totalDeuda = deudasActivas.reduce((sum, d) => {
          const pagado = Number(d.monto_pagado_total) || 0;
          return sum + Math.max(0, Number(d.monto) - pagado);
        }, 0);
        const totalSuscripciones = suscripcionesActivas.reduce((sum, s) => sum + Number(s.monto), 0);
        const formatCurrencyLocal = (n: number) => new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(n);

        return (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Left Column (3/5): Payment Form - IS the debt list + payment controls */}
            <div className="lg:col-span-3">
              <PaymentForm scriptUrl={scriptUrl} pin={pin} cards={cards} pendingExpenses={pendingExpenses} history={history} goals={goals} onUpdateExpense={handleUpdateExpense} onAddToHistory={handleAddToHistory} onRomperMeta={romperMeta} {...commonProps} />
            </div>

            {/* Right Column (2/5): Summary + Subscriptions */}
            <div className="lg:col-span-2 space-y-6">
              {/* Resumen de deuda */}
              <div className={`${theme.colors.bgCard} p-6 rounded-2xl border ${theme.colors.border} shadow-lg`}>
                <h3 className={`text-lg font-bold mb-4 ${theme.colors.textPrimary}`}>Resumen</h3>
                <div className="space-y-4">
                  <div className={`flex justify-between items-center p-3 rounded-xl ${theme.colors.bgSecondary}`}>
                    <div>
                      <p className={`text-xs ${theme.colors.textMuted}`}>Deuda total pendiente</p>
                      <p className="font-mono font-bold text-xl text-red-400">{formatCurrencyLocal(totalDeuda)}</p>
                    </div>
                    <div className={`text-right`}>
                      <p className={`text-2xl font-bold ${theme.colors.textPrimary}`}>{deudasActivas.length}</p>
                      <p className={`text-xs ${theme.colors.textMuted}`}>deudas</p>
                    </div>
                  </div>
                  <div className={`flex justify-between items-center p-3 rounded-xl ${theme.colors.bgSecondary}`}>
                    <div>
                      <p className={`text-xs ${theme.colors.textMuted}`}>Suscripciones mensuales</p>
                      <p className="font-mono font-bold text-lg text-purple-400">{formatCurrencyLocal(totalSuscripciones)}</p>
                    </div>
                    <div className={`text-right`}>
                      <p className={`text-2xl font-bold ${theme.colors.textPrimary}`}>{suscripcionesActivas.length}</p>
                      <p className={`text-xs ${theme.colors.textMuted}`}>activas</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Suscripciones Activas */}
              <div className={`${theme.colors.bgCard} p-6 rounded-2xl border ${theme.colors.border} shadow-lg`}>
                <h3 className={`text-lg font-bold mb-4 ${theme.colors.textPrimary} flex items-center gap-2`}>
                  <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                  Suscripciones Activas
                </h3>
                <div className="space-y-3">
                  {suscripcionesActivas.map(sub => (
                    <div key={sub.id} className={`p-4 rounded-xl border flex justify-between items-center ${theme.colors.bgSecondary} ${theme.colors.border}`}>
                      <div>
                        <p className={`font-bold ${theme.colors.textPrimary}`}>{sub.descripcion}</p>
                        <p className={`text-sm font-mono ${theme.colors.textMuted}`}>{formatCurrencyLocal(Number(sub.monto))}/mes</p>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => setEditingSubscription(sub)} className="text-blue-500 hover:text-blue-700 text-xs font-medium px-3 py-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 transition-colors">Editar</button>
                        <button onClick={() => setDeleteTarget({ type: 'subscription', item: sub })} className="text-red-500 hover:text-red-700 text-xs font-medium px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 transition-colors">Eliminar</button>
                      </div>
                    </div>
                  ))}
                  {suscripcionesActivas.length === 0 && (
                    <p className={`text-sm ${theme.colors.textMuted} italic text-center py-4`}>No hay suscripciones activas.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      }

      case 'familia':
        return (
          <FamiliaView
            myProfile={profile}
            myHistory={history}
            myGoals={goals}
            myCards={cards}
            familyConfig={familyConfig}
            membersData={membersData}
            isSyncingPartner={isSyncingPartner}
            onSaveFamilyConfig={handleSaveFamilyConfig}
            onDisconnectPartner={handleDisconnectPartner}
            onRefreshPartner={() => familyConfig ? handleFetchPartnerData(familyConfig) : Promise.resolve()}
            notify={showToast}
          />
        );

      case 'activos': // Assets Management
        return <AssetsView realEstateInvestments={realEstateInvestments} availableProperties={availableProperties} onAddProperty={handleAddRealEstateInvestment} notify={showToast} />;

      case 'config': // Settings
        // Correcting SettingsView props based on definition
        return (
          <SettingsView
            scriptUrl={scriptUrl}
            pin={pin}
            profile={profile}
            currentTheme={currentTheme}
            cards={cards}
            notificationConfig={notificationConfig}
            onAddCard={handleAddCard}
            onEditCard={handleEditCard}
            onDeleteCard={(card) => setDeleteTarget({ type: 'card', item: card })}
            onSetTheme={setTheme}
            onSync={handleSync}
            onSaveNotificationConfig={handleSaveNotificationConfig}
            onSendTestEmail={handleSendTestEmail}
            onSendNotifications={handleSendNotifications}
            onSetupDailyTrigger={handleSetupDailyTrigger}
            notify={showToast}
            familyConfig={familyConfig}
            onDisconnectPartner={handleDisconnectPartner}
            onNavigateToFamilia={() => setActiveTab('familia')}
            gasVersion={gasVersion}
            schemaVersion={schemaVersion}
          />
        );

      case 'reportes':
        return <ReportsView history={history} pendingExpenses={pendingExpenses} cards={cards} />;

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

  // Show loading screen while initial sync is happening
  if (isInitialLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500 mb-4"></div>
        <p className="text-slate-400 animate-pulse">Sincronizando con Google Sheets...</p>
      </div>
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
        lastSyncTime={lastSyncTime}
        profile={profile}
        hasFamilyPlan={!!familyConfig}
      >
        {renderContent()}
      </Layout>
      <Toast message={toast.msg} type={toast.type} isVisible={toast.visible} onClose={hideToast} />

      {/* Profile Setup Modal */}
      {showProfileSetup && (
        <ProfileSetupModal
          isOpen={showProfileSetup}
          onSave={handleProfileSave}
        />
      )}

      {/* Edit Subscription Modal */}
      {editingSubscription && (
        <EditSubscriptionModal
          isOpen={!!editingSubscription}
          subscription={editingSubscription}
          cards={cards} // Added missing prop
          onClose={() => setEditingSubscription(null)}
          onSave={handleEditSubscription}
        />
      )}

      {/* Edit Transaction Modal */}
      {editingTransaction && (
        <EditTransactionModal
          isOpen={!!editingTransaction}
          transaction={editingTransaction}
          onClose={() => setEditingTransaction(null)}
          onSave={handleEditTransaction}
        />
      )}

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        title={
          deleteTarget?.type === 'transaction' ? 'Eliminar Movimiento'
            : deleteTarget?.type === 'subscription' ? 'Eliminar Suscripción'
              : 'Eliminar Tarjeta'
        }
        message={
          deleteTarget?.type === 'transaction'
            ? `¿Estás seguro que deseas eliminar "${(deleteTarget.item as Transaction).descripcion}" por ${(deleteTarget.item as Transaction).monto}?`
            : deleteTarget?.type === 'subscription'
              ? `¿Estás seguro que deseas eliminar la suscripción "${(deleteTarget.item as PendingExpense).descripcion}"?`
              : `¿Estás seguro que deseas eliminar la tarjeta "${(deleteTarget?.item as CreditCard)?.alias}"?`
        }
        confirmText="Eliminar"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      {/* Debug Panel only in dev */}
      {process.env.NODE_ENV === 'development' && (
        <DebugPanel
          pendingExpenses={pendingExpenses}
          onForceSync={handleSync}
          onClearCache={() => {
            localStorage.clear();
            window.location.reload();
          }}
        />
      )}
    </>
  );
}

export default App;