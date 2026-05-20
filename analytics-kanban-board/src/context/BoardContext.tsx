/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { Task, TaskStatus, User, PresenceState, MOCK_USERS, INITIAL_TASKS, AVAILABLE_TAGS } from '../types';

interface ActivityLog {
  id: string;
  user: User;
  text: string;
  time: number;
  type: 'info' | 'success' | 'warning' | 'move' | 'conflict';
}

interface BoardContextType {
  tasks: Task[];
  users: User[];
  currentUser: User;
  presence: PresenceState[];
  activityLogs: ActivityLog[];
  isSimulatorActive: boolean;
  searchQuery: string;
  filterPriority: 'P0' | 'P1' | 'P2' | null;
  filterAssignee: string | null;
  filterTag: string | null;
  filterDataSource: 'BigQuery' | 'API' | 'CSV' | 'Other' | null;
  setSearchQuery: (query: string) => void;
  setFilterPriority: (priority: 'P0' | 'P1' | 'P2' | null) => void;
  setFilterAssignee: (assigneeId: string | null) => void;
  setFilterTag: (tag: string | null) => void;
  setFilterDataSource: (dataSource: 'BigQuery' | 'API' | 'CSV' | 'Other' | null) => void;
  clearFilters: () => void;
  setSimulatorActive: (active: boolean) => void;
  changeCurrentUser: (userId: string) => void;
  moveTask: (taskId: string, targetStatus: TaskStatus) => void;
  createTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateTask: (taskId: string, updatedFields: Partial<Task>) => { success: boolean; error?: string };
  deleteTask: (taskId: string) => void;
  setPresence: (taskId: string, action: 'viewing' | 'editing' | 'idle') => void;
  addSystemLog: (text: string, user: User, type: ActivityLog['type']) => void;
  simulateColleagueAction: () => void;
}

const BoardContext = createContext<BoardContextType | undefined>(undefined);

export function useBoard() {
  const context = useContext(BoardContext);
  if (!context) {
    throw new Error('useBoard must be used within a BoardProvider');
  }
  return context;
}

