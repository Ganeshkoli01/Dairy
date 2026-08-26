import React, { useState, useEffect } from 'react';
import { reportApi } from '../api/reportApi';
import { branchApi } from '../api/branchApi';
import { farmerApi } from '../api/farmerApi';
import { milkCollectionApi } from '../api/milkCollectionApi';
import { useAuth } from '../context/AuthContext';
import { Branch } from '../types/branch';
import { Farmer } from '../types/farmer';
import { StatementGenerator } from '../components/StatementGenerator';
import {
  FileText, Download, Calendar, Building2, User, Printer, Activity, Package, IndianRupee, ShoppingCart, Truck, Trash2, Edit2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const ReportsPage: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const isOwner = user?.role === 'dairyOwner';
  const isFarmer = user?.role === 'farmer';
  const navigate = useNavigate();

  // Filter States
  const [activeReport, setActiveReport] = useState<string>(isFarmer ? 'farmer-ledger' : 'branch-summary');
  const [fromDate, setFromDate] = useState<string>(
    new Date(Date.now() - 15 * 24 * 60 * 60 * 1000 - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0]
  );
  const [toDate, setToDate] = useState<string>(
    new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0]
  );
  const [selectedBranch, setSelectedBranch] = useState<string>('all');
  const [farmerCode, setFarmerCode] = useState<string>('');
  
  const [branches, setBranches] = useState<Branch[]>([]);
  const [farmers, setFarmers] = useState<Farmer[]>([]);

  // Report Data
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Delete State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const reportOptions = [
    { id: 'branch-summary', label: 'Milk Branch Summary', icon: Building2, roles: ['admin', 'dairyOwner'] },
    { id: 'payment-due', label: 'Farmer Payment Due', icon: IndianRupee, roles: ['admin', 'dairyOwner'] },
    { id: 'farmer-ledger', label: 'Farmer Ledger', icon: User, roles: ['admin', 'dairyOwner', 'farmer'] },
    { id: 'statements', label: 'Farmer Statements', icon: FileText, roles: ['admin', 'dairyOwner', 'farmer'] }
  ];

  const allowedReports = reportOptions.filter(r => r.roles.includes(user?.role || ''));

  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const list = await branchApi.getBranches();
        if (isFarmer) {
          const fb = user?.farmerProfile?.branch;
          if (fb) {
            const found = list.find(b => b._id === fb);
            if (found) { setBranches([found]); setSelectedBranch(found._id); }
          }
        } else if (isOwner) {
          const ob = user?.dairyOwnerProfile?.branchId;
          if (ob) {
            const found = list.find(b => b._id === ob);
            if (found) { setBranches([found]); setSelectedBranch(found._id); }
          }
        } else {
          setBranches(list);
        }
      } catch (err) {
        console.error('Failed to load branches', err);
      }
    };
    fetchBranches();

    if (isFarmer && user?.farmerProfile?.farmerCode) {
      setFarmerCode(user.farmerProfile.farmerCode);
    }
  }, [user]);

  useEffect(() => {
    if (selectedBranch && selectedBranch !== 'all') {
      farmerApi.getFarmers({ branch: selectedBranch }).then(setFarmers).catch(console.error);
    } else {
      setFarmers([]);
    }
  }, [selectedBranch]);

  const loadReport = async () => {
    if (activeReport === 'statements') return; // Handled internally
    
    setLoading(true);
    setError(null);
    setReportData(null);
    try {
      const branchParam = selectedBranch === 'all' ? undefined : selectedBranch;
      let res;
      
      switch (activeReport) {
        case 'analytics-summary':
          res = await reportApi.getAnalyticsSummary(branchParam, fromDate, toDate);
          setReportData(res);
          break;
        case 'branch-summary':
          res = await reportApi.getBranchSummary(branchParam, fromDate, toDate);
          setReportData(res.data);
          break;
        case 'payment-due':
          res = await reportApi.getPaymentDue(branchParam, fromDate, toDate);
          setReportData(res.data);
          break;
        case 'farmer-ledger':
          if (!farmerCode && !isFarmer) { setError('Farmer Code required'); setLoading(false); return; }
          res = await reportApi.getFarmerLedger(branchParam, farmerCode, fromDate, toDate);
          setReportData(res.data);
          break;
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load report data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, [activeReport, selectedBranch]);

  const handleExportCSV = async () => {
    try {
      const branchParam = selectedBranch === 'all' ? undefined : selectedBranch;
      const params: any = { from: fromDate, to: toDate };
      if (branchParam) params.branch = branchParam;
      if (activeReport === 'farmer-ledger') params.farmerCode = farmerCode;
      
      await reportApi.exportCSV(activeReport, params);
    } catch (err) {
      console.error('Export CSV Error:', err);
      setError('Failed to export CSV. Ensure you have selected required fields.');
    }
  };

  const renderTable = (headers: string[], dataKeys: (string | Function)[], data: any[], rowActions?: (row: any) => React.ReactNode) => {
    if (!data || data.length === 0) return <div className="text-slate-400 text-center py-10">No data found for the selected filters.</div>;
    
    return (
      <div className="w-full overflow-x-auto pb-4 custom-scrollbar print:overflow-visible">
        <table className="w-full text-left text-sm text-slate-300 print:text-black">
          <thead className="bg-slate-800/50 text-slate-400 text-xs uppercase print:bg-gray-200 whitespace-nowrap">
            <tr>
              {headers.map((h, i) => <th key={i} className="px-4 py-3">{h}</th>)}
              {rowActions && <th className="px-4 py-3 text-right print:hidden">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50 print:divide-gray-300">
            {data.map((row, idx) => (
              <tr key={idx} className="hover:bg-slate-800/20">
                {dataKeys.map((k, i) => (
                  <td key={i} className="px-4 py-3">
                    {typeof k === 'function' ? k(row) : row[k as string]}
                  </td>
                ))}
                {rowActions && (
                  <td className="px-4 py-3 text-right print:hidden">
                    {rowActions(row)}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderReportContent = () => {
    if (loading) return <div className="text-center py-20 text-indigo-400 flex items-center justify-center gap-2"><Activity className="animate-spin w-5 h-5"/> Loading Report Data...</div>;
    if (error) return <div className="text-center py-10 text-rose-400 font-medium">{error}</div>;
    if (activeReport === 'statements') return <StatementGenerator branches={branches} selectedBranch={selectedBranch} setSelectedBranch={setSelectedBranch} />;
    if (!reportData) return <div className="text-center py-20 text-slate-500">Select options and click Generate</div>;

    switch (activeReport) {
      case 'branch-summary':
        return renderTable(
          ['Date', 'Total Liters', 'Avg FAT', 'Avg SNF', 'Total Amount (₹)'],
          ['date', 'totalLiters', 'weightedAvgFat', 'weightedAvgSnf', 'totalAmount'],
          reportData
        );
      case 'payment-due':
        return renderTable(
          ['Farmer Code', 'Farmer Name', 'Total Liters', 'Avg Rate', 'Payout Amount (₹)'],
          ['farmerCode', 'farmerName', 'totalLiters', 'avgRate', 'totalAmount'],
          reportData
        );
      case 'farmer-ledger':
        return renderTable(
          ['Date', 'Session', 'Type', 'Liters', 'FAT', 'SNF', 'Rate', 'Amount'],
          ['date', 'session', 'milkType', 'weight', 'fat', 'snf', 'rate', 'amount'],
          reportData,
          (!isFarmer) ? (row) => (
            <div className="flex items-center justify-end space-x-2">
              <button 
                onClick={() => navigate(`/collection/entry?date=${row.date}&session=${row.session}&editId=${row._id}`)}
                className="p-1.5 bg-slate-800 text-slate-300 hover:text-cyan-300 rounded-lg border border-slate-700 transition-colors"
                title="Edit Entry"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button 
                onClick={() => { setSelectedEntry(row); setShowDeleteModal(true); }}
                className="p-1.5 bg-slate-800 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg border border-slate-700 transition-colors"
                title="Delete Entry"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ) : undefined
        );
      default:
        return <div>Select a report</div>;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 py-8 print:p-0 print:m-0 print:max-w-none">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Business Analytics &amp; Reports</h1>
          <p className="text-slate-400 mt-1">Comprehensive insights, inventory management, and billing registers.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button onClick={() => window.print()} className="p-2.5 bg-slate-800 text-slate-300 hover:text-white rounded-xl border border-slate-700 transition-colors shadow" title="Print Report">
            <Printer className="w-5 h-5" />
          </button>
          {activeReport !== 'statements' && (
            <button onClick={handleExportCSV} className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl font-medium shadow-lg shadow-indigo-500/20 transition-all">
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </button>
          )}
        </div>
      </div>

      {/* Filters (Hidden in print) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl print:hidden relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5 items-end">
          
          <div className="col-span-1 md:col-span-2 lg:col-span-1">
            <label className="block text-sm font-semibold text-slate-300 mb-2">Report Type</label>
            <select
              value={activeReport}
              onChange={(e) => setActiveReport(e.target.value)}
              className="w-full bg-slate-950/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            >
              {allowedReports.map(r => (
                <option key={r.id} value={r.id}>{r.label}</option>
              ))}
            </select>
          </div>

          {isAdmin && (
            <div className="col-span-1">
              <label className="block text-sm font-semibold text-slate-300 mb-2">Branch</label>
              <select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className="w-full bg-slate-950/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              >
                <option value="all">All Branches (Global)</option>
                {branches.map(b => (
                  <option key={b._id} value={b._id}>{b.name}</option>
                ))}
              </select>
            </div>
          )}

          {activeReport !== 'inventory' && activeReport !== 'statements' && (
            <>
              <div className="col-span-1">
                <label className="block text-sm font-semibold text-slate-300 mb-2">From Date</label>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="w-full bg-slate-950/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all [color-scheme:dark]"
                />
              </div>
              <div className="col-span-1">
                <label className="block text-sm font-semibold text-slate-300 mb-2">To Date</label>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="w-full bg-slate-950/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all [color-scheme:dark]"
                />
              </div>
            </>
          )}

          {activeReport === 'farmer-ledger' && !isFarmer && (
            <div className="col-span-1">
              <label className="block text-sm font-semibold text-slate-300 mb-2">Farmer</label>
              <select
                value={farmerCode}
                onChange={(e) => setFarmerCode(e.target.value)}
                className="w-full bg-slate-950/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              >
                <option value="">Select Farmer</option>
                {farmers.map(f => (
                  <option key={f.farmerCode} value={f.farmerCode}>{f.farmerCode} - {f.name}</option>
                ))}
              </select>
            </div>
          )}

          <div className="col-span-1 md:col-span-4 flex justify-end mt-2">
            <button
              onClick={loadReport}
              disabled={loading}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-emerald-500/20 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && <Activity className="w-5 h-5 animate-spin" />}
              {loading ? 'Generating...' : 'Generate Report'}
            </button>
          </div>
        </div>
      </div>

      {/* Print Header (Visible only in print) */}
      <div className="hidden print:block mb-8 text-center text-black">
        <h1 className="text-3xl font-bold mb-2">GK Dairy Management</h1>
        <h2 className="text-xl font-semibold border-b border-gray-400 pb-2 inline-block">
          {allowedReports.find(r => r.id === activeReport)?.label}
        </h2>
        {activeReport !== 'inventory' && activeReport !== 'statements' && (
          <p className="mt-3 text-sm text-gray-600">Period: {fromDate} to {toDate}</p>
        )}
      </div>

      {/* Report Content */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl print:bg-white print:border-none print:shadow-none print:text-black print:p-0">
        {renderReportContent()}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-rose-400 mb-2 flex items-center gap-2">
              <Trash2 className="w-5 h-5" /> Delete Entry
            </h3>
            <p className="text-sm text-slate-400 mb-4">Are you sure you want to delete this milk collection entry? This action cannot be undone.</p>
            
            <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 mb-6 space-y-2 text-sm text-slate-300">
              <div className="flex justify-between"><span>Date / Session:</span> <span className="font-bold text-white">{selectedEntry.date} ({selectedEntry.session})</span></div>
              <div className="flex justify-between"><span>Weight:</span> <span className="font-mono text-cyan-400">{selectedEntry.weight} L</span></div>
              <div className="flex justify-between"><span>Amount:</span> <span className="font-bold text-emerald-400">₹{selectedEntry.amount}</span></div>
            </div>

            <div className="flex justify-end gap-3">
              <button onClick={() => { setShowDeleteModal(false); setSelectedEntry(null); }} className="px-4 py-2 text-slate-400 hover:text-slate-200 text-sm font-medium transition-colors">Cancel</button>
              <button 
                onClick={async () => {
                  try {
                    setIsDeleting(true);
                    await milkCollectionApi.deleteMilkCollection(selectedEntry._id);
                    setShowDeleteModal(false);
                    setSelectedEntry(null);
                    loadReport(); // refresh report
                  } catch (err: any) {
                    alert(err.response?.data?.message || 'Failed to delete entry');
                  } finally {
                    setIsDeleting(false);
                  }
                }} 
                disabled={isDeleting} 
                className="bg-rose-500 hover:bg-rose-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                {isDeleting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
