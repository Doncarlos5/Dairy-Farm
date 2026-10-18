import { AlertTriangle } from 'lucide-react'
import type { Cow } from '../../../lib/schemas'

const statusColors: Record<Cow['status'], string> = {
  in_milk: 'bg-cyan-100 text-cyan-700',
  dry: 'bg-amber-100 text-amber-700',
  heifer: 'bg-violet-100 text-violet-700',
  calf: 'bg-pink-100 text-pink-700',
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
  // We will add the withdrawal badge back later when we migrate the Health page.
  const underWithdrawal = false

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Cow</p>
          <h3 className="mt-1 text-xl font-bold text-slate-800 truncate">
            {cow.name || 'Unnamed cow'}
          </h3>
          <p className="text-sm text-slate-500 mt-0.5">Tag {cow.tagId}</p>
        </div>
        <div className="flex flex-col items-end gap-2 shrink-0 min-w-[80px]">
          <span
            className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusColors[cow.status]}`}
          >
            {statusLabels[cow.status]}
          </span>
          {underWithdrawal && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
              <AlertTriangle size={12} /> Withdrawal
            </span>
          )}
        </div>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm text-slate-600">
        <div>
          <dt className="font-medium text-slate-500">Breed</dt>
          <dd>{cow.breed}</dd>
        </div>
        <div>
          <dt className="font-medium text-slate-500">Lactation</dt>
          <dd>{cow.lactationNumber}</dd>
        </div>
        <div>
          <dt className="font-medium text-slate-500">Pregnancy</dt>
          <dd className="capitalize">{cow.pregnancyStatus}</dd>
        </div>
        <div>
          <dt className="font-medium text-slate-500">Born</dt>
          <dd>{cow.birthDate || '—'}</dd>
        </div>
      </dl>
    </div>
  )
}