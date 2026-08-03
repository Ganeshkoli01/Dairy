import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, Milk, UserCheck, Shield, Building2, LayoutDashboard, Grid, Scale, FileText } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const isOwner = user?.role === 'owner' || user?.role === 'admin';

  return (
    <nav className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-md">
      <div className="flex items-center space-x-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gradient-to-tr from-cyan-500 to-blue-600 rounded-xl text-white shadow-lg shadow-cyan-500/20">
            <Milk className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-slate-100 leading-tight">Dairy Collection</h1>
            <p className="text-xs text-slate-400">Milk Management System</p>
          </div>
        </div>

        {user && (
          <div className="flex flex-wrap items-center space-x-1 pl-4 border-l border-slate-800">
            <NavLink
              to={isOwner ? '/admin/dashboard' : '/dashboard'}
              className={({ isActive }) =>
                `flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-slate-800 text-cyan-400 border border-slate-700'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`
              }
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard</span>
            </NavLink>

            {/* Milk Collection Entry Link for ALL authenticated users */}
            <NavLink
              to="/collection/entry"
              className={({ isActive }) =>
                `flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-slate-800 text-emerald-400 border border-slate-700'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`
              }
            >
              <Scale className="w-4 h-4" />
              <span>Milk Entry</span>
            </NavLink>

            {/* Reports Link for ALL authenticated users */}
            <NavLink
              to="/reports"
              className={({ isActive }) =>
                `flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-slate-800 text-cyan-400 border border-slate-700'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`
              }
            >
              <FileText className="w-4 h-4" />
              <span>Reports &amp; Billing</span>
            </NavLink>

            {/* Owner-only Links */}
            {isOwner && (
              <>
                <NavLink
                  to="/admin/branches"
                  className={({ isActive }) =>
                    `flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                      isActive
                        ? 'bg-slate-800 text-cyan-400 border border-slate-700'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                    }`
                  }
                >
                  <Building2 className="w-4 h-4" />
                  <span>Branches</span>
                </NavLink>

                <NavLink
                  to="/admin/farmers"
                  className={({ isActive }) =>
                    `flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                      isActive
                        ? 'bg-slate-800 text-emerald-400 border border-slate-700'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                    }`
                  }
                >
                  <UserCheck className="w-4 h-4" />
                  <span>Farmers</span>
                </NavLink>

                <NavLink
                  to="/admin/rate-chart"
                  className={({ isActive }) =>
                    `flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                      isActive
                        ? 'bg-slate-800 text-amber-400 border border-slate-700'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                    }`
                  }
                >
                  <Grid className="w-4 h-4" />
                  <span>Rate Chart</span>
                </NavLink>
              </>
            )}
          </div>
        )}
      </div>

      {user && (
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700">
            {isOwner ? (
              <Shield className="w-4 h-4 text-cyan-400" />
            ) : (
              <UserCheck className="w-4 h-4 text-emerald-400" />
            )}
            <div className="text-sm">
              <span className="text-slate-200 font-medium">{user.name}</span>
              <span className={`ml-2 text-xs px-2 py-0.5 rounded-full font-semibold ${
                isOwner
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' 
                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              }`}>
                {isOwner ? 'OWNER' : 'USER'}
              </span>
            </div>
          </div>

          <button
            onClick={logout}
            className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-3 py-2 rounded-lg text-sm transition-colors border border-slate-700"
          >
            <LogOut className="w-4 h-4 text-rose-400" />
            <span>Logout</span>
          </button>
        </div>
      )}
    </nav>
  );
};
