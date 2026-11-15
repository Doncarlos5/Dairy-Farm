import { useState, useEffect } from 'react'
import { Plus, Trash2, Baby, AlertTriangle, CheckCircle, Droplets } from 'lucide-react'
import type { Cow, BreedingRecord } from '../../../lib/schemas'
import { Card } from '../../../components/Card'
import { getAllCows, updateCow } from '../../cows/cowService'
import { getAllBreedingRecords, addBreedingRecord, deleteBreedingRecord, markBreedingRecordCalved } from '../breedingService'
import { useAuth } from '../../auth/AuthContext'

export function BreedingList() {
  const { profile } = useAuth()
  const farmId = profile?.farmId || ''

  const [viewMode, setViewMode] = useState<'logs' | 'maternity'>('logs')
  const [records, setRecords] = useState<BreedingRecord[]>([])
  const [cows, setCows] = useState<Cow[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)

  const [form, setForm] = useState({
    cowId: '', aiDate: new Date().toISOString().slice(0, 10), bullStraw: '', technician: '',
    cost: '', expectedCalvingDate: '', pregnancyCheckDate: '', pregnancyConfirmed: false, notes: ''
  })

  const loadData = async () => {
    if (!farmId) return
    try {
      setLoading(true)
      const [recordsData, cowsData] = await Promise.all([getAllBreedingRecords(farmId), getAllCows(farmId)])
      setRecords(recordsData); setCows(cowsData)
    } catch (err) { console.error(err) } finally { setLoading(false) }
  }

  useEffect(() => { loadData() }, [farmId])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!form.cowId || !form.aiDate || !form.bullStraw || !farmId) return
    
    let expCalving = form.expectedCalvingDate
    if (!expCalving && form.aiDate) {
      const d = new Date(form.aiDate)
      d.setDate(d.getDate() + 283)
      expCalving = d.toISOString().slice(0, 10)
    }

    try {
      await addBreedingRecord({
        id: crypto.randomUUID(), farmId, cowId: form.cowId, aiDate: form.aiDate, bullStraw: form.bullStraw,
        technician: form.technician, cost: form.cost ? Number(form.cost) : undefined, expectedCalvingDate: expCalving,
        pregnancyCheckDate: form.pregnancyCheckDate, pregnancyConfirmed: form.pregnancyConfirmed, notes: form.notes || undefined, createdAt: new Date()
      })
      setShowForm(false); loadData()
    } catch (err) { alert('Failed to save.') }
  }

  const handleDelete = async (id: string) => {
    if (window.confirm('Delete this breeding record?')) {
      try { await deleteBreedingRecord(id); loadData() } catch (err) { console.error(err) }
    }
  }

  const handleCalved = async (cowId: string, breedingRecordId: string) => {
    if (!window.confirm('Mark this cow as Calved? She will return to the milking herd.')) return
    try {
      // 1. Archive the breeding record
      await markBreedingRecordCalved(breedingRecordId)
      
      // 2. Update the cow
      await updateCow(cowId, { 
        status: 'in_milk', 
        lastCalvedDate: new Date().toISOString().slice(0, 10),
        pregnancyStatus: 'open'
      })
      
      alert('Cow moved to milking herd!')
      loadData()
    } catch (err) { alert('Failed to update cow status.') }
  }

  const handleDryOff = async (cowId: string) => {
    if (!window.confirm('Confirm Dry Off? She will stop being milked.')) return
    try {
      await updateCow(cowId, { status: 'dry' })
      alert('Cow has been moved to the Dry pen.')
      loadData()
    } catch (err) { alert('Failed to update cow status.') }
  }

  const cowName = (cowId: string) => cows.find((c) => c.id === cowId)?.name || cows.find((c) => c.id === cowId)?.tagId || 'Unknown'

  // --- MATERNITY LOGIC: Ignore 'calved' records ---
  const today = new Date()
  today.setHours(0,0,0,0)

  const maternityCows = cows.map(cow => {
    const latestBreeding = records
      .filter(r => r.cowId === cow.id && r.expectedCalvingDate && r.status !== 'calved') // <-- FIXED HERE
      .sort((a, b) => new Date(b.aiDate).getTime() - new Date(a.aiDate).getTime())[0]

    if (!latestBreeding) return null

    const expDate = new Date(latestBreeding.expectedCalvingDate!)
    expDate.setHours(0,0,0,0)
    
    const daysToCalving = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

    // Pull into Maternity Pen if 35 days (5 weeks) or less remaining, OR if already dry
    if (daysToCalving <= 35 || cow.status === 'dry') {
      return { cow, latestBreeding, daysToCalving }
    }
    return null
  }).filter(Boolean) as { cow: Cow, latestBreeding: BreedingRecord, daysToCalving: number }[]

  maternityCows.sort((a, b) => a.daysToCalving - b.daysToCalving)

  if (loading) return <div className="p-8 text-slate-500">Loading breeding records...</div>

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-orange-600 font-bold">Reproduction</p>
          <h3 className="mt-1 text-3xl font-bold text-slate-900">Breeding & Maternity</h3>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button onClick={() => setViewMode('logs')} className={`px-4 py-2 text-sm font-semibold rounded-lg capitalize transition-all ${viewMode === 'logs' ? 'bg-white shadow-sm text-orange-600' : 'text-slate-500 hover:text-slate-700'}`}>Breeding Logs</button>
            <button onClick={() => setViewMode('maternity')} className={`px-4 py-2 text-sm font-semibold rounded-lg capitalize transition-all flex items-center gap-2 ${viewMode === 'maternity' ? 'bg-white shadow-sm text-orange-600' : 'text-slate-500 hover:text-slate-700'}`}>
              <Baby size={16} /> Maternity Pen
            </button>
          </div>

          {viewMode === 'logs' && (
            <button type="button" onClick={() => setShowForm(!showForm)} className="inline-flex items-center gap-2 rounded-xl bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700">
              <Plus size={16} /> {showForm ? 'Close' : 'Add record'}
            </button>
          )}
        </div>
      </div>

      {viewMode === 'logs' && (
        <>
          {showForm && (
            <Card className="p-5">
              <h4 className="text-lg font-semibold mb-4">Log breeding record</h4>
              <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
                <label className="text-sm text-slate-700"><span className="mb-1 block font-medium">Cow</span><select value={form.cowId} onChange={(e) => setForm({ ...form, cowId: e.target.value })} className="w-full rounded-xl border border-slate-300 px-3 py-2" required><option value="">Select a cow</option>{cows.map((cow) => <option key={cow.id} value={cow.id}>{cow.name || cow.tagId}</option>)}</select></label>
                <label className="text-sm text-slate-700"><span className="mb-1 block font-medium">AI date</span><input type="date" value={form.aiDate} onChange={(e) => setForm({ ...form, aiDate: e.target.value })} className="w-full rounded-xl border border-slate-300 px-3 py-2" required /></label>
                <label className="text-sm text-slate-700"><span className="mb-1 block font-medium">Bull straw</span><input value={form.bullStraw} onChange={(e) => setForm({ ...form, bullStraw: e.target.value })} className="w-full rounded-xl border border-slate-300 px-3 py-2" required /></label>
                <label className="text-sm text-slate-700"><span className="mb-1 block font-medium">Expected calving date <span className="text-slate-400 font-normal">(Auto-calculates if blank)</span></span><input type="date" value={form.expectedCalvingDate} onChange={(e) => setForm({ ...form, expectedCalvingDate: e.target.value })} className="w-full rounded-xl border border-slate-300 px-3 py-2" /></label>
                <label className="text-sm text-slate-700"><span className="mb-1 block font-medium">Technician</span><input value={form.technician} onChange={(e) => setForm({ ...form, technician: e.target.value })} className="w-full rounded-xl border border-slate-300 px-3 py-2" /></label>
                <label className="text-sm text-slate-700"><span className="mb-1 block font-medium">Pregnancy check date</span><input type="date" value={form.pregnancyCheckDate} onChange={(e) => setForm({ ...form, pregnancyCheckDate: e.target.value })} className="w-full rounded-xl border border-slate-300 px-3 py-2" /></label>
                <label className="flex items-center gap-3 text-sm text-slate-700 mt-6"><input type="checkbox" checked={form.pregnancyConfirmed} onChange={(e) => setForm({ ...form, pregnancyConfirmed: e.target.checked })} className="h-4 w-4 rounded border-slate-300" /><span className="font-medium">Pregnancy confirmed</span></label>
                <div className="md:col-span-2 flex justify-end gap-3"><button type="button" onClick={() => setShowForm(false)} className="rounded-xl border border-slate-300 px-4 py-2 text-slate-700">Cancel</button><button type="submit" className="rounded-xl bg-orange-600 px-4 py-2 text-white hover:bg-orange-700">Save record</button></div>
              </form>
            </Card>
          )}

          <Card className="overflow-hidden">
            <table className="min-w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 text-slate-700">
                <tr><th className="px-6 py-3 font-semibold">Cow</th><th className="px-6 py-3 font-semibold">AI date</th><th className="px-6 py-3 font-semibold">Bull straw</th><th className="px-6 py-3 font-semibold">Expected calving</th><th className="px-6 py-3 font-semibold">Confirmed</th><th className="px-6 py-3 font-semibold">Status</th><th className="px-6 py-3 font-semibold">Actions</th></tr>
              </thead>
              <tbody>
                {records.length > 0 ? records.map((record) => (
                  <tr key={record.id} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="px-6 py-3 font-medium">{cowName(record.cowId)}</td>
                    <td className="px-6 py-3">{record.aiDate}</td>
                    <td className="px-6 py-3">{record.bullStraw}</td>
                    <td className="px-6 py-3">{record.expectedCalvingDate || '—'}</td>
                    <td className="px-6 py-3">{record.pregnancyConfirmed ? (<span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-700">Yes</span>) : (<span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-700">Pending</span>)}</td>
                    <td className="px-6 py-3">
                      {record.status === 'calved' ? (
                         <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-500">Calved</span>
                      ) : (
                         <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-bold text-blue-700">Active</span>
                      )}
                    </td>
                    <td className="px-6 py-3"><button onClick={() => handleDelete(record.id)} className="text-red-500 hover:text-red-700"><Trash2 size={16} /></button></td>
                  </tr>
                )) : <tr><td colSpan={7} className="px-6 py-6 text-center text-slate-500">No breeding records.</td></tr>}
              </tbody>
            </table>
          </Card>
        </>
      )}

      {viewMode === 'maternity' && (
        <div className="space-y-6">
          <div className="bg-orange-50 border border-orange-200 p-4 rounded-2xl flex items-start gap-3">
             <AlertTriangle className="text-orange-600 shrink-0 mt-0.5" size={20} />
             <div>
               <p className="font-bold text-orange-900">Maternity Pen Management</p>
               <p className="text-sm text-orange-800 mt-1">This list automatically pulls in any cow due within 5 weeks (35 days) or already marked as Dry. Monitor them closely for Steaming (close-up) and Calving.</p>
             </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {maternityCows.length > 0 ? maternityCows.map(({ cow, latestBreeding, daysToCalving }) => {
              const isDry = cow.status === 'dry'
              
              return (
                <Card key={cow.id} className={`p-5 border-t-4 flex flex-col justify-between ${daysToCalving < 0 ? 'border-t-red-600 bg-red-50/30' : daysToCalving <= 21 ? 'border-t-purple-500 bg-purple-50/30' : 'border-t-orange-500'}`}>
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="text-xl font-bold text-slate-800">{cow.name || 'Unnamed'}</h4>
                        <p className="text-sm font-bold text-orange-600">#{cow.tagId}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${isDry ? 'bg-orange-100 text-orange-700' : 'bg-emerald-100 text-emerald-700'}`}>
                        {isDry ? 'Dry' : 'In Milk'}
                      </span>
                    </div>
                    
                    <div className="space-y-2 mb-6">
                      <p className="text-sm text-slate-600 flex justify-between"><span className="font-medium">Expected Calving:</span> <span className="font-bold text-slate-800">{latestBreeding.expectedCalvingDate}</span></p>
                      
                      <div className={`mt-2 p-3 rounded-xl text-center font-bold text-sm ${
                        daysToCalving < 0 
                          ? 'bg-red-100 text-red-800 border border-red-200' 
                          : daysToCalving <= 21 
                            ? 'bg-purple-100 text-purple-800 border border-purple-200' 
                            : 'bg-slate-50 text-slate-700 border border-slate-200'
                      }`}>
                        {daysToCalving > 0 ? `${daysToCalving} days until calving` : `${Math.abs(daysToCalving)} days OVERDUE - CALL VET`}
                        {daysToCalving <= 21 && daysToCalving > 0 && <span className="block text-xs font-semibold text-purple-600 mt-1">Steaming / Close-up phase</span>}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {!isDry && (
                      <div className="mb-2 bg-amber-50 border border-amber-200 p-3 rounded-xl">
                        <p className="text-xs font-bold text-amber-800 mb-2 flex items-center gap-1">
                          <Droplets size={14} /> Stop milking: 5 weeks to calving
                        </p>
                        <button onClick={() => handleDryOff(cow.id)} className="w-full flex items-center justify-center gap-2 rounded-lg bg-orange-500 px-4 py-2 text-sm font-bold text-white hover:bg-orange-600 transition-colors">
                          Dry Off Cow Now
                        </button>
                      </div>
                    )}
                    
                    <button onClick={() => handleCalved(cow.id, latestBreeding.id)} className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#0a2e23] px-4 py-3 text-sm font-bold text-white hover:bg-emerald-900 transition-colors">
                      <CheckCircle size={18} /> Mark as Calved
                    </button>
                  </div>
                </Card>
              )
            }) : (
              <Card className="p-8 text-center text-slate-500 col-span-full">
                No cows are currently within 5 weeks of calving.
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  )
}