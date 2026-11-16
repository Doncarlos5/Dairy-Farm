import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Plus, Trash2, Baby, Activity } from 'lucide-react'
import type { Cow } from '../../../lib/schemas'
import { Card } from '../../../components/Card'
import { CowCard } from './CowCard'
import { getAllCows, addCow, deleteCow } from '../cowService'
import { addHealthRecord } from '../../health/healthService' // <-- RESTORED
import { useAuth } from '../../auth/AuthContext'

export function CowList() {
  const { profile } = useAuth()
  const farmId = profile?.farmId || ''
  const [searchParams] = useSearchParams()

  const [cows, setCows] = useState<Cow[]>([])
  const [loading, setLoading] = useState(true)
  const [openForm, setOpenForm] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // RESTORED: weight, bcs, temperature
  const [form, setForm] = useState({
    tagId: '', name: '', breed: 'Friesian' as Cow['breed'], birthDate: '',
    lactationNumber: 1, status: 'in_milk' as Cow['status'], pregnancyStatus: 'open' as Cow['pregnancyStatus'], 
    notes: '', motherId: '',
    weight: '', bcs: '', temperature: ''
  })

  useEffect(() => {
    const addCalfParam = searchParams.get('addCalf')
    if (addCalfParam) {
      setForm(prev => ({ ...prev, status: 'calf', motherId: addCalfParam }))
      setOpenForm(true)
    }
  }, [searchParams])

  const fetchCows = async () => {
    if (!farmId) return
    try {
      setLoading(true)
      const data = await getAllCows(farmId)
      setCows(data)
    } catch (err) {
      console.error('Error fetching cows:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchCows() }, [farmId])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!form.tagId || !farmId) return

    const isDuplicate = cows.some(c => c.tagId.toLowerCase() === form.tagId.toLowerCase())
    if (isDuplicate) {
      alert(`Error: A cow with Tag ID "${form.tagId}" already exists.`)
      return
    }

    try {
      const newCowId = crypto.randomUUID()

      // 1. Create the Cow
      await addCow({
        id: newCowId, 
        farmId,
        tagId: form.tagId,
        name: form.name || undefined,
        breed: form.breed,
        birthDate: form.birthDate,
        lactationNumber: form.lactationNumber,
        status: form.status,
        pregnancyStatus: form.pregnancyStatus,
        notes: form.notes || undefined,
        motherId: form.motherId || undefined,
        createdAt: new Date(),
        updatedAt: new Date()
      })

      // 2. RESTORED: Save Initial Vitals as a Health Record
      if (form.weight || form.bcs || form.temperature) {
        try {
          await addHealthRecord({
            id: crypto.randomUUID(),
            farmId,
            cowId: newCowId,
            date: new Date().toISOString().slice(0, 10),
            condition: 'Initial Registration Vitals',
            drug: 'None',
            dose: 'N/A',
            route: 'oral',
            withdrawalDays: 0,
            withdrawalEndDate: '',
            weight: form.weight ? Number(form.weight) : undefined,
            bcs: form.bcs ? Number(form.bcs) : undefined,
            temperature: form.temperature ? Number(form.temperature) : undefined,
            createdAt: new Date()
          })
        } catch (healthErr) {
          console.error('Cow saved, but vitals failed:', healthErr)
          alert('Cow added successfully, but failed to save initial vitals.')
        }
      }

      setForm({
        tagId: '', name: '', breed: 'Friesian', birthDate: '',
        lactationNumber: 1, status: 'in_milk', pregnancyStatus: 'open', notes: '',
        motherId: '', weight: '', bcs: '', temperature: ''
      })
      setOpenForm(false)
      fetchCows()
    } catch (err: any) {
      console.error('Error adding cow:', err)
      if (err.code === '23505') {
        alert(`Error: Tag ID "${form.tagId}" is already in use.`)
      } else {
        alert('Failed to add cow. Check the browser console.')
      }
    }
  }

  const handleDelete = async (id: string) => {
    const cowName = cows.find(c => c.id === id)?.name || 'this cow'
    if (window.confirm(`Are you sure you want to delete ${cowName}?\n\nWARNING: This will also permanently delete all of her milk, health, and breeding records. This cannot be undone.`)) {
      try {
        await deleteCow(id)
        fetchCows()
      } catch (err) {
        console.error('Error deleting cow:', err)
      }
    }
  }

  const filteredCows = cows.filter(c => 
    c.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.tagId.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const potentialMothers = cows.filter(c => c.status !== 'calf')

  if (loading) return <div className="p-8 text-slate-500">Loading cows...</div>

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-orange-600 font-bold">Herd</p>
          <h3 className="mt-1 text-3xl font-bold text-slate-900">Cows</h3>
        </div>
        <button
          type="button"
          onClick={() => setOpenForm(!openForm)}
          className="inline-flex items-center gap-2 rounded-xl bg-orange-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-orange-700 transition-colors"
        >
          <Plus size={16} /> {openForm ? 'Close' : 'Add cow'}
        </button>
      </div>

      <div>
        <input
          type="text"
          placeholder="Search by cow name or tag ID..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full max-w-md rounded-xl border border-slate-300 px-4 py-2.5 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 bg-white shadow-sm"
        />
      </div>

      {openForm && (
        <Card className="p-6">
          <h4 className="text-lg font-bold text-slate-800 mb-6">New cow profile</h4>
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* CORE DETAILS */}
            <div className="grid gap-4 md:grid-cols-2">
              <label className="text-sm text-slate-700">
                <span className="mb-1 block font-medium">Tag ID</span>
                <input value={form.tagId} onChange={(e) => setForm({ ...form, tagId: e.target.value })} className="w-full rounded-xl border border-slate-300 px-3 py-2" required />
              </label>
              <label className="text-sm text-slate-700">
                <span className="mb-1 block font-medium">Name</span>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full rounded-xl border border-slate-300 px-3 py-2" />
              </label>
              <label className="text-sm text-slate-700">
                <span className="mb-1 block font-medium">Breed</span>
                <select value={form.breed} onChange={(e) => setForm({ ...form, breed: e.target.value as Cow['breed'] })} className="w-full rounded-xl border border-slate-300 px-3 py-2">
                  <option value="Friesian">Friesian</option>
                  <option value="Ayrshire">Ayrshire</option>
                  <option value="Jersey">Jersey</option>
                  <option value="Cross">Cross</option>
                </select>
              </label>
              <label className="text-sm text-slate-700">
                <span className="mb-1 block font-medium">Birth date</span>
                <input type="date" value={form.birthDate} onChange={(e) => setForm({ ...form, birthDate: e.target.value })} className="w-full rounded-xl border border-slate-300 px-3 py-2" />
              </label>
            </div>

            {/* STATUS & REPRODUCTION */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 grid gap-4 md:grid-cols-3">
              <label className="text-sm text-slate-700">
                <span className="mb-1 block font-medium">Status</span>
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as Cow['status'] })} className="w-full rounded-xl border border-slate-300 px-3 py-2 bg-white">
                  <option value="in_milk">In milk</option>
                  <option value="dry">Dry</option>
                  <option value="heifer">Heifer</option>
                  <option value="calf">Calf</option>
                  <option value="culled">Culled</option>
                </select>
              </label>
              <label className="text-sm text-slate-700">
                <span className="mb-1 block font-medium">Pregnancy Status</span>
                <select value={form.pregnancyStatus} onChange={(e) => setForm({ ...form, pregnancyStatus: e.target.value as Cow['pregnancyStatus'] })} className="w-full rounded-xl border border-slate-300 px-3 py-2 bg-white">
                  <option value="open">Open</option>
                  <option value="bred">Bred</option>
                  <option value="confirmed">Confirmed Pregnant</option>
                  <option value="dry">Dry</option>
                </select>
              </label>
              <label className="text-sm text-slate-700">
                <span className="mb-1 block font-medium">Lactation Number</span>
                <input type="number" min="0" value={form.lactationNumber} onChange={(e) => setForm({ ...form, lactationNumber: Number(e.target.value) || 0 })} className="w-full rounded-xl border border-slate-300 px-3 py-2 bg-white" />
              </label>
            </div>

            {/* MOTHER LINKING (Only if Calf) */}
            {form.status === 'calf' && (
              <div className="bg-orange-50 p-4 rounded-2xl border border-orange-100">
                <label className="text-sm text-slate-700 block">
                  <span className="mb-1 block font-medium text-orange-800 flex items-center gap-2"><Baby size={16}/> Link to Mother (Optional)</span>
                  <select value={form.motherId} onChange={(e) => setForm({ ...form, motherId: e.target.value })} className="w-full rounded-xl border border-slate-300 px-3 py-2 bg-white">
                    <option value="">Unknown / Unlinked</option>
                    {potentialMothers.map(cow => (
                      <option key={cow.id} value={cow.id}>{cow.name || cow.tagId}</option>
                    ))}
                  </select>
                </label>
              </div>
            )}

            {/* RESTORED: INITIAL VITALS */}
            <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100">
              <h5 className="text-sm font-bold text-emerald-800 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Activity size={16} /> Initial Vitals (Optional)
              </h5>
              <div className="grid gap-4 md:grid-cols-3">
                <label className="text-sm text-slate-700">
                  <span className="mb-1 block font-medium">Weight (kg)</span>
                  <input type="number" min="0" step="0.1" value={form.weight} onChange={(e) => setForm({ ...form, weight: e.target.value })} placeholder="e.g. 450" className="w-full rounded-xl border border-slate-300 px-3 py-2 bg-white" />
                </label>
                <label className="text-sm text-slate-700">
                  <span className="mb-1 block font-medium">Body Condition (1-5)</span>
                  <input type="number" min="1" max="5" step="0.25" value={form.bcs} onChange={(e) => setForm({ ...form, bcs: e.target.value })} placeholder="e.g. 3.5" className="w-full rounded-xl border border-slate-300 px-3 py-2 bg-white" />
                </label>
                <label className="text-sm text-slate-700">
                  <span className="mb-1 block font-medium">Temp (°C)</span>
                  <input type="number" min="30" max="45" step="0.1" value={form.temperature} onChange={(e) => setForm({ ...form, temperature: e.target.value })} placeholder="e.g. 38.5" className="w-full rounded-xl border border-slate-300 px-3 py-2 bg-white" />
                </label>
              </div>
            </div>

            {/* NOTES */}
            <label className="text-sm text-slate-700 block">
              <span className="mb-1 block font-medium">Notes</span>
              <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="min-h-[80px] w-full rounded-xl border border-slate-300 px-3 py-2" />
            </label>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button type="button" onClick={() => setOpenForm(false)} className="rounded-xl border border-slate-300 px-6 py-2 text-slate-700 hover:bg-slate-50">Cancel</button>
              <button type="submit" className="rounded-xl bg-orange-600 px-6 py-2 text-white hover:bg-orange-700">Save cow</button>
            </div>
          </form>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filteredCows.length > 0 ? (
          filteredCows.map((cow) => (
            <div key={cow.id} className="flex flex-col">
              <Link to={`/cows/${cow.id}`}>
                <CowCard cow={cow} />
              </Link>
              
              <div className="mt-3 flex justify-between items-center">
                <Link 
                  to={`/calves?mother=${cow.id}`} 
                  className="inline-flex items-center gap-1.5 rounded-xl bg-orange-50 px-3 py-2 text-xs font-bold text-orange-600 hover:bg-orange-100 transition-colors border border-orange-100"
                >
                  <Baby size={14} /> View Calves
                </Link>
                <button
                  type="button"
                  onClick={() => handleDelete(cow.id)}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-100 transition-colors"
                >
                  <Trash2 size={14} /> Delete
                </button>
              </div>
            </div>
          ))
        ) : (
          <Card className="p-6 text-slate-500 md:col-span-2 xl:col-span-3 text-center">
            {searchQuery ? 'No cows match your search.' : 'No cows yet. Add one to begin.'}
          </Card>
        )}
      </div>
    </div>
  )
}