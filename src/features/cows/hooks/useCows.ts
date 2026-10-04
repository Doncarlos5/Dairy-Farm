import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../../lib/db'

export function useCows(farmId: string) {
  const cows = useLiveQuery(
    () => db.cows.where('farmId').equals(farmId).toArray(),
    [farmId]
  )
  return { cows: cows ?? [], isLoading: cows === undefined }
}