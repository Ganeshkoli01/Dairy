import React, { useState, useEffect, useMemo } from 'react';
import { reportApi } from '../api/reportApi';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar
} from 'recharts';
import {
  TrendingUp,
  CreditCard,
  Package,
  Milk,
  Loader2,
  AlertCircle,
  Calendar,
  IndianRupee
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

type DateRange = 
  | 'Today' 
  | 'Yesterday' 
  | 'Last 7 Days' 
  | 'Last 30 Days' 
  | 'This Month' 
  | 'Last Month' 
  | 'Custom';

export const AnalyticsPage: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRangeType, setDateRangeType] = useState<DateRange>('Last 30 Days');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  
  const [summaryData, setSummaryData] = useState<any>(null);
  const [ordersData, setOrdersData] = useState<any[]>([]);

  // Calculate dates based on selection
  const { from, to } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (dateRangeType === 'Today') {
      return { 
        from: today.toISOString().split('T')[0], 
        to: tomorrow.toISOString().split('T')[0] 
      };
    }
    if (dateRangeType === 'Yesterday') {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      return { 
        from: yesterday.toISOString().split('T')[0], 
        to: today.toISOString().split('T')[0] 
      };
    }
    if (dateRangeType === 'Last 7 Days') {
      const last7 = new Date(today);
      last7.setDate(last7.getDate() - 7);
      return { 
        from: last7.toISOString().split('T')[0], 
        to: tomorrow.toISOString().split('T')[0] 
      };
    }
    if (dateRangeType === 'This Month') {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      return { 
        from: firstDay.toISOString().split('T')[0], 
        to: tomorrow.toISOString().split('T')[0] 
      };
    }
    if (dateRangeType === 'Last Month') {
      const firstDay = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const lastDay = new Date(today.getFullYear(), today.getMonth(), 0);
      lastDay.setHours(23, 59, 59, 999);
      return { 
        from: firstDay.toISOString().split('T')[0], 
        to: lastDay.toISOString().split('T')[0] 
      };
    }
    if (dateRangeType === 'Custom') {
      return { from: customFrom, to: customTo };
    }
    
    // Default: Last 30 Days
    const last30 = new Date(today);
    last30.setDate(last30.getDate() - 30);
    return { 
      from: last30.toISOString().split('T')[0], 
      to: tomorrow.toISOString().split('T')[0] 
    };
  }, [dateRangeType, customFrom, customTo]);

  useEffect(() => {
    if (dateRangeType === 'Custom' && (!from || !to)) return;
    
    const fetchAnalytics = async () => {
      setLoading(true);
      setError(null);
      try {
        const [summaryResponse, ordersResponse] = await Promise.all([
          reportApi.getAnalyticsSummary(undefined, from, to),
          reportApi.getOrdersReport(undefined, from, to)
        ]);

        if (summaryResponse.success) {
          setSummaryData(summaryResponse.summary);
        }
        if (ordersResponse.success) {
          setOrdersData(ordersResponse.data);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load analytics data.');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [from, to, dateRangeType]);

  // Process data for charts
  const salesTrend = useMemo(() => {
    if (!ordersData.length) return [];
    
    const grouped = ordersData.reduce((acc: any, order: any) => {
      const date = order.date;
      if (!acc[date]) acc[date] = 0;
      acc[date] += order.totalAmount;
      return acc;
    }, {});

    // Sort by date and format
    return Object.keys(grouped).sort().map(date => ({
      date: new Date(date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
      sales: grouped[date]
    }));
  }, [ordersData]);

  const orderStatusData = useMemo(() => {
    if (!summaryData) return [];
    return [
      { name: 'Completed', value: summaryData.completedOrders, color: '#10B981' },
      { name: 'Pending', value: summaryData.pendingOrders, color: '#F59E0B' },
      { name: 'Cancelled', value: summaryData.cancelledOrders, color: '#EF4444' }
    ].filter(d => d.value > 0);
  }, [summaryData]);

  const paymentStatusData = useMemo(() => {
    if (!summaryData) return [];
    return [
      { name: 'Received', value: summaryData.paymentsReceived },
      { name: 'Pending', value: summaryData.paymentsPending }
    ];
  }, [summaryData]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header & Date Filters */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -mr-32 -mt-32"></div>
        
        <div className="relative z-10">
          <div className="flex items-center space-x-2 mb-2">
            <h1 className="text-2xl font-bold text-slate-100">Analytics Dashboard</h1>
            <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase">
              {user?.role === 'admin' ? 'Global' : 'Branch'} Data
            </span>
          </div>
          <p className="text-slate-400 text-sm">Comprehensive overview of sales, milk collection, and financial health.</p>
        </div>

        <div className="relative z-10 flex flex-col sm:flex-row gap-4 items-end">
          <div className="flex flex-col">
            <label className="text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Date Range</label>
            <div className="flex items-center bg-slate-950 border border-slate-700 rounded-xl px-3 py-2">
              <Calendar className="w-4 h-4 text-slate-400 mr-2" />
              <select 
                value={dateRangeType}
                onChange={(e) => setDateRangeType(e.target.value as DateRange)}
                className="bg-transparent border-none text-sm text-slate-200 focus:outline-none focus:ring-0"
              >
                <option value="Today">Today</option>
                <option value="Yesterday">Yesterday</option>
                <option value="Last 7 Days">Last 7 Days</option>
                <option value="Last 30 Days">Last 30 Days</option>
                <option value="This Month">This Month</option>
                <option value="Last Month">Last Month</option>
                <option value="Custom">Custom Range...</option>
              </select>
            </div>
          </div>

          {dateRangeType === 'Custom' && (
            <div className="flex items-center gap-2">
              <input 
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
              />
              <span className="text-slate-500">to</span>
              <input 
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] text-slate-400">
          <Loader2 className="w-10 h-10 animate-spin text-indigo-400 mb-3" />
          <p className="text-sm font-medium">Crunching numbers...</p>
        </div>
      ) : error ? (
        <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-center space-x-3 text-sm">
          <AlertCircle className="w-6 h-6 flex-shrink-0" />
          <span>{error}</span>
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden">
              <div className="absolute -right-4 -top-4 w-16 h-16 bg-emerald-500/10 rounded-full blur-xl"></div>
              <div className="flex items-center justify-between mb-4 relative z-10">
                <p className="text-sm font-medium text-slate-400">Total Sales</p>
                <div className="p-2 bg-emerald-500/10 rounded-lg">
                  <IndianRupee className="w-5 h-5 text-emerald-400" />
                </div>
              </div>
              <h3 className="text-2xl font-black text-white relative z-10">₹{(summaryData?.totalSales || 0).toLocaleString()}</h3>
              <p className="text-xs font-semibold text-emerald-400 mt-2 relative z-10 flex items-center">
                <TrendingUp className="w-3 h-3 mr-1" /> Revenue Generated
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden">
              <div className="absolute -right-4 -top-4 w-16 h-16 bg-indigo-500/10 rounded-full blur-xl"></div>
              <div className="flex items-center justify-between mb-4 relative z-10">
                <p className="text-sm font-medium text-slate-400">Total Orders</p>
                <div className="p-2 bg-indigo-500/10 rounded-lg">
                  <Package className="w-5 h-5 text-indigo-400" />
                </div>
              </div>
              <h3 className="text-2xl font-black text-white relative z-10">{summaryData?.totalOrders || 0}</h3>
              <p className="text-xs font-semibold text-slate-500 mt-2 relative z-10">
                {summaryData?.completedOrders || 0} Completed | {summaryData?.pendingOrders || 0} Pending
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden">
              <div className="absolute -right-4 -top-4 w-16 h-16 bg-cyan-500/10 rounded-full blur-xl"></div>
              <div className="flex items-center justify-between mb-4 relative z-10">
                <p className="text-sm font-medium text-slate-400">Milk Collected</p>
                <div className="p-2 bg-cyan-500/10 rounded-lg">
                  <Milk className="w-5 h-5 text-cyan-400" />
                </div>
              </div>
              <h3 className="text-2xl font-black text-white relative z-10">{(summaryData?.milkCollected || 0).toLocaleString()} <span className="text-sm font-medium text-slate-500">Liters</span></h3>
              <p className="text-xs font-semibold text-cyan-400 mt-2 relative z-10">
                Value: ₹{(summaryData?.milkValue || 0).toLocaleString()}
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden">
              <div className="absolute -right-4 -top-4 w-16 h-16 bg-amber-500/10 rounded-full blur-xl"></div>
              <div className="flex items-center justify-between mb-4 relative z-10">
                <p className="text-sm font-medium text-slate-400">Products Sold</p>
                <div className="p-2 bg-amber-500/10 rounded-lg">
                  <CreditCard className="w-5 h-5 text-amber-400" />
                </div>
              </div>
              <h3 className="text-2xl font-black text-white relative z-10">{summaryData?.productsSold || 0} <span className="text-sm font-medium text-slate-500">Units</span></h3>
              <p className="text-xs font-semibold text-amber-400 mt-2 relative z-10 flex items-center">
                Items dispatched
              </p>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Sales Trend (2/3 width) */}
            <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-6">Sales Trend (Revenue)</h3>
              {salesTrend.length > 0 ? (
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={salesTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                      <XAxis dataKey="date" stroke="#64748B" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="#64748B" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `₹${val}`} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#0F172A', borderColor: '#1E293B', borderRadius: '12px', color: '#F1F5F9' }}
                        itemStyle={{ color: '#10B981', fontWeight: 'bold' }}
                        formatter={(value: any) => [`₹${Number(value || 0).toLocaleString()}`, 'Sales']}
                      />
                      <Area type="monotone" dataKey="sales" stroke="#10B981" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-72 flex items-center justify-center border-2 border-dashed border-slate-800 rounded-xl">
                  <p className="text-slate-500 text-sm">No sales data for this period</p>
                </div>
              )}
            </div>

            {/* Order Status (1/3 width) */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col">
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-6">Order Status</h3>
              {orderStatusData.length > 0 ? (
                <div className="flex-1 flex flex-col justify-center">
                  <div className="h-48 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={orderStatusData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {orderStatusData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#0F172A', borderColor: '#1E293B', borderRadius: '12px', color: '#F1F5F9' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex flex-wrap justify-center gap-4 mt-2">
                    {orderStatusData.map((entry, idx) => (
                      <div key={idx} className="flex items-center text-xs font-semibold text-slate-300">
                        <span className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: entry.color }}></span>
                        {entry.name}: {entry.value}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center border-2 border-dashed border-slate-800 rounded-xl">
                  <p className="text-slate-500 text-sm">No orders found</p>
                </div>
              )}
            </div>

          </div>

          {/* Payment Status Bar Chart */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-6">Payment Collections (Received vs Pending)</h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={paymentStatusData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                  <XAxis dataKey="name" stroke="#64748B" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#64748B" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `₹${val}`} />
                  <Tooltip 
                    cursor={{ fill: '#1E293B', opacity: 0.4 }}
                    contentStyle={{ backgroundColor: '#0F172A', borderColor: '#1E293B', borderRadius: '12px', color: '#F1F5F9' }}
                    formatter={(value: any) => [`₹${Number(value || 0).toLocaleString()}`, 'Amount']}
                  />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={60}>
                    {
                      paymentStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.name === 'Received' ? '#3B82F6' : '#F43F5E'} />
                      ))
                    }
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </>
      )}
    </div>
  );
};
