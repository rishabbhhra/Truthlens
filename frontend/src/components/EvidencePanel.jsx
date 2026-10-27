import React, { useState } from 'react';
import { Tag, BookOpen, ShieldAlert, CheckCircle2, MinusCircle, ExternalLink, ChevronDown, ChevronRight } from 'lucide-react';

const STANCE_STYLES = {
  CONTRADICTION: { text: 'text-red-400',     bg: 'bg-red-500/10',     border: 'border-red-500/30' },
  ENTAILMENT:    { text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' },
  NEUTRAL:       { text: 'text-slate-400',   bg: 'bg-slate-500/10',   border: 'border-slate-500/30' },
};

const STATUS_ICONS = {
  REFUTED:    { Icon: ShieldAlert,  cls: 'text-red-400',     bg: 'bg-red-500/15 border-red-500/30' },
  SUPPORTED:  { Icon: CheckCircle2, cls: 'text-emerald-400', bg: 'bg-emerald-500/15 border-emerald-500/30' },
  CONTESTED:  { Icon: MinusCircle,  cls: 'text-amber-400',   bg: 'bg-amber-500/15 border-amber-500/30' },
  UNVERIFIED: { Icon: MinusCircle,  cls: 'text-slate-400',   bg: 'bg-slate-500/15 border-slate-500/30' },
};

function EvidenceCard({ ev, index }) {
  const stance = STANCE_STYLES[ev.stance] || STANCE_STYLES.NEUTRAL;
  return (
    <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 transition">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-slate-200">{ev.source}</span>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono border bg-slate-800 border-slate-700 text-slate-400">
              {ev.credibility_rating}
            </span>
            <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border ${stance.bg} ${stance.border} ${stance.text}`}>
              {ev.stance}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-[11px] font-mono text-slate-500">
            {(ev.similarity_score * 100).toFixed(0)}% sim
          </span>
          {ev.url && (
            <a href={ev.url} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 transition">
              <ExternalLink size={12} />
            </a>
          )}
        </div>
      </div>
      <p className="text-xs text-slate-300 leading-relaxed mb-2">{ev.text}</p>
      <div className="flex gap-4 text-[10px] font-mono text-slate-600 border-t border-slate-800/60 pt-1.5">
        <span>Contradiction: <strong className="text-red-400">{(ev.contradiction_prob * 100).toFixed(0)}%</strong></span>
        <span>Entailment: <strong className="text-emerald-400">{(ev.entailment_prob * 100).toFixed(0)}%</strong></span>
        <span>Neutral: <strong className="text-slate-400">{(ev.neutral_prob * 100).toFixed(0)}%</strong></span>
      </div>
    </div>
  );
}

function ClaimBlock({ summary }) {
  const [open, setOpen] = useState(true);
  const statusInfo = STATUS_ICONS[summary.overall_status] || STATUS_ICONS.UNVERIFIED;
  const StatusIcon = statusInfo.Icon;
  return (
    <div className="border border-slate-800 rounded-xl overflow-hidden">
      <button
        className="w-full flex items-center justify-between gap-3 p-3.5 bg-slate-900/70 hover:bg-slate-900 transition text-left"
        onClick={() => setOpen(!open)}
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold border flex-shrink-0 ${statusInfo.bg} ${statusInfo.cls}`}>
            <StatusIcon size={12} />
            {summary.overall_status}
          </span>
          <p className="text-xs text-slate-200 font-medium truncate">"{summary.claim_text}"</p>
        </div>
        {open ? <ChevronDown size={14} className="text-slate-500 flex-shrink-0" /> : <ChevronRight size={14} className="text-slate-500 flex-shrink-0" />}
      </button>
      {open && (
        <div className="p-3 space-y-2 bg-slate-950/30">
          {summary.top_evidence?.map((ev, i) => <EvidenceCard key={i} ev={ev} index={i} />)}
        </div>
      )}
    </div>
  );
}

export default function EvidencePanel({ claims, summaries }) {
  if (!claims?.length && !summaries?.length) return null;
  return (
    <div className="glass rounded-2xl p-5 border border-slate-800 shadow-xl space-y-5">

      {/* Claims */}
      {claims?.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Tag size={14} className="text-indigo-400" />
              <h3 className="text-sm font-bold text-slate-200">Extracted Verifiable Claims</h3>
            </div>
            <span className="text-[11px] font-mono text-slate-500">{claims.length} extracted</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {claims.map((c) => (
              <div key={c.claim_id} className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-mono text-indigo-400 font-semibold">{c.claim_id} · {c.claim_type}</span>
                  <span className="text-[10px] font-mono text-slate-500">{(c.confidence * 100).toFixed(0)}% verifiable</span>
                </div>
                <p className="text-xs text-slate-200 leading-snug">"{c.text}"</p>
                <div className="flex flex-wrap gap-1 mt-2 pt-2 border-t border-slate-800/60">
                  {c.keywords?.map((k, i) => (
                    <span key={i} className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-slate-500">#{k}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Verification summaries */}
      {summaries?.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <BookOpen size={14} className="text-emerald-400" />
              <h3 className="text-sm font-bold text-slate-200">Evidence Retrieval & NLI Stance</h3>
            </div>
            <span className="text-[11px] font-mono text-slate-500">FAISS · Cross-Encoder NLI</span>
          </div>
          <div className="space-y-2">
            {summaries.map((s) => <ClaimBlock key={s.claim_id} summary={s} />)}
          </div>
        </div>
      )}
    </div>
  );
}
