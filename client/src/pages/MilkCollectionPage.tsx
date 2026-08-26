import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { milkCollectionApi } from '../api/milkCollectionApi';
import { branchApi } from '../api/branchApi';
import { farmerApi } from '../api/farmerApi';
import { rateChartApi } from '../api/rateChartApi';
import { useAuth } from '../context/AuthContext';
import { serialHardware, HardwareReadings, HardwareStatus } from '../utils/webSerial';
import { Branch } from '../types/branch';
import { MilkType } from '../types/farmer';
import { MilkCollectionEntry, MilkCollectionSummary, SessionType } from '../types/milkCollection';
import {
  Milk,
  Sun,
  Moon,
  Calendar,
  Building2,
  Save,
  RotateCcw,
  History,
  TrendingUp,
  Scale,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Hash,
  Usb,
  Cpu,
  Wifi,
  WifiOff,
} from 'lucide-react';

export const MilkCollectionPage: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const urlDate = searchParams.get('date');
  const urlSession = searchParams.get('session');
  const urlEditId = searchParams.get('editId');

  // Top Bar State
  const [selectedBranch, setSelectedBranch] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(
    urlDate || new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0]
  );
  const [selectedSession, setSelectedSession] = useState<SessionType>((urlSession as SessionType) || 'morning');
  const [branches, setBranches] = useState<Branch[]>([]);

  // Hardware Auto-Capture States
  const [hwStatus, setHwStatus] = useState<HardwareStatus>('disconnected');
  const [hwMessage, setHwMessage] = useState<string>('');
  const [autoWeight, setAutoWeight] = useState<boolean>(false);
  const [autoFat, setAutoFat] = useState<boolean>(false);
  const autoWeightRef = useRef<boolean>(autoWeight);
  const autoFatRef = useRef<boolean>(autoFat);

  useEffect(() => {
    autoWeightRef.current = autoWeight;
  }, [autoWeight]);

  useEffect(() => {
    autoFatRef.current = autoFat;
  }, [autoFat]);



  const [lastRawReading, setLastRawReading] = useState<string>('');

  // Form Entry State
  const [farmerCode, setFarmerCode] = useState<string>('');
  const [farmerName, setFarmerName] = useState<string>('');
  const [farmerId, setFarmerId] = useState<string>('');
  const [milkType, setMilkType] = useState<MilkType>('cow');
  
  useEffect(() => {
    serialHardware.currentMilkType = milkType;
  }, [milkType]);

  const [weight, setWeight] = useState<string>('');
  const [fat, setFat] = useState<string>('');
  const [snf, setSnf] = useState<string>('');
  const [degree, setDegree] = useState<string>('28');
  const [useClr, setUseClr] = useState<boolean>(false);

  // Live Calculated Preview
  const [previewRate, setPreviewRate] = useState<number | null>(null);
  const [previewAmount, setPreviewAmount] = useState<number | null>(null);

  // Previous Session Reference Line
  const [prevSessionEntry, setPrevSessionEntry] = useState<MilkCollectionEntry | null>(null);
  const [loadingFarmer, setLoadingFarmer] = useState<boolean>(false);
  
  // Farmers List for Dropdown
  const [farmersList, setFarmersList] = useState<any[]>([]);

  // Today's Grid Data & Summary
  const [entries, setEntries] = useState<MilkCollectionEntry[]>([]);
  const [summary, setSummary] = useState<MilkCollectionSummary | null>(null);
  const [loadingGrid, setLoadingGrid] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formError, setFormError] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Auto-edit from URL
  useEffect(() => {
    if (urlEditId && entries.length > 0 && !editingId) {
      const entryToEdit = entries.find(e => e._id === urlEditId);
      if (entryToEdit) {
        handleEditRow(entryToEdit);
        // Remove editId from URL so it doesn't get re-triggered
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, [urlEditId, entries]);

  // Delete Confirmation State
  const [deletingEntry, setDeletingEntry] = useState<{ id: string; name: string } | null>(null);

  // DOM Input Refs for Fast Keyboard Navigation
  const farmerCodeRef = useRef<HTMLInputElement>(null);
  const weightRef = useRef<HTMLInputElement>(null);
  const fatRef = useRef<HTMLInputElement>(null);
  const degreeRef = useRef<HTMLInputElement>(null);

  // 1. Initial Load of Branches & Serial Hardware Registration
  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const branchList = await branchApi.getBranches();
        setBranches(branchList);
        if (branchList.length > 0) {
          setSelectedBranch(branchList[0]._id);
        }
      } catch (err) {
        console.error('Failed to load branches', err);
      }
    };
    fetchBranches();

    // Register Web Serial Hardware Callbacks
    serialHardware.setCallbacks(
      (readings: HardwareReadings) => {
        setLastRawReading(readings.rawString || '');

        // Auto-fill Weight if Auto Weight checkbox is enabled
        if (autoWeightRef.current && readings.weight !== undefined) {
          setWeight(readings.weight.toString());
        }

        // Auto-fill FAT & SNF if Auto FAT checkbox is enabled
        if (autoFatRef.current) {
          if (readings.fat !== undefined) setFat(readings.fat.toString());
          if (readings.snf !== undefined) setSnf(readings.snf.toString());
          if (readings.clr !== undefined) setDegree(readings.clr.toString());
        }
      },
      (status: HardwareStatus, msg?: string) => {
        setHwStatus(status);
        if (msg) setHwMessage(msg);
      }
    );

    return () => {
      serialHardware.disconnect();
    };
  }, []);

  // 2. Fetch Today's Grid Entries & Aggregation Summary whenever Top Bar changes
  const loadGridAndSummary = async () => {
    if (!selectedBranch) return;
    setLoadingGrid(true);
    try {
      const [listData, summaryData] = await Promise.all([
        milkCollectionApi.getMilkCollections(selectedBranch, selectedDate, selectedSession),
        milkCollectionApi.getSummary(selectedBranch, selectedDate, selectedSession),
      ]);
      setEntries(listData);
      setSummary(summaryData);
    } catch (err) {
      console.error('Error fetching grid entries & summary', err);
    } finally {
      setLoadingGrid(false);
    }
  };

  useEffect(() => {
    const fetchFarmers = async () => {
      if (!selectedBranch) return;
      try {
        const list = await farmerApi.getFarmers({ branch: selectedBranch });
        setFarmersList(list);
      } catch (err) {
        console.error('Failed to load farmers for branch', err);
      }
    };
    
    if (selectedBranch) {
      loadGridAndSummary();
      fetchFarmers();
    }
  }, [selectedBranch, selectedDate, selectedSession]);

  // 3. Auto SNF Calculation from FAT + CLR
  useEffect(() => {
    if (useClr) {
      const fatNum = parseFloat(fat);
      const clrNum = parseFloat(degree);
      if (!isNaN(fatNum) && !isNaN(clrNum)) {
        const computed = clrNum / 4 + 0.2 * fatNum + 0.36;
        setSnf((Math.round(computed * 100) / 100).toFixed(2));
      }
    }
  }, [fat, degree, useClr]);

  // 4. Live Rate & Amount Preview Lookup
  useEffect(() => {
    const fetchLiveRatePreview = async () => {
      const fatNum = parseFloat(fat);
      const snfNum = parseFloat(snf);
      const weightNum = parseFloat(weight);

      if (isNaN(fatNum) || isNaN(snfNum) || fatNum <= 0 || snfNum <= 0) {
        setPreviewRate(null);
        setPreviewAmount(null);
        return;
      }

      try {
        const res = await rateChartApi.lookupRate({
          milkType,
          fat: fatNum,
          snf: snfNum,
          branchId: selectedBranch || null,
          date: selectedDate,
        });

        if (res.success && res.result.rate !== null) {
          setPreviewRate(res.result.rate);
          if (!isNaN(weightNum) && weightNum > 0) {
            setPreviewAmount(Math.round(weightNum * res.result.rate * 100) / 100);
          } else {
            setPreviewAmount(null);
          }
        } else {
          setPreviewRate(null);
          setPreviewAmount(null);
        }
      } catch (err) {
        setPreviewRate(null);
        setPreviewAmount(null);
      }
    };

    fetchLiveRatePreview();
  }, [milkType, fat, snf, weight, selectedBranch, selectedDate]);

  // 5. Lookup Farmer Name & Previous History on Code Blur or Enter
  const handleLookupFarmer = async (overrideCode?: string, overrideMilkType?: string) => {
    const codeToLookup = overrideCode || farmerCode;
    const typeToLookup = overrideMilkType || milkType;
    if (!codeToLookup || !selectedBranch) return;
    setLoadingFarmer(true);
    setFormError(null);
    try {
      const [farmerObj, prevHistory] = await Promise.all([
        farmerApi.getFarmerByBranchAndCode(selectedBranch, codeToLookup.trim(), typeToLookup).catch(() => null),
        milkCollectionApi.getFarmerPreviousSession(codeToLookup.trim()).catch(() => null),
      ]);

      if (farmerObj) {
        setFarmerName(farmerObj.name);
        setFarmerId(farmerObj._id);
        if (farmerObj.defaultMilkType && farmerObj.defaultMilkType !== 'both' && !overrideMilkType) {
          setMilkType(farmerObj.defaultMilkType as MilkType);
        }
      } else {
        setFormError(`Farmer code '${codeToLookup}' not found in selected branch`);
        setFarmerName('');
      }

      setPrevSessionEntry(prevHistory);
    } catch (err: any) {
      setFormError(`Farmer code '${codeToLookup}' lookup failed`);
      setFarmerName('');
    } finally {
      setLoadingFarmer(false);
    }
  };

  // Re-fetch farmer when milk type changes to ensure we have the correct sub-account
  useEffect(() => {
    if (farmerCode && !loadingFarmer) {
       handleLookupFarmer(farmerCode, milkType);
    }
  }, [milkType]);

  // 6. Handle Form Submit (Save Entry)
  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setFormError(null);

    const weightNum = parseFloat(weight);
    const fatNum = parseFloat(fat);
    const snfNum = parseFloat(snf);

    if (!selectedBranch || !farmerCode || !farmerName) {
      setFormError('Please enter a valid farmer code and branch');
      farmerCodeRef.current?.focus();
      return;
    }

    if (isNaN(weightNum) || weightNum <= 0) {
      setFormError('Please enter valid milk weight (liters)');
      weightRef.current?.focus();
      return;
    }

    if (isNaN(fatNum) || isNaN(snfNum) || fatNum < 0 || snfNum < 0) {
      setFormError('Please enter valid FAT and SNF percentage');
      fatRef.current?.focus();
      return;
    }

    setSaving(true);

    try {
      if (editingId) {
        await milkCollectionApi.updateMilkCollection(editingId, {
          milkType,
          weight: weightNum,
          fat: fatNum,
          snf: snfNum,
          degree: parseFloat(degree) || 0,
          session: selectedSession,
          autoFat,
          autoWeight,
        });
        setSuccessToast(`Updated entry for Farmer ${farmerName}`);
      } else {
        await milkCollectionApi.createMilkCollection({
          branch: selectedBranch,
          date: selectedDate,
          session: selectedSession,
          farmerCode: farmerCode.trim(),
          farmerName,
          farmerId,
          milkType,
          weight: weightNum,
          fat: fatNum,
          snf: snfNum,
          degree: parseFloat(degree) || 0,
          useClr,
          autoFat,
          autoWeight,
        });
        setSuccessToast(`Saved entry for Code #${farmerCode} (${farmerName})`);
      }

      // Reset form fields & refocus Code input for rapid continuous entry
      resetForm();
      loadGridAndSummary();
      setTimeout(() => setSuccessToast(null), 3000);
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Failed to record milk entry');
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setFarmerCode('');
    setFarmerName('');
    setFarmerId('');
    setWeight('');
    setFat('');
    setSnf('');
    setDegree('28');
    setPreviewRate(null);
    setPreviewAmount(null);
    setPrevSessionEntry(null);
    setFormError(null);
    farmerCodeRef.current?.focus();
  };

  const handleEditRow = (entry: MilkCollectionEntry) => {
    setEditingId(entry._id);
    setFarmerCode(entry.farmerCode);
    setFarmerName(entry.farmerName);
    setMilkType(entry.milkType);
    setWeight(entry.weight.toString());
    setFat(entry.fat.toString());
    setSnf(entry.snf.toString());
    setDegree(entry.degree ? entry.degree.toString() : '28');
    setPreviewRate(entry.rate);
    setPreviewAmount(entry.amount);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteRow = (id: string, name: string) => {
    setDeletingEntry({ id, name });
  };

  const confirmDelete = async () => {
    if (!deletingEntry) return;
    try {
      await milkCollectionApi.deleteMilkCollection(deletingEntry.id);
      loadGridAndSummary();
      setDeletingEntry(null);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete entry');
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. TOP BAR CONTROL PANEL */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4">
          {/* Branch Dropdown */}
          <div className="flex items-center space-x-2 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2">
            <Building2 className="w-4 h-4 text-cyan-400" />
            {user?.role === 'dairyOwner' ? (
              <div className="text-slate-100 text-sm font-semibold">
                {branches.find((b) => b._id === selectedBranch) 
                  ? `${branches.find((b) => b._id === selectedBranch)?.name} (${branches.find((b) => b._id === selectedBranch)?.code})` 
                  : 'Loading Branch...'}
              </div>
            ) : (
              <select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className="bg-transparent border-none text-slate-100 text-sm font-semibold focus:outline-none"
              >
                {branches.map((b) => (
                  <option key={b._id} value={b._id} className="bg-slate-900 text-slate-200">
                    {b.name} ({b.code})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Date Picker */}
          <div className="flex items-center space-x-2 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2">
            <Calendar className="w-4 h-4 text-cyan-400" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent border-none text-slate-100 text-sm font-semibold focus:outline-none"
            />
          </div>

          {/* Session Toggle */}
          <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => setSelectedSession('morning')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                selectedSession === 'morning'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sun className="w-3.5 h-3.5 text-amber-400" />
              <span>Morning (सकाळ)</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedSession('evening')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                selectedSession === 'evening'
                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Moon className="w-3.5 h-3.5 text-indigo-400" />
              <span>Evening (संध्याकाळ)</span>
            </button>
          </div>
        </div>

        {/* Running Entry Count Badge */}
        <div className="flex items-center justify-end space-x-3">
          <div className="bg-slate-950 border border-slate-800 px-4 py-2 rounded-xl flex items-center space-x-2">
            <Hash className="w-4 h-4 text-cyan-400" />
            <div>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Today Entries</p>
              <p className="text-sm font-extrabold text-cyan-300 font-mono leading-tight">
                {summary?.combined?.entryCount || 0} Records
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* WEB SERIAL HARDWARE CONNECTIVITY CONTROL BAR */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className={`p-2.5 rounded-xl border ${
            hwStatus === 'connected'
              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
              : hwStatus === 'simulating'
              ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30'
              : 'bg-slate-800 text-slate-400 border-slate-700'
          }`}>
            <Usb className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-bold text-slate-100">Hardware Integration</h3>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase border ${
                hwStatus === 'connected'
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : hwStatus === 'simulating'
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}>
                {hwStatus}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              {hwMessage || (hwStatus === 'disconnected' ? 'No physical USB scale or milk analyzer connected' : lastRawReading)}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {hwStatus === 'disconnected' ? (
            <>
              <button
                type="button"
                onClick={() => serialHardware.connect(9600)}
                className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-semibold px-3 py-2 rounded-xl border border-slate-700 transition-colors"
              >
                <Wifi className="w-4 h-4 text-cyan-400" />
                <span>Connect USB Device</span>
              </button>
              <button
                type="button"
                onClick={() => serialHardware.startSimulation(2500)}
                className="flex items-center space-x-1.5 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-xs font-semibold px-3 py-2 rounded-xl border border-cyan-500/40 transition-colors"
              >
                <Cpu className="w-4 h-4 text-cyan-400" />
                <span>Start Simulator</span>
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => serialHardware.disconnect()}
              className="flex items-center space-x-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-xs font-semibold px-3 py-2 rounded-xl border border-rose-500/40 transition-colors"
            >
              <WifiOff className="w-4 h-4 text-rose-400" />
              <span>Disconnect</span>
            </button>
          )}
        </div>
      </div>

      {/* Toast Notification */}
      {successToast && (
        <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-sm flex items-center space-x-3 shadow-lg">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          <span className="font-semibold">{successToast}</span>
        </div>
      )}

      {/* 2. MAIN LAYOUT: LEFT ENTRY FORM + RIGHT SUMMARY PANEL */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT 2 COLS: HIGH-FREQUENCY DATA ENTRY FORM */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-gradient-to-tr from-cyan-500 to-blue-600 rounded-xl text-white shadow-lg shadow-cyan-500/20">
                <Milk className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-100">
                  {editingId ? 'Edit Collection Entry' : 'Rapid Milk Collection Entry'}
                </h2>
                <p className="text-xs text-slate-400">High-frequency entry form • Press Enter to submit</p>
              </div>
            </div>

            {editingId && (
              <span className="text-xs px-2.5 py-1 rounded-full font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Editing Entry
              </span>
            )}
          </div>

          {formError && (
            <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* ROW 1: Farmer Code & Name Lookup */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Farmer Code *
                </label>
                <div className="relative group">
                  {user?.role === 'farmer' ? (
                    <input
                      ref={farmerCodeRef}
                      type="text"
                      value={farmerCode}
                      disabled
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm font-mono font-bold text-slate-500 outline-none cursor-not-allowed"
                    />
                  ) : (
                    <input
                      ref={farmerCodeRef}
                      type="text"
                      value={farmerCode}
                      onChange={(e) => setFarmerCode(e.target.value)}
                      onBlur={() => handleLookupFarmer()}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleLookupFarmer();
                          weightRef.current?.focus();
                        }
                      }}
                      placeholder="e.g. 101"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-3.5 py-2.5 text-sm font-mono font-bold text-cyan-400 outline-none"
                    />
                  )}
                  {loadingFarmer && (
                    <Loader2 className="w-4 h-4 animate-spin text-cyan-400 absolute right-3 top-1/2 -translate-y-1/2" />
                  )}
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Farmer Name (सभासदाचे नाव)
                </label>
                <input
                  type="text"
                  readOnly
                  value={farmerName}
                  placeholder="Auto-filled on code lookup..."
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-200 outline-none cursor-not-allowed"
                />
              </div>
            </div>

            {/* PREVIOUS SESSION REFERENCE LINE */}
            {prevSessionEntry && (
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center space-x-3 text-xs">
                <History className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                <div className="flex-1 flex flex-wrap items-center justify-between gap-2 text-slate-300">
                  <span>
                    <strong>Prev Session ({prevSessionEntry.session}):</strong>{' '}
                    <span className="font-mono text-cyan-300">{prevSessionEntry.weight}L</span> | FAT{' '}
                    <span className="font-mono text-cyan-300">{prevSessionEntry.fat}%</span> | SNF{' '}
                    <span className="font-mono text-cyan-300">{prevSessionEntry.snf}%</span>
                  </span>
                  <span className="font-mono text-emerald-400 font-bold">
                    ₹{prevSessionEntry.rate}/L (₹{prevSessionEntry.amount})
                  </span>
                </div>
              </div>
            )}

            {/* ROW 2: Milk Type Radio Toggle, Auto-Weight & Auto-FAT Toggles */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-3 bg-slate-950 rounded-xl border border-slate-800">
              <div className="flex items-center space-x-4">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Milk Type:
                </label>
                <div className="flex items-center space-x-4">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="milkType"
                      value="cow"
                      checked={milkType === 'cow'}
                      onChange={() => {
                        setMilkType('cow');
                        if (farmerCode.trim()) {
                          handleLookupFarmer(undefined, 'cow');
                        }
                      }}
                      className="text-amber-500 focus:ring-amber-500"
                    />
                    <span className="text-sm font-bold text-amber-300">🐮 Cow (गाय)</span>
                  </label>

                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="milkType"
                      value="buffalo"
                      checked={milkType === 'buffalo'}
                      onChange={() => {
                        setMilkType('buffalo');
                        if (farmerCode.trim()) {
                          handleLookupFarmer(undefined, 'buffalo');
                        }
                      }}
                      className="text-purple-500 focus:ring-purple-500"
                    />
                    <span className="text-sm font-bold text-purple-300">🦬 Buffalo (म्हैस)</span>
                  </label>
                </div>
              </div>

              {/* Hardware Auto-Capture Checkboxes */}
              <div className="flex flex-wrap items-center gap-3">
                <label className="flex items-center space-x-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoWeight}
                    onChange={(e) => setAutoWeight(e.target.checked)}
                    className="w-4 h-4 rounded bg-slate-900 border-slate-800 text-cyan-500 focus:ring-cyan-500"
                  />
                  <span className="text-xs font-bold text-cyan-300">Auto Weight</span>
                </label>

                <label className="flex items-center space-x-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoFat}
                    onChange={(e) => setAutoFat(e.target.checked)}
                    className="w-4 h-4 rounded bg-slate-900 border-slate-800 text-emerald-500 focus:ring-emerald-500"
                  />
                  <span className="text-xs font-bold text-emerald-300">Auto FAT/SNF</span>
                </label>

                <label className="flex items-center space-x-1.5 cursor-pointer border-l border-slate-800 pl-3">
                  <input
                    type="checkbox"
                    checked={useClr}
                    onChange={(e) => setUseClr(e.target.checked)}
                    className="w-4 h-4 rounded bg-slate-900 border-slate-800 text-cyan-500 focus:ring-cyan-500"
                  />
                  <span className="text-xs font-medium text-slate-300">Auto SNF from CLR</span>
                </label>
              </div>
            </div>

            {/* ROW 3: Weight, FAT, SNF, CLR Inputs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Weight (L) *
                  </label>
                  {autoWeight && (
                    <span className="text-[10px] bg-cyan-500/20 text-cyan-300 px-1.5 rounded font-bold">
                      AUTO
                    </span>
                  )}
                </div>
                <input
                  ref={weightRef}
                  type="number"
                  step="0.1"
                  required
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      fatRef.current?.focus();
                    }
                  }}
                  placeholder="10.0"
                  className={`w-full bg-slate-950 border rounded-xl px-3.5 py-2.5 text-sm font-mono font-bold outline-none transition-colors ${
                    autoWeight ? 'border-cyan-500/60 text-cyan-200 bg-cyan-500/10' : 'border-slate-800 text-slate-100 focus:border-cyan-500'
                  }`}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    FAT (%) *
                  </label>
                  {autoFat && (
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 rounded font-bold">
                      AUTO
                    </span>
                  )}
                </div>
                <input
                  ref={fatRef}
                  type="number"
                  step="0.1"
                  required
                  value={fat}
                  onChange={(e) => setFat(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (useClr) degreeRef.current?.focus();
                      else handleSubmit();
                    }
                  }}
                  placeholder="3.5"
                  className={`w-full bg-slate-950 border rounded-xl px-3.5 py-2.5 text-sm font-mono font-bold outline-none transition-colors ${
                    autoFat ? 'border-emerald-500/60 text-emerald-200 bg-emerald-500/10' : 'border-slate-800 text-slate-100 focus:border-cyan-500'
                  }`}
                />
              </div>

              {useClr ? (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    CLR (डिग्री) *
                  </label>
                  <input
                    ref={degreeRef}
                    type="number"
                    step="0.5"
                    value={degree}
                    onChange={(e) => setDegree(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleSubmit();
                      }
                    }}
                    placeholder="28"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-3.5 py-2.5 text-sm font-mono font-bold text-cyan-300 outline-none"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    SNF (%) *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={snf}
                    onChange={(e) => setSnf(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleSubmit();
                      }
                    }}
                    placeholder="8.5"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-3.5 py-2.5 text-sm font-mono font-bold text-slate-100 outline-none"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Calculated SNF
                </label>
                <input
                  type="text"
                  readOnly
                  value={snf ? `${snf}%` : '—'}
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm font-mono font-bold text-cyan-300 outline-none cursor-not-allowed"
                />
              </div>
            </div>

            {/* ROW 4: Live Rate & Amount Preview Box */}
            <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-slate-950 border border-slate-800">
              <div>
                <p className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">Rate (₹ / Liter)</p>
                <p className="text-xl font-extrabold text-emerald-400 font-mono mt-0.5">
                  {previewRate !== null ? `₹${previewRate.toFixed(2)}` : '—'}
                </p>
              </div>

              <div>
                <p className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">Total Amount (₹)</p>
                <p className="text-xl font-extrabold text-cyan-300 font-mono mt-0.5">
                  {previewAmount !== null ? `₹${previewAmount.toFixed(2)}` : '—'}
                </p>
              </div>
            </div>

            {/* FORM ACTION BUTTONS */}
            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={resetForm}
                className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 text-xs font-medium hover:bg-slate-800 transition-colors"
              >
                <RotateCcw className="w-4 h-4 text-slate-400" />
                <span>Clear / Cancel</span>
              </button>

              <button
                type="submit"
                disabled={saving}
                className="flex items-center space-x-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold text-sm px-6 py-2.5 rounded-xl shadow-lg shadow-cyan-500/20 transition-all disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>{editingId ? 'Update Record' : 'Save Collection Entry'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* RIGHT 1 COL: LIVE SUMMARY PANEL */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between space-y-6">
          <div>
            <div className="flex items-center space-x-2 mb-4 pb-3 border-b border-slate-800">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
              <h3 className="text-base font-bold text-slate-100">Live Session Summary</h3>
            </div>

            {/* Cow Summary Card */}
            <div className="mb-4 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-300 uppercase">🐮 Cow Milk (गाय)</span>
                <span className="text-xs text-amber-400 font-mono font-semibold">
                  {summary?.cow?.entryCount || 0} entries
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-slate-400 block">Liters:</span>
                  <span className="font-extrabold text-slate-100 font-mono text-sm">
                    {summary?.cow?.totalLiters || 0} L
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Amount:</span>
                  <span className="font-extrabold text-amber-300 font-mono text-sm">
                    ₹{summary?.cow?.totalAmount || 0}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Avg FAT / SNF:</span>
                  <span className="font-mono text-slate-200">
                    {summary?.cow?.weightedAvgFat || 0}% / {summary?.cow?.weightedAvgSnf || 0}%
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Avg Rate:</span>
                  <span className="font-mono text-slate-200">
                    ₹{summary?.cow?.weightedAvgRate || 0}/L
                  </span>
                </div>
              </div>
            </div>

            {/* Buffalo Summary Card */}
            <div className="mb-4 p-4 rounded-xl bg-purple-500/10 border border-purple-500/20 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-purple-300 uppercase">🦬 Buffalo Milk (म्हैस)</span>
                <span className="text-xs text-purple-400 font-mono font-semibold">
                  {summary?.buffalo?.entryCount || 0} entries
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-slate-400 block">Liters:</span>
                  <span className="font-extrabold text-slate-100 font-mono text-sm">
                    {summary?.buffalo?.totalLiters || 0} L
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Amount:</span>
                  <span className="font-extrabold text-purple-300 font-mono text-sm">
                    ₹{summary?.buffalo?.totalAmount || 0}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Avg FAT / SNF:</span>
                  <span className="font-mono text-slate-200">
                    {summary?.buffalo?.weightedAvgFat || 0}% / {summary?.buffalo?.weightedAvgSnf || 0}%
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Avg Rate:</span>
                  <span className="font-mono text-slate-200">
                    ₹{summary?.buffalo?.weightedAvgRate || 0}/L
                  </span>
                </div>
              </div>
            </div>

            {/* Combined Totals Card */}
            <div className="p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/20 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-cyan-300 uppercase">✨ Combined Total</span>
                <span className="text-xs text-cyan-400 font-mono font-semibold">
                  {summary?.combined?.entryCount || 0} Total Records
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-slate-400 block">Total Liters:</span>
                  <span className="font-extrabold text-slate-100 font-mono text-base">
                    {summary?.combined?.totalLiters || 0} L
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Total Amount:</span>
                  <span className="font-extrabold text-cyan-300 font-mono text-base">
                    ₹{summary?.combined?.totalAmount || 0}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Weighted Avg FAT / SNF:</span>
                  <span className="font-mono font-semibold text-slate-200">
                    {summary?.combined?.weightedAvgFat || 0}% / {summary?.combined?.weightedAvgSnf || 0}%
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Weighted Avg Rate:</span>
                  <span className="font-mono font-semibold text-slate-200">
                    ₹{summary?.combined?.weightedAvgRate || 0}/L
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. BOTTOM DATA GRID: TODAY'S COLLECTION RECORDS */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center space-x-2">
            <Scale className="w-5 h-5 text-cyan-400" />
            <h3 className="text-base font-bold text-slate-200">
              Today Collection Entries ({selectedSession.toUpperCase()} • {selectedDate})
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-mono font-semibold">
            {entries.length} Total Rows
          </span>
        </div>

        {loadingGrid ? (
          <div className="p-12 text-center flex flex-col items-center justify-center text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-cyan-400 mb-2" />
            <p className="text-sm">Loading collection records...</p>
          </div>
        ) : entries.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Milk className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-base font-semibold text-slate-300">No Collection Records Found</p>
            <p className="text-xs text-slate-500 mt-1">
              Start entering farmer milk data using the form above.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-950/80 text-slate-400 uppercase text-[11px] font-semibold tracking-wider border-b border-slate-800">
                  <th className="py-3.5 px-4">Code</th>
                  <th className="py-3.5 px-4">Farmer Name</th>
                  <th className="py-3.5 px-4">Milk Type</th>
                  <th className="py-3.5 px-4 text-right">Liters</th>
                  <th className="py-3.5 px-4 text-right">FAT %</th>
                  <th className="py-3.5 px-4 text-right">SNF %</th>
                  <th className="py-3.5 px-4 text-right">CLR</th>
                  <th className="py-3.5 px-4 text-right">Rate (₹)</th>
                  <th className="py-3.5 px-4 text-right">Amount (₹)</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs font-mono">
                {(['cow', 'buffalo'] as const).map(type => {
                  const typeEntries = entries.filter(e => e.milkType === type);
                  if (typeEntries.length === 0) return null;
                  
                  return (
                    <React.Fragment key={type}>
                      <tr className={type === 'cow' ? 'bg-amber-500/5' : 'bg-purple-500/5'}>
                        <td colSpan={10} className={`py-2.5 px-4 font-bold uppercase tracking-wider text-[11px] border-b border-slate-800/50 ${type === 'cow' ? 'text-amber-400' : 'text-purple-400'}`}>
                          {type === 'cow' ? '🐮 Cow Milk Entries' : '🦬 Buffalo Milk Entries'} ({typeEntries.length})
                        </td>
                      </tr>
                      {typeEntries.map((entry) => (
                        <tr key={entry._id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-cyan-400">
                      {entry.farmerCode}
                    </td>
                    <td className="py-3.5 px-4 font-sans font-semibold text-slate-200 text-sm">
                      {entry.farmerName}
                    </td>
                    <td className="py-3.5 px-4 font-sans">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold uppercase ${
                        entry.milkType === 'cow'
                          ? 'bg-amber-500/10 text-amber-300 border border-amber-500/30'
                          : 'bg-purple-500/10 text-purple-300 border border-purple-500/30'
                      }`}>
                        {entry.milkType}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-slate-100">
                      {entry.weight} L
                    </td>
                    <td className="py-3.5 px-4 text-right text-slate-300">
                      {entry.fat}%
                    </td>
                    <td className="py-3.5 px-4 text-right text-slate-300">
                      {entry.snf}%
                    </td>
                    <td className="py-3.5 px-4 text-right text-slate-400">
                      {entry.degree || '—'}
                    </td>
                    <td className="py-3.5 px-4 text-right text-emerald-300 font-bold">
                      ₹{entry.rate.toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 text-right text-cyan-300 font-extrabold text-sm">
                      ₹{entry.amount.toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-sans">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          onClick={() => handleEditRow(entry)}
                          className="p-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-cyan-300 rounded transition-colors border border-slate-700"
                          title="Edit Entry"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteRow(entry._id, entry.farmerName)}
                          className="p-1 bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-300 rounded transition-colors border border-slate-700 hover:border-rose-800"
                          title="Delete Entry"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deletingEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl relative animate-in fade-in zoom-in duration-150 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-100 mb-2">Delete Entry</h3>
            <p className="text-sm text-slate-400 mb-6">
              Are you sure you want to delete the collection entry for <span className="font-semibold text-slate-200">"{deletingEntry.name}"</span>? This action cannot be undone.
            </p>
            <div className="flex items-center justify-center space-x-3">
              <button
                onClick={() => setDeletingEntry(null)}
                className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 text-sm font-medium hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-sm font-medium transition-colors shadow-lg shadow-rose-500/20"
              >
                Delete Entry
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
