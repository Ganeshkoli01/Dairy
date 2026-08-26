import React, { useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { orderApi } from '../api/orderApi';
import { Order } from '../types/product';
import { useAuth } from '../context/AuthContext';

export const OrdersHistoryPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await orderApi.getOrders();
      if (res.success) {
        setOrders(res.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await orderApi.updateOrderStatus(id, status);
      fetchOrders();
    } catch (err) {
      console.error('Failed to update status', err);
    }
  };

  const handleDeleteClick = (order: Order) => {
    setSelectedOrder(order);
    setShowDeleteModal(true);
    setModalError(null);
  };

  const handleConfirmDelete = async () => {
    if (!selectedOrder) return;
    try {
      setIsDeleting(true);
      setModalError(null);
      await orderApi.deleteOrder(selectedOrder._id || '');
      setShowDeleteModal(false);
      setSelectedOrder(null);
      fetchOrders();
    } catch (err: any) {
      console.error('Failed to delete order', err);
      setModalError(err.response?.data?.message || 'Failed to delete order. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Orders History</h1>
          <p className="text-slate-400 mt-1">View your recent orders and payment status</p>
        </div>
      </div>

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-500 p-4 rounded-xl mb-6">
          {error}
        </div>
      )}

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
        <div className="w-full overflow-x-auto pb-4 custom-scrollbar">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-800/50 text-xs uppercase text-slate-400 border-b border-slate-800 whitespace-nowrap">
              <tr>
                <th className="px-6 py-4 font-semibold">Order ID & Date</th>
                {isAdmin && <th className="px-6 py-4 font-semibold">Branch</th>}
                <th className="px-6 py-4 font-semibold">Customer Details</th>
                <th className="px-6 py-4 font-semibold">Items</th>
                <th className="px-6 py-4 font-semibold text-right">Total Amount</th>
                <th className="px-6 py-4 font-semibold text-center">Payment</th>
                <th className="px-6 py-4 font-semibold text-center">Status</th>
                <th className="px-6 py-4 font-semibold text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 7 : 6} className="px-6 py-12 text-center text-slate-500">
                    No orders found.
                  </td>
                </tr>
              ) : (
                orders.map((order, idx) => (
                  <tr key={order._id || idx} className="hover:bg-slate-800/20 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-mono text-xs text-indigo-400">{(order._id || '').slice(-6)}</div>
                      <div className="text-slate-500 mt-1">{new Date(order.createdAt || Date.now()).toLocaleDateString()}</div>
                    </td>
                    {isAdmin && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-slate-300">
                          {(order as any).branch && typeof (order as any).branch === 'object' ? (
                            <>
                              <div className="font-medium text-white">{((order as any).branch as any).name}</div>
                              <div className="text-xs text-indigo-400 font-mono mt-0.5">{((order as any).branch as any).code}</div>
                            </>
                          ) : (
                            (order as any).branch || 'N/A'
                          )}
                        </div>
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-white font-medium">{order.customerDetails.name}</div>
                      <div className="text-slate-500 text-xs mt-0.5">{order.customerDetails.phone}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="text-xs text-slate-400">
                            {item.quantity} {item.unit} × {item.nameEn}
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right font-semibold text-white">
                      ₹{order.totalAmount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-xs font-medium text-slate-400">{order.paymentMethod}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          order.paymentStatus === 'Completed' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 
                          'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}>
                          {order.paymentStatus}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {isAdmin ? (
                        <select
                          value={order.status}
                          onChange={(e) => handleStatusChange(order._id || '', e.target.value)}
                          className={`bg-slate-950 border border-slate-700 rounded-lg text-xs py-1 px-2 focus:ring-indigo-500 focus:border-indigo-500 font-bold ${
                            order.status === 'Received' ? 'text-emerald-400 border-emerald-500/30' :
                            order.status === 'Delivered' ? 'text-teal-400 border-teal-500/30' :
                            order.status === 'Pending' ? 'text-amber-400 border-amber-500/30' :
                            order.status === 'Cancelled' ? 'text-rose-400 border-rose-500/30' :
                            'text-indigo-400 border-indigo-500/30'
                          }`}
                        >
                          <option value="Pending" className="text-amber-400">Pending</option>
                          <option value="Processing" className="text-indigo-400">Processing</option>
                          <option value="Delivered" className="text-teal-400">Delivered</option>
                          {order.status === 'Received' && <option value="Received" className="text-emerald-400">Received</option>}
                          <option value="Cancelled" className="text-rose-400">Cancelled</option>
                        </select>
                      ) : (
                        <span className={`px-2 py-1 rounded-md text-xs font-bold ${
                          order.status === 'Received' ? 'bg-emerald-500/10 text-emerald-400' :
                          order.status === 'Delivered' ? 'bg-teal-500/10 text-teal-400' :
                          order.status === 'Pending' ? 'bg-amber-500/10 text-amber-400' :
                          order.status === 'Cancelled' ? 'bg-rose-500/10 text-rose-400' :
                          'bg-indigo-500/10 text-indigo-400'
                        }`}>
                          {order.status}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-2">
                        {!isAdmin && order.status === 'Delivered' && (
                          <button
                            onClick={async () => {
                              try {
                                await orderApi.receiveOrder(order._id || '');
                                fetchOrders();
                              } catch (err: any) {
                                alert(err.response?.data?.message || 'Failed to receive order');
                              }
                            }}
                            className="inline-flex items-center justify-center px-3 py-1.5 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/40 rounded-lg text-xs font-bold transition-colors"
                          >
                            Confirm Receipt
                          </button>
                        )}
                        <button
                          onClick={() => orderApi.downloadInvoice(order._id || '', (order as any).invoiceNumber)}
                          className="inline-flex items-center justify-center p-2 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500 hover:text-white rounded-lg transition-colors border border-indigo-500/20 shadow-sm"
                          title="Download Invoice PDF"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                          </svg>
                        </button>
                        {isAdmin && (
                          <button
                            onClick={() => handleDeleteClick(order)}
                            className="inline-flex items-center justify-center p-2 bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white rounded-lg transition-colors border border-rose-500/20 shadow-sm"
                            title="Delete Order"
                          >
                            <Trash2 className="w-5 h-5" />
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
      
      {/* Delete Modal */}
      {showDeleteModal && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-rose-400 mb-2 flex items-center gap-2">
              <Trash2 className="w-5 h-5" /> Delete Order
            </h3>
            
            {modalError && (
              <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 p-3 rounded-lg text-sm mb-4 animate-in fade-in">
                {modalError}
              </div>
            )}
            
            <p className="text-sm text-slate-400 mb-4">Are you sure you want to delete this order? This action cannot be undone.</p>
            
            <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 mb-6 space-y-2 text-sm text-slate-300">
              <div className="flex justify-between"><span>Order ID:</span> <span className="font-mono text-indigo-400">{(selectedOrder._id || '').slice(-6)}</span></div>
              <div className="flex justify-between"><span>Customer:</span> <span className="font-bold text-white">{selectedOrder.customerDetails.name}</span></div>
              <div className="flex justify-between"><span>Total Amount:</span> <span className="font-bold text-emerald-400">₹{selectedOrder.totalAmount}</span></div>
            </div>

            <div className="flex justify-end gap-3">
              <button onClick={() => { setShowDeleteModal(false); setSelectedOrder(null); setModalError(null); }} className="px-4 py-2 text-slate-400 hover:text-slate-200 text-sm font-medium transition-colors">Cancel</button>
              <button onClick={handleConfirmDelete} disabled={isDeleting} className="bg-rose-500 hover:bg-rose-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors disabled:opacity-50">
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
