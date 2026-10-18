import { supabase } from '../../lib/supabase'
import type { BreedingRecord } from '../../lib/schemas'

function mapBreedingRecord(row: any): BreedingRecord {
  return {
    id: row.id,
    farmId: row.farm_id,
    cowId: row.cow_id,
    aiDate: row.ai_date,
    bullStraw: row.bull_straw || '',
    technician: row.technician || '',
    cost: row.cost ? Number(row.cost) : undefined,
    expectedCalvingDate: row.expected_calving_date || '',
    pregnancyCheckDate: row.pregnancy_check_date || '',
    pregnancyConfirmed: row.pregnancy_confirmed,
    notes: row.notes || undefined,
    createdAt: new Date(row.created_at)
  }
}

export async function getAllBreedingRecords(farmId: string): Promise<BreedingRecord[]> {
  const { data, error } = await supabase
    .from('breeding_records')
    .select('*')
    .eq('farm_id', farmId)
    .order('ai_date', { ascending: false })

  if (error) throw error
  return (data || []).map(mapBreedingRecord)
}

export async function addBreedingRecord(record: BreedingRecord): Promise<void> {
  const { error } = await supabase.from('breeding_records').insert({
    farm_id: record.farmId,
    cow_id: record.cowId,
    ai_date: record.aiDate,
    bull_straw: record.bullStraw,
    technician: record.technician,
    cost: record.cost,
    expected_calving_date: record.expectedCalvingDate || null,
    pregnancy_check_date: record.pregnancyCheckDate || null,
    pregnancy_confirmed: record.pregnancyConfirmed,
    notes: record.notes
  })

  if (error) throw error
}

export async function deleteBreedingRecord(id: string): Promise<void> {
  const { error } = await supabase.from('breeding_records').delete().eq('id', id)
  if (error) throw error
}