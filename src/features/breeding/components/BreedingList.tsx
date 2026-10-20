import { useState, useEffect } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import type { Cow, BreedingRecord } from '../../../lib/schemas'
import { Card } from '../../../components/Card'
import { getAllCows } from '../../cows/cowService'
import { getAllBreedingRecords, addBreedingRecord, deleteBreedingRecord } from '../breedingService'

export function BreedingList() {
  const farmId = '00000000-0000-0000-0000-000000000001'

  const [records, setRecords] = useState<BreedingRecord[]>([])
  const [cows, setCows] = useState<Cow[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)

  const [form, setForm] = useState({
    cowId: '',
    aiDate: new Date().toISOString().slice(0, 10),
    bullStraw: '',
    technician: '',
    cost: '',
    expectedCalvingDate: '',
    pregnancyCheckDate: '',
    pregnancyConfirmed: false,
    notes: ''
  })

  const loadData = async () => {
    try {
      setLoading(true)
      const [recordsData, cowsData] = await Promise.all([
        getAllBreedingRecords(farmId),
        getAllCows(farmId)
      ])
      setRecords(recordsData)
      setCows(cowsData)
    } catch (err) {
      console.error('Error loading breeding data:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!form.cowId || !form.aiDate || !form.bullStraw) return

    try {
      await addBreedingRecord({
        id: crypto.randomUUID(),
        farmId,
        cowId: form.cowId,
        aiDate: form.aiDate,
        bullStraw: form.bullStraw,
        technician: form.technician,
        cost: form.cost ? Number(form.cost) : undefined,
        expectedCalvingDate: form.expectedCalvingDate,
        pregnancyCheckDate: form.pregnancyCheckDate,
        pregnancyConfirmed: form.pregnancyConfirmed,
        notes: form.notes || undefined,
        createdAt: new Date()
      })

      setForm({
        cowId: '',
        aiDate: new Date().toISOString().slice(0, 10),
        bullStraw: '',
        technician: '',
        cost: '',
        expectedCalvingDate: '',
        pregnancyCheckDate: '',
        pregnancyConfirmed: false,
        notes: ''
      })
      setShowForm(false)
      loadData() // Refresh list
    } catch (err) {
      console.error('Error adding breeding record:', err)
      alert('Failed to save. Check console.')
    }
  }

  const handleDelete = async (id: string) => {
    if (window.confirm('Delete this breeding record?')) {
      try {
        await deleteBreedingRecord(id)
        loadData() // Refresh list
      } catch (err) {
        console.error('Error deleting:', err)
      }
    }
  }

  const cowName = (cowId: string) => {
    const cow = cows.find((c) => c.id === cowId)
    return cow?.name || cow?.tagId || 'Unknown'
  }

  if (loading) {
    return <div className="p-6 text-slate-500">Loading breeding records from Supabase...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-emerald-600 font-semibold">Reproduction</p>
          <h3 className="mt-1 text-3xl font-bold text-slate-900">Breeding records</h3>
        </div>
        <button
          type="button"
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-700"
        >
          <Plus size={16} /> {showForm ? 'Close' : 'Add record'}
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-5">
          <p className="text-sm text-slate-500">Records</p>
          <p className="mt-2 text-3xl font-bold">{records.length}</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-slate-500">Confirmed pregnant</p>
          <p className="mt-2 text-3xl font-bold text-emerald-700">
            {records.filter((r) => r.pregnancyConfirmed).length}
          </p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-slate-500">Awaiting check</p>
          <p className="mt-2 text-3xl font-bold text-amber-700">
            {records.filter((r) => !r.pregnancyConfirmed).length}
          </p>
        </Card>
      </div>

      {showForm && (
        <Card className="p-5">
          <h4 className="text-lg font-semibold text-slate-800 mb-4">Log breeding record</h4>
          <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
            <label className="text-sm text-slate-700">
              <span className="mb-1 block font-medium">Cow</span>
              <select
                value={form.cowId}
                onChange={(e) => setForm({ ...form, cowId: e.target.value })}
                className="w-full rounded-xl border border-slate-300 px-3 py-2"
                required
              >
                <option value="">Select a cow</option>
                {cows.map((cow) => (
                  <option key={cow.id} value={cow.id}>
                    {cow.name || cow.tagId}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm text-slate-700">
              <span className="mb-1 block font-medium">AI date</span>
              <input
                type="date"
                value={form.aiDate}
                onChange={(e) => setForm({ ...form, aiDate: e.target.value })}
                className="w-full rounded-xl border border-slate-300 px-3 py-2"
                required
              />
            </label>
            <label className="text-sm text-slate-700">
              <span className="mb-1 block font-medium">Bull straw</span>
              <input
                value={form.bullStraw}
                onChange={(e) => setForm({ ...form, bullStraw: e.target.value })}
                className="w-full rounded-xl border border-slate-300 px-3 py-2"
                required
              />
            </label>
            <label className="text-sm text-slate-700">
              <span className="mb-1 block font-medium">Technician</span>
              <input
                value={form.technician}
                onChange={(e) => setForm({ ...form, technician: e.target.value })}
                className="w-full rounded-xl border border-slate-300 px-3 py-2"
              />
            </label>
            <label className="text-sm text-slate-700">
              <span className="mb-1 block font-medium">Expected calving date</span>
              <input
                type="date"
                value={form.expectedCalvingDate}
                onChange={(e) => setForm({ ...form, expectedCalvingDate: e.target.value })}
                className="w-full rounded-xl border border-slate-300 px-3 py-2"
              />
            </label>
            <label className="text-sm text-slate-700">
              <span className="mb-1 block font-medium">Pregnancy check date</span>
              <input
                type="date"
                value={form.pregnancyCheckDate}
                onChange={(e) => setForm({ ...form, pregnancyCheckDate: e.target.value })}
                className="w-full rounded-xl border border-slate-300 px-3 py-2"
              />
            </label>
            <label className="text-sm text-slate-700">
              <span className="mb-1 block font-medium">Cost (optional)</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.cost}
                onChange={(e) => setForm({ ...form, cost: e.target.value })}
                className="w-full rounded-xl border border-slate-300 px-3 py-2"
              />
            </label>
            <label className="flex items-center gap-3 text-sm text-slate-700 mt-6">
              <input
                type="checkbox"
                checked={form.pregnancyConfirmed}
                onChange={(e) => setForm({ ...form, pregnancyConfirmed: e.target.checked })}
                className="h-4 w-4 rounded border-slate-300"
              />
              <span className="font-medium">Pregnancy confirmed</span>
            </label>
            <label className="text-sm text-slate-700 md:col-span-2">
              <span className="mb-1 block font-medium">Notes</span>
              <textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="min-h-[90px] w-full rounded-xl border border-slate-300 px-3 py-2"
              />
            </label>
            <div className="md:col-span-2 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-xl border border-slate-300 px-4 py-2 text-slate-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-xl bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-700"
              >
                Save record
              </button>
            </div>
          </form>
        </Card>
      )}

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-700">
              <tr>
                <th className="px-5 py-3 font-semibold">Cow</th>
                <th className="px-5 py-3 font-semibold">AI date</th>
                <th className="px-5 py-3 font-semibold">Bull straw</th>
                <th className="px-5 py-3 font-semibold">Technician</th>
                <th className="px-5 py-3 font-semibold">Expected calving</th>
                <th className="px-5 py-3 font-semibold">Confirmed</th>
                <th className="px-5 py-3 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              {records.length > 0 ? (
                records.map((record) => (
                  <tr key={record.id} className="border-t border-slate-200 hover:bg-slate-50">
                    <td className="px-5 py-3 font-medium text-slate-800">{cowName(record.cowId)}</td>
                    <td className="px-5 py-3">{record.aiDate}</td>
                    <td className="px-5 py-3">{record.bullStraw}</td>
                    <td className="px-5 py-3">{record.technician || '—'}</td>
                    <td className="px-5 py-3">{record.expectedCalvingDate || '—'}</td>
                    <td className="px-5 py-3">
                      <span
                        className={
                          record.pregnancyConfirmed
                            ? 'rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700'
                            : 'rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700'
                        }
                      >
                        {record.pregnancyConfirmed ? 'Yes' : 'Pending'}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <button
                        type="button"
                        onClick={() => handleDelete(record.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-5 py-6 text-center text-slate-500">
                    No breeding records yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}