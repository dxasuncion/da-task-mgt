/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useBoard } from '../context/BoardContext';
import { 
  Activity, 
  MessageSquareCode, 
  AlertTriangle, 
  Users, 
  Check, 
  Sparkles,
  RefreshCw
} from 'lucide-react';

export default function ActivitySidebar() {
  const { activityLogs, isSimulatorActive, simulateColleagueAction } = useBoard();

  // Highlight count of conflicts
  const conflictCount = activityLogs.filter(log => log.type === 'conflict').length;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4 flex flex-col h-[520px] max-h-[520px]">
      
      {/* Activity Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-blue-600 animate-pulse" />
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              Live Sync Stream
            </h3>
            <p className="text-[10px] text-slate-400 font-medium">Collaborator action log</p>
          </div>
        </div>
        
        {/* Connection status tag */}
        <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-100 font-mono">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
          ONLINE
        </span>
      </div>

      {/* Simulator Quick Help */}
      <p className="text-[11px] text-slate-500 bg-slate-50 border border-slate-100 p-2.5 rounded-lg leading-relaxed">
        <strong>Demo Note:</strong> The simulated colleague logs updates every ~18 seconds to highlight live-synchronization, presence states, and concurrency conflict resolution.
      </p>

      {/* Conflict Alarm indicator */}
      {conflictCount > 0 && (
        <div className="bg-rose-50 border border-rose-200 rounded-lg p-2.5 flex items-center gap-2 text-rose-700 animate-pulse">
          <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
          <span className="text-[10px] sm:text-xs font-semibold font-mono">
            {conflictCount} concurrent save conflicts resolved!
          </span>
        </div>
      )}

      {/* Logs Scroll container */}
      <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar space-y-3" id="activity-log-container">
        {activityLogs.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-4">
            <Users className="w-8 h-8 text-slate-300 mb-2" />
            <span className="text-xs text-slate-400">Awaiting sync stream events...</span>
          </div>
        ) : (
          activityLogs.map((log) => {
            const isMove = log.type === 'move';
            const isConflict = log.type === 'conflict';
            const isWarning = log.type === 'warning';
            
            let badgeStyle = "bg-slate-100 text-slate-600";
            if (isMove) badgeStyle = "bg-blue-50 text-blue-700 border border-blue-100";
            if (isConflict) badgeStyle = "bg-rose-50 text-rose-700 border border-rose-100 font-bold";
            if (isWarning) badgeStyle = "bg-amber-50 text-amber-700 border border-amber-100";

            return (
              <div 
                key={log.id} 
                className={`p-2.5 rounded-lg text-xs leading-normal border transition-transform duration-200 hover:scale-[1.01] ${
                  isConflict 
                    ? 'bg-rose-50/30 border-rose-200' 
                    : 'bg-white border-slate-100 shadow-sm'
                }`}
              >
                {/* Log Header */}
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="font-bold text-slate-700 flex items-center gap-1">
                    {log.user.name} 
                    <span className="text-[9px] text-slate-400 font-normal">({log.user.role})</span>
                  </span>
                  <span className="text-[9px] text-slate-400 font-mono">
                    {new Date(log.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                </div>

                {/* Log text content */}
                <div className="text-slate-600 font-sans break-words mt-1">
                  {isConflict ? (
                    <span className="text-rose-700">
                      <strong>Stale Write Rejected:</strong> {log.text}
                    </span>
                  ) : (
                    log.text
                  )}
                </div>

                {/* Log metadata stamp */}
                <div className="flex items-center justify-between mt-1.5 pt-1.5 border-t border-slate-100">
                  <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono ${badgeStyle}`}>
                    {log.type.toUpperCase()}
                  </span>
                  
                  {isConflict && (
                    <span className="text-[9px] text-emerald-600 font-semibold flex items-center gap-0.5 font-mono">
                      <Check className="w-3 h-3" /> Auto Resolved v1
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Manual generator action button */}
      <button
        id="manual-sim-event-btn"
        onClick={simulateColleagueAction}
        className="w-full flex items-center justify-center gap-1.5 text-xs text-blue-700 font-bold bg-blue-50 hover:bg-blue-100 border border-blue-100 py-2 rounded-xl cursor-pointer transition-colors"
      >
        <Sparkles className="w-3.5 h-3.5 font-bold" />
        Trigger Random Colleague Event
      </button>
    </div>
  );
}
