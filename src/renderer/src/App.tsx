import { useState, useEffect } from 'react'
import { Toaster } from 'react-hot-toast'
import Login from './components/Login'
import GenericTaskDashboard from './components/dashboards/GenericTaskDashboard'
import api from './api/client'

const globalStyles = `
* { margin: 0; padding: 0; box-sizing: border-box; }
body, html, #root { height: 100vh; width: 100vw; overflow: hidden; font-family: 'Plus Jakarta Sans', sans-serif; background-color: #050505; color: #f8fafc; }
:root { --bg-main: #050505; --bg-sidebar: #0a0a0a; --bg-card: rgba(10,15,12,0.8); --accent: #00ff66; --accent-dark: #00cc52; --accent-glow: rgba(0,255,102,0.15); --border: rgba(0,255,102,0.2); --border-light: rgba(255,255,255,0.08); --text-main: #f8fafc; --text-muted: #8b949e; --success: #00ff66; --warning: #f59e0b; --danger: #f85149; }
.btn-primary { background: var(--accent); color: #000; padding: 1rem 1.5rem; border-radius: 12px; font-weight: 800; font-size: 1rem; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 10px; transition: all 0.2s; box-shadow: 0 4px 20px rgba(0,255,102,0.2); width: 100%; }
.btn-primary:hover { transform: translateY(-2px); background: #00cc52; box-shadow: 0 6px 25px rgba(0,255,102,0.3); }
.glass-card { background: rgba(10,15,12,0.8); backdrop-filter: blur(24px); border: 1px solid var(--border-light); border-radius: 20px; padding: 1.75rem; transition: transform 0.2s, border-color 0.2s; }
.glass-card:hover { border-color: var(--border); transform: translateY(-2px); }
.scroll-area { flex: 1; padding: 2rem; overflow-y: auto; }
::-webkit-scrollbar { width: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 3px; }
@keyframes spin { to { transform: rotate(360deg); } }
@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
.animate-in { animation: fadeIn 0.3s ease-out; }
.animate-spin { animation: spin 0.8s linear infinite; }
`

function App() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const storedUser = localStorage.getItem('user')
    if (storedUser && api.isAuthenticated) {
      setUser(JSON.parse(storedUser))
      api.getMe().then(res => {
        if (res.success && res.data) {
          setUser(res.data)
          localStorage.setItem('user', JSON.stringify(res.data))
        }
      })
    }
    setLoading(false)
  }, [])

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#0a0c10' }}>
        <div style={{ width: 48, height: 48, borderRadius: '50%', border: '3px solid rgba(0,255,102,0.1)', borderTopColor: '#00ff66', animation: 'spin 0.8s linear infinite' }}></div>
      </div>
    )
  }

  if (!user) {
    return (
      <>
        <style>{globalStyles}</style>
        <Login />
      </>
    )
  }

  const role = user.role?.toLowerCase()

  return (
    <>
      <style>{globalStyles}</style>
      <Toaster position="top-right" toastOptions={{ style: { background: '#0a0a0a', color: '#fff', border: '1px solid rgba(0,255,102,0.2)' } }} />

      {role === 'direktur' && <DirekturDashboard user={user} />}
      {(role === 'koordinator' || role === 'lead_it' || role === 'lead_ai') && (
        <GenericTaskDashboard user={user} roleLabel={user.role} managedRole={role === 'koordinator' ? 'teknisi' : role === 'lead_it' ? 'it_programmer' : 'ai_engineer'} canAssign={true} canSelfTask={false} />
      )}
      {(role === 'teknisi' || role === 'it_programmer' || role === 'ai_engineer') && (
        <GenericTaskDashboard user={user} roleLabel={user.role} canAssign={false} canSelfTask={true} />
      )}
    </>
  )
}

