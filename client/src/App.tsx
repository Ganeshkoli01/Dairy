import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { PrivateRoute } from './components/PrivateRoute';
import { Layout } from './components/Layout';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { MilkCollectionPage } from './pages/MilkCollectionPage';
import { ReportsPage } from './pages/ReportsPage';
import { BranchesPage } from './pages/BranchesPage';
import { FarmersPage } from './pages/FarmersPage';
import { RateChartPage } from './pages/RateChartPage';
import { UnauthorizedPage } from './pages/UnauthorizedPage';
import { NotFoundPage } from './pages/NotFoundPage';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<LoginPage />} />

          {/* Protected Routes for all authenticated roles (Operators & Admins) */}
          <Route element={<PrivateRoute />}>
            <Route element={<Layout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/collection/entry" element={<MilkCollectionPage />} />
              <Route path="/reports" element={<ReportsPage />} />
              <Route path="/unauthorized" element={<UnauthorizedPage />} />
            </Route>
          </Route>

          {/* Admin-only Protected Routes */}
          <Route element={<PrivateRoute allowedRoles={['admin']} />}>
            <Route element={<Layout />}>
              <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
              <Route path="/admin/branches" element={<BranchesPage />} />
              <Route path="/admin/farmers" element={<FarmersPage />} />
              <Route path="/admin/rate-chart" element={<RateChartPage />} />
            </Route>
          </Route>

          {/* Root Redirect */}
          <Route path="/" element={<Navigate to="/collection/entry" replace />} />

          {/* Catch-all 404 Route */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
