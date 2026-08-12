import React from 'react';
import { FileText } from 'lucide-react';
import { Link } from 'react-router-dom';

export const TermsPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 sm:p-12 shadow-2xl">
        <div className="flex items-center space-x-3 mb-8 border-b border-slate-800 pb-6">
          <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-400 border border-emerald-500/20">
            <FileText className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-100">Terms and Conditions</h1>
            <p className="text-sm text-slate-400 mt-1">Last updated: August 2026</p>
          </div>
        </div>

        <div className="space-y-8 text-slate-300 text-sm leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-slate-100 mb-3">1. Acceptance of Terms</h2>
            <p>
              By accessing and using the GK Dairy Management System, you agree to be bound by these Terms and Conditions. If you do not agree with any part of these terms, you must not use our software.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-100 mb-3">2. Description of Service</h2>
            <p>
              GK Dairy provides a digital platform for dairy owners and farmers to track milk collections, fat/SNF data, and automated billing. The service is provided "as is" and "as available" without warranties of any kind.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-100 mb-3">3. User Accounts & Security</h2>
            <p>
              You are responsible for maintaining the confidentiality of your account credentials (passwords, OTPs). You agree to immediately notify us of any unauthorized use of your account. We are not liable for any losses or damages arising from your failure to protect your login information.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-100 mb-3">4. Data Accuracy and Liability</h2>
            <p>
              While our system processes rate charts and billing based on your inputs, GK Dairy is not responsible for any financial discrepancies, losses, or legal disputes arising from incorrect data entry (e.g., incorrect milk weight, FAT/SNF values, or rate charts). Users are advised to double-check their financial records.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-100 mb-3">5. Termination</h2>
            <p>
              We reserve the right to suspend or terminate your access to the platform at our sole discretion, without prior notice, for conduct that we believe violates these Terms or is harmful to other users, us, or third parties.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-100 mb-3">6. Changes to Terms</h2>
            <p>
              We reserve the right to modify these terms at any time. Your continued use of the platform following the posting of changes constitutes your acceptance of those changes.
            </p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-800 text-center">
          <button onClick={() => window.history.back()} className="text-emerald-400 hover:text-emerald-300 transition-colors font-medium">
            &larr; Go Back
          </button>
        </div>
      </div>
    </div>
  );
};
