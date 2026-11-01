import { useState, useEffect } from 'react'
import { Plus, Trash2, TrendingUp, TrendingDown, Minus, Undo2, AlertCircle } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import type { Cow, MilkRecord } from '../../../lib/schemas'
import { Card } from '../../../components/Card'
import { getAllCows } from '../../cows/cowService'
import { 
  getAllMilkRecords, 
  addMilkRecord, 
  requestDeleteMilkRecord, 
  rejectDeleteMilkRecord, 
  deleteMilkRecord 
} from '../milkService'
import { useAuth } from '../../auth/AuthContext'

export function MilkList() {
  const { profile } = useAuth()
  const farmId = profile?.farmId || ''
  
  // Debugging role check
  console.log("CURRENT USER ROLE:", profile?.role)
  const isOwner = profile?.role === 'owner' || profile?.role === 'manager'
  
  const [records, setRecords] = useState<MilkRecord[]>([])
  const [cows, setCows] = useState<Cow[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [view, setView] = useState<'daily' | 'weekly' | 'monthly'>('daily')

  const [form, setForm] = useState({
    cowId: '',
    date: new Date().toISOString().slice(0, 10),
    session: 'am' as 'am' | 'midday' | 'pm',
    litres: '0',
    recordedBy: ''
  })

  const loadData = async () => {
    if (!farmId) return
    try {
      setLoading(true)
      const [recordsData, cowsData] = await Promise.all([
        getAllMilkRecords(farmId),
        getAllCows(farmId)
      ])
      setRecords(recordsData)
      setCows(cowsData)
    } catch (err) {
      console.error('Error loading milk data:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [farmId])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!form.cowId || !form.recordedBy || !farmId) return

    try {
      await addMilkRecord({
        id: crypto.randomUUID(),
        farmId,
        cowId: form.cowId,
        date: form.date,
        session: form.session,
        litres: Number(form.litres),
        recordedBy: form.recordedBy,
        createdAt: new Date()
      })

      setForm({
        cowId: '',
        date: new Date().toISOString().slice(0, 10),
        session: 'am',
        litres: '0',
        recordedBy: ''
      })
      setShowForm(false)
      loadData()
    } catch (err) {
      console.error('Error adding record:', err)
      alert('Failed to save.')
    }
  }

  const handleAction = async (action: 'request' | 'approve' | 'reject', id: string) => {
    try {
      if (action === 'request') {
        if (window.confirm('Request deletion? Owner must approve.')) {
          await requestDeleteMilkRecord(id)
        }
      } else if (action === 'approve') {
        if (window.confirm('Permanently delete this record?')) {
          await deleteMilkRecord(id)
        }
      } else if (action === 'reject') {
        await rejectDeleteMilkRecord(id)
      }
      loadData()
    } catch (err) {
      console.error('Error:', err)
    }
  }

  // Chart Logic
  const groupedData = records.reduce((acc, record) => {
    let key = ''
    const d = new Date(record.date)
    if (view === 'daily') key = record.date
    else if (view === 'weekly') {
      const firstDayOfYear = new Date(d.getFullYear(), 0, 1)
      const pastDaysOfYear = (d.getTime() - firstDayOfYear.getTime()) / 86400000
      key = `W${Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7)}`
    } else if (view === 'monthly') key = d.toLocaleString('default', { month: 'short', year: '2-digit' })
    acc[key] = (acc[key] || 0) + record.litres
    return acc
  }, {} as Record<string, number>)

  let chartData = Object.entries(groupedData).map(([label, litres]) => ({ 
    label: view === 'daily' ? label.slice(5) : label, litres 
  }))
  
  if (view === 'daily') chartData.sort((a, b) => a.label.localeCompare(b.label))
  else if (view === 'monthly') chartData.sort((a, b) => new Date(a.label.replace(' ', ' 1, ')).getTime() - new Date(b.label.replace(' ', ' 1, ')).getTime())
  else chartData.sort((a, b) => parseInt(a.label.replace('W', '')) - parseInt(b.label.replace('W', '')))

  chartData = chartData.slice(-7)

  let trendPercentage = 0
  let absoluteDiff = 0
  if (chartData.length >= 2) {
    const currentTotal = chartData[chartData.length - 1].litres
    const previousTotal = chartData[chartData.length - 2].litres
    absoluteDiff = currentTotal - previousTotal
    if (previousTotal > 0) trendPercentage = (absoluteDiff / previousTotal) * 100
  }
  const viewTotal = chartData.reduce((sum, item) => sum + item.litres, 0)
  const periodWord = view === 'daily' ? 'day' : view === 'weekly' ? 'week' : 'month'
  const hasPendingRequests = records.some(r => r.pendingDeletion)

  if (loading) return <div className="p-8 text-slate-500">Loading milk records...</div>

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-orange-600 font-bold">Production</p>
          <h3 className="mt-1 text-3xl font-bold text-slate-900">Milk Records</h3>
        </div>
        <button type="button" onClick={() => setShowForm(!showForm)} className="inline-flex items-center gap-2 rounded-xl bg-orange-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-orange-700">
          <Plus size={16} /> {showForm ? 'Close' : 'Add record'}
        </button>
      </div>

      {isOwner && hasPendingRequests && (
        <div className="bg-amber-100 border border-amber-300 text-amber-800 p-4 rounded-2xl flex items-center gap-3">
          <AlertCircle size={20} className="shrink-0" />
          <p className="text-sm font-semibold">There are pending deletion requests below. Please review them.</p>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="md:col-span-2 p-6 bg-white rounded-3xl shadow-sm border border-slate-100">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <h3 className="text-lg font-bold text-slate-800">Production Trend</h3>
            <div className="flex bg-slate-100 p-1 rounded-xl w-full sm:w-auto">
              {(['daily', 'weekly', 'monthly'] as const).map(v => (
                <button key={v} onClick={() => setView(v)} className={`flex-1 sm:flex-none px-4 py-1.5 text-sm font-semibold rounded-lg capitalize transition-all ${view === v ? 'bg-white shadow-sm text-orange-600' : 'text-slate-500'}`}>
                  {v}
                </button>
              ))}
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="litres" radius={[6, 6, 0, 0]} maxBarSize={50}>
                  {chartData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={index === chartData.length - 1 ? '#ea580c' : '#fdba74'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <div className="p-6 bg-[#0a2e23] rounded-3xl flex flex-col justify-center text-white relative overflow-hidden shadow-lg shadow-emerald-900/20">
          <p className="text-slate-300 font-semibold text-sm">Total Yield</p>
          <div className="flex items-baseline gap-1 mt-1">
            <p className="text-5xl font-bold">{viewTotal.toFixed(1)}</p>
            <span className="text-xl font-medium text-slate-400">L</span>
          </div>
          <p className="text-sm text-slate-400 mt-2">Last 7 {periodWord} periods</p>
          {chartData.length >= 2 && (
            <div className="mt-6 pt-6 border-t border-white/10 flex items-center gap-3">
              <div className={`p-2 rounded-xl ${trendPercentage >= 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                {trendPercentage > 0 ? <TrendingUp size={24} /> : trendPercentage < 0 ? <TrendingDown size={24} /> : <Minus size={24} />}
              </div>
              <div>
                <p className={`font-bold text-lg flex gap-2 items-center ${trendPercentage >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {absoluteDiff > 0 ? '+' : ''}{absoluteDiff.toFixed(1)} L
                  <span className="text-sm font-medium opacity-80">({Math.abs(trendPercentage).toFixed(1)}%)</span>
                </p>
                <p className="text-xs text-slate-400 font-medium">vs previous {periodWord}</p>
              </div>
            </div>
          )}
          <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-orange-500/20 rounded-full blur-2xl pointer-events-none"></div>
        </div>
      </div>

      {showForm && (
        <Card className="p-5">
          <h4 className="text-lg font-semibold mb-4">Log milk production</h4>
          <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
            <label className="text-sm text-slate-700">
              <span className="mb-1 block font-medium">Cow</span>
              <select value={form.cowId} onChange={(e) => setForm({ ...form, cowId: e.target.value })} className="w-full rounded-xl border border-slate-300 px-3 py-2" required>
                <option value="">Select a cow</option>
                {cows.map((cow) => <option key={cow.id} value={cow.id}>{cow.name || cow.tagId}</option>)}
              </select>
            </label>
            <label className="text-sm text-slate-700">
              <span className="mb-1 block font-medium">Date</span>
              <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="w-full rounded-xl border border-slate-300 px-3 py-2" required />
            </label>
            <label className="text-sm text-slate-700">
              <span className="mb-1 block font-medium">Session</span>
              <select value={form.session} onChange={(e) => setForm({ ...form, session: e.target.value as 'am' | 'midday' | 'pm' })} className="w-full rounded-xl border border-slate-300 px-3 py-2">
                <option value="am">Morning (AM)</option>
                <option value="midday">Midday</option>
                <option value="pm">Evening (PM)</option>
              </select>
            </label>
            <label className="text-sm text-slate-700">
              <span className="mb-1 block font-medium">Litres</span>
              <input type="number" min="0" step="0.1" value={form.litres} onChange={(e) => setForm({ ...form, litres: e.target.value })} className="w-full rounded-xl border border-slate-300 px-3 py-2" required />
            </label>
            <label className="text-sm text-slate-700 md:col-span-2">
              <span className="mb-1 block font-medium">Recorded by</span>
              <input value={form.recordedBy} onChange={(e) => setForm({ ...form, recordedBy: e.target.value })} className="w-full rounded-xl border border-slate-300 px-3 py-2" required />
            </label>
            <div className="md:col-span-2 flex justify-end gap-3">
              <button type="button" onClick={() => setShowForm(false)} className="rounded-xl border border-slate-300 px-4 py-2 text-slate-700">Cancel</button>
              <button type="submit" className="rounded-xl bg-orange-600 px-4 text-white hover:bg-orange-700">Save record</button>
            </div>
          </form>
        </Card>
      )}

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-700">
              <tr>
                <th className="px-6 py-3 font-semibold">Date</th>
                <th className="px-6 py-3 font-semibold">Cow</th>
                <th className="px-6 py-3 font-semibold">Session</th>
                <th className="px-6 py-3 font-semibold">Litres</th>
                <th className="px-6 py-3 font-semibold">Recorded by</th>
                <th className="px-6 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {records.length > 0 ? (
                records.map((record) => (
                  <tr 
                    key={record.id} 
                    // APPLYING RED BACKGROUND & OPACITY IF PENDING
                    className={`border-t border-slate-100 transition-colors ${record.pendingDeletion ? 'bg-red-50/70' : 'hover:bg-slate-50'}`}
                  >
                    <td className={`px-6 py-3 ${record.pendingDeletion ? 'line-through text-slate-400' : ''}`}>{record.date}</td>
                    <td className={`px-6 py-3 font-medium ${record.pendingDeletion ? 'line-through text-slate-400' : ''}`}>
                      {cows.find((cow) => cow.id === record.cowId)?.name || cows.find((cow) => cow.id === record.cowId)?.tagId || 'Unknown'}
                    </td>
                    <td className={`px-6 py-3 uppercase ${record.pendingDeletion ? 'line-through text-slate-400' : 'text-slate-500'}`}>{record.session}</td>
                    <td className={`px-6 py-3 font-bold ${record.pendingDeletion ? 'line-through text-slate-400' : 'text-orange-600'}`}>{record.litres} L</td>
                    <td className={`px-6 py-3 ${record.pendingDeletion ? 'line-through text-slate-400' : ''}`}>{record.recordedBy}</td>
                    
                    <td className="px-6 py-3">
                      {record.pendingDeletion ? (
                        isOwner ? (
                          <div className="flex items-center gap-2">
                            <button onClick={() => handleAction('approve', record.id)} className="text-xs font-bold text-white bg-red-600 hover:bg-red-700 px-3 py-1.5 rounded-lg shadow-sm transition-colors">Approve</button>
                            <button onClick={() => handleAction('reject', record.id)} className="text-xs font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 px-3 py-1.5 rounded-lg shadow-sm transition-colors flex items-center gap-1"><Undo2 size={12}/> Reject</button>
                          </div>
                        ) : (
                          <span className="text-xs font-bold text-amber-700 bg-amber-100 px-3 py-1.5 rounded-lg border border-amber-200">Pending Owner</span>
                        )
                      ) : (
                        <button 
                          onClick={() => handleAction(isOwner ? 'approve' : 'request', record.id)} 
                          className="text-slate-400 hover:text-red-600 transition-colors"
                          title={isOwner ? "Delete permanently" : "Request deletion"}
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={6} className="px-6 py-6 text-center text-slate-500">No milk records yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}