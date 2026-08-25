import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { LogOut, Milk, UserCheck, Shield, Building2, LayoutDashboard, Grid, Scale, FileText, ShoppingCart, Package, CreditCard, Menu, X, TrendingUp } from 'lucide-react';
import { NotificationBell } from './NotificationBell';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { totalItems } = useCart();
  const isOwner = user?.role === 'dairyOwner' || user?.role === 'admin';
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => { document.body.style.overflow = 'auto'; };
  }, [isMobileMenuOpen]);

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  // Reusable NavLink styling function
  const navLinkClass = ({ isActive }: { isActive: boolean }) => 
    `flex items-center space-x-3 md:space-x-1.5 px-4 py-3 md:px-2.5 md:py-1.5 rounded-xl md:rounded-full text-base md:text-xs font-semibold transition-all duration-300 ${
      isActive
        ? 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/20 md:shadow-[0_0_10px_rgba(99,102,241,0.1)]'
        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent'
    }`;

  // Helper for rendering role-specific links
  const renderNavLinks = () => {
    if (!user) return null;

    return (
      <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-2">
        {/* First Line: Dairy Operations */}
        <div className="flex flex-col md:flex-row md:flex-wrap items-stretch md:items-center gap-1">
          {user.role !== 'farmer' && (
            <>
              <NavLink to={user.role === 'admin' ? '/admin/dashboard' : user.role === 'dairyOwner' ? '/owner/dashboard' : '/dashboard'} className={navLinkClass} onClick={closeMobileMenu}>
                <LayoutDashboard className="w-5 h-5 md:w-3.5 md:h-3.5 text-cyan-400" />
                <span>Dashboard</span>
              </NavLink>
              <NavLink to="/collection/entry" className={navLinkClass} onClick={closeMobileMenu}>
                <Scale className="w-5 h-5 md:w-3.5 md:h-3.5 text-emerald-400" />
                <span>Milk Entry</span>
              </NavLink>
              <NavLink to="/reports" className={navLinkClass} onClick={closeMobileMenu}>
                <FileText className="w-5 h-5 md:w-3.5 md:h-3.5 text-cyan-400" />
                <span>Reports</span>
              </NavLink>
              <NavLink to={user.role === 'admin' ? '/admin/analytics' : '/owner/analytics'} className={navLinkClass} onClick={closeMobileMenu}>
                <TrendingUp className="w-5 h-5 md:w-3.5 md:h-3.5 text-cyan-400" />
                <span>Analytics</span>
              </NavLink>
            </>
          )}

          {user.role === 'farmer' && (
            <NavLink to="/farmer/collections" className={navLinkClass} onClick={closeMobileMenu}>
              <FileText className="w-5 h-5 md:w-3.5 md:h-3.5 text-cyan-400" />
              <span>Collections</span>
            </NavLink>
          )}

          {isOwner && (
            <>
              {user.role === 'admin' && (
                <NavLink to="/admin/branches" className={navLinkClass} onClick={closeMobileMenu}>
                  <Building2 className="w-5 h-5 md:w-3.5 md:h-3.5 text-cyan-400" />
                  <span>Branches</span>
                </NavLink>
              )}
              <NavLink to={user.role === 'admin' ? '/admin/farmers' : '/owner/farmers'} className={navLinkClass} onClick={closeMobileMenu}>
                <UserCheck className="w-5 h-5 md:w-3.5 md:h-3.5 text-emerald-400" />
                <span>Farmers</span>
              </NavLink>
              <NavLink to={user.role === 'admin' ? '/admin/rate-chart' : '/owner/rate-chart'} className={navLinkClass} onClick={closeMobileMenu}>
                <Grid className="w-5 h-5 md:w-3.5 md:h-3.5 text-amber-400" />
                <span>Rates</span>
              </NavLink>
            </>
          )}
        </div>

        {/* Divider on Mobile */}
        {isOwner && <div className="h-px bg-slate-800/60 my-2 md:hidden"></div>}
        {isOwner && <div className="w-px h-6 bg-slate-800/60 mx-1 hidden md:block"></div>}

        {/* Second Line: Shop & Inventory (Only for Owners) */}
        {isOwner && (
          <div className="flex flex-col md:flex-row md:flex-wrap items-stretch md:items-center gap-1">
            <NavLink to="/shop" className={navLinkClass} onClick={closeMobileMenu}>
              <Milk className="w-5 h-5 md:w-3.5 md:h-3.5 text-indigo-400" />
              <span>Shop</span>
            </NavLink>
            <NavLink to={user.role === 'admin' ? '/admin/shop-reports' : '/owner/shop-reports'} className={navLinkClass} onClick={closeMobileMenu}>
              <FileText className="w-5 h-5 md:w-3.5 md:h-3.5 text-indigo-400" />
              <span>Reports</span>
            </NavLink>
            {user.role === 'admin' && (
              <NavLink to="/admin/products" className={navLinkClass} onClick={closeMobileMenu}>
                <Package className="w-5 h-5 md:w-3.5 md:h-3.5 text-indigo-400" />
                <span>Products</span>
              </NavLink>
            )}
            <NavLink to="/admin/inventory" className={navLinkClass} onClick={closeMobileMenu}>
              <Package className="w-5 h-5 md:w-3.5 md:h-3.5 text-indigo-400" />
              <span>Inventory</span>
            </NavLink>
            {user.role === 'admin' && (
              <NavLink to="/admin/stock-intake" className={navLinkClass} onClick={closeMobileMenu}>
                <Package className="w-5 h-5 md:w-3.5 md:h-3.5 text-indigo-400" />
                <span>Stock Intake</span>
              </NavLink>
            )}
            <NavLink to={user.role === 'admin' ? '/admin/orders' : '/owner/orders'} className={navLinkClass} onClick={closeMobileMenu}>
              <Package className="w-5 h-5 md:w-3.5 md:h-3.5 text-indigo-400" />
              <span>Orders History</span>
            </NavLink>
            {user.role === 'admin' && (
              <NavLink to="/admin/payments" className={navLinkClass} onClick={closeMobileMenu}>
                <CreditCard className="w-5 h-5 md:w-3.5 md:h-3.5 text-rose-400" />
                <span>Payments</span>
              </NavLink>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <nav className="bg-slate-950/90 backdrop-blur-xl border-b border-slate-800/50 sticky top-0 z-50">
      {/* Top Bar (Always visible) */}
      <div className="px-4 py-3 md:px-6 md:py-2 flex items-center justify-between">
        
        {/* Left Section: Mobile Menu Toggle & Logo */}
        <div className="flex items-center gap-3">
          {/* Mobile Hamburger Menu Button */}
          {user && (
            <button 
              className="md:hidden p-1 -ml-1 text-slate-300 hover:text-white focus:outline-none"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu className="w-6 h-6" />
            </button>
          )}

          {/* Logo */}
          <div className="flex items-center space-x-2 shrink-0">
            <div className="relative group hidden sm:block">
              <div className="absolute inset-0 bg-indigo-500/20 rounded-lg blur-md group-hover:bg-indigo-500/30 transition-all duration-300"></div>
              <img src="/gk_logo.png" alt="GK Dairy Logo" className="relative h-8 md:h-9 w-auto object-contain rounded-lg bg-white p-1" />
            </div>
            <div className="flex flex-col justify-center">
              <h1 className="font-extrabold text-[15px] md:text-base text-transparent bg-clip-text bg-gradient-to-r from-white to-indigo-300 leading-tight tracking-wide">
                GK Dairy Collection
              </h1>
            </div>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <div className="hidden md:flex flex-1 mx-6 items-center">
          {renderNavLinks()}
        </div>

        {/* Right Section: Actions (Notifications, Cart, Profile, Logout) */}
        <div className="flex items-center gap-3 md:gap-4 shrink-0">
          {user && (
            <>
              {/* Cart & Notifications - Visible on Mobile too */}
              <div className="flex items-center gap-2">
                <NotificationBell />
                {isOwner && (
                  <NavLink to="/cart" className="relative p-2 text-slate-300 hover:text-white transition rounded-full hover:bg-slate-800 focus:outline-none">
                    <ShoppingCart className="w-6 h-6" />
                    {totalItems > 0 && (
                      <span className="absolute top-1 right-1 flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-rose-500 border-2 border-slate-900 rounded-full">
                        {totalItems > 9 ? '9+' : totalItems}
                      </span>
                    )}
                  </NavLink>
                )}
              </div>

              {/* Desktop User Profile Badge & Logout */}
              <div className="hidden md:flex items-center gap-3 border-l border-slate-800 pl-4">
                <div className="flex items-center gap-2 bg-slate-900/50 pl-1.5 pr-3 py-1 rounded-full border border-slate-800/60 shadow-inner">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center shadow-md ${isOwner ? 'bg-gradient-to-br from-indigo-500 to-purple-600 shadow-indigo-500/20' : 'bg-gradient-to-br from-emerald-500 to-teal-600 shadow-emerald-500/20'}`}>
                    {isOwner ? <Shield className="w-3 h-3 text-white" /> : <UserCheck className="w-3 h-3 text-white" />}
                  </div>
                  <div className="flex flex-col leading-none">
                    <span className="text-xs font-bold text-slate-200">{user.displayName || user.email}</span>
                    <span className={`text-[9px] font-black tracking-widest uppercase mt-0.5 ${isOwner ? 'text-indigo-400' : 'text-emerald-400'}`}>
                      {user.role === 'dairyOwner' ? 'OWNER' : user.role}
                    </span>
                  </div>
                </div>

                <button onClick={logout} className="p-2 bg-slate-900/50 hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 rounded-full transition-colors border border-slate-800/60 hover:border-rose-500/30" title="Logout">
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Mobile Menu Drawer Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop */}
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={closeMobileMenu}></div>
          
          {/* Drawer */}
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-slate-950 border-r border-slate-800 shadow-2xl overflow-y-auto animate-in slide-in-from-left duration-300">
            {/* Drawer Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/50 sticky top-0 z-10">
              <div className="flex items-center space-x-2">
                <img src="/gk_logo.png" alt="GK Dairy" className="h-8 w-auto bg-white rounded p-1" />
                <span className="font-bold text-white text-sm">GK Dairy</span>
              </div>
              <button onClick={closeMobileMenu} className="p-2 text-slate-400 hover:text-white rounded-full bg-slate-800/50 focus:outline-none">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mobile User Profile */}
            {user && (
              <div className="p-4 border-b border-slate-800 bg-slate-900/20">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg ${isOwner ? 'bg-gradient-to-br from-indigo-500 to-purple-600 shadow-indigo-500/20' : 'bg-gradient-to-br from-emerald-500 to-teal-600 shadow-emerald-500/20'}`}>
                    {isOwner ? <Shield className="w-5 h-5 text-white" /> : <UserCheck className="w-5 h-5 text-white" />}
                  </div>
                  <div className="flex flex-col flex-1 overflow-hidden">
                    <span className="text-sm font-bold text-white truncate">{user.displayName || user.email}</span>
                    <span className={`text-[10px] font-black tracking-widest uppercase mt-0.5 ${isOwner ? 'text-indigo-400' : 'text-emerald-400'}`}>
                      {user.role === 'dairyOwner' ? 'OWNER' : user.role}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Drawer Navigation Links */}
            <div className="flex-1 p-3 flex flex-col gap-1 overflow-y-auto pb-24">
              {renderNavLinks()}
            </div>

            {/* Drawer Footer (Logout) */}
            {user && (
              <div className="p-4 border-t border-slate-800 sticky bottom-0 bg-slate-950">
                <button onClick={() => { logout(); closeMobileMenu(); }} className="flex items-center justify-center w-full space-x-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 px-4 py-3 rounded-xl font-bold transition-colors">
                  <LogOut className="w-5 h-5" />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};
