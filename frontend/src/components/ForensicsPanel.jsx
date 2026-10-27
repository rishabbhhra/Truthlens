import React, { useState } from 'react';
import { Layers, Flame, Eye } from 'lucide-react';

const MODES = [
  { id: 'overlay',  label: 'Overlay',  icon: Layers,  color: 'text-indigo-400' },
  { id: 'heatmap',  label: 'Grad-CAM', icon: Flame,   color: 'text-rose-400' },
  { id: 'original', label: 'Original', icon: Eye,     color: 'text-emerald-400' },
];

export default function ForensicsPanel({ visual, originalSrc }) {
  const [mode, setMode] = useState('overlay');

  const display =
    mode === 'heatmap'  ? visual?.heatmap_data_uri  :
    mode === 'original' ? (originalSrc || visual?.overlay_data_uri) :
    visual?.overlay_data_uri;

  return (
    <div className="glass rounded-2xl p-5 border border-slate-800 shadow-xl h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">Visual Forensics</p>
          <h3 className="text-sm font-bold text-slate-200 mt-0.5">Grad-CAM Spatial Grounding</h3>
        </div>
        <span className="text-[10px] font-mono text-slate-600">ViT-B/16 14×14 Patches</span>
      </div>

      {/* View toggle */}
      <div className="flex gap-1 mb-4 bg-slate-900/80 p-1 rounded-xl border border-slate-800">
        {MODES.map(({ id, label, icon: Icon, color }) => (
          <button
            key={id}
            onClick={() => setMode(id)}
            className={`flex-1 flex items-center justify-center gap-1.5 h-7 rounded-lg text-xs font-medium transition ${
              mode === id
                ? 'bg-slate-700 text-slate-100 shadow'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <Icon size={11} className={mode === id ? color : ''} />
            {label}
          </button>
        ))}
      </div>

      {/* Image canvas */}
      <div className="flex-1 relative rounded-xl overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center min-h-48">
        {display ? (
          <>
            <img src={display} alt="forensic view" className="w-full h-full object-contain" />
            <div className="absolute bottom-2 left-2 flex gap-1.5">
              <span className="px-2 py-0.5 bg-black/75 rounded text-[10px] font-mono text-slate-300 border border-white/10 uppercase">
                {mode}
              </span>
              <span className="px-2 py-0.5 bg-black/75 rounded text-[10px] font-mono text-slate-400 border border-white/10">
                224×224
              </span>
            </div>
          </>
        ) : (
          <p className="text-xs text-slate-600 text-center px-4">
            Run analysis to see visual grounding output
          </p>
        )}
      </div>

      {/* Legend */}
      <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] text-slate-500">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-2 rounded-sm bg-gradient-to-r from-red-500 to-yellow-400" />
          <span>High activation (misinformation driver)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-2 rounded-sm bg-gradient-to-r from-indigo-700 to-blue-600" />
          <span>Low activation (background context)</span>
        </div>
      </div>
    </div>
  );
}
