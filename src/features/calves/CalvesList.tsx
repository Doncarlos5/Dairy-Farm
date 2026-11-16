import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Baby, ArrowLeft, Calendar, HeartPulse } from 'lucide-react'
import type { Cow } from '../../lib/schemas'
import { Card } from '../../components/Card'
import { getAllCows } from '../cows/cowService'
import { useAuth } from '../auth/AuthContext'

export function CalvesList() {
  const { profile } = useAuth()
  const farmId = profile?.farmId || ''
  const [searchParams] = useSearchParams()
  const motherId = searchParams.get('mother')

  const [cows, setCows] = useState<Cow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchCows() {
      if (!farmId) return
      try {
        setLoading(true)
        const data = await getAllCows(farmId)
        setCows(data)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchCows()
  }, [farmId])

  // 1. Filter for calves only
  let calves = cows.filter(c => c.status === 'calf')
  
  // 2. If a motherId is provided in the URL, filter by that mother
  let motherName = ''
  if (motherId) {
    calves = calves.filter(c => c.motherId === motherId)
    motherName = cows.find(c => c.id === motherId)?.name || 'Unknown Mother'
  }

  // 3. Calculate Age for display
  const calculateAge = (birthDate?: string) => {
    if (!birthDate) return 'Unknown'
    const birth = new Date(birthDate)
    const now = new Date()
    const months = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth())
    if (months < 1) {
      const days = Math.floor((now.getTime() - birth.getTime()) / (1000 * 60 * 60 * 24))
      return `${days} days`
    }
    return `${months} months`
  }

  if (loading) return <div className="p-8 text-slate-500">Loading calves...</div>

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-orange-600 font-bold">Young Stock</p>
          <h3 className="mt-1 text-3xl font-bold text-slate-900 flex items-center gap-2">
            <Baby className="text-orange-500" /> 
            {motherId ? `Calves of ${motherName}` : 'All Calves'}
          </h3>
          <p className="text-sm text-slate-500 mt-1">
            {motherId ? 'Showing only calves linked to this mother.' : 'Showing all calves on the farm.'}
          </p>
        </div>
        {motherId && (
          <Link to="/cows" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-800 bg-white px-4 py-2 rounded-xl border border-slate-200">
            <ArrowLeft size={16} /> Back to Herd
          </Link>
        )}
      </div>

      {calves.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {calves.map(calf => (
             <Link key={calf.id} to={`/cows/${calf.id}`}>
               <Card className="p-5 hover:border-orange-300 hover:shadow-md transition-all flex flex-col h-full">
                 <div className="flex justify-between items-start mb-4">
                   <div>
                     <h4 className="text-xl font-bold text-slate-800">{calf.name || 'Unnamed Calf'}</h4>
                     <p className="text-sm font-bold text-orange-600">#{calf.tagId}</p>
                   </div>
                   <span className="bg-teal-100 text-teal-700 text-xs font-bold px-2 py-1 rounded-full uppercase">Calf</span>
                 </div>
                 
                 <div className="grid grid-cols-2 gap-3 text-sm bg-slate-50 p-3 rounded-xl mt-auto">
                   <div>
                     <p className="text-xs text-slate-500 font-medium flex items-center gap-1"><Calendar size={12}/> Age</p>
                     <p className="font-bold text-slate-800">{calculateAge(calf.birthDate)}</p>
                   </div>
                   <div>
                     <p className="text-xs text-slate-500 font-medium flex items-center gap-1"><HeartPulse size={12}/> Breed</p>
                     <p className="font-bold text-slate-800">{calf.breed}</p>
                   </div>
                 </div>
               </Card>
             </Link>
          ))}
        </div>
      ) : (
        <Card className="p-10 text-center flex flex-col items-center justify-center">
          <Baby size={48} className="text-slate-300 mb-4" />
          <h3 className="text-xl font-bold text-slate-800 mb-2">No Calves Found</h3>
          <p className="text-slate-500 max-w-md mx-auto">
            {motherId 
              ? 'This cow does not have any calves linked to her yet. You can link a calf to her by editing the calf\'s profile.'
              : 'There are no calves registered on the farm yet.'}
          </p>
        </Card>
      )}
    </div>
  )
}