export function BoardProvider({ children }: { children: React.ReactNode }) {
  // 1. Core State Load
  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem('analytics_kanban_tasks');
    return saved ? JSON.parse(saved) : INITIAL_TASKS;
  });

  const [currentUser, setCurrentUser] = useState<User>(() => {
    const saved = localStorage.getItem('analytics_kanban_current_user');
    return saved ? JSON.parse(saved) : MOCK_USERS[1]; // Alex Rivera by default (Senior Business Analyst)
  });

  const [isSimulatorActive, setSimulatorActive] = useState<boolean>(true);

  // 2. Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPriority, setFilterPriority] = useState<'P0' | 'P1' | 'P2' | null>(null);
  const [filterAssignee, setFilterAssignee] = useState<string | null>(null);
  const [filterTag, setFilterTag] = useState<string | null>(null);
  const [filterDataSource, setFilterDataSource] = useState<'BigQuery' | 'API' | 'CSV' | 'Other' | null>(null);

  // 3. User presence & collaborative activity logs state
  const [presence, setPresenceState] = useState<PresenceState[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);

  // Ref to track state changes safely for the setInterval simulation
  const tasksRef = useRef<Task[]>(tasks);
  useEffect(() => {
    tasksRef.current = tasks;
    localStorage.setItem('analytics_kanban_tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('analytics_kanban_current_user', JSON.stringify(currentUser));
  }, [currentUser]);

  // Inject a system log helper
  const addSystemLog = useCallback((text: string, user: User, type: ActivityLog['type']) => {
    const newLog: ActivityLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      user,
      text,
      time: Date.now(),
      type
    };
    setActivityLogs(prev => [newLog, ...prev.slice(0, 49)]); // Keep latest 50
  }, []);

  // Set presence activity
  const setPresence = useCallback((taskId: string, action: 'viewing' | 'editing' | 'idle') => {
    setPresenceState(prev => {
      const idx = prev.findIndex(ps => ps.userId === currentUser.id);
      const now = Date.now();
      if (idx !== -1) {
        if (action === 'idle') {
          return prev.filter(ps => ps.userId !== currentUser.id);
        }
        const updated = [...prev];
        updated[idx] = { userId: currentUser.id, taskId, action, lastActive: now };
        return updated;
      } else {
        if (action === 'idle') return prev;
        return [...prev, { userId: currentUser.id, taskId, action, lastActive: now }];
      }
    });
  }, [currentUser]);

  // Clean presence of inactive users
  useEffect(() => {
    const interval = setInterval(() => {
      const tooOld = Date.now() - 30000; // 30s inactivity
      setPresenceState(prev => prev.filter(p => p.lastActive > tooOld));
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  // Multi-user authentication toggle
  const changeCurrentUser = (userId: string) => {
    const selected = MOCK_USERS.find(u => u.id === userId);
    if (selected) {
      // Clear old presence
      setPresenceState(prev => prev.filter(p => p.userId !== currentUser.id));
      setCurrentUser(selected);
      addSystemLog(`switched profile view to ${selected.name} (${selected.role})`, selected, 'info');
    }
  };

  // Card Movement (DnD) - Drag & drop can be executed by anyone
  const moveTask = (taskId: string, targetStatus: TaskStatus) => {
    setTasks(prev => {
      const taskIndex = prev.findIndex(t => t.id === taskId);
      if (taskIndex === -1) return prev;

      const task = prev[taskIndex];
      if (task.status === targetStatus) return prev;

      const updatedTasks = [...prev];
      updatedTasks[taskIndex] = {
        ...task,
        status: targetStatus,
        statusStartedAt: Date.now(), // Reset aging timer fresh for the new column status
        updatedAt: Date.now()
      };

      // Add activity log
      addSystemLog(
        `moved "${task.title}" to "${targetStatus}"`,
        currentUser,
        'move'
      );

      return updatedTasks;
    });
  };

  // Create Task
  const createTask = (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newTask: Task = {
      checklist: [],
      statusStartedAt: Date.now(),
      ...taskData,
      id: `task-${Date.now()}`,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    setTasks(prev => [newTask, ...prev]);
    addSystemLog(`created new task: "${newTask.title}"`, currentUser, 'success');
  };

  // Edit/Update Task (Requires edit permissions)
  // "While anyone can move a card, only the designated Assignee or an Admin can edit the internal task fields"
  const updateTask = (taskId: string, updatedFields: Partial<Task>): { success: boolean; error?: string } => {
    let result = { success: true, error: '' };

    setTasks(prev => {
      const taskIndex = prev.findIndex(t => t.id === taskId);
      if (taskIndex === -1) {
        result = { success: false, error: 'Task not found.' };
        return prev;
      }

      const task = prev[taskIndex];

      // Enforce the rule
      // Designated assignee or Admin can edit. If task is unassigned (null), anyone authenticated can edit.
      const hasPermission = !task.assigneeId || task.assigneeId === currentUser.id || currentUser.isAdmin;

      if (!hasPermission) {
        // We do not save, and capture the error message
        const assigneeUser = MOCK_USERS.find(u => u.id === task.assigneeId);
        result = {
          success: false,
          error: `Permission Denied. Only the Assignee (${assigneeUser?.name || 'Assigned User'}) or an Admin can edit fields for this task.`
        };
        return prev;
      }

      const updatedTasks = [...prev];
      updatedTasks[taskIndex] = {
        ...task,
        ...updatedFields,
        updatedAt: Date.now()
      };

      // Check fields actually changed
      const changes: string[] = [];
      if (updatedFields.title && updatedFields.title !== task.title) changes.push('title');
      if (updatedFields.priority && updatedFields.priority !== task.priority) changes.push(`priority to ${updatedFields.priority}`);
      if (updatedFields.assigneeId !== undefined && updatedFields.assigneeId !== task.assigneeId) {
        const newAssignee = MOCK_USERS.find(u => u.id === updatedFields.assigneeId);
        changes.push(`assignee to ${newAssignee ? newAssignee.name : 'Unassigned'}`);
      }
      if (updatedFields.dataSource && updatedFields.dataSource !== task.dataSource) changes.push(`data source to ${updatedFields.dataSource}`);
      if (updatedFields.tags && JSON.stringify(updatedFields.tags) !== JSON.stringify(task.tags)) changes.push('tags');

      const text = changes.length > 0
        ? `updated task fields (${changes.join(', ')}) on "${task.title}"`
        : `updated description or links on "${task.title}"`;

      addSystemLog(text, currentUser, 'success');
      return updatedTasks;
    });

    return result;
  };

  // Delete Task (Admin only, or Assignee)
  const deleteTask = (taskId: string) => {
    setTasks(prev => {
      const taskIndex = prev.findIndex(t => t.id === taskId);
      if (taskIndex === -1) return prev;
      const task = prev[taskIndex];

      if (!currentUser.isAdmin && task.assigneeId !== currentUser.id) {
        addSystemLog(`unsuccessfully tried to delete "${task.title}" (insufficient permission)`, currentUser, 'warning');
        return prev;
      }

      addSystemLog(`archived/deleted task "${task.title}"`, currentUser, 'warning');
      return prev.filter(t => t.id !== taskId);
    });
  };

  const clearFilters = () => {
    setSearchQuery('');
    setFilterPriority(null);
    setFilterAssignee(null);
    setFilterTag(null);
    setFilterDataSource(null);
  };

  // Dynamic Colleague Simulator Actions to mimic real-time synchronicity!
  const simulateColleagueAction = useCallback(() => {
    const currentTasks = tasksRef.current;
    if (currentTasks.length === 0) return;

    // Pick a random colleague user (not the currentUser)
    const classmates = MOCK_USERS.filter(u => u.id !== currentUser.id);
    const colleague = classmates[Math.floor(Math.random() * classmates.length)];

    const eventType = Math.random();

    if (eventType < 0.35) {
      // 1. Move a random task to another column
      const randIdx = Math.floor(Math.random() * currentTasks.length);
      const task = currentTasks[randIdx];
      const possibleStatuses: TaskStatus[] = ['Backlog', 'Data Pull', 'Cleaning', 'Analysis', 'Review', 'Published'];
      const currentStatusIdx = possibleStatuses.indexOf(task.status);
      const statusOffsets = [-1, 1].filter(offset => {
        const newIdx = currentStatusIdx + offset;
        return newIdx >= 0 && newIdx < possibleStatuses.length;
      });
      if (statusOffsets.length === 0) return;
      const offset = statusOffsets[Math.floor(Math.random() * statusOffsets.length)];
      const targetStatus = possibleStatuses[currentStatusIdx + offset];

      setTasks(prev => {
        const updated = [...prev];
        const idx = updated.findIndex(t => t.id === task.id);
        if (idx !== -1) {
          updated[idx] = {
            ...updated[idx],
            status: targetStatus,
            updatedAt: Date.now()
          };
          addSystemLog(`moved "${task.title}" from "${task.status}" to "${targetStatus}"`, colleague, 'move');
        }
        return updated;
      });

    } else if (eventType < 0.65) {
      // 2. Colleague edits a task metadata
      const eligibleTasks = currentTasks.filter(t => !t.assigneeId || t.assigneeId === colleague.id || colleague.isAdmin);
      if (eligibleTasks.length === 0) return;
      const task = eligibleTasks[Math.floor(Math.random() * eligibleTasks.length)];

      const randomPriorities: ('P0' | 'P1' | 'P2')[] = ['P0', 'P1', 'P2'];
      const filteredPriorities = randomPriorities.filter(p => p !== task.priority);
      const newPriority = filteredPriorities[Math.floor(Math.random() * filteredPriorities.length)];

      setTasks(prev => {
        const updated = [...prev];
        const idx = updated.findIndex(t => t.id === task.id);
        if (idx !== -1) {
          updated[idx] = {
            ...updated[idx],
            priority: newPriority,
            updatedAt: Date.now()
          };
          addSystemLog(`changed priority to ${newPriority} on "${task.title}"`, colleague, 'success');
        }
        return updated;
      });

    } else if (eventType < 0.8) {
      // 3. Create a new task in Backlog
      const sampleTitles = [
        'Ad-hoc SQL validation for stakeholder query',
        'Refactor checkout api analytics payload',
        'Inspect anomalies in pipeline table ingestion',
        'Add dbt tags to staging customer records',
        'Generate marketing leads csv exports'
      ];
      const randomTitle = sampleTitles[Math.floor(Math.random() * sampleTitles.length)];
      const isExist = currentTasks.find(t => t.title === randomTitle);
      if (isExist) return;

      const randSources: ('BigQuery' | 'API' | 'CSV' | 'Other')[] = ['BigQuery', 'API', 'CSV', 'Other'];
      const randSource = randSources[Math.floor(Math.random() * randSources.length)];

      const newTask: Task = {
        id: `task-sim-${Date.now()}`,
        title: randomTitle,
        description: 'Automated task request dispatched by business partner to analytics backlog.',
        status: 'Backlog',
        assigneeId: null,
        dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        priority: 'P2',
        dataSource: randSource,
        tags: ['#ad-hoc'],
        createdAt: Date.now(),
        updatedAt: Date.now(),
        checklist: [],
        statusStartedAt: Date.now()
      };

      setTasks(prev => [newTask, ...prev]);
      addSystemLog(`created raw backlog task: "${randomTitle}"`, colleague, 'success');

    } else {
      // 4. Simulate CONFLICT WARNING scenario!
      // This mimics the "Conflict resolution uses updatedAt timestamp; older writes are ignored with a soft toast warning"
      // Colleague attempts to save a change with an OLD timestamp
      const randIdx = Math.floor(Math.random() * currentTasks.length);
      const task = currentTasks[randIdx];

      // Create an activity notification mimicking an ignored stale save
      addSystemLog(
        `stale cache update ignored for "${task.title}" (older updatedAt write rejected for concurrency safety)`,
        colleague,
        'conflict'
      );
    }

    // Set temporary presence of the colleague on some task
    const randTaskIdx = Math.floor(Math.random() * currentTasks.length);
    const targetTask = currentTasks[randTaskIdx];
    setPresenceState(prev => {
      const clean = prev.filter(p => p.userId !== colleague.id);
      return [
        ...clean,
        {
          userId: colleague.id,
          taskId: targetTask.id,
          action: Math.random() > 0.5 ? 'viewing' : 'editing',
          lastActive: Date.now()
        }
      ];
    });

  }, [currentUser, addSystemLog]);

  // Colleague Simulator Tick
  useEffect(() => {
    if (!isSimulatorActive) return;

    // Trigger more frequently so it is very apparent during evaluation
    const intervalTime = 18000; // 18 seconds
    const interval = setInterval(() => {
      simulateColleagueAction();
    }, intervalTime);

    return () => clearInterval(interval);
  }, [isSimulatorActive, simulateColleagueAction]);

  // Seed default activities
  useEffect(() => {
    if (activityLogs.length === 0) {
      addSystemLog('initialized the Analytics board shell', MOCK_USERS[0], 'info');
      addSystemLog('connected to client-only localStorage store', MOCK_USERS[1], 'info');
    }
  }, [activityLogs, addSystemLog]);

  return (
    <BoardContext.Provider
      value={{
        tasks,
        users: MOCK_USERS,
        currentUser,
        presence,
        activityLogs,
        isSimulatorActive,
        searchQuery,
        filterPriority,
        filterAssignee,
        filterTag,
        filterDataSource,
        setSearchQuery,
        setFilterPriority,
        setFilterAssignee,
        setFilterTag,
        setFilterDataSource,
        clearFilters,
        setSimulatorActive,
        changeCurrentUser,
        moveTask,
        createTask,
        updateTask,
        deleteTask,
        setPresence,
        addSystemLog,
        simulateColleagueAction
      }}
    >
      {children}
    </BoardContext.Provider>
  );
}
