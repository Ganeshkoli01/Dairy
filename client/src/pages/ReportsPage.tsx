import React, { useState, useEffect } from 'react';
import { reportApi } from '../api/reportApi';
import { branchApi } from '../api/branchApi';
import { farmerApi } from '../api/farmerApi';
import { useAuth } from '../context/AuthContext';
import { Branch } from '../types/branch';
import { Farmer } from '../types/farmer';
import { FarmerLedgerResponse, BranchSummaryResponse, PaymentDueResponse } from '../types/reports';
import {
  FileText,
  Download,
  Calendar,
  Building2,
  User,
  DollarSign,
  TrendingUp,
  Search,
  Loader2,
  AlertCircle,
} from 'lucide-react';

type ReportTab = 'farmer-ledger' | 'branch-summary' | 'payment-due';

export const ReportsPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<ReportTab>('farmer-ledger');

  // Filter States
  const [fromDate, setFromDate] = useState<string>(
    new Date(Date.now() - 15 * 24 * 60 * 60 * 1000 - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0]
  );
  const [toDate, setToDate] = useState<string>(
    new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0]
  );
  const [selectedBranch, setSelectedBranch] = useState<string>('');
  const [farmerCode, setFarmerCode] = useState<string>('');
  const [branches, setBranches] = useState<Branch[]>([]);
  const [farmers, setFarmers] = useState<Farmer[]>([]);

  // Report Data States
  const [ledgerData, setLedgerData] = useState<FarmerLedgerResponse | null>(null);
  const [summaryData, setSummaryData] = useState<BranchSummaryResponse | null>(null);
  const [paymentData, setPaymentData] = useState<PaymentDueResponse | null>(null);

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const list = await branchApi.getBranches();
        setBranches(list);
        if (list.length > 0) setSelectedBranch(list[0]._id);
      } catch (err) {
        console.error('Failed to load branches', err);
      }
    };
    fetchBranches();

    // Set farmerCode if logged in as farmer
    if (user?.role === 'farmer' && user?.farmerProfile?.farmerCode) {
       setFarmerCode(user.farmerProfile.farmerCode);
    }
  }, [user]);

  useEffect(() => {
    if (selectedBranch) {
      farmerApi.getFarmers({ branch: selectedBranch }).then(list => {
        setFarmers(list);
        if (list.length > 0 && !farmerCode) {
          setFarmerCode(list[0].farmerCode);
        }
      }).catch(console.error);
    } else {
      setFarmers([]);
    }
  }, [selectedBranch]);

  const loadReport = async () => {
    setLoading(true);
    setError(null);
    try {
      if (activeTab === 'farmer-ledger') {
        if (farmers.length === 0 && user?.role !== 'farmer') {
          setError('No farmers registered in this branch. Please add farmers first.');
          setLoading(false);
          return;
        }
        if (!farmerCode) {
          setError('Please select a farmer code for the ledger report.');
          setLoading(false);
          return;
        }
        const res = await reportApi.getFarmerLedger(farmerCode.trim(), fromDate, toDate);
        setLedgerData(res);
      } else if (activeTab === 'branch-summary') {
        const res = await reportApi.getBranchSummary(selectedBranch || undefined, fromDate, toDate);
        setSummaryData(res);
      } else if (activeTab === 'payment-due') {
        const res = await reportApi.getPaymentDue(selectedBranch || undefined, fromDate, toDate);
        setPaymentData(res);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load report data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, [activeTab, selectedBranch]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadReport();
  };

  const handleExportCSV = async () => {
    try {
      const params: any = { from: fromDate, to: toDate };
      if (activeTab === 'farmer-ledger') params.farmerCode = farmerCode;
      if (activeTab === 'branch-summary' || activeTab === 'payment-due') {
        if (selectedBranch) params.branch = selectedBranch;
      }
      await reportApi.exportCSV(activeTab, params);
    } catch (err: any) {
      console.error('Export CSV Error:', err);
      setError('Failed to export CSV. Check console for details.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-cyan-500/10 rounded-xl text-cyan-400 border border-cyan-500/20">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-100">Reports &amp; Billing Registers</h1>
            <p className="text-xs text-slate-400 mt-0.5">High-density reports for office staff, farmer billing &amp; payout registers</p>
          </div>
        </div>

        <button
          onClick={handleExportCSV}
          className="flex items-center justify-center space-x-2 bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2.5 rounded-xl font-medium text-xs border border-slate-700 transition-colors shadow"
        >
          <Download className="w-4 h-4 text-emerald-400" />
          <span>Export CSV</span>
        </button>
      </div>

      {/* TABS */}
      {user?.role !== 'farmer' ? (
        <div className="flex items-center space-x-2 bg-slate-900 border border-slate-800 rounded-2xl p-1.5 shadow-lg">
          <button
            onClick={() => setActiveTab('farmer-ledger')}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-2 ${
              activeTab === 'farmer-ledger'
                ? 'bg-slate-800 text-cyan-400 border border-slate-700 shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <User className="w-4 h-4" />
            <span>1. Farmer Ledger (सभासद खाते)</span>
          </button>

          <button
            onClick={() => setActiveTab('branch-summary')}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-2 ${
              activeTab === 'branch-summary'
                ? 'bg-slate-800 text-amber-400 border border-slate-700 shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>2. Branch Day-Wise Summary</span>
          </button>

          <button
            onClick={() => setActiveTab('payment-due')}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-2 ${
              activeTab === 'payment-due'
                ? 'bg-slate-800 text-emerald-400 border border-slate-700 shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            <span>3. Payment Due Register (बिल रजिस्टर)</span>
          </button>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-center">
            <p className="text-sm text-cyan-400 font-semibold">Farmer Ledger Report</p>
        </div>
      )}

      {/* FILTER CONTROL BAR */}
      <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md">
        {/* From Date */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
            From Date
          </label>
          <div className="flex items-center space-x-2 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2">
            <Calendar className="w-4 h-4 text-slate-500" />
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="bg-transparent border-none text-slate-200 text-xs focus:outline-none w-full"
            />
          </div>
        </div>

        {/* To Date */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
            To Date
          </label>
          <div className="flex items-center space-x-2 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2">
            <Calendar className="w-4 h-4 text-slate-500" />
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="bg-transparent border-none text-slate-200 text-xs focus:outline-none w-full"
            />
          </div>
        </div>

        {/* Conditional Input per Tab */}
        {activeTab === 'farmer-ledger' && (
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1">Farmer Code</label>
            <div className="relative group">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-cyan-500 transition-colors" />
              {user?.role === 'farmer' ? (
                <input
                  type="text"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all disabled:opacity-60"
                  placeholder="e.g. 101"
                  value={farmerCode}
                  onChange={(e) => setFarmerCode(e.target.value)}
                  disabled
                />
              ) : (
                <select
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-200 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all cursor-pointer"
                  value={farmerCode}
                  onChange={(e) => setFarmerCode(e.target.value)}
                >
                  <option value="" disabled>Select a Farmer...</option>
                  {farmers.map(f => (
                    <option key={f._id} value={f.farmerCode}>{f.name} ({f.farmerCode})</option>
                  ))}
                </select>
              )}
            </div>
          </div>
        )}

        {activeTab !== 'farmer-ledger' && (
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Branch Filter
            </label>
            <div className="flex items-center space-x-2 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2">
              <Building2 className="w-4 h-4 text-slate-500" />
              {user?.role === 'dairyOwner' ? (
                <div className="text-slate-200 text-xs font-semibold w-full">
                  {branches.length > 0 ? `${branches[0].name} (${branches[0].code})` : 'Loading...'}
                </div>
              ) : (
                <select
                  value={selectedBranch}
                  onChange={(e) => setSelectedBranch(e.target.value)}
                  className="bg-transparent border-none text-slate-200 text-xs focus:outline-none w-full"
                >
                  <option value="" className="bg-slate-900 text-slate-200">All Branches</option>
                  {branches.map((b) => (
                    <option key={b._id} value={b._id} className="bg-slate-900 text-slate-200">
                      {b.name} ({b.code})
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>
        )}

        <div className="flex items-end">
          <button
            type="submit"
            className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold py-2.5 px-4 rounded-xl border border-slate-700 transition-colors flex items-center justify-center space-x-2"
          >
            <Search className="w-4 h-4" />
            <span>Generate Report</span>
          </button>
        </div>
      </form>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-center space-x-3">
          <AlertCircle className="w-5 h-5 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* DENSE HIGH-CLARITY REPORT CONTENT */}

      {/* TAB 1: FARMER LEDGER */}
      {activeTab === 'farmer-ledger' && (
        <div className="space-y-4">
          {ledgerData?.summary && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-900 border border-slate-800 p-4 rounded-2xl">
              <div>
                <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-semibold">Farmer</span>
                <span className="text-sm font-bold text-cyan-300">{ledgerData.farmerName} (#{ledgerData.farmerCode})</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-semibold">Total Liters</span>
                <span className="text-sm font-bold text-slate-100 font-mono">{ledgerData.summary.totalLiters} L</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-semibold">Avg FAT / SNF</span>
                <span className="text-sm font-bold text-slate-200 font-mono">{ledgerData.summary.weightedAvgFat}% / {ledgerData.summary.weightedAvgSnf}%</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-semibold">Total Payout Amount</span>
                <span className="text-base font-extrabold text-emerald-400 font-mono">₹{ledgerData.summary.totalAmount}</span>
              </div>
            </div>
          )}

          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            {loading ? (
              <div className="p-12 text-center flex flex-col items-center justify-center text-slate-400">
                <Loader2 className="w-8 h-8 animate-spin text-cyan-400 mb-2" />
                <p className="text-sm">Loading farmer ledger...</p>
              </div>
            ) : !ledgerData || ledgerData.data.length === 0 ? (
              <div className="p-12 text-center text-slate-400">
                <FileText className="w-12 h-12 text-slate-600 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-300">No Ledger Entries</p>
                <p className="text-xs text-slate-500 mt-1">No milk collections recorded for this farmer in selected date range.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse font-mono text-xs">
                  <thead>
                    <tr className="bg-slate-950/80 text-slate-400 uppercase text-[11px] font-semibold tracking-wider border-b border-slate-800">
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Session</th>
                      <th className="py-3 px-4">Type</th>
                      <th className="py-3 px-4 text-right">Liters</th>
                      <th className="py-3 px-4 text-right">FAT %</th>
                      <th className="py-3 px-4 text-right">SNF %</th>
                      <th className="py-3 px-4 text-right">Rate (₹)</th>
                      <th className="py-3 px-4 text-right">Amount (₹)</th>
                      <th className="py-3 px-4 text-right bg-slate-950 text-cyan-400">Run Liters</th>
                      <th className="py-3 px-4 text-right bg-slate-950 text-emerald-400">Run Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {ledgerData.data.map((row) => (
                      <tr key={row._id} className="hover:bg-slate-800/30">
                        <td className="py-2.5 px-4 font-semibold text-slate-200">{row.date}</td>
                        <td className="py-2.5 px-4 capitalize text-slate-300">{row.session}</td>
                        <td className="py-2.5 px-4 uppercase text-amber-300 font-semibold">{row.milkType}</td>
                        <td className="py-2.5 px-4 text-right font-bold text-slate-100">{row.weight} L</td>
                        <td className="py-2.5 px-4 text-right text-slate-300">{row.fat}%</td>
                        <td className="py-2.5 px-4 text-right text-slate-300">{row.snf}%</td>
                        <td className="py-2.5 px-4 text-right text-slate-300">₹{row.rate.toFixed(2)}</td>
                        <td className="py-2.5 px-4 text-right font-bold text-cyan-300">₹{row.amount.toFixed(2)}</td>
                        <td className="py-2.5 px-4 text-right bg-slate-950/50 font-bold text-slate-200">{row.runningTotalLiters} L</td>
                        <td className="py-2.5 px-4 text-right bg-slate-950/50 font-extrabold text-emerald-400">₹{row.runningTotalAmount.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: BRANCH DAY-WISE SUMMARY */}
      {activeTab === 'branch-summary' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          {loading ? (
            <div className="p-12 text-center flex flex-col items-center justify-center text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin text-amber-400 mb-2" />
              <p className="text-sm">Loading branch summary...</p>
            </div>
          ) : !summaryData || summaryData.data.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <TrendingUp className="w-12 h-12 text-slate-600 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-300">No Branch Collections</p>
              <p className="text-xs text-slate-500 mt-1">No collections recorded in selected date range.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse font-mono text-xs">
                <thead>
                  <tr className="bg-slate-950/80 text-slate-400 uppercase text-[11px] font-semibold tracking-wider border-b border-slate-800">
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4 text-right">Total Liters</th>
                    <th className="py-3 px-4 text-right text-amber-300">Cow Liters</th>
                    <th className="py-3 px-4 text-right text-purple-300">Buffalo Liters</th>
                    <th className="py-3 px-4 text-right">Avg FAT %</th>
                    <th className="py-3 px-4 text-right">Avg SNF %</th>
                    <th className="py-3 px-4 text-right text-emerald-400">Day Total Amount (₹)</th>
                    <th className="py-3 px-4 text-right">Entries</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {summaryData.data.map((row) => (
                    <tr key={row.date} className="hover:bg-slate-800/30">
                      <td className="py-2.5 px-4 font-bold text-slate-100">{row.date}</td>
                      <td className="py-2.5 px-4 text-right font-extrabold text-cyan-300">{row.totalLiters} L</td>
                      <td className="py-2.5 px-4 text-right text-amber-300">{row.cowLiters} L</td>
                      <td className="py-2.5 px-4 text-right text-purple-300">{row.buffaloLiters} L</td>
                      <td className="py-2.5 px-4 text-right text-slate-300">{row.weightedAvgFat}%</td>
                      <td className="py-2.5 px-4 text-right text-slate-300">{row.weightedAvgSnf}%</td>
                      <td className="py-2.5 px-4 text-right font-bold text-emerald-400">₹{row.totalAmount.toFixed(2)}</td>
                      <td className="py-2.5 px-4 text-right text-slate-400">{row.entryCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: PAYMENT DUE REGISTER */}
      {activeTab === 'payment-due' && (
        <div className="space-y-4">
          {paymentData?.summary && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-900 border border-slate-800 p-4 rounded-2xl">
              <div>
                <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-semibold">Total Farmers</span>
                <span className="text-sm font-bold text-slate-100 font-mono">{paymentData.summary.totalFarmers} Members</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-semibold">Grand Total Liters</span>
                <span className="text-sm font-bold text-cyan-300 font-mono">{paymentData.summary.grandTotalLiters} L</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-semibold">Grand Total Payout</span>
                <span className="text-base font-extrabold text-emerald-400 font-mono">₹{paymentData.summary.grandTotalAmount}</span>
              </div>
            </div>
          )}

          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            {loading ? (
              <div className="p-12 text-center flex flex-col items-center justify-center text-slate-400">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-400 mb-2" />
                <p className="text-sm">Loading payment register...</p>
              </div>
            ) : !paymentData || paymentData.data.length === 0 ? (
              <div className="p-12 text-center text-slate-400">
                <DollarSign className="w-12 h-12 text-slate-600 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-300">No Payment Records</p>
                <p className="text-xs text-slate-500 mt-1">No collections found in selected period.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse font-mono text-xs">
                  <thead>
                    <tr className="bg-slate-950/80 text-slate-400 uppercase text-[11px] font-semibold tracking-wider border-b border-slate-800">
                      <th className="py-3 px-4">Code</th>
                      <th className="py-3 px-4">Farmer Name</th>
                      <th className="py-3 px-4 text-right">Total Liters</th>
                      <th className="py-3 px-4 text-right text-amber-300">Cow (L)</th>
                      <th className="py-3 px-4 text-right text-purple-300">Buf (L)</th>
                      <th className="py-3 px-4 text-right">Avg FAT %</th>
                      <th className="py-3 px-4 text-right">Avg SNF %</th>
                      <th className="py-3 px-4 text-right">Avg Rate (₹)</th>
                      <th className="py-3 px-4 text-right text-emerald-400 bg-slate-950">Payout Due (₹)</th>
                      <th className="py-3 px-4 text-right">Entries</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {paymentData.data.map((row) => (
                      <tr key={row.farmerCode} className="hover:bg-slate-800/30">
                        <td className="py-2.5 px-4 font-bold text-cyan-400">{row.farmerCode}</td>
                        <td className="py-2.5 px-4 font-sans font-semibold text-slate-200 text-sm">{row.farmerName}</td>
                        <td className="py-2.5 px-4 text-right font-bold text-slate-100">{row.totalLiters} L</td>
                        <td className="py-2.5 px-4 text-right text-amber-300">{row.cowLiters} L</td>
                        <td className="py-2.5 px-4 text-right text-purple-300">{row.buffaloLiters} L</td>
                        <td className="py-2.5 px-4 text-right text-slate-300">{row.avgFat}%</td>
                        <td className="py-2.5 px-4 text-right text-slate-300">{row.avgSnf}%</td>
                        <td className="py-2.5 px-4 text-right text-slate-300">₹{row.avgRate.toFixed(2)}</td>
                        <td className="py-2.5 px-4 text-right bg-slate-950 font-extrabold text-sm text-emerald-400">₹{row.totalAmount.toFixed(2)}</td>
                        <td className="py-2.5 px-4 text-right text-slate-400">{row.entryCount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
