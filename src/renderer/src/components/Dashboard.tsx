import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import LeadDashboard from './LeadDashboard'
import DevDashboard from './DevDashboard'

const Dashboard = ({ session }: { session: any }) => {
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getProfile()
  }, [])

  async function getProfile() {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()

      if (error) throw error
      setProfile(data)
    } catch (error: any) {
      console.error('Error loading profile:', error.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#030508]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-accent"></div>
      </div>
    )
  }

  // Langsung tampilkan dashboard sesuai role tanpa header tambahan
  return (
    <div className="h-full w-full overflow-hidden">
      {profile?.role === 'lead' ? (
        <LeadDashboard profile={profile} />
      ) : (
        <DevDashboard profile={profile} />
      )}
    </div>
  )
}

export default Dashboard
