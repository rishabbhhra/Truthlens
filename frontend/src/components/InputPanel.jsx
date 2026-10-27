import React, { useRef, useState } from 'react';
import { Upload, Play, Loader2, Sliders, ImageOff, X, Zap, ChevronDown, ChevronUp } from 'lucide-react';
import { SAMPLE_CASES } from '../data/sampleCases';

const TAG_STYLES = {
  red:     'bg-red-500/15 text-red-300 border-red-500/25',
  amber:   'bg-amber-500/15 text-amber-300 border-amber-500/25',
  purple:  'bg-purple-500/15 text-purple-300 border-purple-500/25',
  emerald: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/25',
};

export default function InputPanel({ onSubmit, loading }) {
  const fileRef = useRef(null);

  const [selectedId, setSelectedId]   = useState('sample-1');
  const [text, setText]               = useState(SAMPLE_CASES[0].headline);
  const [imageSrc, setImageSrc]       = useState(null);  // user-uploaded PNG/JPG
  const [imageB64, setImageB64]       = useState(null);  // raw base64 for API
  const [showWeights, setShowWeights] = useState(false);
  const [weights, setWeights]         = useState({ alpha_cls: 1.0, beta_cons: 0.6, gamma_evid: 0.4 });

  const activeSample = SAMPLE_CASES.find(s => s.id === selectedId);

  const handlePreset = (sample) => {
    setSelectedId(sample.id);
    setText(sample.headline);
    setImageSrc(null);
    setImageB64(null);
    setWeights(sample.defaultWeights);
  };

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUri = ev.target.result;
      setImageSrc(dataUri);
      setImageB64(dataUri); // PNG/JPEG data URI — backend can decode it
      setSelectedId(null);
    };
    reader.readAsDataURL(file);
  };

  const clearImage = () => {
    setImageSrc(null);
    setImageB64(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!text.trim() || loading) return;
    onSubmit({
      text,
      image_base64: imageB64,   // null → backend generates forensic canvas
      sample_id: selectedId,
      weights,
    });
  };

  return (
    <div className="glass rounded-2xl shadow-xl overflow-hidden">
      {/* ── Preset Selector Header ─────────────────────── */}
      <div className="px-5 pt-4 pb-3 border-b border-slate-800/60">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Zap size={13} className="text-indigo-400" />
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-widest">
              Benchmark Test Cases
            </span>
          </div>
          <span className="text-[11px] text-slate-500">Fakeddit · MultiFC</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {SAMPLE_CASES.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => handlePreset(s)}
              className={`group p-2.5 rounded-xl border text-left transition-all ${
                selectedId === s.id
                  ? 'bg-indigo-600/20 border-indigo-500/60 ring-1 ring-indigo-500/30'
                  : 'bg-slate-900/50 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40'
              }`}
            >
              <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold border mb-1.5 ${TAG_STYLES[s.tagColor]}`}>
                {s.tag}
              </span>
              <p className="text-xs font-semibold text-slate-200 leading-tight line-clamp-1">{s.title}</p>
              <p className="text-[10px] font-mono text-slate-500 mt-1 truncate">{s.expectedVerdict}</p>
            </button>
          ))}
        </div>
      </div>

      {/* ── Main Input Area ────────────────────────────── */}
      <form onSubmit={handleSubmit} className="p-5 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">

          {/* Image upload / preview */}
          <div className="md:col-span-4">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block">
              Visual Evidence
            </label>
            <div
              onClick={() => fileRef.current?.click()}
              className={`relative h-44 rounded-xl border-2 border-dashed cursor-pointer transition overflow-hidden flex items-center justify-center ${
                imageSrc ? 'border-indigo-500/40 bg-slate-900' : 'border-slate-700 bg-slate-900/40 hover:border-indigo-500/50 hover:bg-slate-900/60'
              }`}
            >
              {imageSrc ? (
                <>
                  <img src={imageSrc} alt="preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); clearImage(); }}
                    className="absolute top-2 right-2 bg-black/70 rounded-lg p-1 text-slate-300 hover:text-white border border-white/10"
                  >
                    <X size={12} />
                  </button>
                  <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/70 rounded text-[10px] font-mono text-slate-200 border border-white/10">
                    224×224 ready
                  </div>
                </>
              ) : (
                <div className="text-center px-4">
                  <Upload size={22} className="text-slate-600 mx-auto mb-2" />
                  <p className="text-xs font-medium text-slate-400">Upload image</p>
                  <p className="text-[11px] text-slate-600 mt-0.5">PNG · JPG · WebP</p>
                  <p className="text-[10px] text-indigo-400/70 mt-2">
                    Or use a preset — forensic canvas auto-generated
                  </p>
                </div>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
          </div>

          {/* Text + submit */}
          <div className="md:col-span-8 flex flex-col gap-3">
            <div className="flex-1">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block">
                Claim / Post Text / Headline
              </label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Enter the social media post text, headline, or verifiable claim to analyse…"
                rows={5}
                required
                className="w-full rounded-xl bg-slate-900 border border-slate-700/60 px-4 py-3 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/60 resize-none transition"
              />
            </div>

            {/* Weight toggles + run button */}
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setShowWeights(!showWeights)}
                className={`flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-medium border transition ${
                  showWeights
                    ? 'bg-slate-800 border-indigo-500/50 text-indigo-300'
                    : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-300 hover:border-slate-600'
                }`}
              >
                <Sliders size={12} />
                <span>Loss Weights (α β γ)</span>
                {showWeights ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
              </button>

              <button
                type="submit"
                disabled={loading || !text.trim()}
                className="flex items-center gap-2 h-9 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-semibold text-xs shadow-lg shadow-indigo-600/25 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <><div className="spinner" /><span>Analysing…</span></>
                ) : (
                  <><Play size={13} className="fill-white" /><span>Run Multimodal Forensic Analysis</span></>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* ── Loss Weight Sliders ──────────────────────── */}
        {showWeights && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-xl bg-slate-950/60 border border-slate-800 slide-up">
            {[
              { key: 'alpha_cls',  label: 'α — Focal Classification Loss',  color: '#6366f1' },
              { key: 'beta_cons',  label: 'β — Cross-Modal Consistency Loss', color: '#06b6d4' },
              { key: 'gamma_evid', label: 'γ — Evidence NLI Loss',           color: '#10b981' },
            ].map(({ key, label, color }) => (
              <div key={key}>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-slate-400 font-mono">{label}</span>
                  <span className="font-mono font-bold text-slate-200">{weights[key].toFixed(1)}</span>
                </div>
                <input
                  type="range" min="0.1" max="2.0" step="0.1"
                  value={weights[key]}
                  onChange={(e) => setWeights(prev => ({ ...prev, [key]: parseFloat(e.target.value) }))}
                  style={{ accentColor: color }}
                  className="w-full"
                />
              </div>
            ))}
          </div>
        )}
      </form>
    </div>
  );
}
