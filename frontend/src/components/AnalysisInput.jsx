import React, { useState, useRef } from 'react';
import { Upload, Sliders, Play, Sparkles, Image as ImageIcon, X } from 'lucide-react';
import { SAMPLE_CASES } from '../data/sampleCases';

export default function AnalysisInput({
  onAnalyze,
  isLoading,
  selectedSample,
  onSelectSample,
  currentText,
  setCurrentText,
  currentImage,
  setCurrentImage,
  weights,
  setWeights
}) {
  const [showSliders, setShowSliders] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setCurrentImage(event.target?.result);
        onSelectSample(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleClearImage = () => {
    setCurrentImage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!currentText.trim() && !currentImage) return;
    onAnalyze({
      text: currentText,
      imageBase64: currentImage,
      sampleId: selectedSample?.id,
      weights
    });
  };

  return (
    <div className="glass-panel rounded-2xl p-6 border border-slate-800 shadow-xl">
      {/* Benchmark Presets bar */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
            <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
            <span>Select Benchmark Test Case</span>
          </span>
          <span className="text-[11px] text-slate-500">
            Fakeddit & MultiFC Scenarios
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {SAMPLE_CASES.map((sample) => {
            const isSelected = selectedSample?.id === sample.id;
            return (
              <button
                key={sample.id}
                onClick={() => {
                  onSelectSample(sample);
                  setCurrentText(sample.headline);
                  setCurrentImage(sample.previewSvg);
                  if (sample.defaultWeights) setWeights(sample.defaultWeights);
                }}
                className={`p-2.5 text-left rounded-xl border transition flex flex-col justify-between ${
                  isSelected
                    ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-md shadow-indigo-500/10'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-300'
                }`}
              >
                <div>
                  <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium mb-1 ${
                    sample.badgeColor === 'red' ? 'bg-red-500/20 text-red-300 border border-red-500/30' :
                    sample.badgeColor === 'amber' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                    sample.badgeColor === 'purple' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' :
                    'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  }`}>
                    {sample.tag}
                  </span>
                  <p className="font-semibold text-xs leading-snug line-clamp-1">{sample.title}</p>
                </div>
                <span className="text-[10px] text-slate-400 mt-2 font-mono">
                  {sample.expectedVerdict}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          {/* Image Upload / Preview Area */}
          <div className="md:col-span-4 flex flex-col">
            <label className="text-xs font-semibold text-slate-300 mb-2 flex items-center justify-between">
              <span className="flex items-center space-x-1.5">
                <ImageIcon className="h-3.5 w-3.5 text-indigo-400" />
                <span>Multimodal Visual Input</span>
              </span>
              {currentImage && (
                <button
                  type="button"
                  onClick={handleClearImage}
                  className="text-[11px] text-rose-400 hover:text-rose-300 flex items-center space-x-1"
                >
                  <X className="h-3 w-3" />
                  <span>Remove</span>
                </button>
              )}
            </label>

            <div
              onClick={() => fileInputRef.current?.click()}
              className={`relative border-2 border-dashed rounded-xl h-44 flex flex-col items-center justify-center cursor-pointer transition p-2 overflow-hidden ${
                currentImage
                  ? 'border-indigo-500/40 bg-slate-900'
                  : 'border-slate-700 hover:border-indigo-500/60 bg-slate-900/40 hover:bg-slate-900/80'
              }`}
            >
              {currentImage ? (
                <div className="relative w-full h-full flex items-center justify-center">
                  <img
                    src={currentImage}
                    alt="Upload preview"
                    className="max-h-full max-w-full object-contain rounded-lg shadow"
                  />
                  <div className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/70 text-[9px] text-slate-300 font-mono">
                    224x224 ViT Ready
                  </div>
                </div>
              ) : (
                <div className="text-center p-3">
                  <Upload className="h-7 w-7 text-slate-500 mx-auto mb-2" />
                  <p className="text-xs font-medium text-slate-300">Click to upload image</p>
                  <p className="text-[10px] text-slate-500 mt-1">PNG, JPG, WebP (ViT-B/16)</p>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          </div>

          {/* Text Claims / Headline Input Area */}
          <div className="md:col-span-8 flex flex-col justify-between">
            <div>
              <label className="text-xs font-semibold text-slate-300 mb-2 block">
                Post Text, Headline, or Verifiable Social Media Claim
              </label>
              <textarea
                value={currentText}
                onChange={(e) => setCurrentText(e.target.value)}
                placeholder="Enter multimodal post text (e.g., 'The COVID-19 vaccine causes magnetic powers in people and metals stick to the arm.')..."
                rows={5}
                className="w-full rounded-xl bg-slate-900/90 border border-slate-700/80 p-3.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition resize-none font-sans"
              />
            </div>

            {/* Hyperparameter slider toggle & submit button */}
            <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowSliders(!showSliders)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                  showSliders
                    ? 'bg-slate-800 border-indigo-500/50 text-indigo-300'
                    : 'bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-400'
                }`}
              >
                <Sliders className="h-3.5 w-3.5" />
                <span>Loss Weights (α, β, γ)</span>
              </button>

              <button
                type="submit"
                disabled={isLoading || (!currentText.trim() && !currentImage)}
                className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-semibold text-xs shadow-lg shadow-indigo-600/30 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <div className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Cross-Modal Inferencing...</span>
                  </>
                ) : (
                  <>
                    <Play className="h-3.5 w-3.5 fill-current" />
                    <span>Run Multimodal Forensic Analysis</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Hyperparameters Configuration Drawer */}
        {showSliders && (
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-4 mt-2">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-300 font-mono">α (Focal Cls Loss)</span>
                <span className="text-indigo-400 font-mono">{weights.alpha_cls}</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="2.0"
                step="0.1"
                value={weights.alpha_cls}
                onChange={(e) => setWeights({ ...weights, alpha_cls: parseFloat(e.target.value) })}
                className="w-full accent-indigo-500"
              />
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-300 font-mono">β (Consistency Loss)</span>
                <span className="text-indigo-400 font-mono">{weights.beta_cons}</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="2.0"
                step="0.1"
                value={weights.beta_cons}
                onChange={(e) => setWeights({ ...weights, beta_cons: parseFloat(e.target.value) })}
                className="w-full accent-indigo-500"
              />
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-300 font-mono">γ (Evidence NLI Loss)</span>
                <span className="text-indigo-400 font-mono">{weights.gamma_evid}</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="2.0"
                step="0.1"
                value={weights.gamma_evid}
                onChange={(e) => setWeights({ ...weights, gamma_evid: parseFloat(e.target.value) })}
                className="w-full accent-indigo-500"
              />
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
