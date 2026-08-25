import React, { useState, useEffect } from 'react';
import { reportApi } from '../api/reportApi';
import { branchApi } from '../api/branchApi';
import { useAuth } from '../context/AuthContext';
import { Branch } from '../types/branch';
import {
  FileText, Download, Activity, Package, IndianRupee, ShoppingCart, Truck, Printer
} from 'lucide-react';

export const ShopReportsPage: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const isOwner = user?.role === 'dairyOwner';

  // Filter States
  const [activeReport, setActiveReport] = useState<string>('orders');
  const [fromDate, setFromDate] = useState<string>(
    new Date(Date.now() - 15 * 24 * 60 * 60 * 1000 - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0]
  );
  const [toDate, setToDate] = useState<string>(
    new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0]
  );
  const [selectedBranch, setSelectedBranch] = useState<string>('all');
  
  const [branches, setBranches] = useState<Branch[]>([]);

  // Report Data
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reportOptions = [
    { id: 'orders', label: 'Sales & Orders', icon: ShoppingCart, roles: ['admin', 'dairyOwner'] },
    { id: 'payments', label: 'Payments', icon: IndianRupee, roles: ['admin', 'dairyOwner'] },
    { id: 'products', label: 'Product Margin', icon: Package, roles: ['admin', 'dairyOwner'] },
    { id: 'inventory', label: 'Inventory', icon: Package, roles: ['admin', 'dairyOwner'] },
    { id: 'stock-movements', label: 'Stock Movements', icon: Activity, roles: ['admin', 'dairyOwner'] },
    { id: 'stock-transfers', label: 'Stock Transfers', icon: Truck, roles: ['admin', 'dairyOwner'] }
  ];

  const allowedReports = reportOptions.filter(r => r.roles.includes(user?.role || ''));

  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const list = await branchApi.getBranches();
        if (isOwner) {
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
  }, [user]);

  const loadReport = async () => {
    setLoading(true);
    setError(null);
    setReportData(null);
    try {
      const branchParam = selectedBranch === 'all' ? undefined : selectedBranch;
      let res;
      
      switch (activeReport) {
        case 'orders':
          res = await reportApi.getOrdersReport(branchParam, fromDate, toDate);
          setReportData(res.data);
          break;
        case 'payments':
          res = await reportApi.getPaymentsReport(branchParam, fromDate, toDate);
          setReportData(res.data);
          break;
        case 'inventory':
          res = await reportApi.getInventoryReport(branchParam);
          setReportData(res.data);
          break;
        case 'stock-movements':
          res = await reportApi.getStockMovementsReport(branchParam, fromDate, toDate);
          setReportData(res.data);
          break;
        case 'stock-transfers':
          res = await reportApi.getStockTransfersReport(branchParam, fromDate, toDate);
          setReportData(res.data);
          break;
        case 'products':
          res = await reportApi.getProductsReport(branchParam, fromDate, toDate);
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
      
      await reportApi.exportCSV(activeReport, params);
    } catch (err) {
      console.error('Export CSV Error:', err);
      setError('Failed to export CSV.');
    }
  };

  const renderTable = (headers: string[], dataKeys: (string | Function)[], data: any[]) => {
    if (!data || data.length === 0) return <div className="text-slate-400 text-center py-10">No data found for the selected filters.</div>;
    
    return (
      <div className="w-full overflow-x-auto pb-4 custom-scrollbar print:overflow-visible">
        <table className="w-full text-left text-sm text-slate-300 print:text-black">
          <thead className="bg-slate-800/50 text-slate-400 text-xs uppercase print:bg-gray-200 whitespace-nowrap">
            <tr>
              {headers.map((h, i) => <th key={i} className="px-4 py-3">{h}</th>)}
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
    if (!reportData) return <div className="text-center py-20 text-slate-500">Select options and click Generate</div>;

    switch (activeReport) {
      case 'orders':
        return renderTable(
          ['Date', 'Order ID', 'Branch', 'Customer', 'Items', 'Total (₹)', 'Payment', 'Status'],
          ['date', (r:any) => r.orderId.slice(-6).toUpperCase(), 'branch', 'customer', 'itemsSummary', 'totalAmount', 'paymentMethod', 'status'],
          reportData
        );
      case 'payments':
        return renderTable(
          ['Date', 'Payment ID', 'Order ID', 'Amount (₹)', 'Method', 'Status'],
          ['date', 'paymentId', (r:any) => r.orderId.slice(-6).toUpperCase(), 'amount', 'paymentMethod', 'paymentStatus'],
          reportData
        );
      case 'products':
        return renderTable(
          ['Product', 'Units Sold', 'Revenue (₹)', 'Selling Price', 'Plant Margin', 'Branch Margin'],
          ['productName', 'unitsSold', 'revenue', 'sellingPrice', 'plantMargin', 'branchMargin'],
          reportData
        );
      case 'inventory':
        return renderTable(
          ['Product', 'Branch', 'Stock', 'Unit', 'Status', 'Selling Price'],
          ['productName', 'branch', 'currentStock', 'unit', 'status', 'sellingPrice'],
          reportData
        );
      case 'stock-movements':
        return renderTable(
          ['Date', 'Product', 'Branch', 'Type', 'Qty', 'Previous', 'New'],
          ['date', 'productName', 'branch', 'type', 'quantity', 'previousStock', 'newStock'],
          reportData
        );
      case 'stock-transfers':
        return renderTable(
          ['Date', 'Transfer No', 'To Branch', 'Product', 'Qty', 'Status'],
          ['date', (r:any) => String(r.transferNumber).slice(-6).toUpperCase(), 'toBranch', 'productName', 'quantity', 'status'],
          reportData
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
          <h1 className="text-2xl font-bold text-slate-100">Shop Analytics &amp; Reports</h1>
          <p className="text-slate-400 mt-1">Sales, inventory, and product margin reports.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button onClick={() => window.print()} className="p-2.5 bg-slate-800 text-slate-300 hover:text-white rounded-xl border border-slate-700 transition-colors shadow" title="Print Report">
            <Printer className="w-5 h-5" />
          </button>
          <button onClick={handleExportCSV} className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl font-medium shadow-lg shadow-indigo-500/20 transition-all">
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
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

          {activeReport !== 'inventory' && (
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
        {activeReport !== 'inventory' && (
          <p className="mt-3 text-sm text-gray-600">Period: {fromDate} to {toDate}</p>
        )}
      </div>

      {/* Report Content */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl print:bg-white print:border-none print:shadow-none print:text-black print:p-0">
        {renderReportContent()}
      </div>

    </div>
  );
};
