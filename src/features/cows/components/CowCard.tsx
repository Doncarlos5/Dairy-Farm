import type { Cow } from '../../../lib/schemas'

export function CowCard({ cow }: { cow: Cow }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Cow</p>
          <h3 className="mt-1 text-xl font-bold text-slate-800">{cow.name || 'Unnamed cow'}</h3>
        </div>
        <span className="rounded-full bg-sky-100 px-2.5 py-1 text-xs font-medium text-sky-700">
          {cow.status}
        </span>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm text-slate-600">
        <div>
          <dt className="font-medium text-slate-500">Tag ID</dt>
          <dd>{cow.tagId}</dd>
        </div>
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
          <dd>{cow.pregnancyStatus}</dd>
        </div>
      </dl>
    </div>
  )
}