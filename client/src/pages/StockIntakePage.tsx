import React, { useState, useEffect } from 'react';
import { Package, Plus, Search, Filter, CheckCircle2, AlertTriangle, Truck, Clock, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { procurementApi } from '../api/procurementApi';
import api from '../api/axios'; // For products/branches

export const StockIntakePage: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [stockIntakes, setStockIntakes] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  // Filters
  const [statusFilter, setStatusFilter] = useState('All');
  
  // Modals state
  const [showForm, setShowForm] = useState(false);
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [showDispatchModal, setShowDispatchModal] = useState(false);
  const [selectedTransfer, setSelectedTransfer] = useState<any>(null);

  // Form state
  const [formData, setFormData] = useState({
    product: '',
    quantity: '',
    plantTransferPrice: '',
    invoiceNumber: '',
    purchaseDate: new Date().toISOString().split('T')[0],
    notes: '',
    cogs: '',
    branch: ''
  });

  // Issue state
  const [issueData, setIssueData] = useState({
    actualReceivedQuantity: '',
    issueReason: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [intakeData, prodData, branchData] = await Promise.all([
        procurementApi.getProcurements(),
        api.get('/products'),
        isAdmin ? api.get('/branches') : Promise.resolve({ data: { data: [] } })
      ]);
      setStockIntakes(intakeData.data.data);
      setProducts(prodData.data.data);
      if (isAdmin) setBranches(branchData.data.data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      setError('');
      await procurementApi.createProcurement({
        ...formData,
        quantity: Number(formData.quantity),
        plantTransferPrice: Number(formData.plantTransferPrice),
        cogs: Number(formData.cogs)
      });
      setShowForm(false);
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create transfer');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDispatchClick = (t: any) => {
    setSelectedTransfer(t);
    setShowDispatchModal(true);
  };

  const handleDispatchSubmit = async () => {
    if (!selectedTransfer) return;
    try {
      setIsSubmitting(true);
      await procurementApi.dispatchProcurement(selectedTransfer._id);
      setShowDispatchModal(false);
      setSelectedTransfer(null);
      await fetchData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to dispatch');
      await fetchData(); // Refresh data to clear stale state
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if(!window.confirm('Are you sure you want to delete this pending transfer?')) return;
    try {
      setIsSubmitting(true);
      await procurementApi.deleteProcurement(id);
      await fetchData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete transfer');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReceiveSubmit = async () => {
    try {
      setIsSubmitting(true);
      await procurementApi.receiveProcurement(selectedTransfer._id);
      setShowReceiveModal(false);
      setSelectedTransfer(null);
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to receive stock');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleIssueSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      await procurementApi.reportIssue(selectedTransfer._id, {
        actualReceivedQuantity: Number(issueData.actualReceivedQuantity),
        issueReason: issueData.issueReason
      });
      setShowIssueModal(false);
      setSelectedTransfer(null);
      setIssueData({ actualReceivedQuantity: '', issueReason: '' });
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to report issue');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredTransfers = stockIntakes.filter(t => statusFilter === 'All' || t.status === statusFilter);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Pending': return <span className="bg-amber-500/10 text-amber-400 px-2 py-1 rounded-md text-xs font-bold flex items-center gap-1 w-max"><Clock className="w-3 h-3" /> Pending</span>;
      case 'Dispatched': return <span className="bg-blue-500/10 text-blue-400 px-2 py-1 rounded-md text-xs font-bold flex items-center gap-1 w-max"><Truck className="w-3 h-3" /> Dispatched</span>;
      case 'Received': return <span className="bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded-md text-xs font-bold flex items-center gap-1 w-max"><CheckCircle2 className="w-3 h-3" /> Received</span>;
      case 'Issue Reported': return <span className="bg-rose-500/10 text-rose-400 px-2 py-1 rounded-md text-xs font-bold flex items-center gap-1 w-max"><AlertTriangle className="w-3 h-3" /> Issue</span>;
      default: return <span className="bg-slate-500/10 text-slate-400 px-2 py-1 rounded-md text-xs font-bold w-max">{status}</span>;
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <Package className="w-6 h-6 text-indigo-400" />
            Stock Transfers
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Manage stock deliveries from GK Dairy Main Plant to Branches
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-medium transition-all shadow-lg shadow-indigo-500/25"
          >
            {showForm ? 'Cancel' : <><Plus className="w-4 h-4" /> New Transfer</>}
          </button>
        )}
      </div>

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/50 text-rose-400 p-4 rounded-xl text-sm">
          {error}
        </div>
      )}

      {showForm && isAdmin && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl animate-in fade-in slide-in-from-top-4">
          <h2 className="text-lg font-bold text-slate-100 mb-4">Create Stock Transfer</h2>
          <form onSubmit={handleCreateSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-400">Destination Branch <span className="text-rose-500">*</span></label>
              <select
                required
                value={formData.branch}
                onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
              >
                <option value="">Select a branch</option>
                {branches.map(b => (
                  <option key={b._id} value={b._id}>{b.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-400">Product <span className="text-rose-500">*</span></label>
              <select
                required
                value={formData.product}
                onChange={(e) => {
                  const selectedId = e.target.value;
                  const selectedProd = products.find(p => p._id === selectedId);
                  setFormData({ 
                    ...formData, 
                    product: selectedId,
                    plantTransferPrice: selectedProd ? String(selectedProd.plantTransferPrice || 0) : '',
                    cogs: selectedProd ? String(selectedProd.cogs || 0) : ''
                  });
                }}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
              >
                <option value="">Select a product</option>
                {products.map(p => (
                  <option key={p._id} value={p._id}>{p.nameEn} ({p.unit}) - Stock: {p.stock}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-400">Quantity <span className="text-rose-500">*</span></label>
              <input
                type="number" required min="0.01" step="0.01"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                placeholder="0.00"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-400">Plant Transfer Price <span className="text-rose-500">*</span></label>
              <input
                type="number" required min="0" step="0.01"
                value={formData.plantTransferPrice}
                onChange={(e) => setFormData({ ...formData, plantTransferPrice: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-400">COGS</label>
              <input
                type="number" required min="0" step="0.01"
                value={formData.cogs}
                onChange={(e) => setFormData({ ...formData, cogs: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200"
              />
            </div>

            <div className="md:col-span-2 lg:col-span-3 pt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm bg-slate-950 px-4 py-2 rounded-lg border border-slate-800">
                <span className="text-slate-400">Calculated Total: </span>
                <span className="text-lg font-bold text-emerald-400">
                  ₹{((Number(formData.quantity) || 0) * (Number(formData.plantTransferPrice) || 0)).toFixed(2)}
                </span>
              </div>
              <button
                type="submit" disabled={isSubmitting}
                className="bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white px-6 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 w-full sm:w-auto justify-center"
              >
                {isSubmitting ? 'Creating...' : 'Create Transfer'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Table Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="font-semibold text-slate-200">Transfer History</h3>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-sm text-slate-300 focus:border-indigo-500"
            >
              <option value="All">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Dispatched">Dispatched</option>
              <option value="Received">Received</option>
              <option value="Issue Reported">Issue Reported</option>
            </select>
          </div>
        </div>
        <div className="w-full overflow-x-auto pb-4 custom-scrollbar">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-800/50 text-xs uppercase font-semibold text-slate-400 border-b border-slate-800 whitespace-nowrap">
              <tr>
                <th className="px-4 py-3">ID / Date</th>
                <th className="px-4 py-3">Branch</th>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Qty</th>
                <th className="px-4 py-3">Total Amount</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {isLoading ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center">Loading...</td></tr>
              ) : filteredTransfers.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-400">No transfers found</td></tr>
              ) : (
                filteredTransfers.map((t) => (
                  <tr key={t._id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="text-xs text-slate-500">{t._id.slice(-6).toUpperCase()}</div>
                      <div className="text-slate-300">{new Date(t.createdAt).toLocaleDateString()}</div>
                    </td>
                    <td className="px-4 py-3">{t.branch?.name || 'Unknown'}</td>
                    <td className="px-4 py-3">{t.product?.nameEn || 'Unknown'}</td>
                    <td className="px-4 py-3 font-bold">{t.quantity}</td>
                    <td className="px-4 py-3 font-bold text-emerald-400">₹{t.totalTransferValue?.toFixed(2) || '0.00'}</td>
                    <td className="px-4 py-3">
                      {getStatusBadge(t.status)}
                      {t.status === 'Dispatched' && t.dispatchedAt && (
                        <div className="text-[10px] text-slate-500 mt-1">
                          {new Date(t.dispatchedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {isAdmin && t.status === 'Pending' && (
                          <button 
                            onClick={() => handleDispatchClick(t)} 
                            disabled={isSubmitting}
                            className="bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/40 disabled:opacity-50 px-3 py-1 rounded text-xs font-bold transition-colors"
                          >
                            {isSubmitting && selectedTransfer?._id === t._id ? 'Dispatching...' : 'Dispatch'}
                          </button>
                        )}
                        {!isAdmin && t.status === 'Dispatched' && (
                          <>
                            <button onClick={() => { setSelectedTransfer(t); setShowIssueModal(true); }} className="text-rose-400 hover:text-rose-300 text-xs font-bold">
                              Report Issue
                            </button>
                            <button onClick={() => { setSelectedTransfer(t); setShowReceiveModal(true); }} className="bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/40 px-3 py-1 rounded text-xs font-bold">
                              Receive Stock
                            </button>
                          </>
                        )}
                        {isAdmin && t.status === 'Issue Reported' && (
                          <span className="text-xs text-rose-400 font-medium">Review Needed</span>
                        )}
                        {isAdmin && (
                          <button 
                            onClick={() => handleDelete(t._id)} 
                            disabled={isSubmitting}
                            title="Delete Transfer"
                            className="text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 p-1.5 rounded disabled:opacity-50 transition-colors ml-2"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Receive Modal */}
      {showReceiveModal && selectedTransfer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-lg font-bold text-slate-100 mb-2">Confirm Stock Receipt</h3>
            <p className="text-sm text-slate-400 mb-4">Please confirm that you have physically received this stock.</p>
            
            <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 mb-6 space-y-2 text-sm text-slate-300">
              <div className="flex justify-between"><span>Product:</span> <span className="font-bold text-white">{selectedTransfer.product?.nameEn}</span></div>
              <div className="flex justify-between"><span>Expected Quantity:</span> <span className="font-bold text-emerald-400">{selectedTransfer.quantity}</span></div>
              <div className="flex justify-between"><span>Branch:</span> <span>{selectedTransfer.branch?.name}</span></div>
            </div>

            <div className="flex justify-end gap-3">
              <button onClick={() => setShowReceiveModal(false)} className="px-4 py-2 text-slate-400 hover:text-slate-200 text-sm font-medium">Cancel</button>
              <button onClick={handleReceiveSubmit} disabled={isSubmitting} className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                {isSubmitting ? 'Confirming...' : 'Confirm Received'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Issue Modal */}
      {showIssueModal && selectedTransfer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-lg font-bold text-rose-400 mb-2 flex items-center gap-2"><AlertTriangle className="w-5 h-5" /> Report Issue</h3>
            <p className="text-sm text-slate-400 mb-4">Report if the received quantity does not match the expected quantity.</p>
            
            <form onSubmit={handleIssueSubmit} className="space-y-4">
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex justify-between text-sm">
                <span className="text-slate-400">Expected:</span>
                <span className="font-bold text-white">{selectedTransfer.quantity} units</span>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Actual Received Quantity <span className="text-rose-500">*</span></label>
                <input
                  type="number" required min="0" step="0.01"
                  value={issueData.actualReceivedQuantity}
                  onChange={e => setIssueData({...issueData, actualReceivedQuantity: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Issue Reason <span className="text-rose-500">*</span></label>
                <textarea
                  required rows={3}
                  value={issueData.issueReason}
                  onChange={e => setIssueData({...issueData, issueReason: e.target.value})}
                  placeholder="E.g., 10 kg missing during delivery"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200"
                ></textarea>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowIssueModal(false)} className="px-4 py-2 text-slate-400 hover:text-slate-200 text-sm font-medium">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="bg-rose-500 hover:bg-rose-600 text-white px-4 py-2 rounded-lg text-sm font-bold">
                  {isSubmitting ? 'Submitting...' : 'Submit Report'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dispatch Modal */}
      {showDispatchModal && selectedTransfer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-slate-100 mb-2 flex items-center gap-2">
              <Truck className="w-5 h-5 text-indigo-400" /> Confirm Dispatch
            </h3>
            <p className="text-sm text-slate-400 mb-4">Are you sure you want to dispatch this stock? This will immediately deduct stock from the Main Plant inventory.</p>
            
            <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 mb-6 space-y-2 text-sm text-slate-300">
              <div className="flex justify-between"><span>Product:</span> <span className="font-bold text-white">{selectedTransfer.product?.nameEn}</span></div>
              <div className="flex justify-between"><span>Quantity:</span> <span className="font-bold text-indigo-400">{selectedTransfer.quantity}</span></div>
              <div className="flex justify-between"><span>Destination:</span> <span>{selectedTransfer.branch?.name}</span></div>
            </div>

            <div className="flex justify-end gap-3">
              <button onClick={() => { setShowDispatchModal(false); setSelectedTransfer(null); }} className="px-4 py-2 text-slate-400 hover:text-slate-200 text-sm font-medium transition-colors">Cancel</button>
              <button onClick={handleDispatchSubmit} disabled={isSubmitting} className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors disabled:opacity-50">
                <Truck className="w-4 h-4" />
                {isSubmitting ? 'Dispatching...' : 'Confirm Dispatch'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
