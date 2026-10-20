import { AlertTriangle } from 'lucide-react'
import type { Cow } from '../../../lib/schemas'

const statusColors: Record<Cow['status'], string> = {
  in_milk: 'bg-emerald-100 text-emerald-700',
  dry: 'bg-amber-100 text-amber-700',
  heifer: 'bg-teal-100 text-teal-700',
  calf: 'bg-blue-100 text-blue-700',
  culled: 'bg-slate-200 text-slate-600'
}

const statusLabels: Record<Cow['status'], string> = {
  in_milk: 'In milk',
  dry: 'Dry',
  heifer: 'Heifer',
  calf: 'Calf',
  culled: 'Culled'
}

export function CowCard({ cow }: { cow: Cow }) {
  const underWithdrawal = false // Will be dynamic later

  return (
    <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm shadow-slate-200/50 transition-all hover:shadow-md hover:border-emerald-200">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-widest text-slate-400 font-bold">Cow</p>
          <h3 className="mt-1 text-xl font-bold text-slate-800 truncate">
            {cow.name || 'Unnamed cow'}
          </h3>
          <p className="text-sm font-medium text-emerald-600 mt-0.5">Tag {cow.tagId}</p>
        </div>
        <div className="flex flex-col items-end gap-2 shrink-0 min-w-[80px]">
          <span className={`rounded-full px-3 py-1 text-xs font-bold ${statusColors[cow.status]}`}>
            {statusLabels[cow.status]}
          </span>
        </div>
      </div>

      <dl className="mt-6 grid grid-cols-2 gap-y-4 gap-x-2 text-sm text-slate-600">
        <div>
          <dt className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Breed</dt>
          <dd className="font-semibold text-slate-700">{cow.breed}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Lactation</dt>
          <dd className="font-semibold text-slate-700">{cow.lactationNumber}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Pregnancy</dt>
          <dd className="font-semibold text-slate-700 capitalize">{cow.pregnancyStatus}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Born</dt>
          <dd className="font-semibold text-slate-700">{cow.birthDate || '—'}</dd>
        </div>
      </dl>
    </div>
  )
}