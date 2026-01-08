import React, { useState } from 'react';
import { BANCOS, CreditCard } from '../../types';
import { sendToSheet } from '../../services/googleSheetService';
import { formatCurrency, getLocalISOString } from '../../utils/format';
import { Plus, X, CreditCard as CardIcon, Calendar, Wallet, Layers } from 'lucide-react';

interface CardFormProps {
  scriptUrl: string;
  pin: string;
  onAddCard: (card: CreditCard) => void;
  existingCards: CreditCard[];
  notify?: (msg: string, type: 'success' | 'error') => void;
}

export const CardForm: React.FC<CardFormProps> = ({ scriptUrl, pin, onAddCard, existingCards, notify }) => {
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState<Partial<CreditCard>>({
    banco: '',
    tipo_tarjeta: '',
    alias: '',
    url_imagen: '',
    dia_cierre: undefined,
    dia_pago: undefined,
    limite: undefined
  });

  // Helper for card gradients
  const getCardGradient = (banco: string) => {
    switch(banco) {
      case 'BCP': return 'from-[#002a8d] to-[#0050ef]'; // Azul BCP
      case 'Interbank': return 'from-[#009b3a] to-[#00c652]'; // Verde Interbank
      case 'BBVA': return 'from-[#004481] to-[#1464a5]'; // Azul BBVA
      case 'Scotiabank': return 'from-[#ec111a] to-[#ff4d55]'; // Rojo Scotia
      case 'Banco Pichincha': return 'from-[#ffdd00] to-[#ffea61] text-slate-800'; // Amarillo
      case 'Falabella': return 'from-[#1a9f4b] to-[#a3cd39]'; // Verde CMR
      case 'Ripley': return 'from-[#883696] to-[#b35cad]'; // Morado
      default: return 'from-slate-700 to-slate-600';
    }
  };

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
        tipo_tarjeta: formData.tipo_tarjeta!,
        alias: formData.alias!,
        url_imagen: formData.url_imagen || '',
        dia_cierre: Number(formData.dia_cierre),
        dia_pago: Number(formData.dia_pago),
        limite: Number(formData.limite),
        timestamp: getLocalISOString()
      };
      
      onAddCard(newCard);
      await sendToSheet(scriptUrl, pin, newCard, 'Tarjetas');
      
      setFormData({
        banco: '', tipo_tarjeta: '', alias: '', url_imagen: '',
        dia_cierre: undefined, dia_pago: undefined, limite: undefined
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
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const inputClass = "w-full bg-slate-900/50 border border-slate-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all";
  const labelClass = "text-xs font-bold text-slate-400 uppercase tracking-wide ml-1 mb-1 block";

  // --- VIEW: LIST OF CARDS ---
  if (!showForm) {
      return (
          <div className="space-y-6 animate-in fade-in duration-300">
              <div className="flex justify-between items-center px-2">
                  <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                      <Layers className="text-indigo-400"/> Mis Tarjetas
                  </h2>
                  <button 
                    onClick={() => setShowForm(true)}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg font-bold shadow-lg shadow-indigo-500/20 transition-all transform active:scale-95"
                  >
                      <Plus size={18} /> Nueva
                  </button>
              </div>

              {existingCards.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 bg-slate-800/40 border border-slate-700 border-dashed rounded-3xl text-slate-500">
                      <Wallet size={48} className="mb-4 opacity-50"/>
                      <p className="text-lg font-medium">No tienes tarjetas registradas</p>
                      <p className="text-sm mb-6">Agrega una para comenzar a controlar tus gastos</p>
                      <button onClick={() => setShowForm(true)} className="text-indigo-400 hover:text-indigo-300 font-bold">
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
                                  
                                  {/* Background Texture */}
                                  <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
                                  <div className="absolute -bottom-12 -right-12 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>

                                  <div className="relative z-10 flex flex-col justify-between h-full">
                                      <div className="flex justify-between items-start">
                                          <div>
                                              <p className={`font-medium text-sm opacity-80 ${textColor}`}>{card.banco}</p>
                                              <p className={`font-bold text-lg ${textColor}`}>{card.alias}</p>
                                          </div>
                                          <CardIcon className={`opacity-60 ${textColor}`} size={24}/>
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
                                                  <Calendar size={10}/> Día {card.dia_cierre}
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
        className="mb-6 flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
      >
        <X size={18} /> Cancelar y volver
      </button>

      <div className="bg-slate-800/40 backdrop-blur-sm p-6 md:p-8 rounded-2xl border border-slate-700/50 shadow-xl">
        <h2 className="text-2xl font-bold mb-6 text-white">💳 Registrar Nueva Tarjeta</h2>
        
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className={labelClass}>Banco</label>
              <select name="banco" value={formData.banco} onChange={handleChange} required className={inputClass}>
                <option value="">Selecciona banco</option>
                {BANCOS.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Tipo / Nivel</label>
              <input type="text" name="tipo_tarjeta" value={formData.tipo_tarjeta} onChange={handleChange} placeholder="Ej: Visa Signature" required className={inputClass}/>
            </div>
          </div>

          <div>
            <label className={labelClass}>Alias (Nombre corto)</label>
            <input type="text" name="alias" value={formData.alias} onChange={handleChange} placeholder="Ej: BCP Principal" required className={inputClass}/>
          </div>

          <div>
             <label className={labelClass}>URL Imagen (Opcional)</label>
             <input type="url" name="url_imagen" value={formData.url_imagen} onChange={handleChange} placeholder="https://..." className={inputClass}/>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>Día Cierre</label>
              <input type="number" name="dia_cierre" min="1" max="31" value={formData.dia_cierre || ''} onChange={handleChange} required className={`${inputClass} text-center`}/>
            </div>
            <div>
              <label className={labelClass}>Día Pago</label>
              <input type="number" name="dia_pago" min="1" max="31" value={formData.dia_pago || ''} onChange={handleChange} required className={`${inputClass} text-center`}/>
            </div>
            <div>
              <label className={labelClass}>Límite</label>
              <input type="number" name="limite" step="0.01" value={formData.limite || ''} onChange={handleChange} required className={inputClass}/>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className={`w-full py-4 rounded-xl font-bold text-white mt-4 shadow-lg transition-all active:scale-95 ${loading ? 'bg-slate-600' : 'bg-indigo-600 hover:bg-indigo-500'}`}
          >
            {loading ? 'Guardando...' : 'Agregar Tarjeta'}
          </button>
        </form>
      </div>
    </div>
  );
};