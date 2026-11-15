import { useState, useEffect } from 'react'
import { Plus, Trash2, AlertTriangle, Activity, HeartPulse } from 'lucide-react'
import type { Cow, HealthRecord } from '../../../lib/schemas'
import { Card } from '../../../components/Card'
import { getAllCows } from '../../cows/cowService'
import { getAllHealthRecords, addHealthRecord, deleteHealthRecord, isUnderWithdrawal } from '../healthService'
import { addExpense } from '../../finances/financeService'
import { useAuth } from '../../auth/AuthContext'
import { supabase } from '../../../lib/supabase'

export function HealthList() {
  const { profile } = useAuth()
  const farmId = profile?.farmId || ''
  const userName = profile?.name || 'Unknown'
  const workerNum = profile?.workerNumber || 'N/A'
  const isOwner = profile?.role === 'owner' || profile?.role === 'manager'

  const [records, setRecords] = useState<HealthRecord[]>([])
  const [cows, setCows] = useState<Cow[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  
  const [viewMode, setViewMode] = useState<'logs' | 'summary'>('logs')

  const [form, setForm] = useState({
    cowId: '', date: new Date().toISOString().slice(0, 10), condition: '', drug: '',
    dose: '', route: 'injection' as HealthRecord['route'], withdrawalDays: '0', vetName: '', cost: '', notes: '',
    weight: '', bcs: '', temperature: '', vaccination: '',
    recordedBy: '' // New field
  })

  useEffect(() => {
    if (profile && !form.recordedBy) {
      setForm(prev => ({ 
        ...prev, 
        recordedBy: `${profile.workerNumber || 'N/A'} - ${profile.name}` 
      }))
    }
  }, [profile])

  const loadData = async () => {
    if (!farmId) return
    try {
      setLoading(true)
      const [recordsData, cowsData, usersData] = await Promise.all([
        getAllHealthRecords(farmId), 
        getAllCows(farmId),
        supabase.from('profiles').select('id, name, worker_number').eq('farm_id', farmId)
      ])
      setRecords(recordsData)
      setCows(cowsData)
      if (usersData.data) setUsers(usersData.data)
    } catch (err) {
      console.error('Error loading health data:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [farmId])

  const withdrawalEndDate = (() => {
    const days = Number(form.withdrawalDays) || 0
    if (days <= 0 || !form.date) return ''
    const d = new Date(form.date)
    d.setDate(d.getDate() + days)
    return d.toISOString().slice(0, 10)
  })()

  const getTempStatus = (temp: number) => {
    if (temp >= 39.5) return { label: 'Fever', color: 'text-red-600 bg-red-100' }
    if (temp < 38.0) return { label: 'Low', color: 'text-blue-600 bg-blue-100' }
    return { label: 'Normal', color: 'text-emerald-600 bg-emerald-100' }
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!form.cowId) return

    try {
      await addHealthRecord({
        id: crypto.randomUUID(), farmId, cowId: form.cowId, date: form.date,
        condition: form.condition.trim() || 'Routine Vitals', drug: form.drug.trim() || 'None', 
        dose: form.dose, route: form.route, withdrawalDays: Number(form.withdrawalDays) || 0,
        withdrawalEndDate, vetName: form.vetName || undefined, cost: form.cost ? Number(form.cost) : undefined, notes: form.notes || undefined,
        weight: form.weight ? Number(form.weight) : undefined, bcs: form.bcs ? Number(form.bcs) : undefined,
        temperature: form.temperature ? Number(form.temperature) : undefined, vaccination: form.vaccination || undefined,
        recordedBy: form.recordedBy, // Save the worker number
        createdAt: new Date()
      })

      const costAmount = Number(form.cost)
      if (costAmount > 0) {
        const cowName = cows.find(c => c.id === form.cowId)?.name || cows.find(c => c.id === form.cowId)?.tagId || 'Cow'
        const conditionText = form.condition.trim() || 'Routine Vitals'
        
        await addExpense({
          farmId, date: form.date, category: 'Vet', amount: costAmount,
          description: `Vet/Health: ${conditionText} for ${cowName}`,
          status: isOwner ? 'approved' : 'pending', createdByName: form.recordedBy
        })
      }

      setForm({
        cowId: '', date: new Date().toISOString().slice(0, 10), condition: '', drug: '',
        dose: '', route: 'injection', withdrawalDays: '0', vetName: '', cost: '', notes: '',
        weight: '', bcs: '', temperature: '', vaccination: '',
        recordedBy: `${workerNum} - ${userName}`
      })
      setShowForm(false)
      loadData()
    } catch (err) {
      console.error('Error adding health record:', err)
      alert('Failed to save. Check console.')
    }
  }

  const handleDelete = async (id: string) => {
    if (window.confirm('Delete this health record?')) {
      try {
        await deleteHealthRecord(id)
        loadData()
      } catch (err) {
        console.error('Error deleting:', err)
      }
    }
  }

  const cowName = (cowId: string) => cows.find((c) => c.id === cowId)?.name || cows.find((c) => c.id === cowId)?.tagId || 'Unknown'
  const underWithdrawal = records.filter(isUnderWithdrawal)
  const vitalsSummary = cows.map(cow => {
    const latestVitals = records
      .filter(r => r.cowId === cow.id && (r.weight != null || r.bcs != null || r.temperature != null))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
    return { cow, vitals: latestVitals || null };
  });

  if (loading) return <div className="p-8 text-slate-500">Loading health records...</div>

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header & Toggles */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-orange-600 font-bold">Animal care</p>
          <h3 className="mt-1 text-3xl font-bold text-slate-900">Health Records</h3>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <div className="flex bg-slate-100 p-1 rounded-xl w-full sm:w-auto">
            <button onClick={() => setViewMode('logs')} className={`flex-1 sm:flex-none px-4 py-2 text-sm font-semibold rounded-lg capitalize transition-all ${viewMode === 'logs' ? 'bg-white shadow-sm text-orange-600' : 'text-slate-500'}`}>Logs</button>
            <button onClick={() => setViewMode('summary')} className={`flex-1 sm:flex-none px-4 py-2 text-sm font-semibold rounded-lg capitalize transition-all ${viewMode === 'summary' ? 'bg-white shadow-sm text-orange-600' : 'text-slate-500'}`}>Vitals</button>
          </div>
          {viewMode === 'logs' && (
            <button type="button" onClick={() => setShowForm(!showForm)} className="inline-flex w-full sm:w-auto justify-center items-center gap-2 rounded-xl bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700">
              <Plus size={16} /> {showForm ? 'Close' : 'Log Record'}
            </button>
          )}
        </div>
      </div>

      {/* Withdrawal Warning */}
      {viewMode === 'logs' && underWithdrawal.length > 0 && (
        <Card className="border-amber-300 bg-amber-50 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="text-amber-600 shrink-0" size={20} />
            <div>
              <p className="font-semibold text-amber-900">{underWithdrawal.length} cow(s) under withdrawal</p>
              <p className="mt-1 text-sm text-amber-800">Milk cannot be sold.</p>
            </div>
          </div>
        </Card>
      )}

      {/* Logs View */}
      {viewMode === 'logs' && (
        <>
          {showForm && (
            <Card className="p-5 md:p-6">
              <h4 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2"><HeartPulse className="text-orange-600" /> Log Health Record</h4>
              <form onSubmit={handleSubmit} className="space-y-6 md:space-y-8">
                
                {/* Core Info */}
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="text-sm text-slate-700"><span className="mb-1 block font-medium">Cow</span><select value={form.cowId} onChange={(e) => setForm({ ...form, cowId: e.target.value })} className="w-full rounded-xl border border-slate-300 px-3 py-2" required><option value="">Select a cow</option>{cows.map((cow) => <option key={cow.id} value={cow.id}>{cow.name || cow.tagId}</option>)}</select></label>
                  <label className="text-sm text-slate-700"><span className="mb-1 block font-medium">Date</span><input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="w-full rounded-xl border border-slate-300 px-3 py-2" required /></label>
                </div>

                {/* Vitals */}
                <div className="bg-emerald-50 p-4 md:p-5 rounded-2xl border border-emerald-100">
                  <h5 className="text-sm font-bold text-emerald-800 uppercase tracking-wider mb-3 flex items-center gap-2"><Activity size={16} /> Vitals</h5>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <label className="text-sm text-slate-700"><span className="mb-1 block font-medium">Weight (kg)</span><input type="number" value={form.weight} onChange={(e) => setForm({ ...form, weight: e.target.value })} className="w-full rounded-xl border border-slate-300 px-3 py-2" /></label>
                    <label className="text-sm text-slate-700"><span className="mb-1 block font-medium">BCS (1-5)</span><input type="number" step="0.25" value={form.bcs} onChange={(e) => setForm({ ...form, bcs: e.target.value })} className="w-full rounded-xl border border-slate-300 px-3 py-2" /></label>
                    <label className="text-sm text-slate-700"><span className="mb-1 block font-medium">Temp (°C)</span><input type="number" step="0.1" value={form.temperature} onChange={(e) => setForm({ ...form, temperature: e.target.value })} className="w-full rounded-xl border border-slate-300 px-3 py-2" /></label>
                    <label className="text-sm text-slate-700"><span className="mb-1 block font-medium">Vaccine</span><input value={form.vaccination} onChange={(e) => setForm({ ...form, vaccination: e.target.value })} className="w-full rounded-xl border border-slate-300 px-3 py-2" /></label>
                  </div>
                </div>

                {/* Medical Treatment */}
                <div className="grid gap-4 md:grid-cols-3">
                  <label className="text-sm text-slate-700"><span className="mb-1 block font-medium">Condition</span><input value={form.condition} onChange={(e) => setForm({ ...form, condition: e.target.value })} className="w-full rounded-xl border border-slate-300 px-3 py-2" /></label>
                  <label className="text-sm text-slate-700"><span className="mb-1 block font-medium">Drug</span><input value={form.drug} onChange={(e) => setForm({ ...form, drug: e.target.value })} className="w-full rounded-xl border border-slate-300 px-3 py-2" /></label>
                  <label className="text-sm text-slate-700"><span className="mb-1 block font-medium">Dose</span><input value={form.dose} onChange={(e) => setForm({ ...form, dose: e.target.value })} className="w-full rounded-xl border border-slate-300 px-3 py-2" /></label>
                  <label className="text-sm text-slate-700"><span className="mb-1 block font-medium">Vet Name</span><input value={form.vetName} onChange={(e) => setForm({ ...form, vetName: e.target.value })} className="w-full rounded-xl border border-slate-300 px-3 py-2" /></label>
                  <label className="text-sm text-slate-700"><span className="mb-1 block font-medium">Withdrawal Days</span><input type="number" value={form.withdrawalDays} onChange={(e) => setForm({ ...form, withdrawalDays: e.target.value })} className="w-full rounded-xl border border-slate-300 px-3 py-2" /></label>
                  <label className="text-sm text-slate-700 bg-amber-50 border border-amber-200 p-2 rounded-xl"><span className="mb-1 block font-medium text-amber-900">Cost (KSH) <span className="font-normal text-xs">(Auto-logs expense)</span></span><input type="number" min="0" value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} placeholder="e.g. 1500" className="w-full rounded-xl border border-amber-300 px-3 py-2 bg-white" /></label>
                </div>

                {/* Recorded By */}
                <label className="text-sm text-slate-700 block">
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

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                  <button type="button" onClick={() => setShowForm(false)} className="rounded-xl border border-slate-300 px-4 py-2 text-slate-700">Cancel</button>
                  <button type="submit" className="rounded-xl bg-orange-600 px-6 py-2 text-white hover:bg-orange-700">Save Record</button>
                </div>
              </form>
            </Card>
          )}

          <Card className="overflow-hidden hidden md:block">
            <table className="min-w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 text-slate-700">
                <tr><th className="px-6 py-4 font-semibold">Cow</th><th className="px-6 py-4 font-semibold">Condition</th><th className="px-6 py-4 font-semibold">Recorded By</th><th className="px-6 py-4 font-semibold">Action</th></tr>
              </thead>
              <tbody>
                {records.map(record => (
                  <tr key={record.id} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="px-6 py-4"><p className="font-bold text-slate-800">{cowName(record.cowId)}</p><p className="text-xs text-slate-500">{record.date}</p></td>
                    <td className="px-6 py-4"><p className="font-medium text-slate-800">{record.condition}</p></td>
                    <td className="px-6 py-4 text-slate-600 font-medium">{record.recordedBy || 'System'}</td>
                    <td className="px-6 py-4"><button onClick={() => handleDelete(record.id)} className="text-red-500 hover:text-red-700"><Trash2 size={16} /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          <div className="md:hidden space-y-4">
            {records.map(record => (
              <Card key={record.id} className="p-4 flex flex-col gap-3">
                <div className="flex justify-between items-start">
                  <div><p className="font-bold text-slate-800 text-lg">{cowName(record.cowId)}</p><p className="text-sm text-slate-500">{record.date}</p></div>
                  <button onClick={() => handleDelete(record.id)} className="text-red-500 p-2 bg-red-50 rounded-lg"><Trash2 size={16}/></button>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl">
                  <p className="font-semibold text-slate-800">{record.condition}</p>
                  <p className="text-xs text-slate-500 mt-1">By: {record.recordedBy || 'System'}</p>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* Vitals Summary View */}
      {viewMode === 'summary' && (
        <Card className="overflow-hidden">
          <div className="p-6 border-b border-slate-100 bg-slate-50/50">
            <h3 className="text-lg font-bold text-slate-800">Latest Cow Vitals</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-white text-slate-500 border-b border-slate-100">
                <tr><th className="px-6 py-4 font-semibold">Cow</th><th className="px-6 py-4 font-semibold">Weight</th><th className="px-6 py-4 font-semibold">BCS</th><th className="px-6 py-4 font-semibold">Temp</th></tr>
              </thead>
              <tbody>
                {vitalsSummary.map(({ cow, vitals }) => (
                  <tr key={cow.id} className="border-t border-slate-50 hover:bg-slate-50">
                    <td className="px-6 py-4"><p className="font-bold text-slate-800">{cow.name || 'Unnamed'}</p><p className="text-xs text-orange-600">{cow.tagId}</p></td>
                    <td className="px-6 py-4 font-semibold">{vitals?.weight ? `${vitals.weight} kg` : '—'}</td>
                    <td className="px-6 py-4">{vitals?.bcs ? <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded font-bold">{vitals.bcs}</span> : '—'}</td>
                    <td className="px-6 py-4">{vitals?.temperature ? <span className={`px-2 py-1 rounded font-bold ${getTempStatus(vitals.temperature).color}`}>{vitals.temperature}°C</span> : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}