import { db } from '../../lib/db'
import type { Cow } from '../../lib/schemas'

export async function getAllCows(farmId: string): Promise<Cow[]> {
  return db.cows.where('farmId').equals(farmId).toArray()
}

export async function getCow(id: string): Promise<Cow | undefined> {
  return db.cows.get(id)
}

export async function addCow(cow: Cow): Promise<string> {
  return db.cows.add(cow)
}

export async function updateCow(id: string, changes: Partial<Cow>): Promise<void> {
  await db.cows.update(id, { ...changes, updatedAt: new Date() })
}

export async function deleteCow(id: string): Promise<void> {
  await db.cows.delete(id)
}

export async function searchCows(farmId: string, query: string): Promise<Cow[]> {
  return db.cows
    .where('farmId').equals(farmId)
    .filter(c => c.tagId.toLowerCase().includes(query.toLowerCase()) ||
                 (c.name?.toLowerCase().includes(query.toLowerCase()) ?? false))
    .toArray()
}