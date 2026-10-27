import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import AnalysisInput from './components/AnalysisInput';
import VerdictCard from './components/VerdictCard';
import ConsistencyMeter from './components/ConsistencyMeter';
import VisualForensicsGradCAM from './components/VisualForensicsGradCAM';
import TokenAttributionView from './components/TokenAttributionView';
import EvidenceList from './components/EvidenceList';
import BenchmarkModal from './components/BenchmarkModal';
import LeakageAuditModal from './components/LeakageAuditModal';
import { SAMPLE_CASES } from './data/sampleCases';
import { Download, Printer, ShieldCheck } from 'lucide-react';

export default function App() {
  const [backendStatus, setBackendStatus] = useState('connecting');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSample, setSelectedSample] = useState(SAMPLE_CASES[0]);
  const [currentText, setCurrentText] = useState(SAMPLE_CASES[0].headline);
  const [currentImage, setCurrentImage] = useState(SAMPLE_CASES[0].previewSvg);
  const [weights, setWeights] = useState({ alpha_cls: 1.0, beta_cons: 0.6, gamma_evid: 0.4 });
  const [report, setReport] = useState(null);

  const [isBenchmarkOpen, setIsBenchmarkOpen] = useState(false);
  const [isAuditOpen, setIsAuditOpen] = useState(false);

  // Check health and run initial analysis on launch
  useEffect(() => {
    fetch('/api/v1/health')
      .then((res) => res.json())
      .then(() => {
        setBackendStatus('online');
      })
      .catch(() => {
        setBackendStatus('offline');
      });

    // Run initial analysis with sample 1
    handleRunAnalysis({
      text: SAMPLE_CASES[0].headline,
      imageBase64: SAMPLE_CASES[0].previewSvg,
      sampleId: SAMPLE_CASES[0].id,
      weights: SAMPLE_CASES[0].defaultWeights
    });
  }, []);

  const handleRunAnalysis = async ({ text, imageBase64, sampleId, weights: customWeights }) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/v1/analyze-json', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: text,
          image_base64: imageBase64,
          sample_id: sampleId,
          alpha_cls: customWeights?.alpha_cls || 1.0,
          beta_cons: customWeights?.beta_cons || 0.6,
          gamma_evid: customWeights?.gamma_evid || 0.4
        })
      });

      if (!response.ok) {
        throw new Error('Analysis request failed');
      }

      const data = await response.json();
      setReport(data);
    } catch (err) {
      console.error('Analysis error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportJson = () => {
    if (!report) return;
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `truthlens_forensic_report_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Navbar
        backendStatus={backendStatus}
        onOpenBenchmark={() => setIsBenchmarkOpen(true)}
        onOpenAudit={() => setIsAuditOpen(true)}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Input & Preset Selection Section */}
        <section>
          <AnalysisInput
            onAnalyze={handleRunAnalysis}
            isLoading={isLoading}
            selectedSample={selectedSample}
            onSelectSample={setSelectedSample}
            currentText={currentText}
            setCurrentText={setCurrentText}
            currentImage={currentImage}
            setCurrentImage={setCurrentImage}
            weights={weights}
            setWeights={setWeights}
          />
        </section>

        {/* Forensic Results Section */}
        {report && (
          <section className="space-y-6">
            {/* Action Bar */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="h-2.5 w-2.5 rounded-full bg-indigo-500 animate-pulse" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">
                  Multimodal Forensic Output & Grounding
                </h2>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={handleExportJson}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs text-slate-300 border border-slate-700 transition"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Export JSON</span>
                </button>
                <button
                  onClick={handlePrint}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs text-slate-300 border border-slate-700 transition"
                >
                  <Printer className="h-3.5 w-3.5" />
                  <span>Print Report</span>
                </button>
              </div>
            </div>

            {/* Verdict Overview Card */}
            <VerdictCard report={report} />

            {/* Two Column Layout: Consistency & Visual Forensics */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-6 space-y-6">
                <ConsistencyMeter
                  consistencyScore={report.consistency_score}
                  cosineSim={report.cosine_similarity}
                  verdictText={report.consistency_verdict}
                />
                <TokenAttributionView tokenAttributions={report.token_attributions} />
              </div>

              <div className="lg:col-span-6">
                <VisualForensicsGradCAM
                  visualExplainability={report.visual_explainability}
                  originalImage={currentImage}
                />
              </div>
            </div>

            {/* Claims & Retrieved Fact-Checking Evidence List */}
            <EvidenceList
              extractedClaims={report.extracted_claims}
              verificationSummaries={report.verification_summaries}
            />
          </section>
        )}
      </main>

      {/* Modals */}
      <BenchmarkModal
        isOpen={isBenchmarkOpen}
        onClose={() => setIsBenchmarkOpen(false)}
      />

      <LeakageAuditModal
        isOpen={isAuditOpen}
        onClose={() => setIsAuditOpen(false)}
      />

      {/* Footer */}
      <footer className="border-t border-slate-900 py-6 text-center text-xs text-slate-500">
        <p>
          TRUTHLENS-AI • Intelligent Model Design using AI (Milestone 1 Report Framework)
        </p>
        <p className="text-[11px] text-slate-600 mt-1">
          Darsh Goswami • Disha Sinha • Rishabh Raj • Dhruv Kumar
        </p>
      </footer>
    </div>
  );
}
