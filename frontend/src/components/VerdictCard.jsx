import React from 'react';
import { AlertTriangle, CheckCircle, AlertOctagon, HelpCircle, FileText } from 'lucide-react';

export default function VerdictCard({ report }) {
  if (!report) return null;

  const { verdict, confidence_score, calibrated_probabilities, forensic_summary_text } = report;

  // Determine theme styles based on verdict
  let statusBadge = {
    icon: AlertTriangle,
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    text: 'text-amber-400',
    glowClass: 'glow-misleading',
    title: 'Misleading / Out of Context'
  };

  if (verdict.includes('False')) {
    statusBadge = {
      icon: AlertOctagon,
      bg: 'bg-rose-500/10',
      border: 'border-rose-500/30',
      text: 'text-rose-400',
      glowClass: 'glow-false',
      title: 'False / Fabricated Misinformation'
    };
  } else if (verdict.includes('True')) {
    statusBadge = {
      icon: CheckCircle,
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/30',
      text: 'text-emerald-400',
      glowClass: 'glow-true',
      title: 'True / Authoritatively Verified'
    };
  } else if (verdict.includes('Unverifiable')) {
    statusBadge = {
      icon: HelpCircle,
      bg: 'bg-slate-500/10',
      border: 'border-slate-500/30',
      text: 'text-slate-400',
      glowClass: 'glow-unverifiable',
      title: 'Unverifiable Claim'
    };
  }

  const StatusIcon = statusBadge.icon;

  return (
    <div className={`glass-panel rounded-2xl p-6 border transition-all ${statusBadge.glowClass}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center space-x-3.5">
          <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${statusBadge.bg} ${statusBadge.border} border`}>
            <StatusIcon className={`h-7 w-7 ${statusBadge.text}`} />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Misinformation Risk Verdict
              </span>
            </div>
            <h2 className={`text-2xl font-black tracking-tight ${statusBadge.text}`}>
              {verdict}
            </h2>
          </div>
        </div>

        {/* Confidence Gauge Badge */}
        <div className="flex items-center space-x-3 bg-slate-900/80 px-4 py-2.5 rounded-xl border border-slate-800">
          <div className="text-right">
            <span className="text-[11px] font-medium text-slate-400 block">Model Confidence</span>
            <span className="text-xl font-bold font-mono text-white">
              {(confidence_score * 100).toFixed(1)}%
            </span>
          </div>
          <div className="h-9 w-9 rounded-full border-2 border-indigo-500/40 border-t-indigo-400 flex items-center justify-center font-mono text-[10px] text-indigo-300">
            Focal
          </div>
        </div>
      </div>

      {/* Calibrated Probability Breakdown */}
      <div className="mt-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Multi-Class Calibrated Probabilities
          </span>
          <span className="text-[11px] text-slate-500 font-mono">
            Softmax + Cross-Modal Focal Calibration
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
          {Object.entries(calibrated_probabilities || {}).map(([className, prob]) => {
            const pct = (prob * 100).toFixed(1);
            let barColor = 'bg-slate-600';
            let textColor = 'text-slate-300';

            if (className.includes('True')) {
              barColor = 'bg-emerald-500';
              textColor = 'text-emerald-400';
            } else if (className.includes('Misleading')) {
              barColor = 'bg-amber-500';
              textColor = 'text-amber-400';
            } else if (className.includes('False')) {
              barColor = 'bg-rose-500';
              textColor = 'text-rose-400';
            }

            return (
              <div key={className} className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-slate-400 truncate pr-1 text-[11px]">{className}</span>
                  <span className={`font-mono font-semibold ${textColor}`}>{pct}%</span>
                </div>
                <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${barColor} transition-all duration-500`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Forensic Summary Narrative */}
      <div className="mt-5 p-3.5 rounded-xl bg-slate-900/40 border border-slate-800/80 flex items-start space-x-3">
        <FileText className="h-4 w-4 text-indigo-400 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-slate-300 leading-relaxed font-sans">
          {forensic_summary_text}
        </p>
      </div>
    </div>
  );
}
