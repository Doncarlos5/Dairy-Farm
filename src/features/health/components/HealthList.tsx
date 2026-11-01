import { useState, useEffect } from 'react'
import { Plus, Trash2, AlertTriangle, Activity, HeartPulse, ClipboardList, Scale, Info, Thermometer } from 'lucide-react'
import type { Cow, HealthRecord } from '../../../lib/schemas'
import { Card } from '../../../components/Card'
import { getAllCows } from '../../cows/cowService'
import { getAllHealthRecords, addHealthRecord, deleteHealthRecord, isUnderWithdrawal } from '../healthService'
import { useAuth } from '../../auth/AuthContext'

export function HealthList() {
  const { profile } = useAuth()
  const farmId = profile?.farmId || ''

  const [records, setRecords] = useState<HealthRecord[]>([])
  const [cows, setCows] = useState<Cow[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  
  const [viewMode, setViewMode] = useState<'logs' | 'summary'>('logs')

  const [form, setForm] = useState({
    cowId: '', date: new Date().toISOString().slice(0, 10), 
    condition: '', 
    drug: '', 
    dose: '', route: 'injection' as HealthRecord['route'], withdrawalDays: '0', vetName: '', cost: '', notes: '',
    weight: '', bcs: '', temperature: '', vaccination: ''
  })

  const loadData = async () => {
    if (!farmId) return
    try {
      setLoading(true)
      const [recordsData, cowsData] = await Promise.all([
        getAllHealthRecords(farmId),
        getAllCows(farmId)
      ])
      setRecords(recordsData)
      setCows(cowsData)
    } catch (err) {
      console.error('Error loading health data:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [farmId])

  const withdrawalEndDate = (() => {
    const days = Number(form.withdrawalDays) || 0
    if (days <= 0 || !form.date) return ''
    const d = new Date(form.date)
    d.setDate(d.getDate() + days)
    return d.toISOString().slice(0, 10)
  })()

  // Helper to determine temperature status
  const getTempStatus = (temp: number) => {
    if (temp >= 39.5) return { label: 'Fever (High)', color: 'text-red-600 bg-red-100' }
    if (temp < 38.0) return { label: 'Low Temp', color: 'text-blue-600 bg-blue-100' }
    return { label: 'Normal', color: 'text-emerald-600 bg-emerald-100' }
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!form.cowId) {
      alert("Please select a cow.")
      return
    }

    try {
      await addHealthRecord({
        id: crypto.randomUUID(), 
        farmId, 
        cowId: form.cowId, 
        date: form.date,
        condition: form.condition.trim() || 'Routine Vitals', 
        drug: form.drug.trim() || 'None', 
        dose: form.dose, 
        route: form.route, 
        withdrawalDays: Number(form.withdrawalDays) || 0,
        withdrawalEndDate, 
        vetName: form.vetName || undefined, 
        cost: form.cost ? Number(form.cost) : undefined, 
        notes: form.notes || undefined,
        weight: form.weight ? Number(form.weight) : undefined,
        bcs: form.bcs ? Number(form.bcs) : undefined,
        temperature: form.temperature ? Number(form.temperature) : undefined,
        vaccination: form.vaccination || undefined,
        createdAt: new Date()
      })

      setForm({
        cowId: '', date: new Date().toISOString().slice(0, 10), condition: '', drug: '',
        dose: '', route: 'injection', withdrawalDays: '0', vetName: '', cost: '', notes: '',
        weight: '', bcs: '', temperature: '', vaccination: ''
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

  const cowName = (cowId: string) => {
    const cow = cows.find((c) => c.id === cowId)
    return cow?.name || cow?.tagId || 'Unknown'
  }

  const underWithdrawal = records.filter(isUnderWithdrawal)

  const vitalsSummary = cows.map(cow => {
    const latestVitals = records
      .filter(r => r.cowId === cow.id && (r.weight != null || r.bcs != null || r.temperature != null))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

    return {
      cow,
      vitals: latestVitals || null
    };
  });

  if (loading) {
    return <div className="p-8 text-slate-500">Loading health records from Supabase...</div>
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-orange-600 font-bold">Animal care</p>
          <h3 className="mt-1 text-3xl font-bold text-slate-900">Health & Vet Records</h3>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button 
              onClick={() => setViewMode('logs')} 
              className={`px-4 py-2 text-sm font-semibold rounded-lg capitalize transition-all flex items-center gap-2 ${viewMode === 'logs' ? 'bg-white shadow-sm text-orange-600' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <ClipboardList size={16} /> Logs
            </button>
            <button 
              onClick={() => setViewMode('summary')} 
              className={`px-4 py-2 text-sm font-semibold rounded-lg capitalize transition-all flex items-center gap-2 ${viewMode === 'summary' ? 'bg-white shadow-sm text-orange-600' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <Scale size={16} /> Vitals Summary
            </button>
          </div>

          {viewMode === 'logs' && (
            <button
              type="button"
              onClick={() => setShowForm(!showForm)}
              className="inline-flex items-center gap-2 rounded-xl bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700 transition-colors"
            >
              <Plus size={16} /> {showForm ? 'Close' : 'Log Record'}
            </button>
          )}
        </div>
      </div>

      {viewMode === 'logs' && underWithdrawal.length > 0 && (
        <Card className="border-amber-300 bg-amber-50 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="text-amber-600 shrink-0" size={20} />
            <div>
              <p className="font-semibold text-amber-900">
                {underWithdrawal.length} cow{underWithdrawal.length > 1 ? 's' : ''} under withdrawal
              </p>
              <p className="mt-1 text-sm text-amber-800">
                Milk from {underWithdrawal.map((r) => cowName(r.cowId)).join(', ')} cannot be sold.
              </p>
            </div>
          </div>
        </Card>
      )}

      {viewMode === 'logs' && (
        <>
          {showForm && (
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-6">
                <HeartPulse className="text-orange-600" />
                <h4 className="text-lg font-bold text-slate-800">Log Health Record or Vitals</h4>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-8">
                
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="text-sm text-slate-700">
                    <span className="mb-1 block font-medium">Cow *</span>
                    <select value={form.cowId} onChange={(e) => setForm({ ...form, cowId: e.target.value })} className="w-full rounded-xl border border-slate-300 px-3 py-2 bg-white" required>
                      <option value="">Select a cow</option>
                      {cows.map((cow) => <option key={cow.id} value={cow.id}>{cow.name || cow.tagId}</option>)}
                    </select>
                  </label>
                  <label className="text-sm text-slate-700">
                    <span className="mb-1 block font-medium">Date</span>
                    <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="w-full rounded-xl border border-slate-300 px-3 py-2" required />
                  </label>
                </div>

                {/* VITALS SECTION WITH TEMP CHECKER */}
                <div className="bg-emerald-50 p-5 rounded-2xl border border-emerald-100">
                  <h5 className="text-sm font-bold text-emerald-800 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Activity size={16} /> Vitals & Vaccinations
                  </h5>
                  <div className="grid gap-4 md:grid-cols-4">
                    <label className="text-sm text-slate-700">
                      <span className="mb-1 block font-medium">Weight (kg)</span>
                      <input type="number" min="0" step="0.1" value={form.weight} onChange={(e) => setForm({ ...form, weight: e.target.value })} placeholder="e.g. 450" className="w-full rounded-xl border border-slate-300 px-3 py-2" />
                    </label>
                    <label className="text-sm text-slate-700">
                      <span className="mb-1 block font-medium">Body Condition (1-5)</span>
                      <input type="number" min="1" max="5" step="0.25" value={form.bcs} onChange={(e) => setForm({ ...form, bcs: e.target.value })} placeholder="e.g. 3.5" className="w-full rounded-xl border border-slate-300 px-3 py-2" />
                    </label>
                    <label className="text-sm text-slate-700 relative">
                      <span className="mb-1 block font-medium">Temp (°C)</span>
                      <input type="number" min="30" max="45" step="0.1" value={form.temperature} onChange={(e) => setForm({ ...form, temperature: e.target.value })} placeholder="e.g. 38.5" className="w-full rounded-xl border border-slate-300 px-3 py-2" />
                      
                      {/* Live Temperature Warning in Form */}
                      {form.temperature && (
                        <div className={`absolute -bottom-6 left-0 text-xs font-bold flex items-center gap-1 ${getTempStatus(Number(form.temperature)).color.split(' ')[0]}`}>
                           <Thermometer size={12} /> {getTempStatus(Number(form.temperature)).label}
                        </div>
                      )}
                    </label>
                    <label className="text-sm text-slate-700">
                      <span className="mb-1 block font-medium">Vaccination Given</span>
                      <input value={form.vaccination} onChange={(e) => setForm({ ...form, vaccination: e.target.value })} placeholder="e.g. FMD" className="w-full rounded-xl border border-slate-300 px-3 py-2" />
                    </label>
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <h5 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Medical Treatment (Optional)</h5>
                  </div>
                  <div className="grid gap-4 md:grid-cols-3">
                    <label className="text-sm text-slate-700">
                      <span className="mb-1 block font-medium">Condition / Reason</span>
                      <input value={form.condition} onChange={(e) => setForm({ ...form, condition: e.target.value })} placeholder="e.g. Mastitis" className="w-full rounded-xl border border-slate-300 px-3 py-2" />
                    </label>
                    <label className="text-sm text-slate-700">
                      <span className="mb-1 block font-medium">Drug / Treatment</span>
                      <input value={form.drug} onChange={(e) => setForm({ ...form, drug: e.target.value })} placeholder="e.g. Ceftiofur" className="w-full rounded-xl border border-slate-300 px-3 py-2" />
                    </label>
                    <label className="text-sm text-slate-700">
                      <span className="mb-1 block font-medium">Dose</span>
                      <input value={form.dose} onChange={(e) => setForm({ ...form, dose: e.target.value })} placeholder="e.g. 4ml" className="w-full rounded-xl border border-slate-300 px-3 py-2" />
                    </label>
                    <label className="text-sm text-slate-700">
                      <span className="mb-1 block font-medium">Route</span>
                      <select value={form.route} onChange={(e) => setForm({ ...form, route: e.target.value as HealthRecord['route'] })} className="w-full rounded-xl border border-slate-300 px-3 py-2">
                        <option value="injection">Injection</option>
                        <option value="oral">Oral</option>
                        <option value="topical">Topical</option>
                      </select>
                    </label>
                    <label className="text-sm text-slate-700">
                      <span className="mb-1 block font-medium">Withdrawal Days</span>
                      <input type="number" min="0" value={form.withdrawalDays} onChange={(e) => setForm({ ...form, withdrawalDays: e.target.value })} className="w-full rounded-xl border border-slate-300 px-3 py-2" />
                    </label>
                    <label className="text-sm text-slate-700">
                      <span className="mb-1 block font-medium">Vet Name (Optional)</span>
                      <input value={form.vetName} onChange={(e) => setForm({ ...form, vetName: e.target.value })} placeholder="e.g. Dr. Bailey" className="w-full rounded-xl border border-slate-300 px-3 py-2" />
                    </label>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                  <button type="button" onClick={() => setShowForm(false)} className="rounded-xl border border-slate-300 px-6 py-2 text-slate-700 hover:bg-slate-50 transition-colors">Cancel</button>
                  <button type="submit" className="rounded-xl bg-orange-600 px-6 py-2 text-white hover:bg-orange-700 transition-colors">Save Record</button>
                </div>
              </form>
            </Card>
          )}

          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-50 text-slate-700">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Cow & Date</th>
                    <th className="px-6 py-4 font-semibold">Condition</th>
                    <th className="px-6 py-4 font-semibold">Vitals Logged</th>
                    <th className="px-6 py-4 font-semibold">Treatment</th>
                    <th className="px-6 py-4 font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {records.length > 0 ? (
                    records.map((record) => {
                      const active = isUnderWithdrawal(record)
                      return (
                        <tr key={record.id} className="border-t border-slate-100 hover:bg-slate-50">
                          <td className="px-6 py-4">
                            <p className="font-bold text-slate-800">{cowName(record.cowId)}</p>
                            <p className="text-slate-500 text-xs">{record.date}</p>
                          </td>
                          <td className="px-6 py-4">
                            <p className="font-medium text-slate-800">{record.condition}</p>
                            {record.vaccination && (
                              <span className="inline-block mt-1 text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded">💉 {record.vaccination}</span>
                            )}
                            {active && <span className="block mt-1 text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-700 px-2 py-0.5 rounded w-max">Withdrawal Active</span>}
                          </td>
                          <td className="px-6 py-4 text-xs text-slate-600 space-y-1">
                            {record.weight && <p>Weight: <span className="font-semibold">{record.weight} kg</span></p>}
                            {record.bcs && <p>BCS: <span className="font-semibold">{record.bcs}/5</span></p>}
                            {record.temperature && (
                              <p className="flex items-center gap-1">
                                Temp: <span className="font-semibold">{record.temperature}°C</span>
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${getTempStatus(record.temperature).color}`}>
                                  {getTempStatus(record.temperature).label}
                                </span>
                              </p>
                            )}
                            {!record.weight && !record.bcs && !record.temperature && <p className="text-slate-400 italic">None</p>}
                          </td>
                          <td className="px-6 py-4">
                            <p className="font-medium">{record.drug}</p>
                            {record.dose && <p className="text-slate-500 text-xs">{record.dose} • {record.route}</p>}
                          </td>
                          <td className="px-6 py-4">
                            <button type="button" onClick={() => handleDelete(record.id)} className="text-slate-400 hover:text-red-600 transition-colors">
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      )
                    })
                  ) : (
                    <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-500">No health records yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      {viewMode === 'summary' && (
        <Card className="overflow-hidden">
          <div className="p-6 border-b border-slate-100 bg-slate-50/50">
            <h3 className="text-lg font-bold text-slate-800">Latest Cow Vitals</h3>
            <p className="text-sm text-slate-500 mt-1">Automatically displays the most recent weight, BCS, and temp for every cow.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-white text-slate-500 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4 font-semibold">Cow</th>
                  <th className="px-6 py-4 font-semibold">Tag ID</th>
                  <th className="px-6 py-4 font-semibold">Last Updated</th>
                  <th className="px-6 py-4 font-semibold">Weight</th>
                  <th className="px-6 py-4 font-semibold">BCS</th>
                  <th className="px-6 py-4 font-semibold">Temp</th>
                </tr>
              </thead>
              <tbody>
                {vitalsSummary.map(({ cow, vitals }) => (
                  <tr key={cow.id} className="border-t border-slate-50 hover:bg-slate-50">
                    <td className="px-6 py-4 font-bold text-slate-800">{cow.name || 'Unnamed'}</td>
                    <td className="px-6 py-4 font-medium text-orange-600">{cow.tagId}</td>
                    <td className="px-6 py-4 text-slate-500 text-xs">
                      {vitals ? vitals.date : <span className="text-slate-400">Never</span>}
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-700">
                      {vitals?.weight ? `${vitals.weight} kg` : <span className="text-slate-400 font-normal">—</span>}
                    </td>
                    <td className="px-6 py-4">
                      {vitals?.bcs ? (
                        <span className="inline-flex items-center justify-center bg-orange-100 text-orange-700 font-bold px-2 py-1 rounded w-12">
                          {vitals.bcs}
                        </span>
                      ) : <span className="text-slate-400 font-normal">—</span>}
                    </td>
                    <td className="px-6 py-4">
                      {vitals?.temperature ? (
                        <div className="flex flex-col gap-1">
                           <span className="font-semibold text-slate-700">{vitals.temperature}°C</span>
                           <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded w-max ${getTempStatus(vitals.temperature).color}`}>
                             {getTempStatus(vitals.temperature).label}
                           </span>
                        </div>
                      ) : <span className="text-slate-400 font-normal">—</span>}
                    </td>
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