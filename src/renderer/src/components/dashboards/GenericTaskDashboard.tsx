import { useState, useEffect, useCallback } from 'react'
import { LayoutDashboard, Plus, Play, Send, Check, Clock } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../api/client'
import { SidebarLayout, LoadingSpinner, TaskCard, StatsCard, GlassCard, Icons, getStatusColor } from '../shared/SharedComponents'

interface Props {
  user: any
  roleLabel: string
  managedRole?: string
  canAssign: boolean
  canSelfTask: boolean
}

const GenericTaskDashboard: React.FC<Props> = ({ user, roleLabel, canAssign, canSelfTask }) => {
  const [activeTab, setActiveTab] = useState('tasks')
  const [tasks, setTasks] = useState<any[]>([])
  const [team, setTeam] = useState<any[]>([])
  const [reports, setReports] = useState<any[]>([])
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [instructions, setInstructions] = useState('')
  const [targetDate, setTargetDate] = useState('')
  const [assigneeId, setAssigneeId] = useState('')
  const [githubLink, setGithubLink] = useState('')
  const [selectedTask, setSelectedTask] = useState<any>(null)
  const [showAddDevForm, setShowAddDevForm] = useState(false)
  const [newDevName, setNewDevName] = useState('')
  const [newDevUsername, setNewDevUsername] = useState('')

  const fetchTasks = useCallback(async () => {
    if (canAssign) {
      const res = await api.getTasks()
      if (res.success) setTasks(res.data || [])
    } else {
      const res = await api.getMyTasks(user.id)
      if (res.success) setTasks(res.data || [])
    }
  }, [user.id, canAssign])

  const fetchData = useCallback(async () => {
    setLoading(true)
    await Promise.all([
      fetchTasks(),
      api.getUsers().then(r => { if (r.success) setTeam(r.data || []) }),
      api.getStats(user.id).then(r => { if (r.success) setStats(r.data) }),
      api.getMyReports(user.id).then(r => { if (r.success) setReports(r.data || []) }),
    ])
    setLoading(false)
  }, [user.id, fetchTasks])

  useEffect(() => { fetchData(); const i = setInterval(fetchTasks, 10000); return () => clearInterval(i) }, [fetchData, fetchTasks])

  const updateStatus = async (id: string, status: string) => {
    const res = await api.updateTaskStatus(id, status)
    if (res.success) { toast.success(`Status: ${status}`); fetchTasks(); if (selectedTask?.id === id) setSelectedTask({ ...selectedTask, status }) }
  }

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || !targetDate) { toast.error('Lengkapi semua field'); return }
    const res = await api.createTask({
      title, instructions, githubLink, target_date: targetDate,
      assigned_to: assigneeId || user.id, created_by: user.id, status: 'pending'
    })
    if (res.success) { toast.success('Task Created!'); setShowForm(false); resetForm(); fetchTasks() }
    else toast.error(res.error || 'Failed')
  }

  const resetForm = () => { setTitle(''); setInstructions(''); setGithubLink(''); setTargetDate(''); setAssigneeId('') }

  const handleAddDev = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newDevName || !newDevUsername) { toast.error('Lengkapi semua field'); return }
    const res = await api.request('POST', '/api/users', {
      fullName: newDevName, username: newDevUsername, password: 'admin123', role: 'developer'
    })
    if (res.success) { toast.success('Developer Added!'); setShowAddDevForm(false); fetchData() }
    else toast.error(res.error || 'Failed')
  }

  const handleDeleteTask = async (id: string) => {
    if (!confirm('Hapus task ini?')) return
    const res = await api.deleteTask(id)
    if (res.success) { toast.success('Deleted'); setTasks(tasks.filter(t => t.id !== id)) }
  }

  const handleGenerateReport = async () => {
    toast.loading('Generating...', { id: 'rpt' })
    const res = await api.generateReport(user.id, true)
    if (res.success) { toast.success('Report generated!', { id: 'rpt' }); fetchData() }
    else toast.error(res.error || 'Failed', { id: 'rpt' })
  }

  const activeTasks = tasks.filter((t: any) => t.status !== 'completed' && t.status !== 'acc' && t.status !== 'accepted')
  const historyTasks = tasks.filter((t: any) => t.status === 'completed' || t.status === 'acc' || t.status === 'accepted')

  if (loading) return <LoadingSpinner />

  const tabs = [
    { id: 'tasks', label: 'Task Roadmap', icon: <LayoutDashboard size={18} /> },
    { id: 'history', label: 'History', icon: <Icons.Archive size={18} /> },
    { id: 'reports', label: 'Reports', icon: <Icons.FileText size={18} /> },
  ]
  if (canAssign) tabs.push({ id: 'team', label: 'My Team', icon: <Icons.Users size={18} /> })

  return (
    <SidebarLayout user={user} activeTab={activeTab} onTabChange={setActiveTab} onLogout={() => api.logout()} tabs={tabs}>
      {activeTab === 'tasks' && (
        <>
          {/* Stats */}
          {stats && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 16, marginBottom: '2rem' }}>
              <StatsCard label="Total Tasks" value={stats.totalTasks} icon={<LayoutDashboard size={24} />} />
              <StatsCard label="Completed" value={stats.completedTasks} icon={<CheckCircle size={24} />} color="#10b981" />
              <StatsCard label="In Progress" value={stats.inProgressTasks} icon={<Play size={24} />} color="#f59e0b" />
              <StatsCard label="Overdue" value={stats.overdueTasks} icon={<Icons.AlertTriangle size={24} />} color="#f85149" />
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.5rem', gap: 12 }}>
            {canAssign && (
              <button onClick={() => setShowForm(true)} className="btn-primary" style={{ width: 'auto', padding: '0.75rem 1.5rem', fontSize: '0.85rem' }}>
                <Plus size={18} /> New Task
              </button>
            )}
            {canSelfTask && (
              <button onClick={() => setShowForm(true)} className="btn-primary" style={{ width: 'auto', padding: '0.75rem 1.5rem', fontSize: '0.85rem', background: '#10b981' }}>
                <Plus size={18} /> Personal Mission
              </button>
            )}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1.5rem' }}>
            {activeTasks.length === 0 ? (
              <GlassCard style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 48, color: '#8b949e' }}>No active tasks.</GlassCard>
            ) : (
              activeTasks.map((task: any) => (
                <TaskCard key={task.id} task={task} onClick={() => setSelectedTask(task)}
                  showActions={canAssign} onApprove={() => updateStatus(task.id, 'acc')} onReject={() => updateStatus(task.id, 'in_progress')}
                  onEdit={canAssign ? () => {} : undefined} onDelete={canAssign ? () => handleDeleteTask(task.id) : undefined} />
              ))
            )}
          </div>
        </>
      )}

      {activeTab === 'history' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1.5rem' }}>
          {historyTasks.length === 0 ? (
            <GlassCard style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 48, color: '#8b949e' }}>No history.</GlassCard>
          ) : (
            historyTasks.map((task: any) => (
              <GlassCard key={task.id} style={{ opacity: 0.7, textAlign: 'center', padding: '1.25rem', borderTop: '4px solid #10b981', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                <div style={{ background: 'rgba(16,185,129,0.1)', padding: 12, borderRadius: '50%', color: '#10b981', width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icons.CheckCircle size={24} />
                </div>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, textDecoration: 'line-through' }}>{task.title}</h3>
                <span style={{ fontSize: '0.7rem', color: '#8b949e' }}>{task.assignee?.fullName}</span>
              </GlassCard>
            ))
          )}
        </div>
      )}

      {activeTab === 'reports' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.2)', padding: '1.5rem', borderRadius: 16, border: '1px solid rgba(255,255,255,0.08)' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Daily Reports</h3>
              <p style={{ fontSize: '0.8rem', color: '#8b949e' }}>Auto-generated summaries of activities.</p>
            </div>
            <button onClick={handleGenerateReport} style={{ background: '#00ff66', color: '#000', padding: '0.75rem 1.5rem', borderRadius: 10, fontWeight: 800, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 20px rgba(0,255,102,0.2)' }}>
              <Icons.Rocket size={16} /> GENERATE NOW
            </button>
          </div>
          {reports.length === 0 ? (
            <GlassCard style={{ textAlign: 'center', padding: 48, color: '#8b949e' }}>No reports generated yet.</GlassCard>
          ) : (
            reports.map((r: any) => (
              <GlassCard key={r.id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <h4 style={{ fontWeight: 800 }}>Report - {r.date}</h4>
                  <button onClick={() => { navigator.clipboard.writeText(r.content); toast.success('Copied!') }}
                    style={{ background: 'rgba(0,255,102,0.1)', color: '#00ff66', border: '1px solid rgba(0,255,102,0.2)', padding: '6px 12px', borderRadius: 8, cursor: 'pointer', fontSize: '0.75rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Icons.Copy size={14} /> COPY
                  </button>
                </div>
                <pre style={{ fontSize: '0.85rem', color: '#cbd5e1', lineHeight: '1.7', whiteSpace: 'pre-wrap', fontFamily: 'inherit', background: '#0a0d14', padding: '1rem', borderRadius: 8, border: '1px solid rgba(255,255,255,0.03)' }}>{r.content}</pre>
              </GlassCard>
            ))
          )}
        </div>
      )}

      {activeTab === 'team' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.5rem' }}>
            <button onClick={() => setShowAddDevForm(true)} style={{ background: '#10b981', padding: '0.75rem 1.5rem', borderRadius: 10, fontWeight: 800, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, color: '#000' }}>
              <Icons.UserPlus size={18} /> Add Member
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
            {team.filter((m: any) => canAssign ? m.role === roleLabel.toLowerCase() : true).map((member: any) => (
              <GlassCard key={member.id} style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 56, height: 56, borderRadius: 14, background: 'linear-gradient(135deg,#00ff66,#00cc52)', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1.25rem' }}>{member.fullName?.charAt(0)}</div>
                <h3 style={{ fontWeight: 700 }}>{member.fullName}</h3>
                <p style={{ fontSize: '0.7rem', color: '#8b949e', fontWeight: 700, textTransform: 'uppercase' }}>{member.role}</p>
              </GlassCard>
            ))}
          </div>
        </>
      )}

      {/* Add Task Modal */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '2rem' }}>
          <GlassCard style={{ maxWidth: 500, width: '100%', background: '#080a0f', border: '1px solid rgba(255,255,255,0.1)' }}>
            <h2 style={{ marginBottom: '1.5rem', fontWeight: 800 }}>New Task</h2>
            <form onSubmit={handleAddTask} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <input placeholder="Task Title" value={title} onChange={e => setTitle(e.target.value)} required style={{ width: '100%', background: 'rgba(0,255,102,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '0.85rem 1rem', color: '#fff', fontFamily: 'inherit' }} />
              <textarea placeholder="Instructions (one per line)" value={instructions} onChange={e => setInstructions(e.target.value)} rows={4} style={{ width: '100%', background: 'rgba(0,255,102,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '0.85rem 1rem', color: '#fff', fontFamily: 'inherit', resize: 'vertical' }} />
              <input placeholder="GitHub URL (optional)" value={githubLink} onChange={e => setGithubLink(e.target.value)} style={{ width: '100%', background: 'rgba(0,255,102,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '0.85rem 1rem', color: '#fff', fontFamily: 'inherit' }} />
              {canAssign && (
                <select value={assigneeId} onChange={e => setAssigneeId(e.target.value)} required
                  style={{ width: '100%', background: 'rgba(0,255,102,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '0.85rem 1rem', color: '#fff', fontFamily: 'inherit' }}>
                  <option value="" style={{ background: '#080a0f' }}>Select assignee...</option>
                  {team.filter((m: any) => m.role !== 'lead' && m.id !== user.id).map((m: any) => (
                    <option key={m.id} value={m.id} style={{ background: '#080a0f' }}>{m.fullName}</option>
                  ))}
                </select>
              )}
              <input type="datetime-local" value={targetDate} onChange={e => setTargetDate(e.target.value)} required style={{ width: '100%', background: 'rgba(0,255,102,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '0.85rem 1rem', color: '#fff', fontFamily: 'inherit', colorScheme: 'dark' }} />
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setShowForm(false)} style={{ background: 'transparent', border: 'none', color: '#8b949e', cursor: 'pointer', fontWeight: 700 }}>Cancel</button>
                <button type="submit" className="btn-primary" style={{ width: 'auto', padding: '0.75rem 1.5rem', fontSize: '0.85rem' }}>Create Task</button>
              </div>
            </form>
          </GlassCard>
        </div>
      )}

      {/* Add Dev Modal */}
      {showAddDevForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '2rem' }}>
          <GlassCard style={{ maxWidth: 400, width: '100%', background: '#080a0f', border: '1px solid rgba(255,255,255,0.1)' }}>
            <h2 style={{ marginBottom: '1.5rem', fontWeight: 800 }}>Add Team Member</h2>
            <form onSubmit={handleAddDev} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <input placeholder="Full Name" value={newDevName} onChange={e => setNewDevName(e.target.value)} required style={{ width: '100%', background: 'rgba(0,255,102,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '0.85rem 1rem', color: '#fff', fontFamily: 'inherit' }} />
              <input placeholder="Username" value={newDevUsername} onChange={e => setNewDevUsername(e.target.value)} required style={{ width: '100%', background: 'rgba(0,255,102,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '0.85rem 1rem', color: '#fff', fontFamily: 'inherit' }} />
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setShowAddDevForm(false)} style={{ background: 'transparent', border: 'none', color: '#8b949e', cursor: 'pointer', fontWeight: 700 }}>Cancel</button>
                <button type="submit" style={{ background: '#10b981', padding: '0.75rem 1.5rem', borderRadius: 10, fontWeight: 800, border: 'none', cursor: 'pointer', color: '#000' }}>Add</button>
              </div>
            </form>
          </GlassCard>
        </div>
      )}
    </SidebarLayout>
  )
}

// Fix missing import
import { CheckCircle } from 'lucide-react'
export default GenericTaskDashboard
