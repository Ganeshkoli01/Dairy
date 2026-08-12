import React from 'react';
import { Shield } from 'lucide-react';
import { Link } from 'react-router-dom';

export const PrivacyPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 sm:p-12 shadow-2xl">
        <div className="flex items-center space-x-3 mb-8 border-b border-slate-800 pb-6">
          <div className="p-3 bg-teal-500/10 rounded-2xl text-teal-400 border border-teal-500/20">
            <Shield className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-100">Privacy Policy</h1>
            <p className="text-sm text-slate-400 mt-1">Last updated: August 2026</p>
          </div>
        </div>

        <div className="space-y-8 text-slate-300 text-sm leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-slate-100 mb-3">1. Information We Collect</h2>
            <p>
              When you use GK Dairy Management System, we may collect the following types of information:
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-2 text-slate-400">
              <li><strong>Personal Information:</strong> Name, email address, phone number, and physical address.</li>
              <li><strong>Financial & Operational Data:</strong> Milk collection records, fat/SNF data, and billing history.</li>
              <li><strong>Technical Data:</strong> IP addresses, browser types, and device information to improve security.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-100 mb-3">2. How We Use Your Information</h2>
            <p>
              We use the collected information strictly for the operation of the dairy management system, including:
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-2 text-slate-400">
              <li>Authenticating users (via OTP and passwords).</li>
              <li>Calculating and processing rate charts and payments.</li>
              <li>Sending necessary notifications (e.g., OTPs, receipts).</li>
              <li>Improving the security and performance of our platform.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-100 mb-3">3. Data Security</h2>
            <p>
              We prioritize the security of your data. Passwords are cryptographically hashed using industry standards (bcrypt). We also employ secure connections (HTTPS), input sanitization, and rate limiting to protect your information from unauthorized access, alteration, or destruction.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-100 mb-3">4. Third-Party Sharing</h2>
            <p>
              We do not sell, trade, or rent your personal identification information to others. We may share generic aggregated demographic information not linked to any personal identification information with our business partners for the purposes outlined above.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-100 mb-3">5. Your Rights</h2>
            <p>
              You have the right to request access to the data we have stored about you. If you wish to delete your account or modify your information, you may do so through your dairy owner or branch administrator.
            </p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-800 text-center">
          <button onClick={() => window.history.back()} className="text-teal-400 hover:text-teal-300 transition-colors font-medium">
            &larr; Go Back
          </button>
        </div>
      </div>
    </div>
  );
};
