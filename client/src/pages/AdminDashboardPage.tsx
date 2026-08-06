import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { reportApi } from '../api/reportApi';
import { AdminDashboardData } from '../types/adminDashboard';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
} from 'recharts';
import {
  Milk,
  Building2,
  UserCheck,
  Grid,
  FileText,
  TrendingUp,
  ArrowUpRight,
  Shield,
  Loader2,
  AlertCircle,
  Scale,
} from 'lucide-react';

export const AdminDashboardPage: React.FC = () => {
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
        setError(err.response?.data?.message || 'Failed to load admin dashboard overview');
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
        <p className="text-sm font-medium">Loading executive dashboard overview...</p>
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
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-bold text-slate-100">Executive Admin Dashboard</h1>
              <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                ADMIN ROLE
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Real-time daily collection metrics, branch performance, and 10-day trends
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
              🐮 Cow Milk (गाय)
            </p>
            <span className="text-[10px] font-mono bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded border border-amber-500/30 font-bold">
              {today.totalLiters > 0 ? Math.round((today.cowLiters / today.totalLiters) * 100) : 0}% Share
            </span>
          </div>
          <div className="text-2xl font-extrabold text-slate-100 font-mono">
            {today.cowLiters} L
          </div>
          <p className="text-sm font-bold text-amber-300 font-mono mt-2">
            ₹{today.cowAmount.toFixed(2)} Value
          </p>
        </div>

        {/* Card 3: Buffalo Milk Split */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10 text-purple-400">
            <Milk className="w-16 h-16" />
          </div>
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-semibold text-purple-300 uppercase tracking-wider">
              🦬 Buffalo Milk (म्हैस)
            </p>
            <span className="text-[10px] font-mono bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded border border-purple-500/30 font-bold">
              {today.totalLiters > 0 ? Math.round((today.buffaloLiters / today.totalLiters) * 100) : 0}% Share
            </span>
          </div>
          <div className="text-2xl font-extrabold text-slate-100 font-mono">
            {today.buffaloLiters} L
          </div>
          <p className="text-sm font-bold text-purple-300 font-mono mt-2">
            ₹{today.buffaloAmount.toFixed(2)} Value
          </p>
        </div>

        {/* Card 4: Active Network Overview */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden flex flex-col justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Active Branches Network
            </p>
            <div className="text-2xl font-extrabold text-slate-100 font-mono">
              {branchWise.length} Branches Active
            </div>
          </div>
          <div className="pt-2 text-xs text-slate-400 flex items-center space-x-1">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <span>High-frequency real-time syncing</span>
          </div>
        </div>
      </div>

      {/* 2. RECHARTS: 10-DAY COLLECTION TREND CHART */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-cyan-400" />
            <h2 className="text-lg font-bold text-slate-100">
              10-Day Collection Trend (Liters over Time)
            </h2>
          </div>
          <span className="text-xs font-mono text-slate-400">Cow vs Buffalo Breakdown</span>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
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

      {/* 3. BRANCH-WISE TODAY COMPARISON TABLE */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Building2 className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-bold text-slate-100">
              Branch-Wise Today Performance Comparison
            </h2>
          </div>
          <span className="text-xs text-slate-400 font-mono font-semibold">
            {branchWise.length} Active Centers
          </span>
        </div>

        {branchWise.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm">
            No collection entries recorded for today across branches yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse font-mono text-xs">
              <thead>
                <tr className="bg-slate-950/80 text-slate-400 uppercase text-[11px] font-semibold tracking-wider border-b border-slate-800">
                  <th className="py-3.5 px-6 font-sans">Branch Code</th>
                  <th className="py-3.5 px-6 font-sans">Branch Name</th>
                  <th className="py-3.5 px-6 text-right font-sans">Total Liters</th>
                  <th className="py-3.5 px-6 text-right text-amber-300 font-sans">Cow (L)</th>
                  <th className="py-3.5 px-6 text-right text-purple-300 font-sans">Buffalo (L)</th>
                  <th className="py-3.5 px-6 text-right text-emerald-400 font-sans">Today Amount (₹)</th>
                  <th className="py-3.5 px-6 text-right font-sans">Entries</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {branchWise.map((b) => (
                  <tr key={b._id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-4 px-6 font-bold text-cyan-400">{b.branchCode}</td>
                    <td className="py-4 px-6 font-sans font-semibold text-slate-200 text-sm">{b.branchName}</td>
                    <td className="py-4 px-6 text-right font-extrabold text-slate-100">{b.totalLiters} L</td>
                    <td className="py-4 px-6 text-right text-amber-300 font-medium">{b.cowLiters} L</td>
                    <td className="py-4 px-6 text-right text-purple-300 font-medium">{b.buffaloLiters} L</td>
                    <td className="py-4 px-6 text-right font-extrabold text-emerald-400 text-sm">₹{b.totalAmount.toFixed(2)}</td>
                    <td className="py-4 px-6 text-right text-slate-400">{b.entryCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 4. QUICK LINKS PANEL FOR ADMIN MANAGEMENT */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link
          to="/admin/branches"
          className="group p-5 bg-slate-900 hover:bg-slate-800/80 border border-slate-800 hover:border-cyan-500/40 rounded-2xl transition-all shadow-lg flex items-center justify-between"
        >
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-cyan-500/10 rounded-xl text-cyan-400 group-hover:scale-110 transition-transform">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-100 group-hover:text-cyan-300 transition-colors">
                Branches (शाखा)
              </h3>
              <p className="text-[11px] text-slate-400">Manage centers &amp; codes</p>
            </div>
          </div>
          <ArrowUpRight className="w-5 h-5 text-slate-500 group-hover:text-cyan-400 transition-colors" />
        </Link>

        <Link
          to="/admin/farmers"
          className="group p-5 bg-slate-900 hover:bg-slate-800/80 border border-slate-800 hover:border-emerald-500/40 rounded-2xl transition-all shadow-lg flex items-center justify-between"
        >
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400 group-hover:scale-110 transition-transform">
              <UserCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-100 group-hover:text-emerald-300 transition-colors">
                Farmers (सभासद)
              </h3>
              <p className="text-[11px] text-slate-400">Manage member codes</p>
            </div>
          </div>
          <ArrowUpRight className="w-5 h-5 text-slate-500 group-hover:text-emerald-400 transition-colors" />
        </Link>

        <Link
          to="/admin/rate-chart"
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
              <p className="text-[11px] text-slate-400">Ledger &amp; payouts</p>
            </div>
          </div>
          <ArrowUpRight className="w-5 h-5 text-slate-500 group-hover:text-indigo-400 transition-colors" />
        </Link>
      </div>
    </div>
  );
};
