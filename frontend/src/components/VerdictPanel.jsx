import React from 'react';
import { AlertOctagon, AlertTriangle, CheckCircle2, HelpCircle, FileText } from 'lucide-react';

const VERDICTS = {
  false:    { label: 'False / Mostly False',   icon: AlertOctagon,  textCls: 'text-red-400',     glowCls: 'verdict-false',   pill: 'bg-red-500/15 text-red-300 border-red-500/30' },
  mislead:  { label: 'Misleading',             icon: AlertTriangle, textCls: 'text-amber-400',   glowCls: 'verdict-mislead', pill: 'bg-amber-500/15 text-amber-300 border-amber-500/30' },
  true:     { label: 'True / Mostly True',     icon: CheckCircle2,  textCls: 'text-emerald-400', glowCls: 'verdict-true',    pill: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' },
  unknown:  { label: 'Unverifiable',           icon: HelpCircle,    textCls: 'text-slate-400',   glowCls: 'verdict-unknown', pill: 'bg-slate-500/15 text-slate-300 border-slate-500/30' },
};

function getVerdictStyle(verdict) {
  const v = verdict?.toLowerCase() || '';
  if (v.includes('false') || v.includes('fabricated')) return VERDICTS.false;
  if (v.includes('mislead') || v.includes('context'))  return VERDICTS.mislead;
  if (v.includes('true') || v.includes('verified'))    return VERDICTS.true;
  return VERDICTS.unknown;
}

const CLASS_COLORS = {
  'True / Mostly True':   { bar: 'bg-emerald-500', text: 'text-emerald-400' },
  'Misleading':           { bar: 'bg-amber-500',   text: 'text-amber-400' },
  'False / Mostly False': { bar: 'bg-red-500',     text: 'text-red-400' },
  'Unverifiable':         { bar: 'bg-slate-600',   text: 'text-slate-400' },
};

export default function VerdictPanel({ result }) {
  if (!result) return null;
  const style = getVerdictStyle(result.verdict);
  const Icon  = style.icon;
  const pct   = (result.confidence_score * 100).toFixed(1);

  return (
    <div className={`glass rounded-2xl p-6 border transition-all duration-500 slide-up ${style.glowCls}`}>

      {/* ── Top row: verdict + confidence ─────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-5">
        <div className="flex items-start gap-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${style.pill} border`}>
            <Icon size={24} />
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500 mb-0.5">
              Misinformation Risk Verdict
            </p>
            <h2 className={`text-2xl font-black tracking-tight ${style.textCls}`}>
              {result.verdict}
            </h2>
          </div>
        </div>

        {/* Confidence ring */}
        <div className="flex items-center gap-3 bg-slate-900/80 border border-slate-800 rounded-xl px-4 py-2.5 flex-shrink-0">
          <div className="text-right">
            <p className="text-[10px] text-slate-500 font-medium">Model Confidence</p>
            <p className="text-2xl font-black font-mono text-white leading-none">{pct}%</p>
          </div>
          <div className="relative w-10 h-10">
            <svg className="w-10 h-10 -rotate-90" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="14" stroke="rgba(100,116,139,0.3)" strokeWidth="3" fill="none" />
              <circle
                cx="18" cy="18" r="14"
                stroke="#6366f1" strokeWidth="3" fill="none"
                strokeDasharray={`${(result.confidence_score * 87.96).toFixed(1)} 87.96`}
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* ── Class probability bars ─────────────────────── */}
      <div className="mb-5">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500 mb-3">
          Calibrated Multi-Class Probabilities
        </p>
        <div className="space-y-2">
          {Object.entries(result.calibrated_probabilities || {}).map(([cls, prob]) => {
            const colors = CLASS_COLORS[cls] || { bar: 'bg-slate-600', text: 'text-slate-400' };
            const p = (prob * 100).toFixed(1);
            return (
              <div key={cls} className="flex items-center gap-3">
                <span className="text-xs text-slate-400 w-36 shrink-0 truncate">{cls}</span>
                <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full bar-fill ${colors.bar}`}
                    style={{ width: `${p}%`, animationDelay: '0.1s' }}
                  />
                </div>
                <span className={`text-xs font-mono font-semibold w-10 text-right ${colors.text}`}>{p}%</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Forensic narrative ─────────────────────────── */}
      <div className="flex gap-3 p-3.5 bg-slate-900/60 rounded-xl border border-slate-800">
        <FileText size={14} className="text-indigo-400 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-slate-300 leading-relaxed">{result.forensic_summary_text}</p>
      </div>
    </div>
  );
}
