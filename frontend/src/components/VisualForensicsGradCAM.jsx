import React, { useState } from 'react';
import { Eye, Layers, Flame, Sliders } from 'lucide-react';

export default function VisualForensicsGradCAM({ visualExplainability, originalImage }) {
  const [viewMode, setViewMode] = useState('overlay'); // 'overlay', 'heatmap', 'original'
  const [opacity, setOpacity] = useState(65);

  const overlayUri = visualExplainability?.overlay_data_uri;
  const heatmapUri = visualExplainability?.heatmap_data_uri;

  const currentDisplayImage =
    viewMode === 'heatmap' ? heatmapUri :
    viewMode === 'original' ? (originalImage || overlayUri) :
    overlayUri;

  return (
    <div className="glass-panel rounded-2xl p-5 border border-slate-800 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Flame className="h-4 w-4 text-rose-400" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            Visual Forensics & Grad-CAM Grounding
          </h3>
        </div>
        <span className="text-[10px] font-mono text-slate-400">
          ViT-B/16 Patch Attribution (14x14)
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 items-center">
        {/* Heatmap Visualizer Canvas */}
        <div className="sm:col-span-6 flex justify-center">
          <div className="relative w-56 h-56 rounded-xl overflow-hidden border border-slate-700 bg-slate-900 shadow-2xl flex items-center justify-center group">
            {currentDisplayImage ? (
              <img
                src={currentDisplayImage}
                alt="Visual explainability"
                className="w-full h-full object-cover transition duration-300"
              />
            ) : (
              <div className="text-center p-4 text-xs text-slate-500">
                Awaiting analysis execution...
              </div>
            )}
            <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/75 text-[10px] font-mono text-slate-200 uppercase tracking-wider border border-white/10">
              {viewMode} mode
            </div>
          </div>
        </div>

        {/* View Controls & Explanation */}
        <div className="sm:col-span-6 space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-400 block mb-2">
              Forensic Visualization Layer
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setViewMode('overlay')}
                className={`py-2 px-2.5 rounded-xl text-xs font-medium border flex items-center justify-center space-x-1.5 transition ${
                  viewMode === 'overlay'
                    ? 'bg-indigo-600/30 border-indigo-500 text-indigo-300 shadow'
                    : 'bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-400'
                }`}
              >
                <Layers className="h-3 w-3" />
                <span>Blended</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('heatmap')}
                className={`py-2 px-2.5 rounded-xl text-xs font-medium border flex items-center justify-center space-x-1.5 transition ${
                  viewMode === 'heatmap'
                    ? 'bg-rose-600/30 border-rose-500 text-rose-300 shadow'
                    : 'bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-400'
                }`}
              >
                <Flame className="h-3 w-3" />
                <span>Grad-CAM</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('original')}
                className={`py-2 px-2.5 rounded-xl text-xs font-medium border flex items-center justify-center space-x-1.5 transition ${
                  viewMode === 'original'
                    ? 'bg-emerald-600/30 border-emerald-500 text-emerald-300 shadow'
                    : 'bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-400'
                }`}
              >
                <Eye className="h-3 w-3" />
                <span>Original</span>
              </button>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-[11px] text-slate-300 space-y-1.5">
            <p className="font-semibold text-slate-200">Interpretability Guide:</p>
            <p className="text-slate-400 leading-snug">
              • <strong className="text-rose-400">Warm regions (Red/Yellow):</strong> Highlight spatial image patches with highest gradient activation driving the misinformation verdict.
            </p>
            <p className="text-slate-400 leading-snug">
              • <strong className="text-indigo-400">Cool regions (Blue/Purple):</strong> Background context exhibiting minimal contribution to classification.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
