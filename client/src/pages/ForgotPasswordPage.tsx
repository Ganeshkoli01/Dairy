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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 py-12 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl relative z-10">
        <div className="flex flex-col items-center text-center mb-6">
          <div className="p-3 bg-gradient-to-tr from-cyan-500 to-blue-600 rounded-2xl text-white shadow-lg shadow-cyan-500/20 mb-3">
            <Lock className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Reset Password</h1>
          <p className="text-xs text-slate-400 mt-1">
            {step === 1 && "Enter your email to receive an OTP"}
            {step === 2 && "Enter the 6-digit OTP sent to your email"}
            {step === 3 && "Create your new password"}
          </p>
        </div>

        {error && !error.field && (
          <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-400 text-sm flex items-center gap-3">
            <Lock className="w-5 h-5 shrink-0 text-rose-500" />
            <p className="leading-relaxed">{error.message}</p>
          </div>
        )}

        {successMsg && (
          <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-400 text-sm flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-500" />
            <p className="leading-relaxed">{successMsg}</p>
          </div>
        )}

        {step === 1 && (
          <form onSubmit={handleSendOtp} className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full bg-slate-950 border ${error?.field === 'email' ? 'border-rose-500' : 'border-slate-800'} rounded-2xl py-3 pl-10 pr-4 text-sm text-slate-200 focus:outline-none focus:border-cyan-500`}
                  placeholder="name@example.com"
                />
              </div>
              {error?.field === 'email' && <p className="text-xs text-rose-500 mt-1">{error.message}</p>}
            </div>

            <button type="submit" disabled={loading} className="w-full mt-6 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-medium py-3 rounded-2xl flex justify-center items-center gap-2 hover:shadow-cyan-500/25 transition-all">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Send OTP <ArrowRight className="w-4 h-4" /></>}
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleVerifyOtp} className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1">6-Digit OTP</label>
              <div className="relative">
                <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  required
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className={`w-full bg-slate-950 border ${error?.field === 'otp' ? 'border-rose-500' : 'border-slate-800'} rounded-2xl py-3 pl-10 pr-4 text-sm tracking-widest text-slate-200 focus:outline-none focus:border-cyan-500`}
                  placeholder="------"
                  maxLength={6}
                />
              </div>
              {error?.field === 'otp' && <p className="text-xs text-rose-500 mt-1">{error.message}</p>}
            </div>
            
            <button type="button" onClick={handleSendOtp} className="text-xs text-cyan-500 hover:text-cyan-400">
              {loading ? 'Resending...' : 'Resend OTP'}
            </button>

            <button type="submit" className="w-full mt-6 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-medium py-3 rounded-2xl flex justify-center items-center gap-2 hover:shadow-cyan-500/25 transition-all">
              Verify OTP <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {step === 3 && (
          <form onSubmit={handleResetPassword} className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1">New Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 pl-10 pr-4 text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`w-full bg-slate-950 border ${error?.field === 'confirmPassword' ? 'border-rose-500' : 'border-slate-800'} rounded-2xl py-3 pl-10 pr-4 text-sm text-slate-200 focus:outline-none focus:border-cyan-500`}
                  placeholder="••••••••"
                />
              </div>
              {error?.field === 'confirmPassword' && <p className="text-xs text-rose-500 mt-1">{error.message}</p>}
              {error?.field === 'reset' && <p className="text-xs text-rose-500 mt-1">{error.message}</p>}
            </div>

            <button type="submit" disabled={loading} className="w-full mt-6 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-medium py-3 rounded-2xl flex justify-center items-center gap-2 hover:shadow-cyan-500/25 transition-all disabled:opacity-70">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Reset Password'}
            </button>
          </form>
        )}

        <div className="mt-6 text-center">
          <Link to="/login" className="text-sm text-slate-400 hover:text-cyan-400 transition-colors">
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
};
