import React, { useEffect, useState } from 'react';
import { paymentApi } from '../api/paymentApi';
import { 
  CreditCard, Search, Download, Filter, 
  CheckCircle, Clock, XCircle, AlertCircle, Eye, Trash2,
  IndianRupee, TrendingUp, Calendar, ShoppingCart, User, AlertTriangle
} from 'lucide-react';

export const PaymentsPage: React.FC = () => {
  const [payments, setPayments] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [type, setType] = useState('all'); // 'all', 'farmer', 'ecommerce'
  const [status, setStatus] = useState('all');
  const [search, setSearch] = useState('');
  
  // Modal state
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [paymentToDelete, setPaymentToDelete] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchPayments();
  }, [type, status]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const params = { type, status };
      if (search) Object.assign(params, { search });
      const response = await paymentApi.getAdminPayments(params);
      if (response.success) {
        setPayments(response.data);
        setSummary(response.summary);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch payments');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPayments();
  };

  const handleDelete = (payment: any) => {
    setPaymentToDelete(payment);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!paymentToDelete) return;
    try {
      setDeleting(true);
      await paymentApi.deletePayment(paymentToDelete.id, paymentToDelete.recordType);
      setPayments(payments.filter(p => p.id !== paymentToDelete.id));
      setShowDeleteModal(false);
      setPaymentToDelete(null);
    } catch (err: any) {
      alert(err.message || 'Failed to delete payment');
    } finally {
      setDeleting(false);
    }
  };

  const handleExport = async () => {
    try {
      const params = { type, status };
      if (search) Object.assign(params, { search });
      const response = await paymentApi.exportPaymentsToCsv(params);
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `payments_export_${new Date().getTime()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      alert('Failed to export data');
    }
  };

  const getStatusBadge = (statusStr: string) => {
    switch (statusStr?.toLowerCase()) {
      case 'completed':
      case 'paid':
        return <span className="px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"><CheckCircle className="w-3.5 h-3.5 mr-1" /> Completed</span>;
      case 'pending':
        return <span className="px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20"><Clock className="w-3.5 h-3.5 mr-1" /> Pending</span>;
      case 'failed':
        return <span className="px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20"><XCircle className="w-3.5 h-3.5 mr-1" /> Failed</span>;
      default:
        return <span className="px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-slate-500/10 text-slate-400 border border-slate-500/20">{statusStr}</span>;
    }
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-12 w-full max-w-9xl mx-auto relative">
      <div className="absolute -top-10 -right-10 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
      
      <div className="sm:flex sm:items-end sm:justify-between mb-8 relative z-10">
        <div className="sm:flex-auto">
          <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-indigo-200 to-indigo-400 flex items-center">
            <CreditCard className="w-8 h-8 mr-3 text-indigo-400" />
            Central Payments
          </h1>
          <p className="mt-3 text-base text-slate-400 max-w-2xl font-light">
            Manage all financial transactions including Farmer payouts and E-Commerce orders.
          </p>
        </div>
        <div className="mt-6 sm:mt-0 sm:ml-16 sm:flex-none">
          <button 
            onClick={handleExport}
            className="inline-flex items-center justify-center rounded-full border border-indigo-500/30 bg-indigo-600/20 px-6 py-2.5 text-sm font-medium text-indigo-300 shadow-lg shadow-indigo-500/10 hover:bg-indigo-600 hover:text-white hover:shadow-indigo-500/25 transition-all"
          >
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden group hover:border-indigo-500/30 transition-colors">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <IndianRupee className="w-16 h-16 text-indigo-400" />
          </div>
          <p className="text-sm font-medium text-slate-400 mb-1">Total Paid Amount</p>
          <h3 className="text-3xl font-bold text-white">₹{summary?.totalPaidAmount?.toLocaleString() || 0}</h3>
        </div>
        
        <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden group hover:border-amber-500/30 transition-colors">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Clock className="w-16 h-16 text-amber-400" />
          </div>
          <p className="text-sm font-medium text-slate-400 mb-1">Total Pending Amount</p>
          <h3 className="text-3xl font-bold text-amber-400">₹{summary?.totalPendingAmount?.toLocaleString() || 0}</h3>
        </div>

        <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden group hover:border-emerald-500/30 transition-colors">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <TrendingUp className="w-16 h-16 text-emerald-400" />
          </div>
          <p className="text-sm font-medium text-slate-400 mb-1">Monthly E-Comm Revenue</p>
          <h3 className="text-3xl font-bold text-emerald-400">₹{summary?.thisMonthRevenue?.toLocaleString() || 0}</h3>
        </div>

        <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden group hover:border-indigo-500/30 transition-colors">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <CreditCard className="w-16 h-16 text-indigo-400" />
          </div>
          <p className="text-sm font-medium text-slate-400 mb-1">Total Transactions</p>
          <h3 className="text-3xl font-bold text-white">{summary?.totalPayments || 0}</h3>
        </div>
      </div>

      {/* Tabs and Filters */}
      <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl p-4 mb-6 flex flex-col lg:flex-row gap-4 justify-between items-center shadow-lg">
        <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button 
            onClick={() => setType('all')} 
            className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${type === 'all' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
          >
            All Payments
          </button>
          <button 
            onClick={() => setType('farmer')} 
            className={`px-6 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${type === 'farmer' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <User className="w-4 h-4" /> Farmers
          </button>
          <button 
            onClick={() => setType('ecommerce')} 
            className={`px-6 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${type === 'ecommerce' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <ShoppingCart className="w-4 h-4" /> E-Commerce
          </button>
        </div>

        <form onSubmit={handleSearch} className="flex gap-3 w-full lg:w-auto">
          <div className="relative flex-grow lg:flex-grow-0 lg:w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-500" />
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search ID, Name..."
              className="block w-full pl-10 pr-3 py-2 border border-slate-700 rounded-xl leading-5 bg-slate-950 text-slate-300 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
          
          <select 
            value={status} 
            onChange={(e) => setStatus(e.target.value)}
            className="block w-40 pl-3 pr-10 py-2 text-base border-slate-700 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-xl bg-slate-950 text-slate-300"
          >
            <option value="all">All Status</option>
            <option value="Completed">Completed</option>
            <option value="Pending">Pending</option>
            <option value="Failed">Failed</option>
          </select>
          
          <button type="submit" className="bg-slate-800 text-slate-300 p-2 rounded-xl border border-slate-700 hover:bg-slate-700 transition-colors hidden sm:block">
            <Filter className="w-5 h-5" />
          </button>
        </form>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl mb-6 flex items-center gap-3">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden shadow-2xl rounded-2xl border border-slate-800 bg-slate-900/50 backdrop-blur-sm">
        {loading ? (
          <div className="flex justify-center items-center p-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
          </div>
        ) : payments.length === 0 ? (
          <div className="text-center p-12 text-slate-400">
            <CreditCard className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No payments found matching your criteria.</p>
            <p className="text-sm mt-1 opacity-75">Try changing your filters or search terms.</p>
          </div>
        ) : (
          <div className="w-full overflow-x-auto pb-4 custom-scrollbar">
            <table className="min-w-full divide-y divide-slate-800/50">
              <thead className="bg-slate-800/30 whitespace-nowrap">
                <tr>
                  <th scope="col" className="py-4 pl-4 pr-3 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider sm:pl-6">Type</th>
                  <th scope="col" className="px-3 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">Payment ID</th>
                  <th scope="col" className="px-3 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">Name</th>
                  <th scope="col" className="px-3 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">Amount</th>
                  <th scope="col" className="px-3 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">Status</th>
                  <th scope="col" className="px-3 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">Date</th>
                  <th scope="col" className="relative py-4 pl-3 pr-4 sm:pr-6"><span className="sr-only">View</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50 bg-transparent">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-800/40 transition-colors group">
                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
                      <span className={`px-2.5 py-1 rounded-md text-xs font-medium border ${p.recordType === 'farmer' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/20'}`}>
                        {p.recordType === 'farmer' ? 'Farmer' : 'E-Comm'}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-300 font-mono text-xs">{p.paymentId}</td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm font-medium text-slate-200">
                      {p.name}
                      {p.code !== 'N/A' && <span className="block text-xs text-slate-500 mt-0.5">Code: {p.code}</span>}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-200 font-medium">₹{p.amount?.toLocaleString()}</td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm">{getStatusBadge(p.status)}</td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-400">{new Date(p.date).toLocaleDateString()}</td>
                    <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                      <div className="flex justify-end gap-3 opacity-70 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => setSelectedPayment(p)}
                          className="p-2 rounded-lg bg-slate-800 text-indigo-400 hover:bg-indigo-500 hover:text-white transition-all"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(p)}
                          className="p-2 rounded-lg bg-slate-800 text-rose-400 hover:bg-rose-500 hover:text-white transition-all"
                          title="Delete Payment"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Payment Details Modal */}
      {selectedPayment && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl max-w-2xl w-full flex flex-col">
            <div className="px-6 py-5 border-b border-slate-800 flex justify-between items-center bg-slate-900 rounded-t-2xl">
              <h3 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                {selectedPayment.recordType === 'farmer' ? <User className="w-5 h-5 text-indigo-400" /> : <ShoppingCart className="w-5 h-5 text-indigo-400" />}
                Payment Details
              </h3>
              <button onClick={() => setSelectedPayment(null)} className="text-slate-400 hover:text-slate-200 transition-colors">
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              <div className="flex justify-between items-start mb-6 pb-6 border-b border-slate-800">
                <div>
                  <p className="text-sm text-slate-400">Payment ID</p>
                  <p className="text-lg font-mono text-slate-200">{selectedPayment.paymentId}</p>
                  <p className="text-sm text-slate-500 mt-1">{new Date(selectedPayment.date).toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-slate-400 mb-1">Status</p>
                  {getStatusBadge(selectedPayment.status)}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 mb-8">
                <div>
                  <h4 className="text-sm font-semibold text-slate-300 mb-3 uppercase tracking-wider">Party Details</h4>
                  <div className="space-y-2 text-sm">
                    <p><span className="text-slate-500">Name:</span> <span className="text-slate-200 font-medium">{selectedPayment.name}</span></p>
                    {selectedPayment.code !== 'N/A' && <p><span className="text-slate-500">Code:</span> <span className="text-slate-200">{selectedPayment.code}</span></p>}
                    <p><span className="text-slate-500">Branch:</span> <span className="text-slate-200">{selectedPayment.branch}</span></p>
                    {selectedPayment.details.phone && <p><span className="text-slate-500">Phone:</span> <span className="text-slate-200">{selectedPayment.details.phone}</span></p>}
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-300 mb-3 uppercase tracking-wider">Transaction Info</h4>
                  <div className="space-y-2 text-sm">
                    <p><span className="text-slate-500">Method:</span> <span className="text-slate-200">{selectedPayment.method}</span></p>
                    <p><span className="text-slate-500">Type:</span> <span className="text-slate-200">{selectedPayment.recordType === 'farmer' ? 'Milk Collection Payout' : 'E-Commerce Order'}</span></p>
                  </div>
                </div>
              </div>

              <div className="bg-slate-950 rounded-xl border border-slate-800 p-4">
                <h4 className="text-sm font-semibold text-slate-300 mb-4 uppercase tracking-wider border-b border-slate-800 pb-2">Breakdown</h4>
                
                {selectedPayment.recordType === 'farmer' ? (
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between text-slate-300"><span className="text-slate-500">Milk Type:</span> <span className="capitalize">{selectedPayment.details.milkType}</span></div>
                    <div className="flex justify-between text-slate-300"><span className="text-slate-500">Session:</span> <span className="capitalize">{selectedPayment.details.session}</span></div>
                    <div className="flex justify-between text-slate-300"><span className="text-slate-500">Quantity:</span> <span>{selectedPayment.details.quantity} Liters</span></div>
                    <div className="flex justify-between text-slate-300"><span className="text-slate-500">FAT / SNF:</span> <span>{selectedPayment.details.fat}% / {selectedPayment.details.snf}%</span></div>
                    <div className="flex justify-between text-slate-300"><span className="text-slate-500">Rate:</span> <span>₹{selectedPayment.details.rate}/L</span></div>
                  </div>
                ) : (
                  <div className="space-y-3 text-sm">
                    {selectedPayment.details.products?.map((item: any, idx: number) => (
                      <div key={idx} className="flex justify-between text-slate-300 items-center">
                        <span className="text-slate-400">{item.nameEn} (x{item.quantity})</span>
                        <span>₹{item.price * item.quantity}</span>
                      </div>
                    ))}
                  </div>
                )}
                
                <div className="mt-4 pt-4 border-t border-slate-800 flex justify-between items-center">
                  <span className="font-bold text-slate-200 text-lg">Total Amount</span>
                  <span className="font-bold text-indigo-400 text-xl">₹{selectedPayment.amount?.toLocaleString()}</span>
                </div>
              </div>
            </div>
            
            <div className="px-6 py-4 border-t border-slate-800 bg-slate-900 rounded-b-2xl flex justify-end">
              <button 
                onClick={() => setSelectedPayment(null)}
                className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl transition-colors border border-slate-700 font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && paymentToDelete && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 transition-opacity">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden transform transition-all">
            <div className="p-6 sm:p-8 flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-rose-500/10 flex items-center justify-center mb-6 border border-rose-500/20">
                <AlertTriangle className="w-8 h-8 text-rose-500" />
              </div>
              <h3 className="text-2xl font-bold text-slate-100 mb-3">Delete Payment?</h3>
              <p className="text-slate-400 mb-8 leading-relaxed">
                Are you sure you want to permanently remove payment <span className="font-semibold text-slate-200">{paymentToDelete.paymentId}</span>? This action cannot be undone and will delete the underlying record.
              </p>
              <div className="flex w-full gap-3 sm:gap-4">
                <button 
                  onClick={() => setShowDeleteModal(false)} 
                  disabled={deleting}
                  className="flex-1 bg-transparent py-3 px-4 border border-slate-700 rounded-xl text-sm font-semibold text-slate-300 hover:bg-slate-800 focus:outline-none transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmDelete}
                  disabled={deleting}
                  className="flex-1 bg-rose-500/20 py-3 px-4 border border-rose-500/30 rounded-xl text-sm font-semibold text-rose-400 hover:bg-rose-500 hover:text-white focus:outline-none disabled:opacity-50 transition-colors shadow-lg shadow-rose-500/10"
                >
                  {deleting ? 'Deleting...' : 'Yes, Delete it'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
