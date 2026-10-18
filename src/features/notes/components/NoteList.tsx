import { useState, useEffect } from 'react'
import { Plus, Trash2, FileText } from 'lucide-react'
import type { Cow, Note } from '../../../lib/schemas'
import { Card } from '../../../components/Card'
import { getAllCows } from '../../cows/cowService'
import { getAllNotes, addNote, deleteNote } from '../noteService'

export function NoteList() {
  const farmId = '00000000-0000-0000-0000-000000000001'

  const [notes, setNotes] = useState<Note[]>([])
  const [cows, setCows] = useState<Cow[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)

  const [form, setForm] = useState({
    cowId: '',
    date: new Date().toISOString().slice(0, 10),
    text: '',
    createdBy: ''
  })

  const loadData = async () => {
    try {
      setLoading(true)
      const [notesData, cowsData] = await Promise.all([
        getAllNotes(farmId),
        getAllCows(farmId)
      ])
      setNotes(notesData)
      setCows(cowsData)
    } catch (err) {
      console.error('Error loading notes:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!form.text.trim() || !form.createdBy.trim()) return

    try {
      await addNote({
        id: crypto.randomUUID(),
        farmId,
        cowId: form.cowId || undefined,
        date: form.date,
        text: form.text.trim(),
        createdBy: form.createdBy.trim(),
        createdAt: new Date()
      })

      setForm({
        cowId: '',
        date: new Date().toISOString().slice(0, 10),
        text: '',
        createdBy: ''
      })
      setShowForm(false)
      loadData()
    } catch (err) {
      console.error('Error adding note:', err)
      alert('Failed to save. Check console.')
    }
  }

  const handleDelete = async (id: string) => {
    if (window.confirm('Delete this note?')) {
      try {
        await deleteNote(id)
        loadData()
      } catch (err) {
        console.error('Error deleting note:', err)
      }
    }
  }

  const cowName = (cowId?: string) => {
    if (!cowId) return null
    const cow = cows.find((c) => c.id === cowId)
    return cow?.name || cow?.tagId || 'Unknown'
  }

  const generalNotes = notes.filter((n) => !n.cowId)
  const cowNotes = notes.filter((n) => n.cowId)

  if (loading) {
    return <div className="p-6 text-slate-500">Loading notes from Supabase...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-sky-600 font-semibold">Communication</p>
          <h3 className="mt-1 text-3xl font-bold text-slate-900">Notes</h3>
        </div>
        <button
          type="button"
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-sky-700"
        >
          <Plus size={16} /> {showForm ? 'Close' : 'Add note'}
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-5">
          <p className="text-sm text-slate-500">Total notes</p>
          <p className="mt-2 text-3xl font-bold">{notes.length}</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-slate-500">Cow-specific</p>
          <p className="mt-2 text-3xl font-bold text-sky-700">{cowNotes.length}</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-slate-500">General farm</p>
          <p className="mt-2 text-3xl font-bold text-emerald-700">{generalNotes.length}</p>
        </Card>
      </div>

      {showForm && (
        <Card className="p-5">
          <h4 className="text-lg font-semibold text-slate-800 mb-4">New note</h4>
          <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
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
              <span className="mb-1 block font-medium">Created by</span>
              <input
                value={form.createdBy}
                onChange={(e) => setForm({ ...form, createdBy: e.target.value })}
                placeholder="e.g. M. James"
                className="w-full rounded-xl border border-slate-300 px-3 py-2"
                required
              />
            </label>
            <label className="text-sm text-slate-700 md:col-span-2">
              <span className="mb-1 block font-medium">
                Related cow <span className="font-normal text-slate-500">(optional — leave blank for general farm note)</span>
              </span>
              <select
                value={form.cowId}
                onChange={(e) => setForm({ ...form, cowId: e.target.value })}
                className="w-full rounded-xl border border-slate-300 px-3 py-2"
              >
                <option value="">General farm note</option>
                {cows.map((cow) => (
                  <option key={cow.id} value={cow.id}>
                    {cow.name || cow.tagId}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm text-slate-700 md:col-span-2">
              <span className="mb-1 block font-medium">Note</span>
              <textarea
                value={form.text}
                onChange={(e) => setForm({ ...form, text: e.target.value })}
                placeholder="What happened? What should be remembered?"
                className="min-h-[120px] w-full rounded-xl border border-slate-300 px-3 py-2"
                required
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
                className="rounded-xl bg-sky-600 px-4 py-2 text-white hover:bg-sky-700"
              >
                Save note
              </button>
            </div>
          </form>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {notes.length > 0 ? (
          notes.map((note) => {
            const linkedCow = cowName(note.cowId)
            return (
              <Card key={note.id} className="relative p-5">
                <button
                  type="button"
                  onClick={() => handleDelete(note.id)}
                  className="absolute right-4 top-4 text-red-500 hover:text-red-700"
                  aria-label="Delete note"
                >
                  <Trash2 size={16} />
                </button>

                <div className="flex items-start gap-3 pr-8">
                  <div className="rounded-lg bg-sky-100 p-2 text-sky-700">
                    <FileText size={18} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-700">{note.date}</p>
                    <p className="text-xs text-slate-500">by {note.createdBy}</p>
                  </div>
                </div>

                {linkedCow && (
                  <div className="mt-4">
                    <span className="rounded-full bg-violet-100 px-2.5 py-1 text-xs font-medium text-violet-700">
                      🐄 {linkedCow}
                    </span>
                  </div>
                )}

                <p className="mt-4 text-sm text-slate-600 whitespace-pre-wrap">{note.text}</p>
              </Card>
            )
          })
        ) : (
          <Card className="p-6 text-slate-500 md:col-span-2 xl:col-span-3">
            No notes yet. Add one to begin.
          </Card>
        )}
      </div>
    </div>
  )
}