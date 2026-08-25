import React, { useEffect, useState } from 'react';
import { productApi } from '../api/productApi';
import { Product } from '../types/product';
import { Plus, Edit2, Trash2, Package, Image as ImageIcon, X, AlertTriangle } from 'lucide-react';

export const AdminProductsPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Image Upload Modal State
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  
  // Edit Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Product>>({});
  const [saving, setSaving] = useState(false);

  // Add Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState<Partial<Product>>({ isAvailable: true, stock: 0, cogs: 0, plantTransferPrice: 0 });
  const [adding, setAdding] = useState(false);

  // Delete Modal State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await productApi.getProducts();
      if (response.success) {
        setProducts(response.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (product: Product) => {
    setProductToDelete(product);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!productToDelete) return;
    
    try {
      setDeleting(true);
      const response = await productApi.deleteProduct(productToDelete._id);
      if (response.success) {
        setProducts(products.filter(p => p._id !== productToDelete._id));
        setShowDeleteModal(false);
        setProductToDelete(null);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete product');
    } finally {
      setDeleting(false);
    }
  };

  const toggleAvailability = async (product: Product) => {
    try {
      const response = await productApi.updateProduct(product._id, {
        isAvailable: !product.isAvailable
      });
      if (response.success) {
        setProducts(products.map(p => p._id === product._id ? { ...p, isAvailable: !p.isAvailable } : p));
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update product');
    }
  };

  const openImageModal = (product: Product) => {
    setSelectedProduct(product);
    setImageFile(null);
    setShowImageModal(true);
  };

  const handleImageUpload = async () => {
    if (!selectedProduct || !imageFile) return;
    
    try {
      setUploading(true);
      const uploadRes = await productApi.uploadImage(imageFile);
      
      if (uploadRes.success && uploadRes.url) {
        const updateRes = await productApi.updateProduct(selectedProduct._id, {
          imageUrl: uploadRes.url
        });
        
        if (updateRes.success) {
          setProducts(products.map(p => p._id === selectedProduct._id ? { ...p, imageUrl: uploadRes.url } : p));
          setShowImageModal(false);
        }
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const openEditModal = (product: Product) => {
    setSelectedProduct(product);
    setEditForm({
      nameEn: product.nameEn,
      nameMr: product.nameMr,
      price: product.price,
      cogs: product.cogs || 0,
      plantTransferPrice: product.plantTransferPrice || 0,
      unit: product.unit,
      category: product.category,
      stock: product.stock,
      description: product.description,
    });
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    
    try {
      setSaving(true);
      const response = await productApi.updateProduct(selectedProduct._id, editForm);
      if (response.success) {
        setProducts(products.map(p => p._id === selectedProduct._id ? { ...p, ...editForm } : p));
        setShowEditModal(false);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update product');
    } finally {
      setSaving(false);
    }
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addForm.nameEn || !addForm.nameMr || addForm.price === undefined || !addForm.unit || !addForm.category) {
      alert("Please fill in all required fields.");
      return;
    }
    
    try {
      setAdding(true);
      const payload = {
        ...addForm,
        slug: addForm.nameEn.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now(),
      };
      
      const response = await productApi.createProduct(payload);
      if (response.success) {
        setProducts([...products, response.data]);
        setShowAddModal(false);
        setAddForm({ isAvailable: true, stock: 0, cogs: 0, plantTransferPrice: 0 });
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to add product');
    } finally {
      setAdding(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 border-t-transparent"></div></div>;
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-12 w-full max-w-9xl mx-auto relative">
      <div className="absolute -top-10 -right-10 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
      
      <div className="sm:flex sm:items-end sm:justify-between mb-12 relative z-10">
        <div className="sm:flex-auto">
          <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-indigo-200 to-indigo-400 flex items-center">
            <Package className="w-8 h-8 mr-3 text-indigo-400" />
            Product Management
          </h1>
          <p className="mt-3 text-base text-slate-400 max-w-2xl font-light">
            A list of all dairy products available in the shop, their prices, and stock.
          </p>
        </div>
        <div className="mt-6 sm:mt-0 sm:ml-16 sm:flex-none">
          <button 
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center justify-center rounded-full border border-indigo-500/30 bg-indigo-600/20 px-6 py-2.5 text-sm font-medium text-indigo-300 shadow-lg shadow-indigo-500/10 hover:bg-indigo-600 hover:text-white hover:shadow-indigo-500/25 focus:outline-none transition-all duration-300 hover:-translate-y-0.5 sm:w-auto"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Product
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl mb-8 flex items-center gap-3">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
          {error}
        </div>
      )}

      <div className="mt-8 flex flex-col space-y-16">
        {Array.from(new Set(products.map(p => p.category))).map(category => (
          <div key={category}>
            <div className="flex items-center gap-4 mb-6">
              <h2 className="text-2xl font-bold text-slate-100">{category}</h2>
              <div className="h-px flex-1 bg-gradient-to-r from-slate-800 to-transparent"></div>
            </div>
            
            <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8 pb-4 custom-scrollbar">
              <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
                <div className="overflow-hidden shadow-2xl rounded-2xl border border-slate-800 bg-slate-900/50 backdrop-blur-sm">
                  <table className="min-w-full divide-y divide-slate-800/50">
                    <thead className="bg-slate-800/30">
                      <tr>
                        <th scope="col" className="py-4 pl-4 pr-3 text-left text-sm font-semibold text-slate-300 sm:pl-6 whitespace-nowrap">Product</th>
                        <th scope="col" className="px-3 py-4 text-left text-sm font-semibold text-slate-300 whitespace-nowrap">COGS</th>
                        <th scope="col" className="px-3 py-4 text-left text-sm font-semibold text-slate-300 whitespace-nowrap">Transfer Price</th>
                        <th scope="col" className="px-3 py-4 text-left text-sm font-semibold text-slate-300 whitespace-nowrap">Selling Price</th>
                        <th scope="col" className="px-3 py-4 text-left text-sm font-semibold text-slate-300 whitespace-nowrap">Status</th>
                        <th scope="col" className="relative py-4 pl-3 pr-4 sm:pr-6">
                          <span className="sr-only">Actions</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                      {products.filter(p => p.category === category).map((product) => (
                        <tr key={product._id} className="hover:bg-slate-800/40 transition-colors duration-200 group">
                          <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
                            <div className="flex items-center">
                              <div className="h-12 w-12 flex-shrink-0 bg-slate-800 rounded-xl overflow-hidden p-1.5 border border-slate-700/50 group-hover:border-indigo-500/30 transition-colors">
                                <img className="h-full w-full object-contain" src={product.imageUrl || `https://via.placeholder.com/40?text=${product.nameEn.replace(/ /g, '+')}`} alt="" />
                              </div>
                              <div className="ml-4">
                                <div className="font-semibold text-slate-200 group-hover:text-indigo-300 transition-colors">{product.nameEn}</div>
                                <div className="text-slate-500 font-medium">{product.nameMr}</div>
                              </div>
                            </div>
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-400 font-medium">
                            ₹{product.cogs} <span className="text-slate-500 font-normal">/ {product.unit}</span>
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-400 font-medium">
                            ₹{product.plantTransferPrice} <span className="text-slate-500 font-normal">/ {product.unit}</span>
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-indigo-300 font-bold">
                            ₹{product.price} <span className="text-slate-500 font-normal">/ {product.unit}</span>
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm">
                            <button
                              onClick={() => toggleAvailability(product)}
                              className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border transition-colors duration-200 ${
                                product.isAvailable 
                                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20' 
                                  : 'bg-rose-500/10 text-rose-400 border-rose-500/20 hover:bg-rose-500/20'
                              }`}
                            >
                              {product.isAvailable ? 'Available' : 'Unavailable'}
                            </button>
                          </td>
                          <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                            <div className="flex justify-end gap-3 opacity-70 group-hover:opacity-100 transition-opacity">
                              <button 
                                onClick={() => openImageModal(product)} 
                                className="p-2 rounded-lg bg-slate-800 text-indigo-400 hover:bg-indigo-500 hover:text-white transition-all"
                                title="Change Image"
                              >
                                <ImageIcon className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => openEditModal(product)} 
                                className="p-2 rounded-lg bg-slate-800 text-indigo-400 hover:bg-indigo-500 hover:text-white transition-all"
                                title="Edit Product"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => handleDelete(product)} 
                                className="p-2 rounded-lg bg-slate-800 text-rose-400 hover:bg-rose-500 hover:text-white transition-all"
                                title="Delete Product"
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
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Image Upload Modal */}
      {showImageModal && selectedProduct && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-100">
                Update Image
              </h3>
              <button onClick={() => setShowImageModal(false)} className="text-slate-400 hover:text-slate-200 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="mb-6">
              <p className="text-sm text-slate-400 mb-4">Select a new image for <span className="text-indigo-300 font-medium">{selectedProduct.nameEn}</span></p>
              <input 
                type="file" 
                accept="image/*"
                onChange={(e) => setImageFile(e.target.files ? e.target.files[0] : null)}
                className="block w-full text-sm text-slate-400 file:mr-4 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-500/20 file:text-indigo-300 hover:file:bg-indigo-500/30 file:transition-colors file:cursor-pointer"
              />
            </div>

            <div className="mt-8 flex justify-end gap-3 border-t border-slate-800 pt-6">
              <button
                onClick={() => setShowImageModal(false)}
                className="bg-transparent py-2.5 px-5 border border-slate-700 rounded-xl text-sm font-medium text-slate-300 hover:bg-slate-800 focus:outline-none transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleImageUpload}
                disabled={!imageFile || uploading}
                className={`inline-flex justify-center py-2.5 px-5 border border-transparent text-sm font-medium rounded-xl text-white bg-indigo-600 hover:bg-indigo-500 focus:outline-none transition-colors ${(!imageFile || uploading) ? 'opacity-50 cursor-not-allowed' : 'shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40'}`}
              >
                {uploading ? 'Uploading...' : 'Upload & Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="px-6 py-5 border-b border-slate-800 flex justify-between items-center bg-slate-900 z-10 shrink-0">
              <h3 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                <Plus className="w-5 h-5 text-indigo-400" />
                Add New Product
              </h3>
              <button type="button" onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-200 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleAddSubmit} className="flex flex-col overflow-hidden">
              <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6 overflow-y-auto">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">English Name</label>
                  <input type="text" required value={addForm.nameEn || ''} onChange={(e) => setAddForm({...addForm, nameEn: e.target.value})} className="block w-full rounded-xl border-slate-700 bg-slate-950 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2.5 text-slate-100 placeholder-slate-600" placeholder="e.g. Fresh Milk" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Marathi Name</label>
                  <input type="text" required value={addForm.nameMr || ''} onChange={(e) => setAddForm({...addForm, nameMr: e.target.value})} className="block w-full rounded-xl border-slate-700 bg-slate-950 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2.5 text-slate-100 placeholder-slate-600" placeholder="e.g. ताजे दूध" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Selling Price (₹)</label>
                  <input type="number" required min="0" value={addForm.price || ''} onChange={(e) => setAddForm({...addForm, price: Number(e.target.value)})} className="block w-full rounded-xl border-slate-700 bg-slate-950 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2.5 text-slate-100 placeholder-slate-600" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">COGS (Production Cost) (₹)</label>
                  <input type="number" required min="0" value={addForm.cogs ?? ''} onChange={(e) => setAddForm({...addForm, cogs: Number(e.target.value)})} className="block w-full rounded-xl border-slate-700 bg-slate-950 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2.5 text-slate-100 placeholder-slate-600" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Plant Transfer Price (₹)</label>
                  <input type="number" required min="0" value={addForm.plantTransferPrice ?? ''} onChange={(e) => setAddForm({...addForm, plantTransferPrice: Number(e.target.value)})} className="block w-full rounded-xl border-slate-700 bg-slate-950 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2.5 text-slate-100 placeholder-slate-600" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Unit</label>
                  <input type="text" required value={addForm.unit || ''} onChange={(e) => setAddForm({...addForm, unit: e.target.value})} className="block w-full rounded-xl border-slate-700 bg-slate-950 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2.5 text-slate-100 placeholder-slate-600" placeholder="e.g. 1 Litre" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Category</label>
                  <select required value={addForm.category || ''} onChange={(e) => setAddForm({...addForm, category: e.target.value as any})} className="block w-full rounded-xl border-slate-700 bg-slate-950 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2.5 text-slate-100">
                    <option value="" disabled>Select a category</option>
                    <option value="Milk">Milk</option>
                    <option value="Fresh Dairy">Fresh Dairy</option>
                    <option value="Specialty">Specialty</option>
                    <option value="Beverages">Beverages</option>
                    <option value="Cheese">Cheese</option>
                    <option value="Frozen Dairy">Frozen Dairy</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Initial Stock</label>
                  <input type="number" required min="0" value={addForm.stock ?? 0} onChange={(e) => setAddForm({...addForm, stock: Number(e.target.value)})} className="block w-full rounded-xl border-slate-700 bg-slate-950 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2.5 text-slate-100 placeholder-slate-600" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Description</label>
                  <textarea rows={3} value={addForm.description || ''} onChange={(e) => setAddForm({...addForm, description: e.target.value})} className="block w-full rounded-xl border-slate-700 bg-slate-950 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-3 text-slate-100 placeholder-slate-600" placeholder="Product description..." />
                </div>
              </div>
              
              <div className="px-6 py-5 bg-slate-800/50 flex justify-end gap-3 border-t border-slate-800 shrink-0">
                <button type="button" onClick={() => setShowAddModal(false)} className="bg-transparent py-2.5 px-5 border border-slate-600 rounded-xl text-sm font-medium text-slate-300 hover:bg-slate-800 focus:outline-none transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={adding} className="inline-flex justify-center py-2.5 px-6 border border-transparent shadow-lg text-sm font-medium rounded-xl text-white bg-indigo-600 hover:bg-indigo-500 focus:outline-none transition-colors disabled:opacity-50">
                  {adding ? 'Adding...' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {showEditModal && selectedProduct && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="px-6 py-5 border-b border-slate-800 flex justify-between items-center bg-slate-900 z-10 shrink-0">
              <h3 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-indigo-400" />
                Edit Product
              </h3>
              <button type="button" onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-slate-200 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleEditSubmit} className="flex flex-col overflow-hidden">
              <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6 overflow-y-auto">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">English Name</label>
                  <input type="text" required value={editForm.nameEn || ''} onChange={(e) => setEditForm({...editForm, nameEn: e.target.value})} className="block w-full rounded-xl border-slate-700 bg-slate-950 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2.5 text-slate-100 placeholder-slate-600" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Marathi Name</label>
                  <input type="text" required value={editForm.nameMr || ''} onChange={(e) => setEditForm({...editForm, nameMr: e.target.value})} className="block w-full rounded-xl border-slate-700 bg-slate-950 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2.5 text-slate-100 placeholder-slate-600" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Selling Price (₹)</label>
                  <input type="number" required min="0" value={editForm.price || ''} onChange={(e) => setEditForm({...editForm, price: Number(e.target.value)})} className="block w-full rounded-xl border-slate-700 bg-slate-950 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2.5 text-slate-100 placeholder-slate-600" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">COGS (Production Cost) (₹)</label>
                  <input type="number" required min="0" value={editForm.cogs ?? ''} onChange={(e) => setEditForm({...editForm, cogs: Number(e.target.value)})} className="block w-full rounded-xl border-slate-700 bg-slate-950 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2.5 text-slate-100 placeholder-slate-600" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Plant Transfer Price (₹)</label>
                  <input type="number" required min="0" value={editForm.plantTransferPrice ?? ''} onChange={(e) => setEditForm({...editForm, plantTransferPrice: Number(e.target.value)})} className="block w-full rounded-xl border-slate-700 bg-slate-950 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2.5 text-slate-100 placeholder-slate-600" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Unit</label>
                  <input type="text" required value={editForm.unit || ''} onChange={(e) => setEditForm({...editForm, unit: e.target.value})} className="block w-full rounded-xl border-slate-700 bg-slate-950 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2.5 text-slate-100 placeholder-slate-600" placeholder="e.g. 1 Litre" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Category</label>
                  <select required value={editForm.category || ''} onChange={(e) => setEditForm({...editForm, category: e.target.value as any})} className="block w-full rounded-xl border-slate-700 bg-slate-950 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2.5 text-slate-100">
                    <option value="" disabled>Select a category</option>
                    <option value="Milk">Milk</option>
                    <option value="Fresh Dairy">Fresh Dairy</option>
                    <option value="Specialty">Specialty</option>
                    <option value="Beverages">Beverages</option>
                    <option value="Cheese">Cheese</option>
                    <option value="Frozen Dairy">Frozen Dairy</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Stock</label>
                  <input type="number" required min="0" value={editForm.stock || 0} onChange={(e) => setEditForm({...editForm, stock: Number(e.target.value)})} className="block w-full rounded-xl border-slate-700 bg-slate-950 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2.5 text-slate-100 placeholder-slate-600" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Description</label>
                  <textarea rows={3} value={editForm.description || ''} onChange={(e) => setEditForm({...editForm, description: e.target.value})} className="block w-full rounded-xl border-slate-700 bg-slate-950 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-3 text-slate-100 placeholder-slate-600" />
                </div>
              </div>
              
              <div className="px-6 py-5 bg-slate-800/50 flex justify-end gap-3 border-t border-slate-800 shrink-0">
                <button type="button" onClick={() => setShowEditModal(false)} className="bg-transparent py-2.5 px-5 border border-slate-600 rounded-xl text-sm font-medium text-slate-300 hover:bg-slate-800 focus:outline-none transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="inline-flex justify-center py-2.5 px-6 border border-transparent shadow-lg text-sm font-medium rounded-xl text-white bg-indigo-600 hover:bg-indigo-500 focus:outline-none transition-colors disabled:opacity-50">
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && productToDelete && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 transition-opacity">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden transform transition-all">
            <div className="p-6 sm:p-8 flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-rose-500/10 flex items-center justify-center mb-6 border border-rose-500/20">
                <AlertTriangle className="w-8 h-8 text-rose-500" />
              </div>
              <h3 className="text-2xl font-bold text-slate-100 mb-3">Delete Product?</h3>
              <p className="text-slate-400 mb-8 leading-relaxed">
                Are you sure you want to permanently remove <span className="font-semibold text-slate-200">{productToDelete.nameEn}</span> from the catalog? This action cannot be undone.
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
