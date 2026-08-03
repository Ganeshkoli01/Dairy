import React, { useState, useEffect } from 'react';
import { branchApi } from '../api/branchApi';
import { Branch, BranchInput } from '../types/branch';
import { Plus, Edit2, Trash2, Building2, MapPin, Search, AlertCircle, X, Check, Loader2 } from 'lucide-react';

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

  const handleOpenAddModal = () => {
    setEditingBranch(null);
    setFormData({ name: '', code: '', location: '', isActive: true });
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

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete branch "${name}"?`)) return;
    try {
      await branchApi.deleteBranch(id);
      fetchBranches();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete branch');
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
                  <tr key={branch._id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-4 px-6 font-mono font-semibold text-cyan-400">
                      {branch.code}
                    </td>
                    <td className="py-4 px-6 font-medium text-slate-200">
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
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Branch Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative animate-in fade-in zoom-in duration-150">
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
    </div>
  );
};
