/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useBoard } from '../context/BoardContext';
import { 
  BarChart3, 
  Flame, 
  Database,
  Briefcase,
  AlertTriangle,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { COLUMNS } from '../types';

export default function AnalyticsStats() {
  const { tasks } = useBoard();

  // 1. Calculations
  const totalTasks = tasks.length;
  const p0Count = tasks.filter(t => t.priority === 'P0').length;
  const p1Count = tasks.filter(t => t.priority === 'P1').length;
  const p2Count = tasks.filter(t => t.priority === 'P2').length;

  // Find column with most tasks (bottleneck tracker)
  let maxColumn: { name: string; count: number } = { name: 'None', count: 0 };
  const columnCounts = COLUMNS.reduce((acc, col) => {
    const count = tasks.filter(t => t.status === col.id).length;
    acc[col.id] = count;
    // We ignore 'Published' and 'Backlog' for functional bottleneck metrics
    if (col.id !== 'Published' && col.id !== 'Backlog' && count > maxColumn.count) {
      maxColumn = { name: col.label, count };
    }
    return acc;
  }, {} as Record<string, number>);

  // Data source metrics
  const sourceCounts = tasks.reduce((acc, t) => {
    acc[t.dataSource] = (acc[t.dataSource] || 0) + 1;
    return acc;
  }, { BigQuery: 0, API: 0, CSV: 0, Other: 0 } as Record<string, number>);

  // Pipeline integration vs report distribution
  const pipelineCount = tasks.filter(t => t.tags.includes('#pipeline') || t.tags.includes('#dbt') || t.tags.includes('#automation')).length;
  const reportingCount = tasks.filter(t => t.tags.includes('#dashboard') || t.tags.includes('#executive-report') || t.tags.includes('#ad-hoc')).length;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-blue-600" />
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            Project Metrics
          </h3>
        </div>
        <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 bg-slate-100 border border-slate-200 rounded-md text-slate-500 font-mono">
          Sync Live
        </span>
      </div>

      {/* Primary Big KPI Numbers - Bento Grid block style */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col justify-between">
          <div className="text-2xl font-bold tracking-tight text-slate-900 font-mono" id="stats-total-tickets">
            {totalTasks}
          </div>
          <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wide mt-1">
            Active Tasks
          </div>
        </div>
        <div className={`p-4 rounded-xl border flex flex-col justify-between transition-colors ${p0Count > 0 ? 'bg-rose-50/50 border-rose-100' : 'bg-slate-50 border-slate-100'}`}>
          <div className="flex items-center justify-between">
            <span className={`text-2xl font-bold font-mono tracking-tight ${p0Count > 0 ? 'text-rose-600' : 'text-slate-900'}`} id="stats-p0-count">
              {p0Count}
            </span>
            {p0Count > 0 && <Flame className="w-4 h-4 text-rose-500 animate-pulse" />}
          </div>
          <div className={`text-[10px] uppercase font-bold tracking-wide mt-1 ${p0Count > 0 ? 'text-rose-500' : 'text-slate-400'}`}>
            P0 Criticals
          </div>
        </div>
      </div>

      {/* Sprint progress meter */}
      <div className="space-y-2 pt-2 border-t border-slate-100">
        <div className="flex justify-between text-xs font-bold uppercase tracking-wide text-slate-450">
          <span className="text-slate-400">Sprint Progress</span>
          <span className="text-blue-500">
            {totalTasks > 0 ? Math.round(((totalTasks - p0Count) / totalTasks) * 100) : 100}%
          </span>
        </div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <div 
            className="h-full bg-blue-500 rounded-full transition-all duration-500" 
            style={{ width: `${totalTasks > 0 ? Math.round(((totalTasks - p0Count) / totalTasks) * 100) : 100}%` }}
          />
        </div>
      </div>

      {/* Bottleneck Alert */}
      {maxColumn.count > 1 ? (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 flex items-start gap-2.5">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="text-[10px] font-bold text-amber-800 uppercase tracking-widest block font-sans">
              Workflow Bottleneck
            </span>
            <p className="text-xs text-amber-700/90 mt-1 leading-snug">
              Column <strong className="underline">{maxColumn.name}</strong> holds <strong>{maxColumn.count}</strong> items. Consider reassigning resources to cleaning/validation.
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3.5 flex items-start gap-2.5">
          <TrendingDown className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-widest block font-sans">
              Optimal Flow
            </span>
            <p className="text-xs text-emerald-700/90 mt-1 leading-snug">
              Analytics queue load is perfectly distributed. No pipeline bottlenecks found.
            </p>
          </div>
        </div>
      )}

      {/* Data Source Composition (Horizontal Custom Chart) */}
      <div className="space-y-3 pt-2 border-t border-slate-100">
        <span className="text-xs font-bold text-slate-400 font-sans tracking-widest uppercase flex items-center gap-1.5">
          <Database className="w-4 h-4 text-slate-400" />
          Source Breakdown
        </span>
        <div className="space-y-2.5">
          {Object.entries(sourceCounts).map(([source, count]) => {
            const countNum = count as number;
            const perc = totalTasks > 0 ? (countNum / totalTasks) * 105 : 0; // standard custom scaling if wanted, or countNum / totalTasks * 100
            const actualPerc = Math.min(100, perc); // bounding to 100% max
            const barColors: Record<string, string> = {
              BigQuery: 'bg-blue-600',
              API: 'bg-emerald-500',
              CSV: 'bg-amber-500',
              Other: 'bg-slate-400'
            };
            return (
              <div key={source} className="space-y-1">
                <div className="flex justify-between items-center text-xs font-medium">
                  <span className="text-slate-600 font-mono font-bold text-[11px]">{source}</span>
                  <span className="text-slate-900 font-bold text-[11px]">{count} ({totalTasks > 0 ? Math.round((countNum / totalTasks) * 100) : 0}%)</span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${barColors[source] || 'bg-slate-500'} transition-all duration-500`}
                    style={{ width: `${actualPerc}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Task Categorization Index */}
      <div className="space-y-3 pt-4 border-t border-slate-100">
        <span className="text-xs font-bold text-slate-400 font-sans tracking-widest uppercase flex items-center gap-1.5">
          <Briefcase className="w-4 h-4 text-slate-400" />
          Delivery Categories
        </span>
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-slate-50 border border-slate-100 p-2.5 rounded-xl text-center">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wide block">Pipeline/DBT</span>
            <span className="text-lg font-extrabold text-blue-600 font-mono mt-0.5 block">{pipelineCount}</span>
          </div>
          <div className="bg-slate-50 border border-slate-100 p-2.5 rounded-xl text-center">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wide block">BI/Reports</span>
            <span className="text-lg font-extrabold text-blue-600 font-mono mt-0.5 block">{reportingCount}</span>
          </div>
        </div>
      </div>

    </div>
  );
}
