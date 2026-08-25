import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Milk, Lock, Mail, Loader2, Eye, EyeOff } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await login({ email: email.trim(), password });
      
      // We need to read the updated user from context or local storage 
      // But since state might not be updated synchronously, we check local storage
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');
      if (token && userStr) {
        const user = JSON.parse(userStr);
        if (user.role === 'admin') navigate('/admin/dashboard');
        else if (user.role === 'dairyOwner') navigate('/owner/dashboard');
        else navigate('/farmer/collections');
      } else {
        navigate('/dashboard'); // fallback
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen text-slate-100 flex flex-col justify-center items-center p-4 relative overflow-hidden bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: "url('/workflow-bg.jpg')" }}
    >
      {/* Subtle tint to ensure text contrast while keeping the illustration totally vibrant */}
      <div className="absolute inset-0 bg-blue-950/10 z-0"></div>

      {/* Animated glowing orbs in the background */}
      <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-cyan-400/20 rounded-full blur-[100px] animate-pulse z-0" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-indigo-500/20 rounded-full blur-[100px] animate-pulse delay-700 z-0" />

      {/* Ultra-Premium Glassmorphism Login Card */}
      <div className="w-full max-w-md bg-[#0f172a]/40 backdrop-blur-md border border-white/10 rounded-[2.5rem] p-8 sm:p-10 shadow-[0_8px_32px_rgba(0,0,0,0.5)] relative z-10">
        
        <div className="flex flex-col items-center text-center mb-10">
          <div className="mb-6 flex justify-center">
            <div className="p-1 bg-gradient-to-tr from-cyan-400/50 to-blue-500/50 rounded-2xl shadow-lg">
              <img 
                src="/gk_logo.png" 
                alt="GK Dairy Logo" 
                className="h-20 w-auto object-contain rounded-xl bg-white p-2" 
              />
            </div>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight drop-shadow-lg">GK DAIRY</h1>
          <p className="text-sm text-white/80 mt-2 font-medium drop-shadow-md">Welcome back! Let's manage your dairy.</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/20 backdrop-blur-md border border-red-500/30 rounded-2xl text-white text-sm flex items-center gap-3 shadow-inner">
            <Lock className="w-5 h-5 shrink-0 text-red-300" />
            <p className="leading-relaxed font-medium">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-white/90 uppercase tracking-wider ml-1 drop-shadow-sm">Email Address</label>
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/60 group-focus-within:text-white transition-colors" />
              <input
                type="email"
                required
                className="w-full bg-white/5 backdrop-blur-sm border border-white/20 rounded-2xl py-4 pl-12 pr-4 text-white placeholder-white/50 focus:outline-none focus:bg-white/10 focus:border-white/50 focus:ring-4 focus:ring-white/10 transition-all shadow-inner"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center ml-1">
              <label className="text-xs font-bold text-white/90 uppercase tracking-wider drop-shadow-sm">Password</label>
              <Link to="/forgot-password" className="text-xs text-white/80 hover:text-white font-bold drop-shadow-sm transition-colors">Forgot Password?</Link>
            </div>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/60 group-focus-within:text-white transition-colors" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                className="w-full bg-white/5 backdrop-blur-sm border border-white/20 rounded-2xl py-4 pl-12 pr-12 text-white placeholder-white/50 focus:outline-none focus:bg-white/10 focus:border-white/50 focus:ring-4 focus:ring-white/10 transition-all shadow-inner"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/60 hover:text-white transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-10 bg-white/20 hover:bg-white/30 backdrop-blur-md text-white font-bold py-4 rounded-2xl shadow-[0_4px_15px_rgba(0,0,0,0.1)] hover:shadow-[0_8px_25px_rgba(255,255,255,0.2)] hover:-translate-y-1 active:translate-y-0 transition-all duration-300 disabled:opacity-50 flex justify-center items-center gap-2 text-lg border border-white/40"
          >
            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
};
