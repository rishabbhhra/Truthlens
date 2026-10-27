import React from 'react';
import { ShieldCheck, Activity, BarChart2, Database, Users } from 'lucide-react';

export default function Navbar({ backendStatus, onOpenBenchmark, onOpenAudit }) {
  return (
    <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-rose-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <ShieldCheck className="h-6 w-6 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                TRUTHLENS<span className="text-indigo-400">-AI</span>
              </span>
              <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                Milestone 1
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Evidence-Grounded Multimodal Deep Learning Framework
            </p>
          </div>
        </div>

        {/* Action Controls & Team Credit */}
        <div className="flex items-center space-x-3">
          {/* Team Tooltip */}
          <div className="relative group">
            <button className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-xs font-medium text-slate-300 transition">
              <Users className="h-3.5 w-3.5 text-slate-400" />
              <span>Project Team</span>
            </button>
            <div className="absolute right-0 mt-2 w-64 p-3 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition duration-150 z-50 text-xs">
              <p className="font-semibold text-slate-200 border-b border-slate-800 pb-1.5 mb-2">
                Project Ownership (IMD)
              </p>
              <ul className="space-y-1.5 text-slate-400">
                <li><span className="text-slate-200 font-medium">Darsh Goswami:</span> Research & Multimodal Architecture</li>
                <li><span className="text-slate-200 font-medium">Disha Sinha:</span> Computer Vision & Visual Forensics</li>
                <li><span className="text-indigo-300 font-medium">Rishabh Raj:</span> NLP, Retrieval & Backend Engineering</li>
                <li><span className="text-slate-200 font-medium">Dhruv Kumar:</span> Evidence Verification</li>
              </ul>
            </div>
          </div>

          {/* Benchmark comparison button */}
          <button
            onClick={onOpenBenchmark}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-xs font-medium text-slate-300 transition"
          >
            <BarChart2 className="h-3.5 w-3.5 text-indigo-400" />
            <span className="hidden sm:inline">Benchmark Baselines</span>
          </button>

          {/* Leakage Audit button */}
          <button
            onClick={onOpenAudit}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-xs font-medium text-slate-300 transition"
          >
            <Database className="h-3.5 w-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Data Leakage Audit</span>
          </button>

          {/* Live Status indicator */}
          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-[11px] text-slate-400">
            <span className={`h-2 w-2 rounded-full ${backendStatus === 'online' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
            <span className="font-mono">{backendStatus === 'online' ? 'API Online' : 'Connecting'}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
