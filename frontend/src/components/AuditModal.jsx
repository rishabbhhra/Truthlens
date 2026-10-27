import React, { useState } from 'react';
import { X, ShieldCheck, RefreshCw, CheckCircle2, AlertTriangle, Database } from 'lucide-react';

export default function AuditModal({ open, onClose }) {
  const [report, setReport]   = useState(null);
  const [loading, setLoading] = useState(false);

  const run = () => {
    setLoading(true);
    fetch('/api/v1/audit/leakage', { method: 'POST' })
      .then(r => r.json())
      .then(d => { setReport(d); setLoading(false); })
      .catch(() => setLoading(false));
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="glass-bright w-full max-w-xl rounded-2xl border border-slate-700 shadow-2xl max-h-[88vh] overflow-y-auto">
        <div className="sticky top-0 glass-bright border-b border-slate-800 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center">
              <Database size={18} className="text-emerald-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Data Leakage Audit (§5.2)</h2>
              <p className="text-[11px] text-slate-500">Perceptual dHash · Temporal Partition Verification</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition">
            <X size={16} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-xs text-slate-400 leading-relaxed">
            Rigorous deduplication via perceptual image hashing (dHash, Hamming distance &lt; 4), cross-split contamination checks, and temporal event partition integrity are verified to guarantee zero data leakage between training, validation, and test splits.
          </p>

          {!report ? (
            <div className="text-center py-8">
              <button
                onClick={run}
                disabled={loading}
                className="inline-flex items-center gap-2 h-9 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-lg shadow-emerald-600/20 transition disabled:opacity-50"
              >
                {loading ? <><div className="spinner" /><span>Computing Hashes…</span></>
                         : <><ShieldCheck size={14} /><span>Run Contamination Audit</span></>}
              </button>
            </div>
          ) : (
            <>
              {/* Certification banner */}
              <div className={`flex items-center justify-between p-4 rounded-xl border ${
                report.zero_contamination_certified
                  ? 'bg-emerald-950/30 border-emerald-500/40'
                  : 'bg-red-950/30 border-red-500/40'
              }`}>
                <div className="flex items-center gap-3">
                  {report.zero_contamination_certified
                    ? <CheckCircle2 size={22} className="text-emerald-400" />
                    : <AlertTriangle size={22} className="text-red-400" />}
                  <div>
                    <p className="text-sm font-bold text-white">
                      {report.zero_contamination_certified ? 'Zero Contamination Certified' : 'Contamination Detected'}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Leakage rate: {(report.contamination_rate * 100).toFixed(1)}% · Temporal violations: {report.temporal_violations_found}
                    </p>
                  </div>
                </div>
                <button
                  onClick={run}
                  disabled={loading}
                  className="flex items-center gap-1.5 h-7 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 border border-slate-700 transition disabled:opacity-50"
                >
                  <RefreshCw size={11} className={loading ? 'animate-spin' : ''} />
                  Re-run
                </button>
              </div>

              {/* Stats grid */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  ['Train', report.total_train_samples],
                  ['Validation', report.total_val_samples],
                  ['Test', report.total_test_samples],
                ].map(([label, count]) => (
                  <div key={label} className="text-center p-3 bg-slate-900 rounded-xl border border-slate-800">
                    <p className="text-[10px] text-slate-500 font-mono uppercase">{label}</p>
                    <p className="text-xl font-black font-mono text-white">{count}</p>
                  </div>
                ))}
              </div>

              {/* Audit log */}
              <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 font-mono text-[11px] text-emerald-400 max-h-36 overflow-y-auto space-y-1">
                {report.audit_log?.map((line, i) => <div key={i}>{line}</div>)}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
