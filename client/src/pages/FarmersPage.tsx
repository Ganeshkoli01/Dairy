import React, { useState, useEffect } from 'react';
import { farmerApi } from '../api/farmerApi';
import { branchApi } from '../api/branchApi';
import { Farmer, FarmerInput, MilkType } from '../types/farmer';
import { Branch } from '../types/branch';
import { authApi } from '../api/authApi';
import { useAuth } from '../context/AuthContext';
import { UserCheck, Plus, Edit2, Trash2, Search, Filter, Phone, Calendar, AlertCircle, X, Loader2, Mail, Key, Lock, Check } from 'lucide-react';

export const FarmersPage: React.FC = () => {
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  const { user } = useAuth();

  // Filters
  const [selectedBranch, setSelectedBranch] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingFarmer, setEditingFarmer] = useState<Farmer | null>(null);
  const [formData, setFormData] = useState<FarmerInput>({
    farmerCode: '',
    name: '',
    branch: '',
    defaultMilkType: 'cow',
    mobile: '',
    email: '',
    password: '',
    otp: '',
    isActive: true,
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [otpSent, setOtpSent] = useState<boolean>(false);
  const [sendingOtp, setSendingOtp] = useState<boolean>(false);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  // Delete Confirmation State
  const [deletingFarmer, setDeletingFarmer] = useState<{ id: string; name: string } | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const branchesData = await branchApi.getBranches();
      
      let currentSelectedBranch = selectedBranch;
      if (user?.role === 'dairyOwner' && branchesData.length > 0 && !selectedBranch) {
        currentSelectedBranch = branchesData[0]._id;
        setSelectedBranch(currentSelectedBranch);
      }

      const farmersData = await farmerApi.getFarmers({ branch: currentSelectedBranch || undefined, search: searchTerm || undefined });

      setFarmers(farmersData);
      setBranches(branchesData);
      if (branchesData.length > 0 && !formData.branch) {
        setFormData((prev) => ({ ...prev, branch: branchesData[0]._id }));
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load farmers list');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedBranch]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
  };

  const handleOpenAddModal = () => {
    setEditingFarmer(null);
    setFormData({
      farmerCode: '',
      name: '',
      branch: selectedBranch || (branches.length > 0 ? branches[0]._id : ''),
      defaultMilkType: 'cow',
      mobile: '',
      email: '',
      password: '',
      otp: '',
      isActive: true,
    });
    setFormError(null);
    setFormSuccess(null);
    setOtpSent(false);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (farmer: Farmer) => {
    setEditingFarmer(farmer);
    const branchId = typeof farmer.branch === 'object' ? farmer.branch._id : farmer.branch;
    setFormData({
      farmerCode: farmer.farmerCode,
      name: farmer.name,
      branch: branchId,
      defaultMilkType: farmer.defaultMilkType || 'cow',
      mobile: farmer.mobile || '',
      email: '', // Don't prefill password or email on edit for security/simplicity unless returned by backend
      password: '',
      isActive: farmer.isActive ?? true,
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);

    try {
      if (editingFarmer) {
        await farmerApi.updateFarmer(editingFarmer._id, formData);
      } else {
        await farmerApi.createFarmer(formData);
      }
      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Failed to save farmer record');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendOtp = async () => {
    if (!formData.email) {
      setFormError('Please enter email first to send OTP');
      return;
    }
    setSendingOtp(true);
    setFormError(null);
    setFormSuccess(null);
    try {
      const res = await authApi.sendOtp(formData.email);
      setOtpSent(true);
      setFormSuccess(res.message + (res.previewUrl ? ` (Preview: ${res.previewUrl})` : ''));
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setSendingOtp(false);
    }
  };

  const handleDelete = (id: string, name: string) => {
    setDeletingFarmer({ id, name });
  };

  const confirmDelete = async () => {
    if (!deletingFarmer) return;
    try {
      await farmerApi.deleteFarmer(deletingFarmer.id);
      loadData();
      setDeletingFarmer(null);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete farmer');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400 border border-emerald-500/20">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-100">Farmer Directory (सभासद/कोड-नाव)</h1>
            <p className="text-xs text-slate-400 mt-0.5">Manage farmer codes, branch assignments, and milk preferences</p>
          </div>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="flex items-center justify-center space-x-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white px-4 py-2.5 rounded-xl font-medium text-sm shadow-lg shadow-emerald-500/20 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Farmer</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-slate-900 border border-slate-800 rounded-xl p-4">
        <div className="flex items-center space-x-2 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2">
          <Filter className="w-4 h-4 text-slate-500" />
          <select
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            disabled={user?.role === 'dairyOwner'}
            className="bg-transparent border-none text-slate-200 text-sm focus:outline-none w-full disabled:opacity-50"
          >
            {user?.role !== 'dairyOwner' && (
              <option value="" className="bg-slate-900 text-slate-200">All Branches</option>
            )}
            {branches.map((b) => (
              <option key={b._id} value={b._id} className="bg-slate-900 text-slate-200">
                {b.name} ({b.code})
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center space-x-2 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 md:col-span-2">
          <Search className="w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by farmer code or name (press Enter)..."
            className="bg-transparent border-none text-slate-100 text-sm focus:outline-none w-full placeholder-slate-500"
          />
          <button
            type="submit"
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1 text-xs font-medium rounded-lg border border-slate-700 transition-colors"
          >
            Search
          </button>
        </div>
      </form>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-center space-x-3">
          <AlertCircle className="w-5 h-5 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-12 text-center flex flex-col items-center justify-center text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-400 mb-2" />
            <p className="text-sm">Loading farmers list...</p>
          </div>
        ) : farmers.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <UserCheck className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-base font-semibold text-slate-300">No Farmers Found</p>
            <p className="text-xs text-slate-500 mt-1">
              No registered farmers matched your current branch or search filter.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-950/60 text-slate-400 uppercase text-[11px] font-semibold tracking-wider border-b border-slate-800">
                  <th className="py-3.5 px-6">Code</th>
                  <th className="py-3.5 px-6">Farmer Name</th>
                  <th className="py-3.5 px-6">Branch</th>
                  <th className="py-3.5 px-6">Milk Type</th>
                  <th className="py-3.5 px-6">Mobile</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-sm">
                {farmers.map((farmer) => {
                  const branchObj = typeof farmer.branch === 'object' ? farmer.branch : null;
                  return (
                    <tr key={farmer._id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-4 px-6 font-mono font-bold text-emerald-400">
                        {farmer.farmerCode}
                      </td>
                      <td className="py-4 px-6 font-semibold text-slate-100">
                        {farmer.name}
                      </td>
                      <td className="py-4 px-6 text-slate-300 text-xs">
                        {branchObj ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                            {branchObj.name} ({branchObj.code})
                          </span>
                        ) : (
                          'N/A'
                        )}
                      </td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold uppercase ${
                          farmer.defaultMilkType === 'cow'
                            ? 'bg-amber-500/10 text-amber-300 border border-amber-500/30'
                            : farmer.defaultMilkType === 'buffalo'
                            ? 'bg-purple-500/10 text-purple-300 border border-purple-500/30'
                            : 'bg-blue-500/10 text-blue-300 border border-blue-500/30'
                        }`}>
                          {farmer.defaultMilkType}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-slate-400 text-xs">
                        {farmer.mobile ? (
                          <span className="flex items-center space-x-1">
                            <Phone className="w-3 h-3 text-slate-500" />
                            <span>{farmer.mobile}</span>
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                          farmer.isActive
                            ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                            : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                        }`}>
                          {farmer.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleOpenEditModal(farmer)}
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-emerald-300 rounded-lg transition-colors border border-slate-700"
                            title="Edit Farmer"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(farmer._id, farmer.name)}
                            className="p-1.5 bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-300 rounded-lg transition-colors border border-slate-700 hover:border-rose-800"
                            title="Delete Farmer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Farmer Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800">
              <div className="flex items-center space-x-2.5">
                <UserCheck className="w-5 h-5 text-emerald-400" />
                <h2 className="text-lg font-bold text-slate-100">
                  {editingFarmer ? 'Edit Farmer Record' : 'Register New Farmer'}
                </h2>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-200 transition-colors p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Select Branch *
                </label>
                <select
                  required
                  value={formData.branch}
                  onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                  disabled={user?.role === 'dairyOwner'}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 outline-none disabled:opacity-50"
                >
                  {user?.role !== 'dairyOwner' && (
                    <option value="" disabled>Select branch...</option>
                  )}
                  {branches.map((b) => (
                    <option key={b._id} value={b._id}>
                      {b.name} ({b.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Farmer Code (Code/No) *
                </label>
                <input
                  type="text"
                  required
                  value={formData.farmerCode}
                  onChange={(e) => setFormData({ ...formData, farmerCode: e.target.value })}
                  placeholder="e.g. 101"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-sm font-mono text-emerald-400 outline-none"
                />
                <p className="text-[11px] text-slate-500 mt-1">Unique within selected branch</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Farmer Full Name (सभासदाचे नाव) *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Ramesh Ananda Patil"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Default Milk Type
                  </label>
                  <select
                    value={formData.defaultMilkType}
                    onChange={(e) => setFormData({ ...formData, defaultMilkType: e.target.value as MilkType })}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 outline-none capitalize"
                  >
                    <option value="cow">Cow (गाय)</option>
                    <option value="buffalo">Buffalo (म्हैस)</option>
                    <option value="both">Both (दोन्ही)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Mobile Number
                  </label>
                  <input
                    type="text"
                    value={formData.mobile}
                    onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                    placeholder="9876543210"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 outline-none"
                  />
                </div>
              </div>

              {formSuccess && (
                <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center space-x-2">
                  <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>{formSuccess}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 mt-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Email Address (Optional)
                  </label>
                  <div className="flex space-x-2">
                    <div className="relative flex-1">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        disabled={!!editingFarmer}
                        placeholder="farmer@dairy.com"
                        className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl py-2.5 pl-9 pr-3.5 text-sm text-slate-100 outline-none disabled:opacity-50"
                      />
                    </div>
                    {!editingFarmer && formData.email && (
                      <button type="button" onClick={handleSendOtp} disabled={sendingOtp} className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-xl border border-slate-700 transition-colors whitespace-nowrap flex items-center justify-center min-w-[80px]">
                        {sendingOtp ? <Loader2 className="w-4 h-4 animate-spin" /> : (otpSent ? 'Resend' : 'Send OTP')}
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Login Password (Optional)
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="password"
                      value={formData.password}
                      disabled={!!editingFarmer}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="Secure password"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl py-2.5 pl-9 pr-3.5 text-sm text-slate-100 outline-none disabled:opacity-50"
                    />
                  </div>
                </div>
              </div>

              {!editingFarmer && otpSent && (
                <div className="animate-in fade-in slide-in-from-top-2 mt-3">
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">6-Digit OTP *</label>
                  <div className="relative">
                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
                    <input type="text" required maxLength={6} value={formData.otp} onChange={(e) => setFormData({ ...formData, otp: e.target.value })} placeholder="------" className="w-full bg-slate-950 border border-emerald-500/50 focus:border-emerald-500 rounded-xl py-2.5 pl-9 pr-3.5 text-sm tracking-widest text-slate-100 outline-none" />
                  </div>
                </div>
              )}

              <div className="flex items-center space-x-3 pt-2 mt-3">
                <input
                  type="checkbox"
                  id="farmerIsActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 rounded bg-slate-950 border-slate-800 text-emerald-500 focus:ring-emerald-500"
                />
                <label htmlFor="farmerIsActive" className="text-sm font-medium text-slate-300 cursor-pointer">
                  Farmer Account Active
                </label>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-6 border-t border-slate-800 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 text-sm hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center space-x-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-medium text-sm px-5 py-2.5 rounded-xl shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{editingFarmer ? 'Update Farmer' : 'Create Farmer'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingFarmer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl relative animate-in fade-in zoom-in duration-150 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-100 mb-2">Delete Farmer</h3>
            <p className="text-sm text-slate-400 mb-6">
              Are you sure you want to delete <span className="font-semibold text-slate-200">"{deletingFarmer.name}"</span>? This action cannot be undone.
            </p>
            <div className="flex items-center justify-center space-x-3">
              <button
                onClick={() => setDeletingFarmer(null)}
                className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 text-sm font-medium hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-sm font-medium transition-colors shadow-lg shadow-rose-500/20"
              >
                Delete Farmer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
