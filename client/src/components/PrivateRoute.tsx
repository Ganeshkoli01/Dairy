import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Role } from '../types/auth';
import { Loader2 } from 'lucide-react';

interface PrivateRouteProps {
  allowedRoles?: Role[];
}

export const PrivateRoute: React.FC<PrivateRouteProps> = ({ allowedRoles }) => {
  const { isAuthenticated, user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-slate-200">
        <Loader2 className="w-10 h-10 animate-spin text-cyan-400 mb-3" />
        <p className="text-sm font-medium text-slate-400">Verifying authentication...</p>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles) {
    const isAllowed = allowedRoles.some((role) => {
      if (role === user.role) return true;
      if ((role === 'owner' || role === 'admin') && (user.role === 'owner' || user.role === 'admin')) return true;
      if ((role === 'user' || role === 'operator') && (user.role === 'user' || user.role === 'operator')) return true;
      return false;
    });

    if (!isAllowed) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  return <Outlet />;
};
