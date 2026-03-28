import React, { useState } from 'react';
import { Mail, Lock, LogIn, UserPlus, Eye, EyeOff } from 'lucide-react';
import { YunaiLogo } from '../ui/YunaiLogo';

interface LoginScreenProps {
  onLogin: (email: string, password: string) => Promise<{ error: string | null }>;
  onSwitchToRegister: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin, onSwitchToRegister }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;

    setLoading(true);
    setError('');

    const result = await onLogin(email.trim(), password.trim());
    if (result.error) {
      setError(result.error === 'Invalid login credentials'
        ? 'Email o contraseña incorrectos'
        : result.error);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-yn-neutral-900 flex flex-col items-center justify-center px-4">
      {/* Logo */}
      <div className="mb-8 text-center">
        <div className="flex justify-center mb-4">
          <YunaiLogo size={80} />
        </div>
        <h1 className="font-brand text-3xl text-white mb-1">YUNAI</h1>
        <p className="text-yn-neutral-400 text-sm">Tu gestor de finanzas personales</p>
      </div>

      {/* Login Form */}
      <div className="w-full max-w-sm bg-yn-neutral-800 rounded-2xl p-6 border border-yn-neutral-700 shadow-xl">
        <h2 className="text-xl font-bold text-white mb-6 text-center">Iniciar sesión</h2>

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
                placeholder="••••••••"
                required
                autoComplete="current-password"
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
          </div>

          {/* Error */}
          {error && (
            <p className="text-red-400 text-sm text-center bg-red-400/10 rounded-lg py-2 px-3">{error}</p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || !email || !password}
            className={`w-full py-3 rounded-xl font-bold text-white shadow-lg transition-all transform active:scale-95 flex items-center justify-center gap-2
              ${loading ? 'opacity-50 cursor-not-allowed bg-gray-500' : 'bg-yn-primary-500 hover:bg-yn-primary-700'}`}
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <LogIn size={18} />
                Iniciar sesión
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-yn-neutral-600" />
          <span className="text-xs text-yn-neutral-500">o</span>
          <div className="flex-1 h-px bg-yn-neutral-600" />
        </div>

        {/* Register link */}
        <button
          onClick={onSwitchToRegister}
          className="w-full py-3 rounded-xl font-semibold text-yn-primary-500 border border-yn-primary-500/30 hover:bg-yn-primary-500/10 transition-all flex items-center justify-center gap-2"
        >
          <UserPlus size={18} />
          Crear cuenta nueva
        </button>
      </div>

      {/* Footer */}
      <p className="mt-6 text-yn-neutral-500 text-xs text-center">
        yunai — gestión financiera inteligente
      </p>
    </div>
  );
};
