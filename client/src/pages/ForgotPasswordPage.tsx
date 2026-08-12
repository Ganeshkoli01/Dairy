import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authApi } from '../api/authApi';
import { Mail, Lock, Key, Loader2, ArrowRight, CheckCircle2 } from 'lucide-react';

export const ForgotPasswordPage: React.FC = () => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<{ field?: string; message: string } | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const navigate = useNavigate();

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      setError({ field: 'email', message: 'Email is required' });
      return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError({ field: 'email', message: 'Please enter a valid email address' });
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await authApi.forgotPassword(email);
      setSuccessMsg(res.message + (res.previewUrl ? ` (Preview: ${res.previewUrl})` : ''));
      setStep(2);
    } catch (err: any) {
      setError({ field: 'email', message: err.response?.data?.message || 'Failed to send reset link' });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      setError({ field: 'otp', message: 'OTP must be 6 digits' });
      return;
    }
    setError(null);
    setSuccessMsg(null);
    setStep(3);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError({ field: 'confirmPassword', message: 'Passwords do not match' });
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await authApi.resetPassword({ email, otp, newPassword });
      setSuccessMsg(res.message);
      // Wait a moment before redirecting
      setTimeout(() => navigate('/login'), 3000);
    } catch (err: any) {
      setError({ field: 'reset', message: err.response?.data?.message || 'Failed to reset password' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen text-slate-100 flex flex-col justify-center items-center p-4 relative overflow-hidden bg-cover bg-top bg-no-repeat"
      style={{ backgroundImage: "url('/login-bg.png')" }}
    >
      <div className="absolute inset-0 bg-blue-950/10 z-0"></div>
      <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-cyan-400/30 rounded-full blur-[100px] animate-pulse z-0" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-500/30 rounded-full blur-[100px] animate-pulse delay-700 z-0" />

      <div className="w-full max-w-md bg-slate-950/70 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-8 sm:p-10 shadow-[0_8px_32px_rgba(0,0,0,0.4)] relative z-10">
        
        <div className="flex flex-col items-center text-center mb-8">
          <div className="p-3 bg-gradient-to-tr from-cyan-400/50 to-blue-500/50 rounded-2xl shadow-lg mb-4">
            <Lock className="w-8 h-8 text-white drop-shadow-md" />
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight drop-shadow-lg">Reset Password</h1>
          <p className="text-sm text-white/80 mt-2 font-medium drop-shadow-md">
            {step === 1 && "Enter your email to receive an OTP"}
            {step === 2 && "Enter the 6-digit OTP sent to your email"}
            {step === 3 && "Create your new password"}
          </p>
        </div>

        {error && !error.field && (
          <div className="mb-6 p-4 bg-red-500/20 backdrop-blur-md border border-red-500/30 rounded-2xl text-white text-sm flex items-center gap-3 shadow-inner">
            <Lock className="w-5 h-5 shrink-0 text-red-300" />
            <p className="leading-relaxed font-medium">{error.message}</p>
          </div>
        )}

        {successMsg && (
          <div className="mb-6 p-4 bg-emerald-500/20 backdrop-blur-md border border-emerald-500/30 rounded-2xl text-white text-sm flex items-center gap-3 shadow-inner">
            <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-300" />
            <p className="leading-relaxed font-medium">{successMsg}</p>
          </div>
        )}

        {step === 1 && (
          <form onSubmit={handleSendOtp} className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="space-y-2">
              <label className="text-xs font-bold text-white/90 uppercase tracking-wider ml-1 drop-shadow-sm">Email Address</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/60 group-focus-within:text-white transition-colors" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full bg-white/5 backdrop-blur-sm border ${error?.field === 'email' ? 'border-red-400/50 focus:border-red-400 focus:ring-red-400/20' : 'border-white/20 focus:border-white/50 focus:ring-white/10'} rounded-2xl py-4 pl-12 pr-4 text-white placeholder-white/50 focus:outline-none focus:bg-white/10 focus:ring-4 transition-all shadow-inner`}
                  placeholder="name@example.com"
                />
              </div>
              {error?.field === 'email' && <p className="text-xs text-red-300 font-medium mt-1 ml-1">{error.message}</p>}
            </div>

            <button type="submit" disabled={loading} className="w-full mt-10 bg-white/20 hover:bg-white/30 backdrop-blur-md text-white font-bold py-4 rounded-2xl shadow-[0_4px_15px_rgba(0,0,0,0.1)] hover:shadow-[0_8px_25px_rgba(255,255,255,0.2)] hover:-translate-y-1 active:translate-y-0 transition-all duration-300 disabled:opacity-50 flex justify-center items-center gap-2 text-lg border border-white/40">
              {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <>Send OTP <ArrowRight className="w-5 h-5" /></>}
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleVerifyOtp} className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="space-y-2">
              <label className="text-xs font-bold text-white/90 uppercase tracking-wider ml-1 drop-shadow-sm">6-Digit OTP</label>
              <div className="relative group">
                <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/60 group-focus-within:text-white transition-colors" />
                <input
                  type="text"
                  required
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className={`w-full bg-white/5 backdrop-blur-sm border ${error?.field === 'otp' ? 'border-red-400/50 focus:border-red-400 focus:ring-red-400/20' : 'border-white/20 focus:border-white/50 focus:ring-white/10'} rounded-2xl py-4 pl-12 pr-4 text-white tracking-widest placeholder-white/50 focus:outline-none focus:bg-white/10 focus:ring-4 transition-all shadow-inner`}
                  placeholder="------"
                  maxLength={6}
                />
              </div>
              {error?.field === 'otp' && <p className="text-xs text-red-300 font-medium mt-1 ml-1">{error.message}</p>}
            </div>
            
            <div className="text-center">
              <button type="button" onClick={handleSendOtp} className="text-xs text-white/80 hover:text-white font-bold drop-shadow-sm transition-colors">
                {loading ? 'Resending...' : 'Resend OTP'}
              </button>
            </div>

            <button type="submit" className="w-full mt-6 bg-white/20 hover:bg-white/30 backdrop-blur-md text-white font-bold py-4 rounded-2xl shadow-[0_4px_15px_rgba(0,0,0,0.1)] hover:shadow-[0_8px_25px_rgba(255,255,255,0.2)] hover:-translate-y-1 active:translate-y-0 transition-all duration-300 flex justify-center items-center gap-2 text-lg border border-white/40">
              Verify OTP <ArrowRight className="w-5 h-5" />
            </button>
          </form>
        )}

        {step === 3 && (
          <form onSubmit={handleResetPassword} className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="space-y-2">
              <label className="text-xs font-bold text-white/90 uppercase tracking-wider ml-1 drop-shadow-sm">New Password</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/60 group-focus-within:text-white transition-colors" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-white/5 backdrop-blur-sm border border-white/20 rounded-2xl py-4 pl-12 pr-4 text-white placeholder-white/50 focus:outline-none focus:bg-white/10 focus:border-white/50 focus:ring-4 focus:ring-white/10 transition-all shadow-inner"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-white/90 uppercase tracking-wider ml-1 drop-shadow-sm">Confirm Password</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/60 group-focus-within:text-white transition-colors" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`w-full bg-white/5 backdrop-blur-sm border ${error?.field === 'confirmPassword' ? 'border-red-400/50 focus:border-red-400 focus:ring-red-400/20' : 'border-white/20 focus:border-white/50 focus:ring-white/10'} rounded-2xl py-4 pl-12 pr-4 text-white placeholder-white/50 focus:outline-none focus:bg-white/10 focus:ring-4 transition-all shadow-inner`}
                  placeholder="••••••••"
                />
              </div>
              {error?.field === 'confirmPassword' && <p className="text-xs text-red-300 font-medium mt-1 ml-1">{error.message}</p>}
              {error?.field === 'reset' && <p className="text-xs text-red-300 font-medium mt-1 ml-1">{error.message}</p>}
            </div>

            <button type="submit" disabled={loading} className="w-full mt-10 bg-white/20 hover:bg-white/30 backdrop-blur-md text-white font-bold py-4 rounded-2xl shadow-[0_4px_15px_rgba(0,0,0,0.1)] hover:shadow-[0_8px_25px_rgba(255,255,255,0.2)] hover:-translate-y-1 active:translate-y-0 transition-all duration-300 disabled:opacity-50 flex justify-center items-center gap-2 text-lg border border-white/40">
              {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Reset Password'}
            </button>
          </form>
        )}

        <div className="mt-8 pt-6 border-t border-white/20 text-center">
          <Link to="/login" className="text-sm text-white/80 hover:text-white font-bold drop-shadow-sm transition-colors">
            &larr; Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
};
