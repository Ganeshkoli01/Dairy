import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { reportApi } from '../api/reportApi';
import { AdminDashboardData } from '../types/adminDashboard';
import { useAuth } from '../context/AuthContext';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import {
  Milk,
  Building2,
  UserCheck,
  FileText,
  ArrowUpRight,
  Shield,
  Loader2,
  AlertCircle,
  Scale,
  Grid,
} from 'lucide-react';

export const OwnerDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      setError(null);
      try {
        const stats = await reportApi.getAdminDashboardStats();
        setData(stats);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load owner dashboard overview');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-slate-400">
        <Loader2 className="w-10 h-10 animate-spin text-cyan-400 mb-3" />
        <p className="text-sm font-medium">Loading branch dashboard overview...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-center space-x-3 max-w-2xl mx-auto my-8">
        <AlertCircle className="w-6 h-6 text-rose-400 flex-shrink-0" />
        <div>
          <p className="font-semibold">Dashboard Access Failed</p>
          <p className="text-xs text-rose-400/80 mt-0.5">{error}</p>
        </div>
      </div>
    );
  }

  const today = data?.today || {
    totalLiters: 0,
    totalAmount: 0,
    totalEntries: 0,
    cowLiters: 0,
    cowAmount: 0,
    buffaloLiters: 0,
    buffaloAmount: 0,
  };

  const trendData = data?.trend14Days || [];
  const branchWise = data?.branchWiseToday || [];

  return (
    <div className="space-y-6">
      {/* Executive Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-gradient-to-tr from-cyan-500 to-blue-600 rounded-xl text-white shadow-lg shadow-cyan-500/20">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-bold text-slate-100">Dairy Owner Dashboard</h1>
              <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                {user?.dairyOwnerProfile?.branchName || 'OWNER ROLE'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Real-time daily collection metrics and 10-day trends for your branch
            </p>
          </div>
        </div>

        <Link
          to="/collection/entry"
          className="flex items-center justify-center space-x-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-medium text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-emerald-500/20 transition-all"
        >
          <Scale className="w-4 h-4" />
          <span>Go to Milk Entry Form</span>
        </Link>
      </div>

      {/* 1. TODAY OVERVIEW METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Today Collection */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10 text-cyan-400">
            <Milk className="w-16 h-16" />
          </div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
            Today Total Collection
          </p>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-cyan-300 font-mono">
              {today.totalLiters} L
            </span>
            <span className="text-xs text-slate-500 font-semibold font-mono">
              ({today.totalEntries} entries)
            </span>
          </div>
          <p className="text-sm font-extrabold text-emerald-400 font-mono mt-2">
            ₹{today.totalAmount.toFixed(2)} Total Value
          </p>
        </div>

        {/* Card 2: Cow Milk Split */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10 text-amber-400">
            <Milk className="w-16 h-16" />
          </div>
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-semibold text-amber-300 uppercase tracking-wider">
              Cow Milk Today
            </p>
          </div>
          <p className="text-3xl font-extrabold text-amber-100 font-mono">
            {today.cowLiters} L
          </p>
          <p className="text-sm font-bold text-amber-400/80 font-mono mt-2">
            ₹{today.cowAmount.toFixed(2)}
          </p>
        </div>

        {/* Card 3: Buffalo Milk Split */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10 text-purple-400">
            <Milk className="w-16 h-16" />
          </div>
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-semibold text-purple-300 uppercase tracking-wider">
              Buffalo Milk Today
            </p>
          </div>
          <p className="text-3xl font-extrabold text-purple-100 font-mono">
            {today.buffaloLiters} L
          </p>
          <p className="text-sm font-bold text-purple-400/80 font-mono mt-2">
            ₹{today.buffaloAmount.toFixed(2)}
          </p>
        </div>

        {/* Card 4: Ratio */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-center relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5 text-slate-100">
            <UserCheck className="w-16 h-16" />
          </div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
            Cow vs Buffalo Ratio
          </p>
          <div className="flex h-3 w-full rounded-full overflow-hidden mb-2">
            <div
              className="bg-amber-400 transition-all duration-1000"
              style={{ width: `${today.totalLiters ? (today.cowLiters / today.totalLiters) * 100 : 50}%` }}
            />
            <div
              className="bg-purple-500 transition-all duration-1000"
              style={{ width: `${today.totalLiters ? (today.buffaloLiters / today.totalLiters) * 100 : 50}%` }}
            />
          </div>
          <div className="flex justify-between text-[11px] font-bold">
            <span className="text-amber-400">Cow: {today.totalLiters ? Math.round((today.cowLiters / today.totalLiters) * 100) : 0}%</span>
            <span className="text-purple-400">Buf: {today.totalLiters ? Math.round((today.buffaloLiters / today.totalLiters) * 100) : 0}%</span>
          </div>
        </div>
      </div>

      {/* 2. 10-DAY TREND CHART */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-5 border-b border-slate-800">
          <h2 className="text-base font-bold text-slate-100 flex items-center space-x-2">
            <ArrowUpRight className="w-5 h-5 text-cyan-400" />
            <span>10-Day Collection Volume Trend</span>
          </h2>
        </div>
        <div className="p-5 h-[320px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorCow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="colorBuf" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#a855f7" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#a855f7" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <YAxis stroke="#64748b" tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '0.75rem' }}
                itemStyle={{ color: '#f8fafc' }}
              />
              <Legend wrapperStyle={{ fontSize: '0.75rem', paddingTop: '10px' }} />
              <Area type="monotone" dataKey="cowLiters" name="Cow Milk (L)" stroke="#f59e0b" fillOpacity={1} fill="url(#colorCow)" />
              <Area type="monotone" dataKey="buffaloLiters" name="Buffalo Milk (L)" stroke="#a855f7" fillOpacity={1} fill="url(#colorBuf)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 3. QUICK LINKS PANEL FOR OWNER MANAGEMENT */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link
          to="/reports"
          className="group p-5 bg-slate-900 hover:bg-slate-800/80 border border-slate-800 hover:border-indigo-500/40 rounded-2xl transition-all shadow-lg flex items-center justify-between"
        >
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-400 group-hover:scale-110 transition-transform">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-100 group-hover:text-indigo-300 transition-colors">
                Reports &amp; Billing
              </h3>
              <p className="text-[11px] text-slate-400">View ledger &amp; calculate payouts</p>
            </div>
          </div>
          <ArrowUpRight className="w-5 h-5 text-slate-500 group-hover:text-indigo-400 transition-colors" />
        </Link>
        <Link
          to="/collection/entry"
          className="group p-5 bg-slate-900 hover:bg-slate-800/80 border border-slate-800 hover:border-emerald-500/40 rounded-2xl transition-all shadow-lg flex items-center justify-between"
        >
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400 group-hover:scale-110 transition-transform">
              <Scale className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-100 group-hover:text-emerald-300 transition-colors">
                Milk Entry Form
              </h3>
              <p className="text-[11px] text-slate-400">Collect milk &amp; measure FAT</p>
            </div>
          </div>
          <ArrowUpRight className="w-5 h-5 text-slate-500 group-hover:text-emerald-400 transition-colors" />
        </Link>
        <Link
          to="/owner/farmers"
          className="group p-5 bg-slate-900 hover:bg-slate-800/80 border border-slate-800 hover:border-cyan-500/40 rounded-2xl transition-all shadow-lg flex items-center justify-between"
        >
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-cyan-500/10 rounded-xl text-cyan-400 group-hover:scale-110 transition-transform">
              <UserCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-100 group-hover:text-cyan-300 transition-colors">
                Farmers (सभासद)
              </h3>
              <p className="text-[11px] text-slate-400">Manage member codes</p>
            </div>
          </div>
          <ArrowUpRight className="w-5 h-5 text-slate-500 group-hover:text-cyan-400 transition-colors" />
        </Link>

        <Link
          to="/owner/rate-chart"
          className="group p-5 bg-slate-900 hover:bg-slate-800/80 border border-slate-800 hover:border-amber-500/40 rounded-2xl transition-all shadow-lg flex items-center justify-between"
        >
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-amber-500/10 rounded-xl text-amber-400 group-hover:scale-110 transition-transform">
              <Grid className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-100 group-hover:text-amber-300 transition-colors">
                Rate Chart (दर पत्रक)
              </h3>
              <p className="text-[11px] text-slate-400">FAT x SNF matrix</p>
            </div>
          </div>
          <ArrowUpRight className="w-5 h-5 text-slate-500 group-hover:text-amber-400 transition-colors" />
        </Link>
      </div>
    </div>
  );
};
