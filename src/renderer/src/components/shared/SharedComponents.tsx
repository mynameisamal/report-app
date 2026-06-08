import React from 'react';
import { Shield, LogOut, LayoutDashboard, Users, FileText, Settings, Clock, CheckCircle, AlertTriangle, Target, Laptop, HelpCircle, Copy, Plus, Trash2, Edit2, X, UserPlus, Rocket, Search, ChevronRight } from 'lucide-react';

// ============ ICON MAP ============
export const Icons = { Shield, LogOut, LayoutDashboard, Users, FileText, Settings, Clock, CheckCircle, AlertTriangle, Target, Laptop, HelpCircle, Copy, Plus, Trash2, Edit2, X, UserPlus, Rocket, Search, ChevronRight };

// ============ THEME ============
export const theme = {
  colors: { bg: { main: '#050505', sidebar: '#0a0a0a', card: 'rgba(10, 15, 12, 0.8)' }, accent: { main: '#00ff66', dark: '#00cc52', glow: 'rgba(0, 255, 102, 0.15)' }, border: { main: 'rgba(0, 255, 102, 0.2)', light: 'rgba(255, 255, 255, 0.08)' }, text: { main: '#f8fafc', muted: '#8b949e' }, status: { success: '#00ff66', warning: '#f59e0b', danger: '#f85149' } },
  fonts: { body: "'Plus Jakarta Sans', sans-serif" },
};

// ============ STATUS HELPERS ============
export function getStatusColor(status: string): string {
  const map: Record<string, string> = { completed: '#00ff66', acc: '#00ff66', accepted: '#00ff66', in_progress: '#f59e0b', review: '#f59e0b', pending: '#64748b', rejected: '#f85149' };
  return map[status?.toLowerCase()] || '#64748b';
}

export function getStatusLabel(status: string): string {
  const map: Record<string, string> = { pending: '⚪ PENDING', in_progress: '🟡 IN PROGRESS', review: '🟠 IN REVIEW', acc: '🟢 ACCEPTED', accepted: '🟢 ACCEPTED', completed: '✅ COMPLETED', rejected: '🔴 REJECTED' };
  return map[status?.toLowerCase()] || status?.toUpperCase() || 'UNKNOWN';
}

export function isOverdue(targetDate: string | null): boolean {
  if (!targetDate) return false;
  const deadline = targetDate.includes('T') ? new Date(targetDate) : new Date(`${targetDate}T17:00:00`);
  return new Date().getTime() > deadline.getTime();
}

