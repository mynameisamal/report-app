// ============================================================
// TaskMaster PEI - API Client
// ============================================================

const API_BASE = 'http://localhost:4000';

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

class ApiClient {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  constructor() {
    this.accessToken = localStorage.getItem('access_token');
    this.refreshToken = localStorage.getItem('refresh_token');
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (this.accessToken) headers['Authorization'] = `Bearer ${this.accessToken}`;
    return headers;
  }

  private setTokens(accessToken: string, refreshToken: string) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('refresh_token', refreshToken);
  }

  clearTokens() {
    this.accessToken = null;
    this.refreshToken = null;
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
  }

  get isAuthenticated(): boolean {
    return !!this.accessToken;
  }

  async request<T = any>(method: string, path: string, body?: any): Promise<ApiResponse<T>> {
    try {
      const options: RequestInit = {
        method,
        headers: this.getHeaders(),
      };
      if (body && method !== 'GET') options.body = JSON.stringify(body);

      const response = await fetch(`${API_BASE}${path}`, options);
      const data = await response.json();

      // If unauthorized, try refresh
      if (response.status === 401 && this.refreshToken) {
        const refreshed = await this.refreshAccessToken();
        if (refreshed) {
          options.headers = this.getHeaders();
          const retryResponse = await fetch(`${API_BASE}${path}`, options);
          return await retryResponse.json();
        }
      }

      return data;
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async refreshAccessToken(): Promise<boolean> {
    const res = await fetch(`${API_BASE}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: this.refreshToken }),
    });
    const data = await res.json();
    if (data.success && data.data) {
      this.setTokens(data.data.accessToken, data.data.refreshToken);
      return true;
    }
    this.clearTokens();
    return false;
  }

  // Auth
  async login(username: string, password: string) {
    const res = await this.request<any>('POST', '/api/auth/login', { username, password });
    if (res.success && res.data) {
      this.setTokens(res.data.accessToken, res.data.refreshToken);
      localStorage.setItem('user', JSON.stringify(res.data.user));
    }
    return res;
  }

  async getMe() {
    return this.request<any>('GET', '/api/auth/me');
  }

  logout() {
    this.clearTokens();
    window.location.reload();
  }

  // Tasks
  async getTasks(params?: string) {
    return this.request<any[]>('GET', `/api/tasks${params ? '?' + params : ''}`);
  }

  async getMyTasks(userId: string) {
    return this.request<any[]>('GET', `/api/tasks/my/${userId}`);
  }

  async createTask(task: any) {
    return this.request<any>('POST', '/api/tasks', task);
  }

  async updateTask(id: string, data: any) {
    return this.request<any>('PUT', `/api/tasks/${id}`, data);
  }

  async updateTaskStatus(id: string, status: string) {
    return this.request<any>('PUT', `/api/tasks/${id}/status`, { status });
  }

  async deleteTask(id: string) {
    return this.request<any>('DELETE', `/api/tasks/${id}`);
  }

  // Users
  async getUsers() {
    return this.request<any[]>('GET', '/api/users');
  }

  async getUsersByRole(role: string) {
    return this.request<any[]>('GET', `/api/users/role/${role}`);
  }

  // Reports
  async getReports(userId?: string) {
    const params = userId ? `?userId=${userId}` : '';
    return this.request<any[]>('GET', `/api/reports${params}`);
  }

  async getMyReports(userId: string) {
    return this.request<any[]>('GET', `/api/reports/my/${userId}`);
  }

  async generateReport(userId: string, force = false) {
    return this.request<any>('POST', '/api/reports/generate', { userId, force });
  }

  // Dashboard
  async getStats(userId: string) {
    return this.request<any>('GET', `/api/dashboard/stats/${userId}`);
  }

  async getTeamSummary(userId: string) {
    return this.request<any[]>('GET', `/api/dashboard/team-summary/${userId}`);
  }

  // Notifications
  async getNotifications(userId: string) {
    return this.request<any[]>('GET', `/api/notifications/${userId}`);
  }

  async markNotificationRead(id: string) {
    return this.request<any>('PUT', `/api/notifications/${id}/read`);
  }

  async markAllNotificationsRead(userId: string) {
    return this.request<any>('PUT', `/api/notifications/read-all/${userId}`);
  }
}

export const api = new ApiClient();
export default api;
