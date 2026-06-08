// ============================================================
// TaskMaster PEI - Constants
// ============================================================

import { Role, TaskStatus } from './types';

export const APP_NAME = 'TaskMaster PEI';
export const APP_VERSION = '2.0.0';

// Role display names
export const ROLE_LABELS: Record<Role, string> = {
  [Role.DIREKTUR]: 'Direktur',
  [Role.KOORDINATOR]: 'Koordinator',
  [Role.TEKNISI]: 'Teknisi',
  [Role.LEAD_IT]: 'Lead IT',
  [Role.IT_PROGRAMMER]: 'IT Programmer',
  [Role.LEAD_AI]: 'Lead AI',
  [Role.AI_ENGINEER]: 'AI Engineer',
};

// Role descriptions
export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  [Role.DIREKTUR]: 'Monitoring semua kegiatan perusahaan',
  [Role.KOORDINATOR]: 'Mengelola teknisi dan wajib laporan harian',
  [Role.TEKNISI]: 'Menerima task dari koordinator atau membuat task sendiri',
  [Role.LEAD_IT]: 'Mengelola IT Programmer dan wajib laporan harian',
  [Role.IT_PROGRAMMER]: 'Menerima task dari Lead IT atau membuat task sendiri',
  [Role.LEAD_AI]: 'Mengelola AI Engineer dan wajib laporan harian',
  [Role.AI_ENGINEER]: 'Menerima task dari Lead AI atau membuat task sendiri',
};

// Task status display
export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  [TaskStatus.PENDING]: 'Pending',
  [TaskStatus.IN_PROGRESS]: 'In Progress',
  [TaskStatus.REVIEW]: 'In Review',
  [TaskStatus.ACCEPTED]: 'Accepted',
  [TaskStatus.COMPLETED]: 'Completed',
  [TaskStatus.REJECTED]: 'Rejected',
};

// Which roles can create tasks for which roles
export const TASK_CREATION_RULES: Record<Role, Role[]> = {
  [Role.DIREKTUR]: [], // Direktur only monitors
  [Role.KOORDINATOR]: [Role.TEKNISI],
  [Role.TEKNISI]: [Role.TEKNISI], // Self-task only
  [Role.LEAD_IT]: [Role.IT_PROGRAMMER],
  [Role.IT_PROGRAMMER]: [Role.IT_PROGRAMMER], // Self-task only
  [Role.LEAD_AI]: [Role.AI_ENGINEER],
  [Role.AI_ENGINEER]: [Role.AI_ENGINEER], // Self-task only
};

// Which roles are "leads" that must submit reports
export const LEAD_ROLES: Role[] = [
  Role.KOORDINATOR,
  Role.LEAD_IT,
  Role.LEAD_AI,
];

// Which roles can view all data (direktur)
export const VIEW_ALL_ROLES: Role[] = [Role.DIREKTUR];

// Default schedule for auto reports
export const DEFAULT_SCHEDULE = {
  0: { label: 'Sunday', enabled: false, time: '17:00' },
  1: { label: 'Monday', enabled: true, time: '17:00' },
  2: { label: 'Tuesday', enabled: true, time: '17:00' },
  3: { label: 'Wednesday', enabled: true, time: '17:00' },
  4: { label: 'Thursday', enabled: true, time: '17:00' },
  5: { label: 'Friday', enabled: true, time: '17:00' },
  6: { label: 'Saturday', enabled: false, time: '13:00' },
};

// Microservice ports
export const SERVICE_PORTS = {
  API_GATEWAY: 4000,
  AUTH_SERVICE: 4001,
  USER_SERVICE: 4002,
  TASK_SERVICE: 4003,
  REPORT_SERVICE: 4004,
  NOTIFICATION_SERVICE: 4005,
};

// API Paths
export const API_PATHS = {
  AUTH: {
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    REFRESH: '/api/auth/refresh',
    LOGOUT: '/api/auth/logout',
    ME: '/api/auth/me',
  },
  USERS: {
    BASE: '/api/users',
    BY_ID: (id: string) => `/api/users/${id}`,
    BY_ROLE: (role: string) => `/api/users/role/${role}`,
  },
  TASKS: {
    BASE: '/api/tasks',
    BY_ID: (id: string) => `/api/tasks/${id}`,
    MY_TASKS: '/api/tasks/my',
    UPDATE_STATUS: (id: string) => `/api/tasks/${id}/status`,
  },
  REPORTS: {
    BASE: '/api/reports',
    BY_ID: (id: string) => `/api/reports/${id}`,
    GENERATE: '/api/reports/generate',
    MY_REPORTS: '/api/reports/my',
  },
  NOTIFICATIONS: {
    BASE: '/api/notifications',
    BY_ID: (id: string) => `/api/notifications/${id}`,
    MARK_READ: (id: string) => `/api/notifications/${id}/read`,
    MARK_ALL_READ: '/api/notifications/read-all',
  },
  DASHBOARD: {
    STATS: '/api/dashboard/stats',
    TEAM_SUMMARY: '/api/dashboard/team-summary',
  },
};

// Time constants
export const TIME = {
  JWT_EXPIRY: '15m',
  JWT_REFRESH_EXPIRY: '7d',
  POLLING_INTERVAL: 10000, // 10 seconds
  AUTO_REPORT_INTERVAL: 60000, // 1 minute
  COUNTDOWN_WARNING: 2 * 60 * 60 * 1000, // 2 hours
  COUNTDOWN_DANGER: 30 * 60 * 1000, // 30 minutes
};

// Error messages
export const ERRORS = {
  UNAUTHORIZED: 'Unauthorized access',
  FORBIDDEN: 'You do not have permission to perform this action',
  NOT_FOUND: 'Resource not found',
  INVALID_CREDENTIALS: 'Invalid username or password',
  USERNAME_TAKEN: 'Username is already taken',
  VALIDATION_ERROR: 'Validation error',
  INTERNAL_ERROR: 'Internal server error',
  TASK_NOT_FOUND: 'Task not found',
  USER_NOT_FOUND: 'User not found',
  REPORT_NOT_FOUND: 'Report not found',
};
