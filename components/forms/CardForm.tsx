import React, { useState, useMemo } from 'react';
import { BANCOS, CreditCard } from '../../types';
import { sendToSheet } from '../../services/googleSheetService';
import { formatCurrency, getLocalISOString } from '../../utils/format';
import { Plus, X, CreditCard as CardIcon, Calendar, Wallet, Layers } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { PERUVIAN_BANK_CARDS, getCardsByBankAndType, getGradientByBank, TIPOS_TARJETA, BankCard } from '../../peruBankCards';

interface CardFormProps {
  scriptUrl: string;
  pin: string;
  onAddCard: (card: CreditCard) => void;
  existingCards: CreditCard[];
  notify?: (msg: string, type: 'success' | 'error') => void;
}

export const CardForm: React.FC<CardFormProps> = ({ scriptUrl, pin, onAddCard, existingCards, notify }) => {
  const { theme } = useTheme();
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState<Partial<CreditCard> & { selectedCardId?: string }>({
    banco: '',
    tipo_tarjeta: '',
    alias: '',
    url_imagen: '',
    dia_cierre: undefined,
    dia_pago: undefined,
    limite: undefined,
    selectedCardId: ''
  });

  // Get available cards based on bank and type selection
  const availableCards = useMemo(() => {
    if (!formData.banco || !formData.tipo_tarjeta) return [];
    return getCardsByBankAndType(formData.banco, formData.tipo_tarjeta as 'Crédito' | 'Débito');
  }, [formData.banco, formData.tipo_tarjeta]);

  // Selected card preview
  const selectedCard = useMemo(() => {
    if (!formData.selectedCardId) return null;
    return PERUVIAN_BANK_CARDS.find(c => c.id === formData.selectedCardId) || null;
  }, [formData.selectedCardId]);

  // Helper for card gradients
  const getCardGradient = (banco: string) => getGradientByBank(banco);

  const getTextColor = (banco: string) => {
    return banco === 'Banco Pichincha' ? 'text-slate-900' : 'text-white';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scriptUrl) {
      notify?.("Configura la URL del Script", 'error');
      return;
    }
    setLoading(true);

    try {
      const newCard: CreditCard = {
        banco: formData.banco!,
        tipo_tarjeta: selectedCard?.nombre || formData.tipo_tarjeta!,
        alias: formData.alias!,
        url_imagen: selectedCard?.imagen || formData.url_imagen || '',
        dia_cierre: Number(formData.dia_cierre),
        dia_pago: Number(formData.dia_pago),
        limite: Number(formData.limite),
        timestamp: getLocalISOString()
      };

      onAddCard(newCard);
      await sendToSheet(scriptUrl, pin, newCard, 'Tarjetas');

      setFormData({
        banco: '', tipo_tarjeta: '', alias: '', url_imagen: '',
        dia_cierre: undefined, dia_pago: undefined, limite: undefined,
        selectedCardId: ''
      });
      notify?.('Tarjeta agregada correctamente', 'success');
      setShowForm(false);
    } catch (error) {
      notify?.("Error al guardar", 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const newData = { ...prev, [name]: value };
      // Reset selected card if bank or type changes
      if (name === 'banco' || name === 'tipo_tarjeta') {
        newData.selectedCardId = '';
      }
      return newData;
    });
  };

  const handleSelectCard = (card: BankCard) => {
    setFormData(prev => ({
      ...prev,
      selectedCardId: card.id,
      alias: card.nombre // Auto-fill alias with card name
    }));
  };

  const inputClass = `w-full ${theme.colors.bgSecondary} border ${theme.colors.border} rounded-xl px-4 py-3 ${theme.colors.textPrimary} focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all`;
  const labelClass = `text-xs font-bold ${theme.colors.textMuted} uppercase tracking-wide ml-1 mb-1 block`;

  // --- VIEW: LIST OF CARDS ---
  if (!showForm) {
    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        <div className="flex justify-between items-center px-2">
          <h2 className={`text-2xl font-bold ${theme.colors.textPrimary} flex items-center gap-2`}>
            <Layers className="text-emerald-400" /> Mis Tarjetas
          </h2>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg font-bold shadow-lg shadow-emerald-500/20 transition-all transform active:scale-95"
          >
            <Plus size={18} /> Nueva
          </button>
        </div>

        {existingCards.length === 0 ? (
          <div className={`flex flex-col items-center justify-center py-16 ${theme.colors.bgSecondary} border ${theme.colors.border} border-dashed rounded-3xl ${theme.colors.textMuted}`}>
            <Wallet size={48} className="mb-4 opacity-50" />
            <p className="text-lg font-medium">No tienes tarjetas registradas</p>
            <p className="text-sm mb-6">Agrega una para comenzar a controlar tus gastos</p>
            <button onClick={() => setShowForm(true)} className="text-emerald-400 hover:text-emerald-300 font-bold">
              + Agregar primera tarjeta
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {existingCards.map((card, idx) => {
              const gradient = getCardGradient(card.banco);
              const textColor = getTextColor(card.banco);

              return (
                <div key={idx} className={`relative h-56 rounded-3xl bg-gradient-to-br ${gradient} p-6 shadow-xl transform transition-transform hover:-translate-y-1 hover:shadow-2xl overflow-hidden group`}>

                  {/* Card Image Background */}
                  {card.url_imagen && (
                    <div
                      className="absolute inset-0 bg-cover bg-center opacity-30"
                      style={{ backgroundImage: `url(${card.url_imagen})` }}
                    />
                  )}

                  {/* Background Texture */}
                  <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
                  <div className="absolute -bottom-12 -right-12 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>

                  <div className="relative z-10 flex flex-col justify-between h-full">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className={`font-medium text-sm opacity-80 ${textColor}`}>{card.banco}</p>
                        <p className={`font-bold text-lg ${textColor}`}>{card.alias}</p>
                      </div>
                      <CardIcon className={`opacity-60 ${textColor}`} size={24} />
                    </div>

                    <div className="flex items-center gap-2 my-2">
                      <div className="w-10 h-7 bg-amber-200/80 rounded-md border border-amber-300/50 flex items-center justify-center">
                        <div className="w-6 h-4 border border-amber-500/30 rounded-sm"></div>
                      </div>
                      <div className={`text-xl tracking-widest font-mono opacity-80 ${textColor}`}>
                        •••• ••••
                      </div>
                    </div>

                    <div>
                      <p className={`text-xs opacity-70 uppercase mb-1 ${textColor}`}>Línea de Crédito</p>
                      <p className={`text-2xl font-mono font-bold ${textColor}`}>{formatCurrency(card.limite)}</p>
                    </div>

                    <div className={`pt-3 mt-1 border-t border-white/10 flex justify-between text-xs ${textColor}`}>
                      <div className="flex flex-col">
                        <span className="opacity-70 uppercase text-[10px]">Cierre</span>
                        <span className="font-bold flex items-center gap-1">
                          <Calendar size={10} /> Día {card.dia_cierre}
                        </span>
                      </div>
                      <div className="flex flex-col text-right">
                        <span className="opacity-70 uppercase text-[10px]">Pago Aprox.</span>
                        <span className="font-bold flex items-center justify-end gap-1">
                          Día {card.dia_pago}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // --- VIEW: FORM (ADD NEW) ---
  return (
    <div className="max-w-3xl mx-auto animate-in slide-in-from-right-8 duration-300">
      <button
        onClick={() => setShowForm(false)}
        className={`mb-6 flex items-center gap-2 ${theme.colors.textMuted} hover:${theme.colors.textPrimary} transition-colors`}
      >
        <X size={18} /> Cancelar y volver
      </button>

      <div className={`${theme.colors.bgCard} backdrop-blur-sm p-6 md:p-8 rounded-2xl border ${theme.colors.border} shadow-xl`}>
        <h2 className={`text-2xl font-bold mb-6 ${theme.colors.textPrimary}`}>💳 Registrar Nueva Tarjeta</h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Banco y Tipo */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className={labelClass}>Banco</label>
              <select name="banco" value={formData.banco} onChange={handleChange} required className={inputClass}>
                <option value="">Selecciona banco</option>
                {BANCOS.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Tipo de Tarjeta</label>
              <select name="tipo_tarjeta" value={formData.tipo_tarjeta} onChange={handleChange} required className={inputClass}>
                <option value="">Selecciona tipo</option>
                {TIPOS_TARJETA.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          {/* Card Selection Grid */}
          {availableCards.length > 0 && (
            <div>
              <label className={labelClass}>Selecciona tu tarjeta</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {availableCards.map(card => (
                  <button
                    type="button"
                    key={card.id}
                    onClick={() => handleSelectCard(card)}
                    className={`p-3 rounded-xl border-2 transition-all ${formData.selectedCardId === card.id
                      ? 'border-emerald-500 bg-emerald-500/10 shadow-lg'
                      : `${theme.colors.border} ${theme.colors.bgSecondary} hover:border-emerald-400/50`
                      }`}
                  >
                    <div className={`h-16 rounded-lg bg-gradient-to-br ${card.gradient} mb-2 flex items-center justify-center overflow-hidden`}>
                      <CardIcon className="text-white/80" size={24} />
                    </div>
                    <p className={`text-xs font-medium ${theme.colors.textPrimary} truncate`}>{card.nombre}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Alias */}
          <div>
            <label className={labelClass}>Alias (Nombre corto)</label>
            <input
              type="text"
              name="alias"
              value={formData.alias}
              onChange={handleChange}
              placeholder="Ej: BCP Principal"
              required
              className={inputClass}
            />
          </div>

          {/* Días y Límite */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>Día Cierre</label>
              <input
                type="number"
                name="dia_cierre"
                min="1"
                max="31"
                value={formData.dia_cierre || ''}
                onChange={handleChange}
                required
                className={`${inputClass} text-center`}
              />
            </div>
            <div>
              <label className={labelClass}>Día Pago</label>
              <input
                type="number"
                name="dia_pago"
                min="1"
                max="31"
                value={formData.dia_pago || ''}
                onChange={handleChange}
                required
                className={`${inputClass} text-center`}
              />
            </div>
            <div>
              <label className={labelClass}>Límite</label>
              <input
                type="number"
                name="limite"
                step="0.01"
                value={formData.limite || ''}
                onChange={handleChange}
                required
                className={inputClass}
              />
            </div>
          </div>

          {/* Card Preview */}
          {selectedCard && (
            <div className={`p-4 rounded-xl ${theme.colors.bgSecondary} border ${theme.colors.border}`}>
              <p className={`text-xs font-bold ${theme.colors.textMuted} uppercase mb-3`}>Vista Previa</p>
              <div className={`h-40 rounded-2xl bg-gradient-to-br ${selectedCard.gradient} p-4 shadow-lg overflow-hidden relative`}>
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                <div className="relative z-10 flex flex-col justify-between h-full text-white">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-xs opacity-80">{selectedCard.banco}</p>
                      <p className="font-bold">{selectedCard.nombre}</p>
                    </div>
                    <CardIcon size={20} className="opacity-60" />
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-5 bg-amber-200/80 rounded"></div>
                    <span className="font-mono tracking-widest text-sm opacity-80">•••• ••••</span>
                  </div>
                  <p className="text-xs opacity-70">{selectedCard.tipo}</p>
                </div>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-4 rounded-xl font-bold text-white mt-4 shadow-lg transition-all active:scale-95 ${loading ? 'bg-gray-600' : 'bg-emerald-600 hover:bg-emerald-500'}`}
          >
            {loading ? 'Guardando...' : 'Agregar Tarjeta'}
          </button>
        </form>
      </div>

      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className={`${theme.colors.bgCard} p-8 rounded-2xl shadow-2xl flex flex-col items-center gap-4 border ${theme.colors.border}`}>
            <div className="w-16 h-16 border-4 border-t-emerald-500 border-r-emerald-500 border-b-transparent border-l-transparent rounded-full animate-spin"></div>
            <p className={`${theme.colors.textPrimary} font-semibold text-lg`}>Guardando tarjeta...</p>
            <p className={`${theme.colors.textMuted} text-sm`}>Sincronizando con Google Sheets</p>
          </div>
        </div>
      )}
    </div>
  );
};