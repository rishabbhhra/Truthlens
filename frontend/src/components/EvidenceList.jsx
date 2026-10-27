import React from 'react';
import { Search, ShieldAlert, CheckCircle2, MinusCircle, ExternalLink, BookOpen, Tag } from 'lucide-react';

export default function EvidenceList({ extractedClaims, verificationSummaries }) {
  const hasClaims = extractedClaims && extractedClaims.length > 0;
  const hasSummaries = verificationSummaries && verificationSummaries.length > 0;

  if (!hasClaims && !hasSummaries) {
    return null;
  }

  return (
    <div className="glass-panel rounded-2xl p-6 border border-slate-800 shadow-xl space-y-6">
      {/* 1. Verifiable Claims NLP Extraction */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Tag className="h-4 w-4 text-indigo-400" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              Extracted Verifiable Propositions (Claim NLP)
            </h3>
          </div>
          <span className="text-[11px] font-mono text-slate-500">
            {extractedClaims.length} Claims Identified
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {extractedClaims.map((claim) => (
            <div
              key={claim.claim_id}
              className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[10px] font-mono font-medium">
                    {claim.claim_id} • {claim.claim_type}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    Verifiability: {(claim.confidence * 100).toFixed(0)}%
                  </span>
                </div>
                <p className="text-xs font-medium text-slate-200 leading-snug">
                  "{claim.text}"
                </p>
              </div>

              {/* Keywords */}
              <div className="flex flex-wrap gap-1 mt-2.5 pt-2 border-t border-slate-800/80">
                {claim.keywords?.map((kw, i) => (
                  <span key={i} className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-slate-400">
                    #{kw}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Retrieved Authoritative Evidence & NLI Verification Stances */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <BookOpen className="h-4 w-4 text-emerald-400" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              Dense Evidence Retrieval & NLI Stance Grounding
            </h3>
          </div>
          <span className="text-[11px] font-mono text-slate-500">
            FAISS + Cross-Encoder NLI
          </span>
        </div>

        <div className="space-y-4">
          {verificationSummaries?.map((summary) => (
            <div
              key={summary.claim_id}
              className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-800">
                <div>
                  <span className="text-[10px] font-mono text-indigo-400 font-semibold block mb-0.5">
                    CLAIM EVALUATION: {summary.claim_id}
                  </span>
                  <p className="text-xs font-semibold text-slate-100">
                    "{summary.claim_text}"
                  </p>
                </div>

                {/* Stance Pill */}
                <div>
                  {summary.overall_status === 'REFUTED' && (
                    <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold">
                      <ShieldAlert className="h-3.5 w-3.5 text-rose-400" />
                      <span>REFUTED BY EVIDENCE</span>
                    </span>
                  )}
                  {summary.overall_status === 'SUPPORTED' && (
                    <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                      <span>SUPPORTED BY FACT</span>
                    </span>
                  )}
                  {summary.overall_status === 'CONTESTED' && (
                    <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold">
                      <MinusCircle className="h-3.5 w-3.5 text-amber-400" />
                      <span>CONTESTED CLAIMS</span>
                    </span>
                  )}
                  {summary.overall_status === 'UNVERIFIED' && (
                    <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-slate-500/20 text-slate-300 border border-slate-500/30 text-xs font-bold">
                      <MinusCircle className="h-3.5 w-3.5 text-slate-400" />
                      <span>UNVERIFIED CLAIM</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Retrieved Passages Cards */}
              <div className="space-y-2.5">
                {summary.top_evidence?.map((ev, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 transition"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-xs text-slate-200">
                          {ev.source}
                        </span>
                        <span className="px-1.5 py-0.2 rounded bg-slate-800 text-[10px] text-slate-400 border border-slate-700 font-mono">
                          {ev.credibility_rating} CREDIBILITY
                        </span>
                      </div>

                      <div className="flex items-center space-x-2">
                        <span className="text-[10px] font-mono text-slate-400">
                          Similarity: <strong className="text-slate-200">{(ev.similarity_score * 100).toFixed(0)}%</strong>
                        </span>
                        {ev.url && (
                          <a
                            href={ev.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-indigo-400 hover:text-indigo-300"
                          >
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed font-sans mb-2">
                      {ev.text}
                    </p>

                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-1.5 border-t border-slate-900">
                      <span>NLI Inference: <strong className={ev.stance === 'CONTRADICTION' ? 'text-rose-400' : ev.stance === 'ENTAILMENT' ? 'text-emerald-400' : 'text-slate-300'}>{ev.stance}</strong></span>
                      <span>Contradiction: {(ev.contradiction_prob * 100).toFixed(0)}% | Entailment: {(ev.entailment_prob * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
