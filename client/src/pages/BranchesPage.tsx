import React, { useState, useEffect } from 'react';
import { branchApi } from '../api/branchApi';
import { Branch, BranchInput } from '../types/branch';
import { authApi } from '../api/authApi';
import { Plus, Edit2, Trash2, Building2, MapPin, Search, AlertCircle, X, Check, Loader2, UserPlus, Mail, Phone, Lock, Key } from 'lucide-react';
import { Link } from 'react-router-dom';

export const BranchesPage: React.FC = () => {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [formData, setFormData] = useState<BranchInput>({
    name: '',
    code: '',
    location: '',
    isActive: true,
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Branch Expansion State
  const [expandedBranchId, setExpandedBranchId] = useState<string | null>(null);
  const [branchOwners, setBranchOwners] = useState<any[]>([]);
  const [loadingOwners, setLoadingOwners] = useState<boolean>(false);

  // Owner Modal State
  const [isOwnerModalOpen, setIsOwnerModalOpen] = useState<boolean>(false);
  const [selectedBranchForOwner, setSelectedBranchForOwner] = useState<Branch | null>(null);
  const [editingOwner, setEditingOwner] = useState<any | null>(null);
  const [ownerFormData, setOwnerFormData] = useState({
    ownerName: '',
    email: '',
    password: '',
    phone: '',
    otp: ''
  });
  const [ownerFormError, setOwnerFormError] = useState<string | null>(null);
  const [ownerFormSuccess, setOwnerFormSuccess] = useState<string | null>(null);
  const [submittingOwner, setSubmittingOwner] = useState<boolean>(false);
  const [otpSent, setOtpSent] = useState<boolean>(false);
  const [sendingOtp, setSendingOtp] = useState<boolean>(false);
  const [agreedToTermsOwner, setAgreedToTermsOwner] = useState<boolean>(false);

  // Delete Confirmation States
  const [deletingBranch, setDeletingBranch] = useState<{ id: string; name: string } | null>(null);
  const [deletingOwnerId, setDeletingOwnerId] = useState<{ id: string; name: string } | null>(null);

  const fetchBranches = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await branchApi.getBranches();
      setBranches(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch branches');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBranches();
  }, []);

  const handleToggleExpand = async (branchId: string) => {
    if (expandedBranchId === branchId) {
      setExpandedBranchId(null);
      setBranchOwners([]);
    } else {
      setExpandedBranchId(branchId);
      setLoadingOwners(true);
      try {
        const res = await authApi.getOwnersByBranch(branchId);
        setBranchOwners(res.data || []);
      } catch (err: any) {
        console.error('Failed to fetch owners:', err);
      } finally {
        setLoadingOwners(false);
      }
    }
  };

  const handleOpenAddModal = () => {
    setEditingBranch(null);
    let nextCodeStr = 'BR001';
    if (branches.length > 0) {
      let maxNum = 0;
      branches.forEach(b => {
        const match = b.code.match(/\d+/);
        if (match) {
          const num = parseInt(match[0], 10);
          if (num > maxNum) maxNum = num;
        }
      });
      const nextNum = maxNum + 1;
      nextCodeStr = `BR${nextNum.toString().padStart(3, '0')}`;
    }
    setFormData({ name: '', code: nextCodeStr, location: '', isActive: true });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (branch: Branch) => {
    setEditingBranch(branch);
    setFormData({
      name: branch.name,
      code: branch.code,
      location: branch.location || '',
      isActive: branch.isActive,
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);

    try {
      if (editingBranch) {
        await branchApi.updateBranch(editingBranch._id, formData);
      } else {
        await branchApi.createBranch(formData);
      }
      setIsModalOpen(false);
      fetchBranches();
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Failed to save branch');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (id: string, name: string) => {
    setDeletingBranch({ id, name });
  };

  const confirmDeleteBranch = async () => {
    if (!deletingBranch) return;
    try {
      await branchApi.deleteBranch(deletingBranch.id);
      fetchBranches();
      setDeletingBranch(null);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete branch');
    }
  };

  const handleOpenOwnerModal = (branch: Branch) => {
    setSelectedBranchForOwner(branch);
    setOwnerFormData({ ownerName: '', email: '', password: '', phone: '', otp: '' });
    setOwnerFormError(null);
    setOwnerFormSuccess(null);
    setOtpSent(false);
    setAgreedToTermsOwner(false);
    setIsOwnerModalOpen(true);
  };

  const handleSendOwnerOtp = async () => {
    if (!ownerFormData.email) {
      setOwnerFormError('Please enter email first');
      return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(ownerFormData.email)) {
      setOwnerFormError('Please enter a valid email address');
      return;
    }

    setSendingOtp(true);
    setOwnerFormError(null);
    setOwnerFormSuccess(null);
    try {
      const res = await authApi.sendOtp(ownerFormData.email);
      setOtpSent(true);
      setOwnerFormSuccess(res.message + (res.previewUrl ? ` (Preview: ${res.previewUrl})` : ''));
    } catch (err: any) {
      setOwnerFormError(err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setSendingOtp(false);
    }
  };

  const handleOpenEditOwnerModal = (owner: any, branch: Branch) => {
    setEditingOwner(owner);
    setSelectedBranchForOwner(branch);
    setOwnerFormData({
      ownerName: owner.name || '',
      email: owner.email || '',
      password: '',
      phone: owner.phone || '',
      otp: ''
    });
    setOwnerFormError(null);
    setOwnerFormSuccess(null);
    setOtpSent(false);
    setIsOwnerModalOpen(true);
  };

  const handleDeleteOwner = (id: string, name: string) => {
    setDeletingOwnerId({ id, name });
  };

  const confirmDeleteOwner = async () => {
    if (!deletingOwnerId) return;
    try {
      await authApi.deleteOwner(deletingOwnerId.id);
      if (expandedBranchId) {
        const res = await authApi.getOwnersByBranch(expandedBranchId);
        setBranchOwners(res.data || []);
      }
      setDeletingOwnerId(null);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete owner');
    }
  };

  const handleCreateOwner = async (e: React.FormEvent) => {
    e.preventDefault();
    setOwnerFormError(null);
    setSubmittingOwner(true);

    if (!selectedBranchForOwner) return;

    if (!editingOwner) {
      if (!agreedToTermsOwner) {
        setOwnerFormError('You must agree to the Terms & Conditions and Privacy Policy');
        setSubmittingOwner(false);
        return;
      }
      
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(ownerFormData.email)) {
        setOwnerFormError('Please enter a valid email address');
        setSubmittingOwner(false);
        return;
      }
    }

    try {
      if (editingOwner) {
        await authApi.updateOwner(editingOwner._id, {
          ownerName: ownerFormData.ownerName,
          phone: ownerFormData.phone,
          email: ownerFormData.email,
          password: ownerFormData.password,
        });
        if (expandedBranchId) {
          const res = await authApi.getOwnersByBranch(expandedBranchId);
          setBranchOwners(res.data || []);
        }
        setIsOwnerModalOpen(false);
      } else {
        await authApi.adminCreateOwner({
          ownerName: ownerFormData.ownerName,
          email: ownerFormData.email,
          password: ownerFormData.password,
          phone: ownerFormData.phone,
          branchId: selectedBranchForOwner._id,
          otp: ownerFormData.otp
        });
        setIsOwnerModalOpen(false);
        setOwnerFormSuccess('Dairy owner created successfully!');
      }
    } catch (err: any) {
      setOwnerFormError(err.response?.data?.message || 'Failed to save Dairy Owner');
    } finally {
      setSubmittingOwner(false);
    }
  };

  const filteredBranches = branches.filter(
    (b) =>
      b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (b.location && b.location.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-cyan-500/10 rounded-xl text-cyan-400 border border-cyan-500/20">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-100">Branch Management (शाखा)</h1>
            <p className="text-xs text-slate-400 mt-0.5">Manage dairy collection branches and center codes</p>
          </div>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="flex items-center justify-center space-x-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white px-4 py-2.5 rounded-xl font-medium text-sm shadow-lg shadow-cyan-500/20 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Branch</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="flex items-center space-x-3 bg-slate-900 border border-slate-800 rounded-xl px-4 py-3">
        <Search className="w-5 h-5 text-slate-500" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by branch name, code, or location..."
          className="bg-transparent border-none text-slate-100 text-sm focus:outline-none w-full placeholder-slate-500"
        />
      </div>

      {/* Main Table */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-center space-x-3">
          <AlertCircle className="w-5 h-5 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-12 text-center flex flex-col items-center justify-center text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-cyan-400 mb-2" />
            <p className="text-sm">Loading branches list...</p>
          </div>
        ) : filteredBranches.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Building2 className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-base font-semibold text-slate-300">No Branches Found</p>
            <p className="text-xs text-slate-500 mt-1">
              {searchTerm ? 'No results matched your search term.' : 'Click "Add New Branch" to create your first branch.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-950/60 text-slate-400 uppercase text-[11px] font-semibold tracking-wider border-b border-slate-800">
                  <th className="py-3.5 px-6">Branch Code</th>
                  <th className="py-3.5 px-6">Branch Name</th>
                  <th className="py-3.5 px-6">Location</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-sm">
                {filteredBranches.map((branch) => (
                  <React.Fragment key={branch._id}>
                  <tr className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-4 px-6 font-mono font-semibold text-cyan-400">
                      {branch.code}
                    </td>
                    <td className="py-4 px-6 font-medium text-emerald-400 hover:text-emerald-300 cursor-pointer transition-colors" onClick={() => handleToggleExpand(branch._id)} title="Click to view/manage owners">
                      {branch.name}
                    </td>
                    <td className="py-4 px-6 text-slate-400 flex items-center space-x-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-500" />
                      <span>{branch.location || 'N/A'}</span>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                        branch.isActive
                          ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                          : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                      }`}>
                        {branch.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleOpenOwnerModal(branch)}
                          className="p-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 hover:text-emerald-300 rounded-lg transition-colors border border-emerald-500/20"
                          title="Add Dairy Owner"
                        >
                          <UserPlus className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenEditModal(branch)}
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-cyan-300 rounded-lg transition-colors border border-slate-700"
                          title="Edit Branch"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(branch._id, branch.name)}
                          className="p-1.5 bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-300 rounded-lg transition-colors border border-slate-700 hover:border-rose-800"
                          title="Delete Branch"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                  {expandedBranchId === branch._id && (
                    <tr className="bg-slate-900/50">
                      <td colSpan={5} className="p-0 border-b border-slate-800/50">
                        <div className="bg-slate-950/80 p-5 border-l-2 border-emerald-500 mx-6 my-3 rounded-xl shadow-inner">
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                              <Building2 className="w-4 h-4 text-emerald-400" />
                              Dairy Owners for {branch.name}
                            </h4>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingOwner(null);
                                setSelectedBranchForOwner(branch);
                                setOwnerFormData({ ownerName: '', email: '', password: '', phone: '', otp: '' });
                                setOwnerFormError(null);
                                setOwnerFormSuccess(null);
                                setOtpSent(false);
                                setIsOwnerModalOpen(true);
                              }}
                              className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1.5 bg-emerald-500/10 px-3 py-1.5 rounded-lg transition-colors border border-emerald-500/20 hover:bg-emerald-500/20"
                            >
                              <UserPlus className="w-3.5 h-3.5" />
                              Add Owner
                            </button>
                          </div>
                          
                          {loadingOwners ? (
                            <div className="flex items-center justify-center p-6 text-slate-500 text-sm">
                              <Loader2 className="w-5 h-5 animate-spin mr-2 text-cyan-400" /> Loading owners...
                            </div>
                          ) : branchOwners.length === 0 ? (
                            <div className="text-center p-6 text-sm text-slate-500 bg-slate-900/50 rounded-lg border border-slate-800 border-dashed">
                              No owners assigned to this branch yet.
                            </div>
                          ) : (
                            <div className="overflow-x-auto rounded-xl border border-slate-800/50">
                              <table className="w-full text-left text-sm whitespace-nowrap">
                                <thead className="bg-slate-900 text-slate-400 text-xs uppercase tracking-wider">
                                  <tr>
                                    <th className="px-5 py-3 font-medium">Name</th>
                                    <th className="px-5 py-3 font-medium">Email</th>
                                    <th className="px-5 py-3 font-medium">Phone</th>
                                    <th className="px-5 py-3 font-medium text-right">Actions</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/50">
                                  {branchOwners.map(owner => (
                                    <tr key={owner._id} className="hover:bg-slate-800/40 transition-colors">
                                      <td className="px-5 py-3 font-medium text-slate-200">{owner.name}</td>
                                      <td className="px-5 py-3 text-slate-400">{owner.email}</td>
                                      <td className="px-5 py-3 text-slate-400">{owner.phone || '-'}</td>
                                      <td className="px-5 py-3 text-right">
                                        <div className="flex items-center justify-end space-x-2">
                                          <button onClick={(e) => { e.stopPropagation(); handleOpenEditOwnerModal(owner, branch); }} className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-cyan-400 transition-colors rounded-lg border border-slate-700" title="Edit Owner">
                                            <Edit2 className="w-3.5 h-3.5" />
                                          </button>
                                          <button onClick={(e) => { e.stopPropagation(); handleDeleteOwner(owner._id, owner.name); }} className="p-1.5 bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-400 transition-colors rounded-lg border border-slate-700" title="Delete Owner">
                                            <Trash2 className="w-3.5 h-3.5" />
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
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Branch Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative animate-in fade-in zoom-in duration-150 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800">
              <div className="flex items-center space-x-2.5">
                <Building2 className="w-5 h-5 text-cyan-400" />
                <h2 className="text-lg font-bold text-slate-100">
                  {editingBranch ? 'Edit Branch' : 'Add New Branch'}
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
                  Branch Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Central Dairy Branch"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Branch Code (Unique) *
                </label>
                <input
                  type="text"
                  required
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="e.g. BR001"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-3.5 py-2.5 text-sm font-mono text-cyan-400 outline-none uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Location / Village (Optional)
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="e.g. Main Market Road, Sangli"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 outline-none"
                />
              </div>

              <div className="flex items-center space-x-3 pt-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 rounded bg-slate-950 border-slate-800 text-cyan-500 focus:ring-cyan-500"
                />
                <label htmlFor="isActive" className="text-sm font-medium text-slate-300 cursor-pointer">
                  Branch Active &amp; Accepting Collection
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
                  className="flex items-center space-x-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-medium text-sm px-5 py-2.5 rounded-xl shadow-lg shadow-cyan-500/20 transition-all disabled:opacity-50"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{editingBranch ? 'Update Branch' : 'Create Branch'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Owner Modal */}
      {isOwnerModalOpen && selectedBranchForOwner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative animate-in fade-in zoom-in duration-150 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800">
              <div className="flex items-center space-x-2.5">
                <UserPlus className="w-5 h-5 text-emerald-400" />
                <h2 className="text-lg font-bold text-slate-100">{editingOwner ? 'Edit Owner in' : 'Add Owner to'} {selectedBranchForOwner.name}</h2>
              </div>
              <button onClick={() => setIsOwnerModalOpen(false)} className="text-slate-400 hover:text-slate-200 transition-colors p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            {ownerFormError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                <span>{ownerFormError}</span>
              </div>
            )}
            
            {ownerFormSuccess && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center space-x-2">
                <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>{ownerFormSuccess}</span>
              </div>
            )}

            <form onSubmit={handleCreateOwner} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Owner Name *</label>
                  <input type="text" required value={ownerFormData.ownerName} onChange={(e) => setOwnerFormData({ ...ownerFormData, ownerName: e.target.value })} placeholder="John Doe" className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Phone</label>
                  <input type="tel" value={ownerFormData.phone} onChange={(e) => setOwnerFormData({ ...ownerFormData, phone: e.target.value })} placeholder="9876543210" className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 outline-none" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Email Address {editingOwner ? '(Optional: Leave blank to keep current)' : '*'}
                  </label>
                  <div className="flex space-x-2">
                    <div className="relative flex-1">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <input type="email" autoComplete="off" required={!editingOwner} value={ownerFormData.email} onChange={(e) => setOwnerFormData({ ...ownerFormData, email: e.target.value })} placeholder={editingOwner ? "Enter new email to change" : "owner@dairy.com"} className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl py-2.5 pl-9 pr-3.5 text-sm text-slate-100 outline-none" />
                    </div>
                    {!editingOwner && ownerFormData.email && (
                      <button type="button" onClick={handleSendOwnerOtp} disabled={sendingOtp} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium rounded-xl border border-slate-700 transition-colors whitespace-nowrap flex items-center justify-center min-w-[100px]">
                        {sendingOtp ? <Loader2 className="w-4 h-4 animate-spin" /> : (otpSent ? 'Resend' : 'Send OTP')}
                      </button>
                    )}
                  </div>
                </div>

                {!editingOwner && otpSent && (
                  <div className="animate-in fade-in slide-in-from-top-2">
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">6-Digit OTP *</label>
                    <div className="relative">
                      <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
                      <input type="text" required maxLength={6} value={ownerFormData.otp} onChange={(e) => setOwnerFormData({ ...ownerFormData, otp: e.target.value })} placeholder="------" className="w-full bg-slate-950 border border-emerald-500/50 focus:border-emerald-500 rounded-xl py-2.5 pl-9 pr-3.5 text-sm tracking-widest text-slate-100 outline-none" />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Temporary Password {editingOwner ? '(Optional: Leave blank to keep current)' : '*'}
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input type="password" autoComplete="new-password" required={!editingOwner} minLength={6} value={ownerFormData.password} onChange={(e) => setOwnerFormData({ ...ownerFormData, password: e.target.value })} placeholder={editingOwner ? "Enter new password to change" : "••••••••"} className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl py-2.5 pl-9 pr-3.5 text-sm text-slate-100 outline-none" />
                  </div>
                </div>
                
                {!editingOwner && (
                  <div className="col-span-2 mt-4 flex items-start space-x-3 bg-slate-950/50 p-3 rounded-xl border border-slate-800">
                    <input
                      type="checkbox"
                      id="terms-owner"
                      checked={agreedToTermsOwner}
                      onChange={(e) => setAgreedToTermsOwner(e.target.checked)}
                      className="mt-1 w-4 h-4 rounded border-slate-700 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-slate-900 bg-slate-900"
                    />
                    <label htmlFor="terms-owner" className="text-xs text-slate-300 leading-relaxed">
                      I agree to the <Link to="/terms" className="text-emerald-400 hover:underline">Terms & Conditions</Link> and <Link to="/privacy" className="text-emerald-400 hover:underline">Privacy Policy</Link>.
                    </label>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end space-x-3 pt-6 border-t border-slate-800 mt-6">
                <button type="button" onClick={() => setIsOwnerModalOpen(false)} className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 text-sm hover:bg-slate-800 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={submittingOwner || (!editingOwner && !otpSent)} className="flex items-center space-x-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-medium text-sm px-5 py-2.5 rounded-xl shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50">
                  {submittingOwner && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{editingOwner ? 'Update Owner' : 'Create Owner'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Branch Confirmation Modal */}
      {deletingBranch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl relative animate-in fade-in zoom-in duration-150 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-100 mb-2">Delete Branch</h3>
            <p className="text-sm text-slate-400 mb-6">
              Are you sure you want to delete branch <span className="font-semibold text-slate-200">"{deletingBranch.name}"</span>? This action cannot be undone.
            </p>
            <div className="flex items-center justify-center space-x-3">
              <button
                onClick={() => setDeletingBranch(null)}
                className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 text-sm font-medium hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteBranch}
                className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-sm font-medium transition-colors shadow-lg shadow-rose-500/20"
              >
                Delete Branch
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Owner Confirmation Modal */}
      {deletingOwnerId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl relative animate-in fade-in zoom-in duration-150 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-100 mb-2">Delete Dairy Owner</h3>
            <p className="text-sm text-slate-400 mb-6">
              Are you sure you want to delete owner <span className="font-semibold text-slate-200">"{deletingOwnerId.name}"</span>? This action cannot be undone.
            </p>
            <div className="flex items-center justify-center space-x-3">
              <button
                onClick={() => setDeletingOwnerId(null)}
                className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 text-sm font-medium hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteOwner}
                className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-sm font-medium transition-colors shadow-lg shadow-rose-500/20"
              >
                Delete Owner
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
