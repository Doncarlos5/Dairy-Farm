import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Users, Droplets, Activity, HeartPulse, ArrowRight, Bell, Milk, Sun } from 'lucide-react'
import type { Cow, MilkRecord, HealthRecord, BreedingRecord } from '../../lib/schemas'
import { Card } from '../../components/Card'
import { getDashboardStats } from './dashboardService'
import { useAuth } from '../auth/AuthContext'

export function Dashboard() {
  const { profile } = useAuth()
  const farmId = profile?.farmId || ''

  const [cows, setCows] = useState<Cow[]>([])
  const [milkRecords, setMilkRecords] = useState<MilkRecord[]>([])
  const [healthRecords, setHealthRecords] = useState<HealthRecord[]>([])
  const [breedingRecords, setBreedingRecords] = useState<BreedingRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      if (!farmId) return
      try {
        // Assuming your dashboardService fetches all of these. 
        // If it doesn't fetch breeding yet, make sure to add it there!
        const data = await getDashboardStats(farmId) as any 
        setCows(data.cows)
        setMilkRecords(data.milkRecords)
        setHealthRecords(data.healthRecords)
        setBreedingRecords(data.breedingRecords || [])
      } catch (err) {
        console.error('Failed to load dashboard:', err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [farmId])

  const today = new Date()
  const todayStr = today.toISOString().slice(0, 10)

  // --- CALCULATE NOTIFICATIONS ---
  const alerts: { type: string, message: string, cow: string, color: string }[] = []

  breedingRecords.forEach(b => {
    const aiDate = new Date(b.aiDate)
    const daysSinceAi = Math.floor((today.getTime() - aiDate.getTime()) / (1000 * 60 * 60 * 24))
    const cow = cows.find(c => c.id === b.cowId)?.name || 'Unknown Cow'

    // 1. Heat Check (21 days post AI)
    if (daysSinceAi >= 19 && daysSinceAi <= 23 && !b.pregnancyConfirmed) {
      alerts.push({ type: 'Heat Check', message: `Check for heat (21 days since AI)`, cow, color: 'bg-red-100 text-red-700' })
    }
    
    // 2. Pregnancy Check (60 days post AI)
    if (daysSinceAi >= 58 && daysSinceAi <= 65 && !b.pregnancyConfirmed) {
      alerts.push({ type: 'Pregnancy Check', message: `Due for pregnancy check`, cow, color: 'bg-blue-100 text-blue-700' })
    }

    // 3. Calving & Dry-Off Alerts
    if (b.expectedCalvingDate) {
      const calvingDate = new Date(b.expectedCalvingDate)
      const daysToCalving = Math.floor((calvingDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      
      // Calving Soon (14 days before)
      if (daysToCalving >= 0 && daysToCalving <= 14) {
        alerts.push({ type: 'Calving Soon', message: `Due to calve in ${daysToCalving} days`, cow, color: 'bg-amber-100 text-amber-700' })
      }
      
      // Dry Off (60 days before calving)
      if (daysToCalving >= 55 && daysToCalving <= 65) {
        alerts.push({ type: 'Dry Off Time', message: `Stop milking now (calving in ${daysToCalving} days)`, cow, color: 'bg-orange-100 text-orange-700' })
      }
    }
  })

  // --- CALCULATIONS ---
  const todayLitres = milkRecords.filter(r => r.date === todayStr).reduce((sum, r) => sum + r.litres, 0)
  const inMilkCount = cows.filter(cow => cow.status === 'in_milk').length
  const hour = today.getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'

  // Generate initials for avatar if no photo
  const initials = profile?.name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'U'

  if (loading) return <div className="p-8 text-slate-500">Loading dashboard...</div>

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10">
      
      {/* PREMIUM HERO GREETING */}
      <div className="relative overflow-hidden rounded-3xl bg-[#0a2e23] p-8 text-white shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-5">
            {/* Avatar */}
            <div className="h-16 w-16 rounded-full bg-orange-500 flex items-center justify-center text-xl font-bold shadow-inner border-2 border-white/20 overflow-hidden shrink-0">
              {profile?.avatarUrl ? (
                <img src={profile.avatarUrl} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                initials
              )}
            </div>
            <div>
              <p className="text-orange-400 font-semibold tracking-wider text-sm mb-1 flex items-center gap-2">
                <Sun size={16} /> {greeting},
              </p>
              <h1 className="text-3xl md:text-4xl font-bold">{profile?.name || 'Farmer'}</h1>
              <p className="text-slate-300 mt-2 max-w-md hidden md:block">Healthy cows, better milk, greater profits. Here is your farm summary.</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4 bg-white/10 p-4 rounded-2xl backdrop-blur-md border border-white/10 w-full md:w-auto">
             <div className="bg-orange-500 p-3 rounded-xl shadow-lg">
                <Milk size={28} className="text-white" />
             </div>
             <div>
                <p className="text-sm text-slate-300 font-medium">Today's Milk</p>
                <p className="text-2xl font-bold">{todayLitres.toFixed(1)} L</p>
             </div>
          </div>
        </div>
        {/* Decorative background */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-orange-500/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 bg-emerald-500/20 rounded-full blur-3xl"></div>
      </div>

      {/* ALERTS / NOTIFICATIONS */}
      {alerts.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Bell size={20} className="text-orange-600" /> Action Required
          </h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {alerts.map((alert, i) => (
              <div key={i} className={`p-4 rounded-2xl border border-white/50 shadow-sm backdrop-blur-sm ${alert.color}`}>
                <p className="font-bold text-sm">{alert.type}</p>
                <p className="text-sm mt-1 opacity-90"><span className="font-semibold">{alert.cow}</span> — {alert.message}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* QUICK NAVIGATION GRID */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Link to="/cows" className="flex flex-col items-center justify-center p-6 bg-white rounded-3xl shadow-sm hover:shadow-md transition-all border border-slate-100">
          <div className="bg-emerald-100 text-emerald-700 p-4 rounded-full mb-3"><Users size={28} /></div>
          <span className="font-semibold text-slate-800 text-center">Cow Records</span>
          <span className="text-2xl font-bold text-slate-900 mt-1">{cows.length}</span>
        </Link>
        <Link to="/milk" className="flex flex-col items-center justify-center p-6 bg-white rounded-3xl shadow-sm hover:shadow-md transition-all border border-slate-100">
          <div className="bg-blue-100 text-blue-700 p-4 rounded-full mb-3"><Droplets size={28} /></div>
          <span className="font-semibold text-slate-800 text-center">Milk Yield</span>
          <span className="text-2xl font-bold text-slate-900 mt-1">{inMilkCount} Milking</span>
        </Link>
        <Link to="/breeding" className="flex flex-col items-center justify-center p-6 bg-white rounded-3xl shadow-sm hover:shadow-md transition-all border border-slate-100">
          <div className="bg-violet-100 text-violet-700 p-4 rounded-full mb-3"><Activity size={28} /></div>
          <span className="font-semibold text-slate-800 text-center">Breeding</span>
          <span className="text-2xl font-bold text-slate-900 mt-1">{breedingRecords.length} Records</span>
        </Link>
        <Link to="/health" className="flex flex-col items-center justify-center p-6 bg-white rounded-3xl shadow-sm hover:shadow-md transition-all border border-slate-100">
          <div className="bg-rose-100 text-rose-700 p-4 rounded-full mb-3"><HeartPulse size={28} /></div>
          <span className="font-semibold text-slate-800 text-center">Health</span>
          <span className="text-2xl font-bold text-slate-900 mt-1">{healthRecords.length} Cases</span>
        </Link>
      </div>

      {/* HERD OVERVIEW TABLE */}
      <Card className="overflow-hidden rounded-3xl">
        <div className="border-b border-slate-200 px-6 py-4 flex justify-between items-center bg-slate-50/50">
          <h3 className="text-lg font-bold text-slate-800">Herd Overview</h3>
          <Link to="/cows" className="text-sm font-semibold text-orange-600 hover:text-orange-700 flex items-center gap-1">
            View All <ArrowRight size={16} />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-6 py-4 font-semibold">Tag / Name</th>
                <th className="px-6 py-4 font-semibold">Breed</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold">DIM (Days)</th>
              </tr>
            </thead>
            <tbody>
              {cows.slice(0, 5).map((cow) => {
                let dim = '—'
                if (cow.lastCalvedDate) {
                  const lastCalved = new Date(cow.lastCalvedDate)
                  dim = String(Math.floor((today.getTime() - lastCalved.getTime()) / (1000 * 60 * 60 * 24)))
                }
                return (
                  <tr key={cow.id} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-800">#{cow.tagId}</p>
                      <p className="text-slate-500 text-xs">{cow.name || 'Unnamed'}</p>
                    </td>
                    <td className="px-6 py-4 text-slate-600">{cow.breed}</td>
                    <td className="px-6 py-4">
                      <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700 capitalize">
                        {cow.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-700">{dim} days</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}