// ============ DIREKTUR DASHBOARD ============
const DirekturDashboard = ({ user }: { user: any }) => {
  const [activeTab, setActiveTab] = useState('overview')
  const [stats, setStats] = useState<any>(null)
  const [teamSummary, setTeamSummary] = useState<any[]>([])
  const [allTasks, setAllTasks] = useState<any[]>([])
  const [reports, setReports] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true)
      const [statsRes, teamRes, tasksRes, reportsRes] = await Promise.all([
        api.getStats(user.id),
        api.getTeamSummary(user.id),
        api.getTasks(),
        api.getReports(),
      ])
      if (statsRes.success) setStats(statsRes.data)
      if (teamRes.success) setTeamSummary(teamRes.data || [])
      if (tasksRes.success) setAllTasks(tasksRes.data || [])
      if (reportsRes.success) setReports(reportsRes.data || [])
      setLoading(false)
    }
    fetchAll()
    const i = setInterval(fetchAll, 15000)
    return () => clearInterval(i)
  }, [user.id])

  const activeTasks = allTasks.filter((t: any) => t.status !== 'completed' && t.status !== 'acc')
  const overdueTasks = activeTasks.filter((t: any) => {
    if (!t.targetDate) return false
    const deadline = t.targetDate.includes('T') ? new Date(t.targetDate) : new Date(`${t.targetDate}T17:00:00`)
    return new Date() > deadline
  })

  const tabs = [
    { id: 'overview', label: 'Executive Overview', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3v18h18"/><path d="M7 16l4-8 4 4 4-6"/></svg> },
    { id: 'teams', label: 'Teams', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
    { id: 'tasks', label: 'All Tasks', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 12l2 2 4-4"/></svg> },
    { id: 'reports', label: 'Reports', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg> },
  ]

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#050505' }}><div style={{ width: 48, height: 48, borderRadius: '50%', border: '3px solid rgba(0,255,102,0.1)', borderTopColor: '#00ff66', animation: 'spin 0.8s linear infinite' }}></div></div>

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', height: '100vh', width: '100vw' }}>
      <aside style={{ background: '#0a0a0a', borderRight: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column', padding: '2rem 1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '2rem', padding: '0 0.5rem' }}>
          <div style={{ background: '#00ff66', padding: 8, borderRadius: 12, display: 'flex' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          </div>
          <span style={{ fontWeight: 800, fontSize: '1.1rem' }}>TaskMaster</span>
        </div>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
          {tabs.map(tab => (
            <div key={tab.id} onClick={() => setActiveTab(tab.id)}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 10, cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', background: activeTab === tab.id ? 'rgba(0,255,102,0.15)' : 'transparent', color: activeTab === tab.id ? '#00ff66' : '#8b949e', borderLeft: activeTab === tab.id ? '3px solid #00ff66' : '3px solid transparent' }}>
              {tab.icon} <span>{tab.label}</span>
            </div>
          ))}
        </nav>
        <footer style={{ marginTop: 'auto', paddingTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 10, background: 'rgba(255,255,255,0.02)', borderRadius: 12, marginBottom: '0.75rem' }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#00ff66,#00cc52)', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>{user.fullName?.charAt(0)}</div>
            <div><p style={{ fontSize: '0.8rem', fontWeight: 700 }}>{user.fullName}</p><p style={{ fontSize: '0.6rem', color: '#8b949e', fontWeight: 800, textTransform: 'uppercase' }}>DIREKTUR</p></div>
          </div>
          <div onClick={() => api.logout()} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 10, cursor: 'pointer', color: '#8b949e', fontWeight: 600, fontSize: '0.85rem' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            <span>Sign Out</span>
          </div>
        </footer>
      </aside>

      <main style={{ display: 'flex', flexDirection: 'column', background: 'radial-gradient(circle at 50% 0%, #0a1f12 0%, #050505 50%)', overflow: 'hidden' }}>
        <header style={{ height: 80, padding: '0 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
            <span style={{ color: '#00ff66' }}>●</span> {tabs.find(t => t.id === activeTab)?.label || 'Dashboard'}
          </h2>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', color: '#8b949e', fontWeight: 600 }}>
              {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
          </div>
        </header>

        <div style={{ flex: 1, padding: '1.5rem 2rem', overflowY: 'auto' }}>
          {activeTab === 'overview' && (
            <>
              {/* KPI Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: '2rem' }}>
                <div style={{ background: 'rgba(10,15,12,0.8)', backdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: '1.5rem', textAlign: 'center', borderTop: '3px solid #00ff66' }}>
                  <p style={{ fontSize: '2rem', fontWeight: 800, color: '#00ff66' }}>{allTasks.length}</p>
                  <p style={{ fontSize: '0.7rem', color: '#8b949e', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', marginTop: 4 }}>Total Tasks</p>
                </div>
                <div style={{ background: 'rgba(10,15,12,0.8)', backdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: '1.5rem', textAlign: 'center', borderTop: '3px solid #10b981' }}>
                  <p style={{ fontSize: '2rem', fontWeight: 800, color: '#10b981' }}>{allTasks.filter((t: any) => t.status === 'completed' || t.status === 'acc').length}</p>
                  <p style={{ fontSize: '0.7rem', color: '#8b949e', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', marginTop: 4 }}>Completed</p>
                </div>
                <div style={{ background: 'rgba(10,15,12,0.8)', backdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: '1.5rem', textAlign: 'center', borderTop: '3px solid #f59e0b' }}>
                  <p style={{ fontSize: '2rem', fontWeight: 800, color: '#f59e0b' }}>{activeTasks.length}</p>
                  <p style={{ fontSize: '0.7rem', color: '#8b949e', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', marginTop: 4 }}>Active</p>
                </div>
                <div style={{ background: 'rgba(10,15,12,0.8)', backdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: '1.5rem', textAlign: 'center', borderTop: '3px solid #f85149' }}>
                  <p style={{ fontSize: '2rem', fontWeight: 800, color: '#f85149' }}>{overdueTasks.length}</p>
                  <p style={{ fontSize: '0.7rem', color: '#8b949e', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', marginTop: 4 }}>Overdue</p>
                </div>
                <div style={{ background: 'rgba(10,15,12,0.8)', backdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: '1.5rem', textAlign: 'center', borderTop: '3px solid #58a6ff' }}>
                  <p style={{ fontSize: '2rem', fontWeight: 800, color: '#58a6ff' }}>{teamSummary.length}</p>
                  <p style={{ fontSize: '0.7rem', color: '#8b949e', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', marginTop: 4 }}>Team Members</p>
                </div>
              </div>

              {/* Team Performance */}
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1rem', color: '#fff' }}>Team Performance</h3>
              <div style={{ display: 'grid', gap: 12, marginBottom: '2rem' }}>
                {teamSummary.map((member: any) => (
                  <div key={member.userId} style={{ background: 'rgba(10,15,12,0.8)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg,#00ff66,#00cc52)', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>{member.fullName?.charAt(0)}</div>
                      <div>
                        <p style={{ fontWeight: 700 }}>{member.fullName}</p>
                        <p style={{ fontSize: '0.65rem', color: '#8b949e', textTransform: 'uppercase', fontWeight: 600 }}>{member.role}</p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 20 }}>
                      <div style={{ textAlign: 'center' }}><p style={{ fontWeight: 800, color: '#f59e0b' }}>{member.activeTasks}</p><p style={{ fontSize: '0.6rem', color: '#8b949e' }}>Active</p></div>
                      <div style={{ textAlign: 'center' }}><p style={{ fontWeight: 800, color: '#10b981' }}>{member.completedTasks}</p><p style={{ fontSize: '0.6rem', color: '#8b949e' }}>Done</p></div>
                      <div style={{ textAlign: 'center' }}><p style={{ fontWeight: 800, color: member.overdueTasks > 0 ? '#f85149' : '#8b949e' }}>{member.overdueTasks}</p><p style={{ fontSize: '0.6rem', color: '#8b949e' }}>Overdue</p></div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Overdue Tasks Alert */}
              {overdueTasks.length > 0 && (
                <>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1rem', color: '#f85149' }}>⚠️ Overdue Tasks</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
                    {overdueTasks.slice(0, 6).map((task: any) => (
                      <div key={task.id} style={{ background: 'rgba(248,81,73,0.1)', border: '1px solid rgba(248,81,73,0.3)', borderRadius: 12, padding: '1rem' }}>
                        <p style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: 4 }}>{task.title}</p>
                        <p style={{ fontSize: '0.7rem', color: '#f85149' }}>{task.assignee?.fullName} • {task.targetDate?.replace('T', ' ')}</p>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </>
          )}

          {activeTab === 'teams' && (
            <div style={{ display: 'grid', gap: '1.5rem' }}>
              {['KOORDINATOR', 'LEAD_IT', 'LEAD_AI'].map(leadRole => {
                const members = teamSummary.filter((m: any) => {
                  if (leadRole === 'KOORDINATOR') return m.role === 'TEKNISI'
                  if (leadRole === 'LEAD_IT') return m.role === 'IT_PROGRAMMER'
                  if (leadRole === 'LEAD_AI') return m.role === 'AI_ENGINEER'
                  return false
                })
                return (
                  <div key={leadRole} style={{ background: 'rgba(10,15,12,0.8)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: '1.5rem' }}>
                    <h3 style={{ fontWeight: 800, marginBottom: '1rem', fontSize: '1rem', color: '#00ff66' }}>{leadRole}</h3>
                    {members.length === 0 ? (
                      <p style={{ color: '#8b949e', fontSize: '0.85rem' }}>No members in this team.</p>
                    ) : (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
                        {members.map((m: any) => (
                          <div key={m.userId} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: '1rem', textAlign: 'center' }}>
                            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg,#00ff66,#00cc52)', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, margin: '0 auto 8px' }}>{m.fullName?.charAt(0)}</div>
                            <p style={{ fontWeight: 700, fontSize: '0.85rem' }}>{m.fullName}</p>
                            <p style={{ fontSize: '0.65rem', color: '#8b949e' }}>{m.activeTasks} active • {m.overdueTasks} overdue</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {activeTab === 'tasks' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
              {activeTasks.length === 0 ? (
                <div style={{ background: 'rgba(10,15,12,0.8)', borderRadius: 20, padding: 48, textAlign: 'center', color: '#8b949e', gridColumn: '1 / -1' }}>No active tasks across all teams.</div>
              ) : (
                activeTasks.map((task: any) => (
                  <div key={task.id} style={{ background: 'rgba(10,15,12,0.8)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '1.25rem', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: task.status === 'review' ? '#f59e0b' : overdueTasks.find((t: any) => t.id === task.id) ? '#f85149' : '#00ff66' }}></div>
                    <p style={{ fontSize: '0.65rem', color: '#8b949e', fontWeight: 700, textTransform: 'uppercase', marginBottom: 8 }}>{task.status?.replace('_', ' ')}</p>
                    <h4 style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: 8 }}>{task.title}</h4>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#8b949e' }}>
                      <span>{task.assignee?.fullName || 'Unassigned'}</span>
                      <span>{task.creator?.fullName}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'reports' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {reports.length === 0 ? (
                <div style={{ background: 'rgba(10,15,12,0.8)', borderRadius: 20, padding: 48, textAlign: 'center', color: '#8b949e' }}>No reports generated yet.</div>
              ) : (
                reports.map((r: any) => (
                  <div key={r.id} style={{ background: 'rgba(10,15,12,0.8)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                      <div><h4 style={{ fontWeight: 800 }}>{r.user?.fullName} - {r.date}</h4><p style={{ fontSize: '0.7rem', color: '#8b949e' }}>{r.user?.role}</p></div>
                      <button onClick={() => { navigator.clipboard.writeText(r.content); }} style={{ background: 'rgba(0,255,102,0.1)', color: '#00ff66', border: '1px solid rgba(0,255,102,0.2)', padding: '6px 12px', borderRadius: 8, cursor: 'pointer', fontSize: '0.75rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                        COPY
                      </button>
                    </div>
                    <pre style={{ fontSize: '0.8rem', color: '#cbd5e1', lineHeight: '1.6', whiteSpace: 'pre-wrap', fontFamily: 'inherit', background: '#0a0d14', padding: '1rem', borderRadius: 8 }}>{r.content.substring(0, 500)}...</pre>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

export default App
