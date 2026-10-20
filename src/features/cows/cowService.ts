import { supabase } from '../../lib/supabase'
import type { Cow } from '../../lib/schemas'

// Helper to convert Supabase snake_case to React camelCase
function mapCow(row: any): Cow {
  return {
    id: row.id,
    farmId: row.farm_id,
    tagId: row.tag_id,
    name: row.name ?? undefined,
    breed: row.breed,
    birthDate: row.birth_date ?? '',
    lactationNumber: row.lactation_number,
    status: row.status,
    pregnancyStatus: row.pregnancy_status,
    notes: row.notes ?? undefined,
    photo: row.photo_url ?? undefined,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at)
  }
}

export async function getAllCows(farmId: string): Promise<Cow[]> {
  const { data, error } = await supabase
    .from('cows')
    .select('*')
    .eq('farm_id', farmId)
    .order('tag_id')

  if (error) throw error
  return (data || []).map(mapCow)
}

export async function addCow(cow: Cow): Promise<void> {
  const { error } = await supabase.from('cows').insert({
    farm_id: cow.farmId,
    tag_id: cow.tagId,
    name: cow.name,
    breed: cow.breed,
    birth_date: cow.birthDate,
    lactation_number: cow.lactationNumber,
    status: cow.status,
    pregnancy_status: cow.pregnancyStatus,
    notes: cow.notes
  })

  if (error) throw error
}

export async function deleteCow(id: string): Promise<void> {
  const { error } = await supabase.from('cows').delete().eq('id', id)
  if (error) throw error
}
export async function getCow(id: string): Promise<Cow | null> {
  const { data, error } = await supabase.from('cows').select('*').eq('id', id).single()
  if (error) return null
  return mapCow(data)
}