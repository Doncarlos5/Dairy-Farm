import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Users, Droplets, Activity, HeartPulse, ArrowRight, AlertTriangle } from 'lucide-react'
import type { Cow, MilkRecord, HealthRecord } from '../../lib/schemas'
import { Card } from '../../components/Card'
import { getDashboardStats } from './dashboardService'

export function Dashboard() {
  const farmId = '00000000-0000-0000-0000-000000000001'
  
  const [cows, setCows] = useState<Cow[]>([])
  const [milkRecords, setMilkRecords] = useState<MilkRecord[]>([])
  const [healthRecords, setHealthRecords] = useState<HealthRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        const data = await getDashboardStats(farmId)
        setCows(data.cows)
        setMilkRecords(data.milkRecords)
        setHealthRecords(data.healthRecords)
      } catch (err) {
        console.error('Failed to load dashboard:', err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  // Simple check for withdrawal (if withdrawalEndDate is in the future)
  const today = new Date().toISOString().slice(0, 10)
  const underWithdrawal = healthRecords.filter((h) => h.withdrawalEndDate && h.withdrawalEndDate >= today)

  const todayLitres = milkRecords
    .filter((r) => r.date === today)
    .reduce((sum, r) => sum + r.litres, 0)

  const stats = [
    { label: 'Total cows', value: cows.length, icon: Users, tone: 'bg-sky-100 text-sky-700' },
    { label: 'In milk', value: cows.filter((cow) => cow.status === 'in_milk').length, icon: Droplets, tone: 'bg-cyan-100 text-cyan-700' },
    { label: 'Pregnant', value: cows.filter((cow) => ['bred', 'confirmed'].includes(cow.pregnancyStatus)).length, icon: Activity, tone: 'bg-violet-100 text-violet-700' },
    { label: 'Health records', value: healthRecords.length, icon: HeartPulse, tone: 'bg-rose-100 text-rose-700' }
  ]

  if (loading) {
    return <div className="p-6 text-slate-500">Loading dashboard from Supabase...</div>
  }

  return (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map(({ label, value, icon: Icon, tone }) => (
          <Card key={label} className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">{label}</p>
                <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
              </div>
              <div className={`rounded-xl p-3 ${tone}`}>
                <Icon size={24} />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {underWithdrawal.length > 0 && (
        <Card className="border-amber-300 bg-amber-50 p-5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="text-amber-600 shrink-0 mt-0.5" size={20} />
            <div className="flex-1">
              <p className="font-semibold text-amber-900">
                {underWithdrawal.length} cow{underWithdrawal.length > 1 ? 's' : ''} under withdrawal
              </p>
              <p className="mt-1 text-sm text-amber-800">
                Milk from these cows cannot be sold until the withdrawal period ends.
              </p>
            </div>
            <Link to="/health" className="text-sm font-medium text-amber-900 underline hover:no-underline">
              Review
            </Link>
          </div>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-5">
          <p className="text-sm text-slate-500">Today's milk</p>
          <p className="mt-2 text-3xl font-bold text-sky-700">{todayLitres.toFixed(1)}L</p>
          <p className="mt-1 text-xs text-slate-500">Across all sessions today</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-slate-500">Milk records (all time)</p>
          <p className="mt-2 text-3xl font-bold">{milkRecords.length}</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-slate-500">Under withdrawal</p>
          <p className="mt-2 text-3xl font-bold text-amber-700">{underWithdrawal.length}</p>
        </Card>
      </div>

      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-800">Quick actions</h3>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <Link to="/cows" className="rounded-xl border border-slate-200 bg-slate-50 p-4 hover:border-sky-300 hover:bg-sky-50 transition-all">
            <p className="font-semibold text-slate-800">Register cow</p>
            <p className="mt-1 text-sm text-slate-600">Add new animals to the herd.</p>
            <div className="mt-3 inline-flex items-center gap-2 text-sm text-sky-700">
              Open cows <ArrowRight size={16} />
            </div>
          </Link>
          <Link to="/milk" className="rounded-xl border border-slate-200 bg-slate-50 p-4 hover:border-sky-300 hover:bg-sky-50 transition-all">
            <p className="font-semibold text-slate-800">Log milk</p>
            <p className="mt-1 text-sm text-slate-600">Track daily production by session.</p>
            <div className="mt-3 inline-flex items-center gap-2 text-sm text-sky-700">
              Go to milk <ArrowRight size={16} />
            </div>
          </Link>
          <Link to="/breeding" className="rounded-xl border border-slate-200 bg-slate-50 p-4 hover:border-sky-300 hover:bg-sky-50 transition-all">
            <p className="font-semibold text-slate-800">Breeding plan</p>
            <p className="mt-1 text-sm text-slate-600">Monitor pregnancy and calving dates.</p>
            <div className="mt-3 inline-flex items-center gap-2 text-sm text-sky-700">
              Review breeding <ArrowRight size={16} />
            </div>
          </Link>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="border-b border-slate-200 px-5 py-4">
          <h3 className="text-lg font-semibold text-slate-800">Herd overview</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-700">
              <tr>
                <th className="px-5 py-3 font-semibold">Tag ID</th>
                <th className="px-5 py-3 font-semibold">Name</th>
                <th className="px-5 py-3 font-semibold">Breed</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 font-semibold">Pregnancy</th>
              </tr>
            </thead>
            <tbody>
              {cows.slice(0, 5).map((cow) => (
                <tr key={cow.id} className="border-t border-slate-200 hover:bg-slate-50">
                  <td className="px-5 py-3">{cow.tagId}</td>
                  <td className="px-5 py-3">{cow.name || 'Unnamed'}</td>
                  <td className="px-5 py-3">{cow.breed}</td>
                  <td className="px-5 py-3">
                    <span className="rounded-full bg-sky-100 px-2 py-1 text-xs font-medium text-sky-700">
                      {cow.status}
                    </span>
                  </td>
                  <td className="px-5 py-3">{cow.pregnancyStatus}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}