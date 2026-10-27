import React from 'react';
import { GitCompare } from 'lucide-react';

export default function ConsistencyPanel({ result }) {
  if (!result) return null;
  const score = result.consistency_score ?? 0;
  const cosine = result.cosine_similarity ?? 0;
  const pct = Math.round(score * 100);

  let status, barColor, statusColor;
  if (score >= 0.70) {
    status = 'Consistent Alignment'; barColor = 'bg-emerald-500'; statusColor = 'text-emerald-400';
  } else if (score >= 0.45) {
    status = 'Moderate Coupling'; barColor = 'bg-amber-500'; statusColor = 'text-amber-400';
  } else {
    status = 'Out-of-Context Mismatch'; barColor = 'bg-red-500'; statusColor = 'text-red-400';
  }

  return (
    <div className="glass rounded-2xl p-5 border border-slate-800 shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <GitCompare size={15} className="text-cyan-400" />
          <h3 className="text-sm font-bold text-slate-200">Cross-Modal Consistency</h3>
        </div>
        <span className="text-[10px] font-mono text-slate-600">Contrastive L_cons</span>
      </div>

      {/* Score + status */}
      <div className="flex items-center gap-4 mb-4">
        <div className="relative w-16 h-16 flex-shrink-0">
          <svg className="w-16 h-16 -rotate-90" viewBox="0 0 40 40">
            <circle cx="20" cy="20" r="16" stroke="rgba(100,116,139,0.25)" strokeWidth="4" fill="none" />
            <circle
              cx="20" cy="20" r="16"
              stroke={score >= 0.70 ? '#10b981' : score >= 0.45 ? '#f59e0b' : '#ef4444'}
              strokeWidth="4" fill="none"
              strokeDasharray={`${(score * 100.53).toFixed(1)} 100.53`}
              strokeLinecap="round"
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-sm font-black font-mono text-white">
            {pct}%
          </span>
        </div>
        <div className="flex-1">
          <p className={`text-sm font-bold ${statusColor}`}>{status}</p>
          <p className="text-xs text-slate-500 mt-0.5">
            Cosine Similarity: <span className="font-mono text-slate-300">{cosine.toFixed(4)}</span>
          </p>
          <div className="mt-2 h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div className={`h-full rounded-full bar-fill ${barColor}`} style={{ width: `${pct}%` }} />
          </div>
        </div>
      </div>

      <p className="text-[11px] text-slate-500 leading-relaxed">
        Bidirectional attention (A<sub>T→I</sub>, A<sub>I→T</sub>) determines whether visual entities and text claims mutually ground each other. Low scores indicate out-of-context or fabricated image-text pairings.
      </p>
    </div>
  );
}
