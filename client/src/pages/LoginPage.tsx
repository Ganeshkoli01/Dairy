import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Role } from '../types/auth';
import {
  Milk,
  Lock,
  Mail,
  User as UserIcon,
  Phone,
  Shield,
  UserCheck,
  AlertCircle,
  ArrowRight,
  Loader2,
  Eye,
  EyeOff,
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [isRegisterMode, setIsRegisterMode] = useState<boolean>(false);

  // Form Field States
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('ganeshkoli0149@gmail.com');
  const [phone, setPhone] = useState<string>('');
  const [password, setPassword] = useState<string>('ganeshkoli@0149');
  const [role, setRole] = useState<Role>('owner');

  const [showPassword, setShowPassword] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isRegisterMode) {
        if (!name.trim()) {
          setError('Please enter your full name');
          setLoading(false);
          return;
        }
        await register({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          password,
          role,
        });
      } else {
        await login({ email: email.trim(), password });
      }
      navigate('/collection/entry');
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          (isRegisterMode
            ? 'Registration failed. Please check your details.'
            : 'Login failed. Please check your credentials.')
      );
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (preset: 'owner' | 'user') => {
    setIsRegisterMode(false);
    if (preset === 'owner') {
      setEmail('ganeshkoli0149@gmail.com');
      setPassword('ganeshkoli@0149');
    } else {
      setEmail('operator@dairy.com');
      setPassword('password123');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Dynamic Background Glow Effect */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl relative z-10">
        {/* Header Branding */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="p-3 bg-gradient-to-tr from-cyan-500 to-blue-600 rounded-2xl text-white shadow-lg shadow-cyan-500/20 mb-3">
            <Milk className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Dairy Collection</h1>
          <p className="text-xs text-slate-400 mt-1">Milk Management &amp; Rate Chart System</p>
        </div>

        {/* MODE SWITCH TABS */}
        <div className="flex items-center p-1 bg-slate-950 border border-slate-800 rounded-2xl mb-6">
          <button
            type="button"
            onClick={() => {
              setIsRegisterMode(false);
              setError(null);
            }}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
              !isRegisterMode
                ? 'bg-slate-800 text-cyan-400 border border-slate-700 shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Sign In (लॉग इन)
          </button>
          <button
            type="button"
            onClick={() => {
              setIsRegisterMode(true);
              setError(null);
            }}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
              isRegisterMode
                ? 'bg-slate-800 text-cyan-400 border border-slate-700 shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Register (नवीन नाव नोंदणी)
          </button>
        </div>

        {error && (
          <div className="mb-5 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-3">
            <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Registration Mode Extra Fields: Name, Phone, Role */}
          {isRegisterMode && (
            <>
              {/* Full Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Full Name (पूर्ण नाव) *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <UserIcon className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Ganesh Koli"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-600 outline-none"
                  />
                </div>
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Phone Number (मोबाइल नंबर)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Phone className="w-4 h-4" />
                  </div>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. 9876543210"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-600 outline-none"
                  />
                </div>
              </div>

              {/* Role Selection Option: Only Owner and User */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Select Role (भूमिका निवडा) *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRole('owner')}
                    className={`p-3 rounded-xl border flex flex-col items-center justify-center text-center transition-all ${
                      role === 'owner'
                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                    }`}
                  >
                    <Shield className="w-5 h-5 mb-1 text-cyan-400" />
                    <span className="text-xs font-bold">👑 Owner (मालक)</span>
                    <span className="text-[10px] text-slate-400">Full Access</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole('user')}
                    className={`p-3 rounded-xl border flex flex-col items-center justify-center text-center transition-all ${
                      role === 'user'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                    }`}
                  >
                    <UserCheck className="w-5 h-5 mb-1 text-emerald-400" />
                    <span className="text-xs font-bold">👤 User (वापरकर्ता)</span>
                    <span className="text-[10px] text-slate-400">Collection &amp; Entry</span>
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Email Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Email Address *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@dairy.com"
                className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-600 outline-none"
              />
            </div>
          </div>

          {/* Password Input with Show/Hide Toggle */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Password *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl pl-10 pr-10 py-2.5 text-sm font-mono text-slate-100 placeholder-slate-600 outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 transition-colors"
                title={showPassword ? 'Hide Password' : 'Show Password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold text-sm py-3 px-4 rounded-xl shadow-lg shadow-cyan-500/25 transition-all flex items-center justify-center space-x-2 disabled:opacity-50 mt-2"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <span>{isRegisterMode ? 'Create Account & Sign In' : 'Sign In to System'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Quick Credentials Switcher */}
        {!isRegisterMode && (
          <div className="mt-6 pt-5 border-t border-slate-800">
            <p className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold text-center mb-3">
              Quick Fill Configured Accounts
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickFill('owner')}
                className="flex items-center justify-center space-x-1.5 p-2 bg-slate-950 hover:bg-slate-800/80 border border-slate-800 rounded-xl text-xs text-cyan-300 font-medium transition-colors"
              >
                <Shield className="w-3.5 h-3.5 text-cyan-400" />
                <span>Fill Owner (Ganesh)</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill('user')}
                className="flex items-center justify-center space-x-1.5 p-2 bg-slate-950 hover:bg-slate-800/80 border border-slate-800 rounded-xl text-xs text-emerald-300 font-medium transition-colors"
              >
                <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Fill User</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
