import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../api/authApi';
import { HealthCheckResponse } from '../types/auth';
import { Activity, Shield, UserCheck, RefreshCw, CheckCircle2, XCircle, Database, Server } from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [health, setHealth] = useState<HealthCheckResponse | null>(null);
  const [healthLoading, setHealthLoading] = useState(false);
  const [healthError, setHealthError] = useState<string | null>(null);

  const fetchHealth = async () => {
    setHealthLoading(true);
    setHealthError(null);
    try {
      const data = await authApi.checkHealth();
      setHealth(data);
    } catch (err: any) {
      setHealthError(err.message || 'Failed to reach API server health endpoint');
    } finally {
      setHealthLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3 mb-1">
            <h1 className="text-2xl font-bold text-slate-100">Welcome, {user?.name}</h1>
            <span className={`text-xs px-2.5 py-1 rounded-full font-semibold border ${
              user?.role === 'admin'
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
                : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
            }`}>
              {user?.role.toUpperCase()}
            </span>
          </div>
          <p className="text-slate-400 text-sm">
            {user?.role === 'admin'
              ? 'Admin Dashboard • Full access to collection management, rate charts, and operator oversight.'
              : 'Operator Portal • Ready to collect milk records, measure FAT/SNF, and print slips.'}
          </p>
        </div>

        <button
          onClick={fetchHealth}
          disabled={healthLoading}
          className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm px-4 py-2.5 rounded-xl border border-slate-700 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 text-cyan-400 ${healthLoading ? 'animate-spin' : ''}`} />
          <span>Check Server Health</span>
        </button>
      </div>

      {/* Health Check Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2.5">
            <Activity className="w-5 h-5 text-cyan-400" />
            <h2 className="text-lg font-semibold text-slate-200">Backend API Health Status</h2>
          </div>
          <span className="text-xs text-slate-500 font-mono">GET /api/health</span>
        </div>

        {healthLoading ? (
          <p className="text-sm text-slate-400 py-4">Pinging server health endpoint...</p>
        ) : healthError ? (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-center space-x-3">
            <XCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />
            <div>
              <p className="font-semibold">Backend Unreachable</p>
              <p className="text-xs text-rose-400/80">{healthError}</p>
            </div>
          </div>
        ) : health ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center space-x-3">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 flex-shrink-0" />
              <div>
                <p className="text-xs text-slate-400">Server Status</p>
                <p className="text-sm font-semibold text-emerald-300 capitalize">{health.status} (OK)</p>
              </div>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center space-x-3">
              <Server className="w-8 h-8 text-cyan-400 flex-shrink-0" />
              <div>
                <p className="text-xs text-slate-400">Environment</p>
                <p className="text-sm font-semibold text-slate-200 capitalize">{health.environment}</p>
              </div>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center space-x-3">
              <Database className="w-8 h-8 text-blue-400 flex-shrink-0" />
              <div>
                <p className="text-xs text-slate-400">Database Connection</p>
                <p className="text-sm font-semibold text-slate-200 capitalize">{health.database.status}</p>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {/* Feature Modules Placeholder */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center space-x-3 mb-3">
            <div className="p-2 bg-cyan-500/10 rounded-lg text-cyan-400">
              <Shield className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-slate-200">Role Permissions Summary</h3>
          </div>
          <ul className="space-y-2 text-sm text-slate-400">
            <li className="flex items-center space-x-2">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
              <span>JWT Authentication active in LocalStorage &amp; Axios Interceptors</span>
            </li>
            <li className="flex items-center space-x-2">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
              <span>Role check: <strong className="text-slate-200">{user?.role}</strong></span>
            </li>
            <li className="flex items-center space-x-2">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
              <span>Protected routes enforced by <code className="text-cyan-300">PrivateRoute.tsx</code></span>
            </li>
          </ul>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center space-x-3 mb-3">
            <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400">
              <UserCheck className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-slate-200">System Ready for Features</h3>
          </div>
          <p className="text-sm text-slate-400 leading-relaxed">
            The MERN stack project architecture is set up. You can now start adding milk entry collection modules, rate charts, farmer profiles, and analytical reports.
          </p>
        </div>
      </div>
    </div>
  );
};
