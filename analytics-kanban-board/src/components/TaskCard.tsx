/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Task, User, MOCK_USERS } from '../types';
import { useBoard } from '../context/BoardContext';
import { 
  Database, 
  ExternalLink, 
  Calendar, 
  Layers, 
  AlertTriangle,
  Lock,
  ChevronRight,
  CheckCircle2
} from 'lucide-react';

interface TaskCardProps {
  key?: React.Key;
  task: Task;
  onSelect: (task: Task) => void;
}

export default function TaskCard({ task, onSelect }: TaskCardProps) {
  const { currentUser, presence, updateTask, viewDensity } = useBoard();
  const [isHovered, setIsHovered] = useState(false);

  // 1. Map Priority Styling
  const priorityStyles = {
    P0: { bg: 'bg-rose-50 text-rose-700 border-rose-100', dot: 'bg-rose-500', label: 'P0 Critical' },
    P1: { bg: 'bg-amber-50 text-amber-700 border-amber-100', dot: 'bg-amber-500', label: 'P1 High' },
    P2: { bg: 'bg-slate-50 text-slate-600 border-slate-100', dot: 'bg-slate-400', label: 'P2 Normal' }
  };

  const priorityColor = priorityStyles[task.priority] || priorityStyles.P2;

  // 2. Map Data Sources Icons / Styling
  const sourceIcons = {
    BigQuery: <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 py-0.5 px-2 rounded flex items-center gap-1"><Database className="w-3 h-3 text-indigo-600" /> BQ</span>,
    API: <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 py-0.5 px-2 rounded flex items-center gap-1"><Layers className="w-3 h-3 text-emerald-600" /> API</span>,
    CSV: <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-100 py-0.5 px-2 rounded flex items-center gap-1"><Database className="w-3 h-3 text-amber-600" /> CSV</span>,
    Other: <span className="text-[10px] font-bold text-slate-600 bg-slate-50 border border-slate-100 py-0.5 px-2 rounded flex items-center gap-1"><Layers className="w-3 h-3 text-slate-500" /> Other</span>
  };

  // 3. Find assignee User object
  const assigneeUser = task.assigneeId ? MOCK_USERS.find(u => u.id === task.assigneeId) : null;

  // 4. Find ANY active collaborator viewing or editing research on this card CURRENTLY
  const activeCollaborators = presence.filter(p => p.taskId === task.id && p.userId !== currentUser.id);

  // 5. Card Column Aging Calculator
  const getCardColumnAgeInDays = () => {
    if (!task.statusStartedAt) return 0;
    const diffMs = Date.now() - task.statusStartedAt;
    const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));
    return diffDays;
  };

  const isStale = ['Backlog', 'Published'].indexOf(task.status) === -1 && getCardColumnAgeInDays() >= 3;

  // 6. Native HTML5 Drag events
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', task.id);
    e.dataTransfer.effectAllowed = 'move';
    const dragEl = e.currentTarget as HTMLElement;
    setTimeout(() => {
      dragEl.style.opacity = '0.35';
    }, 0);
  };

  const handleDragEnd = (e: React.DragEvent) => {
    const dragEl = e.currentTarget as HTMLElement;
    dragEl.style.opacity = '1';
  };

  // Due date warnings
  const getDueDateLabel = () => {
    if (!task.dueDate) return null;
    const date = new Date(task.dueDate);
    const today = new Date();
    today.setHours(0,0,0,0);
    const isOverdue = date < today && task.status !== 'Published';

    return (
      <span className={`text-[10px] font-mono font-medium flex items-center gap-1 ${isOverdue ? 'text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-100 animate-pulse' : 'text-slate-500'}`}>
        <Calendar className="w-3 h-3" />
        {task.dueDate} {isOverdue ? '[OVERDUE]' : ''}
      </span>
    );
  };

  // Permission badges
  const hasEditPermission = !task.assigneeId || task.assigneeId === currentUser.id || currentUser.isAdmin;

  // Interactive Checklist Toggler directly on Card
  const handleToggleChecklistItem = (itemId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Shield card selection on checkbox ticks
    if (!task.checklist) return;
    
    const updatedChecklist = task.checklist.map(item => 
      item.id === itemId ? { ...item, isDone: !item.isDone } : item
    );

    updateTask(task.id, {
      checklist: updatedChecklist,
      updatedAt: Date.now()
    });
  };

  // === COMPACT VIEW ROW ===
  if (viewDensity === 'compact') {
    return (
      <div
        id={`card-${task.id}`}
        draggable
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onClick={() => onSelect(task)}
        className={`group relative bg-white border rounded-xl p-2.5 py-2 hover:bg-slate-50 hover:border-blue-400 shadow-sm transition-all duration-200 cursor-grab active:cursor-grabbing select-none flex items-center justify-between gap-3 ${
          isStale ? 'border-amber-300 bg-amber-50/20' : 'border-slate-200/80'
        } ${activeCollaborators.length > 0 ? 'ring-2 ring-blue-500 ring-offset-1' : ''} ${
          task.status === 'Published' ? 'opacity-70 hover:opacity-100' : ''
        }`}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {/* Priority circle dot indicator */}
          <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${priorityColor.dot}`} title={`${priorityColor.label} - click ticket to expand`} />
          
          {/* Title and indicators */}
          <div className="flex items-center gap-2 min-w-0">
            <h4 className="text-xs font-bold text-slate-800 leading-normal truncate group-hover:text-blue-600 transition-colors">
              {task.title}
            </h4>
            {isStale && (
              <span className="shrink-0 flex text-amber-700" title="STALE: Lingering in-stage > 3 days">
                <AlertTriangle className="w-3 h-3" />
              </span>
            )}
            {task.checklist && task.checklist.length > 0 && (
              <span className="text-[9px] font-mono text-slate-400 select-none bg-slate-100 px-1 rounded shrink-0" title="Checklist done count">
                {task.checklist.filter(c => c.isDone).length}/{task.checklist.length}
              </span>
            )}
          </div>
        </div>

        {/* User initials bubble and metadata */}
        <div className="flex items-center gap-2 shrink-0">
          {activeCollaborators.length > 0 && (
            <span className="bg-blue-600 text-white rounded px-1.5 py-0.2 text-[8px] font-bold font-mono uppercase animate-pulse">
              LIVE
            </span>
          )}
          {assigneeUser ? (
            <div 
              className={`w-5.5 h-5.5 rounded-full flex items-center justify-center text-[8px] font-black ring-1 ${assigneeUser.color}`}
              title={`Assignee: ${assigneeUser.name}`}
            >
              {assigneeUser.avatar}
            </div>
          ) : (
            <div 
              className="w-5.5 h-5.5 rounded-full bg-slate-50 border border-dashed border-slate-300 flex items-center justify-center text-[7.5px] text-slate-400 font-bold"
              title="Unassigned Backlog"
            >
              N/A
            </div>
          )}
        </div>
      </div>
    );
  }

  // === DETAILED VIEW GRAPHIC CARD ===
  return (
    <div
      id={`card-${task.id}`}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onSelect(task)}
      className={`group relative bg-white border rounded-2xl p-4 shadow-sm hover:shadow-md transition-all duration-150 cursor-grab active:cursor-grabbing select-none ${
        isStale 
          ? 'border-amber-400 shadow-sm shadow-amber-50/50 bg-amber-50/15 hover:bg-amber-50/25' 
          : 'border-slate-200 hover:border-blue-400'
      } ${
        activeCollaborators.length > 0 ? 'ring-2 ring-blue-500/80 ring-offset-1' : ''
      } ${task.status === 'Published' ? 'opacity-70 hover:opacity-100' : ''}`}
    >
      
      {/* 1. Real-time Presence Badge Alert */}
      {activeCollaborators.length > 0 && (
        <div className="absolute -top-2.5 right-3 bg-blue-600 text-white text-[9px] font-extrabold px-2 py-0.5 rounded-full shadow-md flex items-center gap-1 animate-bounce uppercase tracking-wider font-mono z-10">
          <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
          {MOCK_USERS.find(u => u.id === activeCollaborators[0].userId)?.name.split(' ')[0] || 'Partner'} {activeCollaborators[0].action === 'editing' ? 'Editing' : 'Viewing'}
        </div>
      )}

      {/* 2. Top details row */}
      <div className="flex items-start justify-between gap-1.5 mb-2.5">
        
        {/* Core priority & card aging tags */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 ${priorityColor.bg}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${priorityColor.dot}`} />
            {priorityColor.label}
          </span>
          {isStale && (
            <span className="text-[9px] font-mono font-extrabold text-amber-800 bg-amber-100 border border-amber-300 py-0.5 px-2 rounded-full flex items-center gap-1 animate-pulse" title="Agile Card Aging Warning: This card has lingered in this stage for 3 or more working days. Possible pipeline roadblock detected!">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              STALE: {getCardColumnAgeInDays()} DAYS
            </span>
          )}
        </div>

        {/* Action icons shortcut */}
        <div className="flex items-center gap-1 text-slate-400">
          {!hasEditPermission && (
            <Lock className="w-3.5 h-3.5 text-slate-300" title="Permission alert - Read-Only" />
          )}
          {isHovered ? (
            <span className="text-[10px] font-semibold text-blue-600 flex items-center font-mono">
              {hasEditPermission ? 'EDIT' : 'VIEW'} <ChevronRight className="w-3 h-3" />
            </span>
          ) : (
            sourceIcons[task.dataSource]
          )}
        </div>
      </div>

      {/* 3. Title & description */}
      <div className="space-y-1">
        <h4 className="text-xs md:text-sm font-bold text-slate-900 leading-snug group-hover:text-blue-600 transition-colors">
          {task.title}
        </h4>
        {task.description && (
          <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed font-sans mt-0.5">
            {task.description}
          </p>
        )}
      </div>

      {/* 4. Multi-select Tags list */}
      {task.tags && task.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-3">
          {task.tags.map(tag => (
            <span 
              key={tag} 
              className="text-[9px] font-bold text-slate-500 bg-slate-100/70 border border-slate-200/50 px-2 py-0.5 rounded-full font-mono shrink-0"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* 5. Subtask Checklist Section (Interactive checkboxes directly on card) */}
      {task.checklist && task.checklist.length > 0 && (
        <div className="mt-3.5 space-y-1.5 border-t border-slate-100/70 pt-3">
          {/* Progress Tracker label */}
          <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
            <span className="font-bold uppercase tracking-wider text-slate-400/80">Checklist progress</span>
            <span className="font-bold bg-slate-100 px-1.5 py-0.2 rounded text-slate-500">
              {task.checklist.filter(c => c.isDone).length}/{task.checklist.length} Done
            </span>
          </div>

          {/* Checklist list */}
          <div className="space-y-1">
            {task.checklist.map(item => (
              <div 
                key={item.id}
                onClick={(e) => handleToggleChecklistItem(item.id, e)}
                className="flex items-center gap-1.5 text-[11px] text-slate-600 hover:text-slate-900 cursor-pointer p-0.5 rounded hover:bg-slate-50 transition-all select-none"
                title="Toggle checklist item status instantly"
              >
                <input 
                  type="checkbox"
                  checked={item.isDone}
                  readOnly // Safe controlled trigger purely mapped to onClick parent click bubble stop handles
                  className="w-3.5 h-3.5 rounded-xs border-slate-300 text-blue-600 focus:ring-0 cursor-pointer shrink-0"
                />
                <span className={`truncate ${item.isDone ? 'line-through text-slate-400' : 'font-medium text-slate-600'}`}>
                  {item.title}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. Custom footer row displaying Assignee avatar & due date indicator */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
        
        {/* Date tracker */}
        {getDueDateLabel() || <span className="text-[10px] text-slate-400 font-mono">No target date</span>}

        {/* Jira/Asana Link icon */}
        <div className="flex items-center gap-2">
          {task.ticketLink && (
            <a
              id={`ticket-${task.id}`}
              href={task.ticketLink}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()} // Stop modal from triggering
              className="p-1 hover:bg-slate-100 hover:text-blue-600 border border-slate-100 hover:border-slate-200 rounded-md transition-colors"
              title="Open external Asana/Jira ticket details"
            >
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </a>
          )}

          {/* User badge */}
          {assigneeUser ? (
            <div 
              className={`w-6.5 h-6.5 rounded-full flex items-center justify-center text-[10px] font-black ring-1 ${assigneeUser.color}`}
              title={`Assignee: ${assigneeUser.name} (${assigneeUser.role})`}
            >
              {assigneeUser.avatar}
            </div>
          ) : (
            <div 
              className="w-6.5 h-6.5 rounded-full bg-slate-100/95 border border-dashed border-slate-400 flex items-center justify-center text-[9px] font-bold text-slate-400"
              title="Unassigned ticket - Claim on Backlog"
            >
              N/A
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
