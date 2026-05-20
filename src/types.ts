/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type TaskStatus = 'Backlog' | 'Data Pull' | 'Cleaning' | 'Analysis' | 'Review' | 'Published';

export interface User {
  id: string;
  name: string;
  role: string;
  avatar: string;
  color: string; // Tailwind color for presence indicator
  isAdmin: boolean;
}

export interface Task {
  id: string; // Auto-generated ID
  title: string;
  description: string;
  status: TaskStatus;
  assigneeId: string | null; // Null represents unassigned (specifically allowed in Backlog)
  dueDate: string | null; // Date string (YYYY-MM-DD or formatted) for ease of form handling
  priority: 'P0' | 'P1' | 'P2'; // P0 Critical, P1 High, P2 Normal
  dataSource: 'BigQuery' | 'API' | 'CSV' | 'Other';
  ticketLink?: string;
  tags: string[];
  createdAt: number; // Unix timestamp
  updatedAt: number; // Unix timestamp
  checklist: { id: string; title: string; isDone: boolean }[];
  statusStartedAt: number; // Unix timestamp to track how long a card has been in its current column
}

export interface PresenceState {
  userId: string;
  taskId: string;
  action: 'viewing' | 'editing' | 'idle';
  lastActive: number;
}

export const COLUMNS: { id: TaskStatus; label: string; color: string; description: string }[] = [
  { id: 'Backlog', label: 'Backlog', color: 'bg-slate-100 dark:bg-slate-900 border-slate-200', description: 'Raw analytics/feature requests' },
  { id: 'Data Pull', label: 'Data Pull', color: 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-100', description: 'Query extraction & DB pipelines' },
  { id: 'Cleaning', label: 'Cleaning', color: 'bg-purple-50/50 dark:bg-purple-950/20 border-purple-100', description: 'Data profiling, staging, & dbt' },
  { id: 'Analysis', label: 'Analysis', color: 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-100', description: 'Statistical modeling & BI drafts' },
  { id: 'Review', label: 'Review', color: 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-100', description: 'Stakeholder review & validation gates' },
  { id: 'Published', label: 'Published', color: 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-100', description: 'Live dashboards & production queries' }
];

export const MOCK_USERS: User[] = [
  { id: 'u1', name: 'Sarah Jenkins', role: 'Analytics Manager', avatar: 'SJ', color: 'ring-emerald-500 text-emerald-700 bg-emerald-100', isAdmin: true },
  { id: 'u2', name: 'Alex Rivera', role: 'Senior Business Analyst', avatar: 'AR', color: 'ring-blue-500 text-blue-700 bg-blue-100', isAdmin: false },
  { id: 'u3', name: 'David Chen', role: 'Analytics Engineer', avatar: 'DC', color: 'ring-amber-500 text-amber-700 bg-amber-100', isAdmin: false },
  { id: 'u4', name: 'Sophia Martinez', role: 'Product Manager (Stakeholder)', avatar: 'SM', color: 'ring-indigo-500 text-indigo-700 bg-indigo-100', isAdmin: false },
];

export const AVAILABLE_TAGS = ['#dashboard', '#ad-hoc', '#pipeline', '#automation', '#dbt', '#machine-learning', '#executive-report', '#data-quality'];

export const INITIAL_TASKS: Task[] = [
  {
    id: 't-101',
    title: 'Executive Revenue Dashboard Refresh',
    description: 'Update the core executive Tableau dashboard to incorporate Q2 pricing adjustments and multi-currency exchange rates from our main BigQuery datasets.',
    status: 'Analysis',
    assigneeId: 'u1',
    dueDate: '2026-05-25',
    priority: 'P0',
    dataSource: 'BigQuery',
    ticketLink: 'https://jira.example.com/browse/ANA-402',
    tags: ['#dashboard', '#executive-report'],
    createdAt: 1716182400000,
    updatedAt: 1716182400000,
    checklist: [
      { id: 'ch-1', title: 'Verify BigQuery schema models', isDone: true },
      { id: 'ch-2', title: 'Draft visual charts in Tableau', isDone: false }
    ],
    statusStartedAt: Date.now()
  },
  {
    id: 't-102',
    title: 'dbt Pipeline Latency Investigation',
    description: 'The nightly pipeline load has increased from 40 mins to 2.5 hours. Investigate the downstream tables loaded into BigQuery, verify dbt model materializations, and refactor slow incremental pulls.',
    status: 'Cleaning',
    assigneeId: 'u3',
    dueDate: '2026-05-22',
    priority: 'P1',
    dataSource: 'BigQuery',
    ticketLink: 'https://jira.example.com/browse/ENG-881',
    tags: ['#pipeline', '#dbt'],
    createdAt: 1716182400000,
    updatedAt: 1716182400000,
    checklist: [
      { id: 'ch-3', title: 'Check nightly dbt DAG logs', isDone: true },
      { id: 'ch-4', title: 'Identify heavy JOIN bottlenecks', isDone: false },
      { id: 'ch-5', title: 'Test refactoring of incremental models', isDone: false }
    ],
    statusStartedAt: Date.now() - 4 * 24 * 60 * 60 * 1000 // 4 days ago (Stale!)
  },
  {
    id: 't-103',
    title: 'Ad-hoc Churn Prediction API extract',
    description: 'Fetch user event logs from the third-party mixpanel API to train the churn model. Deliver clean CSV to the data science team.',
    status: 'Data Pull',
    assigneeId: 'u2',
    dueDate: '2026-05-28',
    priority: 'P2',
    dataSource: 'API',
    ticketLink: '',
    tags: ['#ad-hoc', '#machine-learning'],
    createdAt: 1716182400000,
    updatedAt: 1716182400000,
    checklist: [],
    statusStartedAt: Date.now()
  },
  {
    id: 't-104',
    title: 'Implement Data Quality Checks in Airflow',
    description: 'Create Great Expectations suites for critical sales tables. Need automatic slack alerting and pipeline failure toggles if row count drop is > 20% or key fields contain nulls.',
    status: 'Backlog',
    assigneeId: null,
    dueDate: '2026-06-05',
    priority: 'P1',
    dataSource: 'Other',
    ticketLink: 'https://jira.example.com/browse/ENG-904',
    tags: ['#automation', '#pipeline', '#data-quality'],
    createdAt: 1716182400000,
    updatedAt: 1716182400000,
    checklist: [],
    statusStartedAt: Date.now()
  },
  {
    id: 't-105',
    title: 'Marketing Automation CSV ingestion',
    description: 'Set up an automated cleaning script for weekly sheets compiled of advertising metrics from Hubspot, Mailchimp, and Facebook Ads APIs.',
    status: 'Cleaning',
    assigneeId: 'u3',
    dueDate: '2026-05-24',
    priority: 'P2',
    dataSource: 'CSV',
    ticketLink: '',
    tags: ['#automation', '#ad-hoc'],
    createdAt: 1716182400000,
    updatedAt: 1716182400000,
    checklist: [],
    statusStartedAt: Date.now()
  },
  {
    id: 't-106',
    title: 'Weekly KPI Presentation Deck Validation',
    description: 'Verify current KPI queries with finance stakeholders before publishing slides for the joint QBR. Requires a manual audit of double-counted promotional discounts in the checkout API layers.',
    status: 'Review',
    assigneeId: 'u2',
    dueDate: '2026-05-21',
    priority: 'P0',
    dataSource: 'API',
    ticketLink: 'https://jira.example.com/browse/ANA-501',
    tags: ['#executive-report', '#ad-hoc'],
    createdAt: 1716182400000,
    updatedAt: 1716182400000,
    checklist: [
      { id: 'ch-6', title: 'Compare promo coupon calculation with finance totals', isDone: false }
    ],
    statusStartedAt: Date.now()
  }
];
