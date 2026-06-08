import React from 'react';
import { Role, ROLE_LABELS } from '@taskmaster/shared';
import { LogOut, LayoutDashboard, Users, FileText, Settings, Clock, Shield } from 'lucide-react';

interface LayoutProps {
  user: { id: string; fullName: string; username: string; role: Role };
  activeTab: string;
  onTabChange: (tab: string) => void;
  onLogout: () => void;
  tabs: { id: string; label: string; icon: React.ReactNode }[];
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ user, activeTab, onTabChange, onLogout, tabs, children }) => {
  const roleLabel = ROLE_LABELS[user.role] || user.role;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', height: '100vh', width: '100vw' }}>
      {/* Sidebar */}
      <aside style={{ backgroundColor: '#0a0a0a', borderRight: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column', padding: '2.5rem 1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '3rem', padding: '0 0.5rem' }}>
          <div style={{ background: '#00ff66', padding: '8px', borderRadius: '12px', display: 'flex' }}>
            <Shield size={20} color="white" />
          </div>
          <span style={{ fontWeight: 800, fontSize: '1.2rem', letterSpacing: '-0.5px' }}>TaskMaster</span>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
          {tabs.map(tab => (
            <div
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px',
                borderRadius: '12px', cursor: 'pointer', transition: 'all 0.2s',
                fontWeight: 600, fontSize: '0.9rem',
                background: activeTab === tab.id ? 'rgba(0, 255, 102, 0.15)' : 'transparent',
                color: activeTab === tab.id ? '#00ff66' : '#8b949e',
                borderLeft: activeTab === tab.id ? '3px solid #00ff66' : '3px solid transparent',
              }}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </div>
          ))}
        </nav>

        <footer style={{ marginTop: 'auto', paddingTop: '2rem', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', marginBottom: '1rem' }}>
            <div style={{
              width: '40px', height: '40px', borderRadius: '12px',
              background: 'linear-gradient(135deg, #00ff66, #00cc52)', color: '#000',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 800, flexShrink: 0,
            }}>
              {user.fullName?.charAt(0)}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <p style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.fullName}</p>
              <p style={{ fontSize: '0.65rem', color: '#8b949e', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{roleLabel}</p>
            </div>
          </div>
          <div
            onClick={onLogout}
            style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '12px', cursor: 'pointer', color: '#8b949e', fontWeight: 600, fontSize: '0.9rem' }}
          >
            <LogOut size={18} />
            <span>Sign Out</span>
          </div>
        </footer>
      </aside>

      {/* Main Content */}
      <main style={{ display: 'flex', flexDirection: 'column', background: 'radial-gradient(circle at 50% 0%, #0a1f12 0%, #050505 50%)', overflow: 'hidden' }}>
        <header style={{ height: '90px', padding: '0 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
            {tabs.find(t => t.id === activeTab)?.label || 'Dashboard'}
          </h2>
        </header>
        <div className="scroll-area">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
