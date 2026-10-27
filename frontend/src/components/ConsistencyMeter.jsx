import React from 'react';
import { GitCompare, Check, AlertCircle, RefreshCw } from 'lucide-react';

export default function ConsistencyMeter({ consistencyScore, cosineSim, verdictText }) {
  const scorePct = Math.round((consistencyScore || 0) * 100);
  const isHigh = consistencyScore >= 0.70;
  const isModerate = consistencyScore >= 0.45 && consistencyScore < 0.70;
  const isMismatch = consistencyScore < 0.45;

  let gaugeColor = 'from-rose-500 to-amber-500';
  let badgeColor = 'bg-rose-500/10 text-rose-400 border-rose-500/30';
  let statusText = 'Out-of-Context Mismatch';

  if (isHigh) {
    gaugeColor = 'from-emerald-500 to-teal-400';
    badgeColor = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
    statusText = 'Consistent Multimodal Alignment';
  } else if (isModerate) {
    gaugeColor = 'from-amber-500 to-yellow-400';
    badgeColor = 'bg-amber-500/10 text-amber-400 border-amber-500/30';
    statusText = 'Moderate Cross-Modal Coupling';
  }

  return (
    <div className="glass-panel rounded-2xl p-5 border border-slate-800 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <GitCompare className="h-4 w-4 text-indigo-400" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            Cross-Modal Consistency Head
          </h3>
        </div>
        <span className="text-[10px] font-mono text-slate-400">
          Contrastive Cosine Loss L_cons
        </span>
      </div>

      <div className="flex items-center space-x-4">
        {/* Progress Gauge */}
        <div className="relative h-16 w-16 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center flex-shrink-0">
          <span className="font-mono text-base font-bold text-white">
            {scorePct}%
          </span>
          <div
            className="absolute inset-0 rounded-full border-2 border-indigo-500/20"
            style={{
              clipPath: `polygon(0 0, 100% 0, 100% ${scorePct}%, 0 ${scorePct}%)`
            }}
          />
        </div>

        <div className="flex-1">
          <div className="flex items-center justify-between mb-1.5">
            <span className={`px-2 py-0.5 rounded text-[11px] font-medium border ${badgeColor}`}>
              {statusText}
            </span>
            <span className="text-[11px] font-mono text-slate-400">
              Cosine Sim: <strong className="text-slate-200">{cosineSim ? cosineSim.toFixed(3) : '0.000'}</strong>
            </span>
          </div>

          {/* Gradient Score Track */}
          <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden mb-2">
            <div
              className={`h-full rounded-full bg-gradient-to-r ${gaugeColor} transition-all duration-700`}
              style={{ width: `${scorePct}%` }}
            />
          </div>

          <p className="text-[11px] text-slate-400 leading-tight">
            Bidirectional attention (A_{'{T→I}'}, A_{'{I→T}'}) resolves whether image entities and captions mutually ground each other or depict out-of-context fabrication.
          </p>
        </div>
      </div>
    </div>
  );
}
