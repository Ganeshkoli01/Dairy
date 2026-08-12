import React from 'react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full border-t border-slate-800 py-6 px-6 text-center text-xs text-slate-500 bg-slate-950">
      <div className="flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-4 mb-2">
        <Link to="/terms" className="hover:text-emerald-400 transition-colors">Terms & Conditions</Link>
        <span className="hidden sm:inline text-slate-700">•</span>
        <Link to="/privacy" className="hover:text-emerald-400 transition-colors">Privacy Policy</Link>
      </div>
      <div>&copy; 2024 GK Digital Solutions Pvt. Ltd. All rights reserved.</div>
    </footer>
  );
};
