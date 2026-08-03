import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

export const UnauthorizedPage: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
      <div className="p-4 bg-rose-500/10 rounded-full border border-rose-500/20 text-rose-400 mb-4">
        <ShieldAlert className="w-12 h-12" />
      </div>
      <h1 className="text-3xl font-bold text-slate-100 mb-2">403 - Access Denied</h1>
      <p className="text-slate-400 max-w-md mb-6 text-sm">
        You do not have the required role permissions (Admin/Operator) to access this feature or page.
      </p>
      <Link
        to="/dashboard"
        className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2.5 rounded-xl border border-slate-700 transition-colors text-sm font-medium"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Return to Dashboard</span>
      </Link>
    </div>
  );
};
