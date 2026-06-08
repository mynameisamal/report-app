import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { GitBranch, Play, Send, Clock, LayoutDashboard, Settings, LogOut, Check, Plus, Copy, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import ReactMarkdown from 'react-markdown'

const DevDashboard = ({ profile }: { profile: any }) => {
  const [tasks, setTasks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTask, setSelectedTask] = useState<any>(null)
  const [timeLeft, setTimeLeft] = useState<{ text: string, state: 'normal'|'warning'|'danger'|'overdue' } | null>(null)

  // Personal Mission State
  const [showAddForm, setShowAddForm] = useState(false)
  const [title, setTitle] = useState('')
  const [githubLink, setGithubLink] = useState('')
  const [instructionList, setInstructionList] = useState<string[]>([''])
  const [targetDate, setTargetDate] = useState('')

  useEffect(() => {
    if (profile?.id) {
      fetchMyTasks()
    }
  }, [profile])

  // Timer Hitung Mundur
  useEffect(() => {
    let interval: any;
    if (selectedTask && selectedTask.status === 'in_progress' && selectedTask.target_date) {
      interval = setInterval(() => {
        // Deadline dari string
        const deadline = selectedTask.target_date.includes('T') ? new Date(selectedTask.target_date) : new Date(`${selectedTask.target_date}T17:00:00`);
        const now = new Date();
        const diffMs = deadline.getTime() - now.getTime();
        
        if (diffMs <= 0) {
          setTimeLeft({ text: 'OVERDUE', state: 'overdue' });
        } else {
          const hours = Math.floor(diffMs / (1000 * 60 * 60));
          const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
          const secs = Math.floor((diffMs % (1000 * 60)) / 1000);
          const text = `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
          
          let state: 'normal'|'warning'|'danger' = 'normal';
          if (diffMs < 30 * 60 * 1000) state = 'danger'; // Kurang dari 30 menit
          else if (diffMs < 2 * 60 * 60 * 1000) state = 'warning'; // Kurang dari 2 jam
          
          setTimeLeft({ text, state });
        }
      }, 1000);
    } else {
      setTimeLeft(null);
    }
    return () => clearInterval(interval);
  }, [selectedTask]);

  const fetchMyTasks = async () => {
    if (!profile?.id) return;
    const { data, error } = await supabase.from('tasks').select('*').eq('assigned_to', profile.id).order('created_at', { ascending: false })
    if (!error) setTasks(data || [])
    setLoading(false)
  }

  if (!profile) return null;

  const updateStatus = async (taskId: string, status: string) => {
    const { error } = await supabase.from('tasks').update({ status }).eq('id', taskId)
    if (!error) {
      toast.success(`Mission status updated to ${status.toUpperCase()}`)
      fetchMyTasks()
      if (selectedTask?.id === taskId) setSelectedTask({...selectedTask, status})
    }
  }

  const deleteTask = async (taskId: string) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    const { error } = await supabase.from('tasks').delete().eq('id', taskId);
    if (!error) {
      toast.success('Task deleted successfully');
      setTasks(tasks.filter(t => t.id !== taskId));
      if (selectedTask?.id === taskId) setSelectedTask(null);
    } else {
      toast.error('Failed to delete task: ' + error.message);
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Repository link copied to clipboard!');
  }

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault()
    const finalInstructions = instructionList.filter(i => i.trim() !== '').join('\n');
    if (!title || !targetDate || !finalInstructions) {
       toast.error('Mohon isi semua field yang dibutuhkan');
       return;
    }
    const { error } = await supabase.from('tasks').insert([{ 
      title, github_link: githubLink, instructions: finalInstructions, target_date: targetDate, 
      assigned_to: profile.id, created_by: profile.id, status: 'pending' 
    }])
    if (error) toast.error(error.message)
    else {
      toast.success('Personal Mission Added!')
      setShowAddForm(false)
      setTitle('')
      setGithubLink('')
      setInstructionList([''])
      setTargetDate('')
      fetchMyTasks()
    }
  }

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <div style={{ padding: '2rem 1.5rem', display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ background: 'var(--accent-glow)', width: '32px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <GitBranch size={18} color="var(--accent)" />
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 900, letterSpacing: '-0.5px' }}>DevTerminal</h2>
        </div>

        <nav style={{ padding: '1.5rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
          <div className={`nav-item active`}>
            <LayoutDashboard size={18} /> <span>Mission Inbox</span>
          </div>
          <div className="nav-item">
            <Settings size={18} /> <span>Config</span>
          </div>
        </nav>

        <footer style={{ padding: '1.5rem 1rem', borderTop: '1px solid var(--border)' }}>
          <div style={{ padding: '1rem', background: 'var(--bg-card)', borderRadius: '12px', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '12px', border: '1px solid var(--border)' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: '#000' }}>
              {profile.full_name?.charAt(0)}
            </div>
            <div>
              <p style={{ fontSize: '0.85rem', fontWeight: 700 }}>{profile.username}</p>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>{profile.role}</p>
            </div>
          </div>
          <div className="nav-item" onClick={() => supabase.auth.signOut()}>
            <LogOut size={18} /> <span>Exit</span>
          </div>
        </footer>
      </aside>

      {/* Content Area Wrapper to fix Grid layout */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* Content Column (Inbox) */}
        <div style={{ width: '340px', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', background: 'rgba(255,255,255,0.01)', flexShrink: 0 }}>
          <div style={{ padding: '2rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '1px' }}>Assignments</h3>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => setShowAddForm(true)} style={{ background: 'transparent', border: 'none', color: 'var(--accent)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', fontWeight: 900 }}>
                 <Plus size={14} /> TASK
              </button>
            </div>
          </div>
          <div className="overflow-y-auto flex-1">
            {loading ? (
              <div className="p-8 text-center text-xs text-muted">Scanning...</div>
            ) : tasks.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted">No missions.</div>
            ) : (
              tasks.map(task => (
                <div 
                  key={task.id} 
                  onClick={() => setSelectedTask(task)}
                  style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)', cursor: 'pointer', transition: 'all 0.2s', background: selectedTask?.id === task.id ? 'rgba(0, 255, 102, 0.05)' : 'transparent', borderLeft: selectedTask?.id === task.id ? '4px solid var(--accent)' : '4px solid transparent' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: task.status === 'acc' ? '#00ff66' : task.status === 'in_progress' ? 'var(--warning)' : '#64748b' }}></span>
                    <h4 style={{ fontSize: '0.9rem', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{task.title}</h4>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <p style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 800 }}>DUE: {task.target_date.replace('T', ' ')}</p>
                    {task.created_by === profile.id && (
                      <button onClick={(e) => { e.stopPropagation(); deleteTask(task.id); }} style={{ background: 'transparent', border: 'none', color: '#f85149', cursor: 'pointer', opacity: 0.5 }} className="hover:opacity-100">
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Task Detail Main Area */}
        <main className="main-content" style={{ flex: 1 }}>
          <div className="scroll-area">
            {selectedTask ? (
              <div className="animate-in" style={{ maxWidth: '800px' }}>
                <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between', marginBottom: '3rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1rem' }}>
                      <span className={`badge ${selectedTask.status === 'acc' ? 'badge-success' : 'badge-warning'}`}>{selectedTask.status}</span>
                      
                      {/* Timer Display */}
                      {timeLeft && selectedTask.status === 'in_progress' && (
                        <div style={{
                          padding: '4px 12px', borderRadius: '8px', fontWeight: 900, letterSpacing: '2px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px',
                          background: timeLeft.state === 'danger' ? 'rgba(248, 81, 73, 0.1)' : timeLeft.state === 'warning' ? 'rgba(245, 158, 11, 0.1)' : timeLeft.state === 'overdue' ? '#f85149' : 'rgba(0, 255, 102, 0.1)',
                          color: timeLeft.state === 'danger' ? '#f85149' : timeLeft.state === 'warning' ? '#f59e0b' : timeLeft.state === 'overdue' ? '#000' : '#00ff66',
                          border: `1px solid ${timeLeft.state === 'danger' ? '#f85149' : timeLeft.state === 'warning' ? '#f59e0b' : timeLeft.state === 'overdue' ? '#f85149' : '#00ff66'}`,
                          animation: timeLeft.state === 'danger' || timeLeft.state === 'overdue' ? 'pulse 1s infinite' : 'none'
                        }}>
                          <Clock size={14} /> {timeLeft.text}
                        </div>
                      )}

                      {/* Repo Copy Only */}
                      {selectedTask.github_link && selectedTask.status !== 'pending' && (
                        <button onClick={() => copyToClipboard(selectedTask.github_link)} style={{ background: 'rgba(0, 255, 102, 0.1)', border: '1px solid var(--accent)', padding: '4px 12px', borderRadius: '8px', fontSize: '0.75rem', color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontWeight: 700 }}>
                          <Copy size={14} /> Copy Repo
                        </button>
                      )}
                    </div>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: '1.1' }}>{selectedTask.title}</h1>
                  </div>

                  <div style={{ display: 'flex', gap: '12px' }}>
                    {selectedTask.status === 'pending' && (
                      <button onClick={() => updateStatus(selectedTask.id, 'in_progress')} className="btn-primary">
                        <Play size={18} /> <span>Initialize</span>
                      </button>
                    )}
                    {selectedTask.status === 'in_progress' && (
                      <button onClick={() => updateStatus(selectedTask.id, 'review')} className="btn-primary" style={{ background: 'var(--warning)', color: '#000', boxShadow: '0 4px 15px rgba(245, 158, 11, 0.3)' }}>
                        <Send size={18} /> <span>Submit for Review</span>
                      </button>
                    )}
                    {selectedTask.status === 'review' && (
                      <button onClick={() => updateStatus(selectedTask.id, 'in_progress')} className="btn-primary" style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
                        <span>Cancel Review</span>
                      </button>
                    )}
                    {selectedTask.status === 'acc' && (
                      <button 
                        onClick={() => { toast.success('Syncing with GitHub...'); updateStatus(selectedTask.id, 'completed') }} 
                        className="btn-primary" style={{ background: 'var(--success)', color: '#000', boxShadow: '0 4px 20px rgba(0, 255, 102, 0.4)', animation: 'pulse 2s infinite' }}
                      >
                        <Check size={18} /> <span>Push to Production</span>
                      </button>
                    )}
                  </div>
                </div>

                <div className="glass-card" style={{ padding: '2.5rem', borderRadius: '32px' }}>
                  <h3 style={{ fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '2px', marginBottom: '1.5rem' }}>Mission Briefing</h3>
                  <div style={{ color: '#cbd5e1', lineHeight: '1.8', fontSize: '1.1rem' }}>
                    <ReactMarkdown>{selectedTask.instructions || '_No detailed instructions provided._'}</ReactMarkdown>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0.15 }}>
                <LayoutDashboard size={120} strokeWidth={1} />
                <p style={{ marginTop: '1.5rem', fontSize: '1.25rem', fontWeight: 800, letterSpacing: '4px', textTransform: 'uppercase' }}>Waiting for Mission</p>
              </div>
            )}
          </div>
        </main>

      </div> {/* End Wrapper */}

      {/* Personal Mission Modal */}
      {showAddForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '2rem' }}>
          <div className="glass-card w-full max-w-lg animate-in" style={{ background: '#080a0f', border: '1px solid rgba(255,255,255,0.1)' }}>
             <h2 style={{ marginBottom: '2rem', fontWeight: 800, fontSize: '1.5rem' }}>New Personal Mission</h2>
             <form onSubmit={handleAddTask} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <input placeholder="Task Title" className="input-field" value={title} onChange={e => setTitle(e.target.value)} required />
                <input placeholder="Repository URL (Optional)" className="input-field" value={githubLink} onChange={e => setGithubLink(e.target.value)} />
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
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
                  <input type="datetime-local" className="input-field" value={targetDate} onChange={e => setTargetDate(e.target.value)} required />
                </div>
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'end', marginTop: '1.5rem' }}>
                  <button type="button" onClick={() => setShowAddForm(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontWeight: 700 }}>Cancel</button>
                  <button type="submit" className="btn-primary">Add Task</button>
                </div>
             </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default DevDashboard
