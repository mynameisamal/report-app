// ============================================================
// TaskMaster PEI - Utility Functions
// ============================================================

import { Role, TaskStatus } from './types';
import {
  LEAD_ROLES,
  VIEW_ALL_ROLES,
  TASK_CREATION_RULES,
  ROLE_LABELS,
  ROLE_DESCRIPTIONS,
  TASK_STATUS_LABELS,
  TIME,
} from './constants';

/**
 * Check if a role is a lead role (must submit reports)
 */
export function isLeadRole(role: Role): boolean {
  return LEAD_ROLES.includes(role);
}

/**
 * Check if a role can view all data (direktur)
 */
export function canViewAll(role: Role): boolean {
  return VIEW_ALL_ROLES.includes(role);
}

/**
 * Get the roles that a given role can assign tasks to
 */
export function getAssignableRoles(role: Role): Role[] {
  return TASK_CREATION_RULES[role] || [];
}

/**
 * Check if a role can assign tasks
 */
export function canAssignTasks(role: Role): boolean {
  return getAssignableRoles(role).length > 0;
}

/**
 * Check if a role can create tasks for self
 */
export function canCreateSelfTask(role: Role): boolean {
  return TASK_CREATION_RULES[role]?.includes(role) ?? false;
}

/**
 * Get the team roles managed by a lead role
 */
export function getManagedRoles(role: Role): Role[] {
  const managedRoles: Record<Role, Role[]> = {
    [Role.DIREKTUR]: [],
    [Role.KOORDINATOR]: [Role.TEKNISI],
    [Role.TEKNISI]: [],
    [Role.LEAD_IT]: [Role.IT_PROGRAMMER],
    [Role.IT_PROGRAMMER]: [],
    [Role.LEAD_AI]: [Role.AI_ENGINEER],
    [Role.AI_ENGINEER]: [],
  };
  return managedRoles[role] || [];
}

/**
 * Get the lead role that manages a given role
 */
export function getManagingLeadRole(role: Role): Role | null {
  const managementMap: Record<Role, Role> = {
    [Role.DIREKTUR]: Role.DIREKTUR,
    [Role.KOORDINATOR]: Role.DIREKTUR,
    [Role.TEKNISI]: Role.KOORDINATOR,
    [Role.LEAD_IT]: Role.DIREKTUR,
    [Role.IT_PROGRAMMER]: Role.LEAD_IT,
    [Role.LEAD_AI]: Role.DIREKTUR,
    [Role.AI_ENGINEER]: Role.LEAD_AI,
  };
  return managementMap[role] || null;
}

/**
 * Get the display name for a role
 */
export function getRoleLabel(role: Role): string {
  return ROLE_LABELS[role] || role;
}

/**
 * Get the description for a role
 */
export function getRoleDescription(role: Role): string {
  return ROLE_DESCRIPTIONS[role] || '';
}

/**
 * Get the display label for a task status
 */
export function getTaskStatusLabel(status: TaskStatus): string {
  return TASK_STATUS_LABELS[status] || status;
}

/**
 * Format date for display
 */
export function formatDate(date: string | Date | null): string {
  if (!date) return '-';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }) + ' ' + d.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Format date to short format (YYYY-MM-DD)
 */
export function formatDateShort(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toISOString().split('T')[0];
}

/**
 * Check if a date is overdue
 */
export function isOverdue(targetDate: string | Date | null): boolean {
  if (!targetDate) return false;
  const deadline = typeof targetDate === 'string'
    ? (targetDate.includes('T') ? new Date(targetDate) : new Date(`${targetDate}T17:00:00`))
    : targetDate;
  return new Date().getTime() > deadline.getTime();
}

/**
 * Calculate time remaining until deadline
 */
export function getTimeRemaining(targetDate: string | Date | null): {
  text: string;
  state: 'normal' | 'warning' | 'danger' | 'overdue';
} | null {
  if (!targetDate) return null;

  const deadline = typeof targetDate === 'string'
    ? (targetDate.includes('T') ? new Date(targetDate) : new Date(`${targetDate}T17:00:00`))
    : targetDate;
  const now = new Date();
  const diffMs = deadline.getTime() - now.getTime();

  if (diffMs <= 0) {
    return { text: 'OVERDUE', state: 'overdue' };
  }

  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  const secs = Math.floor((diffMs % (1000 * 60)) / 1000);
  const text = `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

  let state: 'normal' | 'warning' | 'danger' = 'normal';
  if (diffMs < TIME.COUNTDOWN_DANGER) state = 'danger';
  else if (diffMs < TIME.COUNTDOWN_WARNING) state = 'warning';

  return { text, state };
}

/**
 * Generate a simple UUID v4
 */
export function generateId(): string {
  return crypto.randomUUID ? crypto.randomUUID() : 
    'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
}

/**
 * Clamp a number between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Truncate text to a maximum length
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

/**
 * Parse instructions string into steps array
 */
export function parseInstructions(instructions: string | null): string[] {
  if (!instructions) return [];
  return instructions.split('\n').filter((i) => i.trim() !== '');
}

/**
 * Build instructions string from steps array
 */
export function buildInstructions(steps: string[]): string {
  return steps.filter((s) => s.trim() !== '').join('\n');
}
