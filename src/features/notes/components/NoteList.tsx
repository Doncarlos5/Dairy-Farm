import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Trash2, FileText, Droplets, Activity, HeartPulse, Coins, FileBarChart } from 'lucide-react'
import type { Cow, Note } from '../../../lib/schemas'
import { Card } from '../../../components/Card'
import { getAllCows } from '../../cows/cowService'
import { getAllNotes, addNote, deleteNote } from '../noteService'
import { useAuth } from '../../auth/AuthContext'

export function NoteList() {
  const { profile } = useAuth()
  const farmId = profile?.farmId || ''
  const isOwner = profile?.role === 'owner' || profile?.role === 'manager'

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
    if (!farmId) return
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
  }, [farmId])

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
    return <div className="p-8 text-slate-500">Loading notes from Supabase...</div>
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-orange-600 font-bold">Communication & Analytics</p>
          <h3 className="mt-1 text-3xl font-bold text-slate-900">Farm Hub</h3>
        </div>
        <button
          type="button"
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center gap-2 rounded-xl bg-orange-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-orange-700 transition-colors"
        >
          <Plus size={16} /> {showForm ? 'Close' : 'Add note'}
        </button>
      </div>

      {/* QUICK REPORTS SECTION */}
      <div>
        <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
          <FileBarChart size={16} /> Quick Reports & Analytics
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link to="/reports" className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 hover:border-blue-300 hover:shadow-md transition-all flex flex-col items-center text-center group">
            <div className="bg-blue-50 text-blue-600 p-3 rounded-full mb-3 group-hover:scale-110 transition-transform"><Droplets size={24} /></div>
            <span className="font-bold text-slate-800 text-sm">Milk Yield</span>
          </Link>
          
          <Link to="/reports" className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 hover:border-rose-300 hover:shadow-md transition-all flex flex-col items-center text-center group">
            <div className="bg-rose-50 text-rose-600 p-3 rounded-full mb-3 group-hover:scale-110 transition-transform"><HeartPulse size={24} /></div>
            <span className="font-bold text-slate-800 text-sm">Health & Vet</span>
          </Link>
          
          <Link to="/reports" className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 hover:border-violet-300 hover:shadow-md transition-all flex flex-col items-center text-center group">
            <div className="bg-violet-50 text-violet-600 p-3 rounded-full mb-3 group-hover:scale-110 transition-transform"><Activity size={24} /></div>
            <span className="font-bold text-slate-800 text-sm">Breeding</span>
          </Link>

          {isOwner && (
            <Link to="/reports" className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 hover:border-emerald-300 hover:shadow-md transition-all flex flex-col items-center text-center group">
              <div className="bg-emerald-50 text-emerald-600 p-3 rounded-full mb-3 group-hover:scale-110 transition-transform"><Coins size={24} /></div>
              <span className="font-bold text-slate-800 text-sm">Financials</span>
            </Link>
          )}
        </div>
      </div>

      <hr className="border-slate-200" />

      {/* NOTES SECTION */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
            <FileText size={16} /> Farm Notes & Updates
          </h4>
        </div>

        <div className="grid gap-4 md:grid-cols-3 mb-6">
          <Card className="p-4 bg-slate-50 border-slate-100">
            <p className="text-xs text-slate-500 font-medium">Total Notes</p>
            <p className="mt-1 text-2xl font-bold">{notes.length}</p>
          </Card>
          <Card className="p-4 bg-slate-50 border-slate-100">
            <p className="text-xs text-slate-500 font-medium">Cow-Specific</p>
            <p className="mt-1 text-2xl font-bold text-sky-700">{cowNotes.length}</p>
          </Card>
          <Card className="p-4 bg-slate-50 border-slate-100">
            <p className="text-xs text-slate-500 font-medium">General Farm</p>
            <p className="mt-1 text-2xl font-bold text-emerald-700">{generalNotes.length}</p>
          </Card>
        </div>

        {showForm && (
          <Card className="p-5 mb-6">
            <h4 className="text-lg font-semibold mb-4">New note</h4>
            <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
              <label className="text-sm text-slate-700">
                <span className="mb-1 block font-medium">Date</span>
                <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="w-full rounded-xl border border-slate-300 px-3 py-2" required />
              </label>
              <label className="text-sm text-slate-700">
                <span className="mb-1 block font-medium">Created by</span>
                <input value={form.createdBy} onChange={(e) => setForm({ ...form, createdBy: e.target.value })} placeholder="e.g. M. James" className="w-full rounded-xl border border-slate-300 px-3 py-2" required />
              </label>
              <label className="text-sm text-slate-700 md:col-span-2">
                <span className="mb-1 block font-medium">
                  Related cow <span className="font-normal text-slate-500">(optional — leave blank for general farm note)</span>
                </span>
                <select value={form.cowId} onChange={(e) => setForm({ ...form, cowId: e.target.value })} className="w-full rounded-xl border border-slate-300 px-3 py-2">
                  <option value="">General farm note</option>
                  {cows.map((cow) => (
                    <option key={cow.id} value={cow.id}>{cow.name || cow.tagId}</option>
                  ))}
                </select>
              </label>
              <label className="text-sm text-slate-700 md:col-span-2">
                <span className="mb-1 block font-medium">Note</span>
                <textarea value={form.text} onChange={(e) => setForm({ ...form, text: e.target.value })} placeholder="What happened? What should be remembered?" className="min-h-[120px] w-full rounded-xl border border-slate-300 px-3 py-2" required />
              </label>
              <div className="md:col-span-2 flex justify-end gap-3">
                <button type="button" onClick={() => setShowForm(false)} className="rounded-xl border border-slate-300 px-4 py-2 text-slate-700 hover:bg-slate-50">Cancel</button>
                <button type="submit" className="rounded-xl bg-orange-600 px-4 py-2 text-white hover:bg-orange-700">Save note</button>
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
                    className="absolute right-4 top-4 text-red-400 hover:text-red-600 transition-colors"
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
            <Card className="p-6 text-slate-500 md:col-span-2 xl:col-span-3 text-center">
              No notes yet. Add one to begin.
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}