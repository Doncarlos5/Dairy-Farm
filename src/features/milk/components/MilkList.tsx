import { useState, useEffect } from 'react'
import { Plus, Trash2, TrendingUp, TrendingDown, Minus, ShoppingCart } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import type { Cow, MilkRecord } from '../../../lib/schemas'
import { Card } from '../../../components/Card'
import { getAllCows } from '../../cows/cowService'
import { getAllMilkRecords, addMilkRecord, deleteMilkRecord } from '../milkService'
import { addSale } from '../../finances/financeService'
import { useAuth } from '../../auth/AuthContext'
import { supabase } from '../../../lib/supabase'

export function MilkList() {
  const { profile } = useAuth()
  const farmId = profile?.farmId || ''
  const userName = profile?.name || 'Unknown'
  const workerNum = profile?.workerNumber || 'N/A'
  const isOwner = profile?.role === 'owner' || profile?.role === 'manager'
  
  const [records, setRecords] = useState<MilkRecord[]>([])
  const [cows, setCows] = useState<Cow[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  const [showMilkForm, setShowMilkForm] = useState(false)
  const [showSaleForm, setShowSaleForm] = useState(false)
  const [view, setView] = useState<'daily' | 'weekly' | 'monthly'>('daily')

  const [form, setForm] = useState({
    cowId: '',
    date: new Date().toISOString().slice(0, 10),
    session: 'am' as 'am' | 'midday' | 'pm',
    litres: '0',
    recordedBy: '' // We will handle the default in useEffect
  })

  // Once profile loads, pre-select the current user in the form
  useEffect(() => {
    if (profile && !form.recordedBy) {
      setForm(prev => ({ 
        ...prev, 
        recordedBy: `${profile.workerNumber || 'N/A'} - ${profile.name}` 
      }))
    }
  }, [profile])

  const [saleForm, setSaleForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    litres: '',
    pricePerLitre: '',
    buyer: ''
  })

  const loadData = async () => {
    if (!farmId) return
    try {
      setLoading(true)
      const [recordsData, cowsData, usersData] = await Promise.all([
        getAllMilkRecords(farmId),
        getAllCows(farmId),
        supabase.from('profiles').select('id, name, worker_number').eq('farm_id', farmId)
      ])
      setRecords(recordsData)
      setCows(cowsData)
      if (usersData.data) setUsers(usersData.data)
    } catch (err) {
      console.error('Error loading milk data:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [farmId])

  const handleMilkSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!form.cowId || !form.recordedBy || !farmId) return

    try {
      await addMilkRecord({
        id: crypto.randomUUID(), farmId, cowId: form.cowId, date: form.date,
        session: form.session, litres: Number(form.litres), recordedBy: form.recordedBy, createdAt: new Date()
      })

      setForm({ 
        cowId: '', 
        date: new Date().toISOString().slice(0, 10), 
        session: 'am', 
        litres: '0', 
        recordedBy: `${workerNum} - ${userName}` 
      })
      setShowMilkForm(false)
      loadData()
    } catch (err) { 
      console.error(err)
      alert('Failed to save. Check console.') 
    }
  }

  const handleSaleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!farmId) return

    try {
      await addSale({
        farmId, date: saleForm.date, litres: Number(saleForm.litres),
        pricePerLitre: Number(saleForm.pricePerLitre), buyer: saleForm.buyer || undefined,
        status: isOwner ? 'approved' : 'pending', createdByName: userName
      })

      alert(isOwner ? 'Sale recorded successfully.' : 'Sale submitted for Owner approval.')
      setSaleForm({ date: new Date().toISOString().slice(0, 10), litres: '', pricePerLitre: '', buyer: '' })
      setShowSaleForm(false)
    } catch (err) { 
      console.error("SUPABASE SALE ERROR:", err)
      alert('Failed to record sale. Check console.') 
    }
  }

  const handleDelete = async (id: string) => {
    if (window.confirm('Delete this milk record?')) {
      try { await deleteMilkRecord(id); loadData() } catch (err) { console.error('Error deleting:', err) }
    }
  }

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

  if (loading) return <div className="p-8 text-slate-500">Loading milk records...</div>

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-orange-600 font-bold">Production</p>
          <h3 className="mt-1 text-3xl font-bold text-slate-900">Milk Records</h3>
        </div>
        
        <div className="flex gap-2 w-full sm:w-auto">
          <button
            onClick={() => { setShowSaleForm(!showSaleForm); setShowMilkForm(false); }}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 transition-colors"
          >
            <ShoppingCart size={16} /> Record Sale
          </button>
          <button
            onClick={() => { setShowMilkForm(!showMilkForm); setShowSaleForm(false); }}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 rounded-xl bg-orange-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-orange-700 transition-colors"
          >
            <Plus size={16} /> Add Milk
          </button>
        </div>
      </div>

      {showSaleForm && (
        <Card className="p-5 border-emerald-200 bg-emerald-50/50">
          <h4 className="text-lg font-semibold mb-4 text-emerald-900">Record End of Day Sale</h4>
          <form onSubmit={handleSaleSubmit} className="grid gap-4 md:grid-cols-4">
            <label className="text-sm text-slate-700"><span className="mb-1 block font-medium">Date</span><input type="date" value={saleForm.date} onChange={(e) => setSaleForm({...saleForm, date: e.target.value})} className="w-full rounded-xl border border-slate-300 px-3 py-2" required /></label>
            <label className="text-sm text-slate-700"><span className="mb-1 block font-medium">Total Litres Sold</span><input type="number" min="0" step="0.1" value={saleForm.litres} onChange={(e) => setSaleForm({...saleForm, litres: e.target.value})} className="w-full rounded-xl border border-slate-300 px-3 py-2" required /></label>
            <label className="text-sm text-slate-700"><span className="mb-1 block font-medium">Price / Litre (KSH)</span><input type="number" min="0" step="0.01" value={saleForm.pricePerLitre} onChange={(e) => setSaleForm({...saleForm, pricePerLitre: e.target.value})} className="w-full rounded-xl border border-slate-300 px-3 py-2" required /></label>
            <label className="text-sm text-slate-700"><span className="mb-1 block font-medium">Buyer / Notes</span><input value={saleForm.buyer} onChange={(e) => setSaleForm({...saleForm, buyer: e.target.value})} placeholder="e.g. Brookside" className="w-full rounded-xl border border-slate-300 px-3 py-2" /></label>
            
            <div className="md:col-span-4 bg-white p-3 rounded-xl border border-emerald-100 flex items-center justify-between">
              <p className="text-sm text-slate-600">Signed off by: <span className="font-bold text-slate-800">{userName}</span></p>
              <button type="submit" className="rounded-xl bg-emerald-600 px-6 py-2 text-white hover:bg-emerald-700">Submit Sale</button>
            </div>
          </form>
        </Card>
      )}

      {showMilkForm && (
        <Card className="p-5">
          <h4 className="text-lg font-semibold mb-4">Log milk production</h4>
          <form onSubmit={handleMilkSubmit} className="grid gap-4 md:grid-cols-2">
            <label className="text-sm text-slate-700"><span className="mb-1 block font-medium">Cow</span><select value={form.cowId} onChange={(e) => setForm({ ...form, cowId: e.target.value })} className="w-full rounded-xl border border-slate-300 px-3 py-2" required><option value="">Select a cow</option>{cows.map((cow) => <option key={cow.id} value={cow.id}>{cow.name || cow.tagId}</option>)}</select></label>
            <label className="text-sm text-slate-700"><span className="mb-1 block font-medium">Date</span><input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="w-full rounded-xl border border-slate-300 px-3 py-2" required /></label>
            <label className="text-sm text-slate-700"><span className="mb-1 block font-medium">Session</span><select value={form.session} onChange={(e) => setForm({ ...form, session: e.target.value as 'am' | 'midday' | 'pm' })} className="w-full rounded-xl border border-slate-300 px-3 py-2"><option value="am">Morning (AM)</option><option value="midday">Midday</option><option value="pm">Evening (PM)</option></select></label>
            <label className="text-sm text-slate-700"><span className="mb-1 block font-medium">Litres</span><input type="number" min="0" step="0.1" value={form.litres} onChange={(e) => setForm({ ...form, litres: e.target.value })} className="w-full rounded-xl border border-slate-300 px-3 py-2" required /></label>
            
            <label className="text-sm text-slate-700 md:col-span-2">
              <span className="mb-1 block font-medium">Recorded by</span>
              <select value={form.recordedBy} onChange={(e) => setForm({ ...form, recordedBy: e.target.value })} className="w-full rounded-xl border border-slate-300 px-3 py-2" required>
                <option value="">Select staff member...</option>
                {users.map(u => (
                  <option key={u.id} value={`${u.worker_number || 'N/A'} - ${u.name}`}>
                    {u.worker_number || 'N/A'} - {u.name}
                  </option>
                ))}
              </select>
            </label>
            
            <div className="md:col-span-2 flex justify-end gap-3"><button type="button" onClick={() => setShowMilkForm(false)} className="rounded-xl border border-slate-300 px-4 py-2 text-slate-700">Cancel</button><button type="submit" className="rounded-xl bg-orange-600 px-4 py-2 text-white hover:bg-orange-700">Save record</button></div>
          </form>
        </Card>
      )}

      {/* ... (Chart and Table code remains the same) ... */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="md:col-span-2 p-6 bg-white rounded-3xl shadow-sm border border-slate-100">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <h3 className="text-lg font-bold text-slate-800">Production Trend</h3>
            <div className="flex bg-slate-100 p-1 rounded-xl w-full sm:w-auto">
              {(['daily', 'weekly', 'monthly'] as const).map(v => (
                <button key={v} onClick={() => setView(v)} className={`flex-1 sm:flex-none px-4 py-1.5 text-sm font-semibold rounded-lg capitalize transition-all ${view === v ? 'bg-white shadow-sm text-orange-600' : 'text-slate-500 hover:text-slate-700'}`}>{v}</button>
              ))}
            </div>
          </div>
          <div className="h-56 w-full">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                  <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Bar dataKey="litres" radius={[6, 6, 0, 0]} maxBarSize={50}>
                    {chartData.map((_, index) => (<Cell key={`cell-${index}`} fill={index === chartData.length - 1 ? '#ea580c' : '#fdba74'} />))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (<div className="h-full flex items-center justify-center text-slate-400">Not enough data to display chart.</div>)}
          </div>
        </Card>

        <div className="p-6 bg-[#0a2e23] rounded-3xl flex flex-col justify-center text-white relative overflow-hidden shadow-lg shadow-emerald-900/20">
          <p className="text-slate-300 font-semibold text-sm">Total Yield</p>
          <div className="flex items-baseline gap-1 mt-1"><p className="text-5xl font-bold">{viewTotal.toFixed(1)}</p><span className="text-xl font-medium text-slate-400">L</span></div>
          <p className="text-sm text-slate-400 mt-2">Last 7 {periodWord} periods</p>
          {chartData.length >= 2 && (
            <div className="mt-6 pt-6 border-t border-white/10 flex items-center gap-3">
              <div className={`p-2 rounded-xl ${trendPercentage >= 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>{trendPercentage > 0 ? <TrendingUp size={24} /> : trendPercentage < 0 ? <TrendingDown size={24} /> : <Minus size={24} />}</div>
              <div><p className={`font-bold text-lg flex gap-2 items-center ${trendPercentage >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{absoluteDiff > 0 ? '+' : ''}{absoluteDiff.toFixed(1)} L <span className="text-sm font-medium opacity-80">({Math.abs(trendPercentage).toFixed(1)}%)</span></p><p className="text-xs text-slate-400 font-medium">vs previous {periodWord}</p></div>
            </div>
          )}
          <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-orange-500/20 rounded-full blur-2xl pointer-events-none"></div>
        </div>
      </div>

      <Card className="overflow-hidden hidden md:block">
        <table className="min-w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-slate-50 text-slate-700">
            <tr><th className="px-6 py-3 font-semibold">Date</th><th className="px-6 py-3 font-semibold">Cow</th><th className="px-6 py-3 font-semibold">Session</th><th className="px-6 py-3 font-semibold">Litres</th><th className="px-6 py-3 font-semibold">Recorded by</th><th className="px-6 py-3 font-semibold">Action</th></tr>
          </thead>
          <tbody>
            {records.map((record) => (
              <tr key={record.id} className="border-t border-slate-100 hover:bg-slate-50">
                <td className="px-6 py-3">{record.date}</td>
                <td className="px-6 py-3 font-medium">{cows.find((cow) => cow.id === record.cowId)?.name || cows.find((cow) => cow.id === record.cowId)?.tagId || 'Unknown'}</td>
                <td className="px-6 py-3 uppercase text-slate-500">{record.session}</td>
                <td className="px-6 py-3 font-bold text-orange-600">{record.litres} L</td>
                <td className="px-6 py-3">{record.recordedBy}</td>
                <td className="px-6 py-3"><button onClick={() => handleDelete(record.id)} className="text-red-500 hover:text-red-700"><Trash2 size={16} /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <div className="md:hidden space-y-4">
        {records.map(record => (
          <Card key={record.id} className="p-4 flex flex-col gap-2">
            <div className="flex justify-between items-start">
              <div><p className="font-bold text-slate-800">{cows.find(c => c.id === record.cowId)?.name || 'Unknown Cow'}</p><p className="text-sm text-slate-500">{record.date} • {record.session.toUpperCase()}</p></div>
              <span className="font-bold text-orange-600 text-lg">{record.litres} L</span>
            </div>
            <div className="flex justify-between items-center border-t border-slate-100 pt-2 mt-1">
              <p className="text-xs text-slate-500">By: {record.recordedBy}</p>
              <button onClick={() => handleDelete(record.id)} className="text-red-500 p-2 bg-red-50 rounded-lg"><Trash2 size={16}/></button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}