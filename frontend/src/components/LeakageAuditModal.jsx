import React, { useState } from 'react';
import { X, ShieldCheck, Database, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function LeakageAuditModal({ isOpen, onClose }) {
  const [auditReport, setAuditReport] = useState(null);
  const [isRunning, setIsRunning] = useState(false);

  const handleRunAudit = () => {
    setIsRunning(true);
    fetch('/api/v1/audit/leakage', { method: 'POST' })
      .then((res) => res.json())
      .then((json) => {
        setAuditReport(json);
        setIsRunning(false);
      })
      .catch(() => {
        setIsRunning(false);
      });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="glass-panel w-full max-w-2xl rounded-2xl border border-slate-700 shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg bg-slate-800 border border-slate-700"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-center space-x-3 mb-4">
          <div className="h-10 w-10 rounded-xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center">
            <Database className="h-5 w-5 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">
              Data Leakage Mitigation Audit (Section 5.2)
            </h2>
            <p className="text-xs text-slate-400">
              Perceptual Image Hash (dHash) & Temporal Event Partition Verification
            </p>
          </div>
        </div>

        <p className="text-xs text-slate-300 mb-5 leading-relaxed">
          Rigorous deduplication, cross-split image hash verification (Hamming distance threshold &lt; 4), and temporal event split partitioning are audited prior to training to guarantee zero data contamination between training, validation, and evaluation splits.
        </p>

        {/* Action Button */}
        {!auditReport && (
          <div className="text-center py-8 bg-slate-900/60 rounded-xl border border-slate-800 mb-4">
            <button
              onClick={handleRunAudit}
              disabled={isRunning}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-lg shadow-emerald-600/20 transition flex items-center space-x-2 mx-auto disabled:opacity-50"
            >
              {isRunning ? (
                <>
                  <div className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Computing Perceptual Hashes...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="h-4 w-4" />
                  <span>Execute Data Contamination Audit</span>
                </>
              )}
            </button>
          </div>
        )}

        {auditReport && (
          <div className="space-y-4">
            {/* Certification Banner */}
            <div className={`p-4 rounded-xl border flex items-center justify-between ${
              auditReport.zero_contamination_certified
                ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
                : 'bg-rose-950/30 border-rose-500/40 text-rose-300'
            }`}>
              <div className="flex items-center space-x-3">
                <CheckCircle2 className="h-6 w-6 text-emerald-400 flex-shrink-0" />
                <div>
                  <h4 className="font-bold text-sm text-white">
                    {auditReport.zero_contamination_certified
                      ? 'Zero Data Contamination Certified'
                      : 'Data Contamination Warning'}
                  </h4>
                  <p className="text-xs text-slate-300">
                    Cross-split leakage: {auditReport.contamination_rate * 100}% • Temporal inversions: {auditReport.temporal_violations_found}
                  </p>
                </div>
              </div>

              <button
                onClick={handleRunAudit}
                disabled={isRunning}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 border border-slate-700 flex items-center space-x-1"
              >
                <RefreshCw className={`h-3 w-3 ${isRunning ? 'animate-spin' : ''}`} />
                <span>Re-Audit</span>
              </button>
            </div>

            {/* Split Metrics Stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-center">
                <span className="text-[10px] text-slate-400 block font-mono">TRAIN SPLIT</span>
                <span className="text-lg font-bold font-mono text-white">{auditReport.total_train_samples}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-center">
                <span className="text-[10px] text-slate-400 block font-mono">VAL SPLIT</span>
                <span className="text-lg font-bold font-mono text-white">{auditReport.total_val_samples}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-center">
                <span className="text-[10px] text-slate-400 block font-mono">TEST SPLIT</span>
                <span className="text-lg font-bold font-mono text-white">{auditReport.total_test_samples}</span>
              </div>
            </div>

            {/* Audit Log Box */}
            <div>
              <span className="text-xs font-semibold text-slate-400 block mb-2 font-mono">
                Verification Audit Logs
              </span>
              <div className="p-3.5 rounded-xl bg-slate-950 font-mono text-[11px] text-slate-300 border border-slate-800 max-h-40 overflow-y-auto space-y-1">
                {auditReport.audit_log?.map((log, i) => (
                  <div key={i} className="text-emerald-400">
                    {log}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
