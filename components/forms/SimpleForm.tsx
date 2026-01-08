import React, { useState } from 'react';
import { CATEGORIAS_GASTOS, CATEGORIAS_INGRESOS } from '../../types';
import { sendToSheet } from '../../services/googleSheetService';
import { getLocalISOString } from '../../utils/format';

interface SimpleFormProps {
  type: 'Gastos' | 'Ingresos';
  scriptUrl: string;
  pin: string;
  onSuccess: () => void;
  notify?: (msg: string, type: 'success' | 'error') => void;
}

export const SimpleForm: React.FC<SimpleFormProps> = ({ type, scriptUrl, pin, onSuccess, notify }) => {
  const [loading, setLoading] = useState(false);
  const categories = type === 'Gastos' ? CATEGORIAS_GASTOS : CATEGORIAS_INGRESOS;
  const today = new Date().toISOString().split('T')[0];

  const [formData, setFormData] = useState({
    fecha: today,
    monto: '',
    categoria: '',
    descripcion: '',
    notas: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scriptUrl) {
      notify?.("Configura la URL en Ajustes", 'error');
      return;
    }
    setLoading(true);

    try {
      const payload = {
        ...formData,
        timestamp: getLocalISOString()
      };

      await sendToSheet(scriptUrl, pin, payload, type);

      setFormData(prev => ({ ...prev, monto: '', descripcion: '', notas: '' }));
      notify?.(`${type === 'Gastos' ? 'Gasto' : 'Ingreso'} registrado`, 'success');
      onSuccess();
    } catch (error) {
      notify?.("Error al guardar en Sheet", 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <div className="bg-slate-800/40 backdrop-blur-sm p-6 md:p-8 rounded-2xl border border-slate-700/50 shadow-xl max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-white flex items-center gap-2">
        <span className="text-3xl">{type === 'Gastos' ? '💸' : '💰'}</span>
        {type === 'Gastos' ? 'Nuevo Gasto (Efectivo)' : 'Nuevo Ingreso'}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-1">
            <label className="text-xs font-bold text-indigo-400 uppercase tracking-wide ml-1">Fecha</label>
            <input
              type="date"
              name="fecha"
              value={formData.fecha}
              onChange={handleChange}
              required
              className="w-full bg-slate-900/50 border border-slate-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-indigo-400 uppercase tracking-wide ml-1">Monto</label>
            <div className="relative">
              <span className="absolute left-4 top-3.5 text-slate-400">S/</span>
              <input
                type="number"
                name="monto"
                step="0.01"
                value={formData.monto}
                onChange={handleChange}
                placeholder="0.00"
                required
                className="w-full bg-slate-900/50 border border-slate-600 rounded-xl pl-10 pr-4 py-3 text-white font-mono text-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
            </div>
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-bold text-indigo-400 uppercase tracking-wide ml-1">Categoría</label>
          <select
            name="categoria"
            value={formData.categoria}
            onChange={handleChange}
            required
            className="w-full bg-slate-900/50 border border-slate-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all appearance-none"
          >
            <option value="">Selecciona una opción...</option>
            {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-bold text-indigo-400 uppercase tracking-wide ml-1">Descripción</label>
          <input
            type="text"
            name="descripcion"
            value={formData.descripcion}
            onChange={handleChange}
            placeholder="Ej: Almuerzo, Salario..."
            required
            className="w-full bg-slate-900/50 border border-slate-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wide ml-1">Notas (Opcional)</label>
          <textarea
            name="notas"
            value={formData.notas}
            onChange={handleChange}
            rows={2}
            className="w-full bg-slate-900/50 border border-slate-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`w-full py-4 rounded-xl font-bold text-white shadow-lg transition-all transform active:scale-95 mt-2
            ${loading ? 'bg-slate-600 cursor-not-allowed' : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 hover:shadow-indigo-500/25'}`}
        >
          {loading ? 'Guardando...' : 'Guardar Registro'}
        </button>
      </form>
    </div>
  );
};