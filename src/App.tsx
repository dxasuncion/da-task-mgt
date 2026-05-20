/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BoardProvider, useBoard } from './context/BoardContext';
import Header from './components/Header';
import KanbanBoard from './components/KanbanBoard';
import AnalyticsStats from './components/AnalyticsStats';
import ActivitySidebar from './components/ActivitySidebar';
import { Database, X } from 'lucide-react';

function MainWorkspace() {
  const { isMetricsOpen, setIsMetricsOpen } = useBoard();

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans flex flex-col antialiased select-none">
      
      {/* Core Header */}
      <Header />

      {/* Global Dashboard Workspace */}
      <main className="flex-1 w-full max-w-[1800px] mx-auto p-4 sm:p-6 space-y-5">
        
        {/* Quick Helper Bar as a polished Bento block */}
        <div className="bg-indigo-600 rounded-2xl p-5 shadow-lg shadow-indigo-100 flex flex-col md:flex-row md:items-center justify-between gap-4 text-white">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
              </span>
              <h2 className="text-[10px] font-extrabold tracking-wider text-white/90 uppercase font-mono">
                Data Operations Desk
              </h2>
            </div>
            <p className="text-sm font-semibold leading-snug text-white">
              Drag and drop tickets between core pipeline columns. Double-click or open tickets to inspect.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono text-white/90">
            <span className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg py-1 px-3">
              🛡️ Role Matrices Enabled
            </span>
            <span className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg py-1 px-3">
              🗄️ Standard Cache v2
            </span>
          </div>
        </div>

        {/* Board taking up full screen space for columns */}
        <section aria-label="Kanban task board space" className="w-full">
          <KanbanBoard />
        </section>

      </main>
      
      {/* Slide-out Metrics Drawer Panel */}
      {isMetricsOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden" id="metrics-drawer-root" role="dialog" aria-modal="true">
          {/* Backdrop Blur */}
          <div 
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity" 
            onClick={() => setIsMetricsOpen(false)}
            id="metrics-drawer-backdrop"
          />
          
          {/* Slide-out Sheet Core Container */}
          <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-md bg-white border-l border-slate-200 shadow-2xl flex flex-col h-full transform transition-all duration-300 ease-out">
              
              {/* Drawer Header */}
              <div className="px-5 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Database className="w-4.5 h-4.5 text-indigo-600" />
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest font-mono">
                    Workspace Metrics
                  </h3>
                </div>
                <button
                  id="close-metrics-drawer-btn"
                  onClick={() => setIsMetricsOpen(false)}
                  className="p-1 px-2.5 bg-slate-100 hover:bg-slate-200 active:scale-95 transition-all text-slate-500 hover:text-slate-800 rounded-md text-[11px] font-mono font-bold flex items-center gap-1 cursor-pointer"
                >
                  <span>Close</span>
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              
              {/* Drawer Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar bg-[#fbfcfd]">
                <AnalyticsStats />
                <ActivitySidebar />
                
                {/* Pro Feature Bento Upgrade Box */}
                <div className="bg-indigo-600 rounded-2xl p-5 shadow-lg shadow-indigo-100 flex flex-col justify-end h-40 text-white hover:scale-[1.01] transition-all">
                  <p className="text-white/80 text-[10px] font-bold uppercase tracking-wider mb-1">Bento Core Upgrade</p>
                  <p className="text-white font-bold text-sm leading-snug mb-3 text-white">Invite your analytics team to collaborate in real-time.</p>
                  <a 
                    href="#user-auth-switcher"
                    className="bg-white text-indigo-600 py-2 rounded-xl text-xs font-extrabold uppercase tracking-widest cursor-pointer shadow-sm active:scale-95 transition-all text-center block"
                    onClick={() => setIsMetricsOpen(false)}
                  >
                    Workspace Active
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer info - strictly human label and low telemetry */}
      <footer className="bg-white border-t border-slate-200 py-3.5 px-6 mt-8">
        <div className="max-w-[1800px] mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between text-[11px] text-slate-400 font-mono gap-1">
          <span>Analytics Kanban Board &copy; {new Date().getFullYear()}</span>
          <span>Client State: localStorage sync offline cache fallback ready</span>
        </div>
      </footer>

    </div>
  );
}

export default function App() {
  return (
    <BoardProvider>
      <MainWorkspace />
    </BoardProvider>
  );
}
