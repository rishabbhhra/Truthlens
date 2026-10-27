import React, { useEffect, useState } from 'react';
import Navbar          from './components/Navbar';
import InputPanel      from './components/InputPanel';
import VerdictPanel    from './components/VerdictPanel';
import ForensicsPanel  from './components/ForensicsPanel';
import ConsistencyPanel from './components/ConsistencyPanel';
import TokensPanel     from './components/TokensPanel';
import EvidencePanel   from './components/EvidencePanel';
import BenchmarkModal  from './components/BenchmarkModal';
import AuditModal      from './components/AuditModal';
import { useAnalysis } from './hooks/useAnalysis';
import { Download, Printer, AlertCircle, X } from 'lucide-react';

export default function App() {
  const [apiStatus,  setApiStatus]  = useState('connecting');
  const [showBench,  setShowBench]  = useState(false);
  const [showAudit,  setShowAudit]  = useState(false);
  const [uploadedImg, setUploadedImg] = useState(null); // track last uploaded image for forensics panel

  const { result, loading, error, run } = useAnalysis();

  /* Health-check */
  useEffect(() => {
    fetch('/api/v1/health')
      .then(r => r.json())
      .then(() => setApiStatus('online'))
      .catch(() => setApiStatus('offline'));
  }, []);

  const handleSubmit = ({ text, image_base64, sample_id, weights }) => {
    setUploadedImg(image_base64 || null);
    run({ text, image_base64, sample_id, weights });
  };

  const handleExport = () => {
    if (!result) return;
    const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = Object.assign(document.createElement('a'), { href: url, download: `truthlens_report_${Date.now()}.json` });
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="hero-gradient min-h-screen flex flex-col">
      <Navbar
        apiStatus={apiStatus}
        onBenchmark={() => setShowBench(true)}
        onAudit={() => setShowAudit(true)}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

        {/* ── Input Panel ─────────────────────────────── */}
        <InputPanel onSubmit={handleSubmit} loading={loading} />

        {/* ── Error Banner ────────────────────────────── */}
        {error && (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-red-950/40 border border-red-500/40 text-red-300 text-sm slide-up">
            <AlertCircle size={16} className="flex-shrink-0" />
            <span className="flex-1">{error}</span>
            <button className="flex-shrink-0 text-red-400 hover:text-red-200" onClick={() => {}}>
              <X size={14} />
            </button>
          </div>
        )}

        {/* ── Loading skeletons ────────────────────────── */}
        {loading && (
          <div className="space-y-4 slide-up">
            <div className="glass rounded-2xl p-6 border border-slate-800">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-6 h-6 rounded bg-slate-800 animate-pulse" />
                <div className="h-4 w-48 bg-slate-800 rounded animate-pulse" />
              </div>
              <div className="space-y-2">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="h-3 bg-slate-800/70 rounded animate-pulse" style={{ width: `${85 - i * 8}%` }} />
                ))}
              </div>
            </div>
            <p className="text-center text-xs text-slate-500 font-mono animate-pulse">
              ◉ Running cross-modal inference pipeline…
            </p>
          </div>
        )}

        {/* ── Results ─────────────────────────────────── */}
        {result && !loading && (
          <div className="space-y-5">
            {/* Results header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="pulse-dot w-2 h-2 rounded-full bg-indigo-500" />
                <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest">
                  Forensic Analysis Report
                </h2>
              </div>
              <div className="flex items-center gap-2 no-print">
                <button
                  onClick={handleExport}
                  className="flex items-center gap-1.5 h-7 px-3 rounded-lg text-xs text-slate-400 hover:text-slate-200 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 transition"
                >
                  <Download size={12} /> Export JSON
                </button>
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 h-7 px-3 rounded-lg text-xs text-slate-400 hover:text-slate-200 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 transition"
                >
                  <Printer size={12} /> Print
                </button>
              </div>
            </div>

            {/* Verdict */}
            <VerdictPanel result={result} />

            {/* Middle row: Consistency + Visual Forensics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <div className="flex flex-col gap-5">
                <ConsistencyPanel result={result} />
                <TokensPanel tokens={result.token_attributions} />
              </div>
              <ForensicsPanel visual={result.visual_explainability} originalSrc={uploadedImg} />
            </div>

            {/* Evidence */}
            <EvidencePanel
              claims={result.extracted_claims}
              summaries={result.verification_summaries}
            />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-5 text-center text-xs text-slate-600 no-print">
        <p className="font-semibold">TRUTHLENS-AI · Intelligent Model Design using AI (IMD) — Milestone 1</p>
        <p className="mt-0.5">Darsh Goswami · Disha Sinha · Rishabh Raj · Dhruv Kumar</p>
      </footer>

      <BenchmarkModal open={showBench} onClose={() => setShowBench(false)} />
      <AuditModal     open={showAudit} onClose={() => setShowAudit(false)} />
    </div>
  );
}
