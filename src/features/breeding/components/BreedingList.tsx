import { useState, useEffect } from 'react'
import { Plus, Trash2, Baby, AlertTriangle, CheckCircle, Droplets, X } from 'lucide-react'
import type { Cow, BreedingRecord } from '../../../lib/schemas'
import { Card } from '../../../components/Card'
import { getAllCows, updateCow, addCow } from '../../cows/cowService'
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

  const [calvingTarget, setCalvingTarget] = useState<{ cowId: string, breedingId: string, cowName: string, breed: Cow['breed'] } | null>(null)
  const [calfForm, setCalfForm] = useState({ tagId: '', name: '', sex: 'female' })
  const [savingCalf, setSavingCalf] = useState(false)

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

  const initiateCalving = (cow: Cow, breedingRecordId: string) => {
    setCalvingTarget({
      cowId: cow.id,
      breedingId: breedingRecordId,
      cowName: cow.name || cow.tagId,
      breed: cow.breed
    })
    setCalfForm({ tagId: '', name: '', sex: 'female' })
  }

  const handleSaveCalf = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!calvingTarget || !farmId) return
    setSavingCalf(true)

    try {
      const todayStr = new Date().toISOString().slice(0, 10)
      const newCalfId = crypto.randomUUID()

      await markBreedingRecordCalved(calvingTarget.breedingId)
      await updateCow(calvingTarget.cowId, { status: 'in_milk', lastCalvedDate: todayStr, pregnancyStatus: 'open' })
      await addCow({
        id: newCalfId, farmId, tagId: calfForm.tagId, name: calfForm.name || undefined,
        breed: calvingTarget.breed, birthDate: todayStr, lactationNumber: 0, status: 'calf',
        pregnancyStatus: 'open', motherId: calvingTarget.cowId, notes: `Calf sex: ${calfForm.sex}`,
        createdAt: new Date(), updatedAt: new Date()
      })

      alert(`Success! ${calvingTarget.cowName} is now in milk, and calf ${calfForm.tagId} has been created.`)
      setCalvingTarget(null); loadData()
    } catch (err: any) {
      console.error(err)
      if (err.code === '23505') alert(`Error: Tag ID "${calfForm.tagId}" is already in use.`)
      else alert('Failed to process calving. Check console.')
    } finally {
      setSavingCalf(false)
    }
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
  const today = new Date(); today.setHours(0,0,0,0)

  const maternityCows = cows.map(cow => {
    const latestBreeding = records
      .filter(r => r.cowId === cow.id && r.expectedCalvingDate && r.status !== 'calved')
      .sort((a, b) => new Date(b.aiDate).getTime() - new Date(a.aiDate).getTime())[0]

    if (!latestBreeding) return null
    const expDate = new Date(latestBreeding.expectedCalvingDate!); expDate.setHours(0,0,0,0)
    const daysToCalving = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

    if (daysToCalving <= 60 || cow.status === 'dry') {
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

          {/* DESKTOP TABLE */}
          <Card className="overflow-hidden hidden md:block">
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

          {/* MOBILE CARDS FOR BREEDING LOGS */}
          <div className="md:hidden space-y-4">
            {records.length > 0 ? records.map((record) => (
              <Card key={record.id} className="p-4 flex flex-col gap-3">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-bold text-slate-800 text-lg">{cowName(record.cowId)}</p>
                    <p className="text-sm text-slate-500">AI Date: {record.aiDate}</p>
                  </div>
                  <button onClick={() => handleDelete(record.id)} className="text-red-500 p-2 bg-red-50 rounded-lg">
                    <Trash2 size={16} />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm bg-slate-50 p-3 rounded-xl">
                  <div>
                    <p className="text-slate-500 text-xs">Bull Straw</p>
                    <p className="font-medium text-slate-800">{record.bullStraw}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 text-xs">Expected Calving</p>
                    <p className="font-medium text-slate-800">{record.expectedCalvingDate || '—'}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {record.pregnancyConfirmed ? (
                    <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">Confirmed Pregnant</span>
                  ) : (
                    <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700">Pending Confirmation</span>
                  )}
                  {record.status === 'calved' && (
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500">Calved</span>
                  )}
                </div>
              </Card>
            )) : (
              <Card className="p-6 text-center text-slate-500">No breeding records.</Card>
            )}
          </div>
        </>
      )}

      {viewMode === 'maternity' && (
        <div className="space-y-6">
          <div className="bg-orange-50 border border-orange-200 p-4 rounded-2xl flex items-start gap-3">
             <AlertTriangle className="text-orange-600 shrink-0 mt-0.5" size={20} />
             <div>
               <p className="font-bold text-orange-900">Maternity Pen Management</p>
               <p className="text-sm text-orange-800 mt-1">This list automatically pulls in cows due within <strong>60 days (for Dry Off)</strong> or <strong>21 days (for Steaming)</strong>. Monitor them closely for Calving.</p>
             </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {maternityCows.length > 0 ? maternityCows.map(({ cow, latestBreeding, daysToCalving }) => {
              const isDry = cow.status === 'dry'
              
              return (
                <Card key={cow.id} className={`p-5 border-t-4 flex flex-col justify-between ${
                  daysToCalving < 0 
                    ? 'border-t-red-600 bg-red-50/50 shadow-md' 
                    : daysToCalving <= 21 
                      ? 'border-t-purple-600 bg-purple-50/50 shadow-md' 
                      : 'border-t-orange-500 bg-orange-50/30'
                }`}>
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
                            : 'bg-orange-100 text-orange-800 border border-orange-200'
                      }`}>
                        {daysToCalving < 0 
                          ? `${Math.abs(daysToCalving)} days OVERDUE - CALL VET` 
                          : daysToCalving === 0 
                            ? `Due Today!` 
                            : `${daysToCalving} days until calving`}
                            
                        {daysToCalving <= 21 && daysToCalving >= 0 && (
                          <span className="block text-xs font-bold uppercase tracking-wider text-purple-700 mt-1">Steaming Phase</span>
                        )}
                        {daysToCalving > 21 && (
                          <span className="block text-xs font-bold uppercase tracking-wider text-orange-700 mt-1">Dry Off Phase</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {!isDry && (
                      <div className="mb-2 bg-amber-50 border border-amber-200 p-3 rounded-xl">
                        <p className="text-xs font-bold text-amber-800 mb-2 flex items-center gap-1">
                          <Droplets size={14} /> Stop milking: 60 days to calving
                        </p>
                        <button onClick={() => handleDryOff(cow.id)} className="w-full flex items-center justify-center gap-2 rounded-lg bg-orange-500 px-4 py-2 text-sm font-bold text-white hover:bg-orange-600 transition-colors">
                          Dry Off Cow Now
                        </button>
                      </div>
                    )}
                    
                    <button onClick={() => initiateCalving(cow, latestBreeding.id)} className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#0a2e23] px-4 py-3 text-sm font-bold text-white hover:bg-emerald-900 transition-colors">
                      <CheckCircle size={18} /> Mark as Calved
                    </button>
                  </div>
                </Card>
              )
            }) : (
              <Card className="p-8 text-center text-slate-500 col-span-full">
                No cows are currently within 60 days of calving.
              </Card>
            )}
          </div>
        </div>
      )}

      {calvingTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
              <div>
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2"><Baby className="text-orange-500"/> Record New Calf</h2>
                <p className="text-sm text-slate-500 mt-1">Mother: <span className="font-bold text-orange-600">{calvingTarget.cowName}</span></p>
              </div>
              <button onClick={() => setCalvingTarget(null)} className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-full transition-colors"><X size={20} /></button>
            </div>

            <form onSubmit={handleSaveCalf} className="p-6 space-y-4">
              <div className="bg-emerald-50 text-emerald-800 text-sm p-3 rounded-xl border border-emerald-100 mb-4">
                Saving this will move the mother back to the milking herd and create a new calf profile.
              </div>
              
              <label className="text-sm text-slate-700 block">
                <span className="mb-1 block font-medium">Calf Tag ID *</span>
                <input value={calfForm.tagId} onChange={(e) => setCalfForm({ ...calfForm, tagId: e.target.value })} className="w-full rounded-xl border border-slate-300 px-3 py-2" required placeholder="e.g. CF-001" />
              </label>
              
              <label className="text-sm text-slate-700 block">
                <span className="mb-1 block font-medium">Calf Name (Optional)</span>
                <input value={calfForm.name} onChange={(e) => setCalfForm({ ...calfForm, name: e.target.value })} className="w-full rounded-xl border border-slate-300 px-3 py-2" placeholder="e.g. Buttercup" />
              </label>

              <label className="text-sm text-slate-700 block">
                <span className="mb-1 block font-medium">Sex</span>
                <select value={calfForm.sex} onChange={(e) => setCalfForm({ ...calfForm, sex: e.target.value })} className="w-full rounded-xl border border-slate-300 px-3 py-2 bg-white">
                  <option value="female">Female (Heifer)</option>
                  <option value="male">Male (Bull Calf)</option>
                </select>
              </label>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-6">
                <button type="button" onClick={() => setCalvingTarget(null)} className="rounded-xl border border-slate-300 px-4 py-2 text-slate-700 hover:bg-slate-50 font-medium">Cancel</button>
                <button type="submit" disabled={savingCalf} className="rounded-xl bg-orange-600 px-6 py-2 text-white hover:bg-orange-700 font-medium disabled:opacity-50">
                  {savingCalf ? 'Saving...' : 'Save & Mark Calved'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}