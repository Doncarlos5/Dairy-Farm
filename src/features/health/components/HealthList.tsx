import { useState, useEffect } from 'react'
import { Plus, Trash2, AlertTriangle } from 'lucide-react'
import type { Cow, HealthRecord } from '../../../lib/schemas'
import { Card } from '../../../components/Card'
import { getAllCows } from '../../cows/cowService'
import { getAllHealthRecords, addHealthRecord, deleteHealthRecord, isUnderWithdrawal } from '../healthService'

export function HealthList() {
  const farmId = '00000000-0000-0000-0000-000000000001'

  const [records, setRecords] = useState<HealthRecord[]>([])
  const [cows, setCows] = useState<Cow[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)

  const [form, setForm] = useState({
    cowId: '',
    date: new Date().toISOString().slice(0, 10),
    condition: '',
    drug: '',
    dose: '',
    route: 'injection' as HealthRecord['route'],
    withdrawalDays: '0',
    vetName: '',
    cost: '',
    notes: ''
  })

  const loadData = async () => {
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
  }, [])

  // Auto-calculate withdrawal end date
  const withdrawalEndDate = (() => {
    const days = Number(form.withdrawalDays) || 0
    if (days <= 0 || !form.date) return ''
    const d = new Date(form.date)
    d.setDate(d.getDate() + days)
    return d.toISOString().slice(0, 10)
  })()

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!form.cowId || !form.condition || !form.drug) return

    try {
      await addHealthRecord({
        id: crypto.randomUUID(),
        farmId,
        cowId: form.cowId,
        date: form.date,
        condition: form.condition,
        drug: form.drug,
        dose: form.dose,
        route: form.route,
        withdrawalDays: Number(form.withdrawalDays) || 0,
        withdrawalEndDate,
        vetName: form.vetName || undefined,
        cost: form.cost ? Number(form.cost) : undefined,
        notes: form.notes || undefined,
        createdAt: new Date()
      })

      setForm({
        cowId: '',
        date: new Date().toISOString().slice(0, 10),
        condition: '',
        drug: '',
        dose: '',
        route: 'injection',
        withdrawalDays: '0',
        vetName: '',
        cost: '',
        notes: ''
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

  if (loading) {
    return <div className="p-6 text-slate-500">Loading health records from Supabase...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-emerald-600 font-semibold">Animal care</p>
          <h3 className="mt-1 text-3xl font-bold text-slate-900">Health records</h3>
        </div>
        <button
          type="button"
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-700"
        >
          <Plus size={16} /> {showForm ? 'Close' : 'Add record'}
        </button>
      </div>

      {underWithdrawal.length > 0 && (
        <Card className="border-amber-300 bg-amber-50 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="text-amber-600 shrink-0" size={20} />
            <div>
              <p className="font-semibold text-amber-900">
                {underWithdrawal.length} cow{underWithdrawal.length > 1 ? 's' : ''} under withdrawal
              </p>
              <p className="mt-1 text-sm text-amber-800">
                Milk from{' '}
                {underWithdrawal.map((r) => cowName(r.cowId)).join(', ')}{' '}
                cannot be sold until the withdrawal period ends.
              </p>
            </div>
          </div>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-5">
          <p className="text-sm text-slate-500">Total records</p>
          <p className="mt-2 text-3xl font-bold">{records.length}</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-slate-500">Under withdrawal</p>
          <p className="mt-2 text-3xl font-bold text-amber-700">{underWithdrawal.length}</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-slate-500">Vets involved</p>
          <p className="mt-2 text-3xl font-bold text-emerald-700">
            {new Set(records.map((r) => r.vetName).filter(Boolean)).size}
          </p>
        </Card>
      </div>

      {showForm && (
        <Card className="p-5">
          <h4 className="text-lg font-semibold text-slate-800 mb-4">Log health record</h4>
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
              <span className="mb-1 block font-medium">Date</span>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="w-full rounded-xl border border-slate-300 px-3 py-2"
                required
              />
            </label>
            <label className="text-sm text-slate-700">
              <span className="mb-1 block font-medium">Condition</span>
              <input
                value={form.condition}
                onChange={(e) => setForm({ ...form, condition: e.target.value })}
                placeholder="e.g. Mastitis"
                className="w-full rounded-xl border border-slate-300 px-3 py-2"
                required
              />
            </label>
            <label className="text-sm text-slate-700">
              <span className="mb-1 block font-medium">Drug</span>
              <input
                value={form.drug}
                onChange={(e) => setForm({ ...form, drug: e.target.value })}
                placeholder="e.g. Ceftiofur"
                className="w-full rounded-xl border border-slate-300 px-3 py-2"
                required
              />
            </label>
            <label className="text-sm text-slate-700">
              <span className="mb-1 block font-medium">Dose</span>
              <input
                value={form.dose}
                onChange={(e) => setForm({ ...form, dose: e.target.value })}
                placeholder="e.g. 4ml"
                className="w-full rounded-xl border border-slate-300 px-3 py-2"
              />
            </label>
            <label className="text-sm text-slate-700">
              <span className="mb-1 block font-medium">Route</span>
              <select
                value={form.route}
                onChange={(e) =>
                  setForm({ ...form, route: e.target.value as HealthRecord['route'] })
                }
                className="w-full rounded-xl border border-slate-300 px-3 py-2"
              >
                <option value="injection">Injection</option>
                <option value="oral">Oral</option>
                <option value="topical">Topical</option>
              </select>
            </label>
            <label className="text-sm text-slate-700">
              <span className="mb-1 block font-medium">Withdrawal days</span>
              <input
                type="number"
                min="0"
                value={form.withdrawalDays}
                onChange={(e) => setForm({ ...form, withdrawalDays: e.target.value })}
                className="w-full rounded-xl border border-slate-300 px-3 py-2"
              />
            </label>
            <label className="text-sm text-slate-700">
              <span className="mb-1 block font-medium">Withdrawal ends</span>
              <input
                type="date"
                value={withdrawalEndDate}
                readOnly
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-600"
              />
            </label>
            <label className="text-sm text-slate-700">
              <span className="mb-1 block font-medium">Vet name (optional)</span>
              <input
                value={form.vetName}
                onChange={(e) => setForm({ ...form, vetName: e.target.value })}
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
                <th className="px-5 py-3 font-semibold">Date</th>
                <th className="px-5 py-3 font-semibold">Condition</th>
                <th className="px-5 py-3 font-semibold">Drug</th>
                <th className="px-5 py-3 font-semibold">Dose</th>
                <th className="px-5 py-3 font-semibold">Withdrawal ends</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              {records.length > 0 ? (
                records.map((record) => {
                  const active = isUnderWithdrawal(record)
                  return (
                    <tr key={record.id} className="border-t border-slate-200 hover:bg-slate-50">
                      <td className="px-5 py-3 font-medium text-slate-800">
                        {cowName(record.cowId)}
                      </td>
                      <td className="px-5 py-3">{record.date}</td>
                      <td className="px-5 py-3">{record.condition}</td>
                      <td className="px-5 py-3">{record.drug}</td>
                      <td className="px-5 py-3">{record.dose || '—'}</td>
                      <td className="px-5 py-3">{record.withdrawalEndDate || '—'}</td>
                      <td className="px-5 py-3">
                        {active ? (
                          <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700">
                            Withdrawal active
                          </span>
                        ) : (
                          <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700">
                            Clear
                          </span>
                        )}
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
                  )
                })
              ) : (
                <tr>
                  <td colSpan={8} className="px-5 py-6 text-center text-slate-500">
                    No health records yet.
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