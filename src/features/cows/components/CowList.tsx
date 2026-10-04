import { useCows } from '../hooks/useCows'
import { CowCard } from '../components/CowCard'

export function CowList() {
  const farmId = 'farm-1' // Replace with real farm from auth context
  const { cows, isLoading } = useCows(farmId)

  if (isLoading) return <p className="p-4">Loading cows...</p>

  return (
    <div className="p-4 pb-20">
      <h1 className="text-2xl font-bold mb-4">Cows ({cows.length})</h1>
      <div className="grid gap-3">
        {cows.map(cow => (
          <CowCard key={cow.id} cow={cow} />
        ))}
      </div>
    </div>
  )
}