import React, { useState } from 'react';
import { Mail, Lock, UserPlus, ArrowLeft, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { YunaiLogo } from '../ui/YunaiLogo';

interface RegisterScreenProps {
  onRegister: (email: string, password: string) => Promise<{ error: string | null }>;
  onSwitchToLogin: () => void;
}

export const RegisterScreen: React.FC<RegisterScreenProps> = ({ onRegister, onSwitchToLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const passwordsMatch = password === confirmPassword;
  const passwordLongEnough = password.length >= 6;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim() || !passwordsMatch || !passwordLongEnough) return;

    setLoading(true);
    setError('');

    const result = await onRegister(email.trim(), password.trim());
    if (result.error) {
      setError(result.error === 'User already registered'
        ? 'Este email ya está registrado. Intenta iniciar sesión.'
        : result.error);
    } else {
      setSuccess(true);
    }
    setLoading(false);
  };

  if (success) {
    return (
      <div className="min-h-screen bg-yn-neutral-900 flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-sm bg-yn-neutral-800 rounded-2xl p-8 border border-yn-neutral-700 shadow-xl text-center">
          <div className="w-16 h-16 bg-yn-primary-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={32} className="text-yn-primary-500" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Cuenta creada</h2>
          <p className="text-yn-neutral-400 text-sm mb-6">
            Ya puedes iniciar sesión con tu email y contraseña.
          </p>
          <button
            onClick={onSwitchToLogin}
            className="w-full py-3 rounded-xl font-bold text-white bg-yn-primary-500 hover:bg-yn-primary-700 transition-all"
          >
            Iniciar sesión
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-yn-neutral-900 flex flex-col items-center justify-center px-4">
      {/* Logo */}
      <div className="mb-6 text-center">
        <div className="flex justify-center mb-3">
          <YunaiLogo size={60} />
        </div>
        <h1 className="font-brand text-2xl text-white">YUNAI</h1>
      </div>

      {/* Register Form */}
      <div className="w-full max-w-sm bg-yn-neutral-800 rounded-2xl p-6 border border-yn-neutral-700 shadow-xl">
        <button
          onClick={onSwitchToLogin}
          className="flex items-center gap-1 text-yn-neutral-400 hover:text-white text-sm mb-4 transition-colors"
        >
          <ArrowLeft size={16} /> Volver al login
        </button>

        <h2 className="text-xl font-bold text-white mb-6">Crear cuenta</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-yn-neutral-400 uppercase ml-1">Email</label>
            <div className="relative">
              <Mail size={18} className="absolute left-3 top-3 text-yn-neutral-500" />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="tu@email.com"
                required
                autoComplete="email"
                className="w-full bg-yn-neutral-900 border border-yn-neutral-600 rounded-xl pl-10 pr-4 py-3 text-white placeholder-yn-neutral-500 focus:ring-2 focus:ring-yn-primary-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-yn-neutral-400 uppercase ml-1">Contraseña</label>
            <div className="relative">
              <Lock size={18} className="absolute left-3 top-3 text-yn-neutral-500" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                required
                minLength={6}
                autoComplete="new-password"
                className="w-full bg-yn-neutral-900 border border-yn-neutral-600 rounded-xl pl-10 pr-12 py-3 text-white placeholder-yn-neutral-500 focus:ring-2 focus:ring-yn-primary-500 focus:border-transparent"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-yn-neutral-500 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {password && !passwordLongEnough && (
              <p className="text-xs text-amber-400 ml-1">Mínimo 6 caracteres</p>
            )}
          </div>

          {/* Confirm Password */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-yn-neutral-400 uppercase ml-1">Confirmar contraseña</label>
            <div className="relative">
              <Lock size={18} className="absolute left-3 top-3 text-yn-neutral-500" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Repite la contraseña"
                required
                autoComplete="new-password"
                className="w-full bg-yn-neutral-900 border border-yn-neutral-600 rounded-xl pl-10 pr-4 py-3 text-white placeholder-yn-neutral-500 focus:ring-2 focus:ring-yn-primary-500 focus:border-transparent"
              />
            </div>
            {confirmPassword && !passwordsMatch && (
              <p className="text-xs text-red-400 ml-1">Las contraseñas no coinciden</p>
            )}
          </div>

          {/* Error */}
          {error && (
            <p className="text-red-400 text-sm text-center bg-red-400/10 rounded-lg py-2 px-3">{error}</p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || !email || !passwordLongEnough || !passwordsMatch}
            className={`w-full py-3 rounded-xl font-bold text-white shadow-lg transition-all transform active:scale-95 flex items-center justify-center gap-2
              ${loading || !passwordsMatch || !passwordLongEnough ? 'opacity-50 cursor-not-allowed bg-gray-500' : 'bg-yn-primary-500 hover:bg-yn-primary-700'}`}
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <UserPlus size={18} />
                Crear cuenta
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