// ============ LOADING SPINNER ============
export const LoadingSpinner = () => (
  <div className="flex items-center justify-center h-screen bg-[#050505]">
    <div style={{ width: 48, height: 48, borderRadius: '50%', border: '3px solid rgba(0,255,102,0.1)', borderTopColor: '#00ff66', animation: 'spin 0.8s linear infinite' }}></div>
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

// ============ SIDEBAR LAYOUT ============
interface LayoutProps {
  user: any; activeTab: string; onTabChange: (tab: string) => void; onLogout: () => void;
  tabs: { id: string; label: string; icon: React.ReactNode }[]; children: React.ReactNode;
}
export const SidebarLayout: React.FC<LayoutProps> = ({ user, activeTab, onTabChange, onLogout, tabs, children }) => (
  <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', height: '100vh', width: '100vw' }}>
    <aside style={{ background: '#0a0a0a', borderRight: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column', padding: '2rem 1.25rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '2rem', padding: '0 0.5rem' }}>
        <div style={{ background: '#00ff66', padding: 8, borderRadius: 12, display: 'flex' }}><Shield size={20} color="white" /></div>
        <span style={{ fontWeight: 800, fontSize: '1.1rem' }}>TaskMaster</span>
      </div>
      <nav style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
        {tabs.map(tab => (
          <div key={tab.id} onClick={() => onTabChange(tab.id)}
            style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 10, cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', background: activeTab === tab.id ? 'rgba(0,255,102,0.15)' : 'transparent', color: activeTab === tab.id ? '#00ff66' : '#8b949e', borderLeft: activeTab === tab.id ? '3px solid #00ff66' : '3px solid transparent', transition: 'all 0.2s' }}>
            {tab.icon} <span>{tab.label}</span>
          </div>
        ))}
      </nav>
      <footer style={{ marginTop: 'auto', paddingTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 10, background: 'rgba(255,255,255,0.02)', borderRadius: 12, marginBottom: '0.75rem' }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#00ff66,#00cc52)', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, flexShrink: 0 }}>
            {user?.fullName?.charAt(0) || '?'}
          </div>
          <div style={{ overflow: 'hidden' }}>
            <p style={{ fontSize: '0.8rem', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.fullName}</p>
            <p style={{ fontSize: '0.6rem', color: '#8b949e', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{user?.role}</p>
          </div>
        </div>
        <div onClick={onLogout} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 10, cursor: 'pointer', color: '#8b949e', fontWeight: 600, fontSize: '0.85rem' }}>
          <LogOut size={16} /> <span>Sign Out</span>
        </div>
      </footer>
    </aside>
    <main style={{ display: 'flex', flexDirection: 'column', background: 'radial-gradient(circle at 50% 0%, #0a1f12 0%, #050505 50%)', overflow: 'hidden' }}>
      <header style={{ height: 80, padding: '0 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.02em' }}>{tabs.find(t => t.id === activeTab)?.label || 'Dashboard'}</h2>
      </header>
      <div style={{ flex: 1, padding: '1.5rem 2rem', overflowY: 'auto' }}>{children}</div>
    </main>
  </div>
);

// ============ GLASS CARD ============
export const GlassCard: React.FC<{ children: React.ReactNode; style?: React.CSSProperties; className?: string }> = ({ children, style, className }) => (
  <div className={className} style={{ background: 'rgba(10, 15, 12, 0.8)', backdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: '1.5rem', transition: 'all 0.2s', ...style }}>
    {children}
  </div>
);

// ============ STATS CARD ============
export const StatsCard: React.FC<{ label: string; value: string | number; icon: React.ReactNode; color?: string }> = ({ label, value, icon, color = '#00ff66' }) => (
  <GlassCard style={{ textAlign: 'center', padding: '1.25rem', borderTop: `3px solid ${color}` }}>
    <div style={{ color, marginBottom: 8, display: 'flex', justifyContent: 'center' }}>{icon}</div>
    <p style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fff' }}>{value}</p>
    <p style={{ fontSize: '0.7rem', color: '#8b949e', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', marginTop: 4 }}>{label}</p>
  </GlassCard>
);

// ============ TASK CARD ============
export const TaskCard: React.FC<{ task: any; onClick?: () => void; showActions?: boolean; onApprove?: () => void; onReject?: () => void; onEdit?: () => void; onDelete?: () => void }> = ({ task, onClick, showActions, onApprove, onReject, onEdit, onDelete }) => {
  const overdue = isOverdue(task.targetDate);
  const statusColor = getStatusColor(task.status);
  return (
    <GlassCard style={{ cursor: onClick ? 'pointer' : 'default', padding: '1.25rem', borderTop: `4px solid ${overdue && task.status !== 'acc' && task.status !== 'completed' ? '#f85149' : task.status === 'review' ? '#f59e0b' : statusColor}`, display: 'flex', flexDirection: 'column', gap: 12, minHeight: 220, justifyContent: 'space-between', position: 'relative', textAlign: 'center', alignItems: 'center' }}>
      {onEdit || onDelete ? (
        <div style={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 4 }}>
          {onEdit && <button onClick={(e) => { e.stopPropagation(); onEdit(); }} style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 6, padding: 4, border: 'none', color: '#cbd5e1', cursor: 'pointer' }}><Edit2 size={12} /></button>}
          {onDelete && <button onClick={(e) => { e.stopPropagation(); onDelete(); }} style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 6, padding: 4, border: 'none', color: '#f85149', cursor: 'pointer' }}><Trash2 size={12} /></button>}
        </div>
      ) : null}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, width: '100%' }}>
        <div style={{ background: `rgba(${statusColor === '#00ff66' ? '0,255,102' : statusColor === '#f59e0b' ? '245,158,11' : '248,81,73'}, 0.1)`, color: statusColor, padding: 10, borderRadius: '50%', border: `1px solid ${statusColor}`, display: 'flex', justifyContent: 'center', alignItems: 'center', width: 48, height: 48 }}>
          {task.status === 'review' ? <Target size={20} /> : overdue && task.status !== 'acc' && task.status !== 'completed' ? <AlertTriangle size={20} /> : <HelpCircle size={20} />}
        </div>
        <span style={{ fontSize: '8px', fontWeight: 900, textTransform: 'uppercase', padding: '3px 8px', borderRadius: 10, background: 'rgba(255,255,255,0.05)', color: '#8b949e' }}>{task.status?.replace('_', ' ')}</span>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, lineHeight: '1.3', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{task.title}</h3>
      </div>
      <div style={{ width: '100%', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'center' }}>
        {task.assignee?.fullName && <span style={{ fontSize: '0.7rem', color: '#8b949e', fontWeight: 600 }}><Users size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} />{task.assignee.fullName}</span>}
        {task.targetDate && <span style={{ fontSize: '0.7rem', color: overdue && task.status !== 'acc' && task.status !== 'completed' ? '#f85149' : '#8b949e', fontWeight: 600 }}><Clock size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} />{task.targetDate.replace('T', ' ')}</span>}
        {task.githubLink && <button onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(task.githubLink); }} style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 4, color: '#00ff66', background: 'rgba(0,255,102,0.1)', padding: '4px 10px', borderRadius: 6, border: '1px solid rgba(0,255,102,0.2)', cursor: 'pointer', fontSize: '9px', fontWeight: 800 }}><Copy size={12} /> REPO</button>}
      </div>
      {showActions && task.status === 'review' && (
        <div style={{ display: 'flex', gap: 8, width: '100%' }}>
          <button onClick={(e) => { e.stopPropagation(); onReject?.(); }} style={{ flex: 1, background: '#f85149', padding: '10px 0', borderRadius: 10, color: '#fff', fontSize: '0.75rem', fontWeight: 800, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}><X size={14} /> REJECT</button>
          <button onClick={(e) => { e.stopPropagation(); onApprove?.(); }} style={{ flex: 1, background: '#10b981', padding: '10px 0', borderRadius: 10, color: '#000', fontSize: '0.75rem', fontWeight: 800, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}><CheckCircle size={14} /> APPROVE</button>
        </div>
      )}
    </GlassCard>
  );
};
