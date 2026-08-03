import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';

export const Layout: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-7xl w-full mx-auto p-6">
        <Outlet />
      </main>
      <footer className="border-t border-slate-800 py-4 px-6 text-center text-xs text-slate-500">
        &copy; {new Date().getFullYear()} Dairy Milk Collection System • Express 4 &amp; React Skeleton
      </footer>
    </div>
  );
};
