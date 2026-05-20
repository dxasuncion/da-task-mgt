/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Task, TaskStatus } from '../types';
import { useBoard } from '../context/BoardContext';
import TaskCard from './TaskCard';
import { Plus, HelpCircle, AlertTriangle } from 'lucide-react';

interface KanbanColumnProps {
  key?: React.Key;
  id: TaskStatus;
  label: string;
  color: string;
  description: string;
  tasks: Task[];
  onSelectCard: (task: Task) => void;
  onAddTaskBtn: (status: TaskStatus) => void;
}

// 1. Configurable Workflow Limits configuration
const WIP_LIMITS: Record<string, number> = {
  'Data Pull': 3,
  'Cleaning': 2,
  'Analysis': 2,
  'Review': 2
};

export default function KanbanColumn({
  id,
  label,
  color,
  description,
  tasks,
  onSelectCard,
  onAddTaskBtn
}: KanbanColumnProps) {
  const { moveTask } = useBoard();
  const [isDragOver, setIsDragOver] = useState(false);

  // Determine WIP constraints
  const limit = WIP_LIMITS[id];
  const isWipExceeded = limit !== undefined && tasks.length > limit;

  // HTML5 Drag and Drop events
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (!isDragOver) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const taskId = e.dataTransfer.getData('text/plain');
    if (taskId) {
      moveTask(taskId, id);
    }
  };

  const dotColors: Record<string, string> = {
    'Backlog': 'bg-slate-350',
    'Data Pull': 'bg-blue-500',
    'Cleaning': 'bg-purple-500',
    'Analysis': 'bg-amber-500',
    'Review': 'bg-rose-500',
    'Published': 'bg-emerald-500'
  };

  const badgeStyles: Record<string, string> = {
    'Backlog': 'bg-slate-100 text-slate-500',
    'Data Pull': 'bg-blue-50 text-blue-600 border border-blue-100/50',
    'Cleaning': 'bg-purple-50 text-purple-600 border border-purple-100/50',
    'Analysis': 'bg-amber-50 text-amber-600 border border-amber-100/50',
    'Review': 'bg-rose-50 text-rose-600 border border-rose-100/50',
    'Published': 'bg-emerald-50 text-emerald-600 border border-emerald-100/50'
  };

  return (
    <div
      id={`column-${id.toLowerCase().replace(/\s+/g, '-')}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`flex flex-col rounded-2xl border p-4.5 min-w-[315px] sm:min-w-[330px] max-w-[370px] h-[78vh] flex-1 transition-all duration-200 ${
        isDragOver 
          ? 'bg-blue-50/40 border-blue-400 ring-2 ring-blue-400/20 shadow-md scale-[1.005]' 
          : isWipExceeded
            ? 'bg-rose-50/70 border-rose-200/90 shadow-sm shadow-rose-100/50'
            : 'bg-white border-slate-200 shadow-sm'
      }`}
    >
      
      {/* Column Header Details with WIP alerts */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5 flex-wrap max-w-[85%]">
          <span className={`w-2 h-2 rounded-full ${dotColors[id] || 'bg-slate-350'}`}></span>
          <h3 className="text-xs md:text-sm font-extrabold text-slate-800 font-sans tracking-tight">
            {label}
          </h3>
          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${badgeStyles[id] || 'bg-slate-100 text-slate-500'}`}>
            {tasks.length}
          </span>
          
          {/* Prominent Red WIP Limit exceeded label */}
          {isWipExceeded && (
            <span 
              className="text-[9px] font-bold tracking-tight bg-rose-100 border border-rose-300 text-rose-700 font-mono py-0.5 px-2 rounded-full animate-pulse shrink-0 flex items-center gap-1"
              title={`🚨 WIP Warning: Staged analytics count (${tasks.length}) is currently over the optimized workflow limit (${limit}). Staging buffer bottlenecks detected.`}
            >
              🚨 WIP Overflow ({tasks.length}/{limit})
            </span>
          )}
        </div>

        {/* Create task pre-loaded in this column status */}
        <button
          id={`add-task-btn-${id.toLowerCase().replace(/\s+/g, '-')}`}
          onClick={() => onAddTaskBtn(id)}
          className="p-1 hover:bg-slate-100 text-slate-400 hover:text-blue-600 rounded transition-colors cursor-pointer"
          title={`Add new task to ${label}`}
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Description tag for analyst stages */}
      <p className="text-[10px] text-slate-400 font-sans leading-relaxed mb-3 pb-2 border-b border-slate-100 flex items-center gap-1">
        <HelpCircle className="w-3.5 h-3.5 text-slate-300 shrink-0" />
        <span className="truncate">{description}</span>
      </p>

      {/* Tasks Scroll wrapper */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-3 custom-scrollbar" id={`tasks-list-${id.toLowerCase().replace(/\s+/g, '-')}`}>
        {tasks.length === 0 ? (
          <div className="h-44 border border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center text-center p-4 bg-slate-50/50">
            <span className="text-[10px] text-slate-300 font-bold font-sans uppercase tracking-wider">
              No tasks in stage
            </span>
            <button
              onClick={() => onAddTaskBtn(id)}
              className="mt-2 text-[10px] font-bold text-indigo-500 hover:text-indigo-700 underline focus:outline-none cursor-pointer font-mono"
            >
              [DRAFT TICKET]
            </button>
          </div>
        ) : (
          tasks.map((task) => (
            <TaskCard key={task.id} task={task} onSelect={onSelectCard} />
          ))
        )}
      </div>

    </div>
  );
}
