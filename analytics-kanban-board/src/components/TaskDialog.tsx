/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useBoard } from '../context/BoardContext';
import { Task, TaskStatus, AVAILABLE_TAGS } from '../types';
import { 
  X, 
  Database, 
  ExternalLink, 
  Calendar, 
  Flame, 
  Tag, 
  UserPlus, 
  ShieldAlert,
  Save,
  Trash2,
  Lock
} from 'lucide-react';

interface TaskDialogProps {
  task?: Task | null; // Null means we are creating a task
  initialColumn?: TaskStatus; // Prepopulated column if creating
  onClose: () => void;
}

export default function TaskDialog({ task, initialColumn, onClose }: TaskDialogProps) {
  const { 
    currentUser, 
    users, 
    createTask, 
    updateTask, 
    deleteTask,
    setPresence 
  } = useBoard();

  const isEditMode = !!task;

  // 1. Check Edit Permissions
  // "While anyone can move a card, only the designated Assignee or an Admin can edit the internal task fields."
  // If task is unassigned (assigneeId is null), any authenticated user can edit or assign it.
  const isUnassigned = isEditMode && !task?.assigneeId;
  const isAssignee = isEditMode && task?.assigneeId === currentUser.id;
  const isAdmin = currentUser.isAdmin;
  
  // Can edit if they are creating, if task is unassigned, if they are the assignee, or are admin
  const canEdit = !isEditMode || isUnassigned || isAssignee || isAdmin;

  // 2. Local Form States
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<TaskStatus>('Backlog');
  const [assigneeId, setAssigneeId] = useState<string | null>(null);
  const [dueDate, setDueDate] = useState<string>('');
  const [priority, setPriority] = useState<'P0' | 'P1' | 'P2'>('P2');
  const [dataSource, setDataSource] = useState<'BigQuery' | 'API' | 'CSV' | 'Other'>('BigQuery');
  const [ticketLink, setTicketLink] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [newCustomTag, setNewCustomTag] = useState('');
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  // V2 checklist local states
  const [checklist, setChecklist] = useState<{ id: string; title: string; isDone: boolean }[]>([]);
  const [newChecklistTitle, setNewChecklistTitle] = useState('');

  // 3. Populate form on edit
  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || '');
      setStatus(task.status);
      setAssigneeId(task.assigneeId);
      setDueDate(task.dueDate || '');
      setPriority(task.priority);
      setDataSource(task.dataSource);
      setTicketLink(task.ticketLink || '');
      setSelectedTags(task.tags || []);
      setChecklist(task.checklist || []);
    } else {
      setTitle('');
      setDescription('');
      setStatus(initialColumn || 'Backlog');
      setAssigneeId(null);
      setDueDate('');
      setPriority('P2');
      setDataSource('BigQuery');
      setTicketLink('');
      setSelectedTags([]);
      setChecklist([]);
    }
    setFormError('');
    setFormSuccess('');

    // Trigger viewing state presence for collaborators
    if (task) {
      setPresence(task.id, 'editing');
    }
    return () => {
      if (task) {
        setPresence(task.id, 'idle');
      }
    };
  }, [task, initialColumn, setPresence]);

  // Checklist handlers
  const handleModalToggleChecklistItem = (itemId: string) => {
    setChecklist(prev => prev.map(item => 
      item.id === itemId ? { ...item, isDone: !item.isDone } : item
    ));
  };

  const handleModalEditChecklistItemTitle = (itemId: string, newTitle: string) => {
    setChecklist(prev => prev.map(item => 
      item.id === itemId ? { ...item, title: newTitle } : item
    ));
  };

  const handleModalRemoveChecklistItem = (itemId: string) => {
    setChecklist(prev => prev.filter(item => item.id !== itemId));
  };

  const handleModalAddChecklistItem = () => {
    if (!newChecklistTitle.trim()) return;
    setChecklist(prev => [...prev, {
      id: `ch-mod-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      title: newChecklistTitle.trim(),
      isDone: false
    }]);
    setNewChecklistTitle('');
  };

  // Handle self assignment
  const handleSelfAssign = () => {
    if (!canEdit) return;
    setAssigneeId(currentUser.id);
  };

  // Toggle Tag inclusion
  const handleTagToggle = (tag: string) => {
    if (!canEdit) return;
    if (selectedTags.includes(tag)) {
      setSelectedTags(prev => prev.filter(t => t !== tag));
    } else {
      setSelectedTags(prev => [...prev, tag]);
    }
  };

  // Add custom tag
  const handleAddCustomTag = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit || !newCustomTag.trim()) return;
    
    let formattedTag = newCustomTag.trim();
    if (!formattedTag.startsWith('#')) {
      formattedTag = '#' + formattedTag;
    }
    formattedTag = formattedTag.toLowerCase().replace(/\s+/g, '-');
    
    if (!selectedTags.includes(formattedTag)) {
      setSelectedTags(prev => [...prev, formattedTag]);
    }
    setNewCustomTag('');
  };

  // Form Submit Handler
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    // Title validation
    if (!title.trim()) {
      setFormError('A descriptive Task Title is required.');
      return;
    }

    // URL validation if external ticket link is provided
    if (ticketLink && !/^https?:\/\/[^\s$.?#].[^\s]*$/i.test(ticketLink)) {
      setFormError('External ticket must be a valid complete URL (including http:// or https://)');
      return;
    }

    const payload = {
      title: title.trim(),
      description: description.trim(),
      status,
      assigneeId,
      dueDate: dueDate || null,
      priority,
      dataSource,
      ticketLink: ticketLink.trim() || undefined,
      tags: selectedTags,
      checklist
    };

    if (isEditMode && task) {
      // Execute Context update which enforces permissions at code execution is well
      const res = updateTask(task.id, payload);
      if (res.success) {
        setFormSuccess('Metadata saved successfully!');
        setTimeout(() => {
          onClose();
        }, 800);
      } else {
        setFormError(res.error || 'Unexpected permission or synchronization failure.');
      }
    } else {
      createTask(payload);
      onClose();
    }
  };

  // Handle delete
  const handleDelete = () => {
    if (task && window.confirm('Are you absolutely sure you want to delete/archive this analytics task ticket?')) {
      deleteTask(task.id);
      onClose();
    }
  };

  // Find assigned user object
  const currentAssigneeUser = assigneeId ? users.find(u => u.id === assigneeId) : null;

  return (
    <div className="fixed inset-0 bg-slate-900/65 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in" id="dialog-overlay">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold tracking-wider uppercase bg-indigo-50 text-indigo-700 py-1 px-2.5 rounded border border-indigo-100/80">
              {isEditMode ? 'Edit Task Info' : 'Draft New Analytics Request'}
            </span>
            {isEditMode && !canEdit && (
              <span className="flex items-center gap-1 text-xs text-amber-700 font-semibold bg-amber-50 rounded px-2.5 py-1 border border-amber-200">
                <Lock className="w-3.5 h-3.5" /> Read-Only
              </span>
            )}
          </div>
          <button
            id="close-dialog-btn"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content Scroll */}
        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar space-y-5">
          
          {/* Permission Guard Alert Banner */}
          {isEditMode && !canEdit && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2.5 text-amber-800 animate-pulse">
              <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs leading-normal">
                <strong>Read-Only Mode:</strong> Only the assigned user (
                <span className="font-bold underline">
                  {task ? users.find(u => u.id === task.assigneeId)?.name : 'N/A'}
                </span>
                ) or an Admin (<span className="font-bold">Sarah Jenkins</span>) can modify priority, links, or metadata fields for this task ticket.
              </div>
            </div>
          )}

          {/* Form Alert Notifications */}
          {formError && (
            <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 text-semibold text-xs text-rose-800" id="dialog-error-alert">
              {formError}
            </div>
          )}
          {formSuccess && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-semibold text-xs text-emerald-800" id="dialog-success-alert">
              {formSuccess}
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-4">
            
            {/* Title Input */}
            <div>
              <label htmlFor="task-title-input" className="block text-xs font-bold text-slate-700 uppercase font-mono tracking-wider mb-1.5 ">
                Task Title *
              </label>
              <input
                id="task-title-input"
                type="text"
                placeholder="e.g. Refresh dbt materialization tables for sales dashboards"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={!canEdit}
                className="w-full text-sm bg-slate-50 disabled:bg-slate-100 disabled:text-slate-500 border border-slate-200 rounded-lg px-3.5 py-2.5 outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white focus:border-indigo-500 font-sans font-medium"
              />
            </div>

            {/* Description Area */}
            <div>
              <label htmlFor="task-desc-input" className="block text-xs font-bold text-slate-700 uppercase font-mono tracking-wider mb-1.5">
                Detailed Context & Specifications
              </label>
              <textarea
                id="task-desc-input"
                placeholder="Include schemas, datasets, pipeline names, target stakeholders, and SQL extraction guidelines..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={!canEdit}
                rows={4}
                className="w-full text-xs text-slate-700 bg-slate-50 disabled:bg-slate-100 disabled:text-slate-500 border border-slate-200 rounded-lg p-3 outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white focus:border-indigo-500 font-sans leading-relaxed"
              />
            </div>

            {/* Grid for core variables */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Kanban Column Status */}
              <div>
                <label htmlFor="task-status-select" className="block text-xs font-bold text-slate-700 uppercase font-mono tracking-wider mb-1.5">
                  Workflow Board Stage
                </label>
                <select
                  id="task-status-select"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as TaskStatus)}
                  disabled={!canEdit}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white focus:border-indigo-500 font-semibold cursor-pointer"
                >
                  <option value="Backlog">Backlog (Raw requests)</option>
                  <option value="Data Pull">Data Pull (Queries/DB)</option>
                  <option value="Cleaning">Cleaning (dbt profiling)</option>
                  <option value="Analysis">Analysis (BI Modeling)</option>
                  <option value="Review">Review (QA validation)</option>
                  <option value="Published">Published (Live dashboards)</option>
                </select>
              </div>

              {/* Assignee Selection */}
              <div>
                <label htmlFor="task-assignee-select" className="block text-xs font-bold text-slate-700 uppercase font-mono tracking-wider mb-1.5">
                  Designated Assignee
                </label>
                <div className="flex gap-1.5">
                  <select
                    id="task-assignee-select"
                    value={assigneeId || ''}
                    onChange={(e) => setAssigneeId(e.target.value || null)}
                    disabled={!canEdit}
                    className="flex-1 text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white focus:border-indigo-500 font-semibold cursor-pointer"
                  >
                    <option value="">Unassigned (Open Backlog)</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.role})
                      </option>
                    ))}
                  </select>
                  {canEdit && !assigneeId && (
                    <button
                      type="button"
                      onClick={handleSelfAssign}
                      className="p-2.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors cursor-pointer text-xs font-bold flex items-center gap-1 shrink-0"
                      title="Instantly assign this task to yourself"
                    >
                      <UserPlus className="w-3.5 h-3.5" /> Me
                    </button>
                  )}
                </div>
              </div>

              {/* Priority */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase font-mono tracking-wider mb-1.5">
                  Priority Rating
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['P2', 'P1', 'P0'] as const).map((p) => {
                    const labelMap = { P2: 'P2 Normal', P1: 'P1 High', P0: 'P0 Critical' };
                    const activeColor = {
                      P2: 'bg-slate-100 border-slate-300 text-slate-800 shadow-sm font-semibold',
                      P1: 'bg-amber-500 text-white border-amber-500 font-bold',
                      P0: 'bg-rose-600 text-white border-rose-600 font-bold'
                    };
                    const inactiveColor = "bg-white border-slate-200 text-slate-600 hover:bg-slate-50";

                    return (
                      <button
                        key={p}
                        type="button"
                        disabled={!canEdit}
                        onClick={() => setPriority(p)}
                        className={`py-2 px-1 text-[11px] border rounded-lg text-center transition-all cursor-pointer ${
                          priority === p ? activeColor[p] : inactiveColor
                        }`}
                      >
                        {labelMap[p]}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Data Source Category (Native Analytics Field) */}
              <div>
                <label htmlFor="task-datasource-select" className="block text-xs font-bold text-slate-700 uppercase font-mono tracking-wider mb-1.5">
                  Primary Data Source
                </label>
                <select
                  id="task-datasource-select"
                  value={dataSource}
                  onChange={(e) => setDataSource(e.target.value as any)}
                  disabled={!canEdit}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white focus:border-indigo-500 font-semibold cursor-pointer"
                >
                  <option value="BigQuery">BigQuery Data Warehouse</option>
                  <option value="API">3rd-Party APIs</option>
                  <option value="CSV">Manual CSV / Sheets Extract</option>
                  <option value="Other">Other / Multi-source</option>
                </select>
              </div>

              {/* Due Date */}
              <div>
                <label htmlFor="task-due-input" className="block text-xs font-bold text-slate-700 uppercase font-mono tracking-wider mb-1.5">
                  Due Date
                </label>
                <div className="relative">
                  <Calendar className="absolute left-2.5 top-2.5 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input
                    id="task-due-input"
                    type="date"
                    value={dueDate}
                    disabled={!canEdit}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white focus:border-indigo-500 font-medium"
                  />
                </div>
              </div>

              {/* External Ticket Link Jira/Asana */}
              <div>
                <label id="ticket-link-label" htmlFor="task-ticket-input" className="block text-xs font-bold text-slate-700 uppercase font-mono tracking-wider mb-1.5">
                  External Ticket Link (Jira/Asana)
                </label>
                <div className="relative">
                  <ExternalLink className="absolute left-2.5 top-2.5 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input
                    id="task-ticket-input"
                    type="url"
                    placeholder="https://jira.company.com/browse/ANA-101"
                    value={ticketLink}
                    disabled={!canEdit}
                    onChange={(e) => setTicketLink(e.target.value)}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white focus:border-indigo-500 font-medium font-mono"
                  />
                </div>
              </div>

            </div>

            {/* Checklist Section */}
            <div className="pt-4 border-t border-slate-100/80">
              <label className="block text-xs font-bold text-slate-700 uppercase font-mono tracking-wider mb-2.5 flex items-center justify-between">
                <span>Staging Pipeline Checklist Items ({checklist.length})</span>
                {checklist.length > 0 && (
                  <span className="text-[10px] font-bold bg-slate-100 text-slate-500 py-0.5 px-2 rounded-full font-mono">
                    {checklist.filter(c => c.isDone).length}/{checklist.length} Completed
                  </span>
                )}
              </label>

              {/* Checklist scrolling lists */}
              {checklist.length > 0 && (
                <div className="space-y-2 mb-3 max-h-48 overflow-y-auto custom-scrollbar p-0.5">
                  {checklist.map((item) => (
                    <div key={item.id} className="flex items-center gap-2.5 bg-slate-50 border border-slate-200/50 p-2 rounded-lg text-xs hover:bg-slate-100/50 transition-colors">
                      <input 
                        type="checkbox"
                        checked={item.isDone}
                        disabled={!canEdit}
                        onChange={() => handleModalToggleChecklistItem(item.id)}
                        className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-0 cursor-pointer"
                      />
                      <input 
                        type="text"
                        value={item.title}
                        disabled={!canEdit}
                        onChange={(e) => handleModalEditChecklistItemTitle(item.id, e.target.value)}
                        className="bg-transparent border-0 p-0 text-slate-700 focus:ring-0 focus:outline-none flex-1 font-semibold text-xs py-0.5"
                        placeholder="Subtask checklist title"
                      />
                      {canEdit && (
                        <button
                          type="button"
                          onClick={() => handleModalRemoveChecklistItem(item.id)}
                          className="text-slate-400 hover:text-rose-500 hover:bg-rose-50 p-1 rounded-md cursor-pointer transition-colors"
                          title="Remove checklist task item"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Add Checklist form */}
              {canEdit && (
                <div className="flex gap-2.5">
                  <input
                    type="text"
                    placeholder="e.g. Validate target staging schema in dbt sandbox"
                    value={newChecklistTitle}
                    onChange={(e) => setNewChecklistTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleModalAddChecklistItem();
                      }
                    }}
                    className="text-xs bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 flex-1 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white focus:border-indigo-500 font-medium"
                  />
                  <button
                    type="button"
                    onClick={handleModalAddChecklistItem}
                    className="p-2 px-4 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-bold cursor-pointer transition-colors shrink-0"
                  >
                    Add Subtask
                  </button>
                </div>
              )}
            </div>

            {/* Tags section */}
            <div className="pt-2 border-t border-slate-100">
              <label className="block text-xs font-bold text-slate-700 uppercase font-mono tracking-wider mb-2">
                Task Tags & Focus Area
              </label>
              
              {/* Preloaded tags pills choice */}
              <div className="flex flex-wrap gap-1.5">
                {AVAILABLE_TAGS.map((tag) => {
                  const isSelected = selectedTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      disabled={!canEdit}
                      onClick={() => handleTagToggle(tag)}
                      className={`text-[10px] font-bold py-1 px-2.5 rounded-full border transition-colors cursor-pointer ${
                        isSelected 
                          ? 'bg-indigo-50 text-indigo-700 border-indigo-200' 
                          : 'bg-slate-50 text-slate-500 hover:bg-slate-100 border-slate-200/80'
                      }`}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>

              {/* Custom tag adder */}
              {canEdit && (
                <div className="mt-3 flex gap-2 max-w-xs">
                  <input
                    type="text"
                    placeholder="Add custom tag (e.g. churn-model)"
                    value={newCustomTag}
                    onChange={(e) => setNewCustomTag(e.target.value)}
                    className="text-xs bg-slate-50 border border-slate-200 rounded-lg py-1.5 px-3 flex-1 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomTag}
                    className="p-1 px-3 bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 rounded-md text-xs font-bold cursor-pointer transition-colors"
                  >
                    Add
                  </button>
                </div>
              )}
            </div>

            {/* Modal actions footer */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              
              {/* Delete button (only in edit, for admins or assignees) */}
              <div>
                {isEditMode && (isAdmin || isAssignee) && (
                  <button
                    id="delete-task-btn"
                    type="button"
                    onClick={handleDelete}
                    className="flex items-center gap-1.5 text-xs text-rose-600 hover:text-white hover:bg-rose-600 font-semibold border border-rose-200 hover:border-rose-600 rounded-lg py-2 px-3.5 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                    Archive Ticket
                  </button>
                )}
              </div>

              {/* Save/Cancel controls */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="py-2 px-4 text-xs font-semibold text-slate-500 hover:text-slate-700 hover:bg-slate-50 border border-slate-200 rounded-lg cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                
                {canEdit && (
                  <button
                    id="save-task-btn"
                    type="submit"
                    className="flex items-center gap-1.5 text-xs text-white bg-indigo-600 hover:bg-indigo-700 font-bold py-2 px-4 rounded-lg cursor-pointer shadow-md shadow-indigo-500/10 hover:shadow-indigo-500/20 active:scale-95 transition-all"
                  >
                    <Save className="w-4 h-4" />
                    {isEditMode ? 'Save Metadata' : 'Launch request'}
                  </button>
                )}
              </div>

            </div>

          </form>

        </div>

      </div>
    </div>
  );
}
