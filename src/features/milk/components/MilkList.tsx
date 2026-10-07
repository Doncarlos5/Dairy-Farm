import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Plus, Trash2 } from 'lucide-react'
import { db } from '../../../lib/db'
import { Card } from '../../../components/Card'

export function MilkList() {
  const farmId = 'farm-1'
  const records = useLiveQuery(() => db.milkRecords.where('farmId').equals(farmId).toArray(), [farmId]) ?? []
  const cows = useLiveQuery(() => db.cows.where('farmId').equals(farmId).toArray(), [farmId]) ?? []
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    cowId: '',
    date: new Date().toISOString().slice(0, 10),
    session: 'am' as 'am' | 'midday' | 'pm',
    litres: '0',
    recordedBy: ''
  })

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!form.cowId || !form.recordedBy) return

    await db.milkRecords.add({
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
  }

  const total = records.reduce((sum, item) => sum + item.litres, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-sky-600 font-semibold">Production</p>
          <h3 className="mt-1 text-3xl font-bold text-slate-900">Milk records</h3>
        </div>
        <button
          type="button"
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-sky-700"
        >
          <Plus size={16} /> {showForm ? 'Close' : 'Add record'}
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-5"><p className="text-sm text-slate-500">Records</p><p className="mt-2 text-3xl font-bold">{records.length}</p></Card>
        <Card className="p-5"><p className="text-sm text-slate-500">Total litres</p><p className="mt-2 text-3xl font-bold text-sky-700">{total.toFixed(1)}</p></Card>
        <Card className="p-5"><p className="text-sm text-slate-500">Average</p><p className="mt-2 text-3xl font-bold text-emerald-700">{records.length ? (total / records.length).toFixed(1) : '0.0'}</p></Card>
      </div>

      {showForm && (
        <Card className="p-5">
          <h4 className="text-lg font-semibold mb-4">Log milk production</h4>
          <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
            <label className="text-sm text-slate-700">
              <span className="mb-1 block font-medium">Cow</span>
              <select value={form.cowId} onChange={(e) => setForm({ ...form, cowId: e.target.value })} className="w-full rounded-xl border border-slate-300 px-3 py-2" required>
                <option value="">Select a cow</option>
                {cows.map((cow) => (
                  <option key={cow.id} value={cow.id}>{cow.name || cow.tagId}</option>
                ))}
              </select>
            </label>
            <label className="text-sm text-slate-700">
              <span className="mb-1 block font-medium">Date</span>
              <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="w-full rounded-xl border border-slate-300 px-3 py-2" required />
            </label>
            <label className="text-sm text-slate-700">
              <span className="mb-1 block font-medium">Session</span>
              <select value={form.session} onChange={(e) => setForm({ ...form, session: e.target.value as 'am' | 'midday' | 'pm' })} className="w-full rounded-xl border border-slate-300 px-3 py-2">
                <option value="am">AM</option>
                <option value="midday">Midday</option>
                <option value="pm">PM</option>
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
              <button type="submit" className="rounded-xl bg-sky-600 px-4 py-2 text-white hover:bg-sky-700">Save record</button>
            </div>
          </form>
        </Card>
      )}

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-700">
              <tr>
                <th className="px-5 py-3 font-semibold">Date</th>
                <th className="px-5 py-3 font-semibold">Cow</th>
                <th className="px-5 py-3 font-semibold">Session</th>
                <th className="px-5 py-3 font-semibold">Litres</th>
                <th className="px-5 py-3 font-semibold">Recorded by</th>
                <th className="px-5 py-3 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              {records.length > 0 ? (
                [...records].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((record) => (
                  <tr key={record.id} className="border-t border-slate-200 hover:bg-slate-50">
                    <td className="px-5 py-3">{record.date}</td>
                    <td className="px-5 py-3">{cows.find((cow) => cow.id === record.cowId)?.name || cows.find((cow) => cow.id === record.cowId)?.tagId || 'Unknown'}</td>
                    <td className="px-5 py-3 uppercase">{record.session}</td>
                    <td className="px-5 py-3 font-semibold text-sky-700">{record.litres}L</td>
                    <td className="px-5 py-3">{record.recordedBy}</td>
                    <td className="px-5 py-3">
                      <button type="button" onClick={async () => { await db.milkRecords.delete(record.id) }} className="text-red-600 hover:text-red-800"><Trash2 size={16} /></button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-5 py-6 text-center text-slate-500">No milk records yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}