/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useBoard } from '../context/BoardContext';
import { 
  Database, 
  Search, 
  Flame, 
  Tag, 
  Users, 
  RefreshCcw, 
  Activity, 
  X,
  Sparkles,
  BarChart3
} from 'lucide-react';
import { AVAILABLE_TAGS } from '../types';

export default function Header() {
  const {
    users,
    currentUser,
    changeCurrentUser,
    isSimulatorActive,
    setSimulatorActive,
    simulateColleagueAction,
    searchQuery,
    setSearchQuery,
    filterPriority,
    setFilterPriority,
    filterAssignee,
    setFilterAssignee,
    filterTag,
    setFilterTag,
    filterDataSource,
    setFilterDataSource,
    clearFilters,
    viewDensity,
    setViewDensity,
    isMetricsOpen,
    setIsMetricsOpen
  } = useBoard();

  const hasActiveFilters = searchQuery || filterPriority || filterAssignee || filterTag || filterDataSource;

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 px-6 py-4 shadow-sm">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        
        {/* Title and Board Context info */}
        <div className="flex items-center gap-4">
          <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black text-lg shadow-sm" id="header-logo-icon">
            K
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-slate-900" id="main-board-title">
                Kanban.v2 <span className="text-slate-400 font-normal font-sans">Sandbox</span>
              </h1>
              <span className="text-[10px] font-extrabold px-2.5 py-0.5 bg-blue-50 text-blue-600 rounded-md border border-blue-100 uppercase tracking-wider font-mono">
                Live Core
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Engineered for BI pipelines, dbt staging, validation, and dashboard delivery analytics
            </p>
          </div>
        </div>

        {/* Dynamic Collaborative State and Simulator */}
        <div className="flex flex-wrap items-center gap-3">
          
          {/* View Density Switcher */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-full border border-slate-200 h-9" id="view-density-toggle-group">
            <button
              id="view-detailed-btn"
              type="button"
              onClick={() => setViewDensity('detailed')}
              className={`text-[10px] font-extrabold px-3 py-1.5 rounded-full transition-all cursor-pointer ${
                viewDensity === 'detailed'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Show checklists, tags, dates and description details"
            >
              Detailed
            </button>
            <button
              id="view-compact-btn"
              type="button"
              onClick={() => setViewDensity('compact')}
              className={`text-[10px] font-extrabold px-3 py-1.5 rounded-full transition-all cursor-pointer ${
                viewDensity === 'compact'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Minimal view showing only title, priority icon, and assignee avatar"
            >
              Compact
            </button>
          </div>

          {/* Active Classmate Switcher (Mock-Auth) */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-full p-1.5 px-4 h-9">
            <div className="flex items-center gap-1.5">
              <Users className="w-4 h-4 text-slate-400" />
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Identity:</span>
            </div>
            <select
              id="user-auth-switcher"
              value={currentUser.id}
              onChange={(e) => changeCurrentUser(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer pr-1"
            >
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.role}){u.isAdmin ? ' ★ Admin' : ''}
                </option>
              ))}
            </select>
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Session active" />
          </div>

          {/* Colleague Tick Simulator */}
          <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-full p-1.5 px-4 h-9">
            <div className="flex items-center gap-2">
              <Activity className={`w-4 h-4 ${isSimulatorActive ? 'text-blue-600 animate-pulse' : 'text-slate-400'}`} />
              <label htmlFor="simulator-toggle" className="text-xs font-bold text-slate-600 cursor-pointer select-none">
                Live Activity
              </label>
              <input 
                id="simulator-toggle"
                type="checkbox"
                checked={isSimulatorActive}
                onChange={(e) => setSimulatorActive(e.target.checked)}
                className="w-3.5 h-3.5 rounded-full border-slate-300 text-blue-600 focus:ring-blue-500"
              />
            </div>
            {isSimulatorActive && (
              <button
                id="force-simulation-btn"
                onClick={simulateColleagueAction}
                title="Force simulated colleague action instantly"
                className="ml-1 p-1 text-slate-400 hover:text-blue-600 hover:bg-white rounded transition-colors"
              >
                <RefreshCcw className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Project Metrics Drawer Toggle */}
          <button
            id="toggle-metrics-sidebar-btn"
            type="button"
            onClick={() => setIsMetricsOpen(!isMetricsOpen)}
            className={`flex items-center gap-2 px-4 h-9 rounded-full border text-xs font-bold transition-all cursor-pointer active:scale-95 ${
              isMetricsOpen 
                ? 'bg-indigo-600 hover:bg-indigo-700 border-indigo-600 text-white shadow-md shadow-indigo-100' 
                : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
            }`}
            title={isMetricsOpen ? "Close Project Metrics Drawer" : "Open Project Metrics Drawer"}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Metrics</span>
            <span className={`w-1.5 h-1.5 rounded-full ${isMetricsOpen ? 'bg-emerald-300' : 'bg-indigo-450'}`} />
          </button>

        </div>
      </div>

      {/* Filter and Search Layout Grid */}
      <div className="mt-4 pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 w-full xl:w-auto">
          
          {/* Search Query Bar */}
          <div className="relative w-full sm:w-60">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
            <input
              id="search-filter-input"
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="text-xs bg-slate-50 focus:bg-white border border-slate-200 rounded-full pl-9 pr-4 py-1.5 w-full focus:outline-none focus:ring-2 focus:ring-blue-500/15 transition-all font-medium text-slate-900 placeholder-slate-400"
            />
          </div>

          {/* Filter Priority */}
          <div className="flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-full px-3.5 py-1.5 text-xs text-slate-600 transition-colors">
            <Flame className="w-3.5 h-3.5 text-slate-400" />
            <select
              id="priority-filter-select"
              value={filterPriority || ''}
              onChange={(e) => setFilterPriority((e.target.value as any) || null)}
              className="bg-transparent font-bold text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="">Priority: All</option>
              <option value="P0">P0 Critical</option>
              <option value="P1">P1 High</option>
              <option value="P2">P2 Normal</option>
            </select>
          </div>

          {/* Filter Assignee */}
          <div className="flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-full px-3.5 py-1.5 text-xs text-slate-600 transition-colors">
            <Users className="w-3.5 h-3.5 text-slate-400" />
            <select
              id="assignee-filter-select"
              value={filterAssignee || ''}
              onChange={(e) => setFilterAssignee(e.target.value || null)}
              className="bg-transparent font-bold text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="">Assignee: All</option>
              <option value="unassigned">Unassigned Backlog</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>

          {/* Filter DataSource */}
          <div className="flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-full px-3.5 py-1.5 text-xs text-slate-600 transition-colors">
            <Database className="w-3.5 h-3.5 text-slate-400" />
            <select
              id="datasource-filter-select"
              value={filterDataSource || ''}
              onChange={(e) => setFilterDataSource((e.target.value as any) || null)}
              className="bg-transparent font-bold text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="">Source: All</option>
              <option value="BigQuery">BigQuery</option>
              <option value="API">API</option>
              <option value="CSV">CSV</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* Filter Tag */}
          <div className="flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-full px-3.5 py-1.5 text-xs text-slate-600 transition-colors">
            <Tag className="w-3.5 h-3.5 text-slate-400" />
            <select
              id="tag-filter-select"
              value={filterTag || ''}
              onChange={(e) => setFilterTag(e.target.value || null)}
              className="bg-transparent font-bold text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="">Tags: All</option>
              {AVAILABLE_TAGS.map((tag) => (
                <option key={tag} value={tag}>
                  {tag}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Clear Filters Callout */}
        {hasActiveFilters && (
          <button
            id="clear-filters-btn"
            onClick={clearFilters}
            className="flex items-center gap-1.5 text-xs text-rose-600 font-bold hover:bg-rose-50 border border-rose-200 rounded-full py-1.5 px-4 cursor-pointer transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            Reset Filters
          </button>
        )}
      </div>
    </header>
  );
}
