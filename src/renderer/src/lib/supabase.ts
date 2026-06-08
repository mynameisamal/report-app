// ============================================================
// ⚠️ DEPRECATED: This file is legacy code from the Appwrite era.
// The application now uses the REST API client (api/client.ts)
// which connects to the microservices via the API Gateway.
// This file is kept for reference but no longer imported.
// ============================================================

import { Client, Databases, Query as AppwriteQuery, ID } from 'appwrite';

const client = new Client()
    .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT)
    .setProject(import.meta.env.VITE_APPWRITE_PROJECT);

const databases = new Databases(client);
const dbId = import.meta.env.VITE_APPWRITE_DATABASE;

// Menggunakan LocalStorage hanya untuk menyimpan session Token agar tetap login
let authChangeListener: any = null;
const storage = {
  getUser: () => JSON.parse(localStorage.getItem('mock_user') || 'null'),
  setUser: (user: any, event = 'SIGNED_IN') => {
    localStorage.setItem('mock_user', JSON.stringify(user));
    if (authChangeListener) authChangeListener(event, user ? { user } : null);
  }
};

const mapDoc = (doc: any) => ({ ...doc, id: doc.$id });

// Appwrite Wrapper to simulate Supabase SDK behavior
export const supabase: any = {
  auth: {
    getSession: async () => {
      const user = storage.getUser();
      if (user) {
        try {
          // Validasi apakah session ID benar-benar ada di Appwrite
          await databases.getDocument(dbId, 'profiles', user.id);
          return { data: { session: { user } } };
        } catch (e) {
          // Jika tidak ada (404 / ID mock lama), bersihkan cache
          storage.setUser(null, 'SIGNED_OUT');
          return { data: { session: null } };
        }
      }
      return { data: { session: null } };
    },
    onAuthStateChange: (callback: any) => {
      authChangeListener = callback;
      return { data: { subscription: { unsubscribe: () => { authChangeListener = null; } } } };
    },
    signInWithPassword: async ({ email }: any) => {
      const username = email.split('@')[0];
      try {
        const res = await databases.listDocuments(dbId, 'profiles', [AppwriteQuery.equal('username', username)]);
        if (res.documents.length === 0) {
          // Fitur Seeding: Jika database benar-benar kosong, buatkan user lead pertama 'amal' otomatis
          const allProfs = await databases.listDocuments(dbId, 'profiles');
          if (allProfs.documents.length === 0 && username === 'amal') {
             const newProf = await databases.createDocument(dbId, 'profiles', ID.unique(), {
                 full_name: 'Amal Lead', role: 'lead', username: 'amal'
             });
             const user = { id: newProf.$id, email, full_name: newProf.full_name, role: newProf.role, username: newProf.username };
             storage.setUser(user, 'SIGNED_IN');
             return { data: { user, session: { user } }, error: null };
          }
          return { data: { user: null, session: null }, error: { message: 'Clearance ID not found. Access Denied.' } };
        }
        const profile = res.documents[0];
        const user = { id: profile.$id, email, full_name: profile.full_name, role: profile.role, username: profile.username };
        storage.setUser(user, 'SIGNED_IN');
        return { data: { user, session: { user } }, error: null };
      } catch (err: any) {
        return { data: { user: null, session: null }, error: { message: err.message } };
      }
    },
    signOut: async () => {
      storage.setUser(null, 'SIGNED_OUT');
      window.location.reload();
      return { error: null };
    }
  },
  
  from: (table: string) => {
    return {
      select: (query: string = '*') => ({
        eq: (eqCol: string, eqVal: any) => ({
          single: async () => {
            try {
              if (eqCol === 'id') {
                const doc = await databases.getDocument(dbId, table, eqVal);
                return { data: mapDoc(doc), error: null };
              }
              const res = await databases.listDocuments(dbId, table, [AppwriteQuery.equal(eqCol, eqVal)]);
              if (res.documents.length === 0) throw new Error('Not found');
              return { data: mapDoc(res.documents[0]), error: null };
            } catch (err: any) {
               return { data: null, error: err };
            }
          },
          order: (orderCol: string, opt: any) => ({
            then: async (resolve: any) => {
              try {
                const res = await databases.listDocuments(dbId, table, [AppwriteQuery.equal(eqCol, eqVal), AppwriteQuery.limit(100)]);
                let data = res.documents.map(mapDoc);
                const ascending = opt?.ascending !== false;
                const sortField = orderCol === 'created_at' ? '$createdAt' : orderCol;
                data.sort((a: any, b: any) => {
                  const valA = a[sortField] || '';
                  const valB = b[sortField] || '';
                  return ascending ? (valA > valB ? 1 : -1) : (valA < valB ? 1 : -1);
                });
                resolve({ data, error: null });
              } catch (error) { 
                console.error('Appwrite eq.order error:', error);
                resolve({ data: null, error }); 
              }
            }
          }),
          then: async (resolve: any) => {
             try {
                const res = await databases.listDocuments(dbId, table, [AppwriteQuery.equal(eqCol, eqVal)]);
                resolve({ data: res.documents.map(mapDoc), error: null });
             } catch (error) { resolve({ data: null, error }); }
          }
        }),
        order: (col: string, { ascending }: any = { ascending: false }) => ({
          then: async (resolve: any) => {
             try {
               let res = await databases.listDocuments(dbId, table, [AppwriteQuery.limit(100)]);
               let data = res.documents.map(mapDoc);
               
               const sortField = col === 'created_at' ? '$createdAt' : col;
               data.sort((a: any, b: any) => {
                  const valA = a[sortField] || '';
                  const valB = b[sortField] || '';
                  return ascending ? (valA > valB ? 1 : -1) : (valA < valB ? 1 : -1);
               });
               
               // Manual Join untuk relations
               if (query.includes('assigned_to') || query.includes('user_id')) {
                  const profRes = await databases.listDocuments(dbId, 'profiles', [AppwriteQuery.limit(100)]);
                  const profiles = profRes.documents.map(mapDoc);
                  const fk = query.includes('assigned_to') ? 'assigned_to' : 'user_id';
                  data = data.map((t: any) => ({
                      ...t,
                      [fk]: profiles.find(p => p.id === t[fk]) || t[fk]
                  }));
               }
               resolve({ data, error: null });
             } catch (error) { resolve({ data: null, error }); }
          }
        }),
        then: async (resolve: any) => {
           try {
             const res = await databases.listDocuments(dbId, table, [AppwriteQuery.limit(100)]);
             resolve({ data: res.documents.map(mapDoc), error: null });
           } catch (error) { resolve({ data: null, error }); }
        }
      }),
      insert: async (newData: any[]) => {
        try {
          for (const item of newData) {
            await databases.createDocument(dbId, table, ID.unique(), item);
          }
          return { error: null };
        } catch (error) { return { error }; }
      },
      update: (updateData: any) => ({
        eq: (col: string, val: any) => ({
          then: async (resolve: any) => {
            try {
              if (col === 'id') {
                await databases.updateDocument(dbId, table, val, updateData);
              } else {
                const res = await databases.listDocuments(dbId, table, [AppwriteQuery.equal(col, val)]);
                for (const doc of res.documents) {
                  await databases.updateDocument(dbId, table, doc.$id, updateData);
                }
              }
              resolve({ error: null });
            } catch (error) { resolve({ error }); }
          }
        })
      }),
      delete: () => ({
        eq: (col: string, val: any) => ({
          then: async (resolve: any) => {
            try {
              if (col === 'id') {
                await databases.deleteDocument(dbId, table, val);
              } else {
                const res = await databases.listDocuments(dbId, table, [AppwriteQuery.equal(col, val)]);
                for (const doc of res.documents) {
                  await databases.deleteDocument(dbId, table, doc.$id);
                }
              }
              resolve({ error: null });
            } catch (error) { resolve({ error }); }
          }
        })
      })
    };
  }
};

