import React from 'react';
import { Outlet } from 'react-router-dom';
import { Footer } from './Footer';

export const PublicLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <main className="flex-1 w-full mx-auto">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};
