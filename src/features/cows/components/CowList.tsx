import { useState, useEffect } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import type { Cow } from '../../../lib/schemas'
import { Card } from '../../../components/Card'
import { CowCard } from './CowCard'
import { getAllCows, addCow, deleteCow } from '../cowService'
import { Link } from 'react-router-dom'

export function CowList() {
  const farmId = '00000000-0000-0000-0000-000000000001' // Your real farm ID
  
  const [cows, setCows] = useState<Cow[]>([])
  const [loading, setLoading] = useState(true)
  const [openForm, setOpenForm] = useState(false)

  const [form, setForm] = useState({
    tagId: '',
    name: '',
    breed: 'Friesian' as Cow['breed'],
    birthDate: '',
    lactationNumber: 1,
    status: 'in_milk' as Cow['status'],
    pregnancyStatus: 'open' as Cow['pregnancyStatus'],
    notes: ''
  })

  // Fetch cows from Supabase
   const fetchCows = async () => {
    try {
      setLoading(true)
      const data = await getAllCows(farmId)
      console.log("🔥 DATA FROM SUPABASE:", data) // <-- Add this line
      setCows(data)
    } catch (err) {
      console.error('Error fetching cows:', err)
    } finally {
      setLoading(false)
    }
  }

  // Load cows when the page opens
  useEffect(() => {
    fetchCows()
  }, [])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!form.tagId) return

    try {
      await addCow({
        id: crypto.randomUUID(), 
        farmId,
        tagId: form.tagId,
        name: form.name || undefined,
        breed: form.breed,
        birthDate: form.birthDate,
        lactationNumber: form.lactationNumber,
        status: form.status,
        pregnancyStatus: form.pregnancyStatus,
        notes: form.notes || undefined,
        createdAt: new Date(),
        updatedAt: new Date()
      })

      setForm({
        tagId: '',
        name: '',
        breed: 'Friesian',
        birthDate: '',
        lactationNumber: 1,
        status: 'in_milk',
        pregnancyStatus: 'open',
        notes: ''
      })
      setOpenForm(false)
      fetchCows() // Refresh the list from the cloud
    } catch (err) {
      console.error('Error adding cow:', err)
      alert('Failed to add cow. Check the browser console.')
    }
  }

  const handleDelete = async (id: string) => {
    if (window.confirm('Delete this cow?')) {
      try {
        await deleteCow(id)
        fetchCows() // Refresh the list from the cloud
      } catch (err) {
        console.error('Error deleting cow:', err)
      }
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-emerald-600 font-semibold">Herd</p>
          <h3 className="mt-1 text-3xl font-bold text-slate-900">Cows</h3>
        </div>
        <button
          type="button"
          onClick={() => setOpenForm(!openForm)}
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-700"
        >
          <Plus size={16} /> {openForm ? 'Close' : 'Add cow'}
        </button>
      </div>

      {openForm && (
        <Card className="p-5">
          <h4 className="text-lg font-semibold text-slate-800 mb-4">New cow profile</h4>
          <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
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
            <label className="text-sm text-slate-700">
              <span className="mb-1 block font-medium">Lactation number</span>
              <input type="number" value={form.lactationNumber} onChange={(e) => setForm({ ...form, lactationNumber: Number(e.target.value) || 1 })} className="w-full rounded-xl border border-slate-300 px-3 py-2" />
            </label>
            <label className="text-sm text-slate-700">
              <span className="mb-1 block font-medium">Status</span>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as Cow['status'] })} className="w-full rounded-xl border border-slate-300 px-3 py-2">
                <option value="in_milk">In milk</option>
                <option value="dry">Dry</option>
                <option value="heifer">Heifer</option>
                <option value="calf">Calf</option>
                <option value="culled">Culled</option>
              </select>
            </label>
            <label className="text-sm text-slate-700 md:col-span-2">
              <span className="mb-1 block font-medium">Notes</span>
              <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="min-h-[110px] w-full rounded-xl border border-slate-300 px-3 py-2" />
            </label>
            <div className="md:col-span-2 flex justify-end gap-3">
              <button type="button" onClick={() => setOpenForm(false)} className="rounded-xl border border-slate-300 px-4 py-2 text-slate-700">Cancel</button>
              <button type="submit" className="rounded-xl bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-700">Save cow</button>
            </div>
          </form>
        </Card>
      )}

      {loading ? (
        <Card className="p-6 text-center text-slate-500">Loading cows from Supabase...</Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {cows.length > 0 ? (
            cows.map((cow) => (
              <div key={cow.id} className="flex flex-col relative group">
                
                {/* Wrap the card in a Link */}
                <Link to={`/cows/${cow.id}`}>
                  <CowCard cow={cow} />
                </Link>

                {/* Delete button positioned at the bottom */}
                <div className="mt-3 flex justify-end">
                  <button
                    type="button"
                    onClick={() => handleDelete(cow.id)}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-100"
                  >
                    <Trash2 size={14} /> Delete
                  </button>
                </div>
              </div>
            ))
          ) : (
            <Card className="p-6 text-slate-500 md:col-span-2 xl:col-span-3">No cows yet. Add one to begin.</Card>
          )}
        </div>
      )}
    </div>
  )
}