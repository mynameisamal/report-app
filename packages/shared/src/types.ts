// ============================================================
// TaskMaster PEI - Shared Types
// ============================================================

export enum Role {
  DIREKTUR = 'DIREKTUR',
  KOORDINATOR = 'KOORDINATOR',
  TEKNISI = 'TEKNISI',
  LEAD_IT = 'LEAD_IT',
  IT_PROGRAMMER = 'IT_PROGRAMMER',
  LEAD_AI = 'LEAD_AI',
  AI_ENGINEER = 'AI_ENGINEER',
}

export enum TaskStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  REVIEW = 'review',
  ACCEPTED = 'acc',
  COMPLETED = 'completed',
  REJECTED = 'rejected',
}

export enum Department {
  IT = 'IT',
  AI = 'AI',
  TEKNISI = 'TEKNISI',
}

export enum NotificationType {
  TASK_ASSIGNED = 'task_assigned',
  TASK_REVIEW = 'task_review',
  TASK_APPROVED = 'task_approved',
  TASK_REJECTED = 'task_rejected',
  REPORT_GENERATED = 'report_generated',
  SYSTEM = 'system',
}

// ---- User Types ----

export interface User {
  id: string;
  username: string;
  email: string | null;
  fullName: string;
  passwordHash: string;
  role: Role;
  avatarUrl: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserPublic {
  id: string;
  username: string;
  fullName: string;
  role: Role;
  avatarUrl: string | null;
  isActive: boolean;
}

// ---- Project Types ----

export interface Project {
  id: string;
  name: string;
  description: string | null;
  leadId: string | null;
  department: Department;
  createdAt: string;
  updatedAt: string;
}

// ---- Task Types ----

export interface Task {
  id: string;
  title: string;
  description: string | null;
  instructions: string | null;
  githubLink: string | null;
  status: TaskStatus;
  assignedTo: string | null;
  assignee?: UserPublic | null;
  createdBy: string;
  creator?: UserPublic | null;
  projectId: string | null;
  project?: Project | null;
  targetDate: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  instructions?: string;
  githubLink?: string;
  assignedTo?: string;
  projectId?: string;
  targetDate?: string;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  instructions?: string;
  githubLink?: string;
  status?: TaskStatus;
  assignedTo?: string;
  projectId?: string;
  targetDate?: string;
}

// ---- Report Types ----

export interface DailyReport {
  id: string;
  userId: string;
  user?: UserPublic | null;
  date: string;
  content: string;
  tasksCompleted: number;
  tasksInProgress: number;
  tasksPending: number;
  isAuto: boolean;
  createdAt: string;
}

// ---- Notification Types ----

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string | null;
  isRead: boolean;
  createdAt: string;
}

// ---- Auth Types ----

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: UserPublic;
}

export interface RegisterRequest {
  username: string;
  password: string;
  fullName: string;
  role: Role;
  email?: string;
}

export interface JwtPayload {
  userId: string;
  username: string;
  role: Role;
  iat?: number;
  exp?: number;
}

// ---- API Types ----

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  total: number;
  page: number;
  limit: number;
}

// ---- Dashboard Types ----

export interface DashboardStats {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  pendingTasks: number;
  overdueTasks: number;
  teamMembers: number;
  activeProjects: number;
}

export interface TeamSummary {
  userId: string;
  fullName: string;
  username: string;
  role: Role;
  activeTasks: number;
  completedTasks: number;
  overdueTasks: number;
}

// ---- Schedule Types ----

export interface ScheduleConfig {
  [day: number]: {
    label: string;
    enabled: boolean;
    time: string;
  };
}

export interface AppSettings {
  schedule?: ScheduleConfig;
  theme?: 'dark' | 'light';
  language?: string;
}
