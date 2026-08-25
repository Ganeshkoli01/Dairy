import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { useNavigate } from 'react-router-dom';
import { orderApi } from '../api/orderApi';
import { OrderItem } from '../types/product';
import { useAuth } from '../context/AuthContext';

export const CheckoutPage: React.FC = () => {
  const { cart, totalPrice, clearCart } = useCart();
  const navigate = useNavigate();

  const { user } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    paymentMethod: 'Cash on Delivery',
    branchId: user?.dairyOwnerProfile?.branchId || '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [placedOrderId, setPlacedOrderId] = useState<string | null>(null);
  const [otp, setOtp] = useState('');
  const [sendingOtp, setSendingOtp] = useState(false);
  const submittingRef = React.useRef(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const isDairyOwner = user?.role === 'dairyOwner';
  const assignedBranch = user?.dairyOwnerProfile?.branchName;

  // Navigation effect is now below

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => {
        resolve(true);
      };
      script.onerror = () => {
        resolve(false);
      };
      document.body.appendChild(script);
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleInitialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submittingRef.current) return;
    
    if (isDairyOwner) {
      if (!assignedBranch) return; // Form will be disabled anyway
      if (!formData.branchId) {
        setError("Please select your branch before proceeding.");
        return;
      }
      
      submittingRef.current = true;
      setSendingOtp(true);
      setError(null);
      try {
        await orderApi.sendOrderOtp();
        setShowOtpModal(true);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to send OTP. Please try again.');
      } finally {
        submittingRef.current = false;
        setSendingOtp(false);
      }
    } else {
      submittingRef.current = true;
      try {
        await processOrder();
      } finally {
        submittingRef.current = false;
      }
    }
  };

  const handleResendOtp = async () => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setSendingOtp(true);
    setError(null);
    setResendMessage(null);
    try {
      await orderApi.sendOrderOtp();
      setResendMessage('A new OTP has been sent to your email.');
      setOtp('');
      setTimeout(() => setResendMessage(null), 5000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to resend OTP. Please try again.');
    } finally {
      submittingRef.current = false;
      setSendingOtp(false);
    }
  };

  const processOrder = async () => {
    setLoading(true);
    setError(null);

    try {
      const items: OrderItem[] = cart.map(item => ({
        product: item._id,
        nameEn: item.nameEn,
        nameMr: item.nameMr,
        price: item.price,
        quantity: item.quantity,
        unit: item.unit
      }));

      const orderData = {
        customerDetails: {
          name: formData.name,
          phone: formData.phone,
          address: formData.address,
        },
        items,
        totalAmount: totalPrice,
        paymentMethod: formData.paymentMethod as any,
        branchId: formData.branchId,
        ...(isDairyOwner && { otp }),
      };

      const response = await orderApi.createOrder(orderData);
      
      if (response.success) {
        if (formData.paymentMethod === 'Online Payment') {
          const res = await loadRazorpayScript();
          if (!res) {
            setError('Razorpay SDK failed to load. Are you online?');
            setLoading(false);
            return;
          }

          const options = {
            key: 'rzp_test_TTgoVzik6Oo0lm', // Real test key from user
            amount: totalPrice * 100,
            currency: 'INR',
            name: 'Dairy Milk Collection',
            description: 'Order Payment',
            order_id: response.razorpayOrderId,
            handler: async function (paymentResponse: any) {
              try {
                setLoading(true);
                const verifyRes = await orderApi.verifyPayment({
                  razorpay_order_id: paymentResponse.razorpay_order_id,
                  razorpay_payment_id: paymentResponse.razorpay_payment_id,
                  razorpay_signature: paymentResponse.razorpay_signature,
                });
                if (verifyRes.success) {
                  setPlacedOrderId(response.data._id || null);
                  clearCart();
                  setShowOtpModal(false);
                  setShowSuccessModal(true);
                }
              } catch (err: any) {
                setError('Payment verification failed');
              } finally {
                setLoading(false);
              }
            },
            prefill: {
              name: formData.name,
              contact: formData.phone,
            },
            theme: {
              color: '#4f46e5',
            },
          };
          const paymentObject = new (window as any).Razorpay(options);
          paymentObject.on('payment.failed', function (paymentResponse: any) {
            setError(`Payment failed: ${paymentResponse.error.description}`);
            setLoading(false);
          });
          paymentObject.open();
          setLoading(false); // Reset loading while modal is open
        } else {
          setPlacedOrderId(response.data._id || null);
          setLoading(false);
          clearCart();
          setShowOtpModal(false);
          setShowSuccessModal(true);
        }
      } else {
        setLoading(false);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to place order');
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (cart.length === 0) {
      navigate('/shop');
    }
  }, [cart.length, navigate]);

  if (cart.length === 0) {
    return null;
  }

  const isBlocked = isDairyOwner && !assignedBranch;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-white tracking-tight mb-8">Checkout</h1>
      
      {error && !showOtpModal && (
        <div className="bg-red-50 text-red-600 p-4 rounded-md mb-6">
          {error}
        </div>
      )}

      <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 shadow-2xl sm:rounded-2xl p-6 sm:p-8 relative overflow-hidden">
        {isBlocked && (
          <div className="absolute inset-0 z-20 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-6">
            <div className="bg-slate-900 border border-rose-500/30 p-8 rounded-2xl max-w-md text-center">
              <div className="w-16 h-16 bg-rose-500/10 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Branch Assignment Required</h3>
              <p className="text-slate-400">Your account is not assigned to a branch. Please contact the administrator.</p>
            </div>
          </div>
        )}

        <form onSubmit={handleInitialSubmit} className="space-y-6">
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-white">Customer Details</h2>
            </div>
            
            {isDairyOwner && (
              <div className="mb-6">
                <label htmlFor="branchId" className="block text-sm font-medium text-slate-300 mb-1.5">Branch</label>
                <div className="relative">
                  <select
                    name="branchId"
                    id="branchId"
                    required
                    value={formData.branchId}
                    onChange={handleChange}
                    className="block w-full rounded-xl border border-slate-700 bg-slate-950/50 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-3.5 text-slate-100 appearance-none transition-colors"
                  >
                    <option value="" className="bg-slate-900">Select your branch...</option>
                    {assignedBranch && user?.dairyOwnerProfile?.branchId && (
                      <option value={user.dairyOwnerProfile.branchId} className="bg-slate-900">
                        {assignedBranch}
                      </option>
                    )}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">
                    <svg className="h-4 w-4 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                      <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                    </svg>
                  </div>
                </div>
              </div>
            )}
            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label htmlFor="name" className="block text-sm font-medium text-slate-300 mb-1.5">Full Name</label>
                <div className="mt-1">
                  <input
                    type="text"
                    name="name"
                    id="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="block w-full rounded-xl border border-slate-700 bg-slate-950/50 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-3.5 sm:p-3 text-slate-100 placeholder-slate-500 transition-colors"
                    placeholder="Enter your full name"
                  />
                </div>
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="phone" className="block text-sm font-medium text-slate-300 mb-1.5">Phone Number</label>
                <div className="mt-1">
                  <input
                    type="text"
                    name="phone"
                    id="phone"
                    required
                    value={formData.phone}
                    onChange={handleChange}
                    className="block w-full rounded-xl border border-slate-700 bg-slate-950/50 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-3.5 sm:p-3 text-slate-100 placeholder-slate-500 transition-colors"
                    placeholder="Enter your 10-digit phone number"
                  />
                </div>
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="address" className="block text-sm font-medium text-slate-300 mb-1.5">Delivery Address</label>
                <div className="mt-1">
                  <textarea
                    name="address"
                    id="address"
                    rows={3}
                    required
                    value={formData.address}
                    onChange={handleChange}
                    className="block w-full rounded-xl border border-slate-700 bg-slate-950/50 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-3 text-slate-100 placeholder-slate-500 transition-colors"
                    placeholder="Enter full delivery address"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-2">
            <h2 className="text-xl font-semibold text-white mb-4">Payment Method</h2>
            <div className="mt-1 relative">
              <select
                name="paymentMethod"
                id="paymentMethod"
                value={formData.paymentMethod}
                onChange={handleChange}
                className="block w-full rounded-xl border border-slate-700 bg-slate-950/50 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-3.5 text-slate-100 appearance-none transition-colors"
              >
                <option value="Cash on Delivery" className="bg-slate-900">Cash on Delivery</option>
                <option value="Online Payment" className="bg-slate-900">Online Payment (Razorpay)</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">
                <svg className="h-4 w-4 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                  <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-700/50 pt-6 mt-8">
            <div className="flex justify-between items-center text-lg font-bold text-white mb-8">
              <p>Total Amount</p>
              <p className="text-2xl text-indigo-400">₹{totalPrice}</p>
            </div>
            <button
              type="submit"
              disabled={loading || sendingOtp}
              className={`w-full flex justify-center py-4 px-4 rounded-xl shadow-lg shadow-indigo-500/20 text-base font-semibold text-white bg-indigo-600 hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-indigo-500 transition-all duration-200 transform hover:-translate-y-0.5 ${(loading || sendingOtp) ? 'opacity-75 cursor-not-allowed' : ''}`}
            >
              {(loading || sendingOtp) ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </span>
              ) : 'Place Order'}
            </button>
          </div>
        </form>
      </div>
      {showOtpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl w-full max-w-md shadow-2xl">
            <h3 className="text-2xl font-bold text-white mb-2 text-center">Verify Order</h3>
            <p className="text-slate-400 text-center mb-6">
              An OTP has been sent to your email to confirm this branch stock order.
            </p>
            {error && (
              <div className="bg-rose-500/10 border border-rose-500/20 text-rose-500 p-3 rounded-lg text-sm mb-6 text-center">
                {error}
              </div>
            )}
            {resendMessage && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3 rounded-lg text-sm mb-6 text-center">
                {resendMessage}
              </div>
            )}
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="Enter 6-digit OTP"
              className="w-full text-center tracking-[0.5em] text-2xl font-bold rounded-xl border border-slate-700 bg-slate-950/50 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-4 text-slate-100 mb-6"
              maxLength={6}
            />
            <div className="flex gap-4">
              <button
                onClick={() => setShowOtpModal(false)}
                className="flex-1 py-3 px-4 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-medium transition-colors"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                onClick={processOrder}
                disabled={otp.length < 6 || loading}
                className="flex-1 py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium transition-colors disabled:opacity-50"
              >
                {loading ? 'Verifying...' : 'Verify & Place Order'}
              </button>
            </div>
            <div className="mt-6 text-center">
              <p className="text-sm text-slate-400">
                Didn't receive the code?{' '}
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={sendingOtp}
                  className="text-indigo-400 hover:text-indigo-300 font-medium disabled:opacity-50 transition-colors"
                >
                  {sendingOtp ? 'Sending...' : 'Resend OTP'}
                </button>
              </p>
            </div>
          </div>
        </div>
      )}
      
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-emerald-500/30 p-8 rounded-2xl w-full max-w-md shadow-2xl text-center">
            <div className="w-20 h-20 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-3xl font-bold text-white mb-4">Order Successful!</h3>
            <p className="text-slate-400 mb-8">
              Your order has been securely placed and your confirmation receipt has been sent to your email.
            </p>
            <div className="flex flex-col gap-3">
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    if (user?.role === 'admin') navigate('/admin/orders');
                    else if (user?.role === 'dairyOwner') navigate('/owner/orders');
                    else navigate('/dashboard');
                  }}
                  className="flex-1 py-3 px-4 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold transition-colors border border-slate-700"
                >
                  View Order
                </button>
                {placedOrderId && (
                  <button
                    onClick={() => orderApi.downloadInvoice(placedOrderId)}
                    className="flex-1 py-3 px-4 bg-indigo-500 hover:bg-indigo-400 text-white rounded-xl font-bold transition-colors shadow-lg shadow-indigo-500/20"
                  >
                    Download Invoice
                  </button>
                )}
              </div>
              <button
                onClick={() => navigate('/shop')}
                className="w-full py-4 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-lg transition-colors shadow-lg shadow-emerald-500/20 mt-2"
              >
                Continue Shopping
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
