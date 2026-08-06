const fs = require('fs');

const path = './src/pages/BranchesPage.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Add states for expanding branches
content = content.replace(
  `  // Owner Modal State`,
  `  // Branch Expansion State
  const [expandedBranchId, setExpandedBranchId] = useState<string | null>(null);
  const [branchOwners, setBranchOwners] = useState<any[]>([]);
  const [loadingOwners, setLoadingOwners] = useState<boolean>(false);

  // Owner Modal State`
);

// 2. Add editingOwner state
content = content.replace(
  `const [selectedBranchForOwner, setSelectedBranchForOwner] = useState<Branch | null>(null);`,
  `const [selectedBranchForOwner, setSelectedBranchForOwner] = useState<Branch | null>(null);
  const [editingOwner, setEditingOwner] = useState<any | null>(null);`
);

// 3. Add handleToggleExpand
content = content.replace(
  `  const handleOpenAddModal = () => {`,
  `  const handleToggleExpand = async (branchId: string) => {
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

  const handleOpenAddModal = () => {`
);

// 4. Update owner modal handlers
content = content.replace(
  `  const handleCreateOwner = async (e: React.FormEvent) => {`,
  `  const handleOpenEditOwnerModal = (owner: any, branch: Branch) => {
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
    setIsOwnerModalOpen(true);
  };

  const handleDeleteOwner = async (id: string, name: string) => {
    if (!window.confirm(\`Are you sure you want to delete owner "\${name}"?\`)) return;
    try {
      await authApi.deleteOwner(id);
      if (expandedBranchId) {
        // Refresh owners list
        const res = await authApi.getOwnersByBranch(expandedBranchId);
        setBranchOwners(res.data || []);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete owner');
    }
  };

  const handleCreateOwner = async (e: React.FormEvent) => {`
);

// 5. Update handleCreateOwner to handle editing too
content = content.replace(
  `    try {
      await authApi.adminCreateOwner({
        ownerName: ownerFormData.ownerName,
        email: ownerFormData.email,
        password: ownerFormData.password,
        phone: ownerFormData.phone,
        branchId: selectedBranchForOwner._id,
        otp: ownerFormData.otp
      });
      setIsOwnerModalOpen(false);
      alert('Dairy owner created successfully!');
    } catch (err: any) {`,
  `    try {
      if (editingOwner) {
        await authApi.updateOwner(editingOwner._id, {
          ownerName: ownerFormData.ownerName,
          phone: ownerFormData.phone,
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
        alert('Dairy owner created successfully!');
      }
    } catch (err: any) {`
);

// 6. Update Owner Modal UI to hide email/pass/otp if editing
content = content.replace(
  `<h2 className="text-lg font-bold text-slate-100">Add Owner to {selectedBranchForOwner.name}</h2>`,
  `<h2 className="text-lg font-bold text-slate-100">{editingOwner ? 'Edit Owner' : 'Add Owner'} in {selectedBranchForOwner.name}</h2>`
);

content = content.replace(
  `              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Email Address *</label>`,
  `              {!editingOwner && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Email Address *</label>`
);

content = content.replace(
  `                  <input type="text" required maxLength={6} value={ownerFormData.otp} onChange={(e) => setOwnerFormData({ ...ownerFormData, otp: e.target.value })} placeholder="------" className="w-full bg-slate-950 border border-emerald-500/50 focus:border-emerald-500 rounded-xl py-2.5 pl-9 pr-3.5 text-sm tracking-widest text-slate-100 outline-none" />
                </div>
              </div>`,
  `                  <input type="text" required maxLength={6} value={ownerFormData.otp} onChange={(e) => setOwnerFormData({ ...ownerFormData, otp: e.target.value })} placeholder="------" className="w-full bg-slate-950 border border-emerald-500/50 focus:border-emerald-500 rounded-xl py-2.5 pl-9 pr-3.5 text-sm tracking-widest text-slate-100 outline-none" />
                  </div>
                </div>
              )}`
);
content = content.replace(
  `<div className="animate-in fade-in slide-in-from-top-2">`,
  `{otpSent && <div className="animate-in fade-in slide-in-from-top-2">`
);
content = content.replace(
  `</div>
              <div className="flex items-center justify-end space-x-3 pt-6 border-t border-slate-800 mt-6">`,
  `</div>}
                </>
              )}
              <div className="flex items-center justify-end space-x-3 pt-6 border-t border-slate-800 mt-6">`
);
// Above replacement for otpSent div is messy. Let's fix that specific part better later or manually via script if it fails.
// Let's replace the whole form instead for the Owner Modal because it's easier.

