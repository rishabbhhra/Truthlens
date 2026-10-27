import React from 'react';
import { ShieldCheck, BarChart2, Database, Users, Wifi, WifiOff } from 'lucide-react';

export default function Navbar({ apiStatus, onBenchmark, onAudit }) {
  return (
    <nav className="glass sticky top-0 z-50 border-b border-slate-800/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">

        {/* Brand */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-indigo-600/30">
            <ShieldCheck className="w-4.5 h-4.5 text-white" size={18} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-black text-base tracking-tight text-white">
                TRUTHLENS<span className="text-indigo-400">-AI</span>
              </span>
            </div>
            <p className="hidden md:block text-[11px] text-slate-500 leading-none mt-0.5">
              Evidence-Grounded Multimodal Misinformation Detection
            </p>
          </div>
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-2 flex-shrink-0">

          {/* Team */}
          <div className="relative group">
            <button className="flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-transparent hover:border-slate-700 transition">
              <Users size={13} />
              <span className="hidden sm:inline">Team</span>
            </button>
            <div className="absolute right-0 top-10 w-60 glass-bright rounded-xl shadow-2xl p-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 z-50 text-xs">
              <p className="text-slate-300 font-semibold pb-2 mb-2 border-b border-slate-800">IMD Project Team</p>
              <ul className="space-y-1.5 text-slate-400">
                {[
                  ['Rishabh Raj', 'NLP & Backend'],
                  ['Darsh Goswami', 'Architecture & Research'],
                  ['Disha Sinha', 'Computer Vision'],
                  ['Dhruv Kumar', 'Evidence Verification'],
                ].map(([name, role]) => (
                  <li key={name}><span className="text-slate-200 font-medium">{name}</span><br/><span className="text-[11px]">{role}</span></li>
                ))}
              </ul>
            </div>
          </div>

          <button
            onClick={onBenchmark}
            className="flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-transparent hover:border-slate-700 transition"
          >
            <BarChart2 size={13} className="text-indigo-400" />
            <span className="hidden sm:inline">Benchmarks</span>
          </button>

          <button
            onClick={onAudit}
            className="flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-transparent hover:border-slate-700 transition"
          >
            <Database size={13} className="text-emerald-400" />
            <span className="hidden sm:inline">Data Audit</span>
          </button>

          {/* Status */}
          <div className="flex items-center gap-1.5 h-8 px-2.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px]">
            {apiStatus === 'online'
              ? <><Wifi size={11} className="text-emerald-400" /><span className="text-emerald-400 font-mono">Online</span></>
              : <><WifiOff size={11} className="text-slate-500" /><span className="text-slate-500 font-mono">Offline</span></>
            }
          </div>
        </div>
      </div>
    </nav>
  );
}
