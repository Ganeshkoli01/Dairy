import React, { useEffect, useState, useMemo } from 'react';
import { productApi } from '../api/productApi';
import { Product } from '../types/product';
import { useCart } from '../context/CartContext';
import { 
  ShoppingCart, Plus, Minus, ChevronRight, Sparkles, AlertCircle, 
  RefreshCw, Search, Filter, ArrowUpDown, X, CheckCircle2, 
  PackageOpen, ChevronLeft
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const ShopPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { cart, addToCart, updateQuantity } = useCart();

  // New states for UX improvements
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [sortBy, setSortBy] = useState<string>('recommended');
  
  // UI states
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      try {
        const response = await productApi.getProducts();
        if (response.success) {
          const mappedProducts = (response.data || []).map(p => ({
            ...p,
            price: p.plantTransferPrice || p.price
          }));
          setProducts(mappedProducts);
        } else {
          throw new Error("API returned success: false");
        }
      } catch (apiErr: any) {
        console.error("Axios failed, trying direct fetch:", apiErr);
        const res = await fetch('http://localhost:5000/api/products');
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const data = await res.json();
        if (data.success) {
          const mappedProducts = (data.data || []).map((p: any) => ({
            ...p,
            price: p.plantTransferPrice || p.price
          }));
          setProducts(mappedProducts);
        } else {
          throw new Error("Fetch API returned success: false");
        }
      }
    } catch (err: any) {
      console.error("All fetch methods failed:", err);
      setError(err.message || 'Unable to load products. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    const timeoutId = setTimeout(() => {
      if (mounted && loading) {
        setLoading(false);
        setError("Request timed out. The server might be unreachable.");
      }
    }, 8000);

    fetchProducts().then(() => {
      clearTimeout(timeoutId);
    });

    return () => {
      mounted = false;
      clearTimeout(timeoutId);
    };
  }, []);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleAddToCart = (e: React.MouseEvent, product: Product) => {
    e.stopPropagation();
    const cartItem = cart.find(item => item._id === product._id);
    const currentQty = cartItem ? cartItem.quantity : 0;
    const stockLimit = product.stock || 0;
    
    if (currentQty >= stockLimit) {
      showToast(`Only ${stockLimit} available in stock.`);
      return;
    }
    
    addToCart(product);
    showToast(`✓ ${product.nameEn} added to cart.`);
  };

  const handleUpdateQuantity = (e: React.MouseEvent, productId: string, newQty: number, maxStock: number) => {
    e.stopPropagation();
    if (newQty > maxStock) {
      showToast(`Only ${maxStock} available in stock.`);
      return;
    }
    if (newQty < 0) return;
    updateQuantity(productId, newQty);
  };

  // Data processing
  const safeProducts = Array.isArray(products) ? products : [];
  const categories = ['All', ...Array.from(new Set(safeProducts.map(p => p.category).filter(Boolean)))];

  const filteredProducts = useMemo(() => {
    return safeProducts
      .filter(p => p.isAvailable)
      .filter(p => selectedCategory === 'All' || p.category === selectedCategory)
      .filter(p => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return (
          p.nameEn.toLowerCase().includes(q) ||
          (p.nameMr && p.nameMr.includes(q)) ||
          p.category.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        if (sortBy === 'price-low') return a.price - b.price;
        if (sortBy === 'price-high') return b.price - a.price;
        if (sortBy === 'name-a-z') return a.nameEn.localeCompare(b.nameEn);
        return 0; // recommended
      });
  }, [safeProducts, selectedCategory, searchQuery, sortBy]);

  // Derived state for Mobile Sticky Cart
  const cartItemCount = cart.reduce((total, item) => total + item.quantity, 0);
  const cartTotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);

  if (error) {
    return (
      <div className="max-w-xl mx-auto mt-20 bg-rose-500/10 border border-rose-500/20 p-8 rounded-3xl text-center flex flex-col items-center justify-center gap-4 shadow-2xl">
        <AlertCircle className="w-12 h-12 text-rose-500" />
        <h2 className="text-xl font-bold text-slate-100">Unable to load products</h2>
        <button 
          onClick={fetchProducts}
          className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full font-semibold transition-all shadow-lg"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-slate-950 pb-24 md:pb-12">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="bg-slate-800 border border-slate-700 shadow-2xl rounded-full px-4 py-2 flex items-center space-x-2">
            <span className="text-sm font-medium text-white">{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Header Section */}
      <div className="bg-[#0f172a] border-b border-slate-800/60 sticky top-16 z-30 shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 relative overflow-hidden">
          {/* Subtle Background Glow */}
          <div className="absolute -top-24 -left-24 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-indigo-100 to-indigo-300 tracking-tight drop-shadow-sm">
                GK Dairy Shop
              </h1>
              <p className="text-slate-400 text-sm mt-1.5 font-medium">Fresh dairy products delivered to your door.</p>
            </div>
            
            <div className="w-full md:w-96 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input 
                type="text"
                placeholder="Search Paneer, Milk, etc..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950/50 border border-slate-700/50 focus:border-indigo-500 rounded-full pl-10 pr-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all placeholder:text-slate-600 shadow-inner"
              />
            </div>
          </div>

          {/* Desktop Categories & Filters */}
          <div className="mt-6 flex items-center justify-between">
            <div className="flex-1 overflow-x-auto custom-scrollbar pb-2 -mb-2">
              <div className="flex space-x-2 w-max">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-5 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all duration-300 ${
                      selectedCategory === cat 
                        ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-[0_0_15px_rgba(99,102,241,0.3)] border border-indigo-400/30' 
                        : 'bg-slate-800/40 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700/50 backdrop-blur-sm hover:shadow-lg'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="hidden md:flex items-center space-x-4 ml-6">
              <div className="flex items-center space-x-2 bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5">
                <ArrowUpDown className="w-4 h-4 text-slate-400" />
                <select 
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-transparent border-none text-sm text-slate-300 focus:outline-none"
                >
                  <option value="recommended">Recommended</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="name-a-z">Name: A-Z</option>
                </select>
              </div>
            </div>

            {/* Mobile Filter Button */}
            <button 
              className="md:hidden ml-4 flex-shrink-0 p-2 bg-slate-800 rounded-full text-slate-300 border border-slate-700"
              onClick={() => setIsMobileFilterOpen(true)}
            >
              <Filter className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 animate-pulse">
                <div className="w-full aspect-square bg-slate-800 rounded-xl mb-4"></div>
                <div className="h-4 bg-slate-800 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-slate-800 rounded w-1/2 mb-4"></div>
                <div className="h-6 bg-slate-800 rounded w-1/3 mb-4"></div>
                <div className="h-10 bg-slate-800 rounded-xl w-full"></div>
              </div>
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-20 flex flex-col items-center">
            <PackageOpen className="w-16 h-16 text-slate-700 mb-4" />
            <h2 className="text-xl font-bold text-slate-300 mb-2">No products found.</h2>
            <p className="text-slate-500">Try searching for another product or category.</p>
            <button 
              onClick={() => { setSearchQuery(''); setSelectedCategory('All'); }}
              className="mt-6 px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-full text-sm font-medium transition-colors border border-slate-700"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {filteredProducts.map(product => {
              const stock = product.stock || 0;
              const isOutOfStock = stock <= 0;
              const isLowStock = stock > 0 && stock <= (product.lowStockThreshold || 10);
              
              const cartItem = cart.find(item => item._id === product._id);
              const quantity = cartItem ? cartItem.quantity : 0;

              return (
                <div 
                  key={product._id} 
                  onClick={() => setSelectedProduct(product)}
                  className="group flex flex-col bg-[#0b1120] border border-slate-800/60 rounded-2xl overflow-hidden hover:border-indigo-500/50 hover:shadow-[0_8px_30px_rgb(0,0,0,0.4)] hover:shadow-indigo-500/10 transition-all duration-300 cursor-pointer relative h-full transform hover:-translate-y-1"
                >
                  {/* Image Area */}
                  <div className="relative h-48 sm:h-56 w-full bg-transparent flex items-center justify-center p-4 sm:p-6 shrink-0 overflow-hidden">
                    {/* Subtle glow behind image on hover */}
                    <div className="absolute inset-0 bg-indigo-500/0 group-hover:bg-indigo-500/5 transition-colors duration-500 rounded-t-2xl"></div>
                    <img 
                      src={product.imageUrl || `https://via.placeholder.com/300x400?text=${product.nameEn?.replace(/ /g, '+') || 'Product'}`}
                      alt={product.nameEn}
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500 drop-shadow-2xl relative z-10"
                      loading="lazy"
                    />
                    
                    {/* Badges */}
                    <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
                      {isOutOfStock ? (
                        <span className="px-2 py-0.5 bg-rose-500/90 backdrop-blur text-white text-[10px] font-bold uppercase rounded-md shadow-sm">
                          Out of Stock
                        </span>
                      ) : isLowStock ? (
                        <span className="px-2 py-0.5 bg-amber-500/90 backdrop-blur text-white text-[10px] font-bold uppercase rounded-md shadow-sm">
                          Limited Stock
                        </span>
                      ) : null}
                    </div>
                  </div>

                  {/* Content Area */}
                  <div className="p-5 flex flex-col flex-grow bg-gradient-to-b from-transparent to-slate-900/50 relative z-10">
                    <div className="mb-4 flex-grow">
                      <h3 className="text-lg font-bold text-white mb-1 group-hover:text-indigo-400 transition-colors leading-tight drop-shadow-md">{product.nameEn}</h3>
                      <p className="text-sm text-slate-400 font-medium mb-2.5">{product.nameMr}</p>
                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{product.description || `Fresh and healthy ${product.nameEn}`}</p>
                    </div>
                    
                    <div className="flex items-end justify-between mt-auto pt-2">
                      <div>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1 opacity-80">Price</p>
                        <div className="flex items-baseline gap-1">
                          <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-300">₹{product.price}</span>
                          <span className="text-xs text-slate-500 font-semibold uppercase">/ {product.unit}</span>
                        </div>
                      </div>
                      
                      <div className="shrink-0">
                        {isOutOfStock ? (
                          <button
                            disabled
                            className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50"
                          >
                            <span className="text-xs font-bold">0</span>
                          </button>
                        ) : quantity > 0 ? (
                          <div className="flex items-center h-10 bg-slate-800/80 backdrop-blur rounded-xl overflow-hidden w-24 border border-slate-700/50 shadow-inner">
                            <button
                              onClick={(e) => handleUpdateQuantity(e, product._id, quantity - 1, stock)}
                              className="flex-1 h-full flex items-center justify-center text-slate-400 hover:bg-slate-700 hover:text-white transition-colors"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="flex-1 text-center font-bold text-white text-sm">
                              {quantity}
                            </span>
                            <button
                              onClick={(e) => handleUpdateQuantity(e, product._id, quantity + 1, stock)}
                              className="flex-1 h-full flex items-center justify-center text-slate-400 hover:bg-slate-700 hover:text-white transition-colors"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={(e) => handleAddToCart(e, product)}
                            className="w-10 h-10 flex items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white hover:from-indigo-500 hover:to-indigo-400 transition-all border border-indigo-400/30 shadow-[0_0_15px_rgba(99,102,241,0.2)] hover:shadow-[0_0_20px_rgba(99,102,241,0.4)] transform hover:scale-105 active:scale-95"
                          >
                            <Plus className="w-5 h-5 drop-shadow-md" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Mobile Sticky Cart Summary */}
      {cartItemCount > 0 && (
        <div className="md:hidden fixed bottom-4 left-4 right-4 z-40 animate-in slide-in-from-bottom-10">
          <Link 
            to="/cart"
            className="flex items-center justify-between bg-indigo-600 text-white rounded-2xl p-4 shadow-2xl shadow-indigo-500/30 active:scale-[0.98] transition-transform"
          >
            <div className="flex items-center space-x-3">
              <div className="relative">
                <ShoppingCart className="w-6 h-6" />
                <span className="absolute -top-2 -right-2 bg-rose-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-indigo-600">
                  {cartItemCount}
                </span>
              </div>
              <div className="flex flex-col text-left">
                <span className="text-xs font-medium text-indigo-200">{cartItemCount} items</span>
                <span className="text-sm font-bold">₹{cartTotal.toFixed(2)}</span>
              </div>
            </div>
            <div className="flex items-center text-sm font-bold">
              View Cart <ChevronRight className="w-4 h-4 ml-1" />
            </div>
          </Link>
        </div>
      )}

      {/* Mobile Filter Bottom Sheet */}
      {isMobileFilterOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setIsMobileFilterOpen(false)}></div>
          <div className="bg-slate-900 rounded-t-3xl border-t border-slate-800 p-6 relative z-10 animate-in slide-in-from-bottom duration-300">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-white">Filter & Sort</h3>
              <button onClick={() => setIsMobileFilterOpen(false)} className="p-2 text-slate-400 bg-slate-800 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-semibold text-slate-300 mb-3">Sort By</label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: 'recommended', label: 'Recommended' },
                  { value: 'price-low', label: 'Price: Low to High' },
                  { value: 'price-high', label: 'Price: High to Low' },
                  { value: 'name-a-z', label: 'Name: A-Z' }
                ].map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => { setSortBy(opt.value); setIsMobileFilterOpen(false); }}
                    className={`px-4 py-2.5 rounded-xl text-xs font-semibold border ${
                      sortBy === opt.value 
                        ? 'bg-indigo-600/10 border-indigo-500 text-indigo-400' 
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            
            <button 
              onClick={() => setIsMobileFilterOpen(false)}
              className="w-full py-3.5 bg-indigo-600 text-white rounded-xl font-bold"
            >
              Apply Selection
            </button>
          </div>
        </div>
      )}

      {/* Product Details Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setSelectedProduct(null)}></div>
          
          <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-y-auto flex flex-col md:flex-row relative z-10 shadow-2xl animate-in zoom-in-95 duration-200">
            
            <button 
              onClick={() => setSelectedProduct(null)} 
              className="absolute top-4 right-4 z-20 p-2 bg-slate-800/80 hover:bg-slate-700 text-slate-300 rounded-full backdrop-blur transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Image Half */}
            <div className="w-full md:w-1/2 bg-white relative p-8 flex items-center justify-center md:rounded-l-3xl rounded-t-3xl md:rounded-tr-none min-h-[300px]">
              <img 
                src={selectedProduct.imageUrl || `https://via.placeholder.com/600x400?text=${selectedProduct.nameEn?.replace(/ /g, '+')}`}
                alt={selectedProduct.nameEn}
                className="w-full h-full max-h-[400px] object-contain mix-blend-multiply"
              />
              
              <div className="absolute top-4 left-4 flex flex-col gap-2">
                {selectedProduct.stock <= 0 ? (
                  <span className="px-3 py-1 bg-rose-500 text-white text-xs font-bold uppercase rounded-md shadow">Out of Stock</span>
                ) : selectedProduct.stock <= (selectedProduct.lowStockThreshold || 10) ? (
                  <span className="px-3 py-1 bg-amber-500 text-white text-xs font-bold uppercase rounded-md shadow">Limited Stock</span>
                ) : (
                  <span className="px-3 py-1 bg-emerald-500 text-white text-xs font-bold uppercase rounded-md shadow">In Stock</span>
                )}
              </div>
            </div>

            {/* Modal Content Half */}
            <div className="w-full md:w-1/2 p-6 md:p-8 flex flex-col bg-slate-900 md:rounded-r-3xl rounded-b-3xl md:rounded-bl-none border-l border-slate-800">
              <div className="mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-full border border-indigo-500/20">
                  {selectedProduct.category}
                </span>
              </div>
              
              <h2 className="text-2xl md:text-3xl font-extrabold text-white mt-4">{selectedProduct.nameEn}</h2>
              <h3 className="text-lg font-medium text-slate-400 mt-1">{selectedProduct.nameMr}</h3>
              
              <div className="mt-6 flex items-end gap-2">
                <span className="text-4xl font-black text-white">₹{selectedProduct.price}</span>
                <span className="text-sm font-medium text-slate-500 mb-1.5">/ {selectedProduct.unit}</span>
              </div>

              <div className="my-8 h-px bg-slate-800 w-full"></div>

              {selectedProduct.description && (
                <div className="mb-8">
                  <h4 className="text-sm font-semibold text-slate-300 mb-2 uppercase tracking-wider">Description</h4>
                  <p className="text-slate-400 text-sm leading-relaxed font-light">
                    {selectedProduct.description}
                  </p>
                </div>
              )}

              <div className="mt-auto pt-4">
                {(() => {
                  const stock = selectedProduct.stock || 0;
                  const isOutOfStock = stock <= 0;
                  const cartItem = cart.find(item => item._id === selectedProduct._id);
                  const quantity = cartItem ? cartItem.quantity : 0;

                  if (isOutOfStock) {
                    return (
                      <button disabled className="w-full py-4 rounded-xl bg-slate-800 text-slate-500 font-bold cursor-not-allowed border border-slate-700">
                        Out of Stock
                      </button>
                    );
                  }

                  if (quantity > 0) {
                    return (
                      <div className="flex items-center h-14 bg-slate-800 rounded-xl border border-slate-700 overflow-hidden w-full">
                        <button
                          onClick={(e) => handleUpdateQuantity(e, selectedProduct._id, quantity - 1, stock)}
                          className="w-16 h-full flex items-center justify-center bg-slate-900 text-slate-300 hover:text-white transition-colors"
                        >
                          <Minus className="w-5 h-5" />
                        </button>
                        <div className="flex-1 text-center flex flex-col justify-center">
                          <span className="font-bold text-white text-lg">{quantity}</span>
                          <span className="text-[10px] text-slate-400 uppercase font-medium">in cart</span>
                        </div>
                        <button
                          onClick={(e) => handleUpdateQuantity(e, selectedProduct._id, quantity + 1, stock)}
                          className="w-16 h-full flex items-center justify-center bg-slate-900 text-slate-300 hover:text-white transition-colors"
                        >
                          <Plus className="w-5 h-5" />
                        </button>
                      </div>
                    );
                  }

                  return (
                    <button
                      onClick={(e) => handleAddToCart(e, selectedProduct)}
                      className="w-full py-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-lg shadow-xl shadow-indigo-500/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                    >
                      <ShoppingCart className="w-5 h-5" />
                      Add to Cart
                    </button>
                  );
                })()}
              </div>

              {/* Related Products */}
              {(() => {
                const related = safeProducts
                  .filter(p => p.category === selectedProduct.category && p._id !== selectedProduct._id && p.isAvailable)
                  .slice(0, 3);
                
                if (related.length === 0) return null;

                return (
                  <div className="mt-8 pt-8 border-t border-slate-800">
                    <h4 className="text-sm font-semibold text-slate-300 mb-4 uppercase tracking-wider">Related Products</h4>
                    <div className="grid grid-cols-3 gap-3">
                      {related.map(rel => (
                        <div 
                          key={rel._id} 
                          onClick={() => setSelectedProduct(rel)}
                          className="bg-slate-800/50 rounded-xl p-2 cursor-pointer hover:bg-slate-800 transition-colors border border-slate-700/50"
                        >
                          <div className="aspect-square bg-white rounded-lg mb-2 p-1">
                            <img 
                              src={rel.imageUrl || `https://via.placeholder.com/150?text=${rel.nameEn?.replace(/ /g, '+')}`} 
                              alt={rel.nameEn}
                              className="w-full h-full object-contain mix-blend-multiply"
                            />
                          </div>
                          <h5 className="text-[10px] font-bold text-slate-200 line-clamp-1">{rel.nameEn}</h5>
                          <p className="text-[10px] text-indigo-400 font-semibold">₹{rel.price}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
