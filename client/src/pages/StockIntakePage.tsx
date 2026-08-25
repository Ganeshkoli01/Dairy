import React, { useState, useEffect } from 'react';
import { ShoppingCart, Plus, Calendar, Receipt, DollarSign, Package } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

export const StockIntakePage: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [stockIntakes, setStockIntakes] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  // Form state
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    product: '',
    quantity: '',
    plantTransferPrice: '',
    invoiceNumber: '',
    purchaseDate: new Date().toISOString().split('T')[0],
    notes: '',
    cogs: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [intakeData, prodData] = await Promise.all([
        api.get('/procurements'), // Backend API still uses /procurements for compatibility
        api.get('/products')
      ]);
      setStockIntakes(intakeData.data.data);
      setProducts(prodData.data.data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      setError('');
      
      await api.post('/procurements', {
        ...formData,
        quantity: Number(formData.quantity),
        plantTransferPrice: Number(formData.plantTransferPrice),
        cogs: Number(formData.cogs)
      });
      
      setShowForm(false);
      setFormData({
        product: '',
        quantity: '',
        plantTransferPrice: '',
        invoiceNumber: '',
        purchaseDate: new Date().toISOString().split('T')[0],
        notes: '',
        cogs: ''
      });
      
      fetchData(); // Refresh list
    } catch (err: any) {
      setError(err.message || 'Failed to record stock intake');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <Package className="w-6 h-6 text-indigo-400" />
            Stock Transfer
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Record and manage internal stock transfers from GK Dairy Main Plant to your Branch
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-medium transition-all shadow-lg shadow-indigo-500/25"
        >
          {showForm ? 'Cancel' : (
            <>
              <Plus className="w-4 h-4" />
              New Transfer
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/50 text-rose-400 p-4 rounded-xl text-sm">
          {error}
        </div>
      )}

      {showForm && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
          <h2 className="text-lg font-bold text-slate-100 mb-4">Record New Stock Transfer</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

            
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
                  <option key={p._id} value={p._id}>
                    {p.nameEn} ({p.unit}) - Transfer: ₹{p.plantTransferPrice || 0}
                    {isAdmin ? `, COGS: ₹${p.cogs || 0}` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-400">Quantity <span className="text-rose-500">*</span></label>
              <input
                type="number"
                required
                min="0.01"
                step="0.01"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                placeholder="0.00"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-400">Plant Transfer Price (Per Unit) <span className="text-rose-500">*</span></label>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                value={formData.plantTransferPrice}
                onChange={(e) => setFormData({ ...formData, plantTransferPrice: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                placeholder="₹0.00"
              />
            </div>

            {isAdmin && (
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-slate-400">COGS (Per Unit) <span className="text-rose-500">*</span></label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={formData.cogs}
                  onChange={(e) => setFormData({ ...formData, cogs: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                  placeholder="₹0.00"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-400">Invoice Number</label>
              <input
                type="text"
                value={formData.invoiceNumber}
                onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                placeholder="Optional"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-400">Purchase Date <span className="text-rose-500">*</span></label>
              <input
                type="date"
                required
                value={formData.purchaseDate}
                onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
              />
            </div>

            <div className="space-y-1.5 md:col-span-2 lg:col-span-3">
              <label className="block text-xs font-medium text-slate-400">Notes</label>
              <input
                type="text"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                placeholder="Optional notes about this purchase"
              />
            </div>

            <div className="md:col-span-2 lg:col-span-3 pt-2">
              <div className="flex items-center justify-between p-4 bg-slate-950 rounded-lg border border-slate-800">
                <div className="text-sm text-slate-400 flex flex-col gap-1">
                  <div>
                    Total Transfer Value: <span className="text-lg font-bold text-emerald-400 ml-2">₹{(Number(formData.quantity) * Number(formData.plantTransferPrice) || 0).toFixed(2)}</span>
                  </div>
                  {isAdmin && (
                    <div>
                      Total COGS Value: <span className="text-base font-bold text-slate-300 ml-2">₹{(Number(formData.quantity) * Number(formData.cogs) || 0).toFixed(2)}</span>
                    </div>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white px-6 py-2 rounded-lg text-sm font-medium transition-all shadow-lg shadow-indigo-500/25 flex items-center gap-2"
                >
                  {isSubmitting ? 'Saving...' : 'Save Transfer'}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="font-semibold text-slate-200">Recent Transfers (Stock Received)</h3>
        </div>
        <div className="w-full overflow-x-auto pb-4 custom-scrollbar">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-800/50 text-xs uppercase font-semibold text-slate-400 border-b border-slate-800 whitespace-nowrap">
              <tr>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Product</th>
                <th className="px-6 py-4">Qty</th>
                <th className="px-6 py-4">Transfer Price</th>
                {isAdmin && <th className="px-6 py-4">COGS</th>}
                <th className="px-6 py-4">Transfer Val</th>
                {isAdmin && <th className="px-6 py-4">COGS Val</th>}
                <th className="px-6 py-4">Invoice</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {isLoading ? (
                <tr>
                  <td colSpan={isAdmin ? 8 : 6} className="px-6 py-8 text-center text-slate-400">
                    Loading transfers...
                  </td>
                </tr>
              ) : stockIntakes.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 8 : 6} className="px-6 py-8 text-center text-slate-400">
                    No transfers found
                  </td>
                </tr>
              ) : (
                stockIntakes.map((proc) => (
                  <tr key={proc._id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4 text-slate-400">
                      {new Date(proc.purchaseDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-slate-300">
                      {proc.product?.nameEn || 'Unknown'}
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-200">
                      +{proc.quantity}
                    </td>
                    <td className="px-6 py-4 text-slate-400">
                      ₹{proc.plantTransferPrice}
                    </td>
                    {isAdmin && (
                      <td className="px-6 py-4 text-slate-400">
                        ₹{proc.cogs || 0}
                      </td>
                    )}
                    <td className="px-6 py-4 font-bold text-emerald-400">
                      ₹{proc.totalTransferValue}
                    </td>
                    {isAdmin && (
                      <td className="px-6 py-4 font-bold text-slate-300">
                        ₹{proc.totalCogsValue || 0}
                      </td>
                    )}
                    <td className="px-6 py-4 text-slate-400">
                      {proc.invoiceNumber || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
