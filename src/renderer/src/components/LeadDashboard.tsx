import { useState, useEffect } from 'react'
import { supabase, checkAutoReports } from '../lib/supabase'
import { Plus, CheckCircle, Clock, Users, LayoutDashboard, Settings, LogOut, Search, Shield, FileText, UserPlus, Copy, Archive, Target, AlertTriangle, Rocket, Trash2, Laptop, HelpCircle, Edit2, X } from 'lucide-react'
import toast from 'react-hot-toast'

const LeadDashboard = ({ profile }: { profile: any }) => {
  const [activeTab, setActiveTab] = useState<'tasks' | 'team' | 'reports' | 'settings' | 'history'>('tasks')
  const [tasks, setTasks] = useState<any[]>([])
  const [team, setTeam] = useState<any[]>([])
  const [reports, setReports] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [showAddDevForm, setShowAddDevForm] = useState(false)
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)
  
  // Task Form State
  const [title, setTitle] = useState('')
  const [githubLink, setGithubLink] = useState('')
  const [instructionList, setInstructionList] = useState<string[]>([''])
  const [targetDate, setTargetDate] = useState('')
  const [assigneeId, setAssigneeId] = useState('')

  // Dev Form State
  const [newDevName, setNewDevName] = useState('')
  const [newDevUsername, setNewDevUsername] = useState('')
  
  const defaultSchedule = {
    1: { label: 'Monday', enabled: true, time: '17:00' },
    2: { label: 'Tuesday', enabled: true, time: '17:00' },
    3: { label: 'Wednesday', enabled: true, time: '17:00' },
    4: { label: 'Thursday', enabled: true, time: '17:00' },
    5: { label: 'Friday', enabled: true, time: '17:00' },
    6: { label: 'Saturday', enabled: false, time: '13:00' },
    0: { label: 'Sunday', enabled: false, time: '17:00' },
  };
  const [schedule, setSchedule] = useState<any>(defaultSchedule);

  useEffect(() => {
    const settings = JSON.parse(localStorage.getItem('app_settings') || '{}');
    if (settings.schedule) {
      setSchedule(settings.schedule);
    } else {
      const migrated = { ...defaultSchedule };
      if (settings.time) {
        [1,2,3,4,5].forEach(d => migrated[d].time = settings.time);
      }
      if (settings.specialSaturday !== undefined) {
        migrated[6].enabled = settings.specialSaturday;
        if (settings.saturdayTime) migrated[6].time = settings.saturdayTime;
      }
      setSchedule(migrated);
    }
    fetchData()
  }, [activeTab])

  const fetchData = async (isSilent = false) => {
    if (!isSilent) setLoading(true)
    
    // Always fetch team for the Assignee dropdown
    const teamRes = await supabase.from('profiles').select('*').order('full_name')
    if (!teamRes.error) setTeam(teamRes.data || [])

    if (activeTab === 'tasks' || activeTab === 'history') {
      const { data, error } = await supabase.from('tasks').select('*, assigned_to(full_name)').order('created_at', { ascending: false })
      if (!error) {
        if (isSilent && tasks.length > 0) {
           data.forEach(newTask => {
              const oldTask = tasks.find(t => t.id === newTask.id);
              if (oldTask && oldTask.status !== 'review' && newTask.status === 'review') {
                 toast(`🚨 ${newTask.assigned_to?.full_name || 'A Developer'} submitted a task for review:\n${newTask.title}`, { icon: '🔔', duration: 6000 });
                 const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
                 audio.play().catch(() => {});
              }
           });
        }
        setTasks(data || [])
      }
    } else if (activeTab === 'reports') {
      const { data, error } = await supabase.from('daily_reports').select('*, user_id(full_name)').order('date', { ascending: false })
      if (!error) setReports(data || [])
    }
    setLoading(false)
  }

  useEffect(() => {
    const pollInterval = setInterval(() => {
      if (activeTab === 'tasks') {
        fetchData(true);
      }
    }, 10000);
    return () => clearInterval(pollInterval);
  }, [activeTab, tasks]);

  const resetForm = () => {
    setTitle('');
    setGithubLink('');
    setInstructionList(['']);
    setTargetDate('');
    setAssigneeId('');
    setEditingTaskId(null);
    setShowAddForm(false);
  }

  const handleEditClick = (task: any) => {
    setEditingTaskId(task.id);
    setTitle(task.title);
    setGithubLink(task.github_link || '');
    setInstructionList(task.instructions ? task.instructions.split('\n').map((i: string) => i.replace(/^- /, '')) : ['']);
    setTargetDate(task.target_date || '');
    setAssigneeId(task.assigned_to?.id || task.assigned_to?.$id || task.assigned_to || '');
    setShowAddForm(true);
  }

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault()
    const finalInstructions = instructionList.filter(i => i.trim() !== '').join('\n');
    if (!title || !assigneeId || !targetDate || !finalInstructions) {
      toast.error('Tolong lengkapi semua field!');
      return;
    }

    try {
      if (editingTaskId) {
        const { error } = await supabase.from('tasks').update({
          title,
          github_link: githubLink,
          instructions: finalInstructions,
          target_date: targetDate,
          assigned_to: assigneeId
        }).eq('id', editingTaskId);
        if (error) throw error;
        toast.success('Task Updated!');
      } else {
        const { error } = await supabase.from('tasks').insert([{
          title,
          github_link: githubLink,
          instructions: finalInstructions,
          target_date: targetDate,
          assigned_to: assigneeId,
          created_by: profile.id,
          status: 'pending'
        }]);
        if (error) throw error;
        toast.success('Task Assigned!');
      }
      resetForm();
      fetchData();
    } catch (error: any) {
      toast.error(error.message);
    }
  }

  const handleAddDev = async (e: React.FormEvent) => {
    e.preventDefault()
    const { error } = await supabase.from('profiles').insert([{ full_name: newDevName, role: 'developer', username: newDevUsername }])
    if (error) toast.error(error.message)
    else {
      toast.success('Developer Added to Team!')
      setShowAddDevForm(false)
      fetchData()
    }
  }

  const handleDeleteDev = async (id: string) => {
    if (confirm('Are you sure you want to remove this developer?')) {
      const { error } = await supabase.from('profiles').delete().eq('id', id)
      if (error) toast.error(error.message)
      else {
        toast.success('Developer removed')
        fetchData()
      }
    }
  }
  const updateStatus = async (taskId: string, status: string) => {
    const { error } = await supabase.from('tasks').update({ status }).eq('id', taskId)
    if (!error) {
      if (status === 'acc') toast.success('Mission Approved')
      else if (status === 'in_progress') toast.error('Mission Rejected / Sent Back to Progress')
      fetchData(true)
    }
  }

  const deleteTask = async (taskId: string) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    const { error } = await supabase.from('tasks').delete().eq('id', taskId);
    if (!error) {
      toast.success('Task deleted successfully');
      setTasks(tasks.filter(t => t.id !== taskId));
    } else {
      toast.error('Failed to delete task: ' + error.message);
    }
  }

  const deleteReport = async (reportId: string) => {
    if (!window.confirm('Are you sure you want to delete this report?')) return;
    const { error } = await supabase.from('daily_reports').delete().eq('id', reportId);
    if (!error) {
      toast.success('Report deleted successfully');
      setReports(reports.filter(r => r.id !== reportId));
    } else {
      toast.error('Failed to delete report: ' + error.message);
    }
  }

  const handleGenerateNow = async () => {
    toast.loading('Compiling developer activities...', { id: 'generate-toast' });
    try {
      await checkAutoReports(true);
      toast.success('Master Report generated successfully!', { id: 'generate-toast' });
      setActiveTab('reports');
    } catch (error: any) {
      toast.error('Failed: ' + (error.message || 'Unknown error'), { id: 'generate-toast' });
    }
  }

  const activeTasks = tasks.filter(t => t.status !== 'completed' && t.status !== 'acc');
  const historyTasks = tasks.filter(t => t.status === 'completed' || t.status === 'acc');

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div style={{ background: 'var(--accent)', padding: '8px', borderRadius: '12px', display: 'flex' }}>
            <Shield size={20} color="white" />
          </div>
          <span style={{ fontWeight: 800, fontSize: '1.2rem', letterSpacing: '-0.5px' }}>TaskMaster</span>
        </div>

        <nav className="nav-group">
          <div className={`nav-item ${activeTab === 'tasks' ? 'active' : ''}`} onClick={() => setActiveTab('tasks')}>
            <LayoutDashboard size={20} /> <span>Roadmap</span>
          </div>
          <div className={`nav-item ${activeTab === 'reports' ? 'active' : ''}`} onClick={() => setActiveTab('reports')}>
            <FileText size={20} /> <span>Daily Reports</span>
          </div>
          <div className={`nav-item ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>
            <Archive size={20} /> <span>Task History</span>
          </div>
          <div className={`nav-item ${activeTab === 'team' ? 'active' : ''}`} onClick={() => setActiveTab('team')}>
            <Users size={20} /> <span>Dev Team</span>
          </div>
          <div className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>
            <Settings size={20} /> <span>Settings</span>
          </div>
        </nav>

        <footer className="sidebar-footer">
          <div className="user-profile">
            <div className="avatar">{profile?.full_name?.charAt(0)}</div>
            <div className="flex-1 overflow-hidden">
              <p style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '2px' }} className="truncate">{profile?.full_name}</p>
              <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Lead Admin</p>
            </div>
          </div>
          <div className="nav-item" onClick={() => supabase.auth.signOut()} style={{ marginTop: '0.5rem' }}>
            <LogOut size={18} /> <span>Sign Out</span>
          </div>
        </footer>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <header className="content-header">
          <div className="header-title">
            <h2>
              {activeTab === 'tasks' ? 'Development Roadmap' : 
               activeTab === 'reports' ? 'Daily Reports' : 
               activeTab === 'history' ? 'Mission History' : 
               activeTab === 'settings' ? 'System Configuration' : 'Team Members'}
            </h2>
          </div>
          
          <div className="header-actions">
            <div style={{ position: 'relative' }}>
              <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} size={16} />
              <input placeholder="Search..." className="input-field" style={{ paddingLeft: '38px', width: '220px' }} />
            </div>
            {activeTab === 'tasks' ? (
              <button onClick={() => setShowAddForm(true)} className="btn-primary">
                <Plus size={18} /> <span>New Task</span>
              </button>
            ) : activeTab === 'team' ? (
              <button onClick={() => setShowAddDevForm(true)} className="btn-primary" style={{ background: '#10b981' }}>
                <UserPlus size={18} /> <span>Add Developer</span>
              </button>
            ) : null}
          </div>
        </header>

        <div className="scroll-area">
          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-accent"></div>
            </div>
          ) : activeTab === 'tasks' ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1.5rem' }}>
              {activeTasks.length === 0 ? (
                <div className="glass-card text-center p-12 text-muted" style={{ gridColumn: '1 / -1' }}>No active missions.</div>
              ) : (
                activeTasks.map(task => {
                  const isOverdue = new Date(task.target_date + 'T17:00:00') < new Date();
                  let cardClass = "glass-card flex flex-col gap-4 animate-in ";
                  if (task.status === 'review') cardClass += "task-review-glow ";
                  else if (isOverdue && task.status !== 'acc' && task.status !== 'completed') cardClass += "task-overdue-glow ";
                  else if (task.status === 'in_progress') cardClass += "task-progress-glow ";

                  return (
                  <div key={task.id} className={cardClass} style={{ padding: '1.5rem', position: 'relative', borderTop: task.status === 'review' ? '4px solid #f59e0b' : isOverdue ? '4px solid #f85149' : task.status === 'in_progress' ? '4px solid var(--accent)' : '1px solid var(--border)', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', justifyContent: 'space-between', minHeight: '260px', transition: 'all 0.3s ease' }}>
                    <div style={{ position: 'absolute', top: '12px', right: '12px', display: 'flex', gap: '8px' }}>
                      <button onClick={(e) => { e.stopPropagation(); handleEditClick(task); }} style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '6px', padding: '6px', border: 'none', color: '#cbd5e1', cursor: 'pointer', display: 'flex', transition: 'background 0.2s' }} className="hover:bg-white/10">
                        <Edit2 size={14} />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); deleteTask(task.id); }} style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '6px', padding: '6px', border: 'none', color: '#f85149', cursor: 'pointer', display: 'flex', transition: 'background 0.2s' }} className="hover:bg-red-500/20">
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <div className="flex flex-col items-center gap-3 w-full">
                      <div style={{ background: task.status === 'review' ? 'rgba(245, 158, 11, 0.1)' : isOverdue ? 'rgba(248, 81, 73, 0.1)' : task.status === 'in_progress' ? 'rgba(0, 255, 102, 0.05)' : 'rgba(255, 255, 255, 0.03)', color: task.status === 'review' ? '#f59e0b' : isOverdue ? '#f85149' : task.status === 'in_progress' ? 'var(--accent)' : 'var(--text-muted)', padding: '14px', borderRadius: '50%', border: '1px solid currentColor', display: 'flex', justifyContent: 'center', alignItems: 'center', width: '64px', height: '64px', marginBottom: '4px', transition: 'all 0.3s ease' }}>
                         {task.status === 'review' ? <Target size={28} /> : isOverdue ? <AlertTriangle size={28} /> : task.status === 'in_progress' ? <Laptop size={28} /> : <HelpCircle size={28} />}
                      </div>
                      <span style={{ fontSize: '9px', fontWeight: 900, textTransform: 'uppercase', padding: '4px 10px', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-muted)' }}>
                        {task.status.replace('_', ' ')}
                      </span>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 800, lineHeight: '1.4', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                        {task.title}
                      </h3>
                    </div>
                    
                    <div className="flex flex-col items-center gap-2 mt-4 w-full pt-4" style={{ borderTop: '1px solid var(--border-light)' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}><Users size={14} /> {task.assigned_to?.full_name}</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: isOverdue ? '#f85149' : 'var(--text-muted)', fontWeight: 600 }}><Clock size={14} /> {task.target_date.replace('T', ' ')}</span>
                      
                      {task.github_link && (
                        <button onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(task.github_link); toast.success('Repo Link Copied'); }} style={{ marginTop: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', color: 'var(--accent)', background: 'rgba(0, 255, 102, 0.1)', padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--border)', cursor: 'pointer', fontSize: '10px', fontWeight: 800, width: '100%' }}>
                          <Copy size={14} /> REPO
                        </button>
                      )}
                    </div>
                    {task.status === 'review' && (
                      <div style={{ display: 'flex', gap: '8px', width: '100%', marginTop: '0.75rem' }}>
                        <button onClick={(e) => { e.stopPropagation(); updateStatus(task.id, 'in_progress'); }} className="btn-primary" style={{ flex: 1, background: '#f85149', padding: '0.75rem 0', borderRadius: '10px', color: '#fff', fontSize: '0.75rem', gap: '4px', border: 'none' }}>
                          <X size={14} strokeWidth={3} /> REJECT
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); updateStatus(task.id, 'acc'); }} className="btn-primary" style={{ flex: 1, background: '#10b981', padding: '0.75rem 0', borderRadius: '10px', color: '#000', fontSize: '0.75rem', gap: '4px', border: 'none' }}>
                          <CheckCircle size={14} strokeWidth={3} /> APPROVE
                        </button>
                      </div>
                    )}
                  </div>
                )})
              )}
            </div>
          ) : activeTab === 'reports' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.2)', padding: '1.5rem', borderRadius: '16px', border: '1px solid var(--border)' }}>
                 <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Master Reports</h3>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>Automated daily summaries of developer activities.</p>
                 </div>
                 <button onClick={handleGenerateNow} className="btn-primary" style={{ background: '#00ff66', color: '#000', padding: '0.75rem 1.5rem', fontSize: '0.9rem', fontWeight: 800, borderRadius: '10px', boxShadow: '0 4px 20px rgba(0, 255, 102, 0.2)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                   <Rocket size={16} /> GENERATE REPORT NOW
                 </button>
              </div>
              <div style={{ display: 'grid', gap: '1.5rem' }}>
                {reports.length === 0 ? (
                  <div className="glass-card text-center p-12 text-muted">No reports submitted today.</div>
                ) : (
                  reports.map(report => (
                    <div key={report.id} className="glass-card animate-in" style={{ display: 'flex', flexDirection: 'column', padding: '1.5rem' }}>
                      <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--border-light)', marginBottom: '1.25rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '1rem' }}>
                          <div style={{ width: '48px', height: '48px', minWidth: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0, 255, 102, 0.1)', color: 'var(--accent)', borderRadius: '12px' }}>
                            <FileText size={24} />
                          </div>
                          <div>
                            <h4 style={{ fontWeight: 900, color: '#fff', fontSize: '1.2rem', letterSpacing: '-0.5px', margin: 0, padding: 0 }}>System Master Recap</h4>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>Generated on {report.date}</p>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <button 
                            onClick={() => {
                               navigator.clipboard.writeText(report.content);
                               toast.success('Report copied to clipboard!');
                            }}
                            style={{ background: 'rgba(0, 255, 102, 0.1)', color: 'var(--accent)', border: '1px solid var(--accent)', padding: '8px 16px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.2s' }}
                            className="hover:bg-green-500/20"
                          >
                            <Copy size={16} /> COPY REPORT
                          </button>
                          <button 
                            onClick={() => deleteReport(report.id)}
                            style={{ background: 'rgba(248, 81, 73, 0.1)', color: '#f85149', border: '1px solid rgba(248, 81, 73, 0.3)', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', transition: 'all 0.2s' }}
                            title="Delete Report"
                            className="hover:bg-red-500/20"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                      <div style={{ background: '#0a0d14', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.03)' }}>
                         <pre style={{ fontSize: '0.9rem', color: '#cbd5e1', lineHeight: '1.7', whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>{report.content}</pre>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : activeTab === 'history' ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1.5rem' }}>
              {historyTasks.length === 0 ? (
                <div className="glass-card text-center p-12 text-muted" style={{ gridColumn: '1 / -1' }}>No history found.</div>
              ) : (
                historyTasks.map(task => (
                  <div key={task.id} className="glass-card flex flex-col items-center text-center animate-in" style={{ opacity: 0.7, borderTop: '4px solid #10b981', padding: '1.5rem', minHeight: '220px', justifyContent: 'space-between', position: 'relative' }}>
                    <button onClick={(e) => { e.stopPropagation(); deleteTask(task.id); }} style={{ position: 'absolute', top: '12px', right: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', padding: '6px', border: 'none', color: '#f85149', cursor: 'pointer', display: 'flex' }} className="hover:bg-red-500/20">
                      <Trash2 size={14} />
                    </button>
                    <div className="flex flex-col items-center gap-3 w-full">
                      <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '14px', borderRadius: '50%', color: '#10b981', display: 'flex', justifyContent: 'center', alignItems: 'center', width: '64px', height: '64px', marginBottom: '4px' }}>
                         <CheckCircle size={28} strokeWidth={2.5} />
                      </div>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 700, textDecoration: 'line-through', lineHeight: '1.4', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                        {task.title}
                      </h3>
                    </div>
                    <div className="flex flex-col items-center gap-2 mt-4 w-full pt-4" style={{ borderTop: '1px solid var(--border-light)' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}><Users size={14} /> {task.assigned_to?.full_name}</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}><Clock size={14} /> Completed</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : activeTab === 'team' ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
              {team.map(member => (
                <div key={member.id} className="glass-card flex flex-col items-center text-center animate-in">
                  <div className="avatar" style={{ width: '64px', height: '64px', fontSize: '1.5rem', marginBottom: '1.25rem' }}>
                    {member.full_name?.charAt(0)}
                  </div>
                  <h3 style={{ fontWeight: 700, fontSize: '1.1rem' }}>{member.full_name}</h3>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginTop: '4px', letterSpacing: '1px' }}>{member.role}</p>
                  {member.role === 'developer' && (
                    <button 
                      onClick={() => handleDeleteDev(member.id)}
                      style={{ marginTop: '1.5rem', background: 'rgba(248, 81, 73, 0.1)', color: '#f85149', border: '1px solid rgba(248, 81, 73, 0.2)', padding: '6px 12px', borderRadius: '8px', fontSize: '10px', fontWeight: 800, cursor: 'pointer' }}
                    >
                      REMOVE MEMBER
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : activeTab === 'settings' ? (
            <div className="glass-card animate-in" style={{ maxWidth: '700px', padding: '2.5rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock size={20} color="var(--accent)" /> Auto-Recap Weekly Schedule
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {Object.keys(schedule).map((dayKey) => {
                  const day = parseInt(dayKey);
                  return (
                  <div key={day} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.25rem', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid var(--border)', order: day === 0 ? 7 : day }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '16px', cursor: 'pointer', flex: 1 }}>
                      <input 
                        type="checkbox" 
                        checked={schedule[day].enabled}
                        onChange={e => {
                          const newSched = { ...schedule, [day]: { ...schedule[day], enabled: e.target.checked } };
                          setSchedule(newSched);
                          localStorage.setItem('app_settings', JSON.stringify({ schedule: newSched }));
                        }}
                        style={{ width: '20px', height: '20px', accentColor: 'var(--accent)' }} 
                      />
                      <div>
                        <span style={{ fontSize: '1rem', fontWeight: 700, color: schedule[day].enabled ? '#fff' : 'var(--text-muted)' }}>{schedule[day].label}</span>
                      </div>
                    </label>
                    {schedule[day].enabled ? (
                      <input type="time" style={{ width: '130px', margin: 0, padding: '8px 12px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border)', borderRadius: '8px', color: '#fff', pointerEvents: 'auto' }} value={schedule[day].time} onChange={e => {
                        const newSched = { ...schedule, [day]: { ...schedule[day], time: e.target.value } };
                        setSchedule(newSched);
                        localStorage.setItem('app_settings', JSON.stringify({ schedule: newSched }));
                      }} />
                    ) : (
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600, paddingRight: '10px' }}>OFF</span>
                    )}
                  </div>
                )})}
              </div>
            </div>
          ) : null}
        </div>
      </main>

      {/* Modals */}
      {showAddForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '2rem' }}>
          <div className="glass-card w-full max-w-lg" style={{ background: '#080a0f', border: '1px solid rgba(255,255,255,0.1)' }}>
             <h2 style={{ marginBottom: '2rem', fontWeight: 800, fontSize: '1.5rem' }}>{editingTaskId ? 'Edit Mission' : 'New Mission'}</h2>
             <form onSubmit={handleAddTask} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <input placeholder="Task Title" className="input-field" value={title} onChange={e => setTitle(e.target.value)} required />
                <input placeholder="GitHub URL" className="input-field" value={githubLink} onChange={e => setGithubLink(e.target.value)} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700, marginLeft: '4px' }}>Task Instructions / Steps</label>
                  {instructionList.map((inst, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: '8px' }}>
                      <input 
                        placeholder={`Step ${idx + 1}...`} 
                        className="input-field" 
                        style={{ margin: 0 }}
                        value={inst} 
                        onChange={e => {
                          const newList = [...instructionList];
                          newList[idx] = e.target.value;
                          setInstructionList(newList);
                        }} 
                      />
                      {idx === instructionList.length - 1 ? (
                        <button type="button" onClick={() => setInstructionList([...instructionList, ''])} className="btn-primary" style={{ padding: '0 14px' }}><Plus size={16}/></button>
                      ) : (
                        <button type="button" onClick={() => setInstructionList(instructionList.filter((_, i) => i !== idx))} style={{ background: 'transparent', border: '1px solid #f85149', color: '#f85149', borderRadius: '8px', padding: '0 14px', cursor: 'pointer' }}><Trash2 size={16}/></button>
                      )}
                    </div>
                  ))}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <input type="datetime-local" className="input-field" value={targetDate} onChange={e => setTargetDate(e.target.value)} />
                  <select className="input-field" value={assigneeId} onChange={e => setAssigneeId(e.target.value)} required>
                    <option value="" disabled selected>Select a Developer...</option>
                    {team.filter(m => m.role === 'developer').length === 0 ? (
                      <option value="" disabled>⚠️ No Developers Found! (Add one in 'Dev Team' Tab)</option>
                    ) : (
                      team.filter(m => m.role === 'developer').map(d => (
                        <option key={d.id} value={d.id}>{d.full_name}</option>
                      ))
                    )}
                  </select>
                </div>
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'end', marginTop: '1.5rem' }}>
                  <button type="button" onClick={resetForm} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontWeight: 700 }}>Cancel</button>
                  <button type="submit" className="btn-primary">{editingTaskId ? 'Save Changes' : 'Assign Mission'}</button>
                </div>
             </form>
          </div>
        </div>
      )}

      {showAddDevForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '2rem' }}>
          <div className="glass-card w-full max-w-md" style={{ background: '#080a0f', border: '1px solid rgba(255,255,255,0.1)' }}>
             <h2 style={{ marginBottom: '2rem', fontWeight: 800, fontSize: '1.5rem' }}>Add New Developer</h2>
             <form onSubmit={handleAddDev} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <input placeholder="Full Name (e.g. John Doe)" className="input-field" value={newDevName} onChange={e => setNewDevName(e.target.value)} required />
                <input placeholder="Username (e.g. johndoe)" className="input-field" value={newDevUsername} onChange={e => setNewDevUsername(e.target.value)} required />
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'end', marginTop: '1.5rem' }}>
                  <button type="button" onClick={() => setShowAddDevForm(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontWeight: 700 }}>Cancel</button>
                  <button type="submit" className="btn-primary" style={{ background: '#10b981' }}>Add Member</button>
                </div>
             </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default LeadDashboard
