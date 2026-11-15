import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Users, Droplets, Activity, HeartPulse, ArrowRight, Bell, Milk, Sun, AlertOctagon, CheckCircle2, AlertCircle } from 'lucide-react'
import type { Cow, MilkRecord, HealthRecord, BreedingRecord } from '../../lib/schemas'
import { Card } from '../../components/Card'
import { useAuth } from '../auth/AuthContext'
import { getAllCows } from '../cows/cowService'
import { getAllMilkRecords } from '../milk/milkService'
import { getAllHealthRecords, isUnderWithdrawal } from '../health/healthService'
import { getAllBreedingRecords } from '../breeding/breedingService'

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
        setLoading(true)
        const [cowsData, milkData, healthData, breedingData] = await Promise.all([
          getAllCows(farmId),
          getAllMilkRecords(farmId),
          getAllHealthRecords(farmId),
          getAllBreedingRecords(farmId)
        ])
        setCows(cowsData)
        setMilkRecords(milkData)
        setHealthRecords(healthData)
        setBreedingRecords(breedingData)
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
  
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayStr = yesterday.toISOString().slice(0, 10)

  // --- CALCULATE NOTIFICATIONS / ALERTS ---
  const updates: { type: string, message: string, cow: string, color: string, icon: any }[] = []

  // 1. Health Withdrawals
  const cowsUnderWithdrawal = healthRecords.filter(isUnderWithdrawal)
  if (cowsUnderWithdrawal.length > 0) {
    cowsUnderWithdrawal.forEach(w => {
      updates.push({ 
        type: 'Withdrawal Active', 
        message: `Milk cannot be sold. Ends ${w.withdrawalEndDate}`, 
        cow: cows.find(c => c.id === w.cowId)?.name || 'Unknown', 
        color: 'bg-red-50 text-red-800 border-red-200', 
        icon: AlertOctagon 
      })
    })
  }

  // 2. Breeding & Maternity Alerts
  breedingRecords.filter(b => b.status !== 'calved').forEach(b => {
    const cowName = cows.find(c => c.id === b.cowId)?.name || 'Unknown Cow'
    const aiDate = new Date(b.aiDate)
    const daysSinceAi = Math.floor((today.getTime() - aiDate.getTime()) / (1000 * 60 * 60 * 24))

    if (daysSinceAi >= 19 && daysSinceAi <= 23 && !b.pregnancyConfirmed) {
      updates.push({ type: 'Heat Check', message: `Check for heat (21 days since AI)`, cow: cowName, color: 'bg-red-50 text-red-800 border-red-200', icon: Activity })
    }
    
    if (daysSinceAi >= 58 && daysSinceAi <= 65 && !b.pregnancyConfirmed) {
      updates.push({ type: 'Pregnancy Check', message: `Due for pregnancy check`, cow: cowName, color: 'bg-blue-50 text-blue-800 border-blue-200', icon: HeartPulse })
    }

    if (b.expectedCalvingDate) {
      const calvingDate = new Date(b.expectedCalvingDate)
      calvingDate.setHours(0,0,0,0)
      const todayMidnight = new Date(today)
      todayMidnight.setHours(0,0,0,0)

      const daysToCalving = Math.ceil((calvingDate.getTime() - todayMidnight.getTime()) / (1000 * 60 * 60 * 24))
      
      if (daysToCalving >= 30 && daysToCalving <= 40) {
        updates.push({ type: 'Dry Off Time', message: `Stop milking now (calving in ${daysToCalving} days)`, cow: cowName, color: 'bg-orange-50 text-orange-800 border-orange-200', icon: Droplets })
      }
      
      if (daysToCalving >= 18 && daysToCalving <= 24) {
        updates.push({ type: 'Steaming Up', message: `Move to maternity pen (calving in ${daysToCalving} days)`, cow: cowName, color: 'bg-purple-50 text-purple-800 border-purple-200', icon: Activity })
      }

      if (daysToCalving >= 0 && daysToCalving <= 7) {
        updates.push({ type: 'Calving Soon', message: `Due to calve in ${daysToCalving} days`, cow: cowName, color: 'bg-amber-50 text-amber-800 border-amber-200', icon: Bell })
      }
      
      if (daysToCalving < 0) {
        updates.push({ type: 'Overdue Calving', message: `Overdue by ${Math.abs(daysToCalving)} days. Inform Vet!`, cow: cowName, color: 'bg-red-600 text-white border-red-700', icon: AlertOctagon })
      }
    }
  })

  // 3. Undone Tasks (Missing Milk from Yesterday)
  const cowsMilkedYesterday = new Set(milkRecords.filter(m => m.date === yesterdayStr).map(m => m.cowId))
  const missedMilkCows = cows.filter(c => c.status === 'in_milk' && !cowsMilkedYesterday.has(c.id))
  
  if (missedMilkCows.length > 0) {
    missedMilkCows.forEach(cow => {
      updates.push({
        type: 'Missed Milk Record',
        message: `No milk recorded yesterday (${yesterdayStr})`,
        cow: cow.name || 'Unknown',
        color: 'bg-slate-100 text-slate-800 border-slate-200',
        icon: AlertCircle
      })
    })
  }

  // --- CALCULATIONS ---
  const todayLitres = milkRecords.filter(r => r.date === todayStr).reduce((sum, r) => sum + r.litres, 0)
  const inMilkCount = cows.filter(cow => cow.status === 'in_milk').length

  const hour = today.getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
  const initials = profile?.name?.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() || 'U'

  if (loading) return <div className="p-8 text-slate-500">Loading dashboard...</div>

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10">
      
      {/* PREMIUM HERO GREETING */}
      <div className="relative overflow-hidden rounded-3xl bg-[#0a2e23] p-8 text-white shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-5">
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
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-orange-500/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 bg-emerald-500/20 rounded-full blur-3xl"></div>
      </div>

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

      {/* IMPORTANT UPDATES TAB */}
      <Card className="overflow-hidden rounded-3xl border-slate-200">
        <div className="border-b border-slate-200 px-6 py-4 flex justify-between items-center bg-slate-50/50">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Bell size={20} className="text-orange-600" /> Important Updates
          </h3>
          <span className="bg-orange-100 text-orange-700 text-xs font-bold px-2.5 py-1 rounded-full">
            {updates.length} Alert{updates.length !== 1 ? 's' : ''}
          </span>
        </div>
        
        <div className="p-4 md:p-6 max-h-96 overflow-y-auto">
          {updates.length > 0 ? (
            <div className="space-y-3">
              {updates.map((update, i) => (
                <div key={i} className={`p-4 rounded-2xl border flex items-start gap-4 shadow-sm ${update.color}`}>
                  <div className="shrink-0 mt-0.5">
                    <update.icon size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm">{update.type} — {update.cow}</h4>
                    <p className="text-sm mt-1 opacity-90">{update.message}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <CheckCircle2 size={48} className="text-emerald-400 mb-3" />
              <h4 className="text-lg font-bold text-slate-800">All Caught Up!</h4>
              <p className="text-sm text-slate-500 mt-1">There are no pending alerts or missed tasks right now.</p>
            </div>
          )}
        </div>
      </Card>

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
                      <span className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${cow.status === 'in_milk' ? 'bg-emerald-100 text-emerald-700' : cow.status === 'dry' ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-700'}`}>
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