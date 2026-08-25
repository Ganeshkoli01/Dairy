import React, { useState, useEffect, useMemo, useRef } from 'react';
import { rateChartApi } from '../api/rateChartApi';
import { branchApi } from '../api/branchApi';
import { useAuth } from '../context/AuthContext';
import { MilkType } from '../types/farmer';
import { Branch } from '../types/branch';
import { RateChartEntry, RateLookupResponse } from '../types/rateChart';
import {
  formatNumeral,
  toEnglishNumerals,
  NumeralLang,
} from '../utils/numeralConverter';
import {
  Grid,
  Save,
  Download,
  Upload,
  Calendar,
  Filter,
  Calculator,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Trash2,
  Loader2,
  Hash,
  Sparkles,
  Globe,
} from 'lucide-react';

const parseNum = (val: any): number | null => {
  if (val === null || val === undefined) return null;
  const s = toEnglishNumerals(val).trim();
  const n = parseFloat(s);
  return isNaN(n) ? null : n;
};

export const RateChartPage: React.FC = () => {
  const { user } = useAuth();
  const [milkType, setMilkType] = useState<MilkType>('buffalo');
  const [numeralLang, setNumeralLang] = useState<NumeralLang>('en');
  const [selectedBranch, setSelectedBranch] = useState<string>('');
  const [effectiveFrom, setEffectiveFrom] = useState<string>(
    new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0]
  );
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Matrix Grid state map: key `${fat}_${snf}` -> rate string
  const [matrixMap, setMatrixMap] = useState<Record<string, string>>({});

  // File Upload Ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Calculator Test Card State
  const [testFat, setTestFat] = useState<string>('6.0');
  const [testSnf, setTestSnf] = useState<string>('9.0');
  const [testResult, setTestResult] = useState<RateLookupResponse | null>(null);
  const [testing, setTesting] = useState<boolean>(false);

  // Clear Matrix Confirmation State
  const [clearingMatrix, setClearingMatrix] = useState<boolean>(false);

  // FAT ranges & SNF ranges covering price.xlsx bounds (FAT 5.0 to 10.0 for Buffalo, SNF 8.0 to 10.0)
  const fatRanges = useMemo(() => {
    const list: number[] = [];
    const min = milkType === 'cow' ? 3.0 : 5.0;
    const max = milkType === 'cow' ? 5.0 : 10.0;
    for (let f = min; f <= max + 0.05; f += 0.1) {
      list.push(Math.round(f * 10) / 10);
    }
    return list;
  }, [milkType]);

  const snfRanges = useMemo(() => {
    const list: number[] = [];
    const min = milkType === 'cow' ? 7.5 : 8.0;
    const max = milkType === 'cow' ? 9.5 : 10.0;
    for (let s = min; s <= max + 0.05; s += 0.1) {
      list.push(Math.round(s * 10) / 10);
    }
    return list;
  }, [milkType]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [branchesData, rateEntries] = await Promise.all([
        branchApi.getBranches(),
        rateChartApi.getRateCharts(milkType, selectedBranch || 'null'),
      ]);

      setBranches(branchesData);

      const newMap: Record<string, string> = {};
      rateEntries.forEach((entry) => {
        const key = `${entry.fat.toFixed(1)}_${entry.snf.toFixed(1)}`;
        newMap[key] = entry.rate.toString();
      });
      setMatrixMap(newMap);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load rate chart matrix');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [milkType, selectedBranch]);

  const handleCellChange = (fat: number, snf: number, value: string) => {
    const key = `${fat.toFixed(1)}_${snf.toFixed(1)}`;
    const engVal = toEnglishNumerals(value);
    setMatrixMap((prev) => ({
      ...prev,
      [key]: engVal,
    }));
  };

  const handleAutoFillBlanks = () => {
    const newMap = { ...matrixMap };
    let filledCount = 0;

    const knownKeys = Object.keys(newMap).filter((k) => parseFloat(newMap[k]) > 0);

    if (knownKeys.length === 0) {
      setError('Please fill at least one rate as a baseline before auto-calculating remaining blanks.');
      return;
    }

    fatRanges.forEach((f) => {
      snfRanges.forEach((s) => {
        const key = `${f.toFixed(1)}_${s.toFixed(1)}`;
        if (!newMap[key] || parseFloat(newMap[key]) <= 0) {
          if (milkType === 'buffalo') {
            const refFat = Math.max(5.5, Math.min(10.0, f));
            const refSnf = Math.max(8.7, Math.min(10.0, s));
            const refKey = `${refFat.toFixed(1)}_${refSnf.toFixed(1)}`;
            const baseRate = parseFloat(newMap[refKey]) || 51.10;

            const fatDelta = Math.round((f - refFat) * 10) * 0.30;
            const snfDelta = Math.round((s - refSnf) * 10) * 0.30;

            const rate = Math.round((baseRate + fatDelta + snfDelta) * 100) / 100;
            newMap[key] = rate.toString();
            filledCount++;
          } else {
            const fatDiff = Math.round((f - 3.5) * 10);
            const snfDiff = Math.round((s - 8.5) * 10);
            const rate = Math.round((35.00 + fatDiff * 0.50 + snfDiff * 0.30) * 100) / 100;
            newMap[key] = Math.max(20.0, rate).toString();
            filledCount++;
          }
        }
      });
    });

    setMatrixMap(newMap);
    setSuccessMsg(`Auto-calculated and filled ${filledCount} remaining blank spaces! Click "Save Matrix" to persist.`);
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  const handleSaveMatrix = async () => {
    setSaving(true);
    setError(null);
    setSuccessMsg(null);

    const entriesToSave: RateChartEntry[] = [];

    Object.entries(matrixMap).forEach(([key, valStr]) => {
      const rateVal = parseFloat(toEnglishNumerals(valStr));
      if (!isNaN(rateVal) && rateVal > 0) {
        const [fatStr, snfStr] = key.split('_');
        entriesToSave.push({
          milkType,
          fat: parseFloat(fatStr),
          snf: parseFloat(snfStr),
          rate: rateVal,
          branch: selectedBranch || null,
          effectiveFrom,
        });
      }
    });

    if (entriesToSave.length === 0) {
      setError('No valid rates entered to save.');
      setSaving(false);
      return;
    }

    try {
      await rateChartApi.saveRateCharts(entriesToSave);
      setSuccessMsg(`Successfully saved ${entriesToSave.length} ${milkType.toUpperCase()} rate entries!`);
      setTimeout(() => setSuccessMsg(null), 4000);
      loadData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save rate chart matrix');
    } finally {
      setSaving(false);
    }
  };

  const handleClearMatrix = () => {
    setClearingMatrix(true);
  };

  const confirmClearMatrix = async () => {
    try {
      await rateChartApi.clearMatrix(milkType, selectedBranch || 'null');
      setMatrixMap({});
      setSuccessMsg(`Cleared ${milkType.toUpperCase()} rate chart matrix`);
      setTimeout(() => setSuccessMsg(null), 3000);
      setClearingMatrix(false);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to clear rate chart');
    }
  };

  const handleTestLookup = async () => {
    setTesting(true);
    setTestResult(null);
    const fatVal = parseFloat(toEnglishNumerals(testFat)) || 0;
    const snfVal = parseFloat(toEnglishNumerals(testSnf)) || 0;

    try {
      const res = await rateChartApi.lookupRate({
        milkType,
        fat: fatVal,
        snf: snfVal,
        branchId: selectedBranch || null,
        date: effectiveFrom,
      });
      setTestResult(res);
    } catch (err: any) {
      setTestResult({
        success: false,
        milkType,
        fat: fatVal,
        snf: snfVal,
        result: {
          success: false,
          rate: null,
          message: err.response?.data?.message || 'Lookup failed',
        },
      });
    } finally {
      setTesting(false);
    }
  };

  const handleExportCSV = () => {
    const rows = [['FAT/SNF', ...snfRanges.map((s) => formatNumeral(s.toFixed(1), numeralLang))]];
    fatRanges.forEach((f) => {
      const row = [formatNumeral(f.toFixed(1), numeralLang)];
      snfRanges.forEach((s) => {
        const key = `${f.toFixed(1)}_${s.toFixed(1)}`;
        row.push(matrixMap[key] ? formatNumeral(matrixMap[key], numeralLang) : '');
      });
      rows.push(row);
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `rate_chart_${milkType}_${effectiveFrom}_${numeralLang}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const text = evt.target?.result as string;
        const lines = text.split(/[\r\n]+/).map((l) => l.trim()).filter((l) => l.length > 0);
        if (lines.length === 0) return;

        const headerCols = lines[0].split(',').map((c) => parseNum(c));
        const newMap = { ...matrixMap };
        let count = 0;

        for (let r = 1; r < lines.length; r++) {
          const rowCols = lines[r].split(',');
          const fatVal = parseNum(rowCols[0]);
          if (fatVal === null) continue;

          for (let c = 1; c < rowCols.length; c++) {
            const snfVal = headerCols[c];
            const rateVal = parseNum(rowCols[c]);
            if (snfVal !== null && rateVal !== null && rateVal > 0) {
              const key = `${fatVal.toFixed(1)}_${snfVal.toFixed(1)}`;
              newMap[key] = rateVal.toString();
              count++;
            }
          }
        }

        setMatrixMap(newMap);
        setSuccessMsg(`Imported ${count} rate entries from file! Click "Save Matrix" to persist.`);
        setTimeout(() => setSuccessMsg(null), 4000);
      } catch (err) {
        setError('Failed to parse uploaded file format.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      {/* 1. TOP HEADER & BAR CONTROLS */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-amber-500/10 rounded-xl text-amber-400 border border-amber-500/20">
            <Grid className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-100">
              {numeralLang === 'mr' ? 'दर पत्रक मॅट्रिक्स' : 'Rate Chart Matrix'}
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              {numeralLang === 'mr'
                ? 'FAT × SNF दर पत्रक तक्ता (दर प्रति लिटर)'
                : 'FAT × SNF rate table per liter populated from price.xlsx'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* MARATHI / ENGLISH NUMERAL TOGGLE BUTTON */}
          <button
            type="button"
            onClick={() => setNumeralLang(numeralLang === 'en' ? 'mr' : 'en')}
            className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-bold px-3.5 py-2 rounded-xl border border-amber-500/30 transition-all shadow"
            title="Toggle between English (123) and Marathi (१२३) numbers"
          >
            <Globe className="w-4 h-4 text-amber-400" />
            <span>{numeralLang === 'en' ? 'Numbers: English (123)' : 'संख्या: मराठी (१२३)'}</span>
          </button>

          {/* Hidden File Input for CSV/Excel Import */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".csv,.txt"
            className="hidden"
          />



          <button
            onClick={handleSaveMatrix}
            disabled={saving}
            className="flex items-center space-x-2 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-slate-950 font-bold text-xs px-5 py-2 rounded-xl shadow-lg shadow-amber-500/20 transition-all disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>{numeralLang === 'mr' ? 'दर सेव्ह करा' : 'Save Matrix'}</span>
          </button>
        </div>
      </div>

      {/* 2. FILTER & CONFIGURATION CONTROL BAR */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md">
        {/* Milk Type Selector */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
            {numeralLang === 'mr' ? 'दूध प्रकार निवडा' : 'Select Milk Type'}
          </label>
          <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => setMilkType('cow')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                milkType === 'cow'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              🐮 Cow (गाय)
            </button>
            <button
              type="button"
              onClick={() => setMilkType('buffalo')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                milkType === 'buffalo'
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              🦬 Buffalo (म्हैस)
            </button>
          </div>
        </div>

        {/* Branch Filter */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
            {numeralLang === 'mr' ? 'शाखा निवडा' : 'Applicable Branch'}
          </label>
          <div className="flex items-center space-x-2 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5">
            <Filter className="w-4 h-4 text-slate-500" />
            {user?.role === 'dairyOwner' ? (
              <div className="text-slate-200 text-xs font-semibold w-full">
                {branches.length > 0 ? `${branches[0].name} (${branches[0].code})` : 'Loading...'}
              </div>
            ) : (
              <select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className="bg-transparent border-none text-slate-200 text-xs font-semibold focus:outline-none w-full"
              >
                <option value="" className="bg-slate-900 text-slate-200">
                  Global (All Branches)
                </option>
                {branches.map((b) => (
                  <option key={b._id} value={b._id} className="bg-slate-900 text-slate-200">
                    {b.name} ({b.code})
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Effective From Date */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
            {numeralLang === 'mr' ? 'लागू दिनांक' : 'Effective From Date'}
          </label>
          <div className="flex items-center space-x-2 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5">
            <Calendar className="w-4 h-4 text-slate-500" />
            <input
              type="date"
              value={effectiveFrom}
              onChange={(e) => setEffectiveFrom(e.target.value)}
              className="bg-transparent border-none text-slate-200 text-xs font-semibold focus:outline-none w-full"
            />
          </div>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm flex items-center space-x-3 shadow">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          <span className="font-semibold">{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-center space-x-3 shadow">
          <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />
          <span className="font-semibold">{error}</span>
        </div>
      )}

      {/* 3. MATRIX GRID CONTENT TABLE */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center space-x-2">
            <Hash className="w-5 h-5 text-amber-400" />
            <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wide">
              {milkType.toUpperCase()} {numeralLang === 'mr' ? 'दर तक्ता (फॅट आडवे vs एसएनएफ उभे)' : 'RATE MATRIX (FAT ROWS vs SNF COLS)'}
            </h2>
          </div>
          <button
            onClick={handleClearMatrix}
            className="flex items-center space-x-1 text-xs text-rose-400 hover:text-rose-300 font-medium bg-rose-500/10 hover:bg-rose-500/20 px-3 py-1 rounded-lg border border-rose-500/30 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{numeralLang === 'mr' ? 'तक्ता रिकामा करा' : 'Clear Grid'}</span>
          </button>
        </div>

        {loading ? (
          <div className="p-16 text-center flex flex-col items-center justify-center text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-amber-400 mb-2" />
            <p className="text-sm font-medium">Loading rate chart matrix...</p>
          </div>
        ) : (
          <div className="w-full overflow-x-auto max-h-[600px] overflow-y-auto pb-4 custom-scrollbar">
            <table className="w-full text-center border-collapse font-mono text-xs">
              <thead className="sticky top-0 z-20 bg-slate-950 shadow-md whitespace-nowrap">
                <tr>
                  <th className="py-3 px-3 bg-slate-950 border-b border-r border-slate-800 text-amber-400 font-bold min-w-[75px]">
                    FAT \ SNF
                  </th>
                  {snfRanges.map((snf) => (
                    <th
                      key={snf}
                      className="py-3 px-2 bg-slate-950 border-b border-r border-slate-800 text-slate-300 font-bold min-w-[65px]"
                    >
                      {formatNumeral(snf.toFixed(1), numeralLang)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {fatRanges.map((fat) => (
                  <tr key={fat} className="hover:bg-slate-800/30">
                    <td className="py-2 px-3 sticky left-0 z-10 bg-slate-950 font-bold text-amber-400 border-r border-slate-800">
                      {formatNumeral(fat.toFixed(1), numeralLang)}
                    </td>
                    {snfRanges.map((snf) => {
                      const key = `${fat.toFixed(1)}_${snf.toFixed(1)}`;
                      const rawVal = matrixMap[key] || '';
                      const displayVal = rawVal ? formatNumeral(rawVal, numeralLang) : '';

                      return (
                        <td key={snf} className="p-1 border-r border-b border-slate-800/40">
                          <input
                            type="text"
                            value={displayVal}
                            onChange={(e) => handleCellChange(fat, snf, e.target.value)}
                            placeholder="—"
                            className={`w-full text-center bg-transparent text-xs py-1 px-1 rounded font-bold font-mono focus:bg-slate-800 focus:outline-none transition-colors ${
                              displayVal ? 'text-emerald-400' : 'text-slate-600'
                            }`}
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 4. RATE LOOKUP CALCULATOR TEST CARD */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center space-x-2 mb-4 pb-3 border-b border-slate-800">
          <Calculator className="w-5 h-5 text-cyan-400" />
          <h2 className="text-base font-bold text-slate-100">
            {numeralLang === 'mr' ? 'दर मोजणी कॅल्क्युलेटर (राउंड डाऊन नियम)' : 'Test Rate Lookup Algorithm (Round Down Rule)'}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
              FAT (%)
            </label>
            <input
              type="text"
              value={formatNumeral(testFat, numeralLang)}
              onChange={(e) => setTestFat(toEnglishNumerals(e.target.value))}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-100 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
              SNF (%)
            </label>
            <input
              type="text"
              value={formatNumeral(testSnf, numeralLang)}
              onChange={(e) => setTestSnf(toEnglishNumerals(e.target.value))}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-100 focus:outline-none"
            />
          </div>

          <div>
            <button
              onClick={handleTestLookup}
              disabled={testing}
              className="w-full bg-slate-800 hover:bg-slate-700 text-cyan-300 font-bold text-xs py-2.5 px-4 rounded-xl border border-slate-700 transition-colors flex items-center justify-center space-x-2"
            >
              {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4 text-cyan-400" />}
              <span>{numeralLang === 'mr' ? 'दर शोधा (Lookup Rate)' : 'Lookup Calculated Rate'}</span>
            </button>
          </div>

          <div>
            {testResult && (
              <div
                className={`p-2.5 rounded-xl border text-xs font-mono font-bold text-center ${
                  testResult.success && testResult.result?.rate !== null && testResult.result?.rate !== undefined
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                }`}
              >
                {testResult.success && testResult.result?.rate !== null && testResult.result?.rate !== undefined
                  ? `Matched Rate: ₹${formatNumeral(testResult.result.rate.toFixed(2), numeralLang)} / L`
                  : 'No Rate Match'}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Clear Matrix Confirmation Modal */}
      {clearingMatrix && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl relative animate-in fade-in zoom-in duration-150 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-100 mb-2">Clear Rate Chart</h3>
            <p className="text-sm text-slate-400 mb-6">
              Are you sure you want to clear all <span className="font-semibold text-slate-200">{milkType.toUpperCase()}</span> rate chart entries? This action cannot be undone.
            </p>
            <div className="flex items-center justify-center space-x-3">
              <button
                onClick={() => setClearingMatrix(false)}
                className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 text-sm font-medium hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmClearMatrix}
                className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-sm font-medium transition-colors shadow-lg shadow-rose-500/20"
              >
                Clear Entries
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
