import { Link } from 'react-router-dom'
import { Users, Droplets, Activity, HeartPulse, ArrowRight } from 'lucide-react'
import { useCows } from '../cows/hooks/useCows'
import { Card } from '../../components/Card'

export function Dashboard() {
  const farmId = 'farm-1'
  const { cows } = useCows(farmId)

  const stats = [
    { label: 'Total cows', value: cows.length, icon: Users, tone: 'bg-sky-100 text-sky-700' },
    { label: 'In milk', value: cows.filter((cow) => cow.status === 'in_milk').length, icon: Droplets, tone: 'bg-cyan-100 text-cyan-700' },
    { label: 'Pregnant', value: cows.filter((cow) => ['bred', 'confirmed'].includes(cow.pregnancyStatus)).length, icon: Activity, tone: 'bg-violet-100 text-violet-700' },
    { label: 'Health items', value: 0, icon: HeartPulse, tone: 'bg-rose-100 text-rose-700' }
  ]

  return (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map(({ label, value, icon: Icon, tone }) => (
          <Card key={label} className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">{label}</p>
                <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
              </div>
              <div className={`rounded-xl p-3 ${tone}`}>
                <Icon size={24} />
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-800">Quick actions</h3>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <Link to="/cows" className="rounded-xl border border-slate-200 bg-slate-50 p-4 hover:border-sky-300 hover:bg-sky-50 transition-all">
            <p className="font-semibold text-slate-800">Register cow</p>
            <p className="mt-1 text-sm text-slate-600">Add new animals to the herd.</p>
            <div className="mt-3 inline-flex items-center gap-2 text-sm text-sky-700">
              Open cows <ArrowRight size={16} />
            </div>
          </Link>
          <Link to="/milk" className="rounded-xl border border-slate-200 bg-slate-50 p-4 hover:border-sky-300 hover:bg-sky-50 transition-all">
            <p className="font-semibold text-slate-800">Log milk</p>
            <p className="mt-1 text-sm text-slate-600">Track daily production by session.</p>
            <div className="mt-3 inline-flex items-center gap-2 text-sm text-sky-700">
              Go to milk <ArrowRight size={16} />
            </div>
          </Link>
          <Link to="/breeding" className="rounded-xl border border-slate-200 bg-slate-50 p-4 hover:border-sky-300 hover:bg-sky-50 transition-all">
            <p className="font-semibold text-slate-800">Breeding plan</p>
            <p className="mt-1 text-sm text-slate-600">Monitor pregnancy and calving dates.</p>
            <div className="mt-3 inline-flex items-center gap-2 text-sm text-sky-700">
              Review breeding <ArrowRight size={16} />
            </div>
          </Link>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="border-b border-slate-200 px-5 py-4">
          <h3 className="text-lg font-semibold text-slate-800">Herd overview</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-700">
              <tr>
                <th className="px-5 py-3 font-semibold">Tag ID</th>
                <th className="px-5 py-3 font-semibold">Name</th>
                <th className="px-5 py-3 font-semibold">Breed</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 font-semibold">Pregnancy</th>
              </tr>
            </thead>
            <tbody>
              {cows.slice(0, 5).map((cow) => (
                <tr key={cow.id} className="border-t border-slate-200 hover:bg-slate-50">
                  <td className="px-5 py-3">{cow.tagId}</td>
                  <td className="px-5 py-3">{cow.name || 'Unnamed'}</td>
                  <td className="px-5 py-3">{cow.breed}</td>
                  <td className="px-5 py-3">
                    <span className="rounded-full bg-sky-100 px-2 py-1 text-xs font-medium text-sky-700">
                      {cow.status}
                    </span>
                  </td>
                  <td className="px-5 py-3">{cow.pregnancyStatus}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}