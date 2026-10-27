import React from 'react';
import { Type, Sparkles } from 'lucide-react';

export default function TokenAttributionView({ tokenAttributions }) {
  if (!tokenAttributions || tokenAttributions.length === 0) {
    return null;
  }

  return (
    <div className="glass-panel rounded-2xl p-5 border border-slate-800 shadow-lg">
      <div className="flex items-center justify-between mb-3.5">
        <div className="flex items-center space-x-2">
          <Type className="h-4 w-4 text-indigo-400" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            Token-Level Cross-Modal Attribution
          </h3>
        </div>
        <span className="text-[10px] font-mono text-slate-400">
          DeBERTa / RoBERTa Attention Rollout
        </span>
      </div>

      <p className="text-xs text-slate-400 mb-3 leading-relaxed">
        Interactive token attribution derived from bidirectional cross-attention layers. Highlighted tokens indicate high influence on the final veracity classification:
      </p>

      {/* Token Badges Flow */}
      <div className="flex flex-wrap gap-1.5 p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
        {tokenAttributions.map((item, idx) => {
          const score = item.attribution_score;
          const isCritical = item.is_critical;

          let badgeStyle = 'bg-slate-800/80 text-slate-300 border-slate-700/60';
          if (score >= 0.70) {
            badgeStyle = 'bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-sm shadow-rose-500/10 font-bold';
          } else if (score >= 0.40) {
            badgeStyle = 'bg-amber-500/20 text-amber-300 border-amber-500/40';
          }

          return (
            <span
              key={idx}
              title={`Attribution Score: ${(score * 100).toFixed(1)}%`}
              className={`inline-flex items-center space-x-1 px-2 py-1 rounded-lg text-xs border font-mono transition-transform hover:scale-105 cursor-help ${badgeStyle}`}
            >
              <span>{item.token}</span>
              <span className="text-[9px] opacity-70">
                {(score * 100).toFixed(0)}%
              </span>
            </span>
          );
        })}
      </div>
    </div>
  );
}
