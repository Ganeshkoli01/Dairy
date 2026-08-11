import React, { useState } from 'react';
import { Mail, Check, AlertCircle, Loader2, Calendar, Building2 } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { Branch } from '../types/branch';

interface StatementGeneratorProps {
  branches: Branch[];
  selectedBranch: string;
  setSelectedBranch: (id: string) => void;
}

export const StatementGenerator: React.FC<StatementGeneratorProps> = ({ 
  branches, 
  selectedBranch, 
  setSelectedBranch 
}) => {
  const { user } = useAuth();
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [period, setPeriod] = useState(1);
  const [sending, setSending] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSendStatements = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      const response = await api.post(
        `/billing/send-statements`,
        { branchId: selectedBranch, year, month, period }
      );
      setSuccessMsg(response.data.message);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to send statements.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md mt-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex items-center space-x-3 mb-6 border-b border-slate-800 pb-4">
        <div className="p-2 bg-purple-500/10 rounded-xl text-purple-400">
          <Mail className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-100">10-Day Farmer Statements</h2>
          <p className="text-xs text-slate-400">Email collection summaries and payment dues directly to farmers.</p>
        </div>
      </div>

      {successMsg && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-start space-x-3">
          <Check className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-emerald-300">{successMsg}</div>
        </div>
      )}

      {errorMsg && (
        <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-rose-300">{errorMsg}</div>
        </div>
      )}

      <form onSubmit={handleSendStatements} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Branch Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Target Branch *
            </label>
            <div className="flex items-center space-x-2 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5">
              <Building2 className="w-4 h-4 text-slate-500" />
              {user?.role === 'dairyOwner' ? (
                <div className="text-slate-200 text-sm font-semibold w-full">
                  {branches.length > 0 ? `${branches[0].name} (${branches[0].code})` : 'Loading...'}
                </div>
              ) : (
                <select
                  required
                  value={selectedBranch}
                  onChange={(e) => setSelectedBranch(e.target.value)}
                  className="bg-transparent border-none text-slate-200 text-sm focus:outline-none w-full cursor-pointer"
                >
                  <option value="" disabled className="bg-slate-900 text-slate-200">Select Branch</option>
                  {branches.map((b) => (
                    <option key={b._id} value={b._id} className="bg-slate-900 text-slate-200">
                      {b.name} ({b.code})
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Year Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Billing Year *
            </label>
            <div className="flex items-center space-x-2 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5">
              <Calendar className="w-4 h-4 text-slate-500" />
              <select
                required
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="bg-transparent border-none text-slate-200 text-sm focus:outline-none w-full cursor-pointer"
              >
                {[...Array(5)].map((_, i) => (
                  <option key={i} value={new Date().getFullYear() - i} className="bg-slate-900">
                    {new Date().getFullYear() - i}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Month Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Billing Month *
            </label>
            <div className="flex items-center space-x-2 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5">
              <Calendar className="w-4 h-4 text-slate-500" />
              <select
                required
                value={month}
                onChange={(e) => setMonth(Number(e.target.value))}
                className="bg-transparent border-none text-slate-200 text-sm focus:outline-none w-full cursor-pointer"
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => {
                  const monthName = new Date(year, m - 1, 1).toLocaleString('default', { month: 'long' });
                  return (
                    <option key={m} value={m} className="bg-slate-900">
                      {monthName}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          {/* Period Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Billing Period *
            </label>
            <div className="flex items-center space-x-2 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5">
              <Calendar className="w-4 h-4 text-slate-500" />
              <select
                required
                value={period}
                onChange={(e) => setPeriod(Number(e.target.value))}
                className="bg-transparent border-none text-slate-200 text-sm focus:outline-none w-full cursor-pointer"
              >
                <option value={1} className="bg-slate-900">Period 1 (1st - 10th)</option>
                <option value={2} className="bg-slate-900">Period 2 (11th - 20th)</option>
                <option value={3} className="bg-slate-900">Period 3 (21st - End of Month)</option>
              </select>
            </div>
          </div>

        </div>

        <div className="pt-4 border-t border-slate-800 flex items-center justify-end">
          <button
            type="submit"
            disabled={sending || (!selectedBranch && user?.role !== 'dairyOwner')}
            className="flex items-center justify-center space-x-2 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white font-medium text-sm px-6 py-3 rounded-xl shadow-lg shadow-purple-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sending ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Sending Statements...</span>
              </>
            ) : (
              <>
                <Mail className="w-5 h-5" />
                <span>Send Emails to Farmers</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
