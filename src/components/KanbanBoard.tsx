/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useBoard } from '../context/BoardContext';
import { COLUMNS, Task, TaskStatus } from '../types';
import KanbanColumn from './KanbanColumn';
import TaskDialog from './TaskDialog';
import { ListFilter, X, Sparkles, CheckCircle2 } from 'lucide-react';

export default function KanbanBoard() {
  const { 
    tasks,
    searchQuery,
    filterPriority,
    filterAssignee,
    filterTag,
    filterDataSource,
    clearFilters
  } = useBoard();

  // 1. Dialog state
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [targetColumn, setTargetColumn] = useState<TaskStatus | undefined>(undefined);

  // 2. Filter logic
  const filteredTasks = tasks.filter((task) => {
    // A. Search Match
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const titleMatch = task.title.toLowerCase().includes(q);
      const descMatch = task.description?.toLowerCase().includes(q) || false;
      if (!titleMatch && !descMatch) return false;
    }

    // B. Priority Match
    if (filterPriority && task.priority !== filterPriority) {
      return false;
    }

    // C. Assignee Match
    if (filterAssignee) {
      if (filterAssignee === 'unassigned') {
        if (task.assigneeId !== null) return false;
      } else if (task.assigneeId !== filterAssignee) {
        return false;
      }
    }

    // D. Data Source Match
    if (filterDataSource && task.dataSource !== filterDataSource) {
      return false;
    }

    // E. Tag Match
    if (filterTag && !task.tags.includes(filterTag)) {
      return false;
    }

    return true;
  });

  // 3. Trigger modal for Create Task
  const handleOpenCreateDialog = (status: TaskStatus) => {
    setTargetColumn(status);
    setSelectedTask(null);
    setIsDialogOpen(true);
  };

  // 4. Trigger modal for Edit Task
  const handleOpenEditDialog = (task: Task) => {
    setSelectedTask(task);
    setIsDialogOpen(true);
  };

  // Check if board has any active filter filters
  const hasAppliedFilters = searchQuery || filterPriority || filterAssignee || filterTag || filterDataSource;

  return (
    <div className="space-y-4">
      
      {/* Mini Alert when search filter produces outcomes */}
      <div className="flex items-center justify-between bg-slate-100/70 border border-slate-200/80 px-4 py-2.5 rounded-2xl text-xs text-slate-600">
        <div className="flex items-center gap-2">
          <ListFilter className="w-4 h-4 text-slate-500" />
          <span>
            Showing <strong className="text-slate-900 font-mono">{filteredTasks.length}</strong> of{' '}
            <strong className="text-slate-950 font-mono">{tasks.length}</strong> loaded BI tasks.
          </span>
          {hasAppliedFilters && (
            <span className="bg-blue-50 border border-blue-100 text-blue-600 py-0.5 px-2 rounded-full font-semibold">
              (Filtered results active)
            </span>
          )}
        </div>

        <button
          id="board-primary-add-task-btn"
          onClick={() => handleOpenCreateDialog('Backlog')}
          className="bg-blue-600 hover:bg-blue-700 font-bold text-white text-[11px] py-1.5 px-3.5 rounded-xl flex items-center gap-1 shadow-sm transition-all cursor-pointer active:scale-95"
        >
          <Sparkles className="w-3.5 h-3.5" />
          New Analytics Ticket
        </button>
      </div>

      {/* Horizontal grid container for Kanban board columns */}
      <div className="flex items-start gap-4 overflow-x-auto pb-4 custom-scrollbar select-none" id="kanban-columns-container">
        {COLUMNS.map((col) => {
          const columnTasks = filteredTasks.filter((t) => t.status === col.id);
          return (
            <KanbanColumn
              key={col.id}
              id={col.id}
              label={col.label}
              color={col.color}
              description={col.description}
              tasks={columnTasks}
              onSelectCard={handleOpenEditDialog}
              onAddTaskBtn={handleOpenCreateDialog}
            />
          );
        })}
      </div>

      {/* Complete Task Dialog Modal */}
      {isDialogOpen && (
        <TaskDialog
          task={selectedTask}
          initialColumn={targetColumn}
          onClose={() => setIsDialogOpen(false)}
        />
      )}
    </div>
  );
}
