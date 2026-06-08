// ============================================================
// TaskMaster PEI - Theme System
// ============================================================

export const theme = {
  colors: {
    bg: {
      main: '#050505',
      sidebar: '#0a0a0a',
      card: 'rgba(10, 15, 12, 0.8)',
      modal: '#080a0f',
    },
    accent: {
      main: '#00ff66',
      dark: '#00cc52',
      glow: 'rgba(0, 255, 102, 0.15)',
    },
    border: {
      main: 'rgba(0, 255, 102, 0.2)',
      light: 'rgba(255, 255, 255, 0.08)',
    },
    text: {
      main: '#f8fafc',
      muted: '#8b949e',
    },
    status: {
      success: '#00ff66',
      warning: '#f59e0b',
      danger: '#f85149',
      info: '#58a6ff',
    },
  },
  fonts: {
    body: "'Plus Jakarta Sans', sans-serif",
  },
  radius: {
    sm: '8px',
    md: '12px',
    lg: '20px',
    xl: '24px',
    full: '50%',
  },
  shadows: {
    card: '0 0 40px rgba(0, 255, 102, 0.05)',
    button: '0 4px 20px rgba(0, 255, 102, 0.2)',
    glow: '0 0 20px rgba(0, 255, 102, 0.1)',
  },
};

export const globalStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');

  * { margin: 0; padding: 0; box-sizing: border-box; }

  body, html, #root {
    height: 100vh;
    width: 100vw;
    overflow: hidden;
    font-family: 'Plus Jakarta Sans', sans-serif;
    background-color: #050505;
    color: #f8fafc;
  }

  :root {
    --bg-main: #050505;
    --bg-sidebar: #0a0a0a;
    --bg-card: rgba(10, 15, 12, 0.8);
    --accent: #00ff66;
    --accent-dark: #00cc52;
    --accent-glow: rgba(0, 255, 102, 0.15);
    --border: rgba(0, 255, 102, 0.2);
    --border-light: rgba(255, 255, 255, 0.08);
    --text-main: #f8fafc;
    --text-muted: #8b949e;
    --success: #00ff66;
    --warning: #f59e0b;
    --danger: #f85149;
  }

  .input-field {
    width: 100%;
    background: rgba(0, 255, 102, 0.02);
    border: 1px solid var(--border-light);
    border-radius: 12px;
    padding: 1rem 1rem 1rem 3.25rem;
    color: white;
    font-size: 0.95rem;
    font-family: inherit;
    transition: all 0.3s ease;
  }

  .input-field:focus {
    outline: none;
    border-color: var(--accent);
    background: rgba(0, 255, 102, 0.05);
    box-shadow: 0 0 0 4px var(--accent-glow);
  }

  select.input-field option {
    background-color: var(--bg-sidebar);
    color: var(--text-main);
    padding: 10px;
  }

  .btn-primary {
    background: var(--accent);
    color: #000;
    padding: 1rem 1.5rem;
    border-radius: 12px;
    font-weight: 800;
    font-size: 1rem;
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    transition: all 0.2s ease;
    box-shadow: 0 4px 20px rgba(0, 255, 102, 0.2);
    width: 100%;
  }

  .btn-primary:hover {
    transform: translateY(-2px);
    background: #00cc52;
    box-shadow: 0 6px 25px rgba(0, 255, 102, 0.3);
  }

  .glass-card {
    background: rgba(10, 15, 12, 0.8);
    backdrop-filter: blur(24px);
    border: 1px solid var(--border-light);
    border-radius: 20px;
    padding: 1.75rem;
    transition: transform 0.2s, border-color 0.2s;
  }

  .glass-card:hover {
    border-color: var(--border);
    transform: translateY(-2px);
  }

  .scroll-area {
    flex: 1;
    padding: 2rem;
    overflow-y: auto;
  }

  .badge {
    font-size: 10px;
    font-weight: 800;
    text-transform: uppercase;
    padding: 4px 8px;
    border-radius: 6px;
    letter-spacing: 1px;
  }

  .badge-success { background: rgba(0, 255, 102, 0.1); color: #00ff66; border: 1px solid rgba(0, 255, 102, 0.2); }
  .badge-warning { background: rgba(245, 158, 11, 0.1); color: #f59e0b; border: 1px solid rgba(245, 158, 11, 0.2); }
  .badge-danger { background: rgba(248, 81, 73, 0.1); color: #f85149; border: 1px solid rgba(248, 81, 73, 0.2); }
  .badge-info { background: rgba(88, 166, 255, 0.1); color: #58a6ff; border: 1px solid rgba(88, 166, 255, 0.2); }

  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
  @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

  .animate-in { animation: fadeIn 0.3s ease-out; }
  .animate-spin { animation: spin 0.8s linear infinite; }

  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 3px; }
  ::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
`;
