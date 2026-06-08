import { useState } from 'react'
import { LogIn, Lock, Shield, User } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../api/client'

const Login = () => {
  const [loading, setLoading] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await api.login(username, password)
      if (res.success) {
        toast.success(`Welcome, ${res.data.user.fullName}`)
        window.location.reload()
      } else {
        toast.error(res.error || 'Authentication Failed')
      }
    } catch (err: any) {
      toast.error('Authentication Failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', width: '100vw', background: 'radial-gradient(circle at top right, #0a1f12, #050505)' }}>
      <div style={{ background: 'rgba(5,10,8,0.7)', backdropFilter: 'blur(24px)', border: '1px solid rgba(0,255,102,0.2)', borderRadius: 24, padding: '3.5rem 3rem', width: '100%', maxWidth: 420, boxShadow: '0 0 40px rgba(0,255,102,0.05), inset 0 0 20px rgba(0,255,102,0.02)' }}>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <div style={{ background: 'rgba(0,255,102,0.15)', width: 72, height: 72, borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', border: '1px solid rgba(0,255,102,0.2)', boxShadow: '0 0 20px rgba(0,255,102,0.15)' }}>
            <Shield size={36} color="#00ff66" />
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-1px', marginBottom: '0.5rem', color: '#fff' }}>Task Master</h1>
          <p style={{ color: '#8b949e', fontSize: '0.9rem', letterSpacing: '0.5px' }}>Internal Developer Platform</p>
        </div>
        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: '1.5rem', textAlign: 'left' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#8b949e', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.5rem' }}>Username</label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <User size={18} style={{ position: 'absolute', left: '1.25rem', color: '#8b949e' }} />
              <input type="text" placeholder="Enter clearance ID" value={username} onChange={e => setUsername(e.target.value)} required
                style={{ width: '100%', background: 'rgba(0,255,102,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '1rem 1rem 1rem 3.25rem', color: '#fff', fontSize: '0.95rem', fontFamily: 'inherit', transition: 'all 0.3s' }}
                onFocus={e => { e.target.style.borderColor = '#00ff66'; e.target.style.boxShadow = '0 0 0 4px rgba(0,255,102,0.15)'; }}
                onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.08)'; e.target.style.boxShadow = 'none'; }}
              />
            </div>
          </div>
          <div style={{ marginBottom: '2.5rem', textAlign: 'left' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#8b949e', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.5rem' }}>Passcode</label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Lock size={18} style={{ position: 'absolute', left: '1.25rem', color: '#8b949e' }} />
              <input type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required
                style={{ width: '100%', background: 'rgba(0,255,102,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '1rem 1rem 1rem 3.25rem', color: '#fff', fontSize: '0.95rem', fontFamily: 'inherit', transition: 'all 0.3s' }}
                onFocus={e => { e.target.style.borderColor = '#00ff66'; e.target.style.boxShadow = '0 0 0 4px rgba(0,255,102,0.15)'; }}
                onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.08)'; e.target.style.boxShadow = 'none'; }}
              />
            </div>
          </div>
          <button type="submit" disabled={loading}
            style={{ width: '100%', background: loading ? '#00cc52' : '#00ff66', color: '#000', padding: '1rem 1.5rem', borderRadius: 12, fontWeight: 800, fontSize: '1rem', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, boxShadow: '0 4px 20px rgba(0,255,102,0.2)', opacity: loading ? 0.7 : 1 }}>
            {loading ? (
              <div style={{ width: 24, height: 24, border: '3px solid rgba(0,0,0,0.1)', borderTopColor: '#000', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}></div>
            ) : (
              <><LogIn size={20} /> <span>Initialize Session</span></>
            )}
          </button>
        </form>
        <div style={{ marginTop: '2.5rem', textAlign: 'center' }}>
          <p style={{ color: '#8b949e', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 800 }}>Secure Terminal Access</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  )
}

export default Login
