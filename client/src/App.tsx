import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { PrivateRoute } from './components/PrivateRoute';
import { Layout } from './components/Layout';
import { PublicLayout } from './components/PublicLayout';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { OwnerDashboardPage } from './pages/OwnerDashboardPage';
import { MilkCollectionPage } from './pages/MilkCollectionPage';
import { ReportsPage } from './pages/ReportsPage';
import { BranchesPage } from './pages/BranchesPage';
import { FarmersPage } from './pages/FarmersPage';
import { RateChartPage } from './pages/RateChartPage';
import { UnauthorizedPage } from './pages/UnauthorizedPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { TermsPage } from './pages/TermsPage';
import { PrivacyPage } from './pages/PrivacyPage';
import { ShopPage } from './pages/ShopPage';
import { CartPage } from './pages/CartPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { AdminProductsPage } from './pages/AdminProductsPage';
import { PaymentsPage } from './pages/PaymentsPage';
import { InventoryPage } from './pages/InventoryPage';
import { StockIntakePage } from './pages/StockIntakePage';
import { OrdersHistoryPage } from './pages/OrdersHistoryPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { CartProvider } from './context/CartContext';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <Routes>
          {/* Public Routes */}
          <Route element={<PublicLayout />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
          </Route>

          {/* Protected Routes for all authenticated roles */}
          <Route element={<PrivateRoute />}>
            <Route element={<Layout />}>
              <Route path="/dashboard" element={<Navigate to="/farmer/collections" replace />} />
              <Route path="/farmer/dashboard" element={<DashboardPage />} />
              <Route path="/farmer/collections" element={<ReportsPage />} />
              <Route path="/collection/entry" element={<MilkCollectionPage />} />
              <Route path="/reports" element={<ReportsPage />} />
              <Route path="/unauthorized" element={<UnauthorizedPage />} />
            </Route>
          </Route>

          {/* Admin & Dairy Owner Protected Routes */}
          <Route element={<PrivateRoute allowedRoles={['admin', 'dairyOwner']} />}>
            <Route element={<Layout />}>
              <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
              <Route path="/owner/dashboard" element={<OwnerDashboardPage />} />
              <Route path="/admin/farmers" element={<FarmersPage />} />
              <Route path="/owner/farmers" element={<FarmersPage />} />
              <Route path="/admin/rate-chart" element={<RateChartPage />} />
              <Route path="/owner/rate-chart" element={<RateChartPage />} />
              <Route path="/admin/reports" element={<ReportsPage />} />
              <Route path="/admin/analytics" element={<AnalyticsPage />} />
              <Route path="/owner/analytics" element={<AnalyticsPage />} />
              <Route path="/admin/products" element={<AdminProductsPage />} />
              <Route path="/admin/payments" element={<PaymentsPage />} />
              <Route path="/admin/branches" element={<BranchesPage />} />
              <Route path="/shop" element={<ShopPage />} />
              <Route path="/cart" element={<CartPage />} />
              <Route path="/checkout" element={<CheckoutPage />} />
              <Route path="/admin/inventory" element={<InventoryPage />} />
              <Route path="/admin/orders" element={<OrdersHistoryPage />} />
              <Route path="/owner/orders" element={<OrdersHistoryPage />} />
              <Route path="/notifications" element={<NotificationsPage />} />
            </Route>
          </Route>

          {/* Admin Only Protected Routes */}
          <Route element={<PrivateRoute allowedRoles={['admin']} />}>
            <Route element={<Layout />}>
              <Route path="/admin/branches" element={<BranchesPage />} />
              <Route path="/admin/products" element={<AdminProductsPage />} />
              <Route path="/admin/stock-intake" element={<StockIntakePage />} />
            </Route>
          </Route>

          {/* Root Redirect */}
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* Catch-all 404 Route */}
          <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