// System Auto-Report Logic untuk Appwrite
export const checkAutoReports = async (forceGenerate = false) => {
  const settings = JSON.parse(localStorage.getItem('app_settings') || '{}');
  const now = new Date();
  const day = now.getDay();
  
  const scheduleConfig = settings.schedule || {
    0: { enabled: false, time: '17:00' },
    1: { enabled: true, time: '17:00' },
    2: { enabled: true, time: '17:00' },
    3: { enabled: true, time: '17:00' },
    4: { enabled: true, time: '17:00' },
    5: { enabled: true, time: '17:00' },
    6: { enabled: false, time: '13:00' },
  };

  const todayConfig = scheduleConfig[day] || { time: '17:00' };

  if (!todayConfig.enabled && !forceGenerate) return;

  const [targetHour, targetMin] = (todayConfig.time || '17:00').split(':').map(Number);

  const isPastTarget = now.getHours() > targetHour || (now.getHours() === targetHour && now.getMinutes() >= targetMin);

  if (isPastTarget || forceGenerate) {
    const today = now.toISOString().split('T')[0];
    const lastGeneratedDate = localStorage.getItem('last_auto_report_date');
    
    // Jika bukan forceGenerate dan hari ini sudah pernah bikin auto-report, maka skip.
    if (!forceGenerate && lastGeneratedDate === today) return;

    try {
      const reportRes = await databases.listDocuments(dbId, 'daily_reports', [AppwriteQuery.limit(100)]);
      // String pembanding harus sama dengan yang di-generate (DAILY REPORT - TASKMASTER PEI)
      const autoReports = reportRes.documents.filter((doc: any) => doc.date === today && doc.content && doc.content.includes('DAILY REPORT - TASKMASTER PEI'));
      
      if (autoReports.length === 0 || forceGenerate) {
        const [tasksRes, profilesRes] = await Promise.all([
          databases.listDocuments(dbId, 'tasks', [AppwriteQuery.limit(100)]),
          databases.listDocuments(dbId, 'profiles', [AppwriteQuery.limit(100)])
        ]);
        const profiles = profilesRes.documents.filter((p: any) => p.role === 'developer');
        const leads = profilesRes.documents.filter((p: any) => p.role === 'lead');
        
        // Filter tasks: Hanya yang dibuat hari ini ATAU yang masih pending/in-progress/review
        // Task sebelumnya yang sudah selesai tidak perlu ada lagi.
        const tasks = tasksRes.documents.filter((t: any) => {
            const createdAt = t.$createdAt || t.created_at || '';
            const taskDate = createdAt.split('T')[0];
            const isToday = taskDate === today;
            const isPending = t.status !== 'acc' && t.status !== 'completed';
            
            return isToday || isPending;
        });
        
        const formatWaDate = (iso: string) => {
          if (!iso) return '-';
          try {
             const d = new Date(iso);
             return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) + (iso.includes('T') ? ' ' + d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '');
          } catch(e) { return iso; }
        };

        const niceToday = new Date().toLocaleDateString('en-US', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });

        let reportText = `🚀 *DAILY REPORT - TASKMASTER PEI* 🚀\n📅 *Date:* ${niceToday}\n⏰ *Time:* ${todayConfig.time || '17:00'} WIB\n\n`;
        
        let totalAll = tasks.length;
        let totalCompletedAll = tasks.filter((t:any) => t.status === 'acc' || t.status === 'completed').length;
        let totalInProgressAll = tasks.filter((t:any) => t.status === 'in_progress' || t.status === 'pending' || t.status === 'review').length;
        
        let totalOverdueAll = tasks.filter((t:any) => {
            if (t.status !== 'acc' && t.status !== 'completed' && t.target_date) {
               const deadline = t.target_date.includes('T') ? new Date(t.target_date) : new Date(`${t.target_date}T${todayConfig.time || '17:00'}:00`);
               return now.getTime() > deadline.getTime();
            }
            return false;
        }).length;

        reportText += `📊 *EXECUTIVE SUMMARY*\n`;
        reportText += `▪️ Total Tasks: ${totalAll}\n`;
        reportText += `▪️ Completed: ${totalCompletedAll}\n`;
        reportText += `▪️ In Progress: ${totalInProgressAll}\n`;
        reportText += `▪️ Overdue: ${totalOverdueAll}\n\n`;

        if (profiles.length > 0) {
          profiles.forEach((dev, index) => {
            const devTasks = tasks.filter((t: any) => t.assigned_to === dev.$id);
            const completed = devTasks.filter((t: any) => t.status === 'acc' || t.status === 'completed').length;
            const pending = devTasks.filter((t: any) => t.status !== 'acc' && t.status !== 'completed').length;

            reportText += `━━━━━━━━━━━━━━━━━━━━━\n`;
            reportText += `🧑‍💻 *${index + 1}. ${(dev.full_name || dev.username).toUpperCase()}*\n`;
            reportText += `━━━━━━━━━━━━━━━━━━━━━\n`;
            reportText += `📋 *Workload:* ${devTasks.length} tasks\n`;
            reportText += `✅ *Done:* ${completed}  |  ⏳ *Pending:* ${pending}\n\n`;

            if (devTasks.length > 0) {
              reportText += `*📌 TASK DETAILS:*\n`;
              devTasks.forEach((t: any, tIndex: number) => {
                let statusLabel = '⚪ *PENDING*';
                let isLate = false;
                if (t.status === 'in_progress') statusLabel = '🟡 *IN PROGRESS*';
                if (t.status === 'review') statusLabel = '🟠 *IN REVIEW*';
                if (t.status === 'acc' || t.status === 'completed') statusLabel = '🟢 *COMPLETED*';

                if (t.status !== 'acc' && t.status !== 'completed' && t.target_date) {
                   const deadline = t.target_date.includes('T') ? new Date(t.target_date) : new Date(`${t.target_date}T${todayConfig.time || '17:00'}:00`);
                   if (now.getTime() > deadline.getTime()) {
                      isLate = true;
                      statusLabel = '🔴 *OVERDUE*';
                   }
                }
                
                reportText += `*${tIndex + 1}. ${t.title}*\n`;
                reportText += `   • Status: ${statusLabel}\n`;
                const creator = profilesRes.documents.find((p: any) => p.$id === t.created_by);
                reportText += `   • Assigned By: ${creator ? (creator.full_name || creator.username).toUpperCase() : 'SYSTEM'}\n`;
                if (t.instructions) {
                   reportText += `   • Instructions:\n`;
                   const insts = t.instructions.split('\n').filter((i: string) => i.trim() !== '');
                   insts.forEach((inst: string) => {
                      const desc = inst.length > 80 ? inst.substring(0, 80) + '...' : inst;
                      reportText += `      - _${desc.replace(/^- /, '').trim()}_\n`;
                   });
                }
                reportText += `   • Assigned On: ${formatWaDate(t.$createdAt || t.created_at)}\n`;
                reportText += `   • Deadline: ${formatWaDate(t.target_date)} ${isLate ? '(⚠️ Missed)' : ''}\n\n`;
              });
            } else {
               reportText += `_No active tasks at the moment._\n\n`;
            }
          });
        } else {
           reportText += `_No developers found in the team._\n\n`;
        }
        
        reportText += `✨ _System Auto-Recap Report_`;

        await databases.createDocument(dbId, 'daily_reports', ID.unique(), {
          user_id: leads.length > 0 ? leads[0].$id : (profiles.length > 0 ? profiles[0].$id : 'unknown'),
          date: today,
          content: reportText,
          tasks_completed: totalCompletedAll,
          is_auto: true
        });
        
        // Simpan tanda bahwa hari ini auto-report sudah tereksekusi
        if (!forceGenerate) {
           localStorage.setItem('last_auto_report_date', today);
        }
      }
    } catch (e) {
      console.error("Auto Report Error:", e);
      throw e; // Rethrow agar UI (LeadDashboard) bisa menangkap error-nya
    }

  }
};

setInterval(checkAutoReports, 60000);
