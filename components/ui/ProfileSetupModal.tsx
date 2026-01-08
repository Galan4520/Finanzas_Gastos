import React, { useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { avatars, Avatar } from '../../avatars';

interface ProfileSetupModalProps {
    isOpen: boolean;
    onSave: (avatarId: string, nombre: string) => Promise<void>;
}

export const ProfileSetupModal: React.FC<ProfileSetupModalProps> = ({ isOpen, onSave }) => {
    const { theme } = useTheme();
    const [selectedAvatar, setSelectedAvatar] = useState<string>('');
    const [nombre, setNombre] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleSubmit = async () => {
        if (!selectedAvatar) {
            setError('Por favor selecciona un avatar');
            return;
        }
        if (!nombre.trim()) {
            setError('Por favor ingresa tu nombre');
            return;
        }

        setError('');
        setIsLoading(true);

        try {
            await onSave(selectedAvatar, nombre.trim());
        } catch (err) {
            setError('Error al guardar el perfil. Intenta de nuevo.');
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
            <div className={`${theme.colors.bgCard} w-full max-w-lg rounded-3xl shadow-2xl border ${theme.colors.border} overflow-hidden animate-slideUp`}>
                {/* Header with gradient */}
                <div className="relative bg-gradient-to-r from-teal-500 via-emerald-500 to-cyan-500 px-6 py-8 text-center">
                    <div className="absolute inset-0 bg-black/10"></div>
                    <div className="relative">
                        <div className="text-5xl mb-3">👋</div>
                        <h2 className="text-2xl font-bold text-white mb-2">¡Bienvenido!</h2>
                        <p className="text-white/90 text-sm">
                            Personaliza tu perfil para comenzar
                        </p>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Avatar Selection */}
                    <div>
                        <label className={`block text-sm font-semibold ${theme.colors.textSecondary} mb-3`}>
                            Elige tu avatar
                        </label>
                        <div className="grid grid-cols-5 gap-3">
                            {avatars.map((avatar: Avatar) => (
                                <button
                                    key={avatar.id}
                                    onClick={() => setSelectedAvatar(avatar.id)}
                                    className={`relative group aspect-square rounded-xl overflow-hidden border-3 transition-all duration-300 transform hover:scale-105 ${selectedAvatar === avatar.id
                                            ? 'border-teal-500 ring-4 ring-teal-500/30 scale-105'
                                            : `${theme.colors.border} hover:border-teal-400`
                                        }`}
                                >
                                    <img
                                        src={avatar.imagePath}
                                        alt={avatar.label}
                                        className="w-full h-full object-cover"
                                    />
                                    {/* Selected check mark */}
                                    {selectedAvatar === avatar.id && (
                                        <div className="absolute inset-0 bg-teal-500/30 flex items-center justify-center">
                                            <div className="w-8 h-8 bg-teal-500 rounded-full flex items-center justify-center shadow-lg">
                                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                </svg>
                                            </div>
                                        </div>
                                    )}
                                    {/* Hover label */}
                                    <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2 transform transition-transform ${selectedAvatar === avatar.id ? 'translate-y-0' : 'translate-y-full group-hover:translate-y-0'
                                        }`}>
                                        <span className="text-white text-[10px] font-semibold">{avatar.label}</span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Name Input */}
                    <div>
                        <label className={`block text-sm font-semibold ${theme.colors.textSecondary} mb-2`}>
                            ¿Cómo te llamas?
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                value={nombre}
                                onChange={(e) => setNombre(e.target.value)}
                                placeholder="Ingresa tu nombre"
                                maxLength={30}
                                className={`w-full px-4 py-3 rounded-xl border-2 ${theme.colors.border} ${theme.colors.bgSecondary} ${theme.colors.textPrimary} placeholder:text-gray-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all text-lg font-medium`}
                            />
                            <div className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs ${theme.colors.textMuted}`}>
                                {nombre.length}/30
                            </div>
                        </div>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm text-center">
                            {error}
                        </div>
                    )}

                    {/* Submit Button */}
                    <button
                        onClick={handleSubmit}
                        disabled={isLoading}
                        className={`w-full py-4 rounded-xl font-bold text-white text-lg shadow-lg transition-all duration-300 ${isLoading
                                ? 'bg-gray-400 cursor-not-allowed'
                                : 'bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]'
                            }`}
                    >
                        {isLoading ? (
                            <div className="flex items-center justify-center gap-3">
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                <span>Guardando...</span>
                            </div>
                        ) : (
                            <div className="flex items-center justify-center gap-2">
                                <span>Comenzar</span>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                </svg>
                            </div>
                        )}
                    </button>
                </div>
            </div>

            <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { 
            opacity: 0;
            transform: translateY(30px) scale(0.95);
          }
          to { 
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        .animate-slideUp {
          animation: slideUp 0.4s ease-out;
        }
      `}</style>
        </div>
    );
};
