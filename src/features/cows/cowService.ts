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
    motherId: row.mother_id || undefined,
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

export async function updateCow(id: string, changes: Partial<Cow>): Promise<void> {
  const updates: any = {}
  
  if (changes.tagId !== undefined) updates.tag_id = changes.tagId
  if (changes.name !== undefined) updates.name = changes.name
  if (changes.breed !== undefined) updates.breed = changes.breed
  if (changes.birthDate !== undefined) updates.birth_date = changes.birthDate
  if (changes.lactationNumber !== undefined) updates.lactation_number = changes.lactationNumber
  if (changes.status !== undefined) updates.status = changes.status
  if (changes.pregnancyStatus !== undefined) updates.pregnancy_status = changes.pregnancyStatus
  if (changes.notes !== undefined) updates.notes = changes.notes
  
  // These are the new fields we added
  if (changes.lastCalvedDate !== undefined) updates.last_calved_date = changes.lastCalvedDate
  if (changes.calfDetails !== undefined) updates.calf_details = changes.calfDetails
  if (changes.weight !== undefined) updates.weight = changes.weight
  if (changes.bcs !== undefined) updates.bcs = changes.bcs
  if (changes.motherId !== undefined) updates.mother_id = changes.motherId

  updates.updated_at = new Date().toISOString()

  const { error } = await supabase.from('cows').update(updates).eq('id', id)
  if (error) throw error
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
    notes: cow.notes,
    mother_id: cow.motherId
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
export async function uploadCowPhoto(file: File, cowId: string): Promise<string> {
  const fileExt = file.name.split('.').pop()
  const fileName = `${cowId}-${Date.now()}.${fileExt}`
  
  // 1. Upload to Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from('cow-photos')
    .upload(fileName, file, { upsert: true })

  if (uploadError) throw uploadError

  // 2. Get the public URL
  const { data } = supabase.storage.from('cow-photos').getPublicUrl(fileName)
  
  // 3. Save URL to the cows table
  const { error: updateError } = await supabase
    .from('cows')
    .update({ photo_url: data.publicUrl })
    .eq('id', cowId)

  if (updateError) throw updateError
  
  return data.publicUrl
}