import React from 'react';
import { Type } from 'lucide-react';

function scoreToStyle(score) {
  if (score >= 0.70) return 'bg-red-500/20 text-red-300 border-red-500/40 font-bold';
  if (score >= 0.40) return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
  return 'bg-slate-800 text-slate-400 border-slate-700/60';
}

export default function TokensPanel({ tokens }) {
  if (!tokens?.length) return null;
  return (
    <div className="glass rounded-2xl p-5 border border-slate-800 shadow-xl">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Type size={15} className="text-indigo-400" />
          <h3 className="text-sm font-bold text-slate-200">Token Attribution</h3>
        </div>
        <span className="text-[10px] font-mono text-slate-600">Cross-Attention Rollout</span>
      </div>
      <p className="text-[11px] text-slate-500 mb-3">
        Tokens coloured by influence on the final veracity classification. Hover for exact attribution score.
      </p>
      <div className="flex flex-wrap gap-1.5 p-3 bg-slate-950/60 rounded-xl border border-slate-800">
        {tokens.map((t, i) => (
          <span
            key={i}
            title={`Attribution: ${(t.attribution_score * 100).toFixed(1)}%`}
            className={`token-pill border ${scoreToStyle(t.attribution_score)}`}
          >
            {t.token}
            <span className="text-[9px] opacity-60">{Math.round(t.attribution_score * 100)}%</span>
          </span>
        ))}
      </div>
      {/* Legend */}
      <div className="flex gap-4 mt-2.5 text-[11px] text-slate-600">
        <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-red-500/50 inline-block"/>&gt;70% — critical</div>
        <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-amber-500/50 inline-block"/>40–70% — moderate</div>
        <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-slate-700 inline-block"/>&lt;40% — low</div>
      </div>
    </div>
  );
}
