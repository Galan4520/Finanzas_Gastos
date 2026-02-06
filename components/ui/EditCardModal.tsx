import React, { useState, useEffect, useMemo } from 'react';
import { CreditCard, BANCOS } from '../../types';
import { useTheme } from '../../contexts/ThemeContext';
import { X, Save, CreditCard as CardIcon, Calendar, Wallet, Percent } from 'lucide-react';
import { PERUVIAN_BANK_CARDS, BankCard } from '../../peruBankCards';

interface EditCardModalProps {
    isOpen: boolean;
    card: CreditCard | null;
    onSave: (updated: CreditCard, originalAlias: string) => Promise<void>;
    onClose: () => void;
}

export const EditCardModal: React.FC<EditCardModalProps> = ({
    isOpen,
    card,
    onSave,
    onClose
}) => {
    const { theme } = useTheme();
    const [loading, setLoading] = useState(false);
    const [originalAlias, setOriginalAlias] = useState('');
    const [formData, setFormData] = useState({
        banco: '',
        tipo_tarjeta: '',
        alias: '',
        url_imagen: '',
        dia_cierre: '',
        dia_pago: '',
        limite: '',
        tea: '',
        selectedCardId: ''
    });

    // Get available cards based on bank selection
    const availableCards = useMemo(() => {
        if (!formData.banco) return [];
        return PERUVIAN_BANK_CARDS.filter(c => c.banco === formData.banco);
    }, [formData.banco]);

    // Selected card preview
    const selectedCard = useMemo(() => {
        if (!formData.selectedCardId) return null;
        return PERUVIAN_BANK_CARDS.find(c => c.id === formData.selectedCardId) || null;
    }, [formData.selectedCardId]);

    useEffect(() => {
        if (card) {
            // Store the original alias to identify the card later
            setOriginalAlias(card.alias);

            const matchingCard = PERUVIAN_BANK_CARDS.find(
                c => c.banco === card.banco && (c.nombre === card.tipo_tarjeta || c.nombre === card.alias)
            );

            setFormData({
                banco: card.banco,
                tipo_tarjeta: card.tipo_tarjeta,
                alias: card.alias,
                url_imagen: card.url_imagen || '',
                dia_cierre: card.dia_cierre.toString(),
                dia_pago: card.dia_pago.toString(),
                limite: card.limite.toString(),
                tea: card.tea ? card.tea.toString() : '',
                selectedCardId: matchingCard?.id || ''
            });
        }
    }, [card]);

    if (!isOpen || !card) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const updatedCard: CreditCard = {
                ...card,
                banco: formData.banco,
                tipo_tarjeta: selectedCard?.nombre || formData.tipo_tarjeta,
                alias: formData.alias,
                url_imagen: selectedCard?.imagen || formData.url_imagen,
                dia_cierre: parseInt(formData.dia_cierre),
                dia_pago: parseInt(formData.dia_pago),
                limite: parseFloat(formData.limite),
                tea: formData.tea ? parseFloat(formData.tea) : null
            };

            // Pass both the updated card AND the original alias
            await onSave(updatedCard, originalAlias);
            onClose();
        } catch (error) {
            console.error('Error saving card:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => {
            const newData = { ...prev, [name]: value };
            if (name === 'banco') {
                newData.selectedCardId = '';
            }
            return newData;
        });
    };

    const handleSelectCard = (bankCard: BankCard) => {
        setFormData(prev => ({
            ...prev,
            selectedCardId: bankCard.id,
            tipo_tarjeta: bankCard.tipo,
            alias: bankCard.nombre
        }));
    };

    const inputClass = `w-full ${theme.colors.bgSecondary} border ${theme.colors.border} rounded-xl px-4 py-3 ${theme.colors.textPrimary} focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all`;
    const labelClass = `text-xs font-bold ${theme.colors.textMuted} uppercase tracking-wide ml-1 mb-1 block`;

    return (
        <>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                {/* Backdrop */}
                <div
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    onClick={onClose}
                />

                {/* Modal */}
                <div className={`relative ${theme.colors.bgCard} backdrop-blur-md rounded-2xl shadow-2xl max-w-lg w-full p-6 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto border ${theme.colors.border}`}>
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                        <h3 className={`text-xl font-bold ${theme.colors.textPrimary} flex items-center gap-2`}>
                            <CardIcon className="text-teal-400" size={24} />
                            Editar Tarjeta
                        </h3>
                        <button
                            onClick={onClose}
                            className={`p-2 rounded-lg ${theme.colors.bgSecondary} hover:opacity-80 transition-colors`}
                        >
                            <X size={20} className={theme.colors.textMuted} />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Banco */}
                        <div>
                            <label className={labelClass}>Banco</label>
                            <select
                                name="banco"
                                value={formData.banco}
                                onChange={handleChange}
                                required
                                disabled={loading}
                                className={inputClass}
                            >
                                <option value="">Selecciona banco</option>
                                {BANCOS.map(b => (
                                    <option key={b} value={b}>{b}</option>
                                ))}
                            </select>
                        </div>

                        {/* Card Selection Grid */}
                        {availableCards.length > 0 && (
                            <div>
                                <label className={labelClass}>Selecciona tu tarjeta</label>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                    {availableCards.map(bankCard => (
                                        <button
                                            type="button"
                                            key={bankCard.id}
                                            onClick={() => handleSelectCard(bankCard)}
                                            disabled={loading}
                                            className={`p-3 rounded-xl border-2 transition-all ${formData.selectedCardId === bankCard.id
                                                ? 'border-teal-500 bg-teal-500/10 shadow-lg'
                                                : `${theme.colors.border} ${theme.colors.bgSecondary} hover:border-teal-400/50`
                                                }`}
                                        >
                                            <div className={`h-14 rounded-lg bg-gradient-to-br ${bankCard.gradient} mb-2 flex items-center justify-center overflow-hidden`}>
                                                <CardIcon className="text-white/80" size={20} />
                                            </div>
                                            <p className={`text-xs font-medium ${theme.colors.textPrimary} truncate`}>{bankCard.nombre}</p>
                                            <p className={`text-[10px] ${theme.colors.textMuted}`}>{bankCard.tipo}</p>
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
                                disabled={loading}
                                className={inputClass}
                            />
                        </div>

                        {/* Días, Límite y TEA */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                                <label className={labelClass}>
                                    <Calendar size={12} className="inline mr-1" />
                                    Día Cierre
                                </label>
                                <input
                                    type="number"
                                    name="dia_cierre"
                                    min="1"
                                    max="31"
                                    value={formData.dia_cierre}
                                    onChange={handleChange}
                                    required
                                    disabled={loading}
                                    className={`${inputClass} text-center`}
                                />
                            </div>
                            <div>
                                <label className={labelClass}>
                                    <Calendar size={12} className="inline mr-1" />
                                    Día Pago
                                </label>
                                <input
                                    type="number"
                                    name="dia_pago"
                                    min="1"
                                    max="31"
                                    value={formData.dia_pago}
                                    onChange={handleChange}
                                    required
                                    disabled={loading}
                                    className={`${inputClass} text-center`}
                                />
                            </div>
                            <div>
                                <label className={labelClass}>
                                    <Wallet size={12} className="inline mr-1" />
                                    Límite
                                </label>
                                <input
                                    type="number"
                                    name="limite"
                                    step="0.01"
                                    value={formData.limite}
                                    onChange={handleChange}
                                    required
                                    disabled={loading}
                                    className={inputClass}
                                />
                            </div>
                            <div>
                                <label className={labelClass}>
                                    <Percent size={12} className="inline mr-1" />
                                    TEA (%)
                                </label>
                                <input
                                    type="number"
                                    name="tea"
                                    step="0.01"
                                    min="0"
                                    max="999"
                                    placeholder="Ej: 60"
                                    value={formData.tea}
                                    onChange={handleChange}
                                    disabled={loading}
                                    className={inputClass}
                                />
                                <p className={`text-[10px] ${theme.colors.textMuted} mt-1`}>Tasa Efectiva Anual</p>
                            </div>
                        </div>

                        {/* Card Preview */}
                        {selectedCard && (
                            <div className={`p-4 rounded-xl ${theme.colors.bgSecondary} border ${theme.colors.border}`}>
                                <p className={`text-xs font-bold ${theme.colors.textMuted} uppercase mb-3`}>Vista Previa</p>
                                <div className={`h-32 rounded-2xl bg-gradient-to-br ${selectedCard.gradient} p-4 shadow-lg overflow-hidden relative`}>
                                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                                    <div className="relative z-10 flex flex-col justify-between h-full text-white">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="text-xs opacity-80">{selectedCard.banco}</p>
                                                <p className="font-bold text-sm">{selectedCard.nombre}</p>
                                            </div>
                                            <CardIcon size={18} className="opacity-60" />
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-4 bg-amber-200/80 rounded"></div>
                                            <span className="font-mono tracking-widest text-xs opacity-80">•••• ••••</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-3 pt-4">
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={loading}
                                className={`flex-1 px-4 py-3 rounded-xl font-semibold ${theme.colors.bgSecondary} ${theme.colors.textPrimary} hover:opacity-80 transition-all`}
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className={`flex-1 px-4 py-3 rounded-xl font-semibold text-white transition-all shadow-lg flex items-center justify-center gap-2 ${loading ? 'bg-gray-500' : 'bg-teal-500 hover:bg-teal-600'}`}
                            >
                                {loading ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-t-white border-r-white border-b-transparent border-l-transparent rounded-full animate-spin"></div>
                                        Guardando...
                                    </>
                                ) : (
                                    <>
                                        <Save size={18} />
                                        Guardar
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Loading Overlay */}
            {loading && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className={`${theme.colors.bgCard} p-8 rounded-2xl shadow-2xl flex flex-col items-center gap-4 border ${theme.colors.border}`}>
                        <div className="w-16 h-16 border-4 border-t-teal-500 border-r-teal-500 border-b-transparent border-l-transparent rounded-full animate-spin"></div>
                        <p className={`${theme.colors.textPrimary} font-semibold text-lg`}>Guardando cambios...</p>
                        <p className={`${theme.colors.textMuted} text-sm`}>Sincronizando con Google Sheets</p>
                    </div>
                </div>
            )}
        </>
    );
};
