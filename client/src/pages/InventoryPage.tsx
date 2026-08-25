import React, { useState, useEffect } from 'react';
import { Package, Plus, Search, Filter } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export const InventoryPage: React.FC = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/products');
      setProducts(response.data.data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch inventory');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredProducts = products.filter(product => 
    product.nameEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.nameMr.includes(searchQuery) ||
    product.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <Package className="w-6 h-6 text-indigo-400" />
            {isAdmin ? 'Main Plant Inventory' : 'Branch Inventory'}
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Monitor and manage your product stock levels
          </p>
        </div>
        
        {/* Search Bar */}
        <div className="relative w-full sm:w-72">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-400" />
          </div>
          <input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-slate-700 rounded-xl leading-5 bg-slate-900/50 text-slate-200 placeholder-slate-400 focus:outline-none focus:bg-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 sm:text-sm transition-colors"
          />
        </div>
      </div>

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/50 text-rose-400 p-4 rounded-xl text-sm">
          {error}
        </div>
      )}

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="w-full overflow-x-auto pb-4 custom-scrollbar">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-800/50 text-xs uppercase font-semibold text-slate-400 border-b border-slate-800 whitespace-nowrap">
              <tr>
                <th className="px-6 py-4">Product Name</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Current Stock</th>
                <th className="px-6 py-4">Unit</th>
                <th className="px-6 py-4">Low Stock Threshold</th>
                {isAdmin && <th className="px-6 py-4">COGS</th>}
                <th className="px-6 py-4">Plant Transfer Price</th>
                <th className="px-6 py-4">Selling Price</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {isLoading ? (
                <tr>
                  <td colSpan={isAdmin ? 8 : 7} className="px-6 py-8 text-center text-slate-400">
                    Loading inventory...
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 8 : 7} className="px-6 py-8 text-center text-slate-400">
                    {searchQuery ? `No products found matching "${searchQuery}"` : 'No products found'}
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => {
                  const threshold = product.lowStockThreshold ?? 10;
                  const isLowStock = product.stock <= threshold && product.stock > 0;
                  const isOutOfStock = product.stock === 0;

                  return (
                    <tr key={product._id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-200">{product.nameEn}</div>
                        <div className="text-xs text-slate-500">{product.nameMr}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2 py-1 rounded-md bg-slate-800 text-slate-300 text-xs font-medium">
                          {product.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-200">
                        {product.stock}
                      </td>
                      <td className="px-6 py-4 text-slate-400">
                        {product.unit}
                      </td>
                      <td className="px-6 py-4 text-slate-400">
                        {product.lowStockThreshold ?? 10}
                      </td>
                      {isAdmin && (
                        <td className="px-6 py-4 text-slate-300">
                          ₹{product.cogs || 0}
                        </td>
                      )}
                      <td className="px-6 py-4 text-slate-300">
                        ₹{product.plantTransferPrice || 0}
                      </td>
                      <td className="px-6 py-4 text-emerald-400 font-medium">
                        ₹{product.price}
                      </td>
                      <td className="px-6 py-4">
                        {isOutOfStock ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-400 text-xs font-medium border border-rose-500/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                            Out of Stock
                          </span>
                        ) : isLowStock ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 text-xs font-medium border border-amber-500/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                            Low Stock
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-medium border border-emerald-500/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            Available
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