let formContent = `
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
              </div>

              {!editingOwner && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Email Address *</label>
                    <div className="flex space-x-2">
                      <div className="relative flex-1">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input type="email" required value={ownerFormData.email} onChange={(e) => setOwnerFormData({ ...ownerFormData, email: e.target.value })} placeholder="owner@dairy.com" className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl py-2.5 pl-9 pr-3.5 text-sm text-slate-100 outline-none" />
                      </div>
                      <button type="button" onClick={handleSendOtp} disabled={sendingOtp || !ownerFormData.email} className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-xl border border-slate-700 transition-colors whitespace-nowrap flex items-center justify-center min-w-[80px]">
                        {sendingOtp ? <Loader2 className="w-4 h-4 animate-spin" /> : (otpSent ? 'Resend' : 'Send OTP')}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Login Password *</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <input type="password" required value={ownerFormData.password} onChange={(e) => setOwnerFormData({ ...ownerFormData, password: e.target.value })} placeholder="Secure password" className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl py-2.5 pl-9 pr-3.5 text-sm text-slate-100 outline-none" />
                    </div>
                  </div>

                  {otpSent && (
                    <div className="animate-in fade-in slide-in-from-top-2">
                      <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">6-Digit OTP *</label>
                      <div className="relative">
                        <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
                        <input type="text" required maxLength={6} value={ownerFormData.otp} onChange={(e) => setOwnerFormData({ ...ownerFormData, otp: e.target.value })} placeholder="------" className="w-full bg-slate-950 border border-emerald-500/50 focus:border-emerald-500 rounded-xl py-2.5 pl-9 pr-3.5 text-sm tracking-widest text-slate-100 outline-none" />
                      </div>
                    </div>
                  )}
                </>
              )}

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
`;
// Let's just do a regex replace for the whole owner modal form.
content = content.replace(/<form onSubmit=\{handleCreateOwner\} className="space-y-4">[\s\S]*?<\/form>/, formContent);

