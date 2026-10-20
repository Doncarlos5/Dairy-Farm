import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Edit, Activity, Droplets, HeartPulse } from 'lucide-react'
import type { Cow, MilkRecord, BreedingRecord, HealthRecord } from '../../../lib/schemas'
import { Card } from '../../../components/Card'
import { getCow } from '../cowService'
import { getMilkForCow } from '../../milk/milkService'
import { getBreedingForCow } from '../../breeding/breedingService'
import { getHealthForCow } from '../../health/healthService'
import { isUnderWithdrawal } from '../../health/healthService'

export function CowProfile() {
  const { id } = useParams<{ id: string }>()
  
  const [cow, setCow] = useState<Cow | null>(null)
  const [milk, setMilk] = useState<MilkRecord[]>([])
  const [breeding, setBreeding] = useState<BreedingRecord[]>([])
  const [health, setHealth] = useState<HealthRecord[]>([])
  
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'milk' | 'breeding' | 'health'>('overview')

  useEffect(() => {
    async function loadData() {
      if (!id) return
      try {
        setLoading(true)
        const [cowData, milkData, breedingData, healthData] = await Promise.all([
          getCow(id),
          getMilkForCow(id),
          getBreedingForCow(id),
          getHealthForCow(id)
        ])
        setCow(cowData)
        setMilk(milkData)
        setBreeding(breedingData)
        setHealth(healthData)
      } catch (err) {
        console.error('Error loading cow profile:', err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [id])

  if (loading) return <div className="p-8 text-slate-500">Loading profile...</div>
  if (!cow) return <div className="p-8 text-slate-500">Cow not found.</div>

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <Link to="/cows" className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-800">
        <ArrowLeft size={16} /> Back to herd
      </Link>

      {/* Hero Section */}
      <div className="overflow-hidden rounded-3xl bg-white shadow-sm border border-slate-200">
        <div className="h-48 md:h-64 bg-slate-200 relative">
          {/* Placeholder for cow photo */}
          <div className="absolute inset-0 flex items-center justify-center text-slate-400">
            Photo coming soon
          </div>
        </div>
        <div className="p-6 md:p-8 relative">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">{cow.name || 'Unnamed cow'}</h1>
              <p className="text-lg font-medium text-orange-600 mt-1">#{cow.tagId}</p>
            </div>
            <div className="flex items-center gap-3">
               <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-bold text-emerald-700 capitalize">
                 {cow.status.replace('_', ' ')}
               </span>
               <button className="flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200">
                 <Edit size={16} /> Edit
               </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto border-b border-slate-200">
        {['overview', 'milk', 'breeding', 'health'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`px-6 py-3 text-sm font-medium border-b-2 capitalize transition-colors ${
              activeTab === tab 
                ? 'border-orange-600 text-orange-600' 
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="pt-2">
        
        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">Basic Info</h3>
              <dl className="grid grid-cols-2 gap-4 text-sm">
                <div><dt className="text-slate-500">Breed</dt><dd className="font-medium text-slate-900">{cow.breed}</dd></div>
                <div><dt className="text-slate-500">Birth Date</dt><dd className="font-medium text-slate-900">{cow.birthDate || '—'}</dd></div>
                <div><dt className="text-slate-500">Lactation</dt><dd className="font-medium text-slate-900">{cow.lactationNumber}</dd></div>
                <div><dt className="text-slate-500">Pregnancy</dt><dd className="font-medium text-slate-900 capitalize">{cow.pregnancyStatus}</dd></div>
              </dl>
            </Card>
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">Notes</h3>
              <p className="text-sm text-slate-600">{cow.notes || 'No notes recorded for this cow.'}</p>
            </Card>
          </div>
        )}

        {/* MILK TAB */}
        {activeTab === 'milk' && (
          <Card className="overflow-hidden">
             <table className="min-w-full text-left text-sm">
               <thead className="bg-slate-50 text-slate-700">
                 <tr>
                   <th className="px-6 py-3 font-semibold">Date</th>
                   <th className="px-6 py-3 font-semibold">Session</th>
                   <th className="px-6 py-3 font-semibold">Litres</th>
                 </tr>
               </thead>
               <tbody>
                 {milk.length > 0 ? milk.map(m => (
                   <tr key={m.id} className="border-t border-slate-100">
                     <td className="px-6 py-3">{m.date}</td>
                     <td className="px-6 py-3 uppercase">{m.session}</td>
                     <td className="px-6 py-3 font-bold text-orange-600">{m.litres} L</td>
                   </tr>
                 )) : <tr><td colSpan={3} className="px-6 py-6 text-center text-slate-500">No milk records.</td></tr>}
               </tbody>
             </table>
          </Card>
        )}

        {/* BREEDING TAB */}
        {activeTab === 'breeding' && (
          <Card className="overflow-hidden">
             <table className="min-w-full text-left text-sm">
               <thead className="bg-slate-50 text-slate-700">
                 <tr>
                   <th className="px-6 py-3 font-semibold">AI Date</th>
                   <th className="px-6 py-3 font-semibold">Bull Straw</th>
                   <th className="px-6 py-3 font-semibold">Confirmed</th>
                 </tr>
               </thead>
               <tbody>
                 {breeding.length > 0 ? breeding.map(b => (
                   <tr key={b.id} className="border-t border-slate-100">
                     <td className="px-6 py-3">{b.aiDate}</td>
                     <td className="px-6 py-3">{b.bullStraw}</td>
                     <td className="px-6 py-3">{b.pregnancyConfirmed ? 'Yes' : 'Pending'}</td>
                   </tr>
                 )) : <tr><td colSpan={3} className="px-6 py-6 text-center text-slate-500">No breeding records.</td></tr>}
               </tbody>
             </table>
          </Card>
        )}

        {/* HEALTH TAB */}
        {activeTab === 'health' && (
          <Card className="overflow-hidden">
             <table className="min-w-full text-left text-sm">
               <thead className="bg-slate-50 text-slate-700">
                 <tr>
                   <th className="px-6 py-3 font-semibold">Date</th>
                   <th className="px-6 py-3 font-semibold">Condition</th>
                   <th className="px-6 py-3 font-semibold">Drug</th>
                   <th className="px-6 py-3 font-semibold">Status</th>
                 </tr>
               </thead>
               <tbody>
                 {health.length > 0 ? health.map(h => (
                   <tr key={h.id} className="border-t border-slate-100">
                     <td className="px-6 py-3">{h.date}</td>
                     <td className="px-6 py-3">{h.condition}</td>
                     <td className="px-6 py-3">{h.drug}</td>
                     <td className="px-6 py-3">
                        {isUnderWithdrawal(h) ? (
                          <span className="text-amber-600 font-medium text-xs bg-amber-50 px-2 py-1 rounded">Withdrawal</span>
                        ) : (
                          <span className="text-emerald-600 font-medium text-xs bg-emerald-50 px-2 py-1 rounded">Clear</span>
                        )}
                     </td>
                   </tr>
                 )) : <tr><td colSpan={4} className="px-6 py-6 text-center text-slate-500">No health records.</td></tr>}
               </tbody>
             </table>
          </Card>
        )}
      </div>
    </div>
  )
}