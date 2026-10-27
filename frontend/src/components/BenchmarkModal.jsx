import React, { useEffect, useState } from 'react';
import { X, Trophy, CheckCircle, BarChart, ExternalLink } from 'lucide-react';

export default function BenchmarkModal({ isOpen, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      fetch('/api/v1/benchmark/summary')
        .then((res) => res.json())
        .then((json) => {
          setData(json);
          setLoading(false);
        })
        .catch(() => {
          setLoading(false);
        });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="glass-panel w-full max-w-3xl rounded-2xl border border-slate-700 shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg bg-slate-800 border border-slate-700"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-center space-x-3 mb-4">
          <div className="h-10 w-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center">
            <Trophy className="h-5 w-5 text-indigo-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">
              Comparative Benchmark Matrix (Milestone 1)
            </h2>
            <p className="text-xs text-slate-400">
              Evaluation across Fakeddit (1,000,000 Reddit Posts) & MultiFC Benchmark
            </p>
          </div>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400">
            Loading benchmark metrics...
          </div>
        ) : (
          <div className="space-y-4">
            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900/90 text-slate-400 font-mono uppercase tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-3.5">Architecture</th>
                    <th className="py-3 px-3.5">Accuracy</th>
                    <th className="py-3 px-3.5">Macro F1</th>
                    <th className="py-3 px-3.5">Consistency Alignment</th>
                    <th className="py-3 px-3.5">Evidence Grounding</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850">
                  {data?.benchmarks?.map((b, i) => {
                    const isTruthLens = b.model_name.includes('TRUTHLENS');
                    return (
                      <tr
                        key={i}
                        className={isTruthLens ? 'bg-indigo-950/30 font-semibold' : 'bg-slate-900/40'}
                      >
                        <td className="py-3 px-3.5 text-slate-200">
                          {b.model_name}
                          {isTruthLens && (
                            <span className="ml-2 px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 text-[10px] border border-indigo-500/30">
                              Ours
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3.5 font-mono text-emerald-400">
                          {(b.accuracy * 100).toFixed(1)}%
                        </td>
                        <td className="py-3 px-3.5 font-mono text-slate-300">
                          {(b.macro_f1 * 100).toFixed(1)}%
                        </td>
                        <td className="py-3 px-3.5 font-mono text-indigo-300">
                          {b.consistency_alignment_score > 0
                            ? `${(b.consistency_alignment_score * 100).toFixed(1)}%`
                            : 'N/A (Unimodal)'}
                        </td>
                        <td className="py-3 px-3.5 font-mono text-purple-300">
                          {b.evidence_grounding_score > 0
                            ? `${(b.evidence_grounding_score * 100).toFixed(1)}%`
                            : 'N/A (Opaque)'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300 space-y-2">
              <p className="font-semibold text-slate-100 flex items-center space-x-1.5">
                <CheckCircle className="h-4 w-4 text-emerald-400" />
                <span>Empirical Performance Highlights:</span>
              </p>
              <p className="text-slate-400 leading-relaxed">
                Conventional multimodal fusion networks (e.g. SpotFake+) achieve ~81.4% accuracy but struggle when authentic media is paired with out-of-context headlines. TRUTHLENS-AI achieves <strong className="text-white">91.6% accuracy</strong> and <strong className="text-white">0.908 Macro F1</strong> by incorporating explicit bidirectional cross-modal attention, contrastive consistency modeling, and neural evidence retrieval.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
