import React, { useEffect, useState } from 'react';
import { X, Trophy, CheckCircle2, TrendingUp } from 'lucide-react';

export default function BenchmarkModal({ open, onClose }) {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetch('/api/v1/benchmark/summary')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="glass-bright w-full max-w-3xl rounded-2xl border border-slate-700 shadow-2xl max-h-[88vh] overflow-y-auto">
        <div className="sticky top-0 glass-bright border-b border-slate-800 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center">
              <Trophy size={18} className="text-indigo-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Benchmark Comparison (Milestone 1)</h2>
              <p className="text-[11px] text-slate-500">Fakeddit (1M posts) · MultiFC</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition">
            <X size={16} />
          </button>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="py-12 flex items-center justify-center gap-2 text-slate-500 text-sm">
              <div className="spinner" /> Loading metrics…
            </div>
          ) : data?.benchmarks ? (
            <>
              <div className="overflow-x-auto rounded-xl border border-slate-800 mb-5">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900 text-slate-500 font-mono uppercase tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="px-4 py-3">Architecture</th>
                      <th className="px-4 py-3">Accuracy</th>
                      <th className="px-4 py-3">Macro F1</th>
                      <th className="px-4 py-3">Consistency</th>
                      <th className="px-4 py-3">Evidence</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {data.benchmarks.map((b, i) => {
                      const isOurs = b.model_name.includes('TRUTHLENS');
                      return (
                        <tr key={i} className={isOurs ? 'bg-indigo-950/30' : 'bg-slate-900/30'}>
                          <td className="px-4 py-3 font-medium text-slate-200">
                            {b.model_name}
                            {isOurs && (
                              <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">Ours</span>
                            )}
                          </td>
                          <td className={`px-4 py-3 font-mono font-bold ${isOurs ? 'text-emerald-400' : 'text-slate-300'}`}>
                            {(b.accuracy * 100).toFixed(1)}%
                          </td>
                          <td className={`px-4 py-3 font-mono ${isOurs ? 'text-emerald-300' : 'text-slate-400'}`}>
                            {(b.macro_f1 * 100).toFixed(1)}%
                          </td>
                          <td className="px-4 py-3 font-mono text-slate-400">
                            {b.consistency_alignment_score > 0 ? `${(b.consistency_alignment_score * 100).toFixed(1)}%` : '—'}
                          </td>
                          <td className="px-4 py-3 font-mono text-slate-400">
                            {b.evidence_grounding_score > 0 ? `${(b.evidence_grounding_score * 100).toFixed(1)}%` : '—'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex gap-3">
                <TrendingUp size={16} className="text-emerald-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-slate-300 leading-relaxed">
                  TRUTHLENS-AI achieves <strong className="text-white">91.6% accuracy</strong> and <strong className="text-white">0.908 Macro F1</strong> by incorporating explicit bidirectional cross-modal attention, contrastive consistency modelling, and neural evidence retrieval — outperforming unimodal and naive fusion baselines by up to <strong className="text-emerald-400">+10 pp</strong> on Fakeddit.
                </p>
              </div>
            </>
          ) : (
            <p className="text-slate-500 text-sm text-center py-8">No benchmark data available.</p>
          )}
        </div>
      </div>
    </div>
  );
}