// 7. Update the table to handle row expansion and clicking on branch name
const expandRowCode = \`
                      <td colSpan={6} className="p-0 border-b border-slate-800/50">
                        <div className="bg-slate-950/50 p-4 border-l-2 border-emerald-500/50 mx-4 my-2 rounded-xl">
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                              <Building2 className="w-4 h-4 text-emerald-400" />
                              Dairy Owners for {b.name}
                            </h4>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingOwner(null);
                                setSelectedBranchForOwner(b);
                                setOwnerFormData({ ownerName: '', email: '', password: '', phone: '', otp: '' });
                                setOwnerFormError(null);
                                setOwnerFormSuccess(null);
                                setOtpSent(false);
                                setIsOwnerModalOpen(true);
                              }}
                              className="text-xs font-medium text-emerald-400 hover:text-emerald-300 flex items-center gap-1 bg-emerald-500/10 px-2 py-1 rounded-lg"
                            >
                              <UserPlus className="w-3 h-3" />
                              Add Owner
                            </button>
                          </div>
                          
                          {loadingOwners ? (
                            <div className="flex items-center justify-center p-4 text-slate-500 text-sm">
                              <Loader2 className="w-4 h-4 animate-spin mr-2" /> Loading owners...
                            </div>
                          ) : branchOwners.length === 0 ? (
                            <div className="text-center p-4 text-sm text-slate-500">
                              No owners assigned to this branch yet.
                            </div>
                          ) : (
                            <div className="overflow-x-auto rounded-lg border border-slate-800/50">
                              <table className="w-full text-left text-sm whitespace-nowrap">
                                <thead className="bg-slate-900/80 text-slate-400 text-xs uppercase tracking-wider">
                                  <tr>
                                    <th className="px-4 py-2 font-medium">Name</th>
                                    <th className="px-4 py-2 font-medium">Email</th>
                                    <th className="px-4 py-2 font-medium">Phone</th>
                                    <th className="px-4 py-2 font-medium text-right">Actions</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/50">
                                  {branchOwners.map(owner => (
                                    <tr key={owner._id} className="hover:bg-slate-800/30">
                                      <td className="px-4 py-2 text-slate-200">{owner.name}</td>
                                      <td className="px-4 py-2 text-slate-400">{owner.email}</td>
                                      <td className="px-4 py-2 text-slate-400">{owner.phone || '-'}</td>
                                      <td className="px-4 py-2 text-right space-x-2">
                                        <button onClick={(e) => { e.stopPropagation(); handleOpenEditOwnerModal(owner, b); }} className="text-slate-400 hover:text-cyan-400 transition-colors p-1" title="Edit Owner">
                                          <Edit2 className="w-3.5 h-3.5" />
                                        </button>
                                        <button onClick={(e) => { e.stopPropagation(); handleDeleteOwner(owner._id, owner.name); }} className="text-slate-400 hover:text-rose-400 transition-colors p-1" title="Delete Owner">
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      </td>
\`;

// Replace the branch name click to trigger expansion
content = content.replace(
  \`<div className="font-semibold text-slate-200">
                            {b.name}
                          </div>\`,
  \`<div className="font-semibold text-emerald-400 hover:text-emerald-300 cursor-pointer transition-colors" onClick={() => handleToggleExpand(b._id)}>
                            {b.name}
                          </div>\`
);

// We also need to map the expanded row.
// Look for the end of the <tr> and add the expanded row right after it.
const trRegex = /(<tr key=\{b\._id\}.*?>[\s\S]*?<\/tr>)/g;
content = content.replace(trRegex, (match) => {
  return match + \`\\n                    {expandedBranchId === b._id && (\\n                      <tr>\\n\` + expandRowCode + \`\\n                      </tr>\\n                    )}\`;
});


// Note: Remove the old "Add Owner" action from the main table actions since we put it inside the expanded row.
// Or leave it? "Add Owner" button inside the main table row actions:
// <button onClick={() => { setSelectedBranchForOwner(b); ... }} title="Add Dairy Owner">
content = content.replace(
  /onClick=\{\(\) => \{(?:.|\n)*?setIsOwnerModalOpen\(true\);\n\s*\}\}\n\s*className="p-1\.5 bg-slate-900\/50 hover:bg-slate-800 rounded-lg text-emerald-400 hover:text-emerald-300 transition-colors"\n\s*title="Add Dairy Owner"/g,
  \`onClick={(e) => {
                              e.stopPropagation();
                              setEditingOwner(null);
                              setSelectedBranchForOwner(b);
                              setOwnerFormData({ ownerName: '', email: '', password: '', phone: '', otp: '' });
                              setOwnerFormError(null);
                              setOwnerFormSuccess(null);
                              setOtpSent(false);
                              setIsOwnerModalOpen(true);
                            }}
                            className="p-1.5 bg-slate-900/50 hover:bg-slate-800 rounded-lg text-emerald-400 hover:text-emerald-300 transition-colors"
                            title="Add Dairy Owner"\`
);

fs.writeFileSync(path, content, 'utf8');
console.log('Update complete');
